'use client';

// workflow toolbar, its the lil control deck at the top
// run / save / undo redo and a way to get back to dashbord

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  ArrowLeft,
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
  const router = useRouter();
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

  // keep the save dialog name in sync, otherwise it feels kinda janky
  useEffect(() => {
    if (currentWorkflow?.name) {
      setWorkflowName(currentWorkflow.name);
    }
  }, [currentWorkflow]);

  // run the flow. we create a run record first so history shows it right away
  const handleExecute = async (scope: 'full' | 'partial' | 'single') => {
    if (!user || isExecuting) return;
    setIsExecuting(true);

    try {
      // create a new execution record in the database
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

      // reset all nodes to idle before starting the run
      nodes.forEach((node) => {
        updateNodeData(node.id, { status: 'idle', error: undefined });
      });

      // fire up the execution engine with a callback to update node statuses in realtime
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

      // figure out which nodes to run based on scope
      const selectedNodeIds =
        scope === 'single' && selectedNodes.length === 1
          ? [selectedNodes[0]]
          : scope === 'partial'
          ? selectedNodes
          : undefined;

      const result = await engine.execute(scope, selectedNodeIds);

      // calculate how long the whole thing took and update the db
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

      // also update local state so the history sidebar refreshes instantly
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

  // save current flow. update if we loaded one, otherwise create a fresh record
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
    // floating toolbar island - detached from edges with rounded corners
    <div className="h-16 m-4 flex items-center justify-between px-6 bg-[#050505] border border-white/5 rounded-2xl shadow-2xl shadow-black/50 relative z-20">
      
      {/* LEFT — back to dashboard + primary actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* dashboard back button - subtle but always visible */}
        <button
          onClick={() => router.push('/dashboard')}
          className="p-2 text-white/20 hover:text-white/60 hover:bg-white/5 rounded-xl transition-all mr-1"
          title="Back to Dashboard"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="h-4 w-px bg-white/10 mx-1" />

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

        {/* partial and single node execution btns */}
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

      {/* RIGHT — utilities, save dialog, selection badge */}
      <div className="flex items-center gap-2 shrink-0">
        
        {/* selection badge - shows how many nodes are currently selected */}
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

        {/* undo/redo group */}
        <div className="flex bg-white/[0.03] rounded-xl p-1 border border-white/5">
          <button onClick={undo} className="p-2 text-white/30 hover:text-white transition-colors"><Undo size={14}/></button>
          <button onClick={redo} className="p-2 text-white/30 hover:text-white transition-colors"><Redo size={14}/></button>
        </div>

        {/* save dialog - lets user name and save the workflow */}
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
          <DialogContent className="bg-[#0a0a0a] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Save Workflow</DialogTitle>
              <DialogDescription className="text-white/50">
                Give your workflow a name to save it for later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  placeholder="Workflow Name"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  // BUG-02: Enter saves, Escape cancels
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && workflowName) handleSave();
                    if (e.key === 'Escape') setSaveDialogOpen(false);
                  }}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving || !workflowName}
                className="w-full bg-white text-black hover:bg-white/90"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                Save Workflow
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex items-center gap-1">
          <LoadSampleButton />
          <ImportExportButtons />
        </div>

        <div className="h-4 w-px bg-white/10 mx-2" />

        {/* clear canvas btn - deltes all nodes and edges */}
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
// reusable button for the partial/single execute actions
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