import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError("Please fill in all fields."); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await axios.post(
        "https://smart-campus-backend-production-bf5e.up.railway.app/auth/login",
        { email, password }
      );
      if (!data.token) { setError(data.message || "Incorrect email or password."); setLoading(false); return; }
      localStorage.setItem("token",    data.token);
      localStorage.setItem("userName", data.name);
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userEmail", email.toLowerCase().trim());
      const emails = JSON.parse(localStorage.getItem("registeredEmails") || "[]");
      if (!emails.includes(email.toLowerCase().trim()))
        localStorage.setItem("registeredEmails", JSON.stringify([...emails, email.toLowerCase().trim()]));
      navigate("/dashboard");
    } catch {
      setError("Incorrect email or password. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Blobs ── */
        .lg-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.55;
        }

        /* ── Left panel ── */
        .lg-left { display: flex; }
        @media (max-width: 860px) { .lg-left { display: none !important; } }

        /* ── Orbs floating ── */
        @keyframes float1 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-18px) rotate(4deg)} }
        @keyframes float2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(14px) rotate(-3deg)} }
        @keyframes float3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .orb1 { animation: float1 7s ease-in-out infinite; }
        .orb2 { animation: float2 9s ease-in-out infinite; }
        .orb3 { animation: float3 5s ease-in-out infinite; }

        /* ── Card ── */
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(22px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .lg-card { animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }

        /* ── Inputs ── */
        .lg-inp {
          width: 100%; padding: 14px 16px;
          border: 1.5px solid #e8eaf0; border-radius: 12px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          background: #fafbfd; color: #0f172a;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          outline: none;
        }
        .lg-inp:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99,102,241,0.10);
          background: white;
        }
        .lg-inp.has-err {
          border-color: #f43f5e;
          box-shadow: 0 0 0 4px rgba(244,63,94,0.10);
        }
        .lg-inp::placeholder { color: #adb5c7; }

        /* ── Button ── */
        .lg-btn {
          width: 100%; padding: 14px; border: none; border-radius: 12px;
          font-size: 15px; font-weight: 700; font-family: 'DM Sans', sans-serif;
          cursor: pointer; position: relative; overflow: hidden;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          box-shadow: 0 6px 20px rgba(99,102,241,0.38);
          transition: filter 0.18s, transform 0.12s, box-shadow 0.18s;
          letter-spacing: 0.01em;
        }
        .lg-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%);
          pointer-events: none;
        }
        .lg-btn:hover:not(:disabled) {
          filter: brightness(1.07);
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(99,102,241,0.45);
        }
        .lg-btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }
        .lg-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

        /* ── Eye btn ── */
        .lg-eye {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #adb5c7; font-size: 17px; line-height: 1; padding: 4px;
          transition: color 0.15s;
        }
        .lg-eye:hover { color: #6366f1; }

        /* ── Forgot ── */
        .lg-forgot {
          color: #6366f1; font-size: 13px; font-weight: 600;
          text-decoration: none; transition: color 0.15s;
        }
        .lg-forgot:hover { color: #4f46e5; }

        /* ── Spinner ── */
        @keyframes spin { to { transform: rotate(360deg); } }
        .lg-spin {
          width: 18px; height: 18px; display: inline-block; vertical-align: middle;
          border: 2.5px solid rgba(255,255,255,0.3); border-top-color: white;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }

        /* ── Error shake ── */
        @keyframes shake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)}
        }
        .lg-err { animation: shake 0.42s ease; }

        /* ── Divider ── */
        .lg-divider {
          display: flex; align-items: center; gap: 12px;
          color: #c4c9d8; font-size: 12px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin: 20px 0;
        }
        .lg-divider::before, .lg-divider::after {
          content: ''; flex: 1; height: 1px; background: #eef0f6;
        }

        /* ── Feature items ── */
        .lg-feat {
          display: flex; align-items: center; gap: 14px;
          padding: 13px 16px; border-radius: 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.09);
          transition: background 0.2s, transform 0.2s;
          cursor: default;
        }
        .lg-feat:hover {
          background: rgba(255,255,255,0.11);
          transform: translateX(5px);
        }

        /* ── Back link ── */
        .lg-back {
          color: #94a3b8; font-size: 13px; font-weight: 600;
          text-decoration: none; display: inline-flex; align-items: center; gap: 5px;
          transition: color 0.15s;
        }
        .lg-back:hover { color: #6366f1; }
      `}</style>

      {/* ══════════ LEFT PANEL ══════════ */}
      <div className="lg-left" style={{
        width: "46%", minWidth: "400px", position: "relative",
        background: "linear-gradient(145deg, #0d0f1a 0%, #131629 40%, #0f1628 100%)",
        overflow: "hidden", flexDirection: "column",
        justifyContent: "center", alignItems: "flex-start",
        padding: "56px 48px",
      }}>

        {/* Background blobs */}
        <div className="lg-blob" style={{ width:500, height:500, top:"-120px", left:"-100px", background:"#6366f1" }} />
        <div className="lg-blob" style={{ width:350, height:350, bottom:"-80px", right:"-60px", background:"#8b5cf6", opacity:0.35 }} />
        <div className="lg-blob" style={{ width:200, height:200, top:"55%", left:"60%", background:"#06b6d4", opacity:0.25 }} />

        {/* Floating orbs */}
        <div className="orb1" style={{ position:"absolute", top:"12%", right:"18%", width:80, height:80, borderRadius:"50%", border:"1.5px solid rgba(99,102,241,0.35)", backdropFilter:"blur(2px)" }} />
        <div className="orb2" style={{ position:"absolute", bottom:"22%", left:"8%", width:50, height:50, borderRadius:"50%", border:"1.5px solid rgba(139,92,246,0.3)" }} />
        <div className="orb3" style={{ position:"absolute", top:"40%", right:"8%", width:28, height:28, borderRadius:"50%", background:"rgba(6,182,212,0.25)" }} />

        {/* Grid dots */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)", backgroundSize:"30px 30px", pointerEvents:"none" }} />

        {/* Content */}
        <div style={{ position:"relative", zIndex:1, width:"100%" }}>

          {/* Brand */}
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:52 }}>
            <div style={{ width:46, height:46, borderRadius:13, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:18, color:"white", boxShadow:"0 8px 24px rgba(99,102,241,0.45)", fontFamily:"'DM Sans',sans-serif" }}>SC</div>
            <span style={{ fontSize:20, fontWeight:800, color:"white", fontFamily:"'DM Sans',sans-serif", letterSpacing:"-0.3px" }}>Smart Campus</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:48, fontWeight:400, color:"white", lineHeight:1.12, marginBottom:16, letterSpacing:"-0.5px" }}>
            Your campus,<br/>
            <span style={{ fontStyle:"italic", color:"#a5b4fc" }}>reimagined.</span>
          </h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, color:"rgba(255,255,255,0.52)", lineHeight:1.75, marginBottom:48, maxWidth:340 }}>
            One portal for schedules, tasks, real-time parking, and classroom finder — built for IAU students.
          </p>

          {/* Features */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { icon:"🗓", title:"Weekly Schedule",   desc:"All your classes in one view" },
              { icon:"✓",  title:"Task Manager",      desc:"Deadlines & exam reminders"   },
              { icon:"🅿",  title:"Live Parking",      desc:"Real-time spot availability"  },
              { icon:"⌂",  title:"Classroom Finder",  desc:"170+ rooms — Building A11"    },
            ].map(f => (
              <div key={f.title} className="lg-feat">
                <span style={{ fontSize:20, width:30, textAlign:"center", flexShrink:0 }}>{f.icon}</span>
                <div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13, color:"rgba(255,255,255,0.9)", marginBottom:2 }}>{f.title}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"rgba(255,255,255,0.42)" }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ══════════ RIGHT PANEL ══════════ */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f6fa", padding:"32px 20px", minHeight:"100vh" }}>

        <div className="lg-card" style={{ width:"100%", maxWidth:420, background:"white", borderRadius:24, padding:"44px 40px", boxShadow:"0 16px 56px rgba(15,23,42,0.11), 0 1px 3px rgba(15,23,42,0.06)", border:"1.5px solid #eef0f6" }}>

          {/* Back */}
          <Link to="/" className="lg-back" style={{ display:"inline-flex", marginBottom:32 }}>
            ← Back to Home
          </Link>

          {/* Logo + Title */}
          <div style={{ marginBottom:28 }}>
            <div style={{ width:50, height:50, borderRadius:14, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:19, color:"white", boxShadow:"0 8px 20px rgba(99,102,241,0.32)", marginBottom:20, fontFamily:"'DM Sans',sans-serif" }}>SC</div>
            <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:32, fontWeight:400, color:"#0f172a", marginBottom:6, letterSpacing:"-0.3px" }}>Welcome back</h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#94a3b8", lineHeight:1.6 }}>Sign in to your Smart Campus account.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="lg-err" style={{ background:"#fff1f2", border:"1.5px solid #fecdd3", borderRadius:11, padding:"11px 14px", fontSize:13, color:"#e11d48", fontWeight:500, marginBottom:20, fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:16 }}>⚠️</span> {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, color:"#374151", marginBottom:7, textTransform:"uppercase", letterSpacing:"0.06em" }}>Email</label>
            <input
              className={`lg-inp${error ? " has-err" : ""}`}
              type="email" placeholder="you@iau.edu.sa"
              value={email} onChange={e=>{setEmail(e.target.value);setError("");}}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              autoComplete="email" disabled={loading}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom:10 }}>
            <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, color:"#374151", marginBottom:7, textTransform:"uppercase", letterSpacing:"0.06em" }}>Password</label>
            <div style={{ position:"relative" }}>
              <input
                className={`lg-inp${error ? " has-err" : ""}`}
                style={{ paddingRight:46 }}
                type={showPass ? "text" : "password"} placeholder="Enter your password"
                value={password} onChange={e=>{setPassword(e.target.value);setError("");}}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                autoComplete="current-password" disabled={loading}
              />
              <button className="lg-eye" onClick={()=>setShowPass(!showPass)} type="button" tabIndex={-1}>
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Forgot */}
          <div style={{ textAlign:"right", marginBottom:22 }}>
            <Link to="/forgot-password" className="lg-forgot">Forgot password?</Link>
          </div>

          {/* Submit */}
          <button className="lg-btn" onClick={handleLogin} disabled={loading}>
            {loading ? <><span className="lg-spin" />&nbsp; Signing in…</> : "Sign In →"}
          </button>

          <div className="lg-divider">or</div>

          <p style={{ textAlign:"center", fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#64748b", margin:0 }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color:"#6366f1", fontWeight:700, textDecoration:"none" }}>Create one free</Link>
          </p>

        </div>
      </div>
    </div>
  );
}

const page = {
  display: "flex",
  minHeight: "100vh",
  fontFamily: "'DM Sans', system-ui, sans-serif",
};