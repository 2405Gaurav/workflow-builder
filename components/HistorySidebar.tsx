'use client';

// history sidebar - shows all the past workflow executions on the right side
// users can click on a run to see per-node results and stuff
// collapses down to just icons when you want more canvas space

import { useEffect, useState, useCallback } from 'react';
import { useWorkflowStore } from '@/lib/store';
import { useUser } from '@clerk/nextjs';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Clock, CheckCircle, XCircle, Loader2,
  History, ChevronRight, ChevronDown, Zap, Activity,
  PanelRightClose, PanelRightOpen, AlertCircle, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// persist expanded execution IDs in sessionStorage so they survive re-renders
const EXPANDED_KEY = 'wf-history-expanded';

function getPersistedExpanded(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(EXPANDED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function persistExpanded(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(EXPANDED_KEY, JSON.stringify([...ids]));
  } catch {}
}

export function HistorySidebar() {
  const { user } = useUser();
  const { executions, currentExecution, setCurrentExecution, setExecutions } = useWorkflowStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Track which executions are expanded — persisted in sessionStorage
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => getPersistedExpanded());
  
  // Track which individual nodes within an execution are expanded
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = sessionStorage.getItem('wf-history-expanded-nodes');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Helper to toggle an execution's expanded state
  const toggleExecution = useCallback((executionId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(executionId)) {
        next.delete(executionId);
      } else {
        next.add(executionId);
      }
      persistExpanded(next);
      return next;
    });
  }, []);

  // Helper to toggle a node within an execution
  const toggleNode = useCallback((compositeKey: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(compositeKey)) {
        next.delete(compositeKey);
      } else {
        next.add(compositeKey);
      }
      try {
        sessionStorage.setItem('wf-history-expanded-nodes', JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

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

  return (
    // outer shell - gives the panel some breathing room so it floats nicely
    <div className="h-full max-h-[calc(100vh-24px)] flex items-stretch py-3 pr-3 pl-0">
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 64 : 280 }}
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
                const isActive = expandedIds.has(execution.id);
                const nodeResults = execution.nodeResults as Record<string, any> | null;
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
                      onClick={() => {
                        if (isCollapsed) setIsCollapsed(false);
                        toggleExecution(execution.id);
                      }}
                      className={`w-full text-left relative ${isCollapsed ? 'p-2 flex justify-center' : 'p-3'}`}
                    >
                      <div className={`flex items-center justify-between ${isCollapsed ? '' : 'mb-2.5'}`}>
                        <StatusIndicator status={execution.status} isCollapsed={isCollapsed} />
                        {!isCollapsed && (
                          <div className="flex items-center gap-2">
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
                          {execution.errorMessage && (
                            <div className="flex gap-2 p-2.5 rounded-xl mb-1"
                              style={{
                                background: 'rgba(244,63,94,0.08)',
                                border: '1px solid rgba(244,63,94,0.18)',
                              }}
                            >
                              <AlertCircle size={13} className="text-rose-400 shrink-0 mt-0.5" />
                              <p className="text-[10px] text-rose-300 leading-relaxed font-medium min-w-0 break-words whitespace-pre-wrap">
                                {execution.errorMessage}
                              </p>
                            </div>
                          )}

                          <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] px-0.5 block">
                            Node Logs
                          </span>

                          {/* per-node execution results */}
                          {!nodeResults || Object.keys(nodeResults).length === 0 ? (
                            <div className="py-3 flex justify-center">
                              <span className="text-[9px] text-white/15 uppercase tracking-widest">No node data</span>
                            </div>
                          ) : (
                            <div className="max-h-[320px] overflow-y-auto pr-1 custom-scrollbar space-y-1.5">
                              {Object.entries(nodeResults).map(([nodeId, result]) => {
                                const compositeKey = `${execution.id}:${nodeId}`;
                                const isNodeExpanded = expandedNodes.has(compositeKey);
                                const nodeLabel = nodeId.split('-')[0].toUpperCase();
                                return (
                                  <div
                                    key={nodeId}
                                    className="rounded-lg overflow-hidden"
                                    style={{
                                      background: 'rgba(255,255,255,0.02)',
                                      border: '1px solid rgba(255,255,255,0.04)',
                                    }}
                                  >
                                    {/* Node header - clickable to expand */}
                                    <button
                                      onClick={() => toggleNode(compositeKey)}
                                      className="w-full px-2.5 py-2 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                                    >
                                      <span className="text-[10px] font-bold text-white/35 truncate">
                                        {nodeLabel}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <StatusDot status={result.status} />
                                        <ChevronDown
                                          size={10}
                                          className={`text-white/15 transition-transform duration-200 ${isNodeExpanded ? 'rotate-180 text-white/40' : ''}`}
                                        />
                                      </div>
                                    </button>

                                    {/* Node detail - expandable */}
                                    <AnimatePresence>
                                      {isNodeExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.15 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="px-2.5 pb-2 pt-1 space-y-1.5 border-t border-white/[0.03]">
                                            {/* Status */}
                                            <div className="flex items-center justify-between">
                                              <span className="text-[8px] uppercase tracking-widest text-white/20 font-bold">Status</span>
                                              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                                result.status === 'success' ? 'text-emerald-400' :
                                                result.status === 'failed' ? 'text-rose-400' :
                                                result.status === 'running' ? 'text-blue-400' :
                                                'text-white/20'
                                              }`}>
                                                {result.status}
                                              </span>
                                            </div>

                                            {/* Execution time */}
                                            {result.executionTime && (
                                              <div className="flex items-center justify-between">
                                                <span className="text-[8px] uppercase tracking-widest text-white/20 font-bold">Duration</span>
                                                <span className="text-[9px] font-mono text-white/30">
                                                  {(result.executionTime / 1000).toFixed(2)}s
                                                </span>
                                              </div>
                                            )}

                                            {/* Started at */}
                                            {result.startedAt && (
                                              <div className="flex items-center justify-between">
                                                <span className="text-[8px] uppercase tracking-widest text-white/20 font-bold">Started</span>
                                                <span className="text-[9px] font-mono text-white/25">
                                                  {format(new Date(result.startedAt), 'HH:mm:ss')}
                                                </span>
                                              </div>
                                            )}

                                            {/* Error message if failed */}
                                            {result.error && (
                                              <div className="mt-1 p-1.5 rounded bg-rose-500/8 border border-rose-500/15">
                                                <span className="text-[9px] text-rose-300 break-words">{result.error}</span>
                                              </div>
                                            )}

                                            {/* Output preview */}
                                            {result.outputs && (
                                              <div className="mt-1">
                                                <span className="text-[8px] uppercase tracking-widest text-white/20 font-bold block mb-1">Output</span>
                                                <div className="p-1.5 rounded bg-white/[0.02] border border-white/[0.04] max-h-24 overflow-y-auto custom-scrollbar">
                                                  {result.outputs.text && (
                                                    <p className="text-[9px] text-white/40 break-words whitespace-pre-wrap leading-relaxed">
                                                      {String(result.outputs.text).slice(0, 200)}{String(result.outputs.text).length > 200 ? '…' : ''}
                                                    </p>
                                                  )}
                                                  {result.outputs.imageUrl && (
                                                    <a
                                                      href={result.outputs.imageUrl}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-[9px] text-blue-400/60 hover:text-blue-400 underline break-all"
                                                    >
                                                      View Image →
                                                    </a>
                                                  )}
                                                  {result.outputs.videoUrl && (
                                                    <a
                                                      href={result.outputs.videoUrl}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-[9px] text-blue-400/60 hover:text-blue-400 underline break-all"
                                                    >
                                                      View Video →
                                                    </a>
                                                  )}
                                                  {result.outputs.croppedImageUrl && (
                                                    <a
                                                      href={result.outputs.croppedImageUrl}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-[9px] text-blue-400/60 hover:text-blue-400 underline break-all"
                                                    >
                                                      View Cropped Image →
                                                    </a>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
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
        `}
        </style>
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
    running: { bg: 'rgba(59,130,246,0.1)', dot: 'bg-blue-500', label: 'Running', text: 'text-blue-400' },
    success: { bg: 'rgba(16,185,129,0.1)', dot: 'bg-emerald-500', label: 'Success', text: 'text-emerald-400' },
    failed: { bg: 'rgba(244,63,94,0.1)', dot: 'bg-rose-500', label: 'Failed', text: 'text-rose-400' },
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
  if (status === 'failed') return <XCircle size={11} className="text-rose-500" />;
  if (status === 'running') return <Loader2 size={11} className="text-blue-500 animate-spin" />;
  return <Clock size={11} className="text-white/20" />;
}