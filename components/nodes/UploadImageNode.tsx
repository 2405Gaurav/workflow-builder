'use client';

import { memo, useRef } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { UploadImageNodeData } from '@/lib/types';
import { useWorkflowStore } from '@/lib/store';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

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
      const response = await fetch('/api/upload/image', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      const { url } = await response.json();
      updateNodeData(id, { imageUrl: url, imagePreview: URL.createObjectURL(file), status: 'success' });
    } catch (error) {
      updateNodeData(id, { status: 'error', error: error instanceof Error ? error.message : 'Upload failed' });
    }
  };

  const statusDotColor =
    data.status === 'running' ? 'bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]' :
    data.status === 'success' ? 'bg-green-500' :
    data.status === 'error'   ? 'bg-red-500' :
    'bg-white/20';

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
          <div className={`w-2 h-2 rounded-full ${statusDotColor}`} />
          <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Image Asset</span>
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

      {/* Preview / Upload area */}
      <div className="flex flex-col">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        <div className="bg-[#0d0d0d] min-h-[160px] relative flex flex-col items-center justify-center group/preview">
          {data.imagePreview ? (
            <div className="w-full h-full relative">
              <Image
                src={data.imagePreview}
                alt="Asset Preview"
                width={280}
                height={176}
                unoptimized
                className="w-full h-44 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white text-black text-[10px] font-bold rounded-full uppercase"
                >
                  Replace
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={data.status === 'running'}
              className="flex flex-col items-center gap-3 text-white/50 hover:text-white/70 p-10 transition-colors"
            >
              {data.status === 'running'
                ? <Loader2 size={32} className="animate-spin text-yellow-500" />
                : <Upload size={32} strokeWidth={1} />
              }
              <span className="text-[9px] uppercase tracking-widest font-bold">Upload Image</span>
            </button>
          )}
        </div>
      </div>

      {/* Output handle — larger yellow dot */}
      <Handle
        type="source"
        position={Position.Right}
        id="image-output"
        className="!w-3.5 !h-3.5 !bg-[#eab308] !border-2 !border-[#1a1a1a] !-right-2"
      />
    </div>
  );
});
UploadImageNode.displayName = 'UploadImageNode';