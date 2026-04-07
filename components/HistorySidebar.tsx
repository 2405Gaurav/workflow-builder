'use client';

// history sidebar - shows all the past workflow executions on the right side
// users can click on a run to see per-node results and stuff
// collapses down to just icons when you want more canvas space

import { useEffect, useState } from 'react';
import { useWorkflowStore } from '@/lib/store';
import { useUser } from '@clerk/nextjs';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Clock, CheckCircle, XCircle, Loader2, 
  History, ChevronRight, Zap, Activity,
  PanelRightClose, PanelRightOpen, AlertCircle, Hash 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function HistorySidebar() {
  const { user } = useUser();
  const { executions, currentExecution, setCurrentExecution, setExecutions } = useWorkflowStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDetail, setIsFetchingDetail] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);

  // fetch all execution history when user first loads in
  // we only do this once when the component mounts w/ a valid user
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
        // somthing went wrong fetching exections, log it and move on
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExecutions();
  }, [user, setExecutions]);

  // when user clicks on an execution, fetch the full details (node results etc)
  // if they click the same one again, toggle it off - kinda like an acordion
  const handleSelectExecution = async (executionId: string) => {
    if (isCollapsed) setIsCollapsed(false);
    // we keep a local "selected id" so the UI can expand immediately,
    // even before the detailed execution payload comes back.
    if (selectedExecutionId === executionId) {
      setSelectedExecutionId(null);
      setCurrentExecution(null);
      return;
    }
    setSelectedExecutionId(executionId);
    setIsFetchingDetail(executionId);
    try {
      const response = await fetch(`/api/executions/${executionId}`);
      if (response.ok) {
        const { execution: fullData } = await response.json();
        setCurrentExecution(fullData);
      }
    } catch (error) {
      // failed to get execution details, not the end of the world tho
      console.error(error);
    } finally {
      setIsFetchingDetail(null);
    }
  };

  return (
    // outer shell - gives the panel some breathing room so it floats nicely
    <div className="h-full max-h-[calc(100vh-24px)] flex items-stretch py-3 pr-3 pl-0">
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 64 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="h-full max-h-[calc(100vh-24px)] flex flex-col overflow-hidden select-none relative z-30 rounded-2xl"
        style={{
          background: 'rgba(10, 10, 14, 0.85)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset',
        }}
      >
        {/* 1. HEADER - toggle between expanded/collaped modes */}
        <div className={`flex items-center h-14 border-b shrink-0 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'}`}
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7] animate-pulse" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                {'// History'}
              </span>
            </motion.div>
          )}

          {/* collapse/expand btn */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-white/20 hover:text-white/70 hover:bg-white/5 rounded-xl transition-all"
          >
            {isCollapsed ? <PanelRightOpen size={15} /> : <PanelRightClose size={15} />}
          </button>
        </div>

        {/* 2. RUN LIST - scrollable list of all past exections */}
        <div
          className={`flex-1 overflow-y-auto p-2.5 custom-scrollbar ${isCollapsed ? 'flex flex-col items-center gap-2' : ''}`}
        >
          <div className="space-y-1.5 w-full">
            {isLoading ? (
              // loading spinner while we fetch exectuions from the api
              <div className="py-16 flex justify-center">
                <Loader2 size={16} className="text-white/10 animate-spin" />
              </div>
            ) : executions.length === 0 ? (
              // empty state - no runs yet, show a subtle icon
              <div className="py-20 flex justify-center opacity-10">
                <Activity size={22} />
              </div>
            ) : (
              // render each execution as a clickable card
              executions.map((execution) => {
                const isActive = selectedExecutionId === execution.id;
                const isThisFetching = isFetchingDetail === execution.id;
                const activeExecution =
                  currentExecution?.id === execution.id ? currentExecution : null;
                return (
                  <motion.div
                    key={execution.id}
                    layout
                    className="rounded-xl border overflow-hidden transition-all"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                      borderColor: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    }}
                  >
                    <button
                      onClick={() => handleSelectExecution(execution.id)}
                      className={`w-full text-left relative ${isCollapsed ? 'p-2 flex justify-center' : 'p-3'}`}
                    >
                      <div className={`flex items-center justify-between ${isCollapsed ? '' : 'mb-2.5'}`}>
                        <StatusIndicator status={execution.status} isCollapsed={isCollapsed} />
                        {!isCollapsed && (
                          <div className="flex items-center gap-2">
                            {/* tiny spinner so it feels responsive when grabbing full node logs */}
                            {isThisFetching ? (
                              <Loader2 size={12} className="text-white/20 animate-spin" />
                            ) : null}
                            <ChevronRight
                              size={12}
                              className={`text-white/10 transition-transform duration-200 ${isActive ? 'rotate-90 text-white/50' : ''}`}
                            />
                          </div>
                        )}
                      </div>

                      {/* timestamp, run id and duration - only visible when expanded */}
                      {!isCollapsed && (
                        <div className="space-y-1.5">
                          {/* run ID badge + precise timestamp so you can match it with logs */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Hash size={9} className="text-white/20 shrink-0" />
                              <span
                                className="mono text-[9px] text-white/25 truncate"
                                title={execution.id}
                              >
                                run_{execution.id.slice(0, 8)}
                              </span>
                            </div>
                            <span
                              className="mono text-[9px] text-white/25"
                              title={format(new Date(execution.startedAt), 'PPpp')}
                            >
                              {format(new Date(execution.startedAt), 'HH:mm:ss')}
                            </span>
                          </div>

                          {/* human friendly "x minutes ago" + duration */}
                          <div className="flex items-center justify-between text-[10px] font-medium">
                            <span
                              className="text-white/35 cursor-default"
                              title={format(new Date(execution.startedAt), 'PPpp')}
                            >
                              {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
                            </span>
                            {execution.durationMs && (
                              <span className="text-white/20 font-mono tracking-tighter">
                                {(execution.durationMs / 1000).toFixed(1)}s
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </button>

                    {/* expanded detail panel - shows node-level results */}
                    <AnimatePresence>
                      {isActive && !isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t p-3 space-y-2"
                          style={{
                            borderColor: 'rgba(255,255,255,0.05)',
                            background: 'rgba(0,0,0,0.3)',
                          }}
                        >
                          {/* error mesage banner if the run failed */}
                          {activeExecution?.errorMessage && (
                            <div className="flex gap-2 p-2.5 rounded-xl mb-1"
                              style={{
                                background: 'rgba(244,63,94,0.08)',
                                border: '1px solid rgba(244,63,94,0.18)',
                              }}
                            >
                              <AlertCircle size={13} className="text-rose-400 shrink-0 mt-0.5" />
                              <p className="text-[10px] text-rose-300 leading-relaxed font-medium min-w-0 break-words whitespace-pre-wrap">
                                {activeExecution.errorMessage}
                              </p>
                            </div>
                          )}

                          <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] px-0.5 block">
                            Node Logs
                          </span>

                          {/* per-node execution results */}
                          {!activeExecution?.nodeResults ? (
                            <div className="py-3 flex justify-center">
                              <Loader2 size={13} className="animate-spin text-white/10" />
                            </div>
                          ) : (
                            <div className="max-h-44 overflow-y-auto pr-1 custom-scrollbar space-y-1.5">
                              {Object.entries(activeExecution.nodeResults as Record<string, any>).map(([nodeId, result]) => (
                                <div
                                  key={nodeId}
                                  className="px-2.5 py-2 rounded-lg flex items-center justify-between"
                                  style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                  }}
                                >
                                  <span className="text-[10px] font-bold text-white/35 truncate">
                                    {nodeId.split('-')[0].toUpperCase()}
                                  </span>
                                  <StatusDot status={result.status} />
                                </div>
                              ))}
                            </div>
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

        {/* custom scrollbar styles - thin and subtle */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar { width: 3px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        `}</style>
      </motion.div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

// status pill indicator - shows running/success/failed with color coding
// displays as a small dot when sidebar is collapsed
function StatusIndicator({ status, isCollapsed }: { status: string; isCollapsed?: boolean }) {
  type StatusConfig = { bg: string; dot: string; label: string; text: string };
  const configMap: Record<string, StatusConfig> = {
    running: { bg: 'rgba(59,130,246,0.1)',  dot: 'bg-blue-500',    label: 'Running', text: 'text-blue-400' },
    success: { bg: 'rgba(16,185,129,0.1)',  dot: 'bg-emerald-500', label: 'Success', text: 'text-emerald-400' },
    failed:  { bg: 'rgba(244,63,94,0.1)',   dot: 'bg-rose-500',    label: 'Failed',  text: 'text-rose-400' },
  };
  const config = configMap[status] || { bg: 'rgba(255,255,255,0.05)', dot: 'bg-white/20', label: 'Idle', text: 'text-white/20' };

  // collapsed mode - just a tiny colored dot
  if (isCollapsed) return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center"
      style={{ background: config.bg, border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className={`w-2 h-2 rounded-full ${config.dot} ${status === 'running' ? 'animate-pulse' : ''}`} />
    </div>
  );

  // expanded mode - full pill with label
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-full"
      style={{ background: config.bg, border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'running' ? 'animate-pulse' : ''}`} />
      <span className={`text-[9px] font-bold uppercase tracking-wider ${config.text}`}>{config.label}</span>
    </div>
  );
}

// small status dot used in the node results list
// just shows a checkmark, x, or spinner depending on the state
function StatusDot({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle size={11} className="text-emerald-500" />;
  if (status === 'failed')  return <XCircle size={11} className="text-rose-500" />;
  if (status === 'running') return <Loader2 size={11} className="text-blue-500 animate-spin" />;
  return <Clock size={11} className="text-white/20" />;
}