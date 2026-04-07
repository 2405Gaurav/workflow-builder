import { create } from 'zustand';
import { WorkflowNode, WorkflowEdge, WorkflowExecution, Workflow } from './types';
import { addEdge, applyNodeChanges, applyEdgeChanges, Connection, NodeChange, EdgeChange } from '@xyflow/react';

interface WorkflowState {
  // Graph state
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodes: string[];
    executeExtractFrame: (nodeId: string) => Promise<void>;
  
  
  // Workflow metadata
  currentWorkflow: Workflow | null;
  
  // Execution state
  executions: WorkflowExecution[];
  currentExecution: WorkflowExecution | null;
  isExecuting: boolean;
  
  // History for undo/redo
  history: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }[];
  historyIndex: number;

  // Actions
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: WorkflowNode) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNode['data']>) => void;
  deleteNode: (nodeId: string) => void;
  setSelectedNodes: (nodeIds: string[]) => void;
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  setExecutions: (executions: WorkflowExecution[]) => void;
  addExecution: (execution: WorkflowExecution) => void;
  updateExecution: (executionId: string, updates: Partial<WorkflowExecution>) => void;
  setCurrentExecution: (execution: WorkflowExecution | null) => void;
  setIsExecuting: (isExecuting: boolean) => void;
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  clearWorkflow: () => void;
  exportWorkflow: () => void;
importWorkflow: (json: string) => { success: boolean; error?: string };
  
  // Helpers
  getConnectedInputHandles: (nodeId: string) => Set<string>;
  isInputConnected: (nodeId: string, handle: string) => boolean;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodes: [],
  currentWorkflow: null,
  executions: [],
  currentExecution: null,
  isExecuting: false,
  history: [],
  historyIndex: -1,

  setNodes: (nodes) => set({ nodes }),

  setEdges: (edges) => set({ edges }),
  

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes as any) as WorkflowNode[],
    });
    
    // Track selection changes
    const selectionChanges = changes.filter(c => c.type === 'select');
    if (selectionChanges.length > 0) {
      const selectedIds = get().nodes
        .filter(n => n.selected)
        .map(n => n.id);
      set({ selectedNodes: selectedIds });
    }
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  // Add this action to your store
  executeExtractFrame: async (nodeId: string) => {
    const { nodes, edges, updateNodeData } = get();
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.data.type !== 'extract-frame') return;

    // 1. Find the connected video source
    const incomingEdge = edges.find(e => e.target === nodeId);
    const sourceNode = nodes.find(n => n.id === incomingEdge?.source);
    const videoUrl = sourceNode?.data?.videoUrl || sourceNode?.data?.url;

    if (!videoUrl) {
      updateNodeData(nodeId, { status: 'error', error: 'No video source connected' });
      return;
    }

    updateNodeData(nodeId, { status: 'running', error: undefined });

    try {
      // 2. Start the task (returns immediately with runId)
      const response = await fetch('/api/execute/extract-frame', {
        method: 'POST',
        body: JSON.stringify({ videoUrl, timestamp: node.data.timestamp }),
      });
      
      const { runId, error } = await response.json();
      if (error) throw new Error(error);

      // 3. Poll for result (Check every 2 seconds)
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        if (attempts > 30) { // Timeout after 60 seconds
          clearInterval(poll);
          updateNodeData(nodeId, { status: 'error', error: 'Task timed out' });
          return;
        }

        const statusRes = await fetch(`/api/execute/status?runId=${runId}`);
        const result = await statusRes.json();

        if (result.status === 'COMPLETED') {
          clearInterval(poll);
          updateNodeData(nodeId, { 
            status: 'success', 
            extractedFrameUrl: result.output.frameUrl 
          });
        } else if (result.status === 'FAILED') {
          clearInterval(poll);
          updateNodeData(nodeId, { status: 'error', error: 'FFmpeg failed' });
        }
      }, 2000);

    } catch (err: any) {
      updateNodeData(nodeId, { status: 'error', error: err.message });
    }
  },
  exportWorkflow: () => {
  const { nodes, edges } = get();
  const workflow = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    nodes,
    edges,
  };
  const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workflow-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
},

