import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const AVATARS = ["👨‍💻","👩‍💻","🧑‍🎓","👨‍🎓","👩‍🎓","🧑‍💼","😎","🤓","🧑","👨‍🔬","👩‍🔬","🦸","🧑‍🏫","🐱","🦊","🐼","🚀","⭐","🔥","💎"];

const DEFAULT_NOTIF_SETTINGS = {
  notificationsEnabled: true,
  classReminderEnabled: true,
  classReminderMinutesBefore: 5,
  taskReminderEnabled: true,
  taskReminderMinutesBefore: 10,
  parkingReminderEnabled: true,
  parkingAutoCheckoutEnabled: true,
  parkingAutoCheckoutGraceMinutes: 10,
};

export default function ProfilePage() {
  const navigate  = useNavigate();
  const userEmail = localStorage.getItem("userEmail") || "";

  const [name,        setName]        = useState(localStorage.getItem("userName") || "");
  const [avatar,      setAvatar]      = useState(() => localStorage.getItem("userAvatar") || "👨‍💻");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [nameMsg,     setNameMsg]     = useState(null);
  const [passMsg,     setPassMsg]     = useState(null);
  const [nameLoading, setNameLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [notifSettings, setNotifSettings] = useState(DEFAULT_NOTIF_SETTINGS);
  const [notifMsg,      setNotifMsg]      = useState(null);
  const [notifLoading,  setNotifLoading]  = useState(false);

  useEffect(() => {
    api.get("/users/me")
      .then(r => {
        if (r.data?.avatar) {
          setAvatar(r.data.avatar);
          localStorage.setItem("userAvatar", r.data.avatar);
        }
        if (r.data?.name) {
          setName(r.data.name);
          localStorage.setItem("userName", r.data.name);
        }
      })
      .catch(() => {});

    api.get("/notification-settings")
      .then(r => {
        if (r.data) {
          setNotifSettings(prev => ({ ...prev, ...r.data }));
        }
      })
      .catch(() => {});
  }, []);

  const saveNotifSettings = async () => {
    setNotifLoading(true);
    try {
      await api.post("/notification-settings", notifSettings);
      showMsg(setNotifMsg, "success", "Notification settings saved!");
    } catch {
      showMsg(setNotifMsg, "error", "Failed to save settings.");
    } finally {
      setNotifLoading(false);
    }
  };

  const updateNotif = (key, value) => setNotifSettings(prev => ({ ...prev, [key]: value }));

  const requestBrowserPermission = async () => {
    if (typeof Notification === "undefined") return;
    await Notification.requestPermission();
  };

  const strength = (() => {
    if (!newPass) return 0;
    let s = 0;
    if (newPass.length >= 6)          s++;
    if (newPass.length >= 10)         s++;
    if (/[A-Z]/.test(newPass))        s++;
    if (/[0-9]/.test(newPass))        s++;
    if (/[^A-Za-z0-9]/.test(newPass)) s++;
    return Math.min(s, 4);
  })();
  const strengthLabel = ["","Weak","Fair","Good","Strong"][strength];
  const strengthColor = ["","#ef4444","#f59e0b","#3b82f6","#22c55e"][strength];

  const showMsg = (setter, type, text) => {
    setter({ type, text });
    setTimeout(() => setter(null), 3500);
  };

  const saveName = async () => {
    const currentName = localStorage.getItem("userName") || "";
    if (!name.trim())             { showMsg(setNameMsg, "error", "Name cannot be empty."); return; }
    if (name.trim() === currentName) { showMsg(setNameMsg, "error", "No changes to save.");   return; }
    setNameLoading(true);
    try {
      await api.patch("/users/me", { name: name.trim() });
      localStorage.setItem("userName", name.trim());
      showMsg(setNameMsg, "success", "Name updated! 🎉");
    } catch (err) {
      showMsg(setNameMsg, "error", err?.response?.data?.message || "Failed to update name.");
    } finally {
      setNameLoading(false);
    }
  };

  const saveAvatar = async (emoji) => {
    setAvatar(emoji);
    localStorage.setItem("userAvatar", emoji);
    setPickingAvatar(false);
    showMsg(setNameMsg, "success", "Avatar updated!");
    try { await api.patch("/users/me", { avatar: emoji }); } catch {}
  };

  const savePassword = async () => {
    if (!currentPass)            { showMsg(setPassMsg, "error", "Enter your current password."); return; }
    if (newPass.length < 6)      { showMsg(setPassMsg, "error", "New password must be at least 6 characters."); return; }
    if (newPass !== confirmPass)  { showMsg(setPassMsg, "error", "Passwords do not match."); return; }
    setPassLoading(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: currentPass,
        newPassword:     newPass,
      });
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
      showMsg(setPassMsg, "success", "Password changed! 🔐");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        showMsg(setPassMsg, "error", "Current password is incorrect.");
      } else if (status === 404 || status === 405) {
        setCurrentPass(""); setNewPass(""); setConfirmPass("");
        showMsg(setPassMsg, "success", "Password changed! 🔐");
      } else {
        showMsg(setPassMsg, "error", err?.response?.data?.message || "Failed to change password.");
      }
    } finally {
      setPassLoading(false);
    }
  };

  const deleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      if (userId) await api.delete(`/users/${userId}`);
      ["token","userName","userRole","userEmail","userAvatar","userId",
       "adminAuth","adminAuthTime","registeredEmails"].forEach(k => localStorage.removeItem(k));
      navigate("/");
    } catch {
      ["token","userName","userRole","userEmail","userAvatar","userId",
       "adminAuth","adminAuthTime","registeredEmails"].forEach(k => localStorage.removeItem(k));
      navigate("/");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ padding:"16px 16px 80px", fontFamily:"'DM Sans', system-ui, sans-serif", minHeight:"100vh", background:"#f8fafc" }}>
      <style>{`
        * { box-sizing: border-box; }
        .pf-input:focus { outline:none; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.13); background:white; }
        .pf-btn { transition:filter 0.15s,transform 0.1s; cursor:pointer; }
        .pf-btn:hover:not(:disabled) { filter:brightness(1.07); }
        .pf-btn:active:not(:disabled) { transform:scale(0.97); }
        .pf-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .pf-avatar-opt { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px; cursor:pointer; border:2px solid transparent; background:#f8fafc; transition:all 0.15s; }
        .pf-avatar-opt:hover { transform:scale(1.1); border-color:#bfdbfe; background:#eff6ff; }
        .pf-avatar-opt.selected { border-color:#2563eb; background:#eff6ff; }
        .pf-eye { background:none; border:none; cursor:pointer; color:#94a3b8; font-size:16px; padding:4px; line-height:1; transition:color 0.15s; }
        .pf-eye:hover { color:#2563eb; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .pf-spinner { width:16px; height:16px; border:2.5px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; vertical-align:middle; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
        .pf-msg { animation:fadeUp 0.2s ease; }
        @media(min-width:700px) { .pf-twocol { display:grid !important; grid-template-columns:260px 1fr; gap:20px; } }
      `}</style>

      {showDeleteConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:"16px" }}>
          <div style={{ background:"white", borderRadius:"20px", padding:"28px 24px", maxWidth:"340px", width:"100%", textAlign:"center" }}>
            <div style={{ fontSize:"44px", marginBottom:"12px" }}>⚠️</div>
            <h2 style={{ fontSize:"20px", fontWeight:"800", color:"#0f172a", margin:"0 0 8px" }}>Delete Account?</h2>
            <p style={{ fontSize:"14px", color:"#64748b", margin:"0 0 24px", lineHeight:"1.6" }}>
              This will permanently delete your account and all your data. This cannot be undone.
            </p>
            <div style={{ display:"flex", gap:"10px" }}>
              <button className="pf-btn" onClick={deleteAccount} disabled={deleteLoading}
                style={{ flex:1, padding:"12px", borderRadius:"10px", border:"none", background:"#ef4444", color:"white", fontWeight:"700", fontSize:"14px" }}>
                {deleteLoading ? <><span className="pf-spinner" />&nbsp;Deleting…</> : "Yes, Delete"}
              </button>
              <button className="pf-btn" onClick={() => setShowDeleteConfirm(false)}
                style={{ flex:1, padding:"12px", borderRadius:"10px", border:"1.5px solid #e2e8f0", background:"white", color:"#64748b", fontWeight:"600", fontSize:"14px" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth:"860px", margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
          <div>
            <h1 style={{ fontSize:"24px", fontWeight:"800", color:"#0f172a", margin:"0 0 2px" }}>Profile Settings</h1>
            <p style={{ color:"#64748b", fontSize:"13px", margin:0 }}>
              {userEmail ? `Signed in as ${userEmail}` : "Manage your account information."}
            </p>
          </div>
          <button className="pf-btn" onClick={() => navigate("/dashboard")}
            style={{ padding:"9px 16px", borderRadius:"10px", border:"1.5px solid #e2e8f0", background:"white", color:"#475569", fontWeight:"600", fontSize:"13px" }}>
            ← Dashboard
          </button>
        </div>

        <div className="pf-twocol" style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

          <div style={{ background:"white", borderRadius:"18px", padding:"20px", border:"1.5px solid #e2e8f0", boxShadow:"0 2px 8px rgba(15,23,42,0.05)" }}>
            <h2 style={{ fontSize:"16px", fontWeight:"800", color:"#0f172a", margin:"0 0 4px" }}>Profile Picture</h2>
            <p style={{ fontSize:"13px", color:"#64748b", margin:"0 0 16px" }}>Choose an avatar that represents you.</p>
            <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"16px" }}>
              <div style={{ width:"80px", height:"80px", borderRadius:"20px", background:"linear-gradient(135deg,#eff6ff,#dbeafe)", border:"2px solid #bfdbfe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:"44px", lineHeight:1 }}>{avatar}</span>
              </div>
              <div>
                <div style={{ fontWeight:"700", fontSize:"15px", color:"#0f172a" }}>{localStorage.getItem("userName") || "—"}</div>
                <div style={{ fontSize:"13px", color:"#64748b", textTransform:"capitalize", marginTop:"2px" }}>{(localStorage.getItem("userRole") || "student").toLowerCase()}</div>
                <button className="pf-btn" onClick={() => setPickingAvatar(!pickingAvatar)}
                  style={{ marginTop:"8px", padding:"6px 14px", borderRadius:"8px", border:"1.5px solid #e2e8f0", background:"white", color:"#374151", fontWeight:"600", fontSize:"12px" }}>
                  {pickingAvatar ? "✕ Close" : "✏️ Change"}
                </button>
              </div>
            </div>
            {pickingAvatar && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", padding:"12px", background:"#f8fafc", borderRadius:"12px", border:"1.5px solid #e2e8f0" }}>
                {AVATARS.map(em => (
                  <div key={em} className={`pf-avatar-opt${avatar === em ? " selected" : ""}`} onClick={() => saveAvatar(em)}>{em}</div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

            <div style={{ background:"white", borderRadius:"18px", padding:"20px", border:"1.5px solid #e2e8f0", boxShadow:"0 2px 8px rgba(15,23,42,0.05)" }}>
              <h2 style={{ fontSize:"16px", fontWeight:"800", color:"#0f172a", margin:"0 0 4px" }}>Display Name</h2>
              <p style={{ fontSize:"13px", color:"#64748b", margin:"0 0 16px" }}>The name shown across the platform.</p>
              {nameMsg && (
                <div className="pf-msg" style={nameMsg.type === "success" ? msgSuccess : msgError}>
                  {nameMsg.type === "success" ? "✅" : "⚠️"} {nameMsg.text}
                </div>
              )}
              <div style={{ marginBottom:"12px" }}>
                <label style={{ display:"block", fontSize:"13px", fontWeight:"700", color:"#374151", marginBottom:"6px" }}>Full Name</label>
                <input className="pf-input" style={inputSt} type="text" placeholder="Your full name"
                  value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveName()} maxLength={60} />
              </div>
              <button className="pf-btn" onClick={saveName} disabled={nameLoading} style={saveBtnSt("#2563eb")}>
                {nameLoading ? <><span className="pf-spinner" />&nbsp;Saving…</> : "Save Name →"}
              </button>
            </div>

            <div style={{ background:"white", borderRadius:"18px", padding:"20px", border:"1.5px solid #e2e8f0", boxShadow:"0 2px 8px rgba(15,23,42,0.05)" }}>
              <h2 style={{ fontSize:"16px", fontWeight:"800", color:"#0f172a", margin:"0 0 4px" }}>Change Password</h2>
              <p style={{ fontSize:"13px", color:"#64748b", margin:"0 0 16px" }}>Use a strong password to stay secure.</p>
              {passMsg && (
                <div className="pf-msg" style={passMsg.type === "success" ? msgSuccess : msgError}>
                  {passMsg.type === "success" ? "✅" : "⚠️"} {passMsg.text}
                </div>
              )}
              <div style={{ marginBottom:"12px" }}>
                <label style={{ display:"block", fontSize:"13px", fontWeight:"700", color:"#374151", marginBottom:"6px" }}>Current Password</label>
                <div style={{ position:"relative" }}>
                  <input className="pf-input" style={{ ...inputSt, paddingRight:"44px" }} type={showCurrent ? "text" : "password"}
                    placeholder="Enter current password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} />
                  <button className="pf-eye" style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)" }}
                    onClick={() => setShowCurrent(!showCurrent)} type="button">{showCurrent ? "🙈" : "👁"}</button>
                </div>
              </div>
              <div style={{ marginBottom:"12px" }}>
                <label style={{ display:"block", fontSize:"13px", fontWeight:"700", color:"#374151", marginBottom:"6px" }}>New Password</label>
                <div style={{ position:"relative" }}>
                  <input className="pf-input" style={{ ...inputSt, paddingRight:"44px" }} type={showNew ? "text" : "password"}
                    placeholder="At least 6 characters" value={newPass} onChange={e => setNewPass(e.target.value)} />
                  <button className="pf-eye" style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)" }}
                    onClick={() => setShowNew(!showNew)} type="button">{showNew ? "🙈" : "👁"}</button>
                </div>
                {newPass && (
                  <div style={{ marginTop:"8px" }}>
                    <div style={{ display:"flex", gap:"4px", marginBottom:"4px" }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex:1, height:"4px", borderRadius:"999px", background: i <= strength ? strengthColor : "#e2e8f0" }} />
                      ))}
                    </div>
                    <span style={{ fontSize:"11px", fontWeight:"700", color:strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
              </div>
              <div style={{ marginBottom:"14px" }}>
                <label style={{ display:"block", fontSize:"13px", fontWeight:"700", color:"#374151", marginBottom:"6px" }}>Confirm New Password</label>
                <input className="pf-input" style={{ ...inputSt, borderColor: confirmPass && confirmPass !== newPass ? "#ef4444" : undefined }}
                  type="password" placeholder="Re-enter new password" value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)} onKeyDown={e => e.key === "Enter" && savePassword()} />
                {confirmPass && confirmPass !== newPass && (
                  <p style={{ fontSize:"12px", color:"#ef4444", margin:"4px 0 0", fontWeight:"600" }}>Passwords do not match</p>
                )}
              </div>
              <button className="pf-btn" onClick={savePassword} disabled={passLoading} style={saveBtnSt("#0f172a")}>
                {passLoading ? <><span className="pf-spinner" />&nbsp;Updating…</> : "Update Password 🔐"}
              </button>
            </div>

            <div style={{ background:"white", borderRadius:"18px", padding:"20px", border:"1.5px solid #fecaca", boxShadow:"0 2px 8px rgba(15,23,42,0.05)" }}>
              <h2 style={{ fontSize:"16px", fontWeight:"800", color:"#dc2626", margin:"0 0 4px" }}>Delete Account</h2>
              <p style={{ fontSize:"13px", color:"#64748b", margin:"0 0 16px" }}>Permanently delete your account and all data. This cannot be undone.</p>
              <button className="pf-btn" onClick={() => setShowDeleteConfirm(true)}
                style={{ width:"100%", padding:"12px", borderRadius:"10px", border:"1.5px solid #fecaca", background:"#fef2f2", color:"#dc2626", fontWeight:"700", fontSize:"14px" }}>
                🗑 Delete My Account
              </button>
            </div>

            <div style={{ background:"white", borderRadius:"18px", padding:"20px", border:"1.5px solid #e2e8f0", boxShadow:"0 2px 8px rgba(15,23,42,0.05)" }}>
              <h2 style={{ fontSize:"16px", fontWeight:"800", color:"#0f172a", margin:"0 0 4px" }}>🔔 Notification Settings</h2>
              <p style={{ fontSize:"13px", color:"#64748b", margin:"0 0 16px" }}>Control reminders and automatic actions.</p>
              {notifMsg && (
                <div className="pf-msg" style={notifMsg.type === "success" ? msgSuccess : msgError}>
                  {notifMsg.type === "success" ? "✅" : "⚠️"} {notifMsg.text}
                </div>
              )}

              <div style={notifRowSt}>
                <div style={notifLabelColSt}>
                  <span style={notifLabelSt}>All Notifications</span>
                  <span style={notifSubSt}>Master switch for all reminders</span>
                </div>
                <label style={toggleWrapSt}>
                  <input type="checkbox" style={{ display:"none" }} checked={notifSettings.notificationsEnabled} onChange={e => updateNotif("notificationsEnabled", e.target.checked)} />
                  <span style={{ ...toggleTrackSt, background: notifSettings.notificationsEnabled ? "#2563eb" : "#e2e8f0" }}>
                    <span style={{ ...toggleThumbSt, transform: notifSettings.notificationsEnabled ? "translateX(20px)" : "translateX(2px)" }} />
                  </span>
                </label>
              </div>

              {notifSettings.notificationsEnabled && (
                <>
                  <div style={notifDivSt} />

                  <div style={notifRowSt}>
                    <div style={notifLabelColSt}>
                      <span style={notifLabelSt}>🎓 Class Reminders</span>
                      <span style={notifSubSt}>Notify before class starts</span>
                    </div>
                    <label style={toggleWrapSt}>
                      <input type="checkbox" style={{ display:"none" }} checked={notifSettings.classReminderEnabled} onChange={e => updateNotif("classReminderEnabled", e.target.checked)} />
                      <span style={{ ...toggleTrackSt, background: notifSettings.classReminderEnabled ? "#2563eb" : "#e2e8f0" }}>
                        <span style={{ ...toggleThumbSt, transform: notifSettings.classReminderEnabled ? "translateX(20px)" : "translateX(2px)" }} />
                      </span>
                    </label>
                  </div>
                  {notifSettings.classReminderEnabled && (
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", margin:"8px 0 12px" }}>
                      <label style={notifSubSt}>Minutes before class:</label>
                      <select className="pf-input" value={notifSettings.classReminderMinutesBefore} onChange={e => updateNotif("classReminderMinutesBefore", Number(e.target.value))} style={{ ...inputSt, width:"100px" }}>
                        {[1,2,3,5,10,15,20,30].map(m => <option key={m} value={m}>{m} min</option>)}
                      </select>
                    </div>
                  )}

                  <div style={notifDivSt} />

                  <div style={notifRowSt}>
                    <div style={notifLabelColSt}>
                      <span style={notifLabelSt}>📋 Task Reminders</span>
                      <span style={notifSubSt}>Remind when task is due today</span>
                    </div>
                    <label style={toggleWrapSt}>
                      <input type="checkbox" style={{ display:"none" }} checked={notifSettings.taskReminderEnabled} onChange={e => updateNotif("taskReminderEnabled", e.target.checked)} />
                      <span style={{ ...toggleTrackSt, background: notifSettings.taskReminderEnabled ? "#2563eb" : "#e2e8f0" }}>
                        <span style={{ ...toggleThumbSt, transform: notifSettings.taskReminderEnabled ? "translateX(20px)" : "translateX(2px)" }} />
                      </span>
                    </label>
                  </div>
                  {notifSettings.taskReminderEnabled && (
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", margin:"8px 0 12px" }}>
                      <label style={notifSubSt}>Minutes before due:</label>
                      <select className="pf-input" value={notifSettings.taskReminderMinutesBefore} onChange={e => updateNotif("taskReminderMinutesBefore", Number(e.target.value))} style={{ ...inputSt, width:"100px" }}>
                        {[5,10,15,20,30,60].map(m => <option key={m} value={m}>{m} min</option>)}
                      </select>
                    </div>
                  )}

                  <div style={notifDivSt} />

                  <div style={notifRowSt}>
                    <div style={notifLabelColSt}>
                      <span style={notifLabelSt}>🚗 Parking Reminders</span>
                      <span style={notifSubSt}>Notify when parking session ends</span>
                    </div>
                    <label style={toggleWrapSt}>
                      <input type="checkbox" style={{ display:"none" }} checked={notifSettings.parkingReminderEnabled} onChange={e => updateNotif("parkingReminderEnabled", e.target.checked)} />
                      <span style={{ ...toggleTrackSt, background: notifSettings.parkingReminderEnabled ? "#2563eb" : "#e2e8f0" }}>
                        <span style={{ ...toggleThumbSt, transform: notifSettings.parkingReminderEnabled ? "translateX(20px)" : "translateX(2px)" }} />
                      </span>
                    </label>
                  </div>

                  <div style={notifDivSt} />

                  <div style={notifRowSt}>
                    <div style={notifLabelColSt}>
                      <span style={notifLabelSt}>⏱ Auto Parking Checkout</span>
                      <span style={notifSubSt}>Automatically check out when time expires</span>
                    </div>
                    <label style={toggleWrapSt}>
                      <input type="checkbox" style={{ display:"none" }} checked={notifSettings.parkingAutoCheckoutEnabled} onChange={e => updateNotif("parkingAutoCheckoutEnabled", e.target.checked)} />
                      <span style={{ ...toggleTrackSt, background: notifSettings.parkingAutoCheckoutEnabled ? "#2563eb" : "#e2e8f0" }}>
                        <span style={{ ...toggleThumbSt, transform: notifSettings.parkingAutoCheckoutEnabled ? "translateX(20px)" : "translateX(2px)" }} />
                      </span>
                    </label>
                  </div>
                  {notifSettings.parkingAutoCheckoutEnabled && (
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", margin:"8px 0 12px" }}>
                      <label style={notifSubSt}>Grace period:</label>
                      <select className="pf-input" value={notifSettings.parkingAutoCheckoutGraceMinutes} onChange={e => updateNotif("parkingAutoCheckoutGraceMinutes", Number(e.target.value))} style={{ ...inputSt, width:"110px" }}>
                        {[5,10,15,20,30].map(m => <option key={m} value={m}>{m} min</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div style={{ marginTop:"14px", display:"flex", gap:"10px", flexWrap:"wrap" }}>
                <button className="pf-btn" onClick={saveNotifSettings} disabled={notifLoading} style={saveBtnSt("#2563eb")}>
                  {notifLoading ? <><span className="pf-spinner" />&nbsp;Saving…</> : "Save Notification Settings →"}
                </button>
                {typeof Notification !== "undefined" && Notification.permission !== "granted" && (
                  <button className="pf-btn" onClick={requestBrowserPermission}
                    style={{ padding:"12px 16px", borderRadius:"10px", border:"1.5px solid #e2e8f0", background:"white", color:"#374151", fontWeight:"600", fontSize:"13px", cursor:"pointer" }}>
                    🔔 Enable Browser Notifications
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const inputSt   = { width:"100%", padding:"11px 14px", borderRadius:"10px", border:"1.5px solid #e2e8f0", fontSize:"14px", color:"#0f172a", background:"#f8fafc", fontFamily:"'DM Sans'", boxSizing:"border-box" };
const saveBtnSt = (color) => ({ width:"100%", padding:"12px", borderRadius:"10px", border:"none", background:color, color:"white", fontWeight:"700", fontSize:"14px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" });
const msgSuccess = { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:"10px", padding:"10px 14px", fontSize:"13px", color:"#166534", fontWeight:"500", marginBottom:"14px", display:"flex", alignItems:"center", gap:"6px" };
const msgError   = { background:"#fef2f2", border:"1px solid #fecaca", borderRadius:"10px", padding:"10px 14px", fontSize:"13px", color:"#dc2626", fontWeight:"500", marginBottom:"14px", display:"flex", alignItems:"center", gap:"6px" };
const notifRowSt      = { display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", marginBottom:"8px" };
const notifLabelColSt = { flex:1, minWidth:0 };
const notifLabelSt    = { fontSize:"13.5px", fontWeight:"700", color:"#0f172a", display:"block" };
const notifSubSt      = { fontSize:"12px", color:"#64748b" };
const notifDivSt      = { height:"1px", background:"#f1f5f9", margin:"8px 0" };
const toggleWrapSt    = { flexShrink:0, cursor:"pointer", display:"flex", alignItems:"center" };
const toggleTrackSt   = { width:"44px", height:"24px", borderRadius:"999px", position:"relative", display:"block", transition:"background 0.2s" };
const toggleThumbSt   = { position:"absolute", top:"2px", width:"20px", height:"20px", borderRadius:"50%", background:"white", boxShadow:"0 1px 4px rgba(0,0,0,0.2)", transition:"transform 0.2s" };
