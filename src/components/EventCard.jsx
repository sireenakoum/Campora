import React from "react";


export default function EventCard({ event }) {

  return (

    <div
      style={{
        background:"white",
        border:"1px solid #E5E7EB",
        borderRadius:"12px",
        padding:"20px",
        marginBottom:"12px",
      }}
    >

      <div
        style={{
          display:"flex",
          justifyContent:"space-between",
          alignItems:"center",
        }}
      >

        <h3
          style={{
            color:"#0B1A3F",
          }}
        >
          {event.title}
        </h3>


        {event.is_online && (

          <span
            style={{
              background:"#DCFCE7",
              color:"#166534",
              padding:"5px 10px",
              borderRadius:"20px",
              fontSize:"12px",
            }}
          >
            Online
          </span>

        )}

      </div>


      <p
        style={{
          color:"#6B7280",
        }}
      >
        {event.description}
      </p>


      <p>
        📍 {event.location}
      </p>


      <p
        style={{
          color:"#1D4ED8",
        }}
      >

        {new Date(
          event.start_date
        ).toLocaleString()}

      </p>


    </div>

  );

}