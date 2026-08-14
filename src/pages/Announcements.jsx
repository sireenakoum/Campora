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
          CAMPUS HUB HEADER
      ========================= */}

      <div style={styles.pageHeader}>
        <div style={styles.pageHeaderMain}>
          <div style={styles.pageHeaderIcon}>
            <Landmark size={22} strokeWidth={2} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={styles.pageEyebrow}>CAMPUS HUB</div>
            <h1 style={styles.pageTitle}>Stay connected to campus</h1>
            <p style={styles.pageSubtitle}>
              Announcements, news, events, and useful resources in one place.
            </p>
          </div>
        </div>

        <div style={styles.overviewStats}>
          {[
            {
              label: "Announcements",
              value: announcements.length,
              color: "#D9896A",
              soft: "#FFF6F2"
            },
            {
              label: "News",
              value: news.length,
              color: "#648CCB",
              soft: "#F3F7FD"
            },
            {
              label: "Events",
              value: events.length,
              color: "#5E9A8B",
              soft: "#F2F9F7"
            },
            {
              label: "Resources",
              value: resources.length,
              color: "#8B78B8",
              soft: "#F7F4FC"
            }
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...styles.overviewStat,
                background: item.soft,
                borderColor: `${item.color}22`
              }}
            >
              <span
                style={{
                  ...styles.overviewDot,
                  background: item.color
                }}
              />
              <div>
                <div style={styles.overviewValue}>{item.value}</div>
                <div style={styles.overviewLabel}>{item.label}</div>
              </div>
            </div>
          ))}
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

        <div style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                style={{
                  ...styles.tabCard,
                  background: isActive ? tab.color : tab.softColor,
                  borderColor: isActive ? tab.color : tab.borderColor,
                  boxShadow: isActive
                    ? `0 8px 20px ${tab.color}30`
                    : "0 5px 16px rgba(0,45,98,0.04)",
                  transform: isActive ? "translateY(-1px)" : "none"
                }}
              >
                <div
                  style={{
                    ...styles.tabAccent,
                    background: isActive ? "rgba(255,255,255,0.86)" : tab.color,
                    opacity: isActive ? 0.95 : 0.72
                  }}
                />

                <div
                  style={{
                    ...styles.tabIcon,
                    color: isActive ? "#FFFFFF" : tab.color,
                    background: isActive ? "rgba(255,255,255,0.14)" : "#FFFFFF",
                    borderColor: isActive ? "rgba(255,255,255,0.22)" : tab.borderColor
                  }}
                >
                  <TabIcon size={18} strokeWidth={2.2} />
                </div>

                <div style={{ minWidth: 0, textAlign: "left" }}>
                  <div
                    style={{
                      ...styles.tabLabel,
                      color: isActive ? "#FFFFFF" : tab.color
                    }}
                  >
                    {tab.label}
                  </div>

                  <div
                    style={{
                      ...styles.tabDescription,
                      color: isActive ? "rgba(255,255,255,0.82)" : styles.tabDescription.color
                    }}
                  >
                    {tab.description}
                  </div>
                </div>
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
     CAMPUS HUB HEADER
  ========================= */

  pageHeader: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    padding: "22px",
    boxSizing: "border-box",
    borderRadius: "var(--radius-secondary)",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(244,247,252,0.94))",
    border: "1px solid rgba(0,45,98,0.08)",
    boxShadow: "0 10px 28px rgba(0,45,98,0.06)",
  },

  pageHeaderMain: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  pageHeaderIcon: {
    width: "46px",
    height: "46px",
    flexShrink: 0,
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--campora-navy)",
    background: "rgba(216,226,255,0.62)",
    border: "1px solid rgba(0,45,98,0.08)",
    boxShadow: "0 6px 16px rgba(0,45,98,0.06)",
  },

  pageEyebrow: {
    marginBottom: "3px",
    color: "var(--campora-navy)",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "0.12em",
  },

  pageTitle: {
    margin: 0,
    color: "var(--campora-text)",
    fontSize: "24px",
    lineHeight: 1.15,
    fontWeight: "800",
    letterSpacing: "-0.4px",
  },

  pageSubtitle: {
    margin: "5px 0 0",
    color: "var(--campora-muted)",
    fontSize: "13px",
    lineHeight: 1.5,
    fontWeight: "500",
  },

  overviewStats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "10px",
  },

  overviewStat: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "11px 12px",
    borderRadius: "14px",
    border: "1px solid",
  },

  overviewDot: {
    width: "9px",
    height: "9px",
    flexShrink: 0,
    borderRadius: "50%",
  },

  overviewValue: {
    color: "var(--campora-text)",
    fontSize: "14px",
    fontWeight: "900",
    lineHeight: 1.1,
  },

  overviewLabel: {
    marginTop: "2px",
    color: "var(--campora-muted)",
    fontSize: "10px",
    fontWeight: "700",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
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
     CAMPUS HUB CATEGORY CARDS
  ========================= */

  tabsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "12px",
    padding: "18px 18px 20px",
    background: "transparent",
    borderBottom: "1px solid var(--divider)",
  },

  tabCard: {
    position: "relative",
    minHeight: "126px",
    overflow: "hidden",
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    padding: "20px 16px 16px",
    border: "1px solid",
    borderRadius: "18px",
    cursor: "pointer",
    fontFamily: "inherit",
    transition:
      "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
  },

  tabAccent: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "5px",
  },

  activePill: {
    position: "absolute",
    right: "10px",
    top: "11px",
    padding: "3px 7px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.82)",
    border: "1px solid",
    fontSize: "8.5px",
    fontWeight: "900",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },

  tabIcon: {
    width: "34px",
    height: "34px",
    flexShrink: 0,
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(0,0,0,0.04)",
  },

  tabLabel: {
    fontSize: "13px",
    fontWeight: "850",
    lineHeight: 1.25,
    marginBottom: "4px",
  },

  tabDescription: {
    color: "var(--campora-muted)",
    fontSize: "10.5px",
    fontWeight: "600",
    lineHeight: 1.4,
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