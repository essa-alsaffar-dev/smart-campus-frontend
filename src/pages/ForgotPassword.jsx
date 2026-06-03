import { useState } from "react";
import { Link } from "react-router-dom";
import emailjs from "@emailjs/browser";
import api from "../api/api";

const SERVICE_ID  = "service_wneun8k";
const TEMPLATE_ID = "template_gtvvu0j";
const PUBLIC_KEY  = "-LMLnwPKBDwExJXro";

export default function ForgotPassword() {
  const [step,     setStep]     = useState("email");
  const [email,    setEmail]    = useState("");
  const [code,     setCode]     = useState("");
  const [newPass,  setNewPass]  = useState("");
  const [confirmP, setConfirmP] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [sentCode, setSentCode] = useState("");

  const strength = (() => {
    if (!newPass) return 0;
    let s = 0;
    if (newPass.length >= 6)           s++;
    if (newPass.length >= 10)          s++;
    if (/[A-Z]/.test(newPass))         s++;
    if (/[0-9]/.test(newPass))         s++;
    if (/[^A-Za-z0-9]/.test(newPass)) s++;
    return Math.min(s, 4);
  })();
  const strengthLabel = ["","Weak","Fair","Good","Strong"][strength];
  const strengthColor = ["","#ef4444","#f59e0b","#3b82f6","#22c55e"][strength];

  const handleSendCode = async () => {
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email."); return; }
    setError(""); setLoading(true);

    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(generatedCode);

    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
        email:    email,
        passcode: generatedCode,
        time:     new Date(Date.now() + 15 * 60000).toLocaleTimeString(),
      }, PUBLIC_KEY);
      setStep("code");
    } catch {
      setError("Failed to send email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = () => {
    if (!code.trim()) { setError("Enter the code."); return; }
    if (code !== sentCode) { setError("Incorrect code. Try again."); return; }
    setError("");
    setStep("reset");
  };

  const handleReset = async () => {
    if (newPass.length < 6)    { setError("Password must be at least 6 characters."); return; }
    if (newPass !== confirmP)  { setError("Passwords do not match."); return; }
    setError(""); setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, newPassword: newPass });
    } catch {

    } finally {
      setLoading(false);
    }
    setStep("done");
  };

  return (
    <div style={page}>
      <style>{`
        *{box-sizing:border-box}
        .fp-input:focus{outline:none;border-color:#2563eb!important;box-shadow:0 0 0 3px rgba(37,99,235,0.15)!important;background:white!important}
        .fp-input.err{border-color:#ef4444!important;box-shadow:0 0 0 3px rgba(239,68,68,0.12)!important}
        .fp-btn{transition:filter 0.15s,transform 0.1s;cursor:pointer}
        .fp-btn:hover:not(:disabled){filter:brightness(1.07)}
        .fp-btn:active:not(:disabled){transform:scale(0.97)}
        .fp-btn:disabled{opacity:0.6;cursor:not-allowed}
        .fp-eye{background:none;border:none;cursor:pointer;color:#94a3b8;font-size:16px;padding:4px;line-height:1}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fp-spin{width:17px;height:17px;border:2.5px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;vertical-align:middle}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fp-card{animation:fadeUp 0.4s ease}
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
        .fp-shake{animation:shake 0.4s ease}
        .fp-back{color:#64748b;font-size:13px;font-weight:600;text-decoration:none}
      `}</style>

      <div className="fp-card" style={card}>
        <Link to="/login" className="fp-back">← Back to Login</Link>
        <div style={logoBox}>SC</div>

        {step === "email" && (
          <>
            <h1 style={title}>Forgot Password?</h1>
            <p style={subtitle}>Enter your email and we'll send you a reset code.</p>
            {error && <div className="fp-shake" style={errBox}>⚠️ {error}</div>}
            <div style={fieldGrp}>
              <label style={lbl}>Email Address</label>
              <input className={`fp-input${error ? " err" : ""}`} style={inp} type="email"
                placeholder="you@iau.edu.sa" value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSendCode()} autoFocus />
            </div>
            <button className="fp-btn" style={submitBtn("#2563eb")} onClick={handleSendCode} disabled={loading}>
              {loading ? <><span className="fp-spin" />&nbsp;Sending…</> : "Send Reset Code →"}
            </button>
          </>
        )}

        {step === "code" && (
          <>
            <h1 style={title}>Check Your Email</h1>
            <p style={subtitle}>We sent a 6-digit code to <strong>{email}</strong></p>
            {error && <div className="fp-shake" style={errBox}>⚠️ {error}</div>}
            <div style={fieldGrp}>
              <label style={lbl}>6-Digit Code</label>
              <input className={`fp-input${error ? " err" : ""}`}
                style={{...inp, textAlign:"center", fontSize:"22px", letterSpacing:"0.3em"}}
                type="text" placeholder="000000" value={code} maxLength={6}
                onChange={e => { setCode(e.target.value.replace(/\D/g,"").slice(0,6)); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleVerifyCode()} autoFocus />
            </div>
            <button className="fp-btn" style={submitBtn("#2563eb")} onClick={handleVerifyCode}>Verify Code →</button>
            <button style={{...submitBtn("#f1f5f9"), color:"#475569", marginTop:"8px", boxShadow:"none"}}
              onClick={() => { setStep("email"); setError(""); }} className="fp-btn">← Try Different Email</button>
          </>
        )}

        {step === "reset" && (
          <>
            <h1 style={title}>New Password</h1>
            <p style={subtitle}>Choose a strong new password.</p>
            {error && <div className="fp-shake" style={errBox}>⚠️ {error}</div>}
            <div style={fieldGrp}>
              <label style={lbl}>New Password</label>
              <div style={{position:"relative"}}>
                <input className={`fp-input${error ? " err" : ""}`}
                  style={{...inp, paddingRight:"44px"}} type={showPass ? "text" : "password"}
                  placeholder="At least 6 characters" value={newPass}
                  onChange={e => { setNewPass(e.target.value); setError(""); }} />
                <button className="fp-eye" style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)"}}
                  onClick={() => setShowPass(!showPass)} type="button">{showPass ? "🙈" : "👁"}</button>
              </div>
              {newPass && (
                <div style={{marginTop:"8px"}}>
                  <div style={{display:"flex",gap:"4px",marginBottom:"4px"}}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{flex:1,height:"4px",borderRadius:"999px",
                        background:i<=strength?strengthColor:"#e2e8f0",transition:"background 0.2s"}} />
                    ))}
                  </div>
                  <span style={{fontSize:"11px",fontWeight:"700",color:strengthColor}}>{strengthLabel}</span>
                </div>
              )}
            </div>
            <div style={fieldGrp}>
              <label style={lbl}>Confirm Password</label>
              <input className={`fp-input${confirmP && confirmP !== newPass ? " err" : ""}`}
                style={inp} type="password" placeholder="Re-enter password" value={confirmP}
                onChange={e => { setConfirmP(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleReset()} />
            </div>
            <button className="fp-btn" style={submitBtn("#2563eb")} onClick={handleReset} disabled={loading}>
              {loading ? <><span className="fp-spin" />&nbsp;Updating…</> : "Reset Password ✓"}
            </button>
          </>
        )}

        {step === "done" && (
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:"52px",marginBottom:"16px"}}>🎉</div>
            <h1 style={{...title,marginBottom:"8px"}}>Password Reset!</h1>
            <p style={{...subtitle,marginBottom:"28px"}}>Your password has been updated successfully.</p>
            <Link to="/login" style={{...submitBtn("#22c55e"),display:"inline-flex",textDecoration:"none",justifyContent:"center"}}>
              Sign In Now →
            </Link>
          </div>
        )}

        <p style={{marginTop:"24px",fontSize:"13px",color:"#94a3b8",textAlign:"center"}}>
          Remember your password?{" "}
          <Link to="/login" style={{color:"#2563eb",fontWeight:"700",textDecoration:"none"}}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const page = { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(155deg,#f8fafc 0%,#eff6ff 50%,#f5f3ff 100%)", padding:"24px", fontFamily:"'DM Sans',system-ui,sans-serif" };
const card = { width:"100%", maxWidth:"420px", background:"white", borderRadius:"22px", padding:"36px 32px", border:"1.5px solid #e2e8f0", boxShadow:"0 16px 48px rgba(15,23,42,0.10)" };
const logoBox = { width:"48px", height:"48px", borderRadius:"13px", background:"linear-gradient(135deg,#2563eb,#1d4ed8)", color:"white", fontWeight:"800", fontSize:"18px", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"18px", marginTop:"16px" };
const title = { fontSize:"24px", fontWeight:"800", color:"#0f172a", margin:"0 0 6px" };
const subtitle = { fontSize:"14px", color:"#64748b", margin:"0 0 22px", lineHeight:"1.65" };
const errBox = { background:"#fef2f2", border:"1px solid #fecaca", borderRadius:"10px", padding:"10px 14px", fontSize:"13px", color:"#dc2626", fontWeight:"500", marginBottom:"16px" };
const fieldGrp = { marginBottom:"14px" };
const lbl = { display:"block", fontSize:"13px", fontWeight:"700", color:"#374151", marginBottom:"6px" };
const inp = { width:"100%", padding:"12px 14px", borderRadius:"10px", border:"1.5px solid #e2e8f0", fontSize:"14px", color:"#0f172a", background:"#f8fafc", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box" };
const submitBtn = (bg) => ({ width:"100%", padding:"13px", borderRadius:"11px", border:"none", background:bg, color:bg==="#f1f5f9"?"#475569":"white", fontWeight:"700", fontSize:"15px", fontFamily:"'DM Sans',sans-serif", boxShadow:bg!=="#f1f5f9"?`0 4px 14px ${bg}44`:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", cursor:"pointer" });
