import { useState, useEffect, useCallback } from "react";

const ZONES_DEFAULT = [
  { id:"main-gate",   name:"Main Gate",   description:"In front of the main gate — student side", icon:"🚪", total:30, occupied:0 },
  { id:"right-gate",  name:"Right Gate",  description:"Near Lab 3",                                icon:"🔬", total:50, occupied:0 },
  { id:"lab1",        name:"Near Lab 1",  description:"Students only",                             icon:"🧪", total:45, occupied:0 },
  { id:"new-parking", name:"New Parking", description:"Across from the college",                   icon:"🏗", total:60, occupied:0 },
];

const getStatus = (pct) => {
  if (pct >= 90) return { bar:"#ef4444", light:"#fef2f2", text:"#dc2626", label:"Almost Full" };
  if (pct >= 60) return { bar:"#f59e0b", light:"#fffbeb", text:"#d97706", label:"Filling Up"  };
  return               { bar:"#22c55e", light:"#f0fdf4", text:"#16a34a", label:"Available"   };
};

const countSessionsPerZone = () => {
  const counts = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("my_parking_session_")) {
      try {
        const s = JSON.parse(localStorage.getItem(key));
        if (s?.zoneId) counts[s.zoneId] = (counts[s.zoneId] || 0) + 1;
      } catch { /* skip */ }
    }
  }
  return counts;
};

const clearZoneSessions = (zoneId) => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("my_parking_session_")) {
      try { if (JSON.parse(localStorage.getItem(k))?.zoneId === zoneId) keys.push(k); } catch {}
    }
  }
  keys.forEach((k) => localStorage.removeItem(k));
};

const clearAllSessions = () => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i)?.startsWith("my_parking_session_")) keys.push(localStorage.key(i));
  }
  keys.forEach((k) => localStorage.removeItem(k));
};

