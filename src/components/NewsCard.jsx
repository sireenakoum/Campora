import React from "react";


export default function NewsCard({ news }) {

  return (

    <div
      style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #E5E7EB",
        padding: "20px",
        marginBottom: "12px",
      }}
    >

      <h3
        style={{
          color: "#0B1A3F",
          marginBottom: "8px",
        }}
      >
        {news.title}
      </h3>


      {news.author && (
        <p
          style={{
            fontSize: "13px",
            color: "#6B7280",
          }}
        >
          By {news.author}
        </p>
      )}


      <p
        style={{
          color: "#6B7280",
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
                background:"#F3F4F6",
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