importWorkflow: (json: string) => {
  try {
    const workflow = JSON.parse(json);
    if (!workflow || !Array.isArray(workflow.nodes) || !Array.isArray(workflow.edges)) {
      return { success: false, error: 'Invalid workflow file' };
    }

    // treat imported json like a brand new canvas session (not tied to any saved workflow id)
    // if we don't reset this, "Save" can accidentally overwrite the last opened workflow.
    const normalizedNodes: WorkflowNode[] = (workflow.nodes as any[]).map((n, idx) => {
      const id = String(n?.id ?? `import-node-${idx}-${Date.now()}`);
      const type = n?.type ?? n?.data?.type ?? 'text';
      const position = n?.position && typeof n.position.x === 'number' && typeof n.position.y === 'number'
        ? n.position
        : { x: 200 + idx * 20, y: 200 + idx * 20 };

      const data = {
        ...(n?.data || {}),
        // keep the original outputType if present, otherwise do a best guess so connections validate
        outputType: n?.data?.outputType || n?.data?.output_type || (type === 'upload-video' ? 'video' : type.includes('image') ? 'image' : 'text'),
        status: 'idle',
        error: undefined,
      };

      return {
        ...n,
        id,
        type,
        position,
        data,
        selected: false,
        dragging: false,
      } as WorkflowNode;
    });

    const normalizedEdges: WorkflowEdge[] = (workflow.edges as any[]).map((e, idx) => {
      const id = String(e?.id ?? `import-edge-${idx}-${Date.now()}`);
      return {
        ...e,
        id,
        animated: e?.animated ?? true,
      } as WorkflowEdge;
    });

    // reset history so undo/redo is clean after import
    set({
      nodes: normalizedNodes,
      edges: normalizedEdges,
      selectedNodes: [],
      currentWorkflow: null,
      history: [],
      historyIndex: -1,
    });

    // seed the first history entry so undo doesn't resurrect older sessions
    get().saveToHistory();
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to parse JSON' };
  }
},

  onConnect: (connection) => {
    const { nodes, edges } = get();
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return;

    // Type-safe connection validation
    const sourceOutputType = sourceNode.data.outputType;
    const targetHandle = connection.targetHandle || 'default';
    
    // Determine what type the target handle accepts
    let acceptedType: string = targetNode.data.outputType;
    
    // LLM node has typed handles
    if (targetNode.data.type === 'llm') {
      if (targetHandle === 'text-input') acceptedType = 'text';
      else if (targetHandle === 'image-input') acceptedType = 'image';
      else acceptedType = sourceOutputType; // default accepts anything
    }
    
    // Crop image accepts image input
    if (targetNode.data.type === 'crop-image') {
      acceptedType = 'image';
    }
    
    // Extract frame accepts video input  
    if (targetNode.data.type === 'extract-frame') {
      acceptedType = 'video';
    }

    if (sourceOutputType !== acceptedType) {
      console.warn(`Invalid connection: ${sourceOutputType} → ${acceptedType}`);
      return;
    }

    // Prevent self-connection
    if (connection.source === connection.target) return;

    // Prevent duplicate connections to same handle
    const existingConnection = edges.find(
      e => e.target === connection.target && e.targetHandle === targetHandle
    );
    if (existingConnection) {
      // Replace the existing connection
      const filteredEdges = edges.filter(e => e.id !== existingConnection.id);
      set({
        edges: addEdge(
          { ...connection, animated: true },
          filteredEdges
        ),
      });
    } else {
      set({
        edges: addEdge(
          { ...connection, animated: true },
          edges
        ),
      });
    }
    
    get().saveToHistory();
  },

  addNode: (node) => {
    set({ nodes: [...get().nodes, node] });
    get().saveToHistory();
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } as typeof node.data }
          : node
      ),
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    });
    get().saveToHistory();
  },

  setSelectedNodes: (nodeIds) => set({ selectedNodes: nodeIds }),

  setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),

  setExecutions: (executions) => set({ executions }),

  addExecution: (execution) => {
    set({ executions: [execution, ...get().executions] });
  },

  updateExecution: (executionId, updates) => {
    set({
      executions: get().executions.map((exec) =>
        exec.id === executionId ? { ...exec, ...updates } : exec
      ),
    });
    if (get().currentExecution?.id === executionId) {
      set({
        currentExecution: { ...get().currentExecution!, ...updates },
      });
    }
  },

  setCurrentExecution: (execution) => set({ currentExecution: execution }),

  setIsExecuting: (isExecuting) => set({ isExecuting }),

  saveToHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    // Keep history manageable (max 50 entries)
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      set({
        nodes: JSON.parse(JSON.stringify(prevState.nodes)),
        edges: JSON.parse(JSON.stringify(prevState.edges)),
        historyIndex: historyIndex - 1,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      set({
        nodes: JSON.parse(JSON.stringify(nextState.nodes)),
        edges: JSON.parse(JSON.stringify(nextState.edges)),
        historyIndex: historyIndex + 1,
      });
    }
  },

  clearWorkflow: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodes: [],
      history: [],
      historyIndex: -1,
    });
  },

  // Helper: get set of connected input handles for a node
  getConnectedInputHandles: (nodeId: string): Set<string> => {
    const { edges } = get();
    const handles = new Set<string>();
    edges
      .filter(e => e.target === nodeId)
      .forEach(e => handles.add(e.targetHandle || 'default'));
    return handles;
  },

  // Helper: check if a specific input handle is connected
  isInputConnected: (nodeId: string, handle: string): boolean => {
    const { edges } = get();
    return edges.some(e => e.target === nodeId && (e.targetHandle || 'default') === handle);
  },
}));
