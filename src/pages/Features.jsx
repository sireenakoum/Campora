import React from 'react';
import { Link } from 'react-router-dom';

import {
  ArrowLeft,
  Sparkles,
  LayoutDashboard,
  Megaphone,
  Bell,
  MessageSquare,
  BookOpen,
  CalendarDays,
  CheckSquare,
  Users,
  Compass,
  GraduationCap,
  AlarmClock,
  ClipboardCheck,
  Search,
} from 'lucide-react';

const NAVY = '#0B1A3F';
const BORDER = '#E5EAF1';
const MUTED = '#8B97AD';

export default function Features() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #ffffff 0%, #f7faff 55%, #edf4fb 100%)',
        color: NAVY,
        padding: '20px 48px 70px',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        {/* BACK */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: NAVY,
            fontWeight: '800',
            marginBottom: '30px',
          }}
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        {/* PAGE INTRO */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '80px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              padding: '10px 16px',
              borderRadius: '999px',
              background: '#EEF3FB',
              color: '#648CCB',
              fontWeight: '800',
              marginBottom: '18px',
            }}
          >
            <Sparkles size={18} />
            Campora Features
          </div>

          <h1
            style={{
              fontSize: '48px',
              lineHeight: '1.08',
              fontWeight: '950',
              letterSpacing: '-2px',
              marginBottom: '18px',
            }}
          >
            Everything campus,
            <br />
            <span style={{ color: '#648CCB' }}>
              all in one place.
            </span>
          </h1>

          <p
            style={{
              maxWidth: '760px',
              margin: '0 auto',
              color: '#667085',
              fontSize: '17px',
              lineHeight: '1.75',
              fontWeight: '600',
            }}
          >
            Campora brings together the tools students need to stay organized,
            informed, connected, and involved throughout university life.
            Explore each feature below to see how it works and why it matters.
          </p>
        </div>

        {/* DASHBOARD */}
        <FeatureSection
          icon={<LayoutDashboard size={29} />}
          label="Dashboard"
          title="Your campus at a glance."
          description="The Dashboard gives you a useful preview of the parts of Campora you actually use instead of repeating random statistics. You can check what is happening across your academic and campus life without opening every page first."
          preview={<DashboardPreview />}
          imageLeft={false}
          details={[
            {
              title: 'What it does',
              text: 'Summarizes today’s Planner schedule, your courses and credits, To-Do priorities, notifications and reminders, Campus Pulse, Study Groups, registration, and other Campora sections.',
            },
            {
              title: 'How to use it',
              text: 'Scroll through the Dashboard to preview each section, switch between smaller summaries where available, and open the full page when you want more detail.',
            },
            {
              title: 'Why it helps',
              text: 'You can understand what needs your attention from one page while still keeping every Campora feature easy to access.',
            },
          ]}
        />

        {/* CAMPUS HUB */}
        <FeatureSection
          icon={<Megaphone size={29} />}
          label="Campus Hub"
          title="Campus information, properly organized."
          description="Campus Hub is the university-side information center in Campora. Its navy header stays consistent with the rest of the platform, while each content section uses its own soft Campora color."
          preview={<CampusHubPreview />}
          imageLeft={true}
          details={[
            {
              title: 'What it does',
              text: 'Separates Announcements, Campus News, Events, and Resources into clear tabs, supports search and categories, and keeps pinned announcements visible.',
            },
            {
              title: 'How to use it',
              text: 'Switch between the colored tabs, search within the current section, and use category filters when you want to narrow the results.',
            },
            {
              title: 'Why it helps',
              text: 'University updates stay separate from student posts while still living inside the same Campora experience.',
            },
          ]}
        />

        {/* NOTIFICATIONS */}
        <FeatureSection
          icon={<Bell size={29} />}
          label="Notifications & Reminders"
          title="Updates, sorted where they belong."
          description="Campora separates Notifications from Reminders instead of mixing everything together. Alerts from Planner and To-Do can be placed in either section depending on what you choose."
          preview={<NotificationsPreview />}
          imageLeft={false}
          details={[
            {
              title: 'What it does',
              text: 'Shows two dedicated sections for Notifications and Reminders, with source filters for Announcements, Courses, Planner, Registration, To-Do, Study Groups, and other supported Campora updates.',
            },
            {
              title: 'How to use it',
              text: 'Choose Notifications or Reminders, filter by source, mark individual items or whole sections as read or unread, and clear items when you no longer need them.',
            },
            {
              title: 'Why it helps',
              text: 'A reminder you intentionally set does not get lost among normal updates, and you can immediately tell where every item came from.',
            },
          ]}
        />

        {/* CAMPUS PULSE */}
        <FeatureSection
          icon={<MessageSquare size={29} />}
          label="Campus Pulse"
          title="Your student community, in one feed."
          description="Campus Pulse is the student-centered side of Campora. It combines categorized student posts with comments, replies, reminders, and direct messaging."
          preview={<CampusPulsePreview />}
          imageLeft={true}
          details={[
            {
              title: 'What it does',
              text: 'Supports Clubs & Events, Questions, Campus Life, Complaints, Lost & Found, Opportunities, and other post categories, plus comments, anonymous posting, likes, reminders, and direct messages.',
            },
            {
              title: 'How to use it',
              text: 'Browse or search the feed, switch categories, create a post, reply to discussions, or open Direct Messages to search students and continue private conversations.',
            },
            {
              title: 'Why it helps',
              text: 'Student discussions and private communication stay connected without mixing them with official university announcements.',
            },
          ]}
        />

        {/* COURSES */}
        <FeatureSection
          icon={<GraduationCap size={29} />}
          label="Courses"
          title="Your semesters, courses, and credits together."
          description="Courses is organized around semesters rather than one long course list. Each semester keeps its own totals and course information while still matching the same Campora color system used elsewhere."
          preview={<CoursesPreview />}
          imageLeft={false}
          details={[
            {
              title: 'What it does',
              text: 'Lets you create semesters, add courses with credit values, track assignments, upcoming items and resources, and automatically total your semester credits.',
            },
            {
              title: 'How to use it',
              text: 'Create a semester, add the courses you are taking, enter each course’s credits, then open a course whenever you need its assignments, upcoming work, notes, or resources.',
            },
            {
              title: 'Why it helps',
              text: 'Course information stays connected to the semester it belongs to and the Dashboard can use the same data for accurate summaries.',
            },
          ]}
        />

        {/* REGISTRATION */}
        <FeatureSection
          icon={<Compass size={29} />}
          label="Registration"
          title="Plan registration without losing track."
          description="Registration has its own Campora workspace for course planning, section tracking, reminders, and student communication, using the same profile colors and messaging behavior as Study Groups and Campus Pulse."
          preview={<RegistrationPreview />}
          imageLeft={true}
          details={[
            {
              title: 'What it does',
              text: 'Keeps registration-related planning and course reminders together, while giving you access to direct messages when you need to coordinate with another student.',
            },
            {
              title: 'How to use it',
              text: 'Add or review the courses and sections you are watching, set reminders when needed, and use the messaging area without leaving the registration workflow.',
            },
            {
              title: 'Why it helps',
              text: 'Registration details are easier to follow when they are separated from normal coursework but still connected to the rest of Campora.',
            },
          ]}
        />

        {/* PLANNER */}
        <FeatureSection
          icon={<CalendarDays size={29} />}
          label="Planner"
          title="See your schedule clearly."
          description="Planner combines your calendar, schedule entries, repeat patterns, custom colors, sticky notes, and alerts in one visual workspace."
          preview={<PlannerPreview />}
          imageLeft={false}
          details={[
            {
              title: 'What it does',
              text: 'Supports classes, assignments, exams, events and personal entries with custom colors, repeating schedules, edit controls, sticky notes, and either Notification or Reminder alerts.',
            },
            {
              title: 'How to use it',
              text: 'Add an entry, choose its type and color, set its schedule and repetition, then choose None, Notification, or Reminder depending on how you want it to appear in Campora.',
            },
            {
              title: 'Why it helps',
              text: 'Your schedule stays visual and flexible while still feeding the alerts you choose into Notifications & Reminders.',
            },
          ]}
        />

        {/* TO-DO */}
        <FeatureSection
          icon={<CheckSquare size={29} />}
          label="To-Do"
          title="Priorities that are easy to act on."
          description="The To-Do page organizes active tasks by High, Medium, and Low priority using the same soft Campora color palette as the rest of the platform."
          preview={<TodoPreview />}
          imageLeft={true}
          details={[
            {
              title: 'What it does',
              text: 'Tracks high, medium, and low priority tasks, completed work, overall progress, editing, clearing, completing groups, and optional Notification or Reminder alerts.',
            },
            {
              title: 'How to use it',
              text: 'Add a task, choose its priority, optionally attach a notification or reminder, then complete, edit, or clear tasks from their priority section.',
            },
            {
              title: 'Why it helps',
              text: 'You can immediately see what matters most without turning every small responsibility into a calendar event.',
            },
          ]}
        />

        {/* STUDY GROUPS */}
        <FeatureSection
          icon={<Users size={29} />}
          label="Study Groups"
          title="Study together, connect better."
          description="Study Groups combines discoverable study circles, customizable group colors, group chat, and direct messages in one academic community space."
          preview={<StudyGroupsPreview />}
          imageLeft={false}
          details={[
            {
              title: 'What it does',
              text: 'Lets you discover and create study circles, customize group colors, chat inside groups, search students for direct messages, reply to messages, react, and pin conversations or messages.',
            },
            {
              title: 'How to use it',
              text: 'Find a circle that matches your course or goal, join it, then use the group chat or Direct Messages. You can also create your own circle and choose its visual identity.',
            },
            {
              title: 'Why it helps',
              text: 'Study communities and conversations stay easy to find, while profile colors and messaging behavior stay consistent across Campora.',
            },
          ]}
        />

        {/* FINAL CTA */}
        <section
          style={{
            background: NAVY,
            color: '#FFFFFF',
            borderRadius: '30px',
            padding: '42px 36px',
            textAlign: 'center',
            boxShadow: '0 24px 60px rgba(11, 26, 63, 0.16)',
          }}
        >
          <h2
            style={{
              fontSize: '32px',
              fontWeight: '950',
              color: '#FFFFFF',
              marginBottom: '14px',
            }}
          >
            Ready to experience Campora?
          </h2>

          <p
            style={{
              maxWidth: '650px',
              margin: '0 auto 24px',
              color: 'rgba(255,255,255,0.75)',
              fontSize: '16px',
              lineHeight: '1.7',
              fontWeight: '600',
            }}
          >
            Bring your academic life, campus updates, planning, and student
            community together in one place.
          </p>

          <Link
            to="/signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '14px 24px',
              borderRadius: '14px',
              background: '#FFFFFF',
              color: NAVY,
              textDecoration: 'none',
              fontWeight: '900',
              fontSize: '15px',
            }}
          >
            Get Started
          </Link>
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   FEATURE LAYOUT — SAME PAGE STRUCTURE
========================================================= */

