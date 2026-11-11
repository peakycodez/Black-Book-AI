import { supabase } from '@/db/supabase';
import { matchesNoteQuery } from './textUtils';
import type { Folder, Note, KnowledgeLink, KnowledgeContentBlock } from '@/types/types';

// ============ FOLDERS ============

export async function getAllFolders(): Promise<Folder[]> {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching folders:', error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map(f => ({
    id: f.id,
    name: f.name,
    parentId: f.parent_id,
    createdAt: f.created_at,
  }));
}

export async function createFolder(name: string, parentId: string | null = null): Promise<Folder> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('folders')
    .insert({
      user_id: user.id,
      name,
      parent_id: parentId,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    parentId: data.parent_id,
    createdAt: data.created_at,
  };
}

export async function updateFolder(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .update({ name })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteFolder(id: string): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ NOTES ============

export async function getNotesByFolder(folderId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('folder_id', folderId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map(mapNoteFromDB);
}

export async function getNote(noteId: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .single();

  if (error) {
    console.error('Error fetching note:', error);
    return null;
  }

  return mapNoteFromDB(data);
}

export async function createNote(folderId: string, title: string = 'Untitled Note'): Promise<Note> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const initialBlocks = [
    {
      id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      type: 'text',
      content: '',
      order: 0,
    },
  ];

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      folder_id: folderId,
      title,
      blocks: initialBlocks,
      knowledge_links: [],
    })
    .select()
    .single();

  if (error) throw error;

  return mapNoteFromDB(data);
}

export async function updateNote(noteId: string, updates: Partial<Note>): Promise<void> {
  const dbUpdates: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.blocks !== undefined) dbUpdates.blocks = updates.blocks;
  if (updates.knowledgeLinks !== undefined) dbUpdates.knowledge_links = updates.knowledgeLinks;

  const { error } = await supabase
    .from('notes')
    .update(dbUpdates)
    .eq('id', noteId);

  if (error) throw error;
}

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId);

  if (error) throw error;
}

export async function searchNotes(query: string): Promise<Note[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Fetch user's notes (scoped by RLS) and match locally so special characters
  // like ',', '(', ')', '%' in queries never corrupt PostgREST .or() filter syntax.
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error searching notes:', error);
    return [];
  }

  if (!data) {
    return [];
  }

  const lowerQuery = trimmed.toLowerCase();
  return data.map(mapNoteFromDB).filter((note) => matchesNoteQuery(note, lowerQuery));
}

// ============ KNOWLEDGE LINKS ============

export async function addKnowledgeLink(
  noteId: string,
  blockId: string,
  text: string,
  contentBlocks: KnowledgeContentBlock[]
): Promise<KnowledgeLink> {
  const note = await getNote(noteId);
  if (!note) throw new Error('Note not found');

  const newLink: KnowledgeLink = {
    id: `kl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    blockId,
    text,
    content: '',
    contentBlocks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedLinks = [...note.knowledgeLinks, newLink];

  await updateNote(noteId, { knowledgeLinks: updatedLinks });

  return newLink;
}

export async function updateKnowledgeLink(
  noteId: string,
  linkId: string,
  contentBlocks: KnowledgeContentBlock[]
): Promise<void> {
  const note = await getNote(noteId);
  if (!note) return;

  const updatedLinks = note.knowledgeLinks.map(link =>
    link.id === linkId
      ? { ...link, contentBlocks, updatedAt: new Date().toISOString() }
      : link
  );

  await updateNote(noteId, { knowledgeLinks: updatedLinks });
}

export async function deleteKnowledgeLink(noteId: string, linkId: string): Promise<void> {
  const note = await getNote(noteId);
  if (!note) return;

  const updatedLinks = note.knowledgeLinks.filter(link => link.id !== linkId);

  await updateNote(noteId, { knowledgeLinks: updatedLinks });
}

// ============ SHARING (SNAPSHOTS) ============

export async function shareNote(noteId: string): Promise<string> {
  const note = await getNote(noteId);
  if (!note) throw new Error('Note not found');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { error } = await supabase
    .from('shared_notes')
    .insert({
      share_id: shareId,
      original_note_id: noteId,
      owner_id: user.id,
      title: note.title,
      blocks: note.blocks,
      knowledge_links: note.knowledgeLinks,
    });

  if (error) throw error;

  return shareId;
}

export async function shareGuestNote(note: Note): Promise<string> {
  // For guest notes, we don't have a user ID, so owner_id will be null
  const shareId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { error } = await supabase
    .from('shared_notes')
    .insert({
      share_id: shareId,
      original_note_id: null, // Guest notes don't have a database ID
      owner_id: null, // No owner for guest notes
      title: note.title,
      blocks: note.blocks,
      knowledge_links: note.knowledgeLinks,
    });

  if (error) throw error;

  return shareId;
}

export async function getSharedNote(shareId: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from('shared_notes')
    .select('*')
    .eq('share_id', shareId)
    .single();

  if (error) {
    console.error('Error fetching shared note:', error);
    return null;
  }

  return {
    id: data.id,
    folderId: '', // Shared notes don't belong to folders
    title: data.title,
    blocks: data.blocks || [],
    knowledgeLinks: data.knowledge_links || [],
    createdAt: data.created_at,
    updatedAt: data.created_at, // Snapshots don't update
  };
}

// ============ HELPERS ============

function mapNoteFromDB(dbNote: any): Note {
  return {
    id: dbNote.id,
    folderId: dbNote.folder_id,
    title: dbNote.title || 'Untitled Note',
    blocks: dbNote.blocks || [],
    knowledgeLinks: dbNote.knowledge_links || [],
    createdAt: dbNote.created_at,
    updatedAt: dbNote.updated_at,
  };
}
