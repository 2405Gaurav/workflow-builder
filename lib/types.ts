import { Node, Edge } from '@xyflow/react';

export type NodeDataType =
  | 'text'
  | 'upload-image'
  | 'upload-video'
  | 'llm'
  | 'crop-image'
  | 'extract-frame';

export type OutputType = 'text' | 'image' | 'video';

export interface BaseNodeData {
  [key: string]: unknown;
  label: string;
  type: NodeDataType;
  outputType: OutputType;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  status?: 'idle' | 'running' | 'success' | 'error';
  error?: string;
  executionTime?: number;
}

export interface TextNodeData extends BaseNodeData {
  type: 'text';
  outputType: 'text';
  text: string;
}

export interface UploadImageNodeData extends BaseNodeData {
  type: 'upload-image';
  outputType: 'image';
  imageUrl?: string;
  imagePreview?: string;
}

export interface UploadVideoNodeData extends BaseNodeData {
  type: 'upload-video';
  outputType: 'video';
  videoUrl?: string;
  videoPreview?: string;
}

export interface LLMNodeData extends BaseNodeData {
  type: 'llm';
  outputType: 'text';
  model: string;
  systemPrompt?: string;
  userMessage: string;
  images?: string[];
  result?: string;
}

export interface CropImageNodeData extends BaseNodeData {
  type: 'crop-image';
  outputType: 'image';
  imageUrl?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  croppedImageUrl?: string;
}

export interface ExtractFrameNodeData extends BaseNodeData {
  type: 'extract-frame';
  outputType: 'image';
  videoUrl?: string;
  timestamp: number;
  percentage?: number;
  timestampMode?: 'seconds' | 'percentage';
  extractedFrameUrl?: string;
}

export type WorkflowNodeData =
  | TextNodeData
  | UploadImageNodeData
  | UploadVideoNodeData
  | LLMNodeData
  | CropImageNodeData
  | ExtractFrameNodeData;

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description: string;
  nodes: any[]; // Or your ReactFlow node type
  edges: any[];
  createdAt: string;
  updatedAt: string;
}

export type ExecutionScope = 'full' | 'partial' | 'single';
export type ExecutionStatus = 'running' | 'success' | 'failed';

export interface NodeExecutionResult {
  nodeId: string;
  status: ExecutionStatus;
  outputs?: Record<string, any>;
  error?: string;
  executionTime: number;
  startedAt: string;
  completedAt?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string | null;
  userId: string;
  status: 'running' | 'success' | 'failed';
  scope: 'full' | 'partial' | 'single';
  durationMs: number | null;      // Matches Prisma camelCase
  nodeResults: Record<string, any>; // Matches Prisma camelCase
  startedAt: string;              // Matches Prisma camelCase
  completedAt: string | null;     // Matches Prisma camelCase
  errorMessage: string | null;    // Matches Prisma camelCase
}
