import React from "react";
import { formatClassBadge, formatDueLabel, formatPrice, formatTimeRange, formatToday } from "../../lib/format";

function ProgressRing({ percent, label }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  return (
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-20 h-20 -rotate-90">
          <circle className="text-surface-container" cx="40" cy="40" fill="transparent" r={radius} stroke="currentColor" strokeWidth="8" />
          <circle
            className="text-secondary"
            cx="40"
            cy="40"
            fill="transparent"
            r={radius}
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-xs font-bold text-primary">{percent}%</span>
      </div>
      <p className="text-[11px] font-bold text-on-surface-variant mt-3 uppercase">{label}</p>
    </div>
  );
}

function DeadlineItem({ title, tag, tagStyle, percent, left, right }) {
  return (
    <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/10">
      <div className="flex justify-between items-center mb-2">
        <h5 className="font-bold text-primary text-sm">{title}</h5>
        <span
          className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold ${
            tagStyle === "error" ? "bg-error/10 text-error" : "bg-secondary/10 text-secondary"
          }`}
        >
          {tag}
        </span>
      </div>
      <div className="w-full bg-surface-container h-1.5 rounded-full mb-2">
        <div className="bg-secondary h-full rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

export default function DashboardContent({ dashboard, onAskAssistant }) {
  if (!dashboard) {
    return (
      <div className="px-container-padding pb-container-padding">
        <p className="text-on-surface-variant">Loading dashboard...</p>
      </div>
    );
  }

  const { profile, classes, deadlines, briefingItems, campusEvents, marketplaceListings } = dashboard;
  const unread = briefingItems.find((item) => item.type === "unread");
  const urgent = briefingItems.find((item) => item.type === "urgent");

  return (
    <div className="px-container-padding pb-container-padding">
      {/* Greeting & Status */}
      <section className="mb-stack-lg">
        <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">{formatToday()}</p>
        <h2 className="text-3xl font-bold text-primary">
          Hello <span className="text-secondary">{profile.name}</span>
        </h2>
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <p className="text-base text-on-surface-variant">
            You have {classes.length} classes today and {deadlines.length} deadlines approaching.
          </p>
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full border-2 border-surface bg-blue-100" />
            <div className="w-6 h-6 rounded-full border-2 border-surface bg-green-100" />
            <div className="w-6 h-6 rounded-full border-2 border-surface bg-yellow-100 text-[8px] flex items-center justify-center font-bold text-on-surface-variant">
              +10
            </div>
          </div>
          <span className="text-sm text-on-surface-variant/70 italic">{profile.friends_online} friends online</span>
        </div>
      </section>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-gutter">
          {/* Intelligence Briefing */}
          <div className="relative overflow-hidden rounded-[24px] bg-secondary-container p-8 text-white">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <span className="material-symbols-outlined text-[128px] text-white">auto_awesome</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/80">Intelligence Briefing</h3>
              </div>
              <p className="text-2xl font-bold mb-6 text-white">Your day is looking productive.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {unread && (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                    <span className="text-[10px] font-bold uppercase text-white/60 mb-2 block">{unread.label}</span>
                    <p className="text-sm text-white">{unread.body}</p>
                  </div>
                )}
                {urgent && (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                    <span className="text-[10px] font-bold uppercase text-white/60 mb-2 block">{urgent.label}</span>
                    <p className="text-sm text-white">{urgent.body}</p>
                  </div>
                )}
              </div>
              <button
                onClick={onAskAssistant}
                className="mt-6 bg-white text-secondary px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-surface-container-lowest transition-colors"
              >
                <span className="material-symbols-outlined text-xl">chat_bubble</span>
                Ask Assistant
              </button>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border-l-4 border-secondary/40"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-surface-container p-2 rounded-lg">
                    <span className="material-symbols-outlined text-secondary">{cls.icon}</span>
                  </div>
                  <span className="bg-secondary/10 text-secondary text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                    {formatClassBadge(cls.starts_at)}
                  </span>
                </div>
                <h4 className="font-bold text-primary text-lg mb-1">{cls.title}</h4>
                <p className="text-sm text-on-surface-variant mb-4">
                  {cls.professor} • {cls.location}
                </p>
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span className="text-sm font-bold">{formatTimeRange(cls.starts_at, cls.ends_at)}</span>
                  {cls.join_type === "video" && (
                    <a className="text-secondary font-bold text-sm flex items-center gap-1 hover:underline" href={cls.join_url || "#"}>
                      <span className="material-symbols-outlined text-sm">videocam</span>
                      Join Online
                    </a>
                  )}
                  {cls.join_type === "map" && (
                    <a className="text-on-surface-variant font-bold text-sm flex items-center gap-1 hover:underline" href={cls.join_url || "#"}>
                      <span className="material-symbols-outlined text-sm">map</span>
                      View Map
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Campus Events */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-primary">Campus Events</h3>
              <div className="flex gap-2">
                <button className="p-2 bg-white rounded-full shadow-sm hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-sm text-primary">chevron_left</span>
                </button>
                <button className="p-2 bg-white rounded-full shadow-sm hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-sm text-primary">chevron_right</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
              {campusEvents.map((event) => (
                <div
                  key={event.id}
                  className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer bg-surface-container"
                  style={event.image_url ? { backgroundImage: `url(${event.image_url})`, backgroundSize: "cover" } : undefined}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">{event.category}</span>
                    <h4 className="text-white font-bold text-lg">{event.title}</h4>
                    <p className="text-white/70 text-xs mt-1">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-gutter">
          {/* Semester Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-6">Semester Progress</h3>
            <div className="flex justify-around gap-4">
              <ProgressRing percent={profile.credits_percent} label="Credits Done" />
              <ProgressRing percent={profile.attendance_percent} label="Attendance" />
            </div>
          </div>

          {/* Deadlines */}
          <div className="bg-white rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Deadlines</h3>
              <button className="text-on-surface-variant">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
            <div className="space-y-4">
              {deadlines.map((deadline) => (
                <DeadlineItem
                  key={deadline.id}
                  title={deadline.title}
                  tag={deadline.tag}
                  tagStyle={deadline.tag_style}
                  percent={deadline.percent_complete}
                  left={`${deadline.percent_complete}% Complete`}
                  right={formatDueLabel(deadline.due_at)}
                />
              ))}
            </div>
          </div>

          {/* Marketplace */}
          <div className="bg-white rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Marketplace</h3>
              <a className="text-secondary text-[11px] font-bold hover:underline" href="#">
                View All
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {marketplaceListings.map((item) => (
                <div key={item.id} className="group cursor-pointer">
                  <div
                    className="h-28 rounded-xl overflow-hidden mb-2 bg-surface-container"
                    style={item.image_url ? { backgroundImage: `url(${item.image_url})`, backgroundSize: "cover" } : undefined}
                  />
                  <h6 className="text-xs font-bold text-primary">{item.title}</h6>
                  <p className="text-secondary text-xs font-bold">{formatPrice(item.price)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
