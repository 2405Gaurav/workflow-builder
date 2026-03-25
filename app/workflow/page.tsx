'use client';

import { ReactFlowProvider } from '@xyflow/react';
import { motion, Variants } from 'framer-motion';
import { WorkflowCanvas } from '@/components/WorkflowCanvas';
import { NodeSidebar } from '@/components/NodeSidebar';
import { HistorySidebar } from '@/components/HistorySidebar';
import { WorkflowToolbar } from '@/components/WorkflowToolbar';

// Premium cinematic easing (Apple-style buttery deceleration)
const elegantEase: [number, number, number, number] =[0.16, 1, 0.3, 1];

// ── 1. CANVAS ENTRANCE (Deep Focus Effect) ──
// Starts slightly large, dark, and blurred, then settles into place.
const canvasVariants: Variants = {
  initial: { 
    opacity: 0, 
    scale: 1.04, 
    filter: 'blur(12px) brightness(0.4)' 
  },
  animate: { 
    opacity: 1, 
    scale: 1, 
    filter: 'blur(0px) brightness(1)', 
    transition: { duration: 1.5, ease: elegantEase, delay: 0.1 } 
  },
};

// ── 2. UI STAGGER LAYOUT ──
const uiLayoutVariants: Variants = {
  initial: { opacity: 1 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.5, // UI comes in as the canvas is resolving
    },
  },
};

// ── 3. INDIVIDUAL UI PANELS ──
// They glide in with a subtle unblur, making them feel like glass panels.
const topBarVariants: Variants = {
  initial: { opacity: 0, y: -20, filter: 'blur(8px)' },
  animate: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { duration: 1.2, ease: elegantEase } 
  },
};

const sideBarLeftVariants: Variants = {
  initial: { opacity: 0, x: -20, filter: 'blur(8px)' },
  animate: { 
    opacity: 1, 
    x: 0, 
    filter: 'blur(0px)',
    transition: { duration: 1.2, ease: elegantEase } 
  },
};

const sideBarRightVariants: Variants = {
  initial: { opacity: 0, x: 20, filter: 'blur(8px)' },
  animate: { 
    opacity: 1, 
    x: 0, 
    filter: 'blur(0px)',
    transition: { duration: 1.2, ease: elegantEase } 
  },
};

export default function WorkflowPage() {
  return (
    <div className="h-screen w-full relative overflow-hidden bg-[#050505]">
      
      {/* ── BACKGROUND CANVAS (Absolute Full Screen) ── */}
      <motion.div 
        variants={canvasVariants}
        initial="initial"
        animate="animate"
        className="absolute inset-0 z-0"
      >
        <ReactFlowProvider>
          <WorkflowCanvas />
        </ReactFlowProvider>
      </motion.div>

      {/* ── UI OVERLAY (Floating Elements) ── */}
      <motion.div
        className="absolute inset-0 z-10 flex flex-col pointer-events-none"
        initial="initial"
        animate="animate"
        variants={uiLayoutVariants}
      >
        {/* TOP TOOLBAR */}
        <motion.div variants={topBarVariants} className="pointer-events-auto w-full">
          <WorkflowToolbar />
        </motion.div>

        {/* WORKSPACE AREA (Sidebars) */}
        <div className="flex-1 flex justify-between overflow-hidden w-full">
          
          {/* LEFT SIDEBAR */}
          <motion.div variants={sideBarLeftVariants} className="flex shrink-0 pointer-events-auto h-full">
            <NodeSidebar />
          </motion.div>

          {/* RIGHT SIDEBAR */}
          <motion.div variants={sideBarRightVariants} className="flex shrink-0 pointer-events-auto h-full">
            <HistorySidebar />
          </motion.div>

        </div>
      </motion.div>

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