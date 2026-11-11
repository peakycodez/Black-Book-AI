import type { ContentBlock } from '@/types/types';

export function migrateOldNotes(): void {
  try {
    const stored = localStorage.getItem('blackbook_data');
    if (!stored) return;

    const data = JSON.parse(stored);
    let needsMigration = false;

    data.notes = data.notes.map((note: any) => {
      if (note.content !== undefined && !note.blocks) {
        needsMigration = true;
        
        const blocks: ContentBlock[] = [];
        
        if (note.content) {
          blocks.push({
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'text',
            content: note.content,
            order: 0,
          });
        }
        
        if (note.mediaBlocks && Array.isArray(note.mediaBlocks)) {
          note.mediaBlocks.forEach((media: any) => {
            blocks.push({
              id: media.id || `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: media.type,
              content: '',
              source: media.source,
              order: blocks.length,
            });
          });
        }
        
        if (note.knowledgeLinks && Array.isArray(note.knowledgeLinks)) {
          note.knowledgeLinks = note.knowledgeLinks.map((kl: any) => ({
            id: kl.id,
            blockId: blocks[0]?.id || '',
            text: kl.text,
            content: kl.content || '',
            createdAt: kl.createdAt,
            updatedAt: kl.updatedAt,
          }));
        }

        return {
          id: note.id,
          folderId: note.folderId,
          title: note.title,
          blocks: blocks.length > 0 ? blocks : [{
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'text',
            content: '',
            order: 0,
          }],
          knowledgeLinks: note.knowledgeLinks || [],
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        };
      }
      
      return note;
    });

    if (needsMigration) {
      localStorage.setItem('blackbook_data', JSON.stringify(data));
      console.log('Notes migrated to new block-based format');
    }
  } catch (error) {
    console.error('Failed to migrate notes:', error);
  }
}
