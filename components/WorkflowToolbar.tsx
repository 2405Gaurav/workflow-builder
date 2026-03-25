'use client';

import { useState, useEffect } from 'react';
import { useWorkflowStore } from '@/lib/store';
import { useUser } from '@clerk/nextjs';
import { ExecutionEngine } from '@/lib/execution-engine';
import { Button } from '@/components/ui/button';
import { ImportExportButtons } from './ImortExportWorkflow';
import {
  Play,
  Save,
  Undo,
  Redo,
  Trash2,
  Loader2,
  Zap,
  Target,
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

  useEffect(() => {
    if (currentWorkflow?.name) {
      setWorkflowName(currentWorkflow.name);
    }
  }, [currentWorkflow]);

  const handleExecute = async (scope: 'full' | 'partial' | 'single') => {
    if (!user || isExecuting) return;

    setIsExecuting(true);

    try {
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
      const execution = responseData.execution;

      if (!execution) throw new Error('Failed to create execution record');
      addExecution(execution);

      nodes.forEach((node) => {
        updateNodeData(node.id, { status: 'idle', error: undefined });
      });

      const engine = new ExecutionEngine(nodes, edges, (nodeId, status, data) => {
        const updateData: any = { status };
        
        if (status === 'success') {
          const node = nodes.find(n => n.id === nodeId);
          if (node?.data.type === 'llm' && data?.text) updateData.result = data.text;
          if (node?.data.type === 'crop-image' && data?.imageUrl) updateData.croppedImageUrl = data.imageUrl;
          if (node?.data.type === 'extract-frame' && data?.imageUrl) updateData.extractedFrameUrl = data.imageUrl;
        }
        
        updateNodeData(nodeId, updateData);
      });

      const selectedNodeIds =
        scope === 'single' && selectedNodes.length === 1
          ? [selectedNodes[0]]
          : scope === 'partial'
          ? selectedNodes
          : undefined;

      const result = await engine.execute(scope, selectedNodeIds);

      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - new Date(execution.startedAt).getTime();
      const finalStatus = result.success ? 'success' : 'failed';

      // 1. Backend update (usually snake_case)
      await fetch(`/api/executions/${execution.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: finalStatus,
          node_results: result.results,
          completed_at: completedAt,
          duration_ms: durationMs,
          error_message: result.error,
        }),
      });

      // 2. Store update (MUST match your TypeScript types - camelCase)
      updateExecution(execution.id, {
        status: finalStatus,
        nodeResults: result.results,
        completedAt: completedAt,
        durationMs: durationMs,
        errorMessage: result.error,
      });

    } catch (error) {
      console.error('Execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSave = async () => {
    if (!user || !workflowName) return;
    setIsSaving(true);

    try {
      const isUpdate = !!currentWorkflow;
      const url = isUpdate ? `/api/workflows/${currentWorkflow.id}` : '/api/workflows';
      const method = isUpdate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workflowName,
          description: currentWorkflow?.description || '',
          nodes,
          edges,
        }),
      });

      const { workflow } = await response.json();
      setCurrentWorkflow(workflow);
      setSaveDialogOpen(false);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-14 flex items-center justify-between px-4 gap-4 bg-[#0a0a0a]/80 border-b border-white/5 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Button
          onClick={() => handleExecute('full')}
          disabled={isExecuting || nodes.length === 0}
          className="h-9 px-4 text-xs font-bold bg-[#eab308] hover:bg-[#facc15] text-black gap-2 rounded-full transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] disabled:opacity-50"
        >
          {isExecuting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
          RUN WORKFLOW
        </Button>

        <div className="h-6 w-[1px] bg-white/10 mx-1" />

        <Button
          variant="ghost"
          onClick={() => handleExecute('partial')}
          disabled={isExecuting || selectedNodes.length === 0}
          className="h-9 px-3 text-xs text-white/50 hover:text-white hover:bg-white/5 gap-2 rounded-full"
        >
          <Target size={15} />
          Partial
        </Button>

        <Button
          variant="ghost"
          onClick={() => handleExecute('single')}
          disabled={isExecuting || selectedNodes.length !== 1}
          className="h-9 px-3 text-xs text-white/50 hover:text-white hover:bg-white/5 gap-2 rounded-full"
        >
          <Zap size={15} />
          Single
        </Button>
      </div>

      {selectedNodes.length > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-tighter text-white/40 font-medium">
          {selectedNodes.length} Nodes Selected
        </div>
      )}

      <div className="flex items-center gap-1">
        <div className="flex bg-white/5 rounded-full p-0.5 mr-2">
          <Button
            variant="ghost"
            onClick={undo}
            className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/10 rounded-full"
          >
            <Undo size={14} />
          </Button>
          <Button
            variant="ghost"
            onClick={redo}
            className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/10 rounded-full"
          >
            <Redo size={14} />
          </Button>
        </div>

        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-9 px-4 text-xs bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-full gap-2"
            >
              <Save size={14} />
              {currentWorkflow ? 'Update' : 'Save'}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0f0f0f] border-white/10 rounded-3xl sm:max-w-md shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white tracking-tight">Save Workflow</DialogTitle>
              <DialogDescription className="text-white/40">
                Sync your creation to the cloud.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Name your workflow..."
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/20 focus:ring-1 focus:ring-[#eab308]/50 focus:border-[#eab308]/50"
              />
              <Button
                onClick={handleSave}
                disabled={isSaving || !workflowName}
                className="w-full h-12 bg-[#eab308] hover:bg-[#facc15] text-black font-bold rounded-xl transition-all shadow-lg"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  'Confirm & Save'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <LoadSampleButton />
        <ImportExportButtons /> 

        <Button
          variant="ghost"
          onClick={clearWorkflow}
          disabled={nodes.length === 0}
          className="h-9 w-9 p-0 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
}