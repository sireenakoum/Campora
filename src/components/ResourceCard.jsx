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
        background:"var(--surface-container-lowest)",
        border:"1px solid var(--divider)",
        borderRadius:"var(--radius-secondary)",
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
          color="var(--campora-navy)"
        />


        <h3
          style={{
            color:"var(--campora-text)",
          }}
        >
          {resource.title}
        </h3>


      </div>


      <p
        style={{
          color:"var(--campora-body)",
        }}
      >
        {resource.description}
      </p>


      <small
        style={{
          color:"var(--campora-navy)",
        }}
      >
        {resource.category} • {resource.type}
      </small>


    </a>

  );

}