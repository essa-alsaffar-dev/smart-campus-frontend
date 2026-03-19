import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: "⊞" },
  { path: "/tasks", label: "Tasks", icon: "✓" },
  { path: "/schedule", label: "Schedule", icon: "🗓" },
  { path: "/parking", label: "Parking", icon: "P" },
  { path: "/classrooms", label: "Classrooms", icon: "⌂" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const userName = localStorage.getItem("userName") || "Student";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div style={page}>
      <style>{`
        * { box-sizing: border-box; }

        .sc-layout-shell {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: #f8fafc;
        }

        .sc-sidebar {
          width: 270px;
          min-width: 270px;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          color: white;
          display: flex;
          flex-direction: column;
          padding: 20px 16px;
          border-right: 1px solid rgba(255,255,255,0.08);
        }

        .sc-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
          padding: 6px 8px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .sc-brand-logo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 16px;
          box-shadow: 0 6px 18px rgba(37,99,235,0.35);
        }

        .sc-brand-text {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.3px;
        }

        .sc-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }

        .sc-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          text-decoration: none;
          color: rgba(255,255,255,0.82);
          font-weight: 600;
          transition: background 0.18s, transform 0.12s, color 0.18s;
        }

        .sc-nav-link:hover {
          background: rgba(255,255,255,0.08);
          color: white;
          transform: translateX(2px);
        }

        .sc-nav-link.active {
          background: rgba(37,99,235,0.22);
          color: white;
          border: 1px solid rgba(96,165,250,0.28);
        }

        .sc-spacer {
          flex: 1;
        }

        .sc-user-box {
          margin-top: 18px;
          padding: 14px;
          border-radius: 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .sc-user-name {
          font-size: 14px;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
          word-break: break-word;
        }

        .sc-user-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.58);
        }

        .sc-logout-btn {
          width: 100%;
          margin-top: 12px;
          border: none;
          border-radius: 10px;
          padding: 10px 12px;
          background: #ef4444;
          color: white;
          font-weight: 700;
          cursor: pointer;
          transition: filter 0.15s;
        }

        .sc-logout-btn:hover {
          filter: brightness(1.05);
        }

        .sc-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .sc-topbar {
          height: 68px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .sc-topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .sc-menu-btn {
          display: none;
          border: 1px solid #dbe2ea;
          background: white;
          border-radius: 10px;
          padding: 8px 10px;
          cursor: pointer;
          font-size: 18px;
        }

        .sc-top-title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sc-top-user {
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          white-space: nowrap;
        }

        .sc-content {
          flex: 1;
          padding: 20px;
          min-width: 0;
        }

        .sc-mobile-overlay {
          display: none;
        }

        @media (max-width: 900px) {
          .sc-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.22s ease;
            width: 280px;
            min-width: 280px;
            max-width: 85vw;
          }

          .sc-sidebar.open {
            transform: translateX(0);
          }

          .sc-menu-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .sc-mobile-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(15,23,42,0.45);
            z-index: 40;
          }

          .sc-content {
            padding: 16px;
          }

          .sc-topbar {
            padding: 0 14px;
          }

          .sc-top-user {
            display: none;
          }
        }
      `}</style>

      <div className="sc-layout-shell">
        {sidebarOpen && (
          <div className="sc-mobile-overlay" onClick={closeSidebar} />
        )}

        <aside className={`sc-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sc-brand">
            <div className="sc-brand-logo">SC</div>
            <div className="sc-brand-text">Smart Campus</div>
          </div>

          <nav className="sc-nav">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sc-nav-link ${active ? "active" : ""}`}
                  onClick={closeSidebar}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="sc-spacer" />

          <div className="sc-user-box">
            <div className="sc-user-name">{userName}</div>
            <div className="sc-user-sub">Logged in</div>
            <button className="sc-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        <main className="sc-main">
          <header className="sc-topbar">
            <div className="sc-topbar-left">
              <button
                className="sc-menu-btn"
                onClick={() => setSidebarOpen(true)}
                type="button"
              >
                ☰
              </button>

              <div className="sc-top-title">
                {NAV_ITEMS.find((i) => i.path === location.pathname)?.label || "Smart Campus"}
              </div>
            </div>

            <div className="sc-top-user">{userName}</div>
          </header>

          <div className="sc-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

const page = {
  minHeight: "100vh",
  width: "100%",
  background: "#f8fafc",
};