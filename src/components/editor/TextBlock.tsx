import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  renderHighlightedTextHtml,
  getBlockLinksSignature,
  extractEditorPlainText,
} from '@/lib/knowledgeHighlight';
import type { ContentBlock, KnowledgeLink } from '@/types/types';

interface TextBlockProps {
  block: ContentBlock;
  knowledgeLinks: KnowledgeLink[];
  onUpdate: (content: string) => void;
  onDelete: () => void;
  onAddKnowledge: (text: string) => void;
  onKnowledgeLinkClick: (link: KnowledgeLink, position: { x: number; y: number }) => void;
}

export default function TextBlock({
  block,
  knowledgeLinks,
  onUpdate,
  onDelete,
  onAddKnowledge,
  onKnowledgeLinkClick,
}: TextBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef<string | null>(null);
  const lastLinksSigRef = useRef<string | null>(null);
  const editedSinceSyncRef = useRef<boolean>(false);

  // Sync innerHTML with plain text content and knowledge link highlights when not actively editing
  useEffect(() => {
    if (!contentRef.current || isEditing) return;

    const plainContent = block.content || '';
    const blockLinks = knowledgeLinks.filter((kl) => kl.blockId === block.id);
    const linksSig = getBlockLinksSignature(knowledgeLinks, block.id);

    const needsSync =
      plainContent !== lastContentRef.current ||
      linksSig !== lastLinksSigRef.current ||
      editedSinceSyncRef.current;

    if (needsSync) {
      contentRef.current.innerHTML = renderHighlightedTextHtml(plainContent, blockLinks);
      lastContentRef.current = plainContent;
      lastLinksSigRef.current = linksSig;
      editedSinceSyncRef.current = false;
    }
  }, [block.content, knowledgeLinks, block.id, isEditing]);

  // Delegated click handler so links remain interactive across every DOM re-sync
  const handleContentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = (e.target as HTMLElement | null)?.closest(
        '.knowledge-link'
      ) as HTMLElement | null;
      if (!target || !contentRef.current?.contains(target)) return;

      const linkId = target.getAttribute('data-link-id');
      const link = knowledgeLinks.find((kl) => kl.id === linkId);
      if (!link) return;

      e.preventDefault();
      e.stopPropagation();
      const rect = target.getBoundingClientRect();
      onKnowledgeLinkClick(link, { x: rect.left, y: rect.bottom + 8 });
    },
    [knowledgeLinks, onKnowledgeLinkClick]
  );

  const handleInput = () => {
    if (contentRef.current) {
      const text = extractEditorPlainText(contentRef.current);
      lastContentRef.current = text;
      editedSinceSyncRef.current = true;
      onUpdate(text);
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleAddKnowledge = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      toast.error('Please select text first');
      return;
    }

    const range = selection.getRangeAt(0);
    if (!contentRef.current || !contentRef.current.contains(range.commonAncestorContainer)) {
      toast.error('Please select text inside this block first');
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      toast.error('Please select text first');
      return;
    }

    const existingLink = knowledgeLinks.find(
      (kl) => kl.blockId === block.id && kl.text === selectedText
    );

    if (existingLink) {
      toast.info('This text already has knowledge attached');
      return;
    }

    onAddKnowledge(selectedText);
  };

  return (
    <div
      className="group relative rounded-xl border border-border/80 bg-surface/80 p-4 transition-[border-color,box-shadow,background-color] duration-200 hover:border-primary/40 focus-within:border-primary/55 focus-within:bg-card/85 focus-within:shadow-botanical"
      dir="ltr"
    >
      <div className="absolute right-2.5 top-2.5 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAddKnowledge}
          title="Add Knowledge Link"
        >
          <Link2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg hover:text-destructive"
          onClick={onDelete}
          title="Delete Block"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      <div
        ref={contentRef}
        contentEditable="true"
        dir="ltr"
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleContentClick}
        className="block-editor-content min-h-[60px] pr-16 text-base leading-relaxed text-foreground outline-none whitespace-pre-wrap break-words"
        style={{ 
          lineHeight: '1.75', 
          direction: 'ltr', 
          textAlign: 'left', 
          unicodeBidi: 'plaintext',
          writingMode: 'horizontal-tb'
        }}
        suppressContentEditableWarning
      />
      
      {!block.content && !isEditing && (
        <div className="pointer-events-none absolute left-4 top-4 text-sm text-muted-foreground/75">
          Start writing…
        </div>
      )}
    </div>
  );
}
