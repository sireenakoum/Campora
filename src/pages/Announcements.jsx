import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  CalendarDays,
  BookOpen,
  Megaphone,
  ExternalLink,
  Landmark,
  Pin,
  ChevronDown,
  Sparkles,
} from "lucide-react";

import {
  getAnnouncements,
  getCampusNews,
  getEvents,
  getResources,
} from "../lib/campusHub";

import AnnouncementCard from "../components/AnnouncementsCard";
import NewsCard from "../components/NewsCard";
import EventCard from "../components/EventCard";
import ResourceCard from "../components/ResourceCard";

import PageShell, {
  EmptyState,
} from "../components/luminous";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [resources, setResources] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] =
    useState("announcements");

  const [category, setCategory] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [
          announcementsData,
          newsData,
          eventsData,
          resourcesData,
        ] = await Promise.all([
          getAnnouncements(),
          getCampusNews(),
          getEvents({
            upcoming: true,
          }),
          getResources(),
        ]);

        setAnnouncements(announcementsData || []);
        setNews(newsData || []);
        setEvents(eventsData || []);
        setResources(resourcesData || []);
      } catch (err) {
        setError(
          err?.message ||
            "Something went wrong while loading Campus Hub."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleSearch(value) {
    setSearch(value);
    setError(null);

    try {
      if (activeTab === "announcements") {
        const data = await getAnnouncements({
          search: value,
          category,
        });

        setAnnouncements(data || []);
      }

      if (activeTab === "news") {
        const data = await getCampusNews({
          search: value,
        });

        setNews(data || []);
      }

      if (activeTab === "events") {
        const data = await getEvents({
          search: value,
          category,
          upcoming: true,
        });

        setEvents(data || []);
      }

      if (activeTab === "resources") {
        const data = await getResources({
          search: value,
          category,
        });

        setResources(data || []);
      }
    } catch (err) {
      setError(
        err?.message || "Search failed."
      );
    }
  }

  async function handleCategory(value) {
    setCategory(value);
    setError(null);

    try {
      if (activeTab === "announcements") {
        const data = await getAnnouncements({
          search,
          category: value,
        });

        setAnnouncements(data || []);
      }

      if (activeTab === "events") {
        const data = await getEvents({
          search,
          category: value,
          upcoming: true,
        });

        setEvents(data || []);
      }

      if (activeTab === "resources") {
        const data = await getResources({
          search,
          category: value,
        });

        setResources(data || []);
      }
    } catch (err) {
      setError(
        err?.message ||
          "Could not update category."
      );
    }
  }

  async function handleTabChange(tabKey) {
    setActiveTab(tabKey);
    setSearch("");
    setCategory("");
    setError(null);

    try {
      if (tabKey === "announcements") {
        const data =
          await getAnnouncements();

        setAnnouncements(data || []);
      }

      if (tabKey === "news") {
        const data =
          await getCampusNews();

        setNews(data || []);
      }

      if (tabKey === "events") {
        const data = await getEvents({
          upcoming: true,
        });

        setEvents(data || []);
      }

      if (tabKey === "resources") {
        const data =
          await getResources();

        setResources(data || []);
      }
    } catch (err) {
      setError(
        err?.message ||
          "Could not load this section."
      );
    }
  }

  const tabs = [
  {
    key: "announcements",
    label: "Announcements",
    icon: Megaphone,
    color: "#D9896A",
    softColor: "#FFF6F2",
    borderColor: "#F3DDD4",
    description:
      "Important notices and updates from your university.",
  },
  {
    key: "news",
    label: "Campus News",
    icon: BookOpen,
    color: "#648CCB",
    softColor: "#F3F7FD",
    borderColor: "#DDE7F5",
    description:
      "The latest stories and updates from around campus.",
  },
  {
    key: "events",
    label: "Events",
    icon: CalendarDays,
    color: "#5E9A8B",
    softColor: "#F2F9F7",
    borderColor: "#D9EBE6",
    description:
      "Upcoming activities, sessions, and campus events.",
  },
  {
    key: "resources",
    label: "Resources",
    icon: ExternalLink,
    color: "#8B78B8",
    softColor: "#F7F4FC",
    borderColor: "#E7E0F2",
    description:
      "Helpful links and resources available to students.",
  },
];

  const pinned = useMemo(
    () =>
      announcements.filter(
        (item) => item.is_pinned
      ),
    [announcements]
  );

  const activeTabData =
    tabs.find(
      (tab) => tab.key === activeTab
    ) || tabs[0];

  const ActiveIcon =
    activeTabData.icon;

  const resultCount =
    activeTab === "announcements"
      ? announcements.length
      : activeTab === "news"
      ? news.length
      : activeTab === "events"
      ? events.length
      : resources.length;

  const showCategory =
    activeTab !== "news";

  if (loading) {
    return (
      <PageShell>
        <div style={styles.loadingCard}>
          <span
            className="icon-chip tone-primary"
          >
            <Landmark
              size={24}
              strokeWidth={1.6}
            />
          </span>

          <div>
            <div style={styles.loadingTitle}>
              Loading Campus Hub
            </div>

            <div style={styles.loadingText}>
              Getting the latest campus updates...
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (
    error &&
    !announcements.length &&
    !news.length &&
    !events.length &&
    !resources.length
  ) {
    return (
      <PageShell>
        <div style={styles.errorCard}>
          <span
            className="icon-chip tone-error"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "var(--radius-sm)",
              fontWeight: "900",
              fontSize: "14px",
            }}
          >
            !
          </span>

          <div>
            <div style={styles.errorTitle}>
              Unable to load Campus Hub
            </div>

            <div style={styles.errorText}>
              {error}
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* =========================
          NAVY CAMPUS HUB HEADER
      ========================= */}

      <div style={styles.hero}>
        <div
          style={styles.heroGlowOne}
        />

        <div
          style={styles.heroGlowTwo}
        />

        <div style={styles.heroContent}>
          <div style={styles.heroLeft}>
            <div style={styles.heroIcon}>
              <Landmark
                size={28}
                strokeWidth={2.1}
              />
            </div>

            <div>
              <div
                style={styles.heroEyebrow}
              >
                YOUR CAMPUS HUB
              </div>

              <h1 style={styles.heroTitle}>
                Campus Hub
              </h1>

              <p
                style={styles.heroSubtitle}
              >
                Everything happening around
                campus, all in one place.
              </p>
            </div>
          </div>

          <div style={styles.heroBadge}>
            <Sparkles size={15} />
            <span>Stay connected</span>
          </div>
        </div>
      </div>

      {/* =========================
          PINNED ANNOUNCEMENT
      ========================= */}

      {activeTab === "announcements" &&
        pinned.length > 0 && (
          <div style={styles.pinnedCard}>
            <div
              style={styles.pinnedIconWrap}
            >
              <Pin
                size={18}
                fill="currentColor"
              />
            </div>

            <div
              style={styles.pinnedContent}
            >
              <div
                style={styles.pinnedLabel}
              >
                PINNED ANNOUNCEMENT
              </div>

              <h3
                style={styles.pinnedTitle}
              >
                {pinned[0].title}
              </h3>

              <p
                style={styles.pinnedText}
              >
                {pinned[0].content}
              </p>
            </div>
          </div>
        )}

      {/* =========================
          MAIN CARD
      ========================= */}

      <div style={styles.mainCard}>
        {/* COLORFUL TOP TABS */}

        <div
          className="filter-row"
          style={styles.tabsContainer}
        >
          {tabs.map((tab) => {
            const TabIcon = tab.icon;

            const isActive =
              activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() =>
                  handleTabChange(tab.key)
                }
                className={
                  isActive
                    ? "filter-chip active"
                    : "filter-chip"
                }
                style={{
                  background: isActive
                    ? tab.color
                    : tab.softColor,

                  color: isActive
                    ? "#FFFFFF"
                    : tab.color,

                  border: `1px solid ${
                    isActive
                      ? tab.color
                      : tab.borderColor
                  }`,

                  boxShadow: isActive
                    ? `0 6px 16px ${tab.color}30`
                    : "none",
                }}
              >
                <TabIcon
                  size={17}
                  strokeWidth={2.2}
                />

                <span>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* =========================
            SECTION HEADER
        ========================= */}

        <div
          style={
            styles.sectionHeadingRow
          }
        >
          <div>
            <div
              style={styles.sectionTitleRow}
            >
              <div
                style={{
                  ...styles.sectionIcon,
                  color:
                    activeTabData.color,
                  background:
                    activeTabData.softColor,
                  border: `1px solid ${activeTabData.borderColor}`,
                }}
              >
                <ActiveIcon
                  size={18}
                  strokeWidth={2.2}
                />
              </div>

              <h2
                style={styles.sectionTitle}
              >
                {activeTabData.label}
              </h2>
            </div>

            <p
              style={
                styles.sectionSubtitle
              }
            >
              {activeTabData.description}
            </p>
          </div>

          <div
            className="pill"
            style={{
              ...styles.countBadge,

              color:
                activeTabData.color,

              background:
                activeTabData.softColor,

              border: `1px solid ${activeTabData.borderColor}`,
            }}
          >
            {resultCount}{" "}
            {resultCount === 1
              ? "item"
              : "items"}
          </div>
        </div>

        {/* =========================
            SEARCH + FILTER
        ========================= */}

        <div
          style={{
            ...styles.controls,

            gridTemplateColumns:
              showCategory
                ? "minmax(0, 1fr) 190px"
                : "minmax(0, 1fr)",
          }}
        >
          <div style={styles.searchWrap}>
            <Search
              size={18}
              strokeWidth={2}
              style={styles.searchIcon}
            />

            <input
              value={search}
              onChange={(e) =>
                handleSearch(
                  e.target.value
                )
              }
              placeholder={`Search ${activeTabData.label.toLowerCase()}...`}
              style={styles.searchInput}
            />
          </div>

          {showCategory && (
            <div
              style={styles.selectWrap}
            >
              <select
                value={category}
                onChange={(e) =>
                  handleCategory(
                    e.target.value
                  )
                }
                style={styles.select}
              >
                <option value="">
                  All Categories
                </option>

                <option value="Academic">
                  Academic
                </option>

                <option value="IT">
                  IT
                </option>

                <option value="Social">
                  Social
                </option>
              </select>

              <ChevronDown
                size={17}
                style={styles.selectIcon}
              />
            </div>
          )}
        </div>

        {error && (
          <div
            style={styles.inlineError}
          >
            {error}
          </div>
        )}

        {/* =========================
            CONTENT
        ========================= */}

        <div style={styles.content}>
          {activeTab ===
            "announcements" &&
            (announcements.length > 0 ? (
              announcements.map(
                (item) => (
                  <AnnouncementCard
                    key={item.id}
                    announcement={item}
                  />
                )
              )
            ) : (
              <EmptyState
                icon={Megaphone}
                title="No announcements found"
                text="There aren't any announcements matching your search right now."
              />
            ))}

          {activeTab === "news" &&
            (news.length > 0 ? (
              news.map((item) => (
                <NewsCard
                  key={item.id}
                  news={item}
                />
              ))
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No campus news found"
                text="There aren't any news posts matching your search right now."
              />
            ))}

          {activeTab === "events" &&
            (events.length > 0 ? (
              events.map((item) => (
                <EventCard
                  key={item.id}
                  event={item}
                />
              ))
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No events found"
                text="There aren't any upcoming events matching your search."
              />
            ))}

          {activeTab === "resources" &&
            (resources.length > 0 ? (
              resources.map(
                (item) => (
                  <ResourceCard
                    key={item.id}
                    resource={item}
                  />
                )
              )
            ) : (
              <EmptyState
                icon={ExternalLink}
                title="No resources found"
                text="There aren't any resources matching your search right now."
              />
            ))}
        </div>
      </div>
    </PageShell>
  );
}

const styles = {
  /* =========================
     CAMPUS HUB - NAVY ONLY
  ========================= */

  hero: {
    position: "relative",
    overflow: "hidden",

    width: "100%",
    minHeight: "150px",

    borderRadius: "var(--radius)",

    padding: "26px 29px",

    boxSizing: "border-box",

    background:
      "linear-gradient(135deg, var(--campora-active) 0%, var(--campora-navy) 52%, var(--primary-container) 100%)",

    boxShadow: "var(--shadow-lift)",
  },

  heroGlowOne: {
    position: "absolute",

    width: "260px",
    height: "260px",

    borderRadius: "50%",

    background:
      "radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0) 70%)",

    right: "90px",
    top: "-165px",

    pointerEvents: "none",
  },

  heroGlowTwo: {
    position: "absolute",

    width: "210px",
    height: "210px",

    borderRadius: "50%",

    background:
      "radial-gradient(circle, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 70%)",

    right: "-45px",
    bottom: "-125px",

    pointerEvents: "none",
  },

  heroContent: {
    position: "relative",
    zIndex: 2,

    minHeight: "98px",

    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",

    gap: "20px",
  },

  heroLeft: {
    display: "flex",
    alignItems: "center",
    gap: "17px",
    minWidth: 0,
  },

  heroIcon: {
    width: "58px",
    height: "58px",

    flexShrink: 0,

    borderRadius: "17px",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    color: "#FFFFFF",

    background:
      "rgba(255,255,255,0.11)",

    border:
      "1px solid rgba(255,255,255,0.18)",

    boxShadow:
      "0 8px 22px rgba(0,0,0,0.12)",

    backdropFilter:
      "blur(10px)",

    WebkitBackdropFilter:
      "blur(10px)",
  },

  heroEyebrow: {
    color: "#AFC6F2",

    fontSize: "10.5px",
    fontWeight: "800",

    letterSpacing: "1.6px",

    marginBottom: "5px",
  },

  heroTitle: {
    margin: 0,

    color: "#FFFFFF",

    fontSize: "31px",
    lineHeight: 1.1,

    fontWeight: "900",

    letterSpacing: "-0.7px",
  },

  heroSubtitle: {
    margin: "7px 0 0",

    color:
      "rgba(255,255,255,0.76)",

    fontSize: "14px",
    lineHeight: 1.5,

    fontWeight: "500",
  },

  heroBadge: {
    display: "flex",

    alignItems: "center",

    gap: "7px",

    padding: "9px 14px",

    borderRadius: "999px",

    color: "#FFFFFF",

    background:
      "rgba(255,255,255,0.10)",

    border:
      "1px solid rgba(255,255,255,0.16)",

    fontSize: "12px",
    fontWeight: "700",

    whiteSpace: "nowrap",
  },

  /* =========================
     PINNED
  ========================= */

  pinnedCard: {
    display: "flex",

    gap: "14px",

    alignItems: "flex-start",

    padding: "18px 20px",

    borderRadius: "var(--radius-secondary)",

    background:
      "linear-gradient(135deg, var(--campora-navy-tint-alpha), var(--surface-container-low))",

    border:
      "1px solid var(--hairline)",

    boxShadow: "var(--shadow-soft)",
  },

  pinnedIconWrap: {
    width: "38px",
    height: "38px",

    flexShrink: 0,

    borderRadius: "var(--radius-sm)",

    display: "flex",

    alignItems: "center",
    justifyContent: "center",

    background: "var(--campora-navy-tint)",
    color: "var(--campora-navy)",
  },

  pinnedContent: {
    minWidth: 0,
  },

  pinnedLabel: {
    color: "var(--campora-navy)",

    fontSize: "10px",
    fontWeight: "900",

    letterSpacing: "1.2px",

    marginBottom: "4px",
  },

  pinnedTitle: {
    color: "var(--campora-text)",

    fontSize: "16px",
    fontWeight: "800",

    margin: "0 0 5px",
  },

  pinnedText: {
    color: "var(--campora-body)",

    fontSize: "13px",
    lineHeight: 1.55,

    margin: 0,
  },

  /* =========================
     MAIN CARD
  ========================= */

  mainCard: {
    width: "100%",

    background: "var(--surface-container-lowest)",

    border:
      "1px solid var(--divider)",

    borderRadius: "var(--radius-secondary)",

    boxShadow: "var(--shadow-soft)",

    overflow: "hidden",

    boxSizing: "border-box",
  },

  /* =========================
     COLORFUL TABS
  ========================= */

  tabsContainer: {
    padding: "14px",

    gap: "9px",

    background: "var(--surface-container-high)",

    borderBottom:
      "1px solid var(--divider)",
  },

  /* =========================
     SECTION HEADER
  ========================= */

  sectionHeadingRow: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "flex-start",

    gap: "20px",

    padding:
      "24px 25px 18px",
  },

  sectionTitleRow: {
    display: "flex",

    alignItems: "center",

    gap: "10px",
  },

  sectionIcon: {
    width: "35px",
    height: "35px",

    borderRadius: "var(--radius-sm)",

    display: "flex",

    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    margin: 0,

    color: "var(--campora-text)",

    fontSize: "19px",

    fontWeight: "850",

    letterSpacing:
      "-0.25px",
  },

  sectionSubtitle: {
    color: "var(--campora-muted)",

    fontSize: "12.5px",

    lineHeight: 1.5,

    margin:
      "8px 0 0 45px",
  },

  countBadge: {
    padding: "7px 11px",

    fontSize: "11px",

    fontWeight: "750",

    whiteSpace: "nowrap",
  },

  /* =========================
     SEARCH
  ========================= */

  controls: {
    display: "grid",

    gap: "11px",

    alignItems: "center",

    padding:
      "0 25px 22px",
  },

  searchWrap: {
    height: "44px",

    position: "relative",

    display: "flex",

    alignItems: "center",

    background: "var(--surface-container-lowest)",

    border:
      "1px solid var(--divider)",

    borderRadius: "var(--radius-sm)",

    boxSizing: "border-box",
  },

  searchIcon: {
    position: "absolute",

    left: "13px",

    color: "var(--campora-muted)",

    pointerEvents: "none",
  },

  searchInput: {
    width: "100%",
    height: "100%",

    border: "none",

    outline: "none",

    background: "transparent",

    padding:
      "0 14px 0 41px",

    color: "var(--campora-text)",

    fontFamily: "inherit",

    fontSize: "13px",

    fontWeight: "500",

    boxSizing: "border-box",
  },

  selectWrap: {
    height: "44px",

    position: "relative",

    background: "var(--surface-container-lowest)",

    border:
      "1px solid var(--divider)",

    borderRadius: "var(--radius-sm)",
  },

  select: {
    width: "100%",
    height: "100%",

    appearance: "none",
    WebkitAppearance: "none",

    border: "none",
    outline: "none",

    background: "transparent",

    color: "var(--campora-body)",

    padding:
      "0 38px 0 13px",

    fontFamily: "inherit",

    fontSize: "13px",

    fontWeight: "600",

    cursor: "pointer",
  },

  selectIcon: {
    position: "absolute",

    right: "12px",

    top: "50%",

    transform:
      "translateY(-50%)",

    color: "var(--campora-muted)",

    pointerEvents: "none",
  },

  /* =========================
     CONTENT
  ========================= */

  content: {
    padding:
      "0 25px 26px",
  },

  inlineError: {
    margin:
      "0 25px 20px",

    padding:
      "10px 12px",

    borderRadius: "var(--radius-sm)",

    background: "var(--tone-error-soft)",

    color: "var(--tone-error)",

    border:
      "1px solid var(--tone-error-soft)",

    fontSize: "12px",

    fontWeight: "600",
  },

  /* =========================
     LOADING
  ========================= */

  loadingCard: {
    minHeight: "130px",

    display: "flex",

    alignItems: "center",

    gap: "14px",

    padding: "24px",

    borderRadius: "var(--radius-secondary)",

    background: "var(--surface-container-lowest)",

    border:
      "1px solid var(--divider)",

    boxShadow: "var(--shadow-soft)",
  },

  loadingTitle: {
    color: "var(--campora-text)",

    fontSize: "15px",

    fontWeight: "800",
  },

  loadingText: {
    color: "var(--campora-muted)",

    fontSize: "12px",

    marginTop: "4px",
  },

  /* =========================
     ERROR
  ========================= */

  errorCard: {
    display: "flex",

    gap: "13px",

    alignItems: "center",

    padding: "20px",

    borderRadius: "var(--radius-secondary)",

    background: "var(--tone-error-soft)",

    border:
      "1px solid var(--tone-error-soft)",
  },

  errorTitle: {
    color: "var(--tone-error)",

    fontWeight: "800",

    fontSize: "14px",
  },

  errorText: {
    color: "var(--tone-error)",

    fontSize: "12px",

    marginTop: "3px",
  },
};