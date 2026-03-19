import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/dashboard",  label: "Dashboard",  icon: "⊞" },
  { path: "/tasks",      label: "Tasks",       icon: "✓" },
  { path: "/schedule",   label: "Schedule",    icon: "🗓" },
  { path: "/parking",    label: "Parking",     icon: "P" },
  { path: "/classrooms", label: "Classrooms",  icon: "⌂" },
];

const ALL_NAV = [...NAV_ITEMS, { path: "/profile", label: "Profile", icon: "👤" }];

export default function Layout() {
  const location = useLocation();
  const navigate  = useNavigate();

  const userName   = localStorage.getItem("userName")  || "Student";
  const userAvatar = localStorage.getItem("userAvatar") || null;
  const userRole   = localStorage.getItem("userRole")   || "";
  const isAdmin    = userRole === "ADMIN";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    ["token","userName","userRole","userEmail","userAvatar"].forEach(k => localStorage.removeItem(k));
    navigate("/");
  };

  const closeSidebar = () => setSidebarOpen(false);
  const avatarDisplay = userAvatar || (userName || "S")[0].toUpperCase();
  const pageTitle = ALL_NAV.find(i => i.path === location.pathname)?.label ?? "Smart Campus";

  return (
    <div style={{ minHeight:"100vh", width:"100%", background:"#f8fafc" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .sc-shell { display:flex; min-height:100vh; width:100%; background:#f8fafc; font-family:'DM Sans',system-ui,sans-serif; }

        /* ── Sidebar ── */
        .sc-sidebar {
          width:260px; min-width:260px;
          background:linear-gradient(180deg,#0f172a 0%,#1e293b 100%);
          display:flex; flex-direction:column;
          padding:20px 14px; border-right:1px solid rgba(255,255,255,0.07);
          position:sticky; top:0; height:100vh; overflow-y:auto;
        }

        .sc-brand { display:flex; align-items:center; gap:12px; margin-bottom:22px; padding-bottom:18px; border-bottom:1px solid rgba(255,255,255,0.08); }
        .sc-brand-logo { width:40px; height:40px; border-radius:11px; background:linear-gradient(135deg,#2563eb,#1d4ed8); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:15px; color:white; box-shadow:0 4px 14px rgba(37,99,235,0.35); flex-shrink:0; }
        .sc-brand-text { font-size:17px; font-weight:800; color:white; letter-spacing:-0.3px; }

        .sc-user-chip { display:flex; align-items:center; gap:10px; padding:10px 10px; border-radius:12px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); margin-bottom:20px; cursor:pointer; transition:background 0.15s; text-decoration:none; }
        .sc-user-chip:hover { background:rgba(255,255,255,0.10); }
        .sc-avatar { width:34px; height:34px; min-width:34px; border-radius:10px; background:${isAdmin?"#f59e0b":"#2563eb"}; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:700; color:white; }
        .sc-user-info { overflow:hidden; min-width:0; }
        .sc-user-name { font-size:13px; font-weight:700; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sc-user-sub { font-size:11px; color:rgba(255,255,255,0.45); }
        .sc-role-badge { font-size:10px; font-weight:700; color:#fbbf24; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); border-radius:999px; padding:2px 7px; margin-top:2px; display:inline-block; }

        .sc-section-label { font-size:10px; font-weight:700; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.08em; padding:0 10px; margin-bottom:6px; }
        .sc-nav { display:flex; flex-direction:column; gap:3px; }

        .sc-nav-link { display:flex; align-items:center; gap:12px; padding:11px 12px; border-radius:11px; text-decoration:none; color:rgba(255,255,255,0.70); font-weight:600; font-size:14px; transition:background 0.15s,color 0.15s; }
        .sc-nav-link:hover { background:rgba(255,255,255,0.08); color:white; }
        .sc-nav-link.active { background:rgba(37,99,235,0.25); color:white; border:1px solid rgba(96,165,250,0.25); }

        .sc-nav-icon { width:20px; min-width:20px; text-align:center; font-size:15px; font-style:normal; }
        .sc-divider { height:1px; background:rgba(255,255,255,0.07); margin:10px 0; }

        .sc-spacer { flex:1; }

        .sc-bottom { display:flex; flex-direction:column; gap:4px; }
        .sc-profile-btn { display:flex; align-items:center; gap:12px; padding:11px 12px; border-radius:11px; text-decoration:none; color:rgba(255,255,255,0.70); font-weight:600; font-size:14px; transition:background 0.15s,color 0.15s; border:none; background:none; cursor:pointer; font-family:'DM Sans'; width:100%; }
        .sc-profile-btn:hover { background:rgba(255,255,255,0.08); color:white; }
        .sc-profile-btn.active { background:rgba(37,99,235,0.25); color:white; }

        .sc-logout-btn { display:flex; align-items:center; gap:12px; width:100%; padding:11px 12px; border-radius:11px; border:none; background:rgba(239,68,68,0.13); color:#fca5a5; font-weight:600; font-size:14px; cursor:pointer; font-family:'DM Sans'; transition:background 0.15s,color 0.15s; }
        .sc-logout-btn:hover { background:rgba(239,68,68,0.22); color:#f87171; }

        /* ── Main ── */
        .sc-main { flex:1; min-width:0; display:flex; flex-direction:column; }

        .sc-topbar { height:60px; background:white; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; padding:0 20px; position:sticky; top:0; z-index:20; }
        .sc-topbar-left { display:flex; align-items:center; gap:12px; min-width:0; }
        .sc-top-title { font-size:16px; font-weight:800; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        .sc-topbar-right { display:flex; align-items:center; gap:8px; }
        .sc-date-badge { font-size:12px; color:#64748b; background:#f1f5f9; padding:5px 12px; border-radius:999px; font-weight:500; white-space:nowrap; }
        .sc-avatar-btn { width:34px; height:34px; border-radius:10px; background:${isAdmin?"#f59e0b":"#2563eb"}; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:700; color:white; cursor:pointer; text-decoration:none; transition:transform 0.15s,box-shadow 0.15s; }
        .sc-avatar-btn:hover { transform:scale(1.08); box-shadow:0 4px 12px rgba(0,0,0,0.15); }
        .sc-admin-badge { font-size:11px; font-weight:700; color:#92400e; background:#fef3c7; border:1px solid #fde68a; border-radius:999px; padding:3px 10px; }

        .sc-menu-btn { display:none; border:1px solid #e2e8f0; background:white; border-radius:10px; padding:8px 10px; cursor:pointer; font-size:18px; transition:background 0.15s; }
        .sc-menu-btn:hover { background:#f8fafc; }

        .sc-content { flex:1; padding:20px; min-width:0; overflow-y:auto; }

        .sc-overlay { display:none; position:fixed; inset:0; background:rgba(15,23,42,0.5); z-index:40; }

        @media(max-width:900px) {
          .sc-sidebar { position:fixed; top:0; left:0; height:100vh; z-index:50; transform:translateX(-100%); transition:transform 0.25s ease; width:280px; min-width:280px; }
          .sc-sidebar.open { transform:translateX(0); box-shadow:4px 0 24px rgba(0,0,0,0.25); }
          .sc-menu-btn { display:inline-flex; align-items:center; justify-content:center; }
          .sc-overlay { display:block; }
          .sc-date-badge { display:none; }
          .sc-content { padding:14px 12px; }
        }
      `}</style>

      <div className="sc-shell">
        {sidebarOpen && <div className="sc-overlay" onClick={closeSidebar} />}

        <aside className={`sc-sidebar${sidebarOpen ? " open" : ""}`}>
          {/* Brand */}
          <div className="sc-brand">
            <div className="sc-brand-logo">SC</div>
            <div className="sc-brand-text">Smart Campus</div>
          </div>

          {/* User chip → profile */}
          <Link to="/profile" className="sc-user-chip" onClick={closeSidebar}>
            <div className="sc-avatar">{avatarDisplay}</div>
            <div className="sc-user-info">
              <div className="sc-user-name">{userName}</div>
              {isAdmin
                ? <div className="sc-role-badge">ADMIN</div>
                : <div className="sc-user-sub">Tap to edit profile</div>
              }
            </div>
          </Link>

          {/* Nav */}
          <div className="sc-section-label">Menu</div>
          <nav className="sc-nav">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`sc-nav-link${location.pathname === item.path ? " active" : ""}`}
                onClick={closeSidebar}
              >
                <i className="sc-nav-icon">{item.icon}</i>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="sc-spacer" />

          {/* Bottom actions */}
          <div className="sc-bottom">
            <div className="sc-divider" />
            <Link
              to="/profile"
              className={`sc-profile-btn${location.pathname === "/profile" ? " active" : ""}`}
              onClick={closeSidebar}
            >
              <i className="sc-nav-icon">👤</i>
              <span>Profile</span>
            </Link>
            <button className="sc-logout-btn" onClick={handleLogout}>
              <i className="sc-nav-icon">⎋</i>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="sc-main">
          <header className="sc-topbar">
            <div className="sc-topbar-left">
              <button className="sc-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
              <div className="sc-top-title">{pageTitle}</div>
            </div>
            <div className="sc-topbar-right">
              {isAdmin && <span className="sc-admin-badge">🛡 Admin</span>}
              <span className="sc-date-badge">
                {new Date().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}
              </span>
              <Link to="/profile" className="sc-avatar-btn" onClick={closeSidebar}>{avatarDisplay}</Link>
            </div>
          </header>
          <div className="sc-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}