function FeatureSection({
  icon,
  label,
  title,
  description,
  preview,
  imageLeft,
  details,
}) {
  const textBlock = (
    <div>
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '17px',
          background: '#EEF3FB',
          color: '#648CCB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '18px',
        }}
      >
        {icon}
      </div>

      <p
        style={{
          color: '#648CCB',
          fontWeight: '900',
          fontSize: '13px',
          letterSpacing: '1.4px',
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}
      >
        {label}
      </p>

      <h2
        style={{
          fontSize: '36px',
          lineHeight: '1.15',
          fontWeight: '950',
          marginBottom: '18px',
        }}
      >
        {title}
      </h2>

      <p
        style={{
          color: '#667085',
          fontSize: '17px',
          lineHeight: '1.8',
          fontWeight: '600',
          marginBottom: '24px',
        }}
      >
        {description}
      </p>

      {details.map((detail) => (
        <FeatureDetail
          key={detail.title}
          title={detail.title}
          text={detail.text}
        />
      ))}
    </div>
  );

  const previewBlock = (
    <div
      style={{
        borderRadius: '30px',
        overflow: 'hidden',
        border: '1px solid #DDE7F5',
        background: '#F4F7FE',
        boxShadow: '0 18px 44px rgba(11, 26, 63, 0.08)',
        padding: '16px',
      }}
    >
      {preview}
    </div>
  );

  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: imageLeft
          ? '0.95fr 1.05fr'
          : '1.05fr 0.95fr',
        gap: '52px',
        alignItems: 'center',
        marginBottom: '90px',
      }}
    >
      {imageLeft ? (
        <>
          {previewBlock}
          {textBlock}
        </>
      ) : (
        <>
          {textBlock}
          {previewBlock}
        </>
      )}
    </section>
  );
}

