import { useState, useCallback, useRef, useEffect } from 'react';
import ContentToolbar from './ContentToolbar';
import TextBlock from './TextBlock';
import ImageBlock from './ImageBlock';
import AudioBlock from './AudioBlock';
import VideoBlock from './VideoBlock';
import MediaUploadModal from './MediaUploadModal';
import AddKnowledgeModal from './AddKnowledgeModal';
import KnowledgeLinkPopover from './KnowledgeLinkPopover';
import KnowledgeLinkModal from './KnowledgeLinkModal';
import type { Note, KnowledgeLink, KnowledgeContentBlock } from '@/types/types';

// Each open popover card carries its own instance id, link reference, spawn position, and z-order
interface OpenPopover {
  instanceId: string;
  linkId: string;
  position: { x: number; y: number };
  zIndex: number;
}

const BASE_Z   = 50;   // lowest z-index for popovers
let   uidCount = 0;    // monotonically increasing for unique instance ids

interface BlockEditorProps {
  note: Note;
  onUpdateBlock: (blockId: string, content: string) => void;
  onAddBlock: (type: 'text' | 'image' | 'audio' | 'video', source?: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onAddKnowledgeLink: (blockId: string, text: string, contentBlocks: KnowledgeContentBlock[]) => void | Promise<void>;
  onEditKnowledgeLink: (linkId: string, contentBlocks: KnowledgeContentBlock[]) => void | Promise<void>;
  onDeleteKnowledgeLink: (linkId: string) => void | Promise<void>;
}

export default function BlockEditor({
  note,
  onUpdateBlock,
  onAddBlock,
  onDeleteBlock,
  onAddKnowledgeLink,
  onEditKnowledgeLink,
  onDeleteKnowledgeLink,
}: BlockEditorProps) {
  const [mediaModalOpen, setMediaModalOpen]   = useState(false);
  const [mediaType, setMediaType]             = useState<'image' | 'audio' | 'video'>('image');
  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false);
  const [selectedText, setSelectedText]       = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState('');

  // ── multi-popover state ──────────────────────────────────────────
  const [openPopovers, setOpenPopovers] = useState<OpenPopover[]>([]);
  const topZRef                         = useRef(BASE_Z);

  // ── expanded (modal) state ───────────────────────────────────────
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null);

  // Reset floating overlays cleanly whenever switching to a different note
  useEffect(() => {
    setOpenPopovers([]);
    setExpandedLinkId(null);
    setKnowledgeModalOpen(false);
    setMediaModalOpen(false);
    setSelectedText('');
    setSelectedBlockId('');
  }, [note.id]);

  // Open a new popover card (or bring existing one for same link to front)
  const handleKnowledgeLinkClick = useCallback(
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

  // Bring a card to the front when the user clicks/focuses it
  const handleFocusPopover = useCallback((instanceId: string) => {
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

  // Close a single card by its instance id
  const handleClosePopover = useCallback((instanceId: string) => {
    setOpenPopovers((prev) => prev.filter((p) => p.instanceId !== instanceId));
  }, []);

  const handleAddText  = () => onAddBlock('text');
  const handleAddImage = () => { setMediaType('image'); setMediaModalOpen(true); };
  const handleAddAudio = () => { setMediaType('audio'); setMediaModalOpen(true); };
  const handleAddVideo = () => { setMediaType('video'); setMediaModalOpen(true); };

  const handleAddKnowledge = (blockId: string, text: string) => {
    setSelectedBlockId(blockId);
    setSelectedText(text);
    setKnowledgeModalOpen(true);
  };

  const handleKnowledgeSave = (contentBlocks: KnowledgeContentBlock[]) => {
    onAddKnowledgeLink(selectedBlockId, selectedText, contentBlocks);
  };

  const sortedBlocks = [...note.blocks].sort((a, b) => a.order - b.order);
  const expandedLink = expandedLinkId
    ? note.knowledgeLinks.find((kl) => kl.id === expandedLinkId) ?? null
    : null;

  return (
    <div className="space-y-4" dir="ltr">
      <ContentToolbar
        onAddText={handleAddText}
        onAddImage={handleAddImage}
        onAddAudio={handleAddAudio}
        onAddVideo={handleAddVideo}
      />

      <div className="space-y-4" dir="ltr">
        {sortedBlocks.map((block) => {
          switch (block.type) {
            case 'text':
              return (
                <TextBlock
                  key={block.id}
                  block={block}
                  knowledgeLinks={note.knowledgeLinks}
                  onUpdate={(content) => onUpdateBlock(block.id, content)}
                  onDelete={() => onDeleteBlock(block.id)}
                  onAddKnowledge={(text) => handleAddKnowledge(block.id, text)}
                  onKnowledgeLinkClick={handleKnowledgeLinkClick}
                />
              );
            case 'image':
              return <ImageBlock key={block.id} block={block} onDelete={() => onDeleteBlock(block.id)} />;
            case 'audio':
              return <AudioBlock key={block.id} block={block} onDelete={() => onDeleteBlock(block.id)} />;
            case 'video':
              return <VideoBlock key={block.id} block={block} onDelete={() => onDeleteBlock(block.id)} />;
            default:
              return null;
          }
        })}
      </div>

      <MediaUploadModal
        open={mediaModalOpen}
        onOpenChange={setMediaModalOpen}
        mediaType={mediaType}
        onSave={(src) => onAddBlock(mediaType, src)}
      />

      <AddKnowledgeModal
        open={knowledgeModalOpen}
        onOpenChange={setKnowledgeModalOpen}
        selectedText={selectedText}
        onSave={handleKnowledgeSave}
      />

      {/* ── multi-popover layer ──────────────────────────── */}
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
            onClose={handleClosePopover}
            onFocus={handleFocusPopover}
            onExpand={(link) => {
              setExpandedLinkId(link.id);
              handleClosePopover(p.instanceId);
            }}
            onEdit={onEditKnowledgeLink}
            onDelete={onDeleteKnowledgeLink}
          />
        );
      })}

      {expandedLink && (
        <KnowledgeLinkModal
          link={expandedLink}
          onClose={() => setExpandedLinkId(null)}
          onEdit={onEditKnowledgeLink}
          onDelete={onDeleteKnowledgeLink}
        />
      )}
    </div>
  );
}
