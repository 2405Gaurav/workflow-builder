import { SignUp } from '@clerk/nextjs';
import {  Zap, Brain, GitBranch, Layers, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
export default function SignUpPage() {
  return (
    <div className="min-h-screen flex bg-[#0a0a0f] font-[Space_Grotesk]">

      {/* LEFT SIDE */}
      <div className="hidden md:flex w-1/2 relative items-center justify-center bg-[#0d0d14] text-white overflow-hidden border-r border-white/5">

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:32px_32px]" />

        {/* Glow blob */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-md px-10">

          {/* Icon */}
          <div className="flex mb-6">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
              <Layers size={22} className="text-blue-400" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Your workflows.<br />
            <span className="text-blue-400">Start here.</span>
          </h2>

          <p className="text-zinc-400 text-sm leading-relaxed mb-10">
            Create your NextFlow account and start building LLM pipelines
            visually. Connect prompts, models, and logic — no boilerplate required.
          </p>

          {/* Workflow nodes */}
          <div className="space-y-2">

            <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.07] rounded-lg px-4 py-3 text-sm text-zinc-300">
              <Zap size={14} className="text-yellow-400 shrink-0" />
              <span>Trigger</span>
              <span className="text-zinc-600 mx-1">→</span>
              <span className="text-zinc-400">User submits prompt</span>
            </div>

            <div className="ml-4 w-px h-3 bg-white/10" />

            <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.07] rounded-lg px-4 py-3 text-sm text-zinc-300">
              <Brain size={14} className="text-blue-400 shrink-0" />
              <span>LLM Node</span>
              <span className="text-zinc-600 mx-1">→</span>
              <span className="text-zinc-400">Gemini 1.5 Pro</span>
            </div>

            <div className="ml-4 w-px h-3 bg-white/10" />

            <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.07] rounded-lg px-4 py-3 text-sm text-zinc-300">
              <GitBranch size={14} className="text-emerald-400 shrink-0" />
              <span></span>
              <span className="text-zinc-600 mx-1">→</span>
              <span className="text-zinc-400"> &gt;</span>
            </div>

          </div>

          <p className="mt-10 text-xs text-zinc-600">
            Free to start. No credit card required.
          </p>

        </div>
      </div>

      {/* RIGHT SIDE — Auth */}
      <div className="flex w-full md:w-1/2 items-center justify-center px-6 bg-[#0a0a0f]">

        <div className="w-full max-w-md">
            <Link
    href="/"
    className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
  >
    <ArrowLeft size={14} />
    Back to home
  </Link>

          {/* Logo */}
       <div className="flex items-center gap-2 ">
         <Image
           src="/logo.png"
           alt="NextFlow"
           width={180}
           height={60}
           className="object-contain"
           style={{ filter: 'brightness(1.2)' }}
         />
       </div>

          <SignUp
           // straight to the dashboard after sign-up so people land in their "home base"
           forceRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorBackground: '#111118',
                colorText: '#f4f4f5',
                colorTextSecondary: '#71717a',
                colorPrimary: '#3b82f6',
                colorInputBackground: '#18181f',
                colorInputText: '#f4f4f5',
                borderRadius: '10px',
                fontFamily: 'Space Grotesk, sans-serif',
              },
              elements: {
                card: 'shadow-none border border-white/[0.08] bg-[#111118]',
                headerTitle: 'text-zinc-100 text-xl font-semibold',
                headerSubtitle: 'text-zinc-500',
                formFieldLabel: 'text-zinc-400 text-sm',
                formFieldInput: 'bg-[#18181f] border border-white/10 text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-600',
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors',
                footerActionText: 'text-zinc-500',
                footerActionLink: 'text-blue-400 font-medium hover:text-blue-300',
                socialButtonsBlockButton: 'bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-zinc-300',
                dividerLine: 'bg-white/10',
                dividerText: 'text-zinc-600',
                alertText: 'text-red-400',
                identityPreviewText: 'text-zinc-300',
                identityPreviewEditButton: 'text-blue-400',
              },
            }}
          />

        </div>
      </div>
    </div>
  );
}