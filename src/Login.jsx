import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ErrorMessage from "./ErrorMessage";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevents page refresh/redirect to login
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    // Enforce strict @mail.aub.edu requirement
    if (!cleanEmail.endsWith("@mail.aub.edu")) {
      setError("Access restricted: You must use a valid @mail.aub.edu email address.");
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError) {
      setError(authError.message);
    } else {
      alert("Successfully logged in!");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logoTitle}>Campora</h1>
          <p style={styles.subtitle}>Academic Portal Login</p>
        </div>

        {/* Custom styled Error Message component */}
        <ErrorMessage message={error} onClose={() => setError("")} />

        <form onSubmit={handleLogin} style={styles.form} noValidate>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="username@mail.aub.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div style={styles.footer}>
          <Link to="/forgot-password" style={styles.forgotLink}>
            Forgot Password?
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
    marginTop: "1.25rem",
    textAlign: "center",
  },
  forgotLink: {
    color: "#2563EB",
    textDecoration: "none",
    fontSize: "0.85rem",
    fontWeight: "500",
  },
};
