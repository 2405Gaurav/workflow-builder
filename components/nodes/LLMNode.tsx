'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { LLMNodeData } from '@/lib/types';
import { useWorkflowStore } from '@/lib/store';
import { X, Sparkles, Cpu, MessageSquare, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const kreaScrollbar = `
  [&::-webkit-scrollbar]:w-3.5
  [&::-webkit-scrollbar-track]:bg-[#111]
  [&::-webkit-scrollbar-track]:rounded-r-lg
  [&::-webkit-scrollbar-thumb]:bg-[#555]
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:border-[3px]
  [&::-webkit-scrollbar-thumb]:border-solid
  [&::-webkit-scrollbar-thumb]:border-[#111]
  [&::-webkit-scrollbar-button]:block
  [&::-webkit-scrollbar-button]:bg-[#222]
  [&::-webkit-scrollbar-button]:h-1
`;

export const LLMNode = memo(({ id, data }: NodeProps<Node<LLMNodeData>>) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const isInputConnected = useWorkflowStore((state) => state.isInputConnected);

  const textConnected = isInputConnected(id, 'text-input');

  // Status-based class mapping
  const ringClass = 
    data.status === 'running' ? 'ring-running' :
    data.status === 'error' ? 'ring-error' :
    data.status === 'success' ? 'ring-success' : 
    'ring-idle';

  const statusDotClass = 
    data.status === 'running' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' :
    data.status === 'error' ? 'bg-red-500' :
    data.status === 'success' ? 'bg-green-500' :
    'bg-white/20';

  return (
    <>
      <style>{`
        @keyframes borderPulse {
          0%, 100% {
            box-shadow: 0 0 0 0px rgba(59,130,246,0), 0 0 12px 1px rgba(59,130,246,0.15);
            border-color: rgba(59,130,246,0.25);
          }
          50% {
            box-shadow: 0 0 0 2px rgba(59,130,246,0.18), 0 0 18px 3px rgba(59,130,246,0.25);
            border-color: rgba(59,130,246,0.7);
          }
        }
        .ring-running {
          border-color: rgba(59,130,246,0.4);
          animation: borderPulse 2.8s ease-in-out infinite;
        }
        .ring-error {
          border-color: rgba(239,68,68,0.7);
          box-shadow: 0 0 0 1.5px rgba(239,68,68,0.15), 0 0 16px 2px rgba(239,68,68,0.2);
        }
        .ring-success {
          border-color: rgba(34,197,94,0.35);
        }
        .ring-idle {
          border-color: rgba(255,255,255,0.10);
        }
      `}</style>

      <div className={`bg-[#1a1a1a] border rounded-xl shadow-2xl w-[340px] flex flex-col group transition-colors duration-500 ${ringClass}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#1a1a1a] rounded-t-xl z-20">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusDotClass} transition-colors duration-500`} />
            <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">LLM Node</span>
          </div>
          <button
            onClick={() => deleteNode(id)}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 transition-all"
          >
            <X size={12} className="text-white/40 hover:text-white" />
          </button>
        </div>

        {/* Error banner — below header, above content */}
        {data.status === 'error' && data.error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border-b border-red-500/20 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={12} className="text-red-400 shrink-0" />
            <span className="text-[10px] text-red-400 font-medium truncate">{data.error}</span>
          </div>
        )}

        {/* Main Node Body */}
        <div className={`flex-1 overflow-y-auto max-h-[600px] rounded-b-xl nodrag ${kreaScrollbar}`}>
          <div className="p-3 space-y-4">

            {/* Model Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-white/50">
                <Cpu size={10} className="text-white/50" />
                <label className="text-[9px] uppercase font-bold tracking-tight text-white/50">Model Architecture</label>
              </div>
              <Select
                value={data.model || 'gemini-2.5-flash'}
                onValueChange={(value) => updateNodeData(id, { model: value })}
              >
                <SelectTrigger className="h-8 bg-[#0d0d0d] border-white/5 text-white text-[11px] px-2 focus:ring-0 focus:border-yellow-500/30 rounded-md shadow-inner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                  <SelectItem value="gemini-2.5-flash" className="text-[11px]">Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="gemini-1.5-pro" className="text-[11px]">Gemini 1.5 Pro</SelectItem>
                  <SelectItem value="gemini-2.0-flash-exp" className="text-[11px]">Gemini 2.0 Flash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* System Prompt */}
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase text-white/40 font-bold tracking-tight px-1">Global Logic</label>
              <div
                className="nodrag nopan overflow-y-auto max-h-[120px] rounded-lg"
                onWheelCapture={(e) => e.stopPropagation()}
              >
                <Textarea
                  value={data.systemPrompt || ''}
                  onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value })}
                  className={`text-[11px] leading-relaxed resize-none bg-[#0d0d0d] border-white/5 text-white/70 placeholder:text-white/20 focus:ring-0 focus:border-emerald-500/20 rounded-lg w-full overflow-y-auto ${kreaScrollbar}`}
                  style={{ minHeight: '80px' }}
                />
              </div>
            </div>

            {/* User Prompt */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-white/50 px-1">
                <MessageSquare size={10} className="text-white/50" />
                <label className="text-[9px] uppercase font-bold tracking-tight text-white/50">User Prompt</label>
              </div>
              <div
                className="nodrag nopan overflow-y-auto max-h-[140px] rounded-lg"
                onWheelCapture={(e) => e.stopPropagation()}
              >
                <Textarea
                  value={data.userMessage || ''}
                  onChange={(e) => updateNodeData(id, { userMessage: e.target.value })}
                  placeholder={textConnected ? 'Receiving data stream...' : 'Describe the objective...'}
                  className={`text-[11px] leading-relaxed resize-none bg-[#0d0d0d] border-white/5 text-white/90 placeholder:text-white/20 focus:ring-0 focus:border-emerald-500/20 rounded-lg w-full overflow-y-auto ${kreaScrollbar}`}
                  style={{ minHeight: '96px' }}
                />
              </div>
            </div>

            {/* Output */}
            {data.result && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5 px-1">
                  <Sparkles size={10} className={`${data.status === 'running' ? 'animate-pulse' : ''} text-white/50`} />
                  <span className="text-[9px] uppercase font-bold tracking-widest text-white/50">Output Generation</span>
                </div>
                <div
                  className={`nodrag nopan text-[12px] bg-[#0d0d0d] border border-emerald-500/10 p-3 rounded-lg
                    whitespace-pre-wrap text-white/80 leading-relaxed shadow-inner
                    max-h-[300px] overflow-y-auto ${kreaScrollbar}`}
                  onWheelCapture={(e) => e.stopPropagation()}
                >
                  {data.result}
                </div>
              </div>
            )}

            {/* Execution time */}
            {data.executionTime && !data.error && (
              <div className="pt-2 border-t border-white/5">
                <span className="text-[9px] text-white/30 font-mono uppercase tracking-tighter">
                  Processed in {data.executionTime}ms
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Handles — larger yellow dots positioned correctly */}
        <Handle
          type="target"
          position={Position.Left}
          id="text-input"
          style={{ top: '140px' }}
          className="!w-3.5 !h-3.5 !-left-2 !bg-[#eab308] !border-2 !border-[#1a1a1a] !rounded-full !z-30"
        />
        <Handle
  type="target"
  position={Position.Left}
  id="system-prompt-input"
  style={{ top: '100px' }}
  className="!w-3.5 !h-3.5 !-left-2 !bg-[#eab308] !border-2 !border-[#1a1a1a] !rounded-full !z-30"
/>
        <Handle
          type="target"
          position={Position.Left}
          id="image-input"
          style={{ top: '220px' }}
          className="!w-3.5 !h-3.5 !-left-2 !bg-[#eab308] !border-2 !border-[#1a1a1a] !rounded-full !z-30"
        />
        <Handle
  type="target"
  position={Position.Left}
  id="image-input"
  style={{ top: '220px' }}
  className="!w-3.5 !h-3.5 !-left-2 !bg-[#eab308] !border-2 !border-[#1a1a1a] !rounded-full !z-30"
/>
<Handle
  type="target"
  position={Position.Left}
  id="image-input-2"
  style={{ top: '260px' }}  
  className="!w-3.5 !h-3.5 !-left-2 !bg-[#eab308] !border-2 !border-[#1a1a1a] !rounded-full !z-30"
/>
        <Handle
          type="source"
          position={Position.Right}
          id="text-output"
          style={{ top: '48px' }} // Top of node near header
          className="!w-3.5 !h-3.5 !-right-2 !bg-[#eab308] !border-2 !border-[#1a1a1a] !rounded-full !z-30"
        />
      </div>
    </>
  );
});

LLMNode.displayName = 'LLMNode';