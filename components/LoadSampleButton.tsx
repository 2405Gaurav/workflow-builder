'use client';

import { Button } from '@/components/ui/button';
import { useWorkflowStore } from '@/lib/store';
import { sampleWorkflow } from '@/lib/sample-workflow';
import { Workflow } from 'lucide-react';

export function LoadSampleButton() {
  const { setNodes, setEdges, saveToHistory } = useWorkflowStore();

  const handleLoadSample = () => {
    setNodes(sampleWorkflow.nodes);
    setEdges(sampleWorkflow.edges);
    saveToHistory();
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleLoadSample}
      className="h-8 px-3 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 gap-1.5 rounded-lg"
    >
      <Workflow size={14} />
      Sample
    </Button>
  );
}
