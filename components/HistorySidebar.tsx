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

  // Fetch executions from the server on mount
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
    <div className="w-80 flex flex-col glass animate-slide-in-right"
      style={{
        borderLeft: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <History size={16} className="text-gray-400" />
        <h2 className="text-sm font-bold text-gray-200 tracking-wide">Execution History</h2>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 size={20} className="text-gray-500 animate-spin" />
              <span className="text-xs text-gray-500">Loading history...</span>
            </div>
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <History size={20} className="text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">No executions yet</p>
                <p className="text-[10px] text-gray-600 mt-1">Run your workflow to see history</p>
              </div>
            </div>
          ) : (
            executions.map((execution, index) => (
              <button
                key={execution.id}
                onClick={() => setCurrentExecution(
                  currentExecution?.id === execution.id ? null : execution
                )}
                className={`w-full text-left rounded-xl transition-all duration-200 overflow-hidden animate-fade-in`}
                style={{
                  background: currentExecution?.id === execution.id
                    ? 'rgba(124, 58, 237, 0.1)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: currentExecution?.id === execution.id
                    ? '1px solid rgba(124, 58, 237, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="p-3">
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      {getScopeBadge(execution.scope)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {execution.duration_ms && (
                        <span className="text-[10px] text-gray-500 font-mono">
                          {(execution.duration_ms / 1000).toFixed(1)}s
                        </span>
                      )}
                      <ChevronRight
                        size={12}
                        className={`text-gray-600 transition-transform ${
                          currentExecution?.id === execution.id ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Clock size={10} />
                    {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
                  </div>

                  {/* Error message */}
                  {execution.error_message && (
                    <div className="mt-2 flex items-start gap-1.5 text-[10px] text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/15">
                      <AlertCircle size={12} className="shrink-0 mt-0.5" />
                      <span>{execution.error_message}</span>
                    </div>
                  )}
                </div>

                {/* Expanded: Node Results */}
                {currentExecution?.id === execution.id && execution.node_results && (
                  <div className="px-3 pb-3 border-t border-white/5 pt-2 space-y-1.5">
                    <p className="text-[9px] uppercase tracking-wider text-gray-500 font-medium mb-2">
                      Node Results
                    </p>
                    {Object.entries(execution.node_results).map(([nodeId, result]) => (
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

                        {/* Show outputs preview */}
                        {result.outputs && (
                          <div className="text-[9px] text-gray-500 truncate mt-1">
                            {result.outputs.text && (
                              <span>📝 {result.outputs.text.substring(0, 60)}...</span>
                            )}
                            {result.outputs.imageUrl && (
                              <span>🖼️ Image output</span>
                            )}
                            {result.outputs.videoUrl && (
                              <span>🎥 Video output</span>
                            )}
                          </div>
                        )}

                        {result.error && (
                          <div className="text-[9px] text-red-400 mt-1 truncate">
                            ❌ {result.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
