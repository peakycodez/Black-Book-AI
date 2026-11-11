import { ExternalLink } from 'lucide-react';
import type { KnowledgeContentBlock } from '@/types/types';

interface KnowledgeContentRendererProps {
  blocks: KnowledgeContentBlock[];
}

export default function KnowledgeContentRenderer({ blocks }: KnowledgeContentRendererProps) {
  if (!blocks || blocks.length === 0) {
    return <div className="text-sm text-muted-foreground">No content yet</div>;
  }

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-3">
      {sortedBlocks.map((block) => {
        switch (block.type) {
          case 'text':
            return (
              <div key={block.id} className="whitespace-pre-wrap text-sm text-foreground">
                {block.value}
              </div>
            );

          case 'link':
            return (
              <a
                key={block.id}
                href={block.value}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {block.label || block.value}
              </a>
            );

          case 'image':
            return (
              <div key={block.id} className="overflow-hidden rounded-md border border-border">
                <img
                  src={block.value}
                  alt="Knowledge content"
                  className="h-auto w-full object-cover"
                  loading="lazy"
                />
              </div>
            );

          case 'audio':
            return (
              <div key={block.id} className="rounded-md border border-border bg-muted p-3">
                <audio controls className="w-full">
                  <source src={block.value} />
                  Your browser does not support audio playback.
                </audio>
              </div>
            );

          case 'video':
            return (
              <div key={block.id} className="overflow-hidden rounded-md border border-border">
                <video controls className="h-auto w-full">
                  <source src={block.value} />
                  Your browser does not support video playback.
                </video>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
