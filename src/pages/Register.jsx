import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirm.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: "STUDENT",
      });

      setSuccess(true);

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      console.error(err);

      if (err?.response?.status === 409) {
        setError("This email is already registered. Please sign in.");
      } else {
        setError(
          err?.response?.data?.message ||
            "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleRegister();
  };

  return (
    <div style={page}>
      <div style={leftPanel} className="register-left-panel">
        <div style={leftContent}>
          <div style={brandBox}>SC</div>
          <h2 style={leftTitle}>Smart Campus</h2>
          <p style={leftSub}>
            Create your account and access schedules, tasks, parking, and more.
          </p>
        </div>
      </div>

      <div style={rightPanel}>
        <div style={card}>
          <Link to="/" style={backLink}>← Back</Link>

          <h1 style={cardTitle}>Create account</h1>
          <p style={cardSub}>Join Smart Campus in a few seconds.</p>

          {error && <div style={errorBox}>{error}</div>}
          {success && (
            <div style={successBox}>
              ✅ Account created successfully. Redirecting to login...
            </div>
          )}

          <div style={fieldGroup}>
            <label style={label}>Full name</label>
            <input
              style={input}
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              disabled={loading || success}
            />
          </div>

          <div style={fieldGroup}>
            <label style={label}>Email address</label>
            <input
              style={input}
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              disabled={loading || success}
            />
          </div>

          <div style={fieldGroup}>
            <label style={label}>Password</label>
            <div style={passWrap}>
              <input
                style={{ ...input, marginBottom: 0 }}
                type={showPass ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                disabled={loading || success}
              />
              <button type="button" style={eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div style={fieldGroup}>
            <label style={label}>Confirm password</label>
            <div style={passWrap}>
              <input
                style={{ ...input, marginBottom: 0 }}
                type={showConf ? "text" : "password"}
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                disabled={loading || success}
              />
              <button type="button" style={eyeBtn} onClick={() => setShowConf(!showConf)}>
                {showConf ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <button style={primaryBtn} onClick={handleRegister} disabled={loading || success}>
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p style={footerText}>
            Already have an account?{" "}
            <Link to="/login" style={footerLink}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const page = { display: "flex", minHeight: "100vh", flexWrap: "wrap", background: "#f8fafc" };
const leftPanel = { flex: 1, minWidth: "300px", background: "linear-gradient(145deg, #0f172a, #1d4ed8)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "30px" };
const leftContent = { width: "100%", maxWidth: "420px" };
const brandBox = { width: "54px", height: "54px", borderRadius: "14px", background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "20px", marginBottom: "22px" };
const leftTitle = { fontSize: "30px", fontWeight: "800", margin: "0 0 10px" };
const leftSub = { fontSize: "15px", lineHeight: "1.7", color: "rgba(255,255,255,0.82)", margin: 0 };
const rightPanel = { flex: 1, minWidth: "300px", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" };
const card = { width: "100%", maxWidth: "430px", background: "white", borderRadius: "18px", padding: "32px", boxShadow: "0 8px 30px rgba(15,23,42,0.08)", border: "1px solid #e2e8f0" };
const backLink = { display: "inline-block", marginBottom: "18px", color: "#64748b", textDecoration: "none", fontWeight: "600" };
const cardTitle = { margin: "0 0 8px", fontSize: "28px", color: "#0f172a", fontWeight: "800" };
const cardSub = { margin: "0 0 22px", color: "#64748b", fontSize: "14px" };
const fieldGroup = { marginBottom: "14px" };
const label = { display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "700", color: "#334155" };
const input = { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #dbe2ea", fontSize: "14px", outline: "none", background: "#f8fafc" };
const passWrap = { position: "relative" };
const eyeBtn = { position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px" };
const primaryBtn = { width: "100%", padding: "13px 16px", border: "none", borderRadius: "10px", background: "#2563eb", color: "white", fontWeight: "800", cursor: "pointer", marginTop: "6px" };
const errorBox = { background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c", padding: "12px", borderRadius: "10px", marginBottom: "14px", fontSize: "14px" };
const successBox = { background: "#dcfce7", border: "1px solid #86efac", color: "#166534", padding: "12px", borderRadius: "10px", marginBottom: "14px", fontSize: "14px" };
const footerText = { marginTop: "18px", textAlign: "center", color: "#64748b", fontSize: "14px" };
const footerLink = { color: "#2563eb", fontWeight: "700", textDecoration: "none" };