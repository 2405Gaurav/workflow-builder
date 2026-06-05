'use client';

// FE-02: Company email domain validation
// Strategy: show a custom email gate BEFORE the Clerk <SignUp /> component.
// User must enter a @macgence.com email first.
// Only if it passes do we reveal the actual Clerk signup form.
// This is the cleanest approach because Clerk renders its own <form> internally
// and doesn't expose an onSubmit hook we can intercept.

import { useState } from 'react';
import { SignUp } from '@clerk/nextjs';
import { Zap, Brain, GitBranch, Layers, ArrowLeft, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// only this domain is allowed to sign up
const ALLOWED_DOMAIN = 'macgence.com';

// list of common free/personal email providers to block
// we check BOTH ways: block free providers AND only allow macgence.com
const BLOCKED_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'icloud.com', 'aol.com', 'protonmail.com', 'mail.com',
  'zoho.com', 'yandex.com', 'live.com', 'msn.com',
];

export default function SignUpPage() {
  // controls whether we show the email gate or the Clerk signup form
  const [showClerk, setShowClerk] = useState(false);

  // the email the user typed in the gate input
  const [email, setEmail] = useState('');

  // inline error message shown below the input
  const [error, setError] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // prevent page reload

    const trimmed = email.trim().toLowerCase();

    // basic format check
    if (!trimmed.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    // extract the domain part after the @
    const domain = trimmed.split('@')[1];

    // check if it's a known free provider
    if (BLOCKED_DOMAINS.includes(domain)) {
      setError('Personal email addresses are not allowed. Please use your company email.');
      return;
    }

    // check if it's specifically macgence.com
    if (domain !== ALLOWED_DOMAIN) {
      setError(`Only @${ALLOWED_DOMAIN} email addresses are accepted.`);
      return;
    }

    // all good — clear error and reveal Clerk signup
    setError('');
    setShowClerk(true);
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0f] font-[Space_Grotesk]">

      {/* LEFT SIDE — decorative panel, unchanged */}
      <div className="hidden md:flex w-1/2 relative items-center justify-center bg-[#0d0d14] text-white overflow-hidden border-r border-white/5">

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:32px_32px]" />

        {/* Glow blob */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-md px-10">

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
              <span className="text-zinc-600 mx-1">→</span>
              <span className="text-zinc-400">&gt;</span>
            </div>
          </div>

          <p className="mt-10 text-xs text-zinc-600">
            Free to start. No credit card required.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE — either email gate or Clerk signup */}
      <div className="flex w-full md:w-1/2 items-center justify-center px-6 bg-[#0a0a0f]">
        <div className="w-full max-w-md">

          {/* Back to home — FE-01, already present */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="NextFlow"
              width={180}
              height={60}
              className="object-contain"
              style={{ filter: 'brightness(1.2)' }}
            />
          </div>

          {/* ---- STEP 1: Email gate (shown before Clerk) ---- */}
          {!showClerk && (
            <div className="mt-6 p-6 rounded-2xl border border-white/[0.08] bg-[#111118]">

              <h3 className="text-zinc-100 text-xl font-semibold mb-1">
                Create your account
              </h3>
              <p className="text-zinc-500 text-sm mb-6">
                Only <span className="text-blue-400">@{ALLOWED_DOMAIN}</span> email addresses are accepted.
              </p>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="text-zinc-400 text-sm block mb-1.5">
                    Work email address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      // clear error as user types so it doesn't feel sticky
                      if (error) setError('');
                    }}
                    placeholder={`you@${ALLOWED_DOMAIN}`}
                    className="w-full bg-[#18181f] border border-white/10 text-zinc-100 rounded-[10px] px-3 py-2.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    required
                  />

                  {/* inline error — only shown when error state is set */}
                  {error && (
                    <div className="flex items-start gap-2 mt-2">
                      <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-400 text-xs leading-relaxed">{error}</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-[10px] py-2.5 text-sm transition-colors"
                >
                  Continue
                </button>
              </form>

              <p className="text-zinc-500 text-sm mt-4 text-center">
                Already have an account?{' '}
                <Link href="/sign-in" className="text-blue-400 font-medium hover:text-blue-300">
                  Sign in
                </Link>
              </p>
            </div>
          )}

          {/* ---- STEP 2: Clerk SignUp (shown only after domain validation passes) ---- */}
          {showClerk && (
            <SignUp
              forceRedirectUrl="/dashboard"
              initialValues={{
                // pre-fill the email the user already typed so they don't have to re-enter it
                emailAddress: email,
              }}
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
          )}

        </div>
      </div>
    </div>
  );
}