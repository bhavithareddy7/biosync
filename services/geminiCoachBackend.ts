// ==============================================================================
// BioSync Gemini Coach Backend Service (@google/genai SDK)
// Server-side LLM processing with gemini-3.8-flash and Structured Outputs
// ==============================================================================

import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';
import https from 'https';

export interface CoachResponseSchema {
  cardTitle: string;
  summary: string;
  cuesTitle: string;
  bulletCues: string[];
  provider?: string;
  model?: string;
}

export interface CoachUserContext {
  myTwin: {
    restingHeartRate: number;
    restingHeartRateBaseline: number;
    sleepHours: number;
    sleepHoursBaseline: number;
    fitnessLevel: string;
    injuryHistory: string;
  };
  myData: {
    activeSplit: string;
    recoveryPercentage: number;
    recentLogs: {
      routine: string;
      date: string;
      totalVolumeKg: number;
      exercises: string[];
    }[];
  };
}

export const COACH_SYSTEM_INSTRUCTION = `You are BioSync AI, an expert biomechanics and strength coach. 
Analyze the user's query alongside their biometric and profile context ("My Twin" data).

STRICT RULES:
1. Never use generic filler phrases like "for optimal hypertrophy and recovery" or "throughout all lifts".
2. Directly reference the specific exercise, joint, equipment constraint, or biometric metric asked about in the first sentence.
3. Classify the query into one of four card types: "FORM_GUIDANCE", "EXERCISE_SUBSTITUTION", "RECOVERY_READINESS", or "PROGRESSION_PLAN".
4. For FORM_GUIDANCE, provide exact joint angles, hand/foot placement, and scapular/spinal alignment—not generic tempo or breathing tips.
5. For RECOVERY_READINESS, compare the user's stated metrics (e.g., RHR, sleep) against their baseline in the provided user context.`;

/**
 * Helper to resolve GEMINI_API_KEY from environment or .env.local file
 */
