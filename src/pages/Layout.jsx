import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const STUDENT_NAV = [
  { path: "/dashboard",  label: "Dashboard",  icon: "⊞" },
  { path: "/tasks",      label: "Tasks",       icon: "✓" },
  { path: "/schedule",   label: "Schedule",    icon: "🗓" },
  { path: "/parking",    label: "Parking",     icon: "P" },
  { path: "/classrooms", label: "Classrooms",  icon: "⌂" },
];

const ADMIN_NAV = [
  { path: "/admin/parking", label: "Parking Admin", icon: "🛡" },
];

const ALL_NAV = [...STUDENT_NAV, ...ADMIN_NAV, { path: "/profile", label: "Profile", icon: "👤" }];

export default function Layout() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const userName   = localStorage.getItem("userName");
  const userRole   = localStorage.getItem("userRole");
  const userAvatar = localStorage.getItem("userAvatar") || null;
  const isAdmin    = userRole === "ADMIN";

  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e) => {
      if (!e.target.closest(".sc-sidebar") && !e.target.closest(".sc-hamburger")) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [mobileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  const avatarDisplay = userAvatar || (userName || "S")[0].toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }

        .sc-wrapper { display:flex; min-height:100vh; background:#f1f5f9; font-family:'DM Sans',system-ui,sans-serif; }

        /* Overlay */
        .sc-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:150; }
        .sc-overlay.open { display:block; }

        /* Sidebar */
        .sc-sidebar {
          width:240px; min-width:240px;
          background:linear-gradient(180deg,#0f172a 0%,#1e293b 100%);
          display:flex; flex-direction:column; justify-content:space-between;
          padding:20px 12px; transition:width 0.25s ease, min-width 0.25s ease;
          position:sticky; top:0; height:100vh; overflow:hidden; z-index:100;
        }

        @media(max-width:768px) {
          .sc-sidebar {
            position:fixed; top:0; left:0;
            width:260px !important; min-width:260px !important;
            height:100vh; transform:translateX(-100%);
            transition:transform 0.28s ease;
            z-index:200; box-shadow:4px 0 20px rgba(0,0,0,0.3);
          }
          .sc-sidebar.mobile-open { transform:translateX(0); }
        }

        .sc-brand-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; min-height:36px; gap:8px; }
        .sc-brand-text { font-size:17px; font-weight:800; color:white; white-space:nowrap; letter-spacing:-0.3px; flex:1; overflow:hidden; }
        .sc-toggle-btn { background:rgba(255,255,255,0.08); border:none; color:#94a3b8; width:30px; height:30px; min-width:30px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:13px; transition:background 0.15s,color 0.15s; font-family:monospace; }
        .sc-toggle-btn:hover { background:rgba(255,255,255,0.14); color:white; }
        @media(max-width:768px) { .sc-toggle-btn { display:none !important; } }

        .sc-user-chip { display:flex; align-items:center; gap:10px; padding:10px 8px; border-radius:12px; background:rgba(255,255,255,0.06); margin-bottom:20px; overflow:hidden; min-height:52px; cursor:pointer; transition:background 0.15s; }
        .sc-user-chip:hover { background:rgba(255,255,255,0.10); }
        .sc-avatar { width:32px; height:32px; min-width:32px; border-radius:10px; background:${isAdmin?"#f59e0b":"#2563eb"}; color:white; font-weight:700; font-size:${userAvatar?"20px":"14px"}; display:flex; align-items:center; justify-content:center; }
        .sc-user-info { overflow:hidden; min-width:0; }
        .sc-user-name { font-size:13px; font-weight:600; color:#e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sc-user-sub { font-size:10px; color:#64748b; }
        .sc-role-badge { font-size:10px; font-weight:700; color:#f59e0b; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); border-radius:999px; padding:2px 8px; white-space:nowrap; display:inline-block; margin-top:2px; }

        .sc-nav-section-label { font-size:10px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.08em; padding:8px 10px 4px; white-space:nowrap; }
        .sc-nav-divider { height:1px; background:rgba(255,255,255,0.07); margin:8px 0; }

        .sc-nav-link { display:flex; align-items:center; gap:12px; padding:11px 10px; border-radius:12px; text-decoration:none; color:#94a3b8; font-weight:600; font-size:14px; margin-bottom:4px; transition:background 0.15s,color 0.15s; white-space:nowrap; overflow:hidden; }
        .sc-nav-link:hover { background:rgba(255,255,255,0.08); color:#e2e8f0; }
        .sc-nav-link.sc-active { background:#2563eb; color:white; box-shadow:0 4px 14px rgba(37,99,235,0.35); }
        .sc-nav-link.sc-admin-link:hover { background:rgba(245,158,11,0.10); color:#fbbf24; }
        .sc-nav-link.sc-admin-active { background:rgba(245,158,11,0.18); color:#fbbf24; }
        .sc-nav-icon { width:22px; min-width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-size:16px; font-style:normal; }

        .sc-bottom-actions { display:flex; flex-direction:column; gap:6px; }
        .sc-profile-btn { display:flex; align-items:center; gap:10px; width:100%; padding:11px 10px; border-radius:12px; border:none; background:rgba(255,255,255,0.05); color:#94a3b8; font-weight:600; font-size:14px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s,color 0.15s; white-space:nowrap; overflow:hidden; text-decoration:none; }
        .sc-profile-btn:hover { background:rgba(255,255,255,0.10); color:#e2e8f0; }
        .sc-profile-btn.sc-active { background:rgba(255,255,255,0.12); color:white; }
        .sc-logout-btn { display:flex; align-items:center; gap:10px; width:100%; padding:11px 10px; border-radius:12px; border:none; background:rgba(239,68,68,0.12); color:#fca5a5; font-weight:600; font-size:14px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s,color 0.15s; white-space:nowrap; overflow:hidden; }
        .sc-logout-btn:hover { background:rgba(239,68,68,0.22); color:#f87171; }

        /* Main */
        .sc-main { flex:1; min-width:0; display:flex; flex-direction:column; }

        /* Topbar */
        .sc-topbar { background:white; border-bottom:1px solid #e2e8f0; padding:0 20px; height:56px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:50; flex-shrink:0; }
        .sc-topbar-left { display:flex; align-items:center; gap:12px; }
        .sc-page-title { font-size:15px; font-weight:700; color:#0f172a; }
        .sc-topbar-right { display:flex; align-items:center; gap:8px; }

        /* Hamburger - mobile only */
        .sc-hamburger { display:none; background:none; border:none; cursor:pointer; padding:6px; border-radius:8px; color:#374151; transition:background 0.15s; align-items:center; justify-content:center; }
        .sc-hamburger:hover { background:#f1f5f9; }
        @media(max-width:768px) { .sc-hamburger { display:flex; } }

        .sc-admin-topbadge { font-size:11px; font-weight:700; color:#92400e; background:#fef3c7; border:1px solid #fde68a; border-radius:999px; padding:3px 10px; }
        .sc-date-badge { font-size:12px; color:#64748b; background:#f1f5f9; padding:5px 12px; border-radius:999px; font-weight:500; white-space:nowrap; }
        @media(max-width:480px) { .sc-date-badge { display:none; } }

        .sc-topbar-avatar { width:32px; height:32px; border-radius:10px; background:${isAdmin?"#f59e0b":"#2563eb"}; color:white; font-size:${userAvatar?"18px":"13px"}; font-weight:700; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform 0.15s,box-shadow 0.15s; text-decoration:none; }
        .sc-topbar-avatar:hover { transform:scale(1.08); box-shadow:0 4px 12px rgba(0,0,0,0.15); }

        .sc-content { flex:1; padding:20px; overflow-y:auto; }
        @media(max-width:480px) { .sc-content { padding:14px 12px; } }
      `}</style>

      {/* Mobile overlay */}
      <div className={`sc-overlay${mobileOpen ? " open" : ""}`} onClick={() => setMobileOpen(false)} />

      <div className="sc-wrapper">

        {/* ── Sidebar ── */}
        <aside className={`sc-sidebar${mobileOpen ? " mobile-open" : ""}`}>
          <div>
            <div className="sc-brand-row">
              <span className="sc-brand-text">Smart Campus</span>
              <button className="sc-toggle-btn" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? "»" : "«"}
              </button>
            </div>

            <div className="sc-user-chip" onClick={() => navigate("/profile")}>
              <div className="sc-avatar">{avatarDisplay}</div>
              <div className="sc-user-info">
                <div className="sc-user-name">{userName || "Student"}</div>
                {isAdmin
                  ? <div className="sc-role-badge">ADMIN</div>
                  : <div className="sc-user-sub">Tap to edit profile</div>
                }
              </div>
            </div>

            <nav>
              <div className="sc-nav-section-label">Menu</div>
              {STUDENT_NAV.map(({ path, label, icon }) => (
                <Link key={path} to={path} className={`sc-nav-link${location.pathname === path ? " sc-active" : ""}`}>
                  <i className="sc-nav-icon">{icon}</i>
                  <span>{label}</span>
                </Link>
              ))}
              {isAdmin && (
                <>
                  <div className="sc-nav-divider" />
                  <div className="sc-nav-section-label">Admin</div>
                  {ADMIN_NAV.map(({ path, label, icon }) => (
                    <Link key={path} to={path} className={`sc-nav-link sc-admin-link${location.pathname === path ? " sc-admin-active" : ""}`}>
                      <i className="sc-nav-icon">{icon}</i>
                      <span>{label}</span>
                    </Link>
                  ))}
                </>
              )}
            </nav>
          </div>

          <div className="sc-bottom-actions">
            <Link to="/profile" className={`sc-profile-btn${location.pathname === "/profile" ? " sc-active" : ""}`}>
              <i className="sc-nav-icon">👤</i>
              <span>Profile</span>
            </Link>
            <button className="sc-logout-btn" onClick={handleLogout}>
              <i className="sc-nav-icon">⎋</i>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="sc-main">
          <div className="sc-topbar">
            <div className="sc-topbar-left">
              <button className="sc-hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="6"  x2="21" y2="6"  />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <span className="sc-page-title">
                {ALL_NAV.find((n) => n.path === location.pathname)?.label ?? "Smart Campus"}
              </span>
            </div>
            <div className="sc-topbar-right">
              {isAdmin && <span className="sc-admin-topbadge">🛡 Admin</span>}
              <span className="sc-date-badge">
                {new Date().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}
              </span>
              <Link to="/profile" className="sc-topbar-avatar">{avatarDisplay}</Link>
            </div>
          </div>
          <div className="sc-content">
            <Outlet />
          </div>
        </div>

      </div>
    </>
  );
}