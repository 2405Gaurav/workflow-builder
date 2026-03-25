'use client';

import {
  SignInButton,
  SignUpButton,
  UserButton,
  SignedIn,
  SignedOut
} from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

// --- ANIMATION VARIANTS ---
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

export default function LandingPage() {
  const router = useRouter();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .grid-bg {
          background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0);
          background-size: 40px 40px;
        }
      `}</style>

      {/* FIXED BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 grid-bg" />
      </div>

     

      <main className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto">
        
        {/* HERO SECTION - KREA INSPIRED */}
        <motion.section 
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          className="relative mb-32"
        >
          <motion.div 
            style={{ opacity }}
            className="w-full aspect-[21/10] md:aspect-[21/8] bg-blue-600 rounded-[32px] md:rounded-[48px] flex flex-col items-center justify-center text-center px-4 overflow-hidden shadow-2xl shadow-blue-500/20"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
            />
            
            <h1 className="text-5xl md:text-8xl font-extrabold tracking-tighter mb-8 z-10 leading-[0.9]">
              Build your next <br/> AI workflow.
            </h1>

            <div className="flex flex-col md:flex-row gap-4 z-10">
              <button 
                onClick={() => router.push('/workflow')}
                className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer shadow-xl"
              >
                Create Free Workflow
              </button>
              <button className="bg-black/10 backdrop-blur-md border border-white/20 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-black/20 transition-all cursor-pointer">
                View Gallery
              </button>
            </div>
          </motion.div>
          
          <div className="mt-10 flex justify-center items-center gap-8 text-white/30 mono text-[10px] tracking-widest uppercase">
            <span>{"// Start Building for free"}</span>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <span>{"// Gemini 2.0 Enabled"}</span>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <span>{"// Multi-modal Support"}</span>
          </div>
        </motion.section>

        {/* STATS STRIP */}
        <motion.section 
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-40"
        >
          {[
            { val: "6", label: "Core Nodes" },
            { val: "2.0", label: "Gemini Flash" },
            { val: "∞", label: "Pipelines" },
            { val: "0ms", label: "Latency" }
          ].map((s, i) => (
            <motion.div key={i} variants={fadeInUp} className="text-center md:text-left border-l border-white/10 pl-6">
              <div className="text-4xl font-bold tracking-tighter mb-1">{s.val}</div>
              <div className="mono text-[10px] text-gray-500 uppercase tracking-widest">{s.label}</div>
            </motion.div>
          ))}
        </motion.section>

        {/* FEATURES BENTO GRID */}
        <section className="mb-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none">
              Powerful logic.<br/>Simple interface.
            </h2>
            <p className="text-gray-400 max-w-sm text-lg leading-relaxed">
              Design complex multi-step AI agents without managing infrastructure or writing boilerplate code.
            </p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { t: 'Visual Canvas', d: 'Interactive DAG-based workflow builder with React Flow.' },
              { t: 'DAG Engine', d: 'Topological sort ensures branches execute in perfect sync.' },
              { t: 'Gemini Multi-Modal', d: 'Process images, video, and text in a single pipeline.' },
              { t: 'Type Safety', d: 'Strict handle validation prevents invalid node connections.' },
              { t: 'State Persistence', d: 'Full execution history with per-node result inspection.' },
              { t: 'Serverless Scale', d: 'Heavy media tasks handled by scalable cloud workers.' },
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.03)' }}
                className="p-10 rounded-[32px] bg-[#0A0A0A] border border-white/5 transition-colors group"
              >
                <h3 className="text-xl font-bold mb-3 group-hover:text-blue-400 transition-colors">{feature.t}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{feature.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

   
      </main>
    </div>
  );
}