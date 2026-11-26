// ==============================================================================
// BioSync Web & API Server
// Static Expo Web Distribution + Secure Server-Side /api/coach Gemini Integration
// ==============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI, Type } = require('@google/genai');

const PORT = process.env.PORT || 8085;
const distDir = path.join(__dirname, 'dist');

// Read .env.local if present
function loadEnvLocal() {
  const envLocalPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    try {
      const content = fs.readFileSync(envLocalPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const match = trimmed.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            const val = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
            if (!process.env[key] && val) {
              process.env[key] = val;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not read .env.local:', e.message);
    }
  }
}

loadEnvLocal();

const COACH_SYSTEM_INSTRUCTION = `You are BioSync AI, an expert biomechanics and strength coach. 
Analyze the user's query alongside their biometric and profile context ("My Twin" data).

STRICT RULES:
1. Never use generic filler phrases like "for optimal hypertrophy and recovery" or "throughout all lifts".
2. Directly reference the specific exercise, joint, equipment constraint, or biometric metric asked about in the first sentence.
3. Classify the query into one of four card types: "FORM_GUIDANCE", "EXERCISE_SUBSTITUTION", "RECOVERY_READINESS", or "PROGRESSION_PLAN".
4. For FORM_GUIDANCE, provide exact joint angles, hand/foot placement, and scapular/spinal alignment—not generic tempo or breathing tips.
5. For RECOVERY_READINESS, compare the user's stated metrics (e.g., RHR, sleep) against their baseline in the provided user context.`;

function formatGeminiError(err) {
  if (!err) return 'Unknown Gemini API error';
  const raw = typeof err.message === 'string' ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw);
    if (parsed.error && parsed.error.message) {
      return parsed.error.message;
    }
  } catch {}
  return raw;
}

async function handleGeminiCoach(query, userContext) {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured in .env.local or process environment.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const promptContent = `USER QUERY:
${query}

USER CONTEXT ("My Twin" & "My Data"):
${JSON.stringify(userContext || {}, null, 2)}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
    if (!responseText) {
      throw new Error('Empty response received from Gemini API');
    }

    return JSON.parse(responseText);
  } catch (err) {
    const friendlyMsg = formatGeminiError(err);
    throw new Error(friendlyMsg);
  }
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // API Route: POST /api/coach
  if (url.pathname === '/api/coach' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
      if (bodyData.length > 1e6) {
        req.connection.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyData || '{}');
        const query = body.query;
        const userContext = body.userContext;

        if (!query || typeof query !== 'string' || !query.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Query parameter is required' }));
          return;
        }

        const result = await handleGeminiCoach(query, userContext);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        const errorMsg = formatGeminiError(err);
        console.error('[API /api/coach] Error:', errorMsg);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: errorMsg,
          isConfigError: errorMsg.includes('GEMINI_API_KEY')
        }));
      }
    });
    return;
  }

  // API Status Route: GET /api/status
  if (url.pathname === '/api/status' && req.method === 'GET') {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== 'your_gemini_api_key_here');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      hasGeminiKey: hasKey,
      model: 'gemini-3.8-flash',
    }));
    return;
  }

  // Static File Serving with SPA fallback
  let filePath = path.join(distDir, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server error: ' + err.code);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`BioSync server listening on http://127.0.0.1:${PORT}`);
});
