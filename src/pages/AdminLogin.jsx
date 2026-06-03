import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_SECRET_KEY = "SC@Admin#2025!IAU";

export default function AdminLogin() {
  const navigate  = useNavigate();
  const [key,      setKey]      = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showKey,  setShowKey]  = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked,   setLocked]   = useState(false);

  const handleLogin = () => {
    if (locked) return;
    if (!key.trim()) { setError("Please enter the access key."); return; }
    setLoading(true);
    setTimeout(() => {
      if (key === ADMIN_SECRET_KEY) {
        localStorage.setItem("adminAuth",     "true");
        localStorage.setItem("adminAuthTime", Date.now().toString());
        navigate("/admin/parking");
      } else {
        const n = attempts + 1;
        setAttempts(n);
        if (n >= 5) { setLocked(true); setError("Too many failed attempts. Refresh the page."); }
        else { setError(`Incorrect key. ${5 - n} attempt${5 - n === 1 ? "" : "s"} remaining.`); }
        setKey("");
      }
      setLoading(false);
    }, 600);
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !locked) handleLogin(); };

  return (
    <div style={page}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .adm-dots { position: fixed; inset: 0; pointer-events: none; background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px); background-size: 28px 28px; z-index: 0; }
        .adm-key:focus { outline: none; border-color: #f59e0b !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.18) !important; background: rgba(255,255,255,0.09) !important; }
        .adm-key.err { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.15) !important; }
        .adm-btn { transition: filter 0.15s, transform 0.1s, box-shadow 0.15s; cursor: pointer; }
        .adm-btn:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 10px 28px rgba(245,158,11,0.45); }
        .adm-btn:active:not(:disabled) { transform: scale(0.97); }
        .adm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .adm-eye { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.3); font-size: 16px; padding: 4px; transition: color 0.15s; line-height: 1; }
        .adm-eye:hover { color: rgba(255,255,255,0.65); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .adm-spinner { width: 17px; height: 17px; border: 2.5px solid rgba(255,255,255,0.25); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; vertical-align: middle; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .adm-card { animation: fadeUp 0.4s ease; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        .adm-g1 { animation: float 7s ease-in-out infinite; }
        .adm-g2 { animation: float 9s ease-in-out 1.5s infinite; }
        @keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
        .adm-shake { animation: shake 0.4s ease; }
        .adm-back { color: rgba(255,255,255,0.35); font-size: 13px; font-weight: 600; text-decoration: none; transition: color 0.15s; display: inline-block; margin-bottom: 24px; }
        .adm-back:hover { color: rgba(255,255,255,0.65); }
      `}</style>

      <div className="adm-dots" />
      <div className="adm-g1" style={{ position:"fixed", top:"15%", left:"10%", width:"300px", height:"300px", borderRadius:"50%", background:"#f59e0b", opacity:0.08, filter:"blur(70px)", pointerEvents:"none", zIndex:0 }} />
      <div className="adm-g2" style={{ position:"fixed", top:"70%", left:"75%", width:"220px", height:"220px", borderRadius:"50%", background:"#ef4444", opacity:0.08, filter:"blur(70px)", pointerEvents:"none", zIndex:0 }} />

      <div className="adm-card" style={card}>
        <a href="/" className="adm-back">← Back to Home</a>

        <div style={topBadge}><span>🛡</span><span>Administrator Portal</span></div>
        <div style={logoBox}>SC</div>
        <h1 style={titleSt}>Admin Access</h1>
        <p style={subtitleSt}>Enter the administrator key to access the control panel.</p>

        <div style={{ display:"flex", gap:"6px", marginBottom:"16px" }}>
          {[1,2,3,4,5].map((i) => (
            <div key={i} style={{ width:8, height:8, borderRadius:"50%", transition:"background 0.2s", background: i <= attempts ? "#ef4444" : "rgba(255,255,255,0.15)" }} />
          ))}
        </div>

        {error && (
          <div className="adm-shake" style={errorBox}>
            <span style={{ marginRight:"8px" }}>{locked ? "🔒" : "⚠️"}</span>{error}
          </div>
        )}

        {!locked && (
          <>
            <div style={{ marginBottom:"14px" }}>
              <label style={labelSt}>Access Key</label>
              <div style={{ position:"relative" }}>
                <input
                  className={`adm-key${error && !locked ? " err" : ""}`}
                  style={keyInput}
                  type={showKey ? "text" : "password"}
                  placeholder="Enter secret key…"
                  value={key}
                  onChange={(e) => { setKey(e.target.value); setError(""); }}
                  onKeyDown={handleKeyDown}
                  disabled={loading || locked}
                  autoComplete="off"
                  autoFocus
                />
                <button className="adm-eye" style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)" }} onClick={() => setShowKey(!showKey)} tabIndex={-1} type="button">
                  {showKey ? "🙈" : "👁"}
                </button>
              </div>
            </div>
            <button className="adm-btn" style={submitBtn} onClick={handleLogin} disabled={loading || locked}>
              {loading ? <><span className="adm-spinner" />&nbsp; Verifying…</> : "Enter Control Panel →"}
            </button>
          </>
        )}

        {locked && (
          <div style={lockedBox}>🔒 Access locked. Refresh the page to try again.</div>
        )}

        <p style={{ marginTop:"22px", fontSize:"12px", color:"rgba(255,255,255,0.25)", textAlign:"center", lineHeight:"1.7" }}>
          This portal is for authorized administrators only.<br />
          Students — <a href="/login" style={{ color:"rgba(255,255,255,0.45)", textDecoration:"underline" }}>sign in here</a>.
        </p>
      </div>
    </div>
  );
}

const page = { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(155deg, #09111f 0%, #0f172a 55%, #181f30 100%)", padding:"24px", fontFamily:"'DM Sans', system-ui, sans-serif", position:"relative", overflow:"hidden" };
const card = { position:"relative", zIndex:1, width:"100%", maxWidth:"400px", background:"rgba(255,255,255,0.05)", backdropFilter:"blur(22px)", borderRadius:"22px", padding:"36px 32px", border:"1px solid rgba(255,255,255,0.09)", boxShadow:"0 28px 72px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)" };
const topBadge = { display:"inline-flex", alignItems:"center", gap:"8px", padding:"5px 14px", borderRadius:"999px", background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.25)", color:"#fbbf24", fontSize:"12px", fontWeight:"700", marginBottom:"22px" };
const logoBox = { width:"52px", height:"52px", borderRadius:"14px", background:"linear-gradient(135deg, #f59e0b, #d97706)", color:"white", fontWeight:"800", fontSize:"20px", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 24px rgba(245,158,11,0.40)", marginBottom:"18px" };
const titleSt = { fontSize:"26px", fontWeight:"800", color:"white", margin:"0 0 6px", letterSpacing:"-0.4px" };
const subtitleSt = { fontSize:"13px", color:"rgba(255,255,255,0.42)", margin:"0 0 20px", lineHeight:"1.65" };
const errorBox = { background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.28)", borderRadius:"10px", padding:"10px 14px", fontSize:"13px", color:"#fca5a5", fontWeight:"500", marginBottom:"16px", display:"flex", alignItems:"center" };
const labelSt = { display:"block", fontSize:"11px", fontWeight:"700", color:"rgba(255,255,255,0.45)", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.08em" };
const keyInput = { width:"100%", padding:"12px 44px 12px 14px", borderRadius:"10px", border:"1.5px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.05)", color:"white", fontSize:"15px", fontFamily:"'DM Mono', monospace", letterSpacing:"0.10em", transition:"border-color 0.15s, box-shadow 0.15s, background 0.15s", boxSizing:"border-box" };
const submitBtn = { width:"100%", padding:"13px", borderRadius:"11px", border:"none", background:"linear-gradient(135deg, #f59e0b, #d97706)", color:"white", fontWeight:"800", fontSize:"15px", boxShadow:"0 6px 18px rgba(245,158,11,0.35)", fontFamily:"'DM Sans', sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" };
const lockedBox = { background:"rgba(239,68,68,0.10)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"10px", padding:"14px", fontSize:"13px", color:"#fca5a5", fontWeight:"600", textAlign:"center", marginBottom:"16px", lineHeight:"1.6" };