function FeatureDetail({ title, text }) {
  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: '18px',
        background: '#FFFFFF',
        border: '1px solid #E6EAF1',
        marginBottom: '12px',
      }}
    >
      <p
        style={{
          margin: '0 0 5px',
          fontSize: '14px',
          fontWeight: '900',
          color: NAVY,
        }}
      >
        {title}
      </p>

      <p
        style={{
          margin: 0,
          color: '#667085',
          fontSize: '14px',
          lineHeight: '1.65',
          fontWeight: '600',
        }}
      >
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   MINI PREVIEW BUILDING BLOCKS
========================================================= */

function PreviewShell({ children }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        border: `1px solid ${BORDER}`,
        overflow: 'hidden',
        minHeight: '430px',
      }}
    >
      {children}
    </div>
  );
}

function PreviewSearch() {
  return (
    <div
      style={{
        height: '34px',
        borderRadius: '999px',
        background: '#FFFFFF',
        border: `1px solid ${BORDER}`,
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        padding: '0 12px',
        color: '#A3AED0',
        fontSize: '8px',
        fontWeight: '700',
      }}
    >
      <Search size={11} />
      Search...
    </div>
  );
}

function MiniStat({ label, value, accent = NAVY, soft = '#F4F7FE' }) {
  return (
    <div
      style={{
        background: soft,
        border: `1px solid ${accent}22`,
        borderRadius: '12px',
        padding: '10px',
      }}
    >
      <div
        style={{
          color: '#8B97AD',
          fontSize: '7px',
          fontWeight: '800',
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: '3px',
          color: NAVY,
          fontSize: '15px',
          fontWeight: '950',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MiniPill({ children, color, soft, active = false }) {
  return (
    <div
      style={{
        padding: '6px 8px',
        borderRadius: '999px',
        background: active ? color : soft,
        color: active ? '#FFFFFF' : color,
        border: `1px solid ${color}44`,
        fontSize: '7px',
        fontWeight: '900',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
}

/* =========================================================
   DASHBOARD PREVIEW
========================================================= */

function DashboardPreview() {
  return (
    <PreviewShell>
      <div style={{ padding: '14px' }}>
        <PreviewSearch />

        <div
          style={{
            marginTop: '12px',
            borderRadius: '16px',
            background:
              'linear-gradient(135deg, #08152F 0%, #0B1A3F 60%, #173365 100%)',
            padding: '15px',
            color: '#FFFFFF',
          }}
        >
          <div style={{ fontSize: '7px', color: '#B8C9EA', fontWeight: '900' }}>
            WELCOME BACK
          </div>
          <div style={{ fontSize: '17px', fontWeight: '950', marginTop: '4px' }}>
            Your Campus, Your Way
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,.68)',
              fontSize: '7px',
              marginTop: '5px',
              fontWeight: '700',
            }}
          >
            Quick access to everything happening across Campora.
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '7px',
            marginTop: '10px',
          }}
        >
          <MiniStat label="COURSES" value="5" accent="#648CCB" soft="#F3F7FD" />
          <MiniStat label="CREDITS" value="15" accent="#5E9A8B" soft="#F2F9F7" />
          <MiniStat label="TO-DO" value="4" accent="#C99758" soft="#FFF9F1" />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr .9fr',
            gap: '8px',
            marginTop: '9px',
          }}
        >
          <MiniPanel title="Today's Schedule" action="Open in Planner">
            <MiniRow dot="#648CCB" title="MECH 201" sub="10:00 AM" />
            <MiniRow dot="#5E9A8B" title="Study Session" sub="2:30 PM" />
          </MiniPanel>

          <MiniPanel title="To-Do">
            <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
              <MiniPill color="#C76E7D" soft="#FFF5F6" active>High</MiniPill>
              <MiniPill color="#C99758" soft="#FFF9F1">Medium</MiniPill>
              <MiniPill color="#648CCB" soft="#F3F7FD">Low</MiniPill>
            </div>
            <MiniRow dot="#C76E7D" title="Finish assignment" sub="High priority" />
          </MiniPanel>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          <MiniPanel title="Campus Pulse">
            <MiniRow dot="#D9896A" title="Campus Life" sub="New student post" />
          </MiniPanel>
          <MiniPanel title="Study Groups">
            <MiniRow dot="#8B78B8" title="MECH Study Circle" sub="2 new messages" />
          </MiniPanel>
        </div>
      </div>
    </PreviewShell>
  );
}

