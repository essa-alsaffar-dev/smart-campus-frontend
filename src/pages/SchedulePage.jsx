import { useState, useEffect, useMemo } from "react";
import axios from "axios";

const API = "https://smart-campus-backend-production-bf5e.up.railway.app";
const getH = () => {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const mapEntry = (e) => ({
  id: e.id,
  courseName: e.courseName,
  day: e.dayOfWeek,
  time: `${e.startTime} - ${e.endTime}`,
  room: e.room || e.classroom?.name || "",
  color: e.color,
});

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

const DAY_SHORT = {
  Sunday: "Sun",
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
};

const COURSE_COLORS = [
  { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", accent: "#2563eb" },
  { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", accent: "#16a34a" },
  { bg: "#fdf4ff", border: "#e9d5ff", text: "#7e22ce", accent: "#9333ea" },
  { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", accent: "#ea580c" },
  { bg: "#fefce8", border: "#fef08a", text: "#a16207", accent: "#ca8a04" },
  { bg: "#fff1f2", border: "#fecdd3", text: "#be123c", accent: "#e11d48" },
  { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1", accent: "#0284c7" },
  { bg: "#f7fee7", border: "#d9f99d", text: "#3f6212", accent: "#65a30d" },
];

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const clean = timeStr.trim();
  const [h, m] = clean.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const formatDisplayTime = (timeStr) => {
  if (!timeStr) return "";
  const mins = parseTimeToMinutes(timeStr);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
};

const getDuration = (timeRange) => {
  if (!timeRange) return null;
  const parts = timeRange.split("-").map((t) => t.trim());
  if (parts.length < 2) return null;
  const start = parseTimeToMinutes(parts[0]);
  const end = parseTimeToMinutes(parts[1]);
  const diff = end - start;
  if (diff <= 0) return null;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const getCurrentDayIndex = () => {
  const jsDay = new Date().getDay();
  const idx = DAYS.indexOf(
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][jsDay]
  );
  return idx >= 0 ? idx : 0;
};

const getCurrentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

// كل ساعة من 8 صباحًا إلى 10 مساءً
const generateTimeOptions = () => {
  const options = [];
  for (let minutes = 8 * 60; minutes <= 22 * 60; minutes += 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    options.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

// ─── Component ────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const [courseName, setCourseName] = useState("");
  const [day, setDay] = useState("Sunday");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [room, setRoom] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activeDay, setActiveDay] = useState(DAYS[getCurrentDayIndex()]);
  const [viewMode, setViewMode] = useState("week");
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");
  const [courseColorMap, setCourseColorMap] = useState({});

  const cacheKey =
    `schedule_${localStorage.getItem("userEmail") || localStorage.getItem("userName") || "guest"}`;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API}/schedule`, { headers: getH() });
        const entries = Array.isArray(res.data) ? res.data.map(mapEntry) : [];
        setSchedule(entries);

        // حفظ نسخة محلية احتياطية
        localStorage.setItem(cacheKey, JSON.stringify(entries));

        const colorMap = {};
        entries.forEach((e) => {
          if (!colorMap[e.courseName]) {
            const idx = Object.keys(colorMap).length % COURSE_COLORS.length;
            colorMap[e.courseName] = COURSE_COLORS[idx];
          }
        });
        setCourseColorMap(colorMap);
      } catch {
        // fallback لو السيرفر ما رد
        const saved = JSON.parse(localStorage.getItem(cacheKey) || "[]");
        setSchedule(saved);

        const colorMap = {};
        saved.forEach((e) => {
          if (!colorMap[e.courseName]) {
            const idx = Object.keys(colorMap).length % COURSE_COLORS.length;
            colorMap[e.courseName] = COURSE_COLORS[idx];
          }
        });
        setCourseColorMap(colorMap);
      }

      setRooms(JSON.parse(localStorage.getItem("classrooms") || "[]"));
    };

    load();
  }, [cacheKey]);

  const saveSchedule = (updated) => {
    setSchedule(updated);
    localStorage.setItem(cacheKey, JSON.stringify(updated));
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const assignColor = (name) => {
    if (courseColorMap[name]) return courseColorMap[name];
    const idx = Object.keys(courseColorMap).length % COURSE_COLORS.length;
    const color = COURSE_COLORS[idx];
    setCourseColorMap((prev) => ({ ...prev, [name]: color }));
    return color;
  };

  const addSchedule = async () => {
    if (!courseName.trim() || !day || !startTime || !endTime || !room) {
      showToast("⚠️ Please fill in all fields");
      return;
    }

    if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) {
      showToast("⚠️ End time must be after start time");
      return;
    }

    const color = assignColor(courseName.trim());

    try {
      const res = await axios.post(
        `${API}/schedule`,
        {
          courseName: courseName.trim(),
          dayOfWeek: day,
          startTime,
          endTime,
          room: room.trim(),
          color,
        },
        { headers: getH() }
      );

      const updated = [...schedule, mapEntry(res.data)];
      saveSchedule(updated);
      showToast("✅ Class added and synced!");
    } catch {
      const entry = {
        id: Date.now(),
        courseName: courseName.trim(),
        day,
        time: `${startTime} - ${endTime}`,
        room: room.trim(),
        color,
      };

      saveSchedule([...schedule, entry]);
      showToast("✅ Class added (offline)");
    }

    setCourseName("");
    setStartTime("");
    setEndTime("");
    setRoom("");
    setShowForm(false);
  };

  const deleteSchedule = async (id) => {
    try {
      await axios.delete(`${API}/schedule/${id}`, { headers: getH() });
    } catch {}

    const updated = schedule.filter((s) => s.id !== id);
    saveSchedule(updated);
    showToast("🗑 Class removed");
  };

  const getDayEntries = (dayName) =>
    schedule
      .filter((s) => s.day === dayName)
      .sort((a, b) => {
        const aStart = parseTimeToMinutes(a.time?.split("-")[0]?.trim());
        const bStart = parseTimeToMinutes(b.time?.split("-")[0]?.trim());
        return aStart - bStart;
      });

  const totalClasses = schedule.length;
  const todayClasses = getDayEntries(DAYS[getCurrentDayIndex()]).length;
  const uniqueCourses = [...new Set(schedule.map((s) => s.courseName))].length;

  const availableEndTimes = TIME_OPTIONS.filter(
    (time) => !startTime || parseTimeToMinutes(time) > parseTimeToMinutes(startTime)
  );

  return (
    <div style={page}>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=DM+Mono:wght@500&display=swap');
* { box-sizing: border-box; }
.hover-card { transition: box-shadow 0.18s, transform 0.18s; }
.hover-card:hover { box-shadow: 0 8px 28px rgba(15,23,42,0.11); transform: translateY(-2px); }
.day-tab { transition: all 0.18s; cursor: pointer; user-select: none; }
.day-tab:hover { background: #f1f5f9 !important; }
.icon-btn { transition: all 0.15s; cursor: pointer; border: none; background: none; }
.icon-btn:hover { color: #ef4444 !important; background: #fef2f2 !important; }
.form-input:focus { outline: none; border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12) !important; background: white !important; }
.add-btn { transition: filter 0.15s, transform 0.1s, box-shadow 0.15s; }
.add-btn:hover { filter: brightness(1.08); }
.add-btn:active { transform: scale(0.97); }
@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
@keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
.fade-in { animation: fadeUp 0.3s ease; }
.slide-in { animation: slideIn 0.25s ease; }
@keyframes spin { to { transform: rotate(360deg); } }
@media(max-width:900px) { .sc-week-grid { min-width: 600px !important; } }
      `}</style>

      {toast && <div style={toastStyle}>{toast}</div>}

      <div style={container}>
        <div style={headerRow}>
          <div>
            <h1 style={titleStyle}>Weekly Schedule</h1>
            <p style={subtitleStyle}>Manage and view your class timetable</p>
          </div>
          <button
            className="add-btn"
            onClick={() => setShowForm(!showForm)}
            style={addBtnStyle}
          >
            {showForm ? "✕ Cancel" : "+ Add Class"}
          </button>
        </div>

        <div style={statsRow}>
          {[
            { label: "Total Classes", value: totalClasses, color: "#2563eb" },
            { label: "Today's Classes", value: todayClasses, color: "#16a34a" },
            { label: "Courses", value: uniqueCourses, color: "#9333ea" },
          ].map((stat) => (
            <div key={stat.label} style={statCard}>
              <span
                style={{
                  fontSize: "26px",
                  fontWeight: "800",
                  color: stat.color,
                  fontFamily: "'DM Mono'",
                }}
              >
                {stat.value}
              </span>
              <span style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {showForm && (
          <div style={formCard} className="slide-in">
            <h3 style={{ margin: "0 0 18px", fontSize: "18px", color: "#0f172a", fontWeight: 700 }}>
              Add New Class
            </h3>

            <div style={formGrid}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Course Name</label>
                <input
                  className="form-input"
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Data Structures"
                  style={inputStyle}
                />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Day</label>
                <select
                  className="form-input"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  style={inputStyle}
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Start Time</label>
                <select
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select start time</option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {formatDisplayTime(time)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>End Time</label>
                <select
                  className="form-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select end time</option>
                  {availableEndTimes.map((time) => (
                    <option key={time} value={time}>
                      {formatDisplayTime(time)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ ...fieldWrap, gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Room</label>
                <input
                  className="form-input"
                  type="text"
                  list="rooms-list"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. A-102"
                  style={inputStyle}
                />
                <datalist id="rooms-list">
                  {rooms.map((r, idx) => (
                    <option key={idx} value={r.name || r.room || ""} />
                  ))}
                </datalist>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "18px" }}>
              <button className="add-btn" onClick={addSchedule} style={confirmBtnStyle}>
                Save Class
              </button>
            </div>
          </div>
        )}

        <div style={viewSwitchWrap}>
          <button
            onClick={() => setViewMode("week")}
            style={viewMode === "week" ? activeSwitchBtn : switchBtn}
          >
            Week View
          </button>
          <button
            onClick={() => setViewMode("day")}
            style={viewMode === "day" ? activeSwitchBtn : switchBtn}
          >
            Day View
          </button>
        </div>

        {viewMode === "day" && (
          <div style={dayTabsWrap}>
            {DAYS.map((d) => (
              <button
                key={d}
                className="day-tab"
                onClick={() => setActiveDay(d)}
                style={activeDay === d ? activeDayTab : dayTab}
              >
                <span style={{ fontWeight: 700 }}>{DAY_SHORT[d]}</span>
                <span style={{ fontSize: "11px", opacity: 0.9 }}>{getDayEntries(d).length}</span>
              </button>
            ))}
          </div>
        )}

        {viewMode === "week" ? (
          <div style={weekWrap}>
            <div className="sc-week-grid" style={weekGrid}>
              {DAYS.map((dayName) => {
                const entries = getDayEntries(dayName);
                return (
                  <div key={dayName} style={dayColumn}>
                    <div style={dayColumnHeader}>
                      <div style={{ fontWeight: 800, fontSize: "15px", color: "#0f172a" }}>
                        {dayName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {entries.length} class{entries.length !== 1 ? "es" : ""}
                      </div>
                    </div>

                    <div style={dayColumnBody}>
                      {entries.length === 0 ? (
                        <div style={emptyDayStyle}>No classes</div>
                      ) : (
                        entries.map((entry) => {
                          const [start, end] = entry.time.split("-").map((s) => s.trim());
                          const duration = getDuration(entry.time);

                          return (
                            <div
                              key={entry.id}
                              className="hover-card fade-in"
                              style={{
                                ...eventCard,
                                background: entry.color?.bg || "#f8fafc",
                                border: `1px solid ${entry.color?.border || "#e2e8f0"}`,
                              }}
                            >
                              <div
                                style={{
                                  width: "4px",
                                  borderRadius: "999px",
                                  background: entry.color?.accent || "#2563eb",
                                  alignSelf: "stretch",
                                }}
                              />

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={eventTopRow}>
                                  <div
                                    style={{
                                      fontWeight: 800,
                                      color: entry.color?.text || "#0f172a",
                                      fontSize: "14px",
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {entry.courseName}
                                  </div>
                                  <button
                                    className="icon-btn"
                                    onClick={() => deleteSchedule(entry.id)}
                                    style={deleteBtn}
                                    title="Delete class"
                                  >
                                    ✕
                                  </button>
                                </div>

                                <div style={eventMeta}>
                                  <span>🕒 {formatDisplayTime(start)} - {formatDisplayTime(end)}</span>
                                  {duration && <span>• {duration}</span>}
                                </div>

                                <div style={roomBadge}>
                                  📍 {entry.room || "No room"}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={singleDayWrap}>
            <div style={singleDayHeader}>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>{activeDay}</h2>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
                  {getDayEntries(activeDay).length} class{getDayEntries(activeDay).length !== 1 ? "es" : ""}
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              {getDayEntries(activeDay).length === 0 ? (
                <div style={emptyStateCard}>
                  <div style={{ fontSize: "40px" }}>📅</div>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>No classes for {activeDay}</div>
                  <div style={{ color: "#64748b", fontSize: "14px" }}>
                    Add a class to start building your schedule.
                  </div>
                </div>
              ) : (
                getDayEntries(activeDay).map((entry) => {
                  const [start, end] = entry.time.split("-").map((s) => s.trim());
                  const duration = getDuration(entry.time);
                  const nowMinutes = getCurrentMinutes();
                  const currentDayName = DAYS[getCurrentDayIndex()];
                  const startMinutes = parseTimeToMinutes(start);
                  const endMinutes = parseTimeToMinutes(end);

                  const isNow =
                    currentDayName === entry.day &&
                    nowMinutes >= startMinutes &&
                    nowMinutes < endMinutes;

                  return (
                    <div
                      key={entry.id}
                      className="hover-card fade-in"
                      style={{
                        ...singleEventCard,
                        background: entry.color?.bg || "#fff",
                        border: `1px solid ${entry.color?.border || "#e2e8f0"}`,
                      }}
                    >
                      <div
                        style={{
                          width: "6px",
                          borderRadius: "999px",
                          background: entry.color?.accent || "#2563eb",
                          alignSelf: "stretch",
                        }}
                      />

                      <div style={{ flex: 1 }}>
                        <div style={eventTopRow}>
                          <div>
                            <div
                              style={{
                                fontSize: "16px",
                                fontWeight: 800,
                                color: entry.color?.text || "#0f172a",
                              }}
                            >
                              {entry.courseName}
                            </div>
                            {isNow && <div style={liveBadge}>Happening now</div>}
                          </div>

                          <button
                            className="icon-btn"
                            onClick={() => deleteSchedule(entry.id)}
                            style={deleteBtn}
                            title="Delete class"
                          >
                            ✕
                          </button>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
                          <div style={pillMeta}>🕒 {formatDisplayTime(start)} - {formatDisplayTime(end)}</div>
                          {duration && <div style={pillMeta}>⏱ {duration}</div>}
                          <div style={pillMeta}>📍 {entry.room || "No room"}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const page = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8fbff 0%, #f8fafc 100%)",
  padding: "24px",
  fontFamily: "'DM Sans', sans-serif",
};

const container = {
  maxWidth: "1280px",
  margin: "0 auto",
  display: "grid",
  gap: "18px",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap",
};

const titleStyle = {
  margin: 0,
  fontSize: "32px",
  fontWeight: 800,
  color: "#0f172a",
  letterSpacing: "-0.02em",
};

const subtitleStyle = {
  margin: "6px 0 0",
  color: "#64748b",
  fontSize: "14px",
};

const addBtnStyle = {
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  color: "white",
  fontWeight: 700,
  fontSize: "14px",
  boxShadow: "0 10px 24px rgba(37,99,235,0.22)",
  cursor: "pointer",
};

const statsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "14px",
};

const statCard = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
};

const formCard = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "22px",
  padding: "20px",
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const fieldWrap = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const labelStyle = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#334155",
};

const inputStyle = {
  height: "46px",
  borderRadius: "14px",
  border: "1px solid #cbd5e1",
  padding: "0 14px",
  background: "#f8fafc",
  fontSize: "14px",
  color: "#0f172a",
};

const confirmBtnStyle = {
  border: "none",
  borderRadius: "14px",
  padding: "11px 18px",
  background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
  color: "white",
  fontWeight: 700,
  fontSize: "14px",
  boxShadow: "0 8px 18px rgba(22,163,74,0.2)",
  cursor: "pointer",
};

const viewSwitchWrap = {
  display: "inline-flex",
  gap: "8px",
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "6px",
  width: "fit-content",
  boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
};

const switchBtn = {
  border: "none",
  borderRadius: "12px",
  padding: "10px 14px",
  background: "transparent",
  color: "#475569",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
};

const activeSwitchBtn = {
  ...switchBtn,
  background: "#2563eb",
  color: "white",
};

const dayTabsWrap = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const dayTab = {
  border: "1px solid #e2e8f0",
  background: "white",
  borderRadius: "16px",
  padding: "12px 14px",
  minWidth: "84px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  alignItems: "center",
  color: "#334155",
};

const activeDayTab = {
  ...dayTab,
  background: "#2563eb",
  border: "1px solid #2563eb",
  color: "white",
  boxShadow: "0 10px 18px rgba(37,99,235,0.2)",
};

const weekWrap = {
  overflowX: "auto",
};

const weekGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(220px, 1fr))",
  gap: "14px",
  alignItems: "start",
};

const dayColumn = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "22px",
  overflow: "hidden",
  minHeight: "460px",
  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
};

const dayColumnHeader = {
  padding: "16px 16px 14px",
  borderBottom: "1px solid #e2e8f0",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
};

const dayColumnBody = {
  padding: "14px",
  display: "grid",
  gap: "12px",
};

const emptyDayStyle = {
  minHeight: "120px",
  display: "grid",
  placeItems: "center",
  color: "#94a3b8",
  fontSize: "14px",
  border: "1px dashed #cbd5e1",
  borderRadius: "18px",
  background: "#f8fafc",
};

const eventCard = {
  display: "flex",
  gap: "12px",
  borderRadius: "18px",
  padding: "14px",
  boxShadow: "0 4px 10px rgba(15,23,42,0.03)",
};

const eventTopRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "10px",
};

const eventMeta = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "8px",
  fontSize: "12px",
  color: "#475569",
};

const roomBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  marginTop: "10px",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.55)",
  fontSize: "12px",
  color: "#334155",
  border: "1px solid rgba(148,163,184,0.25)",
};

const deleteBtn = {
  color: "#94a3b8",
  fontSize: "16px",
  padding: "6px 8px",
  borderRadius: "10px",
};

const singleDayWrap = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "22px",
  padding: "18px",
  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  display: "grid",
  gap: "16px",
};

const singleDayHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
};

const singleEventCard = {
  display: "flex",
  gap: "14px",
  borderRadius: "20px",
  padding: "16px",
  boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
};

const pillMeta = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(148,163,184,0.22)",
  color: "#334155",
  fontSize: "13px",
};

const emptyStateCard = {
  minHeight: "220px",
  border: "1px dashed #cbd5e1",
  borderRadius: "20px",
  background: "#f8fafc",
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  gap: "8px",
  padding: "20px",
};

const liveBadge = {
  marginTop: "6px",
  display: "inline-flex",
  width: "fit-content",
  padding: "5px 10px",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  fontSize: "12px",
  fontWeight: 700,
};

const toastStyle = {
  position: "fixed",
  top: "20px",
  right: "20px",
  zIndex: 9999,
  background: "#0f172a",
  color: "white",
  padding: "12px 16px",
  borderRadius: "14px",
  boxShadow: "0 14px 30px rgba(15,23,42,0.2)",
  fontWeight: 700,
  fontSize: "13px",
};