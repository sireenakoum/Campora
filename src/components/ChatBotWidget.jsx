import { useEffect, useRef, useState } from 'react'
import { Bot, Send, X } from 'lucide-react'

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
  'Hi! I\u2019m the Campora assistant \u2014 still getting set up, so I can\u2019t answer just yet. Soon I\u2019ll help with your courses, planner, and campus life!'

const PLACEHOLDER_REPLY =
  'Nice message! My AI brain is still being wired up, so this is just a placeholder for now.'

export default function ChatBotWidget() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([
    { id: 1, from: 'bot', text: GREETING },
  ])

  const scrollRef = useRef(null)

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages, open])

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setMessages((current) => [
      ...current,
      { id: Date.now(), from: 'user', text },
    ])
    setDraft('')

    setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, from: 'bot', text: PLACEHOLDER_REPLY },
      ])
    }, 500)
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
                Coming soon
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
