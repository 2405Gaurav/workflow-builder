'use client';

import { useEffect, useState } from 'react';
import { useWorkflowStore } from '@/lib/store';
import { useUser } from '@clerk/nextjs';
import { formatDistanceToNow } from 'date-fns';
import { 
  Clock, CheckCircle, XCircle, Loader2, 
  History, ChevronRight, Zap, Activity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function HistorySidebar() {
  const { user } = useUser();
  const { executions, currentExecution, setCurrentExecution, setExecutions } = useWorkflowStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDetail, setIsFetchingDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchExecutions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/executions');
        if (response.ok) {
          const { executions: data } = await response.json();
          if (data) setExecutions(data);
        }
      } catch (error) {
        console.error('Failed to fetch executions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExecutions();
  }, [user, setExecutions]);

  const handleSelectExecution = async (executionId: string) => {
    if (currentExecution?.id === executionId) {
      setCurrentExecution(null);
      return;
    }
    setIsFetchingDetail(executionId);
    try {
      const response = await fetch(`/api/executions/${executionId}`);
      if (response.ok) {
        const { execution: fullData } = await response.json();
        setCurrentExecution(fullData);
      }
    } catch (error) {
      console.error('Failed to fetch execution details:', error);
    } finally {
      setIsFetchingDetail(null);
    }
  };

  return (
    <div className="w-[320px] h-full flex flex-col bg-[#050505] border-l border-white/5 overflow-hidden select-none">
      
      {/* HEADER */}
      <div className="px-5 h-16 flex items-center justify-between   bg-black/20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7] animate-pulse" />
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em]">
            {"// Run History"}
          </span>
        </div>
        <div className="text-[10px] font-mono font-bold text-white/20 bg-white/5 px-2 py-1 rounded-md">
          {executions.length} TOTAL
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={20} className="text-white/10 animate-spin" />
              <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold font-mono">
                Syncing logs...
              </span>
            </div>
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-20">
              <Activity size={32} className="text-white mb-3" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No Recent Activity</p>
            </div>
          ) : (
            executions.map((execution, idx) => {
              const isActive = currentExecution?.id === execution.id;
              
              return (
                <motion.div
                  key={execution.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  layout
                  className={`group rounded-2xl border transition-all overflow-hidden ${
                    isActive 
                      ? 'bg-white/[0.04] border-white/10 shadow-2xl' 
                      : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5'
                  }`}
                >
                  <button
                    onClick={() => handleSelectExecution(execution.id)}
                    className="w-full p-4 text-left relative"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <StatusIndicator status={execution.status} />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/5">
                          {execution.scope}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {execution.durationMs && (
                          <span className="text-[10px] text-white/20 font-mono font-bold tracking-tighter">
                            {(execution.durationMs / 1000).toFixed(2)}s
                          </span>
                        )}
                        <ChevronRight
                          size={14}
                          className={`text-white/10 transition-transform duration-500 ${
                            isActive ? 'rotate-90 text-white/60' : ''
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-white/40 group-hover:text-white/60 transition-colors">
                        {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
                      </span>
                      {isFetchingDetail === execution.id && (
                        <Loader2 size={12} className="animate-spin text-purple-500" />
                      )}
                    </div>
                  </button>

                  {/* EXPANDED DETAILS */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="border-t border-white/5 bg-black/40"
                      >
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Node Insights</span>
                            <Zap size={10} className="text-white/10" />
                          </div>

                          {!currentExecution.nodeResults ? (
                            <div className="py-8 flex justify-center">
                              <Loader2 size={16} className="animate-spin text-white/10" />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {Object.entries(currentExecution.nodeResults as Record<string, any>).map(([nodeId, result]) => (
                                <div
                                  key={nodeId}
                                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-2 transition-colors hover:bg-white/[0.04]"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-white/60 truncate max-w-[140px]">
                                      {nodeId.split('-')[0].toUpperCase()}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] text-white/20 font-mono">
                                        {result.executionTime}ms
                                      </span>
                                      <StatusDot status={result.status} />
                                    </div>
                                  </div>

                                  {result.outputs?.text && (
                                    <div className="text-[10px] text-white/40 bg-black/60 p-2 rounded-lg border border-white/5 italic line-clamp-2 leading-relaxed">
                                      &quot;{result.outputs.text}&quot;
                                    </div>
                                  )}
                                  
                                  {result.error && (
                                    <div className="text-[9px] text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                                      {result.error}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}

// --- HELPERS ---

function StatusIndicator({ status }: { status: string }) {
  // 1. Define the shape of a single config item
  type StatusConfig = { bg: string; dot: string; label: string; text: string };

  // 2. Use Record<string, StatusConfig> to allow string indexing
  const configMap: Record<string, StatusConfig> = {
    running: { bg: 'bg-blue-500/10', dot: 'bg-blue-500', label: 'Running', text: 'text-blue-400' },
    success: { bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', label: 'Success', text: 'text-emerald-400' },
    failed:  { bg: 'bg-rose-500/10', dot: 'bg-rose-500', label: 'Failed', text: 'text-rose-400' },
  };

  // 3. Fallback to a default 'idle' state if status doesn't match
  const config = configMap[status] || { 
    bg: 'bg-white/5', 
    dot: 'bg-white/20', 
    label: status.toUpperCase(), 
    text: 'text-white/20' 
  };

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${config.bg} border border-white/5`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'running' ? 'animate-pulse' : ''}`} />
      <span className={`text-[9px] font-bold uppercase tracking-wider ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle size={10} className="text-emerald-500" />;
  if (status === 'failed') return <XCircle size={10} className="text-rose-500" />;
  if (status === 'running') return <Loader2 size={10} className="text-blue-500 animate-spin" />;
  return <Clock size={10} className="text-white/20" />;
}