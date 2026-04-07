'use client';

// landing page - the first thing ppl see when they open the app
// tryin to make it look premium with smooth animations and clean typography
// signed in users get redirected to dashboard instead of workflow directyl

import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Globe } from 'lucide-react';

// basic fade-in-up animation variant, used evrywhere
const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

// stagger children for that cascading entrance effect
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } }
};

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { scrollYProgress } = useScroll();
  
  // Enhanced scroll parallax effects - makes the hero feel alive
  const heroOpacity = useTransform(scrollYProgress,[0, 0.25], [1, 0]);
  const heroScale = useTransform(scrollYProgress,[0, 0.25], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, 60]);
  
  // background parallax - subtle but noticable
  const bgY = useTransform(scrollYProgress, [0, 1],['0%', '25%']);

  // if user is signed in, send them to dashboard first
  // otherwise just open the workflow builder as a guest preview kinda thing
  const handleCTAClick = () => {
    if (isSignedIn) {
      router.push('/dashboard');
    } else {
      router.push('/sign-up');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 overflow-x-hidden">
      <Navbar />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .grid-bg {
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0);
          background-size: 36px 36px;
        }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .hero-gradient {
          background: linear-gradient(
            135deg,
            #1a6080 0%,
            #1a5068 8%,
            #164058 16%,
            #123248 24%,
            #0f2638 32%,
            #1a3545 40%,
            #1e3d4d 48%,
            #243f50 56%,
            #1c3040 64%,
            #152535 72%,
            #0f1e2a 80%,
            #0a1520 88%,
            #080d12 100%
          );
          background-size: 300% 300%;
          animation: gradientShift 12s ease infinite;
        }
      `}</style>

      {/* page entrance - that satisfying wipe-up reveal */}
      <motion.div
        className="fixed inset-0 z-[100] bg-[#050505] pointer-events-none"
        initial={{ y: 0 }}
        animate={{ y: '-100%' }}
        transition={{ duration: 1.2, ease: [0.85, 0, 0.15, 1], delay: 0.1 }}
      />

      {/* BACKGROUND WITH PARALLAX - subtle moving blobs */}
      <motion.div style={{ y: bgY }} className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] bg-purple-700/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-700/5 blur-[140px] rounded-full" />
        <div className="absolute inset-0 grid-bg" />
      </motion.div>

      <main className="relative z-10 pt-28 pb-20 px-6 max-w-7xl mx-auto">

        {/* ── HERO SECTION ── */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="relative mb-28"
        >
          <motion.div style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}>
            <motion.div
              variants={{
                initial: { opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' },
                animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
              }}
              transition={{ duration: 1.2, ease:[0.16, 1, 0.3, 1] }}
              className="w-full aspect-[21/9] md:aspect-[21/8] rounded-[36px] md:rounded-[48px] flex flex-col items-center justify-center text-center px-6 overflow-hidden relative hero-gradient"
              style={{
                boxShadow: '0 40px 120px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              {/* noise texture overlay - adds that film grain feel */}
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  backgroundSize: '200px 200px',
                }}
              />
              {/* Bottom dark fade - helps the text pop against background */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Headline */}
              <motion.h1
                variants={{
                  initial: { opacity: 0, y: 30 },
                  animate: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 1, delay: 0.3, ease:[0.16, 1, 0.3, 1] }}
                className="text-5xl md:text-[80px] font-extrabold tracking-tighter leading-[0.92] mb-10 z-10 text-white"
                style={{ textShadow: '0 2px 40px rgba(0,0,0,0.4)' }}
              >
                Build your next<br />AI workflow.
              </motion.h1>

              {/* main CTA - routes to dashboard if signed in, sign-up if not */}
              <motion.div
                variants={{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.8, delay: 0.5, ease:[0.16, 1, 0.3, 1] }}
                className="z-10"
              >
                <button
                  onClick={handleCTAClick}
                  className="bg-white text-black px-10 py-3.5 rounded-full font-bold text-[15px] hover:bg-white/90 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-2xl shadow-black/40"
                >
                  {isSignedIn ? 'Go to Dashboard' : 'Get Started Free'}
                </button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* tagline strip below hero */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.8, delay: 0.6, ease:[0.16, 1, 0.3, 1] }}
            className="mt-8 flex justify-center items-center gap-6 text-white/25 mono text-[10px] tracking-widest uppercase"
          >
            <span>Start Building for free</span>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <span>Gemini 2.0 Enabled</span>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <span>Multi-modal Support</span>
          </motion.div>
        </motion.section>

        {/* ── STATS SECTION ── */}
        <motion.section
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-36"
        >
          {[
            { val: '6',   label: 'Core Nodes' },
            { val: '2.0', label: 'Gemini Flash' },
            { val: '∞',   label: 'Pipelines' },
            { val: '0ms', label: 'Latency' },
          ].map((s, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="border-l border-white/8 pl-6"
            >
              <div className="text-4xl font-bold tracking-tighter mb-1 text-white">{s.val}</div>
              <div className="mono text-[10px] text-white/30 uppercase tracking-widest">{s.label}</div>
            </motion.div>
          ))}
        </motion.section>

        {/* ── FEATURES SECTION ── */}
        <section className="mb-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-14 gap-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease:[0.22, 1, 0.36, 1] }}
              className="text-4xl md:text-6xl font-bold tracking-tighter leading-none"
            >
              Powerful logic.<br />Simple interface.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-white/40 max-w-sm text-[15px] leading-relaxed"
            >
              Design complex multi-step AI agents without managing infrastructure or writing boilerplate code.
            </motion.p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[
              { t: 'Visual Canvas',      d: 'Interactive DAG-based workflow builder with React Flow.' },
              { t: 'DAG Engine',         d: 'Topological sort ensures branches execute in perfect sync.' },
              { t: 'Gemini Multi-Modal', d: 'Process images, video, and text in a single pipeline.' },
              { t: 'Type Safety',        d: 'Strict handle validation prevents invalid node connections.' },
              { t: 'State Persistence',  d: 'Full execution history with per-node result inspection.' },
              { t: 'Serverless Scale',   d: 'Heavy media tasks handled by scalable cloud workers.' },
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="p-9 rounded-[28px] border border-white/5 transition-colors duration-300 group cursor-default"
                style={{ background: 'rgba(255,255,255,0.02)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              >
                <h3 className="text-[17px] font-semibold mb-2.5 text-white/80 group-hover:text-white transition-colors duration-200">
                  {f.t}
                </h3>
                <p className="text-white/30 leading-relaxed text-[13px]">{f.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

      </main>

      {/* ── FOOTER ── */}
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
            <Globe size={12} className="group-hover:text-white/60 transition-colors" />
            <span className="mono text-[10px] uppercase tracking-widest">
              thegauravthakur.in
            </span>
          </Link>
        </div>
      </motion.footer>
    
    </div>
  );
}