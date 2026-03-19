import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = "https://smart-campus-backend-production-bf5e.up.railway.app";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const COURSE_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#ea580c",
  "#dc2626",
  "#0891b2",
  "#65a30d",
  "#c026d3",
];

export default function SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [apiError, setApiError] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [day, setDay] = useState("Sunday");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [room, setRoom] = useState("");

  const token = localStorage.getItem("token");

  const getHeaders = useCallback(() => {
    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2200);
  };

  const parseTimeToMinutes = (time) => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const assignColor = useCallback(
    (name) => {
      const existing = schedule.find((s) => s.courseName === name)?.color;
      if (existing) return existing;

      const names = [...new Set(schedule.map((s) => s.courseName))];
      const idx = names.length % COURSE_COLORS.length;
      return COURSE_COLORS[idx];
    },
    [schedule]
  );

  const mapEntry = (e) => ({
    id: e.id,
    courseName: e.courseName,
    day: e.dayOfWeek,
    startTime: e.startTime,
    endTime: e.endTime,
    time: `${e.startTime} - ${e.endTime}`,
    room: e.room || e.classroom?.name || "",
    color: e.color || COURSE_COLORS[0],
  });

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setApiError(false);

    try {
      const res = await axios.get(`${API}/schedule`, {
        headers: getHeaders(),
      });

      const entries = Array.isArray(res.data) ? res.data.map(mapEntry) : [];
      setSchedule(entries);
    } catch (err) {
      console.error("Failed to load schedule:", err);
      setSchedule([]);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    loadSchedule();

    // إذا عندك غرف محلية في المشروع الحالي
    const savedRooms = JSON.parse(localStorage.getItem("classrooms") || "[]");
    setRooms(savedRooms);
  }, [loadSchedule]);

  const addSchedule = async () => {
    if (!courseName.trim() || !day || !startTime || !endTime || !room.trim()) {
      showToast("Please fill in all fields.");
      return;
    }

    if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) {
      showToast("End time must be after start time.");
      return;
    }

    const hasConflict = schedule.some(
      (s) =>
        s.day === day &&
        s.room.toLowerCase() === room.trim().toLowerCase() &&
        !(parseTimeToMinutes(endTime) <= parseTimeToMinutes(s.startTime) ||
          parseTimeToMinutes(startTime) >= parseTimeToMinutes(s.endTime))
    );

    if (hasConflict) {
      showToast("Time conflict in the same room.");
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
        {
          headers: getHeaders(),
        }
      );

      setSchedule((prev) => [...prev, mapEntry(res.data)]);
      setCourseName("");
      setDay("Sunday");
      setStartTime("");
      setEndTime("");
      setRoom("");
      setShowForm(false);
      showToast("✅ Class added!");
    } catch (err) {
      console.error("Failed to save schedule:", err);
      showToast("❌ Failed to save class.");
    }
  };

  const deleteSchedule = async (id) => {
    try {
      await axios.delete(`${API}/schedule/${id}`, {
        headers: getHeaders(),
      });

      setSchedule((prev) => prev.filter((s) => s.id !== id));
      showToast("🗑 Class removed.");
    } catch (err) {
      console.error("Failed to delete schedule:", err);
      showToast("❌ Failed to remove class.");
    }
  };

  const groupedByDay = useMemo(() => {
    return DAYS.reduce((acc, d) => {
      acc[d] = schedule
        .filter((s) => s.day === d)
        .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
      return acc;
    }, {});
  }, [schedule]);

  return (
    <div style={page}>
      <div style={container}>
        <div style={headerRow}>
          <div>
            <h1 style={titleStyle}>Schedule</h1>
            <p style={subTitle}>Your weekly classes synced across all devices.</p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button style={refreshBtn} onClick={loadSchedule}>⟳ Refresh</button>
            <button style={primaryBtn} onClick={() => setShowForm(!showForm)}>
              {showForm ? "Close Form" : "+ Add Class"}
            </button>
          </div>
        </div>

        {toast && <div style={toastStyle}>{toast}</div>}

        {apiError && (
          <div style={errorBox}>
            Could not load schedule from the server. Please try again.
          </div>
        )}

        {showForm && (
          <div style={formCard}>
            <h3 style={sectionTitle}>Add Class</h3>

            <input
              style={input}
              type="text"
              placeholder="Course name"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
            />

            <div style={grid2}>
              <select style={input} value={day} onChange={(e) => setDay(e.target.value)}>
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <input
                style={input}
                type="text"
                placeholder="Room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                list="rooms-list"
              />
              <datalist id="rooms-list">
                {rooms.map((r, idx) => (
                  <option key={idx} value={r.name || r.room || r} />
                ))}
              </datalist>
            </div>

            <div style={grid2}>
              <input
                style={input}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />

              <input
                style={input}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <button style={primaryBtn} onClick={addSchedule}>
              Save Class
            </button>
          </div>
        )}

        {loading ? (
          <div style={emptyState}>Loading schedule...</div>
        ) : (
          <div style={daysGrid}>
            {DAYS.map((dayName) => (
              <div key={dayName} style={dayCard}>
                <div style={dayHeader}>{dayName}</div>

                {groupedByDay[dayName].length === 0 ? (
                  <div style={emptySmall}>No classes</div>
                ) : (
                  groupedByDay[dayName].map((item) => (
                    <div
                      key={item.id}
                      style={{
                        ...classCard,
                        borderLeft: `6px solid ${item.color}`,
                      }}
                    >
                      <div style={classTopRow}>
                        <div>
                          <div style={classTitle}>{item.courseName}</div>
                          <div style={classMeta}>
                            ⏰ {item.time}
                          </div>
                          <div style={classMeta}>
                            📍 {item.room}
                          </div>
                        </div>

                        <button
                          style={deleteBtn}
                          onClick={() => deleteSchedule(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}
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
};

const container = {
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const titleStyle = {
  margin: 0,
  fontSize: "30px",
  color: "#0f172a",
};

const subTitle = {
  marginTop: "6px",
  color: "#64748b",
};

const refreshBtn = {
  border: "1px solid #cbd5e1",
  background: "white",
  borderRadius: "10px",
  padding: "10px 14px",
  cursor: "pointer",
};

const primaryBtn = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: "700",
};

const toastStyle = {
  background: "#dcfce7",
  color: "#166534",
  border: "1px solid #86efac",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "16px",
};

const errorBox = {
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fca5a5",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "16px",
};

const formCard = {
  background: "white",
  borderRadius: "14px",
  padding: "18px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  marginBottom: "20px",
};

const sectionTitle = {
  marginTop: 0,
  color: "#0f172a",
};

const input = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #dbe2ea",
  marginBottom: "12px",
  fontSize: "14px",
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const daysGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const dayCard = {
  background: "white",
  borderRadius: "14px",
  padding: "14px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  minHeight: "260px",
};

const dayHeader = {
  fontWeight: "800",
  color: "#0f172a",
  marginBottom: "12px",
  fontSize: "17px",
};

const emptySmall = {
  color: "#94a3b8",
  fontSize: "14px",
};

const classCard = {
  background: "#f8fafc",
  borderRadius: "12px",
  padding: "12px",
  marginBottom: "10px",
};

const classTopRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  alignItems: "flex-start",
};

const classTitle = {
  fontWeight: "700",
  color: "#0f172a",
  marginBottom: "6px",
};

const classMeta = {
  color: "#64748b",
  fontSize: "13px",
  marginBottom: "4px",
};

const deleteBtn = {
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "8px 10px",
  cursor: "pointer",
  flexShrink: 0,
};

const emptyState = {
  padding: "30px 10px",
  textAlign: "center",
  color: "#64748b",
};