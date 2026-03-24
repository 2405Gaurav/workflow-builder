'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { TextNodeData } from '@/lib/types';
import { useWorkflowStore } from '@/lib/store';
import { FileText, X, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export const TextNode = memo(({ id, data }: NodeProps<Node<TextNodeData>>) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);

  const statusDotColor =
    data.status === 'running' ? 'bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]' :
    data.status === 'success' ? 'bg-green-500' :
    data.status === 'error'   ? 'bg-red-500' :
    'bg-yellow-400/50 shadow-[0_0_8px_rgba(234,179,8,0.3)]';

  const wrapperClass =
    data.status === 'running'
      ? 'border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse'
      : data.status === 'error'
      ? 'border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.35)]'
      : data.status === 'success'
      ? 'border-green-500/30'
      : 'border-white/10';

  return (
    <div className={`bg-[#1a1a1a] border rounded-xl shadow-2xl min-w-[280px] overflow-hidden group transition-all duration-300 ${wrapperClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusDotColor} transition-colors duration-500`} />
          <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Prompt / Text</span>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 transition-all"
        >
          <X size={12} className="text-white/40 hover:text-white" />
        </button>
      </div>

      {/* Error banner */}
      {data.status === 'error' && data.error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border-b border-red-500/20">
          <AlertCircle size={12} className="text-red-400 shrink-0" />
          <span className="text-[10px] text-red-400 font-medium truncate">{data.error}</span>
        </div>
      )}

      {/* Body */}
      <div className="p-3 bg-[#1a1a1a]">
        <div className="relative group/input">
          <Textarea
            value={data.text || ''}
            onChange={(e) => updateNodeData(id, { text: e.target.value })}
            placeholder="A cinematic shot of..."
            className="text-[12px] leading-relaxed resize-none bg-[#0d0d0d] border-white/5 text-white/90 placeholder:text-white/20 focus:border-yellow-500/30 focus:ring-0 rounded-lg min-h-[80px] transition-all"
            rows={4}
          />
          <div className="absolute top-2 right-2 opacity-20 group-focus-within/input:opacity-50 transition-opacity">
            <FileText size={10} className="text-white" />
          </div>
        </div>

        {/* Footer Metadata */}
        {data.executionTime && (
          <div className="mt-3">
            <span className="text-[9px] text-white/30 font-mono tracking-tighter">
              EXEC: {data.executionTime}ms
            </span>
          </div>
        )}
      </div>

      {/* Output Handle — larger yellow dot */}
      <Handle
        type="source"
        position={Position.Right}
        id="text-output"
        className="!w-3.5 !h-3.5 !bg-[#eab308] !border-2 !border-[#1a1a1a] !-right-2 hover:!scale-150 transition-transform cursor-crosshair"
      />
    </div>
  );
});

TextNode.displayName = 'TextNode';