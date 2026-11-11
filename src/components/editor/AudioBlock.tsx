import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { ContentBlock } from '@/types/types';

interface AudioBlockProps {
  block: ContentBlock;
  onDelete: () => void;
}

export default function AudioBlock({ block, onDelete }: AudioBlockProps) {
  if (!block.source) {
    return (
      <div className="flex h-20 items-center justify-center rounded-md border border-border bg-surface text-sm text-muted-foreground">
        No audio source
      </div>
    );
  }

  return (
    <div className="group relative rounded-md border border-border bg-surface p-4">
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      
      <audio
        src={block.source}
        controls
        className="w-full"
      />
    </div>
  );
}
