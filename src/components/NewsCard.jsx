import React from "react";


export default function NewsCard({ news }) {

  return (

    <div
      style={{
        background: "var(--surface-container-lowest)",
        borderRadius: "var(--radius-secondary)",
        border: "1px solid var(--divider)",
        padding: "20px",
        marginBottom: "12px",
      }}
    >

      <h3
        style={{
          color: "var(--campora-text)",
          marginBottom: "8px",
        }}
      >
        {news.title}
      </h3>


      {news.author && (
        <p
          style={{
            fontSize: "13px",
            color: "var(--campora-muted)",
          }}
        >
          By {news.author}
        </p>
      )}


      <p
        style={{
          color: "var(--campora-body)",
        }}
      >
        {news.content}
      </p>


      {news.tags && news.tags.length > 0 && (

        <div
          style={{
            display:"flex",
            gap:"8px",
            flexWrap:"wrap",
          }}
        >

          {news.tags.map((tag)=>(

            <span
              key={tag}
              style={{
                background:"var(--surface-container)",
                padding:"4px 10px",
                borderRadius:"20px",
                fontSize:"12px",
              }}
            >
              #{tag}
            </span>

          ))}

        </div>

      )}

    </div>

  );

}