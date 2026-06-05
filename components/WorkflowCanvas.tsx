'use client';
// 1. Rendering the DAG canvas
// 2. Managing node/edge interactions
// 3. Handling drag-drop
// 4. Validating graph connections
// 5. Managing viewport controls
// 6. Connecting React Flow with Zustand
// 7. Providing execution-ready graph state


import { useCallback, useRef, useState, DragEvent } from 'react';
//usecallback -> Prevents unnecessary recreation during rerenders.and its Critical because ReactFlow rerenders frequently.
//useref -> used to store DOM reference and it Reference to canvas container DOM.
//dragevent-> TypeScript type for drag/drop events.
import {
  ReactFlow,
  Background,
  ConnectionMode,
  useReactFlow,
  useViewport,
  ConnectionLineType,   //Temporary line shown while dragging connection.
  Panel,
  MiniMap,
} from '@xyflow/react';
// This library is your graph rendering engine.
// xyflow: Node-Based UIs for React and Svelte
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';//animate presence used for exit animation when a element is removed from teh react
import { 
  ZoomIn, ZoomOut, Maximize2, Lock, Unlock, 
  RotateCcw 
} from 'lucide-react';

import { useWorkflowStore } from '@/lib/store';
import { TextNode } from './nodes/TextNode';
import { UploadImageNode } from './nodes/UploadImageNode';
import { UploadVideoNode } from './nodes/UploadVideoNode';
import { LLMNode } from './nodes/LLMNode';
import { CropImageNode } from './nodes/CropImageNode';
import { ExtractFrameNode } from './nodes/ExtractFrameNode';
import { NodeDataType, WorkflowNode } from '@/lib/types';

const nodeTypes = {
  'text': TextNode,
  'upload-image': UploadImageNode,
  'upload-video': UploadVideoNode,
  'llm': LLMNode,
  'crop-image': CropImageNode,
  'extract-frame': ExtractFrameNode,
};//mapps the node to the actual react component ,the reactflow sees nodetypes['llm'] and renders the <LLMNode />

const defaultEdgeOptions = {
  type: 'default', 
  animated: true,
  style: {
    stroke: 'rgba(255, 255, 255, 0.15)',
    strokeWidth: 2,
  },
};

const connectionLineStyle = {
  stroke: 'rgba(255, 255, 255, 0.4)',
  strokeWidth: 2,
  strokeDasharray: '6,4',
};

