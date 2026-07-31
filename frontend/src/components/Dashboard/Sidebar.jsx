import React from "react";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "announcements", label: "Announcements", icon: "campaign" },
  { key: "campus-news", label: "Campus News", icon: "newspaper" },
  { key: "resources", label: "University Resources", icon: "folder_special" },
  { key: "calendar", label: "Academic Calendar", icon: "calendar_month" },
  { key: "planner", label: "Planner", icon: "calendar_today" },
  { key: "assistant", label: "AI Assistant", icon: "auto_awesome" },
];

export default function Sidebar({
  activeKey = "dashboard",
  onNavigate,
  onAiTutorClick,
  logoUrl,
  user = { name: "Lara", role: "Senior Year", avatarUrl: null },
}) {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-sidebar-width bg-surface-container-lowest shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex-col py-6 z-50">
      {/* Brand */}
      <div className="px-6 mb-10 flex items-center gap-2">
        {logoUrl ? (
          <img alt="Campora Logo" className="w-10 h-10 object-contain" src={logoUrl} />
        ) : (
          <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-xl">school</span>
          </div>
        )}
        <div>
          <h1 className="text-headline-md font-bold text-primary leading-none">Campora</h1>
          <p className="text-[8px] uppercase tracking-widest text-on-surface-variant font-bold mt-0.5">
            Academic Portal
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map(({ key, label, icon }) => {
          const isActive = key === activeKey;
          return (
            <a
              key={key}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.(key);
              }}
              className={`px-4 py-3 flex items-center gap-3 font-bold text-sm transition-colors duration-200 ${
                isActive
                  ? "bg-secondary/10 text-secondary border-l-4 border-secondary"
                  : "text-on-surface-variant opacity-70 hover:bg-surface-container-low border-l-4 border-transparent"
              }`}
            >
              <span className="material-symbols-outlined">{icon}</span>
              {label}
            </a>
          );
        })}
      </nav>

      {/* AI Tutor + profile */}
      <div className="px-4 mt-auto">
        <button
          onClick={onAiTutorClick}
          className="w-full bg-secondary text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 ai-glow hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-lg">smart_toy</span>
          AI Tutor
        </button>

        <div className="mt-6 flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden shrink-0">
            {user.avatarUrl ? (
              <img alt={user.name} className="w-full h-full object-cover" src={user.avatarUrl} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-sm font-bold">
                {user.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">{user.name}</p>
            <p className="text-[11px] text-on-surface-variant">{user.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}