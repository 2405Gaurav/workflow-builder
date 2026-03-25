'use client';

import { useCallback, useRef, DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  ConnectionMode,
  useReactFlow,
  ConnectionLineType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { Plus, MousePointer2, Hand, Scissors, Link2 } from 'lucide-react';

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
};

// 1. PREMIUM STRING-LIKE EDGE CONFIG
const defaultEdgeOptions = {
  type: 'default', // Default is Bezier, which feels like "Strings"
  animated: true,
  style: {
    stroke: 'rgba(255, 255, 255, 0.15)',
    strokeWidth: 2,
  },
};

const connectionLineStyle = {
  stroke: 'rgba(255, 255, 255, 0.4)',
  strokeWidth: 2,
  strokeDasharray: '6,4', // Dotted string look while dragging
};

export function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
  } = useWorkflowStore();

  const isValidConnection = useCallback((connection: any) => {
    const source = nodes.find(n => n.id === connection.source);
    const target = nodes.find(n => n.id === connection.target);
    if (!source || !target || source.id === target.id) return false;
    const sourceOutput = source.data.outputType;
    const targetHandle = connection.targetHandle || ''; 
    if (targetHandle.includes('image') && sourceOutput !== 'image') return false;
    if (targetHandle.includes('video') && sourceOutput !== 'video') return false;
    if (targetHandle.includes('text') && sourceOutput !== 'text') return false;
    return true;
  }, [nodes]);

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

  return (
    <div ref={reactFlowWrapper} className="w-full h-full bg-[#050505] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        isValidConnection={isValidConnection}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={defaultEdgeOptions}
        // Change to Bezier for that "Dynamic String" look
        connectionLineType={ConnectionLineType.Bezier} 
        connectionLineStyle={connectionLineStyle}
        fitView
        snapToGrid
        snapGrid={[12, 12]} // Tighter grid for more precise organic movement
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={"dots" as any}
          gap={24}
          size={1}
          color="rgba(255, 255, 255, 0.07)"
        />

        <Panel position="bottom-center" className="mb-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-1 p-1.5 bg-[#111]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl"
          >
            <IconButton icon={Plus} />
            <div className="w-px h-4 bg-white/10 mx-1" />
            <IconButton icon={MousePointer2} active />
            <IconButton icon={Hand} />
            <IconButton icon={Scissors} />
            <IconButton icon={Link2} />
          </motion.div>
        </Panel>
      </ReactFlow>

      <style jsx global>{`
        /* 1. LARGE PREMIUM HANDLES */
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

        /* 2. DYNAMIC STRING LINES (Marching Ants) */
        .react-flow__edge-path {
          stroke-dasharray: 8;
          stroke-dashoffset: 16;
          animation: flow 1.2s linear infinite;
        }

        @keyframes flow {
          from { stroke-dashoffset: 16; }
          to { stroke-dashoffset: 0; }
        }

        /* 3. PREMIUM NODE PULSE (High Intensity but Smooth) */
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

        /* Running Handle Pulse */
        .react-flow__handle-connecting {
            background: #3b82f6 !important;
            animation: handle-pulse 1s infinite alternate;
        }
        @keyframes handle-pulse {
            from { transform: scale(1); box-shadow: 0 0 0px rgba(59,130,246,0); }
            to { transform: scale(1.3); box-shadow: 0 0 10px rgba(59,130,246,0.5); }
        }
      `}</style>
    </div>
  );
}

function IconButton({ icon: Icon, active = false }: { icon: any, active?: boolean }) {
  return (
    <button className={`p-2.5 rounded-xl transition-all hover:bg-white/5 ${active ? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]' : 'text-white/30'}`}>
      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
    </button>
  );
}