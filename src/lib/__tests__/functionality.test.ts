// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  escapeHtml,
  extractEditorPlainText,
  getBlockLinksSignature,
  renderHighlightedTextHtml,
} from '@/lib/knowledgeHighlight';
import * as storage from '@/lib/storage';
import * as unifiedStorage from '@/lib/unifiedStorage';
import { matchesNoteQuery } from '@/lib/textUtils';
import type { KnowledgeLink, Note } from '@/types/types';

function makeLink(overrides: Partial<KnowledgeLink> = {}): KnowledgeLink {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? 'kl_1',
    blockId: overrides.blockId ?? 'block_1',
    text: overrides.text ?? 'React',
    content: '',
    contentBlocks: overrides.contentBlocks ?? [
      { id: 'kb_1', type: 'text', value: 'Hidden note details', order: 0 },
    ],
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

describe('knowledgeHighlight integrity', () => {
  it('escapes HTML special characters and preserves multi-paragraph newlines', () => {
    const content = 'Compare x < y & a > b\n\nSecond paragraph with React & C++.';
    const html = renderHighlightedTextHtml(content, [
      makeLink({ id: 'kl_react', text: 'React' }),
      makeLink({ id: 'kl_cpp', text: 'C++' }),
    ]);

    expect(html).toContain('Compare x &lt; y &amp; a &gt; b\n\nSecond paragraph with ');
    expect(html).toContain('<span class="knowledge-link" data-link-id="kl_react">React</span>');
    expect(html).toContain('<span class="knowledge-link" data-link-id="kl_cpp">C++</span>');
  });

  it('prevents subsequent links from corrupting earlier span HTML attributes', () => {
    const content = 'Learn class and span inside data systems';
    const html = renderHighlightedTextHtml(content, [
      makeLink({ id: 'kl_1', text: 'data' }),
      makeLink({ id: 'kl_2', text: 'class' }),
      makeLink({ id: 'kl_3', text: 'span' }),
    ]);

    const container = document.createElement('div');
    container.innerHTML = html;

    const spans = Array.from(container.querySelectorAll('.knowledge-link'));
    expect(spans).toHaveLength(3);
    expect(spans.map((s) => s.textContent)).toEqual(['class', 'span', 'data']);
    expect(container.textContent).toBe(content);
  });

  it('respects word boundaries for alphanumeric words while allowing symbol terms', () => {
    const content = 'This article covers art and C++ (v2) cleanly.';
    const html = renderHighlightedTextHtml(content, [
      makeLink({ id: 'kl_art', text: 'art' }),
      makeLink({ id: 'kl_cpp', text: 'C++' }),
      makeLink({ id: 'kl_v2', text: '(v2)' }),
    ]);

    const container = document.createElement('div');
    container.innerHTML = html;
    const spans = Array.from(container.querySelectorAll('.knowledge-link'));
    // "article" must NOT be partially matched by "art"
    expect(spans.map((s) => s.textContent)).toEqual(['art', 'C++', '(v2)']);
  });

  it('updates signature whenever link ID or text changes', () => {
    const linksA = [makeLink({ id: 'kl_1', blockId: 'b1', text: 'Alpha' })];
    const linksB = [makeLink({ id: 'kl_1', blockId: 'b1', text: 'Beta' })];
    expect(getBlockLinksSignature(linksA, 'b1')).not.toBe(getBlockLinksSignature(linksB, 'b1'));
    expect(escapeHtml('<script>"test"</script>')).toBe('&lt;script&gt;&quot;test&quot;&lt;/script&gt;');
  });

  it('extracts plain text cleanly across contentEditable div/br paragraph DOM shapes', () => {
    const el = document.createElement('div');

    el.innerHTML = '<br>';
    expect(extractEditorPlainText(el)).toBe('');

    el.innerHTML = 'One<div>Two</div>';
    expect(extractEditorPlainText(el)).toBe('One\nTwo');

    el.innerHTML = 'One<div><br></div><div>Two</div>';
    expect(extractEditorPlainText(el)).toBe('One\n\nTwo');

    el.innerHTML = 'One<div><br></div><div><br></div><div>Two</div>';
    expect(extractEditorPlainText(el)).toBe('One\n\n\nTwo');

    el.innerHTML = 'Intro <span class="knowledge-link" data-link-id="k1">C++</span><div><br></div><div>Next &amp; end</div>';
    expect(extractEditorPlainText(el)).toBe('Intro C++\n\nNext & end');
  });
});

describe('Guest storage & persistence integrity', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('blackbook_guest_mode', 'true');
  });

  it('creates, renames, and recursively deletes folders and their notes', () => {
    const parent = storage.createFolder('Research');
    const child = storage.createFolder('Subtopic', parent.id);
    const noteInChild = storage.createNote(child.id, 'Child Note');

    expect(storage.getAllFolders().some((f) => f.id === parent.id)).toBe(true);
    storage.updateFolder(parent.id, 'Renamed Research');
    expect(storage.getAllFolders().find((f) => f.id === parent.id)?.name).toBe('Renamed Research');

    storage.deleteFolder(parent.id);
    expect(storage.getAllFolders().some((f) => f.id === parent.id || f.id === child.id)).toBe(false);
    expect(storage.getNote(noteInChild.id)).toBeUndefined();
  });

  it('searches note titles, block contents, knowledge links, and excludes deleted notes', () => {
    const folder = storage.createFolder('Inbox');
    const n1 = storage.createNote(folder.id, 'Photonics');
    storage.updateNote(n1.id, {
      blocks: [{ id: 'b1', type: 'text', content: 'Waveguide notes & special (query)', order: 0 }],
    });
    storage.addKnowledgeLink(n1.id, 'b1', 'Waveguide', [
      { id: 'kb_1', type: 'text', value: 'Dispersion compensation details', order: 0 },
    ]);

    expect(storage.searchNotes('Waveguide').map((n) => n.id)).toContain(n1.id);
    expect(storage.searchNotes('Dispersion').map((n) => n.id)).toContain(n1.id);
    expect(storage.searchNotes('(query)').map((n) => n.id)).toContain(n1.id);
    expect(storage.searchNotes('   ')).toEqual([]);

    storage.deleteNote(n1.id);
    expect(storage.searchNotes('Waveguide')).toEqual([]);
  });

  it('rethrows localStorage errors instead of silently claiming save succeeded', () => {
    const folder = storage.createFolder('QuotaTest');
    const note = storage.createNote(folder.id, 'Important');

    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    expect(() =>
      storage.updateNote(note.id, {
        title: 'Modified',
        blocks: [{ id: 'b1', type: 'text', content: 'Should throw', order: 0 }],
      })
    ).toThrow();

    spy.mockRestore();
  });

  it('preserves full note content + multiple knowledge links across update and share fallback', async () => {
    const folder = await unifiedStorage.createFolder('Links');
    const note = await unifiedStorage.createNote(folder.id, 'Architecture');

    const fullContent = 'Paragraph 1: State flow.\n\nParagraph 2: Persistence & API.';
    await unifiedStorage.updateNote(note.id, {
      title: 'Architecture Spec',
      blocks: [{ id: note.blocks[0].id, type: 'text', content: fullContent, order: 0 }],
    });

    const kl1 = await unifiedStorage.addKnowledgeLink(note.id, note.blocks[0].id, 'State flow', [
      { id: 'k1', type: 'text', value: 'Uses synchronous refs + serialized saves', order: 0 },
    ]);
    const kl2 = await unifiedStorage.addKnowledgeLink(note.id, note.blocks[0].id, 'Persistence', [
      { id: 'k2', type: 'text', value: 'Survives reload', order: 0 },
    ]);

    const reloaded = await unifiedStorage.getNote(note.id);
    expect(reloaded?.title).toBe('Architecture Spec');
    expect(reloaded?.blocks[0].content).toBe(fullContent);
    expect(reloaded?.knowledgeLinks.map((k) => k.id)).toEqual([kl1.id, kl2.id]);

    const localShareId = storage.shareNote(note.id);
    const sharedSnapshot = await unifiedStorage.getSharedNote(localShareId);
    expect(sharedSnapshot?.title).toBe('Architecture Spec');
    expect(sharedSnapshot?.blocks[0].content).toBe(fullContent);
    expect(sharedSnapshot?.knowledgeLinks).toHaveLength(2);
  });

  it('matchesNoteQuery handles missing optional fields cleanly', () => {
    const note: Note = {
      id: 'n1',
      folderId: 'f1',
      title: 'Test Title',
      blocks: [{ id: 'b1', type: 'text', content: 'Body text', order: 0 }],
      knowledgeLinks: [],
      createdAt: '',
      updatedAt: '',
    };
    expect(matchesNoteQuery(note, 'body')).toBe(true);
    expect(matchesNoteQuery(note, 'missing')).toBe(false);
  });
});
