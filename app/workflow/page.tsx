'use client';

import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowCanvas } from '@/components/WorkflowCanvas';
import { NodeSidebar } from '@/components/NodeSidebar';
import { HistorySidebar } from '@/components/HistorySidebar';
import { WorkflowToolbar } from '@/components/WorkflowToolbar';
import { UserButton } from '@clerk/nextjs';
import { Sparkles } from 'lucide-react';

export default function WorkflowPage() {
  return (
    <div className="h-screen flex flex-col" style={{ background: '#0a0a0f' }}>
      {/* Top Header */}
      <header className="h-12 flex items-center justify-between px-4 shrink-0"
        style={{
          background: 'rgba(12, 12, 18, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(168, 85, 247, 0.2))',
                border: '1px solid rgba(124, 58, 237, 0.3)',
              }}
            >
              <Sparkles size={14} className="text-purple-400" />
            </div>
            <h1 className="text-sm font-bold gradient-text">NextFlow</h1>
          </div>
          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full text-gray-500 font-medium"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            LLM Workflow Builder
          </span>
        </div>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-7 h-7',
            },
          }}
        />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <NodeSidebar />

        <div className="flex-1 flex flex-col">
          <WorkflowToolbar />
          <div className="flex-1">
            <ReactFlowProvider>
              <WorkflowCanvas />
            </ReactFlowProvider>
          </div>
        </div>

        <HistorySidebar />
      </div>
    </div>
  );
}
