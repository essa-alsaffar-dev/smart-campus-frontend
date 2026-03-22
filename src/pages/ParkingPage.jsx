import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../api/api";

const getStatusColor = (pct) => {
  if (pct >= 90) return { bar: "#ef4444", badge: "#fef2f2", text: "#dc2626", label: "Almost Full" };
  if (pct >= 60) return { bar: "#f59e0b", badge: "#fffbeb", text: "#d97706", label: "Available — Filling Up" };
  return               { bar: "#22c55e", badge: "#f0fdf4", text: "#16a34a", label: "Available" };
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const getCurrentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
};

export default function ParkingPage() {
  const [zones,             setZones]             = useState([]);
  const [mySession,         setMySession]         = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [toast,             setToast]             = useState("");
  const [confirmLeave,      setConfirmLeave]      = useState(false);
  const [autoReleasePrompt, setAutoReleasePrompt] = useState(false);

  const schedule = useMemo(() => {
    const saved = localStorage.getItem(`schedule_${localStorage.getItem("userEmail") || localStorage.getItem("userName") || "guest"}`);
    return saved ? JSON.parse(saved) : [];
  }, []);

  // ── Load zones + my session from backend ──
  const loadData = useCallback(async () => {
    try {
      const [zonesRes, sessionRes] = await Promise.allSettled([
        api.get("/parking-zones"),
        api.get("/parking-zones/my-session"),
      ]);

      if (zonesRes.status === "fulfilled") {
        setZones(zonesRes.value.data);
      }

      if (sessionRes.status === "fulfilled") {
        const data = sessionRes.value.data;
        setMySession(data.active ? data : null);
      }
    } catch (err) {
      console.error("Failed to load parking data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 30000);
    return () => clearInterval(id);
  }, [loadData]);

  // ── Auto-release prompt ──
  useEffect(() => {
    if (!mySession?.endTime) return;
    const check = () => {
      const now = getCurrentMinutes();
      const end = parseTimeToMinutes(mySession.endTime);
      if (end && now >= end) setAutoReleasePrompt(true);
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [mySession]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  // ── Check in → calls backend ──
  const checkIn = async (zoneId, endTime, courseName) => {
    try {
      const res = await api.post(`/parking-zones/checkin/${zoneId}`);
      if (res.data.success) {
        setMySession({
          active:      true,
          zoneId,
          checkedInAt: res.data.checkedInAt,
          endTime:     endTime   || null,
          courseName:  courseName || null,
        });
        setAutoReleasePrompt(false);
        await loadData();
        const zone = zones.find(z => z.id === zoneId);
        showToast(`You are checked in at ${zone?.name || zoneId}`);
      } else {
        showToast(res.data.message || "Check-in failed");
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Check-in failed. Try again.");
    }
  };

  // ── Check out → calls backend ──
  const checkOut = async () => {
    try {
      await api.delete("/parking-zones/checkout");
      setMySession(null);
      setConfirmLeave(false);
      setAutoReleasePrompt(false);
      await loadData();
      showToast("You have checked out");
    } catch {
      showToast("Check-out failed. Try again.");
    }
  };

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName    = days[new Date().getDay()];
  const todayClasses = schedule.filter(s => s.day === todayName);

  const nextClassEnd = useMemo(() => {
    const now = getCurrentMinutes();
    return todayClasses
      .map(c => {
        const parts  = c.time?.split("-").map(t => t.trim());
        const endStr = parts?.[1];
        const endMin = parseTimeToMinutes(endStr?.includes(":") ? endStr : null);
        return { ...c, endMin, endStr };
      })
      .filter(c => c.endMin && c.endMin > now)
      .sort((a, b) => a.endMin - b.endMin)[0] || null;
  }, [todayClasses]);

  const myZone = zones.find(z => z.id === mySession?.zoneId);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#64748b", margin: 0 }}>Loading parking data...</p>
      </div>
    );
  }

  return (
    <div style={page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
        * { box-sizing: border-box; }
        .zone-card { transition: box-shadow 0.2s, transform 0.2s; }
        .zone-card:hover { box-shadow: 0 14px 36px rgba(15,23,42,0.13); transform: translateY(-3px); }
        .checkin-btn { transition: filter 0.15s, transform 0.1s, box-shadow 0.15s; }
        .checkin-btn:hover:not(:disabled) { filter: brightness(1.08); }
        .checkin-btn:active:not(:disabled) { transform: scale(0.97); }
        .checkin-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes liveGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); } 50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); } }
        .live-dot { animation: liveGlow 2s ease-in-out infinite; }
        @media(max-width:700px) { .parking-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {toast && <div style={toastStyle}>{toast}</div>}

      {/* Auto-release prompt */}
      {autoReleasePrompt && mySession && (
        <div style={bannerStyle}>
          <span>Class time is over. Did you leave the <strong>{myZone?.name}</strong> parking area?</span>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={checkOut} style={bannerBtnGreen}>Yes, I left</button>
            <button onClick={() => setAutoReleasePrompt(false)} style={bannerBtnGray}>No, still there</button>
          </div>
        </div>
      )}

      <div style={container}>
        <div style={headerRow}>
          <div>
            <h1 style={titleStyle}>College Parking</h1>
            <p style={subtitleStyle}>Parking for Computer Science students — Building A11</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={totalAvailBadge}>
              <span style={{ fontSize: "28px", fontWeight: "800", color: "#16a34a", fontFamily: "'DM Sans'" }}>
                {zones.reduce((sum, z) => sum + (z.total - z.occupied), 0)}
              </span>
              <span style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Available Spots</span>
            </div>
            <button onClick={loadData} style={{ padding: "8px 14px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "white", color: "#475569", fontWeight: "600", fontSize: "13px", cursor: "pointer", fontFamily: "'DM Sans'" }}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* My session banner */}
        {mySession && myZone && (
          <div style={mySessionCard}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ fontSize: "36px" }}>{myZone.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: "700", fontSize: "16px", color: "#0f172a" }}>
                  You are currently parked at: <span style={{ color: "#2563eb" }}>{myZone.name}</span>
                </p>
                {mySession.courseName && (
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                    Course: {mySession.courseName}
                    {mySession.endTime && ` — Ends at ${formatTime(mySession.endTime)}`}
                  </p>
                )}
                {mySession.checkedInAt && (
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                    Checked in: {new Date(mySession.checkedInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
              <button className="checkin-btn" onClick={() => setConfirmLeave(true)} style={leaveBtn}>Check Out</button>
            </div>
          </div>
        )}

        {/* Confirm leave modal */}
        {confirmLeave && (
          <div style={overlay}>
            <div style={modal}>
              <p style={{ fontWeight: "700", fontSize: "18px", margin: "0 0 8px" }}>Confirm Leaving</p>
              <p style={{ color: "#64748b", margin: "0 0 20px" }}>Are you sure you left <strong>{myZone?.name}</strong>?</p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={checkOut} style={modalBtnGreen}>Yes, I left</button>
                <button onClick={() => setConfirmLeave(false)} style={modalBtnGray}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Zone cards */}
        <div className="parking-grid" style={grid}>
          {zones.map((zone) => {
            const available = zone.total - zone.occupied;
            const pct       = zone.total > 0 ? Math.round((zone.occupied / zone.total) * 100) : 0;
            const status    = getStatusColor(pct);
            const isMyZone  = mySession?.zoneId === zone.id;
            const isFull    = available <= 0;
            return (
              <ZoneCard
                key={zone.id}
                zone={zone}
                available={available}
                pct={pct}
                status={status}
                isMyZone={isMyZone}
                isFull={isFull}
                hasSession={!!mySession}
                nextClassEnd={nextClassEnd}
                onCheckIn={checkIn}
              />
            );
          })}
        </div>

        <div style={legend}>
          <span style={legendItem}>🟢 Available</span>
          <span style={legendItem}>🟡 Filling Up</span>
          <span style={legendItem}>🔴 Almost Full</span>
          <span style={{ color: "#94a3b8", fontSize: "12px", marginRight: "auto" }}>
            * Live data from server — synced across all devices
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Zone Card ────────────────────────────────────────────────────────────────
function ZoneCard({ zone, available, pct, status, isMyZone, isFull, hasSession, nextClassEnd, onCheckIn }) {
  const [showForm,      setShowForm]      = useState(false);
  const [selectedEnd,   setSelectedEnd]   = useState(nextClassEnd?.endStr || "");
  const [selectedCourse, setSelectedCourse] = useState(nextClassEnd?.courseName || "");
  const [checking,      setChecking]      = useState(false);

  useEffect(() => {
    if (nextClassEnd) {
      setSelectedEnd(nextClassEnd.endStr || "");
      setSelectedCourse(nextClassEnd.courseName || "");
    }
  }, [nextClassEnd]);

  const handleCheckIn = async () => {
    setChecking(true);
    await onCheckIn(zone.id, selectedEnd, selectedCourse);
    setShowForm(false);
    setChecking(false);
  };

  return (
    <div className="zone-card" style={{ background: "white", borderRadius: "20px", padding: "22px", border: isMyZone ? "2px solid #2563eb" : "1.5px solid #e2e8f0", boxShadow: isMyZone ? "0 0 0 4px rgba(37,99,235,0.1)" : "0 2px 8px rgba(15,23,42,0.05)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: status.bar, borderRadius: "20px 20px 0 0" }} />

      {isMyZone && (
        <div style={{ position: "absolute", top: "14px", left: "14px", background: "#2563eb", color: "white", fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "999px", animation: "pulse 2s infinite" }}>
          You Are Here
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px", marginTop: isMyZone ? "20px" : "0" }}>
        <div style={{ fontSize: "32px", lineHeight: 1 }}>{zone.icon}</div>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>{zone.name}</h3>
          <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>{zone.description}</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div>
          <span style={{ fontSize: "32px", fontWeight: "800", color: isFull ? "#dc2626" : "#0f172a", fontFamily: "'DM Sans'" }}>{available}</span>
          <span style={{ fontSize: "14px", color: "#94a3b8", marginLeft: "6px" }}>/ {zone.total} Available</span>
        </div>
        <span style={{ padding: "5px 12px", borderRadius: "999px", background: status.badge, color: status.text, fontSize: "12px", fontWeight: "700" }}>
          {status.label}
        </span>
      </div>

      <div style={{ background: "#f1f5f9", borderRadius: "999px", height: "8px", marginBottom: "18px", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: "999px", width: `${pct}%`, background: status.bar, transition: "width 0.4s ease" }} />
      </div>

      {!hasSession && !isFull && (
        <>
          {!showForm ? (
            <button className="checkin-btn" onClick={() => setShowForm(true)} style={checkInBtn}>
              I Parked Here
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="text"
                placeholder="Course name (optional)"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                style={formInput}
              />
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <label style={{ fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>End time:</label>
                <input type="time" value={selectedEnd} onChange={(e) => setSelectedEnd(e.target.value)} style={{ ...formInput, flex: 1 }} />
              </div>
              {nextClassEnd && (
                <p style={{ margin: 0, fontSize: "11px", color: "#2563eb" }}>
                  Auto-filled from schedule: {nextClassEnd.courseName} ends at {formatTime(nextClassEnd.endStr)}
                </p>
              )}
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="checkin-btn" onClick={handleCheckIn} disabled={checking} style={confirmBtn}>
                  {checking ? "Checking in..." : "Confirm"}
                </button>
                <button onClick={() => setShowForm(false)} style={cancelBtn}>Cancel</button>
              </div>
            </div>
          )}
        </>
      )}

      {isFull && (
        <div style={{ textAlign: "center", padding: "10px", background: "#fef2f2", borderRadius: "10px", color: "#dc2626", fontSize: "13px", fontWeight: "600" }}>
          Parking is currently full
        </div>
      )}

      {hasSession && !isMyZone && (
        <div style={{ textAlign: "center", padding: "10px", background: "#f8fafc", borderRadius: "10px", color: "#94a3b8", fontSize: "13px" }}>
          You are checked in at another zone
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const page           = { padding: "24px 20px 48px", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f8fafc" };
const container      = { maxWidth: "1000px", margin: "0 auto" };
const headerRow      = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "22px" };
const titleStyle     = { fontSize: "32px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.5px" };
const subtitleStyle  = { color: "#64748b", fontSize: "14px", margin: 0 };
const totalAvailBadge = { background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "16px", padding: "14px 22px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 4px 14px rgba(34,197,94,0.12)" };
const mySessionCard  = { background: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "2px solid #93c5fd", borderRadius: "18px", padding: "20px", marginBottom: "22px", animation: "fadeUp 0.3s ease", boxShadow: "0 4px 16px rgba(37,99,235,0.10)" };
const leaveBtn       = { padding: "10px 18px", borderRadius: "10px", border: "none", background: "#ef4444", color: "white", fontWeight: "700", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" };
const grid           = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "18px", marginBottom: "22px" };
const checkInBtn     = { width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "white", fontWeight: "800", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 14px rgba(37,99,235,0.30)" };
const formInput      = { padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px", background: "#f8fafc", color: "#0f172a", fontFamily: "'DM Sans', sans-serif", width: "100%", boxSizing: "border-box" };
const confirmBtn     = { flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#22c55e", color: "white", fontWeight: "700", cursor: "pointer", fontSize: "13px", fontFamily: "'DM Sans', sans-serif" };
const cancelBtn      = { flex: 1, padding: "10px", borderRadius: "8px", border: "1.5px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: "600", cursor: "pointer", fontSize: "13px", fontFamily: "'DM Sans', sans-serif" };
const legend         = { display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", padding: "12px 16px", background: "white", borderRadius: "12px", border: "1.5px solid #e2e8f0" };
const legendItem     = { fontSize: "13px", color: "#475569", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" };
const toastStyle     = { position: "fixed", bottom: "28px", left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "white", padding: "13px 26px", borderRadius: "999px", fontSize: "14px", fontWeight: "700", boxShadow: "0 10px 30px rgba(0,0,0,0.20)", zIndex: 9999, animation: "fadeUp 0.25s ease", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" };
const bannerStyle    = { background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: "14px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px", fontSize: "14px", color: "#92400e", fontWeight: "600", animation: "fadeUp 0.3s ease" };
const bannerBtnGreen = { padding: "8px 16px", borderRadius: "8px", border: "none", background: "#22c55e", color: "white", fontWeight: "700", cursor: "pointer", fontSize: "13px", fontFamily: "'DM Sans', sans-serif" };
const bannerBtnGray  = { padding: "8px 16px", borderRadius: "8px", border: "1.5px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: "600", cursor: "pointer", fontSize: "13px", fontFamily: "'DM Sans', sans-serif" };
const overlay        = { position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998, padding: "16px" };
const modal          = { background: "white", borderRadius: "18px", padding: "28px", maxWidth: "380px", width: "100%", textAlign: "center", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" };
const modalBtnGreen  = { flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#22c55e", color: "white", fontWeight: "700", cursor: "pointer", fontSize: "15px", fontFamily: "'DM Sans', sans-serif" };
const modalBtnGray   = { flex: 1, padding: "12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: "600", cursor: "pointer", fontSize: "15px", fontFamily: "'DM Sans', sans-serif" };