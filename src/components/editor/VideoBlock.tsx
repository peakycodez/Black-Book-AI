import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { ContentBlock } from '@/types/types';

interface VideoBlockProps {
  block: ContentBlock;
  onDelete: () => void;
}

export default function VideoBlock({ block, onDelete }: VideoBlockProps) {
  if (!block.source) {
    return (
      <div className="flex h-48 items-center justify-center rounded-md border border-border bg-surface text-sm text-muted-foreground">
        No video source
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-md border border-border bg-surface">
      <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="secondary"
          size="icon"
          className="h-7 w-7"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      
      <video
        src={block.source}
        controls
        className="w-full"
      />
    </div>
  );
}
