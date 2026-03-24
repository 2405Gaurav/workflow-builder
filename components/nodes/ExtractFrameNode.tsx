'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { ExtractFrameNodeData } from '@/lib/types';
import { useWorkflowStore } from '@/lib/store';
import { Film, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export const ExtractFrameNode = memo(({ id, data }: NodeProps<Node<ExtractFrameNodeData>>) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const isInputConnected = useWorkflowStore((state) => state.isInputConnected);

  const videoConnected = isInputConnected(id, 'default');

  const statusClass =
    data.status === 'running' ? 'node-running' :
    data.status === 'success' ? 'node-success' :
    data.status === 'error' ? 'node-error' :
    'node-idle';

  return (
    <div className={`rounded-xl min-w-[260px] overflow-hidden ${statusClass}`}
      style={{
        background: 'linear-gradient(145deg, rgba(30, 30, 40, 0.95), rgba(20, 20, 30, 0.98))',
        border: data.status === 'running' ? '1.5px solid rgba(6, 182, 212, 0.6)' :
                data.status === 'success' ? '1.5px solid rgba(16, 185, 129, 0.5)' :
                data.status === 'error' ? '1.5px solid rgba(239, 68, 68, 0.5)' :
                '1.5px solid rgba(6, 182, 212, 0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05))' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(6, 182, 212, 0.2)' }}
          >
            <Film size={14} className="text-cyan-400" />
          </div>
          <span className="font-semibold text-xs text-gray-200 tracking-wide">Extract Frame</span>
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
        {/* Connection indicator */}
        {videoConnected && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20">
            <div className="w-2 h-2 rounded-full bg-pink-400"></div>
            <span className="text-[9px] text-pink-400">Video input connected</span>
          </div>
        )}

        {/* Timestamp */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Timestamp (sec)</label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={data.timestamp || 0}
            onChange={(e) => updateNodeData(id, { timestamp: Number(e.target.value) })}
            className="text-xs h-8 bg-white/5 border-white/10 text-gray-200 focus:border-cyan-500/50 focus:ring-cyan-500/20"
            placeholder="e.g., 2.5"
          />
        </div>

        {/* Extracted frame result */}
        {data.extractedFrameUrl && (
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-cyan-400 font-medium">Extracted Frame</label>
            <div className="rounded-lg overflow-hidden border border-white/10">
              <img
                src={data.extractedFrameUrl}
                alt="Extracted frame"
                className="w-full h-24 object-cover"
              />
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

      {/* Input Handle (video) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-pink-500 !border-2 !border-pink-300/50"
      />

      {/* Output Handle (image) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-cyan-300/50"
        id="image-output"
      />
    </div>
  );
});

ExtractFrameNode.displayName = 'ExtractFrameNode';
