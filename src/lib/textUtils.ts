import type { Note } from '@/types/types';

/**
 * Shared case-insensitive search predicate across note title, blocks, and knowledge links.
 */
export function matchesNoteQuery(note: Note, lowerQuery: string): boolean {
  if ((note.title || '').toLowerCase().includes(lowerQuery)) return true;
  if (note.blocks?.some((b) => (b.content || '').toLowerCase().includes(lowerQuery))) {
    return true;
  }
  return (
    note.knowledgeLinks?.some(
      (kl) =>
        (kl.text || '').toLowerCase().includes(lowerQuery) ||
        (kl.content || '').toLowerCase().includes(lowerQuery) ||
        kl.contentBlocks?.some((cb) => (cb.value || '').toLowerCase().includes(lowerQuery))
    ) ?? false
  );
}

/**
 * Remove RTL (Right-to-Left) control characters from text
 * These invisible characters can cause text to display in reverse
 */
export function sanitizeRTLCharacters(text: string): string {
  if (!text) return text;
  
  // Remove RTL control characters:
  // U+202A: LEFT-TO-RIGHT EMBEDDING
  // U+202B: RIGHT-TO-LEFT EMBEDDING
  // U+202C: POP DIRECTIONAL FORMATTING
  // U+202D: LEFT-TO-RIGHT OVERRIDE
  // U+202E: RIGHT-TO-LEFT OVERRIDE
  return text.replace(/[\u202A-\u202E]/g, '');
}

/**
 * Force cursor to start position in input element
 */
export function forceCursorToStart(element: HTMLInputElement | HTMLTextAreaElement) {
  // Skip input types that don't support selection
  if (element instanceof HTMLInputElement) {
    const unsupportedTypes = ['file', 'email', 'number', 'date', 'time', 'datetime-local', 'month', 'week', 'color', 'checkbox', 'radio'];
    if (unsupportedTypes.includes(element.type)) {
      return;
    }
  }
  
  if (element.value === '') {
    element.setSelectionRange(0, 0);
  }
}

/**
 * Force cursor to start position in contentEditable element
 */
export function forceCursorToStartContentEditable(element: HTMLElement) {
  if (element.textContent === '') {
    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(element, 0);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
}
