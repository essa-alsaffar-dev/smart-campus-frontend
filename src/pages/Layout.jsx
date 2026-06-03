import { useState, useEffect, useRef, useCallback } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";

const NAV_ITEMS = [
  { path: "/dashboard",  label: "Dashboard",  icon: "DASH" },
  { path: "/tasks",      label: "Tasks",       icon: "TASK" },
  { path: "/schedule",   label: "Schedule",    icon: "SCHED" },
  { path: "/parking",    label: "Parking",     icon: "PARK" },
  { path: "/classrooms", label: "Classrooms",  icon: "CLASS" },
];

const ALL_NAV = [...NAV_ITEMS, { path: "/profile", label: "Profile", icon: "PROF" }];

const NavIcon = ({ type, size = 16 }) => {
  const s = { width: size, height: size };
  const p = { fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    DASH:  <svg viewBox="0 0 24 24" {...p} style={s}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    TASK:  <svg viewBox="0 0 24 24" {...p} style={s}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    SCHED: <svg viewBox="0 0 24 24" {...p} style={s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    PARK:  <svg viewBox="0 0 24 24" {...p} style={s}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 010 6H9"/></svg>,
    CLASS: <svg viewBox="0 0 24 24" {...p} style={s}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    PROF:  <svg viewBox="0 0 24 24" {...p} style={s}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    OUT:   <svg viewBox="0 0 24 24" {...p} style={s}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    SUN:   <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    MOON:  <svg viewBox="0 0 24 24" {...p} style={s}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
    MENU:  <svg viewBox="0 0 24 24" {...p} style={s}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  };
  return icons[type] || null;
};

export default function Layout() {
  const location = useLocation();
  const navigate  = useNavigate();

  const userName   = localStorage.getItem("userName")  || "Student";
  const userRole   = localStorage.getItem("userRole")   || "";
  const isAdmin    = userRole === "ADMIN";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("sc-theme") || "light");
  const [notifications, setNotifications] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [bellOpen, setBellOpen] = useState(false);
  const [browserPermission, setBrowserPermission] = useState(() =>
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const notifiedIdsRef = useRef(new Set());
  const bellRef = useRef(null);

  useEffect(() => {
    api.get("/users/me")
      .then(r => {
        if (r.data?.theme) {
          const t = r.data.theme;
          setTheme(t);
          localStorage.setItem("sc-theme", t);
        }
      })
      .catch(() => {});
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications/due");
      const incoming = Array.isArray(res.data) ? res.data : [];
      setNotifications(incoming);
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        incoming.forEach(n => {
          if (!notifiedIdsRef.current.has(n.id)) {
            notifiedIdsRef.current.add(n.id);
            try {
              new Notification(n.title, { body: n.message, icon: "/favicon.ico" });
            } catch {}
          }
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

  const requestBrowserPermission = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setBrowserPermission(perm);
  };

  const handleLogout = () => {
    ["token","userName","userRole","userEmail","userAvatar"].forEach(k => localStorage.removeItem(k));
    navigate("/");
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("sc-theme", next);
    api.patch("/users/me", { theme: next }).catch(() => {});
  };

  const closeSidebar = () => setSidebarOpen(false);
  const avatarLetter = (userName || "S")[0].toUpperCase();
  const pageTitle = ALL_NAV.find(i => i.path === location.pathname)?.label ?? "Smart Campus";
  const dark = theme === "dark";

  useEffect(() => setSidebarOpen(false), [location.pathname]);

  return (
    <div data-theme={theme} style={{ minHeight: "100vh", width: "100%" }}>
      <style>{`
        [data-theme="light"] {
          --lay-bg:         #f4f6fb;
          --lay-surface:    #ffffff;
          --lay-muted:      #f1f5f9;
          --lay-muted-2:    #e8edf5;
          --lay-border:     #e2e8f0;
          --lay-border-2:   #d1dae8;
          --lay-text:       #0a0f1e;
          --lay-text-2:     #3d4f6e;
          --lay-text-3:     #8596b0;
          --lay-topbar-bg:  rgba(255,255,255,0.88);
          --lay-topbar-bdr: rgba(214,221,234,0.9);
        }
        [data-theme="dark"] {
          --lay-bg:         #060b14;
          --lay-surface:    #0c1322;
          --lay-muted:      #101a2e;
          --lay-muted-2:    #152036;
          --lay-border:     rgba(255,255,255,0.07);
          --lay-border-2:   rgba(255,255,255,0.12);
          --lay-text:       #eef2f8;
          --lay-text-2:     #8599b8;
          --lay-text-3:     #4e6380;
          --lay-topbar-bg:  rgba(6,11,20,0.9);
          --lay-topbar-bdr: rgba(255,255,255,0.05);
        }

        [data-theme] * { transition: background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease; }
        [data-theme] *:hover { transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease; }

        .lay-shell { display:flex; min-height:100vh; width:100%; background:var(--lay-bg); font-family:'Inter','DM Sans',system-ui,sans-serif; }

        /* ── Sidebar ── */
        .lay-sidebar {
          width:260px; min-width:260px;
          background:linear-gradient(180deg,#08101f 0%,#0d1830 50%,#0a1428 100%);
          display:flex; flex-direction:column;
          padding:22px 12px 20px;
          border-right:1px solid rgba(255,255,255,0.055);
          position:sticky; top:0; height:100vh; overflow-y:auto;
          overflow-x:hidden;
        }
        [data-theme="dark"] .lay-sidebar {
          background:linear-gradient(180deg,#020508 0%,#060e1c 50%,#04090f 100%);
          border-right-color:rgba(255,255,255,0.04);
        }

        /* Brand */
        .lay-brand { display:flex; align-items:center; gap:12px; padding:4px 8px 22px; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.06); }
        .lay-brand-logo {
          width:40px; height:40px; border-radius:12px; flex-shrink:0;
          background:linear-gradient(135deg,#4f6ef7 0%,#7c3aed 100%);
          display:flex; align-items:center; justify-content:center;
          font-weight:900; font-size:14px; color:white; letter-spacing:-0.5px;
          box-shadow:0 4px 16px rgba(99,102,241,0.45), 0 0 0 1px rgba(99,102,241,0.2);
        }
        .lay-brand-name { font-size:15.5px; font-weight:800; color:white; letter-spacing:-0.4px; line-height:1.2; }
        .lay-brand-sub  { font-size:11px; color:rgba(255,255,255,0.32); line-height:1; margin-top:3px; letter-spacing:0.01em; }

        /* User chip */
        .lay-user-chip {
          display:flex; align-items:center; gap:10px; padding:10px 10px;
          border-radius:14px;
          background:rgba(255,255,255,0.055);
          border:1px solid rgba(255,255,255,0.09);
          margin-bottom:22px; cursor:pointer; text-decoration:none;
          transition:background 0.15s, border-color 0.15s !important;
        }
        .lay-user-chip:hover { background:rgba(255,255,255,0.10) !important; border-color:rgba(255,255,255,0.14) !important; }
        .lay-avatar {
          width:36px; height:36px; min-width:36px; border-radius:11px;
          background:${isAdmin ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "linear-gradient(135deg,#4f6ef7,#7c3aed)"};
          display:flex; align-items:center; justify-content:center;
          font-size:14px; font-weight:800; color:white;
          box-shadow:0 2px 10px rgba(0,0,0,0.35);
          flex-shrink:0;
        }
        .lay-user-name { font-size:13px; font-weight:700; color:rgba(255,255,255,0.95); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:-0.1px; }
        .lay-user-sub  { font-size:11px; color:rgba(255,255,255,0.35); margin-top:2px; }
        .lay-role-badge {
          display:inline-block; font-size:9.5px; font-weight:700; letter-spacing:0.06em;
          color:#fbbf24; background:rgba(245,158,11,0.14);
          border:1px solid rgba(245,158,11,0.28); border-radius:999px; padding:2px 8px; margin-top:3px;
          text-transform:uppercase;
        }

        /* Nav label */
        .lay-nav-label {
          font-size:9.5px; font-weight:700; color:rgba(255,255,255,0.22);
          text-transform:uppercase; letter-spacing:0.10em; padding:0 10px; margin-bottom:5px;
        }
        .lay-nav { display:flex; flex-direction:column; gap:1px; }

        /* Nav link */
        .lay-nav-link {
          display:flex; align-items:center; gap:12px; padding:10px 12px;
          border-radius:12px; text-decoration:none;
          color:rgba(255,255,255,0.45); font-weight:500; font-size:13.5px;
          border:1px solid transparent; position:relative;
          letter-spacing:-0.1px;
          transition:background 0.15s, color 0.15s, border-color 0.15s !important;
        }
        .lay-nav-link:hover {
          background:rgba(255,255,255,0.07);
          color:rgba(255,255,255,0.88);
        }
        .lay-nav-link.active {
          background:linear-gradient(135deg, rgba(79,110,247,0.22) 0%, rgba(124,58,237,0.16) 100%);
          color:white; font-weight:600;
          border-color:rgba(99,102,241,0.28);
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 8px rgba(99,102,241,0.12);
        }
        .lay-nav-link.active::before {
          content:''; position:absolute; left:-12px; top:50%;
          transform:translateY(-50%);
          width:3px; height:20px; border-radius:0 3px 3px 0;
          background:linear-gradient(180deg,#6366f1,#8b5cf6);
          box-shadow:0 0 8px rgba(99,102,241,0.6);
        }
        .lay-nav-icon { width:20px; min-width:20px; display:flex; align-items:center; justify-content:center; opacity:0.65; transition:opacity 0.15s !important; }
        .lay-nav-link:hover .lay-nav-icon, .lay-nav-link.active .lay-nav-icon { opacity:1; }

        /* Divider / spacer */
        .lay-divider { height:1px; background:rgba(255,255,255,0.065); margin:10px 0; }
        .lay-spacer  { flex:1; }
        .lay-bottom  { display:flex; flex-direction:column; gap:1px; }

        /* Bottom buttons */
        .lay-bottom-btn {
          display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:12px;
          color:rgba(255,255,255,0.45); font-weight:500; font-size:13.5px;
          border:none; background:none; cursor:pointer;
          font-family:'Inter','DM Sans',system-ui,sans-serif;
          width:100%; text-align:left; text-decoration:none; letter-spacing:-0.1px;
          transition:background 0.15s, color 0.15s !important;
        }
        .lay-bottom-btn:hover { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.88); }
        .lay-bottom-btn.active {
          background:linear-gradient(135deg, rgba(79,110,247,0.22) 0%, rgba(124,58,237,0.16) 100%);
          color:white; font-weight:600; border:1px solid rgba(99,102,241,0.28);
        }

        .lay-theme-row {
          display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:12px;
          color:rgba(255,255,255,0.45); font-weight:500; font-size:13.5px;
          border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04);
          cursor:pointer; font-family:'Inter','DM Sans',system-ui,sans-serif; width:100%;
          letter-spacing:-0.1px;
          transition:background 0.15s, color 0.15s, border-color 0.15s !important;
        }
        .lay-theme-row:hover { background:rgba(255,255,255,0.09); color:rgba(255,255,255,0.9); border-color:rgba(255,255,255,0.13); }

        .lay-logout-btn {
          display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:12px;
          border:1px solid rgba(239,68,68,0.18); background:rgba(239,68,68,0.07);
          color:rgba(252,165,165,0.82); font-weight:500; font-size:13.5px;
          cursor:pointer; font-family:'Inter','DM Sans',system-ui,sans-serif; width:100%;
          letter-spacing:-0.1px;
          transition:background 0.15s, color 0.15s, border-color 0.15s !important;
        }
        .lay-logout-btn:hover { background:rgba(239,68,68,0.16); color:#fca5a5; border-color:rgba(239,68,68,0.32); }

        /* ── Main area ── */
        .lay-main { flex:1; min-width:0; display:flex; flex-direction:column; }

        .lay-topbar {
          height:64px;
          background:var(--lay-topbar-bg);
          border-bottom:1px solid var(--lay-topbar-bdr);
          backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
          display:flex; align-items:center; justify-content:space-between;
          padding:0 28px; position:sticky; top:0; z-index:30;
        }
        .lay-topbar-left  { display:flex; align-items:center; gap:14px; min-width:0; }
        .lay-topbar-right { display:flex; align-items:center; gap:8px; }
        .lay-top-title    { font-size:16px; font-weight:700; color:var(--lay-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:-0.3px; }

        .lay-menu-btn {
          display:none; border:1.5px solid var(--lay-border); background:var(--lay-surface);
          border-radius:10px; padding:8px; cursor:pointer; color:var(--lay-text-2);
          transition:background 0.15s, border-color 0.15s !important;
        }
        .lay-menu-btn:hover { background:var(--lay-muted); border-color:var(--lay-border-2); }

        .lay-date-pill {
          font-size:12px; color:var(--lay-text-3); background:var(--lay-muted);
          border:1px solid var(--lay-border); padding:5px 14px; border-radius:999px;
          font-weight:500; white-space:nowrap; letter-spacing:0.01em;
        }

        .lay-topbar-theme {
          width:36px; height:36px; border-radius:10px; background:var(--lay-muted);
          border:1.5px solid var(--lay-border); display:flex; align-items:center;
          justify-content:center; cursor:pointer; color:var(--lay-text-2);
          transition:background 0.15s, border-color 0.15s, color 0.15s !important;
        }
        .lay-topbar-theme:hover { background:var(--lay-muted-2); border-color:var(--lay-border-2); color:var(--lay-text); }

        .lay-top-avatar {
          width:36px; height:36px; border-radius:10px;
          background:${isAdmin ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "linear-gradient(135deg,#4f6ef7,#7c3aed)"};
          display:flex; align-items:center; justify-content:center;
          font-size:13.5px; font-weight:800; color:white; cursor:pointer; text-decoration:none;
          box-shadow:0 2px 10px rgba(99,102,241,0.28);
          transition:transform 0.15s, box-shadow 0.15s !important;
        }
        .lay-top-avatar:hover { transform:scale(1.07); box-shadow:0 4px 18px rgba(99,102,241,0.42); }

        .lay-bell-wrap { position:relative; }
        .lay-bell-btn {
          width:36px; height:36px; border-radius:10px; background:var(--lay-muted);
          border:1.5px solid var(--lay-border); display:flex; align-items:center;
          justify-content:center; cursor:pointer; color:var(--lay-text-2);
          transition:background 0.15s, border-color 0.15s, color 0.15s !important;
          position:relative;
        }
        .lay-bell-btn:hover { background:var(--lay-muted-2); border-color:var(--lay-border-2); color:var(--lay-text); }
        .lay-bell-badge {
          position:absolute; top:-5px; right:-5px; min-width:18px; height:18px; padding:0 4px;
          background:#ef4444; color:white; border-radius:999px; font-size:10px; font-weight:800;
          display:flex; align-items:center; justify-content:center; border:2px solid var(--lay-bg);
          line-height:1;
        }

        .lay-notif-panel {
          position:absolute; top:calc(100% + 10px); right:0; width:340px; max-width:calc(100vw - 24px);
          background:var(--lay-surface); border:1.5px solid var(--lay-border);
          border-radius:16px; box-shadow:0 20px 60px rgba(0,0,0,0.18);
          z-index:100; overflow:hidden;
        }
        .lay-notif-header {
          display:flex; justify-content:space-between; align-items:center;
          padding:14px 16px 12px; border-bottom:1px solid var(--lay-border);
        }
        .lay-notif-title { font-size:14px; font-weight:700; color:var(--lay-text); }
        .lay-notif-clear {
          font-size:12px; font-weight:600; color:var(--lay-text-3); background:none; border:none;
          cursor:pointer; padding:4px 8px; border-radius:6px;
          transition:background 0.15s, color 0.15s !important;
        }
        .lay-notif-clear:hover { background:var(--lay-muted); color:var(--lay-text-2); }
        .lay-notif-list { max-height:320px; overflow-y:auto; }
        .lay-notif-item {
          display:flex; align-items:flex-start; gap:10px; padding:12px 16px;
          border-bottom:1px solid var(--lay-border); transition:background 0.12s !important;
        }
        .lay-notif-item:last-child { border-bottom:none; }
        .lay-notif-item:hover { background:var(--lay-muted); }
        .lay-notif-icon { font-size:20px; flex-shrink:0; margin-top:1px; }
        .lay-notif-body { flex:1; min-width:0; }
        .lay-notif-ititle { font-size:13px; font-weight:700; color:var(--lay-text); margin:0 0 2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .lay-notif-msg { font-size:12px; color:var(--lay-text-2); margin:0; line-height:1.4; }
        .lay-notif-dismiss {
          background:none; border:none; cursor:pointer; color:var(--lay-text-3); font-size:14px;
          padding:2px 4px; border-radius:4px; flex-shrink:0; line-height:1;
          transition:color 0.12s, background 0.12s !important;
        }
        .lay-notif-dismiss:hover { background:var(--lay-muted-2); color:var(--lay-text); }
        .lay-notif-empty { padding:28px 16px; text-align:center; color:var(--lay-text-3); font-size:13px; }
        .lay-notif-perm {
          padding:12px 16px; border-top:1px solid var(--lay-border);
          display:flex; align-items:center; gap:8px;
        }
        .lay-notif-perm-btn {
          flex:1; padding:8px 12px; border-radius:8px; border:1.5px solid var(--lay-border);
          background:var(--lay-muted); color:var(--lay-text-2); font-size:12px; font-weight:600;
          cursor:pointer; transition:background 0.15s, color 0.15s !important;
        }
        .lay-notif-perm-btn:hover { background:var(--lay-muted-2); color:var(--lay-text); }

        .lay-admin-badge {
          font-size:11px; font-weight:700; color:#92400e;
          background:linear-gradient(135deg,#fef3c7,#fde68a); border:1px solid #fcd34d;
          border-radius:999px; padding:3px 11px; letter-spacing:0.02em;
        }
        [data-theme="dark"] .lay-admin-badge { color:#fbbf24; background:rgba(245,158,11,0.14); border-color:rgba(245,158,11,0.28); }

        .lay-content { flex:1; padding:28px; min-width:0; background:var(--lay-bg); }

        .lay-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:40; backdrop-filter:blur(4px); }

        @media(max-width:960px) {
          .lay-sidebar { position:fixed; top:0; left:0; height:100vh; z-index:50; transform:translateX(-100%); transition:transform 0.28s cubic-bezier(0.4,0,0.2,1) !important; width:272px; min-width:272px; }
          .lay-sidebar.open { transform:translateX(0); box-shadow:16px 0 48px rgba(0,0,0,0.45); }
          .lay-menu-btn { display:inline-flex; }
          .lay-overlay  { display:block; }
          .lay-date-pill { display:none; }
          .lay-topbar { padding:0 18px; }
          .lay-content { padding:18px 16px; }
        }
        @media(max-width:480px) {
          .lay-top-title { max-width:150px; }
          .lay-content { padding:14px 12px; }
        }
      `}</style>

      <div className="lay-shell">
        {sidebarOpen && <div className="lay-overlay" onClick={closeSidebar} />}

        <aside className={`lay-sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="lay-brand">
            <div className="lay-brand-logo">SC</div>
            <div>
              <div className="lay-brand-name">Smart Campus</div>
              <div className="lay-brand-sub">IAU Student Portal</div>
            </div>
          </div>

          <Link to="/profile" className="lay-user-chip" onClick={closeSidebar}>
            <div className="lay-avatar">{avatarLetter}</div>
            <div style={{ overflow: "hidden", minWidth: 0, flex: 1 }}>
              <div className="lay-user-name">{userName}</div>
              {isAdmin
                ? <div className="lay-role-badge">ADMIN</div>
                : <div className="lay-user-sub">Tap to edit profile</div>
              }
            </div>
          </Link>

          <div className="lay-nav-label">Menu</div>
          <nav className="lay-nav">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`lay-nav-link${location.pathname === item.path ? " active" : ""}`}
                onClick={closeSidebar}
              >
                <i className="lay-nav-icon"><NavIcon type={item.icon} /></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="lay-spacer" />
          <div className="lay-divider" />

          <div className="lay-bottom">
            <button className="lay-theme-row" onClick={toggleTheme}>
              <i className="lay-nav-icon"><NavIcon type={dark ? "SUN" : "MOON"} /></i>
              <span>{dark ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <div className="lay-divider" style={{ margin: "4px 0" }} />
            <Link
              to="/profile"
              className={`lay-bottom-btn${location.pathname === "/profile" ? " active" : ""}`}
              onClick={closeSidebar}
            >
              <i className="lay-nav-icon"><NavIcon type="PROF" /></i>
              <span>Profile</span>
            </Link>
            <button className="lay-logout-btn" onClick={handleLogout}>
              <i className="lay-nav-icon"><NavIcon type="OUT" /></i>
              <span>Log out</span>
            </button>
          </div>
        </aside>

        <main className="lay-main">
          <header className="lay-topbar">
            <div className="lay-topbar-left">
              <button className="lay-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <NavIcon type="MENU" size={18} />
              </button>
              <span className="lay-top-title">{pageTitle}</span>
            </div>
            <div className="lay-topbar-right">
              {isAdmin && <span className="lay-admin-badge">🛡 Admin</span>}
              <span className="lay-date-pill">
                {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
              <button className="lay-topbar-theme" onClick={toggleTheme} aria-label="Toggle theme">
                <NavIcon type={dark ? "SUN" : "MOON"} size={16} />
              </button>
              <div className="lay-bell-wrap" ref={bellRef}>
                <button
                  className="lay-bell-btn"
                  onClick={() => setBellOpen(o => !o)}
                  aria-label="Notifications"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:17,height:17}}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {notifications.filter(n => !dismissedIds.has(n.id)).length > 0 && (
                    <span className="lay-bell-badge">
                      {notifications.filter(n => !dismissedIds.has(n.id)).length}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <div className="lay-notif-panel">
                    <div className="lay-notif-header">
                      <span className="lay-notif-title">Notifications</span>
                      {notifications.filter(n => !dismissedIds.has(n.id)).length > 0 && (
                        <button
                          className="lay-notif-clear"
                          onClick={() => setDismissedIds(new Set(notifications.map(n => n.id)))}
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="lay-notif-list">
                      {notifications.filter(n => !dismissedIds.has(n.id)).length === 0 ? (
                        <div className="lay-notif-empty">No new notifications</div>
                      ) : (
                        notifications.filter(n => !dismissedIds.has(n.id)).map(n => (
                          <div key={n.id} className="lay-notif-item">
                            <span className="lay-notif-icon">
                              {n.type === "CLASS" ? "🎓" : n.type === "TASK" ? "📋" : "🚗"}
                            </span>
                            <div className="lay-notif-body">
                              <p className="lay-notif-ititle">{n.title}</p>
                              <p className="lay-notif-msg">{n.message}</p>
                            </div>
                            <button
                              className="lay-notif-dismiss"
                              onClick={() => setDismissedIds(prev => new Set([...prev, n.id]))}
                              aria-label="Dismiss"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    {browserPermission !== "granted" && (
                      <div className="lay-notif-perm">
                        <button className="lay-notif-perm-btn" onClick={requestBrowserPermission}>
                          🔔 Enable browser notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Link to="/profile" className="lay-top-avatar">{avatarLetter}</Link>
            </div>
          </header>

          <div className="lay-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
