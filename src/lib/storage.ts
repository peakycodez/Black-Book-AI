import { matchesNoteQuery } from './textUtils';
import type { Folder, Note, AppData, KnowledgeLink, KnowledgeContentBlock } from '@/types/types';

const STORAGE_KEY = 'blackbook_data';
const SHARED_NOTES_KEY = 'blackbook_shared_notes';

const DEFAULT_FOLDERS: Folder[] = [
  { id: 'inbox', name: 'Inbox', parentId: null, createdAt: new Date().toISOString() },
  { id: 'projects', name: 'Projects', parentId: null, createdAt: new Date().toISOString() },
  { id: 'ideas', name: 'Ideas', parentId: null, createdAt: new Date().toISOString() },
  { id: 'archive', name: 'Archive', parentId: null, createdAt: new Date().toISOString() },
];

function getAppData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const initialData: AppData = { folders: DEFAULT_FOLDERS, notes: [] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
    return { folders: DEFAULT_FOLDERS, notes: [] };
  }
}

function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
    throw error;
  }
}

export function getAllFolders(): Folder[] {
  return getAppData().folders;
}

export function createFolder(name: string, parentId: string | null = null): Folder {
  const data = getAppData();
  const newFolder: Folder = {
    id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    parentId,
    createdAt: new Date().toISOString(),
  };
  data.folders.push(newFolder);
  saveAppData(data);
  return newFolder;
}

export function updateFolder(id: string, name: string): void {
  const data = getAppData();
  const folder = data.folders.find(f => f.id === id);
  if (folder) {
    folder.name = name;
    saveAppData(data);
  }
}

export function deleteFolder(id: string): void {
  const data = getAppData();
  const idsToDelete = new Set<string>([id]);
  let added = true;
  while (added) {
    added = false;
    for (const folder of data.folders) {
      if (folder.parentId && idsToDelete.has(folder.parentId) && !idsToDelete.has(folder.id)) {
        idsToDelete.add(folder.id);
        added = true;
      }
    }
  }
  data.folders = data.folders.filter(f => !idsToDelete.has(f.id));
  data.notes = data.notes.filter(n => !idsToDelete.has(n.folderId));
  saveAppData(data);
}

export function getAllNotes(): Note[] {
  return getAppData().notes;
}

export function getNotesByFolder(folderId: string): Note[] {
  return getAppData().notes.filter(n => n.folderId === folderId);
}

export function getNote(id: string): Note | undefined {
  return getAppData().notes.find(n => n.id === id);
}

export function createNote(folderId: string, title: string = 'Untitled Note'): Note {
  const data = getAppData();
  const newNote: Note = {
    id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    folderId,
    title,
    blocks: [{
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      content: '',
      order: 0,
    }],
    knowledgeLinks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.notes.push(newNote);
  saveAppData(data);
  return newNote;
}

export function updateNote(id: string, updates: Partial<Note>): void {
  const data = getAppData();
  const note = data.notes.find(n => n.id === id);
  if (note) {
    // Direct update - NO TEXT TRANSFORMATION
    Object.assign(note, updates, { updatedAt: new Date().toISOString() });
    saveAppData(data);
  }
}

export function deleteNote(id: string): void {
  const data = getAppData();
  data.notes = data.notes.filter(n => n.id !== id);
  saveAppData(data);
}

export function searchNotes(query: string): Note[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const lowerQuery = trimmed.toLowerCase();
  return getAppData().notes.filter((n) => matchesNoteQuery(n, lowerQuery));
}

export function addKnowledgeLink(
  noteId: string, 
  blockId: string, 
  text: string, 
  contentBlocks: KnowledgeContentBlock[]
): KnowledgeLink {
  const data = getAppData();
  const note = data.notes.find(n => n.id === noteId);
  if (!note) throw new Error('Note not found');

  const newLink: KnowledgeLink = {
    id: `kl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    blockId,
    text,
    content: '', // Legacy field for backward compatibility
    contentBlocks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  note.knowledgeLinks.push(newLink);
  saveAppData(data);
  return newLink;
}

export function updateKnowledgeLink(
  noteId: string, 
  linkId: string, 
  contentBlocks: KnowledgeContentBlock[]
): void {
  const data = getAppData();
  const note = data.notes.find(n => n.id === noteId);
  if (!note) return;

  const link = note.knowledgeLinks.find(kl => kl.id === linkId);
  if (link) {
    link.contentBlocks = contentBlocks;
    link.updatedAt = new Date().toISOString();
    saveAppData(data);
  }
}

export function deleteKnowledgeLink(noteId: string, linkId: string): void {
  const data = getAppData();
  const note = data.notes.find(n => n.id === noteId);
  if (!note) return;

  note.knowledgeLinks = note.knowledgeLinks.filter(kl => kl.id !== linkId);
  saveAppData(data);
}

export function generateShareId(): string {
  return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function shareNote(noteId: string): string {
  const note = getNote(noteId);
  if (!note) throw new Error('Note not found');

  const shareId = generateShareId();
  
  try {
    const sharedNotes = JSON.parse(localStorage.getItem(SHARED_NOTES_KEY) || '{}');
    sharedNotes[shareId] = {
      ...note,
      sharedAt: new Date().toISOString(),
    };
    localStorage.setItem(SHARED_NOTES_KEY, JSON.stringify(sharedNotes));
    return shareId;
  } catch (error) {
    console.error('Failed to share note:', error);
    throw error;
  }
}

export function getSharedNote(shareId: string): Note | null {
  try {
    const sharedNotes = JSON.parse(localStorage.getItem(SHARED_NOTES_KEY) || '{}');
    return sharedNotes[shareId] || null;
  } catch (error) {
    console.error('Failed to get shared note:', error);
    return null;
  }
}

