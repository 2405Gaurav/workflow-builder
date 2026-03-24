'use client';

import { memo, useRef } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { UploadVideoNodeData } from '@/lib/types';
import { useWorkflowStore } from '@/lib/store';
import { Upload, X, Loader2, Film, AlertCircle } from 'lucide-react';

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
    <div className={`bg-[#1a1a1a] border rounded-xl shadow-2xl min-w-[280px] max-w-[320px] overflow-hidden group transition-all duration-300 ${wrapperClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#1a1a1a] sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusDotColor} transition-colors duration-500`} />
          <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Video Asset</span>
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

      {/* Scrollable Body */}
      <div className="max-h-[450px] overflow-y-auto flex flex-col
        [&::-webkit-scrollbar]:w-1
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-white/10
        [&::-webkit-scrollbar-thumb]:rounded-full">

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Playable Hero Area */}
        <div className="bg-[#0d0d0d] min-h-[160px] relative flex flex-col items-center justify-center group/video-container">
          {data.videoPreview ? (
            <div className="w-full relative">
              <video
                src={data.videoPreview}
                className="w-full h-44 object-cover"
                controls
                playsInline
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover/video-container:opacity-100 transition-opacity z-20">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-black/80 text-white text-[9px] font-bold rounded-full border border-white/10 backdrop-blur-md uppercase tracking-tighter"
                >
                  Change Source
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={data.status === 'running'}
              className="flex flex-col items-center gap-3 text-white/50 hover:text-white/70 p-10 transition-colors"
            >
              {data.status === 'running' ? (
                <Loader2 size={32} strokeWidth={1.5} className="animate-spin text-yellow-500" />
              ) : (
                <>
                  <Upload size={32} strokeWidth={1} />
                  <span className="text-[9px] uppercase tracking-widest font-bold text-center">Drop or Upload Video</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Info & Settings Area */}
        <div className="p-3 bg-[#161616] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Film size={10} className="text-white/50" />
              <span className="text-[9px] text-white/50 uppercase font-mono tracking-tighter truncate max-w-[150px]">
                {data.videoUrl ? 'Source_Output.mp4' : 'No Media Detected'}
              </span>
            </div>
            {data.status === 'success' && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-sm bg-green-500/10 text-green-500 border border-green-500/20 font-bold uppercase">Ready</span>
            )}
          </div>

          {data.executionTime && (
            <div className="text-[9px] text-white/30 font-mono italic">
              Processed in {data.executionTime}ms
            </div>
          )}
        </div>
      </div>

      {/* Output Handle — larger yellow dot */}
      <Handle
        type="source"
        position={Position.Right}
        id="video-output"
        className="!w-3.5 !h-3.5 !bg-[#eab308] !border-2 !border-[#1a1a1a] !-right-2 hover:!scale-150 transition-transform cursor-crosshair"
      />
    </div>
  );
});

UploadVideoNode.displayName = 'UploadVideoNode';