import React from "react";


export default function EventCard({ event }) {

  return (

    <div
      style={{
        background:"var(--surface-container-lowest)",
        border:"1px solid var(--divider)",
        borderRadius:"var(--radius-secondary)",
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
            color:"var(--campora-text)",
          }}
        >
          {event.title}
        </h3>


        {event.is_online && (

          <span
            style={{
              background:"var(--tone-success-soft)",
              color:"var(--tone-success)",
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
          color:"var(--campora-body)",
        }}
      >
        {event.description}
      </p>


      <p>
        📍 {event.location}
      </p>


      <p
        style={{
          color:"var(--campora-navy)",
        }}
      >

        {new Date(
          event.start_date
        ).toLocaleString()}

      </p>


    </div>

  );

}