import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const formatTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
};

const toMins = (t) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const PRIORITY_CFG = {
  High:   { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)",   dot: "#ef4444" },
  Medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",  dot: "#f59e0b" },
  Low:    { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)",  dot: "#10b981" },
};

const STAT_CONFIG = [
  { key: "total",     label: "Total Tasks",    gradient: "linear-gradient(135deg,#6366f1,#8b5cf6)", shadow: "rgba(99,102,241,0.3)",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
  { key: "pending",   label: "Pending",        gradient: "linear-gradient(135deg,#f59e0b,#f97316)", shadow: "rgba(245,158,11,0.3)",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { key: "completed", label: "Completed",      gradient: "linear-gradient(135deg,#10b981,#059669)", shadow: "rgba(16,185,129,0.3)",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
  { key: "today",     label: "Classes Today",  gradient: "linear-gradient(135deg,#06b6d4,#0ea5e9)", shadow: "rgba(6,182,212,0.3)",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
];

const QUICK_LINKS = [
  { label: "Tasks",      icon: "✓",  path: "/tasks",      gradient: "linear-gradient(135deg,#6366f1,#8b5cf6)", shadow: "rgba(99,102,241,0.35)" },
  { label: "Schedule",   icon: "📅", path: "/schedule",   gradient: "linear-gradient(135deg,#06b6d4,#0ea5e9)", shadow: "rgba(6,182,212,0.35)" },
  { label: "Parking",    icon: "🅿", path: "/parking",    gradient: "linear-gradient(135deg,#10b981,#059669)", shadow: "rgba(16,185,129,0.35)" },
  { label: "Classrooms", icon: "🏛", path: "/classrooms", gradient: "linear-gradient(135deg,#f59e0b,#ef4444)", shadow: "rgba(245,158,11,0.35)" },
];

export default function Dashboard() {
  const [tasks,          setTasks]          = useState([]);
  const [schedule,       setSchedule]       = useState([]);
  const [parkingSession, setParkingSession] = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [apiError,       setApiError]       = useState(false);
  const navigate = useNavigate();

  const theme = localStorage.getItem("sc-theme") || "light";
  const dark  = theme === "dark";
  const userName = localStorage.getItem("userName") || "Student";

  const loadDashboard = useCallback(async () => {
    setLoading(true); setApiError(false);
    try {
      const [tasksRes, scheduleRes, parkingRes] = await Promise.allSettled([
        api.get("/tasks"),
        api.get("/schedule"),
        api.get("/parking-zones/my-session"),
      ]);

      if (tasksRes.status === "fulfilled") {
        const raw = Array.isArray(tasksRes.value.data) ? tasksRes.value.data : [];
        setTasks(raw.map(t => ({
          id: t.id, title: t.title || "", completed: t.status === "COMPLETED",
          dueDate: t.dueDate || "", priority: t.type || "Medium",
        })));
      } else setTasks([]);

      if (scheduleRes.status === "fulfilled") {
        const raw = Array.isArray(scheduleRes.value.data) ? scheduleRes.value.data : [];
        setSchedule(raw.map(e => ({
          id: e.id, courseName: e.courseName, day: e.dayOfWeek,
          startTime: e.startTime, endTime: e.endTime,
          room: e.room || e.classroom?.name || "",
          color: e.color || "#6366f1",
        })));
      } else setSchedule([]);

      if (parkingRes.status === "fulfilled" && parkingRes.value.data?.active) {
        setParkingSession(parkingRes.value.data);
      } else setParkingSession(null);

      if ([tasksRes, scheduleRes, parkingRes].every(r => r.status === "rejected")) setApiError(true);
    } catch {
      setApiError(true); setTasks([]); setSchedule([]); setParkingSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const todayName  = DAYS[new Date().getDay()];
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const todayStr   = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const todayClasses = useMemo(() =>
    schedule.filter(s => s.day === todayName).sort((a, b) => toMins(a.startTime) - toMins(b.startTime)),
    [schedule, todayName]
  );

  const nextClass      = useMemo(() => todayClasses.find(c => toMins(c.endTime) > nowMinutes) || null, [todayClasses, nowMinutes]);
  const pendingTasks   = useMemo(() => tasks.filter(t => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t =>  t.completed), [tasks]);

  const statValues = { total: tasks.length, pending: pendingTasks.length, completed: completedTasks.length, today: todayClasses.length };

  const isOngoing = (c) => { const s = toMins(c.startTime), e = toMins(c.endTime); return s !== null && e !== null && nowMinutes >= s && nowMinutes < e; };
  const isOverdue = (d) => d ? new Date(d) < new Date(new Date().toDateString()) : false;
  const fmt       = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  return (
    <div data-theme={theme} style={{ minHeight: "100vh" }}>
      <style>{`
        [data-theme="light"] {
          --db-bg:        #f4f6fb;
          --db-card:      #ffffff;
          --db-muted:     #f1f5f9;
          --db-muted-2:   #e8edf5;
          --db-border:    #e2e8f0;
          --db-border2:   #edf0f7;
          --db-text:      #0a0f1e;
          --db-text-2:    #3d4f6e;
          --db-text-3:    #8596b0;
          --db-hero:      linear-gradient(135deg,#0d1424 0%,#162040 40%,#1c2d55 70%,#111a30 100%);
          --db-shadow:    0 1px 4px rgba(10,15,30,0.05), 0 2px 12px rgba(10,15,30,0.04);
          --db-shadow-lg: 0 4px 24px rgba(10,15,30,0.09), 0 2px 8px rgba(10,15,30,0.04);
        }
        [data-theme="dark"] {
          --db-bg:        #060b14;
          --db-card:      #0c1322;
          --db-muted:     #101a2e;
          --db-muted-2:   #152036;
          --db-border:    rgba(255,255,255,0.07);
          --db-border2:   rgba(255,255,255,0.045);
          --db-text:      #eef2f8;
          --db-text-2:    #8599b8;
          --db-text-3:    #4e6380;
          --db-hero:      linear-gradient(135deg,#02040a 0%,#080f1e 40%,#0b152b 70%,#050810 100%);
          --db-shadow:    0 2px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15);
          --db-shadow-lg: 0 6px 28px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2);
        }
        [data-theme] * { transition: background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease; }
        [data-theme] *:hover { transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease; }

        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes liveBlip { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.8);opacity:0.35} }

        .db-page { background:var(--db-bg); min-height:100vh; font-family:'Inter','DM Sans',system-ui,sans-serif; }

        /* ── Header ── */
        .db-header { background:var(--db-hero); padding:32px 28px 42px; position:relative; overflow:hidden; }
        .db-header-mesh {
          position:absolute; inset:0; pointer-events:none;
          background-image:
            radial-gradient(ellipse at 85% 50%, rgba(99,102,241,0.18) 0%, transparent 55%),
            radial-gradient(ellipse at 15% 25%, rgba(6,182,212,0.12) 0%, transparent 45%),
            radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.10) 0%, transparent 50%);
        }
        .db-header-dots { position:absolute; inset:0; pointer-events:none; opacity:0.035; background-image:radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px); background-size:30px 30px; }
        .db-header-inner { max-width:1280px; margin:0 auto; display:flex; justify-content:space-between; align-items:flex-end; gap:16px; flex-wrap:wrap; position:relative; z-index:1; }

        .db-greet-label { font-size:13px; font-weight:500; color:rgba(255,255,255,0.48); margin:0 0 5px; letter-spacing:0.01em; }
        .db-greet-name  { font-size:clamp(24px,3.2vw,34px); font-weight:800; color:white; margin:0 0 6px; letter-spacing:-0.6px; line-height:1.1; }
        .db-greet-date  { font-size:13px; color:rgba(255,255,255,0.38); margin:0; font-weight:400; }

        .db-refresh-btn {
          display:flex; align-items:center; gap:8px; padding:10px 20px;
          border-radius:12px; border:1px solid rgba(255,255,255,0.16);
          background:rgba(255,255,255,0.09); color:rgba(255,255,255,0.82);
          font-weight:600; font-size:13px; cursor:pointer;
          font-family:'Inter','DM Sans',system-ui,sans-serif;
          backdrop-filter:blur(12px); letter-spacing:-0.1px;
          transition:background 0.15s, border-color 0.15s !important;
        }
        .db-refresh-btn:hover { background:rgba(255,255,255,0.15); border-color:rgba(255,255,255,0.24); }

        .db-body { max-width:1280px; margin:0 auto; padding:26px 22px 64px; }

        .db-error-banner {
          display:flex; gap:10px; align-items:center;
          background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.22);
          border-radius:13px; padding:13px 16px; color:#ef4444;
          font-weight:600; font-size:14px; margin-bottom:22px; letter-spacing:-0.1px;
        }

        /* ── Stats ── */
        .db-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:16px; }
        .db-stat-card {
          background:var(--db-card); border-radius:20px; padding:22px 20px;
          border:1px solid var(--db-border); box-shadow:var(--db-shadow);
          position:relative; overflow:hidden; cursor:default;
          transition:transform 0.2s ease, box-shadow 0.2s ease !important;
        }
        .db-stat-card:hover { transform:translateY(-4px); box-shadow:var(--db-shadow-lg); }
        .db-stat-icon { width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; margin-bottom:18px; color:white; }
        .db-stat-num  { font-size:clamp(32px,3vw,42px); font-weight:800; color:var(--db-text); line-height:1; margin-bottom:7px; letter-spacing:-1.5px; font-variant-numeric:tabular-nums; }
        .db-stat-lbl  { font-size:11.5px; font-weight:600; color:var(--db-text-3); text-transform:uppercase; letter-spacing:0.07em; }
        .db-stat-bar  { position:absolute; bottom:0; left:0; right:0; height:3px; border-radius:0 0 20px 20px; opacity:0.55; }

        /* ── Quick links ── */
        .db-quick { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:26px; }
        .db-quick-btn {
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:9px; padding:18px 8px; border-radius:17px; border:none; color:white;
          cursor:pointer; letter-spacing:-0.1px;
          transition:transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease !important;
        }
        .db-quick-btn:hover { transform:translateY(-4px); filter:brightness(1.10); }
        .db-quick-btn:active { transform:scale(0.96); }
        .db-quick-icon  { font-size:22px; line-height:1; }
        .db-quick-label { font-size:12.5px; font-weight:700; font-family:'Inter','DM Sans',system-ui,sans-serif; letter-spacing:-0.1px; }

        /* ── Loading ── */
        .db-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:64px 20px; background:var(--db-card); border-radius:20px; border:1px solid var(--db-border); }
        .db-spinner { width:38px; height:38px; border:3px solid var(--db-border); border-top-color:#6366f1; border-radius:50%; animation:spin 0.75s linear infinite; }
        .db-loading-text { font-size:14px; color:var(--db-text-3); font-weight:500; }

        /* ── Content grid ── */
        .db-content { display:grid; grid-template-columns:1fr 1fr; gap:16px; animation:slideIn 0.3s ease both; }

        /* ── Cards ── */
        .db-card {
          background:var(--db-card); border-radius:20px; padding:22px;
          border:1px solid var(--db-border); box-shadow:var(--db-shadow);
          transition:transform 0.18s ease, box-shadow 0.18s ease !important;
        }
        .db-card:hover { transform:translateY(-2px); box-shadow:var(--db-shadow-lg); }
        .db-card-full { grid-column:1 / -1; }

        .db-card-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
        .db-card-title-row { display:flex; align-items:center; gap:10px; }
        .db-card-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .db-card-title { font-size:15px; font-weight:700; color:var(--db-text); margin:0; letter-spacing:-0.2px; }
        .db-card-badge {
          font-size:11.5px; font-weight:600; color:var(--db-text-3);
          background:var(--db-muted); border:1px solid var(--db-border);
          padding:3px 12px; border-radius:999px;
        }

        .db-see-all {
          font-size:12px; font-weight:700; color:#6366f1; background:none; border:none;
          cursor:pointer; padding:4px 10px; border-radius:8px;
          font-family:'Inter','DM Sans',system-ui,sans-serif; letter-spacing:-0.1px;
          transition:background 0.15s, color 0.15s !important;
        }
        [data-theme="dark"] .db-see-all { color:#818cf8; }
        .db-see-all:hover { background:rgba(99,102,241,0.09); }

        /* ── Schedule items ── */
        .db-schedule-list { display:flex; flex-direction:column; gap:8px; }
        .db-schedule-item {
          border-radius:13px; padding:12px 14px;
          border:1px solid var(--db-border2); background:var(--db-muted);
          transition:transform 0.15s, box-shadow 0.15s !important;
        }
        .db-schedule-item:hover { transform:translateY(-1px); box-shadow:0 3px 14px rgba(10,15,30,0.07); }
        .db-schedule-item.live { background:rgba(99,102,241,0.07); border-color:rgba(99,102,241,0.22); }
        [data-theme="dark"] .db-schedule-item.live { background:rgba(99,102,241,0.12); border-color:rgba(99,102,241,0.28); }
        .db-sched-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; }
        .db-sched-name { font-weight:700; font-size:14px; color:var(--db-text); letter-spacing:-0.1px; }
        .db-sched-meta { display:flex; flex-wrap:wrap; gap:10px; font-size:12px; color:var(--db-text-3); font-weight:500; }
        .db-live-badge {
          display:inline-flex; align-items:center; gap:5px;
          font-size:10.5px; font-weight:700; color:#10b981;
          background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25);
          border-radius:999px; padding:3px 9px; letter-spacing:0.04em;
        }
        [data-theme="dark"] .db-live-badge { color:#34d399; background:rgba(16,185,129,0.14); }
        .db-live-dot { width:6px; height:6px; border-radius:50%; background:#10b981; animation:liveBlip 2s ease-in-out infinite; flex-shrink:0; }

        /* ── Next class ── */
        .db-next-class {
          background:rgba(99,102,241,0.07); border:1.5px solid rgba(99,102,241,0.2);
          border-radius:15px; padding:18px; position:relative; overflow:hidden;
        }
        [data-theme="dark"] .db-next-class { background:rgba(99,102,241,0.11); border-color:rgba(99,102,241,0.24); }
        .db-next-class-glow { position:absolute; top:-40px; right:-40px; width:120px; height:120px; border-radius:50%; background:rgba(99,102,241,0.18); filter:blur(40px); pointer-events:none; }
        .db-next-course { font-weight:800; font-size:16px; color:#4f46e5; margin:0 0 9px; letter-spacing:-0.2px; }
        [data-theme="dark"] .db-next-course { color:#818cf8; }
        .db-next-meta  { font-size:13px; color:#4338ca; font-weight:600; margin-bottom:4px; }
        [data-theme="dark"] .db-next-meta { color:#6366f1; }

        /* ── Parking ── */
        .db-parking-card { background:rgba(16,185,129,0.07); border:1.5px solid rgba(16,185,129,0.18); border-radius:14px; padding:14px; margin-top:14px; }
        [data-theme="dark"] .db-parking-card { background:rgba(16,185,129,0.10); border-color:rgba(16,185,129,0.24); }
        .db-parking-zone  { font-weight:700; font-size:14px; color:#10b981; letter-spacing:-0.1px; }
        .db-parking-since { font-size:12px; color:var(--db-text-3); margin-top:3px; }

        /* ── Task chips ── */
        .db-task-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:10px; }
        .db-task-chip {
          background:var(--db-muted); border-radius:14px; padding:14px 16px;
          border:1px solid var(--db-border2);
          transition:background 0.15s, box-shadow 0.15s !important;
        }
        .db-task-chip:hover { background:var(--db-muted-2); box-shadow:0 2px 12px rgba(10,15,30,0.06); }
        .db-task-name  { font-weight:600; font-size:14px; color:var(--db-text); line-height:1.4; margin:0 0 8px; letter-spacing:-0.1px; }
        .db-task-tags  { display:flex; gap:7px; flex-wrap:wrap; align-items:center; }
        .db-priority-tag { padding:3px 10px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:0.02em; }
        .db-due-tag { font-size:11px; font-weight:600; color:var(--db-text-3); }

        /* ── Empty state ── */
        .db-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:32px 16px; text-align:center; }
        .db-empty-icon  { font-size:36px; margin-bottom:10px; line-height:1; }
        .db-empty-title { font-weight:700; font-size:15px; color:var(--db-text); margin:0 0 5px; letter-spacing:-0.2px; }
        .db-empty-text  { font-size:13px; color:var(--db-text-3); margin:0; }

        @media(max-width:900px) {
          .db-stats { grid-template-columns:repeat(2,1fr); }
          .db-quick { grid-template-columns:repeat(2,1fr); }
          .db-content { grid-template-columns:1fr; }
        }
        @media(max-width:560px) {
          .db-stats { grid-template-columns:repeat(2,1fr); gap:10px; }
          .db-body { padding:18px 14px 48px; }
        }
      `}</style>

      <div className="db-page">

        <div className="db-header">
          <div className="db-header-mesh" />
          <div className="db-header-dots" />
          <div className="db-header-inner">
            <div>
              <p className="db-greet-label">{getGreeting()},</p>
              <h1 className="db-greet-name">{userName} 👋</h1>
              <p className="db-greet-date">{todayStr}</p>
            </div>
            <button className="db-refresh-btn" onClick={loadDashboard} title="Refresh">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
              Refresh
            </button>
          </div>
        </div>

        <div className="db-body">
          {apiError && (
            <div className="db-error-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Could not load some dashboard data. Check your connection and refresh.
            </div>
          )}

          <div className="db-stats">
            {STAT_CONFIG.map(({ key, label, gradient, shadow, icon }) => (
              <div key={key} className="db-stat-card">
                <div className="db-stat-icon" style={{ background: gradient, boxShadow: `0 4px 12px ${shadow}` }}>{icon}</div>
                <div className="db-stat-num">{statValues[key]}</div>
                <div className="db-stat-lbl">{label}</div>
                <div className="db-stat-bar" style={{ background: gradient }} />
              </div>
            ))}
          </div>

          <div className="db-quick">
            {QUICK_LINKS.map(q => (
              <button
                key={q.path}
                className="db-quick-btn"
                onClick={() => navigate(q.path)}
                style={{ background: q.gradient, boxShadow: `0 4px 14px ${q.shadow}` }}
              >
                <span className="db-quick-icon">{q.icon}</span>
                <span className="db-quick-label">{q.label}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="db-loading">
              <div className="db-spinner" />
              <span className="db-loading-text">Loading your dashboard...</span>
            </div>
          ) : (
            <div className="db-content">

              <div className="db-card">
                <div className="db-card-head">
                  <div className="db-card-title-row">
                    <div className="db-card-dot" style={{ background: "#6366f1" }} />
                    <h3 className="db-card-title">Today&apos;s Schedule</h3>
                  </div>
                  <span className="db-card-badge">{todayClasses.length} {todayClasses.length === 1 ? "class" : "classes"}</span>
                </div>

                {todayClasses.length === 0 ? (
                  <div className="db-empty">
                    <span className="db-empty-icon">😌</span>
                    <p className="db-empty-title">Free day!</p>
                    <p className="db-empty-text">No classes scheduled for today.</p>
                  </div>
                ) : (
                  <div className="db-schedule-list">
                    {todayClasses.map(item => {
                      const ongoing = isOngoing(item);
                      return (
                        <div
                          key={item.id}
                          className={`db-schedule-item${ongoing ? " live" : ""}`}
                          style={{ borderLeftColor: item.color, borderLeftWidth: "3px", borderLeftStyle: "solid" }}
                        >
                          <div className="db-sched-top">
                            <span className="db-sched-name">{item.courseName}</span>
                            {ongoing && (
                              <div className="db-live-badge">
                                <div className="db-live-dot" />LIVE
                              </div>
                            )}
                          </div>
                          <div className="db-sched-meta">
                            <span>🕐 {formatTime(item.startTime)} — {formatTime(item.endTime)}</span>
                            {item.room && <span>📍 {item.room}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="db-card">
                  <div className="db-card-head">
                    <div className="db-card-title-row">
                      <div className="db-card-dot" style={{ background: "#8b5cf6" }} />
                      <h3 className="db-card-title">Next Class</h3>
                    </div>
                  </div>

                  {nextClass ? (
                    <div className="db-next-class">
                      <div className="db-next-class-glow" />
                      <div style={{ position: "relative", zIndex: 1 }}>
                        <p className="db-next-course">{nextClass.courseName}</p>
                        <p className="db-next-meta">🕐 {formatTime(nextClass.startTime)} — {formatTime(nextClass.endTime)}</p>
                        {nextClass.room && <p className="db-next-meta">📍 {nextClass.room}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="db-empty" style={{ padding: "20px 16px" }}>
                      <span className="db-empty-icon">🎉</span>
                      <p className="db-empty-title">All done!</p>
                      <p className="db-empty-text">No more classes today.</p>
                    </div>
                  )}
                </div>

                <div className="db-card">
                  <div className="db-card-head">
                    <div className="db-card-title-row">
                      <div className="db-card-dot" style={{ background: "#10b981" }} />
                      <h3 className="db-card-title">Parking</h3>
                    </div>
                    <button className="db-see-all" onClick={() => navigate("/parking")}>View →</button>
                  </div>

                  {parkingSession ? (
                    <div className="db-parking-card">
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "24px" }}>🚗</span>
                        <div>
                          <div className="db-parking-zone">Parked — Zone {parkingSession.zoneId}</div>
                          {parkingSession.checkedInAt && (
                            <div className="db-parking-since">
                              Since {new Date(parkingSession.checkedInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          )}
                        </div>
                        <div style={{ marginLeft: "auto", fontSize: "11px", fontWeight: "700", color: "#10b981", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "999px", padding: "4px 10px", flexShrink: 0 }}>
                          Active
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="db-empty" style={{ padding: "16px" }}>
                      <p className="db-empty-text">No active parking session.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="db-card db-card-full">
                <div className="db-card-head">
                  <div className="db-card-title-row">
                    <div className="db-card-dot" style={{ background: "#f59e0b" }} />
                    <h3 className="db-card-title">Pending Tasks</h3>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span className="db-card-badge">{pendingTasks.length} pending</span>
                    {pendingTasks.length > 0 && (
                      <button className="db-see-all" onClick={() => navigate("/tasks")}>View All →</button>
                    )}
                  </div>
                </div>

                {pendingTasks.length === 0 ? (
                  <div className="db-empty">
                    <span className="db-empty-icon">✅</span>
                    <p className="db-empty-title">All caught up!</p>
                    <p className="db-empty-text">No pending tasks. Great work!</p>
                  </div>
                ) : (
                  <div className="db-task-grid">
                    {pendingTasks.slice(0, 6).map(task => {
                      const cfg     = PRIORITY_CFG[task.priority] || PRIORITY_CFG.Medium;
                      const overdue = isOverdue(task.dueDate);
                      return (
                        <div
                          key={task.id}
                          className="db-task-chip"
                          style={{ borderLeftColor: cfg.color, borderLeftWidth: "3px", borderLeftStyle: "solid" }}
                        >
                          <p className="db-task-name">{task.title}</p>
                          <div className="db-task-tags">
                            <span
                              className="db-priority-tag"
                              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                            >
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span className="db-due-tag" style={{ color: overdue ? "#ef4444" : undefined }}>
                                {overdue ? "⚠️ Overdue" : `📅 ${fmt(task.dueDate)}`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
