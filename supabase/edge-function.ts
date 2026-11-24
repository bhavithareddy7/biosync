// ==============================================================================
// BioSync Supabase Edge Function: /generate-insight
// Secure, Serverless LLM Gateway (Gemini API Integration)
// NEVER exposes API keys to client devices.
// Enforces strict medical disclaimers & non-diagnostic boundaries.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MetricPayload {
  currentMetrics: {
    sleep_hours: number;
    steps: number;
    resting_heart_rate: number;
    exercise_minutes?: number;
    mood_score?: number;
    date: string;
  };
  baselines: {
    avg_sleep_hours: number;
    avg_steps: number;
    avg_resting_heart_rate: number;
    avg_exercise_minutes?: number;
    window_days: number;
    sufficient_data: boolean;
  };
  patterns: Array<{
    type: string;
    description: string;
    deviation: number;
    metric: string;
  }>;
  userQuery?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: MetricPayload = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("LLM_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "API key not configured in Edge Function environment",
          useFallback: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const systemPrompt = `You are BioSync Intelligence, an explainable Personal Digital Health Twin AI.
CRITICAL OPERATIONAL RULES:
1. NEVER diagnose diseases or medical conditions.
2. NEVER predict pathological outcomes.
3. NEVER claim a correlation proves causation.
4. NEVER prescribe medical treatments or drugs.
5. All observations MUST reference specific baseline deviations and data points.
6. Suggest gentle, non-medical lifestyle habits (e.g. hydration, wind-down routines, pacing).
7. If persistent irregular heart rate or severe sleep deprivation is observed, advise consulting a licensed physician.
8. Tone: Objective, reassuring, data-driven, futuristic, concise.

User Context:
Current: Sleep ${payload.currentMetrics.sleep_hours}h, Steps ${payload.currentMetrics.steps}, Resting HR ${payload.currentMetrics.resting_heart_rate} bpm.
7-Day Baseline: Sleep ${payload.baselines.avg_sleep_hours}h, Steps ${payload.baselines.avg_steps}, Resting HR ${payload.baselines.avg_resting_heart_rate} bpm.
Patterns Detected: ${JSON.stringify(payload.patterns)}
${payload.userQuery ? `User Question: "${payload.userQuery}"` : ""}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      }),
    });

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return new Response(
      JSON.stringify({
        result: text,
        source: "gemini-1.5-flash",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, useFallback: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
