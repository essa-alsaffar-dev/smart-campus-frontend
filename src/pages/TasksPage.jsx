import { useState, useEffect, useMemo } from "react";
import axios from "axios";

const API = "https://smart-campus-backend-production-bf5e.up.railway.app";
const PRIORITIES = ["Low","Medium","High"];
const P_CONFIG = {
  High:   { color:"#ef4444", bg:"#fef2f2", border:"#fecaca", dot:"#ef4444", label:"High"   },
  Medium: { color:"#f59e0b", bg:"#fffbeb", border:"#fde68a", dot:"#f59e0b", label:"Medium" },
  Low:    { color:"#22c55e", bg:"#f0fdf4", border:"#bbf7d0", dot:"#22c55e", label:"Low"    },
};

const getH = () => { const t=localStorage.getItem("token"); return t?{Authorization:`Bearer ${t}`}:{}; };
const mapTask = t => ({ id:t.id, title:t.title, priority:t.type||"Medium", dueDate:t.dueDate||"", completed:t.status==="COMPLETED", createdAt:t.createdAt||new Date().toISOString() });

export default function TasksPage() {
  const [tasks,          setTasks]          = useState([]);
  const [title,          setTitle]          = useState("");
  const [priority,       setPriority]       = useState("Medium");
  const [dueDate,        setDueDate]        = useState("");
  const [filter,         setFilter]         = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [toast,          setToast]          = useState({msg:"",type:"ok"});
  const [loading,        setLoading]        = useState(true);
  const [adding,         setAdding]         = useState(false);

  useEffect(() => {
    axios.get(`${API}/tasks`,{headers:getH()})
      .then(r=>setTasks(r.data.map(mapTask)))
      .catch(()=>setTasks(JSON.parse(localStorage.getItem(`tasks_v2_${localStorage.getItem("userName")||"guest"}`)||"[]")))
      .finally(()=>setLoading(false));
  },[]);

  const showT = (msg,type="ok") => { setToast({msg,type}); setTimeout(()=>setToast({msg:"",type:"ok"}),2400); };

  const addTask = async () => {
    if (!title.trim()) return;
    setAdding(true);
    try {
      const r = await axios.post(`${API}/tasks`,{title:title.trim(),description:"",type:priority,dueDate:dueDate||null},{headers:getH()});
      setTasks(p=>[mapTask(r.data),...p]);
      showT("✓ Task added!");
    } catch {
      const t={id:Date.now(),title:title.trim(),priority,dueDate,completed:false,createdAt:new Date().toISOString()};
      setTasks(p=>[t,...p]);
      showT("✓ Saved locally");
    }
    setTitle(""); setPriority("Medium"); setDueDate(""); setAdding(false);
  };

  const toggle = async (task) => {
    if (!task.completed) { try { await axios.patch(`${API}/tasks/${task.id}/complete`,{},{headers:getH()}); } catch {} }
    setTasks(p=>p.map(t=>t.id===task.id?{...t,completed:!t.completed}:t));
  };

  const del = async (id) => {
    try { await axios.delete(`${API}/tasks/${id}`,{headers:getH()}); } catch {}
    setTasks(p=>p.filter(t=>t.id!==id));
    showT("Removed");
  };

  const clearDone = async () => {
    const done=tasks.filter(t=>t.completed);
    await Promise.allSettled(done.map(t=>axios.delete(`${API}/tasks/${t.id}`,{headers:getH()})));
    setTasks(p=>p.filter(t=>!t.completed));
    showT("Cleared completed tasks");
  };

  const filtered = useMemo(()=>tasks.filter(t=>{
    const ms = filter==="All"||(filter==="Active"&&!t.completed)||(filter==="Done"&&t.completed);
    const mp = priorityFilter==="All"||t.priority===priorityFilter;
    return ms&&mp;
  }),[tasks,filter,priorityFilter]);

  const counts = useMemo(()=>({ all:tasks.length, active:tasks.filter(t=>!t.completed).length, done:tasks.filter(t=>t.completed).length }),[tasks]);
  const isOD = d => d && new Date(d)<new Date(new Date().toDateString());
  const fmtD = d => d?new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):null;

  return (
    <div style={pg}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box}

        .tk-inp:focus{outline:none;border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,0.12);background:white}
        .tk-inp.err{border-color:#ef4444}
        .tk-btn{transition:filter 0.15s,transform 0.1s;cursor:pointer}
        .tk-btn:hover:not(:disabled){filter:brightness(1.06)}
        .tk-btn:active:not(:disabled){transform:scale(0.97)}
        .tk-btn:disabled{opacity:0.55;cursor:not-allowed}

        .tk-card{transition:box-shadow 0.18s,transform 0.15s}
        .tk-card:hover{box-shadow:0 6px 20px rgba(15,23,42,0.09);transform:translateY(-1px)}
        .tk-card.done{opacity:0.55}

        .tk-chk{width:22px;height:22px;border-radius:7px;border:2px solid #cbd5e1;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;transition:all 0.15s}
        .tk-chk:hover{border-color:#0ea5e9}
        .tk-chk.ck{background:#0ea5e9;border-color:#0ea5e9;color:white}

        .tk-del{background:none;border:none;cursor:pointer;color:#cbd5e1;font-size:16px;padding:3px 6px;border-radius:6px;transition:all 0.15s;flex-shrink:0;line-height:1}
        .tk-del:hover{color:#ef4444;background:#fef2f2}

        .tk-chip{padding:5px 12px;border-radius:999px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s;font-family:'Sora',sans-serif;border:1.5px solid #e2e8f0;background:white}
        .tk-chip:hover{border-color:#0ea5e9;color:#0ea5e9}
        .tk-chip.on{background:#0ea5e9;color:white;border-color:#0ea5e9;box-shadow:0 3px 10px rgba(14,165,233,0.25)}

        @keyframes spin{to{transform:rotate(360deg)}}
        .tk-spin{width:18px;height:18px;border:2.5px solid #e2e8f0;border-top-color:#0ea5e9;border-radius:50%;animation:spin 0.8s linear infinite;display:inline-block}

        @keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .tk-entry{animation:slideIn 0.2s ease both}

        @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .tk-toast{animation:toastIn 0.25s ease}

        @media(max-width:600px){.tk-form-grid{grid-template-columns:1fr!important}.tk-filters{flex-direction:column!important}}
      `}</style>

      {/* Toast */}
      {toast.msg && (
        <div className="tk-toast" style={{
          position:"fixed",top:"20px",right:"20px",zIndex:9999,
          padding:"12px 18px",borderRadius:"12px",fontFamily:"'Sora',sans-serif",fontSize:"13px",fontWeight:"600",
          background:toast.type==="err"?"#fef2f2":"#f0f9ff",
          color:toast.type==="err"?"#dc2626":"#0369a1",
          border:`1px solid ${toast.type==="err"?"#fecaca":"#bae6fd"}`,
          boxShadow:"0 8px 24px rgba(0,0,0,0.10)",
        }}>{toast.msg}</div>
      )}

      <div style={{maxWidth:"820px",margin:"0 auto"}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"16px",marginBottom:"24px"}}>
          <div>
            <h1 style={{fontSize:"30px",fontWeight:"800",color:"#0f172a",letterSpacing:"-0.5px",marginBottom:"4px",fontFamily:"'Sora',sans-serif"}}>Tasks</h1>
            <p style={{color:"#64748b",fontSize:"14px",fontFamily:"'Sora',sans-serif"}}>Track assignments, deadlines, and exam prep.</p>
          </div>
          {/* Stats pills */}
          <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
            {[{v:counts.active,c:"#0ea5e9",bg:"#f0f9ff",l:"active"},{v:counts.done,c:"#22c55e",bg:"#f0fdf4",l:"done"}].map(s=>(
              <div key={s.l} style={{background:s.bg,borderRadius:"12px",padding:"10px 16px",display:"flex",alignItems:"baseline",gap:"6px",border:`1.5px solid ${s.c}22`}}>
                <span style={{fontSize:"22px",fontWeight:"800",color:s.c,fontFamily:"'JetBrains Mono',monospace"}}>{s.v}</span>
                <span style={{fontSize:"12px",color:"#64748b",fontWeight:"600",fontFamily:"'Sora',sans-serif"}}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Add Form */}
        <div style={{background:"white",borderRadius:"18px",padding:"18px",border:"1.5px solid #e2e8f0",boxShadow:"0 2px 10px rgba(15,23,42,0.05)",marginBottom:"18px"}}>
          <div className="tk-form-grid" style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:"10px",marginBottom:"12px"}}>
            <input className="tk-inp" style={inp} placeholder="Add a task… press Enter" value={title}
              onChange={e=>setTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()} />
            <select className="tk-inp" style={{...inp,paddingRight:"8px"}} value={priority} onChange={e=>setPriority(e.target.value)}>
              {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
            <input className="tk-inp" type="date" style={inp} value={dueDate} onChange={e=>setDueDate(e.target.value)} />
          </div>
          <button className="tk-btn" onClick={addTask} disabled={!title.trim()||adding}
            style={{padding:"11px 22px",borderRadius:"11px",border:"none",background:"#0ea5e9",color:"white",fontWeight:"700",fontSize:"14px",fontFamily:"'Sora',sans-serif",boxShadow:"0 4px 12px rgba(14,165,233,0.28)",opacity:!title.trim()?0.5:1,cursor:!title.trim()?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:"8px"}}>
            {adding?<><span className="tk-spin"/>Adding…</>:"+ Add Task"}
          </button>
        </div>

        {/* Filters */}
        <div className="tk-filters" style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"10px",marginBottom:"18px"}}>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
            {["All","Active","Done"].map(f=>(
              <button key={f} className={`tk-chip${filter===f?" on":""}`} onClick={()=>setFilter(f)}>
                {f} {f==="All"?`(${counts.all})`:f==="Active"?`(${counts.active})`:`(${counts.done})`}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
            {["All",...PRIORITIES].map(p=>{
              const cfg=P_CONFIG[p]; const on=priorityFilter===p;
              return (
                <button key={p} className="tk-chip" onClick={()=>setPriorityFilter(p)}
                  style={{background:on&&cfg?cfg.bg:"white",color:on&&cfg?cfg.color:"#64748b",borderColor:on&&cfg?cfg.color:"#e2e8f0"}}>
                  {cfg&&<span style={{width:8,height:8,borderRadius:"50%",background:cfg.dot,display:"inline-block",marginRight:4}}/>}
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{textAlign:"center",padding:"60px 20px"}}>
            <span className="tk-spin"/><br/>
            <span style={{marginTop:"14px",display:"block",color:"#94a3b8",fontFamily:"'Sora',sans-serif",fontSize:"14px"}}>Loading tasks…</span>
          </div>
        ) : filtered.length===0 ? (
          <div style={{textAlign:"center",padding:"60px 20px",background:"white",borderRadius:"18px",border:"1.5px solid #e2e8f0"}}>
            <div style={{fontSize:"48px",marginBottom:"12px"}}>{tasks.length===0?"📋":"✅"}</div>
            <p style={{fontWeight:"700",fontSize:"18px",color:"#0f172a",marginBottom:"6px",fontFamily:"'Sora',sans-serif"}}>
              {tasks.length===0?"No tasks yet":"Nothing here"}
            </p>
            <p style={{color:"#94a3b8",fontSize:"14px",fontFamily:"'Sora',sans-serif"}}>
              {tasks.length===0?"Add your first task above.":"Try switching filters."}
            </p>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {filtered.map((task,i)=>{
              const cfg=P_CONFIG[task.priority]||P_CONFIG["Medium"];
              const ov=!task.completed&&isOD(task.dueDate);
              return (
                <div key={task.id} className={`tk-card tk-entry${task.completed?" done":""}`} style={{
                  background:"white",borderRadius:"14px",padding:"14px 16px",
                  border:"1.5px solid #f1f5f9",borderLeft:`4px solid ${task.completed?"#e2e8f0":cfg.color}`,
                  boxShadow:"0 2px 6px rgba(15,23,42,0.04)",
                  display:"flex",alignItems:"flex-start",gap:"12px",
                  animationDelay:`${i*0.03}s`,
                }}>
                  <button className={`tk-chk${task.completed?" ck":""}`} onClick={()=>toggle(task)}>
                    {task.completed&&"✓"}
                  </button>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:"600",fontSize:"15px",fontFamily:"'Sora',sans-serif",color:task.completed?"#94a3b8":"#0f172a",textDecoration:task.completed?"line-through":"none",marginBottom:"6px",wordBreak:"break-word"}}>
                      {task.title}
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center"}}>
                      <span style={{padding:"3px 10px",borderRadius:"999px",fontSize:"11px",fontWeight:"700",background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,display:"flex",alignItems:"center",gap:"4px"}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:cfg.dot,display:"inline-block"}}/>
                        {task.priority}
                      </span>
                      {task.dueDate&&(
                        <span style={{fontSize:"12px",fontWeight:"600",color:ov?"#dc2626":"#94a3b8",fontFamily:"'JetBrains Mono',monospace",display:"flex",alignItems:"center",gap:"4px"}}>
                          {ov?"⚠":"📅"} {fmtD(task.dueDate)}{ov&&" · Overdue"}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="tk-del" onClick={()=>del(task.id)}>✕</button>
                </div>
              );
            })}
          </div>
        )}

        {counts.done>0&&!loading&&(
          <div style={{marginTop:"18px",textAlign:"right"}}>
            <button className="tk-btn" onClick={clearDone} style={{background:"none",border:"1.5px solid #fecaca",color:"#dc2626",padding:"9px 16px",borderRadius:"10px",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>
              🗑 Clear {counts.done} completed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const pg  = { minHeight:"100vh", background:"#f8fafc", padding:"24px 20px 48px", fontFamily:"'Sora',system-ui,sans-serif" };
const inp = { width:"100%", padding:"11px 14px", borderRadius:"10px", border:"1.5px solid #e2e8f0", fontSize:"14px", color:"#0f172a", background:"#f8fafc", fontFamily:"'Sora',sans-serif", transition:"all 0.15s", boxSizing:"border-box" };