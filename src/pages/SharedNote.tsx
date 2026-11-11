import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SharedNoteViewer from '@/components/shared/SharedNoteViewer';
import { getSharedNote } from '@/lib/unifiedStorage';
import { DreamverseCard, DreamversePageLoader, DreamverseSeal } from '@/components/dreamverse';
import type { Note } from '@/types/types';

export default function SharedNote() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id) {
      loadSharedNote();
    }
  }, [id]);

  const loadSharedNote = async () => {
    if (!id) return;
    const sharedNote = await getSharedNote(id);
    if (sharedNote) {
      setNote(sharedNote);
    } else {
      setError(true);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-transparent p-6">
        <DreamversePageLoader statusText="Opening shared note" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-transparent p-6">
        <DreamverseCard elevated className="flex w-full max-w-sm flex-col items-center p-7 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.08] text-primary">
            <FileQuestion className="h-6 w-6" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground">Note Not Found</h3>
          <p className="mt-1.5 mb-5 text-xs text-muted-foreground leading-relaxed">
            This shared note may have been removed, unshared, or the link may be incorrect.
          </p>
          <Button onClick={() => navigate('/')} variant="outline" className="w-full rounded-xl">
            <ArrowLeft className="h-4 w-4" />
            <span>Go to BlackBook</span>
          </Button>
        </DreamverseCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-transparent py-4 sm:py-8 px-3 sm:px-6">
      <div className="dreamverse-shoji mx-auto mb-5 max-w-[780px] rounded-2xl border border-border/80">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => navigate('/')}
              aria-label="Back to home"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-card shadow-xs">
                <DreamverseSeal size={18} />
              </div>
              <h2 className="font-heading text-base font-semibold text-foreground tracking-tight">
                BlackBook
              </h2>
            </div>
          </div>
          <div className="botanical-badge">
            <span>Shared Note</span>
          </div>
        </div>
      </div>

      <SharedNoteViewer note={note} />
    </div>
  );
}
