'use client';

import { useCallback, DragEvent } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { UserButton, useUser } from '@clerk/nextjs';
import { 
  FileText, ImageIcon, Video, Brain, 
  Crop, Film, LayoutGrid, Home, Plus 
} from 'lucide-react';

import { useWorkflowStore } from '@/lib/store';
import { WorkflowNode, NodeDataType } from '@/lib/types';

// --- CONFIGURATION ---
const nodeConfigs = [
  { type: 'text' as NodeDataType, label: 'Text', description: 'Text input', icon: FileText, color: 'bg-blue-500/10 text-blue-400', outputType: 'text' as const },
  { type: 'upload-image' as NodeDataType, label: 'Image', description: 'Upload asset', icon: ImageIcon, color: 'bg-emerald-500/10 text-emerald-400', outputType: 'image' as const },
  { type: 'upload-video' as NodeDataType, label: 'Video', description: 'Video source', icon: Video, color: 'bg-amber-500/10 text-amber-400', outputType: 'video' as const },
  { type: 'llm' as NodeDataType, label: 'Enhancer', description: 'AI Processing', icon: Brain, color: 'bg-purple-500/10 text-purple-400', outputType: 'text' as const },
  { type: 'crop-image' as NodeDataType, label: 'Edit', description: 'Crop & Resize', icon: Crop, color: 'bg-pink-500/10 text-pink-400', outputType: 'image' as const },
  { type: 'extract-frame' as NodeDataType, label: 'Realtime', description: 'Frame extraction', icon: Film, color: 'bg-cyan-500/10 text-cyan-400', outputType: 'image' as const },
];

export function NodeSidebar() {
  const addNode = useWorkflowStore((state) => state.addNode);
  const { user } = useUser();
  const pathname = usePathname();

  const handleDragStart = useCallback((event: DragEvent, type: NodeDataType, outputType: string) => {
    event.dataTransfer.setData('application/reactflow-type', type);
    event.dataTransfer.setData('application/reactflow-output', outputType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleAddNode = useCallback((type: NodeDataType, outputType: 'text' | 'image' | 'video') => {
    const id = `${type}-${Date.now()}`;
    const position = { x: 250, y: 250 };
    const data = { label: type, type, outputType, status: 'idle' as const };
    addNode({ id, type, position, data } as WorkflowNode);
  }, [addNode]);

  return (
    <div className="w-[260px] h-full flex flex-col bg-[#050505] border-r border-white/5 overflow-hidden select-none">
      
      {/* 1. TOP NAVIGATION SECTION */}
      <div className="px-4 pt-6 pb-4 flex flex-col gap-1">
        <SidebarNavItem 
          href="/" 
          icon={Home} 
          label="Home" 
          isActive={pathname === "/"} 
        />
        <SidebarNavItem 
          href="/workflow" 
          icon={LayoutGrid} 
          label="Node Editor" 
          isActive={pathname.startsWith("/workflow")} 
        />
      </div>

      <div className="h-px bg-white/5 mx-4 my-2" />

      {/* 2. TOOLS / NODE LIBRARY SECTION */}
      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
        <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-2 mb-4">
          {"// Node Library"}
        </h3>
        
        <div className="flex flex-col gap-1">
          {nodeConfigs.map((config, idx) => (
            <motion.button
              key={config.type}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.03)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAddNode(config.type, config.outputType)}
              draggable
              onDragStart={(e:any) => handleDragStart(e, config.type, config.outputType)}
              className="group flex items-center gap-3 p-2 rounded-xl transition-all cursor-grab active:cursor-grabbing w-full text-left"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${config.color}`}>
                <config.icon size={18} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold text-white/70 group-hover:text-white transition-colors">
                  {config.label}
                </span>
                <span className="text-[10px] text-white/30 truncate">
                  {config.description}
                </span>
              </div>
            </motion.button>
          ))}
          
          <button className="flex items-center gap-3 p-3 text-white/20 hover:text-white/50 transition-colors mt-2">
             <Plus size={14} />
             <span className="text-[12px] font-medium tracking-tight">More Tools</span>
          </button>
        </div>
      </div>

      {/* 3. USER FOOTER SECTION */}
      <div className="p-4 bg-[#080808] border-t border-white/5">
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="shrink-0 scale-110 origin-left">
            <UserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-9 h-9 rounded-xl border border-white/10 shadow-xl"
                }
              }}
            />
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="text-[13px] font-bold text-white/90 truncate w-full tracking-tight">
              {user?.firstName || user?.username || 'Guest'}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-wider">
                Free Plan
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

// --- SUB-COMPONENT: NAVIGATION ITEM ---
function SidebarNavItem({ 
  href, 
  icon: Icon, 
  label, 
  isActive 
}: { 
  href: string, 
  icon: any, 
  label: string, 
  isActive: boolean 
}) {
  return (
    <Link href={href} className="relative block">
      <motion.div
        initial={false}
        animate={{ 
          backgroundColor: isActive ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0)" 
        }}
        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
        whileTap={{ scale: 0.98 }}
        className="relative flex items-center gap-3 p-2.5 rounded-xl w-full group transition-all cursor-pointer"
      >
        {/* Krea-style Active Indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.div 
              layoutId="sidebar-active-pill"
              className="absolute left-[-16px] w-1 h-6 bg-white rounded-r-full shadow-[0_0_15px_white]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>

        <div className={`
          w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300
          ${isActive ? 'bg-white text-black shadow-2xl' : 'bg-[#111] text-white/30 group-hover:text-white/60'}
        `}>
          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        </div>

        <span className={`
          text-[14px] font-semibold transition-colors
          ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70'}
        `}>
          {label}
        </span>
      </motion.div>
    </Link>
  );
}