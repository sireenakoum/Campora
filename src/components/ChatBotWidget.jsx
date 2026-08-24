import { useEffect, useRef, useState } from 'react'
import { Bot, Send, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const CONTEXT_TTL_MS = 5 * 60 * 1000

const toDateStr = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`

async function buildStudentContext() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, major, year, gpa')
      .eq('id', user.id)
      .maybeSingle()

    const now = new Date()
    const dayEnd = new Date()
    dayEnd.setHours(23, 59, 59, 999)

    const weekEnd = new Date()
    weekEnd.setDate(weekEnd.getDate() + 7)
    weekEnd.setHours(23, 59, 59, 999)

    const [deadlinesResult, classesResult, todosResult, plannerResult] =
      await Promise.all([
        supabase
          .from('deadlines')
          .select('id, title, due_at')
          .eq('profile_id', user.id)
          .gte('due_at', now.toISOString())
          .order('due_at', { ascending: true })
          .limit(8),
        supabase
          .from('classes')
          .select('title, course_name, starts_at')
          .eq('profile_id', user.id)
          .gte('starts_at', now.toISOString())
          .lte('starts_at', dayEnd.toISOString())
          .order('starts_at', { ascending: true })
          .limit(8),
        supabase
          .from('todos')
          .select('id, title, details, priority')
          .eq('profile_id', user.id)
          .eq('completed', false)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('planner_courses')
          .select('id, name, date, start_time, end_time, type')
          .eq('user_id', user.id)
          .gte('date', toDateStr(now))
          .lte('date', toDateStr(weekEnd))
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(30),
      ])

    return {
      now: now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      name: profile?.name || '',
      major: profile?.major || '',
      year: profile?.year || '',
      gpa: typeof profile?.gpa === 'number' ? profile.gpa : undefined,
      deadlines: deadlinesResult.data || [],
      todayClasses: classesResult.data || [],
      todos: todosResult.data || [],
      plannerEntries: plannerResult.data || [],
    }
  } catch (error) {
    console.error('Chat context error:', error)
    return null
  }
}

const PLANNER_TYPES = ['Class', 'Lab', 'Recitation', 'Task', 'Exam', 'Event']
const TODO_PRIORITIES = ['high', 'medium', 'low']

const actionFailure = (error) => ({ ok: false, error })

async function getCurrentUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id || null
}

// Models sometimes pass a title where an id is expected; resolve either.
const resolveByRef = (items, ref, pickTitle = (item) => item.title) => {
  const needle = String(ref ?? '').trim().toLowerCase()
  if (!needle) return null

  return (
    items.find((item) => String(item.id).toLowerCase() === needle) ||
    items.find((item) => pickTitle(item).toLowerCase() === needle) ||
    items.find((item) => pickTitle(item).toLowerCase().includes(needle)) ||
    null
  )
}

const resolveTodo = async (userId, ref) => {
  const { data } = await supabase
    .from('todos')
    .select('id, title')
    .eq('profile_id', userId)
  return resolveByRef(data || [], ref)
}

const resolvePlannerEntry = async (userId, ref) => {
  const { data } = await supabase
    .from('planner_courses')
    .select('id, name')
    .eq('user_id', userId)
  return resolveByRef(data || [], ref, (item) => item.name)
}

// Executes a tool call requested by the assistant. Every query is scoped
// to the signed-in user so Supabase RLS stays the source of truth.
const ACTION_EXECUTORS = {
  add_todo: async (args, userId) => {
    const title = String(args.title || '').trim()
    if (!title) return actionFailure('Missing task title')

    const priority = TODO_PRIORITIES.includes(args.priority)
      ? args.priority
      : 'medium'

    const { error } = await supabase.from('todos').insert({
      profile_id: userId,
      title,
      details: String(args.details || ''),
      priority,
      completed: false,
    })

    return error
      ? actionFailure(error.message)
      : { ok: true, detail: `Added "${title}" to the to-do list` }
  },

  complete_todo: async (args, userId) => {
    const todo = await resolveTodo(userId, args.todo_id)
    if (!todo) return actionFailure('No matching task found')

    const { error } = await supabase
      .from('todos')
      .update({ completed: true })
      .eq('id', todo.id)
      .eq('profile_id', userId)

    return error
      ? actionFailure(error.message)
      : { ok: true, detail: `Completed "${todo.title}"` }
  },

  delete_todo: async (args, userId) => {
    const todo = await resolveTodo(userId, args.todo_id)
    if (!todo) return actionFailure('No matching task found')

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todo.id)
      .eq('profile_id', userId)

    return error
      ? actionFailure(error.message)
      : { ok: true, detail: `Deleted "${todo.title}"` }
  },

  add_deadline: async (args, userId) => {
    const title = String(args.title || '').trim()
    const due = new Date(args.due_at)

    if (!title) return actionFailure('Missing deadline title')
    if (Number.isNaN(due.getTime())) {
      return actionFailure(`Invalid due date: ${args.due_at}`)
    }

    const { error } = await supabase.from('deadlines').insert({
      profile_id: userId,
      title,
      tag: String(args.tag || 'Deadline'),
      tag_style: 'secondary',
      percent_complete: 0,
      due_at: due.toISOString(),
    })

    return error
      ? actionFailure(error.message)
      : { ok: true, detail: `Added deadline "${title}"` }
  },

  add_planner_entry: async (args, userId) => {
    const name = String(args.name || '').trim()
    const date = String(args.date || '').trim()
    const startTime = String(args.start_time || '').trim()
    const endTime = String(args.end_time || '').trim()

    if (!name) return actionFailure('Missing entry name')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return actionFailure(`Invalid date: ${date}`)
    }
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      return actionFailure('Times must be HH:MM')
    }

    const entryType = PLANNER_TYPES.includes(args.entry_type)
      ? args.entry_type
      : 'Task'

    const { error } = await supabase.from('planner_courses').insert({
      user_id: userId,
      name,
      description: String(args.description || ''),
      type: entryType,
      date,
      start_time: startTime,
      end_time: endTime,
      color: '#E1F2FF',
      reminder: false,
      reminder_date: null,
      reminder_time: null,
      group_id: null,
    })

    return error
      ? actionFailure(error.message)
      : { ok: true, detail: `Added "${name}" to the planner on ${date}` }
  },

  delete_planner_entry: async (args, userId) => {
    const entry = await resolvePlannerEntry(userId, args.entry_id)
    if (!entry) return actionFailure('No matching planner entry found')

    const { error } = await supabase
      .from('planner_courses')
      .delete()
      .eq('id', entry.id)
      .eq('user_id', userId)

    return error
      ? actionFailure(error.message)
      : { ok: true, detail: `Removed "${entry.name}" from the planner` }
  },
}

async function executeAction(action) {
  try {
    const executor = ACTION_EXECUTORS[action?.name]
    if (!executor) return actionFailure(`Unknown action: ${action?.name}`)

    const userId = await getCurrentUserId()
    if (!userId) return actionFailure('Not signed in')

    return await executor(action.args || {}, userId)
  } catch (error) {
    console.error('Assistant action error:', error)
    return actionFailure(error?.message || 'Unexpected error')
  }
}

const WIDGET_CSS = `
  @keyframes campora-chat-pop {
    from { opacity: 0; transform: translateY(14px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes campora-chat-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(0, 45, 98, 0.32); }
    70%  { box-shadow: 0 0 0 16px rgba(0, 45, 98, 0); }
    100% { box-shadow: 0 0 0 0 rgba(0, 45, 98, 0); }
  }
  .campora-chat-fab {
    animation: campora-chat-pulse 2.6s ease-out infinite;
  }
  .campora-chat-panel {
    animation: campora-chat-pop 0.22s ease;
  }
`

const NAVY = '#002D62'

const FAB_STYLE = {
  position: 'fixed',
  right: 28,
  bottom: 28,
  width: 62,
  height: 62,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  cursor: 'pointer',
  color: '#fff',
  background: 'linear-gradient(145deg, #304d83 0%, #002D62 52%, #001e45 100%)',
  boxShadow: '0 10px 30px rgba(0, 45, 98, 0.35), 0 2px 8px rgba(0, 45, 98, 0.18)',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
  zIndex: 1100,
}

const PANEL_STYLE = {
  position: 'fixed',
  right: 28,
  bottom: 102,
  width: 380,
  maxWidth: 'calc(100vw - 40px)',
  height: 540,
  maxHeight: 'calc(100vh - 140px)',
  display: 'flex',
  flexDirection: 'column',
  background: '#ffffff',
  borderRadius: 22,
  boxShadow: '0 24px 70px rgba(0, 45, 98, 0.28), 0 4px 16px rgba(0, 45, 98, 0.12)',
  overflow: 'hidden',
  zIndex: 1100,
}

const HEADER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '16px 18px',
  background: 'linear-gradient(145deg, #304d83 0%, #002D62 52%, #001e45 100%)',
  color: '#fff',
}

const AVATAR_STYLE = {
  width: 40,
  height: 40,
  minWidth: 40,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.16)',
  border: '1px solid rgba(255, 255, 255, 0.24)',
}

const BUBBLE_BOT_STYLE = {
  alignSelf: 'flex-start',
  maxWidth: '80%',
  padding: '10px 14px',
  borderRadius: '16px 16px 16px 4px',
  background: '#eef2fa',
  color: '#1A1B1F',
  fontSize: 14,
  lineHeight: 1.45,
  fontWeight: 500,
}

const BUBBLE_USER_STYLE = {
  alignSelf: 'flex-end',
  maxWidth: '80%',
  padding: '10px 14px',
  borderRadius: '16px 16px 4px 16px',
  background: NAVY,
  color: '#fff',
  fontSize: 14,
  lineHeight: 1.45,
  fontWeight: 500,
  whiteSpace: 'pre-wrap',
}

const GREETING =
  'Hi! I\u2019m the Campora assistant. I can answer questions about your deadlines, classes, and to-dos \u2014 and I can also update things for you: just ask me to add a task, set a deadline, or put something on your planner.'

const ERROR_REPLY =
  'Sorry — I couldn\u2019t reach my brain just now. Check your connection and try again in a moment.'

export default function ChatBotWidget() {
  const [open, setOpen] = useState(true)
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, from: 'bot', text: GREETING },
  ])

  const scrollRef = useRef(null)
  const contextRef = useRef({ data: null, fetchedAt: 0 })

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages, open, thinking])

  useEffect(() => {
    if (!open) return

    const fresh =
      contextRef.current.data &&
      Date.now() - contextRef.current.fetchedAt < CONTEXT_TTL_MS

    if (!fresh) {
      buildStudentContext().then((data) => {
        contextRef.current = { data, fetchedAt: Date.now() }
      })
    }
  }, [open])

  const send = async () => {
    const text = draft.trim()
    if (!text || thinking) return

    const userMessage = { id: Date.now(), from: 'user', text }

    setMessages((current) => [...current, userMessage])
    setDraft('')
    setThinking(true)

    const history = messages
      .filter((m) => m.id !== 1)
      .concat(userMessage)
      .map((m) => ({
        role: m.from === 'user' ? 'user' : 'model',
        content: m.text,
      }))

    const callAssistant = async (toolResult) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          context: contextRef.current.data,
          ...(toolResult ? { toolResult } : {}),
        }),
      })

      return {
        ok: response.ok,
        payload: await response.json().catch(() => ({})),
      }
    }

    try {
      let result = await callAssistant(null)

      // The assistant can request tools (add task, add deadline, …).
      // Execute them here against Supabase, then let the assistant
      // confirm with a final reply.
      for (let round = 0; result.ok && result.payload.action && round < 2; round += 1) {
        const action = result.payload.action
        const toolResponse = await executeAction(action)
        result = await callAssistant({ call: action, response: toolResponse })
      }

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          from: 'bot',
          text:
            result.ok && result.payload.reply
              ? result.payload.reply
              : result.payload.error || ERROR_REPLY,
        },
      ])
    } catch {
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, from: 'bot', text: ERROR_REPLY },
      ])
    } finally {
      setThinking(false)

      // Actions may have changed the student's data; refresh context so
      // follow-up questions see the new state.
      buildStudentContext().then((data) => {
        contextRef.current = { data, fetchedAt: Date.now() }
      })
    }
  }

  return (
    <>
      <style>{WIDGET_CSS}</style>

      {open && (
        <div className="campora-chat-panel" style={PANEL_STYLE} role="dialog" aria-label="Chat assistant">
          <div style={HEADER_STYLE}>
            <div style={AVATAR_STYLE}>
              <Bot size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.01em' }}>
                Campora Assistant
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 2,
                  fontSize: 12,
                  fontWeight: 600,
                  opacity: 0.85,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#7ee2a8',
                    display: 'inline-block',
                  }}
                />
                Online
              </div>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              style={{
                width: 34,
                height: 34,
                minWidth: 34,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.14)',
                color: '#fff',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.26)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)' }}
            >
              <X size={18} />
            </button>
          </div>

          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              background: '#fafbff',
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={message.from === 'bot' ? BUBBLE_BOT_STYLE : BUBBLE_USER_STYLE}
              >
                {message.text}
              </div>
            ))}

            {thinking && (
              <div style={{ ...BUBBLE_BOT_STYLE, display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#9aa8c4',
                      display: 'inline-block',
                      animation: `camporaTypingPulse 1.1s ease-in-out ${dot * 0.18}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderTop: '1px solid #e8ecf4',
              background: '#ffffff',
            }}
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send()
              }}
              placeholder="Type a message…"
              aria-label="Chat message"
              style={{
                flex: 1,
                minWidth: 0,
                height: 42,
                padding: '0 14px',
                border: '1px solid #e0e4eb',
                borderRadius: 999,
                background: '#f6f8fc',
                color: '#1A1B1F',
                fontSize: 14,
                fontWeight: 500,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              aria-label="Send message"
              onClick={send}
              disabled={!draft.trim()}
              style={{
                width: 42,
                height: 42,
                minWidth: 42,
                borderRadius: '50%',
                border: 'none',
                cursor: draft.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                background: draft.trim()
                  ? 'linear-gradient(145deg, #304d83 0%, #002D62 100%)'
                  : '#ccd3e0',
                transition: 'background 0.15s ease',
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="campora-chat-fab"
        aria-label={open ? 'Close chat' : 'Open chat'}
        title="Chat with Campora Assistant"
        onClick={() => setOpen((current) => !current)}
        style={{
          ...FAB_STYLE,
          transform: open ? 'scale(1.06)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = open ? 'scale(1.06)' : 'scale(1)'
        }}
      >
        {open ? <X size={26} /> : <Bot size={28} />}
      </button>
    </>
  )
}
