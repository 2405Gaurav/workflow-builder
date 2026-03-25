'use client';

import { useEffect, useState } from 'react';
import { useWorkflowStore } from '@/lib/store';
import { useUser } from '@clerk/nextjs';
import { formatDistanceToNow } from 'date-fns';
import { 
  Clock, CheckCircle, XCircle, Loader2, 
  History, ChevronRight, Zap, Activity,
  PanelRightClose, PanelRightOpen, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function HistorySidebar() {
  const { user } = useUser();
  const { executions, currentExecution, setCurrentExecution, setExecutions } = useWorkflowStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDetail, setIsFetchingDetail] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };
    fetchExecutions();
  }, [user, setExecutions]);

  const handleSelectExecution = async (executionId: string) => {
    if (isCollapsed) setIsCollapsed(false);
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
    } catch (error) { console.error(error); } finally { setIsFetchingDetail(null); }
  };

  return (
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 250 }}
      className="h-full flex flex-col bg-[#050505] border-l border-white/5 overflow-hidden select-none relative z-30"
    >
      {/* 1. HEADER */}
      <div className={`flex items-center justify-between px-5 h-16 border-b border-white/5 bg-black/20 shrink-0 ${isCollapsed ? 'flex-col py-4 justify-center gap-4' : ''}`}>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all">
          {isCollapsed ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
        </button>

        {!isCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7] animate-pulse" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{"// History"}</span>
          </motion.div>
        )}
      </div>

      {/* 2. RUN LIST */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar p-3 ${isCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        <div className="space-y-2 w-full">
          {isLoading ? (
            <div className="py-20 flex justify-center"><Loader2 size={18} className="text-white/10 animate-spin" /></div>
          ) : executions.length === 0 ? (
            <div className="py-24 flex justify-center opacity-10"><Activity size={24} /></div>
          ) : (
            executions.map((execution, idx) => {
              const isActive = currentExecution?.id === execution.id;
              return (
                <motion.div key={execution.id} layout className={`rounded-2xl border transition-all overflow-hidden ${isActive ? 'bg-white/[0.04] border-white/10 shadow-2xl' : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5'}`}>
                  <button onClick={() => handleSelectExecution(execution.id)} className={`w-full text-left relative ${isCollapsed ? 'p-3 flex justify-center' : 'p-4'}`}>
                    <div className={`flex items-center justify-between ${isCollapsed ? '' : 'mb-3'}`}>
                      <StatusIndicator status={execution.status} isCollapsed={isCollapsed} />
                      {!isCollapsed && <ChevronRight size={14} className={`text-white/10 transition-transform ${isActive ? 'rotate-90 text-white/60' : ''}`} />}
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center justify-between text-[10px] font-medium">
                        <span className="text-white/40">{formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}</span>
                        {execution.durationMs && <span className="text-white/20 mono tracking-tighter">{(execution.durationMs / 1000).toFixed(1)}s</span>}
                      </div>
                    )}
                  </button>

                  <AnimatePresence>
                    {isActive && !isCollapsed && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/5 bg-black/40 p-4 space-y-3">
                        
                        {/* ERROR ALERT MESSAGE */}
                        {execution.errorMessage && (
                          <div className="flex gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-2">
                            <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-rose-300 leading-relaxed font-medium">{execution.errorMessage}</p>
                          </div>
                        )}

                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] px-1 block">Node Logs</span>
                        {!currentExecution.nodeResults ? (
                          <div className="py-4 flex justify-center"><Loader2 size={14} className="animate-spin text-white/10" /></div>
                        ) : (
                          Object.entries(currentExecution.nodeResults as Record<string, any>).map(([nodeId, result]) => (
                            <div key={nodeId} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-white/40 truncate">{nodeId.split('-')[0].toUpperCase()}</span>
                              <StatusDot status={result.status} />
                            </div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
      <style jsx>{`.custom-scrollbar::-webkit-scrollbar { width: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }`}</style>
    </motion.div>
  );
}

// --- HELPERS ---

function StatusIndicator({ status, isCollapsed }: { status: string; isCollapsed?: boolean }) {
  type StatusConfig = { bg: string; dot: string; label: string; text: string };
  const configMap: Record<string, StatusConfig> = {
    running: { bg: 'bg-blue-500/10', dot: 'bg-blue-500', label: 'Running', text: 'text-blue-400' },
    success: { bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', label: 'Success', text: 'text-emerald-400' },
    failed:  { bg: 'bg-rose-500/10', dot: 'bg-rose-500', label: 'Failed', text: 'text-rose-400' },
  };
  const config = configMap[status] || { bg: 'bg-white/5', dot: 'bg-white/20', label: 'IDLE', text: 'text-white/20' };

  if (isCollapsed) return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg} border border-white/5`}>
      <div className={`w-2 h-2 rounded-full ${config.dot} ${status === 'running' ? 'animate-pulse' : ''}`} />
    </div>
  );

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full ${config.bg} border border-white/5`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'running' ? 'animate-pulse' : ''}`} />
      <span className={`text-[9px] font-bold uppercase tracking-wider ${config.text}`}>{config.label}</span>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle size={12} className="text-emerald-500" />;
  if (status === 'failed') return <XCircle size={12} className="text-rose-500" />;
  if (status === 'running') return <Loader2 size={12} className="text-blue-500 animate-spin" />;
  return <Clock size={12} className="text-white/20" />;
}