'use client';

// workflow editor page, the main canvas where users build their pipelines
// if there's an id in the url we load that saved workflow, otherwise blank canvas
// kinda the heart of the whole app tbh

import { Suspense, useEffect, useState } from 'react';
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

// canvas entrance animation, starts slightly zoomed in and blurry then settles in
// looks really cinematic honestly
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

// staggers all the ui panels so they don't all pop in at once
const uiLayoutVariants: Variants = {
  initial: { opacity: 1 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.5, // ui comes in as the canvas is still resolving
    },
  },
};

// individual panel animations, they glide in with a subtle unblur
// kinda like glass panels materializing out of thin air
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

// the actual page content lives here, split out so we can wrap it in Suspense
// next.js requires useSearchParams to be inside a suspense boundary or the build explodes
function WorkflowPageContent() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('id');
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false);

  // grab store actions we need for loading a saved workflow
  const { setNodes, setEdges, setCurrentWorkflow, saveToHistory, clearWorkflow } = useWorkflowStore();

  // if there's a workflow id in the url, fetch it from the api and hydrate the canvas
  // this is what makes the dashboard to editor flow actually work
  useEffect(() => {
    // super important: when there's no id, we want a real blank canvas
    // zustand store sticks around between route changes, so without this
    // "new workflow" can accidentally show the last opened saved workflow
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
          console.error('couldn\'t load workflow, server returned:', res.status);
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
        // without this the first undo would just clear everything lol
        setTimeout(() => {
          saveToHistory();
        }, 100);
      } catch (err) {
        // network error or something else went wrong
        console.error('failed to load saved workflow:', err);
      } finally {
        setIsLoadingWorkflow(false);
      }
    };

    loadSavedWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  return (
    <div className="h-screen w-full relative overflow-hidden bg-[#050505]">
      
      {/* loading overlay, shows when we're fetching a saved workflow from the db */}
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

      {/* background canvas, sits absolute full screen behind everything */}
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

      {/* ui overlay, floating panels on top of the canvas */}
      <motion.div
        className="absolute inset-0 z-10 flex flex-col pointer-events-none"
        initial="initial"
        animate="animate"
        variants={uiLayoutVariants}
      >
        {/* top toolbar */}
        <motion.div variants={topBarVariants} className="pointer-events-auto w-full">
          <WorkflowToolbar />
        </motion.div>

        {/* workspace area with both sidebars */}
        <div className="flex-1 flex justify-between overflow-hidden w-full">
          
          {/* left sidebar, node picker */}
          <motion.div variants={sideBarLeftVariants} className="flex shrink-0 pointer-events-auto h-full">
            <NodeSidebar />
          </motion.div>

          {/* right sidebar, execution history */}
          <motion.div variants={sideBarRightVariants} className="flex shrink-0 pointer-events-auto h-full">
            <HistorySidebar />
          </motion.div>

        </div>
      </motion.div>

      {/* keeps the whole page background dark, no white flash on load */}
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

// wrapping in Suspense is required by next.js when using useSearchParams
// without this the production build just fails, learned that the hard way
export default function WorkflowPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center">
        <Loader2 size={28} className="text-white/30 animate-spin" />
      </div>
    }>
      <WorkflowPageContent />
    </Suspense>
  );
}