'use client';

import { useState } from 'react';
import { useWorkflowStore } from '@/lib/store';
import { useUser } from '@clerk/nextjs';
import { ExecutionEngine } from '@/lib/execution-engine';
import { Button } from '@/components/ui/button';
import {
  Play,
  Save,
  Undo,
  Redo,
  Trash2,
  Loader2,
  Zap,
  Target,
  Maximize2,
} from 'lucide-react';
import { LoadSampleButton } from './LoadSampleButton';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function WorkflowToolbar() {
  const { user } = useUser();
  const {
    nodes,
    edges,
    selectedNodes,
    currentWorkflow,
    isExecuting,
    setCurrentWorkflow,
    addExecution,
    updateExecution,
    undo,
    redo,
    clearWorkflow,
    updateNodeData,
    setIsExecuting,
  } = useWorkflowStore();

  const [isSaving, setIsSaving] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const handleExecute = async (scope: 'full' | 'partial' | 'single') => {
    if (!user) return;

    setIsExecuting(true);

    try {
      // Create execution record
      // const executionResponse = await fetch('/api/executions', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     workflow_id: currentWorkflow?.id || null,
      //     scope,
      //     node_results: {},
      //   }),
      // });

      // const { execution } = await executionResponse.json();
      // addExecution(execution);

      const executionResponse = await fetch('/api/executions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflow_id: currentWorkflow?.id || null,
    scope,
    node_results: {},
  }),
});

const responseData = await executionResponse.json();
console.log('Execution API response:', responseData); // 👈 add this
const execution = responseData.execution;

if (!execution) {
  console.error('No execution returned:', responseData);
  setIsExecuting(false);
  return;
}

addExecution(execution);

      // Reset all node statuses
      nodes.forEach((node) => {
        updateNodeData(node.id, { status: 'idle', error: undefined });
      });

      // Create engine with status callback for real-time updates
      const engine = new ExecutionEngine(nodes, edges, (nodeId, status, data) => {
        if (status === 'running') {
          updateNodeData(nodeId, { status: 'running' });
        } else if (status === 'success') {
          const node = nodes.find(n => n.id === nodeId);
          if (!node) return;

          const updateData: any = { status: 'success' };
          
          if (node.data.type === 'llm' && data?.text) {
            updateData.result = data.text;
          } else if (node.data.type === 'crop-image' && data?.imageUrl) {
            updateData.croppedImageUrl = data.imageUrl;
          } else if (node.data.type === 'extract-frame' && data?.imageUrl) {
            updateData.extractedFrameUrl = data.imageUrl;
          }
          
          updateNodeData(nodeId, updateData);
        } else if (status === 'failed') {
          updateNodeData(nodeId, { status: 'error' });
        }
      });

      const selectedNodeIds =
        scope === 'single' && selectedNodes.length === 1
          ? [selectedNodes[0]]
          : scope === 'partial'
          ? selectedNodes
          : undefined;

      const result = await engine.execute(scope, selectedNodeIds);

      // Update execution results on each node
      Object.entries(result.results).forEach(([nodeId, nodeResult]) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        if (nodeResult.status === 'success') {
          const outputs = nodeResult.outputs;
          const updateData: any = {
            status: 'success',
            executionTime: nodeResult.executionTime,
          };

          if (node.data.type === 'llm' && outputs?.text) {
            updateData.result = outputs.text;
          } else if (node.data.type === 'crop-image' && outputs?.imageUrl) {
            updateData.croppedImageUrl = outputs.imageUrl;
          } else if (node.data.type === 'extract-frame' && outputs?.imageUrl) {
            updateData.extractedFrameUrl = outputs.imageUrl;
          }

          updateNodeData(nodeId, updateData);
        } else {
          updateNodeData(nodeId, {
            status: 'error',
            error: nodeResult.error,
          });
        }
      });

      // Persist execution results
      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - new Date(execution.startedAt).getTime();

      await fetch(`/api/executions/${execution.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: result.success ? 'success' : 'failed',
          node_results: result.results,
          completed_at: completedAt,
          duration_ms: durationMs,
          error_message: result.error,
        }),
      });

      updateExecution(execution.id, {
        status: result.success ? 'success' : 'failed',
        node_results: result.results,
        completed_at: completedAt,
        duration_ms: durationMs,
        error_message: result.error,
      });
    } catch (error) {
      console.error('Execution error:', error);
      nodes.forEach((node) => {
        updateNodeData(node.id, { status: 'error', error: 'Execution failed' });
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSave = async () => {
    if (!user || !workflowName) return;

    setIsSaving(true);

    try {
      if (currentWorkflow) {
        const response = await fetch(`/api/workflows/${currentWorkflow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: workflowName,
            description: currentWorkflow.description,
            nodes,
            edges,
          }),
        });

        const { workflow } = await response.json();
        setCurrentWorkflow(workflow);
      } else {
        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: workflowName,
            description: '',
            nodes,
            edges,
          }),
        });

        const { workflow } = await response.json();
        setCurrentWorkflow(workflow);
      }

      setSaveDialogOpen(false);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-12 flex items-center justify-between px-3 gap-2"
      style={{
        background: 'rgba(15, 15, 20, 0.9)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Left: Execution buttons */}
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          onClick={() => handleExecute('full')}
          disabled={isExecuting || nodes.length === 0}
          className="h-8 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 border-0 text-white gap-1.5 rounded-lg transition-all"
        >
          {isExecuting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={14} />
          )}
          Run All
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleExecute('partial')}
          disabled={isExecuting || selectedNodes.length === 0}
          className="h-8 px-3 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 gap-1.5 rounded-lg"
        >
          <Target size={14} />
          Selected
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleExecute('single')}
          disabled={isExecuting || selectedNodes.length !== 1}
          className="h-8 px-3 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 gap-1.5 rounded-lg"
        >
          <Zap size={14} />
          Single
        </Button>

        {selectedNodes.length > 0 && (
          <span className="text-[10px] text-gray-500 ml-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            {selectedNodes.length} selected
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={undo}
          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg"
        >
          <Undo size={14} />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={redo}
          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg"
        >
          <Redo size={14} />
        </Button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 gap-1.5 rounded-lg"
            >
              <Save size={14} />
              Save
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-white/10 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-gray-200">Save Workflow</DialogTitle>
              <DialogDescription className="text-gray-500">
                Give your workflow a name to save it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="My Workflow..."
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-600 focus:border-purple-500/50"
              />
              <Button
                onClick={handleSave}
                disabled={isSaving || !workflowName}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white border-0"
              >
                {isSaving ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <Save size={14} className="mr-2" />
                )}
                Save Workflow
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <LoadSampleButton />

        <Button
          size="sm"
          variant="ghost"
          onClick={clearWorkflow}
          disabled={nodes.length === 0}
          className="h-8 px-3 text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/10 gap-1.5 rounded-lg"
        >
          <Trash2 size={14} />
          Clear
        </Button>
      </div>
    </div>
  );
}
