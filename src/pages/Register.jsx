import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

export default function Register() {
  const navigate = useNavigate();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6)          s++;
    if (password.length >= 10)         s++;
    if (/[A-Z]/.test(password))        s++;
    if (/[0-9]/.test(password))        s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(s, 4);
  })();
  const strengthLabel = ["","Weak","Fair","Good","Strong"][strength];
  const strengthColor = ["","#ef4444","#f59e0b","#3b82f6","#22c55e"][strength];

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirm.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    const allowedDomains = ["gmail.com","hotmail.com","outlook.com","yahoo.com","icloud.com","iau.edu.sa","live.com","msn.com"];
    const emailDomain = email.toLowerCase().trim().split("@")[1];
    if (!email.includes("@") || !emailDomain) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!allowedDomains.includes(emailDomain)) {
      setError("Please use a valid email provider (Gmail, Hotmail, Outlook, etc.).");
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
        name:     name.trim(),
        email:    email.toLowerCase().trim(),
        password,
        role:     "STUDENT",
      });

      setSuccess(true);
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      if (err?.response?.status === 409) {
        setError("This email is already registered. Please sign in.");
      } else {
        setError(err?.response?.data?.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleRegister(); };

  return (
    <div style={page}>
      <style>{`
        /* Left panel decorative */
        @keyframes float1 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-18px) rotate(4deg)} }
        @keyframes float2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(14px) rotate(-3deg)} }
        @keyframes float3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .rg-orb1 { position:absolute; top:10%; right:15%; width:80px; height:80px; border:1.5px solid rgba(96,165,250,0.3); border-radius:50%; animation:float1 7s ease-in-out infinite; }
        .rg-orb2 { position:absolute; bottom:20%; left:8%; width:50px; height:50px; border:1.5px solid rgba(167,139,250,0.3); border-radius:50%; animation:float2 9s ease-in-out infinite; }
        .rg-orb3 { position:absolute; top:45%; right:8%; width:28px; height:28px; background:rgba(56,189,248,0.25); border-radius:50%; animation:float3 5s ease-in-out infinite; }
        .rg-dots { position:absolute; inset:0; background-image:radial-gradient(circle,rgba(255,255,255,0.07) 1px,transparent 1px); background-size:30px 30px; pointer-events:none; }
        .rg-feat:hover { background:rgba(255,255,255,0.11) !important; transform:translateX(5px); }

        /* Form */
        .rg-input:focus { outline:none; border-color:#2563eb !important; box-shadow:0 0 0 3px rgba(37,99,235,0.13) !important; background:white !important; }
        .rg-input.err { border-color:#ef4444 !important; box-shadow:0 0 0 3px rgba(239,68,68,0.12) !important; }
        .rg-btn { transition:filter 0.15s,transform 0.1s,box-shadow 0.15s; }
        .rg-btn:hover:not(:disabled) { filter:brightness(1.07); box-shadow:0 8px 24px rgba(37,99,235,0.35); }
        .rg-btn:active:not(:disabled) { transform:scale(0.97); }
        .rg-btn:disabled { opacity:0.65; cursor:not-allowed; }
        .rg-eye { background:none; border:none; cursor:pointer; color:#94a3b8; font-size:17px; padding:4px; transition:color 0.15s; }
        .rg-eye:hover { color:#2563eb; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .rg-spinner { width:18px; height:18px; display:inline-block; vertical-align:middle; border:2.5px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; }
        @keyframes cardIn { from{opacity:0;transform:translateY(22px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)} }
        .rg-card { animation:cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        .rg-shake { animation:shake 0.42s ease; }

        @media(max-width:820px) { .rg-left { display:none !important; } }
      `}</style>

      <div className="rg-left" style={leftPanel}>
        <div className="rg-dots" />

        <div style={{ position:"absolute", top:"-100px", left:"-80px", width:"440px", height:"440px", borderRadius:"50%", background:"#2563eb", opacity:0.50, filter:"blur(80px)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"-60px", right:"-50px", width:"300px", height:"300px", borderRadius:"50%", background:"#7c3aed", opacity:0.32, filter:"blur(70px)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", top:"55%", left:"58%", width:"180px", height:"180px", borderRadius:"50%", background:"#06b6d4", opacity:0.22, filter:"blur(60px)", pointerEvents:"none" }} />
        <div className="rg-orb1" /><div className="rg-orb2" /><div className="rg-orb3" />

        <div style={leftContent}>
          <div style={brand}>
            <div style={brandLogo}>SC</div>
            <span style={brandName}>Smart Campus</span>
          </div>

          <h1 style={headline}>
            Join your campus,<br />
            <span style={{ fontStyle:"italic", color:"#93c5fd" }}>start smart.</span>
          </h1>
          <p style={subheadline}>
            Create your account and get instant access to schedules, tasks, real-time parking, and a full classroom finder — built for IAU students.
          </p>

          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {[
              { icon:"🗓", title:"Weekly Schedule",  desc:"All your classes in one view" },
              { icon:"✓",  title:"Task Manager",     desc:"Deadlines & exam reminders" },
              { icon:"P",  title:"Live Parking",     desc:"Real-time spot availability" },
              { icon:"⌂",  title:"Classroom Finder", desc:"170+ rooms — Building A11" },
            ].map(f => (
              <div key={f.title} className="rg-feat" style={featItem}>
                <span style={featIcon}>{f.icon}</span>
                <div>
                  <div style={{ fontWeight:"700", fontSize:"13px", color:"rgba(255,255,255,0.92)", marginBottom:"2px" }}>{f.title}</div>
                  <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.45)" }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={rightPanel}>
        <div className="rg-card" style={card}>
          <Link to="/" style={backLink}>← Back to Home</Link>

          <div style={cardHeader}>
            <div style={cardLogo}>SC</div>
            <h1 style={cardTitle}>Create account</h1>
            <p style={cardSubtitle}>Join Smart Campus in a few seconds.</p>
          </div>

          {error && (
            <div className="rg-shake" style={errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}
          {success && (
            <div style={successBox}>
              ✅ Account created! Redirecting to login...
            </div>
          )}

          <div style={fieldGroup}>
            <label style={label}>Full Name</label>
            <input
              className={`rg-input${error && !name.trim() ? " err" : ""}`}
              style={input}
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              disabled={loading || success}
              autoComplete="name"
            />
          </div>

          <div style={fieldGroup}>
            <label style={label}>Email Address</label>
            <input
              className="rg-input"
              style={input}
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              disabled={loading || success}
              autoComplete="email"
            />
          </div>

          <div style={fieldGroup}>
            <label style={label}>Password</label>
            <div style={passWrap}>
              <input
                className="rg-input"
                style={{ ...input, paddingRight:"46px", marginBottom:0 }}
                type={showPass ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                disabled={loading || success}
                autoComplete="new-password"
              />
              <button type="button" className="rg-eye" style={eyePos} onClick={() => setShowPass(!showPass)}>
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
            {password && (
              <div style={{ marginTop:"8px" }}>
                <div style={{ display:"flex", gap:"4px", marginBottom:"4px" }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex:1, height:"4px", borderRadius:"999px", background: i <= strength ? strengthColor : "#e2e8f0", transition:"background 0.2s" }} />
                  ))}
                </div>
                <span style={{ fontSize:"11px", fontWeight:"700", color:strengthColor }}>{strengthLabel}</span>
              </div>
            )}
          </div>

          <div style={fieldGroup}>
            <label style={label}>Confirm Password</label>
            <div style={passWrap}>
              <input
                className={`rg-input${confirm && confirm !== password ? " err" : ""}`}
                style={{ ...input, paddingRight:"46px", marginBottom:0 }}
                type={showConf ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                disabled={loading || success}
                autoComplete="new-password"
              />
              <button type="button" className="rg-eye" style={eyePos} onClick={() => setShowConf(!showConf)}>
                {showConf ? "🙈" : "👁"}
              </button>
            </div>
            {confirm && confirm !== password && (
              <p style={{ fontSize:"12px", color:"#ef4444", margin:"5px 0 0", fontWeight:"600" }}>Passwords do not match</p>
            )}
          </div>

          <button
            className="rg-btn"
            style={submitBtn}
            onClick={handleRegister}
            disabled={loading || success}
          >
            {loading
              ? <><span className="rg-spinner" />&nbsp; Creating account…</>
              : success
                ? "✅ Redirecting…"
                : "Create Account →"
            }
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

const page = {
  display: "flex", minHeight: "100vh",
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

const leftPanel = {
  width: "46%", minWidth: "420px",
  background: "linear-gradient(145deg, #0d0f1a 0%, #131629 40%, #0f1628 100%)",
  position: "relative", overflow: "hidden",
  display: "flex", flexDirection: "column",
  justifyContent: "center", alignItems: "flex-start",
  padding: "56px 48px",
};

const leftContent = {
  position: "relative", zIndex: 1, width: "100%",
};

const brand = { display:"flex", alignItems:"center", gap:"14px", marginBottom:"44px" };
const brandLogo = {
  width:"46px", height:"46px", borderRadius:"13px",
  background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
  display:"flex", alignItems:"center", justifyContent:"center",
  fontWeight:"800", fontSize:"18px", color:"white",
  boxShadow:"0 8px 24px rgba(37,99,235,0.45)",
};
const brandName = { fontSize:"20px", fontWeight:"800", color:"white", letterSpacing:"-0.3px" };

const headline = {
  fontFamily:"'DM Sans', sans-serif",
  fontSize:"42px", fontWeight:"800", color:"white",
  lineHeight:"1.1", margin:"0 0 18px", letterSpacing:"-1px",
};

const subheadline = {
  fontSize:"15px", color:"rgba(255,255,255,0.5)",
  lineHeight:"1.75", margin:"0 0 36px", maxWidth:"360px",
};

const featItem = {
  display:"flex", alignItems:"center", gap:"14px",
  padding:"13px 16px", borderRadius:"14px",
  background:"rgba(255,255,255,0.06)",
  border:"1px solid rgba(255,255,255,0.09)",
  transition:"background 0.2s, transform 0.2s",
  cursor:"default",
};

const featIcon = { fontSize:"20px", width:"28px", textAlign:"center", flexShrink:0 };

const rightPanel = {
  flex: 1, display:"flex", alignItems:"center",
  justifyContent:"center", background:"#f5f6fa",
  padding:"32px 20px", minHeight:"100vh",
};

const card = {
  width:"100%", maxWidth:"420px",
  background:"white", borderRadius:"24px",
  padding:"40px 36px",
  boxShadow:"0 16px 56px rgba(15,23,42,0.11), 0 1px 3px rgba(15,23,42,0.06)",
  border:"1.5px solid #eef0f6",
};

const backLink = {
  color:"#94a3b8", fontSize:"13px", fontWeight:"600",
  textDecoration:"none", display:"inline-flex", alignItems:"center", gap:"5px",
  marginBottom:"28px", transition:"color 0.15s",
};

const cardHeader = { marginBottom:"24px" };
const cardLogo = {
  width:"48px", height:"48px", borderRadius:"13px",
  background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
  display:"flex", alignItems:"center", justifyContent:"center",
  fontWeight:"800", fontSize:"18px", color:"white",
  boxShadow:"0 6px 18px rgba(37,99,235,0.32)", marginBottom:"18px",
};
const cardTitle = {
  fontSize:"28px", fontWeight:"800", color:"#0f172a",
  margin:"0 0 6px", letterSpacing:"-0.4px",
};
const cardSubtitle = { fontSize:"14px", color:"#94a3b8", lineHeight:"1.6" };

const errorBox = {
  background:"#fff1f2", border:"1.5px solid #fecdd3",
  borderRadius:"11px", padding:"11px 14px",
  fontSize:"13px", color:"#e11d48", fontWeight:"500",
  marginBottom:"20px", display:"flex", alignItems:"center", gap:"8px",
};

const successBox = {
  background:"#f0fdf4", border:"1.5px solid #bbf7d0",
  borderRadius:"11px", padding:"11px 14px",
  fontSize:"13px", color:"#166534", fontWeight:"600",
  marginBottom:"20px",
};

const fieldGroup  = { marginBottom:"16px" };
const label = {
  display:"block", fontSize:"12px", fontWeight:"700",
  color:"#374151", marginBottom:"7px",
  textTransform:"uppercase", letterSpacing:"0.06em",
};
const input = {
  width:"100%", padding:"14px 16px",
  border:"1.5px solid #e8eaf0", borderRadius:"12px",
  fontSize:"14px", background:"#fafbfd", color:"#0f172a",
  transition:"border-color 0.18s, box-shadow 0.18s, background 0.18s",
  outline:"none", boxSizing:"border-box",
};
const passWrap = { position:"relative" };
const eyePos = {
  position:"absolute", right:"14px", top:"50%",
  transform:"translateY(-50%)",
};

const submitBtn = {
  width:"100%", padding:"14px", border:"none",
  borderRadius:"12px", fontSize:"15px", fontWeight:"700",
  cursor:"pointer", marginTop:"4px",
  background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
  color:"white",
  boxShadow:"0 6px 20px rgba(37,99,235,0.38)",
  display:"flex", alignItems:"center", justifyContent:"center", gap:"6px",
};

const footerText = {
  marginTop:"20px", textAlign:"center",
  color:"#64748b", fontSize:"14px",
};
const footerLink = { color:"#2563eb", fontWeight:"700", textDecoration:"none" };
