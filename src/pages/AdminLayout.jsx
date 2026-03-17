import { Outlet, useNavigate, useLocation } from "react-router-dom";

const ADMIN_NAV = [
  { path: "/admin/parking", label: "Parking Control", icon: "🅿" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("adminAuthTime");
    navigate("/admin/login");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .adm-layout { display:flex; min-height:100vh; background:#f1f5f9; font-family:'DM Sans',system-ui,sans-serif; }
        .adm-sidebar { width:220px; min-width:220px; background:linear-gradient(180deg,#0a0f1e 0%,#111827 100%); display:flex; flex-direction:column; justify-content:space-between; padding:20px 12px; box-sizing:border-box; position:sticky; top:0; height:100vh; }
        .adm-brand { display:flex; align-items:center; gap:10px; margin-bottom:6px; }
        .adm-logo { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#f59e0b,#d97706); color:white; font-weight:800; font-size:14px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(245,158,11,0.35); }
        .adm-brand-text { font-size:15px; font-weight:800; color:white; }
        .adm-badge { font-size:10px; font-weight:700; color:#fbbf24; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.25); border-radius:999px; padding:3px 8px; margin-bottom:20px; display:inline-block; }
        .adm-nav-link { display:flex; align-items:center; gap:12px; padding:11px 10px; border-radius:12px; text-decoration:none; color:#94a3b8; font-weight:600; font-size:14px; margin-bottom:4px; transition:background 0.15s,color 0.15s; white-space:nowrap; }
        .adm-nav-link:hover { background:rgba(245,158,11,0.10); color:#fbbf24; }
        .adm-nav-link.active { background:rgba(245,158,11,0.18); color:#fbbf24; }
        .adm-nav-icon { width:22px; min-width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-size:16px; font-style:normal; }
        .adm-logout { display:flex; align-items:center; gap:10px; width:100%; padding:11px 10px; border-radius:12px; border:none; background:rgba(239,68,68,0.12); color:#fca5a5; font-weight:600; font-size:14px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s,color 0.15s; }
        .adm-logout:hover { background:rgba(239,68,68,0.22); color:#f87171; }
        .adm-main { flex:1; min-width:0; display:flex; flex-direction:column; }
        .adm-topbar { background:white; border-bottom:1px solid #e2e8f0; padding:0 28px; height:56px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:50; flex-shrink:0; }
        .adm-content { flex:1; padding:28px; overflow-y:auto; }
      `}</style>

      <div className="adm-layout">
        <aside className="adm-sidebar">
          <div>
            <div className="adm-brand">
              <div className="adm-logo">SC</div>
              <span className="adm-brand-text">Admin Panel</span>
            </div>
            <div className="adm-badge">🛡 ADMINISTRATOR</div>

            <nav>
              {ADMIN_NAV.map(({ path, label, icon }) => (
                <a
                  key={path}
                  href={path}
                  className={`adm-nav-link${location.pathname === path ? " active" : ""}`}
                >
                  <i className="adm-nav-icon">{icon}</i>
                  <span>{label}</span>
                </a>
              ))}
            </nav>
          </div>

          <button className="adm-logout" onClick={handleLogout}>
            <i className="adm-nav-icon">⎋</i>
            <span>Sign Out</span>
          </button>
        </aside>

        <div className="adm-main">
          <div className="adm-topbar">
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <span style={{ fontSize:"15px", fontWeight:"700", color:"#0f172a" }}>
                {ADMIN_NAV.find((n) => n.path === location.pathname)?.label ?? "Admin"}
              </span>
              <span style={{ fontSize:"11px", fontWeight:"700", color:"#92400e", background:"#fef3c7", border:"1px solid #fde68a", borderRadius:"999px", padding:"3px 10px" }}>
                🛡 Admin
              </span>
            </div>
            <span style={{ fontSize:"12px", color:"#64748b", background:"#f1f5f9", padding:"5px 12px", borderRadius:"999px", fontWeight:"500" }}>
              {new Date().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric", year:"numeric" })}
            </span>
          </div>

          <div className="adm-content">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}