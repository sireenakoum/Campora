import './CamporaMobileCompat.css';
import aubAnnouncementsImage from './aub-announcements.jpeg';
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
    color: '#648CCB',
    softColor: '#F3F7FD',
    borderColor: '#DDE7F5',
    description:
      "Important notices and updates from your university.",
  },
  {
    key: "news",
    label: "Campus News",
    icon: BookOpen,
    color: '#6F948B',
    softColor: '#F1F7F5',
    borderColor: '#D8E7E2',
    description:
      "The latest stories and updates from around campus.",
  },
  {
    key: "events",
    label: "Events",
    icon: CalendarDays,
    color: '#C76E8A',
    softColor: '#FFF3F7',
    borderColor: '#F1D8E1',
    description:
      "Upcoming activities, sessions, and campus events.",
  },
  {
    key: "resources",
    label: "Resources",
    icon: ExternalLink,
    color: '#C6A15B',
    softColor: '#FFF9EE',
    borderColor: '#F0E2C1',
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
      <div className="campora-mobile-page announcements-mobile" style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>
            <Landmark size={24} />
          </div>

          <div>
            <div style={styles.loadingTitle}>
              Loading Campus Hub
            </div>

            <div style={styles.loadingText}>
              Getting the latest campus updates...
            </div>
          </div>
        </div>
      </div>
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
      <div className="campora-mobile-page announcements-mobile" style={styles.page}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>
            !
          </div>

          <div>
            <div style={styles.errorTitle}>
              Unable to load Campus Hub
            </div>

            <div style={styles.errorText}>
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="campora-mobile-page announcements-mobile" style={styles.page}>
      {/* =========================
          NAVY CAMPUS HUB HEADER
      ========================= */}

      <div style={styles.hero}>
        <img
          src={aubAnnouncementsImage}
          alt="AUB campus"
          style={styles.heroBackgroundImage}
        />
        <div style={styles.heroOverlay} />

        <div style={styles.heroContent}>
          <div>
            <div style={styles.heroEyebrow}>
              <Sparkles size={14} strokeWidth={2.2} />
              <span>YOUR CAMPUS HUB</span>
            </div>

            <h1 style={styles.heroTitle}>
              Campus Hub
            </h1>

            <p style={styles.heroSubtitle}>
              Everything happening around campus, all in one place.
            </p>
          </div>
        </div>
      </div>

      {/* =========================
          COMPACT OVERVIEW
          New-version feature, old-version styling stays dominant
      ========================= */}

      <div style={styles.overviewStats}>
        {[
          {
            label: "Announcements",
            value: announcements.length,
            color: "#648CCB",
            soft: "#F3F7FD",
            border: "#DDE7F5",
          },
          {
            label: "Campus News",
            value: news.length,
            color: "#6F948B",
            soft: "#F1F7F5",
            border: "#D8E7E2",
          },
          {
            label: "Events",
            value: events.length,
            color: "#C76E8A",
            soft: "#FFF3F7",
            border: "#F1D8E1",
          },
          {
            label: "Resources",
            value: resources.length,
            color: "#C6A15B",
            soft: "#FFF9EE",
            border: "#F0E2C1",
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              ...styles.overviewStat,
              background: item.soft,
              border: `1px solid ${item.border}`,
            }}
          >
            <span
              style={{
                ...styles.overviewDot,
                background: item.color,
              }}
            />

            <div>
              <div style={styles.overviewValue}>
                {item.value}
              </div>

              <div style={styles.overviewLabel}>
                {item.label}
              </div>
            </div>
          </div>
        ))}
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

            const isActive =
              activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() =>
                  handleTabChange(tab.key)
                }
                style={{
                  ...styles.tabButton,

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
                  <CampusHubCardAccent
                    key={item.id}
                    color="#648CCB"
                    soft="#F3F7FD"
                    border="#DDE7F5"
                  >
                    <AnnouncementCard
                      announcement={item}
                    />
                  </CampusHubCardAccent>
                )
              )
            ) : (
              <EmptyState
                icon={Megaphone}
                title="No announcements found"
                text="There aren't any announcements matching your search right now."
                color={
                  activeTabData.color
                }
                softColor={
                  activeTabData.softColor
                }
              />
            ))}

          {activeTab === "news" &&
            (news.length > 0 ? (
              news.map((item) => (
                <CampusHubCardAccent
                  key={item.id}
                  color="#6F948B"
                  soft="#F1F7F5"
                  border="#D8E7E2"
                >
                  <NewsCard
                    news={item}
                  />
                </CampusHubCardAccent>
              ))
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No campus news found"
                text="There aren't any news posts matching your search right now."
                color={
                  activeTabData.color
                }
                softColor={
                  activeTabData.softColor
                }
              />
            ))}

          {activeTab === "events" &&
            (events.length > 0 ? (
              events.map((item) => (
                <CampusHubCardAccent
                  key={item.id}
                  color="#C76E8A"
                  soft="#FFF3F7"
                  border="#F1D8E1"
                >
                  <EventCard
                    event={item}
                  />
                </CampusHubCardAccent>
              ))
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No events found"
                text="There aren't any upcoming events matching your search."
                color={
                  activeTabData.color
                }
                softColor={
                  activeTabData.softColor
                }
              />
            ))}

          {activeTab === "resources" &&
            (resources.length > 0 ? (
              resources.map(
                (item) => (
                  <CampusHubCardAccent
                    key={item.id}
                    color="#C6A15B"
                    soft="#FFF9EE"
                    border="#F0E2C1"
                  >
                    <ResourceCard
                      resource={item}
                    />
                  </CampusHubCardAccent>
                )
              )
            ) : (
              <EmptyState
                icon={ExternalLink}
                title="No resources found"
                text="There aren't any resources matching your search right now."
                color={
                  activeTabData.color
                }
                softColor={
                  activeTabData.softColor
                }
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function CampusHubCardAccent({
  children,
  color,
  soft,
  border,
}) {
  return (
    <div
      style={{
        position: 'relative',
        marginBottom: '14px',
        borderRadius: '18px',
        background: '#FFFFFF',
        border: `1px solid ${border}`,
        boxShadow: '0 7px 20px rgba(11,26,63,0.035)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: color,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          background: `linear-gradient(90deg, ${soft} 0%, #FFFFFF 18%)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
  color,
  softColor,
}) {
  return (
    <div style={styles.emptyState}>
      <div
        style={{
          ...styles.emptyIcon,
          color,
          background: softColor,
        }}
      >
        <Icon
          size={25}
          strokeWidth={1.9}
        />
      </div>

      <h3 style={styles.emptyTitle}>
        {title}
      </h3>

      <p style={styles.emptyText}>
        {text}
      </p>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    padding: "8px 0 40px",
    boxSizing: "border-box",
  },

  /* =========================
     CAMPUS HUB - NAVY ONLY
  ========================= */

  hero: {
    position: "relative",
    width: "100%",
    height: "176px",
    minHeight: "176px",
    borderRadius: "22px",
    marginBottom: "22px",
    padding: 0,
    overflow: "hidden",
    boxSizing: "border-box",
    background: "#0B1A3F",
    boxShadow: "0 15px 35px rgba(11, 26, 63, 0.16)",
  },

  heroBackgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    minWidth: "100%",
    minHeight: "100%",
    objectFit: "cover",
    objectPosition: "center 18%",
    display: "block",
    zIndex: 0,
  },

  heroOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    background:
      "linear-gradient(90deg, rgba(7,20,49,0.93) 0%, rgba(7,20,49,0.78) 40%, rgba(7,20,49,0.50) 68%, rgba(7,20,49,0.22) 100%)",
    pointerEvents: "none",
  },

  heroContent: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    height: "100%",
    padding: "28px 34px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
  },

  heroEyebrow: {
    display: "flex",
    alignItems: "center",
    gap: "7px",

    color: "#FFFFFF",

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
    fontWeight: "600",
    letterSpacing: "-0.7px",
  },

  heroSubtitle: {
    margin: "7px 0 0",

    color: "rgba(255,255,255,0.82)",

    fontSize: "14px",
    lineHeight: 1.5,
    fontWeight: "500",
  },

  overviewStats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "10px",
    marginBottom: "20px",
  },

  overviewStat: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "11px 12px",
    borderRadius: "14px",
    boxShadow: "0 4px 14px rgba(11,26,63,0.025)",
  },

  overviewDot: {
    width: "9px",
    height: "9px",
    flexShrink: 0,
    borderRadius: "50%",
  },

  overviewValue: {
    color: "#0B1A3F",
    fontSize: "14px",
    fontWeight: "900",
    lineHeight: 1.1,
  },

  overviewLabel: {
    marginTop: "2px",
    color: "#8490A3",
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

    borderRadius: "17px",

    background:
      "linear-gradient(135deg, #FFF7ED, #FFFBF5)",

    border:
      '1px solid #DDE7F5',

    boxShadow:
      "0 6px 18px rgba(124,45,18,0.05)",

    marginBottom: "20px",
  },

  pinnedIconWrap: {
    width: "38px",
    height: "38px",

    flexShrink: 0,

    borderRadius: '50%',

    display: "flex",

    alignItems: "center",
    justifyContent: "center",

    background: '#F3F7FD',
    color: '#648CCB',
  },

  pinnedContent: {
    minWidth: 0,
  },

  pinnedLabel: {
    color: '#648CCB',

    fontSize: "10px",
    fontWeight: "900",

    letterSpacing: "1.2px",

    marginBottom: "4px",
  },

  pinnedTitle: {
    color: "#431407",

    fontSize: "16px",
    fontWeight: "800",

    margin: "0 0 5px",
  },

  pinnedText: {
    color: "#7C2D12",

    fontSize: "13px",
    lineHeight: 1.55,

    margin: 0,
  },

  /* =========================
     MAIN CARD
  ========================= */

  mainCard: {
    width: "100%",
    background: "transparent",
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    overflow: "visible",
    boxSizing: "border-box",
  },

  /* =========================
     COLORFUL TABS
  ========================= */

  tabsContainer: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "14px",
    overflowX: "auto",
    background: "#FFFFFF",
    border: "1px solid #E5EAF2",
    borderRadius: "18px",
    boxShadow: "0 7px 20px rgba(11,26,63,0.035)",
    marginBottom: "14px",
  },

  tabButton: {
    border: "none",
    outline: "none",

    padding: "10px 15px",

    borderRadius: "12px",

    display: "flex",

    alignItems: "center",
    justifyContent: "center",

    gap: "7px",

    fontFamily: "inherit",

    fontSize: "13px",
    fontWeight: "750",

    cursor: "pointer",

    whiteSpace: "nowrap",

    transition:
      "all 0.18s ease",
  },

  /* =========================
     SECTION HEADER
  ========================= */

  sectionHeadingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    padding: "20px 22px",
    background: "#FFFFFF",
    border: "1px solid #E5EAF2",
    borderRadius: "18px",
    boxShadow: "0 7px 20px rgba(11,26,63,0.035)",
    marginBottom: "12px",
  },

  sectionTitleRow: {
    display: "flex",

    alignItems: "center",

    gap: "10px",
  },

  sectionIcon: {
    width: "35px",
    height: "35px",

    borderRadius: "10px",

    display: "flex",

    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    margin: 0,

    color: "#0B1A3F",

    fontSize: "19px",

    fontWeight: "600",

    letterSpacing:
      "-0.25px",
  },

  sectionSubtitle: {
    color: "#8490A3",

    fontSize: "12.5px",

    lineHeight: 1.5,

    margin:
      "8px 0 0 45px",
  },

  countBadge: {
    padding: "7px 11px",

    borderRadius: "999px",

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
    padding: "14px",
    background: "#FFFFFF",
    border: "1px solid #E5EAF2",
    borderRadius: "18px",
    boxShadow: "0 7px 20px rgba(11,26,63,0.035)",
    marginBottom: "16px",
  },

  searchWrap: {
    height: "44px",

    position: "relative",

    display: "flex",

    alignItems: "center",

    background: "#FFFFFF",

    border:
      "1px solid #E2E8F0",

    borderRadius: "12px",

    boxSizing: "border-box",
  },

  searchIcon: {
    position: "absolute",

    left: "13px",

    color: "#94A3B8",

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

    color: "#0F172A",

    fontFamily: "inherit",

    fontSize: "13px",

    fontWeight: "500",

    boxSizing: "border-box",
  },

  selectWrap: {
    height: "44px",

    position: "relative",

    background: "#FFFFFF",

    border:
      "1px solid #E2E8F0",

    borderRadius: "12px",
  },

  select: {
    width: "100%",
    height: "100%",

    appearance: "none",
    WebkitAppearance: "none",

    border: "none",
    outline: "none",

    background: "transparent",

    color: "#334155",

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

    color: "#94A3B8",

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

    borderRadius: "10px",

    background: "#FEF2F2",

    color: "#B91C1C",

    border:
      "1px solid #FECACA",

    fontSize: "12px",

    fontWeight: "600",
  },

  /* =========================
     EMPTY STATE
  ========================= */

  emptyState: {
    minHeight: "220px",

    borderRadius: "16px",

    border: '1px solid #E5EAF0',

    background: "#FAFCFF",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    padding: "30px",

    textAlign: "center",
  },

  emptyIcon: {
    width: "50px",
    height: "50px",

    borderRadius: '50%',

    display: "flex",

    alignItems: "center",
    justifyContent: "center",

    marginBottom: "12px",
  },

  emptyTitle: {
    margin: 0,

    color: "#737B88",

    fontSize: "15px",

    fontWeight: "600",
  },

  emptyText: {
    maxWidth: "370px",

    margin:
      "6px 0 0",

    color: "#94A3B8",

    fontSize: "12px",

    lineHeight: 1.55,
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

    borderRadius: "18px",

    background: "#FFFFFF",

    border:
      "1px solid #E5E7EB",

    boxShadow:
      "0 8px 25px rgba(15,23,42,0.06)",
  },

  loadingIcon: {
    width: "46px",
    height: "46px",

    borderRadius: '50%',

    background: "#EEF3FB",

    color: "#0B1A3F",

    display: "flex",

    alignItems: "center",
    justifyContent: "center",
  },

  loadingTitle: {
    color: "#0B1A3F",

    fontSize: "15px",

    fontWeight: "800",
  },

  loadingText: {
    color: "#94A3B8",

    fontSize: "12px",

    marginTop: "4px",
  },

  /* =========================
     ERROR
  ========================= */

  errorCard: {
    display: "flex",

    gap: "13px",

    padding: "20px",

    borderRadius: "16px",

    background: "#FFF7F7",

    border:
      "1px solid #FECACA",
  },

  errorIcon: {
    width: "34px",
    height: "34px",

    flexShrink: 0,

    borderRadius: "10px",

    background: "#FEE2E2",

    color: "#B91C1C",

    display: "flex",

    alignItems: "center",
    justifyContent: "center",

    fontWeight: "900",
  },

  errorTitle: {
    color: "#991B1B",

    fontWeight: "800",

    fontSize: "14px",
  },

  errorText: {
    color: "#B91C1C",

    fontSize: "12px",

    marginTop: "3px",
  },
};