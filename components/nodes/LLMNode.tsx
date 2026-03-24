'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { LLMNodeData } from '@/lib/types';
import { useWorkflowStore } from '@/lib/store';
import { Brain, X, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const LLMNode = memo(({ id, data }: NodeProps<Node<LLMNodeData>>) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const isInputConnected = useWorkflowStore((state) => state.isInputConnected);

  const textConnected = isInputConnected(id, 'text-input');
  const imageConnected = isInputConnected(id, 'image-input');

  const statusClass =
    data.status === 'running' ? 'node-running' :
    data.status === 'success' ? 'node-success' :
    data.status === 'error' ? 'node-error' :
    'node-idle';

  return (
    <div className={`rounded-xl min-w-[320px] max-w-[400px] overflow-hidden ${statusClass}`}
      style={{
        background: 'linear-gradient(145deg, rgba(30, 30, 40, 0.95), rgba(20, 20, 30, 0.98))',
        border: data.status === 'running' ? '1.5px solid rgba(16, 185, 129, 0.6)' :
                data.status === 'success' ? '1.5px solid rgba(16, 185, 129, 0.5)' :
                data.status === 'error' ? '1.5px solid rgba(239, 68, 68, 0.5)' :
                '1.5px solid rgba(16, 185, 129, 0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(16, 185, 129, 0.2)' }}
          >
            <Brain size={14} className="text-emerald-400" />
          </div>
          <span className="font-semibold text-xs text-gray-200 tracking-wide">LLM Node</span>
          {data.status === 'running' && (
            <Sparkles size={12} className="text-emerald-400 animate-pulse" />
          )}
        </div>
        <button
          onClick={() => deleteNode(id)}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <X size={12} className="text-gray-500" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2.5">
        {/* Model Selector */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Model</label>
          <Select
            value={data.model || 'gemini-1.5-flash'}
            onValueChange={(value) => updateNodeData(id, { model: value })}
          >
            <SelectTrigger className="text-xs h-8 bg-white/5 border-white/10 text-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/10">
              <SelectItem value="gemini-1.5-flash" className="text-gray-200 focus:bg-white/10">Gemini 1.5 Flash</SelectItem>
              <SelectItem value="gemini-1.5-pro" className="text-gray-200 focus:bg-white/10">Gemini 1.5 Pro</SelectItem>
              <SelectItem value="gemini-2.0-flash-exp" className="text-gray-200 focus:bg-white/10">Gemini 2.5 Flash (Exp)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* System Prompt */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">System Prompt</label>
          <Textarea
            value={data.systemPrompt || ''}
            onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value })}
            placeholder="You are a helpful assistant..."
            className="text-xs resize-none h-16 bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
            rows={2}
          />
        </div>

        {/* User Message */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">User Message</label>
            {textConnected && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Connected
              </span>
            )}
          </div>
          <Textarea
            value={data.userMessage || ''}
            onChange={(e) => updateNodeData(id, { userMessage: e.target.value })}
            placeholder={textConnected ? 'Receiving input from connected node...' : 'Enter your prompt...'}
            className="text-xs resize-none bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
            rows={3}
          />
        </div>

        {/* Image connection indicator */}
        {imageConnected && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
            <span className="text-[9px] text-purple-400">Image input connected</span>
          </div>
        )}

        {/* Result - Rendered inside node */}
        {data.result && (
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium flex items-center gap-1">
              <Sparkles size={10} />
              Result
            </label>
            <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap text-gray-200 leading-relaxed">
              {data.result}
            </div>
          </div>
        )}

        {data.status === 'error' && data.error && (
          <div className="text-[10px] text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
            {data.error}
          </div>
        )}

        {data.executionTime && (
          <div className="text-[10px] text-gray-500 flex items-center gap-1">
            ⚡ {data.executionTime}ms
          </div>
        )}
      </div>

      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="text-input"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-blue-300/50"
        style={{ top: '35%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="image-input"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-purple-300/50"
        style={{ top: '55%' }}
      />

      {/* Handle labels */}
      <div className="absolute left-3 text-[8px] text-blue-400/70 font-medium" style={{ top: 'calc(35% - 8px)' }}>
        text
      </div>
      <div className="absolute left-3 text-[8px] text-purple-400/70 font-medium" style={{ top: 'calc(55% - 8px)' }}>
        image
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-emerald-300/50"
        id="text-output"
      />
    </div>
  );
});

LLMNode.displayName = 'LLMNode';
