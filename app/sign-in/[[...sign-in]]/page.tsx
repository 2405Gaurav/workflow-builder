import { SignIn } from '@clerk/nextjs';
import { Sparkles } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative"
      style={{ background: '#0a0a0f' }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 z-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(168, 85, 247, 0.2))',
            border: '1px solid rgba(124, 58, 237, 0.3)',
          }}
        >
          <Sparkles size={20} className="text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold gradient-text">NextFlow</h1>
      </div>

      <div className="z-10">
        <SignIn />
      </div>
    </div>
  );
}
