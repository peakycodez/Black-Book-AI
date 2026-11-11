import { useState } from 'react';
import { BookOpenText, Link2, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MOTION_SPRING } from '@/lib/motion';
import type { Note } from '@/types/types';

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (noteId: string) => void;
  folderName: string;
}

const WASHI_SEAL_ACCENTS = [
  'bg-primary/70',
  'bg-[#B59CE2]/80',
  'bg-[#F5B971]/85',
  'bg-[#429472]/75',
];

function extractNotePreview(note: Note): string {
  const firstText = note.blocks?.find((b) => b.type === 'text' && b.content?.trim());
  if (!firstText) return 'Blank stationery slip';
  return firstText.content
    .replace(/<\/?(?:div|p|br|span|strong|em|b|i|u|a|ul|ol|li)\b[^>]*>/gi, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 68);
}

export default function NoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  folderName,
}: NoteListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const handleDeleteClick = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (noteToDelete) {
      onDeleteNote(noteToDelete);
      setNoteToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const noteToDeleteTitle = notes.find((n) => n.id === noteToDelete)?.title || 'this note';

  return (
    <div className="space-y-2.5 pt-1">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.13em] truncate">
            {folderName}
          </h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-primary/25 bg-primary/10 text-primary font-semibold">
            {notes.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-lg hover:bg-primary/15 text-primary"
          onClick={onCreateNote}
          title="Create note"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="glass-sakura flex flex-col items-center justify-center overflow-hidden rounded-2xl border-dashed p-3 text-center space-y-2.5">
          <div className="relative h-20 w-full overflow-hidden rounded-xl border border-white/40 dark:border-white/15">
            <img
              src="/images/dreamverse/sakura-reading-alcove.jpg"
              alt="Empty folder illustration"
              className="h-full w-full object-cover opacity-90"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/55 via-transparent to-transparent" />
          </div>
          <div className="space-y-0.5 px-1">
            <p className="text-xs font-semibold text-foreground">
              No notes yet
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Create a new note in this folder
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={onCreateNote}
            className="h-7 text-xs gap-1 px-3 font-medium"
          >
            <Plus className="h-3 w-3" />
            New Note
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {notes.map((note, idx) => {
            const isSelected = selectedNoteId === note.id;
            const sealColor = WASHI_SEAL_ACCENTS[idx % WASHI_SEAL_ACCENTS.length];
            const preview = extractNotePreview(note);
            const linkCount = note.knowledgeLinks?.length || 0;

            return (
              <div
                key={note.id}
                className={`dreamverse-washi-slip group relative flex items-center rounded-xl cursor-pointer ${
                  isSelected
                    ? 'border-primary/50 bg-gradient-to-r from-primary/[0.14] via-card/90 to-secondary/35 shadow-botanical'
                    : 'hover:border-primary/30 hover:bg-surface-hover/85 hover:-translate-y-[1px]'
                }`}
              >
                {/* Stationery Silk Ribbon Accent */}
                <span
                  className={`absolute left-1.5 top-2.5 bottom-2.5 w-[2.5px] rounded-full transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-45 group-hover:opacity-85'
                  } ${sealColor}`}
                />

                {isSelected && (
                  <motion.span
                    layoutId="sidebar-note-pill"
                    transition={MOTION_SPRING.tactile}
                    className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F5B971] shadow-[0_0_8px_#F5B971]"
                  />
                )}

                <button
                  type="button"
                  onClick={() => onSelectNote(note.id)}
                  className="flex-1 min-w-0 pl-4 pr-2.5 py-2.5 text-left"
                >
                  <div className="flex items-center justify-between gap-2 pr-3">
                    <span
                      className={`truncate text-sm ${
                        isSelected ? 'font-semibold text-foreground' : 'font-medium text-foreground/90'
                      }`}
                    >
                      {note.title}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground/85 leading-snug">
                    {preview}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground/80">
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    {linkCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        <Link2 className="h-2.5 w-2.5" />
                        {linkCount}
                      </span>
                    )}
                    {note.blocks?.length > 1 && (
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-secondary/75 px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                        <BookOpenText className="h-2.5 w-2.5" />
                        {note.blocks.length}
                      </span>
                    )}
                  </div>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-1 h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => handleDeleteClick(note.id, e)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              "{noteToDeleteTitle}" will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
