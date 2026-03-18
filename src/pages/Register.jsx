import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const STEPS = ["Account", "Details"];

export default function Register() {
  const navigate = useNavigate();

  // Step 1
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPass, setShowPass] = useState(false);

  // Step 2 (display only — not sent to API yet)
  const [university] = useState("Imam Abdulrahman Bin Faisal University");
  const [college]    = useState("College of Computer Science and Information Technology");

  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  // ── Validation step 1 ──
  const validateStep1 = () => {
    if (!name.trim())    { setError("Full name is required."); return false; }
    if (!email.trim())   { setError("Email address is required."); return false; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address."); return false; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return false; }
    if (password !== confirm)  { setError("Passwords do not match."); return false; }
    return true;
  };

  const nextStep = () => {
    setError("");
    if (validateStep1()) setStep(1);
  };

  const handleRegister = async () => {
    setError("");

    // ── Check locally if this email was registered before ──
    const registeredEmails = JSON.parse(localStorage.getItem("registeredEmails") || "[]");
    if (registeredEmails.includes(email.toLowerCase().trim())) {
      setError("This email is already registered. Please sign in.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await axios.post("https://smart-campus-backend-production-bf5e.up.railway.app/auth/register", {
        name,
        email,
        password,
        role: "STUDENT",
      });
      // Save email locally to prevent future duplicates
      const updated = [...registeredEmails, email.toLowerCase().trim()];
      localStorage.setItem("registeredEmails", JSON.stringify(updated));
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2200);
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 409) {
        // Also save to local list if server says duplicate
        const updated = [...registeredEmails, email.toLowerCase().trim()];
        localStorage.setItem("registeredEmails", JSON.stringify(updated));
        setError("This email is already registered. Please sign in.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") step === 0 ? nextStep() : handleRegister();
  };

  // Password strength
  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6)  s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(s, 4);
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"][strength];

  return (
    <div style={page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .sc-field-input:focus {
          outline: none;
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.14);
          background: white;
        }
        .sc-field-input.err {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.10);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .sc-left-panel { display: none !important; }
          .sc-right-panel { padding: 24px 16px !important; }
          .sc-card { padding: 28px 20px !important; }
        }

        .sc-reg-btn {
          transition: filter 0.15s, transform 0.1s, box-shadow 0.15s;
        }
        .sc-reg-btn:hover:not(:disabled) {
          filter: brightness(1.07);
          box-shadow: 0 8px 24px rgba(34,197,94,0.36);
        }
        .sc-reg-btn:active:not(:disabled) { transform: scale(0.98); }
        .sc-reg-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .sc-back-step {
          background: none; border: none; cursor: pointer;
          color: #64748b; font-size: 13px; font-weight: 600;
          padding: 0; font-family: 'DM Sans', sans-serif;
          transition: color 0.15s;
        }
        .sc-back-step:hover { color: #0f172a; }

        .sc-eye-btn {
          position: absolute; right: 12px;
          background: none; border: none; cursor: pointer;
          color: #94a3b8; font-size: 16px; padding: 4px;
          transition: color 0.15s; line-height: 1;
        }
        .sc-eye-btn:hover { color: #475569; }

        .sc-readonly-field {
          width: 100%; padding: 11px 14px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #f1f5f9;
          color: #64748b; font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          cursor: not-allowed;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sc-card { animation: fadeUp 0.35s ease; }
        .sc-step-content { animation: fadeUp 0.25s ease; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .sc-spinner {
          width: 17px; height: 17px;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: white; border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block; vertical-align: middle;
        }

        @keyframes successPop {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.06); }
          100% { transform: scale(1); opacity: 1; }
        }
        .sc-success { animation: successPop 0.45s ease forwards; }
      `}</style>

      {/* Left decorative panel */}
      <div className="sc-left-panel" style={leftPanel}>
        <div style={dotGrid} />
        <div style={leftContent}>
          <div style={brandMark}>SC</div>
          <h2 style={leftTitle}>Join Smart Campus</h2>
          <p style={leftSub}>
            Create your free student account and get instant access to all campus services.
          </p>
          <div style={bulletList}>
            {[
              "Free forever for IAU students",
              "Private — your data stays yours",
              "Works on any device",
              "Set up in under 2 minutes",
            ].map((b) => (
              <div key={b} style={bullet}>
                <span style={bulletDot}>✓</span>
                <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.78)", fontWeight: "500" }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="sc-right-panel" style={rightPanel}>
        <div className="sc-card" style={card}>

          <Link to="/" style={backLink}>← Back to Home</Link>

          {/* Step indicator */}
          <div style={stepRow}>
            {STEPS.map((label, i) => (
              <div key={label} style={stepItem}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: i <= step ? "#22c55e" : "#e2e8f0",
                  color: i <= step ? "white" : "#94a3b8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", fontWeight: "700",
                  transition: "background 0.2s",
                }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: "12px", fontWeight: "600", color: i <= step ? "#0f172a" : "#94a3b8" }}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: "2px", background: i < step ? "#22c55e" : "#e2e8f0", transition: "background 0.3s" }} />
                )}
              </div>
            ))}
          </div>

          {/* Logo */}
          <div style={logoWrap}>
            <div style={logo}>SC</div>
          </div>
          <h1 style={cardTitle}>
            {step === 0 ? "Create your account" : "Confirm your details"}
          </h1>
          <p style={cardSub}>
            {step === 0
              ? "Fill in the form below to get started."
              : "Review your university information."}
          </p>

          {/* Success state */}
          {success ? (
            <div className="sc-success" style={successBox}>
              <div style={{ fontSize: "44px", marginBottom: "12px" }}>🎉</div>
              <p style={{ fontWeight: "800", fontSize: "18px", color: "#0f172a", margin: "0 0 6px" }}>
                Account created!
              </p>
              <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                Redirecting you to login…
              </p>
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div style={errorBanner}>
                  <span style={{ marginRight: "8px" }}>⚠️</span>{error}
                </div>
              )}

              {/* ── Step 0: Account info ── */}
              {step === 0 && (
                <div className="sc-step-content">
                  <div style={fieldGroup}>
                    <label style={fieldLabel}>Full Name</label>
                    <input
                      className="sc-field-input"
                      style={fieldInput}
                      type="text"
                      placeholder="e.g. Ali Al-Mansour"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(""); }}
                      onKeyDown={handleKeyDown}
                      autoComplete="name"
                    />
                  </div>

                  <div style={fieldGroup}>
                    <label style={fieldLabel}>Email Address</label>
                    <input
                      className="sc-field-input"
                      style={fieldInput}
                      type="email"
                      placeholder="you@iau.edu.sa"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      onKeyDown={handleKeyDown}
                      autoComplete="email"
                    />
                  </div>

                  <div style={fieldGroup}>
                    <label style={fieldLabel}>Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        className="sc-field-input"
                        style={{ ...fieldInput, paddingRight: "44px" }}
                        type={showPass ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        onKeyDown={handleKeyDown}
                        autoComplete="new-password"
                      />
                      <button className="sc-eye-btn" onClick={() => setShowPass(!showPass)} tabIndex={-1} type="button">
                        {showPass ? "🙈" : "👁"}
                      </button>
                    </div>
                    {/* Strength bar */}
                    {password && (
                      <div style={{ marginTop: "8px" }}>
                        <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                          {[1,2,3,4].map((i) => (
                            <div key={i} style={{
                              flex: 1, height: "4px", borderRadius: "999px",
                              background: i <= strength ? strengthColor : "#e2e8f0",
                              transition: "background 0.2s",
                            }} />
                          ))}
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: strengthColor }}>{strengthLabel}</span>
                      </div>
                    )}
                  </div>

                  <div style={fieldGroup}>
                    <label style={fieldLabel}>Confirm Password</label>
                    <input
                      className={`sc-field-input${confirm && confirm !== password ? " err" : ""}`}
                      style={fieldInput}
                      type="password"
                      placeholder="Re-enter password"
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                      onKeyDown={handleKeyDown}
                      autoComplete="new-password"
                    />
                    {confirm && confirm !== password && (
                      <p style={{ fontSize: "12px", color: "#ef4444", margin: "4px 0 0", fontWeight: "600" }}>
                        Passwords don't match
                      </p>
                    )}
                  </div>

                  <button className="sc-reg-btn" style={submitBtn} onClick={nextStep}>
                    Continue →
                  </button>
                </div>
              )}

              {/* ── Step 1: Details ── */}
              {step === 1 && (
                <div className="sc-step-content">
                  <div style={fieldGroup}>
                    <label style={fieldLabel}>University</label>
                    <input className="sc-readonly-field" value={university} readOnly />
                  </div>

                  <div style={fieldGroup}>
                    <label style={fieldLabel}>College</label>
                    <input className="sc-readonly-field" value={college} readOnly />
                  </div>

                  <div style={fieldGroup}>
                    <label style={fieldLabel}>Account Name</label>
                    <input className="sc-readonly-field" value={name} readOnly />
                  </div>

                  <div style={fieldGroup}>
                    <label style={fieldLabel}>Email</label>
                    <input className="sc-readonly-field" value={email} readOnly />
                  </div>

                  <button
                    className="sc-reg-btn"
                    style={submitBtn}
                    onClick={handleRegister}
                    disabled={loading}
                  >
                    {loading
                      ? <><span className="sc-spinner" /> &nbsp;Creating account…</>
                      : "Create Account ✓"
                    }
                  </button>

                  <div style={{ textAlign: "center", marginTop: "12px" }}>
                    <button className="sc-back-step" onClick={() => { setStep(0); setError(""); }}>
                      ← Back
                    </button>
                  </div>
                </div>
              )}

              {/* Login link */}
              <p style={footerText}>
                Already have an account?{" "}
                <Link to="/login" style={footerLink}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const page = {
  display: "flex",
  minHeight: "100vh",
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

const leftPanel = {
  display: "flex",
  position: "relative",
  width: "400px",
  minWidth: "400px",
  background: "linear-gradient(155deg, #052e16 0%, #14532d 50%, #166534 100%)",
  overflow: "hidden",
  // hidden on mobile via CSS class below
};

const dotGrid = {
  position: "absolute",
  inset: 0,
  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px)",
  backgroundSize: "26px 26px",
  pointerEvents: "none",
};

const leftContent = {
  position: "relative",
  zIndex: 1,
  padding: "48px 36px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const brandMark = {
  width: "48px", height: "48px",
  borderRadius: "14px",
  background: "#22c55e",
  color: "white",
  fontWeight: "800", fontSize: "18px",
  display: "flex", alignItems: "center", justifyContent: "center",
  marginBottom: "24px",
  boxShadow: "0 8px 20px rgba(34,197,94,0.4)",
};

const leftTitle = {
  fontSize: "28px", fontWeight: "800",
  color: "white", margin: "0 0 12px",
  letterSpacing: "-0.4px",
};

const leftSub = {
  fontSize: "15px", color: "rgba(255,255,255,0.6)",
  lineHeight: "1.7", margin: "0 0 32px",
};

const bulletList = { display: "flex", flexDirection: "column", gap: "12px" };

const bullet = {
  display: "flex", alignItems: "center", gap: "10px",
};

const bulletDot = {
  width: "22px", height: "22px",
  borderRadius: "50%",
  background: "rgba(34,197,94,0.25)",
  border: "1px solid rgba(34,197,94,0.4)",
  color: "#86efac",
  fontSize: "12px", fontWeight: "800",
  display: "flex", alignItems: "center", justifyContent: "center",
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
  maxWidth: "440px",
  background: "white",
  borderRadius: "20px",
  padding: "36px 36px 32px",
  boxShadow: "0 4px 32px rgba(15,23,42,0.10)",
  border: "1px solid #e2e8f0",
};

const backLink = {
  display: "inline-block",
  marginBottom: "20px",
  fontSize: "13px",
  fontWeight: "600",
  color: "#64748b",
  textDecoration: "none",
};

const stepRow = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "24px",
};

const stepItem = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flex: 1,
};

const logoWrap = { marginBottom: "16px" };

const logo = {
  width: "48px", height: "48px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white", fontWeight: "800", fontSize: "18px",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 6px 16px rgba(34,197,94,0.30)",
};

const cardTitle = {
  fontSize: "24px", fontWeight: "800",
  color: "#0f172a", margin: "0 0 5px",
  letterSpacing: "-0.3px",
};

const cardSub = {
  fontSize: "14px", color: "#64748b",
  margin: "0 0 20px", lineHeight: "1.6",
};

const errorBanner = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "13px", color: "#dc2626", fontWeight: "500",
  marginBottom: "16px",
  display: "flex", alignItems: "center",
};

const fieldGroup = { marginBottom: "14px" };

const fieldLabel = {
  display: "block",
  fontSize: "13px", fontWeight: "700",
  color: "#374151", marginBottom: "6px",
};

const fieldInput = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "10px",
  border: "1.5px solid #e2e8f0",
  fontSize: "14px", color: "#0f172a",
  background: "#f8fafc",
  transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
  fontFamily: "'DM Sans', sans-serif",
};

const submitBtn = {
  width: "100%",
  padding: "13px",
  borderRadius: "11px",
  border: "none",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white", fontWeight: "700", fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(34,197,94,0.28)",
  fontFamily: "'DM Sans', sans-serif",
  display: "flex", alignItems: "center", justifyContent: "center",
  gap: "6px",
  marginTop: "4px",
};

const successBox = {
  textAlign: "center",
  padding: "32px 20px",
  background: "#f0fdf4",
  borderRadius: "14px",
  border: "1.5px solid #bbf7d0",
};

const footerText = {
  textAlign: "center",
  fontSize: "13px", color: "#64748b",
  marginTop: "18px", marginBottom: 0,
};

const footerLink = {
  color: "#16a34a", fontWeight: "700", textDecoration: "none",
};