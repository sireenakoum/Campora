import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./lib/supabase";
import ErrorMessage from "./ErrorMessage";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); 
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
      // Successful login logic here (e.g., redirect to dashboard)
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

        {/* Display errors with custom styled component */}
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

// Styles to match the provided design
const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6", // Light gray background
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: "3rem", // More generous padding
    borderRadius: "20px", // More rounded corners
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)", // Soft shadow
    width: "100%",
    maxWidth: "420px", // Ideal width from image
  },
  header: {
    textAlign: "center",
    marginBottom: "2.5rem",
  },
  logoTitle: {
    color: "#111827",
    fontSize: "2.25rem", // Larger, more prominent title
    fontWeight: "800",
    margin: "0 0 0.5rem 0",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: "1rem",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#1F2937",
  },
  input: {
    padding: "0.9rem 1.25rem", // Slightly larger inputs
    borderRadius: "10px",
    border: "1px solid #D1D5DB",
    fontSize: "1rem",
    color: "#111827",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  inputFocus: {
    borderColor: "#3B82F6",
  },
  button: {
    backgroundColor: "#1F2937", // Dark button color
    color: "#FFFFFF",
    padding: "1rem",
    borderRadius: "10px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  footer: {
    marginTop: "2rem",
    textAlign: "center",
  },
  forgotLink: {
    color: "#2563EB", // Blue link color
    textDecoration: "none",
    fontSize: "0.95rem",
    fontWeight: "500",
  },
};
