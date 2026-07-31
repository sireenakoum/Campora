import React from "react";

export default function Header({
  searchPlaceholder = "Search for courses, notes, or groups...",
  portalLabel = "Academic Portal",
  hasNotification = true,
  onSearchChange,
  onNotificationsClick,
  onMailClick,
  onProfileClick,
}) {
  return (
    <header className="sticky top-0 bg-surface/80 backdrop-blur-md px-container-padding h-20 flex justify-between items-center z-40">
      <div className="relative w-96">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
          search
        </span>
        <input
          className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-secondary/20 text-sm text-on-surface"
          placeholder={searchPlaceholder}
          type="text"
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onNotificationsClick}
            aria-label="Notifications"
            className="relative text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">notifications</span>
            {hasNotification && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full" />
            )}
          </button>
          <button
            onClick={onMailClick}
            aria-label="Mail"
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">mail</span>
          </button>
        </div>

        <div className="h-8 w-px bg-outline-variant" />

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-on-surface-variant">{portalLabel}</span>
          <button onClick={onProfileClick} className="text-on-surface-variant">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  );
}