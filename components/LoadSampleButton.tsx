'use client';

import { Button } from '@/components/ui/button';
import { useWorkflowStore } from '@/lib/store';
import { sampleWorkflow } from '@/lib/sample-workflow';
import { Box } from 'lucide-react'; 

export function LoadSampleButton() {
  const { setNodes, setEdges, saveToHistory } = useWorkflowStore();

  const handleLoadSample = () => {
    //kreaaaaa style
    setNodes(sampleWorkflow.nodes as any);
    setEdges(sampleWorkflow.edges as any);
    saveToHistory();
  };

  return (
    <Button
      variant="outline"
      onClick={handleLoadSample}
      className="h-9 px-4 text-xs bg-transparent border-white/10 text-white/50 hover:bg-white/5 hover:text-white hover:border-white/20 rounded-full gap-2 transition-all duration-200 group"
    >
      <Box size={14} className="group-hover:text-[#eab308] transition-colors" />
      Sample
    </Button>
  );
}