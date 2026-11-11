import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Check, Layers, Lock, Share2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import BlockEditor from '@/components/editor/BlockEditor';
import ShareModal from './ShareModal';
import {
  DreamverseBlossom,
  DreamverseCard,
  DreamverseMicroLoader,
  DreamverseSeal,
  SanctuaryAlcoveVignette,
} from '@/components/dreamverse';
import { MOTION_EASE } from '@/lib/motion';
import type { Note, KnowledgeContentBlock } from '@/types/types';

interface EditorProps {
  note: Note | null;
  isDirty: boolean;
  isSaving: boolean;
  onTitleChange: (title: string) => void;
  onUpdateBlock: (blockId: string, content: string) => void;
  onAddBlock: (type: 'text' | 'image' | 'audio' | 'video', source?: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onAddKnowledgeLink: (
    blockId: string,
    text: string,
    contentBlocks: KnowledgeContentBlock[]
  ) => void | Promise<void>;
  onEditKnowledgeLink: (linkId: string, contentBlocks: KnowledgeContentBlock[]) => void | Promise<void>;
  onDeleteKnowledgeLink: (linkId: string) => void | Promise<void>;
  onSave: () => Promise<boolean> | void;
  onOpenAIBrain?: () => void;
  isAIBrainOpen?: boolean;
  onOpenMobileArchive?: () => void;
}

export default function Editor({
  note,
  isDirty,
  isSaving,
  onTitleChange,
  onUpdateBlock,
  onAddBlock,
  onDeleteBlock,
  onAddKnowledgeLink,
  onEditKnowledgeLink,
  onDeleteKnowledgeLink,
  onSave,
  onOpenAIBrain,
  isAIBrainOpen = false,
  onOpenMobileArchive,
}: EditorProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // Keyboard shortcut: Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (note && isDirty) {
          setSavedFlash(true);
          onSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [note, isDirty, onSave]);

  // Brief confirmation indicator after save settles
  useEffect(() => {
    if (!isSaving && !isDirty && savedFlash) {
      const t = setTimeout(() => setSavedFlash(false), 1800);
      return () => clearTimeout(t);
    }
  }, [isSaving, isDirty, savedFlash]);

  const handleSaveClick = () => {
    setSavedFlash(true);
    onSave();
  };

  if (!note) {
    return (
      <div
        className="flex flex-1 items-center justify-center bg-transparent p-4 sm:p-8 relative overflow-y-auto"
        dir="ltr"
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.34, ease: MOTION_EASE.botanical }}
          className="relative z-10 w-full max-w-xl my-auto"
        >
          <DreamverseCard elevated material="pearl" spotlight className="overflow-hidden p-4 sm:p-7 text-center">
            <div className="space-y-4 sm:space-y-5">
              {/* Illustrated Japanese Workspace Alcove */}
              <div className="relative overflow-hidden rounded-2xl border border-white/45 dark:border-white/15 shadow-inner">
                <SanctuaryAlcoveVignette className="aspect-[16/9] sm:aspect-[16/8.2] w-full rounded-xl" />
                <div className="pointer-events-none absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex items-center gap-1.5 rounded-full border border-white/25 bg-[#191127]/60 px-2.5 py-1 text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur-md">
                  <DreamverseBlossom size={11} className="text-[#F4A7C1] shrink-0" />
                  <span>BlackBook Workspace</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="mx-auto flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/[0.08] shadow-xs">
                  <DreamverseSeal size={24} />
                </div>
                <h2 className="font-heading text-lg sm:text-2xl font-bold text-foreground tracking-tight">
                  Where Ideas Become Knowledge
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                  Select a folder from the left sidebar or create a new note to write with inline
                  knowledge links and AI Brain.
                </p>
                {onOpenMobileArchive && (
                  <div className="pt-1 md:hidden">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={onOpenMobileArchive}
                      className="text-xs gap-1.5 rounded-xl"
                    >
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      <span>Open Folders</span>
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-left">
                <div className="glass-sakura rounded-xl p-3 transition-colors hover:border-primary/45">
                  <Layers className="mb-1.5 h-4 w-4 text-primary" />
                  <p className="text-[11px] font-semibold text-foreground">Bidirectional Links</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    Nested context cards
                  </p>
                </div>
                <div className="glass-lavender rounded-xl p-3 transition-colors hover:border-[#B59CE2]/60">
                  <Sparkles className="mb-1.5 h-4 w-4 text-[#8267B8] dark:text-[#D8BAFA]" />
                  <p className="text-[11px] font-semibold text-foreground">AI Brain</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    Analyze &amp; convert notes
                  </p>
                </div>
                <div className="glass-pearl rounded-xl p-3 transition-colors hover:border-[#429472]/50">
                  <Lock className="mb-1.5 h-4 w-4 text-[#429472] dark:text-[#78BFA6]" />
                  <p className="text-[11px] font-semibold text-foreground">Local &amp; Cloud Sync</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    Always accessible
                  </p>
                </div>
              </div>
            </div>
          </DreamverseCard>
        </motion.div>
      </div>
    );
  }

