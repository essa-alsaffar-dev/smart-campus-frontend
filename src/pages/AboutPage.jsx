import { useNavigate } from "react-router-dom";

const DEVELOPER = {
  name: "Essa Abbas Al-Saffar",
  title: "Information Systems Student (CIS)",
  university: "Imam Abdulrahman Bin Faisal University",
  college: "College of Computer Science & Information Technology",
  major: "Information Systems (CIS)",
  bio: "Information Systems student at IAU (CIS), building Smart Campus — a modern platform to simplify student life by combining academic tools and campus services in one place.",
  linkedin: "https://linkedin.com/in/essa-alsaffr-5222a23b1",
  github: "https://github.com/essa-alsaffar-dev",
  email: "essac125@gmail.com",
};

const TECH_STACK = [
  { name: "React",        color: "#61dafb", bg: "#e8f9fd" },
  { name: "Spring Boot",  color: "#6db33f", bg: "#edf7e4" },
  { name: "MySQL",        color: "#00758f", bg: "#e0f4f8" },
  { name: "JWT Auth",     color: "#f59e0b", bg: "#fef9ee" },
  { name: "Vite",         color: "#9333ea", bg: "#fdf4ff" },
  { name: "REST API",     color: "#2563eb", bg: "#eff6ff" },
];

