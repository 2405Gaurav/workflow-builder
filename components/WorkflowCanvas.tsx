'use client';

import { useCallback, useRef, DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionMode,
  useReactFlow,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

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
} as const satisfies Record<string, any>;

/** 
 * Krea-style Edge Configuration
 * Uses the signature yellow color and smooth bezier curves
 */
const defaultEdgeOptions = {
  animated: false,
  type: 'default',
  style: {
    stroke: '#facc15', // Krea Yellow (Tailwind yellow-400)
    strokeWidth: 2,
    opacity: 0.9,
  },
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

  // --- LOGIC PRESERVED EXACTLY ---
  const isValidConnection = useCallback((connection: any) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    if (!sourceNode || !targetNode) return false;
    if (connection.source === connection.target) return false;
    const sourceOutput = sourceNode.data.outputType;
    const targetHandle = connection.targetHandle || 'default';
    let acceptedType: string = targetNode.data.outputType;
    if (targetNode.data.type === 'llm') {
      if (targetHandle === 'text-input') acceptedType = 'text';
      else if (targetHandle === 'image-input') acceptedType = 'image';
      else return true;
    }
    if (targetNode.data.type === 'crop-image') acceptedType = 'image';
    if (targetNode.data.type === 'extract-frame') acceptedType = 'video';
    return sourceOutput === acceptedType;
  }, [nodes]);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow-type') as NodeDataType;
    const outputType = event.dataTransfer.getData('application/reactflow-output') as 'text' | 'image' | 'video';
    if (!type) return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const id = `${type}-${Date.now()}`;
    const baseData = { label: type, type, outputType, status: 'idle' as const };
    let data: any = baseData;
    switch (type) {
      case 'text': data = { ...baseData, text: '' }; break;
      case 'upload-image': data = { ...baseData }; break;
      case 'upload-video': data = { ...baseData }; break;
      case 'llm': data = { ...baseData, model: 'gemini-1.5-flash', userMessage: '' }; break;
      case 'crop-image': data = { ...baseData, x: 0, y: 0, width: 100, height: 100 }; break;
      case 'extract-frame': data = { ...baseData, timestamp: 0 }; break;
    }
    const newNode: WorkflowNode = { id, type, position, data };
    addNode(newNode);
  }, [screenToFlowPosition, addNode]);
  // --- END LOGIC PRESERVATION ---

  return (
    <div ref={reactFlowWrapper} className="w-full h-full bg-[#080808]"> {/* Krea deep black */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        isValidConnection={isValidConnection}
        fitView
        // UI Enhancements
        connectionLineType={ConnectionLineType.Bezier}
        connectionLineStyle={{ stroke: '#facc15', strokeWidth: 2 }}
        defaultEdgeOptions={defaultEdgeOptions}
        className="krea-theme"
        proOptions={{ hideAttribution: true }}
        snapToGrid
        snapGrid={[20, 20]}
      >
        {/* Subtler background dots to match Krea */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={30}
          size={1}
          color="rgba(255, 255, 255, 0.04)"
        />
        
        {/* Minimalist Control Styling */}
        <Controls
          className="!bg-[#1a1a1a] !border-white/10 !rounded-lg !shadow-2xl !fill-white"
          showInteractive={false}
        />

        {/* Clean, dark MiniMap */}
        <MiniMap
          nodeStrokeWidth={0}
          maskColor="rgba(0, 0, 0, 0.8)"
          style={{
            backgroundColor: '#0a0a0a',
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
          nodeColor={(node) => {
            // Colors chosen to be muted but recognizable on the map
            switch (node.data.type) {
              case 'llm': return '#22c55e'; // Green
              case 'text': return '#3b82f6'; // Blue
              default: return '#333333';
            }
          }}
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Custom CSS for global styles if needed */}
      <style jsx global>{`
        .react-flow__edge-path {
          filter: drop-shadow(0 0 2px rgba(250, 204, 21, 0.1));
        }
        .react-flow__handle {
          width: 8px !important;
          height: 8px !important;
          background: #facc15 !important;
          border: 2px solid #080808 !important;
        }
        .react-flow__node {
          cursor: grab;
        }
        .react-flow__node:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  );
}