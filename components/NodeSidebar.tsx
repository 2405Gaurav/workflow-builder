'use client';

import { useCallback, DragEvent } from 'react';
import { useWorkflowStore } from '@/lib/store';
import { WorkflowNode, NodeDataType } from '@/lib/types';
import { FileText, ImageIcon, Video, Brain, Crop, Film } from 'lucide-react';

const nodeConfigs = [
  { type: 'text' as NodeDataType, label: 'Text', description: 'Text input node', icon: FileText, dotColor: '#f5c542', outputType: 'text' as const },
  { type: 'upload-image' as NodeDataType, label: 'Upload Image', description: 'Upload image file', icon: ImageIcon, dotColor: '#a855f7', outputType: 'image' as const },
  { type: 'upload-video' as NodeDataType, label: 'Upload Video', description: 'Upload video file', icon: Video, dotColor: '#ec4899', outputType: 'video' as const },
  { type: 'llm' as NodeDataType, label: 'LLM', description: 'AI text generation', icon: Brain, dotColor: '#4caf50', outputType: 'text' as const },
  { type: 'crop-image' as NodeDataType, label: 'Crop Image', description: 'Crop image region', icon: Crop, dotColor: '#f97316', outputType: 'image' as const },
  { type: 'extract-frame' as NodeDataType, label: 'Extract Frame', description: 'Extract video frame', icon: Film, dotColor: '#4a9eff', outputType: 'image' as const },
];

export function NodeSidebar() {
  const addNode = useWorkflowStore((state) => state.addNode);

  const handleDragStart = useCallback((event: DragEvent, type: NodeDataType, outputType: string) => {
    event.dataTransfer.setData('application/reactflow-type', type);
    event.dataTransfer.setData('application/reactflow-output', outputType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleAddNode = useCallback((type: NodeDataType, outputType: 'text' | 'image' | 'video') => {
    const id = `${type}-${Date.now()}`;
    const position = { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 };
    const baseData = { label: type, type, outputType, status: 'idle' as const };
    let data: any = baseData;
    switch (type) {
      case 'text':          data = { ...baseData, text: '' }; break;
      case 'llm':           data = { ...baseData, model: 'gemini-1.5-flash', userMessage: '' }; break;
      case 'crop-image':    data = { ...baseData, x: 0, y: 0, width: 100, height: 100 }; break;
      case 'extract-frame': data = { ...baseData, timestamp: 0 }; break;
      default:              data = { ...baseData }; break;
    }
    addNode({ id, type, position, data } as WorkflowNode);
  }, [addNode]);

  return (
    <div className="w-64 h-full flex flex-col bg-[#141414] border-r border-[#2a2a2a] overflow-hidden">

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[#2a2a2a] shrink-0">
        <h2 className="text-[10px] font-semibold text-[#c0c0c0] uppercase tracking-[0.14em]">
          Node Library
        </h2>
        <p className="text-[9px] text-[#555] mt-0.5 tracking-wide">
          Drag to canvas or click to add
        </p>
      </div>

      {/* Node List — flex-1 rows grow equally to fill full height */}
      <div className="flex-1 flex flex-col px-2 py-2 gap-[2px] min-h-0">
        {nodeConfigs.map((config) => {
          const Icon = config.icon;
          return (
            <button
              key={config.type}
              onClick={() => handleAddNode(config.type, config.outputType)}
              draggable
              onDragStart={(e) => handleDragStart(e, config.type, config.outputType)}
              className="
                flex-1 w-full flex items-center gap-2.5 px-2.5
                bg-[#1a1a1a] border border-[#252525]
                hover:bg-[#202020] hover:border-[#333]
                active:bg-[#181818]
                transition-colors duration-100
                cursor-grab active:cursor-grabbing
                group
              "
            >
              <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: config.dotColor }} />
              <div className="w-7 h-7 flex items-center justify-center shrink-0 bg-[#242424] border border-[#2e2e2e]">
                <Icon size={13} className="text-[#777]" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className="text-[11px] font-medium text-[#c8c8c8] block leading-tight">{config.label}</span>
                <span className="text-[9px] text-[#4a4a4a] truncate block leading-tight mt-[1px]">{config.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Output Type Legend */}
      <div className="px-3 py-3 border-t border-[#2a2a2a] shrink-0">
        <p className="text-[9px] uppercase tracking-[0.15em] text-[#3a3a3a] font-semibold mb-2">Output Types</p>
        <div className="flex flex-col gap-[6px]">
          {[
            { label: 'Text',  color: '#f5c542' },
            { label: 'Image', color: '#a855f7' },
            { label: 'Video', color: '#ec4899' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-[#505050] tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}