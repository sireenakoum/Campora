import React, { useEffect, useState } from "react";
import {
  Megaphone,
  Search,
  Calendar,
  BookOpen,
  ExternalLink,
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
  const [activeTab, setActiveTab] = useState("announcements");
  const [category, setCategory] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [
          announcementsData,
          newsData,
          eventsData,
          resourcesData,
        ] = await Promise.all([
          getAnnouncements(),
          getCampusNews(),
          getEvents({ upcoming: true }),
          getResources(),
        ]);

        setAnnouncements(announcementsData || []);
        setNews(newsData || []);
        setEvents(eventsData || []);
        setResources(resourcesData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleSearch(value) {
    setSearch(value);

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
      setError(err.message);
    }
  }

  async function handleCategory(value) {
    setCategory(value);

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
      setError(err.message);
    }
  }

  const tabs = [
    {
      key: "announcements",
      label: "Announcements",
      icon: <Megaphone size={16} />,
    },
    {
      key: "news",
      label: "Campus News",
      icon: <BookOpen size={16} />,
    },
    {
      key: "events",
      label: "Events",
      icon: <Calendar size={16} />,
    },
    {
      key: "resources",
      label: "Resources",
      icon: <ExternalLink size={16} />,
    },
  ];

  const pinned = announcements.filter(
    (item) => item.is_pinned
  );

  if (loading) {
    return <div>Loading Campus Hub...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div
      style={{
        width: "100%",
        padding: "30px 0",
      }}
    >
      <h1
        style={{
          fontSize: "36px",
          fontWeight: "900",
          color: "#1A1B1F",
          marginBottom: "8px",
        }}
      >
        Campus Hub
      </h1>

      <p
        style={{
          color: "#6B7280",
          marginBottom: "25px",
        }}
      >
        Stay updated with announcements, news, events, and resources.
      </p>

      {/* AUB Campus Hero Image */}
      <div
        style={{
          width: "100%",
          height: "280px",
          borderRadius: "16px",
          overflow: "hidden",
          marginBottom: "30px",
          position: "relative",
        }}
      >
        <img
          src="/aub-campus.jpg"
          alt="AUB Campus"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, rgba(0,45,98,0.55), rgba(0,45,98,0.05))",
            display: "flex",
            alignItems: "center",
            padding: "30px",
          }}
        >
          <div>
            <h2
              style={{
                color: "white",
                fontSize: "30px",
                fontWeight: "800",
                margin: 0,
              }}
            >
              American University of Beirut
            </h2>

            <p
              style={{
                color: "white",
                fontSize: "16px",
                marginTop: "8px",
              }}
            >
              Your central hub for campus updates.
            </p>
          </div>
        </div>
      </div>

      {/* Pinned Announcement */}
      {pinned.length > 0 && (
        <div
          style={{
            background: "#FEE2E2",
            padding: "20px",
            borderRadius: "12px",
            display: "flex",
            gap: "12px",
            marginBottom: "25px",
          }}
        >
          <Megaphone
            size={24}
            color="#991B1B"
            style={{
              flexShrink: 0,
              marginTop: "2px",
            }}
          />

          <div>
            <strong
              style={{
                color: "#991B1B",
              }}
            >
              PINNED ANNOUNCEMENT
            </strong>

            <h3>
              {pinned[0].title}
            </h3>

            <p>
              {pinned[0].content}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setSearch("");
              setCategory("");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 15px",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              background:
                activeTab === tab.key
                  ? "#002D62"
                  : "#E5E7EB",
              color:
                activeTab === tab.key
                  ? "white"
                  : "#111827",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Category */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "25px",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
          }}
        >
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "12px",
              color: "#9CA3AF",
            }}
          />

          <input
            value={search}
            onChange={(e) =>
              handleSearch(e.target.value)
            }
            placeholder="Search..."
            style={{
              width: "100%",
              padding: "12px 12px 12px 40px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              boxSizing: "border-box",
            }}
          />
        </div>

        <select
          value={category}
          onChange={(e) =>
            handleCategory(e.target.value)
          }
          style={{
            padding: "10px 15px",
            borderRadius: "10px",
            border: "1px solid #ddd",
          }}
        >
          <option value="">All</option>
          <option value="Academic">Academic</option>
          <option value="IT">IT</option>
          <option value="Social">Social</option>
        </select>
      </div>

      {/* Announcements */}
      {activeTab === "announcements" && (
        <>
          {announcements.map((item) => (
            <AnnouncementCard
              key={item.id}
              announcement={item}
            />
          ))}
        </>
      )}

      {/* Campus News */}
      {activeTab === "news" && (
        <>
          {news.map((item) => (
            <NewsCard
              key={item.id}
              news={item}
            />
          ))}
        </>
      )}

      {/* Events */}
      {activeTab === "events" && (
        <>
          {events.map((item) => (
            <EventCard
              key={item.id}
              event={item}
            />
          ))}
        </>
      )}

      {/* Resources */}
      {activeTab === "resources" && (
        <>
          {resources.map((item) => (
            <ResourceCard
              key={item.id}
              resource={item}
            />
          ))}
        </>
      )}
    </div>
  );
}