export function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);//Stores actual canvas DOM element.
  const { screenToFlowPosition, fitView, zoomIn, zoomOut, setViewport } = useReactFlow();//This gives imperative control over canvas.
  //screenToFlowPosition -> Converts mouse screen coordinates into graph coordinates.
  // fitView -> Auto centers all nodes.
  const { zoom } = useViewport();
  const [isLocked, setIsLocked] = useState(false);
  // Tooltip state for edge hover — tracks position + visibility
  const [edgeTooltip, setEdgeTooltip] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0, y: 0, visible: false,
  });
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
  } = useWorkflowStore();

  // connection guard so you cant wire up random stuff and then wonder why it broke later
  const isValidConnection = useCallback((connection: any) => {
    // React will reuse the same function instance between renders unless dependencies change.
    const source = nodes.find(n => n.id === connection.source);
    const target = nodes.find(n => n.id === connection.target);
    if (!source || !target || source.id === target.id) return false;

    const sourceOutput = source.data.outputType;
    const targetHandle = connection.targetHandle || ''; 
    
    // quick check on handle intent
    if (targetHandle.includes('image') && sourceOutput !== 'image') return false;
    if (targetHandle.includes('video') && sourceOutput !== 'video') return false;
    if (targetHandle.includes('text') && sourceOutput !== 'text') return false;

    return true;
  }, [nodes]);

  // drag drop nodes onto the canvas, pretty standard reactflow thing
  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow-type') as NodeDataType;
    const outputType = event.dataTransfer.getData('application/reactflow-output') as any;
    if (!type) return;

    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const id = `${type}-${Date.now()}`;
    const data = { label: type, type, outputType, status: 'idle' as const };
    
    addNode({ id, type, position, data } as WorkflowNode);
  }, [screenToFlowPosition, addNode]);

  // fit view handler — centers and scales to show all nodes with some padding
  const handleFitView = useCallback(() => {
    fitView({ padding: 0.3, duration: 600 });
  }, [fitView]);

  // zoom handlers with smooth animation
  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 300 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 300 });
  }, [zoomOut]);

  // reset viewport to default center position
  const handleResetView = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 500 });
  }, [setViewport]);

  // toggle lock - prevents panning and zooming when locked
  const handleToggleLock = useCallback(() => {
    setIsLocked(prev => !prev);
  }, []);

  // BUG-01: Double-click an edge to remove it.
  // Why onEdgeDoubleClick instead of a context menu or delete key?
  //  - Edges are thin and hard to select, so a right-click menu adds friction.
  //  - Double-click is fast, discoverable, and doesn't need a confirmation
  //    dialog because re-connecting is trivial (just drag a new wire).
  // We reuse the existing onEdgesChange action with a "remove" change so
  // the deletion flows through the same pipeline as keyboard deletes.
  const handleEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: { id: string }) => {
      onEdgesChange([{ id: edge.id, type: 'remove' }]);
      // persist to history so ctrl-z can undo the removal
      useWorkflowStore.getState().saveToHistory();
      // hide tooltip immediately after removing the edge
      setEdgeTooltip(prev => ({ ...prev, visible: false }));
    },
    [onEdgesChange]
  );

  // Show tooltip when mouse enters an edge
  const handleEdgeMouseEnter = useCallback((_event: React.MouseEvent) => {
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (!rect) return;
    setEdgeTooltip({
      x: _event.clientX - rect.left,
      y: _event.clientY - rect.top,
      visible: true,
    });
  }, []);

  // Track mouse so tooltip follows cursor across the edge
  const handleEdgeMouseMove = useCallback((_event: React.MouseEvent) => {
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (!rect) return;
    setEdgeTooltip({
      x: _event.clientX - rect.left,
      y: _event.clientY - rect.top,
      visible: true,
    });
  }, []);

  // Hide tooltip when mouse leaves the edge
  const handleEdgeMouseLeave = useCallback(() => {
    setEdgeTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full bg-[#050505] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeDoubleClick={handleEdgeDoubleClick}
        onEdgeMouseEnter={handleEdgeMouseEnter}
        onEdgeMouseMove={handleEdgeMouseMove}
        onEdgeMouseLeave={handleEdgeMouseLeave}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        isValidConnection={isValidConnection}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.Bezier} 
        connectionLineStyle={connectionLineStyle}
        fitView
        snapToGrid
        snapGrid={[12, 12]}
        proOptions={{ hideAttribution: true }}
        panOnDrag={!isLocked}
        zoomOnScroll={!isLocked}
        zoomOnPinch={!isLocked}
        zoomOnDoubleClick={false}
        nodesDraggable={!isLocked}
      >
        <Background
          variant={"dots" as any}
          gap={24}
          size={1}
          color="rgba(255, 255, 255, 0.07)"
        />

        {/* minimap stays pinned so you dont loose ur place */}
        <MiniMap 
          className="!bg-[#080808]/80 backdrop-blur-xl !rounded-2xl border border-white/5 shadow-2xl transition-all duration-300"
          style={{ 
            right: 260, 
            bottom: 24, 
            width: 180, 
            height: 110,
            zIndex: 40 
          }}
          nodeColor={(n) => {
            if (n.data.status === 'running') return '#3b82f6';
            if (n.data.type === 'llm') return '#a855f7';
            return 'rgba(255, 255, 255, 0.1)';
          }}
          nodeStrokeColor="rgba(255, 255, 255, 0.05)"
          nodeStrokeWidth={3}
          maskColor="rgba(0, 0, 0, 0.8)"
          position="bottom-right"
        />

        {/* Canvas Controls Toolbar — bottom center */}
        <Panel position="bottom-center" className="mb-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-0.5 p-1.5 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]"
          >
            {/* Fit View — the star of the show */}
            <CanvasButton 
              icon={Maximize2} 
              onClick={handleFitView}
              tooltip="Fit to view"
              accent
            />

            <div className="w-px h-5 bg-white/[0.06] mx-1" />

            {/* Zoom controls */}
            <CanvasButton 
              icon={ZoomOut} 
              onClick={handleZoomOut}
              tooltip="Zoom out"
            />
            
            {/* Zoom level display */}
            <button
              onClick={handleResetView}
              className="min-w-[48px] h-8 px-2 rounded-lg text-[10px] font-bold text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all mono tracking-tight"
              title="Reset to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>

            <CanvasButton 
              icon={ZoomIn} 
              onClick={handleZoomIn}
              tooltip="Zoom in"
            />

            <div className="w-px h-5 bg-white/[0.06] mx-1" />

            {/* Reset view */}
            <CanvasButton 
              icon={RotateCcw} 
              onClick={handleResetView}
              tooltip="Reset viewport"
            />

            {/* Lock/unlock interaction */}
            <CanvasButton 
              icon={isLocked ? Lock : Unlock} 
              onClick={handleToggleLock}
              tooltip={isLocked ? 'Unlock canvas' : 'Lock canvas'}
              active={isLocked}
              danger={isLocked}
            />
          </motion.div>
        </Panel>

        {/* Lock indicator overlay */}
        <AnimatePresence>
          {isLocked && (
            <Panel position="top-center" className="mt-20">
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full"
              >
                <Lock size={10} className="text-amber-400" />
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Canvas Locked</span>
              </motion.div>
            </Panel>
          )}
        </AnimatePresence>
      </ReactFlow>

      {/* Edge hover tooltip — positioned relative to the canvas wrapper */}
      <AnimatePresence>
        {edgeTooltip.visible && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute pointer-events-none z-50 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a]/95 backdrop-blur-sm border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            style={{
              left: edgeTooltip.x + 12,
              top: edgeTooltip.y - 32,
            }}
          >
            <span className="text-[10px] font-medium text-white/70 whitespace-nowrap">
              Double-click to remove
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        /* HANDLES */
        .react-flow__handle {
          width: 12px !important;
          height: 12px !important;
          background: #ffffff !important;
          border: 3px solid #050505 !important;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.1);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        }
        .react-flow__handle:hover {
          transform: scale(1.4);
          background: #3b82f6 !important;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
        }

        /* STRING LINES */
        .react-flow__edge-path {
          stroke-dasharray: 8;
          stroke-dashoffset: 16;
          animation: flow 1.2s linear infinite;
        }

        /* BUG-01: visual hint that edges are interactive (double-click to remove) */
        .react-flow__edge {
          cursor: pointer;
        }
        .react-flow__edge:hover .react-flow__edge-path {
          stroke: rgba(239, 68, 68, 0.5);
          filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.3));
          transition: stroke 0.15s ease, filter 0.15s ease;
        }

        @keyframes flow {
          from { stroke-dashoffset: 16; }
          to { stroke-dashoffset: 0; }
        }

        /* PREMIUM RUNNING PULSE */
        .node-running-css {
          position: relative;
        }
        .node-running-css::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          padding: 2px;
          background: linear-gradient(90deg, #3b82f6, #6366f1, #3b82f6);
          background-size: 200% 100%;
          animation: border-flow 2s linear infinite;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: destination-out;
          mask-composite: exclude;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
        }

        @keyframes border-flow {
          0% { background-position: 0% 50%; opacity: 0.5; }
          50% { opacity: 1; }
          100% { background-position: 200% 50%; opacity: 0.5; }
        }

        .react-flow__minimap-viewport {
          fill: rgba(59, 130, 246, 0.05) !important;
          stroke: rgba(59, 130, 246, 0.4) !important;
          stroke-width: 2px !important;
        }
      `}</style>
    </div>
  );
}

// Reusable canvas toolbar button with hover/active states and optional accent coloring
function CanvasButton({ 
  icon: Icon, 
  onClick, 
  tooltip, 
  active = false,
  accent = false,
  danger = false,
}: { 
  icon: any; 
  onClick: () => void; 
  tooltip: string;
  active?: boolean;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={tooltip}
      className={`
        w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200
        ${accent 
          ? 'text-white/60 hover:text-white hover:bg-white/10 hover:shadow-[0_0_12px_rgba(255,255,255,0.06)]' 
          : danger && active
          ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/15'
          : active 
          ? 'text-white bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]' 
          : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'}
      `}
    >
      <Icon size={15} strokeWidth={active || accent ? 2.2 : 1.8} />
    </motion.button>
  );
}