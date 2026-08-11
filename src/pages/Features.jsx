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
} from 'lucide-react';

import dashboardImg from '../assets/dashboard.png';
import announcementsImg from '../assets/announcements.png';
import notificationsImg from '../assets/notifications.png';
import campusPulseImg from '../assets/campuspulse.png';
import coursesImg from '../assets/courses.png';
import plannerImg from '../assets/planner.png';
import todoImg from '../assets/to_do.png';
import studyGroupsImg from '../assets/studygroups.png';

export default function Features() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #ffffff 0%, #f8f9ff 55%, #eef1ff 100%)',
        color: '#0B1A3F',
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
            color: '#0B1A3F',
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
              background: '#F1F3FF',
              color: '#5B5FEF',
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
            <span style={{ color: '#6366F1' }}>
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
          description="The Dashboard is the central starting point for Campora. It gives students one place to access the different parts of their academic and campus life without having to jump between disconnected tools."
          image={dashboardImg}
          alt="Campora Dashboard"
          imageLeft={false}
          details={[
            {
              title: 'What it does',
              text: 'Acts as the main hub for your Campora experience, giving you quick access to announcements, notifications, courses, your planner, to-do list, Campus Pulse, and study groups.',
            },
            {
              title: 'How to use it',
              text: 'After logging in, start from the Dashboard and use the navigation menu to move directly to the feature you need.',
            },
            {
              title: 'Why it helps',
              text: 'It keeps the platform organized around one central space, making it easier to find what you need and move between academic, organizational, and community tools.',
            },
          ]}
        />

        {/* ANNOUNCEMENTS */}
        <FeatureSection
          icon={<Megaphone size={29} />}
          label="Announcements & Campus Hub"
          title="Important campus information, easier to find."
          description="The Campus Hub gives students a dedicated place to keep up with important university information. Students can view announcements, browse campus news, discover events, and access useful resources without searching across multiple places."
          image={announcementsImg}
          alt="Campora Announcements and Campus Hub"
          imageLeft={true}
          details={[
            {
              title: 'What it does',
              text: 'Organizes campus information into clear sections such as announcements, campus news, events, and resources. Important updates can also be pinned so urgent information stays visible.',
            },
            {
              title: 'How to use it',
              text: 'Open the Campus Hub, move between the available categories, use search to find specific information, and apply filters when you want to narrow down what you see.',
            },
            {
              title: 'Why it helps',
              text: 'It reduces the chance of missing important university updates and gives students one reliable place to check what is happening around campus.',
            },
          ]}
        />

        {/* NOTIFICATIONS */}
        <FeatureSection
          icon={<Bell size={29} />}
          label="Notifications"
          title="Never miss what matters."
          description="Campora keeps reminders, alerts, and important updates in one dedicated space. Students can quickly see what is new, what still needs attention, and what has already been read."
          image={notificationsImg}
          alt="Campora Notifications"
          imageLeft={false}
          details={[
            {
              title: 'What it does',
              text: 'Displays personalized notifications and reminders, clearly separates unread and read items, and keeps important updates organized by time and status.',
            },
            {
              title: 'How to use it',
              text: 'Open the Notifications page to review your latest alerts. Read new notifications, mark them as read, and return whenever you want to check for new reminders or updates.',
            },
            {
              title: 'Why it helps',
              text: 'It makes important information harder to overlook and helps students stay aware of deadlines, reminders, and changes without constantly checking every part of the platform.',
            },
          ]}
        />

        {/* CAMPUS PULSE */}
        <FeatureSection
          icon={<MessageSquare size={29} />}
          label="Campus Pulse"
          title="Your student community, in one feed."
          description="Campus Pulse is Campora's student community space. It gives students a place to share information, ask questions, discover what is happening around campus, and interact with other students."
          image={campusPulseImg}
          alt="Campora Campus Pulse"
          imageLeft={true}
          details={[
            {
              title: 'What it does',
              text: 'Lets students create and browse posts across categories such as Clubs & Events, Questions, Campus Life, Complaints, Lost & Found, Opportunities, and more.',
            },
            {
              title: 'How to use it',
              text: 'Browse the feed, search for a topic, filter posts by category, create your own post, and interact with other students through comments and discussions.',
            },
            {
              title: 'Why it helps',
              text: 'It brings student knowledge and campus conversations into one shared space, making it easier to find answers, opportunities, events, and useful information from the student community.',
            },
          ]}
        />

        {/* COURSES */}
        <FeatureSection
          icon={<BookOpen size={29} />}
          label="Courses"
          title="Keep your academic world organized."
          description="The Courses section gives students a dedicated place to manage the classes they are taking and keep course-related information within the same platform as the rest of their academic tools."
          image={coursesImg}
          alt="Campora Courses"
          imageLeft={false}
          details={[
            {
              title: 'What it does',
              text: 'Lets students add and manage their courses in Campora, creating a central academic space that can work alongside planning, reminders, resources, and other student tools.',
            },
            {
              title: 'How to use it',
              text: 'Open the Courses page and use the Add Course option to build your personal course list. From there, you can return to your courses whenever you need to review or manage them.',
            },
            {
              title: 'Why it helps',
              text: 'Keeping your courses inside Campora makes it easier to organize your academic life around the classes you are actually taking instead of keeping course information separate from your planner and tasks.',
            },
          ]}
        />

        {/* PLANNER */}
        <FeatureSection
          icon={<CalendarDays size={29} />}
          label="Planner"
          title="See your schedule clearly."
          description="The Planner gives students a visual way to organize their time. Students can switch between month, week, and day views, review their agenda, and use personal sticky notes for quick reminders."
          image={plannerImg}
          alt="Campora Planner"
          imageLeft={true}
          details={[
            {
              title: 'What it does',
              text: 'Combines a calendar, daily agenda, and personal sticky notes so students can organize classes, events, deadlines, and other plans in one visual space.',
            },
            {
              title: 'How to use it',
              text: 'Choose between Month, Week, or Day view, navigate through your schedule, review your agenda, and add plans or quick reminders using the available planner tools.',
            },
            {
              title: 'Why it helps',
              text: 'A visual schedule makes busy weeks easier to understand and helps students plan ahead instead of relying on memory or scattered notes.',
            },
          ]}
        />

        {/* TO-DO */}
        <FeatureSection
          icon={<CheckSquare size={29} />}
          label="To-Do List"
          title="Turn plans into action."
          description="The To-Do List gives students a simple place to keep track of personal tasks, priorities, and small responsibilities that do not necessarily belong on a calendar."
          image={todoImg}
          alt="Campora To-Do List"
          imageLeft={false}
          details={[
            {
              title: 'What it does',
              text: 'Lets students create personal tasks, keep them organized in one list, and track what still needs to be completed.',
            },
            {
              title: 'How to use it',
              text: 'Type the task you want to remember, add it to your list, and use the page throughout the day to keep track of what you still need to finish.',
            },
            {
              title: 'Why it helps',
              text: 'It gives students a quick place to capture assignments, errands, study goals, and other responsibilities instead of trying to remember everything.',
            },
          ]}
        />

        {/* STUDY GROUPS */}
        <FeatureSection
          icon={<Users size={29} />}
          label="Study Groups"
          title="Study together, connect better."
          description="Study Groups helps students find and build academic communities around shared courses, topics, majors, and study goals. Students can discover existing circles, create their own, join groups, and connect with other students."
          image={studyGroupsImg}
          alt="Campora Study Groups"
          imageLeft={true}
          details={[
            {
              title: 'What it does',
              text: 'Lets students discover study circles, create new circles, view groups they have joined, search by topic, class, or major, access direct messages, and manage group preferences.',
            },
            {
              title: 'How to use it',
              text: 'Search for a circle that matches your interests, open it to learn more, and join if it fits what you need. If the right group does not exist yet, create your own circle and let other students discover it.',
            },
            {
              title: 'Why it helps',
              text: 'It makes finding study partners and academic communities much easier, especially in large courses where students may not already know who shares their goals or interests.',
            },
          ]}
        />

        {/* FINAL CTA */}
        <section
          style={{
            background: '#0B1A3F',
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
              color: '#0B1A3F',
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

function FeatureSection({
  icon,
  label,
  title,
  description,
  image,
  alt,
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
          background: '#F1F2FF',
          color: '#6366F1',
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
          color: '#6366F1',
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

  const imageBlock = (
    <div
      style={{
        borderRadius: '30px',
        overflow: 'hidden',
        border: '1px solid #E2E6FF',
        background: '#FFFFFF',
        boxShadow: '0 24px 60px rgba(11, 26, 63, 0.10)',
      }}
    >
      <img
        src={image}
        alt={alt}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
        }}
      />
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
          {imageBlock}
          {textBlock}
        </>
      ) : (
        <>
          {textBlock}
          {imageBlock}
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
        border: '1px solid #E6E9F8',
        marginBottom: '12px',
      }}
    >
      <p
        style={{
          margin: '0 0 5px',
          fontSize: '14px',
          fontWeight: '900',
          color: '#0B1A3F',
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