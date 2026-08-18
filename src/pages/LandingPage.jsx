import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Clock3,
  GraduationCap,
  Heart,
  Infinity as InfinityIcon,
  Landmark,
  LayoutDashboard,
  MapPin,
  Megaphone,
  MessageSquare,
  Network,
  Play,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';

import camporaLogo from '../assets/camporanavylogo.png';

import dashboardImg from '../assets/dashboard.png';
import coursesImg from '../assets/courses.png';
import studygroupsImg from '../assets/studygroups.png';
import campuspulseImg from '../assets/campuspulse.png';
import plannerImg from '../assets/planner.png';
import toDoImg from '../assets/to_do.png';
import announcementsImg from '../assets/announcements.png';
import notificationsImg from '../assets/notifications.png';

const NAVY = '#0B1A3F';
const BLUE = '#648CCB';
const TEXT = '#172033';
const MUTED = '#6F7B90';
const BORDER = '#E5EAF2';
const SOFT = '#FBFCFE';

const DEMO_TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    img: dashboardImg,
    accent: '#5E7FB4',
    soft: '#EEF3F9',
    headline: 'Everything that matters, in one glance.',
    points: [
      'Today’s schedule plus everything coming up',
      'To-do progress and an academic snapshot',
      'Quick access to every workspace',
      'A pinned campus update right on top',
    ],
  },
  {
    id: 'courses',
    label: 'Courses',
    icon: BookOpen,
    img: coursesImg,
    accent: '#7F7897',
    soft: '#F4F2F8',
    headline: 'Courses that organize themselves.',
    points: [
      'Folders and notes for every course',
      'Snapshot stats for credits and workload',
      'External links and reminders when you need them',
    ],
  },
  {
    id: 'study-groups',
    label: 'Study Groups',
    icon: Users,
    img: studygroupsImg,
    accent: '#C76E8A',
    soft: '#FFF3F7',
    headline: 'Find your people. Then stay close.',
    points: [
      'Create or join groups filtered by major',
      'Group chat with pin-and-reply',
      'Direct messages with a live typing indicator',
      'Roles, bookmarks, and join requests',
    ],
  },
  {
    id: 'campus-pulse',
    label: 'Campus Pulse',
    icon: Zap,
    img: campuspulseImg,
    accent: '#D9896A',
    soft: '#FFF4EE',
    headline: 'The feed of what’s happening on campus.',
    points: [
      'Posts, questions, and opportunities',
      'Likes, comments, and nested replies',
      'Six colour-coded categories at a glance',
      'Search across everything',
    ],
  },
  {
    id: 'planner',
    label: 'Planner',
    icon: CalendarDays,
    img: plannerImg,
    accent: '#6F948B',
    soft: '#F1F7F5',
    headline: 'A semester you can finally see.',
    points: [
      'Month view with next / prev navigation',
      'Colour-coded events with auto contrast',
      'Reminders and a progress ring',
    ],
  },
  {
    id: 'todo',
    label: 'To-Do',
    icon: CheckSquare,
    img: toDoImg,
    accent: '#5E9A8B',
    soft: '#EEF7F3',
    headline: 'Priorities where you can actually see them.',
    points: [
      'High / medium / low priorities',
      'Due dates and gentle reminders',
      'Flag the goals that stand out',
    ],
  },
  {
    id: 'campus-hub',
    label: 'Campus Hub',
    icon: Network,
    img: announcementsImg,
    accent: '#B09262',
    soft: '#FAF7F0',
    headline: 'Official campus info, minus the hunt.',
    points: [
      'Announcements, news, events and resources',
      'Pinned items always rise to the top',
      'Search and category filters',
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    img: notificationsImg,
    accent: '#A97884',
    soft: '#FAF3F5',
    headline: 'Updates that come to you.',
    points: [
      'Categorized, live notification feed',
      'Read states and clean-up that just works',
      'Arrives in real time, not three tabs later',
    ],
  },
];

const PILLARS = [
  {
    icon: CalendarDays,
    title: 'Planner',
    text: 'A month at a glance with colour-coded events, reminders, and a progress ring.',
    accent: '#4F7FC7',
    soft: '#EAF2FD',
  },
  {
    icon: CheckSquare,
    title: 'To-Do',
    text: 'Prioritized tasks with due dates, flags, and reminders that stay out of your way.',
    accent: '#3F8B73',
    soft: '#EAF6F1',
  },
  {
    icon: BookOpen,
    title: 'Courses',
    text: 'Organize notes, folders, stats, and links for every course you take.',
    accent: '#7F7897',
    soft: '#F4F2F8',
  },
  {
    icon: UserCheck,
    title: 'Registration',
    text: 'Request swaps, read honest reviews, and ask questions on a board made for it.',
    accent: '#C6824E',
    soft: '#FFF4E8',
  },
  {
    icon: Users,
    title: 'Study Groups',
    text: 'Create or join groups by major, chat, pin replies, and DM the people in them.',
    accent: '#C76E8A',
    soft: '#FFF3F7',
  },
  {
    icon: MessageSquare,
    title: 'Messages',
    text: 'Folders, search, and smart timestamps — with updates that arrive live.',
    accent: '#5E7FB4',
    soft: '#EEF3F9',
  },
  {
    icon: Zap,
    title: 'Campus Pulse',
    text: 'Posts, questions, and opportunities from students, all in one feed.',
    accent: '#D9896A',
    soft: '#FFF4EE',
  },
  {
    icon: Network,
    title: 'Campus Hub',
    text: 'Official announcements, news, events, and resources — pinned and searchable.',
    accent: '#B09262',
    soft: '#FAF7F0',
  },
];

const EXTRAS = [
  {
    icon: MapPin,
    label: 'Campus Map',
    text: 'Find buildings and classrooms of your campus',
    accent: '#5E7FB4',
  },
  {
    icon: Upload,
    label: 'Schedule Import',
    text: 'Upload your PDF schedule and get it back organized',
    accent: '#487A91',
  },
  {
    icon: Bell,
    label: 'Live Notifications',
    text: 'Realtime updates the moment they happen',
    accent: '#A97884',
  },
  {
    icon: Landmark,
    label: 'Campus Finder',
    text: 'Locate the landmarks you use every day',
    accent: '#7F7897',
  },
  {
    icon: Sparkles,
    label: 'Assistant',
    text: 'A little help, coming soon',
    accent: '#B09262',
    soon: true,
  },
];

const STEPS = [
  {
    icon: UserCheck,
    step: '01',
    title: 'Create your account',
    text: 'Sign up in seconds with your student email. No setup maze.',
  },
  {
    icon: CalendarDays,
    step: '02',
    title: 'Set up your world',
    text: 'Add your courses, upload your PDF schedule, and drop events on the planner.',
  },
  {
    icon: Users,
    step: '03',
    title: 'Get plugged in',
    text: 'Join a study group, follow Campus Pulse, and start a conversation.',
  },
  {
    icon: Zap,
    step: '04',
    title: 'Just live it',
    text: 'Real-time updates, reminders, and notifications keep everything moving.',
  },
];

const FAQS = [
  {
    q: 'Is Campora free for students?',
    a: 'Yes. Campora is free for students. Your account, workspace, study groups, private messages, planner, and schedule import are all included.',
  },
  {
    q: 'Do I have to type in my schedule by hand?',
    a: 'No. You can upload your PDF schedule from your profile and Campora will turn it into organized planner events you can review and refine.',
  },
  {
    q: 'Are my messages and study groups private?',
    a: 'Yes. Direct messages and group chats are only visible to the students in them. Join requests are reviewed before anyone gets in.',
  },
  {
    q: 'When do announcements and news update?',
    a: 'In real time. Campus Hub items, notifications, and messages arrive live — and pinned items surface straight on your dashboard.',
  },
  {
    q: 'Do I need a technical background to use it?',
    a: 'Not at all. Campora is built around how everyday students work, so everything is about clicking less and finding things faster.',
  },
  {
    q: 'Is there a digital assistant?',
    a: 'A Campora Assistant widget has made its first appearance and is coming soon. Everything else is available today.',
  },
];

const VOICES = [
  {
    quote:
      'I stopped checking five different apps. My whole day is on one dashboard now.',
    name: 'Computer Science student',
    role: 'Using Courses, Planner & To-Do',
    color: '#7F7897',
  },
  {
    quote:
      'Course swaps and honest reviews actually helped me fix my schedule.',
    name: 'Business student',
    role: 'Using Registration & Campus Hub',
    color: '#B09262',
  },
  {
    quote:
      'Study groups went from scattered group chats to one calm, organized place.',
    name: 'MechE student',
    role: 'Using Study Groups & Messages',
    color: '#C76E8A',
  },
];

