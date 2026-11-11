import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, Edit2, Trash2, Save, X } from 'lucide-react';
import RichKnowledgeEditor from './RichKnowledgeEditor';
import KnowledgeContentRenderer from './KnowledgeContentRenderer';
import type { KnowledgeLink, KnowledgeContentBlock } from '@/types/types';

interface KnowledgeLinkPopoverProps {
  instanceId: string;                           // unique key for this open card
  link: KnowledgeLink;
  initialPosition: { x: number; y: number };
  zIndex: number;
  onClose: (instanceId: string) => void;
  onFocus: (instanceId: string) => void;        // bring to front
  onExpand: (link: KnowledgeLink) => void;
  onEdit: (linkId: string, contentBlocks: KnowledgeContentBlock[]) => void;
  onDelete: (linkId: string) => void;
  readOnly?: boolean;
}

export default function KnowledgeLinkPopover({
  instanceId,
  link,
  initialPosition,
  zIndex,
  onClose,
  onFocus,
  onExpand,
  onEdit,
  onDelete,
  readOnly = false,
}: KnowledgeLinkPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // ── position state (starts at spawn point, clamped to viewport) ──
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    const W = 384; // w-96
    const H = 300; // approx
    return {
      x: Math.min(initialPosition.x, window.innerWidth  - W - 12),
      y: Math.min(initialPosition.y, window.innerHeight - H - 12),
    };
  });

  // ── drag state stored in refs (no re-render during drag) ──
  const dragging  = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // ── editing state ──
  const [isEditing, setIsEditing] = useState(false);
  const [editContentBlocks, setEditContentBlocks] = useState<KnowledgeContentBlock[]>(
    link.contentBlocks || []
  );

  useEffect(() => {
    if (!isEditing) {
      setEditContentBlocks(link.contentBlocks || []);
    }
  }, [link, isEditing]);

  // ── clamp helper ──
  const clamp = useCallback((x: number, y: number) => {
    const el = popoverRef.current;
    if (!el) return { x, y };
    const { offsetWidth: w, offsetHeight: h } = el;
    return {
      x: Math.max(8, Math.min(x, window.innerWidth  - w - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - h - 8)),
    };
  }, []);

  // ── mouse drag ──
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag from the header bar, not from buttons inside it
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    onFocus(instanceId);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      setPos(clamp(dragStart.current.px + dx, dragStart.current.py + dy));
    };
    const onMouseUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, [clamp]);

  // ── touch drag ──
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const t = e.touches[0];
    dragging.current = true;
    dragStart.current = { mx: t.clientX, my: t.clientY, px: pos.x, py: pos.y };
    onFocus(instanceId);
  };

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - dragStart.current.mx;
      const dy = t.clientY - dragStart.current.my;
      setPos(clamp(dragStart.current.px + dx, dragStart.current.py + dy));
    };
    const onTouchEnd = () => { dragging.current = false; };
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend',  onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend',  onTouchEnd);
    };
  }, [clamp]);

  // ── edit / delete handlers ──
  const handleSave = () => {
    if (editContentBlocks.length === 0) return;
    onEdit(link.id, editContentBlocks);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContentBlocks(link.contentBlocks || []);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Delete this knowledge link? The text will remain but the hidden knowledge will be removed.')) {
      onDelete(link.id);
      onClose(instanceId);
    }
  };

  const hasRichContent   = link.contentBlocks && link.contentBlocks.length > 0;
  const hasLegacyContent = !hasRichContent && link.content;

  return (
    <div
      ref={popoverRef}
      className="glass-lavender fixed w-96 rounded-2xl shadow-[0_22px_54px_-12px_rgba(14,8,28,0.48)] animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        left:   `${pos.x}px`,
        top:    `${pos.y}px`,
        zIndex,
      }}
      onMouseDown={() => onFocus(instanceId)}
    >
      {/* ── drag handle / header ─────────────────────────── */}
      <div
        data-cursor="grab"
        className="flex cursor-grab items-center justify-between gap-2 rounded-t-2xl border-b border-white/35 dark:border-white/12 bg-gradient-to-r from-primary/[0.12] via-transparent to-[#B59CE2]/[0.12] px-4 py-2.5 active:cursor-grabbing select-none"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <span className="truncate text-sm font-medium text-foreground">{link.text}</span>
        <div className="flex shrink-0 items-center gap-1">
          {!readOnly && !isEditing && (
            <>
              <Button
                variant="ghost" size="icon" className="h-6 w-6"
                onClick={() => setIsEditing(true)} title="Edit"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={handleDelete} title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
          {/* Always show close button — each card closes independently */}
          <Button
            variant="ghost" size="icon" className="h-6 w-6"
            onClick={() => onClose(instanceId)} title="Close"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* ── body ─────────────────────────────────────────── */}
      <div className="space-y-3 p-4">
        {isEditing && !readOnly ? (
          <div className="space-y-2">
            <div className="max-h-[400px] overflow-y-auto">
              <RichKnowledgeEditor blocks={editContentBlocks} onChange={setEditContentBlocks} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel} className="h-7 text-xs">
                <X className="mr-1 h-3 w-3" />Cancel
              </Button>
              <Button
                variant="default" size="sm" onClick={handleSave}
                className="h-7 text-xs" disabled={editContentBlocks.length === 0}
              >
                <Save className="mr-1 h-3 w-3" />Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-64 overflow-y-auto">
              {hasRichContent ? (
                <KnowledgeContentRenderer blocks={link.contentBlocks!} />
              ) : hasLegacyContent ? (
                <div className="whitespace-pre-wrap text-sm text-muted-foreground">{link.content}</div>
              ) : (
                <div className="text-sm text-muted-foreground">No knowledge content yet</div>
              )}
            </div>
            {!readOnly && (
              <div className="flex justify-end">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => onExpand(link)}
                  className="h-7 text-xs"
                >
                  <Maximize2 className="mr-1 h-3 w-3" />Expand
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
