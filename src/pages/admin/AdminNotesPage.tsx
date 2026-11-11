import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { DreamverseInlineLoader } from '@/components/dreamverse';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/db/supabase';
import {
  Search,
  FileText,
  Eye,
  FolderOpen,
  User,
  Calendar,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminNote {
  id: string;
  user_id: string;
  owner_email: string;
  folder_id: string | null;
  folder_name: string | null;
  title: string;
  blocks: Array<{ id: string; type: string; content: string; order: number }>;
  knowledge_links: unknown[];
  created_at: string;
  updated_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NotePreviewDialog({
  note,
  onClose,
}: {
  note: AdminNote | null;
  onClose: () => void;
}) {
  if (!note) return null;

  const textBlocks = (note.blocks ?? []).filter((b) => b.type === 'text');
  const mediaBlocks = (note.blocks ?? []).filter((b) => b.type !== 'text');

  return (
    <Dialog open={!!note} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] w-full max-w-[calc(100%-2rem)] overflow-y-auto md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-light text-balance pr-6">
            {note.title || 'Untitled'}
          </DialogTitle>
        </DialogHeader>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 border-b border-border pb-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            {note.owner_email}
          </span>
          {note.folder_name && (
            <span className="flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5" />
              {note.folder_name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Updated {formatDateTime(note.updated_at)}
          </span>
        </div>

        {/* Content */}
        <div className="space-y-4 pt-2">
          {(note.blocks ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              This note has no content.
            </p>
          ) : (
            <>
              {/* Text blocks */}
              {textBlocks.map((block) => (
                <div key={block.id} className="text-sm leading-relaxed text-foreground">
                  {block.content || (
                    <span className="italic text-muted-foreground">Empty block</span>
                  )}
                </div>
              ))}

              {/* Media block indicators */}
              {mediaBlocks.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {mediaBlocks.map((block) => (
                    <Badge key={block.id} variant="secondary" className="text-xs">
                      {block.type}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Knowledge links count */}
          {(note.knowledge_links ?? []).length > 0 && (
            <p className="text-xs text-muted-foreground">
              {note.knowledge_links.length} knowledge link
              {note.knowledge_links.length !== 1 ? 's' : ''} attached
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminNotesPage() {
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewNote, setPreviewNote] = useState<AdminNote | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_notes_admin');
      if (error) throw error;
      setNotes(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error('Error loading notes:', err);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.owner_email.toLowerCase().includes(q) ||
        (n.folder_name ?? '').toLowerCase().includes(q)
    );
  }, [search, notes]);

  // Stats
  const totalNotes = notes.length;
  const uniqueUsers = new Set(notes.map((n) => n.user_id)).size;
  const today = new Date().toDateString();
  const updatedToday = notes.filter(
    (n) => new Date(n.updated_at).toDateString() === today
  ).length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <DreamverseInlineLoader statusText="Loading notes index…" className="max-w-xs" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-light tracking-tight text-balance">All Notes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse and preview every note across all user accounts
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal">Total Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light">{totalNotes}</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal">Authors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light">{uniqueUsers}</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal">Updated Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light">{updatedToday}</div>
            </CardContent>
          </Card>
        </div>

        {/* Notes Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg font-normal">Notes</CardTitle>
            <CardDescription>Search by title, owner email, or folder</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-6 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search notes…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {search && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearch('')}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="w-full max-w-full overflow-x-auto">
              <Table className="[&>div]:max-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Title</TableHead>
                    <TableHead className="whitespace-nowrap">Owner</TableHead>
                    <TableHead className="whitespace-nowrap">Folder</TableHead>
                    <TableHead className="whitespace-nowrap">Blocks</TableHead>
                    <TableHead className="whitespace-nowrap">Updated</TableHead>
                    <TableHead className="whitespace-nowrap">Created</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        {search ? 'No notes match your search.' : 'No notes found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell className="max-w-[200px]">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate text-sm font-normal">
                              {note.title || 'Untitled'}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {note.owner_email}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {note.folder_name ? (
                            <span className="flex items-center gap-1.5">
                              <FolderOpen className="h-3.5 w-3.5" />
                              {note.folder_name}
                            </span>
                          ) : (
                            <span className="italic">No folder</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {(note.blocks ?? []).length}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(note.updated_at)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(note.created_at)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewNote(note)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {filtered.length > 0 && (
              <p className="mt-4 text-xs text-muted-foreground">
                Showing {filtered.length} of {totalNotes} note{totalNotes !== 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Note Preview Dialog */}
      <NotePreviewDialog note={previewNote} onClose={() => setPreviewNote(null)} />
    </AdminLayout>
  );
}
