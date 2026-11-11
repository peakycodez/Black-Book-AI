// Pure native-fetch SSE client — no ky / eventsource-parser dependencies.
// Avoids ESM-only package resolution issues that corrupt the React module instance.

export interface StreamRequestOptions {
  url: string;
  body: unknown;
  anonKey?: string;
  headers?: Record<string, string>;
  onData: (data: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

export async function sendStreamRequest(opts: StreamRequestOptions): Promise<void> {
  let response: Response;
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.anonKey
      ? {
          Authorization: `Bearer ${opts.anonKey}`,
          apikey: opts.anonKey,
        }
      : {}),
    ...(opts.headers || {}),
  };

  try {
    response = await fetch(opts.url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(opts.body),
      signal: opts.signal,
    });
  } catch (err) {
    if (!opts.signal?.aborted) opts.onError(err as Error);
    return;
  }

  if (!response.ok) {
    opts.onError(new Error(`HTTP ${response.status}`));
    return;
  }

  if (!response.body) {
    opts.onError(new Error('No response body'));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // keep last (potentially incomplete) line in buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        opts.onData(payload);
      }
    }
    opts.onComplete();
  } catch (err) {
    if (!opts.signal?.aborted) opts.onError(err as Error);
  } finally {
    reader.releaseLock();
  }
}
