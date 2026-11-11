import { useRef, useState, useCallback, useEffect } from 'react';
import { sendStreamRequest } from '@/lib/sse';
import { getPersonalApiKey, buildSystemPrompt, hasPersonalApiKey } from '@/lib/aiConfig';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '@/db/supabase';
import type { Note } from '@/types/types';

function buildAIRequestOptions(mode: string, prompt: string): {
  url: string;
  body: unknown;
  anonKey?: string;
  headers?: Record<string, string>;
} | null {
  const personalKey = getPersonalApiKey();

  if (personalKey) {
    // Direct call to official Google Gemini 2.5 Flash API with user's personal key
    const systemPrompt = buildSystemPrompt(mode);
    return {
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse',
      headers: {
        'x-goog-api-key': personalKey,
      },
      body: {
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] },
        ],
      },
    };
  }

  if (!isSupabaseConfigured) {
    return null;
  }

  // Default managed AI call through Supabase Edge Function
  return {
    url: `${supabaseUrl.replace(/\/$/, '')}/functions/v1/ai-brain`,
    anonKey: supabaseAnonKey,
    body: {
      mode,
      prompt,
    },
  };
}

export type ConvertMode =
  | 'Summary'
  | 'Todo List'
  | 'Study Notes'
  | 'Flashcards'
  | 'Quiz'
  | 'Meeting Minutes'
  | 'Action Items'
  | 'Project Plan';

export interface RelatedNote {
  noteId: string;
  title: string;
  reason: string;
}

export interface KnowledgeGap {
  missing: string;
  reason: string;
}

export interface AIBrainCache {
  cacheKey: string;
}

function buildNoteText(note: Note): string {
  const textParts = note.blocks
    .filter((b) => b.type === 'text' && b.content)
    .map((b) => b.content)
    .join('\n');
  const links = note.knowledgeLinks.map((l) => l.text).join(', ');
  return `Title: ${note.title}\nContent:\n${textParts}${links ? `\nKnowledge Links: ${links}` : ''}`;
}

