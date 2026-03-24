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

const defaultEdgeOptions = {
  animated: true,
  style: {
    stroke: 'rgba(124, 58, 237, 0.5)',
    strokeWidth: 2,
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

  const isValidConnection = useCallback((connection: any) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    // Prevent self-connection
    if (connection.source === connection.target) return false;

    const sourceOutput = sourceNode.data.outputType;
    const targetHandle = connection.targetHandle || 'default';

    // Determine accepted input type based on target node + handle
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

  // Handle drag & drop from sidebar
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow-type') as NodeDataType;
    const outputType = event.dataTransfer.getData('application/reactflow-output') as 'text' | 'image' | 'video';

    if (!type) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const id = `${type}-${Date.now()}`;

    const baseData = {
      label: type,
      type,
      outputType,
      status: 'idle' as const,
    };

    let data: any = baseData;

    switch (type) {
      case 'text':
        data = { ...baseData, text: '' };
        break;
      case 'upload-image':
        data = { ...baseData };
        break;
      case 'upload-video':
        data = { ...baseData };
        break;
      case 'llm':
        data = { ...baseData, model: 'gemini-1.5-flash', userMessage: '' };
        break;
      case 'crop-image':
        data = { ...baseData, x: 0, y: 0, width: 100, height: 100 };
        break;
      case 'extract-frame':
        data = { ...baseData, timestamp: 0 };
        break;
    }

    const newNode: WorkflowNode = {
      id,
      type,
      position,
      data,
    };

    addNode(newNode);
  }, [screenToFlowPosition, addNode]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
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
        className="!bg-[#0d0d0d]"
        defaultEdgeOptions={defaultEdgeOptions}
        proOptions={{ hideAttribution: true }}
        snapToGrid
        snapGrid={[16, 16]}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255, 255, 255, 0.06)"
        />
        <Controls
          className="!bg-transparent"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node) => {
            switch (node.data.type) {
              case 'text': return '#3b82f6';
              case 'upload-image': return '#a855f7';
              case 'upload-video': return '#ec4899';
              case 'llm': return '#10b981';
              case 'crop-image': return '#f97316';
              case 'extract-frame': return '#06b6d4';
              default: return '#64748b';
            }
          }}
          nodeStrokeWidth={0}
          maskColor="rgba(0, 0, 0, 0.7)"
          style={{
            backgroundColor: 'rgba(20, 20, 25, 0.9)',
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
