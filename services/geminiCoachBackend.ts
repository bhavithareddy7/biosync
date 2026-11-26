// ==============================================================================
// BioSync Gemini Coach Backend Service (@google/genai SDK)
// Server-side LLM processing with gemini-2.5-flash and Structured Outputs
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
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    return process.env.GEMINI_API_KEY.trim();
  }

  // Attempt to parse .env.local if on Node/server environment
  try {
    const envLocalPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const content = fs.readFileSync(envLocalPath, 'utf8');
      const match = content.match(/GEMINI_API_KEY\s*=\s*(["']?)([^"'\r\n]+)\1/);
      if (match && match[2] && match[2].trim().length > 0) {
        return match[2].trim();
      }
    }
  } catch {
    // Non-filesystem environments or permission limitations
  }

  return undefined;
}

/**
 * Generate structured coaching feedback using gemini-2.5-flash and responseSchema
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

  const CANDIDATE_MODELS = [
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-3.7-flash',
  ];

  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: promptContent,
        config: {
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
        },
      });

      const responseText = response.text;
      if (responseText) {
        const parsed: CoachResponseSchema = JSON.parse(responseText);
        return parsed;
      }
    } catch (err: any) {
      console.warn(`[geminiCoachBackend] Model ${modelName} failed, attempting next:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All candidate Gemini models failed to respond');
}
