import type { KnowledgeLink } from '@/types/types';

/**
 * Escapes HTML special characters so plain text renders verbatim inside HTML
 * without tag parsing or attribute injection.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface HighlightMatch {
  start: number;
  end: number;
  link: KnowledgeLink;
}

/**
 * Renders plain text with interactive `<span class="knowledge-link">` wrappers
 * in a single non-overlapping pass over the original text so subsequent links
 * can never corrupt earlier markup or lose raw newlines/special characters.
 */
export function renderHighlightedTextHtml(
  content: string,
  links: KnowledgeLink[],
  extraClassName: string = ''
): string {
  if (!content) return '';

  const validLinks = links
    .filter((link) => typeof link.text === 'string' && link.text.length > 0)
    .sort((a, b) => b.text.length - a.text.length);

  if (validLinks.length === 0) {
    return escapeHtml(content);
  }

  const matches: HighlightMatch[] = [];

  for (const link of validLinks) {
    const needle = link.text;
    const requireLeftBoundary = /\w/.test(needle[0]);
    const requireRightBoundary = /\w/.test(needle[needle.length - 1]);

    let searchFrom = 0;
    while (searchFrom <= content.length - needle.length) {
      const idx = content.indexOf(needle, searchFrom);
      if (idx === -1) break;

      const end = idx + needle.length;
      const leftOk = !requireLeftBoundary || idx === 0 || !/\w/.test(content[idx - 1]);
      const rightOk = !requireRightBoundary || end === content.length || !/\w/.test(content[end]);
      const overlaps = matches.some((m) => idx < m.end && end > m.start);

      if (leftOk && rightOk && !overlaps) {
        matches.push({ start: idx, end, link });
        searchFrom = end;
      } else {
        searchFrom = idx + 1;
      }
    }
  }

  if (matches.length === 0) {
    return escapeHtml(content);
  }

  matches.sort((a, b) => a.start - b.start);

  const classAttr = extraClassName
    ? `knowledge-link ${escapeHtml(extraClassName)}`
    : 'knowledge-link';

  let out = '';
  let cursor = 0;
  for (const match of matches) {
    if (match.start > cursor) {
      out += escapeHtml(content.slice(cursor, match.start));
    }
    const matchedText = content.slice(match.start, match.end);
    out += `<span class="${classAttr}" data-link-id="${escapeHtml(match.link.id)}">${escapeHtml(matchedText)}</span>`;
    cursor = match.end;
  }

  if (cursor < content.length) {
    out += escapeHtml(content.slice(cursor));
  }

  return out;
}

/**
 * Produces a deterministic signature for all links belonging to a block so
 * additions, edits, and deletions all trigger DOM sync reliably.
 */
export function getBlockLinksSignature(links: KnowledgeLink[], blockId: string): string {
  return links
    .filter((kl) => kl.blockId === blockId)
    .map((kl) => `${kl.id}:${kl.text}`)
    .join('|');
}

const BLOCK_TAG_NAMES = new Set([
  'DIV',
  'P',
  'LI',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'PRE',
]);

function isBlockElement(node: Node): node is HTMLElement {
  return node.nodeType === 1 && BLOCK_TAG_NAMES.has((node as HTMLElement).tagName);
}

function nextMeaningfulSibling(children: ChildNode[], index: number): ChildNode | undefined {
  for (let i = index + 1; i < children.length; i++) {
    const candidate = children[i];
    if (candidate.nodeType === 3 && (candidate.textContent ?? '') === '') {
      continue;
    }
    return candidate;
  }
  return undefined;
}

function serializeContainerChildren(container: Node): string {
  const children = Array.from(container.childNodes);
  let out = '';
  let hasSeenNode = false;
  let prevWasBlock = false;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    if (child.nodeType === 3) {
      const txt = (child.textContent ?? '').replace(/\r\n/g, '\n');
      if (txt.length === 0) continue;
      if (prevWasBlock) {
        out += '\n';
      }
      out += txt;
      hasSeenNode = true;
      prevWasBlock = false;
      continue;
    }

    if (child.nodeType !== 1) continue;
    const el = child as HTMLElement;

    if (el.tagName === 'BR') {
      const next = nextMeaningfulSibling(children, i);
      // Chrome uses <br> as an empty-line placeholder at block/end boundaries and right before a block element;
      // emitting an extra \n there turns two Enters into three newlines.
      if (next && !isBlockElement(next)) {
        out += '\n';
      }
      hasSeenNode = true;
      prevWasBlock = false;
      continue;
    }

    if (isBlockElement(el)) {
      if (hasSeenNode) {
        out += '\n';
      }
      out += serializeContainerChildren(el);
      hasSeenNode = true;
      prevWasBlock = true;
      continue;
    }

    // Inline elements such as <span class="knowledge-link">
    if (prevWasBlock) {
      out += '\n';
    }
    out += serializeContainerChildren(el);
    hasSeenNode = true;
    prevWasBlock = false;
  }

  return out;
}

/**
 * Extracts plain text from a contentEditable container while preserving exact
 * single/double newlines across browser `<div><br></div>` paragraph structures
 * without inflating blank lines or keeping trailing placeholder `<br>` breaks.
 */
export function extractEditorPlainText(root: HTMLElement): string {
  return serializeContainerChildren(root).replace(/\r\n/g, '\n');
}