  const showSaved = savedFlash && !isDirty && !isSaving;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-transparent px-3 sm:px-6 lg:px-8" dir="ltr">
      <motion.div
        key={note.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: MOTION_EASE.botanical }}
        className="dreamverse-manuscript relative mx-auto my-4 sm:my-6 w-full max-w-[780px] space-y-6 rounded-3xl px-4 sm:px-9 lg:px-11 py-5 sm:py-8"
        dir="ltr"
      >
        {/* Subtle Manuscript Washi Header Ribbon */}
        <div className="pointer-events-none absolute top-0 left-8 right-8 h-[2px] rounded-full bg-gradient-to-r from-[#F5B971]/45 via-primary/50 to-[#B59CE2]/45" />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Note Title Input (Preserves LTR & Immediate Typing) */}
            <div className="flex flex-1 items-center gap-2 min-w-[200px]">
              <Input
                value={note.title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Untitled Note"
                className="ltr-input flex-1 h-auto py-1 px-0 border-0 border-b border-dashed border-border/80 rounded-none bg-transparent shadow-none font-heading text-2xl font-semibold focus-visible:border-solid focus-visible:border-primary/70 focus-visible:ring-0 focus-visible:bg-transparent"
              />
            </div>

            {/* Coordinated Action Controls */}
            <div className="flex shrink-0 items-center gap-2">
              <AnimatePresence mode="wait" initial={false}>
                {showSaved ? (
                  <motion.span
                    key="saved-confirm"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: MOTION_EASE.tactile }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/12 px-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 shadow-xs"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Saved</span>
                  </motion.span>
                ) : (
                  <motion.div
                    key="save-button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.14 }}
                  >
                    <Button
                      variant={isDirty ? 'default' : 'ghost'}
                      size="sm"
                      onClick={handleSaveClick}
                      disabled={!isDirty || isSaving}
                      className="h-8 gap-1.5 text-xs"
                    >
                      {isSaving ? (
                        <>
                          <DreamverseMicroLoader size={13} />
                          <span>Saving…</span>
                        </>
                      ) : isDirty ? (
                        'Save'
                      ) : (
                        'Saved'
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShareModalOpen(true)}
                className="h-8 text-xs"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
              </Button>

              {onOpenAIBrain && (
                <Button
                  variant={isAIBrainOpen ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={onOpenAIBrain}
                  title="Toggle AI Brain"
                  className="hidden lg:inline-flex h-8 text-xs gap-1.5"
                >
                  <Brain className="h-3.5 w-3.5 text-primary" />
                  <span>AI Brain</span>
                </Button>
              )}
            </div>
          </div>

          {/* Metadata + Save Status */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Created {new Date(note.createdAt).toLocaleDateString()}</span>
            <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
            {isDirty && (
              <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F5B971] shadow-[0_0_6px_#F5B971]" />
                Unsaved changes
              </span>
            )}
          </div>
        </div>

        <BlockEditor
          note={note}
          onUpdateBlock={onUpdateBlock}
          onAddBlock={onAddBlock}
          onDeleteBlock={onDeleteBlock}
          onAddKnowledgeLink={onAddKnowledgeLink}
          onEditKnowledgeLink={onEditKnowledgeLink}
          onDeleteKnowledgeLink={onDeleteKnowledgeLink}
        />
      </motion.div>

      <ShareModal
        noteId={note.id}
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        onBeforeShare={async () => {
          if (!isDirty) return true;
          const result = await onSave();
          return result !== false;
        }}
      />
    </div>
  );
}
