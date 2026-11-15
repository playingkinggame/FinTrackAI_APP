import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

// Change the model here, or set a GEMINI_MODEL secret in Supabase to override it
// without redeploying the code.
const DEFAULT_MODEL = "gemini-3.8-flash";
const GEMINI_TIMEOUT_MS = 25000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // 1. Check the user is logged in
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    // 2. Validate the request body
    const body = await req.json();
    const question = String(body?.question ?? "").trim();
    const summary = body?.summary;

    if (!question || question.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Question must be 1–1000 characters." }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // Treat all client-provided summary values as untrusted input.
    // In production, calculate these figures server-side from the user's RLS-protected records.
    if (!summary || typeof summary !== "object") {
      return new Response(JSON.stringify({ error: "Missing finance summary." }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    // 3. Gemini key (stored as a Supabase secret, never in the app)
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY secret is not configured.");

    const model = Deno.env.get("GEMINI_MODEL") ?? DEFAULT_MODEL;

    const prompt = `
You are FinTrack AI, a careful personal spending explainer.
Use only the supplied summary. Do not invent transactions, balances, or facts.
If the summary does not answer the question, say what information is missing.
Do not give investment, tax, lending, or regulated financial advice.
Clearly say that the response is informational, not professional financial advice.
Keep the response concise and easy to understand.

User question: ${question}

Current month summary (INR):
${JSON.stringify(summary)}
`;

    // 4. Call Gemini with a timeout so the function never hangs
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    const started = Date.now();

    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              thinkingConfig: { thinkingLevel: "low" },
              maxOutputTokens: 400,
            },
          }),
          signal: controller.signal,
        },
      );
    } catch (e) {
      console.error("Gemini fetch failed or timed out after", Date.now() - started, "ms", e);
      throw new Error("The AI provider did not respond in time. Please try again.");
    } finally {
      clearTimeout(timer);
    }

    console.log(`Gemini (${model}) responded`, response.status, Date.now() - started, "ms");

    const result = await response.json();
    if (!response.ok) {
      console.error("Gemini API error", result);
      throw new Error(
        "AI provider request failed. Check the configured Gemini model and API access.",
      );
    }

    const answer = result?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text ?? "")
      .join("\n")
      .trim();
    if (!answer) throw new Error("AI provider returned no text.");

    return new Response(JSON.stringify({ answer }), { headers: jsonHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});