function extractJson<T>(raw: string): T | null {
  try {
    const cleaned = raw.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) return null;
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

export function useAIBrain() {
  const [relatedNotes, setRelatedNotes] = useState<RelatedNote[]>([]);
  const [gaps, setGaps] = useState<KnowledgeGap[]>([]);
  const [convertOutput, setConvertOutput] = useState('');
  const [activeConvert, setActiveConvert] = useState<ConvertMode | null>(null);
  const [analyzingRelated, setAnalyzingRelated] = useState(false);
  const [analyzingGaps, setAnalyzingGaps] = useState(false);
  const [converting, setConverting] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [isUsingPersonalKey, setIsUsingPersonalKey] = useState<boolean>(() => hasPersonalApiKey());

  const cacheRef = useRef<AIBrainCache | null>(null);
  const convertAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handleKeyChange = () => {
      setIsUsingPersonalKey(hasPersonalApiKey());
      cacheRef.current = null;
      setAnalysisError(null);
      setConvertError(null);
    };
    window.addEventListener('blackbook_ai_key_changed', handleKeyChange);
    return () => window.removeEventListener('blackbook_ai_key_changed', handleKeyChange);
  }, []);

  const analyze = useCallback(async (note: Note, allNotes: Note[]) => {
    const noteKey = `${note.id}:${note.updatedAt}:${note.title}:${note.blocks.length}:${allNotes.length}`;
    if (cacheRef.current?.cacheKey === noteKey) return;

    setRelatedNotes([]);
    setGaps([]);
    setAnalysisError(null);

    const noteText = buildNoteText(note);
    const otherNotes = allNotes
      .filter((n) => n.id !== note.id)
      .slice(0, 30)
      .map(
        (n) =>
          `ID: ${n.id}\nTitle: ${n.title}\n${n.blocks
            .filter((b) => b.type === 'text')
            .map((b) => b.content)
            .join(' ')
            .slice(0, 200)}`
      );

    setAnalyzingRelated(true);
    setAnalyzingGaps(true);
    let anyFailed = false;

    const notePrompt = `CURRENT NOTE:\n${noteText}\n\nOTHER NOTES:\n${otherNotes.join('\n---\n')}`;
    const relatedReq = buildAIRequestOptions('related', notePrompt);
    const gapsReq = buildAIRequestOptions('gaps', noteText);

    if (!relatedReq || !gapsReq) {
      setAnalyzingRelated(false);
      setAnalyzingGaps(false);
      setAnalysisError(
        'AI service is currently unreachable without Supabase configuration. Add VITE_SUPABASE_* env vars or set a personal Gemini key in AI Settings.'
      );
      return;
    }

    // ── Related notes ─────────────────────────────────────────────
    const runRelated = new Promise<void>((resolve) => {
      let raw = '';

      sendStreamRequest({
        ...relatedReq,
        onData: (data) => {
          try {
            const frame = JSON.parse(data);
            const chunk: string = frame?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            raw += chunk;
          } catch { /* incomplete SSE frame */ }
        },
        onComplete: () => {
          setRelatedNotes(extractJson<RelatedNote[]>(raw) ?? []);
          setAnalyzingRelated(false);
          resolve();
        },
        onError: (err) => {
          console.error('[AI Brain] related error:', err);
          anyFailed = true;
          setAnalyzingRelated(false);
          resolve();
        },
      });
    });

    // ── Knowledge gaps ────────────────────────────────────────────
    const runGaps = new Promise<void>((resolve) => {
      let raw = '';

      sendStreamRequest({
        ...gapsReq,
        onData: (data) => {
          try {
            const frame = JSON.parse(data);
            const chunk: string = frame?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            raw += chunk;
          } catch { /* incomplete SSE frame */ }
        },
        onComplete: () => {
          setGaps(extractJson<KnowledgeGap[]>(raw) ?? []);
          setAnalyzingGaps(false);
          resolve();
        },
        onError: (err) => {
          console.error('[AI Brain] gaps error:', err);
          anyFailed = true;
          setAnalyzingGaps(false);
          resolve();
        },
      });
    });

    await Promise.all([runRelated, runGaps]);
    if (anyFailed) {
      setAnalysisError('AI service is currently unreachable or rejected the request. Check your connection or API key in AI Settings.');
    } else {
      cacheRef.current = { cacheKey: noteKey };
    }
  }, []);

  const convert = useCallback(async (note: Note, mode: ConvertMode) => {
    // Create controller BEFORE aborting old one so the abort callback from the
    // previous request can check its own signal and not touch our new state.
    const ac = new AbortController();
    convertAbortRef.current?.abort();
    convertAbortRef.current = ac;

    setConvertOutput('');
    setConvertError(null);
    setActiveConvert(mode);
    setConverting(true);

    const noteText = buildNoteText(note);
    let raw = '';
    const reqOpts = buildAIRequestOptions(
      'convert',
      `Convert the following note into: ${mode}\n\n${noteText}`
    );

    if (!reqOpts) {
      setConverting(false);
      setConvertError(
        'AI service is currently unreachable without Supabase configuration. Add VITE_SUPABASE_* env vars or set a personal Gemini key in AI Settings.'
      );
      return;
    }

    await sendStreamRequest({
      ...reqOpts,
      signal: ac.signal,
      onData: (data) => {
        if (ac.signal.aborted) return;
        try {
          const frame = JSON.parse(data);
          const chunk: string = frame?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          raw += chunk;
          setConvertOutput(raw);
        } catch { /* incomplete SSE frame */ }
      },
      onComplete: () => {
        if (!ac.signal.aborted) setConverting(false);
      },
      onError: (err) => {
        // Ignore deliberate abort — the NEW request manages its own state
        if (ac.signal.aborted) return;
        console.error('[AI Brain] convert error:', err);
        setConvertError(err.message || 'Conversion failed — AI service unreachable.');
        setConverting(false);
      },
    });
  }, []);

  const clearConvert = useCallback(() => {
    convertAbortRef.current?.abort();
    setConvertOutput('');
    setConvertError(null);
    setActiveConvert(null);
    setConverting(false);
  }, []);

  const invalidateCache = useCallback(() => {
    cacheRef.current = null;
  }, []);

  return {
    relatedNotes,
    gaps,
    convertOutput,
    activeConvert,
    analyzingRelated,
    analyzingGaps,
    converting,
    analysisError,
    convertError,
    analyze,
    convert,
    clearConvert,
    invalidateCache,
    isUsingPersonalKey,
  };
}

