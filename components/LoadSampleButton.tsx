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
  className="h-8 px-2 text-xs bg-transparent border-white/10 text-white/50 hover:bg-white/5 hover:text-white hover:border-white/20 rounded-full gap-1.5 transition-all group"
  title="Load sample workflow"
>
  <Box size={13} className="group-hover:text-[#eab308] transition-colors" />
  <span className="hidden lg:inline">Sample</span>
</Button>
  );
}