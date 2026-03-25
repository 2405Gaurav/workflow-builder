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
   <Button variant="outline" onClick={exportWorkflow}
  className="h-8 px-2 text-xs bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-full gap-1.5"
  title="Export JSON"
>
  <Download size={13} />
  <span className="hidden lg:inline">Export</span>
</Button>

<Button variant="outline" onClick={() => fileInputRef.current?.click()}
  className="h-8 px-2 text-xs bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-full gap-1.5"
  title="Import JSON"
>
  <Upload size={13} />
  <span className="hidden lg:inline">Import</span>
</Button>
    </>
  );
}