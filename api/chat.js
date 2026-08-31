// Campora Assistant — serverless chat endpoint.
// Keeps the Gemini API key server-side; the frontend never sees it.
// Deployed automatically by Vercel as /api/chat.

const GEMINI_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = ['gemini-2.0-flash'];
const GEMINI_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const MAX_HISTORY = 12;
const MAX_MESSAGE_CHARS = 2000;

// Per-client message limits.
const RATE_LIMITS = {
  hour: { max: 12, windowMs: 60 * 60 * 1000 },
  day: { max: 40, windowMs: 24 * 60 * 60 * 1000 },
};
const rateBuckets = new Map();

function checkRateLimit(clientKey) {
  const now = Date.now();
  const bucket = rateBuckets.get(clientKey) || {};

  if (!bucket.hourStart || now - bucket.hourStart >= RATE_LIMITS.hour.windowMs) {
    bucket.hourStart = now;
    bucket.hourCount = 0;
  }
  if (!bucket.dayStart || now - bucket.dayStart >= RATE_LIMITS.day.windowMs) {
    bucket.dayStart = now;
    bucket.dayCount = 0;
  }

  bucket.hourCount += 1;
  bucket.dayCount += 1;
  rateBuckets.set(clientKey, bucket);

  if (rateBuckets.size > 5000) {
    for (const [key, entry] of rateBuckets) {
      if (
        now - (entry.hourStart || 0) >= RATE_LIMITS.hour.windowMs &&
        now - (entry.dayStart || 0) >= RATE_LIMITS.day.windowMs
      ) {
        rateBuckets.delete(key);
      }
    }
  }

  if (bucket.hourCount > RATE_LIMITS.hour.max) return 'hour';
  if (bucket.dayCount > RATE_LIMITS.day.max) return 'day';
  return null;
}

// Relaxed tool definitions: Optional fields allow the AI to prompt the user
// for missing details instead of failing silently.
const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'add_todo',
        description: "Add a task to the student's personal to-do list.",
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Short task title' },
            details: { type: 'STRING', description: 'Optional notes or details' },
            priority: {
              type: 'STRING',
              enum: ['high', 'medium', 'low'],
              description: 'Task priority, defaults to medium',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'complete_todo',
        description: "Mark one of the student's open to-dos as completed.",
        parameters: {
          type: 'OBJECT',
          properties: {
            todo_id: {
              type: 'STRING',
              description: 'The id of the todo from the student context',
            },
          },
          required: ['todo_id'],
        },
      },
      {
        name: 'delete_todo',
        description: "Remove a task from the student's to-do list.",
        parameters: {
          type: 'OBJECT',
          properties: {
            todo_id: {
              type: 'STRING',
              description: 'The id of the todo from the student context',
            },
          },
          required: ['todo_id'],
        },
      },
      {
        name: 'add_deadline',
        description:
          "Add an assignment, exam, or project deadline to the student's dashboard.",
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Deadline title' },
            due_at: {
              type: 'STRING',
              description:
                'Due date and time in ISO 8601 format, e.g. 2026-09-01T23:59',
            },
            tag: {
              type: 'STRING',
              description:
                'Short label such as Exam, Assignment, Quiz, or Project',
            },
          },
          required: ['title', 'due_at'],
        },
      },
      {
        name: 'add_planner_entry',
        description:
          "Add an entry to the student's weekly planner schedule.",
        parameters: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING', description: 'Entry name' },
            date: { type: 'STRING', description: 'Date as YYYY-MM-DD' },
            start_time: { type: 'STRING', description: 'Start time HH:MM (24h)' },
            end_time: { type: 'STRING', description: 'End time HH:MM (24h)' },
            entry_type: {
              type: 'STRING',
              enum: ['Class', 'Lab', 'Recitation', 'Task', 'Exam', 'Event'],
              description: 'Kind of entry, defaults to Task',
            },
            description: { type: 'STRING', description: 'Optional notes' },
          },
          // Kept only 'name' as strictly required so the tool can be invoked with partial inputs or prompted
          required: ['name'],
        },
      },
      {
        name: 'delete_planner_entry',
        description: "Remove an entry from the student's planner schedule.",
        parameters: {
          type: 'OBJECT',
          properties: {
            entry_id: {
              type: 'STRING',
              description: 'The id of the planner entry from the student context',
            },
          },
          required: ['entry_id'],
        },
      },
    ],
  },
];

