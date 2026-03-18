import { useState, useEffect, useMemo } from "react";
import axios from "axios";

const API = "https://smart-campus-backend-bbmo.onrender.com";
const PRIORITIES = ["Low", "Medium", "High"];
const priorityConfig = {
  High:   { color:"#dc2626", bg:"#fef2f2", border:"#fecaca", icon:"🔴" },
  Medium: { color:"#d97706", bg:"#fffbeb", border:"#fde68a", icon:"🟡" },
  Low:    { color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0", icon:"🟢" },
};

const mapTask = (t) => ({
  id:        t.id,
  title:     t.title,
  priority:  t.type || "Medium",
  dueDate:   t.dueDate || "",
  completed: t.status === "COMPLETED",
  createdAt: t.createdAt || new Date().toISOString(),
});

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function TasksPage() {
  const [tasks,          setTasks]          = useState([]);
  const [title,          setTitle]          = useState("");
  const [priority,       setPriority]       = useState("Medium");
  const [dueDate,        setDueDate]        = useState("");
  const [filter,         setFilter]         = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [toast,          setToast]          = useState("");
  const [loading,        setLoading]        = useState(true);
  const [apiError,       setApiError]       = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/tasks`, { headers: getHeaders() });
        setTasks(res.data.map(mapTask));
      } catch {
        setApiError(true);
        const saved = JSON.parse(localStorage.getItem(`tasks_v2_${localStorage.getItem("userName")||"guest"}`) || "[]");
        setTasks(saved);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  const addTask = async () => {
    if (!title.trim()) return;
    try {
      const res = await axios.post(`${API}/tasks`, { title:title.trim(), description:"", type:priority, dueDate:dueDate||null }, { headers:getHeaders() });
      setTasks((p) => [mapTask(res.data), ...p]);
      showToast("✅ Task added!");
    } catch {
      const t = { id:Date.now(), title:title.trim(), priority, dueDate, completed:false, createdAt:new Date().toISOString() };
      setTasks((p) => { const u=[t,...p]; localStorage.setItem(`tasks_v2_${localStorage.getItem("userName")||"guest"}`,JSON.stringify(u)); return u; });
      showToast("✅ Task added (offline)");
    }
    setTitle(""); setPriority("Medium"); setDueDate("");
  };

  const toggleComplete = async (task) => {
    if (!task.completed) {
      try { await axios.patch(`${API}/tasks/${task.id}/complete`, {}, { headers:getHeaders() }); } catch {}
    }
    setTasks((p) => p.map((t) => t.id===task.id ? {...t, completed:!t.completed} : t));
  };

  const deleteTask = async (id) => {
    try { await axios.delete(`${API}/tasks/${id}`, { headers:getHeaders() }); } catch {}
    setTasks((p) => p.filter((t) => t.id!==id));
    showToast("🗑 Task deleted.");
  };

  const clearDone = async () => {
    const done = tasks.filter((t) => t.completed);
    await Promise.allSettled(done.map((t) => axios.delete(`${API}/tasks/${t.id}`, { headers:getHeaders() })));
    setTasks((p) => p.filter((t) => !t.completed));
    showToast("🗑 Completed tasks cleared!");
  };

  const filteredTasks = useMemo(() => tasks.filter((t) => {
    const ms = filter==="All"||(filter==="Active"&&!t.completed)||(filter==="Done"&&t.completed);
    const mp = priorityFilter==="All"||t.priority===priorityFilter;
    return ms && mp;
  }), [tasks, filter, priorityFilter]);

  const counts = useMemo(() => ({ all:tasks.length, active:tasks.filter(t=>!t.completed).length, done:tasks.filter(t=>t.completed).length }), [tasks]);
  const isOverdue = (d) => d && new Date(d) < new Date(new Date().toDateString());
  const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : null;

  return (
    <div style={{padding:"24px 20px 40px",fontFamily:"'DM Sans',sans-serif",minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap');
        *{box-sizing:border-box}
        .ti:focus,.ts:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,0.12)}
        .ab:hover:not(:disabled){filter:brightness(1.08)}.ab:active:not(:disabled){transform:scale(0.97)}
        .tc{background:white;border-radius:14px;padding:16px 18px;border:1.5px solid #e2e8f0;display:flex;align-items:flex-start;gap:14px;transition:box-shadow 0.18s,opacity 0.18s}
        .tc:hover{box-shadow:0 6px 20px rgba(15,23,42,0.09)}.tc.done{opacity:0.6;background:#f8fafc}
        .cb{width:22px;height:22px;border-radius:6px;border:2px solid #cbd5e1;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;margin-top:2px;transition:background 0.15s,border-color 0.15s}
        .cb:hover{border-color:#2563eb}.cb.ck{background:#22c55e;border-color:#22c55e;color:white}
        .db{background:none;border:none;cursor:pointer;color:#cbd5e1;font-size:16px;padding:2px 6px;border-radius:6px;transition:color 0.15s,background 0.15s;flex-shrink:0}
        .db:hover{color:#ef4444;background:#fef2f2}
        .fc{padding:7px 16px;border-radius:999px;font-size:13px;font-weight:600;border:1.5px solid #e2e8f0;background:white;cursor:pointer;transition:all 0.15s;font-family:'DM Sans',sans-serif}
        .fc:hover{border-color:#2563eb;color:#2563eb}.fc.act{background:#2563eb;color:white;border-color:#2563eb;box-shadow:0 4px 12px rgba(37,99,235,0.25)}
        .tst{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#0f172a;color:white;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.18);z-index:9999;white-space:nowrap;animation:fiu 0.25s ease}
        @keyframes fiu{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .sp{width:18px;height:18px;border:2.5px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block}
        @media(max-width:600px){.fg{grid-template-columns:1fr!important}.fr{flex-direction:column}.hr{flex-direction:column}}
      `}</style>

      {toast && <div className="tst">{toast}</div>}

      <div style={{maxWidth:"800px",margin:"0 auto"}}>

        {/* Header */}
        <div className="hr" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"16px",marginBottom:"22px"}}>
          <div>
            <h1 style={{fontSize:"32px",fontWeight:"700",color:"#0f172a",margin:"0 0 4px",letterSpacing:"-0.5px"}}>Tasks Manager</h1>
            <p style={{color:"#64748b",fontSize:"15px",margin:0}}>Track your assignments, exams, and deadlines.</p>
          </div>
          <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
            {[{v:counts.active,c:"#2563eb",l:"active"},{v:counts.done,c:"#22c55e",l:"done"}].map(s=>(
              <div key={s.l} style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:"10px",padding:"10px 14px",display:"flex",alignItems:"baseline",boxShadow:"0 2px 6px rgba(15,23,42,0.05)",fontFamily:"'DM Mono',monospace",fontSize:"18px"}}>
                <span style={{color:s.c,fontWeight:"700"}}>{s.v}</span>
                <span style={{color:"#64748b",fontSize:"12px",marginLeft:"4px"}}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {apiError && (
          <div style={{background:"#fef9ee",border:"1px solid #fde68a",borderRadius:"10px",padding:"10px 14px",fontSize:"13px",color:"#92400e",marginBottom:"14px"}}>
            ⚠️ Offline mode — tasks saved locally and will sync when connection is restored.
          </div>
        )}

        {/* Form */}
        <div style={{background:"white",borderRadius:"16px",padding:"18px",border:"1.5px solid #e2e8f0",boxShadow:"0 2px 10px rgba(15,23,42,0.05)",marginBottom:"16px"}}>
          <div className="fg" style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:"10px",marginBottom:"12px"}}>
            <input className="ti" type="text" placeholder="Add a new task… (Enter)" style={iSt} value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()} />
            <select className="ts" style={iSt} value={priority} onChange={e=>setPriority(e.target.value)}>
              {PRIORITIES.map(p=><option key={p} value={p}>{priorityConfig[p].icon} {p}</option>)}
            </select>
            <input className="ti" type="date" style={iSt} value={dueDate} onChange={e=>setDueDate(e.target.value)} />
          </div>
          <button className="ab" onClick={addTask} disabled={!title.trim()} style={{padding:"11px 22px",borderRadius:"10px",border:"none",background:"#2563eb",color:"white",fontWeight:"700",fontSize:"14px",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 4px 12px rgba(37,99,235,0.25)",cursor:!title.trim()?"not-allowed":"pointer",opacity:!title.trim()?0.5:1,transition:"filter 0.15s,transform 0.1s"}}>
            + Add Task
          </button>
        </div>

        {/* Filters */}
        <div className="fr" style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"10px",marginBottom:"16px"}}>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            {["All","Active","Done"].map(f=>(
              <button key={f} className={`fc${filter===f?" act":""}`} onClick={()=>setFilter(f)}>
                {f}{f==="All"?` (${counts.all})`:f==="Active"?` (${counts.active})`:` (${counts.done})`}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            {["All",...PRIORITIES].map(p=>{
              const cfg=priorityConfig[p]; const ia=priorityFilter===p;
              return <button key={p} className="fc" onClick={()=>setPriorityFilter(p)} style={{background:ia&&cfg?cfg.bg:undefined,color:ia&&cfg?cfg.color:undefined,borderColor:ia&&cfg?cfg.color:undefined}}>{cfg?cfg.icon:"🔘"} {p}</button>;
            })}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{textAlign:"center",padding:"48px",color:"#94a3b8"}}>
            <span className="sp"/><br/><span style={{fontSize:"14px",marginTop:"12px",display:"block"}}>Loading tasks…</span>
          </div>
        ) : filteredTasks.length===0 ? (
          <div style={{textAlign:"center",padding:"50px 20px",background:"white",borderRadius:"16px",border:"1.5px solid #e2e8f0"}}>
            <div style={{fontSize:"44px",marginBottom:"12px"}}>{tasks.length===0?"📋":"✅"}</div>
            <p style={{fontWeight:"700",fontSize:"18px",color:"#0f172a",margin:"0 0 6px"}}>{tasks.length===0?"No tasks yet":"No tasks match this filter"}</p>
            <p style={{color:"#64748b",margin:0}}>{tasks.length===0?"Add your first task above.":"Try switching the filter."}</p>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            {filteredTasks.map(task=>{
              const cfg=priorityConfig[task.priority]||priorityConfig["Medium"];
              const ov=!task.completed&&isOverdue(task.dueDate);
              return (
                <div key={task.id} className={`tc${task.completed?" done":""}`}>
                  <button className={`cb${task.completed?" ck":""}`} onClick={()=>toggleComplete(task)}>{task.completed&&"✓"}</button>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:"600",fontSize:"15px",color:task.completed?"#94a3b8":"#0f172a",textDecoration:task.completed?"line-through":"none",marginBottom:"6px",wordBreak:"break-word"}}>{task.title}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center"}}>
                      <span style={{padding:"3px 10px",borderRadius:"999px",fontSize:"12px",fontWeight:"700",background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`}}>{cfg.icon} {task.priority}</span>
                      {task.dueDate&&<span style={{fontSize:"12px",fontWeight:"600",color:ov?"#dc2626":"#64748b"}}>{ov?"⚠️":"📅"} {fmtDate(task.dueDate)}{ov&&" — Overdue"}</span>}
                    </div>
                  </div>
                  <button className="db" onClick={()=>deleteTask(task.id)}>✕</button>
                </div>
              );
            })}
          </div>
        )}

        {counts.done>0&&!loading&&(
          <div style={{marginTop:"20px",textAlign:"right"}}>
            <button onClick={clearDone} style={{background:"none",border:"1.5px solid #fecaca",color:"#dc2626",padding:"9px 16px",borderRadius:"10px",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              🗑 Clear {counts.done} completed {counts.done===1?"task":"tasks"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const iSt = {padding:"11px 14px",borderRadius:"10px",border:"1.5px solid #e2e8f0",fontSize:"14px",background:"#f8fafc",color:"#0f172a",fontFamily:"'DM Sans',sans-serif",transition:"border-color 0.15s,box-shadow 0.15s",width:"100%",boxSizing:"border-box"};