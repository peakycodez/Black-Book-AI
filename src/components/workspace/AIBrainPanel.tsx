import { useState, useEffect, useRef } from 'react';
import {
  Brain,
  ChevronRight,
  Copy,
  FileText,
  Key,
  Plus,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import AISettingsModal from './AISettingsModal';
import {
  DreamverseOracleLoader,
  DreamverseSeal,
  OracleShrineVignette,
} from '@/components/dreamverse';
import type { Note } from '@/types/types';
import type { ConvertMode } from '@/hooks/useAIBrain';
import { useAIBrain } from '@/hooks/useAIBrain';

const CONVERT_MODES: ConvertMode[] = [
  'Summary',
  'Todo List',
  'Study Notes',
  'Flashcards',
  'Quiz',
  'Meeting Minutes',
  'Action Items',
  'Project Plan',
];

interface AIBrainPanelProps {
  open: boolean;
  onClose: () => void;
  note: Note | null;
  allNotes: Note[];
  onOpenNote: (noteId: string) => void;
  onSaveAsNote: (title: string, content: string, backlink?: string) => void;
  onCreateNote: (title: string) => void;
}

export default function AIBrainPanel({
  open,
  onClose,
  note,
  allNotes,
  onOpenNote,
  onSaveAsNote,
  onCreateNote,
}: AIBrainPanelProps) {
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const {
    relatedNotes,
    gaps,
    convertOutput,
    activeConvert,
    analyzingRelated,
    analyzingGaps,
    converting,
    analysisError,
    convertError,
    analyze,
    convert,
    clearConvert,
    invalidateCache,
    isUsingPersonalKey,
  } = useAIBrain();

  const prevNoteId = useRef<string | null>(null);

  // Auto-analyze when panel opens with a note, or note changes
  useEffect(() => {
    if (!open || !note) return;
    if (note.id === prevNoteId.current) return;
    prevNoteId.current = note.id;
    clearConvert();
    analyze(note, allNotes);
  }, [open, note, allNotes, analyze, clearConvert]);

  const handleRefresh = () => {
    if (!note) return;
    invalidateCache();
    prevNoteId.current = null;
    clearConvert();
    analyze(note, allNotes);
  };

  const handleCopy = () => {
    if (!convertOutput) return;
    navigator.clipboard?.writeText(convertOutput)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Could not copy to clipboard'));
  };

  const handleSaveAsNote = () => {
    if (!convertOutput || !note) return;
    const title = `${activeConvert ?? 'AI Result'} — ${note.title}`;
    onSaveAsNote(title, convertOutput, note.id);
    toast.success('Saved as new note');
  };

  const handleCreateMissingNote = (topic: string) => {
    if (!note) return;
    onCreateNote(`${topic} (from ${note.title})`);
    toast.success(`Draft created: "${topic}"`);
  };

  const isLoading = analyzingRelated || analyzingGaps;

  return (
    <>
      {/* Backdrop (mobile / compact viewports) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Docked Knowledge Oracle Sanctuary on Desktop (lg+) / Drawer on Mobile */}
      <aside
        aria-label="AI Brain Companion"
        aria-hidden={!open}
        className={`dreamverse-oracle-sanctuary fixed right-0 top-0 z-50 flex h-full flex-col overflow-hidden transition-all duration-300 ease-botanical lg:static lg:z-20 lg:shrink-0 ${
          open
            ? 'w-[min(416px,100vw)] lg:w-[392px] xl:w-[416px] border-l border-border/80 shadow-botanical-hover lg:shadow-none translate-x-0 opacity-100'
            : 'w-[min(416px,100vw)] translate-x-full opacity-0 pointer-events-none lg:w-0 lg:translate-x-0 lg:border-l-0'
        }`}
      >
        <div className="relative flex h-full min-w-[320px] lg:min-w-[392px] xl:min-w-[416px] flex-col">
          {/* Luminous Oracle Crest Hairline */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#F5B971]/60 via-[#B59CE2]/70 to-primary/65" />

          {/* Panel Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border/75 px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#B59CE2]/45 bg-gradient-to-br from-primary/20 via-[#B59CE2]/20 to-[#F5B971]/20 text-primary shadow-xs">
                <Brain className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
                  <span>AI Brain</span>
                  <span className="rounded-md border border-primary/30 bg-primary/[0.12] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                    AI
                  </span>
                </p>
                <p className="text-[11px] leading-tight text-muted-foreground truncate">
                  Related notes, summaries &amp; gaps
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setAiSettingsOpen(true)}
                title={
                  isUsingPersonalKey
                    ? 'Personal Gemini API Key Active'
                    : 'Configure Gemini API Key'
                }
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-surface-hover ${
                  isUsingPersonalKey
                    ? 'text-primary bg-primary/15'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Key className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isLoading || !note}
                title="Refresh analysis"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-40"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close AI Brain"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Provider Status Sub-Bar */}
          <div className="flex items-center justify-between border-b border-border/60 bg-background/35 px-5 py-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isUsingPersonalKey
                    ? 'bg-primary shadow-[0_0_6px_hsl(var(--primary))]'
                    : 'bg-[#429472] dark:bg-[#78BFA6] shadow-[0_0_6px_#78BFA6]'
                }`}
              />
              <span>
                {isUsingPersonalKey ? 'Personal Gemini Key' : 'BlackBook Managed AI'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAiSettingsOpen(true)}
              className="font-medium text-primary hover:underline transition-colors"
            >
              {isUsingPersonalKey ? 'Configure' : 'Use own key'}
            </button>
          </div>

          {/* Empty State: AI Brain Preview */}
          {!note ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center space-y-4">
              <OracleShrineVignette className="w-full max-w-[270px] aspect-[4/3] rounded-2xl border-[#B59CE2]/40" />
              <div className="botanical-badge">
                <Sparkles className="h-3 w-3" />
                <span>AI Assistant</span>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading text-base font-semibold text-foreground">
                  Select or create a note
                </h3>
                <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Open any note to discover related notes, check missing knowledge gaps, and convert
                  content into structured formats.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
              {/* Active Note Context Banner */}
              <div className="glass-lavender flex items-center gap-3 rounded-2xl p-3">
                <OracleShrineVignette className="h-14 w-16 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                    Active Note
                  </p>
                  <p className="truncate text-xs font-semibold text-foreground">{note.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Analysis updates per note
                  </p>
                </div>
              </div>

              {/* ── SECTION 1: Related Notes ── */}
              <Section title="Related Notes">
                {analyzingRelated ? (
                  <DreamverseOracleLoader label="Finding related notes…" />
                ) : analysisError ? (
                  <EmptyState text={analysisError} />
                ) : relatedNotes.length === 0 ? (
                  <EmptyState text="No related notes identified yet." />
                ) : (
                  <div className="space-y-2">
                    {relatedNotes.map((rn) => (
                      <div
                        key={rn.noteId}
                        className="glass-sakura rounded-xl p-3.5 transition-all hover:border-primary/45 hover:shadow-botanical"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {rn.title}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {rn.reason}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenNote(rn.noteId)}
                            className="flex shrink-0 items-center gap-1 rounded-lg bg-primary/12 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/22"
                          >
                            Open
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* ── SECTION 2: Convert Note ── */}
              <Section title="Convert Note">
                <div className="grid grid-cols-2 gap-2">
                  {CONVERT_MODES.map((mode) => {
                    const isActive = activeConvert === mode;
                    return (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => convert(note, mode)}
                        disabled={converting}
                        className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all duration-150 disabled:opacity-50 ${
                          isActive
                            ? 'border-[#F5B971]/60 bg-gradient-to-br from-primary/18 to-[#B59CE2]/18 text-foreground shadow-xs'
                            : 'border-white/40 dark:border-white/15 bg-card/45 backdrop-blur-sm text-muted-foreground hover:border-primary/40 hover:bg-card/65 hover:text-foreground'
                        }`}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>

                {/* Convert Output Container */}
                {(convertOutput || converting || convertError) && (
                  <div className="glass-pearl mt-3 rounded-2xl p-4">
                    {converting && !convertOutput ? (
                      <DreamverseOracleLoader label={`Converting ${activeConvert ?? 'note'}…`} />
                    ) : convertError ? (
                      <p className="text-xs text-destructive leading-relaxed">{convertError}</p>
                    ) : (
                      <>
                        <div className="mb-3 max-h-64 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                          {convertOutput}
                          {converting && (
                            <span
                              className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-[#F5B971] align-middle shadow-[0_0_6px_#F5B971]"
                            />
                          )}
                        </div>
                        {!converting && (
                          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-2.5">
                            <button
                              type="button"
                              onClick={handleCopy}
                              className="flex items-center gap-1.5 rounded-lg border border-white/40 dark:border-white/15 bg-card/55 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
                            >
                              <Copy className="h-3 w-3" />
                              Copy
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveAsNote}
                              className="flex items-center gap-1.5 rounded-lg bg-primary/15 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/25"
                            >
                              <FileText className="h-3 w-3" />
                              Save as Note
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </Section>

              {/* ── SECTION 3: Knowledge Gaps ── */}
              <Section title="Knowledge Gaps">
                {analyzingGaps ? (
                  <DreamverseOracleLoader label="Checking knowledge gaps…" />
                ) : analysisError ? (
                  <EmptyState text={analysisError} />
                ) : gaps.length === 0 ? (
                  <EmptyState text="No structural gaps detected in this note." />
                ) : (
                  <div className="space-y-2">
                    {gaps.map((gap, i) => (
                      <div
                        key={i}
                        className="glass-sakura rounded-xl border-l-[3px] border-l-[#F5B971] p-3.5"
                      >
                        <p className="text-sm font-medium text-foreground">{gap.missing}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {gap.reason}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCreateMissingNote(gap.missing)}
                          className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-primary/12 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/22"
                        >
                          <Plus className="h-3 w-3" />
                          Create Missing Note
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          )}
        </div>
      </aside>

      <AISettingsModal open={aiSettingsOpen} onOpenChange={setAiSettingsOpen} />
    </>
  );
}

// ── helpers ──

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <DreamverseSeal size={12} className="shrink-0 opacity-80" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/75 bg-card/45 py-4 px-3 text-center">
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