/* =========================================================
   CAMPUS HUB PREVIEW
========================================================= */

function CampusHubPreview() {
  return (
    <PreviewShell>
      <div
        style={{
          padding: '16px',
          background:
            'linear-gradient(135deg, #08152F 0%, #0B1A3F 56%, #142B5A 100%)',
          color: '#FFFFFF',
        }}
      >
        <div style={{ fontSize: '7px', color: '#AFC6F2', fontWeight: '900' }}>
          YOUR CAMPUS HUB
        </div>
        <div style={{ fontSize: '18px', fontWeight: '950', marginTop: '3px' }}>
          Campus Hub
        </div>
        <div
          style={{
            marginTop: '5px',
            fontSize: '7px',
            color: 'rgba(255,255,255,.72)',
            fontWeight: '700',
          }}
        >
          Everything happening around campus, all in one place.
        </div>
      </div>

      <div style={{ padding: '12px' }}>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <MiniPill color="#E77D94" soft="#FFF4F6" active>Announcements</MiniPill>
          <MiniPill color="#5E9A8B" soft="#F2F9F7">Campus News</MiniPill>
          <MiniPill color="#D9896A" soft="#FFF6F2">Events</MiniPill>
          <MiniPill color="#648CCB" soft="#F3F7FD">Resources</MiniPill>
        </div>

        <div
          style={{
            marginTop: '10px',
            background: '#FFF4F6',
            border: '1px solid #F6DCE2',
            borderRadius: '12px',
            padding: '10px',
          }}
        >
          <div style={{ color: '#E77D94', fontSize: '7px', fontWeight: '950' }}>
            PINNED ANNOUNCEMENT
          </div>
          <div style={{ color: NAVY, fontSize: '10px', fontWeight: '900', marginTop: '4px' }}>
            Registration opens Monday
          </div>
        </div>

        <div style={{ marginTop: '9px' }}>
          <PreviewSearch />
        </div>

        <div style={{ marginTop: '9px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <MiniAnnouncement title="Academic calendar update" category="Academic" />
          <MiniAnnouncement title="Campus services notice" category="Campus" />
          <MiniAnnouncement title="Library hours extended" category="Student Life" />
        </div>
      </div>
    </PreviewShell>
  );
}

/* =========================================================
   NOTIFICATIONS PREVIEW
========================================================= */

function NotificationsPreview() {
  return (
    <PreviewShell>
      <div style={{ padding: '14px' }}>
        <div
          style={{
            display: 'inline-flex',
            padding: '6px 9px',
            borderRadius: '999px',
            border: '1px solid #DDE3EE',
            color: NAVY,
            fontSize: '7px',
            fontWeight: '900',
            marginBottom: '7px',
          }}
        >
          YOUR CAMPUS HUB
        </div>

        <div style={{ fontSize: '19px', fontWeight: '950', color: NAVY }}>
          Notifications
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginTop: '11px',
          }}
        >
          <SectionPreviewCard
            icon={<Bell size={15} />}
            title="Notifications"
            count="4"
            accent="#648CCB"
            soft="#F3F7FD"
            active
          />
          <SectionPreviewCard
            icon={<AlarmClock size={15} />}
            title="Reminders"
            count="3"
            accent="#8B78B8"
            soft="#F7F4FC"
          />
        </div>

        <div
          style={{
            marginTop: '10px',
            border: `1px solid ${BORDER}`,
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '9px',
              borderBottom: `1px solid ${BORDER}`,
              fontSize: '10px',
              fontWeight: '900',
            }}
          >
            Notifications
          </div>

          <div
            style={{
              padding: '8px',
              background: '#F8FAFD',
              display: 'flex',
              gap: '4px',
              flexWrap: 'wrap',
            }}
          >
            <MiniPill color={NAVY} soft="#EEF2F8" active>All</MiniPill>
            <MiniPill color="#E77D94" soft="#FFF4F6">Announcements</MiniPill>
            <MiniPill color="#648CCB" soft="#F3F7FD">Planner</MiniPill>
            <MiniPill color="#C99758" soft="#FFF9F1">To-Do</MiniPill>
          </div>

          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <MiniNotification
              color="#648CCB"
              soft="#F3F7FD"
              label="PLANNER"
              title="Study Session"
            />
            <MiniNotification
              color="#C99758"
              soft="#FFF9F1"
              label="TO-DO"
              title="Finish assignment"
            />
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

/* =========================================================
   CAMPUS PULSE PREVIEW
========================================================= */

function CampusPulsePreview() {
  return (
    <PreviewShell>
      <div style={{ padding: '14px' }}>
        <div style={{ fontSize: '7px', color: NAVY, fontWeight: '900' }}>
          CAMPUS FEED
        </div>
        <div style={{ fontSize: '19px', fontWeight: '950', marginTop: '3px' }}>
          Campus Pulse
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
          <MiniPill color={NAVY} soft="#F4F7FE" active>Feed</MiniPill>
          <MiniPill color={NAVY} soft="#F4F7FE">Direct Messages</MiniPill>
        </div>

        <div style={{ marginTop: '9px' }}>
          <PreviewSearch />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '4px',
            overflow: 'hidden',
            marginTop: '8px',
          }}
        >
          <MiniPill color={NAVY} soft="#F4F7FE" active>All</MiniPill>
          <MiniPill color="#5E9A8B" soft="#F2F9F7">Clubs & Events</MiniPill>
          <MiniPill color="#648CCB" soft="#F3F7FD">Questions</MiniPill>
        </div>

        <div
          style={{
            marginTop: '10px',
            border: '1px solid #F3DDD4',
            borderTop: '7px solid #D9896A',
            borderRadius: '14px',
            padding: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
              <MiniAvatar text="LM" color="#648CCB" />
              <div>
                <div style={{ fontSize: '8px', fontWeight: '900' }}>Lara Mortada</div>
                <div style={{ fontSize: '6px', color: '#A3AED0', marginTop: '2px' }}>Today</div>
              </div>
            </div>
            <MiniPill color="#D9896A" soft="#FFF6F2">Campus Life</MiniPill>
          </div>

          <div style={{ marginTop: '9px', fontSize: '10px', fontWeight: '900' }}>
            Anyone studying in the library later?
          </div>
          <div style={{ marginTop: '5px', fontSize: '7px', color: '#718096', lineHeight: 1.5 }}>
            Looking for a study buddy for the afternoon.
          </div>

          <div
            style={{
              borderTop: '1px solid #F3DDD4',
              marginTop: '9px',
              paddingTop: '7px',
              display: 'flex',
              gap: '12px',
              color: '#94A3B8',
              fontSize: '7px',
              fontWeight: '800',
            }}
          >
            <span>♡ 8</span>
            <span>Comments 3</span>
            <span>Remind me</span>
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

/* =========================================================
   COURSES PREVIEW
========================================================= */

function CoursesPreview() {
  return (
    <PreviewShell>
      <div style={{ padding: '14px' }}>
        <div style={{ fontSize: '19px', fontWeight: '950' }}>Courses</div>
        <div style={{ fontSize: '7px', color: MUTED, marginTop: '4px', fontWeight: '700' }}>
          Manage semesters, courses, credits, and coursework.
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '5px',
            marginTop: '10px',
          }}
        >
          <MiniStat label="COURSES" value="5" accent="#648CCB" soft="#F3F7FD" />
          <MiniStat label="ASSIGNMENTS" value="7" accent="#C76E7D" soft="#FFF5F6" />
          <MiniStat label="UPCOMING" value="3" accent="#D9896A" soft="#FFF6F2" />
          <MiniStat label="RESOURCES" value="12" accent="#5E9A8B" soft="#F2F9F7" />
          <MiniStat label="CREDITS" value="15" accent="#8B78B8" soft="#F7F4FC" />
        </div>

        <div
          style={{
            marginTop: '10px',
            border: `1px solid ${BORDER}`,
            borderRadius: '14px',
            padding: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '7px', color: '#648CCB', fontWeight: '900' }}>SEMESTER</div>
              <div style={{ fontSize: '12px', fontWeight: '950', marginTop: '2px' }}>Fall 2026</div>
            </div>
            <div style={{ fontSize: '8px', color: MUTED, fontWeight: '800' }}>15 credits</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '9px' }}>
            <CourseMiniRow code="MECH 201" credits="3 cr" accent="#648CCB" />
            <CourseMiniRow code="MATH 251" credits="3 cr" accent="#5E9A8B" />
            <CourseMiniRow code="EECE 230" credits="3 cr" accent="#D9896A" />
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

/* =========================================================
   REGISTRATION PREVIEW
========================================================= */

function RegistrationPreview() {
  return (
    <PreviewShell>
      <div style={{ padding: '14px' }}>
        <div style={{ fontSize: '19px', fontWeight: '950' }}>Registration</div>
        <div style={{ fontSize: '7px', color: MUTED, marginTop: '4px', fontWeight: '700' }}>
          Keep your course registration planning organized.
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
          <MiniPill color={NAVY} soft="#F4F7FE" active>Course Planner</MiniPill>
          <MiniPill color="#648CCB" soft="#F3F7FD">Direct Messages</MiniPill>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            marginTop: '10px',
          }}
        >
          <MiniStat label="WATCHING" value="4" accent="#648CCB" soft="#F3F7FD" />
          <MiniStat label="REMINDERS" value="2" accent="#8B78B8" soft="#F7F4FC" />
          <MiniStat label="AVAILABLE" value="1" accent="#5E9A8B" soft="#F2F9F7" />
        </div>

        <div
          style={{
            marginTop: '9px',
            border: `1px solid ${BORDER}`,
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '9px',
              background: '#F8FAFD',
              fontSize: '8px',
              fontWeight: '900',
            }}
          >
            Watched Sections
          </div>
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <RegistrationRow course="MECH 201" section="Section 1" color="#648CCB" />
            <RegistrationRow course="MATH 251" section="Section 4" color="#5E9A8B" />
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

/* =========================================================
   PLANNER PREVIEW
========================================================= */

function PlannerPreview() {
  return (
    <PreviewShell>
      <div style={{ padding: '14px' }}>
        <div style={{ fontSize: '19px', fontWeight: '950' }}>Planner</div>
        <div style={{ fontSize: '7px', color: MUTED, marginTop: '4px', fontWeight: '700' }}>
          Your schedule, colors, repeats, notes, and alerts.
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.3fr .7fr',
            gap: '8px',
            marginTop: '10px',
          }}
        >
          <div
            style={{
              border: `1px solid ${BORDER}`,
              borderRadius: '14px',
              padding: '8px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '3px',
                fontSize: '6px',
                color: MUTED,
                textAlign: 'center',
              }}
            >
              {['M','T','W','T','F','S','S'].map((d, i) => <div key={i}>{d}</div>)}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '3px',
                marginTop: '5px',
              }}
            >
              {Array.from({ length: 21 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    minHeight: '24px',
                    borderRadius: '5px',
                    background:
                      i === 9 ? '#F3F7FD' :
                      i === 11 ? '#F2F9F7' :
                      i === 16 ? '#FFF6F2' :
                      '#FAFBFD',
                    border: '1px solid #EEF1F5',
                    fontSize: '5px',
                    padding: '2px',
                    color: NAVY,
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <MiniPanel title="Sticky Notes">
            <div
              style={{
                background: '#FFF9F1',
                border: '1px solid #F0E2CB',
                borderRadius: '8px',
                padding: '7px',
                fontSize: '7px',
                fontWeight: '800',
              }}
            >
              Review chapter 4
            </div>
            <div
              style={{
                background: '#F3F7FD',
                border: '1px solid #DDE7F5',
                borderRadius: '8px',
                padding: '7px',
                fontSize: '7px',
                fontWeight: '800',
                marginTop: '5px',
              }}
            >
              Bring lab notes
            </div>
          </MiniPanel>
        </div>

        <div
          style={{
            marginTop: '9px',
            display: 'flex',
            gap: '5px',
          }}
        >
          <MiniPill color="#75839A" soft="#F6F8FB">None</MiniPill>
          <MiniPill color="#648CCB" soft="#F3F7FD" active>Notification</MiniPill>
          <MiniPill color="#8B78B8" soft="#F7F4FC">Reminder</MiniPill>
        </div>
      </div>
    </PreviewShell>
  );
}

/* =========================================================
   TODO PREVIEW
========================================================= */

function TodoPreview() {
  return (
    <PreviewShell>
      <div style={{ padding: '14px' }}>
        <div style={{ fontSize: '19px', fontWeight: '950' }}>To-Do List</div>
        <div style={{ fontSize: '7px', color: MUTED, marginTop: '4px', fontWeight: '700' }}>
          Organize tasks by priority and stay on top of progress.
        </div>

        <div
          style={{
            marginTop: '10px',
            background: NAVY,
            borderRadius: '13px',
            padding: '10px',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', fontWeight: '900' }}>
            <span>Your Progress</span>
            <span>60%</span>
          </div>
          <div
            style={{
              height: '5px',
              background: 'rgba(255,255,255,.18)',
              borderRadius: '999px',
              marginTop: '7px',
              overflow: 'hidden',
            }}
          >
            <div style={{ width: '60%', height: '100%', background: '#FFFFFF' }} />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            marginTop: '9px',
          }}
        >
          <PriorityMiniCard title="High Priority" count="2" color="#C76E7D" soft="#FFF5F6" />
          <PriorityMiniCard title="Medium Priority" count="1" color="#C99758" soft="#FFF9F1" />
          <PriorityMiniCard title="Low Priority" count="2" color="#648CCB" soft="#F3F7FD" />
        </div>

        <div
          style={{
            marginTop: '9px',
            border: `1px solid ${BORDER}`,
            borderRadius: '13px',
            padding: '8px',
          }}
        >
          <MiniRow dot="#C76E7D" title="Finish design report" sub="High priority • Reminder" />
          <MiniRow dot="#648CCB" title="Review lecture" sub="Low priority • Notification" />
        </div>
      </div>
    </PreviewShell>
  );
}

/* =========================================================
   STUDY GROUPS PREVIEW
========================================================= */

function StudyGroupsPreview() {
  return (
    <PreviewShell>
      <div style={{ padding: '14px' }}>
        <div style={{ fontSize: '19px', fontWeight: '950' }}>Study Groups</div>
        <div style={{ fontSize: '7px', color: MUTED, marginTop: '4px', fontWeight: '700' }}>
          Find circles, collaborate, and keep conversations together.
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
          <MiniPill color={NAVY} soft="#F4F7FE" active>Study Groups</MiniPill>
          <MiniPill color={NAVY} soft="#F4F7FE">Direct Messages</MiniPill>
        </div>

        <div
          style={{
            marginTop: '9px',
            display: 'grid',
            gridTemplateColumns: '.9fr 1.1fr',
            gap: '7px',
            minHeight: '250px',
          }}
        >
          <div
            style={{
              border: `1px solid ${BORDER}`,
              borderRadius: '12px',
              padding: '7px',
            }}
          >
            <PreviewSearch />
            <div style={{ marginTop: '7px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <ConversationMini name="Nour" color="#648CCB" />
              <ConversationMini name="Yasmin" color="#5E9A8B" />
              <ConversationMini name="Sireen" color="#D9896A" />
            </div>
          </div>

          <div
            style={{
              border: `1px solid ${BORDER}`,
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '8px',
                borderBottom: `1px solid ${BORDER}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <MiniAvatar text="NO" color="#648CCB" />
              <div style={{ fontSize: '8px', fontWeight: '900' }}>Nour</div>
            </div>

            <div
              style={{
                flex: 1,
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                justifyContent: 'flex-end',
              }}
            >
              <ChatBubble mine={false}>Are we studying chapter 5?</ChatBubble>
              <ChatBubble mine>
                <div
                  style={{
                    fontSize: '6px',
                    opacity: .75,
                    borderLeft: '2px solid rgba(255,255,255,.7)',
                    paddingLeft: '4px',
                    marginBottom: '4px',
                  }}
                >
                  Replying to Nour
                </div>
                Yes, after class!
              </ChatBubble>
              <div style={{ alignSelf: 'flex-end', fontSize: '8px' }}>❤️ 1</div>
            </div>

            <div
              style={{
                borderTop: `1px solid ${BORDER}`,
                padding: '7px',
                display: 'flex',
                gap: '5px',
              }}
            >
              <div
                style={{
                  height: '26px',
                  borderRadius: '999px',
                  background: '#F8FAFC',
                  border: `1px solid ${BORDER}`,
                  flex: 1,
                }}
              />
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: NAVY,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

/* =========================================================
   SMALL PREVIEW COMPONENTS
========================================================= */

function MiniPanel({ title, action, children }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: `1px solid ${BORDER}`,
        borderRadius: '12px',
        padding: '9px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '6px',
          marginBottom: '7px',
        }}
      >
        <div style={{ fontSize: '8px', fontWeight: '900', color: NAVY }}>{title}</div>
        {action && (
          <div style={{ fontSize: '5.5px', color: '#648CCB', fontWeight: '900' }}>
            {action}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function MiniRow({ dot, title, sub }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 0',
      }}
    >
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: dot,
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '7px', color: NAVY, fontWeight: '900' }}>{title}</div>
        <div style={{ fontSize: '5.5px', color: '#A3AED0', marginTop: '1px' }}>{sub}</div>
      </div>
    </div>
  );
}

function MiniAnnouncement({ title, category }) {
  return (
    <div
      style={{
        border: `1px solid ${BORDER}`,
        borderRadius: '10px',
        padding: '8px',
        background: '#FFFFFF',
      }}
    >
      <div style={{ fontSize: '7px', fontWeight: '900' }}>{title}</div>
      <div style={{ fontSize: '5.5px', color: '#A3AED0', marginTop: '3px' }}>{category}</div>
    </div>
  );
}

function SectionPreviewCard({ icon, title, count, accent, soft, active }) {
  return (
    <div
      style={{
        border: active ? `1.5px solid ${accent}88` : `1px solid ${BORDER}`,
        borderRadius: '14px',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#FFFFFF',
        boxShadow: active ? `0 7px 18px ${accent}18` : 'none',
      }}
    >
      <div
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '9px',
          background: soft,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '8px', fontWeight: '900' }}>{title}</div>
      </div>
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '8px',
          background: '#F6F8FB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '7px',
          fontWeight: '900',
        }}
      >
        {count}
      </div>
    </div>
  );
}

function MiniNotification({ color, soft, label, title }) {
  return (
    <div
      style={{
        border: `1px solid ${color}33`,
        borderLeft: `3px solid ${color}`,
        background: soft,
        borderRadius: '9px',
        padding: '7px',
      }}
    >
      <div style={{ fontSize: '5.5px', color, fontWeight: '950' }}>{label}</div>
      <div style={{ marginTop: '3px', fontSize: '7px', color: NAVY, fontWeight: '900' }}>
        {title}
      </div>
    </div>
  );
}

function MiniAvatar({ text, color }) {
  return (
    <div
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: color,
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '6px',
        fontWeight: '950',
        flexShrink: 0,
      }}
    >
      {text}
    </div>
  );
}

function CourseMiniRow({ code, credits, accent }) {
  return (
    <div
      style={{
        border: `1px solid ${accent}33`,
        borderLeft: `4px solid ${accent}`,
        borderRadius: '9px',
        padding: '7px 8px',
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ fontSize: '8px', fontWeight: '900' }}>{code}</div>
      <div style={{ fontSize: '6px', color: MUTED, fontWeight: '800' }}>{credits}</div>
    </div>
  );
}

function RegistrationRow({ course, section, color }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: `1px solid ${color}33`,
        borderRadius: '9px',
        padding: '7px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color }} />
        <div>
          <div style={{ fontSize: '7px', fontWeight: '900' }}>{course}</div>
          <div style={{ fontSize: '5.5px', color: MUTED }}>{section}</div>
        </div>
      </div>
      <div style={{ fontSize: '6px', color: '#8B78B8', fontWeight: '900' }}>Reminder</div>
    </div>
  );
}

function PriorityMiniCard({ title, count, color, soft }) {
  return (
    <div
      style={{
        background: soft,
        border: `1px solid ${color}33`,
        borderRadius: '11px',
        padding: '8px',
      }}
    >
      <div style={{ fontSize: '6px', color, fontWeight: '900' }}>{title}</div>
      <div style={{ marginTop: '3px', fontSize: '14px', fontWeight: '950' }}>{count}</div>
    </div>
  );
}

function ConversationMini({ name, color }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px',
        borderRadius: '9px',
        background: '#F8FAFC',
      }}
    >
      <MiniAvatar text={name.slice(0, 2).toUpperCase()} color={color} />
      <div>
        <div style={{ fontSize: '7px', fontWeight: '900' }}>{name}</div>
        <div style={{ fontSize: '5px', color: MUTED }}>Last message...</div>
      </div>
    </div>
  );
}

function ChatBubble({ mine, children }) {
  return (
    <div
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '78%',
        borderRadius: '12px',
        borderBottomRightRadius: mine ? '4px' : '12px',
        borderBottomLeftRadius: mine ? '12px' : '4px',
        background: mine ? NAVY : '#F1F5F9',
        color: mine ? '#FFFFFF' : NAVY,
        padding: '7px 8px',
        fontSize: '6.5px',
        fontWeight: '700',
        lineHeight: 1.4,
      }}
    >
      {children}
    </div>
  );
}
