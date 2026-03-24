'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { TextNodeData } from '@/lib/types';
import { useWorkflowStore } from '@/lib/store';
import { FileText, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export const TextNode = memo(({ id, data }: NodeProps<Node<TextNodeData>>) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);

  const statusClass =
    data.status === 'running' ? 'node-running' :
    data.status === 'success' ? 'node-success' :
    data.status === 'error' ? 'node-error' :
    'node-idle';

  return (
    <div className={`rounded-xl min-w-[260px] overflow-hidden ${statusClass}`}
      style={{
        background: 'linear-gradient(145deg, rgba(30, 30, 40, 0.95), rgba(20, 20, 30, 0.98))',
        border: data.status === 'running' ? '1.5px solid rgba(59, 130, 246, 0.6)' :
                data.status === 'success' ? '1.5px solid rgba(16, 185, 129, 0.5)' :
                data.status === 'error' ? '1.5px solid rgba(239, 68, 68, 0.5)' :
                '1.5px solid rgba(59, 130, 246, 0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(59, 130, 246, 0.2)' }}
          >
            <FileText size={14} className="text-blue-400" />
          </div>
          <span className="font-semibold text-xs text-gray-200 tracking-wide">Text</span>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <X size={12} className="text-gray-500" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3">
        <Textarea
          value={data.text || ''}
          onChange={(e) => updateNodeData(id, { text: e.target.value })}
          placeholder="Enter text..."
          className="text-xs resize-none bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
          rows={3}
        />

        {data.status === 'error' && data.error && (
          <div className="mt-2 text-[10px] text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
            {data.error}
          </div>
        )}

        {data.executionTime && (
          <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-1">
            ⚡ {data.executionTime}ms
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-blue-300/50"
        id="text-output"
      />
    </div>
  );
});

TextNode.displayName = 'TextNode';