const SCENARIOS = [
  {
    name: 'Yasmin',
    role: 'Computer Science',
    initial: 'Y',
    color: '#8B78B8',
    messages: [
      { who: 'them', text: 'Hey! I saw you joined the Algorithms study group 🎉' },
      { who: 'them', text: 'We meet Thursdays at 5. Want in?' },
      { who: 'me', text: 'Yes please — DM me the room!' },
      { who: 'them', text: 'Done. I pinned it in the group chat.' },
    ],
  },
  {
    name: 'Omar',
    role: 'Business Finance',
    initial: 'O',
    color: '#C76E8A',
    messages: [
      {
        who: 'them',
        text: 'Did you see the course swap? I can trade my ECON 201 section.',
      },
      {
        who: 'me',
        text: 'Actually perfect — I’ve been trying to get it all week.',
      },
      { who: 'them', text: 'Review it and I’ll request the swap 👀' },
    ],
  },
  {
    name: 'Layal',
    role: 'Mech Engineering',
    initial: 'L',
    color: '#648CCB',
    messages: [
      {
        who: 'them',
        text: 'Campus Pulse is blowing up about the hackathon this Saturday.',
      },
      { who: 'me', text: 'Team of three? I’m in.' },
      {
        who: 'them',
        text: 'Locked in 🤝 Check the events tab for the venue.',
      },
    ],
  },
];

const TRANSACTIONS = [
  {
    icon: ShieldCheck,
    title: 'Private by design',
    text: 'DMs and study groups are only visible to the students in them.',
    accent: '#5E7FB4',
    soft: '#EEF3F9',
  },
  {
    icon: Zap,
    title: 'Real time everywhere',
    text: 'Messages, notifications, and campus updates arrive the moment they happen.',
    accent: '#6F948B',
    soft: '#F1F7F5',
  },
  {
    icon: LayoutDashboard,
    title: 'One dashboard to rule them',
    text: 'Every workspace is a click away from the same navy corner.',
    accent: '#B09262',
    soft: '#FAF7F0',
  },
];

