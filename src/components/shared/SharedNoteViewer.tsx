import { useState, useRef, useCallback } from 'react';
import KnowledgeLinkPopover from '@/components/editor/KnowledgeLinkPopover';
import { renderHighlightedTextHtml } from '@/lib/knowledgeHighlight';
import type { Note, ContentBlock, KnowledgeLink } from '@/types/types';

interface OpenPopover {
  instanceId: string;
  linkId: string;
  position: { x: number; y: number };
  zIndex: number;
}

const BASE_Z   = 50;
let   uidCount = 0;

interface SharedNoteViewerProps {
  note: Note;
}

export default function SharedNoteViewer({ note }: SharedNoteViewerProps) {
  const [openPopovers, setOpenPopovers] = useState<OpenPopover[]>([]);
  const topZRef = useRef(BASE_Z);

  const handleLinkClick = useCallback(
    (link: KnowledgeLink, position: { x: number; y: number }) => {
      setOpenPopovers((prev) => {
        const existing = prev.find((p) => p.linkId === link.id);
        if (existing) {
          const next = ++topZRef.current;
          return prev.map((p) =>
            p.instanceId === existing.instanceId ? { ...p, zIndex: next } : p
          );
        }
        const stagger = prev.length * 24;
        const next = ++topZRef.current;
        return [
          ...prev,
          {
            instanceId: `kl-${++uidCount}`,
            linkId: link.id,
            position: { x: position.x + stagger, y: position.y + stagger },
            zIndex: next,
          },
        ];
      });
    },
    []
  );

  const handleClose = useCallback((instanceId: string) => {
    setOpenPopovers((prev) => prev.filter((p) => p.instanceId !== instanceId));
  }, []);

  const handleFocus = useCallback((instanceId: string) => {
    setOpenPopovers((prev) => {
      if (prev.length === 0) return prev;
      const isFront =
        prev.find((p) => p.instanceId === instanceId)?.zIndex ===
        Math.max(...prev.map((p) => p.zIndex));
      if (isFront) return prev;
      const next = ++topZRef.current;
      return prev.map((p) =>
        p.instanceId === instanceId ? { ...p, zIndex: next } : p
      );
    });
  }, []);

  const handleBlockClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = (e.target as HTMLElement | null)?.closest(
        '.knowledge-link'
      ) as HTMLElement | null;
      if (!target) return;
      const linkId = target.getAttribute('data-link-id');
      const link = note.knowledgeLinks.find((kl) => kl.id === linkId);
      if (!link) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = target.getBoundingClientRect();
      handleLinkClick(link, { x: rect.left, y: rect.bottom + 8 });
    },
    [note.knowledgeLinks, handleLinkClick]
  );

  const renderBlock = (block: ContentBlock) => {
    const blockLinks = note.knowledgeLinks.filter((kl) => kl.blockId === block.id);
    switch (block.type) {
      case 'text': {
        const html = renderHighlightedTextHtml(block.content || '', blockLinks, 'cursor-pointer');
        return (
          <div
            key={block.id}
            onClick={handleBlockClick}
            className="whitespace-pre-wrap break-words text-base leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }
      case 'image':
        return block.source ? (
          <img key={block.id} src={block.source} alt={block.content || 'Image'} className="w-full rounded-md" />
        ) : null;
      case 'audio':
        return block.source ? (
          <audio key={block.id} src={block.source} controls className="w-full" />
        ) : null;
      case 'video':
        return block.source ? (
          <video key={block.id} src={block.source} controls className="w-full rounded-md" />
        ) : null;
      default:
        return null;
    }
  };

  const sortedBlocks = [...note.blocks].sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="dreamverse-manuscript relative mx-auto my-2 w-full max-w-[780px] space-y-6 rounded-3xl px-6 py-8 md:px-11 md:py-10">
        <div className="pointer-events-none absolute top-0 left-8 right-8 h-[2px] rounded-full bg-gradient-to-r from-[#F5B971]/45 via-primary/50 to-[#B59CE2]/45" />
        <div className="space-y-3 border-b border-border/60 pb-5">
          <h1 className="font-heading text-3xl font-semibold text-foreground tracking-tight">
            {note.title || 'Untitled Note'}
          </h1>
          <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-muted-foreground">
            <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
            <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="prose prose-invert max-w-none space-y-4">
          {sortedBlocks.map((block) => renderBlock(block))}
        </div>
      </div>

      {openPopovers.map((p) => {
        const liveLink = note.knowledgeLinks.find((kl) => kl.id === p.linkId);
        if (!liveLink) return null;
        return (
          <KnowledgeLinkPopover
            key={p.instanceId}
            instanceId={p.instanceId}
            link={liveLink}
            initialPosition={p.position}
            zIndex={p.zIndex}
            onClose={handleClose}
            onFocus={handleFocus}
            onExpand={() => handleClose(p.instanceId)}
            onEdit={() => {}}
            onDelete={() => {}}
            readOnly={true}
          />
        );
      })}
    </>
  );
}
