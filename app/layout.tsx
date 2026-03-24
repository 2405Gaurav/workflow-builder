import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'NextFlow - LLM Workflow Builder',
  description: 'Build and execute complex LLM workflows visually with a drag-and-drop DAG editor. Connect text, image, and video nodes to create powerful AI pipelines.',
  keywords: ['AI', 'LLM', 'workflow', 'automation', 'Gemini', 'DAG', 'pipeline'],
  openGraph: {
    title: 'NextFlow - LLM Workflow Builder',
    description: 'Build and execute complex LLM workflows visually',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#7c3aed',
          colorBackground: '#0d0d14',
          colorInputBackground: 'rgba(255,255,255,0.05)',
          colorInputText: '#e5e7eb',
          borderRadius: '0.75rem',
        },
      }}
    >
      <html lang="en" className="dark">
        <body className={`${inter.variable} font-sans`}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
