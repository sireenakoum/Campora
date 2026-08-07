import React from "react";
import { Bell } from "lucide-react";


export default function AnnouncementCard({ announcement }) {

  return (

    <div
      style={{
        background:"white",
        padding:"20px",
        borderRadius:"12px",
        border:"1px solid #E5E7EB",
        marginBottom:"12px",
        display:"flex",
        gap:"15px"
      }}
    >

      {announcement.is_pinned && (
        <Bell
          size={20}
          color="#991B1B"
        />
      )}


      <div>

        <div
          style={{
            display:"flex",
            gap:"10px",
            alignItems:"center"
          }}
        >

          <h3
            style={{
              margin:0,
              color:"#0B1A3F"
            }}
          >
            {announcement.title}
          </h3>


          {announcement.category && (

            <span
              style={{
                background:"#EFF6FF",
                color:"#1D4ED8",
                padding:"3px 10px",
                borderRadius:"20px",
                fontSize:"12px"
              }}
            >

              {announcement.category}

            </span>

          )}

        </div>


        <p
          style={{
            color:"#6B7280"
          }}
        >
          {announcement.content}
        </p>


        <small
          style={{
            color:"#9CA3AF"
          }}
        >

          {new Date(
            announcement.created_at
          ).toLocaleDateString()}

        </small>


      </div>


    </div>

  );

}