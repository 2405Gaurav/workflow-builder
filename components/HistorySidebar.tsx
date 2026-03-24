'use client';

import { useEffect, useState } from 'react';
import { useWorkflowStore } from '@/lib/store';
import { useUser } from '@clerk/nextjs';
import { formatDistanceToNow } from 'date-fns';
import { Clock, CheckCircle, XCircle, Loader2, History, ChevronRight, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function HistorySidebar() {
  const { user } = useUser();
  const { executions, currentExecution, setCurrentExecution, setExecutions } = useWorkflowStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDetail, setIsFetchingDetail] = useState<string | null>(null);

  // 1. Fetch lightweight executions (metadata only)
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

  // 2. Fetch full details (heavy data) on click
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
      case 'running':
        return <Loader2 size={14} className="text-blue-400 animate-spin" />;
      case 'success':
        return <CheckCircle size={14} className="text-emerald-400" />;
      case 'failed':
        return <XCircle size={14} className="text-red-400" />;
      default:
        return <Clock size={14} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'rgba(59, 130, 246, 0.15)';
      case 'success': return 'rgba(16, 185, 129, 0.15)';
      case 'failed': return 'rgba(239, 68, 68, 0.15)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  };

  const getScopeBadge = (scope: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      full: { bg: 'rgba(124, 58, 237, 0.15)', text: 'text-purple-400', border: 'border-purple-500/20' },
      partial: { bg: 'rgba(59, 130, 246, 0.15)', text: 'text-blue-400', border: 'border-blue-500/20' },
      single: { bg: 'rgba(249, 115, 22, 0.15)', text: 'text-orange-400', border: 'border-orange-500/20' },
    };
    const color = colors[scope] || colors.full;
    const labels: Record<string, string> = { full: 'Full Run', partial: 'Partial', single: 'Single' };

    return (
      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${color.text} border ${color.border}`}
        style={{ background: color.bg }}
      >
        {labels[scope] || scope}
      </span>
    );
  };

  return (
    <div className="w-80 flex flex-col glass animate-slide-in-right h-full overflow-hidden"
      style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2 shrink-0">
        <History size={16} className="text-gray-400" />
        <h2 className="text-sm font-bold text-gray-200 tracking-wide">Execution History</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 size={20} className="text-gray-500 animate-spin" />
              <span className="text-xs text-gray-500">Loading history...</span>
            </div>
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <History size={20} className="text-gray-600" />
              <p className="text-xs text-gray-400">No executions yet</p>
            </div>
          ) : (
            executions.map((execution, index) => (
              <div
                key={execution.id}
                className={`w-full text-left rounded-xl transition-all duration-200 overflow-hidden animate-fade-in border ${
                  currentExecution?.id === execution.id 
                    ? 'bg-purple-500/10 border-purple-500/30' 
                    : 'bg-white/[0.03] border-white/[0.06]'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <button
                  onClick={() => handleSelectExecution(execution.id)}
                  className="w-full p-3 text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      {getScopeBadge(execution.scope)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* FIXED: Using snake_case duration_ms */}
                      {execution.duration_ms && (
                        <span className="text-[10px] text-gray-500 font-mono">
                          {(execution.duration_ms / 1000).toFixed(1)}s
                        </span>
                      )}
                      {isFetchingDetail === execution.id ? (
                        <Loader2 size={12} className="animate-spin text-purple-400" />
                      ) : (
                        <ChevronRight
                          size={12}
                          className={`text-gray-600 transition-transform ${
                            currentExecution?.id === execution.id ? 'rotate-90' : ''
                          }`}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Clock size={10} />
                    {/*  */}
                    {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
                  </div>
                </button>

                {currentExecution?.id === execution.id && (
                  <div className="px-3 pb-3 border-t border-white/5 pt-2 space-y-1.5">
                    {/* FIXED: Using snake_case node_results */}
                    {!currentExecution.node_results ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 size={14} className="animate-spin text-gray-600" />
                      </div>
                    ) : (
                      <>
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-medium mb-2">
                          Node Results
                        </p>
                        {Object.entries(currentExecution.node_results as Record<string, any>).map(([nodeId, result]) => (
                          <div
                            key={nodeId}
                            className="rounded-lg p-2 transition-colors"
                            style={{ background: getStatusColor(result.status) }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-medium text-gray-300 truncate max-w-[140px]">
                                {nodeId}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-gray-500 font-mono">
                                  {result.executionTime}ms
                                </span>
                                {getStatusIcon(result.status)}
                              </div>
                            </div>

                            {result.outputs && (
                              <div className="text-[9px] text-gray-500 truncate mt-1">
                                {result.outputs.text && (
                                  // FIXED: Escaped quotes for ESLint
                                  <span className="block italic">&quot;{result.outputs.text.substring(0, 40)}...&quot;</span>
                                )}
                                {result.outputs.frameUrl && <span className="block text-purple-400">🖼️ Frame Extracted</span>}
                                {result.outputs.croppedImageUrl && <span className="block text-blue-400">✂️ Image Cropped</span>}
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
      </ScrollArea>
    </div>
  );
}