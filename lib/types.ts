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
  user_id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  created_at: string;
  updated_at: string;
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
  workflow_id: string;
  user_id: string;
  status: ExecutionStatus;
  scope: ExecutionScope;
  duration_ms?: number;
  node_results: Record<string, NodeExecutionResult>;
  startedAt: string;
  completed_at?: string;
  error_message?: string;
}
