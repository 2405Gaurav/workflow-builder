'use client';

// dasboard page - shows saved worflows and lets user create new ones
// this is the main hub after loggin in, kinda like a home base

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus,
  Loader2,
  Workflow,
  Trash2,
  Clock,
  ArrowRight,
  Sparkles,
  LayoutGrid,
  GitBranch,
  Globe,
} from 'lucide-react';

// type for workflow data comming from the api
interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
  createdAt: string;
  updatedAt: string;
}

// smooth apple-style easing, feels buttery
const elegantEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

// stagger children for that cascading entrance effect
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.3,
    },
  },
};

// each card fades up from below
const cardVariants = {
  initial: { opacity: 0, y: 20, filter: 'blur(6px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: elegantEase },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    filter: 'blur(4px)',
    transition: { duration: 0.3 },
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // fetch all saved worflows when user is loaded
  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchWorkflows = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/workflows');
        if (res.ok) {
          const { workflows: data } = await res.json();
          setWorkflows(data || []);
        }
      } catch (err) {
        // somthing went wrong but we dont wana crash the whole page
        console.error('Failed to fetch worflows:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkflows();
  }, [isLoaded, user]);

  // delete a workflow - asks the backend to remove it
  const handleDelete = async (e: React.MouseEvent, workflowId: string) => {
    // stop the click from bubbling up to the card click handler
    e.stopPropagation();

    if (deletingId) return; // already deleteing somthing, chill out
    setDeletingId(workflowId);

    try {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // remove from local state so we dont need to refetch
        setWorkflows((prev) => prev.filter((w) => w.id !== workflowId));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // open an exisitng workflow in the editor
  const handleOpenWorkflow = (workflowId: string) => {
    router.push(`/workflow?id=${workflowId}`);
  };

  // navigate to a blank canvas for new worflow
  const handleNewWorkflow = () => {
    router.push('/workflow');
  };

  // figure out how many nodes a workflow has for the card preview
  const getNodeCount = (nodes: any[]) => {
    if (!nodes || !Array.isArray(nodes)) return 0;
    return nodes.length;
  };

  // same for edges
  const getEdgeCount = (edges: any[]) => {
    if (!edges || !Array.isArray(edges)) return 0;
    return edges.length;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .grid-bg {
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0);
          background-size: 36px 36px;
        }
      `}</style>

      {/* page entrance overlay - same wipe-up as landing */}
      <motion.div
        className="fixed inset-0 z-[100] bg-[#050505] pointer-events-none"
        initial={{ y: 0 }}
        animate={{ y: '-100%' }}
        transition={{ duration: 1.2, ease: [0.85, 0, 0.15, 1], delay: 0.1 }}
      />

      {/* subtle background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] bg-purple-700/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-700/5 blur-[140px] rounded-full" />
        <div className="absolute inset-0 grid-bg" />
      </div>

      {/* top nav bar */}
      <nav
        className="fixed top-0 w-full z-50 flex items-center justify-between px-8 md:px-16 h-16"
        style={{ background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(20px)' }}
      >
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="NextFlow"
            width={160}
            height={52}
            className="object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
            style={{
              filter:
                'brightness(1.1) drop-shadow(0 0 12px rgba(255,255,255,0.08))',
            }}
          />
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={handleNewWorkflow}
            className="text-[13px] font-medium tracking-wide cursor-pointer transition-all duration-200 mr-2"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')
            }
          >
            New Workflow →
          </button>
          <UserButton
            appearance={{
              elements: { avatarBox: 'w-7 h-7' },
              variables: {
                colorPrimary: '#7c3aed',
                colorBackground: '#0a0a0f',
                colorText: '#ffffff',
                borderRadius: '0.75rem',
              },
            }}
          />
        </div>
      </nav>

      {/* main content area */}
      <main className="relative z-10 pt-28 pb-20 px-6 max-w-7xl mx-auto">
        {/* page header with greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: elegantEase, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
            <span className="mono text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">
              {'// Dashboard'}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter leading-tight mb-3">
            Welcome back
            {user?.firstName ? (
              <span className="text-white/40">, {user.firstName}</span>
            ) : null}
          </h1>
          <p className="text-white/30 text-[15px] leading-relaxed max-w-lg">
            Your saved workflows live here. Pick up where you left off or
            start building something new.
          </p>
        </motion.div>

        {/* new workflow hero card - the big CTA at the top */}
        <motion.div
          initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: elegantEase, delay: 0.35 }}
          className="mb-12"
        >
          <button
            onClick={handleNewWorkflow}
            className="w-full group cursor-pointer"
          >
            <div
              className="relative p-8 rounded-[28px] border border-white/5 overflow-hidden transition-all duration-500 group-hover:border-white/10"
              style={{
                background:
                  'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(59,130,246,0.06) 50%, rgba(16,185,129,0.04) 100%)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(59,130,246,0.1) 50%, rgba(16,185,129,0.07) 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(59,130,246,0.06) 50%, rgba(16,185,129,0.04) 100%)';
              }}
            >
              {/* floaty sparkle icon  */}
              <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-30 transition-opacity duration-500">
                <Sparkles size={48} />
              </div>

              <div className="flex items-center gap-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Plus
                    size={24}
                    className="text-white/60 group-hover:text-white transition-colors"
                  />
                </div>

                <div className="text-left">
                  <h3 className="text-xl font-bold text-white/80 group-hover:text-white transition-colors mb-1">
                    Create New Workflow
                  </h3>
                  <p className="text-white/25 text-sm">
                    Start with a blank canvas and build your AI pipeline from
                    scratch
                  </p>
                </div>

                <ArrowRight
                  size={20}
                  className="text-white/10 group-hover:text-white/50 group-hover:translate-x-1 transition-all duration-300 ml-auto"
                />
              </div>
            </div>
          </button>
        </motion.div>

        {/* saved workflows section header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: elegantEase, delay: 0.45 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <LayoutGrid size={16} className="text-white/20" />
            <span className="text-sm font-semibold text-white/40 uppercase tracking-wider">
              Saved Workflows
            </span>
            {!isLoading && (
              <span className="mono text-[10px] text-white/15 ml-1">
                ({workflows.length})
              </span>
            )}
          </div>
        </motion.div>

        {/* loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-32">
            <Loader2
              size={24}
              className="text-white/10 animate-spin"
            />
          </div>
        )}

        {/* empty state - no saved worflows yet */}
        {!isLoading && workflows.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: elegantEase, delay: 0.5 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <Workflow size={32} className="text-white/10" />
            </div>
            <h3 className="text-lg font-semibold text-white/25 mb-2">
              No workflows yet
            </h3>
            <p className="text-white/15 text-sm mb-8 text-center max-w-sm">
              Create your first workflow and it will show up here. 
              You can save, edit, and manage all your AI pipelines.
            </p>
            <button
              onClick={handleNewWorkflow}
              className="bg-white text-black px-8 py-3 rounded-full font-bold text-[14px] hover:bg-white/90 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-2xl shadow-black/40"
            >
              Create Your First Workflow
            </button>
          </motion.div>
        )}

        {/* grid of workflow cards */}
        {!isLoading && workflows.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {workflows.map((wf) => (
                <motion.div
                  key={wf.id}
                  variants={cardVariants}
                  exit="exit"
                  layout
                  whileHover={{ y: -4 }}
                  onClick={() => handleOpenWorkflow(wf.id)}
                  className="p-6 rounded-[24px] border border-white/5 cursor-pointer group transition-colors duration-300 relative overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      'rgba(255,255,255,0.04)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      'rgba(255,255,255,0.02)')
                  }
                >
                  {/* tiny accent line at top of card */}
                  <div
                    className="absolute top-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)',
                    }}
                  />

                  {/* card header with name and delete btn */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: 'rgba(124,58,237,0.08)',
                          border: '1px solid rgba(124,58,237,0.15)',
                        }}
                      >
                        <GitBranch
                          size={16}
                          className="text-purple-400/70"
                        />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold text-white/75 group-hover:text-white transition-colors leading-tight">
                          {wf.name}
                        </h3>
                        {wf.description && (
                          <p className="text-[11px] text-white/20 mt-0.5 line-clamp-1">
                            {wf.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* delete button - only shows on hover */}
                    <button
                      onClick={(e) => handleDelete(e, wf.id)}
                      disabled={deletingId === wf.id}
                      className="opacity-0 group-hover:opacity-100 p-2 text-white/15 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-200"
                    >
                      {deletingId === wf.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>

                  {/* workflow stats - node and edge counts */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                      <span className="mono text-[10px] text-white/20">
                        {getNodeCount(wf.nodes)} nodes
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                      <span className="mono text-[10px] text-white/20">
                        {getEdgeCount(wf.edges)} connections
                      </span>
                    </div>
                  </div>

                  {/* timestamp and open arrow */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white/15">
                      <Clock size={11} />
                      <span className="mono text-[10px]">
                        {formatDistanceToNow(new Date(wf.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-white/8 group-hover:text-white/30 group-hover:translate-x-1 transition-all duration-300"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* footer - same as landing page to keep things consistant */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 border-t border-white/5 py-8 px-6"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="mono text-[10px] text-white/20 uppercase tracking-widest">
            {`© ${new Date().getFullYear()} NextFlow — LLM Workflow Builder`}
          </span>
          <Link
            href="https://thegauravthakur.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/30 hover:text-white/70 transition-colors duration-200 group"
          >
            <Globe
              size={12}
              className="group-hover:text-white/60 transition-colors"
            />
            <span className="mono text-[10px] uppercase tracking-widest">
              thegauravthakur.in
            </span>
          </Link>
        </div>
      </motion.footer>
    </div>
  );
}
