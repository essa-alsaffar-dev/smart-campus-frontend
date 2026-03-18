import { useState, useEffect, useMemo } from "react";

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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API}/schedule`, { headers: getHeaders() });
        const entries = res.data.map(e => ({
          id:         e.id,
          courseName: e.courseName,
          day:        e.dayOfWeek,
          time:       `${e.startTime} - ${e.endTime}`,
          room:       e.room || e.classroom?.name || "",
          color:      e.color,
        }));
        setSchedule(entries);
        // Also save to localStorage for ParkingPage
        localStorage.setItem(`schedule_${localStorage.getItem("userName")||"guest"}`, JSON.stringify(entries));

        const colorMap = {};
        entries.forEach((entry) => {
          if (!colorMap[entry.courseName]) {
            const idx = Object.keys(colorMap).length % COURSE_COLORS.length;
            colorMap[entry.courseName] = entry.color || COURSE_COLORS[idx];
          }
        });
        setCourseColorMap(colorMap);
      } catch {
        // Fallback to localStorage
        const saved = JSON.parse(localStorage.getItem(`schedule_${localStorage.getItem("userName")||"guest"}`) || "[]");
        setSchedule(saved);
        const colorMap = {};
        saved.forEach((entry) => {
          if (!colorMap[entry.courseName]) {
            const idx = Object.keys(colorMap).length % COURSE_COLORS.length;
            colorMap[entry.courseName] = COURSE_COLORS[idx];
          }
        });
        setCourseColorMap(colorMap);
      }
      const savedRooms = JSON.parse(localStorage.getItem("classrooms")) || [];
      setRooms(savedRooms);
    };
    load();
  }, []);

  const saveSchedule = (updated) => {
    setSchedule(updated);
    localStorage.setItem(`schedule_${localStorage.getItem("userName")||"guest"}`, JSON.stringify(updated));
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
      showToast("⚠️ Please fill in all fields"); return;
    }
    if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) {
      showToast("⚠️ End time must be after start time"); return;
    }
    const color = assignColor(courseName);
    try {
      const res = await axios.post(`${API}/schedule`, {
        courseName, dayOfWeek: day, startTime, endTime, room, color
      }, { headers: getHeaders() });
      const entry = { id: res.data.id, courseName, day, time: `${startTime} - ${endTime}`, room, color };
      saveSchedule([...schedule, entry]);
      showToast("✅ Class added!");
    } catch {
      const entry = { id: Date.now(), courseName, day, time: `${startTime} - ${endTime}`, room, color };
      saveSchedule([...schedule, entry]);
      showToast("✅ Class added (offline)");
    }
    setCourseName(""); setStartTime(""); setEndTime(""); setRoom(""); setShowForm(false);
  };

  const deleteSchedule = async (id) => {
    try { await axios.delete(`${API}/schedule/${id}`, { headers: getHeaders() }); } catch {}
    saveSchedule(schedule.filter((s) => s.id !== id));
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
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@500&display=swap');
* { box-sizing: border-box; }
.hover-card { transition: box-shadow 0.18s, transform 0.18s; }
.hover-card:hover { box-shadow: 0 8px 24px rgba(15,23,42,0.12); transform: translateY(-1px); }
.day-tab { transition: all 0.15s; cursor: pointer; user-select: none; }
.day-tab:hover { background: #f1f5f9; }
.icon-btn { transition: all 0.15s; cursor: pointer; border: none; background: none; }
.icon-btn:hover { color: #ef4444 !important; background: #fef2f2 !important; }
.form-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
.add-btn:hover { filter: brightness(1.08); }
.add-btn:active { transform: scale(0.97); }
@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes slideIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
.fade-in { animation: fadeUp 0.25s ease; }
.slide-in { animation: slideIn 0.2s ease; }
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
            <h3
              style={{
                margin: "0 0 16px",
                fontSize: "16px",
                fontWeight: "700",
                color: "#0f172a",
              }}
            >
              Add New Class
            </h3>

            <div style={formGrid}>
              <div style={formGroup}>
                <label style={formLabel}>Course Name</label>
                <input
                  className="form-input"
                  style={formInput}
                  type="text"
                  placeholder="e.g. Data Structures"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                />
              </div>

              <div style={formGroup}>
                <label style={formLabel}>Day</label>
                <select
                  className="form-input"
                  style={formInput}
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div style={formGroup}>
                <label style={formLabel}>Start Time</label>
                <select
                  className="form-input"
                  style={formInput}
                  value={startTime}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setStartTime(selected);
                    if (endTime && parseTimeToMinutes(endTime) <= parseTimeToMinutes(selected)) {
                      setEndTime("");
                    }
                  }}
                >
                  <option value="">Select start time</option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {formatDisplayTime(time)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={formGroup}>
                <label style={formLabel}>End Time</label>
                <select
                  className="form-input"
                  style={formInput}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                >
                  <option value="">Select end time</option>
                  {availableEndTimes.map((time) => (
                    <option key={time} value={time}>
                      {formatDisplayTime(time)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ ...formGroup, gridColumn: "1 / -1" }}>
                <label style={formLabel}>Room</label>
                <select
                  className="form-input"
                  style={formInput}
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                >
                  <option value="">Select a room</option>
                  {rooms.length > 0 ? (
                    rooms.map((r, i) => {
                      const name = r.name || r.roomName || r;
                      return (
                        <option key={i} value={name}>
                          {name}
                        </option>
                      );
                    })
                  ) : (
                    <option disabled>No rooms — add from Classrooms page</option>
                  )}
                </select>
              </div>
            </div>

            <button className="add-btn" onClick={addSchedule} style={confirmBtnStyle}>
              Add to Schedule →
            </button>
          </div>
        )}

        {schedule.length > 0 && (
          <div style={viewToggleRow}>
            <div style={viewToggle}>
              {["week", "day"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontFamily: "'DM Sans'",
                    background: viewMode === mode ? "#0f172a" : "transparent",
                    color: viewMode === mode ? "white" : "#64748b",
                    transition: "all 0.15s",
                  }}
                >
                  {mode === "week" ? "📅 Week" : "📋 Day"}
                </button>
              ))}
            </div>

            <div style={dayTabs}>
              {DAYS.map((d) => {
                const count = getDayEntries(d).length;
                const isToday = d === DAYS[getCurrentDayIndex()];
                const isActive = d === activeDay;
                return (
                  <div
                    key={d}
                    className="day-tab"
                    onClick={() => {
                      setActiveDay(d);
                      setViewMode("day");
                    }}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "10px",
                      fontWeight: isActive ? "700" : "500",
                      fontSize: "13px",
                      color: isActive ? "white" : isToday ? "#2563eb" : "#475569",
                      background: isActive ? "#2563eb" : isToday ? "#eff6ff" : "white",
                      border: `1.5px solid ${
                        isActive ? "#2563eb" : isToday ? "#bfdbfe" : "#e2e8f0"
                      }`,
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>{DAY_SHORT[d]}</span>
                    {count > 0 && (
                      <span
                        style={{
                          background: isActive ? "rgba(255,255,255,0.3)" : "#e2e8f0",
                          color: isActive ? "white" : "#475569",
                          borderRadius: "999px",
                          fontSize: "11px",
                          padding: "1px 7px",
                          fontWeight: "700",
                        }}
                      >
                        {count}
                      </span>
                    )}
                    {isToday && !isActive && (
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          background: "#2563eb",
                          borderRadius: "50%",
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {schedule.length === 0 && (
          <div style={emptyState}>
            <div style={{ fontSize: "52px", marginBottom: "14px" }}>🗓</div>
            <p
              style={{
                fontWeight: "700",
                fontSize: "20px",
                color: "#0f172a",
                margin: "0 0 8px",
              }}
            >
              No classes yet
            </p>
            <p style={{ color: "#64748b", margin: "0 0 20px" }}>
              Add your first class using the button above.
            </p>
            <button className="add-btn" onClick={() => setShowForm(true)} style={addBtnStyle}>
              + Add First Class
            </button>
          </div>
        )}

        {schedule.length > 0 && viewMode === "week" && (
          <div style={{ overflowX: "auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${DAYS.length}, minmax(180px, 1fr))`,
                gap: "12px",
                minWidth: "820px",
              }}
            >
              {DAYS.map((d) => {
                const entries = getDayEntries(d);
                const isToday = d === DAYS[getCurrentDayIndex()];
                return (
                  <div key={d}>
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "12px",
                        marginBottom: "10px",
                        textAlign: "center",
                        background: isToday ? "#0f172a" : "white",
                        border: `1.5px solid ${isToday ? "#0f172a" : "#e2e8f0"}`,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "700",
                          fontSize: "14px",
                          color: isToday ? "white" : "#0f172a",
                        }}
                      >
                        {d}
                      </div>
                      {isToday && (
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                          Today
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: "11px",
                          color: isToday ? "#94a3b8" : "#64748b",
                          marginTop: "2px",
                        }}
                      >
                        {entries.length} {entries.length === 1 ? "class" : "classes"}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {entries.length === 0 ? (
                        <div
                          style={{
                            padding: "20px 14px",
                            textAlign: "center",
                            color: "#cbd5e1",
                            fontSize: "13px",
                            background: "#fafafa",
                            borderRadius: "12px",
                            border: "1.5px dashed #e2e8f0",
                          }}
                        >
                          No classes
                        </div>
                      ) : (
                        entries.map((entry) => {
                          const color = courseColorMap[entry.courseName] || COURSE_COLORS[0];
                          const duration = getDuration(entry.time);
                          const parts = entry.time?.split("-").map((t) => t.trim());

                          return (
                            <div
                              key={entry.id}
                              className="hover-card fade-in"
                              style={{
                                background: color.bg,
                                border: `1.5px solid ${color.border}`,
                                borderRadius: "12px",
                                padding: "12px",
                                position: "relative",
                                borderLeft: `4px solid ${color.accent}`,
                              }}
                            >
                              <button
                                className="icon-btn"
                                onClick={() => deleteSchedule(entry.id)}
                                style={{
                                  position: "absolute",
                                  top: "8px",
                                  right: "8px",
                                  color: "#cbd5e1",
                                  fontSize: "13px",
                                  padding: "3px 6px",
                                  borderRadius: "6px",
                                }}
                                title="Remove"
                              >
                                ✕
                              </button>

                              <div
                                style={{
                                  fontWeight: "700",
                                  fontSize: "13px",
                                  color: color.text,
                                  marginBottom: "6px",
                                  paddingRight: "20px",
                                }}
                              >
                                {entry.courseName}
                              </div>

                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#64748b",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "3px",
                                }}
                              >
                                <span>
                                  🕐 {parts?.[0] ? formatDisplayTime(parts[0]) : ""} –{" "}
                                  {parts?.[1] ? formatDisplayTime(parts[1]) : ""}
                                </span>
                                {duration && (
                                  <span style={{ color: color.text, fontWeight: "600" }}>
                                    ⏱ {duration}
                                  </span>
                                )}
                                <span>📍 {entry.room}</span>
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
        )}

        {schedule.length > 0 && viewMode === "day" && (
          <div style={dayViewContainer} className="fade-in">
            <h2
              style={{
                margin: "0 0 20px",
                fontSize: "20px",
                fontWeight: "700",
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {activeDay}
              {activeDay === DAYS[getCurrentDayIndex()] && (
                <span
                  style={{
                    fontSize: "12px",
                    background: "#2563eb",
                    color: "white",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontWeight: "600",
                  }}
                >
                  Today
                </span>
              )}
            </h2>

            {getDayEntries(activeDay).length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>😌</div>
                <p style={{ fontWeight: "600" }}>No classes on {activeDay}</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {getDayEntries(activeDay).map((entry) => {
                  const color = courseColorMap[entry.courseName] || COURSE_COLORS[0];
                  const duration = getDuration(entry.time);
                  const parts = entry.time?.split("-").map((t) => t.trim());
                  const startMins = parseTimeToMinutes(parts?.[0]);
                  const endMins = parseTimeToMinutes(parts?.[1]);
                  const nowMins = getCurrentMinutes();
                  const isOngoing =
                    nowMins >= startMins &&
                    nowMins < endMins &&
                    activeDay === DAYS[getCurrentDayIndex()];
                  const isPast =
                    nowMins >= endMins && activeDay === DAYS[getCurrentDayIndex()];

                  return (
                    <div
                      key={entry.id}
                      className="hover-card fade-in"
                      style={{
                        background: isPast ? "#f8fafc" : "white",
                        border: `1.5px solid ${isOngoing ? color.accent : "#e2e8f0"}`,
                        borderRadius: "16px",
                        padding: "18px 20px",
                        display: "flex",
                        gap: "18px",
                        alignItems: "flex-start",
                        opacity: isPast ? 0.65 : 1,
                        boxShadow: isOngoing
                          ? `0 0 0 3px ${color.accent}22`
                          : "0 2px 8px rgba(15,23,42,0.05)",
                      }}
                    >
                      <div style={{ minWidth: "80px", textAlign: "center" }}>
                        <div
                          style={{
                            fontFamily: "'DM Mono'",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: color.accent,
                          }}
                        >
                          {parts?.[0] ? formatDisplayTime(parts[0]) : ""}
                        </div>
                        <div
                          style={{
                            width: "1px",
                            height: "20px",
                            background: "#e2e8f0",
                            margin: "6px auto",
                          }}
                        />
                        <div
                          style={{
                            fontFamily: "'DM Mono'",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#94a3b8",
                          }}
                        >
                          {parts?.[1] ? formatDisplayTime(parts[1]) : ""}
                        </div>
                      </div>

                      <div
                        style={{
                          width: "4px",
                          borderRadius: "999px",
                          background: color.accent,
                          alignSelf: "stretch",
                          flexShrink: 0,
                        }}
                      />

                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <h3
                            style={{
                              margin: 0,
                              fontSize: "16px",
                              fontWeight: "700",
                              color: "#0f172a",
                            }}
                          >
                            {entry.courseName}
                          </h3>

                          {isOngoing && (
                            <span
                              style={{
                                fontSize: "11px",
                                background: color.bg,
                                color: color.text,
                                border: `1px solid ${color.border}`,
                                padding: "3px 10px",
                                borderRadius: "999px",
                                fontWeight: "700",
                              }}
                            >
                              🔴 Live
                            </span>
                          )}

                          {isPast && (
                            <span
                              style={{
                                fontSize: "11px",
                                background: "#f1f5f9",
                                color: "#94a3b8",
                                padding: "3px 10px",
                                borderRadius: "999px",
                                fontWeight: "600",
                              }}
                            >
                              Done
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#64748b",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            📍 <strong style={{ color: "#334155" }}>{entry.room}</strong>
                          </span>

                          {duration && (
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#64748b",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              ⏱ <strong style={{ color: "#334155" }}>{duration}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        className="icon-btn"
                        onClick={() => deleteSchedule(entry.id)}
                        style={{
                          color: "#cbd5e1",
                          fontSize: "15px",
                          padding: "4px 8px",
                          borderRadius: "8px",
                          flexShrink: 0,
                        }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const page = {
  padding: "24px 20px 40px",
  fontFamily: "'DM Sans', sans-serif",
  minHeight: "100vh",
};

const container = { maxWidth: "1100px", margin: "0 auto" };

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "16px",
  marginBottom: "20px",
};

const titleStyle = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 0 4px",
  letterSpacing: "-0.5px",
};

const subtitleStyle = { color: "#64748b", fontSize: "15px", margin: 0 };

const addBtnStyle = {
  padding: "11px 22px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "white",
  fontWeight: "700",
  fontSize: "14px",
  cursor: "pointer",
  fontFamily: "'DM Sans'",
  boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
  transition: "filter 0.15s, transform 0.1s",
};

const statsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "12px",
  marginBottom: "20px",
};

const statCard = {
  background: "white",
  borderRadius: "14px",
  padding: "14px 18px",
  border: "1.5px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
};

const formCard = {
  background: "white",
  borderRadius: "16px",
  padding: "22px",
  border: "1.5px solid #e2e8f0",
  boxShadow: "0 4px 16px rgba(15,23,42,0.07)",
  marginBottom: "20px",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "14px",
  marginBottom: "16px",
};

const formGroup = { display: "flex", flexDirection: "column", gap: "6px" };

const formLabel = {
  fontSize: "12px",
  fontWeight: "700",
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const formInput = {
  padding: "11px 14px",
  borderRadius: "10px",
  border: "1.5px solid #e2e8f0",
  fontSize: "14px",
  background: "#f8fafc",
  color: "#0f172a",
  fontFamily: "'DM Sans'",
  transition: "border-color 0.15s, box-shadow 0.15s",
  width: "100%",
};

const confirmBtnStyle = {
  padding: "12px 26px",
  borderRadius: "10px",
  border: "none",
  background: "#0f172a",
  color: "white",
  fontWeight: "700",
  fontSize: "14px",
  cursor: "pointer",
  fontFamily: "'DM Sans'",
  boxShadow: "0 4px 12px rgba(15,23,42,0.2)",
  transition: "filter 0.15s",
};

const viewToggleRow = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginBottom: "18px",
};

const viewToggle = {
  display: "inline-flex",
  background: "#f1f5f9",
  borderRadius: "10px",
  padding: "4px",
  width: "fit-content",
};

const dayTabs = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const dayViewContainer = {
  background: "white",
  borderRadius: "20px",
  padding: "24px",
  border: "1.5px solid #e2e8f0",
  boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
};

const emptyState = {
  textAlign: "center",
  padding: "60px 20px",
  background: "white",
  borderRadius: "20px",
  border: "1.5px dashed #e2e8f0",
};

const toastStyle = {
  position: "fixed",
  bottom: "28px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#0f172a",
  color: "white",
  padding: "12px 24px",
  borderRadius: "999px",
  fontSize: "14px",
  fontWeight: "700",
  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
  zIndex: 9999,
  animation: "fadeUp 0.25s ease",
  fontFamily: "'DM Sans'",
  whiteSpace: "nowrap",
};