'use client';

import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowCanvas } from '@/components/WorkflowCanvas';
import { NodeSidebar } from '@/components/NodeSidebar';
import { HistorySidebar } from '@/components/HistorySidebar';
import { WorkflowToolbar } from '@/components/WorkflowToolbar';
import { UserButton } from '@clerk/nextjs';
import { Sparkles, ChevronLeft, ChevronRight, PanelLeft, PanelRight } from 'lucide-react';

export default function WorkflowPage() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col" style={{ background: '#0a0a0f' }}>
      {/* Top Header */}
      <header className="h-12 flex items-center justify-between px-4 shrink-0 z-50"
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
        <UserButton appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT SIDEBAR (Node Library) */}
        <div className={`relative transition-all duration-300 ease-in-out flex shrink-0 ${leftOpen ? 'w-64' : 'w-0'}`}>
          <div className="min-w-[16rem] h-full overflow-hidden">
            <NodeSidebar />
          </div>
          
          {/* Left Toggle Button - LARGER TAB */}
          <button 
            onClick={() => setLeftOpen(!leftOpen)}
            className={`absolute top-1/2 -translate-y-1/2 z-[60] flex flex-col items-center justify-center gap-4 py-8 transition-all group
              ${leftOpen 
                ? '-right-4 w-6 h-12 rounded-full glass border border-white/10' 
                : '-right-8 w-8 h-48 rounded-r-2xl bg-[#12121a] border-y border-r border-purple-500/30 shadow-[4px_0_15px_rgba(124,58,237,0.1)]'
              }`}
          >
            {leftOpen ? (
               <ChevronLeft size={16} className="text-gray-400 group-hover:text-purple-400" />
            ) : (
               <>
                 <PanelLeft size={18} className="text-purple-400" />
                 <span className="[writing-mode:vertical-lr] rotate-180 text-[11px] font-black tracking-[0.2em] text-gray-400 uppercase group-hover:text-purple-300 transition-colors">
                   NODE LIBRARY
                 </span>
               </>
            )}
          </button>
        </div>

        {/* CENTER CANVAS */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <WorkflowToolbar />
          <div className="flex-1">
            <ReactFlowProvider>
              <WorkflowCanvas />
            </ReactFlowProvider>
          </div>
        </div>

        {/* RIGHT SIDEBAR (Execution History) */}
        <div className={`relative transition-all duration-300 ease-in-out flex shrink-0 ${rightOpen ? 'w-80' : 'w-0'}`}>
          
          {/* Right Toggle Button - LARGER TAB */}
          <button 
            onClick={() => setRightOpen(!rightOpen)}
            className={`absolute top-1/2 -translate-y-1/2 z-[60] flex flex-col items-center justify-center gap-4 py-8 transition-all group
              ${rightOpen 
                ? '-left-4 w-6 h-12 rounded-full glass border border-white/10' 
                : '-left-8 w-8 h-48 rounded-l-2xl bg-[#12121a] border-y border-l border-purple-500/30 shadow-[-4px_0_15px_rgba(124,58,237,0.1)]'
              }`}
          >
            {rightOpen ? (
               <ChevronRight size={16} className="text-gray-400 group-hover:text-purple-400" />
            ) : (
               <>
                 <PanelRight size={18} className="text-purple-400" />
                <span className="[writing-mode:vertical-lr] rotate-180 text-[11px] font-black tracking-[0.2em] text-gray-400 uppercase group-hover:text-purple-300 transition-colors">
                  HISTORY
</span>
               </>
            )}
          </button>

          <div className="min-w-[20rem] h-full overflow-hidden">
            <HistorySidebar />
          </div>
        </div>

      </div>
    </div>
  );
}