import React, { useMemo, useState } from 'react';

import {
  Bell,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  Megaphone,
  GraduationCap,
  Users,
  CheckSquare,
} from 'lucide-react';

export default function Notifications() {
  const [activeFilter, setActiveFilter] = useState('All');

  // Empty for now so no test notification appears
  const notifications = [];

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const readCount = useMemo(
    () => notifications.filter((item) => item.read).length,
    [notifications]
  );

  const filters = [
    {
      label: 'All',
      icon: <Sparkles size={15} />,
    },
    {
      label: 'Announcements',
      icon: <Megaphone size={15} />,
    },
    {
      label: 'Courses',
      icon: <GraduationCap size={15} />,
    },
    {
      label: 'Planner',
      icon: <CalendarDays size={15} />,
    },
    {
      label: 'Study Groups',
      icon: <Users size={15} />,
    },
    {
      label: 'To-Do',
      icon: <CheckSquare size={15} />,
    },
  ];

  return (
    <div style={{ width: '100%' }}>

      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '20px',
          marginBottom: '28px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '999px',
              background: '#F1F2FF',
              color: '#6366F1',
              fontWeight: '900',
              fontSize: '12px',
              marginBottom: '12px',
            }}
          >
            <Bell size={14} />
            Stay Updated ✨
          </div>

          <h1
            style={{
              fontSize: '40px',
              fontWeight: '900',
              color: '#0B1A3F',
              marginBottom: '8px',
            }}
          >
            Notifications
          </h1>

          <p
            style={{
              color: '#A3AED0',
              fontWeight: '700',
              margin: 0,
              fontSize: '16px',
            }}
          >
            View your reminders, alerts, and important updates.
          </p>
        </div>

        <div
          style={{
            minWidth: '100px',
            textAlign: 'right',
            color: '#6366F1',
            fontWeight: '900',
            fontSize: '16px',
          }}
        >
          {unreadCount} unread
        </div>
      </div>

      {/* FILTERS */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        {filters.map((filter) => {
          const active = activeFilter === filter.label;

          return (
            <button
              key={filter.label}
              type="button"
              onClick={() => setActiveFilter(filter.label)}
              style={{
                border: active
                  ? '1.5px solid #6366F1'
                  : '1.5px solid #E5E9F4',
                background: active
                  ? 'linear-gradient(135deg, #6366F1, #7C6BF2)'
                  : '#FFFFFF',
                color: active ? '#FFFFFF' : '#667085',
                borderRadius: '999px',
                padding: '10px 15px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: active
                  ? '0 8px 20px rgba(99, 102, 241, 0.18)'
                  : 'none',
              }}
            >
              {filter.icon}
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* SUMMARY CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <SummaryCard
          label="Unread"
          value={unreadCount}
          icon={<Bell size={23} />}
          background="#F3F1FF"
          iconBackground="#E4E0FF"
          iconColor="#6366F1"
        />

        <SummaryCard
          label="Read"
          value={readCount}
          icon={<CheckCircle2 size={23} />}
          background="#ECFBF6"
          iconBackground="#D8F7EC"
          iconColor="#05CD99"
        />

        <SummaryCard
          label="This Week"
          value={notifications.length}
          icon={<CalendarDays size={23} />}
          background="#EEF8FF"
          iconBackground="#DCEFFF"
          iconColor="#4A90E2"
        />

        <SummaryCard
          label="Total"
          value={notifications.length}
          icon={<Sparkles size={23} />}
          background="#FFF7EF"
          iconBackground="#FFE8CF"
          iconColor="#FF9F43"
        />
      </div>

      {/* NOTIFICATION AREA */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '28px',
          border: '1.5px solid #E9EDF7',
          minHeight: '350px',
          padding: '28px',
          boxShadow: '0 16px 40px rgba(81, 95, 160, 0.06)',
        }}
      >
        {notifications.length === 0 ? (
          <div
            style={{
              minHeight: '290px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '82px',
                height: '82px',
                borderRadius: '26px',
                background:
                  'linear-gradient(135deg, #F1F2FF 0%, #E9E7FF 100%)',
                color: '#6366F1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px',
                boxShadow: '0 14px 30px rgba(99,102,241,0.12)',
              }}
            >
              <Bell size={38} />
            </div>

            <h2
              style={{
                margin: '0 0 8px',
                color: '#0B1A3F',
                fontSize: '24px',
                fontWeight: '900',
              }}
            >
              You’re all caught up! ✨
            </h2>

            <p
              style={{
                margin: '0 0 4px',
                color: '#A3AED0',
                fontWeight: '700',
                fontSize: '14px',
              }}
            >
              No notifications to show right now.
            </p>

            <p
              style={{
                margin: 0,
                color: '#A3AED0',
                fontWeight: '700',
                fontSize: '14px',
              }}
            >
              When there are new updates, you’ll find them here.
            </p>

            <div
              style={{
                marginTop: '26px',
                width: '100%',
                borderRadius: '20px',
                background: '#F7F5FF',
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '14px',
              }}
            >
              <InfoPill
                icon={<Megaphone size={18} />}
                text="Stay informed"
              />

              <InfoPill
                icon={<CalendarDays size={18} />}
                text="Never miss deadlines"
              />

              <InfoPill
                icon={<Users size={18} />}
                text="Be part of your campus"
              />
            </div>
          </div>
        ) : (
          <div>
            {/* Real notifications will go here later */}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  background,
  iconBackground,
  iconColor,
}) {
  return (
    <div
      style={{
        background,
        borderRadius: '22px',
        padding: '18px',
        border: '1px solid #E8ECF6',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '14px',
          background: iconBackground,
          color: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '13px',
        }}
      >
        {icon}
      </div>

      <p
        style={{
          margin: '0 0 4px',
          color: '#8F9BB3',
          fontSize: '13px',
          fontWeight: '800',
        }}
      >
        {label}
      </p>

      <h3
        style={{
          margin: 0,
          fontSize: '25px',
          fontWeight: '900',
          color: '#0B1A3F',
        }}
      >
        {value}
      </h3>
    </div>
  );
}

function InfoPill({ icon, text }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        color: '#6366F1',
        fontWeight: '900',
        fontSize: '13px',
      }}
    >
      {icon}
      {text}
    </div>
  );
}