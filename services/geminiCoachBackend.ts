// ==============================================================================
// BioSync Gemini Coach Backend Service (@google/genai SDK)
// Server-side LLM processing with gemini-3.8-flash and Structured Outputs
// ==============================================================================

import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';

export interface CoachResponseSchema {
  cardTitle: string;
  summary: string;
  cuesTitle: string;
  bulletCues: string[];
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

/**
 * Generate structured coaching feedback using gemini-3.8-flash as primary
 * with 3 retry attempts (exponential backoff + jitter) and automatic fallback to gemini-3.5-flash-lite on 503 errors.
 */
export async function generateCoachResponse(
  query: string,
  userContext: CoachUserContext
): Promise<CoachResponseSchema> {
  const apiKey = getGeminiApiKey();

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in .env.local or process environment.'
    );
  }

  const ai = new GoogleGenAI({ apiKey });

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
  return parsed;
}
