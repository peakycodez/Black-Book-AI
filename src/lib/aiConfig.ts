// Personal AI Key Storage and Helper Utilities
// Strictly client-side only: stored exclusively in localStorage.
// NEVER stored in database, profiles, notes, shared_notes, or exported.

const PERSONAL_KEY_STORAGE_NAME = 'blackbook_personal_ai_key';

export function getPersonalApiKey(): string | null {
  try {
    const key = localStorage.getItem(PERSONAL_KEY_STORAGE_NAME);
    return key && key.trim() ? key.trim() : null;
  } catch {
    return null;
  }
}

export function setPersonalApiKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(PERSONAL_KEY_STORAGE_NAME, trimmed);
    window.dispatchEvent(new Event('blackbook_ai_key_changed'));
  }
}

export function removePersonalApiKey(): void {
  localStorage.removeItem(PERSONAL_KEY_STORAGE_NAME);
  window.dispatchEvent(new Event('blackbook_ai_key_changed'));
}

export function hasPersonalApiKey(): boolean {
  return Boolean(getPersonalApiKey());
}

export function getMaskedApiKey(): string {
  const key = getPersonalApiKey();
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  const prefix = key.slice(0, 6);
  const suffix = key.slice(-4);
  return `${prefix}...••••${suffix}`;
}

export function validateGeminiKeyFormat(key: string): boolean {
  const trimmed = key.trim();
  // Standard Google Gemini / Google AI Studio keys begin with AIzaSy and are ~39 characters
  return trimmed.length >= 20 && !/\s/.test(trimmed);
}

export function buildSystemPrompt(mode: string): string {
  if (mode === 'related') {
    return `You are a knowledge assistant for BlackBook, a personal note-taking app.
Given a current note and a list of other notes, identify the most relevant related notes.
Respond ONLY with a valid JSON array (no markdown, no code fences) of at most 5 objects:
[{"noteId":"<id>","title":"<title>","reason":"<1 short sentence why it's related>"}]
If nothing is related, return [].`;
  }
  if (mode === 'convert') {
    return `You are a knowledge assistant for BlackBook. Convert the given note content into the requested format.
Be concise, structured, and professional. Output plain text — no JSON wrapping.`;
  }
  if (mode === 'gaps') {
    return `You are a knowledge assistant for BlackBook.
Analyze the given note for information gaps, missing topics, or incomplete areas.
Respond ONLY with a valid JSON array (no markdown, no code fences) of at most 4 objects:
[{"missing":"<topic name>","reason":"<1 sentence explaining what is missing and why it matters>"}]
If the note is complete, return [].`;
  }
  return 'You are a helpful knowledge assistant for BlackBook, a personal note-taking app.';
}
