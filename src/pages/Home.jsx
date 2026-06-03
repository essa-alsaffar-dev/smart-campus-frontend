import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function useCounter(target, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start || typeof target !== "number") return;
    let frame;
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(ease * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, start]);
  return val;
}

const FEATURES = [
  {
    id: "tasks",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`,
    title: "Smart Tasks",
    desc: "Track assignments, deadlines, and exam prep with priorities, labels, and due-date reminders.",
    accent: "#6366f1",
    accentDark: "#818cf8",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    tag: "Productivity",
  },
  {
    id: "schedule",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    title: "Live Schedule",
    desc: "See your weekly timetable with real-time class status — know what's happening right now, at a glance.",
    accent: "#06b6d4",
    accentDark: "#22d3ee",
    gradient: "linear-gradient(135deg, #06b6d4, #0ea5e9)",
    tag: "Timetable",
  },
  {
    id: "parking",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 010 6H9"/></svg>`,
    title: "Parking Zones",
    desc: "Real-time spot availability across all campus zones. Reserve or check in with a single tap.",
    accent: "#10b981",
    accentDark: "#34d399",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    tag: "Real-time",
  },
  {
    id: "classrooms",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    title: "Classroom Finder",
    desc: "Instantly locate any room in Building A11 — search by room number, floor, or department.",
    accent: "#f59e0b",
    accentDark: "#fbbf24",
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
    tag: "Navigation",
  },
];

const STEPS = [
  { n: "01", title: "Create your account", body: "Sign up free in under 30 seconds — no credit card, no verification delays." },
  { n: "02", title: "Set up your profile", body: "Add your courses, schedule, and preferences to personalize your campus experience." },
  { n: "03", title: "Stay on top of everything", body: "Get a live dashboard with today's classes, pending tasks, parking status, and campus navigation." },
];

