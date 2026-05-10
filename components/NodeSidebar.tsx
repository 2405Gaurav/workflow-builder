'use client';

import { useCallback, useState, useMemo, DragEvent } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { UserButton, useUser } from '@clerk/nextjs';
import Image from 'next/image';
import {
  FileText, ImageIcon, Video, Brain,
  Crop, Film, LayoutGrid, Home,
  Search, X, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

import { useWorkflowStore } from '@/lib/store';
import { WorkflowNode, NodeDataType } from '@/lib/types';

const nodeConfigs = [
  { type: 'text' as NodeDataType, label: 'Text', description: 'Text input', icon: FileText, color: 'bg-blue-500/10 text-blue-400', outputType: 'text' as const },
  { type: 'upload-image' as NodeDataType, label: 'Image', description: 'Upload asset', icon: ImageIcon, color: 'bg-emerald-500/10 text-emerald-400', outputType: 'image' as const },
  { type: 'upload-video' as NodeDataType, label: 'Video', description: 'Video source', icon: Video, color: 'bg-amber-500/10 text-amber-400', outputType: 'video' as const },
  { type: 'llm' as NodeDataType, label: 'Enhancer', description: 'LLM Processing', icon: Brain, color: 'bg-purple-500/10 text-purple-400', outputType: 'text' as const },
  { type: 'crop-image' as NodeDataType, label: 'Edit', description: 'Crop & Resize', icon: Crop, color: 'bg-pink-500/10 text-pink-400', outputType: 'image' as const },
  { type: 'extract-frame' as NodeDataType, label: 'Realtime', description: 'Frame extraction', icon: Film, color: 'bg-cyan-500/10 text-cyan-400', outputType: 'image' as const },
];

function NodeSearch({ query, setQuery }: { query: string; setQuery: (val: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative px-2 mb-4"
    >
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/50 transition-colors" size={14} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search nodes..."
          className="w-full h-9 bg-white/[0.03] border border-white/5 rounded-xl pl-9 pr-8 text-[12px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-md transition-colors"
          >
            <X size={12} className="text-white/40" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function NodeSidebar() {
  const addNode = useWorkflowStore((state) => state.addNode);
  const { user } = useUser();
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNodes = useMemo(() => {
    return nodeConfigs.filter(n =>
      n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(searchQuery.toLowerCase())
    );//here we are using the usememo to memoize the filtered nodes
    //we wnat that it only runs when the searchquery changes not anything else 
  }, [searchQuery]);

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
    // Outer shell: breathing room so the card floats
    <div className="h-full flex items-stretch py-3 pl-3 pr-0">
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 64 : 248 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="h-full flex flex-col overflow-hidden select-none relative z-30 rounded-2xl"
        style={{
          background: 'rgba(5, 5, 5, 0.92)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset',
        }}
      >
        {/* 1. TOP HEADER & COLLAPSE TOGGLE */}
        <div className={`flex items-center justify-between px-1 pt-1 pb-1 shrink-0 ${isCollapsed ? 'flex-col gap-4' : ''}`}>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                key="logo"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <Image src="/logo.png" alt="NextFlow" width={160} height={20} />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* 2. NAVIGATION */}
        <div className="px-2 flex flex-col gap-1 shrink-0">
          <SidebarNavItem href="/" icon={Home} label="Home" isActive={pathname === '/'} isCollapsed={isCollapsed} />
          <SidebarNavItem href="/workflow" icon={LayoutGrid} label="Nodes" isActive={pathname.startsWith('/workflow')} isCollapsed={isCollapsed} />
        </div>

        <div className="h-px mx-3 my-3 shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* 3. SEARCH */}
        {!isCollapsed && <NodeSearch query={searchQuery} setQuery={setSearchQuery} />}

        {/* 4. NODE LIBRARY */}
        <div className={`flex-1 overflow-y-auto px-2 custom-scrollbar ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-2 mb-4"
              >
                {'// Library'}
              </motion.h3>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-1 w-full">
            {filteredNodes.map((config) => (
              <motion.button
                key={config.type}
                whileHover={{ x: isCollapsed ? 0 : 4, backgroundColor: 'rgba(255,255,255,0.03)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleAddNode(config.type, config.outputType)}
                draggable
                onDragStart={(e: any) => handleDragStart(e, config.type, config.outputType)}
                className={`group flex items-center transition-all cursor-grab active:cursor-grabbing rounded-xl ${isCollapsed ? 'justify-center p-2' : 'gap-3 p-2 w-full text-left'}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${config.color}`}>
                  <config.icon size={18} strokeWidth={2.5} />
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-semibold text-white/70 group-hover:text-white transition-colors">{config.label}</span>
                    <span className="text-[10px] text-white/30 truncate">{config.description}</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 5. USER FOOTER */}
        <div
          className={`p-3 shrink-0 border-t ${isCollapsed ? 'flex justify-center' : ''}`}
          style={{ background: 'rgba(8,8,8,0.8)', borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div className={`flex items-center p-2 rounded-2xl border ${isCollapsed ? 'w-fit' : 'gap-3'}`}
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <div className="shrink-0 scale-110">
              <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-9 h-9 rounded-xl border border-white/10' } }} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col items-start min-w-0">
                <span className="text-[12px] font-bold text-white/90 truncate w-full tracking-tight">
                  {user?.firstName || 'Guest'}
                </span>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar { width: 3px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        `}</style>
      </motion.div>
    </div>
  );
}

function SidebarNavItem({ href, icon: Icon, label, isActive, isCollapsed }: any) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        className={`relative flex items-center transition-all rounded-xl cursor-pointer ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 p-2.5 w-full'}`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${isActive ? 'bg-white text-black shadow-2xl shadow-white/20' : 'bg-[#111] text-white/30'}`}>
          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        {!isCollapsed && (
          <span className={`text-[14px] font-semibold transition-colors ${isActive ? 'text-white' : 'text-white/40'}`}>
            {label}
          </span>
        )}
      </motion.div>
    </Link>
  );
}