const PROJECT_FEATURES = [
  { icon: "✓",  title: "Tasks Manager",     desc: "Track assignments and deadlines with priorities and due dates." },
  { icon: "🗓", title: "Weekly Schedule",   desc: "View and manage your class timetable with live status." },
  { icon: "🅿", title: "Smart Parking",     desc: "Real-time parking availability with auto check-in from schedule." },
  { icon: "⌂",  title: "Classroom Finder", desc: "Search 170+ rooms in Building A11 instantly." },
  { icon: "🛡", title: "Admin Panel",       desc: "Dedicated admin portal to manage parking zones." },
  { icon: "👤", title: "User Profiles",     desc: "Personalized profiles with avatar and settings." },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div style={page}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .ab-nav-btn { transition: background 0.15s, color 0.15s; }
        .ab-nav-btn:hover { background: rgba(255,255,255,0.12) !important; }

        .ab-contact-btn { transition: transform 0.15s, box-shadow 0.15s, filter 0.15s; }
        .ab-contact-btn:hover { transform: translateY(-2px); filter: brightness(1.07); }
        .ab-contact-btn:active { transform: scale(0.97); }

        .ab-feat-card { transition: transform 0.18s, box-shadow 0.18s; }
        .ab-feat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(15,23,42,0.10); }

        .ab-tech-chip { transition: transform 0.15s; }
        .ab-tech-chip:hover { transform: scale(1.06); }

        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        .ab-f1 { animation: fadeUp 0.4s ease 0.05s both; }
        .ab-f2 { animation: fadeUp 0.4s ease 0.15s both; }
        .ab-f3 { animation: fadeUp 0.4s ease 0.25s both; }
        .ab-f4 { animation: fadeUp 0.4s ease 0.35s both; }

        @keyframes float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)} }
        .ab-avatar-float { animation: float 4s ease-in-out infinite; }

        .ab-dots { position:absolute; inset:0; background-image:radial-gradient(circle,rgba(255,255,255,0.08) 1px,transparent 1px); background-size:28px 28px; pointer-events:none; }
      `}</style>

      <nav style={navbar}>
        <div style={navInner}>
          <div style={navBrand} onClick={() => navigate("/")} role="button" tabIndex={0}>
            <div style={navLogo}>SC</div>
            <span style={navName}>Smart Campus</span>
          </div>
          <div style={{ display:"flex", gap:"10px" }}>
            <button className="ab-nav-btn" style={navBtn("#f1f5f9","#374151")} onClick={() => navigate("/")}>← Home</button>
            <button className="ab-nav-btn" style={navBtn("#2563eb","white")} onClick={() => navigate("/login")}>Sign In</button>
          </div>
        </div>
      </nav>

      <section style={hero}>
        <div className="ab-dots" />
        <div style={{ position:"absolute", top:"10%", right:"8%", width:280, height:280, borderRadius:"50%", background:"#2563eb", opacity:0.10, filter:"blur(70px)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"5%", left:"5%", width:200, height:200, borderRadius:"50%", background:"#9333ea", opacity:0.10, filter:"blur(60px)", pointerEvents:"none" }} />

        <div style={heroInner}>

          <div className="ab-avatar-float ab-f1" style={avatarWrap}>
            <div style={avatarRing}>
              <div style={avatarInner}>👨‍💻</div>
            </div>
          </div>

          <div className="ab-f2" style={heroBadge}>🎓 Information Systems (CIS) · IAU</div>

          <h1 className="ab-f2" style={heroName}>{DEVELOPER.name}</h1>

          <p className="ab-f3" style={heroBio}>{DEVELOPER.bio}</p>

          <div className="ab-f4" style={contactRow}>
            <a href={DEVELOPER.linkedin} target="_blank" rel="noopener noreferrer" className="ab-contact-btn" style={contactBtn("#0a66c2")}>
              <span>in</span>
              <span>LinkedIn</span>
            </a>
            <a href={DEVELOPER.github} target="_blank" rel="noopener noreferrer" className="ab-contact-btn" style={contactBtn("#24292e")}>
              <span style={{ fontSize:"18px" }}>⌨</span>
              <span>GitHub</span>
            </a>
            <a href={`mailto:${DEVELOPER.email}`} className="ab-contact-btn" style={contactBtn("#2563eb")}>
              <span style={{ fontSize:"16px" }}>✉</span>
              <span>Email</span>
            </a>
          </div>
        </div>
      </section>

      <section style={section("#f8fafc")}>
        <div style={sectionInner}>
          <div style={sectionHead}>
            <h2 style={sectionTitle}>About the Project</h2>
            <p style={sectionSub}>Smart Campus was built as a graduation project to modernize the student experience at IAU.</p>
          </div>

          <div style={twoColGrid}>
            <div style={infoCard}>
              <h3 style={infoCardTitle}>🎯 The Problem</h3>
              <p style={infoCardText}>
                IAU students had no unified digital platform for managing their academic life — schedules, tasks, parking, and classroom information were all scattered.
              </p>
            </div>
            <div style={infoCard}>
              <h3 style={infoCardTitle}>💡 The Solution</h3>
              <p style={infoCardText}>
                Smart Campus brings everything together in one modern, intuitive platform — built specifically for IAU students at the College of Computer Science & IT.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={section("white")}>
        <div style={sectionInner}>
          <div style={sectionHead}>
            <h2 style={sectionTitle}>What I Built</h2>
            <p style={sectionSub}>Six core features designed to work together seamlessly.</p>
          </div>
          <div style={featGrid}>
            {PROJECT_FEATURES.map((f) => (
              <div key={f.title} className="ab-feat-card" style={featCard}>
                <div style={featIcon}>{f.icon}</div>
                <h3 style={featTitle}>{f.title}</h3>
                <p style={featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={section("#f8fafc")}>
        <div style={sectionInner}>
          <div style={sectionHead}>
            <h2 style={sectionTitle}>Tech Stack</h2>
            <p style={sectionSub}>Technologies used to build Smart Campus.</p>
          </div>
          <div style={techRow}>
            {TECH_STACK.map((t) => (
              <div key={t.name} className="ab-tech-chip" style={{ ...techChip, background:t.bg, color:t.color, border:`1.5px solid ${t.color}22` }}>
                {t.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...section("linear-gradient(155deg,#0f172a,#1e3a5f)"), position:"relative", overflow:"hidden" }}>
        <div className="ab-dots" />
        <div style={{ ...sectionInner, textAlign:"center", position:"relative", zIndex:1 }}>
          <h2 style={{ ...sectionTitle, color:"white" }}>Get in Touch</h2>
          <p style={{ ...sectionSub, color:"rgba(255,255,255,0.6)", marginBottom:"28px" }}>
            Have a question or want to collaborate? Feel free to reach out.
          </p>
          <div style={{ ...contactRow, justifyContent:"center" }}>
            <a href={DEVELOPER.linkedin} target="_blank" rel="noopener noreferrer" className="ab-contact-btn" style={contactBtn("#0a66c2")}>
              <span>in</span><span>LinkedIn</span>
            </a>
            <a href={DEVELOPER.github} target="_blank" rel="noopener noreferrer" className="ab-contact-btn" style={contactBtn("#24292e")}>
              <span style={{ fontSize:"18px" }}>⌨</span><span>GitHub</span>
            </a>
            <a href={`mailto:${DEVELOPER.email}`} className="ab-contact-btn" style={contactBtn("#2563eb")}>
              <span style={{ fontSize:"16px" }}>✉</span><span>Email</span>
            </a>
          </div>
        </div>
      </section>

      <footer style={footer}>
        <span style={{ color:"#94a3b8", fontSize:"13px" }}>
          © {new Date().getFullYear()} Smart Campus · Built by{" "}
          <a href={DEVELOPER.linkedin} target="_blank" rel="noopener noreferrer" style={{ color:"#2563eb", fontWeight:"700", textDecoration:"none" }}>
            Essa Abbas Al-Saffar
          </a>
          {" "}· IAU
        </span>
        <button onClick={() => navigate("/admin/login")} style={adminFooterBtn}>🛡 Admin</button>
      </footer>
    </div>
  );
}

const page    = { fontFamily:"'DM Sans',system-ui,sans-serif", background:"#f8fafc", minHeight:"100vh" };

const navbar  = { position:"sticky", top:0, zIndex:100, background:"rgba(255,255,255,0.90)", backdropFilter:"blur(12px)", borderBottom:"1px solid #e2e8f0" };
const navInner = { maxWidth:"1100px", margin:"0 auto", padding:"0 24px", height:"60px", display:"flex", alignItems:"center", justifyContent:"space-between" };
const navBrand = { display:"flex", alignItems:"center", gap:"10px", cursor:"pointer" };
const navLogo  = { width:"34px", height:"34px", borderRadius:"10px", background:"linear-gradient(135deg,#2563eb,#1d4ed8)", color:"white", fontWeight:"800", fontSize:"13px", display:"flex", alignItems:"center", justifyContent:"center" };
const navName  = { fontWeight:"800", fontSize:"16px", color:"#0f172a", letterSpacing:"-0.3px" };
const navBtn   = (bg, color) => ({ padding:"8px 18px", borderRadius:"9px", border:"none", background:bg, color, fontWeight:"600", fontSize:"14px", cursor:"pointer", fontFamily:"'DM Sans'" });

const hero     = { background:"linear-gradient(155deg,#0f172a 0%,#1e3a5f 55%,#1e293b 100%)", padding:"72px 24px 80px", textAlign:"center", position:"relative", overflow:"hidden" };
const heroInner = { maxWidth:"680px", margin:"0 auto", position:"relative", zIndex:1 };

const avatarWrap  = { marginBottom:"24px", display:"inline-block" };
const avatarRing  = { width:"110px", height:"110px", borderRadius:"50%", background:"rgba(37,99,235,0.2)", border:"2px solid rgba(37,99,235,0.4)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto" };
const avatarInner = { width:"90px", height:"90px", borderRadius:"50%", background:"linear-gradient(135deg,#1e3a5f,#2563eb)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"44px" };

const heroBadge  = { display:"inline-block", padding:"6px 16px", borderRadius:"999px", background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.18)", color:"rgba(255,255,255,0.80)", fontSize:"13px", fontWeight:"600", marginBottom:"18px" };
const heroName   = { fontSize:"clamp(28px,5vw,46px)", fontWeight:"800", color:"white", margin:"0 0 16px", letterSpacing:"-1px" };
const heroBio    = { fontSize:"16px", color:"rgba(255,255,255,0.62)", lineHeight:"1.75", margin:"0 0 28px" };

const contactRow = { display:"flex", gap:"12px", flexWrap:"wrap", justifyContent:"center" };
const contactBtn = (bg) => ({ display:"inline-flex", alignItems:"center", gap:"8px", padding:"11px 22px", borderRadius:"11px", border:"none", background:bg, color:"white", fontWeight:"700", fontSize:"14px", cursor:"pointer", textDecoration:"none", fontFamily:"'DM Sans'", boxShadow:`0 4px 14px ${bg}44` });

const section    = (bg) => ({ background:bg, padding:"64px 24px" });
const sectionInner = { maxWidth:"1100px", margin:"0 auto" };
const sectionHead  = { textAlign:"center", marginBottom:"40px" };
const sectionTitle = { fontSize:"clamp(22px,3vw,32px)", fontWeight:"800", color:"#0f172a", margin:"0 0 10px", letterSpacing:"-0.4px" };
const sectionSub   = { fontSize:"15px", color:"#64748b", margin:0 };

const twoColGrid = { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"20px" };
const infoCard   = { background:"white", borderRadius:"18px", padding:"24px", border:"1.5px solid #e2e8f0", boxShadow:"0 2px 8px rgba(15,23,42,0.05)" };
const infoCardTitle = { fontSize:"17px", fontWeight:"800", color:"#0f172a", margin:"0 0 10px" };
const infoCardText  = { fontSize:"14px", color:"#475569", lineHeight:"1.7", margin:0 };

const featGrid = { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"16px" };
const featCard = { background:"#f8fafc", borderRadius:"16px", padding:"22px", border:"1.5px solid #e2e8f0" };
const featIcon = { fontSize:"28px", marginBottom:"12px" };
const featTitle = { fontSize:"16px", fontWeight:"800", color:"#0f172a", margin:"0 0 8px" };
const featDesc  = { fontSize:"13px", color:"#64748b", lineHeight:"1.65", margin:0 };

const techRow  = { display:"flex", flexWrap:"wrap", gap:"10px", justifyContent:"center" };
const techChip = { padding:"8px 18px", borderRadius:"999px", fontSize:"14px", fontWeight:"700" };

const footer = { padding:"22px 24px", borderTop:"1px solid #e2e8f0", background:"white", display:"flex", alignItems:"center", justifyContent:"center", gap:"16px", flexWrap:"wrap" };
const adminFooterBtn = { padding:"6px 14px", borderRadius:"8px", border:"1.5px solid #fde68a", background:"#fef9ee", color:"#92400e", fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"'DM Sans'" };
