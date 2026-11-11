import type { RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, X } from 'lucide-react';
import SearchBar from './SearchBar';
import FolderTree from './FolderTree';
import NoteList from './NoteList';
import UserMenu from './UserMenu';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/useAdmin';
import { DreamverseBlossom, DreamverseSeal } from '@/components/dreamverse';
import type { Folder, Note } from '@/types/types';

interface SidebarProps {
  folders: Folder[];
  notes: Note[];
  selectedFolderId: string | null;
  selectedNoteId: string | null;
  searchQuery?: string;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  searchResults: Note[];
  onSearch: (query: string) => void;
  onSelectFolder: (folderId: string) => void;
  onSelectNote: (noteId: string) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (noteId: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  isDirty?: boolean;
}

export default function Sidebar({
  folders,
  notes,
  selectedFolderId,
  selectedNoteId,
  searchQuery,
  searchInputRef,
  searchResults,
  onSearch,
  onSelectFolder,
  onSelectNote,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateNote,
  onDeleteNote,
  mobileOpen = false,
  onCloseMobile,
  isDirty = false,
}: SidebarProps) {
  const selectedFolder = Array.isArray(folders)
    ? folders.find((f) => f.id === selectedFolderId)
    : undefined;
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  return (
    <aside
      className={`dreamverse-pavilion-rail fixed inset-y-0 left-0 z-50 flex h-screen w-[286px] max-w-[85vw] shrink-0 flex-col gap-4 border-r border-border/75 p-4 transition-transform duration-250 ease-out overflow-y-auto md:static md:z-auto md:w-[272px] lg:w-[286px] md:translate-x-0 ${
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Subtle Top Hinoki Lintel Accent */}
      <div className="pointer-events-none absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-[#F5B971]/40 via-primary/45 to-[#B59CE2]/40" />

      {/* Crest Brand + User Menu Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-card/60 backdrop-blur-md shadow-botanical">
            <DreamverseSeal size={21} />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <h2 className="font-heading text-sm font-bold text-foreground tracking-tight truncate">
              BlackBook
            </h2>
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-[0.06em] truncate">
              Workspace
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <UserMenu />
          {onCloseMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCloseMobile}
              className="h-7 w-7 md:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <SearchBar
        query={searchQuery}
        inputRef={searchInputRef}
        onSearch={onSearch}
        searchResults={searchResults}
        onSelectNote={onSelectNote}
      />

      <FolderTree
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={onSelectFolder}
        onCreateFolder={onCreateFolder}
        onRenameFolder={onRenameFolder}
        onDeleteFolder={onDeleteFolder}
      />

      {selectedFolderId && (
        <NoteList
          notes={notes}
          selectedNoteId={selectedNoteId}
          onSelectNote={onSelectNote}
          onCreateNote={onCreateNote}
          onDeleteNote={onDeleteNote}
          folderName={selectedFolder?.name || ''}
        />
      )}

      {/* Sanctuary Status / Admin Console Entry */}
      {isAdmin ? (
        <div className="mt-auto border-t border-border/60 pt-3.5">
          <Button
            onClick={() => navigate('/admin')}
            variant="secondary"
            className="w-full justify-start gap-2 rounded-xl"
          >
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-medium">Admin Console</span>
          </Button>
        </div>
      ) : (
        <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <div className="flex items-center gap-2 min-w-0">
            <DreamverseBlossom size={13} className="shrink-0 text-primary" />
            <span className="truncate font-medium">
              {isDirty ? 'Unsaved changes' : 'All changes saved'}
            </span>
          </div>
          <span
            className="inline-block h-2 w-2 rounded-full bg-[#429472] dark:bg-[#78BFA6] ring-2 ring-[#429472]/25"
            title="Local and cloud sync available"
          />
        </div>
      )}
    </aside>
  );
}
