import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

const API = "https://smart-campus-backend-production-bf5e.up.railway.app";

const getHeaders = () => {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const getStatusColor = (pct) => {
  if (pct >= 90) {
    return {
      bar: "#ef4444",
      badge: "#fef2f2",
      text: "#dc2626",
      label: "Almost Full",
    };
  }
  if (pct >= 60) {
    return {
      bar: "#f59e0b",
      badge: "#fffbeb",
      text: "#d97706",
      label: "Available — Filling Up",
    };
  }
  return {
    bar: "#22c55e",
    badge: "#f0fdf4",
    text: "#16a34a",
    label: "Available",
  };
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
  const [zones, setZones] = useState([]);
  const [mySession, setMySession] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [toast, setToast] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [loadingZones, setLoadingZones] = useState(true);
  const [autoReleasePrompt, setAutoReleasePrompt] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  const refreshZones = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/parking-zones`);
      const apiZones = res.data.map((z) => ({
        id: z.id,
        name: z.name,
        description: z.description,
        icon: z.icon || "🅿️",
        total: z.total,
        occupied: z.occupied,
      }));
      setZones(apiZones);
    } catch (err) {
      console.error("Failed to load parking zones:", err);
      setZones([]);
    } finally {
      setLoadingZones(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/parking-zones/my-session`, {
        headers: getHeaders(),
      });

      if (res.data.active) {
        setMySession({
          zoneId: res.data.zoneId,
          checkedInAt: res.data.checkedInAt,
          endTime: res.data.endTime || null,
          courseName: res.data.courseName || null,
        });
      } else {
        setMySession(null);
      }
    } catch (err) {
      console.error("Failed to load parking session:", err);
      setMySession(null);
    }
  }, []);

  const refreshSchedule = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/schedule`, {
        headers: getHeaders(),
      });

      const entries = res.data.map((e) => ({
        id: e.id,
        courseName: e.courseName,
        day: e.dayOfWeek,
        time: `${e.startTime} - ${e.endTime}`,
        room: e.room || e.classroom?.name || "",
        color: e.color,
      }));

      setSchedule(entries);
    } catch (err) {
      console.error("Failed to load schedule for parking page:", err);
      setSchedule([]);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([refreshZones(), refreshSession(), refreshSchedule()]);
    };

    loadAll();

    const interval = setInterval(() => {
      refreshZones();
      refreshSession();
    }, 15000);

    return () => clearInterval(interval);
  }, [refreshZones, refreshSession, refreshSchedule]);

  useEffect(() => {
    if (!mySession?.endTime) return;

    const interval = setInterval(() => {
      const now = getCurrentMinutes();
      const end = parseTimeToMinutes(mySession.endTime);
      if (end && now >= end && !autoReleasePrompt) {
        setAutoReleasePrompt(true);
      }
    }, 30000);

    const now = getCurrentMinutes();
    const end = parseTimeToMinutes(mySession?.endTime);
    if (end && now >= end) setAutoReleasePrompt(true);

    return () => clearInterval(interval);
  }, [mySession, autoReleasePrompt]);

  const checkIn = async (zoneId, endTime, courseName) => {
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return;

    if (zone.occupied >= zone.total) {
      showToast("This zone is full!");
      return;
    }

    try {
      const res = await axios.post(
        `${API}/parking-zones/checkin/${zoneId}`,
        {},
        { headers: getHeaders() }
      );

      if (!res.data.success) {
        showToast(res.data.message || "Check-in failed");
        return;
      }

      setMySession({
        zoneId,
        endTime: endTime || null,
        courseName: courseName || null,
        checkedInAt: res.data.checkedInAt,
      });

      await refreshZones();
      showToast(`✅ Checked in at ${zone.name}`);
    } catch (err) {
      console.error("Check-in failed:", err);
      showToast("❌ Failed to check in.");
    }
  };

  const checkOut = async () => {
    if (!mySession) return;

    try {
      await axios.delete(`${API}/parking-zones/checkout`, {
        headers: getHeaders(),
      });

      setMySession(null);
      await refreshZones();
      setConfirmLeave(false);
      setAutoReleasePrompt(false);
      showToast("✅ You have checked out");
    } catch (err) {
      console.error("Checkout failed:", err);
      showToast("❌ Failed to check out.");
    }
  };

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const todayName = days[new Date().getDay()];
  const todayClasses = schedule.filter((s) => s.day === todayName);

  const nextClassEnd = useMemo(() => {
    const now = getCurrentMinutes();

    const upcoming = todayClasses
      .map((c) => {
        const parts = c.time?.split("-").map((t) => t.trim());
        const endStr = parts?.[1];
        const endMin = parseTimeToMinutes(endStr?.includes(":") ? endStr : null);
        return { ...c, endMin, endStr };
      })
      .filter((c) => c.endMin && c.endMin > now)
      .sort((a, b) => a.endMin - b.endMin);

    return upcoming[0] || null;
  }, [todayClasses]);

  const myZone = zones.find((z) => z.id === mySession?.zoneId);

  return (
    <div style={page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        .zone-card {
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .zone-card:hover {
          box-shadow: 0 12px 32px rgba(15,23,42,0.12);
          transform: translateY(-2px);
        }

        .checkin-btn {
          transition: filter 0.15s, transform 0.1s;
        }
        .checkin-btn:hover {
          filter: brightness(1.08);
        }
        .checkin-btn:active {
          transform: scale(0.97);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @media (max-width: 700px) {
          .zones-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {toast && <div style={toastStyle}>{toast}</div>}

      {autoReleasePrompt && mySession && (
        <div style={bannerStyle}>
          <span>
            Class time is over. Did you leave the{" "}
            <strong>{myZone?.name}</strong> parking area?
          </span>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button onClick={checkOut} style={bannerBtnGreen}>
              Yes, I left
            </button>
            <button
              onClick={() => setAutoReleasePrompt(false)}
              style={bannerBtnGray}
            >
              No, I am still there
            </button>
          </div>
        </div>
      )}

      <div style={container}>
        <div style={headerRow}>
          <div>
            <h1 style={titleStyle}>College Parking</h1>
            <p style={subtitleStyle}>
              Parking for Computer Science students — Building A11
            </p>
          </div>

          <div style={totalAvailBadge}>
            <span style={availNum}>
              {zones.reduce((sum, z) => sum + (z.total - z.occupied), 0)}
            </span>
            <span style={availLabel}>Available Spots</span>
          </div>
        </div>

        {mySession && myZone && (
          <div style={mySessionCard}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ fontSize: "36px" }}>{myZone.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={sessionTitle}>
                  You are currently parked at:{" "}
                  <span style={{ color: "#2563eb" }}>{myZone.name}</span>
                </p>

                {mySession.courseName && (
                  <p style={sessionSub}>
                    Course: {mySession.courseName}
                    {mySession.endTime && ` — Ends at ${formatTime(mySession.endTime)}`}
                  </p>
                )}

                {mySession.checkedInAt && (
                  <p style={sessionSub}>
                    Checked in at: {new Date(mySession.checkedInAt).toLocaleString()}
                  </p>
                )}
              </div>

              <button style={leaveBtn} onClick={() => setConfirmLeave(true)}>
                Check Out
              </button>
            </div>
          </div>
        )}

        {!mySession && nextClassEnd && (
          <div style={hintCard}>
            <strong>Suggested parking time:</strong>{" "}
            Your next class is <strong>{nextClassEnd.courseName}</strong> and ends at{" "}
            <strong>{formatTime(nextClassEnd.endStr)}</strong>. You can use this when checking in.
          </div>
        )}

        {confirmLeave && (
          <div style={confirmBox}>
            <p style={{ margin: "0 0 12px", fontWeight: "700", color: "#0f172a" }}>
              Are you sure you want to check out?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={checkOut} style={bannerBtnGreen}>Yes</button>
              <button onClick={() => setConfirmLeave(false)} style={bannerBtnGray}>Cancel</button>
            </div>
          </div>
        )}

        {loadingZones ? (
          <div style={loadingState}>Loading parking zones...</div>
        ) : (
          <div className="zones-grid" style={zonesGrid}>
            {zones.map((zone) => {
              const available = zone.total - zone.occupied;
              const pct = zone.total ? Math.round((zone.occupied / zone.total) * 100) : 0;
              const status = getStatusColor(pct);
              const disabled = !!mySession || available <= 0;

              return (
                <div key={zone.id} className="zone-card" style={zoneCard}>
                  <div style={zoneTop}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ fontSize: "30px" }}>{zone.icon || "🅿️"}</div>
                      <div>
                        <h3 style={zoneTitle}>{zone.name}</h3>
                        <p style={zoneDesc}>{zone.description}</p>
                      </div>
                    </div>

                    <span
                      style={{
                        ...statusBadge,
                        background: status.badge,
                        color: status.text,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div style={meterWrap}>
                    <div style={meterBg}>
                      <div
                        style={{
                          ...meterFill,
                          width: `${pct}%`,
                          background: status.bar,
                        }}
                      />
                    </div>
                  </div>

                  <div style={zoneStats}>
                    <span>{available} available</span>
                    <span>{zone.occupied}/{zone.total} occupied</span>
                  </div>

                  <button
                    className="checkin-btn"
                    style={{
                      ...checkinBtn,
                      opacity: disabled ? 0.55 : 1,
                      cursor: disabled ? "not-allowed" : "pointer",
                    }}
                    disabled={disabled}
                    onClick={() =>
                      checkIn(
                        zone.id,
                        nextClassEnd?.endStr || null,
                        nextClassEnd?.courseName || null
                      )
                    }
                  >
                    {mySession
                      ? "Already Parked"
                      : available <= 0
                      ? "Full"
                      : "Check In"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= styles ================= */

const page = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "20px",
  fontFamily: "'DM Sans', sans-serif",
};

const container = {
  width: "100%",
  maxWidth: "1180px",
  margin: "0 auto",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
  marginBottom: "24px",
};

const titleStyle = {
  margin: 0,
  fontSize: "32px",
  fontWeight: "800",
  color: "#0f172a",
};

const subtitleStyle = {
  margin: "6px 0 0",
  color: "#64748b",
  fontSize: "15px",
};

const totalAvailBadge = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "14px 18px",
  boxShadow: "0 4px 14px rgba(15,23,42,0.06)",
  minWidth: "140px",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const availNum = {
  fontSize: "28px",
  fontWeight: "800",
  color: "#16a34a",
};

const availLabel = {
  fontSize: "12px",
  color: "#64748b",
  marginTop: "2px",
};

const mySessionCard = {
  background: "white",
  border: "1px solid #dbeafe",
  borderRadius: "16px",
  padding: "18px",
  marginBottom: "18px",
  boxShadow: "0 4px 14px rgba(37,99,235,0.08)",
};

const sessionTitle = {
  margin: 0,
  fontWeight: "700",
  fontSize: "16px",
  color: "#0f172a",
};

const sessionSub = {
  margin: "4px 0 0",
  fontSize: "13px",
  color: "#64748b",
};

const leaveBtn = {
  border: "none",
  background: "#ef4444",
  color: "white",
  fontWeight: "700",
  borderRadius: "10px",
  padding: "10px 14px",
  cursor: "pointer",
};

const hintCard = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  color: "#1e3a8a",
  borderRadius: "14px",
  padding: "14px 16px",
  marginBottom: "18px",
};

const confirmBox = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "16px",
  marginBottom: "18px",
};

const zonesGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const zoneCard = {
  background: "white",
  borderRadius: "18px",
  padding: "18px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 16px rgba(15,23,42,0.05)",
};

const zoneTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "14px",
  flexWrap: "wrap",
};

const zoneTitle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: "800",
  color: "#0f172a",
};

const zoneDesc = {
  margin: "4px 0 0",
  fontSize: "13px",
  color: "#64748b",
};

const statusBadge = {
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "700",
};

const meterWrap = {
  marginBottom: "10px",
};

const meterBg = {
  height: "10px",
  borderRadius: "999px",
  background: "#e2e8f0",
  overflow: "hidden",
};

const meterFill = {
  height: "100%",
  borderRadius: "999px",
};

const zoneStats = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "13px",
  color: "#475569",
  marginBottom: "14px",
  gap: "10px",
  flexWrap: "wrap",
};

const checkinBtn = {
  width: "100%",
  border: "none",
  borderRadius: "12px",
  padding: "12px 14px",
  background: "#2563eb",
  color: "white",
  fontWeight: "800",
};

const toastStyle = {
  position: "fixed",
  top: "18px",
  right: "18px",
  background: "#0f172a",
  color: "white",
  padding: "12px 16px",
  borderRadius: "12px",
  zIndex: 9999,
  boxShadow: "0 10px 28px rgba(0,0,0,0.16)",
};

const bannerStyle = {
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  color: "#9a3412",
  borderRadius: "14px",
  padding: "14px 16px",
  marginBottom: "18px",
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap",
  alignItems: "center",
};

const bannerBtnGreen = {
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: "700",
};

const bannerBtnGray = {
  background: "#e5e7eb",
  color: "#111827",
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: "700",
};

const loadingState = {
  textAlign: "center",
  color: "#64748b",
  padding: "50px 20px",
  background: "white",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
};