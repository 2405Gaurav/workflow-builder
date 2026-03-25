'use client';

import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowCanvas } from '@/components/WorkflowCanvas';
import { NodeSidebar } from '@/components/NodeSidebar';
import { HistorySidebar } from '@/components/HistorySidebar';
import { WorkflowToolbar } from '@/components/WorkflowToolbar';

export default function WorkflowPage() {
  return (
    <div className="h-screen flex flex-col bg-[#050505] overflow-hidden">
      
      {/* 1. TOP TOOLBAR (Full Width) */}
      <WorkflowToolbar />

      {/* 2. MAIN LAYOUT AREA */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT SIDEBAR (Internal Collapsible Logic) */}
        <NodeSidebar />

        {/* CENTER CANVAS (Expands to fill remaining space) */}
        <main className="flex-1 relative overflow-hidden bg-[#050505]">
          <ReactFlowProvider>
            <WorkflowCanvas />
          </ReactFlowProvider>
        </main>

        {/* RIGHT SIDEBAR (Internal Collapsible Logic) */}
        <HistorySidebar />

      </div>

      {/* GLOBAL BACKGROUND STYLE */}
      <style jsx global>{`
        html, body {
          background-color: #050505;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}