import * as localStorageAPI from './storage';
import * as supabaseAPI from './supabaseStorage';
import { isSupabaseConfigured } from '@/db/supabase';
import type { Folder, Note, KnowledgeLink, KnowledgeContentBlock } from '@/types/types';

function isGuest(): boolean {
  return localStorage.getItem('blackbook_guest_mode') === 'true';
}

// ============ FOLDERS ============

export async function getAllFolders(): Promise<Folder[]> {
  if (isGuest()) {
    return localStorageAPI.getAllFolders();
  }
  return await supabaseAPI.getAllFolders();
}

export async function createFolder(name: string, parentId: string | null = null): Promise<Folder> {
  if (isGuest()) {
    return localStorageAPI.createFolder(name, parentId);
  }
  return await supabaseAPI.createFolder(name, parentId);
}

export async function updateFolder(id: string, name: string): Promise<void> {
  if (isGuest()) {
    return localStorageAPI.updateFolder(id, name);
  }
  return await supabaseAPI.updateFolder(id, name);
}

export async function deleteFolder(id: string): Promise<void> {
  if (isGuest()) {
    return localStorageAPI.deleteFolder(id);
  }
  return await supabaseAPI.deleteFolder(id);
}

// ============ NOTES ============

export async function getNotesByFolder(folderId: string): Promise<Note[]> {
  if (isGuest()) {
    return localStorageAPI.getNotesByFolder(folderId);
  }
  return await supabaseAPI.getNotesByFolder(folderId);
}

export async function getNote(noteId: string): Promise<Note | null> {
  if (isGuest()) {
    return localStorageAPI.getNote(noteId) || null;
  }
  return await supabaseAPI.getNote(noteId);
}

export async function createNote(folderId: string, title: string = 'Untitled Note'): Promise<Note> {
  if (isGuest()) {
    return localStorageAPI.createNote(folderId, title);
  }
  return await supabaseAPI.createNote(folderId, title);
}

export async function updateNote(noteId: string, updates: Partial<Note>): Promise<void> {
  if (isGuest()) {
    return localStorageAPI.updateNote(noteId, updates);
  }
  return await supabaseAPI.updateNote(noteId, updates);
}

export async function deleteNote(noteId: string): Promise<void> {
  if (isGuest()) {
    return localStorageAPI.deleteNote(noteId);
  }
  return await supabaseAPI.deleteNote(noteId);
}

export async function searchNotes(query: string): Promise<Note[]> {
  if (isGuest()) {
    return localStorageAPI.searchNotes(query);
  }
  return await supabaseAPI.searchNotes(query);
}

// ============ KNOWLEDGE LINKS ============

export async function addKnowledgeLink(
  noteId: string,
  blockId: string,
  text: string,
  contentBlocks: KnowledgeContentBlock[]
): Promise<KnowledgeLink> {
  if (isGuest()) {
    return localStorageAPI.addKnowledgeLink(noteId, blockId, text, contentBlocks);
  }
  return await supabaseAPI.addKnowledgeLink(noteId, blockId, text, contentBlocks);
}

export async function updateKnowledgeLink(
  noteId: string,
  linkId: string,
  contentBlocks: KnowledgeContentBlock[]
): Promise<void> {
  if (isGuest()) {
    return localStorageAPI.updateKnowledgeLink(noteId, linkId, contentBlocks);
  }
  return await supabaseAPI.updateKnowledgeLink(noteId, linkId, contentBlocks);
}

export async function deleteKnowledgeLink(noteId: string, linkId: string): Promise<void> {
  if (isGuest()) {
    return localStorageAPI.deleteKnowledgeLink(noteId, linkId);
  }
  return await supabaseAPI.deleteKnowledgeLink(noteId, linkId);
}

// ============ SHARING ============

export async function shareNote(noteId: string): Promise<string> {
  if (isGuest()) {
    const note = localStorageAPI.getNote(noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    if (!isSupabaseConfigured) {
      return localStorageAPI.shareNote(noteId);
    }

    try {
      return await supabaseAPI.shareGuestNote(note);
    } catch {
      // Offline / cloud unreachable fallback for Guest Mode
      return localStorageAPI.shareNote(noteId);
    }
  }
  return await supabaseAPI.shareNote(noteId);
}

export async function getSharedNote(shareId: string): Promise<Note | null> {
  const localSnapshot = localStorageAPI.getSharedNote(shareId);
  if (localSnapshot) {
    return localSnapshot;
  }
  if (!isSupabaseConfigured) {
    return null;
  }
  try {
    return await supabaseAPI.getSharedNote(shareId);
  } catch {
    return null;
  }
}

// For guest mode, we still need to initialize default folders
export function initializeGuestFolders(): void {
  if (isGuest()) {
    const folders = localStorageAPI.getAllFolders();
    if (folders.length === 0) {
      // Create default folders for guest
      localStorageAPI.createFolder('Inbox');
      localStorageAPI.createFolder('Projects');
      localStorageAPI.createFolder('Ideas');
      localStorageAPI.createFolder('Archive');
    }
  }
}