export function getGeminiApiKey(): string | undefined {
  if (
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim().length > 0 &&
    process.env.GEMINI_API_KEY.trim() !== 'your_gemini_api_key_here'
  ) {
    return process.env.GEMINI_API_KEY.trim();
  }

  // Attempt to parse .env.local if on Node/server environment
  const candidatePaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.join(__dirname, '..', '.env.local'),
    'E:\\biosync\\.env.local',
    'E:\\bio sync\\.env.local',
  ];

  for (const envLocalPath of candidatePaths) {
    try {
      if (fs.existsSync(envLocalPath)) {
        const content = fs.readFileSync(envLocalPath, 'utf8');
        const match = content.match(/GEMINI_API_KEY\s*=\s*(["']?)([^"'\r\n]+)\1/);
        if (match && match[2] && match[2].trim().length > 0 && match[2].trim() !== 'your_gemini_api_key_here') {
          return match[2].trim();
        }
      }
    } catch {
      // Non-filesystem environments or permission limitations
    }
  }

  return undefined;
}

export function getGroqApiKey(): string | undefined {
  if (
    process.env.GROQ_API_KEY &&
    process.env.GROQ_API_KEY.trim().startsWith('gsk_')
  ) {
    return process.env.GROQ_API_KEY.trim();
  }

  const candidatePaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.join(__dirname, '..', '.env.local'),
    'E:\\biosync\\.env.local',
    'E:\\bio sync\\.env.local',
  ];

  for (const envPath of candidatePaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/GROQ_API_KEY\s*=\s*(["']?)([^"'\r\n]+)\1/);
        if (match && match[2] && match[2].trim().startsWith('gsk_')) {
          return match[2].trim();
        }
      }
    } catch {
      // ignore
    }
  }

  return undefined;
}

export function callGroqCoach(
  query: string,
  userContext: CoachUserContext,
  model = 'openai/gpt-oss-120b'
): Promise<CoachResponseSchema> {
  const groqKey = getGroqApiKey();
  if (!groqKey) {
    throw new Error('GROQ_API_KEY is not configured in .env.local');
  }

  const promptContent = `USER QUERY:
${query}

USER CONTEXT ("My Twin" & "My Data"):
${JSON.stringify(userContext || {}, null, 2)}
`;

  const payload = JSON.stringify({
    model,
    messages: [
      {
        role: 'system',
        content: `${COACH_SYSTEM_INSTRUCTION}

You must respond ONLY with a valid JSON object matching this schema:
{
  "cardTitle": string (e.g. "FORM GUIDANCE", "RECOVERY & READINESS", "EXERCISE ALTERNATIVES", or "PROGRESSION PLAN"),
  "summary": string (2 to 3 crisp, tailored sentences answering the exact question directly without generic fillers),
  "cuesTitle": string (e.g. "KEY BIOMECHANICAL CUES", "RECOMMENDED SWAPS", or "READINESS ACTION PLAN"),
  "bulletCues": array of 3 strings (actionable, specific bullet points with exact joint angles, substitutions, or recovery rules)
}`
      },
      {
        role: 'user',
        content: promptContent
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.message?.content;
            if (!content) throw new Error('Empty response from Groq');
            const result: CoachResponseSchema = JSON.parse(content);
            result.provider = 'groq';
            result.model = model;
            resolve(result);
          } catch (e: any) {
            reject(new Error(`Groq JSON parse error: ${e.message}`));
          }
        } else {
          try {
            const errObj = JSON.parse(data);
            reject(new Error(errObj.error?.message || `Groq returned HTTP ${res.statusCode}`));
          } catch {
            reject(new Error(`Groq returned HTTP ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Groq request timed out after 15s'));
    });
    req.write(payload);
    req.end();
  });
}

/**
 * Extracts a human-readable error message from Gemini API errors
 */
export function formatGeminiError(err: any): string {
  if (!err) return 'Unknown Gemini API error';
  const raw = typeof err.message === 'string' ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw);
    if (parsed.error) {
      const codeStr = parsed.error.code ? `[Code ${parsed.error.code}] ` : (parsed.error.status ? `[${parsed.error.status}] ` : '');
      const msg = parsed.error.message || raw;
      return `${codeStr}${msg}`.trim();
    }
  } catch {
    // raw string is not JSON
  }
  const status = err.status || err.statusCode;
  if (status) {
    return `[HTTP ${status}] ${raw}`;
  }
  return raw;
}

/**
 * Checks if an error is transient (429 Rate Limit / Quota Spike or 503 Service Unavailable / High Demand)
 */
export function isRetryableError(err: any): boolean {
  if (!err) return false;
  const str = (typeof err.message === 'string' ? err.message : String(err)).toLowerCase();
  return (
    str.includes('429') ||
    str.includes('503') ||
    str.includes('high demand') ||
    str.includes('resource_exhausted') ||
    str.includes('unavailable') ||
    str.includes('spikes in demand')
  );
}

/**
 * Checks if error is specifically a 503 high demand / service unavailable error
 */
export function isHighDemandError(err: any): boolean {
  if (!err) return false;
  const str = (typeof err.message === 'string' ? err.message : String(err)).toLowerCase();
  return (
    str.includes('503') ||
    str.includes('high demand') ||
    str.includes('spikes in demand') ||
    str.includes('unavailable')
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes generateContent with up to 3 attempts using exponential backoff + jitter on 429/503 errors
 */
async function generateContentWithRetry(
  ai: GoogleGenAI,
  model: string,
  promptContent: string,
  config: any,
  maxAttempts = 3
): Promise<any> {
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      return await ai.models.generateContent({
        model,
        contents: promptContent,
        config,
      });
    } catch (err: any) {
      lastError = err;
      const retryable = isRetryableError(err);
      if (!retryable || attempt >= maxAttempts) {
        throw err;
      }
      const baseDelay = Math.pow(2, attempt - 1) * 600; // 600ms, 1200ms
      const jitter = Math.floor(Math.random() * 300); // 0-300ms
      const delay = baseDelay + jitter;
      console.warn(
        `[geminiCoachBackend] ${model} transient error (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

export async function callGroqWithModelFallback(
  query: string,
  userContext: CoachUserContext
): Promise<CoachResponseSchema> {
  const candidateGroqModels = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b',
  ];

  let lastGroqError: any = null;
  for (const model of candidateGroqModels) {
    try {
      const res = await callGroqCoach(query, userContext, model);
      return res;
    } catch (err: any) {
      lastGroqError = err;
      const msg = err.message || '';
      const isNotFound = msg.includes('does not exist') || msg.includes('decommissioned') || msg.includes('404');
      if (isNotFound) {
        continue;
      }
    }
  }
  throw lastGroqError || new Error('All Groq candidate models failed');
}

/**
 * Generate structured coaching feedback using Dual-Provider Failover:
 * Primary: Groq LPU (llama-3.3-70b-versatile or llama-3.1-8b-instant / gpt-oss-120b)
 * Secondary / Fallback: Google Gemini (gemini-3.8-flash / gemini-3.5-flash-lite)
 */
export async function generateCoachResponse(
  query: string,
  userContext: CoachUserContext
): Promise<CoachResponseSchema> {
  const groqKey = getGroqApiKey();
  const geminiKey = getGeminiApiKey();

  // 1. Primary: Groq LPU (Instant sub-second response, 14,400 requests/day limit)
  if (groqKey) {
    try {
      const groqResult = await callGroqWithModelFallback(query, userContext);
      return groqResult;
    } catch (groqErr: any) {
      console.warn(`[geminiCoachBackend] Groq failed: ${groqErr.message}. Initiating failover to Gemini...`);
      if (!geminiKey) {
        throw new Error(`Groq API Error: ${groqErr.message}`);
      }
    }
  }

  // 2. Secondary / Fallback: Google Gemini
  if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'Neither GROQ_API_KEY nor GEMINI_API_KEY is configured. Please set GROQ_API_KEY or GEMINI_API_KEY in .env.local.'
    );
  }

  const ai = new GoogleGenAI({ apiKey: geminiKey });

  const promptContent = `USER QUERY:
${query}

USER CONTEXT ("My Twin" & "My Data"):
${JSON.stringify(userContext, null, 2)}
`;

  const promptConfig = {
    systemInstruction: COACH_SYSTEM_INSTRUCTION,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        cardTitle: {
          type: Type.STRING,
          description: 'Card headline such as FORM GUIDANCE, RECOVERY & READINESS, EXERCISE ALTERNATIVES, or PROGRESSION PLAN',
        },
        summary: {
          type: Type.STRING,
          description: '2 to 3 crisp, tailored sentences answering the exact question directly without generic fillers',
        },
        cuesTitle: {
          type: Type.STRING,
          description: 'Action header such as KEY BIOMECHANICAL CUES, RECOMMENDED SWAPS, or READINESS ACTION PLAN',
        },
        bulletCues: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: '3 actionable, specific bullet points with exact joint angles, substitutions, or recovery rules',
        },
      },
      required: ['cardTitle', 'summary', 'cuesTitle', 'bulletCues'],
    },
  };

  let response: any;
  try {
    // Primary Model: gemini-3.8-flash (3 retry attempts with exponential backoff + jitter on 429/503)
    response = await generateContentWithRetry(ai, 'gemini-3.8-flash', promptContent, promptConfig, 3);
  } catch (primaryErr: any) {
    if (isHighDemandError(primaryErr)) {
      console.warn(
        '[geminiCoachBackend] gemini-3.8-flash failed with 503 high-demand error after 3 attempts. Automatically falling back to gemini-3.5-flash-lite...'
      );
      try {
        // Automatic Fallback: gemini-3.5-flash-lite
        response = await generateContentWithRetry(ai, 'gemini-3.5-flash-lite', promptContent, promptConfig, 3);
      } catch (fallbackErr: any) {
        throw new Error(formatGeminiError(fallbackErr));
      }
    } else {
      throw new Error(formatGeminiError(primaryErr));
    }
  }

  const responseText = response.text;
  if (!responseText) {
    throw new Error('Received empty response from Gemini API');
  }

  const parsed: CoachResponseSchema = JSON.parse(responseText);
  parsed.provider = 'gemini';
  return parsed;
}
