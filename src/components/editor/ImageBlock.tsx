import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Maximize2 } from 'lucide-react';
import type { ContentBlock } from '@/types/types';

interface ImageBlockProps {
  block: ContentBlock;
  onDelete: () => void;
}

export default function ImageBlock({ block, onDelete }: ImageBlockProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!block.source) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-border bg-surface text-sm text-muted-foreground">
        No image source
      </div>
    );
  }

  return (
    <>
      <div className="group relative overflow-hidden rounded-xl border border-border/80 bg-surface shadow-botanical transition-all duration-200 hover:border-primary/40">
        <div className="absolute right-2.5 top-2.5 z-10 flex gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 rounded-lg backdrop-blur-md"
            onClick={() => setIsFullscreen(true)}
            title="Expand image"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 rounded-lg backdrop-blur-md hover:text-destructive"
            onClick={onDelete}
            title="Delete image"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <img
          src={block.source}
          alt={block.content || 'Image'}
          className="w-full cursor-pointer object-cover transition-transform duration-300 ease-botanical group-hover:scale-[1.01]"
          onClick={() => setIsFullscreen(true)}
        />
      </div>

      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in-0 duration-200"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] animate-in zoom-in-95 duration-200">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setIsFullscreen(false)}
              className="absolute -right-3 -top-3 h-8 w-8 rounded-full shadow-lg"
              aria-label="Close fullscreen image"
            >
              <span className="text-lg leading-none">×</span>
            </Button>
            <img
              src={block.source}
              alt={block.content || 'Image'}
              className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
