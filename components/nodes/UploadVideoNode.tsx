'use client';

import { memo, useRef } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { UploadVideoNodeData } from '@/lib/types';
import { useWorkflowStore } from '@/lib/store';
import { Video, Upload, X, Loader2 } from 'lucide-react';

export const UploadVideoNode = memo(({ id, data }: NodeProps<Node<UploadVideoNodeData>>) => {
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

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();

      updateNodeData(id, {
        videoUrl: url,
        videoPreview: URL.createObjectURL(file),
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
        border: data.status === 'running' ? '1.5px solid rgba(236, 72, 153, 0.6)' :
                data.status === 'success' ? '1.5px solid rgba(16, 185, 129, 0.5)' :
                data.status === 'error' ? '1.5px solid rgba(239, 68, 68, 0.5)' :
                '1.5px solid rgba(236, 72, 153, 0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(236, 72, 153, 0.05))' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(236, 72, 153, 0.2)' }}
          >
            <Video size={14} className="text-pink-400" />
          </div>
          <span className="font-semibold text-xs text-gray-200 tracking-wide">Upload Video</span>
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
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {data.videoPreview ? (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-white/10">
              <video
                src={data.videoPreview}
                className="w-full h-28 object-cover"
                controls
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-[10px] py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-all"
            >
              Change Video
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={data.status === 'running'}
            className="w-full py-6 rounded-lg border-2 border-dashed border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 hover:border-pink-500/40 transition-all flex flex-col items-center gap-2 group"
          >
            {data.status === 'running' ? (
              <Loader2 size={20} className="text-pink-400 animate-spin" />
            ) : (
              <Upload size={20} className="text-pink-400 group-hover:scale-110 transition-transform" />
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
        className="!w-3 !h-3 !bg-pink-500 !border-2 !border-pink-300/50"
        id="video-output"
      />
    </div>
  );
});

UploadVideoNode.displayName = 'UploadVideoNode';
