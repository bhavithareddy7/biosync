// ==============================================================================
// BioSync Web & API Server
// Static Expo Web Distribution + Secure Server-Side /api/coach Gemini Integration
// ==============================================================================

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI, Type } = require('@google/genai');

const PORT = process.env.PORT || 8085;
const distDir = path.join(__dirname, 'dist');

// Read .env.local from potential directories
function loadEnvLocal() {
  const candidatePaths = [
    path.join(__dirname, '.env.local'),
    path.resolve(process.cwd(), '.env.local'),
    'E:\\biosync\\.env.local',
    'E:\\bio sync\\.env.local',
  ];

  for (const envLocalPath of candidatePaths) {
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
              if (val && (!process.env[key] || process.env[key] === 'your_gemini_api_key_here')) {
                process.env[key] = val;
              }
            }
          }
        }
      } catch (e) {
        console.warn(`Could not read ${envLocalPath}:`, e.message);
      }
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
    if (parsed.error) {
      const codeStr = parsed.error.code ? `[Code ${parsed.error.code}] ` : (parsed.error.status ? `[${parsed.error.status}] ` : '');
      const msg = parsed.error.message || raw;
      return `${codeStr}${msg}`.trim();
    }
  } catch {}
  const status = err.status || err.statusCode;
  if (status) {
    return `[HTTP ${status}] ${raw}`;
  }
  return raw;
}

function isRetryableError(err) {
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

function isHighDemandError(err) {
  if (!err) return false;
  const str = (typeof err.message === 'string' ? err.message : String(err)).toLowerCase();
  return (
    str.includes('503') ||
    str.includes('high demand') ||
    str.includes('spikes in demand') ||
    str.includes('unavailable')
  );
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function generateContentWithRetry(ai, model, promptContent, config, maxAttempts = 3) {
  let attempt = 0;
  let lastError = null;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      return await ai.models.generateContent({
        model,
        contents: promptContent,
        config,
      });
    } catch (err) {
      lastError = err;
      const retryable = isRetryableError(err);
      if (!retryable || attempt >= maxAttempts) {
        throw err;
      }
      const baseDelay = Math.pow(2, attempt - 1) * 600;
      const jitter = Math.floor(Math.random() * 300);
      const delay = baseDelay + jitter;
      console.warn(
        `[server /api/coach] ${model} transient error (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

function callGroqCoach(query, userContext, model = 'openai/gpt-oss-120b') {
  const groqKey = (process.env.GROQ_API_KEY || '').trim();
  if (!groqKey || groqKey === 'your_groq_api_key_here') {
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
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.message?.content;
            if (!content) throw new Error('Empty response from Groq');
            const result = JSON.parse(content);
            result.provider = 'groq';
            result.model = model;
            resolve(result);
          } catch (e) {
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

async function handleAiCoach(query, userContext) {
  const startTime = Date.now();
  console.log(`[server /api/coach] Incoming request: "${query.substring(0, 60)}"`);

  const hasGroq = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().startsWith('gsk_'));
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10 && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');

  // Strategy: Try Groq LPU first for lightning-fast sub-second responses and high limits (14,400/day)
  if (hasGroq) {
    try {
      console.log('[server /api/coach] Calling Groq LPU (openai/gpt-oss-120b)...');
      const result = await callGroqCoach(query, userContext, 'openai/gpt-oss-120b');
      console.log(`[server /api/coach] Groq completed successfully in ${Date.now() - startTime}ms`);
      return result;
    } catch (groqErr) {
      console.warn(`[server /api/coach] Groq primary failed (${groqErr.message}). Trying backup qwen3.8-27b...`);
      try {
        const backupResult = await callGroqCoach(query, userContext, 'qwen/qwen3.8-27b');
        console.log(`[server /api/coach] Groq backup completed in ${Date.now() - startTime}ms`);
        return backupResult;
      } catch (backupErr) {
        console.warn(`[server /api/coach] Groq backup failed (${backupErr.message}).`);
        if (!hasGemini) {
          throw new Error(`Groq API error: ${groqErr.message}`);
        }
        console.log('[server /api/coach] Falling back to Google Gemini...');
      }
    }
  }

  // Fallback or Primary when Groq is not configured: Google Gemini
  if (hasGemini) {
    console.log('[server /api/coach] Calling Google Gemini API...');
    const result = await handleGeminiCoach(query, userContext);
    result.provider = 'gemini';
    console.log(`[server /api/coach] Gemini completed in ${Date.now() - startTime}ms`);
    return result;
  }

  throw new Error('Neither GROQ_API_KEY nor GEMINI_API_KEY is configured in .env.local.');
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

        const result = await handleAiCoach(query, userContext);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        const errorMsg = formatGeminiError(err);
        console.error('[API /api/coach] Error:', errorMsg);
        const statusCode = (err && (err.status || err.statusCode)) ? Number(err.status || err.statusCode) : 500;
        const validStatus = statusCode >= 400 && statusCode <= 599 ? statusCode : 500;
        res.writeHead(validStatus, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: errorMsg,
          statusCode: validStatus,
          isConfigError: errorMsg.includes('GEMINI_API_KEY') || errorMsg.includes('GROQ_API_KEY')
        }));
      }
    });
    return;
  }

  // API Status Route: GET /api/status
  if (url.pathname === '/api/status' && req.method === 'GET') {
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== 'your_gemini_api_key_here');
    const hasGroqKey = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().startsWith('gsk_'));
    const activeProvider = hasGroqKey ? 'groq' : (hasGeminiKey ? 'gemini' : 'none');
    const modelDesc = hasGroqKey
      ? 'Groq LPU (openai/gpt-oss-120b) + Gemini Fallback'
      : (hasGeminiKey ? 'gemini-3.8-flash (fallback: gemini-3.5-flash-lite)' : 'None');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      hasKey: hasGroqKey || hasGeminiKey,
      hasGroqKey,
      hasGeminiKey,
      activeProvider,
      model: modelDesc,
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

server.timeout = 120000; // 2 minutes socket timeout
server.keepAliveTimeout = 65000;

server.listen(PORT, '127.0.0.1', () => {
  console.log(`BioSync server listening on http://127.0.0.1:${PORT}`);
});
