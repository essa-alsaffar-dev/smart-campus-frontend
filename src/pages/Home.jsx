import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

const FEATURES = [
  {
    icon: "✓",
    title: "Tasks",
    desc: "Track assignments, deadlines, and exam prep with priorities and due dates.",
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    icon: "🗓",
    title: "Schedule",
    desc: "View your weekly timetable with live status — see what's on right now.",
    color: "#9333ea",
    bg: "#fdf4ff",
  },
  {
    icon: "🅿",
    title: "Parking",
    desc: "Real-time spot availability across all campus zones. Check in with one tap.",
    color: "#059669",
    bg: "#ecfdf5",
  },
  {
    icon: "⌂",
    title: "Classrooms",
    desc: "Find any room in Building A11 instantly — search by room, floor, or department.",
    color: "#ea580c",
    bg: "#fff7ed",
  },
];

const STATS = [
  { value: "170+", label: "Classrooms indexed" },
  { value: "4",    label: "Parking zones" },
  { value: "IAU",  label: "University" },
  { value: "Free", label: "Always" },
];

export default function Home() {
  const navigate = useNavigate();

  // Pull live count from any logged-in session (purely informational)
  const roomCount = useMemo(() => {
    try {
      const rooms = JSON.parse(localStorage.getItem("classrooms") || "[]");
      return rooms.length || "170+";
    } catch { return "170+"; }
  }, []);

  return (
    <div style={page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=DM+Serif+Display&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        body { margin: 0; }

        /* Nav */
        .sc-nav-btn {
          transition: background 0.15s, color 0.15s, box-shadow 0.15s, transform 0.1s;
        }
        .sc-nav-btn:hover { filter: brightness(1.07); }
        .sc-nav-btn:active { transform: scale(0.97); }

        /* Feature cards */
        .sc-feat {
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          cursor: default;
        }
        .sc-feat:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(15,23,42,0.12);
        }

        /* CTA buttons */
        .sc-cta-primary {
          transition: filter 0.15s, transform 0.1s, box-shadow 0.15s;
        }
        .sc-cta-primary:hover {
          filter: brightness(1.07);
          box-shadow: 0 12px 32px rgba(37,99,235,0.40);
        }
        .sc-cta-primary:active { transform: scale(0.97); }

        .sc-cta-secondary {
          transition: background 0.15s, color 0.15s;
        }
        .sc-cta-secondary:hover { background: rgba(255,255,255,0.18) !important; }

        /* Fade-in stagger */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sc-fade-1 { animation: fadeUp 0.5s ease 0.05s both; }
        .sc-fade-2 { animation: fadeUp 0.5s ease 0.15s both; }
        .sc-fade-3 { animation: fadeUp 0.5s ease 0.25s both; }
        .sc-fade-4 { animation: fadeUp 0.5s ease 0.35s both; }
        .sc-fade-5 { animation: fadeUp 0.5s ease 0.45s both; }

        /* Floating orbs */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-18px); }
        }
        .sc-orb-1 { animation: float 6s ease-in-out infinite; }
        .sc-orb-2 { animation: float 8s ease-in-out 1s infinite; }

        /* Stat counter */
        .sc-stat-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .sc-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(15,23,42,0.10);
        }

        /* Grain overlay */
        .sc-grain {
          position: absolute; inset: 0; pointer-events: none;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 200px;
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={navbar}>
        <div style={navInner}>
          <div style={navBrand}>
            <div style={navLogo}>SC</div>
            <span style={navName}>Smart Campus</span>
          </div>
          <div style={navBtns}>
            <button className="sc-nav-btn" style={navOutline} onClick={() => navigate("/login")}>
              Sign In
            </button>
            <button className="sc-nav-btn" style={navFilled} onClick={() => navigate("/register")}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={hero}>
        <div className="sc-grain" />

        {/* Decorative orbs */}
        <div className="sc-orb-1" style={{ ...orb, width: 320, height: 320, top: "-80px", right: "8%", background: "rgba(37,99,235,0.18)", filter: "blur(70px)" }} />
        <div className="sc-orb-2" style={{ ...orb, width: 240, height: 240, bottom: "0px", left: "5%", background: "rgba(147,51,234,0.14)", filter: "blur(60px)" }} />

        <div style={heroInner}>
          <div className="sc-fade-1" style={heroBadge}>
            🎓 &nbsp;Built for IAU Computer Science Students
          </div>

          <h1 className="sc-fade-2" style={heroTitle}>
            Your Smart University<br />
            <span style={{ color: "#60a5fa" }}>Student Portal</span>
          </h1>

          <p className="sc-fade-3" style={heroSub}>
            One platform to manage your schedule, tasks, classrooms, and parking — so you can focus on what matters.
          </p>

          <div className="sc-fade-4" style={heroBtns}>
            <button className="sc-cta-primary" style={ctaPrimary} onClick={() => navigate("/register")}>
              Get Started — It's Free
            </button>
            <button className="sc-cta-secondary" style={ctaSecondary} onClick={() => navigate("/login")}>
              Sign In →
            </button>
          </div>

          {/* Trust note */}
          <p className="sc-fade-5" style={trustNote}>
            No credit card required &nbsp;·&nbsp; Free for all students
          </p>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={statsStrip}>
        <div style={statsInner}>
          {[
            { value: roomCount, label: "Classrooms indexed" },
            { value: "4",      label: "Parking zones" },
            { value: "2",      label: "View modes" },
            { value: "Free",   label: "Always" },
          ].map((s, i) => (
            <div key={i} className="sc-stat-card" style={statCard}>
              <div style={statValue}>{s.value}</div>
              <div style={statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={featSection}>
        <div style={featInner}>
          <div style={sectionHead}>
            <h2 style={sectionTitle}>Everything you need on campus</h2>
            <p style={sectionSub}>
              Four core tools — designed to work together seamlessly.
            </p>
          </div>

          <div style={featGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} className="sc-feat" style={{ ...featCard, borderColor: f.color + "22" }}>
                <div style={{ ...featIcon, background: f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <h3 style={{ ...featTitle, color: "#0f172a" }}>{f.title}</h3>
                <p style={featDesc}>{f.desc}</p>
                <div style={{ ...featTag, background: f.bg, color: f.color }}>
                  Explore →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={ctaBanner}>
        <div className="sc-grain" />
        <div style={{ ...orb, width: 280, height: 280, top: "-40px", right: "10%", background: "rgba(37,99,235,0.22)", filter: "blur(60px)", position: "absolute" }} />
        <div style={ctaInner}>
          <h2 style={ctaTitle}>Ready to get organized?</h2>
          <p style={ctaSub}>Join your classmates on Smart Campus today.</p>
          <div style={heroBtns}>
            <button className="sc-cta-primary" style={{ ...ctaPrimary, fontSize: "16px", padding: "14px 32px" }} onClick={() => navigate("/register")}>
              Create Free Account
            </button>
            <button className="sc-cta-secondary" style={ctaSecondary} onClick={() => navigate("/login")}>
              Already a member? Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={footer}>
        <span style={{ color: "#94a3b8", fontSize: "13px" }}>
          © 2025 Smart Campus · Built by{" "}
          <span
            onClick={() => navigate("/about")}
            style={{ color: "#2563eb", fontWeight: "700", cursor: "pointer" }}
          >
            Essa Abbas Al-Saffar
          </span>
          {" "}· IAU
        </span>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button onClick={() => navigate("/about")} style={aboutBtn}>
            👤 About
          </button>
          <button onClick={() => navigate("/admin/login")} style={adminBtn}>
            🛡 Admin
          </button>
        </div>
      </footer>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const page = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  background: "#f8fafc",
  minHeight: "100vh",
  overflowX: "hidden",
};

// Navbar
const navbar = {
  position: "sticky",
  top: 0,
  zIndex: 100,
  background: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(12px)",
  borderBottom: "1px solid #e2e8f0",
};

const navInner = {
  maxWidth: "1120px",
  margin: "0 auto",
  padding: "0 24px",
  height: "60px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const navBrand = { display: "flex", alignItems: "center", gap: "10px" };

const navLogo = {
  width: "34px", height: "34px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white", fontWeight: "800", fontSize: "13px",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 4px 10px rgba(37,99,235,0.28)",
};

const navName = {
  fontWeight: "800", fontSize: "16px",
  color: "#0f172a", letterSpacing: "-0.3px",
};

const navBtns = { display: "flex", gap: "10px", alignItems: "center" };

const navOutline = {
  padding: "8px 18px", borderRadius: "9px",
  border: "1.5px solid #e2e8f0",
  background: "white", color: "#374151",
  fontWeight: "600", fontSize: "14px",
  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
};

const navFilled = {
  padding: "8px 18px", borderRadius: "9px",
  border: "none",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  fontWeight: "700", fontSize: "14px",
  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  boxShadow: "0 4px 12px rgba(37,99,235,0.28)",
};

// Hero
const hero = {
  background: "linear-gradient(155deg, #0f172a 0%, #1e3a5f 55%, #1e293b 100%)",
  padding: "80px 24px 90px",
  position: "relative",
  overflow: "hidden",
  textAlign: "center",
};

const orb = {
  position: "absolute",
  borderRadius: "50%",
  pointerEvents: "none",
};

const heroInner = {
  position: "relative",
  zIndex: 1,
  maxWidth: "760px",
  margin: "0 auto",
};

const heroBadge = {
  display: "inline-block",
  padding: "8px 18px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.18)",
  fontSize: "13px", fontWeight: "600",
  color: "rgba(255,255,255,0.85)",
  marginBottom: "24px",
  letterSpacing: "0.01em",
};

const heroTitle = {
  fontSize: "clamp(36px, 5vw, 58px)",
  fontWeight: "800",
  color: "white",
  lineHeight: "1.1",
  margin: "0 0 20px",
  letterSpacing: "-1.5px",
  fontFamily: "'DM Sans', sans-serif",
};

const heroSub = {
  fontSize: "18px",
  color: "rgba(255,255,255,0.65)",
  lineHeight: "1.75",
  margin: "0 auto 32px",
  maxWidth: "580px",
};

const heroBtns = {
  display: "flex",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const ctaPrimary = {
  padding: "13px 28px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  fontWeight: "700", fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(37,99,235,0.40)",
  fontFamily: "'DM Sans', sans-serif",
};

const ctaSecondary = {
  padding: "13px 24px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.10)",
  color: "rgba(255,255,255,0.88)",
  fontWeight: "600", fontSize: "15px",
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
};

const trustNote = {
  marginTop: "20px",
  fontSize: "13px",
  color: "rgba(255,255,255,0.4)",
};

// Stats
const statsStrip = {
  background: "white",
  borderBottom: "1px solid #e2e8f0",
  padding: "24px",
};

const statsInner = {
  maxWidth: "1120px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "12px",
};

const statCard = {
  textAlign: "center",
  padding: "18px",
  borderRadius: "14px",
  border: "1.5px solid #f1f5f9",
  background: "#fafafa",
};

const statValue = {
  fontSize: "26px", fontWeight: "800",
  color: "#0f172a", letterSpacing: "-0.5px",
  marginBottom: "4px",
};

const statLabel = {
  fontSize: "12px", fontWeight: "600",
  color: "#94a3b8", textTransform: "uppercase",
  letterSpacing: "0.06em",
};

// Features
const featSection = {
  padding: "72px 24px",
  background: "#f8fafc",
};

const featInner = {
  maxWidth: "1120px",
  margin: "0 auto",
};

const sectionHead = {
  textAlign: "center",
  marginBottom: "48px",
};

const sectionTitle = {
  fontSize: "clamp(24px, 3vw, 36px)",
  fontWeight: "800",
  color: "#0f172a",
  margin: "0 0 12px",
  letterSpacing: "-0.5px",
};

const sectionSub = {
  fontSize: "16px",
  color: "#64748b",
  margin: 0,
  lineHeight: "1.7",
};

const featGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
};

const featCard = {
  background: "white",
  borderRadius: "20px",
  padding: "28px 24px",
  border: "1.5px solid #e2e8f0",
  boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
};

const featIcon = {
  width: "52px", height: "52px",
  borderRadius: "14px",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "24px", fontWeight: "700",
  marginBottom: "18px",
};

const featTitle = {
  fontSize: "19px", fontWeight: "800",
  margin: "0 0 10px",
  letterSpacing: "-0.2px",
};

const featDesc = {
  fontSize: "14px", color: "#64748b",
  lineHeight: "1.7", margin: "0 0 18px",
};

const featTag = {
  display: "inline-block",
  padding: "5px 14px",
  borderRadius: "999px",
  fontSize: "12px", fontWeight: "700",
};

// CTA Banner
const ctaBanner = {
  background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
  padding: "72px 24px",
  textAlign: "center",
  position: "relative",
  overflow: "hidden",
};

const ctaInner = {
  position: "relative",
  zIndex: 1,
  maxWidth: "600px",
  margin: "0 auto",
};

const ctaTitle = {
  fontSize: "clamp(26px, 3vw, 40px)",
  fontWeight: "800",
  color: "white",
  margin: "0 0 12px",
  letterSpacing: "-0.5px",
};

const ctaSub = {
  fontSize: "16px",
  color: "rgba(255,255,255,0.6)",
  margin: "0 0 28px",
};

// Footer
const footer = {
  padding: "24px",
  textAlign: "center",
  borderTop: "1px solid #e2e8f0",
  background: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  flexWrap: "wrap",
};

const aboutBtn = {
  padding: "7px 16px",
  borderRadius: "8px",
  border: "1.5px solid #bfdbfe",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontWeight: "700",
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
};

const adminBtn = {
  padding: "7px 16px",
  borderRadius: "8px",
  border: "1.5px solid #fde68a",
  background: "#fef9ee",
  color: "#92400e",
  fontWeight: "700",
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  transition: "background 0.15s, box-shadow 0.15s",
};