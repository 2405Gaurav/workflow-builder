'use client';

// workflow editor page - the main canvas where users build there pipelines
// if theres an id in the url we load that saved workflow, otherwise blank canvas
// kinda the heart of the whole app tbh

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { motion, Variants } from 'framer-motion';
import { WorkflowCanvas } from '@/components/WorkflowCanvas';
import { NodeSidebar } from '@/components/NodeSidebar';
import { HistorySidebar } from '@/components/HistorySidebar';
import { WorkflowToolbar } from '@/components/WorkflowToolbar';
import { useWorkflowStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';

// smooth apple-esque easing curve, makes everything feel premium
const elegantEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ── 1. CANVAS ENTRANCE (Deep Focus Effect) ──
// starts slightly zoomed in and blurry, then settles in - looks realy cinematic
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
// staggers the UI panels so they dont all pop in at once
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
// they glide in with a subtle unblur, kinda like glass panels materializing
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
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('id');
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false);

  // grab store actions we need for loading a saved worflow
  const { setNodes, setEdges, setCurrentWorkflow, saveToHistory, clearWorkflow } = useWorkflowStore();

  // if theres a workflow id in the url, fetch it from the api and hydrate the canvas
  // this is what makes the dashboard -> editor flow acutally work
  useEffect(() => {
    // super important: when there's NO id, we want a *real* blank canvas.
    // zustand store sticks around between route changes, so without this,
    // "New Workflow" can accidentally show the last opened saved workflow.
    if (!workflowId) {
      clearWorkflow();
      setCurrentWorkflow(null);
      // seed history so undo doesn't bring back an old workflow
      setTimeout(() => saveToHistory(), 50);
      return;
    }

    const loadSavedWorkflow = async () => {
      setIsLoadingWorkflow(true);
      try {
        const res = await fetch(`/api/workflows/${workflowId}`);
        if (!res.ok) {
          console.error('Couldnt load workflow, server returned:', res.status);
          return;
        }

        const { workflow } = await res.json();
        if (!workflow) return;

        // hydrate the store with the saved nodes and edges
        // need to make sure these are arrays or reactflow will freak out
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
        setCurrentWorkflow(workflow);

        // save to history so undo/redo works from this starting point
        // without this the first undo would just clear evrything lol
        setTimeout(() => {
          saveToHistory();
        }, 100);
      } catch (err) {
        // network error or somthing else went wrong
        console.error('Failed to load saved worflow:', err);
      } finally {
        setIsLoadingWorkflow(false);
      }
    };

    loadSavedWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  return (
    <div className="h-screen w-full relative overflow-hidden bg-[#050505]">
      
      {/* loading overlay - shows when were fetching a saved workflow from the db */}
      {isLoadingWorkflow && (
        <div className="absolute inset-0 z-[60] bg-[#050505]/90 backdrop-blur-sm flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 size={28} className="text-white/30 animate-spin" />
            <span className="text-white/25 text-sm font-medium tracking-wide">
              Loading workflow...
            </span>
          </motion.div>
        </div>
      )}

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
          
          {/* LEFT SIDEBAR - node picker */}
          <motion.div variants={sideBarLeftVariants} className="flex shrink-0 pointer-events-auto h-full">
            <NodeSidebar />
          </motion.div>

          {/* RIGHT SIDEBAR - execution history */}
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