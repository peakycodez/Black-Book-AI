import { useState } from 'react';
import { Folder, FolderOpen, FolderPlus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { motion } from 'motion/react';
import { MOTION_SPRING } from '@/lib/motion';
import type { Folder as FolderType } from '@/types/types';

interface FolderTreeProps {
  folders: FolderType[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
}

const ARCHIVE_BOX_TINTS = [
  'bg-[#F4A7C1]/25 text-primary border-[#F4A7C1]/40',
  'bg-[#B59CE2]/25 text-[#7B5CC2] dark:text-[#D8BAFA] border-[#B59CE2]/40',
  'bg-[#F5B971]/25 text-[#B8731E] dark:text-[#F5B971] border-[#F5B971]/40',
  'bg-[#78BFA6]/20 text-[#357A60] dark:text-[#78BFA6] border-[#78BFA6]/40',
];

export default function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderTreeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  const handleCreate = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  const handleRename = (id: string) => {
    if (editingName.trim()) {
      onRenameFolder(id, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleDeleteClick = (id: string) => {
    setFolderToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (folderToDelete) {
      onDeleteFolder(folderToDelete);
      setFolderToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="mb-1.5 flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            Folders
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-lg hover:bg-primary/15 text-primary"
          onClick={() => setIsCreating(true)}
          title="New Folder"
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
      </div>

      {isCreating && (
        <div className="mb-2 flex gap-2">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name..."
            className="ltr-input h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewFolderName('');
              }
            }}
            autoFocus
          />
        </div>
      )}

      <div className="space-y-1.5">
        {folders.map((folder, index) => {
          const isSelected = selectedFolderId === folder.id;
          const tint = ARCHIVE_BOX_TINTS[index % ARCHIVE_BOX_TINTS.length];
          return (
            <div
              key={folder.id}
              className={`dreamverse-archive-box group relative flex items-center gap-2 rounded-xl px-2.5 py-2 transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'border-primary/45 bg-gradient-to-r from-primary/[0.14] via-secondary/45 to-card/70 font-semibold text-foreground shadow-botanical'
                  : 'hover:border-primary/28 hover:translate-x-0.5 text-muted-foreground hover:text-foreground'
              }`}
            >
              {isSelected && (
                <motion.span
                  layoutId="sidebar-folder-pill"
                  transition={MOTION_SPRING.tactile}
                  className="absolute left-0 top-2 bottom-2 w-[3.5px] rounded-full bg-gradient-to-b from-[#F5B971] via-primary to-[#B59CE2]"
                />
              )}
              {editingId === folder.id ? (
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="ltr-input h-7 text-sm rounded-md"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(folder.id);
                    if (e.key === 'Escape') {
                      setEditingId(null);
                      setEditingName('');
                    }
                  }}
                  onBlur={() => handleRename(folder.id)}
                  autoFocus
                />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSelectFolder(folder.id)}
                    className="flex flex-1 items-center gap-2.5 text-left min-w-0 pl-0.5"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-105 ${tint}`}
                    >
                      {isSelected ? (
                        <FolderOpen className="h-3.5 w-3.5" />
                      ) : (
                        <Folder className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <span className="text-sm truncate">{folder.name}</span>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingId(folder.id);
                          setEditingName(folder.name);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(folder.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the folder and all notes inside it. This action cannot be undone.
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
