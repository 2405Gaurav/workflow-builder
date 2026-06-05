// navbar component - top nav for the landing page
// handles auth buttons and links, nothin too fancy here
// shows sign in/up for guests and dashboard link for loged in users
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';
import Link from 'next/link';

interface NavbarProps {
  variant?: 'landing' | 'workflow';
}

export default function Navbar({ variant = 'landing' }: NavbarProps) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  if (variant === 'workflow') {
    // ... your existing workflow header unchanged
  }

  // ── LANDING NAV ─────────────────────────────────────────────────────────────
  return (
    <nav
      className="fixed top-0 w-full z-50 flex items-center justify-between px-4 sm:px-8 md:px-16 h-14 sm:h-16"
      style={{
        background: 'transparent',
        backdropFilter: 'none',
        border: 'none',
      }}
    >
      {/* Logo — no background, blends into dark page */}
      <Link href="/" className="flex items-center gap-3 shrink-0">
        <Image
          src="/logo.png"
          alt="NextFlow"
          width={120}
          height={40}
          className="object-contain opacity-90 hover:opacity-100 transition-opacity duration-300 sm:w-[160px]"
          style={{ filter: 'brightness(1.1) drop-shadow(0 0 12px rgba(255,255,255,0.08))' }}
        />
      </Link>

      {/* auth btns - show sign in/up when loged out, dashbaord link when loged in */}
      <div className="flex items-center gap-2 sm:gap-4">
        {isLoaded && !isSignedIn && (
          <>
            <Link
              href="/sign-in"
              className="text-[13px] font-medium tracking-wide transition-all duration-200"
              style={{ color: 'rgba(255,255,255,0.45)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >
              Sign in
            </Link>

            <Link
              href="/sign-up"
              className="text-[11px] sm:text-[13px] font-semibold tracking-wide px-3 sm:px-5 py-1.5 sm:py-2 rounded-full transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
              }}
            >
              Get Started
            </Link>
          </>
        )}

        {/* signed in state - go to dashbaord instead of workflow directley */}
        {isLoaded && isSignedIn && (
          <>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-[13px] font-medium tracking-wide cursor-pointer transition-all duration-200 mr-2"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            >
              Dashboard →
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
          </>
        )}
      </div>
    </nav>
  );
}