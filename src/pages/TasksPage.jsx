import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

const API = "https://smart-campus-backend-production-bf5e.up.railway.app";
const getH = () => { const t=localStorage.getItem("token"); return t?{Authorization:`Bearer ${t}`}:{}; };

const getStatus = (pct) => {
  if (pct>=90) return { bar:"#ef4444", bg:"#fef2f2", text:"#dc2626", label:"Almost Full",  icon:"🔴" };
  if (pct>=60) return { bar:"#f59e0b", bg:"#fffbeb", text:"#d97706", label:"Filling Up",   icon:"🟡" };
  return               { bar:"#10b981", bg:"#f0fdf4", text:"#059669", label:"Available",    icon:"🟢" };
};

const pt = t => { if(!t) return null; const [h,m]=t.split(":").map(Number); return h*60+m; };
const gm = () => { const n=new Date(); return n.getHours()*60+n.getMinutes(); };
const fmt = t => { if(!t) return ""; const [h,m]=t.split(":").map(Number); return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`; };

export default function ParkingPage() {
  const [zones,             setZones]             = useState([]);
  const [mySession,         setMySession]         = useState(null);
  const [schedule,          setSchedule]          = useState([]);
  const [toast,             setToast]             = useState({msg:"",type:"ok"});
  const [confirmLeave,      setConfirmLeave]      = useState(false);
  const [loadingZones,      setLoadingZones]      = useState(true);
  const [autoReleasePrompt, setAutoReleasePrompt] = useState(false);

  const showT = (msg,type="ok") => { setToast({msg,type}); setTimeout(()=>setToast({msg:"",type:"ok"}),2800); };

  const refreshZones = useCallback(async()=>{
    try {
      const r=await axios.get(`${API}/parking-zones`);
      setZones(r.data.map(z=>({id:z.id,name:z.name,description:z.description,icon:z.icon||"🅿",total:z.total,occupied:z.occupied})));
    } catch { setZones([]); }
    finally { setLoadingZones(false); }
  },[]);

  const refreshSession = useCallback(async()=>{
    try {
      const r=await axios.get(`${API}/parking-zones/my-session`,{headers:getH()});
      setMySession(r.data.active?{zoneId:r.data.zoneId,checkedInAt:r.data.checkedInAt,endTime:r.data.endTime||null,courseName:r.data.courseName||null}:null);
    } catch { setMySession(null); }
  },[]);

  const refreshSchedule = useCallback(async()=>{
    try {
      const r=await axios.get(`${API}/schedule`,{headers:getH()});
      setSchedule(r.data.map(e=>({id:e.id,courseName:e.courseName,day:e.dayOfWeek,time:`${e.startTime} - ${e.endTime}`,room:e.room||e.classroom?.name||"",color:e.color})));
    } catch { setSchedule([]); }
  },[]);

  useEffect(()=>{
    Promise.all([refreshZones(),refreshSession(),refreshSchedule()]);
    const iv=setInterval(()=>{ refreshZones(); refreshSession(); },15000);
    return ()=>clearInterval(iv);
  },[refreshZones,refreshSession,refreshSchedule]);

  useEffect(()=>{
    if(!mySession?.endTime) return;
    const iv=setInterval(()=>{ if(pt(mySession.endTime)&&gm()>=pt(mySession.endTime)&&!autoReleasePrompt) setAutoReleasePrompt(true); },30000);
    if(pt(mySession?.endTime)&&gm()>=pt(mySession.endTime)) setAutoReleasePrompt(true);
    return ()=>clearInterval(iv);
  },[mySession,autoReleasePrompt]);

  const checkIn = async(zoneId,endTime,courseName)=>{
    const zone=zones.find(z=>z.id===zoneId);
    if(!zone) return;
    if(zone.occupied>=zone.total){ showT("This zone is full!","err"); return; }
    try {
      const r=await axios.post(`${API}/parking-zones/checkin/${zoneId}`,{},{headers:getH()});
      if(!r.data.success){ showT(r.data.message||"Check-in failed","err"); return; }
      setMySession({zoneId,endTime:endTime||null,courseName:courseName||null,checkedInAt:r.data.checkedInAt});
      await refreshZones();
      showT(`✓ Checked in at ${zone.name}`);
    } catch { showT("Failed to check in","err"); }
  };

  const checkOut = async()=>{
    try { await axios.delete(`${API}/parking-zones/checkout`,{headers:getH()}); } catch {}
    setMySession(null); await refreshZones();
    setConfirmLeave(false); setAutoReleasePrompt(false);
    showT("✓ Checked out");
  };

  const todayName  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
  const todayCls   = schedule.filter(s=>s.day===todayName);
  const nextClass  = useMemo(()=>{
    const now=gm();
    return todayCls.map(c=>{
      const p=c.time?.split("-").map(t=>t.trim());
      const es=p?.[1]; const em=pt(es?.includes(":")?es:null);
      return {...c,em,es};
    }).filter(c=>c.em&&c.em>now).sort((a,b)=>a.em-b.em)[0]||null;
  },[todayCls]);

  const myZone    = zones.find(z=>z.id===mySession?.zoneId);
  const totalAvail = zones.reduce((s,z)=>s+(z.total-z.occupied),0);

  return (
    <div style={pg}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box}

        .pk-zone{transition:box-shadow 0.2s,transform 0.18s;cursor:default}
        .pk-zone:hover{box-shadow:0 12px 32px rgba(15,23,42,0.11);transform:translateY(-2px)}

        .pk-chkin{transition:filter 0.15s,transform 0.1s;cursor:pointer}
        .pk-chkin:hover:not(:disabled){filter:brightness(1.07)}
        .pk-chkin:active:not(:disabled){transform:scale(0.97)}
        .pk-chkin:disabled{opacity:0.5;cursor:not-allowed}

        .pk-btn{transition:filter 0.15s,transform 0.1s;cursor:pointer}
        .pk-btn:hover:not(:disabled){filter:brightness(1.06)}
        .pk-btn:active:not(:disabled){transform:scale(0.97)}

        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .pk-live{animation:pulse 2s ease-in-out infinite}

        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .pk-zone{animation:fadeUp 0.3s ease both}

        @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .pk-toast{animation:toastIn 0.25s ease}

        @keyframes spin{to{transform:rotate(360deg)}}
        .pk-spin{width:20px;height:20px;border:2.5px solid #e2e8f0;border-top-color:#10b981;border-radius:50%;animation:spin 0.8s linear infinite;display:inline-block}

        @media(max-width:700px){.pk-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* Toast */}
      {toast.msg&&(
        <div className="pk-toast" style={{position:"fixed",top:"20px",right:"20px",zIndex:9999,padding:"12px 18px",borderRadius:"12px",fontFamily:"'Sora',sans-serif",fontSize:"13px",fontWeight:"600",background:toast.type==="err"?"#fef2f2":"#f0fdf4",color:toast.type==="err"?"#dc2626":"#166534",border:`1px solid ${toast.type==="err"?"#fecaca":"#bbf7d0"}`,boxShadow:"0 8px 24px rgba(0,0,0,0.10)"}}>
          {toast.msg}
        </div>
      )}

      {/* Auto-release banner */}
      {autoReleasePrompt&&mySession&&(
        <div style={{background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:"14px",padding:"14px 18px",marginBottom:"18px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"14px",flexWrap:"wrap",fontFamily:"'Sora',sans-serif"}}>
          <span style={{fontSize:"14px",color:"#9a3412",fontWeight:"600"}}>⏰ Your class ended. Did you leave <strong>{myZone?.name}</strong>?</span>
          <div style={{display:"flex",gap:"8px"}}>
            <button className="pk-btn" onClick={checkOut} style={{padding:"9px 16px",borderRadius:"10px",border:"none",background:"#16a34a",color:"white",fontWeight:"700",fontSize:"13px",fontFamily:"'Sora',sans-serif"}}>Yes, I left</button>
            <button className="pk-btn" onClick={()=>setAutoReleasePrompt(false)} style={{padding:"9px 16px",borderRadius:"10px",border:"1.5px solid #e2e8f0",background:"white",color:"#475569",fontWeight:"600",fontSize:"13px",fontFamily:"'Sora',sans-serif"}}>Still here</button>
          </div>
        </div>
      )}

      <div style={{maxWidth:"1000px",margin:"0 auto"}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"16px",marginBottom:"22px"}}>
          <div>
            <h1 style={{fontSize:"30px",fontWeight:"800",color:"#0f172a",letterSpacing:"-0.5px",marginBottom:"4px",fontFamily:"'Sora',sans-serif"}}>Parking</h1>
            <p style={{color:"#64748b",fontSize:"14px",fontFamily:"'Sora',sans-serif"}}>Real-time availability · Building A11</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}}>
            {/* Live indicator */}
            <div style={{display:"flex",alignItems:"center",gap:"7px",padding:"8px 14px",borderRadius:"999px",background:"white",border:"1.5px solid #e2e8f0",fontFamily:"'Sora',sans-serif",fontSize:"12px",fontWeight:"600",color:"#475569"}}>
              <span className="pk-live" style={{width:8,height:8,borderRadius:"50%",background:"#10b981",display:"inline-block"}}/>
              Live · updates every 15s
            </div>
            {/* Total badge */}
            <div style={{background:"#f0fdf4",border:"1.5px solid #10b98122",borderRadius:"14px",padding:"12px 18px",textAlign:"center",minWidth:"110px"}}>
              <div style={{fontSize:"26px",fontWeight:"800",color:"#059669",fontFamily:"'JetBrains Mono',monospace"}}>{totalAvail}</div>
              <div style={{fontSize:"11px",color:"#64748b",fontWeight:"600",fontFamily:"'Sora',sans-serif",textTransform:"uppercase",letterSpacing:"0.05em"}}>Available</div>
            </div>
          </div>
        </div>

        {/* My Session */}
        {mySession&&myZone&&(
          <div style={{background:"white",borderRadius:"18px",padding:"18px 20px",marginBottom:"18px",border:"2px solid #0ea5e9",boxShadow:"0 4px 18px rgba(14,165,233,0.12)",display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap",fontFamily:"'Sora',sans-serif"}}>
            <div style={{fontSize:"36px"}}>{myZone.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:"700",fontSize:"16px",color:"#0f172a",marginBottom:"4px"}}>
                Parked at <span style={{color:"#0ea5e9"}}>{myZone.name}</span>
              </div>
              {mySession.courseName&&(
                <div style={{fontSize:"13px",color:"#64748b"}}>
                  {mySession.courseName}{mySession.endTime&&` · until ${fmt(mySession.endTime)}`}
                </div>
              )}
              {mySession.checkedInAt&&(
                <div style={{fontSize:"12px",color:"#94a3b8",marginTop:"2px",fontFamily:"'JetBrains Mono',monospace"}}>
                  Since {new Date(mySession.checkedInAt).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}
                </div>
              )}
            </div>
            {!confirmLeave ? (
              <button className="pk-btn" onClick={()=>setConfirmLeave(true)} style={{padding:"10px 18px",borderRadius:"11px",border:"none",background:"#ef4444",color:"white",fontWeight:"700",fontSize:"13px",fontFamily:"'Sora',sans-serif",flexShrink:0}}>
                Check Out
              </button>
            ) : (
              <div style={{display:"flex",gap:"8px",flexShrink:0}}>
                <button className="pk-btn" onClick={checkOut} style={{padding:"10px 16px",borderRadius:"11px",border:"none",background:"#ef4444",color:"white",fontWeight:"700",fontSize:"13px",fontFamily:"'Sora',sans-serif"}}>Confirm</button>
                <button className="pk-btn" onClick={()=>setConfirmLeave(false)} style={{padding:"10px 16px",borderRadius:"11px",border:"1.5px solid #e2e8f0",background:"white",color:"#475569",fontWeight:"600",fontSize:"13px",fontFamily:"'Sora',sans-serif"}}>Cancel</button>
              </div>
            )}
          </div>
        )}

        {/* Class suggestion */}
        {!mySession&&nextClass&&(
          <div style={{background:"#eff6ff",borderRadius:"14px",padding:"12px 16px",marginBottom:"16px",border:"1.5px solid #bfdbfe",fontFamily:"'Sora',sans-serif",fontSize:"13px",color:"#1e40af"}}>
            💡 Your next class <strong>{nextClass.courseName}</strong> ends at <strong>{fmt(nextClass.es)}</strong> — this will be used as your parking end time.
          </div>
        )}

        {/* Zones Grid */}
        {loadingZones ? (
          <div style={{textAlign:"center",padding:"60px 20px"}}>
            <span className="pk-spin"/>
            <p style={{marginTop:"14px",color:"#94a3b8",fontFamily:"'Sora',sans-serif",fontSize:"14px"}}>Loading zones…</p>
          </div>
        ) : (
          <div className="pk-grid" style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:"16px"}}>
            {zones.map((zone,i)=>{
              const avail  = zone.total-zone.occupied;
              const pct    = zone.total?Math.round(zone.occupied/zone.total*100):0;
              const status = getStatus(pct);
              const dis    = !!mySession||avail<=0;
              return (
                <div key={zone.id} className="pk-zone" style={{
                  background:"white", borderRadius:"18px", padding:"18px",
                  border:"1.5px solid #f1f5f9",
                  boxShadow:"0 2px 8px rgba(15,23,42,0.05)",
                  position:"relative", overflow:"hidden",
                  animationDelay:`${i*0.07}s`,
                }}>
                  {/* Top accent */}
                  <div style={{position:"absolute",top:0,left:0,right:0,height:"3px",background:status.bar,borderRadius:"18px 18px 0 0"}}/>

                  {/* Zone header */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px",marginTop:"4px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                      <span style={{fontSize:"26px"}}>{zone.icon}</span>
                      <div>
                        <h3 style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"16px",color:"#0f172a",marginBottom:"3px"}}>{zone.name}</h3>
                        <p style={{fontSize:"12px",color:"#94a3b8",fontFamily:"'Sora',sans-serif"}}>{zone.description}</p>
                      </div>
                    </div>
                    <span style={{padding:"4px 10px",borderRadius:"999px",fontSize:"11px",fontWeight:"700",background:status.bg,color:status.text,flexShrink:0,fontFamily:"'Sora',sans-serif"}}>
                      {status.icon} {status.label}
                    </span>
                  </div>

                  {/* Number */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"10px"}}>
                    <div>
                      <span style={{fontSize:"42px",fontWeight:"800",color:"#0f172a",fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>{avail}</span>
                      <span style={{fontSize:"14px",color:"#94a3b8",marginLeft:"6px"}}>/ {zone.total}</span>
                      <p style={{fontSize:"12px",color:"#94a3b8",marginTop:"3px",fontFamily:"'Sora',sans-serif"}}>available spots</p>
                    </div>
                    <div style={{textAlign:"center",background:pct>=90?"#fef2f2":pct>=60?"#fffbeb":"#f0fdf4",borderRadius:"10px",padding:"8px 12px",minWidth:"54px"}}>
                      <div style={{fontSize:"16px",fontWeight:"800",color:status.text,fontFamily:"'JetBrains Mono',monospace"}}>{pct}%</div>
                      <div style={{fontSize:"10px",color:"#94a3b8",fontFamily:"'Sora',sans-serif"}}>full</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{background:"#f1f5f9",borderRadius:"999px",height:"8px",marginBottom:"14px",overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:"999px",width:`${pct}%`,background:status.bar,transition:"width 0.5s ease"}}/>
                  </div>

                  {/* Check in button */}
                  <button className="pk-chkin" disabled={dis} style={{
                    width:"100%",padding:"12px",borderRadius:"12px",border:"none",
                    fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"14px",
                    background:dis?"#f1f5f9":"linear-gradient(135deg,#10b981,#059669)",
                    color:dis?"#94a3b8":"white",
                    boxShadow:dis?"none":"0 4px 14px rgba(16,185,129,0.30)",
                    cursor:dis?"not-allowed":"pointer",
                    opacity:dis?0.7:1,
                  }} onClick={()=>!dis&&checkIn(zone.id,nextClass?.es||null,nextClass?.courseName||null)}>
                    {mySession?"Already Parked":avail<=0?"Zone Full":"I Parked Here"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        {!loadingZones&&zones.length>0&&(
          <div style={{marginTop:"20px",display:"flex",gap:"18px",flexWrap:"wrap",justifyContent:"center"}}>
            {[{icon:"🟢",label:"Available"},{"icon":"🟡",label:"Filling Up"},{"icon":"🔴",label:"Almost Full"}].map(l=>(
              <span key={l.label} style={{fontSize:"12px",color:"#94a3b8",fontWeight:"600",fontFamily:"'Sora',sans-serif",display:"flex",alignItems:"center",gap:"6px"}}>
                {l.icon} {l.label}
              </span>
            ))}
            <span style={{fontSize:"12px",color:"#94a3b8",fontFamily:"'Sora',sans-serif"}}>· Numbers reflect student check-ins</span>
          </div>
        )}
      </div>
    </div>
  );
}

const pg = { minHeight:"100vh", background:"#f8fafc", padding:"24px 20px 48px", fontFamily:"'Sora',system-ui,sans-serif" };