// Campora Assistant — serverless chat endpoint.
// Keeps the Gemini API key server-side; the frontend never sees it.
// Deployed automatically by Vercel as /api/chat.

const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_HISTORY = 12;
const MAX_MESSAGE_CHARS = 2000;

// Tools the assistant can invoke. They are executed client-side by
// ChatBotWidget against Supabase (scoped to the signed-in user via RLS),
// and the result is sent back here so the model can confirm.
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
          "Add a single entry to the student's weekly planner schedule.",
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
          required: ['name', 'date', 'start_time', 'end_time'],
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
    'and general student questions. Be warm, concise (2-5 sentences unless',
    'asked for detail), and practical. Use plain text, no markdown headers.',
    'When the student context below is relevant, use it and be specific.',
    'Never invent assignments, dates, or grades that are not in the context;',
    'if you do not know, say so and suggest where in Campora to look.',
    '',
    'You can manage the student\'s Campora data with your tools:',
    '- add_todo / complete_todo / delete_todo for their to-do list',
    '- add_deadline for assignment or exam deadlines on their dashboard',
    '- add_planner_entry / delete_planner_entry for their weekly schedule',
    'When the student asks you to add, complete, or remove something, use',
    'the matching tool instead of only describing what to do. Resolve',
    'relative dates ("tomorrow", "next Friday") using the current local',
    'date and time in the context. For complete_todo, delete_todo, and',
    'delete_planner_entry, pick ids from the context; if nothing matches,',
    'say so instead of guessing. After a tool runs, confirm briefly in one',
    'short sentence what changed.',
    'You never claim to take actions outside these tools (enrolling,',
    'submitting work); you only advise.',
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

function buildContents(history, toolResult) {
  const contents = [...history];

  if (toolResult && toolResult.call && toolResult.call.name) {
    const callPart = {
      functionCall: {
        name: toolResult.call.name,
        args: toolResult.call.args || {},
      },
    };

    // Gemini 3 requires the original thought signature to be echoed back
    // alongside any replayed function call.
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

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: buildSystemPrompt(body?.context) }],
        },
        contents: buildContents(history, body?.toolResult),
        tools: TOOLS,
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
