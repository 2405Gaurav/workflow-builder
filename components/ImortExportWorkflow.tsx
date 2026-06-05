'use client';

import { useRef, useState } from 'react';
import { useWorkflowStore } from '@/lib/store';
import { Download, Upload, X, HardDrive, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function ImportExportButtons() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importWorkflow, nodes, edges } = useWorkflowStore();
  const [showExportModal, setShowExportModal] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importWorkflow(event.target?.result as string);
      if (!result.success) alert(result.error);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // build the workflow payload once, reuse for both options
  const buildWorkflowJson = () => ({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    nodes,
    edges,
  });

  // same local download logic as before
  const handleLocalDownload = () => {
    const workflow = buildWorkflowJson();
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  // send workflow JSON to the user's email via our API
  const handleEmailExport = async () => {
    setEmailStatus('loading');
    setEmailMessage('');
    try {
      const res = await fetch('/api/export/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: buildWorkflowJson() }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailStatus('success');
        setEmailMessage('Workflow sent to your email!');
      } else {
        setEmailStatus('error');
        setEmailMessage(data.error || 'Something went wrong');
      }
    } catch {
      setEmailStatus('error');
      setEmailMessage('Network error — try again');
    }
  };

  // reset modal state when closing
  const closeModal = () => {
    setShowExportModal(false);
    setEmailStatus('idle');
    setEmailMessage('');
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Export button — opens the modal */}
      <Button
        variant="outline"
        onClick={() => setShowExportModal(true)}
        className="h-8 px-2 text-xs bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-full gap-1.5"
        title="Export JSON"
      >
        <Download size={13} />
        <span className="hidden lg:inline">Export</span>
      </Button>

      {/* Import button — unchanged */}
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="h-8 px-2 text-xs bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-full gap-1.5"
        title="Import JSON"
      >
        <Upload size={13} />
        <span className="hidden lg:inline">Import</span>
      </Button>

      {/* ── Export Modal — centered over the canvas area (below toolbar) ── */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ top: '50vh' }}
            className="fixed left-0 right-0 bottom-0 z-50 flex items-center justify-center"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-[420px] bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* close X */}
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 p-1.5 text-white/20 hover:text-white/60 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>

              <h2 className="text-sm font-bold text-white/80 mb-1">Export Workflow</h2>
              <p className="text-xs text-white/25 mb-5">Choose an export method.</p>

              {/* option cards */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleLocalDownload}
                  className="group flex flex-col items-center gap-2.5 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover:bg-white/[0.08] transition-all">
                    <HardDrive size={18} className="text-white/40 group-hover:text-white/70 transition-colors" />
                  </div>
                  <p className="text-[11px] font-medium text-white/60">Download Local</p>
                </button>

                <button
                  onClick={handleEmailExport}
                  disabled={emailStatus === 'loading' || emailStatus === 'success'}
                  className="group flex flex-col items-center gap-2.5 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover:bg-white/[0.08] transition-all">
                    {emailStatus === 'loading' ? (
                      <Loader2 size={18} className="text-white/40 animate-spin" />
                    ) : emailStatus === 'success' ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <Mail size={18} className="text-white/40 group-hover:text-white/70 transition-colors" />
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-white/60">Send to Email</p>
                </button>
              </div>

              {/* status message */}
              <AnimatePresence>
                {emailMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] ${
                      emailStatus === 'success'
                        ? 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-400/80'
                        : 'bg-red-500/5 border border-red-500/10 text-red-400/80'
                    }`}
                  >
                    {emailStatus === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {emailMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* cancel button */}
              <button
                onClick={closeModal}
                className="w-full mt-4 py-2 text-[11px] text-white/30 hover:text-white/50 transition-colors rounded-lg border border-white/[0.04] hover:border-white/[0.08]"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}