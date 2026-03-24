import { WorkflowNode, WorkflowEdge, OutputType } from './types';

/**
 * Validates that the workflow is a DAG (Directed Acyclic Graph).
 */
export function validateDAG(nodes: WorkflowNode[], edges: WorkflowEdge[]): { isValid: boolean; error?: string } {
  if (nodes.length === 0) {
    return { isValid: false, error: 'Workflow has no nodes' };
  }

  const adjacencyList = new Map<string, string[]>();

  nodes.forEach(node => {
    adjacencyList.set(node.id, []);
  });

  edges.forEach(edge => {
    const neighbors = adjacencyList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacencyList.set(edge.source, neighbors);
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const nodeId of adjacencyList.keys()) {
    if (!visited.has(nodeId)) {
      if (hasCycle(nodeId)) {
        return { isValid: false, error: 'Workflow contains cycles. DAG structure required.' };
      }
    }
  }

  return { isValid: true };
}

/**
 * Topological sort using Kahn's algorithm.
 * Returns node IDs in execution order.
 */
export function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach(node => {
    adjacencyList.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  edges.forEach(edge => {
    // Only consider edges between nodes in our set
    if (!adjacencyList.has(edge.source) || !adjacencyList.has(edge.target)) return;
    
    const neighbors = adjacencyList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacencyList.set(edge.source, neighbors);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  const sorted: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    sorted.push(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    neighbors.forEach(neighbor => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  return sorted;
}

/**
 * Get all direct dependencies (upstream nodes) of a given node.
 */
export function getDependencies(nodeId: string, edges: WorkflowEdge[]): string[] {
  return edges
    .filter(edge => edge.target === nodeId)
    .map(edge => edge.source);
}

/**
 * Get a map of connected input handles → source node IDs for a given node.
 */
export function getConnectedInputs(nodeId: string, edges: WorkflowEdge[]): Map<string, string> {
  const connections = new Map<string, string>();
  edges
    .filter(edge => edge.target === nodeId)
    .forEach(edge => {
      connections.set(edge.targetHandle || 'default', edge.source);
    });
  return connections;
}

/**
 * Validate a connection between two nodes.
 * Returns whether the connection is type-safe.
 */
export function isConnectionValid(
  sourceNode: WorkflowNode,
  targetNode: WorkflowNode,
  targetHandle?: string
): boolean {
  const sourceOutputType = sourceNode.data.outputType;
  const handle = targetHandle || 'default';

  // Determine what type the target handle accepts
  let acceptedType: OutputType;

  switch (targetNode.data.type) {
    case 'llm':
      if (handle === 'text-input') acceptedType = 'text';
      else if (handle === 'image-input') acceptedType = 'image';
      else acceptedType = sourceOutputType; // default handle is flexible
      break;
    case 'crop-image':
      acceptedType = 'image';
      break;
    case 'extract-frame':
      acceptedType = 'video';
      break;
    case 'text':
      acceptedType = 'text';
      break;
    case 'upload-image':
      acceptedType = 'image';
      break;
    case 'upload-video':
      acceptedType = 'video';
      break;
    default:
      acceptedType = sourceOutputType;
  }

  return sourceOutputType === acceptedType;
}

/**
 * Get the execution-ready levels of nodes (nodes at each level can run in parallel).
 */
export function getExecutionLevels(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[][] {
  const sorted = topologicalSort(nodes, edges);
  const levels: string[][] = [];
  const nodeLevel = new Map<string, number>();

  sorted.forEach(nodeId => {
    const deps = getDependencies(nodeId, edges);
    const maxDepLevel = deps.reduce((max, depId) => {
      return Math.max(max, nodeLevel.get(depId) || 0);
    }, -1);

    const level = maxDepLevel + 1;
    nodeLevel.set(nodeId, level);

    while (levels.length <= level) {
      levels.push([]);
    }
    levels[level].push(nodeId);
  });

  return levels;
}
