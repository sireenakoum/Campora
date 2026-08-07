import React, { useEffect, useState } from "react";
import {
  Bell,
  Search,
  Calendar,
  BookOpen,
  Megaphone,
  ExternalLink,
} from "lucide-react";

import {
  getAnnouncements,
  getCampusNews,
  getEvents,
  getResources,
} from "../lib/campusHub";

import AnnouncementCard from "../components/AnnouncementsCard";
import NewsCard from "../components//NewsCard";
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
          resourcesData
        ] = await Promise.all([

          getAnnouncements(),
          getCampusNews(),
          getEvents({ upcoming:true }),
          getResources()

        ]);


        setAnnouncements(announcementsData || []);
        setNews(newsData || []);
        setEvents(eventsData || []);
        setResources(resourcesData || []);


      } catch(err){

        setError(err.message);

      } finally {

        setLoading(false);

      }

    }


    loadData();

  }, []);



  async function handleSearch(value){

    setSearch(value);

    try{

      if(activeTab === "announcements"){

        const data = await getAnnouncements({
          search:value,
          category
        });

        setAnnouncements(data || []);

      }


      if(activeTab === "news"){

        const data = await getCampusNews({
          search:value
        });

        setNews(data || []);

      }


      if(activeTab === "events"){

        const data = await getEvents({
          search:value,
          category
        });

        setEvents(data || []);

      }


      if(activeTab === "resources"){

        const data = await getResources({
          search:value,
          category
        });

        setResources(data || []);

      }


    }catch(err){

      setError(err.message);

    }

  }



  async function handleCategory(value){

    setCategory(value);


    try{


      if(activeTab === "announcements"){

        const data = await getAnnouncements({
          search,
          category:value
        });

        setAnnouncements(data || []);

      }



      if(activeTab === "events"){

        const data = await getEvents({
          search,
          category:value
        });

        setEvents(data || []);

      }



      if(activeTab === "resources"){

        const data = await getResources({
          search,
          category:value
        });

        setResources(data || []);

      }


    }catch(err){

      setError(err.message);

    }

  }




  const tabs = [

    {
      key:"announcements",
      label:"Announcements",
      icon:<Megaphone size={16}/>
    },

    {
      key:"news",
      label:"Campus News",
      icon:<BookOpen size={16}/>
    },

    {
      key:"events",
      label:"Events",
      icon:<Calendar size={16}/>
    },

    {
      key:"resources",
      label:"Resources",
      icon:<ExternalLink size={16}/>
    }

  ];



  const pinned = announcements.filter(
    item => item.is_pinned
  );



  if(loading){

    return (
      <div>
        Loading Campus Hub...
      </div>
    );

  }



  if(error){

    return (
      <div>
        Error: {error}
      </div>
    );

  }



  return (

    <div
      style={{
        width:"100%",
        padding:"30px 0"
      }}
    >


      <h1
        style={{
          fontSize:"36px",
          fontWeight:"900",
          color:"#0B1A3F"
        }}
      >
        Campus Hub
      </h1>


      <p
        style={{
          color:"#6B7280",
          marginBottom:"30px"
        }}
      >
        Stay updated with announcements, news, events, and resources.
      </p>



      {pinned.length > 0 && (

        <div
          style={{
            background:"#FEE2E2",
            padding:"20px",
            borderRadius:"12px",
            display:"flex",
            gap:"12px",
            marginBottom:"25px"
          }}
        >

          <Bell color="#991B1B"/>


          <div>

            <strong
              style={{
                color:"#991B1B"
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




      <div
        style={{
          display:"flex",
          gap:"10px",
          marginBottom:"20px",
          flexWrap:"wrap"
        }}
      >

        {tabs.map(tab=>(

          <button

            key={tab.key}

            onClick={()=>{

              setActiveTab(tab.key);
              setSearch("");
              setCategory("");

            }}

            style={{

              display:"flex",
              alignItems:"center",
              gap:"6px",
              padding:"10px 15px",
              borderRadius:"20px",
              border:"none",
              cursor:"pointer",

              background:
              activeTab===tab.key
              ? "#0B1A3F"
              : "#E5E7EB",

              color:
              activeTab===tab.key
              ? "white"
              : "#111827"

            }}

          >

            {tab.icon}

            {tab.label}

          </button>

        ))}

      </div>




      <div
        style={{
          display:"flex",
          gap:"10px",
          marginBottom:"25px"
        }}
      >


        <div
          style={{
            position:"relative",
            flex:1
          }}
        >

          <Search

            size={18}

            style={{

              position:"absolute",
              left:"12px",
              top:"12px",
              color:"#9CA3AF"

            }}

          />


          <input

            value={search}

            onChange={(e)=>handleSearch(e.target.value)}

            placeholder="Search..."

            style={{

              width:"100%",
              padding:"12px 12px 12px 40px",
              borderRadius:"10px",
              border:"1px solid #ddd"

            }}

          />

        </div>



        <select

          value={category}

          onChange={(e)=>handleCategory(e.target.value)}

        >

          <option value="">
            All
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


      </div>





      {activeTab==="announcements" && (

        <>

        {announcements.map(item=>(

          <AnnouncementCard

            key={item.id}

            announcement={item}

          />

        ))}

        </>

      )}





      {activeTab==="news" && (

        <>

        {news.map(item=>(

          <NewsCard

            key={item.id}

            news={item}

          />

        ))}

        </>

      )}





      {activeTab==="events" && (

        <>

        {events.map(item=>(

          <EventCard

            key={item.id}

            event={item}

          />

        ))}

        </>

      )}





      {activeTab==="resources" && (

        <>

        {resources.map(item=>(

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