export default function AdminParkingPage() {
  const [zones,            setZones]            = useState(() => { const s = localStorage.getItem("parking_zones_v2"); return s ? JSON.parse(s) : ZONES_DEFAULT; });
  const [sessionCounts,    setSessionCounts]    = useState({});
  const [toast,            setToast]            = useState("");
  const [editZone,         setEditZone]         = useState(null);
  const [editValue,        setEditValue]        = useState("");
  const [confirmReset,     setConfirmReset]     = useState(false);
  const [confirmZoneReset, setConfirmZoneReset] = useState(null);

  const refresh = useCallback(() => {
    setSessionCounts(countSessionsPerZone());
    const s = localStorage.getItem("parking_zones_v2");
    if (s) setZones(JSON.parse(s));
  }, []);

  useEffect(() => { refresh(); const id = setInterval(refresh, 5000); return () => clearInterval(id); }, [refresh]);

  const saveZones = (u) => { setZones(u); localStorage.setItem("parking_zones_v2", JSON.stringify(u)); };
  const toast$    = (m) => { setToast(m); setTimeout(() => setToast(""), 2800); };
  const openEdit  = (z) => { setEditZone(z); setEditValue(String(z.occupied)); };

  const saveEdit = () => {
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val < 0 || val > editZone.total) { toast$(`⚠️ Enter 0 – ${editZone.total}`); return; }
    saveZones(zones.map((z) => z.id === editZone.id ? { ...z, occupied: val } : z));
    setEditZone(null);
    toast$(`✅ ${editZone.name} set to ${val} occupied`);
  };

  const resetZone = (zone) => {
    clearZoneSessions(zone.id);
    saveZones(zones.map((z) => z.id === zone.id ? { ...z, occupied: 0 } : z));
    setConfirmZoneReset(null); refresh();
    toast$(`🔄 ${zone.name} reset to 0`);
  };

  const resetAll = () => {
    clearAllSessions();
    saveZones(zones.map((z) => ({ ...z, occupied: 0 })));
    setConfirmReset(false); refresh();
    toast$("🔄 All zones reset to 0");
  };

  const totalSpots    = zones.reduce((s, z) => s + z.total, 0);
  const totalOccupied = zones.reduce((s, z) => s + z.occupied, 0);
  const totalAvail    = totalSpots - totalOccupied;
  const totalSessions = Object.values(sessionCounts).reduce((s, v) => s + v, 0);
  const overallPct    = totalSpots > 0 ? Math.round((totalOccupied / totalSpots) * 100) : 0;

  return (
    <div style={{ padding:"24px 20px 48px", fontFamily:"'DM Sans', system-ui, sans-serif", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
        .az-card { transition: box-shadow 0.18s, transform 0.18s; }
        .az-card:hover { box-shadow: 0 12px 32px rgba(15,23,42,0.12); transform: translateY(-2px); }
        .az-btn { transition: filter 0.15s, transform 0.1s; cursor: pointer; }
        .az-btn:hover:not(:disabled) { filter: brightness(1.08); }
        .az-btn:active:not(:disabled) { transform: scale(0.97); }
        .az-ni:focus { outline:none; border-color:#f59e0b; box-shadow:0 0 0 3px rgba(245,158,11,0.15); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        .az-fi { animation: fadeUp 0.3s ease; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        .az-live { animation: pulse 2s ease-in-out infinite; }
      `}</style>

      {toast && <div style={toastSt} className="az-fi">{toast}</div>}

      {/* Reset All Modal */}
      {confirmReset && (
        <div style={overlay}>
          <div style={modal} className="az-fi">
            <div style={{fontSize:"38px",marginBottom:"12px"}}>⚠️</div>
            <p style={mTitle}>Reset All Zones?</p>
            <p style={mSub}>All counts → <strong>0</strong> and all active sessions cleared.</p>
            <div style={{display:"flex",gap:"10px"}}>
              <button className="az-btn" onClick={resetAll} style={bRed}>Yes, Reset All</button>
              <button className="az-btn" onClick={() => setConfirmReset(false)} style={bGray}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Zone Modal */}
      {confirmZoneReset && (
        <div style={overlay}>
          <div style={modal} className="az-fi">
            <div style={{fontSize:"32px",marginBottom:"12px"}}>{confirmZoneReset.icon}</div>
            <p style={mTitle}>Reset {confirmZoneReset.name}?</p>
            <p style={mSub}>Occupied count → <strong>0</strong> and sessions cleared.</p>
            <div style={{display:"flex",gap:"10px"}}>
              <button className="az-btn" onClick={() => resetZone(confirmZoneReset)} style={bAmber}>Yes, Reset</button>
              <button className="az-btn" onClick={() => setConfirmZoneReset(null)} style={bGray}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Count Modal */}
      {editZone && (
        <div style={overlay}>
          <div style={modal} className="az-fi">
            <p style={mTitle}>Edit {editZone.name}</p>
            <p style={mSub}>Set occupied spots (0 – {editZone.total})</p>
            <input className="az-ni" type="number" min={0} max={editZone.total} value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              style={{width:"100%",padding:"12px",borderRadius:"10px",border:"1.5px solid #e2e8f0",fontSize:"24px",fontWeight:"800",color:"#0f172a",background:"#f8fafc",fontFamily:"'DM Mono',monospace",textAlign:"center",boxSizing:"border-box",transition:"border-color 0.15s,box-shadow 0.15s"}}
              autoFocus
            />
            <p style={{fontSize:"12px",color:"#94a3b8",margin:"8px 0 18px",textAlign:"center"}}>/ {editZone.total} total</p>
            <div style={{display:"flex",gap:"10px"}}>
              <button className="az-btn" onClick={saveEdit} style={bBlue}>Save</button>
              <button className="az-btn" onClick={() => setEditZone(null)} style={bGray}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{maxWidth:"1000px",margin:"0 auto"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"16px",marginBottom:"24px"}}>
          <div>
            <div style={{display:"inline-block",padding:"4px 12px",borderRadius:"999px",background:"#fef3c7",border:"1px solid #fde68a",color:"#92400e",fontSize:"12px",fontWeight:"700",marginBottom:"8px"}}>🛡 Admin Panel</div>
            <h1 style={{fontSize:"28px",fontWeight:"800",color:"#0f172a",margin:"0 0 4px",letterSpacing:"-0.5px"}}>Parking Management</h1>
            <p style={{color:"#64748b",fontSize:"14px",margin:0}}>Monitor and control all campus parking zones.</p>
          </div>
          <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
            <button className="az-btn" onClick={refresh} style={{padding:"10px 18px",borderRadius:"10px",border:"1.5px solid #e2e8f0",background:"white",color:"#475569",fontWeight:"600",fontSize:"13px",fontFamily:"'DM Sans'"}}>↻ Refresh</button>
            <button className="az-btn" onClick={() => setConfirmReset(true)} style={{padding:"10px 18px",borderRadius:"10px",border:"none",background:"#fef2f2",color:"#dc2626",fontWeight:"700",fontSize:"13px",fontFamily:"'DM Sans'"}}>🔄 Reset All</button>
          </div>
        </div>

        {/* Summary */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:"12px",marginBottom:"14px"}}>
          {[{label:"Total Spots",value:totalSpots,color:"#0f172a"},{label:"Occupied",value:totalOccupied,color:"#ef4444"},{label:"Available",value:totalAvail,color:"#22c55e"},{label:"Active Check-ins",value:totalSessions,color:"#2563eb"}].map((s) => (
            <div key={s.label} style={{background:"white",borderRadius:"14px",padding:"16px 18px",border:"1.5px solid #e2e8f0",boxShadow:"0 2px 8px rgba(15,23,42,0.05)",display:"flex",flexDirection:"column"}}>
              <span style={{fontSize:"30px",fontWeight:"800",color:s.color,fontFamily:"'DM Mono'"}}>{s.value}</span>
              <span style={{fontSize:"11px",fontWeight:"700",color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em",marginTop:"5px"}}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Live tag */}
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"22px"}}>
          <span className="az-live" style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",display:"inline-block"}} />
          <span style={{fontSize:"12px",color:"#64748b",fontWeight:"600"}}>Auto-refreshes every 5 seconds</span>
        </div>

        {/* Zone Cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:"16px",marginBottom:"24px"}}>
          {zones.map((zone) => {
            const avail    = zone.total - zone.occupied;
            const pct      = zone.total > 0 ? Math.round((zone.occupied / zone.total) * 100) : 0;
            const status   = getStatus(pct);
            const sessions = sessionCounts[zone.id] || 0;
            return (
              <div key={zone.id} className="az-card" style={{background:"white",borderRadius:"16px",padding:"18px",border:"1.5px solid #e2e8f0",boxShadow:"0 2px 8px rgba(15,23,42,0.05)",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:"4px",background:status.bar,borderRadius:"16px 16px 0 0"}} />
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",marginTop:"8px",marginBottom:"14px"}}>
                  <span style={{fontSize:"28px",lineHeight:1}}>{zone.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <h3 style={{margin:"0 0 3px",fontSize:"16px",fontWeight:"800",color:"#0f172a"}}>{zone.name}</h3>
                    <p style={{margin:0,fontSize:"12px",color:"#94a3b8"}}>{zone.description}</p>
                  </div>
                  <span style={{padding:"4px 10px",borderRadius:"999px",fontSize:"11px",fontWeight:"700",background:status.light,color:status.text,flexShrink:0}}>{status.label}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"10px"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"baseline",gap:"6px"}}>
                      <span style={{fontSize:"38px",fontWeight:"800",color:"#0f172a",fontFamily:"'DM Mono'",lineHeight:1}}>{avail}</span>
                      <span style={{fontSize:"14px",color:"#94a3b8"}}>/ {zone.total}</span>
                    </div>
                    <p style={{margin:"3px 0 0",fontSize:"12px",color:"#94a3b8"}}>available spots</p>
                  </div>
                  <div style={{background:"#eff6ff",borderRadius:"12px",padding:"8px 14px",textAlign:"center",border:"1px solid #bfdbfe",minWidth:"60px"}}>
                    <div style={{fontSize:"18px",fontWeight:"800",color:"#2563eb",fontFamily:"'DM Mono'"}}>{sessions}</div>
                    <div style={{fontSize:"10px",color:"#64748b",fontWeight:"600"}}>checked in</div>
                  </div>
                </div>
                <div style={{background:"#f1f5f9",borderRadius:"999px",height:"8px",marginBottom:"6px",overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:"999px",width:`${pct}%`,background:status.bar,transition:"width 0.4s ease"}} />
                </div>
                <p style={{margin:"0 0 14px",fontSize:"12px",color:"#94a3b8",textAlign:"right"}}>{pct}% occupied</p>
                <div style={{display:"flex",gap:"8px"}}>
                  <button className="az-btn" onClick={() => openEdit(zone)} style={{flex:1,padding:"9px 0",borderRadius:"9px",border:"1.5px solid #e2e8f0",background:"white",color:"#374151",fontWeight:"600",fontSize:"13px",fontFamily:"'DM Sans'"}}>✏️ Set Count</button>
                  <button className="az-btn" onClick={() => setConfirmZoneReset(zone)} style={{padding:"9px 16px",borderRadius:"9px",border:"none",background:"#fef3c7",color:"#92400e",fontWeight:"700",fontSize:"13px",fontFamily:"'DM Sans'"}}>↺ Reset</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall bar */}
        <div style={{background:"white",borderRadius:"16px",padding:"20px 22px",border:"1.5px solid #e2e8f0",boxShadow:"0 2px 8px rgba(15,23,42,0.05)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
            <h3 style={{margin:0,fontSize:"15px",fontWeight:"700",color:"#0f172a"}}>Overall Campus Occupancy</h3>
            <span style={{fontFamily:"'DM Mono'",fontSize:"14px",fontWeight:"700",color:"#0f172a"}}>{totalOccupied} / {totalSpots}</span>
          </div>
          <div style={{background:"#f1f5f9",borderRadius:"999px",height:"12px",overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:"999px",width:`${overallPct}%`,background:`linear-gradient(90deg, #22c55e, ${overallPct > 80 ? "#ef4444" : "#f59e0b"})`,transition:"width 0.5s ease"}} />
          </div>
          <p style={{margin:"8px 0 0",fontSize:"12px",color:"#94a3b8"}}>{overallPct}% occupied · {totalAvail} spots available</p>
        </div>
      </div>
    </div>
  );
}

const overlay  = { position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9998 };
const modal    = { background:"white", borderRadius:"18px", padding:"28px", maxWidth:"360px", width:"90%", textAlign:"center", boxShadow:"0 24px 56px rgba(0,0,0,0.22)", fontFamily:"'DM Sans'" };
const mTitle   = { fontWeight:"800", fontSize:"18px", color:"#0f172a", margin:"0 0 8px" };
const mSub     = { color:"#64748b", fontSize:"13px", margin:"0 0 20px", lineHeight:"1.6" };
const bRed     = { flex:1, padding:"11px", borderRadius:"10px", border:"none", background:"#ef4444", color:"white", fontWeight:"700", fontSize:"14px", fontFamily:"'DM Sans'" };
const bAmber   = { flex:1, padding:"11px", borderRadius:"10px", border:"none", background:"#f59e0b", color:"white", fontWeight:"700", fontSize:"14px", fontFamily:"'DM Sans'" };
const bBlue    = { flex:1, padding:"11px", borderRadius:"10px", border:"none", background:"#2563eb", color:"white", fontWeight:"700", fontSize:"14px", fontFamily:"'DM Sans'" };
const bGray    = { flex:1, padding:"11px", borderRadius:"10px", border:"1.5px solid #e2e8f0", background:"white", color:"#64748b", fontWeight:"600", fontSize:"14px", fontFamily:"'DM Sans'" };
const toastSt  = { position:"fixed", bottom:"28px", left:"50%", transform:"translateX(-50%)", background:"#0f172a", color:"white", padding:"12px 24px", borderRadius:"999px", fontSize:"14px", fontWeight:"700", boxShadow:"0 8px 24px rgba(0,0,0,0.20)", zIndex:9999, whiteSpace:"nowrap", fontFamily:"'DM Sans'" };