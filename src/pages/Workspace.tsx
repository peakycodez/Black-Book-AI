import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Sidebar from '@/components/workspace/Sidebar';
import Editor from '@/components/workspace/Editor';
import AIBrainPanel from '@/components/workspace/AIBrainPanel';
import { useAuth } from '@/contexts/AuthContext';
import * as localStorageAPI from '@/lib/storage';
import {
  getAllFolders,
  getNotesByFolder,
  getNote,
  createFolder,
  updateFolder,
  deleteFolder,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
  addKnowledgeLink,
  updateKnowledgeLink,
  deleteKnowledgeLink,
  initializeGuestFolders,
} from '@/lib/unifiedStorage';
import { migrateOldNotes } from '@/lib/migration';
import { useDebounce } from '@/hooks/use-debounce';
import { Brain, FolderOpen, Sparkles } from 'lucide-react';
import { DreamversePageLoader, DreamverseSeal } from '@/components/dreamverse';
import type { Folder, Note, KnowledgeLink, KnowledgeContentBlock } from '@/types/types';

export default function Workspace() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiBrainOpen, setAIBrainOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Synchronously updated refs prevent stale closures across async saves,
  // note switches, and Knowledge Link mutations.
  const selectedNoteRef = useRef<Note | null>(null);
  const isDirtyRef = useRef<boolean>(false);
  const selectedFolderIdRef = useRef<string | null>(null);
  const saveLockRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    selectedFolderIdRef.current = selectedFolderId;
  }, [selectedFolderId]);

  const applySelectedNote = useCallback((note: Note | null, dirty: boolean = false) => {
    selectedNoteRef.current = note;
    setSelectedNote(note);
    setSelectedNoteId(note?.id ?? null);
    isDirtyRef.current = dirty;
    setIsDirty(dirty);
  }, []);

  const updateSelectedNote = useCallback(
    (updater: (prev: Note) => Note, markDirty: boolean = true): Note | null => {
      const current = selectedNoteRef.current;
      if (!current) return null;
      const next = updater(current);
      selectedNoteRef.current = next;
      setSelectedNote(next);
      if (markDirty) {
        isDirtyRef.current = true;
        setIsDirty(true);
      }
      return next;
    },
    []
  );

  const syncNoteInCaches = useCallback((updated: Note) => {
    setNotes((prev) =>
      prev.some((n) => n.id === updated.id)
        ? prev.map((n) => (n.id === updated.id ? updated : n))
        : updated.folderId === selectedFolderIdRef.current
          ? [...prev, updated]
          : prev
    );
    setAllNotes((prev) =>
      prev.some((n) => n.id === updated.id)
        ? prev.map((n) => (n.id === updated.id ? updated : n))
        : [...prev, updated]
    );
  }, []);

  const debouncedSearchQuery = useDebounce(searchQuery, 250);

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      migrateOldNotes();
      initializeGuestFolders();
    }
  }, [user]);

  useEffect(() => {
    if (user) loadFolders();
  }, [user]);

  const loadFolders = async () => {
    const loadedFolders = await getAllFolders();
    setFolders(loadedFolders);
  };

  const loadAllNotes = useCallback(
    async (folderList?: Folder[]) => {
      const targetFolders = folderList ?? folders;
      if (targetFolders.length === 0) {
        setAllNotes([]);
        return;
      }
      const results = await Promise.all(targetFolders.map((f) => getNotesByFolder(f.id)));
      setAllNotes(results.flat());
    },
    [folders]
  );

  useEffect(() => {
    if (selectedFolderId) loadNotes();
  }, [selectedFolderId]);

  const loadNotes = async () => {
    const activeFolderId = selectedFolderIdRef.current;
    if (activeFolderId) {
      const loadedNotes = await getNotesByFolder(activeFolderId);
      setNotes(loadedNotes);
    }
  };

  // Load all notes across all folders for AI related-notes analysis
  useEffect(() => {
    if (!user) return;
    if (folders.length === 0) {
      setAllNotes([]);
      return;
    }
    void loadAllNotes(folders);
  }, [user, folders, loadAllNotes]);

  // Global Ctrl+K / Cmd+K focuses the Search input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setMobileSidebarOpen(true);
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        });
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      void performSearch(debouncedSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery]);

  const performSearch = async (queryText: string) => {
    const results = await searchNotes(queryText);
    setSearchResults(results);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
    }
  };

  const enqueueWrite = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const next = saveLockRef.current.then(task, task);
    saveLockRef.current = next.then(
      () => true,
      () => false
    );
    return next;
  }, []);

  const handleSave = useCallback(async (): Promise<boolean> => {
    return enqueueWrite(async () => {
      const note = selectedNoteRef.current;
      if (!note) return true;

      const snapshotTitle = note.title;
      const snapshotBlocks = note.blocks;
      const snapshotLinks = note.knowledgeLinks;

      setIsSaving(true);
      try {
        const savedAt = new Date().toISOString();
        await updateNote(note.id, {
          title: snapshotTitle,
          blocks: snapshotBlocks,
          knowledgeLinks: snapshotLinks,
        });

        const latest = selectedNoteRef.current;
        const stillMatchesSnapshot =
          latest !== null &&
          latest.id === note.id &&
          latest.title === snapshotTitle &&
          latest.blocks === snapshotBlocks &&
          latest.knowledgeLinks === snapshotLinks;

        if (stillMatchesSnapshot) {
          const savedNote: Note = { ...latest, updatedAt: savedAt };
          selectedNoteRef.current = savedNote;
          setSelectedNote(savedNote);
          isDirtyRef.current = false;
          setIsDirty(false);
          syncNoteInCaches(savedNote);
        } else if (latest && latest.id === note.id) {
          syncNoteInCaches({
            ...note,
            title: snapshotTitle,
            blocks: snapshotBlocks,
            knowledgeLinks: snapshotLinks,
            updatedAt: savedAt,
          });
        }

        const activeFolderId = selectedFolderIdRef.current;
        if (activeFolderId) {
          const loadedNotes = await getNotesByFolder(activeFolderId);
          setNotes(loadedNotes);
        }
        return true;
      } catch (error) {
        console.error('Failed to save note:', error);
        toast.error('Failed to save note. Your unsaved edits remain intact.');
        return false;
      } finally {
        setIsSaving(false);
      }
    });
  }, [enqueueWrite, syncNoteInCaches]);

  // Debounced autosave so brief pauses persist cleanly
  useEffect(() => {
    if (!isDirty || !selectedNote) return;
    const timer = window.setTimeout(() => {
      if (isDirtyRef.current) {
        void handleSave();
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [isDirty, selectedNote?.id, selectedNote?.title, selectedNote?.blocks, handleSave]);

  // Synchronous guest-mode flush on unload if edits occurred before debounce fired
  useEffect(() => {
    const handleBeforeUnload = () => {
      const dirtyNote = selectedNoteRef.current;
      if (
        isDirtyRef.current &&
        dirtyNote &&
        localStorage.getItem('blackbook_guest_mode') === 'true'
      ) {
        try {
          localStorageAPI.updateNote(dirtyNote.id, {
            title: dirtyNote.title,
            blocks: dirtyNote.blocks,
            knowledgeLinks: dirtyNote.knowledgeLinks,
          });
        } catch {
          // Ignore storage quota errors during unload
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleSelectFolder = async (folderId: string) => {
    if (isDirtyRef.current) {
      await handleSave();
    }
    setSelectedFolderId(folderId);
    applySelectedNote(null, false);
  };

  const handleSelectNote = useCallback(
    async (noteId: string) => {
      setSearchQuery('');
      setSearchResults([]);
      setMobileSidebarOpen(false);

      if (selectedNoteRef.current?.id === noteId) {
        return;
      }

      if (isDirtyRef.current) {
        await handleSave();
      }

      const fetched = await getNote(noteId);
      if (fetched) {
        applySelectedNote(fetched, false);
        setSelectedFolderId((prev) => prev ?? fetched.folderId);
        return;
      }

      const cached =
        notes.find((n) => n.id === noteId) || allNotes.find((n) => n.id === noteId) || null;
      applySelectedNote(cached, false);
    },
    [notes, allNotes, handleSave, applySelectedNote]
  );

  const handleCreateFolder = async (name: string) => {
    try {
      await createFolder(name);
      await loadFolders();
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast.error('Failed to create folder.');
    }
  };

  const handleRenameFolder = async (id: string, name: string) => {
    try {
      await updateFolder(id, name);
      await loadFolders();
    } catch (error) {
      console.error('Failed to rename folder:', error);
      toast.error('Failed to rename folder.');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      if (isDirtyRef.current && selectedNoteRef.current?.folderId !== id) {
        await handleSave();
      }
      await deleteFolder(id);
      await loadFolders();
      setAllNotes((prev) => prev.filter((n) => n.folderId !== id));
      setSearchResults((prev) => prev.filter((n) => n.folderId !== id));
      if (selectedFolderIdRef.current === id) {
        setSelectedFolderId(null);
        applySelectedNote(null, false);
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
      toast.error('Failed to delete folder.');
    }
  };

  const handleCreateNote = async (titleOverride?: string) => {
    const activeFolderId = selectedFolderIdRef.current;
    if (!activeFolderId) return;
    if (isDirtyRef.current) {
      await handleSave();
    }
    try {
      const newNote = await createNote(activeFolderId, titleOverride ?? 'Untitled Note');
      applySelectedNote(newNote, false);
      syncNoteInCaches(newNote);
      await loadNotes();
    } catch (error) {
      console.error('Failed to create note:', error);
      toast.error('Failed to create note.');
    }
  };

  const handleTitleChange = (title: string) => {
    updateSelectedNote((prev) => ({ ...prev, title }), true);
  };

  const handleUpdateBlock = (blockId: string, content: string) => {
    updateSelectedNote(
      (prev) => ({
        ...prev,
        blocks: prev.blocks.map((block) =>
          block.id === blockId ? { ...block, content } : block
        ),
      }),
      true
    );
  };

  const handleAddBlock = async (type: 'text' | 'image' | 'audio' | 'video', source?: string) => {
    await enqueueWrite(async () => {
      const current = selectedNoteRef.current;
      if (!current) return;

      const newBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        content: '',
        source,
        order: current.blocks.length,
      };
      const updatedBlocks = [...current.blocks, newBlock];
      const snapshotTitle = current.title;
      const snapshotLinks = current.knowledgeLinks;

      updateSelectedNote((prev) => ({ ...prev, blocks: [...prev.blocks, newBlock] }), false);

      try {
        await updateNote(current.id, {
          title: snapshotTitle,
          blocks: updatedBlocks,
          knowledgeLinks: snapshotLinks,
        });
        const latest = selectedNoteRef.current;
        if (
          latest &&
          latest.id === current.id &&
          latest.title === snapshotTitle &&
          latest.blocks.length === updatedBlocks.length
        ) {
          isDirtyRef.current = false;
          setIsDirty(false);
        }
        syncNoteInCaches({
          ...current,
          title: snapshotTitle,
          blocks: updatedBlocks,
          knowledgeLinks: snapshotLinks,
          updatedAt: new Date().toISOString(),
        });
        if (selectedFolderIdRef.current) await loadNotes();
      } catch (error) {
        console.error('Failed to add block:', error);
        toast.error('Failed to save new block.');
      }
    });
  };

  const handleDeleteBlock = async (blockId: string) => {
    await enqueueWrite(async () => {
      const current = selectedNoteRef.current;
      if (!current) return;

      const updatedBlocks = current.blocks
        .filter((block) => block.id !== blockId)
        .map((block, index) => ({ ...block, order: index }));
      const updatedLinks = current.knowledgeLinks.filter((kl) => kl.blockId !== blockId);
      const snapshotTitle = current.title;

      updateSelectedNote(
        (prev) => ({
          ...prev,
          blocks: prev.blocks
            .filter((block) => block.id !== blockId)
            .map((block, index) => ({ ...block, order: index })),
          knowledgeLinks: prev.knowledgeLinks.filter((kl) => kl.blockId !== blockId),
        }),
        false
      );

      try {
        await updateNote(current.id, {
          title: snapshotTitle,
          blocks: updatedBlocks,
          knowledgeLinks: updatedLinks,
        });
        const latest = selectedNoteRef.current;
        if (latest && latest.id === current.id && latest.title === snapshotTitle) {
          isDirtyRef.current = false;
          setIsDirty(false);
        }
        syncNoteInCaches({
          ...current,
          title: snapshotTitle,
          blocks: updatedBlocks,
          knowledgeLinks: updatedLinks,
          updatedAt: new Date().toISOString(),
        });
        if (selectedFolderIdRef.current) await loadNotes();
      } catch (error) {
        console.error('Failed to delete block:', error);
        toast.error('Failed to delete block.');
      }
    });
  };

  const mutateKnowledgeLinks = useCallback(
    async <T,>(
      persistOp: (noteId: string) => Promise<T>,
      transformLinks: (prevLinks: KnowledgeLink[], result: T, savedAt: string) => KnowledgeLink[],
      errorMessage: string
    ) => {
      await enqueueWrite(async () => {
        const current = selectedNoteRef.current;
        if (!current) return;

        // Flush unsaved title and block edits BEFORE persisting knowledge link changes
        // so adding/editing/deleting a link never resets or loses edited note content.
        const snapshotTitle = current.title;
        const snapshotBlocks = current.blocks;

        try {
          await updateNote(current.id, {
            title: snapshotTitle,
            blocks: snapshotBlocks,
            knowledgeLinks: current.knowledgeLinks,
          });

          const result = await persistOp(current.id);
          const savedAt = new Date().toISOString();

          const updatedNote = updateSelectedNote(
            (prev) => ({
              ...prev,
              knowledgeLinks: transformLinks(prev.knowledgeLinks, result, savedAt),
              updatedAt: savedAt,
            }),
            false
          );

          const latest = selectedNoteRef.current;
          if (
            latest &&
            latest.id === current.id &&
            latest.title === snapshotTitle &&
            latest.blocks === snapshotBlocks
          ) {
            isDirtyRef.current = false;
            setIsDirty(false);
          }

          if (updatedNote) {
            syncNoteInCaches(updatedNote);
          }
          if (selectedFolderIdRef.current) await loadNotes();
        } catch (error) {
          console.error(errorMessage, error);
          toast.error(errorMessage);
        }
      });
    },
    [enqueueWrite, updateSelectedNote, syncNoteInCaches]
  );

  const handleAddKnowledgeLink = useCallback(
    (blockId: string, text: string, contentBlocks: KnowledgeContentBlock[]) =>
      mutateKnowledgeLinks(
        (noteId) => addKnowledgeLink(noteId, blockId, text, contentBlocks),
        (prevLinks, createdLink) => [...prevLinks, createdLink],
        'Failed to save knowledge link.'
      ),
    [mutateKnowledgeLinks]
  );

  const handleEditKnowledgeLink = useCallback(
    (linkId: string, contentBlocks: KnowledgeContentBlock[]) =>
      mutateKnowledgeLinks(
        (noteId) => updateKnowledgeLink(noteId, linkId, contentBlocks),
        (prevLinks, _res, savedAt) =>
          prevLinks.map((kl) =>
            kl.id === linkId ? { ...kl, contentBlocks, updatedAt: savedAt } : kl
          ),
        'Failed to update knowledge link.'
      ),
    [mutateKnowledgeLinks]
  );

  const handleDeleteKnowledgeLink = useCallback(
    (linkId: string) =>
      mutateKnowledgeLinks(
        (noteId) => deleteKnowledgeLink(noteId, linkId),
        (prevLinks) => prevLinks.filter((kl) => kl.id !== linkId),
        'Failed to delete knowledge link.'
      ),
    [mutateKnowledgeLinks]
  );

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      try {
        await deleteNote(noteId);
        setAllNotes((prev) => prev.filter((n) => n.id !== noteId));
        setSearchResults((prev) => prev.filter((n) => n.id !== noteId));
        if (selectedFolderIdRef.current) await loadNotes();
        if (selectedNoteRef.current?.id === noteId) {
          applySelectedNote(null, false);
        }
      } catch (error) {
        console.error('Failed to delete note:', error);
        toast.error('Failed to delete note.');
      }
    },
    [applySelectedNote]
  );

  const handleOpenNote = useCallback(
    async (noteId: string) => {
      setAIBrainOpen(false);
      await handleSelectNote(noteId);
    },
    [handleSelectNote]
  );

  // AI Brain: save convert output as a new note (with content block)
  const handleSaveAsNote = useCallback(
    async (title: string, content: string, _backlink?: string) => {
      const activeFolderId = selectedFolderIdRef.current;
      if (!activeFolderId) return;
      if (isDirtyRef.current) {
        await handleSave();
      }
      const newNote = await createNote(activeFolderId, title);
      const textBlock = {
        id: `block_${Date.now()}`,
        type: 'text' as const,
        content,
        order: 0,
      };
      await updateNote(newNote.id, { blocks: [textBlock] });
      const fullNote: typeof newNote = { ...newNote, blocks: [textBlock] };
      const refreshed = await getNotesByFolder(activeFolderId);
      setNotes(refreshed);
      syncNoteInCaches(fullNote);
      applySelectedNote(fullNote, false);
    },
    [handleSave, syncNoteInCaches, applySelectedNote]
  );

  // AI Brain: create a missing note draft
  const handleCreateMissingNote = useCallback(
    async (title: string) => {
      const activeFolderId = selectedFolderIdRef.current;
      if (!activeFolderId) return;
      if (isDirtyRef.current) {
        await handleSave();
      }
      const newNote = await createNote(activeFolderId, title);
      const refreshed = await getNotesByFolder(activeFolderId);
      setNotes(refreshed);
      syncNoteInCaches(newNote);
      applySelectedNote(newNote, false);
    },
    [handleSave, syncNoteInCaches, applySelectedNote]
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-transparent">
        <DreamversePageLoader statusText="Loading BlackBook" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-transparent relative">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        folders={folders}
        notes={notes}
        selectedFolderId={selectedFolderId}
        selectedNoteId={selectedNoteId}
        searchQuery={searchQuery}
        searchInputRef={searchInputRef}
        searchResults={searchResults}
        onSearch={handleSearch}
        onSelectFolder={handleSelectFolder}
        onSelectNote={handleSelectNote}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onCreateNote={() => handleCreateNote()}
        onDeleteNote={handleDeleteNote}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        isDirty={isDirty}
      />

      {/* Editor area */}
      <div className="relative flex flex-1 flex-col min-w-0">
        {/* Compact Mobile Glass Header Bar (< md) */}
        <div className="glass-lavender flex md:hidden items-center justify-between gap-2 px-3.5 py-2.5 border-x-0 border-t-0 rounded-none z-20 shrink-0">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/45 dark:border-white/15 bg-card/50 backdrop-blur-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-primary/45 transition-colors"
            aria-label="Open folders sidebar"
          >
            <FolderOpen className="h-3.5 w-3.5 text-primary" />
            <span>Folders</span>
          </button>
          <div className="flex items-center gap-1.5">
            <DreamverseSeal size={18} />
            <span className="font-heading text-xs font-bold text-foreground tracking-tight">
              BlackBook
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAIBrainOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/45 dark:border-white/15 bg-card/50 backdrop-blur-md px-2.5 py-1.5 text-xs font-medium text-primary hover:border-primary/45 transition-colors"
            aria-label="Open AI Brain"
          >
            <Brain className="h-3.5 w-3.5" />
            <span>AI Brain</span>
          </button>
        </div>

        <Editor
          note={selectedNote}
          isDirty={isDirty}
          isSaving={isSaving}
          onTitleChange={handleTitleChange}
          onUpdateBlock={handleUpdateBlock}
          onAddBlock={handleAddBlock}
          onDeleteBlock={handleDeleteBlock}
          onAddKnowledgeLink={handleAddKnowledgeLink}
          onEditKnowledgeLink={handleEditKnowledgeLink}
          onDeleteKnowledgeLink={handleDeleteKnowledgeLink}
          onSave={handleSave}
          onOpenAIBrain={() => setAIBrainOpen((prev) => !prev)}
          isAIBrainOpen={aiBrainOpen}
          onOpenMobileArchive={() => setMobileSidebarOpen(true)}
        />
      </div>

      {/* Tablet AI Brain trigger button */}
      {!aiBrainOpen && (
        <button
          type="button"
          onClick={() => setAIBrainOpen(true)}
          className="glass-lavender hidden md:flex lg:hidden fixed bottom-5 right-5 z-40 h-12 w-12 items-center justify-center rounded-2xl text-primary hover:border-primary/60 hover:scale-105 active:scale-95 transition-all duration-150"
          aria-label="Open AI Brain"
        >
          <Sparkles size={19} className="text-[#F5B971] absolute top-1.5 right-1.5 w-2.5 h-2.5" />
          <Brain size={20} className="text-primary" />
        </button>
      )}

      {/* AI Brain docked workspace companion (desktop) / sheet drawer (mobile) */}
      <AIBrainPanel
        open={aiBrainOpen}
        onClose={() => setAIBrainOpen(false)}
        note={selectedNote}
        allNotes={allNotes}
        onOpenNote={handleOpenNote}
        onSaveAsNote={handleSaveAsNote}
        onCreateNote={handleCreateMissingNote}
      />
    </div>
  );
}
