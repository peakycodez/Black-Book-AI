import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-gemini-api-key",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS });
  }

  let prompt: string;
  let mode: string;
  try {
    const body = await req.json();
    prompt = body.prompt;
    mode = body.mode ?? "analyze";
    if (!prompt) throw new Error("Missing prompt");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const clientApiKey = req.headers.get("x-gemini-api-key");
  const geminiApiKey = clientApiKey || Deno.env.get("GEMINI_API_KEY");
  const integrationsApiKey = Deno.env.get("INTEGRATIONS_API_KEY");

  if (!geminiApiKey && !integrationsApiKey) {
    return new Response(
      JSON.stringify({
        error: "Server configuration error: missing GEMINI_API_KEY or INTEGRATIONS_API_KEY in server secrets",
      }),
      {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      }
    );
  }

  const systemPrompt = buildSystemPrompt(mode);

  let upstreamUrl: string;
  const upstreamHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (geminiApiKey) {
    // Production standalone Supabase deployment using official Google Gemini API
    upstreamUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
    upstreamHeaders["x-goog-api-key"] = geminiApiKey;
  } else {
    // Platform gateway deployment fallback
    upstreamUrl = "https://app-aos0rc9k6w3l-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
    upstreamHeaders["X-Gateway-Authorization"] = `Bearer ${integrationsApiKey}`;
  }

  const upstream = await fetch(upstreamUrl, {
    method: "POST",
    headers: upstreamHeaders,
    body: JSON.stringify({
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\n" + prompt }] },
      ],
    }),
  });

  if (upstream.status === 429 || upstream.status === 402) {
    const errText = await upstream.text();
    return new Response(errText, {
      status: upstream.status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(
      JSON.stringify({ error: `Upstream error: ${upstream.status}` }),
      { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  return new Response(upstream.body, {
    headers: {
      ...CORS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
});

function buildSystemPrompt(mode: string): string {
  if (mode === "related") {
    return `You are a knowledge assistant for BlackBook, a personal note-taking app.
Given a current note and a list of other notes, identify the most relevant related notes.
Respond ONLY with a valid JSON array (no markdown, no code fences) of at most 5 objects:
[{"noteId":"<id>","title":"<title>","reason":"<1 short sentence why it's related>"}]
If nothing is related, return [].`;
  }
  if (mode === "convert") {
    return `You are a knowledge assistant for BlackBook. Convert the given note content into the requested format.
Be concise, structured, and professional. Output plain text — no JSON wrapping.`;
  }
  if (mode === "gaps") {
    return `You are a knowledge assistant for BlackBook.
Analyze the given note for information gaps, missing topics, or incomplete areas.
Respond ONLY with a valid JSON array (no markdown, no code fences) of at most 4 objects:
[{"missing":"<topic name>","reason":"<1 sentence explaining what is missing and why it matters>"}]
If the note is complete, return [].`;
  }
  return `You are a helpful knowledge assistant for BlackBook, a personal note-taking app.`;
}