function buildSystemPrompt(context) {
  const lines = [
    'You are the Campora Assistant, the built-in AI helper of Campora,',
    'an academic portal for American University of Beirut (AUB) students.',
    'Your job: help with study planning, courses, deadlines, campus life,',
    'and general student questions. Be warm, flexible, and practical.',
    '',
    'INTENT HANDLING & MISSING INFORMATION:',
    '- Interpret user requests naturally. Phrases like "remind me to study", "put in my planner", or "schedule a class" indicate tool usage.',
    '- DO NOT invent or guess missing critical details like dates, start times, or end times.',
    '- IF THE USER IS MISSING DETAILS needed to execute a tool (e.g., asking to add a planner entry without specifying the date or start/end time), ASK them clearly and politely for the missing information BEFORE running the tool.',
    '- NEVER pick arbitrary or random dates/times for planner entries.',
    '- Always calculate relative dates ("tomorrow", "next Monday") relative to the current local date provided in context.',
    '',
    'TOOL EXECUTION RULES:',
    '- For complete_todo, delete_todo, and delete_planner_entry, use the matching ID from the user context. If no matching item exists, inform the user instead of guessing an ID.',
    '- After a tool runs successfully, confirm briefly in one friendly sentence what was updated.',
    '- You cannot perform real-world actions like official course registration or assignment submission; only manage Campora planner, to-dos, and deadlines.',
  ];

  if (context && typeof context === 'object') {
    const bits = [];

    if (context.now) {
      bits.push(`Current local date and time: ${context.now}`);
    }
    if (context.name) {
      bits.push(`Name: ${context.name}`);
    }
    if (context.major) {
      bits.push(`Major: ${context.major}`);
    }
    if (context.year) {
      bits.push(`Year: ${context.year}`);
    }
    if (typeof context.gpa === 'number') {
      bits.push(`GPA: ${context.gpa}`);
    }

    if (Array.isArray(context.deadlines) && context.deadlines.length) {
      const rows = context.deadlines
        .map((d) => `- ${d.title} (due ${d.due_at})`)
        .join('\n');
      bits.push(`Upcoming deadlines:\n${rows}`);
    }

    if (Array.isArray(context.todayClasses) && context.todayClasses.length) {
      const rows = context.todayClasses
        .map((c) => `- ${c.title || c.course_name || 'Class'} at ${c.starts_at}`)
        .join('\n');
      bits.push(`Today's classes:\n${rows}`);
    }

    if (Array.isArray(context.todos) && context.todos.length) {
      const rows = context.todos.map((t) => `- [ID: ${t.id}] ${t.title}`).join('\n');
      bits.push(`Open to-dos:\n${rows}`);
    }

    if (bits.length) {
      lines.push('\nCurrent student context (fetched live from Campora):');
      lines.push(bits.join('\n'));
    } else {
      lines.push('\nNo personal context is available right now; answer generally.');
    }
  }

  return lines.join('\n');
}

function sanitizeHistory(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'model') &&
        typeof m.content === 'string' &&
        m.content.trim()
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role,
      parts: [{ text: m.content.slice(0, MAX_MESSAGE_CHARS) }],
    }));
}

function buildContents(history, toolResult) {
  const contents = [...history];

  if (toolResult && toolResult.call && toolResult.call.name) {
    const callPart = {
      functionCall: {
        name: toolResult.call.name,
        args: toolResult.call.args || {},
      },
    };

    if (toolResult.call.thoughtSignature) {
      callPart.thoughtSignature = toolResult.call.thoughtSignature;
    }

    contents.push({ role: 'model', parts: [callPart] });
    contents.push({
      role: 'user',
      parts: [
        {
          functionResponse: {
            name: toolResult.call.name,
            response: toolResult.response || { ok: true },
          },
        },
      ],
    });
  }

  return contents;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'AI is not configured yet. Add GEMINI_API_KEY to the environment.',
    });
  }

  let body;
  try {
    body = req.body ?? JSON.parse(req.rawBody || '{}');
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const history = sanitizeHistory(body?.messages);

  if (!history.length) {
    return res.status(400).json({ error: 'No message provided' });
  }

  if (!body?.toolResult) {
    const clientKey =
      String(body?.userId || '').trim() ||
      String(req.headers['x-forwarded-for'] || '')
        .split(',')[0]
        .trim() ||
      'anonymous';
    const limitHit = checkRateLimit(clientKey);

    if (limitHit === 'hour') {
      return res.status(429).json({
        error:
          'You are sending messages too quickly. Take a short break and try again.',
      });
    }
    if (limitHit === 'day') {
      return res.status(429).json({
        error: 'You reached your daily chat limit. Please come back tomorrow.',
      });
    }
  }

  try {
    const requestBody = JSON.stringify({
      system_instruction: {
        parts: [{ text: buildSystemPrompt(body?.context) }],
      },
      contents: buildContents(history, body?.toolResult),
      tools: TOOLS,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 512,
      },
    });

    let response = null;

    for (const model of [GEMINI_MODEL, ...FALLBACK_MODELS]) {
      response = await fetch(`${GEMINI_URL(model)}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });

      if (response.status !== 429) break;

      const detail = await response.text();
      console.error(`Gemini quota exhausted for ${model}:`, detail);

      if (model === FALLBACK_MODELS[FALLBACK_MODELS.length - 1]) {
        return res.status(502).json({
          error:
            'The assistant hit its daily usage limit. Please try again tomorrow.',
        });
      }
    }

    if (!response.ok) {
      const detail = await response.text();
      console.error('Gemini API error:', response.status, detail);

      return res.status(502).json({
        error: 'The assistant is unavailable right now. Try again shortly.',
      });
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];

    const callPart = parts.find((part) => part.functionCall);

    if (callPart && callPart.functionCall?.name) {
      const action = {
        name: callPart.functionCall.name,
        args: callPart.functionCall.args || {},
      };

      if (callPart.thoughtSignature) {
        action.thoughtSignature = callPart.thoughtSignature;
      }

      return res.status(200).json({ action });
    }

    const reply =
      parts
        .map((part) => part.text)
        .filter(Boolean)
        .join('') || '';

    if (!reply) {
      return res.status(502).json({
        error: 'The assistant returned an empty reply. Try rephrasing.',
      });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat handler error:', error);

    return res.status(500).json({
      error: 'Something went wrong talking to the assistant.',
    });
  }
}