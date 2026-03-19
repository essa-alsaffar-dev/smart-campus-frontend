import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = "https://smart-campus-backend-production-bf5e.up.railway.app";
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday"];
const DAY_SHORT = { Sunday:"Sun", Monday:"Mon", Tuesday:"Tue", Wednesday:"Wed", Thursday:"Thu" };
const COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#84cc16"];

export default function SchedulePage() {
  const [schedule,   setSchedule]   = useState([]);
  const [rooms,      setRooms]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState("");
  const [toastType,  setToastType]  = useState("ok");
  const [showForm,   setShowForm]   = useState(false);
  const [activeDay,  setActiveDay]  = useState(() => {
    const d = new Date().getDay();
    return DAYS[d] || "Sunday";
  });
  const [courseName, setCourseName] = useState("");
  const [day,        setDay]        = useState("Sunday");
  const [startTime,  setStartTime]  = useState("");
  const [endTime,    setEndTime]    = useState("");
  const [room,       setRoom]       = useState("");

  const token = localStorage.getItem("token");
  const getH  = () => ({ Authorization: `Bearer ${token}` });

  const pt = (t) => { if (!t) return 0; const [h,m]=t.split(":").map(Number); return h*60+m; };

  const assignColor = useCallback((name) => {
    const ex = schedule.find(s=>s.courseName===name)?.color;
    if (ex) return ex;
    const names = [...new Set(schedule.map(s=>s.courseName))];
    return COLORS[names.length % COLORS.length];
  }, [schedule]);

  const mapEntry = (e) => ({
    id:         e.id,
    courseName: e.courseName,
    day:        e.dayOfWeek,
    startTime:  e.startTime,
    endTime:    e.endTime,
    room:       e.room || e.classroom?.name || "",
    color:      e.color || COLORS[0],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/schedule`, { headers: getH() });
      setSchedule(Array.isArray(res.data) ? res.data.map(mapEntry) : []);
    } catch { setSchedule([]); }
    finally { setLoading(false); }
    setRooms(JSON.parse(localStorage.getItem("classrooms")||"[]"));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const showT = (msg, type="ok") => { setToast(msg); setToastType(type); setTimeout(()=>setToast(""),2400); };

  const addSchedule = async () => {
    if (!courseName.trim()||!startTime||!endTime||!room.trim()) { showT("Fill in all fields","err"); return; }
    if (pt(endTime)<=pt(startTime)) { showT("End time must be after start","err"); return; }
    const hasConflict = schedule.some(s =>
      s.day===day && s.room.toLowerCase()===room.trim().toLowerCase() &&
      !(pt(endTime)<=pt(s.startTime)||pt(startTime)>=pt(s.endTime))
    );
    if (hasConflict) { showT("Time conflict in the same room","err"); return; }
    const color = assignColor(courseName.trim());
    try {
      const res = await axios.post(`${API}/schedule`, { courseName:courseName.trim(), dayOfWeek:day, startTime, endTime, room:room.trim(), color }, { headers:getH() });
      setSchedule(p=>[...p, mapEntry(res.data)]);
      setCourseName(""); setStartTime(""); setEndTime(""); setRoom(""); setShowForm(false);
      showT("✓ Class added!");
    } catch { showT("Failed to save class","err"); }
  };

  const del = async (id) => {
    try {
      await axios.delete(`${API}/schedule/${id}`, { headers:getH() });
      setSchedule(p=>p.filter(s=>s.id!==id));
      showT("Removed");
    } catch { showT("Failed to remove","err"); }
  };

  const grouped = useMemo(() => DAYS.reduce((acc,d) => {
    acc[d] = schedule.filter(s=>s.day===d).sort((a,b)=>pt(a.startTime)-pt(b.startTime));
    return acc;
  }, {}), [schedule]);

  const totalClasses = schedule.length;
  const todayCount   = grouped[activeDay]?.length || 0;

  const fmt = (t) => {
    if (!t) return "";
    const [h,m] = t.split(":").map(Number);
    return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;
  };

  return (
    <div style={pg}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}

        .sp-inp:focus{outline:none;border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,0.12);background:white}
        .sp-btn{transition:filter 0.15s,transform 0.1s;cursor:pointer}
        .sp-btn:hover:not(:disabled){filter:brightness(1.06)}
        .sp-btn:active:not(:disabled){transform:scale(0.97)}

        .sp-day-tab{transition:all 0.18s;cursor:pointer;user-select:none}
        .sp-day-tab:hover{background:rgba(99,102,241,0.08)!important;color:#4f46e5!important}

        .sp-class-card{transition:transform 0.18s,box-shadow 0.18s}
        .sp-class-card:hover{transform:translateX(3px);box-shadow:0 4px 16px rgba(15,23,42,0.10)}

        .sp-del{background:none;border:none;cursor:pointer;color:#cbd5e1;font-size:16px;padding:4px 6px;border-radius:6px;transition:color 0.15s,background 0.15s;line-height:1}
        .sp-del:hover{color:#ef4444;background:#fef2f2}

        @keyframes fadeDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .sp-form{animation:fadeDown 0.25s ease}

        @keyframes slideUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .sp-entry{animation:slideUp 0.2s ease both}

        @keyframes spin{to{transform:rotate(360deg)}}
        .sp-spin{width:20px;height:20px;border:2.5px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite;display:inline-block}

        @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .sp-toast{animation:toastIn 0.25s ease}

        @media(max-width:700px){
          .sp-days-bar{overflow-x:auto!important;padding-bottom:4px}
          .sp-stats{flex-direction:column!important}
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="sp-toast" style={{
          position:"fixed", top:"20px", right:"20px", zIndex:9999,
          padding:"12px 18px", borderRadius:"12px", fontFamily:"'Sora',sans-serif",
          fontSize:"13px", fontWeight:"600",
          background: toastType==="err" ? "#fef2f2" : "#f0fdf4",
          color: toastType==="err" ? "#dc2626" : "#166534",
          border: `1px solid ${toastType==="err"?"#fecaca":"#bbf7d0"}`,
          boxShadow:"0 8px 24px rgba(0,0,0,0.12)",
        }}>{toast}</div>
      )}

      <div style={wrap}>

        {/* ── Header ── */}
        <div style={hdr}>
          <div>
            <h1 style={h1}>Weekly Schedule</h1>
            <p style={sub}>Your classes, synced across all devices.</p>
          </div>
          <div style={{display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"}}>
            <button className="sp-btn" style={outBtn} onClick={load}>↻ Refresh</button>
            <button className="sp-btn" style={primBtn} onClick={()=>setShowForm(!showForm)}>
              {showForm ? "✕ Close" : "+ Add Class"}
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="sp-stats" style={{display:"flex",gap:"14px",marginBottom:"24px",flexWrap:"wrap"}}>
          {[
            { label:"Total Classes", value:totalClasses, color:"#6366f1", bg:"#eef2ff" },
            { label:"Today's Classes", value:todayCount,  color:"#0ea5e9", bg:"#f0f9ff" },
            { label:"Days Covered",   value:DAYS.filter(d=>grouped[d]?.length>0).length, color:"#10b981", bg:"#f0fdf4" },
          ].map(s=>(
            <div key={s.label} style={{background:s.bg,borderRadius:"14px",padding:"16px 20px",border:`1.5px solid ${s.color}22`,flex:"1",minWidth:"140px"}}>
              <div style={{fontSize:"28px",fontWeight:"800",color:s.color,fontFamily:"'JetBrains Mono',monospace"}}>{s.value}</div>
              <div style={{fontSize:"12px",fontWeight:"600",color:"#64748b",marginTop:"4px",textTransform:"uppercase",letterSpacing:"0.05em"}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Add Form ── */}
        {showForm && (
          <div className="sp-form" style={formWrap}>
            <h3 style={{fontFamily:"'Sora',sans-serif",fontWeight:"700",fontSize:"16px",color:"#0f172a",marginBottom:"16px"}}>
              Add New Class
            </h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
              <div style={{gridColumn:"1/-1"}}>
                <label style={lbl}>Course Name</label>
                <input className="sp-inp" style={inp} placeholder="e.g. Data Structures" value={courseName} onChange={e=>setCourseName(e.target.value)} autoFocus />
              </div>
              <div>
                <label style={lbl}>Day</label>
                <select className="sp-inp" style={inp} value={day} onChange={e=>setDay(e.target.value)}>
                  {DAYS.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Room</label>
                <input className="sp-inp" style={inp} placeholder="e.g. G101" value={room} onChange={e=>setRoom(e.target.value)} list="room-list" />
                <datalist id="room-list">{rooms.map((r,i)=><option key={i} value={r.name||r.room||r}/>)}</datalist>
              </div>
              <div>
                <label style={lbl}>Start Time</label>
                <input className="sp-inp" style={inp} type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>End Time</label>
                <input className="sp-inp" style={inp} type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} />
              </div>
            </div>
            <div style={{display:"flex",gap:"10px"}}>
              <button className="sp-btn" style={primBtn} onClick={addSchedule}>Save Class</button>
              <button className="sp-btn" style={outBtn} onClick={()=>{setShowForm(false);setCourseName("");setStartTime("");setEndTime("");setRoom("");}}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── Day Tabs ── */}
        <div className="sp-days-bar" style={{display:"flex",gap:"8px",marginBottom:"20px",overflowX:"auto",paddingBottom:"2px"}}>
          {DAYS.map(d=>{
            const isActive = d===activeDay;
            const count    = grouped[d]?.length||0;
            return (
              <div key={d} className="sp-day-tab" onClick={()=>setActiveDay(d)} style={{
                padding:"10px 18px", borderRadius:"12px", fontFamily:"'Sora',sans-serif",
                fontWeight:"700", fontSize:"14px", whiteSpace:"nowrap",
                background: isActive ? "#6366f1" : "white",
                color: isActive ? "white" : "#64748b",
                border: isActive ? "none" : "1.5px solid #e2e8f0",
                boxShadow: isActive ? "0 4px 14px rgba(99,102,241,0.30)" : "none",
                display:"flex",alignItems:"center",gap:"8px",
              }}>
                <span>{DAY_SHORT[d]}</span>
                {count>0 && (
                  <span style={{
                    background: isActive ? "rgba(255,255,255,0.25)" : "#6366f1",
                    color: isActive ? "white" : "white",
                    borderRadius:"999px", fontSize:"11px", fontWeight:"800",
                    padding:"1px 7px", minWidth:"20px", textAlign:"center",
                  }}>{count}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Classes List ── */}
        {loading ? (
          <div style={{textAlign:"center",padding:"60px 20px"}}>
            <span className="sp-spin" />
            <p style={{marginTop:"14px",color:"#94a3b8",fontFamily:"'Sora',sans-serif",fontSize:"14px"}}>Loading schedule…</p>
          </div>
        ) : grouped[activeDay]?.length===0 ? (
          <div style={{textAlign:"center",padding:"60px 20px",background:"white",borderRadius:"18px",border:"1.5px solid #e2e8f0"}}>
            <div style={{fontSize:"48px",marginBottom:"12px"}}>📅</div>
            <p style={{fontFamily:"'Sora',sans-serif",fontWeight:"700",fontSize:"18px",color:"#0f172a",marginBottom:"6px"}}>No classes on {activeDay}</p>
            <p style={{color:"#94a3b8",fontSize:"14px"}}>Tap "+ Add Class" to schedule one.</p>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            {grouped[activeDay].map((item,i)=>(
              <div key={item.id} className="sp-class-card sp-entry" style={{
                background:"white", borderRadius:"16px", padding:"16px 18px",
                border:"1.5px solid #f1f5f9",
                borderLeft:`5px solid ${item.color}`,
                boxShadow:"0 2px 8px rgba(15,23,42,0.05)",
                display:"flex", alignItems:"center", gap:"16px",
                animationDelay:`${i*0.04}s`,
              }}>
                {/* Time block */}
                <div style={{textAlign:"center",minWidth:"70px",fontFamily:"'JetBrains Mono',monospace"}}>
                  <div style={{fontSize:"13px",fontWeight:"500",color:item.color}}>{fmt(item.startTime)}</div>
                  <div style={{width:"1px",height:"12px",background:"#e2e8f0",margin:"4px auto"}}/>
                  <div style={{fontSize:"13px",fontWeight:"500",color:"#94a3b8"}}>{fmt(item.endTime)}</div>
                </div>
                {/* Color dot */}
                <div style={{width:"10px",height:"10px",borderRadius:"50%",background:item.color,flexShrink:0}}/>
                {/* Info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Sora',sans-serif",fontWeight:"700",fontSize:"15px",color:"#0f172a",marginBottom:"4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {item.courseName}
                  </div>
                  <div style={{display:"flex",gap:"12px",flexWrap:"wrap"}}>
                    <span style={{fontSize:"12px",color:"#64748b",display:"flex",alignItems:"center",gap:"4px"}}>
                      📍 {item.room}
                    </span>
                    <span style={{fontSize:"12px",color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace"}}>
                      {fmt(item.startTime)} – {fmt(item.endTime)}
                    </span>
                  </div>
                </div>
                {/* Delete */}
                <button className="sp-del" onClick={()=>del(item.id)} title="Remove">✕</button>
              </div>
            ))}
          </div>
        )}

        {/* ── Week Overview mini ── */}
        {!loading && schedule.length > 0 && (
          <div style={{marginTop:"28px",background:"white",borderRadius:"18px",padding:"20px",border:"1.5px solid #f1f5f9"}}>
            <h3 style={{fontFamily:"'Sora',sans-serif",fontWeight:"700",fontSize:"14px",color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"14px"}}>
              Week Overview
            </h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"8px"}}>
              {DAYS.map(d=>(
                <div key={d} style={{textAlign:"center"}}>
                  <div style={{fontSize:"11px",fontWeight:"700",color:"#94a3b8",marginBottom:"6px",textTransform:"uppercase"}}>{DAY_SHORT[d]}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:"3px",minHeight:"32px",alignItems:"center"}}>
                    {(grouped[d]||[]).map(item=>(
                      <div key={item.id} style={{width:"100%",height:"6px",borderRadius:"3px",background:item.color,opacity:0.75}}/>
                    ))}
                    {(grouped[d]||[]).length===0 && <div style={{width:"80%",height:"6px",borderRadius:"3px",background:"#f1f5f9"}}/>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const pg   = { minHeight:"100vh", background:"#f8fafc", padding:"24px 20px 48px", fontFamily:"'Sora',system-ui,sans-serif" };
const wrap = { maxWidth:"900px", margin:"0 auto" };
const hdr  = { display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"16px", marginBottom:"22px" };
const h1   = { fontSize:"30px", fontWeight:"800", color:"#0f172a", letterSpacing:"-0.5px", marginBottom:"4px" };
const sub  = { color:"#64748b", fontSize:"14px" };
const primBtn = { padding:"10px 18px", borderRadius:"11px", border:"none", background:"#6366f1", color:"white", fontWeight:"700", fontSize:"13px", fontFamily:"'Sora',sans-serif", boxShadow:"0 4px 12px rgba(99,102,241,0.28)", cursor:"pointer" };
const outBtn  = { padding:"10px 18px", borderRadius:"11px", border:"1.5px solid #e2e8f0", background:"white", color:"#475569", fontWeight:"600", fontSize:"13px", fontFamily:"'Sora',sans-serif", cursor:"pointer" };
const formWrap = { background:"white", borderRadius:"18px", padding:"22px", border:"1.5px solid #e2e8f0", boxShadow:"0 4px 16px rgba(15,23,42,0.06)", marginBottom:"22px" };
const lbl  = { display:"block", fontSize:"12px", fontWeight:"700", color:"#374151", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.05em" };
const inp  = { width:"100%", padding:"11px 14px", borderRadius:"10px", border:"1.5px solid #e2e8f0", fontSize:"14px", color:"#0f172a", background:"#f8fafc", fontFamily:"'Sora',sans-serif", transition:"all 0.15s", boxSizing:"border-box" };