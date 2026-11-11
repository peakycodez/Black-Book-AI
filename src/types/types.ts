export type ContentBlockType = 'text' | 'image' | 'audio' | 'video';

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string;
  source?: string;
  order: number;
}

export type KnowledgeContentType = 'text' | 'link' | 'image' | 'audio' | 'video';

export interface KnowledgeContentBlock {
  id: string;
  type: KnowledgeContentType;
  value: string;
  label?: string; // For links: display text
  order: number;
}

export interface KnowledgeLink {
  id: string;
  blockId: string;
  text: string;
  content: string; // Legacy: plain text content
  contentBlocks?: KnowledgeContentBlock[]; // New: rich content blocks
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  folderId: string;
  title: string;
  blocks: ContentBlock[];
  knowledgeLinks: KnowledgeLink[];
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export interface AppData {
  folders: Folder[];
  notes: Note[];
}

export interface MediaBlock {
  id: string;
  type: 'image' | 'audio' | 'video';
  source?: string;
  position: number;
}
