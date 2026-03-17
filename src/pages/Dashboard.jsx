import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

const NAV_CARDS = [
  {
    path: "/tasks",
    icon: "✓",
    title: "Tasks",
    desc: "Track assignments, deadlines, and exam preparation.",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    path: "/schedule",
    icon: "🗓",
    title: "Schedule",
    desc: "View your weekly classes and organize your study time.",
    color: "#9333ea",
    bg: "#fdf4ff",
    border: "#e9d5ff",
  },
  {
    path: "/parking",
    icon: "🅿",
    title: "Parking",
    desc: "Check real-time spot availability across all campus zones.",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  {
    path: "/classrooms",
    icon: "⌂",
    title: "Classrooms",
    desc: "Find rooms, buildings, and campus locations instantly.",
    color: "#ea580c",
    bg: "#fff7ed",
    border: "#fed7aa",
  },
];

// Weekday name matching
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Dashboard() {
  const navigate  = useNavigate();
  const userName  = localStorage.getItem("userName");
  const userKey   = userName || "guest";

  // ── Live stats from localStorage ──
  const stats = useMemo(() => {
    try {
      const tasks    = JSON.parse(localStorage.getItem(`tasks_v2_${userKey}`)    || "[]");
      const schedule = JSON.parse(localStorage.getItem(`schedule_${userKey}`)    || "[]");
      const parking  = JSON.parse(localStorage.getItem("parking_zones_v2")       || "null");

      const activeTasks  = tasks.filter((t) => !t.completed).length;
      const overdueTasks = tasks.filter((t) => {
        if (!t.dueDate || t.completed) return false;
        return new Date(t.dueDate) < new Date(new Date().toDateString());
      }).length;

      const todayName    = DAYS[new Date().getDay()];
      const todayClasses = schedule.filter((s) => s.day === todayName).length;
      const totalClasses = schedule.length;

      let availableSpots = null;
      if (parking) {
        availableSpots = parking.reduce((sum, z) => sum + (z.total - z.occupied), 0);
      }

      return { activeTasks, overdueTasks, todayClasses, totalClasses, availableSpots };
    } catch {
      return { activeTasks: 0, overdueTasks: 0, todayClasses: 0, totalClasses: 0, availableSpots: null };
    }
  }, [userKey]);

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div style={page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .sc-nav-card {
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          cursor: pointer;
        }
        .sc-nav-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(15,23,42,0.12);
        }
        .sc-nav-card:active { transform: translateY(-2px); }

        .sc-stat-card {
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .sc-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(15,23,42,0.10);
        }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .sc-f1 { animation: fadeUp 0.4s ease 0.00s both; }
        .sc-f2 { animation: fadeUp 0.4s ease 0.08s both; }
        .sc-f3 { animation: fadeUp 0.4s ease 0.16s both; }
        .sc-f4 { animation: fadeUp 0.4s ease 0.24s both; }

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .sc-overdue-dot { animation: pulse 1.6s ease-in-out infinite; }
      `}</style>

      {/* ── Header ── */}
      <div className="sc-f1" style={headerSection}>
        <div style={headerLeft}>
          <p style={greetLabel}>{greeting} 👋</p>
          <h1 style={heroName}>
            {userName ? userName : "Student"}
          </h1>
          <p style={heroDate}>{today}</p>
        </div>
        <div style={heroBadge}>
          <div style={heroBadgeIcon}>SC</div>
          <div>
            <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>Smart Campus</div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>IAU · Building A11</div>
          </div>
        </div>
      </div>

      {/* ── Live Stats ── */}
      <div className="sc-f2" style={statsGrid}>

        <div className="sc-stat-card" style={{ ...statCard, borderColor: "#bfdbfe" }}
          onClick={() => navigate("/tasks")} style2={{ cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={statLabel}>Active Tasks</p>
              <p style={{ ...statValue, color: "#2563eb" }}>{stats.activeTasks}</p>
            </div>
            <div style={{ ...statIcon, background: "#eff6ff", color: "#2563eb" }}>✓</div>
          </div>
          {stats.overdueTasks > 0 && (
            <div style={overduePill}>
              <span className="sc-overdue-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
              &nbsp;{stats.overdueTasks} overdue
            </div>
          )}
        </div>

        <div className="sc-stat-card" style={{ ...statCard, borderColor: "#e9d5ff", cursor: "pointer" }}
          onClick={() => navigate("/schedule")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={statLabel}>Today's Classes</p>
              <p style={{ ...statValue, color: "#9333ea" }}>{stats.todayClasses}</p>
            </div>
            <div style={{ ...statIcon, background: "#fdf4ff", color: "#9333ea" }}>🗓</div>
          </div>
          <p style={statSub}>{stats.totalClasses} total this week</p>
        </div>

        <div className="sc-stat-card" style={{ ...statCard, borderColor: "#a7f3d0", cursor: "pointer" }}
          onClick={() => navigate("/parking")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={statLabel}>Available Spots</p>
              <p style={{ ...statValue, color: "#059669" }}>
                {stats.availableSpots !== null ? stats.availableSpots : "—"}
              </p>
            </div>
            <div style={{ ...statIcon, background: "#ecfdf5", color: "#059669" }}>🅿</div>
          </div>
          <p style={statSub}>Across all campus zones</p>
        </div>

        <div className="sc-stat-card" style={{ ...statCard, borderColor: "#fed7aa", cursor: "pointer" }}
          onClick={() => navigate("/classrooms")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={statLabel}>Classrooms</p>
              <p style={{ ...statValue, color: "#ea580c" }}>170+</p>
            </div>
            <div style={{ ...statIcon, background: "#fff7ed", color: "#ea580c" }}>⌂</div>
          </div>
          <p style={statSub}>Building A11 — searchable</p>
        </div>

      </div>

      {/* ── Quick Access ── */}
      <div className="sc-f3" style={sectionHead}>
        <h2 style={sectionTitle}>Quick Access</h2>
        <p style={sectionSub}>Jump to any service</p>
      </div>

      <div className="sc-f3" style={navGrid}>
        {NAV_CARDS.map((c) => (
          <div
            key={c.path}
            className="sc-nav-card"
            style={{
              ...navCard,
              border: `1.5px solid ${c.border}`,
            }}
            onClick={() => navigate(c.path)}
          >
            <div style={{ ...navIcon, background: c.bg, color: c.color }}>
              {c.icon}
            </div>
            <h3 style={{ ...navTitle, color: "#0f172a" }}>{c.title}</h3>
            <p style={navDesc}>{c.desc}</p>
            <span style={{ ...navArrow, color: c.color }}>→</span>
          </div>
        ))}
      </div>

      {/* ── Info panels ── */}
      <div className="sc-f4" style={bottomGrid}>
        <div style={infoPanel}>
          <h3 style={infoPanelTitle}>About Smart Campus</h3>
          <p style={infoPanelText}>
            Smart Campus combines your academic tools and campus services into one modern platform — built specifically for IAU Computer Science students.
          </p>
        </div>
        <div style={{ ...infoPanel, background: "linear-gradient(135deg, #0f172a, #1e293b)", border: "none" }}>
          <h3 style={{ ...infoPanelTitle, color: "white" }}>Getting Started</h3>
          <p style={{ ...infoPanelText, color: "rgba(255,255,255,0.65)" }}>
            Head to <strong style={{ color: "#60a5fa" }}>Classrooms</strong> to set up your rooms, then build your <strong style={{ color: "#c084fc" }}>Schedule</strong>. The parking page will automatically pull your class times.
          </p>
        </div>
      </div>

    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const page = {
  padding: "20px 20px 48px",
  fontFamily: "'DM Sans', system-ui, sans-serif",
  minHeight: "100vh",
  maxWidth: "1100px",
  margin: "0 auto",
};

const headerSection = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "16px",
  marginBottom: "28px",
};

const headerLeft = {};

const greetLabel = {
  fontSize: "14px", fontWeight: "600",
  color: "#64748b", margin: "0 0 4px",
};

const heroName = {
  fontSize: "clamp(28px, 4vw, 40px)",
  fontWeight: "800", color: "#0f172a",
  margin: "0 0 6px", letterSpacing: "-0.8px",
};

const heroDate = {
  fontSize: "14px", color: "#94a3b8",
  margin: 0, fontWeight: "500",
};

const heroBadge = {
  display: "flex", alignItems: "center", gap: "12px",
  background: "white", border: "1.5px solid #e2e8f0",
  borderRadius: "14px", padding: "12px 16px",
  boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
};

const heroBadgeIcon = {
  width: "36px", height: "36px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white", fontWeight: "800", fontSize: "14px",
  display: "flex", alignItems: "center", justifyContent: "center",
};

// Stats
const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginBottom: "32px",
};

const statCard = {
  background: "white",
  borderRadius: "16px",
  padding: "20px",
  border: "1.5px solid #e2e8f0",
  boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
  cursor: "pointer",
};

const statLabel = {
  fontSize: "12px", fontWeight: "700",
  color: "#94a3b8", textTransform: "uppercase",
  letterSpacing: "0.06em", margin: "0 0 6px",
};

const statValue = {
  fontSize: "32px", fontWeight: "800",
  letterSpacing: "-0.8px", margin: 0,
  fontFamily: "'DM Mono', monospace",
};

const statSub = {
  fontSize: "12px", color: "#94a3b8",
  margin: "8px 0 0", fontWeight: "500",
};

const statIcon = {
  width: "38px", height: "38px",
  borderRadius: "10px",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "18px", flexShrink: 0,
};

const overduePill = {
  display: "inline-flex", alignItems: "center", gap: "5px",
  marginTop: "8px", padding: "3px 10px",
  borderRadius: "999px",
  background: "#fef2f2", color: "#dc2626",
  fontSize: "11px", fontWeight: "700",
};

// Nav cards
const sectionHead = {
  marginBottom: "16px",
};

const sectionTitle = {
  fontSize: "20px", fontWeight: "800",
  color: "#0f172a", margin: "0 0 4px",
};

const sectionSub = {
  fontSize: "14px", color: "#64748b", margin: 0,
};

const navGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginBottom: "28px",
};

const navCard = {
  background: "white",
  borderRadius: "18px",
  padding: "22px",
  boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
  position: "relative",
};

const navIcon = {
  width: "46px", height: "46px",
  borderRadius: "13px",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "22px", marginBottom: "14px",
};

const navTitle = {
  fontSize: "17px", fontWeight: "800",
  margin: "0 0 8px",
};

const navDesc = {
  fontSize: "13px", color: "#64748b",
  lineHeight: "1.65", margin: "0 0 14px",
};

const navArrow = {
  fontSize: "16px", fontWeight: "700",
};

// Bottom
const bottomGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "14px",
};

const infoPanel = {
  background: "white",
  borderRadius: "16px",
  padding: "22px",
  border: "1.5px solid #e2e8f0",
  boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
};

const infoPanelTitle = {
  fontSize: "16px", fontWeight: "800",
  color: "#0f172a", margin: "0 0 10px",
};

const infoPanelText = {
  fontSize: "14px", color: "#64748b",
  lineHeight: "1.7", margin: 0,
};