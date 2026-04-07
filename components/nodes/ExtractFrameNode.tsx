'use client';

import { memo, useState } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { ExtractFrameNodeData } from '@/lib/types';
import { useWorkflowStore } from '@/lib/store';
import { X, Clock, Scissors, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Play } from 'lucide-react';

export const ExtractFrameNode = memo(({ id, data }: NodeProps<Node<ExtractFrameNodeData>>) => {
  // tracks if the output url was just copyed to clipboard
  const [copied, setCopied] = useState(false);
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const isInputConnected = useWorkflowStore((state) => state.isInputConnected);
  const executeExtractFrame = useWorkflowStore((state) => state.executeExtractFrame);

  const videoConnected = isInputConnected(id, 'default');

  const statusDotColor =
    data.status === 'running' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' :
    data.status === 'success' ? 'bg-green-500' :
    data.status === 'error'   ? 'bg-red-500' :
    'bg-white/20';

  const ringClass =
    data.status === 'running' ? 'ring-running' :
    data.status === 'error'   ? 'ring-error'   :
    data.status === 'success' ? 'ring-success'  :
    'ring-idle';

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

      <div className={`bg-[#1a1a1a] border rounded-xl shadow-2xl min-w-[280px] max-w-[320px] overflow-hidden group transition-colors duration-500 ${ringClass}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#1a1a1a] sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${statusDotColor}`} />
            <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Extract Frame</span>
          </div>
          <button
            onClick={() => deleteNode(id)}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 transition-all"
          >
            <X size={12} className="text-white/40 hover:text-white" />
          </button>
        </div>

        {/* Error — inline on this node only */}
        {data.status === 'error' && data.error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border-b border-red-500/20">
            <AlertCircle size={12} className="text-red-400 shrink-0" />
            <span className="text-[10px] text-red-400 font-medium truncate">{data.error}</span>
          </div>
        )}

        <div className="max-h-[450px] overflow-y-auto flex flex-col [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Preview area */}
          <div className="bg-[#0d0d0d] min-h-[140px] flex items-center justify-center border-b border-white/5 relative">
            {data.extractedFrameUrl ? (
              <Image
                src={data.extractedFrameUrl}
                alt="Extracted Frame"
                width={320}
                height={160}
                unoptimized
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/20 p-10">
                <Scissors size={32} strokeWidth={1} />
                <span className="text-[9px] uppercase tracking-widest font-bold">Awaiting extraction</span>
              </div>
            )}
          </div>

          {/* output URL link - only shows when we have a frame extracted */}
          {data.extractedFrameUrl && (
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 bg-[#0d0d0d]">
              {/* clickable link to open the image in a new tab */}
              <a
                href={data.extractedFrameUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 min-w-0 flex-1 text-white/30 hover:text-blue-400 transition-colors group/link"
                title={data.extractedFrameUrl}
              >
                <ExternalLink size={9} className="shrink-0" />
                <span className="mono text-[9px] truncate group-hover/link:text-blue-400">
                  {data.extractedFrameUrl.replace(/^https?:\/\//, '').slice(0, 30)}…
                </span>
              </a>
              {/* copy url to clipboard */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(data.extractedFrameUrl!);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="shrink-0 p-1 text-white/20 hover:text-white/60 hover:bg-white/5 rounded transition-all"
                title="Copy URL"
              >
                {copied ? <Check size={9} className="text-emerald-400" /> : <Copy size={9} />}
              </button>
            </div>
          )}

          {/* Settings area */}
        <div className="p-3 bg-[#161616] space-y-4">
  <div className={`text-[8px] px-2 py-1 rounded border inline-block font-bold tracking-tighter ${
    videoConnected
      ? 'border-pink-500/30 text-pink-400 bg-pink-500/5'
      : 'border-white/10 text-white/40 bg-white/5'
  }`}>
    {videoConnected ? 'VIDEO INPUT CONNECTED' : 'NO VIDEO SOURCE'}
  </div>

  <div className="space-y-1.5">
    <div className="flex items-center gap-1.5 text-white/50">
      <Clock size={10} />
      <label className="text-[9px] uppercase font-bold">Time Offset (Sec)</label>
    </div>
    <Input
      type="number"
      step="0.1"
      value={data.timestamp || 0}
      onChange={(e) => updateNodeData(id, { timestamp: Number(e.target.value) })}
      className="h-8 bg-[#0d0d0d] border-white/5 text-white text-[11px] px-2 focus:border-yellow-500/50 focus:ring-0 rounded-md shadow-inner"
    />
  </div>

  {/* 👇 Run button */}
  <button
    onClick={() => executeExtractFrame(id)}
    disabled={!videoConnected || data.status === 'running'}
    className="w-full flex items-center justify-center gap-1.5 h-8 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
  >
    <Play size={10} />
    {data.status === 'running' ? 'Extracting...' : 'Extract Frame'}
  </button>
</div>
        </div>

        {/* Handles */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3.5 !h-3.5 !bg-[#eab308] !border-2 !border-[#1a1a1a] !-left-2"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="image-output"
          className="!w-3.5 !h-3.5 !bg-[#eab308] !border-2 !border-[#1a1a1a] !-right-2"
        />
      </div>
    </>
  );
});

ExtractFrameNode.displayName = 'ExtractFrameNode';