import { WorkflowNode, WorkflowEdge, NodeExecutionResult, ExecutionScope } from './types';
import { validateDAG, topologicalSort, getDependencies, getConnectedInputs } from './validation';

type StatusCallback = (nodeId: string, status: NodeExecutionResult['status'], data?: Record<string, any>) => void;

export class ExecutionEngine {
  private nodes: WorkflowNode[];
  private edges: WorkflowEdge[];
  private results: Map<string, any> = new Map();
  private nodeResults: Record<string, NodeExecutionResult> = {};
  private onStatusChange?: StatusCallback;

  constructor(nodes: WorkflowNode[], edges: WorkflowEdge[], onStatusChange?: StatusCallback) {
    this.nodes = nodes;
    this.edges = edges;
    this.onStatusChange = onStatusChange;
  }

  async execute(scope: ExecutionScope, selectedNodeIds?: string[]): Promise<{
    success: boolean;
    results: Record<string, NodeExecutionResult>;
    error?: string;
  }> {
    const validation = validateDAG(this.nodes, this.edges);
    if (!validation.isValid) {
      return {
        success: false,
        results: {},
        error: validation.error,
      };
    }

    let nodesToExecute: WorkflowNode[] = [];

    switch (scope) {
      case 'full':
        nodesToExecute = this.nodes;
        break;
      case 'partial':
        nodesToExecute = this.nodes.filter(n => selectedNodeIds?.includes(n.id));
        break;
      case 'single':
        if (selectedNodeIds && selectedNodeIds.length === 1) {
          nodesToExecute = this.nodes.filter(n => n.id === selectedNodeIds[0]);
        }
        break;
    }

    if (nodesToExecute.length === 0) {
      return {
        success: false,
        results: {},
        error: 'No nodes to execute',
      };
    }

    try {
      // Build dependency graph for parallel execution
      const filteredEdges = this.edges.filter(
        e => nodesToExecute.some(n => n.id === e.source) && nodesToExecute.some(n => n.id === e.target)
      );
      
      await this.executeParallel(nodesToExecute, filteredEdges);

      return {
        success: true,
        results: this.nodeResults,
      };
    } catch (error) {
      return {
        success: false,
        results: this.nodeResults,
        error: error instanceof Error ? error.message : 'Execution failed',
      };
    }
  }

