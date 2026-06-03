import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import api from "../api/api";
import ScheduleDesignPreview, { DEFAULT_DESIGN, THEMES, BG_PRESETS, courseBaseColor } from "../components/ScheduleDesignPreview";

const SP_EXPORT_W = 960;

const getToken = () => localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("accessToken") || localStorage.getItem("jwt") || "";
const getUserKey = () => (localStorage.getItem("userEmail") || localStorage.getItem("userName") || "guest").toLowerCase().trim();
const getScheduleStorageKey = () => `schedule_${getUserKey()}`;

const colorIndexFromString = (colorStr) => {
  if (colorStr === null || colorStr === undefined) return null;
  const n = parseInt(colorStr, 10);
  if (!isNaN(n) && n >= 0 && n < COURSE_COLORS.length) return n;
  return null;
};

const mapEntry = (e) => {
  let time = "";
  if (e.startTime && e.endTime) {
    time = `${e.startTime.trim()} - ${e.endTime.trim()}`;
  } else if (e.time) {
    time = e.time.replace(/\s*-\s*/, " - ").trim();
  }
  return {
    id: e.id,
    courseName: e.courseName,
    day: e.dayOfWeek || e.day,
    time,
    room: e.room || e.classroom?.name || "",
    colorIndex: colorIndexFromString(e.color),
  };
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const DAY_SHORT = { Sunday: "Sun", Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu" };
const COURSE_COLORS = [
  { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", accent: "#2563eb" },
  { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", accent: "#16a34a" },
  { bg: "#fdf4ff", border: "#e9d5ff", text: "#7e22ce", accent: "#9333ea" },
  { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", accent: "#ea580c" },
  { bg: "#fefce8", border: "#fef08a", text: "#a16207", accent: "#ca8a04" },
  { bg: "#fff1f2", border: "#fecdd3", text: "#be123c", accent: "#e11d48" },
  { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1", accent: "#0284c7" },
  { bg: "#f7fee7", border: "#d9f99d", text: "#3f6212", accent: "#65a30d" },
];

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.trim().split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const formatDisplayTime = (timeStr) => {
  if (!timeStr) return "";
  const mins = parseTimeToMinutes(timeStr);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
};

const getDuration = (timeRange) => {
  if (!timeRange) return null;
  const parts = timeRange.split("-").map((t) => t.trim());
  if (parts.length < 2) return null;
  const diff = parseTimeToMinutes(parts[1]) - parseTimeToMinutes(parts[0]);
  if (diff <= 0) return null;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const getCurrentDayIndex = () => {
  const jsDay = new Date().getDay();
  const idx = DAYS.indexOf(["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][jsDay]);
  return idx >= 0 ? idx : 0;
};

const getCurrentMinutes = () => new Date().getHours() * 60 + new Date().getMinutes();

const generateTimeOptions = () => {
  const options = [];
  for (let minutes = 8 * 60; minutes <= 22 * 60; minutes += 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    options.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

const CARD_STYLES = [
  {id:"rounded",  label:"Rounded",  desc:"Balanced"},
  {id:"compact",  label:"Compact",  desc:"Dense"},
  {id:"detailed", label:"Detailed", desc:"Full info"},
  {id:"large",    label:"Large",    desc:"Spacious"},
];

function SpTog({on, onChange, label}) {
  return (
    <div className="sp-tog" onClick={() => onChange(!on)}>
      <div className="sp-tog-track" style={{background: on ? "#4f6ef7" : "var(--sp-muted2)"}}>
        <div className="sp-tog-thumb" style={{transform: on ? "translateX(17px)" : "none"}} />
      </div>
      <span style={{fontSize:"13px",color:"var(--sp-text-2)",userSelect:"none"}}>{label}</span>
    </div>
  );
}

function SpAcc({open, onToggle, title, children}) {
  return (
    <div style={{background:"var(--sp-card)",border:"1.5px solid var(--sp-border)",borderRadius:14,overflow:"hidden",marginBottom:8,boxShadow:"var(--sp-shadow)"}}>
      <button className="sp-acc-hdr" onClick={onToggle}>
        <span style={{fontSize:"11px",fontWeight:"700",color:"var(--sp-text-2)",textTransform:"uppercase",letterSpacing:"0.07em"}}>{title}</span>
        <span className="sp-acc-arr" style={{transform:open?"rotate(180deg)":"none"}}>▼</span>
      </button>
      {open && <div style={{padding:"0 14px 14px"}}>{children}</div>}
    </div>
  );
}

export default function SchedulePage() {
  const theme = localStorage.getItem("sc-theme") || "light";

  const [courseName, setCourseName] = useState("");
  const [day, setDay]               = useState("Sunday");
  const [startTime, setStartTime]   = useState("");
  const [endTime, setEndTime]       = useState("");
  const [room, setRoom]             = useState("");
  const [schedule, setSchedule]     = useState([]);
  const [rooms, setRooms]           = useState([]);
  const [activeDay, setActiveDay]   = useState(DAYS[getCurrentDayIndex()]);
  const [viewMode, setViewMode]     = useState("week");
  const [showForm, setShowForm]     = useState(false);
  const [toast, setToast]           = useState("");
  const [courseColorMap, setCourseColorMap] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [importDesign, setImportDesign] = useState(null);
  const [designView, setDesignView] = useState(true);
  const [styleOpen, setStyleOpen] = useState(false);
  const [styleDesign, setStyleDesign] = useState(null);
  const [openSec, setOpenSec] = useState(new Set(["theme"]));
  const scheduleRef = useRef(null);

  const buildColorMap = (entries) => {
    const colorMap = {};
    entries.forEach((e) => {
      if (!colorMap[e.courseName]) {
        const idx = Object.keys(colorMap).length % COURSE_COLORS.length;
        const resolvedIdx = e.colorIndex !== null && e.colorIndex !== undefined ? e.colorIndex % COURSE_COLORS.length : idx;
        colorMap[e.courseName] = COURSE_COLORS[resolvedIdx];
      }
    });
    return colorMap;
  };

  const saveSchedule = (updated) => {
    setSchedule(updated);
    localStorage.setItem(getScheduleStorageKey(), JSON.stringify(updated));
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/schedule");
        const entries = Array.isArray(res.data) ? res.data.map(mapEntry) : [];
        saveSchedule(entries);
        setCourseColorMap(buildColorMap(entries));
      } catch (err) {
        const raw = JSON.parse(localStorage.getItem(getScheduleStorageKey()) || "[]");
        const saved = raw.map((e) => {
          if (e.colorIndex === undefined && e.color !== undefined) {
            return { ...e, colorIndex: colorIndexFromString(e.color) };
          }
          return e;
        });
        setSchedule(saved);
        setCourseColorMap(buildColorMap(saved));
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          showToast("⚠️ Session expired. Please login again.");
        }
      }
      setRooms(JSON.parse(localStorage.getItem("classrooms") || "[]"));
      try {
        const dRes = await api.get("/schedule-design");
        if (dRes.data?.designJson) {
          setImportDesign({...DEFAULT_DESIGN, ...JSON.parse(dRes.data.designJson)});
        } else {
          const saved = localStorage.getItem("sil_design_v1");
          if (saved) setImportDesign({...DEFAULT_DESIGN, ...JSON.parse(saved)});
        }
      } catch {
        try {
          const saved = localStorage.getItem("sil_design_v1");
          if (saved) setImportDesign({...DEFAULT_DESIGN, ...JSON.parse(saved)});
        } catch {}
      }
    };
    load();
  }, []);

  const assignColor = (name) => {
    if (courseColorMap[name]) {
      const idx = COURSE_COLORS.indexOf(courseColorMap[name]);
      return { colorObj: courseColorMap[name], colorIndex: idx >= 0 ? idx : 0 };
    }
    const idx = Object.keys(courseColorMap).length % COURSE_COLORS.length;
    const colorObj = COURSE_COLORS[idx];
    setCourseColorMap((prev) => ({ ...prev, [name]: colorObj }));
    return { colorObj, colorIndex: idx };
  };

  const resolveRoomPayload = () => {
    if (room && typeof room === "object") {
      return { roomName: String(room.name || room.roomName || room.label || "").trim(), classroomId: room.id ?? room.classroomId ?? null };
    }
    const typed = String(room || "").trim();
    if (!typed) return { roomName: "", classroomId: null };
    const matched = rooms.find((r) => String(r?.name || r?.roomName || r || "").trim().toLowerCase() === typed.toLowerCase()) || null;
    if (matched) return { roomName: String(matched.name || matched.roomName || typed).trim(), classroomId: matched.id ?? matched.classroomId ?? null };
    return { roomName: typed, classroomId: null };
  };

  const addSchedule = async () => {
    if (!courseName.trim() || !day || !startTime || !endTime || !String(room || "").trim()) {
      showToast("⚠️ Please fill in all fields");
      return;
    }
    if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) {
      showToast("⚠️ End time must be after start time");
      return;
    }
    if (!getToken()) {
      showToast("⚠️ No token found. Please login again.");
      return;
    }

    const { colorIndex } = assignColor(courseName.trim());
    const { roomName, classroomId } = resolveRoomPayload();
    const payload = { courseName: courseName.trim(), dayOfWeek: day, startTime, endTime, room: roomName, color: String(colorIndex) };
    if (classroomId !== null && classroomId !== undefined) payload.classroomId = classroomId;

    try {
      const res = await api.post("/schedule", payload);
      try {
        const refreshed = await api.get("/schedule");
        const entries = Array.isArray(refreshed.data) ? refreshed.data.map(mapEntry) : [];
        saveSchedule(entries);
        setCourseColorMap(buildColorMap(entries));
      } catch {
        const newEntry = mapEntry(res.data);
        saveSchedule([...schedule, newEntry]);
      }
      showToast("✅ Class added!");
      setCourseName(""); setStartTime(""); setEndTime(""); setRoom(""); setShowForm(false);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        showToast("⚠️ Unauthorized. Please login again.");
      } else {
        showToast("❌ Failed to save class to server");
      }
    }
  };

  const deleteSchedule = async (id) => {
    try {
      await api.delete(`/schedule/${id}`);
      try {
        const refreshed = await api.get("/schedule");
        const entries = Array.isArray(refreshed.data) ? refreshed.data.map(mapEntry) : [];
        saveSchedule(entries);
        setCourseColorMap(buildColorMap(entries));
      } catch {
        saveSchedule(schedule.filter((s) => s.id !== id));
      }
      showToast("🗑 Class removed");
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        showToast("⚠️ Unauthorized. Please login again.");
      } else {
        showToast("❌ Failed to delete class from server");
      }
    }
  };

  const getDayEntries = (dayName) =>
    schedule.filter((s) => s.day === dayName).sort((a, b) => parseTimeToMinutes(a.time?.split("-")[0]?.trim()) - parseTimeToMinutes(b.time?.split("-")[0]?.trim()));

  const captureScheduleCanvas = async (bgColor = "#ffffff") => {
    if (!scheduleRef.current) throw new Error("Schedule not mounted");
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.min(Math.max(dpr, 2), 3);
    return html2canvas(scheduleRef.current, {
      scale,
      useCORS: true,
      backgroundColor: bgColor,
      logging: false,
      width: SP_EXPORT_W,
      windowWidth: SP_EXPORT_W,
      onclone: (_, el) => {
        el.style.width = SP_EXPORT_W + "px";
        el.style.maxWidth = SP_EXPORT_W + "px";
        el.style.overflow = "visible";

        el.querySelectorAll(".icon-btn").forEach(btn => { btn.style.display = "none"; });
        el.querySelectorAll("*").forEach(child => {
          if (child.style.overflowX === "auto" || child.style.overflow === "auto") {
            child.style.overflowX = "visible";
            child.style.overflow = "visible";
          }
          const mw = parseFloat(child.style.minWidth);
          if (!isNaN(mw) && mw > 0) child.style.minWidth = Math.max(mw, SP_EXPORT_W - 40) + "px";
        });
      },
    });
  };

  const exportSchedulePNG = async () => {
    if (!scheduleRef.current || schedule.length === 0) { showToast("⚠️ No schedule to export"); return; }
    setIsExporting(true);
    showToast("📸 Generating PNG…");
    try {
      const bg = theme === "dark" ? "#060b14" : "#f4f6fb";
      const canvas = await captureScheduleCanvas(bg);
      const link = document.createElement("a");
      link.download = "my-schedule.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      showToast("✅ PNG downloaded!");
    } catch (err) {
      showToast("❌ Export failed");
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const exportSchedulePDF = async () => {
    if (!scheduleRef.current || schedule.length === 0) { showToast("⚠️ No schedule to export"); return; }
    setIsExporting(true);
    showToast("📄 Generating PDF…");
    try {
      const canvas = await captureScheduleCanvas("#ffffff");
      const imgData = canvas.toDataURL("image/png");
      const pdfW = SP_EXPORT_W;
      const pdfH = Math.round((canvas.height / canvas.width) * pdfW);
      const pdf = new jsPDF({
        orientation: pdfW > pdfH ? "landscape" : "portrait",
        unit: "px",
        format: [pdfW, pdfH],
        hotfixes: ["px_scaling"],
      });
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save("my-schedule.pdf");
      showToast("✅ PDF downloaded!");
    } catch (err) {
      showToast("❌ PDF export failed");
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const shareScheduleImage = async () => {
    if (!scheduleRef.current || schedule.length === 0) { showToast("⚠️ No schedule to share"); return; }
    setIsExporting(true);
    showToast("📸 Preparing image…");
    try {
      const bg = theme === "dark" ? "#060b14" : "#f4f6fb";
      const canvas = await captureScheduleCanvas(bg);
      canvas.toBlob(async (blob) => {
        if (!blob) { showToast("❌ Image generation failed"); setIsExporting(false); return; }
        const file = new File([blob], "my-schedule.png", { type: "image/png" });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: "My Schedule — Smart Campus" });
            showToast("✅ Shared!");
          } catch (e) {
            if (e.name !== "AbortError") {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = "my-schedule.png"; a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              showToast("✅ Image saved!");
            }
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = "my-schedule.png"; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          showToast("✅ Image saved!");
        }
        setIsExporting(false);
      }, "image/png");
    } catch (err) {
      showToast("❌ Export failed");
      console.error(err);
      setIsExporting(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = styleOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [styleOpen]);

  const toggleSec = (id) => setOpenSec(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const setSD = (k, v) => setStyleDesign(d => ({...d, [k]: v}));
  const openStylePanel = () => { setStyleDesign({...DEFAULT_DESIGN, ...(importDesign||{})}); setStyleOpen(true); };
  const saveStyle = async () => {
    const d = styleDesign;
    localStorage.setItem("sil_design_v1", JSON.stringify(d));
    setImportDesign({...d});
    setDesignView(true);
    setStyleOpen(false);
    try { await api.post("/schedule-design", { designJson: JSON.stringify(d) }); } catch {}
  };

  const toDesignCourses = (entries) => entries.map(e => {
    const parts = (e.time || "").split(" - ");
    return { id: e.id, name: e.courseName, day: e.day, startTime: parts[0] || "", endTime: parts[1] || "", room: e.room || "", emoji: "📚" };
  });

  const totalClasses  = schedule.length;
  const todayClasses  = getDayEntries(DAYS[getCurrentDayIndex()]).length;
  const uniqueCourses = [...new Set(schedule.map((s) => s.courseName))].length;
  const availableEndTimes = TIME_OPTIONS.filter((time) => !startTime || parseTimeToMinutes(time) > parseTimeToMinutes(startTime));

  return (
    <div data-theme={theme} style={page}>
      <style>{`
[data-theme="light"] {
  --sp-bg: #f4f6fb; --sp-card: #ffffff; --sp-muted: #f1f5f9; --sp-muted2: #e8edf5;
  --sp-border: #e2e8f0; --sp-border2: #edf0f7;
  --sp-text: #0a0f1e; --sp-text-2: #3d4f6e; --sp-text-3: #8596b0;
  --sp-shadow: 0 1px 4px rgba(10,15,30,0.05),0 2px 12px rgba(10,15,30,0.04);
  --sp-shadow-lg: 0 4px 20px rgba(10,15,30,0.09);
  --sp-input-bg: #f8fafc;
  --sp-no-class-bg: #fafafa;
}
[data-theme="dark"] {
  --sp-bg: #060b14; --sp-card: #0c1322; --sp-muted: #101a2e; --sp-muted2: #152036;
  --sp-border: rgba(255,255,255,0.09); --sp-border2: rgba(255,255,255,0.05);
  --sp-text: #eef2f8; --sp-text-2: #8599b8; --sp-text-3: #4e6380;
  --sp-shadow: 0 2px 8px rgba(0,0,0,0.25);
  --sp-shadow-lg: 0 6px 24px rgba(0,0,0,0.4);
  --sp-input-bg: #0f1929;
  --sp-no-class-bg: #0c1322;
}
* { box-sizing: border-box; }
.hover-card { transition: box-shadow 0.18s, transform 0.18s; }
.hover-card:hover { box-shadow: var(--sp-shadow-lg); transform: translateY(-2px); }
.day-tab { transition: all 0.18s; cursor: pointer; user-select: none; }
.day-tab:hover { background: var(--sp-muted) !important; }
.icon-btn { transition: all 0.15s; cursor: pointer; border: none; background: none; }
.icon-btn:hover { color: #ef4444 !important; background: rgba(239,68,68,0.1) !important; }
.form-input:focus { outline: none; border-color: #4f6ef7 !important; box-shadow: 0 0 0 3px rgba(79,110,247,0.14) !important; background: var(--sp-card) !important; }
.add-btn { transition: filter 0.15s, transform 0.1s, box-shadow 0.15s; }
.add-btn:hover { filter: brightness(1.10); }
.add-btn:active { transform: scale(0.97); }
@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
@keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
.fade-in { animation: fadeUp 0.3s ease; }
.slide-in { animation: slideIn 0.25s ease; }
@media(max-width:900px) { .sc-week-grid { min-width: 600px !important; } }
.sp-tc{border:2px solid var(--sp-border);border-radius:12px;cursor:pointer;overflow:hidden;transition:all 0.2s;display:flex;align-items:center;gap:10px;padding:9px 11px;-webkit-tap-highlight-color:transparent;}
.sp-tc:hover{border-color:#4f6ef7;transform:translateY(-1px);}
.sp-tc.on{border-color:#4f6ef7;box-shadow:0 0 0 3px rgba(79,110,247,0.18);}
.sp-co{padding:9px 10px;border-radius:10px;border:1.5px solid var(--sp-border);background:var(--sp-muted);cursor:pointer;transition:all 0.15s;text-align:center;-webkit-tap-highlight-color:transparent;}
.sp-co:hover{border-color:#4f6ef7;}
.sp-co.on{border-color:#4f6ef7;background:rgba(79,110,247,0.08);}
.sp-co-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
.sp-sw{width:34px;height:34px;border-radius:9px;cursor:pointer;border:2.5px solid transparent;transition:all 0.15s;flex-shrink:0;-webkit-tap-highlight-color:transparent;}
.sp-sw:hover{transform:scale(1.12);}
.sp-sw.on{border-color:white;box-shadow:0 0 0 2.5px #4f6ef7;}
.sp-chip{padding:8px 13px;border-radius:10px;border:1.5px solid var(--sp-border);background:var(--sp-muted);color:var(--sp-text-2);font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s;text-align:center;font-family:inherit;-webkit-tap-highlight-color:transparent;}
.sp-chip:hover{border-color:#4f6ef7;}
.sp-chip.on{background:linear-gradient(135deg,rgba(79,110,247,0.12),rgba(124,58,237,0.10));border-color:#4f6ef7;color:#4f6ef7;}
.sp-tog{display:flex;align-items:center;gap:9px;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.sp-tog-track{width:38px;height:21px;border-radius:999px;transition:background 0.2s;display:flex;align-items:center;padding:0 3px;flex-shrink:0;}
.sp-tog-thumb{width:15px;height:15px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,0.25);transition:transform 0.2s;}
.sp-acc-hdr{width:100%;padding:12px 14px;border:none;background:none;display:flex;justify-content:space-between;align-items:center;cursor:pointer;font-family:inherit;-webkit-tap-highlight-color:transparent;}
.sp-acc-arr{transition:transform 0.2s;color:var(--sp-text-3);font-size:12px;}
.sp-lbl{font-size:10px;font-weight:700;color:var(--sp-text-3);text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:8px;}
.sp-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:1000;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;padding:20px;}
.sp-modal-box{background:var(--sp-card);border-radius:20px;width:100%;max-width:940px;max-height:calc(100vh - 40px);overflow-y:auto;overflow-x:hidden;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;margin-top:8px;}
.sp-modal-hdr{position:sticky;top:0;z-index:10;background:var(--sp-card);padding:20px 24px 14px;border-bottom:1.5px solid var(--sp-border);display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;}
.sp-modal-body{padding:20px 24px 28px;}
.sp-modal-btns{display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;}
.sp-modal-save{padding:10px 20px;border-radius:10px;border:none;background:linear-gradient(135deg,#4f6ef7,#7c3aed);color:white;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(79,110,247,0.3);white-space:nowrap;}
.sp-modal-ghost{padding:10px 20px;border-radius:10px;border:1.5px solid var(--sp-border);background:var(--sp-muted);color:var(--sp-text-2);font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;white-space:nowrap;}
.sp-preview-wrap{flex:1;min-width:0;}
.sp-preview-box{background:var(--sp-muted);border:1.5px solid var(--sp-border);border-radius:16px;padding:14px;max-width:100%;overflow:hidden;}
.sp-preview-inner{overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%;}
.sp-preview-hint{display:none;}
@media(max-width:900px){.sp-preview-hint{display:block;font-size:11px;color:var(--sp-text-3);margin-bottom:8px;text-align:center;}}
@media(max-width:900px){
  .sp-modal-overlay{padding:0;}
  .sp-modal-box{border-radius:0;max-height:100svh;max-height:100vh;margin:0;width:100%;}
  .sp-modal-hdr{padding:14px 16px 12px;}
  .sp-modal-body{padding:14px 16px 32px;}
  .sp-modal-btns{width:100%;}
  .sp-modal-save{flex:1;text-align:center;}
  .sp-modal-ghost{flex:1;text-align:center;}
  .sp-style-layout{flex-direction:column;}
  .sp-style-ctrl{width:100%!important;}
}
@media(max-width:600px){
  .sp-modal-hdr{padding:12px 14px 10px;}
  .sp-modal-body{padding:12px 12px 32px;}
  .sp-tc{padding:12px 13px;min-height:52px;}
  .sp-co{padding:12px 10px;min-height:52px;}
  .sp-co-grid{grid-template-columns:1fr!important;}
  .sp-sw{width:42px!important;height:42px!important;border-radius:11px!important;}
  .sp-chip{padding:12px 13px;font-size:13px;min-height:48px;}
  .sp-tog{min-height:48px;}
  .sp-acc-hdr{padding:15px 16px;min-height:52px;}
  .sp-color-input{width:42px!important;height:42px!important;}
}
      `}</style>

      {toast && <div style={toastStyle}>{toast}</div>}

      <div style={container}>
        <div style={headerRow}>
          <div>
            <h1 style={titleStyle}>Weekly Schedule</h1>
            <p style={subtitleStyle}>Manage and view your class timetable</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>

            {schedule.length > 0 && (
              <>
                <button
                  onClick={shareScheduleImage}
                  disabled={isExporting}
                  title="Share or save to Photos"
                  style={{ padding: "8px 13px", borderRadius: "10px", border: "1.5px solid var(--sp-border)", background: "var(--sp-card)", color: "var(--sp-text-2)", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "'Inter','DM Sans'", display: "flex", alignItems: "center", gap: "5px", opacity: isExporting ? 0.5 : 1 }}>
                  {isExporting ? "⏳" : "📤"} Share
                </button>
                <button
                  onClick={exportSchedulePNG}
                  disabled={isExporting}
                  title="Export as PNG image"
                  style={{ padding: "8px 13px", borderRadius: "10px", border: "1.5px solid var(--sp-border)", background: "var(--sp-card)", color: "var(--sp-text-2)", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "'Inter','DM Sans'", display: "flex", alignItems: "center", gap: "5px", opacity: isExporting ? 0.5 : 1 }}>
                  🖼 PNG
                </button>
                <button
                  onClick={exportSchedulePDF}
                  disabled={isExporting}
                  title="Export as PDF"
                  style={{ padding: "8px 13px", borderRadius: "10px", border: "1.5px solid var(--sp-border)", background: "var(--sp-card)", color: "var(--sp-text-2)", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "'Inter','DM Sans'", display: "flex", alignItems: "center", gap: "5px", opacity: isExporting ? 0.5 : 1 }}>
                  📄 PDF
                </button>
              </>
            )}
            <Link to="/schedule-import-lab" style={{ padding: "8px 14px", borderRadius: "10px", border: "1.5px solid rgba(79,110,247,0.3)", background: "rgba(79,110,247,0.06)", color: "#4f6ef7", fontSize: "12px", fontWeight: "700", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.02em" }}>
              🎓 Import
            </Link>
            <button className="add-btn" onClick={() => setShowForm(!showForm)} style={addBtnStyle}>
              {showForm ? "✕ Cancel" : "+ Add Class"}
            </button>
          </div>
        </div>

        <div style={statsRow}>
          {[
            { label: "Total Classes",   value: totalClasses,  color: "#2563eb" },
            { label: "Today's Classes", value: todayClasses,  color: "#16a34a" },
            { label: "Courses",         value: uniqueCourses, color: "#9333ea" },
          ].map((stat) => (
            <div key={stat.label} style={statCard}>
              <span style={{ fontSize: "26px", fontWeight: "800", color: stat.color, fontFamily: "'Inter','DM Mono'" }}>{stat.value}</span>
              <span style={{ fontSize: "12px", color: "var(--sp-text-3)", marginTop: "2px" }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {showForm && (
          <div style={formCard} className="slide-in">
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "var(--sp-text)" }}>Add New Class</h3>
            <div style={formGrid}>
              <div style={formGroup}>
                <label style={formLabel}>Course Name</label>
                <input className="form-input" style={formInput} type="text" placeholder="e.g. Data Structures" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={formLabel}>Day</label>
                <select className="form-input" style={formInput} value={day} onChange={(e) => setDay(e.target.value)}>
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={formGroup}>
                <label style={formLabel}>Start Time</label>
                <select className="form-input" style={formInput} value={startTime} onChange={(e) => { setStartTime(e.target.value); if (endTime && parseTimeToMinutes(endTime) <= parseTimeToMinutes(e.target.value)) setEndTime(""); }}>
                  <option value="">Select start time</option>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{formatDisplayTime(t)}</option>)}
                </select>
              </div>
              <div style={formGroup}>
                <label style={formLabel}>End Time</label>
                <select className="form-input" style={formInput} value={endTime} onChange={(e) => setEndTime(e.target.value)}>
                  <option value="">Select end time</option>
                  {availableEndTimes.map((t) => <option key={t} value={t}>{formatDisplayTime(t)}</option>)}
                </select>
              </div>
              <div style={{ ...formGroup, gridColumn: "1 / -1" }}>
                <label style={formLabel}>Room</label>
                <input className="form-input" style={formInput} type="text" placeholder="e.g. G101, Lab 3, Building A" value={typeof room === "object" ? room?.name || room?.roomName || "" : room} onChange={(e) => setRoom(e.target.value)} list="rooms-suggestions" />
                <datalist id="rooms-suggestions">
                  {rooms.map((r, i) => <option key={i} value={r.name || r.roomName || r} />)}
                </datalist>
              </div>
            </div>
            <button className="add-btn" onClick={addSchedule} style={confirmBtnStyle}>Add to Schedule →</button>
          </div>
        )}

        {schedule.length > 0 && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
            {importDesign && <button onClick={() => setDesignView(true)} style={{ padding: "8px 16px", borderRadius: "10px", border: `1.5px solid ${designView ? "var(--sp-text)" : "var(--sp-border)"}`, fontWeight: "700", fontSize: "12px", cursor: "pointer", fontFamily: "'Inter','DM Sans'", background: designView ? "var(--sp-text)" : "var(--sp-card)", color: designView ? "var(--sp-bg)" : "var(--sp-text-2)" }}>🎨 Styled View</button>}
            {importDesign && <button onClick={() => setDesignView(false)} style={{ padding: "8px 16px", borderRadius: "10px", border: `1.5px solid ${!designView ? "var(--sp-text)" : "var(--sp-border)"}`, fontWeight: "700", fontSize: "12px", cursor: "pointer", fontFamily: "'Inter','DM Sans'", background: !designView ? "var(--sp-text)" : "var(--sp-card)", color: !designView ? "var(--sp-bg)" : "var(--sp-text-2)" }}>⚙️ Manage</button>}
            <button onClick={openStylePanel} style={{ padding: "8px 16px", borderRadius: "10px", border: "1.5px solid rgba(79,110,247,0.35)", fontWeight: "700", fontSize: "12px", cursor: "pointer", fontFamily: "'Inter','DM Sans'", background: "rgba(79,110,247,0.07)", color: "#4f6ef7" }}>✏️ Edit Style</button>
          </div>
        )}

        <div ref={scheduleRef}>
        {importDesign && schedule.length > 0 && designView && (
          <ScheduleDesignPreview courses={toDesignCourses(schedule)} design={importDesign} />
        )}
        {(!importDesign || !designView) && schedule.length > 0 && (
          <div style={viewToggleRow}>
            <div style={viewToggle}>
              {["week", "day"].map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "'Inter','DM Sans'", background: viewMode === mode ? "var(--sp-text)" : "transparent", color: viewMode === mode ? "var(--sp-bg)" : "var(--sp-text-3)", transition: "all 0.15s" }}>
                  {mode === "week" ? "📅 Week" : "📋 Day"}
                </button>
              ))}
            </div>
            <div style={dayTabs}>
              {DAYS.map((d) => {
                const count = getDayEntries(d).length;
                const isToday  = d === DAYS[getCurrentDayIndex()];
                const isActive = d === activeDay;
                return (
                  <div key={d} className="day-tab" onClick={() => { setActiveDay(d); setViewMode("day"); }} style={{ padding: "8px 14px", borderRadius: "10px", fontWeight: isActive ? "700" : "500", fontSize: "13px", color: isActive ? "white" : isToday ? "#4f6ef7" : "var(--sp-text-2)", background: isActive ? "#4f6ef7" : isToday ? "rgba(79,110,247,0.08)" : "var(--sp-card)", border: `1.5px solid ${isActive ? "#4f6ef7" : isToday ? "rgba(79,110,247,0.3)" : "var(--sp-border)"}`, position: "relative", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>{DAY_SHORT[d]}</span>
                    {count > 0 && <span style={{ background: isActive ? "rgba(255,255,255,0.3)" : "var(--sp-muted2)", color: isActive ? "white" : "var(--sp-text-2)", borderRadius: "999px", fontSize: "11px", padding: "1px 7px", fontWeight: "700" }}>{count}</span>}
                    {isToday && !isActive && <span style={{ width: "6px", height: "6px", background: "#4f6ef7", borderRadius: "50%", position: "absolute", top: "4px", right: "4px" }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {schedule.length === 0 && (
          <div style={emptyState}>
            <div style={{ fontSize: "52px", marginBottom: "14px" }}>🗓</div>
            <p style={{ fontWeight: "700", fontSize: "20px", color: "var(--sp-text)", margin: "0 0 8px" }}>No classes yet</p>
            <p style={{ color: "var(--sp-text-3)", margin: "0 0 20px" }}>Add your first class using the button above.</p>
            <button className="add-btn" onClick={() => setShowForm(true)} style={addBtnStyle}>+ Add First Class</button>
          </div>
        )}

        {(!importDesign || !designView) && schedule.length > 0 && viewMode === "week" && (
          <div style={{ overflowX: "auto" }}>
            <div className="sc-week-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${DAYS.length}, minmax(180px, 1fr))`, gap: "12px", minWidth: "820px" }}>
              {DAYS.map((d) => {
                const entries = getDayEntries(d);
                const isToday = d === DAYS[getCurrentDayIndex()];
                return (
                  <div key={d}>
                    <div style={{ padding: "10px 14px", borderRadius: "12px", marginBottom: "10px", textAlign: "center", background: isToday ? "var(--sp-text)" : "var(--sp-card)", border: `1.5px solid ${isToday ? "var(--sp-text)" : "var(--sp-border)"}` }}>
                      <div style={{ fontWeight: "700", fontSize: "14px", color: isToday ? "var(--sp-bg)" : "var(--sp-text)" }}>{d}</div>
                      {isToday && <div style={{ fontSize: "11px", color: "var(--sp-text-3)", marginTop: "2px" }}>Today</div>}
                      <div style={{ fontSize: "11px", color: isToday ? "var(--sp-text-3)" : "var(--sp-text-3)", marginTop: "2px" }}>{entries.length} {entries.length === 1 ? "class" : "classes"}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {entries.length === 0 ? (
                        <div style={{ padding: "20px 14px", textAlign: "center", color: "var(--sp-text-3)", fontSize: "13px", background: "var(--sp-muted)", borderRadius: "12px", border: "1.5px dashed var(--sp-border)" }}>No classes</div>
                      ) : (
                        entries.map((entry) => {
                          const color = courseColorMap[entry.courseName] || COURSE_COLORS[0];
                          const duration = getDuration(entry.time);
                          const parts = entry.time?.split("-").map((t) => t.trim());
                          return (
                            <div key={entry.id} className="hover-card fade-in" style={{ background: color.bg, border: `1.5px solid ${color.border}`, borderRadius: "12px", padding: "12px", position: "relative", borderLeft: `4px solid ${color.accent}` }}>
                              <button className="icon-btn" onClick={() => deleteSchedule(entry.id)} style={{ position: "absolute", top: "8px", right: "8px", color: "#cbd5e1", fontSize: "13px", padding: "3px 6px", borderRadius: "6px" }} title="Remove">✕</button>
                              <div style={{ fontWeight: "700", fontSize: "13px", color: color.text, marginBottom: "6px", paddingRight: "20px" }}>{entry.courseName}</div>
                              <div style={{ fontSize: "11px", color: "#64748b", display: "flex", flexDirection: "column", gap: "3px" }}>
                                <span>🕐 {parts?.[0] ? formatDisplayTime(parts[0]) : ""} – {parts?.[1] ? formatDisplayTime(parts[1]) : ""}</span>
                                {duration && <span style={{ color: color.text, fontWeight: "600" }}>⏱ {duration}</span>}
                                <span>📍 {entry.room}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(!importDesign || !designView) && schedule.length > 0 && viewMode === "day" && (
          <div style={dayViewContainer} className="fade-in">
            <h2 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "700", color: "var(--sp-text)", display: "flex", alignItems: "center", gap: "8px" }}>
              {activeDay}
              {activeDay === DAYS[getCurrentDayIndex()] && <span style={{ fontSize: "12px", background: "#2563eb", color: "white", padding: "3px 10px", borderRadius: "999px", fontWeight: "600" }}>Today</span>}
            </h2>
            {getDayEntries(activeDay).length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--sp-text-3)" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>😌</div>
                <p style={{ fontWeight: "600", color: "var(--sp-text-2)" }}>No classes on {activeDay}</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {getDayEntries(activeDay).map((entry) => {
                  const color = courseColorMap[entry.courseName] || COURSE_COLORS[0];
                  const duration = getDuration(entry.time);
                  const parts = entry.time?.split("-").map((t) => t.trim());
                  const startMins = parseTimeToMinutes(parts?.[0]);
                  const endMins   = parseTimeToMinutes(parts?.[1]);
                  const nowMins   = getCurrentMinutes();
                  const isOngoing = nowMins >= startMins && nowMins < endMins && activeDay === DAYS[getCurrentDayIndex()];
                  const isPast    = nowMins >= endMins && activeDay === DAYS[getCurrentDayIndex()];
                  return (
                    <div key={entry.id} className="hover-card fade-in" style={{ background: isPast ? "var(--sp-muted)" : "var(--sp-card)", border: `1.5px solid ${isOngoing ? color.accent : "var(--sp-border)"}`, borderRadius: "16px", padding: "18px 20px", display: "flex", gap: "18px", alignItems: "flex-start", opacity: isPast ? 0.6 : 1, boxShadow: isOngoing ? `0 0 0 3px ${color.accent}22` : "var(--sp-shadow)" }}>
                      <div style={{ minWidth: "80px", textAlign: "center" }}>
                        <div style={{ fontFamily: "'DM Mono'", fontSize: "13px", fontWeight: "600", color: color.accent }}>{parts?.[0] ? formatDisplayTime(parts[0]) : ""}</div>
                        <div style={{ width: "1px", height: "20px", background: "var(--sp-border)", margin: "6px auto" }} />
                        <div style={{ fontFamily: "'DM Mono'", fontSize: "13px", fontWeight: "600", color: "#94a3b8" }}>{parts?.[1] ? formatDisplayTime(parts[1]) : ""}</div>
                      </div>
                      <div style={{ width: "4px", borderRadius: "999px", background: color.accent, alignSelf: "stretch", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--sp-text)" }}>{entry.courseName}</h3>
                          {isOngoing && <span style={{ fontSize: "11px", background: color.bg, color: color.text, border: `1px solid ${color.border}`, padding: "3px 10px", borderRadius: "999px", fontWeight: "700" }}>🔴 Live</span>}
                          {isPast    && <span style={{ fontSize: "11px", background: "var(--sp-muted)", color: "var(--sp-text-3)", padding: "3px 10px", borderRadius: "999px", fontWeight: "600" }}>Done</span>}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
                          <span style={{ fontSize: "13px", color: "var(--sp-text-3)", display: "flex", alignItems: "center", gap: "5px" }}>📍 <strong style={{ color: "var(--sp-text-2)" }}>{entry.room}</strong></span>
                          {duration && <span style={{ fontSize: "13px", color: "var(--sp-text-3)", display: "flex", alignItems: "center", gap: "5px" }}>⏱ <strong style={{ color: "var(--sp-text-2)" }}>{duration}</strong></span>}
                        </div>
                      </div>
                      <button className="icon-btn" onClick={() => deleteSchedule(entry.id)} style={{ color: "#cbd5e1", fontSize: "15px", padding: "4px 8px", borderRadius: "8px", flexShrink: 0 }} title="Remove">✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {styleOpen && styleDesign && (
        <div className="sp-modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setStyleOpen(false);}}>
          <div className="sp-modal-box">
            <div className="sp-modal-hdr">
              <div>
                <h2 style={{margin:"0 0 3px",fontSize:"18px",fontWeight:"800",color:"var(--sp-text)"}}>Edit Style</h2>
                <p style={{margin:0,fontSize:"12px",color:"var(--sp-text-3)"}}>Preview updates live →</p>
              </div>
              <div className="sp-modal-btns">
                <button className="sp-modal-ghost" onClick={()=>setStyleOpen(false)}>Cancel</button>
                <button className="sp-modal-ghost" onClick={()=>setStyleDesign({...DEFAULT_DESIGN})}>↺ Reset</button>
                <button className="sp-modal-save" onClick={saveStyle}>Save Style</button>
              </div>
            </div>
            <div className="sp-modal-body">
              <div className="sp-style-layout" style={{display:"flex",gap:18,alignItems:"flex-start"}}>
                <div className="sp-style-ctrl" style={{width:290,flexShrink:0}}>

                  <SpAcc open={openSec.has("theme")} onToggle={()=>toggleSec("theme")} title="Theme">
                    <div style={{display:"flex",flexDirection:"column",gap:7}}>
                      {THEMES.map(th=>(
                        <div key={th.id} className={`sp-tc${styleDesign.theme===th.id?" on":""}`} onClick={()=>setSD("theme",th.id)}>
                          <div style={{width:34,height:34,borderRadius:9,background:th.previewBg,flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}/>
                          <div style={{flex:1}}>
                            <div style={{fontSize:"12px",fontWeight:"700",color:"var(--sp-text)"}}>{th.label}</div>
                            <div style={{fontSize:"10px",color:"var(--sp-text-3)"}}>{th.desc}</div>
                          </div>
                          {styleDesign.theme===th.id&&<span style={{color:"#4f6ef7",fontSize:"14px",flexShrink:0}}>✓</span>}
                        </div>
                      ))}
                    </div>
                  </SpAcc>

                  <SpAcc open={openSec.has("display")} onToggle={()=>toggleSec("display")} title="Display Mode">
                    <div style={{display:"flex",flexDirection:"column",gap:14}}>
                      <SpTog on={styleDesign.darkMode} onChange={v=>setSD("darkMode",v)} label="Dark mode preview"/>
                      <div>
                        <label className="sp-lbl">View Mode</label>
                        <div style={{display:"flex",gap:7}}>
                          {[{id:"week",label:"📅 Week"},{id:"day",label:"📋 Day Tabs"}].map(vm=>(
                            <button key={vm.id} className={`sp-chip${styleDesign.viewMode===vm.id?" on":""}`} style={{flex:1}} onClick={()=>setSD("viewMode",vm.id)}>{vm.label}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </SpAcc>

                  <SpAcc open={openSec.has("card")} onToggle={()=>toggleSec("card")} title="Card Style">
                    <div className="sp-co-grid">
                      {CARD_STYLES.map(cs=>(
                        <div key={cs.id} className={`sp-co${styleDesign.cardStyle===cs.id?" on":""}`} onClick={()=>setSD("cardStyle",cs.id)}>
                          <div style={{fontSize:"12px",fontWeight:"700",color:"var(--sp-text)"}}>{cs.label}</div>
                          <div style={{fontSize:"10px",color:"var(--sp-text-3)",marginTop:3}}>{cs.desc}</div>
                        </div>
                      ))}
                    </div>
                  </SpAcc>

                  <SpAcc open={openSec.has("colors")} onToggle={()=>toggleSec("colors")} title="Course Colors">
                    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                      {[
                        {id:"by-course",label:"By Course",desc:"Each subject has a unique color"},
                        {id:"by-day",   label:"By Day",   desc:"Color changes per day of week"},
                        {id:"custom",   label:"Custom",   desc:"Pick colors manually per course"},
                      ].map(cs=>(
                        <div key={cs.id} className={`sp-chip${styleDesign.colorStyle===cs.id?" on":""}`} style={{textAlign:"left",padding:"10px 13px",display:"flex",alignItems:"center",justifyContent:"space-between"}} onClick={()=>setSD("colorStyle",cs.id)}>
                          <div>
                            <div style={{fontSize:"12px",fontWeight:"700",color:"var(--sp-text)"}}>{cs.label}</div>
                            <div style={{fontSize:"10px",color:"var(--sp-text-3)",marginTop:2}}>{cs.desc}</div>
                          </div>
                          {styleDesign.colorStyle===cs.id&&<span style={{color:"#4f6ef7",flexShrink:0}}>✓</span>}
                        </div>
                      ))}
                    </div>
                    {styleDesign.colorStyle==="custom"&&(
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        <label className="sp-lbl">Per-course colors</label>
                        {[...new Set(schedule.map(e=>e.courseName))].map(name=>{
                          const col=(styleDesign.courseColorsByName||{})[name]||courseBaseColor(name);
                          return(
                            <div key={name} style={{display:"flex",alignItems:"center",gap:10}}>
                              <input type="color" value={col} onChange={e=>setSD("courseColorsByName",{...(styleDesign.courseColorsByName||{}),[name]:e.target.value})}
                                className="sp-color-input" style={{width:34,height:34,borderRadius:9,border:"1.5px solid var(--sp-border)",padding:2,cursor:"pointer",background:"none",flexShrink:0}}/>
                              <span style={{fontSize:"12px",color:"var(--sp-text-2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📚 {name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SpAcc>

                  <SpAcc open={openSec.has("bg")} onToggle={()=>toggleSec("bg")} title="Background">
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                      {BG_PRESETS.map(bg=>(
                        <div key={bg.id} title={bg.label} className={`sp-sw${styleDesign.bgPreset===bg.id?" on":""}`}
                          style={{background:bg.bg}} onClick={()=>setSD("bgPreset",bg.id)}/>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <input type="color" value={styleDesign.bgCustom||"#f8fafc"} onChange={e=>{setSD("bgCustom",e.target.value);setSD("bgPreset","custom");}}
                        className="sp-color-input" style={{width:36,height:36,borderRadius:9,border:"1.5px solid var(--sp-border)",padding:2,cursor:"pointer",background:"none",flexShrink:0}}/>
                      <span style={{fontSize:"11px",color:"var(--sp-text-3)"}}>Custom color</span>
                    </div>
                  </SpAcc>

                  <SpAcc open={openSec.has("show")} onToggle={()=>toggleSec("show")} title="Show / Hide">
                    <div style={{display:"flex",flexDirection:"column",gap:14}}>
                      <SpTog on={styleDesign.showEmoji} onChange={v=>setSD("showEmoji",v)} label="Course emojis"/>
                      <SpTog on={styleDesign.showRoom} onChange={v=>setSD("showRoom",v)} label="Room / location"/>
                      <SpTog on={styleDesign.showDuration} onChange={v=>setSD("showDuration",v)} label="Duration"/>
                    </div>
                  </SpAcc>

                </div>
                <div className="sp-preview-wrap">
                  <div className="sp-preview-box">
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                      <span style={{fontSize:"11px",fontWeight:"700",color:"var(--sp-text-2)"}}>Live Preview</span>
                      <span style={{fontSize:"10px",background:"rgba(79,110,247,0.12)",color:"#4f6ef7",padding:"2px 8px",borderRadius:"999px",fontWeight:"700",border:"1px solid rgba(79,110,247,0.2)"}}>{THEMES.find(t=>t.id===styleDesign.theme)?.label}</span>
                    </div>
                    <p className="sp-preview-hint">👆 Swipe horizontally to view all days</p>
                    <div className="sp-preview-inner">
                      <ScheduleDesignPreview courses={toDesignCourses(schedule)} design={styleDesign}/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const page             = { padding: "24px 20px 48px", fontFamily: "'Inter','DM Sans',sans-serif", minHeight: "100vh", background: "var(--sp-bg)" };
const container        = { maxWidth: "1100px", margin: "0 auto" };
const headerRow        = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "22px" };
const titleStyle       = { fontSize: "30px", fontWeight: "800", color: "var(--sp-text)", margin: "0 0 4px", letterSpacing: "-0.6px" };
const subtitleStyle    = { color: "var(--sp-text-3)", fontSize: "14.5px", margin: 0 };
const addBtnStyle      = { padding: "11px 22px", borderRadius: "11px", border: "none", background: "linear-gradient(135deg,#4f6ef7,#7c3aed)", color: "white", fontWeight: "700", fontSize: "14px", cursor: "pointer", fontFamily: "'Inter','DM Sans'", boxShadow: "0 4px 14px rgba(79,110,247,0.3)", letterSpacing: "-0.1px" };
const statsRow         = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" };
const statCard         = { background: "var(--sp-card)", borderRadius: "18px", padding: "18px 20px", border: "1px solid var(--sp-border)", display: "flex", flexDirection: "column", boxShadow: "var(--sp-shadow)" };
const formCard         = { background: "var(--sp-card)", borderRadius: "18px", padding: "24px", border: "1px solid var(--sp-border)", boxShadow: "var(--sp-shadow)", marginBottom: "20px" };
const formGrid         = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "16px" };
const formGroup        = { display: "flex", flexDirection: "column", gap: "6px" };
const formLabel        = { fontSize: "11.5px", fontWeight: "700", color: "var(--sp-text-3)", textTransform: "uppercase", letterSpacing: "0.07em" };
const formInput        = { padding: "11px 14px", borderRadius: "10px", border: "1.5px solid var(--sp-border)", fontSize: "14px", background: "var(--sp-input-bg)", color: "var(--sp-text)", fontFamily: "'Inter','DM Sans'", width: "100%" };
const confirmBtnStyle  = { padding: "12px 26px", borderRadius: "11px", border: "none", background: "var(--sp-text)", color: "var(--sp-bg)", fontWeight: "700", fontSize: "14px", cursor: "pointer", fontFamily: "'Inter','DM Sans'", boxShadow: "var(--sp-shadow)" };
const viewToggleRow    = { display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" };
const viewToggle       = { display: "inline-flex", background: "var(--sp-muted)", borderRadius: "10px", padding: "4px", width: "fit-content" };
const dayTabs          = { display: "flex", gap: "8px", flexWrap: "wrap" };
const dayViewContainer = { background: "var(--sp-card)", borderRadius: "20px", padding: "26px", border: "1px solid var(--sp-border)", boxShadow: "var(--sp-shadow)" };
const emptyState       = { textAlign: "center", padding: "60px 20px", background: "var(--sp-card)", borderRadius: "20px", border: "1.5px dashed var(--sp-border)" };
const toastStyle       = { position: "fixed", bottom: "28px", left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "white", padding: "13px 26px", borderRadius: "999px", fontSize: "14px", fontWeight: "700", boxShadow: "0 10px 30px rgba(0,0,0,0.22)", zIndex: 9999, fontFamily: "'Inter','DM Sans'", whiteSpace: "nowrap" };
