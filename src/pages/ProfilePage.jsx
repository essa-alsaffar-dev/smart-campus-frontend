import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AVATARS = ["👨‍💻","👩‍💻","🧑‍🎓","👨‍🎓","👩‍🎓","🧑‍💼","😎","🤓","🧑‍🔬","👨‍🔬","👩‍🔬","🦸","🧑‍🏫","🐱","🦊","🐼","🚀","⭐","🔥","💎"];

export default function ProfilePage() {
  const navigate  = useNavigate();
  const userName  = localStorage.getItem("userName") || "";
  const userEmail = localStorage.getItem("userEmail") || "";

  const [name,        setName]        = useState(userName);
  const [avatar,      setAvatar]      = useState(() => localStorage.getItem("userAvatar") || "👨‍💻");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [nameMsg,     setNameMsg]     = useState(null);  // {type, text}
  const [passMsg,     setPassMsg]     = useState(null);
  const [nameLoading, setNameLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [pickingAvatar, setPickingAvatar] = useState(false);

  // Password strength
  const strength = (() => {
    if (!newPass) return 0;
    let s = 0;
    if (newPass.length >= 6)  s++;
    if (newPass.length >= 10) s++;
    if (/[A-Z]/.test(newPass)) s++;
    if (/[0-9]/.test(newPass)) s++;
    if (/[^A-Za-z0-9]/.test(newPass)) s++;
    return Math.min(s, 4);
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"][strength];

  const showMsg = (setter, type, text) => {
    setter({ type, text });
    setTimeout(() => setter(null), 3500);
  };

  // Save name (localStorage + optional API)
  const saveName = async () => {
    if (!name.trim()) { showMsg(setNameMsg, "error", "Name cannot be empty."); return; }
    if (name.trim() === userName) { showMsg(setNameMsg, "error", "No changes to save."); return; }
    setNameLoading(true);
    try {
      // Update localStorage immediately
      localStorage.setItem("userName", name.trim());
      // Optionally call API here:
      // await axios.put("http://localhost:8080/user/profile", { name: name.trim() }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      showMsg(setNameMsg, "success", "Name updated successfully! 🎉");
    } catch {
      showMsg(setNameMsg, "error", "Failed to update name.");
    } finally {
      setNameLoading(false);
    }
  };

  // Save avatar
  const saveAvatar = (emoji) => {
    setAvatar(emoji);
    localStorage.setItem("userAvatar", emoji);
    setPickingAvatar(false);
    showMsg(setNameMsg, "success", "Avatar updated!");
  };

  // Change password
  const savePassword = async () => {
    if (!currentPass) { showMsg(setPassMsg, "error", "Enter your current password."); return; }
    if (newPass.length < 6) { showMsg(setPassMsg, "error", "New password must be at least 6 characters."); return; }
    if (newPass !== confirmPass) { showMsg(setPassMsg, "error", "Passwords do not match."); return; }
    setPassLoading(true);
    try {
      // await axios.put("http://localhost:8080/user/password", { currentPassword: currentPass, newPassword: newPass }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
      showMsg(setPassMsg, "success", "Password changed successfully! 🔐");
    } catch (err) {
      showMsg(setPassMsg, err?.response?.status === 401 ? "error" : "error",
        err?.response?.status === 401 ? "Current password is incorrect." : "Failed to change password.");
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div style={page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .pf-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.13);
          background: white;
        }
        .pf-btn { transition: filter 0.15s, transform 0.1s; cursor: pointer; }
        .pf-btn:hover:not(:disabled) { filter: brightness(1.07); }
        .pf-btn:active:not(:disabled) { transform: scale(0.97); }
        .pf-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .pf-avatar-opt {
          width: 48px; height: 48px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; cursor: pointer;
          border: 2px solid transparent;
          background: #f8fafc;
          transition: all 0.15s;
        }
        .pf-avatar-opt:hover { background: #eff6ff; border-color: #93c5fd; transform: scale(1.1); }
        .pf-avatar-opt.selected { border-color: #2563eb; background: #eff6ff; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }

        .pf-eye { background:none; border:none; cursor:pointer; color:#94a3b8; font-size:16px; padding:4px; transition:color 0.15s; line-height:1; }
        .pf-eye:hover { color:#475569; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .pf-spinner { width:16px; height:16px; border:2.5px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; vertical-align:middle; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
        .pf-msg { animation: fadeUp 0.2s ease; }

        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        .pf-picker { animation: fadeIn 0.2s ease; }
      `}</style>

      <div style={container}>

        {/* Header */}
        <div style={headerRow}>
          <div>
            <h1 style={titleSt}>Profile Settings</h1>
            <p style={subtitleSt}>Manage your account information and security.</p>
          </div>
          <button className="pf-btn" onClick={() => navigate("/dashboard")} style={backBtn}>
            ← Dashboard
          </button>
        </div>

        <div style={twoCol}>

          {/* ── Left: Avatar + Info ── */}
          <div style={leftCol}>

            {/* Avatar card */}
            <div style={card}>
              <h2 style={cardTitle}>Profile Picture</h2>
              <p style={cardSub}>Choose an avatar that represents you.</p>

              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"16px" }}>
                {/* Current avatar */}
                <div style={bigAvatar}>
                  <span style={{ fontSize:"52px", lineHeight:1 }}>{avatar}</span>
                </div>

                <button className="pf-btn" onClick={() => setPickingAvatar(!pickingAvatar)} style={changeAvatarBtn}>
                  {pickingAvatar ? "✕ Close" : "✏️ Change Avatar"}
                </button>

                {/* Avatar picker */}
                {pickingAvatar && (
                  <div className="pf-picker" style={avatarGrid}>
                    {AVATARS.map((em) => (
                      <div
                        key={em}
                        className={`pf-avatar-opt${avatar === em ? " selected" : ""}`}
                        onClick={() => saveAvatar(em)}
                        title={em}
                      >
                        {em}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User info summary */}
              <div style={infoSummary}>
                <div style={infoRow}>
                  <span style={infoLabel}>Name</span>
                  <span style={infoValue}>{localStorage.getItem("userName") || "—"}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Role</span>
                  <span style={{ ...infoValue, textTransform:"capitalize" }}>
                    {(localStorage.getItem("userRole") || "student").toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Edit forms ── */}
          <div style={rightCol}>

            {/* Name card */}
            <div style={card}>
              <h2 style={cardTitle}>Display Name</h2>
              <p style={cardSub}>This is the name shown across the platform.</p>

              {nameMsg && (
                <div className="pf-msg" style={nameMsg.type === "success" ? msgSuccess : msgError}>
                  {nameMsg.type === "success" ? "✅" : "⚠️"} {nameMsg.text}
                </div>
              )}

              <div style={fieldGroup}>
                <label style={fieldLabel}>Full Name</label>
                <input
                  className="pf-input"
                  style={fieldInput}
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  maxLength={60}
                />
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:"4px" }}>
                  <span style={{ fontSize:"11px", color:"#94a3b8" }}>{name.length}/60</span>
                </div>
              </div>

              <button className="pf-btn" onClick={saveName} disabled={nameLoading} style={saveBtn("#2563eb")}>
                {nameLoading ? <><span className="pf-spinner" />&nbsp; Saving…</> : "Save Name →"}
              </button>
            </div>

            {/* Password card */}
            <div style={{ ...card, marginTop:"16px" }}>
              <h2 style={cardTitle}>Change Password</h2>
              <p style={cardSub}>Use a strong password to keep your account secure.</p>

              {passMsg && (
                <div className="pf-msg" style={passMsg.type === "success" ? msgSuccess : msgError}>
                  {passMsg.type === "success" ? "✅" : "⚠️"} {passMsg.text}
                </div>
              )}

              <div style={fieldGroup}>
                <label style={fieldLabel}>Current Password</label>
                <div style={{ position:"relative" }}>
                  <input
                    className="pf-input"
                    style={{ ...fieldInput, paddingRight:"44px" }}
                    type={showCurrent ? "text" : "password"}
                    placeholder="Enter current password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                  />
                  <button className="pf-eye" style={eyePos} onClick={() => setShowCurrent(!showCurrent)} type="button">
                    {showCurrent ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <div style={fieldGroup}>
                <label style={fieldLabel}>New Password</label>
                <div style={{ position:"relative" }}>
                  <input
                    className="pf-input"
                    style={{ ...fieldInput, paddingRight:"44px" }}
                    type={showNew ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                  />
                  <button className="pf-eye" style={eyePos} onClick={() => setShowNew(!showNew)} type="button">
                    {showNew ? "🙈" : "👁"}
                  </button>
                </div>
                {newPass && (
                  <div style={{ marginTop:"8px" }}>
                    <div style={{ display:"flex", gap:"4px", marginBottom:"4px" }}>
                      {[1,2,3,4].map((i) => (
                        <div key={i} style={{ flex:1, height:"4px", borderRadius:"999px", background: i <= strength ? strengthColor : "#e2e8f0", transition:"background 0.2s" }} />
                      ))}
                    </div>
                    <span style={{ fontSize:"11px", fontWeight:"700", color:strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              <div style={fieldGroup}>
                <label style={fieldLabel}>Confirm New Password</label>
                <input
                  className="pf-input"
                  style={{ ...fieldInput, borderColor: confirmPass && confirmPass !== newPass ? "#ef4444" : undefined }}
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && savePassword()}
                />
                {confirmPass && confirmPass !== newPass && (
                  <p style={{ fontSize:"12px", color:"#ef4444", margin:"4px 0 0", fontWeight:"600" }}>
                    Passwords don't match
                  </p>
                )}
              </div>

              <button className="pf-btn" onClick={savePassword} disabled={passLoading} style={saveBtn("#0f172a")}>
                {passLoading ? <><span className="pf-spinner" />&nbsp; Updating…</> : "Update Password 🔐"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const page      = { padding:"24px 20px 48px", fontFamily:"'DM Sans', system-ui, sans-serif", minHeight:"100vh" };
const container = { maxWidth:"900px", margin:"0 auto" };
const headerRow = { display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"16px", marginBottom:"28px" };
const titleSt   = { fontSize:"28px", fontWeight:"800", color:"#0f172a", margin:"0 0 4px", letterSpacing:"-0.4px" };
const subtitleSt = { color:"#64748b", fontSize:"14px", margin:0 };
const backBtn   = { padding:"10px 18px", borderRadius:"10px", border:"1.5px solid #e2e8f0", background:"white", color:"#475569", fontWeight:"600", fontSize:"13px", fontFamily:"'DM Sans'" };
const twoCol    = { display:"grid", gridTemplateColumns:"280px 1fr", gap:"20px", alignItems:"start" };
const leftCol   = {};
const rightCol  = {};
const card      = { background:"white", borderRadius:"18px", padding:"24px", border:"1.5px solid #e2e8f0", boxShadow:"0 2px 8px rgba(15,23,42,0.05)" };
const cardTitle = { fontSize:"17px", fontWeight:"800", color:"#0f172a", margin:"0 0 4px" };
const cardSub   = { fontSize:"13px", color:"#64748b", margin:"0 0 20px", lineHeight:"1.5" };

const bigAvatar = { width:"96px", height:"96px", borderRadius:"24px", background:"linear-gradient(135deg,#eff6ff,#dbeafe)", border:"2px solid #bfdbfe", display:"flex", alignItems:"center", justifyContent:"center" };
const changeAvatarBtn = { padding:"9px 18px", borderRadius:"10px", border:"1.5px solid #e2e8f0", background:"white", color:"#374151", fontWeight:"600", fontSize:"13px", fontFamily:"'DM Sans'" };
const avatarGrid = { display:"flex", flexWrap:"wrap", gap:"8px", justifyContent:"center", padding:"12px", background:"#f8fafc", borderRadius:"14px", border:"1.5px solid #e2e8f0", width:"100%" };

const infoSummary = { marginTop:"20px", padding:"14px", background:"#f8fafc", borderRadius:"12px", border:"1px solid #f1f5f9" };
const infoRow   = { display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f1f5f9" };
const infoLabel = { fontSize:"12px", fontWeight:"700", color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.05em" };
const infoValue = { fontSize:"13px", fontWeight:"600", color:"#0f172a" };

const fieldGroup = { marginBottom:"14px" };
const fieldLabel = { display:"block", fontSize:"13px", fontWeight:"700", color:"#374151", marginBottom:"6px" };
const fieldInput = { width:"100%", padding:"11px 14px", borderRadius:"10px", border:"1.5px solid #e2e8f0", fontSize:"14px", color:"#0f172a", background:"#f8fafc", transition:"border-color 0.15s, box-shadow 0.15s, background 0.15s", fontFamily:"'DM Sans'", boxSizing:"border-box" };
const eyePos    = { position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)" };

const saveBtn = (color) => ({ width:"100%", padding:"12px", borderRadius:"10px", border:"none", background:color, color:"white", fontWeight:"700", fontSize:"14px", fontFamily:"'DM Sans'", boxShadow:`0 4px 12px ${color}40`, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" });

const msgSuccess = { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:"10px", padding:"10px 14px", fontSize:"13px", color:"#166534", fontWeight:"500", marginBottom:"16px", display:"flex", alignItems:"center", gap:"6px" };
const msgError   = { background:"#fef2f2", border:"1px solid #fecaca", borderRadius:"10px", padding:"10px 14px", fontSize:"13px", color:"#dc2626", fontWeight:"500", marginBottom:"16px", display:"flex", alignItems:"center", gap:"6px" };