export default function Home() {
  const [theme, setTheme] = useState(() => localStorage.getItem("sc-theme") || "light");
  const [statsVisible, setStatsVisible] = useState(false);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const statsRef = useRef(null);
  const navigate = useNavigate();

  const c170 = useCounter(170, 1600, statsVisible);
  const c4   = useCounter(4,   1200, statsVisible);
  const c24  = useCounter(24,  1400, statsVisible);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("sc-theme", next);
  };

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = e.target.dataset.section;
          if (id) setVisibleSections(prev => new Set([...prev, id]));
          if (e.target === statsRef.current) setStatsVisible(true);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll("[data-section]").forEach(el => io.observe(el));
    if (statsRef.current) io.observe(statsRef.current);
    return () => io.disconnect();
  }, []);

  const dark = theme === "dark";
  const shown = (id) => visibleSections.has(id);

  return (
    <div data-theme={theme} style={{ minHeight: "100vh", fontFamily: "var(--font-sans)" }}>

      <style>{`
        :root { --font-sans: 'Inter', 'DM Sans', system-ui, -apple-system, sans-serif; }

        [data-theme="light"] {
          --bg:         #F7F8FC;
          --bg-card:    #FFFFFF;
          --bg-muted:   #EEF0F8;
          --fg:         #09091A;
          --fg-2:       #4A516E;
          --fg-3:       #9299B4;
          --border:     rgba(0,0,0,0.07);
          --border-hv:  rgba(0,0,0,0.12);
          --hero-bg:    linear-gradient(155deg, #0C1220 0%, #162244 55%, #1B2A50 100%);
          --nav-bg:     rgba(255,255,255,0.88);
          --nav-bdr:    rgba(0,0,0,0.07);
          --shadow:     0 1px 3px rgba(9,9,26,0.05), 0 4px 16px rgba(9,9,26,0.06);
          --shadow-lg:  0 4px 16px rgba(9,9,26,0.06), 0 16px 52px rgba(9,9,26,0.10);
          --footer-bg:  #FFFFFF;
        }

        [data-theme="dark"] {
          --bg:         #07080F;
          --bg-card:    #0C0D1B;
          --bg-muted:   #111226;
          --fg:         #EDF0FF;
          --fg-2:       #8891C8;
          --fg-3:       #454870;
          --border:     rgba(255,255,255,0.065);
          --border-hv:  rgba(255,255,255,0.11);
          --hero-bg:    linear-gradient(155deg, #020408 0%, #070D1E 55%, #050A18 100%);
          --nav-bg:     rgba(7,8,15,0.88);
          --nav-bdr:    rgba(255,255,255,0.065);
          --shadow:     0 1px 3px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.35);
          --shadow-lg:  0 4px 16px rgba(0,0,0,0.5), 0 16px 52px rgba(99,102,241,0.12);
          --footer-bg:  #07080F;
        }

        [data-theme] * { transition: background-color 0.35s ease, border-color 0.35s ease, color 0.3s ease; }
        [data-theme] *:hover { transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease; }

        @keyframes floatY  { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-22px)} }
        @keyframes floatY2 { 0%,100%{transform:translateY(-12px)} 50%{transform:translateY(12px)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.32),0 8px 32px rgba(99,102,241,0.2)} 50%{box-shadow:0 0 44px rgba(99,102,241,0.56),0 8px 32px rgba(99,102,241,0.38)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes liveBlip { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.7);opacity:0.35} }
        @keyframes spin { to{transform:rotate(360deg)} }

        .sc-reveal { opacity:0; transform:translateY(22px); }
        .sc-reveal.is-visible { animation:fadeUp 0.65s cubic-bezier(0.16,1,0.3,1) forwards; }

        /* ── Navigation ── */
        .sc-nav {
          position:sticky; top:0; z-index:100;
          background:var(--nav-bg); border-bottom:1px solid var(--nav-bdr);
          backdrop-filter:blur(20px) saturate(180%); -webkit-backdrop-filter:blur(20px) saturate(180%);
        }
        .sc-nav-inner { max-width:1200px; margin:0 auto; padding:0 28px; height:64px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .sc-brand { display:flex; align-items:center; gap:11px; cursor:default; }
        .sc-brand-logo { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:13px; color:white; letter-spacing:-0.5px; box-shadow:0 4px 16px rgba(99,102,241,0.45); flex-shrink:0; }
        .sc-brand-name { font-size:16px; font-weight:800; color:var(--fg); letter-spacing:-0.5px; font-family:var(--font-sans); }
        .sc-brand-sub  { font-size:11px; color:var(--fg-3); font-weight:500; line-height:1; }
        .sc-nav-right  { display:flex; align-items:center; gap:10px; }

        .sc-theme-toggle { width:48px; height:26px; border-radius:999px; cursor:pointer; border:1.5px solid var(--border); background:var(--bg-muted); position:relative; padding:0; flex-shrink:0; }
        .sc-theme-thumb { position:absolute; top:2px; width:18px; height:18px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6); box-shadow:0 2px 8px rgba(99,102,241,0.5); display:flex; align-items:center; justify-content:center; font-size:10px; transition:left 0.32s cubic-bezier(0.34,1.56,0.64,1) !important; }
        .sc-theme-thumb.light { left:2px; }
        .sc-theme-thumb.dark  { left:24px; }

        .sc-nav-pill { padding:8px 16px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; border:1.5px solid var(--border); background:var(--bg-card); color:var(--fg-2); font-family:var(--font-sans); }
        .sc-nav-pill:hover { color:var(--fg); border-color:rgba(99,102,241,0.4); transform:translateY(-1px); }
        .sc-nav-cta { padding:9px 20px; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; border:none; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; font-family:var(--font-sans); box-shadow:0 4px 16px rgba(99,102,241,0.4); }
        .sc-nav-cta:hover { filter:brightness(1.08); box-shadow:0 6px 24px rgba(99,102,241,0.55); transform:translateY(-2px); }
        .sc-nav-cta:active { transform:scale(0.97); }

        /* ── Hero ── */
        .sc-hero { background:var(--hero-bg); position:relative; overflow:hidden; padding:112px 28px 130px; text-align:center; }
        .sc-hero-mesh { position:absolute; inset:0; pointer-events:none; background-image:radial-gradient(ellipse 60% 50% at 70% 28%,rgba(99,102,241,0.24) 0%,transparent 65%),radial-gradient(ellipse 45% 40% at 14% 80%,rgba(6,182,212,0.15) 0%,transparent 55%),radial-gradient(ellipse 35% 35% at 86% 76%,rgba(139,92,246,0.13) 0%,transparent 50%); }
        .sc-hero-grid { position:absolute; inset:0; pointer-events:none; opacity:0.045; background-image:linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px); background-size:52px 52px; mask-image:radial-gradient(ellipse 78% 78% at 50% 50%,black,transparent); -webkit-mask-image:radial-gradient(ellipse 78% 78% at 50% 50%,black,transparent); }
        .sc-orb-1 { position:absolute; border-radius:50%; pointer-events:none; width:520px; height:520px; top:-130px; right:-90px; background:radial-gradient(circle,rgba(99,102,241,0.26),transparent 70%); animation:floatY 9s ease-in-out infinite; filter:blur(2px); }
        .sc-orb-2 { position:absolute; border-radius:50%; pointer-events:none; width:360px; height:360px; bottom:-80px; left:-55px; background:radial-gradient(circle,rgba(6,182,212,0.19),transparent 70%); animation:floatY2 11s ease-in-out 1s infinite; filter:blur(2px); }
        .sc-orb-3 { position:absolute; border-radius:50%; pointer-events:none; width:230px; height:230px; top:34%; left:11%; background:radial-gradient(circle,rgba(139,92,246,0.13),transparent 70%); animation:floatY 13s ease-in-out 3s infinite; }
        .sc-hero-inner { position:relative; z-index:1; max-width:860px; margin:0 auto; }

        .sc-hero-badge { display:inline-flex; align-items:center; gap:9px; padding:8px 18px; border-radius:999px; background:rgba(99,102,241,0.14); border:1px solid rgba(99,102,241,0.28); font-size:13px; font-weight:600; color:rgba(255,255,255,0.82); margin-bottom:30px; animation:fadeUp 0.6s ease 0.1s both; font-family:var(--font-sans); }
        .sc-hero-badge-dot { width:7px; height:7px; border-radius:50%; background:#818cf8; animation:liveBlip 2.2s ease-in-out infinite; flex-shrink:0; }

        .sc-hero-h1 { font-size:clamp(44px,6.5vw,78px); font-weight:900; color:white; line-height:1.03; letter-spacing:-3px; margin:0 0 24px; animation:fadeUp 0.7s ease 0.2s both; font-family:var(--font-sans); }
        .sc-hero-h1-accent { background:linear-gradient(135deg,#a5b4fc 0%,#22d3ee 50%,#c084fc 100%); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 4s linear infinite; }
        .sc-hero-sub { font-size:19px; color:rgba(255,255,255,0.56); line-height:1.76; max-width:560px; margin:0 auto 44px; animation:fadeUp 0.7s ease 0.3s both; font-family:var(--font-sans); }
        .sc-hero-actions { display:flex; justify-content:center; gap:14px; flex-wrap:wrap; animation:fadeUp 0.7s ease 0.4s both; }
        .sc-hero-trust { margin-top:24px; font-size:12px; color:rgba(255,255,255,0.3); animation:fadeUp 0.7s ease 0.5s both; letter-spacing:0.02em; }

        .sc-btn-primary { padding:15px 36px; border-radius:14px; border:none; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; font-weight:700; font-size:16px; cursor:pointer; font-family:var(--font-sans); box-shadow:0 8px 30px rgba(99,102,241,0.44); animation:glowPulse 3s ease-in-out infinite; letter-spacing:-0.01em; }
        .sc-btn-primary:hover { filter:brightness(1.1); transform:translateY(-2px); box-shadow:0 12px 40px rgba(99,102,241,0.58); animation:none; }
        .sc-btn-primary:active { transform:scale(0.97); }
        .sc-btn-ghost { padding:15px 28px; border-radius:14px; border:1.5px solid rgba(255,255,255,0.18); background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.82); font-weight:600; font-size:16px; cursor:pointer; font-family:var(--font-sans); backdrop-filter:blur(10px); letter-spacing:-0.01em; }
        .sc-btn-ghost:hover { background:rgba(255,255,255,0.13); border-color:rgba(255,255,255,0.32); transform:translateY(-1px); }

        /* ── Dashboard mockup ── */
        .sc-hero-mockup-wrap { margin-top:72px; position:relative; z-index:1; animation:fadeUp 0.9s ease 0.5s both; }
        .sc-mockup-browser { max-width:920px; margin:0 auto; border-radius:18px; background:rgba(10,11,22,0.97); border:1px solid rgba(255,255,255,0.09); box-shadow:0 40px 100px rgba(0,0,0,0.68),0 0 0 1px rgba(255,255,255,0.04),0 0 80px rgba(99,102,241,0.14); overflow:hidden; }
        .sc-mockup-bar { background:rgba(255,255,255,0.032); border-bottom:1px solid rgba(255,255,255,0.052); padding:13px 18px; display:flex; align-items:center; gap:8px; }
        .sc-mock-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; }
        .sc-mock-url { flex:1; background:rgba(255,255,255,0.052); border-radius:6px; padding:5px 12px; font-size:12px; color:rgba(255,255,255,0.3); font-family:'DM Mono',monospace; margin:0 16px; }
        .sc-mockup-body { display:flex; min-height:370px; }
        .sc-mock-sidebar { width:194px; min-width:194px; background:rgba(3,4,12,0.98); border-right:1px solid rgba(255,255,255,0.052); padding:16px 12px; display:flex; flex-direction:column; gap:3px; }
        .sc-mock-brand { display:flex; align-items:center; gap:9px; padding:8px; margin-bottom:12px; }
        .sc-mock-brand-logo { width:26px; height:26px; border-radius:7px; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; color:white; }
        .sc-mock-brand-name { font-size:12px; font-weight:800; color:white; letter-spacing:-0.2px; }
        .sc-mock-nav-item { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:8px; font-size:11px; font-weight:600; color:rgba(255,255,255,0.4); }
        .sc-mock-nav-item.active { background:rgba(99,102,241,0.18); color:white; border:1px solid rgba(99,102,241,0.24); }
        .sc-mock-content { flex:1; padding:20px; background:rgba(6,7,18,0.96); }
        .sc-mock-greeting { font-size:15px; font-weight:900; color:white; margin-bottom:3px; letter-spacing:-0.3px; }
        .sc-mock-subline  { font-size:11px; color:rgba(255,255,255,0.35); margin-bottom:16px; }
        .sc-mock-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:14px; }
        .sc-mock-stat { background:rgba(255,255,255,0.036); border-radius:10px; padding:10px 8px; border:1px solid rgba(255,255,255,0.052); }
        .sc-mock-stat-val { font-size:18px; font-weight:900; color:white; margin-bottom:2px; letter-spacing:-0.5px; }
        .sc-mock-stat-label { font-size:8px; color:rgba(255,255,255,0.37); text-transform:uppercase; letter-spacing:0.09em; }
        .sc-mock-cards { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .sc-mock-card { background:rgba(255,255,255,0.036); border-radius:10px; padding:12px; border:1px solid rgba(255,255,255,0.052); }
        .sc-mock-card-title { font-size:9px; font-weight:700; color:rgba(255,255,255,0.44); text-transform:uppercase; letter-spacing:0.09em; margin-bottom:10px; }
        .sc-mock-class-item { display:flex; gap:8px; align-items:flex-start; margin-bottom:8px; }
        .sc-mock-class-dot { width:3px; border-radius:2px; flex-shrink:0; margin-top:2px; height:30px; }
        .sc-mock-class-name { font-size:10px; font-weight:700; color:rgba(255,255,255,0.82); margin-bottom:2px; }
        .sc-mock-class-time { font-size:9px; color:rgba(255,255,255,0.32); }
        .sc-mock-task { display:flex; gap:7px; align-items:center; margin-bottom:7px; }
        .sc-mock-task-box { width:11px; height:11px; border-radius:3px; border:1.5px solid rgba(255,255,255,0.18); flex-shrink:0; }
        .sc-mock-task-box.done { background:#10b981; border-color:#10b981; }
        .sc-mock-task-text { font-size:10px; color:rgba(255,255,255,0.58); }
        .sc-mock-task-text.done { text-decoration:line-through; opacity:0.4; }
        .sc-mock-live-badge { display:inline-flex; align-items:center; gap:4px; padding:2px 7px; border-radius:999px; background:rgba(16,185,129,0.18); border:1px solid rgba(16,185,129,0.28); font-size:8px; font-weight:700; color:#34d399; margin-bottom:4px; }
        .sc-mock-live-dot { width:4px; height:4px; border-radius:50%; background:#34d399; animation:liveBlip 2s ease-in-out infinite; }

        /* ── Stats strip ── */
        .sc-stats-strip { background:var(--bg-card); border-bottom:1px solid var(--border); }
        .sc-stats-inner { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); }
        .sc-stat-block { padding:38px 32px; border-right:1px solid var(--border); text-align:center; position:relative; overflow:hidden; cursor:default; }
        .sc-stat-block:last-child { border-right:none; }
        .sc-stat-block::after { content:''; position:absolute; bottom:0; left:28px; right:28px; height:2px; border-radius:2px; background:linear-gradient(90deg,#6366f1,#06b6d4); opacity:0; transition:opacity 0.25s !important; }
        .sc-stat-block:hover::after { opacity:1; }
        .sc-stat-num { font-size:clamp(34px,4vw,52px); font-weight:900; color:var(--fg); letter-spacing:-2px; line-height:1; margin-bottom:8px; font-variant-numeric:tabular-nums; font-family:var(--font-sans); }
        .sc-stat-num span { background:linear-gradient(135deg,#6366f1,#06b6d4); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .sc-stat-lbl { font-size:13px; color:var(--fg-3); font-weight:500; }
        .sc-stat-icon { font-size:22px; margin-bottom:12px; display:block; }

        /* ── Content sections ── */
        .sc-section     { padding:108px 28px; background:var(--bg); }
        .sc-section-alt { padding:108px 28px; background:var(--bg-card); }
        .sc-section-inner { max-width:1200px; margin:0 auto; }
        .sc-section-eyebrow { display:inline-flex; align-items:center; gap:8px; padding:6px 16px; border-radius:999px; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); font-size:12px; font-weight:700; color:#6366f1; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:22px; font-family:var(--font-sans); }
        [data-theme="dark"] .sc-section-eyebrow { background:rgba(99,102,241,0.14); border-color:rgba(99,102,241,0.28); color:#818cf8; }
        .sc-section-title { font-size:clamp(32px,4vw,54px); font-weight:900; color:var(--fg); letter-spacing:-2px; line-height:1.08; margin:0 0 18px; font-family:var(--font-sans); }
        .sc-section-sub { font-size:17px; color:var(--fg-2); line-height:1.76; max-width:520px; margin:0; }

        /* ── Feature cards ── */
        .sc-feat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(270px,1fr)); gap:20px; margin-top:60px; }
        .sc-feat-card { background:var(--bg-card); border-radius:22px; padding:30px 28px; border:1.5px solid var(--border); box-shadow:var(--shadow); position:relative; overflow:hidden; cursor:default; }
        .sc-feat-card::before { content:''; position:absolute; inset:0; border-radius:inherit; background:linear-gradient(135deg,#6366f1,#8b5cf6); opacity:0; transition:opacity 0.28s !important; }
        .sc-feat-card:hover { transform:translateY(-6px); box-shadow:var(--shadow-lg); border-color:rgba(99,102,241,0.28); }
        .sc-feat-card:hover::before { opacity:0.04; }
        .sc-feat-icon-wrap { width:54px; height:54px; border-radius:16px; display:flex; align-items:center; justify-content:center; margin-bottom:22px; position:relative; z-index:1; }
        .sc-feat-icon-wrap svg { width:24px; height:24px; }
        .sc-feat-tag { display:inline-block; padding:3px 11px; border-radius:999px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:14px; position:relative; z-index:1; }
        .sc-feat-title { font-size:18px; font-weight:800; color:var(--fg); margin:0 0 10px; letter-spacing:-0.4px; position:relative; z-index:1; font-family:var(--font-sans); }
        .sc-feat-desc { font-size:14px; color:var(--fg-2); line-height:1.72; margin:0; position:relative; z-index:1; }
        .sc-feat-arrow { position:absolute; bottom:24px; right:24px; width:34px; height:34px; border-radius:50%; background:var(--bg-muted); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:14px; color:var(--fg-3); z-index:1; transition:all 0.22s !important; }
        .sc-feat-card:hover .sc-feat-arrow { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; border-color:transparent; transform:translate(2px,-2px); box-shadow:0 4px 14px rgba(99,102,241,0.42); }

        /* ── Preview section ── */
        .sc-preview-inner { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:1fr 1.1fr; gap:72px; align-items:center; }
        .sc-preview-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 14px; border-radius:999px; background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.22); font-size:12px; font-weight:700; color:#06b6d4; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:22px; font-family:var(--font-sans); }
        [data-theme="dark"] .sc-preview-badge { background:rgba(6,182,212,0.14); border-color:rgba(6,182,212,0.28); }
        .sc-check-list { list-style:none; padding:0; margin:28px 0 38px; display:flex; flex-direction:column; gap:14px; }
        .sc-check-item { display:flex; align-items:flex-start; gap:13px; font-size:15px; color:var(--fg-2); line-height:1.56; }
        .sc-check-mark { width:22px; height:22px; border-radius:7px; flex-shrink:0; margin-top:1px; background:linear-gradient(135deg,#10b981,#059669); display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(16,185,129,0.38); }
        .sc-check-mark svg { width:12px; height:12px; color:white; }

        /* ── Steps ── */
        .sc-steps-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; margin-top:60px; }
        .sc-step-card { background:var(--bg-card); border-radius:22px; padding:34px 30px; border:1.5px solid var(--border); position:relative; overflow:hidden; }
        .sc-step-card:hover { transform:translateY(-5px); box-shadow:var(--shadow-lg); }
        .sc-step-num { font-size:13px; font-weight:800; color:#6366f1; letter-spacing:0.06em; margin-bottom:18px; font-family:'DM Mono',monospace; }
        [data-theme="dark"] .sc-step-num { color:#818cf8; }
        .sc-step-title { font-size:19px; font-weight:800; color:var(--fg); margin:0 0 10px; letter-spacing:-0.4px; font-family:var(--font-sans); }
        .sc-step-body { font-size:14px; color:var(--fg-2); line-height:1.72; margin:0; }
        .sc-step-line { position:absolute; bottom:0; left:0; right:0; height:3px; background:linear-gradient(90deg,#6366f1,#06b6d4); opacity:0.7; }

        /* ── CTA ── */
        .sc-cta-section { padding:108px 28px; background:var(--hero-bg); position:relative; overflow:hidden; text-align:center; }
        .sc-cta-inner { position:relative; z-index:1; max-width:640px; margin:0 auto; }
        .sc-cta-eyebrow { display:inline-flex; align-items:center; gap:8px; padding:7px 18px; border-radius:999px; background:rgba(99,102,241,0.2); border:1px solid rgba(99,102,241,0.35); font-size:12px; font-weight:700; color:rgba(255,255,255,0.72); letter-spacing:0.06em; text-transform:uppercase; margin-bottom:26px; font-family:var(--font-sans); }
        .sc-cta-h2 { font-size:clamp(32px,4.5vw,56px); font-weight:900; color:white; letter-spacing:-2.5px; line-height:1.08; margin:0 0 18px; font-family:var(--font-sans); }
        .sc-cta-sub { font-size:17px; color:rgba(255,255,255,0.52); line-height:1.72; margin:0 0 40px; }
        .sc-cta-actions { display:flex; justify-content:center; gap:14px; flex-wrap:wrap; }

        /* ── Footer ── */
        .sc-footer { background:var(--footer-bg); border-top:1px solid var(--border); padding:44px 28px; }
        .sc-footer-inner { max-width:1200px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:20px; }
        .sc-footer-brand { display:flex; align-items:center; gap:10px; }
        .sc-footer-brand-logo { width:32px; height:32px; border-radius:9px; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:12px; color:white; }
        .sc-footer-brand-name { font-size:15px; font-weight:800; color:var(--fg); letter-spacing:-0.4px; font-family:var(--font-sans); }
        .sc-footer-copy { font-size:13px; color:var(--fg-3); }
        .sc-footer-links { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
        .sc-footer-link { padding:7px 14px; border-radius:9px; font-size:13px; font-weight:600; cursor:pointer; border:1.5px solid var(--border); background:var(--bg-muted); color:var(--fg-2); font-family:var(--font-sans); transition:all 0.18s !important; }
        .sc-footer-link:hover { color:var(--fg); border-color:rgba(99,102,241,0.4); transform:translateY(-1px); }
        .sc-footer-about { color:#6366f1; font-weight:700; cursor:pointer; transition:color 0.15s !important; }
        .sc-footer-about:hover { color:#818cf8; text-decoration:underline; }

        @media(max-width:1024px) { .sc-preview-inner { grid-template-columns:1fr; gap:44px; } }
        @media(max-width:768px) {
          .sc-stats-inner { grid-template-columns:repeat(2,1fr); }
          .sc-stat-block:nth-child(2) { border-right:none; }
          .sc-stat-block:nth-child(1),.sc-stat-block:nth-child(2) { border-bottom:1px solid var(--border); }
          .sc-steps-grid { grid-template-columns:1fr; gap:14px; }
          .sc-feat-grid { grid-template-columns:1fr; }
          .sc-nav-pill { display:none; }
          .sc-hero { padding:80px 20px 90px; }
          .sc-mockup-body { flex-direction:column; }
          .sc-mock-sidebar { width:100%; min-width:unset; flex-direction:row; flex-wrap:wrap; padding:8px; border-right:none; border-bottom:1px solid rgba(255,255,255,0.052); }
          .sc-mock-brand { margin-bottom:0; }
          .sc-mock-stats { grid-template-columns:repeat(2,1fr); }
          .sc-mock-cards { grid-template-columns:1fr; }
        }
        @media(max-width:480px) {
          .sc-stats-inner { grid-template-columns:1fr; }
          .sc-stat-block { border-right:none !important; border-bottom:1px solid var(--border); }
          .sc-stat-block:last-child { border-bottom:none; }
        }
      `}</style>

      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <div className="sc-brand">
            <div className="sc-brand-logo">SC</div>
            <div>
              <div className="sc-brand-name">Smart Campus</div>
              <div className="sc-brand-sub">IAU Student Portal</div>
            </div>
          </div>
          <div className="sc-nav-right">
            <button className="sc-theme-toggle" onClick={toggleTheme} title={dark ? "Light mode" : "Dark mode"} aria-label="Toggle theme">
              <div className={`sc-theme-thumb ${dark ? "dark" : "light"}`}>{dark ? "🌙" : "☀️"}</div>
            </button>
            <button className="sc-nav-pill" onClick={() => navigate("/login")}>Sign In</button>
            <button className="sc-nav-cta" onClick={() => navigate("/register")}>Get Started</button>
          </div>
        </div>
      </nav>

      <section className="sc-hero">
        <div className="sc-hero-mesh" />
        <div className="sc-hero-grid" />
        <div className="sc-orb-1" />
        <div className="sc-orb-2" />
        <div className="sc-orb-3" />
        <div className="sc-hero-inner">
          <div className="sc-hero-badge">
            <div className="sc-hero-badge-dot" />
            Built for IAU Computer Science Students
          </div>
          <h1 className="sc-hero-h1">
            The campus platform<br />
            <span className="sc-hero-h1-accent">students actually use</span>
          </h1>
          <p className="sc-hero-sub">
            Schedules, tasks, real-time parking, and classroom navigation — unified in one beautifully designed portal.
          </p>
          <div className="sc-hero-actions">
            <button className="sc-btn-primary" onClick={() => navigate("/register")}>Start for free →</button>
            <button className="sc-btn-ghost" onClick={() => navigate("/login")}>Sign into dashboard</button>
          </div>
          <p className="sc-hero-trust">No credit card required &nbsp;·&nbsp; Always free for students</p>

          <div className="sc-hero-mockup-wrap">
            <div className="sc-mockup-browser">
              <div className="sc-mockup-bar">
                <div className="sc-mock-dot" style={{ background: "#ef4444" }} />
                <div className="sc-mock-dot" style={{ background: "#f59e0b" }} />
                <div className="sc-mock-dot" style={{ background: "#22c55e" }} />
                <div className="sc-mock-url">smartcampus.iau.edu.sa/dashboard</div>
              </div>
              <div className="sc-mockup-body">
                <div className="sc-mock-sidebar">
                  <div className="sc-mock-brand">
                    <div className="sc-mock-brand-logo">SC</div>
                    <div className="sc-mock-brand-name">Smart Campus</div>
                  </div>
                  {[
                    { icon: "⊞", label: "Dashboard", active: true },
                    { icon: "✓", label: "Tasks" },
                    { icon: "🗓", label: "Schedule" },
                    { icon: "P", label: "Parking" },
                    { icon: "⌂", label: "Classrooms" },
                  ].map((item, i) => (
                    <div key={i} className={`sc-mock-nav-item${item.active ? " active" : ""}`}>
                      <span style={{ fontSize: "11px" }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="sc-mock-content">
                  <div className="sc-mock-greeting">Good morning, Ahmed 👋</div>
                  <div className="sc-mock-subline">Sunday, May 25 · 3 classes today</div>
                  <div className="sc-mock-stats">
                    {[
                      { val: "8", label: "Total Tasks", color: "#6366f1" },
                      { val: "3", label: "Pending", color: "#f59e0b" },
                      { val: "5", label: "Completed", color: "#10b981" },
                      { val: "3", label: "Classes", color: "#06b6d4" },
                    ].map((s, i) => (
                      <div key={i} className="sc-mock-stat" style={{ borderTop: `2px solid ${s.color}` }}>
                        <div className="sc-mock-stat-val" style={{ color: s.color }}>{s.val}</div>
                        <div className="sc-mock-stat-label">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="sc-mock-cards">
                    <div className="sc-mock-card">
                      <div className="sc-mock-card-title">Today&apos;s Schedule</div>
                      {[
                        { name: "Data Structures", time: "8:00 — 9:30 AM", color: "#6366f1", live: true },
                        { name: "Operating Systems", time: "10:00 — 11:30 AM", color: "#06b6d4" },
                        { name: "Software Engineering", time: "1:00 — 2:30 PM", color: "#10b981" },
                      ].map((c, i) => (
                        <div key={i} className="sc-mock-class-item">
                          <div className="sc-mock-class-dot" style={{ background: c.color }} />
                          <div>
                            {c.live && (
                              <div className="sc-mock-live-badge">
                                <div className="sc-mock-live-dot" />LIVE
                              </div>
                            )}
                            <div className="sc-mock-class-name">{c.name}</div>
                            <div className="sc-mock-class-time">{c.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="sc-mock-card">
                      <div className="sc-mock-card-title">Pending Tasks</div>
                      {[
                        { text: "Submit OS Lab Report", done: false },
                        { text: "Review DSA notes", done: false },
                        { text: "Read Chapter 5", done: true },
                        { text: "Complete quiz prep", done: false },
                      ].map((t, i) => (
                        <div key={i} className="sc-mock-task">
                          <div className={`sc-mock-task-box${t.done ? " done" : ""}`} />
                          <span className={`sc-mock-task-text${t.done ? " done" : ""}`}>{t.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sc-stats-strip" ref={statsRef} data-section="stats">
        <div className="sc-stats-inner">
          {[
            { num: c170, suffix: "+", label: "Classrooms indexed", icon: "🏛" },
            { num: c4,   suffix: "",  label: "Campus parking zones", icon: "🅿" },
            { num: c24,  suffix: "/7", label: "Platform availability", icon: "⚡" },
            { num: null, text: "Free", suffix: "", label: "Always free for students", icon: "🎓" },
          ].map((s, i) => (
            <div
              key={i}
              className={`sc-stat-block sc-reveal${shown("stats") ? " is-visible" : ""}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="sc-stat-icon">{s.icon}</span>
              <div className="sc-stat-num">
                <span>{s.text !== undefined ? s.text : s.num}{s.suffix}</span>
              </div>
              <div className="sc-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="sc-section" data-section="features">
        <div className="sc-section-inner">
          <div className={`sc-reveal${shown("features") ? " is-visible" : ""}`}>
            <div className="sc-section-eyebrow"><span>✦</span> Platform Features</div>
            <h2 className="sc-section-title">Everything you need<br />on campus, in one place</h2>
            <p className="sc-section-sub">Four precision-crafted tools — built to work together and keep you on top of your academic life.</p>
          </div>
          <div className="sc-feat-grid">
            {FEATURES.map((f, i) => (
              <div
                key={f.id}
                className={`sc-feat-card sc-reveal${shown("features") ? " is-visible" : ""}`}
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                <div className="sc-feat-icon-wrap" style={{ background: f.gradient, boxShadow: `0 4px 16px ${f.accent}40` }}>
                  <span style={{ fontSize: "22px", display: "flex", alignItems: "center", justifyContent: "center", width: "52px", height: "52px", color: "white" }}
                    dangerouslySetInnerHTML={{ __html: `<div style="width:22px;height:22px;color:white">${f.icon}</div>` }}
                  />
                </div>
                <div className="sc-feat-tag" style={{ background: `${dark ? f.accentDark : f.accent}18`, color: dark ? f.accentDark : f.accent, border: `1px solid ${dark ? f.accentDark : f.accent}30` }}>
                  {f.tag}
                </div>
                <h3 className="sc-feat-title">{f.title}</h3>
                <p className="sc-feat-desc">{f.desc}</p>
                <div className="sc-feat-arrow">→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sc-section-alt" data-section="preview">
        <div className="sc-preview-inner">
          <div className={`sc-reveal${shown("preview") ? " is-visible" : ""}`}>
            <div className="sc-preview-badge"><span>⚡</span> Live Dashboard</div>
            <h2 className="sc-section-title">Your entire campus<br />life at a glance</h2>
            <ul className="sc-check-list">
              {[
                "Real-time class status — see what's live right now",
                "Pending tasks surfaced with priority and due dates",
                "Parking session tracking with zone details",
                "Quick navigation to every tool in one tap",
              ].map((item, i) => (
                <li key={i} className="sc-check-item">
                  <div className="sc-check-mark">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <button className="sc-btn-primary" style={{ fontSize: "15px", padding: "13px 28px" }} onClick={() => navigate("/register")}>
              Try it now →
            </button>
          </div>

          <div className={`sc-reveal${shown("preview") ? " is-visible" : ""}`} style={{ animationDelay: "0.15s" }}>
            <div className="sc-mockup-browser" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="sc-mockup-bar">
                <div className="sc-mock-dot" style={{ background: "#ef4444" }} />
                <div className="sc-mock-dot" style={{ background: "#f59e0b" }} />
                <div className="sc-mock-dot" style={{ background: "#22c55e" }} />
                <div className="sc-mock-url">Dashboard · Smart Campus</div>
              </div>
              <div style={{ background: "rgba(8,15,28,0.98)", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "20px" }}>🚗</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#34d399" }}>Parked — Zone B</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>Checked in at 7:45 AM</div>
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#10b981", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "999px", padding: "4px 10px" }}>Active</div>
                </div>
                <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Next Class</div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "white" }}>Operating Systems</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>🕐 10:00 — 11:30 AM · Room A11-204</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Task Progress</div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#818cf8" }}>5 / 8 done</div>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "62.5%", background: "linear-gradient(90deg,#6366f1,#06b6d4)", borderRadius: "3px" }} />
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "8px" }}>3 tasks due this week</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sc-section" data-section="howit">
        <div className="sc-section-inner">
          <div className={`sc-reveal${shown("howit") ? " is-visible" : ""}`} style={{ textAlign: "center", maxWidth: "560px", margin: "0 auto" }}>
            <div className="sc-section-eyebrow" style={{ justifyContent: "center" }}><span>◆</span> How it works</div>
            <h2 className="sc-section-title">Up and running in minutes</h2>
            <p className="sc-section-sub" style={{ margin: "0 auto" }}>Three steps from zero to fully organized.</p>
          </div>
          <div className="sc-steps-grid">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`sc-step-card sc-reveal${shown("howit") ? " is-visible" : ""}`}
                style={{ animationDelay: `${0.1 + i * 0.12}s` }}
              >
                <div className="sc-step-num">{s.n}</div>
                <h3 className="sc-step-title">{s.title}</h3>
                <p className="sc-step-body">{s.body}</p>
                <div className="sc-step-line" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sc-cta-section" data-section="cta">
        <div className="sc-hero-mesh" />
        <div className="sc-hero-grid" />
        <div className="sc-orb-1" style={{ opacity: 0.7 }} />
        <div className="sc-orb-2" style={{ opacity: 0.7 }} />
        <div className={`sc-cta-inner sc-reveal${shown("cta") ? " is-visible" : ""}`}>
          <div className="sc-cta-eyebrow"><span>🎓</span> Join your classmates</div>
          <h2 className="sc-cta-h2">Ready to transform your campus experience?</h2>
          <p className="sc-cta-sub">Join hundreds of IAU students using Smart Campus to stay organized, never miss a class, and navigate campus effortlessly.</p>
          <div className="sc-cta-actions">
            <button className="sc-btn-primary" onClick={() => navigate("/register")} style={{ fontSize: "16px", padding: "15px 36px" }}>
              Create free account →
            </button>
            <button className="sc-btn-ghost" onClick={() => navigate("/login")}>
              Already a member? Sign in
            </button>
          </div>
        </div>
      </section>

      <footer className="sc-footer">
        <div className="sc-footer-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <div className="sc-footer-brand">
              <div className="sc-footer-brand-logo">SC</div>
              <span className="sc-footer-brand-name">Smart Campus</span>
            </div>
            <span className="sc-footer-copy">
              © {new Date().getFullYear()} &nbsp;·&nbsp; Built by{" "}
              <span className="sc-footer-about" onClick={() => navigate("/about")}>Essa Abbas Al-Saffar</span>
              &nbsp;·&nbsp; IAU
            </span>
          </div>
          <div className="sc-footer-links">
            <button className="sc-footer-link" onClick={() => navigate("/about")}>About</button>
            <button className="sc-footer-link" onClick={() => navigate("/login")}>Sign in</button>
            <button className="sc-footer-link" onClick={() => navigate("/admin/login")}>Admin</button>
            <button className="sc-footer-link" onClick={toggleTheme} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
