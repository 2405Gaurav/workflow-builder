'use client';

import { memo, useRef } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { UploadImageNodeData } from '@/lib/types';
import { useWorkflowStore } from '@/lib/store';
import { ImageIcon, Upload, X, Loader2 } from 'lucide-react';

export const UploadImageNode = memo(({ id, data }: NodeProps<Node<UploadImageNodeData>>) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    updateNodeData(id, { status: 'running' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();

      updateNodeData(id, {
        imageUrl: url,
        imagePreview: URL.createObjectURL(file),
        status: 'success',
      });
    } catch (error) {
      updateNodeData(id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  };

  const statusClass =
    data.status === 'running' ? 'node-running' :
    data.status === 'success' ? 'node-success' :
    data.status === 'error' ? 'node-error' :
    'node-idle';

  return (
    <div className={`rounded-xl min-w-[260px] overflow-hidden ${statusClass}`}
      style={{
        background: 'linear-gradient(145deg, rgba(30, 30, 40, 0.95), rgba(20, 20, 30, 0.98))',
        border: data.status === 'running' ? '1.5px solid rgba(168, 85, 247, 0.6)' :
                data.status === 'success' ? '1.5px solid rgba(16, 185, 129, 0.5)' :
                data.status === 'error' ? '1.5px solid rgba(239, 68, 68, 0.5)' :
                '1.5px solid rgba(168, 85, 247, 0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05))' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(168, 85, 247, 0.2)' }}
          >
            <ImageIcon size={14} className="text-purple-400" />
          </div>
          <span className="font-semibold text-xs text-gray-200 tracking-wide">Upload Image</span>
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {data.imagePreview ? (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-white/10">
              <img
                src={data.imagePreview}
                alt="Preview"
                className="w-full h-28 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-[10px] py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-all"
            >
              Change Image
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={data.status === 'running'}
            className="w-full py-6 rounded-lg border-2 border-dashed border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all flex flex-col items-center gap-2 group"
          >
            {data.status === 'running' ? (
              <Loader2 size={20} className="text-purple-400 animate-spin" />
            ) : (
              <Upload size={20} className="text-purple-400 group-hover:scale-110 transition-transform" />
            )}
            <span className="text-[10px] text-gray-500 group-hover:text-gray-300 transition-colors">
              Drop or click to upload
            </span>
          </button>
        )}

        {data.status === 'error' && data.error && (
          <div className="mt-2 text-[10px] text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
            {data.error}
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-purple-300/50"
        id="image-output"
      />
    </div>
  );
});

UploadImageNode.displayName = 'UploadImageNode';
