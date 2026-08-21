// Campora Assistant — serverless chat endpoint.
// Keeps the Gemini API key server-side; the frontend never sees it.
// Deployed automatically by Vercel as /api/chat.

const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_HISTORY = 12;
const MAX_MESSAGE_CHARS = 2000;

function buildSystemPrompt(context) {
  const lines = [
    'You are the Campora Assistant, the built-in AI helper of Campora,',
    'an academic portal for American University of Beirut (AUB) students.',
    'Your job: help with study planning, courses, deadlines, campus life,',
    'and general student questions. Be warm, concise (2-5 sentences unless',
    'asked for detail), and practical. Use plain text, no markdown headers.',
    'When the student context below is relevant, use it and be specific.',
    'Never invent assignments, dates, or grades that are not in the context;',
    'if you do not know, say so and suggest where in Campora to look.',
    'You never claim to take actions (enrolling, submitting); you only advise.',
  ];

  if (context && typeof context === 'object') {
    const bits = [];

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
      const rows = context.todos.map((t) => `- ${t.title}`).join('\n');
      bits.push(`Open to-dos:\n${rows}`);
    }

    if (bits.length) {
      lines.push(
        '\nCurrent student context (fetched live from their Campora account):'
      );
      lines.push(bits.join('\n'));
    } else {
      lines.push(
        '\nNo personal context is available right now; answer generally.'
      );
    }
  }

  return lines.join(' ');
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

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: buildSystemPrompt(body?.context) }],
        },
        contents: history,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();

      console.error('Gemini API error:', response.status, detail);

      return res.status(502).json({
        error: 'The assistant is unavailable right now. Try again shortly.',
      });
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
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
