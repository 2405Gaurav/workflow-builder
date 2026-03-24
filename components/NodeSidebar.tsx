'use client';

import { useCallback, DragEvent } from 'react';
import { useWorkflowStore } from '@/lib/store';
import { WorkflowNode, NodeDataType } from '@/lib/types';
import { FileText, ImageIcon, Video, Brain, Crop, Film, GripVertical } from 'lucide-react';

const nodeConfigs = [
  {
    type: 'text' as NodeDataType,
    label: 'Text',
    description: 'Text input node',
    icon: FileText,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    outputType: 'text' as const,
  },
  {
    type: 'upload-image' as NodeDataType,
    label: 'Upload Image',
    description: 'Upload image file',
    icon: ImageIcon,
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: 'rgba(168, 85, 247, 0.2)',
    outputType: 'image' as const,
  },
  {
    type: 'upload-video' as NodeDataType,
    label: 'Upload Video',
    description: 'Upload video file',
    icon: Video,
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    borderColor: 'rgba(236, 72, 153, 0.2)',
    outputType: 'video' as const,
  },
  {
    type: 'llm' as NodeDataType,
    label: 'LLM',
    description: 'AI text generation',
    icon: Brain,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    outputType: 'text' as const,
  },
  {
    type: 'crop-image' as NodeDataType,
    label: 'Crop Image',
    description: 'Crop image region',
    icon: Crop,
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.2)',
    outputType: 'image' as const,
  },
  {
    type: 'extract-frame' as NodeDataType,
    label: 'Extract Frame',
    description: 'Extract video frame',
    icon: Film,
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: 'rgba(6, 182, 212, 0.2)',
    outputType: 'image' as const,
  },
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
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
    };

    const baseData = {
      label: type,
      type,
      outputType,
      status: 'idle' as const,
    };

    let data: any = baseData;

    switch (type) {
      case 'text':
        data = { ...baseData, text: '' };
        break;
      case 'upload-image':
        data = { ...baseData };
        break;
      case 'upload-video':
        data = { ...baseData };
        break;
      case 'llm':
        data = { ...baseData, model: 'gemini-1.5-flash', userMessage: '' };
        break;
      case 'crop-image':
        data = { ...baseData, x: 0, y: 0, width: 100, height: 100 };
        break;
      case 'extract-frame':
        data = { ...baseData, timestamp: 0 };
        break;
    }

    const newNode: WorkflowNode = {
      id,
      type,
      position,
      data,
    };

    addNode(newNode);
  }, [addNode]);

  return (
    <div className="w-64 flex flex-col overflow-hidden glass animate-slide-in-left"
      style={{
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5">
        <h2 className="text-sm font-bold text-gray-200 tracking-wide">Node Library</h2>
        <p className="text-[10px] text-gray-500 mt-0.5">Drag to canvas or click to add</p>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {nodeConfigs.map((config) => {
          const Icon = config.icon;
          return (
            <button
              key={config.type}
              onClick={() => handleAddNode(config.type, config.outputType)}
              draggable
              onDragStart={(e) => handleDragStart(e, config.type, config.outputType)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 group cursor-grab active:cursor-grabbing"
              style={{
                background: config.bgColor,
                border: `1px solid ${config.borderColor}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = config.bgColor.replace('0.1', '0.2');
                (e.currentTarget as HTMLElement).style.borderColor = config.borderColor.replace('0.2', '0.4');
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = config.bgColor;
                (e.currentTarget as HTMLElement).style.borderColor = config.borderColor;
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: config.bgColor.replace('0.1', '0.3') }}
              >
                <Icon size={16} style={{ color: config.color }} />
              </div>
              <div className="flex-1 text-left">
                <span className="text-xs font-medium text-gray-200 block">{config.label}</span>
                <span className="text-[9px] text-gray-500">{config.description}</span>
              </div>
              <GripVertical size={14} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>

      {/* Type Legend */}
      <div className="px-4 py-3 border-t border-white/5">
        <p className="text-[9px] uppercase tracking-wider text-gray-600 font-medium mb-2">Output Types</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Text', color: '#3b82f6' },
            { label: 'Image', color: '#a855f7' },
            { label: 'Video', color: '#ec4899' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[9px] text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