function MiniChatDemo() {
  const [current, setCurrent] = useState(0);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [paused, setPaused] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (paused) return;

    let cancelled = false;
    const timers = [];

    setMessages([]);
    setTyping(false);

    const msgs = SCENARIOS[current].messages;
    let i = 0;

    const playNext = () => {
      if (cancelled) return;

      if (i >= msgs.length) {
        timers.push(
          setTimeout(
            () => setCurrent((idx) => (idx + 1) % SCENARIOS.length),
            2600
          )
        );
        return;
      }

      const msg = msgs[i];
      i += 1;

      setTyping(true);

      timers.push(
        setTimeout(() => {
          if (cancelled) return;

          setMessages((prev) => [...prev, msg]);
          setTyping(false);

          timers.push(setTimeout(playNext, msg.who === 'me' ? 900 : 1500));
        }, 1000)
      );
    };

    playNext();

    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [current, paused]);

  useEffect(() => {
    const node = listRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, typing, current]);

  const sendChip = (label) => {
    setPaused(true);
    setMessages((prev) => [...prev, { who: 'me', text: label }]);
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          who: 'them',
          text: 'Love it! I marked that down — check our Study Group chat 🙌',
        },
      ]);
    }, 1400);
  };

  const replay = () => {
    setPaused(false);
    setCurrent((idx) => (idx + 1) % SCENARIOS.length);
  };

  const partner = SCENARIOS[current];
  const avatars = ['Y', 'O', 'L', 'S', 'N', 'R'];

  return (
    <div className="lp-chat">
      <div className="lp-chat-topbar">
        <div className="lp-chat-topic">
          <div
            className="lp-chat-avatar"
            style={{ background: partner.color }}
          >
            {partner.initial}
          </div>

          <div>
            <div className="lp-chat-name">
              {partner.name}
              <span className="lp-chat-online" />
            </div>
            <div className="lp-chat-status">
              {typing ? 'typing…' : `in ${partner.role} study group`}
            </div>
          </div>
        </div>

        <div className="lp-chat-avatars">
          {avatars.map((letter, idx) => (
            <div
              key={letter}
              className="lp-chat-mini"
              style={{
                background: idx % 2 === 0 ? '#E9EBF5' : '#EAF2FD',
                color: idx % 2 === 0 ? '#7F7897' : '#648CCB',
                marginLeft: idx === 0 ? 0 : -7,
              }}
            >
              {letter}
            </div>
          ))}
        </div>
      </div>

      <div className="lp-chat-scroll" ref={listRef}>
        <div className="lp-chat-day">
          Today — Study Groups · {partner.role}
        </div>

        {messages.map((msg, idx) => (
          <div
            key={`${current}-${idx}-${msg.text.slice(0, 12)}`}
            className={
              msg.who === 'me'
                ? 'lp-chat-row me'
                : 'lp-chat-row'
            }
          >
            {msg.who !== 'me' && (
              <div
                className="lp-chat-bubble-avatar"
                style={{ background: partner.color }}
              >
                {partner.initial}
              </div>
            )}

            <div
              className={
                msg.who === 'me'
                  ? 'lp-chat-bubble is-me'
                  : 'lp-chat-bubble'
              }
            >
              {msg.text}
            </div>
          </div>
        ))}

        {typing && (
          <div className="lp-chat-row">
            <div
              className="lp-chat-bubble-avatar"
              style={{ background: partner.color }}
            >
              {partner.initial}
            </div>

            <div className="lp-chat-typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <div className="lp-chat-composer">
        <div className="lp-chat-suggest">
          {!paused && (
            <em>
              Try it — tap a reply
            </em>
          )}

          {[
            'Count me in',
            'Same time Sat?',
            'Sounds good — dm me!',
          ].map((label) => (
            <button
              key={label}
              type="button"
              className="lp-chat-chip"
              onClick={() => sendChip(label)}
            >
              {label}
            </button>
          ))}

          <button
            type="button"
            className="lp-chat-replay"
            onClick={replay}
          >
            <Play size={11} />
            Replay
          </button>
        </div>

        <div className="lp-chat-input">
          <span>Start a message…</span>
          <span className="lp-chat-send">
            Send
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [demoTab, setDemoTab] = useState('dashboard');
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const glowRef = useRef(null);

  const activeDemo =
    DEMO_TABS.find((tab) => tab.id === demoTab) ||
    DEMO_TABS[0];

  const ActiveDemoIcon = activeDemo.icon;

  useEffect(() => {
    const els = document.querySelectorAll(
      '.lp-reveal[data-reveal]'
    );

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('lp-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -30px 0px' }
    );

    els.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const counters = document.querySelectorAll(
      '[data-lp-count]'
    );

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;
          const target = Number(el.dataset.lpCount) || 0;
          const start = performance.now();
          const duration = 1400;

          const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased);

            if (t < 1) {
              requestAnimationFrame(tick);
            } else {
              el.textContent = target;
            }
          };

          requestAnimationFrame(tick);
          io.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  const handleGlowMove = (event) => {
    const node = glowRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    node.style.setProperty(
      '--gx',
      `${event.clientX - rect.left}px`
    );
    node.style.setProperty(
      '--gy',
      `${event.clientY - rect.top}px`
    );
  };

  const changeDemo = (id) => {
    setDemoTab(id);
    setDemoLoaded(false);
  };

  return (
    <div className="lp-page">
      <style>{`
        :root {
          --lp-navy: ${NAVY};
          --lp-blue: ${BLUE};
          --lp-text: ${TEXT};
          --lp-muted: ${MUTED};
          --lp-border: ${BORDER};
        }

        html {
          scroll-behavior: smooth;
        }

        .lp-page {
          min-height: 100vh;
          background: ${SOFT};
          color: ${TEXT};
          font-family: inherit;
          overflow-x: hidden;
        }

        .lp-page * {
          box-sizing: border-box;
        }

        /* ---------- NAV ---------- */

        .lp-nav {
          width: min(1280px, calc(100% - 56px));
          margin: 0 auto;
          height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .lp-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: ${NAVY};
          font-size: 22px;
          font-weight: 950;
          text-decoration: none;
          letter-spacing: -.02em;
          flex-shrink: 0;
        }

        .lp-brand img {
          width: 44px;
          height: 44px;
          object-fit: contain;
        }

        .lp-nav-links {
          display: flex;
          align-items: center;
          gap: 26px;
        }

        .lp-nav-link {
          color: #4D596C;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          transition: color .16s ease;
        }

        .lp-nav-link:hover {
          color: ${NAVY};
        }

        .lp-nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .lp-login {
          color: ${NAVY};
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
        }

        .lp-signup {
          min-height: 40px;
          padding: 0 16px;
          border-radius: 11px;
          background: ${NAVY};
          color: #FFFFFF;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
          box-shadow: 0 8px 18px rgba(11,26,63,.10);
          transition: transform .16s ease, box-shadow .16s ease;
        }

        .lp-signup:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(11,26,63,.16);
        }

        /* ---------- HERO ---------- */

        .lp-hero {
          position: relative;
          width: min(1280px, calc(100% - 56px));
          margin: 0 auto;
          min-height: calc(100vh - 82px);
          display: grid;
          grid-template-columns: minmax(0, .98fr) minmax(440px, .92fr);
          align-items: center;
          gap: 66px;
          padding: 48px 0 84px;
          box-sizing: border-box;
        }

        .lp-hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .lp-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          opacity: .55;
          animation: lpFloat 11s ease-in-out infinite;
        }

        .lp-orb.one {
          width: 420px;
          height: 420px;
          left: -140px;
          top: 60px;
          background: radial-gradient(circle, rgba(100,140,203,.30), transparent 70%);
        }

        .lp-orb.two {
          width: 360px;
          height: 360px;
          right: -120px;
          top: -60px;
          background: radial-gradient(circle, rgba(199,110,138,.16), transparent 70%);
          animation-delay: -4s;
        }

        .lp-orb.three {
          width: 300px;
          height: 300px;
          right: 180px;
          bottom: -120px;
          background: radial-gradient(circle, rgba(111,148,139,.20), transparent 70%);
          animation-delay: -7s;
        }

        @keyframes lpFloat {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-22px) translateX(12px); }
        }

        .lp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 30px;
          padding: 0 11px;
          border-radius: 999px;
          background: #EEF3FA;
          color: ${BLUE};
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .06em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .lp-hero h1 {
          margin: 0;
          max-width: 680px;
          color: ${NAVY};
          font-size: clamp(48px, 6vw, 76px);
          line-height: .98;
          letter-spacing: -.055em;
          font-weight: 950;
        }

        .lp-hero h1 span {
          color: ${BLUE};
        }

        .lp-hero-copy {
          max-width: 610px;
          margin: 24px 0 0;
          color: ${MUTED};
          font-size: 17px;
          line-height: 1.68;
          font-weight: 600;
        }

        .lp-hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 30px;
          flex-wrap: wrap;
        }

        .lp-primary {
          min-height: 48px;
          padding: 0 19px;
          border-radius: 12px;
          background: ${NAVY};
          color: #FFFFFF;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 10px 22px rgba(11,26,63,.12);
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: transform .16s ease, box-shadow .16s ease;
        }

        .lp-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(11,26,63,.18);
        }

        .lp-secondary {
          min-height: 48px;
          padding: 0 18px;
          border-radius: 12px;
          border: 1px solid ${BORDER};
          background: #FFFFFF;
          color: ${NAVY};
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          font-family: inherit;
          transition: transform .16s ease, border-color .16s ease;
        }

        .lp-secondary:hover {
          transform: translateY(-2px);
          border-color: #CBD6E4;
        }

        .lp-hero-trust {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 26px;
        }

        .lp-avatar-stack {
          display: flex;
        }

        .lp-avatar-stack div {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 2.5px solid ${SOFT};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
        }

        .lp-trust-text {
          color: #64708A;
          font-size: 12px;
          font-weight: 750;
        }

        .lp-trust-text strong {
          color: ${NAVY};
        }

        /* Hero visual */

        .lp-hero-visual {
          position: relative;
          min-height: 560px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lp-hero-glow {
          position: absolute;
          inset: 0;
          border-radius: 40px;
          pointer-events: none;
        }

        .lp-hero-glow::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(
            340px circle at var(--gx, 50%) var(--gy, 0%),
            rgba(100,140,203,.16),
            transparent 65%
          );
          opacity: 0;
          transition: opacity .3s ease;
        }

        .lp-hero-visual:hover .lp-hero-glow::before {
          opacity: 1;
        }

        .lp-window {
          width: 100%;
          max-width: 680px;
          height: 500px;
          border: 1px solid #E5EAF2;
          border-radius: 24px;
          background: #FFFFFF;
          box-shadow: 0 30px 80px rgba(11,26,63,.14);
          overflow: hidden;
          position: relative;
          z-index: 2;
          transform: rotate(-1.2deg);
          transition: transform .4s ease;
        }

        .lp-hero-visual:hover .lp-window {
          transform: rotate(0deg);
        }

        .hw-top {
          height: 46px;
          border-bottom: 1px solid #EDF1F5;
          background: #FBFCFE;
          display: flex;
          align-items: center;
          padding: 0 14px;
          gap: 8px;
        }

        .hw-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .hw-addr {
          flex: 1;
          max-width: 300px;
          margin: 0 auto;
          height: 24px;
          border-radius: 999px;
          background: #FFFFFF;
          border: 1px solid #EBEFF4;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #9AA5B7;
          font-size: 9.5px;
          font-weight: 800;
        }

        .hw-addr .lock {
          color: #8F8FB3;
        }

        .hw-body {
          display: grid;
          grid-template-columns: 46px 200px minmax(0,1fr);
          height: calc(100% - 46px);
          background: #FCFDFE;
        }

        .hw-rail {
          background: #F7F9FC;
          border-right: 1px solid #EEF2F6;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding-top: 14px;
        }

        .hw-rail img {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }

        .hw-rail-icon {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #B4BCC9;
        }

        .hw-rail-icon-active {
          background: ${NAVY};
          color: #FFFFFF;
          box-shadow: 0 4px 10px rgba(11,26,63,.16);
        }

        .hw-side {
          border-right: 1px solid #EEF2F6;
          background: #FFFFFF;
          padding: 14px 12px;
          overflow: hidden;
        }

        .hw-side-title {
          font-size: 10px;
          font-weight: 950;
          color: ${NAVY};
          margin-bottom: 4px;
        }

        .hw-side-sub {
          font-size: 9px;
          font-weight: 700;
          color: #9AA5B7;
          margin-bottom: 12px;
        }

        .hw-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 9px;
          border-radius: 10px;
          color: #4D596C;
          font-size: 10px;
          font-weight: 850;
          margin-bottom: 5px;
        }

        .hw-row-active {
          background: #F0F5FB;
          color: ${NAVY};
        }

        .hw-row-icon {
          width: 24px;
          height: 24px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .hw-main {
          padding: 14px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .hw-welcome {
          border-radius: 16px;
          background: linear-gradient(135deg,#0B1A3F 0%,#17366A 100%);
          color: #FFFFFF;
          padding: 18px 18px 16px;
          box-shadow: 0 10px 24px rgba(11,26,63,.14);
        }

        .hw-welcome-eyebrow {
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .14em;
          color: #B9CCEA;
          text-transform: uppercase;
        }

        .hw-welcome h3 {
          margin: 7px 0 5px;
          font-size: 17px;
          font-weight: 950;
          letter-spacing: -.02em;
        }

        .hw-welcome p {
          margin: 0;
          font-size: 10px;
          font-weight: 650;
          color: rgba(255,255,255,.72);
        }

        .hw-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 8px;
        }

        .hw-stat {
          border-radius: 13px;
          padding: 11px 12px;
          border: 1px solid #E9EDF3;
          background: #FFFFFF;
        }

        .hw-stat-num {
          font-size: 19px;
          font-weight: 950;
          color: ${NAVY};
          line-height: 1;
        }

        .hw-stat-label {
          margin-top: 6px;
          font-size: 9px;
          font-weight: 800;
          color: #8793A6;
        }

        .hw-grid {
          display: grid;
          grid-template-columns: minmax(0,1.1fr) minmax(0,.9fr);
          gap: 8px;
        }

        .hw-card {
          border: 1px solid #E9EDF3;
          background: #FFFFFF;
          border-radius: 14px;
          padding: 12px;
        }

        .hw-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 9px;
        }

        .hw-card-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          font-weight: 950;
          color: ${NAVY};
        }

        .hw-card-icon {
          width: 22px;
          height: 22px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hw-chip {
          width: 30px;
          height: 16px;
          border-radius: 6px;
          border: 1px solid #E3E7ED;
          background: #FAFBFD;
        }

        .hw-empty {
          height: 52px;
          border: 1px dashed #DCE3EC;
          border-radius: 10px;
          background: #FBFCFE;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #9AA5B7;
          font-size: 9px;
          font-weight: 800;
        }

        .hw-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hw-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 9px;
          border-radius: 10px;
          border: 1px solid #EDF0F5;
          background: #FFFFFF;
        }

        .hw-item-dot {
          width: 9px;
          height: 9px;
          border-radius: 3.5px;
          flex-shrink: 0;
        }

        .hw-item-name {
          flex: 1;
          font-size: 9.5px;
          font-weight: 850;
          color: ${NAVY};
        }

        .hw-item-time {
          font-size: 8.5px;
          font-weight: 800;
          color: #8B97AD;
        }

        .hw-progress {
          margin-top: 8px;
          margin-bottom: 9px;
        }

        .hw-progress-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .hw-progress-num {
          font-size: 15px;
          font-weight: 950;
          color: ${NAVY};
        }

        .hw-progress-pill {
          font-size: 8px;
          font-weight: 950;
          padding: 3px 7px;
          border-radius: 999px;
        }

        .hw-progress-track {
          height: 6px;
          border-radius: 999px;
          background: #EDEFEF;
          overflow: hidden;
        }

        .hw-progress-fill {
          height: 100%;
          width: 62%;
          border-radius: 999px;
          background: #6F948B;
        }

        .hw-float {
          position: absolute;
          border-radius: 14px;
          background: rgba(255,255,255,.96);
          border: 1px solid #E4E9F1;
          box-shadow: 0 16px 38px rgba(11,26,63,.14);
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 5;
          animation: lpFloat 6s ease-in-out infinite;
          backdrop-filter: blur(8px);
        }

        .hw-float.one {
          top: 34px;
          left: -34px;
        }

        .hw-float.two {
          bottom: 46px;
          right: -30px;
          animation-delay: -2.6s;
        }

        .hw-float-icon {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .hw-float-title {
          font-size: 11px;
          font-weight: 950;
          color: ${NAVY};
        }

        .hw-float-sub {
          font-size: 9px;
          font-weight: 750;
          color: #96A1B3;
          margin-top: 2px;
        }

        .lp-pulse-ring {
          position: absolute;
          right: -16px;
          top: -18px;
          width: 90px;
          height: 90px;
          z-index: 6;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lp-pulse-ring::before,
        .lp-pulse-ring::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(100,140,203,.45);
          animation: lpPulse 2.8s ease-out infinite;
        }

        .lp-pulse-ring::after {
          animation-delay: 1.4s;
        }

        .lp-pulse-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${BLUE};
          box-shadow: 0 0 0 6px rgba(100,140,203,.16);
        }

        @keyframes lpPulse {
          0% { transform: scale(.55); opacity: 1; }
          100% { transform: scale(1.35); opacity: 0; }
        }

        /* ---------- TICKER ---------- */

        .lp-ticker {
          border-top: 1px solid ${BORDER};
          border-bottom: 1px solid ${BORDER};
          background: #FFFFFF;
          padding: 16px 0;
          overflow: hidden;
          position: relative;
        }

        .lp-ticker::before,
        .lp-ticker::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          width: 90px;
          z-index: 2;
          pointer-events: none;
        }

        .lp-ticker::before {
          left: 0;
          background: linear-gradient(to right, #FFFFFF, transparent);
        }

        .lp-ticker::after {
          right: 0;
          background: linear-gradient(to left, #FFFFFF, transparent);
        }

        .lp-ticker-track {
          display: flex;
          gap: 44px;
          width: max-content;
          animation: lpScroll 30s linear infinite;
        }

        .lp-ticker-item {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #4D596C;
          font-size: 13px;
          font-weight: 850;
          white-space: nowrap;
        }

        .lp-ticker-item span {
          color: ${BLUE};
          opacity: .8;
        }

        @keyframes lpScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* ---------- STATS ---------- */

        .lp-stats {
          width: min(1280px, calc(100% - 56px));
          margin: 0 auto;
          padding: 74px 0 30px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 16px;
        }

        .lp-stat {
          text-align: center;
          padding: 26px 14px;
          border-radius: 18px;
          background: #FFFFFF;
          border: 1px solid ${BORDER};
          box-shadow: 0 8px 22px rgba(11,26,63,.04);
        }

        .lp-stat-icon {
          width: 44px;
          height: 44px;
          margin: 0 auto 12px;
          border-radius: 13px;
          background: #EEF3FA;
          color: ${BLUE};
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lp-stat-num-wrap {
          display: inline-flex;
          align-items: baseline;
          color: ${NAVY};
          font-size: 30px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -.02em;
        }

        .lp-stat-suffix {
          font-size: 18px;
        }

        .lp-stat-label {
          margin-top: 8px;
          color: #6F7B90;
          font-size: 12px;
          font-weight: 800;
        }

        /* ---------- SECTION SHELL ---------- */

        .lp-section {
          width: min(1160px, calc(100% - 56px));
          margin: 0 auto;
          padding: 92px 0 10px;
        }

        .lp-section-head {
          max-width: 760px;
          margin-bottom: 44px;
        }

        .lp-section-head.center {
          margin-left: auto;
          margin-right: auto;
          text-align: center;
        }

        .lp-kicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: ${BLUE};
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .10em;
          margin-bottom: 13px;
        }

        .lp-section-head h2 {
          margin: 0;
          color: ${NAVY};
          font-size: clamp(32px, 4.4vw, 48px);
          line-height: 1.05;
          letter-spacing: -.045em;
          font-weight: 950;
        }

        .lp-section-head p {
          margin: 16px 0 0;
          color: ${MUTED};
          font-size: 16px;
          line-height: 1.7;
          font-weight: 600;
        }

        /* reveal */

        .lp-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity .7s ease, transform .7s cubic-bezier(.22,.61,.36,1);
          transition-delay: var(--lp-delay, 0ms);
          will-change: opacity, transform;
        }

        .lp-reveal.lp-in {
          opacity: 1;
          transform: none;
        }

        /* ---------- DEMO ---------- */

        .lp-demo-wrap {
          background: linear-gradient(180deg, #F0F5FB 0%, #FBFCFE 100%);
          border-radius: 34px;
          padding: 40px 34px 36px;
          border: 1px solid #E3EAF3;
        }

        .lp-demo-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
        }

        .lp-demo-tab {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 37px;
          padding: 0 13px;
          border-radius: 999px;
          border: 1px solid #DFE6EF;
          background: #FFFFFF;
          color: #4D596C;
          font-size: 11.5px;
          font-weight: 850;
          cursor: pointer;
          font-family: inherit;
          transition: transform .14s ease, box-shadow .14s ease, color .14s ease;
        }

        .lp-demo-tab:hover {
          color: ${NAVY};
          transform: translateY(-1px);
        }

        .lp-demo-tab-active {
          background: ${NAVY};
          border-color: ${NAVY};
          color: #FFFFFF;
          box-shadow: 0 8px 18px rgba(11,26,63,.16);
        }

        .lp-demo-tab-active:hover {
          color: #FFFFFF;
        }

        .lp-demo-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.42fr) minmax(240px, .68fr);
          gap: 26px;
          align-items: stretch;
        }

        .lp-shot {
          border-radius: 18px;
          background: #FFFFFF;
          border: 1px solid #E3E9F1;
          overflow: hidden;
          min-height: 520px;
          display: flex;
          flex-direction: column;
        }

        .lp-shot-bar {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 11px 14px;
          border-bottom: 1px solid #EDF1F5;
          background: #FBFCFE;
        }

        .lp-shot-kicker {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10.5px;
          font-weight: 900;
          color: ${NAVY};
        }

        .lp-shot-kicker img {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }

        .lp-shot-url {
          min-height: 22px;
          padding: 0 12px;
          border-radius: 999px;
          background: #FFFFFF;
          border: 1px solid #E9EDF3;
          color: #9AA5B7;
          font-size: 9px;
          font-weight: 800;
          display: flex;
          align-items: center;
        }

        .lp-shot-body {
          position: relative;
          flex: 1;
          min-height: 0;
          overflow: hidden;
          background: #F7F9FC;
        }

        .lp-shot-scroll {
          height: 100%;
          max-height: 478px;
          overflow: auto;
          scrollbar-width: thin;
          scrollbar-color: #D9DFEB transparent;
        }

        .lp-shot-scroll::-webkit-scrollbar {
          width: 7px;
        }

        .lp-shot-scroll::-webkit-scrollbar-thumb {
          background: #D9DFEB;
          border-radius: 999px;
        }

        .lp-shot-img {
          display: block;
          width: 100%;
          height: auto;
          opacity: 0;
          transition: opacity .35s ease;
        }

        .lp-shot-img.loaded {
          opacity: 1;
        }

        .lp-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            100deg,
            #F3F6FA 30%,
            #E9EEF5 50%,
            #F3F6FA 70%
          );
          background-size: 200% 100%;
          animation: lpShimmer 1.4s ease-in-out infinite;
        }

        @keyframes lpShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .lp-demo-info {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 6px 0;
        }

        .lp-demo-info h3 {
          margin: 0;
          color: ${NAVY};
          font-size: 25px;
          line-height: 1.16;
          letter-spacing: -.03em;
          font-weight: 950;
        }

        .lp-demo-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 16px rgba(11,26,63,.06);
        }

        .lp-demo-points {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .lp-demo-point {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          color: #4D596C;
          font-size: 13px;
          line-height: 1.5;
          font-weight: 700;
        }

        .lp-demo-point-check {
          width: 20px;
          height: 20px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .lp-demo-cta {
          margin-top: auto;
          align-self: flex-start;
        }

        /* ---------- PILLARS ---------- */

        .lp-pillars {
          display: grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 14px;
        }

        .lp-pillar {
          min-height: 232px;
          padding: 22px 20px;
          border-radius: 18px;
          border: 1px solid ${BORDER};
          background: #FFFFFF;
          box-shadow: 0 7px 20px rgba(11,26,63,.03);
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }

        .lp-pillar:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 34px rgba(11,26,63,.08);
          border-color: #D6E0ED;
        }

        .lp-pillar-icon {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .lp-pillar h3 {
          margin: 0;
          color: ${NAVY};
          font-size: 16px;
          font-weight: 950;
        }

        .lp-pillar p {
          margin: 9px 0 0;
          color: ${MUTED};
          font-size: 12px;
          line-height: 1.65;
          font-weight: 600;
        }

        .lp-extras {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-top: 26px;
        }

        .lp-extra {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 12px 16px;
          border-radius: 999px;
          border: 1px solid #E1E7EF;
          background: #FFFFFF;
          font-size: 12px;
          font-weight: 850;
          color: #3C4A5F;
          box-shadow: 0 5px 16px rgba(11,26,63,.04);
          transition: transform .16s ease, box-shadow .16s ease;
        }

        .lp-extra:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 22px rgba(11,26,63,.09);
        }

        .lp-extra-soon {
          margin-left: 2px;
          padding: 3px 8px;
          border-radius: 999px;
          background: #EAF2FD;
          color: ${BLUE};
          font-size: 9.5px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }

        /* ---------- HOW ---------- */

        .lp-how {
          background: ${NAVY};
          border-radius: 34px;
          padding: 64px 52px 76px;
          position: relative;
          overflow: hidden;
        }

        .lp-how::before {
          content: "";
          position: absolute;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(100,140,203,.22), transparent 70%);
          top: -200px;
          right: -80px;
          pointer-events: none;
        }

        .lp-how .lp-section-head h2 {
          color: #FFFFFF;
        }

        .lp-how .lp-kicker {
          color: #9DBCE7;
        }

        .lp-how .lp-section-head p {
          color: rgba(255,255,255,.68);
        }

        .lp-steps {
          display: grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 14px;
          position: relative;
          z-index: 2;
        }

        .lp-step {
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 20px;
          padding: 24px 22px;
          backdrop-filter: blur(8px);
          transition: transform .18s ease, background .18s ease;
        }

        .lp-step:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,.085);
        }

        .lp-step-num {
          color: #9DBCE7;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .12em;
          margin-bottom: 22px;
        }

        .lp-step-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(255,255,255,.12);
          color: #BFD4F2;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .lp-step h3 {
          margin: 0 0 8px;
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 950;
        }

        .lp-step p {
          margin: 0;
          color: rgba(255,255,255,.70);
          font-size: 12px;
          line-height: 1.62;
          font-weight: 600;
        }

        /* ---------- CHAT DEMO ---------- */

        .lp-chat-section {
          display: grid;
          grid-template-columns: minmax(0, .9fr) minmax(380px, 1.1fr);
          gap: 52px;
          align-items: center;
        }

        .lp-chat-section .lp-section-head {
          margin-bottom: 0;
        }

        .lp-chat-shell {
          position: relative;
        }

        .lp-chat-shell::before {
          content: "";
          position: absolute;
          inset: -30px;
          background: radial-gradient(closest-side, rgba(100,140,203,.14), transparent 75%);
          border-radius: 60px;
          pointer-events: none;
        }

        .lp-chat {
          position: relative;
          z-index: 2;
          border: 1px solid #E4E9F1;
          border-radius: 24px;
          background: #FFFFFF;
          box-shadow: 0 30px 70px rgba(11,26,63,.13);
          overflow: hidden;
        }

        .lp-chat-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid #EDF1F5;
          background: #FFFFFF;
        }

        .lp-chat-topic {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .lp-chat-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 950;
          font-size: 14px;
          flex-shrink: 0;
        }

        .lp-chat-name {
          display: flex;
          align-items: center;
          gap: 6px;
          color: ${NAVY};
          font-size: 13px;
          font-weight: 950;
          white-space: nowrap;
        }

        .lp-chat-online {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #58B07C;
          box-shadow: 0 0 0 3px rgba(88,176,124,.16);
        }

        .lp-chat-status {
          margin-top: 3px;
          color: #8B97AD;
          font-size: 10.5px;
          font-weight: 750;
          white-space: nowrap;
        }

        .lp-chat-avatars {
          display: flex;
          align-items: center;
        }

        .lp-chat-mini {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 900;
        }

        .lp-chat-scroll {
          height: 300px;
          overflow: auto;
          padding: 16px 16px 10px;
          background: #FBFCFE;
          display: flex;
          flex-direction: column;
          gap: 10px;
          scrollbar-width: thin;
          scrollbar-color: #D9DFEB transparent;
        }

        .lp-chat-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .lp-chat-scroll::-webkit-scrollbar-thumb {
          background: #D9DFEB;
          border-radius: 999px;
        }

        .lp-chat-day {
          text-align: center;
          color: #9AA5B7;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .08em;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .lp-chat-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .lp-chat-row.me {
          justify-content: flex-end;
        }

        .lp-chat-bubble-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 950;
          flex-shrink: 0;
        }

        .lp-chat-bubble {
          max-width: 78%;
          padding: 10px 13px;
          border-radius: 16px;
          border-top-left-radius: 5px;
          background: #FFFFFF;
          border: 1px solid #E7EBF1;
          color: #27324A;
          font-size: 12.5px;
          line-height: 1.5;
          font-weight: 650;
          box-shadow: 0 4px 12px rgba(11,26,63,.05);
          animation: lpBubbleIn .3s ease both;
        }

        .lp-chat-bubble.is-me {
          background: ${NAVY};
          border-color: ${NAVY};
          color: #FFFFFF;
          border-top-right-radius: 5px;
          border-top-left-radius: 16px;
        }

        @keyframes lpBubbleIn {
          0% { opacity: 0; transform: translateY(8px) scale(.97); }
          100% { opacity: 1; transform: none; }
        }

        .lp-chat-typing {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 11px 14px;
          border-radius: 16px;
          border-top-left-radius: 5px;
          background: #FFFFFF;
          border: 1px solid #E7EBF1;
          box-shadow: 0 4px 12px rgba(11,26,63,.05);
        }

        .lp-chat-typing span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #9AA5B7;
          animation: lpBlink 1.2s ease-in-out infinite;
        }

        .lp-chat-typing span:nth-child(2) {
          animation-delay: .18s;
        }

        .lp-chat-typing span:nth-child(3) {
          animation-delay: .36s;
        }

        @keyframes lpBlink {
          0%, 70%, 100% { opacity: .25; transform: translateY(0); }
          35% { opacity: 1; transform: translateY(-3px); }
        }

        .lp-chat-composer {
          border-top: 1px solid #EDF1F5;
          background: #FFFFFF;
          padding: 12px 14px 14px;
        }

        .lp-chat-suggest {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 10px;
        }

        .lp-chat-suggest em {
          font-style: normal;
          color: #9AA5B7;
          font-size: 10.5px;
          font-weight: 800;
        }

        .lp-chat-chip {
          min-height: 28px;
          padding: 0 11px;
          border-radius: 999px;
          border: 1px solid #DDE4EE;
          background: #F6F9FC;
          color: ${NAVY};
          font-size: 10.5px;
          font-weight: 850;
          cursor: pointer;
          font-family: inherit;
          transition: background .15s ease, transform .15s ease;
        }

        .lp-chat-chip:hover {
          background: #EAEFF7;
          transform: translateY(-1px);
        }

        .lp-chat-replay {
          min-height: 28px;
          padding: 0 12px;
          border-radius: 999px;
          border: none;
          background: ${NAVY};
          color: #FFFFFF;
          font-size: 10.5px;
          font-weight: 900;
          cursor: pointer;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .lp-chat-input {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 13px;
          border-radius: 13px;
          border: 1px solid #E3E8EF;
          background: #FFFFFF;
          color: #9AA5B7;
          font-size: 12px;
          font-weight: 750;
        }

        .lp-chat-send {
          padding: 5px 12px;
          border-radius: 999px;
          background: ${NAVY};
          color: #FFFFFF;
          font-size: 9.5px;
          font-weight: 900;
        }

        /* ---------- TRUST ROW ---------- */

        .lp-trust {
          width: min(1160px, calc(100% - 56px));
          margin: 0 auto;
          padding: 100px 0 20px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 14px;
        }

        .lp-trust-card {
          display: flex;
          gap: 13px;
          padding: 22px;
          border-radius: 18px;
          background: #FFFFFF;
          border: 1px solid ${BORDER};
          box-shadow: 0 8px 22px rgba(11,26,63,.04);
        }

        .lp-trust-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .lp-trust-card h3 {
          margin: 0 0 6px;
          color: ${NAVY};
          font-size: 15px;
          font-weight: 950;
        }

        .lp-trust-card p {
          margin: 0;
          color: ${MUTED};
          font-size: 12px;
          line-height: 1.6;
          font-weight: 600;
        }

        /* ---------- VOICES ---------- */

        .lp-voices {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 14px;
        }

        .lp-voice {
          padding: 26px 24px;
          border-radius: 20px;
          background: #FFFFFF;
          border: 1px solid ${BORDER};
          box-shadow: 0 10px 26px rgba(11,26,63,.04);
          display: flex;
          flex-direction: column;
        }

        .lp-voice-quote {
          width: 36px;
          height: 36px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .lp-voice blockquote {
          margin: 0 0 18px;
          color: #2A3550;
          font-size: 16px;
          line-height: 1.6;
          font-weight: 800;
          flex: 1;
        }

        .lp-voice-foot {
          border-top: 1px solid #EDF0F5;
          padding-top: 14px;
        }

        .lp-voice-name {
          color: ${NAVY};
          font-size: 13px;
          font-weight: 950;
        }

        .lp-voice-role {
          margin-top: 4px;
          color: #8B97AD;
          font-size: 11px;
          font-weight: 750;
        }

        /* ---------- FAQ ---------- */

        .lp-faq-wrap {
          max-width: 780px;
          margin: 0 auto;
        }

        .lp-faq {
          border: 1px solid ${BORDER};
          border-radius: 18px;
          background: #FFFFFF;
          margin-bottom: 12px;
          box-shadow: 0 6px 18px rgba(11,26,63,.03);
          overflow: hidden;
          transition: border-color .18s ease;
        }

        .lp-faq-open {
          border-color: #CBD8E9;
        }

        .lp-faq-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 20px 22px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          color: ${NAVY};
          font-size: 15px;
          font-weight: 900;
        }

        .lp-faq-chev {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background: #F0F4FA;
          color: ${BLUE};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform .25s ease, background .25s ease;
        }

        .lp-faq-open .lp-faq-chev {
          transform: rotate(180deg);
          background: ${NAVY};
          color: #FFFFFF;
        }

        .lp-faq-body {
          max-height: 0;
          overflow: hidden;
          transition: max-height .3s ease, padding .3s ease;
          padding: 0 22px;
          color: ${MUTED};
          font-size: 14px;
          line-height: 1.7;
          font-weight: 600;
        }

        .lp-faq-open .lp-faq-body {
          max-height: 320px;
          padding: 0 22px 22px;
        }

        /* ---------- CTA ---------- */

        .lp-cta {
          width: min(1160px, calc(100% - 56px));
          margin: 0 auto;
          padding: 96px 0 110px;
        }

        .lp-cta-card {
          position: relative;
          overflow: hidden;
          border-radius: 34px;
          background: linear-gradient(135deg, #0B1A3F 0%, #17366A 100%);
          padding: 64px 60px;
          text-align: center;
          box-shadow: 0 26px 60px rgba(11,26,63,.18);
        }

        .lp-cta-card::before,
        .lp-cta-card::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .lp-cta-card::before {
          width: 420px;
          height: 420px;
          left: -120px;
          top: -170px;
          background: radial-gradient(circle, rgba(100,140,203,.24), transparent 70%);
        }

        .lp-cta-card::after {
          width: 340px;
          height: 340px;
          right: -100px;
          bottom: -150px;
          background: radial-gradient(circle, rgba(199,110,138,.20), transparent 70%);
        }

        .lp-cta-card h2 {
          position: relative;
          z-index: 2;
          margin: 0 auto;
          max-width: 620px;
          color: #FFFFFF;
          font-size: clamp(32px, 4.4vw, 46px);
          line-height: 1.08;
          letter-spacing: -.045em;
          font-weight: 950;
        }

        .lp-cta-card p {
          position: relative;
          z-index: 2;
          margin: 16px auto 0;
          max-width: 520px;
          color: rgba(255,255,255,.72);
          font-size: 16px;
          line-height: 1.7;
          font-weight: 600;
        }

        .lp-cta-actions {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 30px;
          flex-wrap: wrap;
        }

        .lp-cta-primary {
          min-height: 48px;
          padding: 0 19px;
          border-radius: 12px;
          background: #FFFFFF;
          color: ${NAVY};
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 10px 24px rgba(0,0,0,.16);
          transition: transform .16s ease;
        }

        .lp-cta-primary:hover {
          transform: translateY(-2px);
        }

        .lp-cta-ghost {
          min-height: 48px;
          padding: 0 18px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.28);
          color: #FFFFFF;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 900;
          transition: background .16s ease;
        }

        .lp-cta-ghost:hover {
          background: rgba(255,255,255,.08);
        }

        /* ---------- FOOTER ---------- */

        .lp-footer {
          border-top: 1px solid ${BORDER};
          background: #FFFFFF;
          padding: 48px 0 34px;
        }

        .lp-footer-inner {
          width: min(1160px, calc(100% - 56px));
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          gap: 40px;
          flex-wrap: wrap;
        }

        .lp-footer-brand {
          max-width: 300px;
        }

        .lp-footer-brand a {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: ${NAVY};
          font-size: 19px;
          font-weight: 950;
          text-decoration: none;
          margin-bottom: 12px;
        }

        .lp-footer-brand img {
          width: 34px;
          height: 34px;
          object-fit: contain;
        }

        .lp-footer-brand p {
          margin: 0;
          color: #6F7B90;
          font-size: 12px;
          line-height: 1.7;
          font-weight: 650;
        }

        .lp-footer-cols {
          display: flex;
          gap: 70px;
          flex-wrap: wrap;
        }

        .lp-footer-col h4 {
          margin: 0 0 14px;
          color: ${NAVY};
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .04em;
          text-transform: uppercase;
        }

        .lp-footer-col a {
          display: block;
          color: #5A667B;
          font-size: 12.5px;
          font-weight: 750;
          text-decoration: none;
          margin-bottom: 10px;
          transition: color .15s ease;
        }

        .lp-footer-col a:hover {
          color: ${NAVY};
        }

        .lp-footer-bottom {
          width: min(1160px, calc(100% - 56px));
          margin: 40px auto 0;
          padding-top: 22px;
          border-top: 1px solid #EDF1F5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          color: #8B97AD;
          font-size: 11.5px;
          font-weight: 750;
        }

        .lp-footer-made {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .lp-footer-made .heart {
          color: #C76E8A;
          display: inline-flex;
          animation: lpHeart 1.6s ease-in-out infinite;
        }

        @keyframes lpHeart {
          0%, 100% { transform: scale(1); }
          30% { transform: scale(1.25); }
          45% { transform: scale(1); }
        }

        /* ---------- RESPONSIVE ---------- */

        @media (max-width: 1024px) {
          .lp-hero {
            grid-template-columns: 1fr;
            gap: 42px;
            padding-top: 42px;
          }

          .lp-hero {
            min-height: auto;
          }

          .lp-hero-visual {
            min-height: auto;
          }

          .lp-window {
            max-width: 620px;
          }

          .lp-stats {
            grid-template-columns: repeat(2, minmax(0,1fr));
          }

          .lp-pillars {
            grid-template-columns: repeat(2, minmax(0,1fr));
          }

          .lp-demo-grid {
            grid-template-columns: 1fr;
          }

          .lp-shot {
            min-height: auto;
          }

          .lp-demo-info {
            padding: 4px 0 2px;
          }

          .lp-steps {
            grid-template-columns: repeat(2, minmax(0,1fr));
          }

          .lp-chat-section {
            grid-template-columns: 1fr;
            gap: 36px;
          }

          .lp-trust,
          .lp-voices {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .lp-nav,
          .lp-hero,
          .lp-stats,
          .lp-section,
          .lp-trust,
          .lp-cta,
          .lp-footer-inner,
          .lp-footer-bottom {
            width: min(100% - 30px, 720px);
          }

          .lp-nav-links {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .lp-hero h1 {
            font-size: 44px;
          }

          .lp-hero-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .lp-primary,
          .lp-secondary {
            justify-content: center;
          }

          .lp-window {
            height: 440px;
          }

          .hw-body {
            grid-template-columns: 38px 150px minmax(0,1fr);
          }

          .hw-float.one {
            left: -6px;
            top: -10px;
          }

          .hw-float.two {
            right: -6px;
            bottom: -10px;
          }

          .lp-stats {
            grid-template-columns: repeat(2, minmax(0,1fr));
            gap: 10px;
          }

          .lp-pillars,
          .lp-steps {
            grid-template-columns: 1fr;
          }

          .lp-demo-wrap {
            padding: 26px 18px 24px;
            border-radius: 24px;
          }

          .lp-how {
            padding: 46px 24px 54px;
            border-radius: 24px;
          }

          .lp-cta-card {
            padding: 46px 26px;
            border-radius: 24px;
          }

          .lp-footer-cols {
            gap: 32px;
          }

          .lp-section {
            padding-top: 70px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .lp-orb,
          .hw-float,
          .lp-pulse-ring::before,
          .lp-pulse-ring::after,
          .lp-ticker-track,
          .lp-chat-typing span,
          .lp-footer-made .heart,
          .lp-shimmer {
            animation: none !important;
          }

          .lp-reveal {
            transition: none;
            opacity: 1;
            transform: none;
          }

          html {
            scroll-behavior: auto;
          }
        }
      `}</style>

      {/* ===== NAV ===== */}
      <nav className="lp-nav">
        <Link to="/" className="lp-brand">
          <img src={camporaLogo} alt="Campora logo" />
          Campora
        </Link>

        <div className="lp-nav-links">
          <a href="#lp-demo" className="lp-nav-link">
            Take a peek
          </a>
          <a href="#lp-features" className="lp-nav-link">
            Features
          </a>
          <a href="#lp-how" className="lp-nav-link">
            How it works
          </a>
          <a href="#lp-faq" className="lp-nav-link">
            FAQ
          </a>
          <Link to="/about" className="lp-nav-link">
            About
          </Link>
          <Link to="/features" className="lp-nav-link">
            More
          </Link>
        </div>

        <div className="lp-nav-actions">
          <Link to="/login" className="lp-login">
            Log in
          </Link>

          <Link to="/signup" className="lp-signup">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <main>
        <section className="lp-hero">
          <div className="lp-hero-bg">
            <div className="lp-orb one" />
            <div className="lp-orb two" />
            <div className="lp-orb three" />
          </div>

          <section className="lp-reveal" data-reveal>
            <div className="lp-eyebrow">
              <GraduationCap size={13} />
              Built by students · For student life
            </div>

            <h1>
              University,
              <br />
              <span>less scattered.</span>
            </h1>

            <p className="lp-hero-copy">
              Campora brings your academics, campus updates, planning, and
              student connections into one simple place — so you can stop
              juggling apps and start being a student.
            </p>

            <div className="lp-hero-actions">
              <Link to="/signup" className="lp-primary">
                Get Started
                <ArrowRight size={17} />
              </Link>

              <a href="#lp-demo" className="lp-secondary">
                See it in action
                <ArrowRight size={15} />
              </a>
            </div>

            <div className="lp-hero-trust">
              <div className="lp-avatar-stack">
                <div style={{ background: '#EEF3FA', color: '#648CCB' }}>
                  S
                </div>
                <div style={{ background: '#FBEFF4', color: '#B76A8A', marginLeft: -8 }}>
                  N
                </div>
                <div style={{ background: '#EAF6F1', color: '#3F8B73', marginLeft: -8 }}>
                  Y
                </div>
                <div style={{ background: '#F5F2FB', color: '#8B78B8', marginLeft: -8 }}>
                  L
                </div>
                <div style={{ background: '#FFF7E8', color: '#C69746', marginLeft: -8 }}>
                  R
                </div>
              </div>

              <div>
                <div className="lp-trust-text">
                  <strong>5 students</strong> · one campus, one place
                </div>
                <div className="lp-trust-text" style={{ marginTop: 4 }}>
                  Courses · Planner · Groups · Pulse · Messages
                </div>
              </div>
            </div>
          </section>

          <section
            className="lp-hero-visual lp-reveal"
            data-reveal
            style={{ '--lp-delay': '120ms' }}
          >
            <div className="lp-hero-glow" ref={glowRef} onPointerMove={handleGlowMove} />

            <div className="lp-pulse-ring">
              <div className="lp-pulse-dot" />
            </div>

            <div className="hw-float one">
              <div
                className="hw-float-icon"
                style={{ background: '#EEF7F3', color: '#6F948B' }}
              >
                <CheckCircle2 size={16} />
              </div>
              <div>
                <div className="hw-float-title">New group chat</div>
                <div className="hw-float-sub">Algorithms study group</div>
              </div>
            </div>

            <div className="hw-float two">
              <div
                className="hw-float-icon"
                style={{ background: '#FBEFF4', color: '#C76E8A' }}
              >
                <Heart size={16} />
              </div>
              <div>
                <div className="hw-float-title">Hackathon post</div>
                <div className="hw-float-sub">Liked on Campus Pulse</div>
              </div>
            </div>

            <div className="lp-window">
              <div className="hw-top">
                <span className="hw-dot" style={{ background: '#F1A99B' }} />
                <span className="hw-dot" style={{ background: '#E8C787' }} />
                <span className="hw-dot" style={{ background: '#8FCFA2' }} />
                <div className="hw-addr">
                  <span className="lock">
                    <ShieldCheck size={10} />
                  </span>
                  app.campora.edu/dashboard
                </div>
              </div>

              <div className="hw-body">
                <aside className="hw-rail">
                  <img src={camporaLogo} alt="Campora logo" />

                  <div className="hw-rail-icon hw-rail-icon-active">
                    <LayoutDashboard size={13} />
                  </div>

                  <div className="hw-rail-icon">
                    <BookOpen size={13} />
                  </div>

                  <div className="hw-rail-icon">
                    <UserCheck size={13} />
                  </div>

                  <div className="hw-rail-icon">
                    <Users size={13} />
                  </div>

                  <div className="hw-rail-icon">
                    <MessageSquare size={13} />
                  </div>
                </aside>

                <aside className="hw-side">
                  <div className="hw-side-title">Dashboard</div>
                  <div className="hw-side-sub">Tuesday, Apr 14</div>

                  <div className="hw-row">
                    <div
                      className="hw-row-icon"
                      style={{ background: '#EEF3F9', color: '#648CCB' }}
                    >
                      <BookOpen size={12} />
                    </div>
                    Courses
                  </div>

                  <div className="hw-row">
                    <div
                      className="hw-row-icon"
                      style={{ background: '#FFF4E8', color: '#C6824E' }}
                    >
                      <UserCheck size={12} />
                    </div>
                    Registration
                  </div>

                  <div className="hw-row hw-row-active">
                    <div
                      className="hw-row-icon"
                      style={{ background: '#0B1A3F', color: '#FFFFFF' }}
                    >
                      <CalendarDays size={12} />
                    </div>
                    Planner
                  </div>

                  <div className="hw-row">
                    <div
                      className="hw-row-icon"
                      style={{ background: '#FBEFF4', color: '#C76E8A' }}
                    >
                      <Users size={12} />
                    </div>
                    Study Groups
                  </div>

                  <div className="hw-row">
                    <div
                      className="hw-row-icon"
                      style={{ background: '#F1F7F5', color: '#6F948B' }}
                    >
                      <CheckSquare size={12} />
                    </div>
                    To-Do
                  </div>
                </aside>

                <div className="hw-main">
                  <div className="hw-welcome">
                    <div className="hw-welcome-eyebrow">
                      Good afternoon
                    </div>
                    <h3>Thea’s day at a glance</h3>
                    <p>Everything important, without hunting for it.</p>
                  </div>

                  <div className="hw-stats">
                    <div className="hw-stat">
                      <div className="hw-stat-num">4</div>
                      <div className="hw-stat-label">Courses</div>
                    </div>
                    <div className="hw-stat">
                      <div className="hw-stat-num">2</div>
                      <div className="hw-stat-label">Deadlines</div>
                    </div>
                    <div className="hw-stat">
                      <div className="hw-stat-num">3</div>
                      <div className="hw-stat-label">To-dos left</div>
                    </div>
                  </div>

                  <div className="hw-grid">
                    <div className="hw-card">
                      <div className="hw-card-head">
                        <div className="hw-card-title">
                          <div
                            className="hw-card-icon"
                            style={{ background: '#EEF3F9', color: '#648CCB' }}
                          >
                            <CalendarDays size={12} />
                          </div>
                          Today
                        </div>
                        <div className="hw-chip" />
                      </div>

                      <div className="hw-list">
                        <div className="hw-item">
                          <span className="hw-item-dot" style={{ background: '#648CCB' }} />
                          <div style={{ flex: 1 }}>
                            <div className="hw-item-name">Intro to Algorithms</div>
                          </div>
                          <span className="hw-item-time">10:00</span>
                        </div>
                        <div className="hw-item">
                          <span className="hw-item-dot" style={{ background: '#8B78B8' }} />
                          <div style={{ flex: 1 }}>
                            <div className="hw-item-name">Study group · meet</div>
                          </div>
                          <span className="hw-item-time">5:00</span>
                        </div>
                      </div>
                    </div>

                    <div className="hw-card">
                      <div className="hw-card-head">
                        <div className="hw-card-title">
                          <div
                            className="hw-card-icon"
                            style={{ background: '#F1F7F5', color: '#6F948B' }}
                          >
                            <CheckSquare size={12} />
                          </div>
                          To-Do
                        </div>
                        <div className="hw-chip" />
                      </div>

                      <div className="hw-progress">
                        <div className="hw-progress-top">
                          <div className="hw-progress-num">62%</div>
                          <div className="hw-progress-pill" style={{ background: '#EEF7F3', color: '#3F8B73' }}>
                            3 done
                          </div>
                        </div>
                        <div className="hw-progress-track">
                          <div className="hw-progress-fill" />
                        </div>
                      </div>

                      <div className="hw-empty">
                        <Megaphone size={11} />
                        + 1 campus update
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>

        {/* ===== TICKER ===== */}
        <div className="lp-ticker" aria-hidden="true">
          <div className="lp-ticker-track">
            {[0, 1].map((round) => (
              <React.Fragment key={round}>
                {[
                  'Courses',
                  'Registration',
                  'Study Groups',
                  'Messages',
                  'Campus Pulse',
                  'Planner',
                  'To-Do',
                  'Campus Hub',
                  'Notifications',
                  'Campus Map',
                  'Schedule Import',
                  'Assistant',
                ].map((item) => (
                  <span className="lp-ticker-item" key={`${round}-${item}`}>
                    <span>✦</span>
                    {item}
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ===== STATS ===== */}
        <section className="lp-stats">
          {[
            {
              icon: LayoutDashboard,
              value: 8,
              suffix: '+',
              label: 'Student workspaces',
            },
            {
              icon: Zap,
              value: 12,
              suffix: '+',
              label: 'Features & tools',
            },
            {
              icon: InfinityIcon,
              value: 3,
              suffix: '×1',
              label: 'Core areas, one place',
            },
            {
              icon: Bell,
              value: 100,
              suffix: '%',
              label: 'Real-time updates',
            },
          ].map((item, idx) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="lp-stat lp-reveal"
                data-reveal
                style={{ '--lp-delay': `${idx * 70}ms` }}
              >
                <div className="lp-stat-icon">
                  <Icon size={20} />
                </div>

                <div className="lp-stat-num-wrap">
                  <span data-lp-count={item.value}>0</span>
                  <span className="lp-stat-suffix">{item.suffix}</span>
                </div>

                <div className="lp-stat-label">{item.label}</div>
              </div>
            );
          })}
        </section>

        {/* ===== DEMO ===== */}
        <section className="lp-section" id="lp-demo">
          <div className="lp-section-head center lp-reveal" data-reveal>
            <div className="lp-kicker">
              <Play size={13} />
              Take a peek
            </div>
            <h2>Every workspace, right here on the landing page.</h2>
            <p>
              Click a tab to explore a real screen from Campora. No account
              needed — this is the actual student experience.
            </p>
          </div>

          <div
            className="lp-demo-wrap lp-reveal"
            data-reveal
            style={{ '--lp-delay': '100ms' }}
          >
            <div className="lp-demo-tabs" role="tablist" aria-label="Feature previews">
              {DEMO_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = tab.id === demoTab;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={
                      active
                        ? 'lp-demo-tab lp-demo-tab-active'
                        : 'lp-demo-tab'
                    }
                    onClick={() => changeDemo(tab.id)}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="lp-demo-grid">
              <div className="lp-shot">
                <div className="lp-shot-bar">
                  <div className="lp-shot-kicker">
                    <img src={camporaLogo} alt="Campora" />
                    campora.edu/{activeDemo.id}
                  </div>
                  <div className="lp-shot-url">
                    <Search size={10} />
                    &nbsp;Search Campora…
                  </div>
                </div>

                <div className="lp-shot-body">
                  <div className="lp-shot-scroll">
                    <img
                      key={activeDemo.id}
                      src={activeDemo.img}
                      alt={`Campora ${activeDemo.label} preview`}
                      className={
                        demoLoaded
                          ? 'lp-shot-img loaded'
                          : 'lp-shot-img'
                      }
                      onLoad={() => setDemoLoaded(true)}
                      loading="lazy"
                    />
                  </div>

                  {!demoLoaded && <div className="lp-shimmer" />}
                </div>
              </div>

              <div className="lp-demo-info">
                <div
                  className="lp-demo-icon"
                  style={{
                    background: activeDemo.soft,
                    color: activeDemo.accent,
                    border: `1px solid ${activeDemo.accent}33`,
                  }}
                >
                  <ActiveDemoIcon size={21} />
                </div>

                <h3>{activeDemo.headline}</h3>

                <div className="lp-demo-points">
                  {activeDemo.points.map((point) => (
                    <div className="lp-demo-point" key={point}>
                      <span
                        className="lp-demo-point-check"
                        style={{
                          background: activeDemo.soft,
                          color: activeDemo.accent,
                        }}
                      >
                        <CheckSquare size={11} />
                      </span>
                      {point}
                    </div>
                  ))}
                </div>

                <Link to="/signup" className="lp-primary lp-demo-cta">
                  Try {activeDemo.label} free
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FEATURES / PILLARS ===== */}
        <section className="lp-section" id="lp-features">
          <div className="lp-section-head lp-reveal" data-reveal>
            <div className="lp-kicker">
              <Sparkles size={13} />
              Everything the website does
            </div>
            <h2>Your semester, your campus, and your people — together.</h2>
            <p>
              Every tool on Campora is built on the same idea: less switching,
              less searching, more student life.
            </p>
          </div>

          <div className="lp-pillars">
            {PILLARS.map((item, idx) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="lp-pillar lp-reveal"
                  data-reveal
                  style={{ '--lp-delay': `${(idx % 4) * 70}ms` }}
                >
                  <div
                    className="lp-pillar-icon"
                    style={{
                      background: item.soft,
                      color: item.accent,
                      border: `1.5px solid ${item.accent}44`,
                    }}
                  >
                    <Icon size={20} strokeWidth={2.1} />
                  </div>

                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              );
            })}
          </div>

          <div className="lp-extras">
            {EXTRAS.map((item) => {
              const Icon = item.icon;

              return (
                <div className="lp-extra lp-reveal" data-reveal key={item.label}>
                  <Icon size={15} style={{ color: item.accent }} />
                  {item.label}
                  {item.soon && (
                    <span className="lp-extra-soon">soon</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="lp-section" id="lp-how">
          <div className="lp-how lp-reveal" data-reveal>
            <div className="lp-section-head center">
              <div className="lp-kicker">
                <Zap size={13} />
                How it works
              </div>
              <h2>From first login to full campus life in minutes.</h2>
              <p>
                Four steps. No wasted time. Campora sets itself up around the
                way you already study.
              </p>
            </div>

            <div className="lp-steps">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.step}
                    className="lp-step lp-reveal"
                    data-reveal
                    style={{ '--lp-delay': `${idx * 90}ms` }}
                  >
                    <div className="lp-step-num">{step.step}</div>
                    <div className="lp-step-icon">
                      <Icon size={19} />
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 34,
              }}
            >
              <a href="#lp-demo" className="lp-cta-ghost">
                Watch it happen above
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </section>

        {/* ===== LIVE CHAT DEMO ===== */}
        <section className="lp-section">
          <div className="lp-chat-section">
            <div className="lp-section-head">
              <div className="lp-kicker">
                <MessageSquare size={13} />
                Try the live demo
              </div>
              <h2>Watch a study group come alive.</h2>
              <p>
                This is real Campora behavior — messages arrive in real time,
                and typing indicators show when someone’s there. Tap a reply
                and see the thread continue.
              </p>

              <div className="lp-hero-actions">
                <Link to="/signup" className="lp-primary">
                  Join your campus
                  <ArrowRight size={16} />
                </Link>
                <Link to="/features" className="lp-secondary">
                  Explore all features
                </Link>
              </div>
            </div>

            <div className="lp-chat-shell lp-reveal" data-reveal style={{ '--lp-delay': '100ms' }}>
              <MiniChatDemo />
            </div>
          </div>
        </section>

        {/* ===== TRUST ROW ===== */}
        <section className="lp-trust">
          {TRANSACTIONS.map((item, idx) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="lp-trust-card lp-reveal"
                data-reveal
                style={{ '--lp-delay': `${idx * 80}ms` }}
              >
                <div
                  className="lp-trust-icon"
                  style={{ background: item.soft, color: item.accent }}
                >
                  <Icon size={19} />
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </div>
            );
          })}
        </section>

        {/* ===== VOICES ===== */}
        <section className="lp-section">
          <div className="lp-section-head center lp-reveal" data-reveal>
            <div className="lp-kicker">
              <Quote size={13} />
              From the campus
            </div>
            <h2>Made by students, for student life.</h2>
          </div>

          <div className="lp-voices">
            {VOICES.map((voice, idx) => (
              <div
                key={voice.name}
                className="lp-voice lp-reveal"
                data-reveal
                style={{ '--lp-delay': `${idx * 90}ms` }}
              >
                <div
                  className="lp-voice-quote"
                  style={{ background: `${voice.color}18`, color: voice.color }}
                >
                  <Quote size={17} />
                </div>

                <blockquote>“{voice.quote}”</blockquote>

                <div className="lp-voice-foot">
                  <div className="lp-voice-name">{voice.name}</div>
                  <div className="lp-voice-role">{voice.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section className="lp-section" id="lp-faq">
          <div className="lp-section-head center lp-reveal" data-reveal>
            <div className="lp-kicker">
              <Clock3 size={13} />
              FAQ
            </div>
            <h2>Questions students actually ask.</h2>
            <p>Short answers. No fine print. Tap any question to open it.</p>
          </div>

          <div className="lp-faq-wrap">
            {FAQS.map((item, idx) => {
              const open = openFaq === idx;

              return (
                <div
                  key={item.q}
                  className={
                    open
                      ? 'lp-faq lp-faq-open lp-reveal'
                      : 'lp-faq lp-reveal'
                  }
                  data-reveal
                  style={{ '--lp-delay': `${idx * 60}ms` }}
                >
                  <button
                    type="button"
                    className="lp-faq-btn"
                    aria-expanded={open}
                    onClick={() =>
                      setOpenFaq(open ? -1 : idx)
                    }
                  >
                    {item.q}
                    <span className="lp-faq-chev">
                      <ChevronDown size={15} />
                    </span>
                  </button>

                  <div className="lp-faq-body">{item.a}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="lp-cta">
          <div className="lp-cta-card lp-reveal" data-reveal>
            <h2>Your campus life is waiting to be organized.</h2>
            <p>
              Join the growing student community that keeps academics, campus,
              and people in one place.
            </p>

            <div className="lp-cta-actions">
              <Link to="/signup" className="lp-cta-primary">
                Create your free account
                <ArrowRight size={16} />
              </Link>

              <Link to="/login" className="lp-cta-ghost">
                I already have an account
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <Link to="/">
              <img src={camporaLogo} alt="Campora logo" />
              Campora
            </Link>

            <p>
              One place for academics, campus, and student life. Built by
              students, for students.
            </p>
          </div>

          <div className="lp-footer-cols">
            <div className="lp-footer-col">
              <h4>Product</h4>
              <a href="#lp-demo">Take a peek</a>
              <a href="#lp-features">Features</a>
              <a href="#lp-how">How it works</a>
              <a href="#lp-faq">FAQ</a>
            </div>

            <div className="lp-footer-col">
              <h4>Explore</h4>
              <Link to="/features">All features</Link>
              <Link to="/about">About the team</Link>
              <a href="#lp-demo">Live demo</a>
            </div>

            <div className="lp-footer-col">
              <h4>Account</h4>
              <Link to="/signup">Sign up</Link>
              <Link to="/login">Log in</Link>
            </div>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <span>© {new Date().getFullYear()} Campora · Academic Portal</span>

          <span className="lp-footer-made">
            Made with
            <span className="heart">
              <Heart size={12} fill="#C76E8A" />
            </span>
            by students
          </span>
        </div>
      </footer>
    </div>
  );
}