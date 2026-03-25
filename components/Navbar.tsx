'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { Globe, Github } from 'lucide-react';

interface NavbarProps {
  variant?: 'landing' | 'workflow';
}

export default function Navbar({ variant = 'landing' }: NavbarProps) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  // ── WORKFLOW HEADER ──────────────────────────────────────────────────────────
  if (variant === 'workflow') {
    return (
      <header
        className="h-12 flex items-center justify-between px-4 shrink-0 z-50"
        style={{
          background: 'rgba(12, 12, 18, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Left: Logo + Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pt-1">
            <Image
              src="/logo.png"
              alt="NextFlow"
              width={150}
              height={60}
              className="object-contain"
              style={{ filter: 'brightness(1.2)' }}
            />
          </div>
          <span
            className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full text-gray-500 font-medium"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            LLM Workflow Builder
          </span>
        </div>

        {/* Right: Portfolio + GitHub + UserButton */}
        <div className="flex items-center gap-2">
          <a
            href="https://thegauravthakur.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-all group"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Globe size={12} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
            <span className="group-hover:text-purple-300 transition-colors">Portfolio</span>
          </a>

          <a
            href="https://github.com/2405Gaurav"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-all group"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Github size={12} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
            <span className="group-hover:text-purple-300 transition-colors">GitHub</span>
          </a>

          <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />

          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-7 h-7 ring-2 ring-purple-500/40 ring-offset-1 ring-offset-[#0a0a0f]',
                userButtonPopoverCard: 'bg-[#12121a] border border-white/10 shadow-xl shadow-black/50',
                userButtonPopoverActionButton: 'text-gray-300 hover:text-white hover:bg-white/5',
                userButtonPopoverActionButtonText: 'text-gray-300',
                userButtonPopoverActionButtonIcon: 'text-gray-400',
                userButtonPopoverFooter: 'border-t border-white/10',
                userPreviewMainIdentifier: 'text-white font-semibold',
                userPreviewSecondaryIdentifier: 'text-gray-400',
                userButtonTrigger: 'focus:shadow-none focus:ring-2 focus:ring-purple-500/50',
              },
              variables: {
                colorBackground: '#12121a',
                colorText: '#ffffff',
                colorTextSecondary: '#9ca3af',
                colorPrimary: '#7c3aed',
                colorDanger: '#ef4444',
                borderRadius: '0.75rem',
              },
            }}
          />
        </div>
      </header>
    );
  }

  // ── LANDING NAV ─────────────────────────────────────────────────────────────
  return (
    <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-6 md:px-12 h-20 border-b border-white/5 bg-black/60 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 bg-white rounded-sm rotate-45" />
        <span className="text-xl font-bold tracking-tighter uppercase">NextFlow</span>
        <span className="text-[9px] px-2 py-0.5 rounded-full border border-purple-500/30 text-purple-400 font-mono">
          v2.0
        </span>
      </div>

      {/* Auth */}
      <div className="flex items-center gap-4">
        {isLoaded && !isSignedIn && (
          <>
            <SignInButton mode="modal" forceRedirectUrl="/workflow">
              <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors cursor-pointer">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/workflow">
              <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-all cursor-pointer">
                Get Started
              </button>
            </SignUpButton>
          </>
        )}
        {isLoaded && isSignedIn && (
          <>
            <button
              onClick={() => router.push('/workflow')}
              className="text-sm font-bold text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              Go to Workspace →
            </button>
            <UserButton
              appearance={{
                elements: { avatarBox: 'w-8 h-8' },
                variables: {
                  colorPrimary: '#7c3aed',
                  colorBackground: '#12121a',
                  colorText: '#ffffff',
                  borderRadius: '0.75rem',
                },
              }}
            />
          </>
        )}
      </div>
    </nav>
  );
}