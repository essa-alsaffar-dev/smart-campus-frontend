import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/api";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

export default function Dashboard() {
  const [tasks,          setTasks]          = useState([]);
  const [schedule,       setSchedule]       = useState([]);
  const [parkingSession, setParkingSession] = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [apiError,       setApiError]       = useState(false);

  const userName = localStorage.getItem("userName") || "Student";

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setApiError(false);

    try {
      const [tasksRes, scheduleRes, parkingRes] = await Promise.allSettled([
        api.get("/tasks"),
        api.get("/schedule"),
        api.get("/parking-zones/my-session"),
      ]);

      if (tasksRes.status === "fulfilled") {
        const rawTasks = Array.isArray(tasksRes.value.data) ? tasksRes.value.data : [];
        setTasks(
          rawTasks.map((t) => ({
            id:        t.id,
            title:     t.title   || "",
            completed: t.status  === "COMPLETED",
            dueDate:   t.dueDate || "",
            priority:  t.type    || "Medium",
          }))
        );
      } else {
        setTasks([]);
      }

      if (scheduleRes.status === "fulfilled") {
        const rawSchedule = Array.isArray(scheduleRes.value.data) ? scheduleRes.value.data : [];
        setSchedule(
          rawSchedule.map((e) => ({
            id:         e.id,
            courseName: e.courseName,
            day:        e.dayOfWeek,
            startTime:  e.startTime,
            endTime:    e.endTime,
            room:       e.room || e.classroom?.name || "",
            color:      e.color || "#2563eb",
          }))
        );
      } else {
        setSchedule([]);
      }

      if (parkingRes.status === "fulfilled" && parkingRes.value.data?.active) {
        setParkingSession(parkingRes.value.data);
      } else {
        setParkingSession(null);
      }

      if (
        tasksRes.status    === "rejected" &&
        scheduleRes.status === "rejected" &&
        parkingRes.status  === "rejected"
      ) {
        setApiError(true);
      }
    } catch (err) {
      console.error("Dashboard load failed:", err);
      setApiError(true);
      setTasks([]);
      setSchedule([]);
      setParkingSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const todayName  = days[new Date().getDay()];
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const todayClasses = useMemo(() =>
    schedule
      .filter((s) => s.day === todayName)
      .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)),
    [schedule, todayName]
  );

  const nextClass      = useMemo(() =>
    todayClasses.find((c) => parseTimeToMinutes(c.endTime) > nowMinutes) || null,
    [todayClasses, nowMinutes]
  );

  const pendingTasks   = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) =>  t.completed), [tasks]);

  return (
    <div style={page}>
      <div style={container}>

        <div style={headerRow}>
          <div>
            <h1 style={titleStyle}>Welcome back, {userName}</h1>
            <p style={subtitleStyle}>Here&apos;s a quick view of your campus day.</p>
          </div>
          <button style={refreshBtn} onClick={loadDashboard}>⟳ Refresh</button>
        </div>

        {apiError && (
          <div style={errorBox}>Could not load some dashboard data. Please try again.</div>
        )}

        <div style={statsGrid}>
          {[
            { value: tasks.length,          label: "Total Tasks"     },
            { value: pendingTasks.length,   label: "Pending Tasks"   },
            { value: completedTasks.length, label: "Completed Tasks" },
            { value: todayClasses.length,   label: "Today's Classes" },
          ].map(({ value, label }) => (
            <div key={label} style={statCard}>
              <div style={statNumber}>{value}</div>
              <div style={statLabel}>{label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={loadingBox}>Loading dashboard...</div>
        ) : (
          <div style={contentGrid}>

            <div style={card}>
              <h3 style={cardTitle}>Today&apos;s Schedule</h3>
              {todayClasses.length === 0 ? (
                <div style={emptyText}>No classes today.</div>
              ) : (
                <div style={list}>
                  {todayClasses.map((item) => (
                    <div key={item.id} style={{ ...scheduleItem, borderLeft: `6px solid ${item.color}` }}>
                      <div style={itemTitle}>{item.courseName}</div>
                      <div style={metaText}>⏰ {formatTime(item.startTime)} - {formatTime(item.endTime)}</div>
                      <div style={metaText}>📍 {item.room}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={card}>
              <h3 style={cardTitle}>Next Class</h3>
              {nextClass ? (
                <div style={highlightBox}>
                  <div style={itemTitle}>{nextClass.courseName}</div>
                  <div style={metaText}>⏰ {formatTime(nextClass.startTime)} - {formatTime(nextClass.endTime)}</div>
                  <div style={metaText}>📍 {nextClass.room}</div>
                </div>
              ) : (
                <div style={emptyText}>No upcoming class for today.</div>
              )}
            </div>

            <div style={card}>
              <h3 style={cardTitle}>Pending Tasks</h3>
              {pendingTasks.length === 0 ? (
                <div style={emptyText}>No pending tasks.</div>
              ) : (
                <div style={list}>
                  {pendingTasks.slice(0, 5).map((task) => (
                    <div key={task.id} style={taskItem}>
                      <div style={itemTitle}>{task.title}</div>
                      <div style={metaText}>
                        {task.priority && <span>🏷 {task.priority}</span>}
                        {task.dueDate  && <span> &nbsp;•&nbsp; 📅 {task.dueDate}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={card}>
              <h3 style={cardTitle}>Parking Status</h3>
              {parkingSession ? (
                <div style={highlightBox}>
                  <div style={itemTitle}>You are currently parked</div>
                  <div style={metaText}>Zone ID: {parkingSession.zoneId}</div>
                  {parkingSession.checkedInAt && (
                    <div style={metaText}>Checked in: {new Date(parkingSession.checkedInAt).toLocaleString()}</div>
                  )}
                  {parkingSession.endTime    && <div style={metaText}>Ends at: {formatTime(parkingSession.endTime)}</div>}
                  {parkingSession.courseName && <div style={metaText}>Course: {parkingSession.courseName}</div>}
                </div>
              ) : (
                <div style={emptyText}>No active parking session.</div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

const page          = { minHeight: "100vh", background: "#f8fafc", padding: "20px" };
const container     = { width: "100%", maxWidth: "1200px", margin: "0 auto" };
const headerRow     = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "20px" };
const titleStyle    = { margin: 0, fontSize: "30px", fontWeight: "800", color: "#0f172a" };
const subtitleStyle = { marginTop: "6px", color: "#64748b" };
const refreshBtn    = { border: "1px solid #cbd5e1", background: "white", borderRadius: "10px", padding: "10px 14px", cursor: "pointer" };
const errorBox      = { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: "10px", padding: "12px", marginBottom: "16px" };
const statsGrid     = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "20px" };
const statCard      = { background: "white", borderRadius: "14px", padding: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" };
const statNumber    = { fontSize: "28px", fontWeight: "800", color: "#2563eb" };
const statLabel     = { color: "#64748b", marginTop: "4px" };
const loadingBox    = { background: "white", borderRadius: "14px", padding: "30px", textAlign: "center", color: "#64748b", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" };
const contentGrid   = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" };
const card          = { background: "white", borderRadius: "14px", padding: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" };
const cardTitle     = { marginTop: 0, marginBottom: "14px", color: "#0f172a" };
const list          = { display: "flex", flexDirection: "column", gap: "10px" };
const scheduleItem  = { background: "#f8fafc", borderRadius: "10px", padding: "12px" };
const taskItem      = { background: "#f8fafc", borderRadius: "10px", padding: "12px" };
const highlightBox  = { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "14px" };
const itemTitle     = { fontWeight: "700", color: "#0f172a", marginBottom: "6px" };
const metaText      = { fontSize: "13px", color: "#64748b", marginBottom: "4px" };
const emptyText     = { color: "#64748b", fontSize: "14px" };