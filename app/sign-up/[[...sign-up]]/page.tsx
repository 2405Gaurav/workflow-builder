import { SignUp } from '@clerk/nextjs';
import { Sparkles } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-[#0a0a0f] font-[Space_Grotesk]">

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:32px_32px]" />

      {/* Glow blobs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 z-10">
        <div className="w-9 h-9 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg flex items-center justify-center">
          <Sparkles size={16} />
        </div>
        <h1 className="text-xl font-semibold text-white tracking-tight">
          NextFlow
        </h1>
      </div>

      <div className="z-10">
        <SignUp
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

              headerTitle:
                'text-zinc-100 text-xl font-semibold',

              headerSubtitle:
                'text-zinc-500',

              formFieldLabel:
                'text-zinc-400 text-sm',

              formFieldInput:
                'bg-[#18181f] border border-white/10 text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-600',

              formButtonPrimary:
                'bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors',

              footerActionText:
                'text-zinc-500',

              footerActionLink:
                'text-blue-400 font-medium hover:text-blue-300',

              socialButtonsBlockButton:
                'bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-zinc-300',

              dividerLine:
                'bg-white/10',

              dividerText:
                'text-zinc-600',

              alertText:
                'text-red-400',

              identityPreviewText:
                'text-zinc-300',

              identityPreviewEditButton:
                'text-blue-400',
            },
          }}
        />
      </div>
    </div>
  );
}