  /**
   * Parallel execution using Kahn's algorithm.
   * Nodes with 0 in-degree run simultaneously.
   * When a node completes, we decrement in-degrees and launch newly ready nodes.
   */
  private async executeParallel(nodes: WorkflowNode[], edges: WorkflowEdge[]): Promise<void> {
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();
    const nodeMap = new Map<string, WorkflowNode>();

    nodes.forEach(node => {
      inDegree.set(node.id, 0);
      adjacencyList.set(node.id, []);
      nodeMap.set(node.id, node);
    });

    edges.forEach(edge => {
      const neighbors = adjacencyList.get(edge.source) || [];
      neighbors.push(edge.target);
      adjacencyList.set(edge.source, neighbors);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    const completed = new Set<string>();
    const inProgress = new Set<string>();
    let hasError = false;
    let errorMessage = '';

    const tryLaunchReady = (): string[] => {
      const ready: string[] = [];
      for (const [nodeId, degree] of inDegree.entries()) {
        if (degree === 0 && !completed.has(nodeId) && !inProgress.has(nodeId)) {
          ready.push(nodeId);
        }
      }
      return ready;
    };

    const executeNode = async (nodeId: string): Promise<void> => {
      const node = nodeMap.get(nodeId);
      if (!node) return;

      inProgress.add(nodeId);
      const startTime = Date.now();

      this.onStatusChange?.(nodeId, 'running');

      try {
        const inputs = this.gatherInputs(nodeId);
        const output = await this.runNode(node, inputs);

        this.results.set(nodeId, output);

        this.nodeResults[nodeId] = {
          nodeId,
          status: 'success',
          outputs: output,
          executionTime: Date.now() - startTime,
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
        };

        this.onStatusChange?.(nodeId, 'success', output);
      } catch (error) {
        this.nodeResults[nodeId] = {
          nodeId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime: Date.now() - startTime,
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
        };

        this.onStatusChange?.(nodeId, 'failed');
        hasError = true;
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw error;
      } finally {
        inProgress.delete(nodeId);
        completed.add(nodeId);

        // Decrement in-degree of downstream nodes
        const neighbors = adjacencyList.get(nodeId) || [];
        for (const neighbor of neighbors) {
          const currentDegree = inDegree.get(neighbor) || 0;
          inDegree.set(neighbor, currentDegree - 1);
        }
      }
    };

    // Main execution loop
    while (completed.size < nodes.length) {
      if (hasError) {
        throw new Error(errorMessage);
      }

      const readyNodes = tryLaunchReady();

      if (readyNodes.length === 0 && inProgress.size === 0) {
        break; // No more nodes to execute
      }

      if (readyNodes.length === 0) {
        // Wait for in-progress nodes to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      // Run all ready nodes in parallel
      await Promise.all(readyNodes.map(nodeId => executeNode(nodeId)));
    }
  }

  private gatherInputs(nodeId: string): Record<string, any> {
    const connections = getConnectedInputs(nodeId, this.edges);
    const inputs: Record<string, any> = {};

    connections.forEach((sourceNodeId, handle) => {
      const sourceOutput = this.results.get(sourceNodeId);
      if (sourceOutput) {
        inputs[handle] = sourceOutput;
      }
    });

    return inputs;
  }

  private async runNode(node: WorkflowNode, inputs: Record<string, any>): Promise<any> {
    switch (node.data.type) {
      case 'text':
        return { text: node.data.text };

      case 'upload-image':
        return { imageUrl: node.data.imageUrl };

      case 'upload-video':
        return { videoUrl: node.data.videoUrl };

      case 'llm': {
        // Gather text from connected text inputs
        let finalMessage = node.data.userMessage || '';
        const connectedImages: string[] = [...(node.data.images || [])];

        Object.entries(inputs).forEach(([handle, value]) => {
          if (handle === 'text-input' && value?.text) {
            // Append connected text context
            finalMessage = `${value.text}\n\n${finalMessage}`;
          }
          if (handle === 'image-input' && value?.imageUrl) {
            connectedImages.push(value.imageUrl);
          }
          // Handle default connections
          if (handle === 'default') {
            if (value?.text) {
              finalMessage = `${value.text}\n\n${finalMessage}`;
            }
            if (value?.imageUrl) {
              connectedImages.push(value.imageUrl);
            }
          }
        });

        const response = await fetch('/api/execute/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: node.data.model,
            systemPrompt: node.data.systemPrompt,
            userMessage: finalMessage,
            images: connectedImages,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'LLM execution failed');
        }

        const result = await response.json();
        return { text: result.text };
      }

      case 'crop-image': {
        const imageUrl = inputs['default']?.imageUrl || inputs['image-input']?.imageUrl || node.data.imageUrl;

        if (!imageUrl) {
          throw new Error('No image URL provided for crop operation');
        }

        const response = await fetch('/api/execute/crop-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            x: node.data.x,
            y: node.data.y,
            width: node.data.width,
            height: node.data.height,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'Crop image execution failed');
        }

        const result = await response.json();
        return { imageUrl: result.croppedImageUrl };
      }

      case 'extract-frame': {
        const videoUrl = inputs['default']?.videoUrl || inputs['video-input']?.videoUrl || node.data.videoUrl;

        if (!videoUrl) {
          throw new Error('No video URL provided for frame extraction');
        }

        const response = await fetch('/api/execute/extract-frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl,
            timestamp: node.data.timestamp,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'Extract frame execution failed');
        }

        const result = await response.json();
        return { imageUrl: result.frameUrl };
      }

      default:
        throw new Error(`Unknown node type: ${(node.data as any).type}`);
    }
  }
}
