'use client';

import { useState, useEffect } from 'react';
import { useWorkflowStore } from '@/lib/store';
import { useUser } from '@clerk/nextjs';
import { ExecutionEngine } from '@/lib/execution-engine';
import { Button } from '@/components/ui/button';
import { ImportExportButtons } from './ImortExportWorkflow';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Save,
  Undo,
  Redo,
  Trash2,
  Loader2,
  Zap,
  Target,
  ChevronDown,
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

 // ... inside your WorkflowToolbar component

return (
  <div className="h-16 flex items-center justify-between px-6 bg-[#050505] border-b border-white/5 relative z-20">
    
    {/* LEFT — Primary Actions */}
    <div className="flex items-center gap-2 shrink-0">
      <motion.div whileTap={{ scale: 0.96 }}>
        <Button
          onClick={() => handleExecute('full')}
          disabled={isExecuting || nodes.length === 0}
          className={`
            h-10 px-5 rounded-xl font-bold transition-all flex items-center gap-2.5
            ${isExecuting 
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
              : 'bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.1)]'}
          `}
        >
          {isExecuting ? <Loader2 size={16} className="animate-spin" /> : <Play size={14} className="fill-current" />}
          <span className="text-xs tracking-tight uppercase">Run Flow</span>
        </Button>
      </motion.div>

      <div className="h-4 w-px bg-white/10 mx-2" />

      <div className="flex items-center gap-1">
        <ToolbarAction 
          onClick={() => handleExecute('partial')}
          disabled={isExecuting || selectedNodes.length === 0}
          icon={Target}
          label="Partial"
        />
        <ToolbarAction 
          onClick={() => handleExecute('single')}
          disabled={isExecuting || selectedNodes.length !== 1}
          icon={Zap}
          label="Single"
        />
      </div>
    </div>

    {/* RIGHT — Utilities & Selection Badge */}
    <div className="flex items-center gap-2 shrink-0">
      
      {/* FIXED POSITIONING: Selection Badge is now part of the flex flow */}
      <AnimatePresence mode="wait">
        {selectedNodes.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-full mr-2"
          >
            <span className="mono text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold whitespace-nowrap">
              {`// ${selectedNodes.length} Selected`}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo/Redo Group */}
      <div className="flex bg-white/[0.03] rounded-xl p-1 border border-white/5">
        <button onClick={undo} className="p-2 text-white/30 hover:text-white transition-colors"><Undo size={14}/></button>
        <button onClick={redo} className="p-2 text-white/30 hover:text-white transition-colors"><Redo size={14}/></button>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="h-10 px-4 rounded-xl border-white/5 bg-white/[0.02] text-white/60 hover:bg-white/[0.05] hover:text-white transition-all flex items-center gap-2"
          >
            <Save size={14} />
            <span className="text-xs font-semibold">Save</span>
          </Button>
        </DialogTrigger>
        {/* ... Dialog Content ... */}
      </Dialog>

      <div className="flex items-center gap-1">
        <LoadSampleButton />
        <ImportExportButtons />
      </div>

      <div className="h-4 w-px bg-white/10 mx-2" />

      <Button
        variant="ghost"
        onClick={clearWorkflow}
        disabled={nodes.length === 0}
        className="h-10 w-10 p-0 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  </div>
);
}

// --- SUB-COMPONENT: TOOLBAR ACTION ---
function ToolbarAction({ icon: Icon, label, onClick, disabled, tooltip }: any) {
  return (
    <motion.div whileTap={{ scale: 0.95 }}>
      <Button
        variant="ghost"
        onClick={onClick}
        disabled={disabled}
        title={tooltip}
        className="h-10 px-3 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.04] transition-all flex items-center gap-2"
      >
        <Icon size={15} />
        <span className="text-xs font-medium hidden lg:inline">{label}</span>
      </Button>
    </motion.div>
  );
}