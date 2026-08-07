import React from "react";
import { ExternalLink } from "lucide-react";


export default function ResourceCard({ resource }) {

  return (

    <a
      href={resource.url}
      target="_blank"
      rel="noreferrer"
      style={{
        display:"block",
        background:"white",
        border:"1px solid #E5E7EB",
        borderRadius:"12px",
        padding:"20px",
        marginBottom:"12px",
        textDecoration:"none",
      }}
    >

      <div
        style={{
          display:"flex",
          alignItems:"center",
          gap:"8px",
        }}
      >

        <ExternalLink
          size={18}
          color="#1D4ED8"
        />


        <h3
          style={{
            color:"#0B1A3F",
          }}
        >
          {resource.title}
        </h3>


      </div>


      <p
        style={{
          color:"#6B7280",
        }}
      >
        {resource.description}
      </p>


      <small
        style={{
          color:"#1D4ED8",
        }}
      >
        {resource.category} • {resource.type}
      </small>


    </a>

  );

}