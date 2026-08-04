
import React from "react";

export default function ErrorMessage({ message, onClose }) {
  if (!message) return null;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Warning Icon */}
        <svg
          style={styles.icon}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span style={styles.text}>{message}</span>
      </div>

      {onClose && (
        <button 
          type="button" 
          onClick={onClose} 
          style={styles.closeButton} 
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#FEF2F2",
    border: "1px solid #FCA5A5",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    marginBottom: "1.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
  },
  content: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
  },
  icon: {
    width: "18px",
    height: "18px",
    color: "#DC2626",
    flexShrink: 0,
  },
  text: {
    color: "#991B1B",
    fontSize: "0.85rem",
    fontWeight: "500",
    lineHeight: "1.4",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "#991B1B",
    fontSize: "0.9rem",
    cursor: "pointer",
    padding: "2px 4px",
    lineHeight: 1,
    opacity: 0.7,
  },
};