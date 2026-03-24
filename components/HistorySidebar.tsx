'use client';

import { useEffect, useState } from 'react';
import { useWorkflowStore } from '@/lib/store';
import { useUser } from '@clerk/nextjs';
import { formatDistanceToNow } from 'date-fns';
import { Clock, CheckCircle, XCircle, Loader2, History, ChevronRight, Zap } from 'lucide-react';

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 size={12} className="text-zinc-500 animate-spin shrink-0" />;
      case 'success': return <CheckCircle size={12} className="text-emerald-500 shrink-0" />;
      case 'failed':  return <XCircle size={12} className="text-red-500 shrink-0" />;
      default:        return <Clock size={12} className="text-zinc-600 shrink-0" />;
    }
  };

  return (
    // Root: fixed width, hard clamp, no overflow
    <div
      className="h-full flex flex-col bg-[#09090b] border-l border-zinc-900 select-none"
      style={{ width: '320px', maxWidth: '320px', overflow: 'hidden' }}
    >
      {/* Header */}
      <div className="px-4 h-11 flex items-center justify-between border-b border-zinc-900 shrink-0 bg-[#0c0c0e]">
        <div className="flex items-center gap-2">
          <History size={14} className="text-zinc-500 shrink-0" />
          <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-tight">History</span>
        </div>
        <span className="text-[10px] text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900/50 shrink-0">
          {executions.length} Runs
        </span>
      </div>

      {/* Scroll container — native, no shadcn ScrollArea */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ width: '320px', maxWidth: '320px' }}
      >
        <div className="p-2 space-y-1" style={{ width: '304px' /* 320 - 2*8px padding */ }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={18} className="text-zinc-700 animate-spin" />
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Synchronizing...</span>
            </div>
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30 grayscale">
              <Zap size={24} className="text-zinc-800 mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No Activity</p>
            </div>
          ) : (
            executions.map((execution) => (
              <div
                key={execution.id}
                className={`rounded-md transition-all border ${
                  currentExecution?.id === execution.id
                    ? 'bg-zinc-900/50 border-zinc-700'
                    : 'bg-transparent border-transparent hover:bg-zinc-900/30 hover:border-zinc-800'
                }`}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <button
                  onClick={() => handleSelectExecution(execution.id)}
                  className="w-full p-2.5 text-left"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {getStatusIcon(execution.status)}
                      <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                        {execution.scope}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {execution.durationMs && (
                        <span className="text-[10px] text-zinc-600 font-mono">
                          {(execution.durationMs / 1000).toFixed(1)}s
                        </span>
                      )}
                      <ChevronRight
                        size={12}
                        className={`text-zinc-700 transition-transform duration-300 ${
                          currentExecution?.id === execution.id ? 'rotate-90 text-zinc-400' : ''
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500 font-medium truncate">
                      {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
                    </span>
                    {isFetchingDetail === execution.id && (
                      <Loader2 size={10} className="animate-spin text-purple-500 shrink-0 ml-2" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {currentExecution?.id === execution.id && (
                  <div
                    className="border-t border-zinc-800 px-2 pb-2 pt-2 space-y-1"
                    style={{ width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}
                  >
                    {!currentExecution.nodeResults ? (
                      <div className="py-4 flex justify-center">
                        <Loader2 size={12} className="animate-spin text-zinc-700" />
                      </div>
                    ) : (
                      <>
                        <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 px-1">
                          Node Activity
                        </div>
                        {Object.entries(currentExecution.nodeResults as Record<string, any>).map(([nodeId, result]) => (
                          <div
                            key={nodeId}
                            className="p-2 rounded bg-zinc-950/50 border border-zinc-900 flex flex-col gap-1"
                            style={{ width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              {/* Node ID — truncate long names */}
                              <span
                                className="text-[10px] font-semibold text-zinc-400"
                                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}
                              >
                                {nodeId}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[9px] text-zinc-700 font-mono whitespace-nowrap">
                                  {result.executionTime}ms
                                </span>
                                {getStatusIcon(result.status)}
                              </div>
                            </div>

                            {result.outputs && (
                              <div
                                className="text-[10px] text-zinc-500 bg-[#050505] p-1.5 rounded border border-zinc-900/50 mt-1"
                                style={{ overflow: 'hidden', wordBreak: 'break-word' }}
                              >
                                {result.outputs.text && (
                                  <span className="italic block leading-relaxed">
                                    &quot;{result.outputs.text.substring(0, 60)}{result.outputs.text.length > 60 ? '...' : ''}&quot;
                                  </span>
                                )}
                                {result.outputs.frameUrl && (
                                  <span className="text-zinc-400 block">↳ Frame Processed</span>
                                )}
                                {result.outputs.croppedImageUrl && (
                                  <span className="text-zinc-400 block">↳ Crop Created</span>
                                )}
                              </div>
                            )}

                            {result.error && (
                              <div
                                className="text-[9px] text-red-400/80 bg-red-950/20 px-1.5 py-1 rounded border border-red-900/20 mt-1"
                                style={{ overflow: 'hidden', wordBreak: 'break-word' }}
                              >
                                {result.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}