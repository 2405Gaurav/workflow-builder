'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { CropImageNodeData } from '@/lib/types';
import { useWorkflowStore } from '@/lib/store';
import { Crop, X, Settings2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

export const CropImageNode = memo(({ id, data }: NodeProps<Node<CropImageNodeData>>) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const isInputConnected = useWorkflowStore((state) => state.isInputConnected);

  const imageConnected = isInputConnected(id, 'default');

  const statusDotColor =
    data.status === 'running' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' :
    data.status === 'success' ? 'bg-green-500' :
    data.status === 'error'   ? 'bg-red-500' :
    'bg-white/20';

  // Border-only ring — uses outline + box-shadow trick so the inner content is untouched
  const ringClass =
    data.status === 'running'
      ? 'ring-running'   // custom slow pulse on border only
      : data.status === 'error'
      ? 'ring-error'
      : data.status === 'success'
      ? 'ring-success'
      : 'ring-idle';

  return (
    <>
      {/* Keyframes injected once — Tailwind can't do slow custom pulse on border */}
      <style>{`
        @keyframes borderPulse {
          0%, 100% { box-shadow: 0 0 0 0px rgba(59,130,246,0), 0 0 12px 1px rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.25); }
          50%       { box-shadow: 0 0 0 2px rgba(59,130,246,0.18), 0 0 18px 3px rgba(59,130,246,0.25); border-color: rgba(59,130,246,0.7); }
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

      <div className={`bg-[#1a1a1a] border rounded-xl shadow-2xl min-w-[280px] overflow-hidden group transition-colors duration-500 ${ringClass}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${statusDotColor}`} />
            <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Crop Image</span>
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

        <div className="flex flex-col">
          {/* Visual Result Area */}
          <div className="bg-[#0d0d0d] min-h-[120px] relative flex items-center justify-center border-b border-white/5">
            {data.croppedImageUrl ? (
              <Image
                src={data.croppedImageUrl}
                width={100}
                height={100}
                alt="Cropped Result"
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/20 p-10">
                <Crop size={32} strokeWidth={1} />
                <span className="text-[9px] uppercase tracking-widest font-bold">Waiting for result</span>
              </div>
            )}

            <div className="absolute bottom-2 left-2">
              <span className={`text-[8px] px-1.5 py-0.5 rounded-sm border ${
                imageConnected
                  ? 'border-blue-500/30 text-blue-400 bg-blue-500/5'
                  : 'border-white/10 text-white/40 bg-white/5'
              }`}>
                {imageConnected ? 'INPUT CONNECTED' : 'NO INPUT'}
              </span>
            </div>
          </div>

          {/* Settings Area */}
          <div className="p-3 bg-[#161616]">
            <div className="flex items-center gap-1.5 mb-3">
              <Settings2 size={10} className="text-white/50" />
              <span className="text-[9px] text-white/50 uppercase font-bold tracking-tight">Parameters</span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              {[
                { label: 'X Offset', key: 'x',      value: data.x },
                { label: 'Y Offset', key: 'y',      value: data.y },
                { label: 'Width %',  key: 'width',  value: data.width },
                { label: 'Height %', key: 'height', value: data.height },
              ].map(({ label, key, value }) => (
                <div key={key} className="space-y-1">
                  <label className="text-[9px] uppercase text-white/40 font-bold">{label}</label>
                  <Input
                    type="number"
                    value={value || 0}
                    onChange={(e) => updateNodeData(id, { [key]: Number(e.target.value) })}
                    className="h-8 bg-[#0d0d0d] border-white/5 text-white text-[11px] px-2 focus:border-yellow-500/50 focus:ring-0 rounded-md"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Handles */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3.5 !h-3.5 !bg-[#eab308] !border-2 !border-[#1a1a1a] !-left-2 hover:!scale-125 transition-transform"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="image-output"
          className="!w-3.5 !h-3.5 !bg-[#eab308] !border-2 !border-[#1a1a1a] !-right-2 hover:!scale-125 transition-transform"
        />
      </div>
    </>
  );
});

CropImageNode.displayName = 'CropImageNode';