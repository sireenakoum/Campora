import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const cleanEmail = email.toLowerCase().trim();
if (!cleanEmail.endsWith("@aub.edu.lb") && !cleanEmail.endsWith("@mail.aub.edu")) {
  setError("Access restricted: You must use a valid AUB email address.");
  return;
}

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage("Password reset link sent! Check your inbox.");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logoTitle}>Campora</h1>
          <p style={styles.subtitle}>Reset Your Password</p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}
        {message && <div style={styles.successBox}>{message}</div>}

        <form onSubmit={handleResetRequest} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="username@aub.edu.lb"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Sending link..." : "Send Reset Link"}
          </button>
        </form>

        <div style={styles.footer}>
          <Link to="/login" style={styles.backLink}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F4F8",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: "2.5rem",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
    width: "100%",
    maxWidth: "400px",
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  logoTitle: {
    color: "#0F294A",
    fontSize: "2rem",
    fontWeight: "700",
    margin: "0 0 0.25rem 0",
  },
  subtitle: {
    color: "#64748B",
    fontSize: "0.9rem",
    margin: 0,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    fontSize: "0.85rem",
    marginBottom: "1.25rem",
    border: "1px solid #FCA5A5",
  },
  successBox: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    fontSize: "0.85rem",
    marginBottom: "1.25rem",
    border: "1px solid #86EFAC",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#1E293B",
  },
  input: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid #CBD5E1",
    fontSize: "0.95rem",
    outline: "none",
  },
  button: {
    backgroundColor: "#0F294A",
    color: "#FFFFFF",
    padding: "0.85rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  footer: {
    marginTop: "1.5rem",
    textAlign: "center",
  },
  backLink: {
    fontSize: "0.85rem",
    color: "#2563EB",
    textDecoration: "none",
    fontWeight: "500",
  },
};
