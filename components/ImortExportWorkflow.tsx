'use client';

import { useRef } from 'react';
import { useWorkflowStore } from '@/lib/store';
import { Download, Upload } from 'lucide-react';
import { Button } from './ui/button';

export function ImportExportButtons() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { exportWorkflow, importWorkflow } = useWorkflowStore();

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

  return (
    <>
      <Button
        variant="outline"
        onClick={exportWorkflow}
        className="h-9 px-4 text-xs bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-full gap-2"
      >
        <Download size={14} />
        Export
      </Button>

      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="h-9 px-4 text-xs bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-full gap-2"
      >
        <Upload size={14} />
        Import
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}