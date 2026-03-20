import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await axios.post("https://smart-campus-backend-production-bf5e.up.railway.app/auth/login", {
        email,
        password,
      });
      const data = response.data;
      localStorage.setItem("token",    data.token);
      localStorage.setItem("userName", data.name);
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userEmail", email.toLowerCase().trim());
      // Also register email locally to prevent duplicate registration
      const emails = JSON.parse(localStorage.getItem("registeredEmails") || "[]");
      if (!emails.includes(email.toLowerCase().trim())) {
        localStorage.setItem("registeredEmails", JSON.stringify([...emails, email.toLowerCase().trim()]));
      }
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Incorrect email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div style={page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Left panel ── */
        .sc-left-panel { display: flex; }
        @media (max-width: 768px) { .sc-left-panel { display: none !important; } }

        .sc-dot-grid {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px);
          background-size: 26px 26px;
          pointer-events: none;
        }

        /* ── Inputs ── */
        .sc-field-input:focus {
          outline: none;
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.14) !important;
          background: white !important;
        }
        .sc-field-input.error-state {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important;
        }
        .sc-field-input { transition: border-color 0.15s, box-shadow 0.15s, background 0.15s; }

        /* ── Submit button ── */
        .sc-submit-btn { transition: filter 0.15s, transform 0.1s, box-shadow 0.15s; }
        .sc-submit-btn:hover:not(:disabled) {
          filter: brightness(1.07);
          box-shadow: 0 10px 28px rgba(37,99,235,0.40) !important;
        }
        .sc-submit-btn:active:not(:disabled) { transform: scale(0.98); }
        .sc-submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        /* ── Feature cards ── */
        .sc-feat-card { transition: background 0.2s, transform 0.2s; }
        .sc-feat-card:hover {
          background: rgba(255,255,255,0.13) !important;
          transform: translateX(5px);
        }

        /* ── Eye button ── */
        .sc-eye-btn {
          background: none; border: none; cursor: pointer;
          color: #94a3b8; padding: 4px; line-height: 1;
          transition: color 0.15s; font-size: 16px;
        }
        .sc-eye-btn:hover { color: #475569; }

        /* ── Forgot password link ── */
        .sc-forgot { color: #2563eb; font-size: 13px; font-weight: 600; text-decoration: none; transition: color 0.15s; }
        .sc-forgot:hover { color: #1d4ed8; }

        /* ── Back link ── */
        .sc-back { transition: color 0.15s; }
        .sc-back:hover { color: #0f172a !important; }

        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sc-card { animation: fadeUp 0.38s ease; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .sc-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block; vertical-align: middle;
        }

        /* ── Divider ── */
        .sc-divider {
          display: flex; align-items: center; gap: 12px;
          color: #94a3b8; font-size: 13px; margin: 20px 0;
        }
        .sc-divider::before, .sc-divider::after {
          content: ''; flex: 1; height: 1px; background: #e2e8f0;
        }

        /* ── Shake on error ── */
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        .sc-shake { animation: shake 0.4s ease; }
      `}</style>

      {/* ── Left decorative panel ── */}
      <div className="sc-left-panel" style={leftPanel}>
        <div className="sc-dot-grid" />
        <div style={leftContent}>
          <div style={brandMark}>SC</div>
          <h2 style={leftTitle}>Smart Campus</h2>
          <p style={leftSub}>
            Your all-in-one university portal for schedules, tasks, parking, and classrooms.
          </p>

          <div style={featureList}>
            {[
              { icon: "🗓", label: "Weekly schedule at a glance" },
              { icon: "✓",  label: "Task tracking with priorities" },
              { icon: "🅿",  label: "Real-time parking availability" },
              { icon: "⌂",  label: "Classroom finder — Building A11" },
            ].map((f) => (
              <div key={f.label} className="sc-feat-card" style={featCard}>
                <span style={featIcon}>{f.icon}</span>
                <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.82)", fontWeight: "500" }}>
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={rightPanel}>
        <div className="sc-card" style={card}>

          {/* Back link */}
          <Link to="/" className="sc-back" style={backLink}>← Back to Home</Link>

          {/* Logo + heading */}
          <div style={logoWrap}>
            <div style={logo}>SC</div>
          </div>
          <h1 style={cardTitle}>Welcome back</h1>
          <p style={cardSub}>Sign in to your Smart Campus account.</p>

          {/* Error banner */}
          {error && (
            <div style={errorBanner}>
              <span style={{ marginRight: "8px" }}>⚠️</span>
              {error}
            </div>
          )}

          {/* Email */}
          <div style={fieldGroup}>
            <label style={fieldLabel}>Email address</label>
            <input
              className={`sc-field-input${error ? " error-state" : ""}`}
              style={fieldInput}
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              autoComplete="email"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div style={fieldGroup}>
            <label style={fieldLabel}>Password</label>
            <div style={passWrapper}>
              <input
                className={`sc-field-input${error ? " error-state" : ""}`}
                style={{ ...fieldInput, paddingRight: "44px" }}
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                className="sc-eye-btn"
                style={eyeBtn}
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
                type="button"
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: "right", marginTop: "-8px", marginBottom: "18px" }}>
            <Link to="/forgot-password" className="sc-forgot">Forgot password?</Link>
          </div>

          {/* Submit */}
          <button
            className="sc-submit-btn"
            style={submitBtn}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading
              ? <><span className="sc-spinner" /> &nbsp;Signing in…</>
              : "Sign In →"
            }
          </button>

          {/* Divider */}
          <div className="sc-divider">or</div>

          {/* Register link */}
          <p style={footerText}>
            Don&apos;t have an account?{" "}
            <Link to="/register" style={footerLink}>Create one free</Link>
          </p>

        </div>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const page = {
  display: "flex",
  minHeight: "100vh",
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

const leftPanel = {
  position: "relative",
  width: "420px",
  minWidth: "420px",
  background: "linear-gradient(155deg, #0f172a 0%, #1e3a5f 50%, #1e293b 100%)",
  overflow: "hidden",
};

const leftContent = {
  position: "relative",
  zIndex: 1,
  padding: "48px 36px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  width: "100%",
};

const brandMark = {
  width: "48px",
  height: "48px",
  borderRadius: "14px",
  background: "#2563eb",
  color: "white",
  fontWeight: "800",
  fontSize: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "24px",
  boxShadow: "0 8px 20px rgba(37,99,235,0.4)",
};

const leftTitle = {
  fontSize: "30px",
  fontWeight: "800",
  color: "white",
  margin: "0 0 12px",
  letterSpacing: "-0.5px",
};

const leftSub = {
  fontSize: "15px",
  color: "rgba(255,255,255,0.6)",
  lineHeight: "1.7",
  margin: "0 0 36px",
};

const featureList = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const featCard = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 14px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const featIcon = {
  fontSize: "18px",
  width: "28px",
  textAlign: "center",
  flexShrink: 0,
};

const rightPanel = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f8fafc",
  padding: "32px 20px",
};

const card = {
  width: "100%",
  maxWidth: "420px",
  background: "white",
  borderRadius: "22px",
  padding: "40px 36px",
  boxShadow: "0 8px 40px rgba(15,23,42,0.12), 0 1px 4px rgba(15,23,42,0.06)",
  border: "1.5px solid #e2e8f0",
};

const backLink = {
  display: "inline-block",
  marginBottom: "28px",
  fontSize: "13px",
  fontWeight: "600",
  color: "#64748b",
  textDecoration: "none",
  transition: "color 0.15s",
};

const logoWrap = {
  marginBottom: "20px",
};

const logo = {
  width: "52px",
  height: "52px",
  borderRadius: "15px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  fontWeight: "800",
  fontSize: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 8px 22px rgba(37,99,235,0.36)",
};

const cardTitle = {
  fontSize: "27px",
  fontWeight: "800",
  color: "#0f172a",
  margin: "0 0 6px",
  letterSpacing: "-0.5px",
};

const cardSub = {
  fontSize: "14px",
  color: "#64748b",
  margin: "0 0 24px",
  lineHeight: "1.6",
};

const errorBanner = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "10px",
  padding: "11px 14px",
  fontSize: "13px",
  color: "#dc2626",
  fontWeight: "500",
  marginBottom: "18px",
  display: "flex",
  alignItems: "center",
};

const fieldGroup = {
  marginBottom: "16px",
};

const fieldLabel = {
  display: "block",
  fontSize: "13px",
  fontWeight: "700",
  color: "#374151",
  marginBottom: "6px",
  letterSpacing: "0.01em",
};

const fieldInput = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "10px",
  border: "1.5px solid #e2e8f0",
  fontSize: "14px",
  color: "#0f172a",
  background: "#f8fafc",
  transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
  fontFamily: "'DM Sans', sans-serif",
};

const passWrapper = {
  position: "relative",
  display: "flex",
  alignItems: "center",
};

const eyeBtn = {
  position: "absolute",
  right: "12px",
  fontSize: "16px",
  lineHeight: 1,
};

const submitBtn = {
  width: "100%",
  padding: "13px",
  borderRadius: "11px",
  border: "none",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  fontWeight: "700",
  fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(37,99,235,0.28)",
  fontFamily: "'DM Sans', sans-serif",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
};

const footerText = {
  textAlign: "center",
  fontSize: "14px",
  color: "#64748b",
  margin: 0,
};

const footerLink = {
  color: "#2563eb",
  fontWeight: "700",
  textDecoration: "none",
};