import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ErrorMessage from "../ErrorMessage";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    // 1. Enforce strict @mail.aub.edu requirement
    if (!cleanEmail.endsWith("@mail.aub.edu")) {
      setError("Access restricted: You must use a valid @mail.aub.edu email address.");
      return;
    }

    // 2. Passwords check
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    // 3. Register user in Supabase
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
    });

    setLoading(false);

    // ✅ Fixed (safely extracting string text)
if (signUpError) {
  setError(signUpError.message || String(signUpError));
}
     else {
      alert("Sign-up successful! You can now log in.");
      navigate("/login");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f6f8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "2.5rem 2rem",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
          textAlign: "center",
        }}
      >
        {/* Main Logo Title */}
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "800",
            color: "#111827",
            margin: "0 0 0.25rem 0",
            letterSpacing: "-0.5px",
          }}
        >
          Campora
        </h1>
        
        {/* Subtitle */}
        <p
          style={{
            fontSize: "0.95rem",
            color: "#6b7280",
            margin: "0 0 2rem 0",
          }}
        >
          Academic Portal Registration
        </p>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSignUp} style={{ textAlign: "left" }}>
          {/* Email Input */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "0.5rem",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="username@mail.aub.edu"
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "0.95rem",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "0.5rem",
              }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "0.95rem",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          {/* Confirm Password Input */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="confirmPassword"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "0.5rem",
              }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "0.95rem",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.85rem",
              backgroundColor: "#1e293b",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "background-color 0.2s",
            }}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Footer Link */}
        <div style={{ marginTop: "1.75rem", fontSize: "0.875rem" }}>
          <span style={{ color: "#6b7280" }}>Already have an account? </span>
          <Link
            to="/login"
            style={{
              fontWeight: "600",
              color: "#1e293b",
              textDecoration: "none",
            }}
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
