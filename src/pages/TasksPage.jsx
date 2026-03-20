import { useState, useEffect, useMemo } from "react";

const PRIORITIES = ["Low", "Medium", "High"];

const priorityConfig = {
  High:   { color: "#ef4444", bg: "#fef2f2", border: "#fecaca", icon: "🔴", accent: "#ef4444" },
  Medium: { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", icon: "🟡", accent: "#f59e0b" },
  Low:    { color: "#10b981", bg: "#f0fdf4", border: "#a7f3d0", icon: "🟢", accent: "#10b981" },
};

function TasksPage() {
  const [tasks,          setTasks]          = useState([]);
  const [title,          setTitle]          = useState("");
  const [priority,       setPriority]       = useState("Medium");
  const [dueDate,        setDueDate]        = useState("");
  const [filter,         setFilter]         = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [successMsg,     setSuccessMsg]     = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`tasks_v2_${localStorage.getItem("userName") || "guest"}`)) || [];
    setTasks(saved);
  }, []);

  const saveTasks = (updated) => {
    setTasks(updated);
    localStorage.setItem(`tasks_v2_${localStorage.getItem("userName") || "guest"}`, JSON.stringify(updated));
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 2200);
  };

  const addTask = () => {
    if (title.trim() === "") return;
    const newTask = { id: Date.now(), title: title.trim(), priority, dueDate, completed: false, createdAt: new Date().toISOString() };
    saveTasks([newTask, ...tasks]);
    setTitle(""); setPriority("Medium"); setDueDate("");
    showSuccess("Task added!");
  };

  const toggleComplete = (id) => {
    saveTasks(tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    saveTasks(tasks.filter((t) => t.id !== id));
    showSuccess("Task deleted.");
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") addTask(); };

  const filteredTasks = useMemo(() => tasks.filter((t) => {
    const ms = filter === "All" || (filter === "Active" && !t.completed) || (filter === "Done" && t.completed);
    const mp = priorityFilter === "All" || t.priority === priorityFilter;
    return ms && mp;
  }), [tasks, filter, priorityFilter]);

  const counts = useMemo(() => ({
    all: tasks.length,
    active: tasks.filter((t) => !t.completed).length,
    done: tasks.filter((t) => t.completed).length,
  }), [tasks]);

  const isOverdue = (d) => d && new Date(d) < new Date(new Date().toDateString());
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

  const donePercent = counts.all > 0 ? Math.round((counts.done / counts.all) * 100) : 0;

  return (
    <div style={pageStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Inputs ── */
        .tk-inp:focus, .tk-sel:focus {
          outline: none;
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.13) !important;
          background: white !important;
        }
        .tk-inp::placeholder { color: #b0b8cc; }

        /* ── Add button ── */
        .tk-add-btn {
          transition: filter 0.15s, transform 0.12s, box-shadow 0.15s;
          position: relative; overflow: hidden;
        }
        .tk-add-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          pointer-events: none;
        }
        .tk-add-btn:hover:not(:disabled) {
          filter: brightness(1.08);
          box-shadow: 0 8px 24px rgba(99,102,241,0.40) !important;
          transform: translateY(-1px);
        }
        .tk-add-btn:active:not(:disabled) { transform: scale(0.97); }
        .tk-add-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── Task card ── */
        .tk-card {
          background: white;
          border-radius: 16px;
          padding: 16px 18px;
          border: 1.5px solid #f0f2f8;
          border-left: 4px solid transparent;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          transition: box-shadow 0.2s, transform 0.18s;
        }
        .tk-card:hover {
          box-shadow: 0 8px 28px rgba(15,23,42,0.09);
          transform: translateY(-2px);
        }
        .tk-card.done-card { opacity: 0.52; background: #fafbfd; }

        /* ── Checkbox ── */
        .tk-chk {
          width: 22px; height: 22px; border-radius: 7px;
          border: 2px solid #d1d9e6; background: white;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 12px; flex-shrink: 0; margin-top: 2px;
          transition: all 0.15s;
        }
        .tk-chk:hover { border-color: #6366f1; transform: scale(1.1); }
        .tk-chk.checked { background: #6366f1; border-color: #6366f1; color: white; }

        /* ── Delete ── */
        .tk-del {
          background: none; border: none; cursor: pointer;
          color: #d1d9e6; font-size: 15px; padding: 3px 6px;
          border-radius: 6px; line-height: 1; flex-shrink: 0;
          transition: color 0.15s, background 0.15s;
        }
        .tk-del:hover { color: #ef4444; background: #fef2f2; }

        /* ── Filter chips ── */
        .tk-chip {
          padding: 7px 16px; border-radius: 999px;
          font-size: 13px; font-weight: 600;
          border: 1.5px solid #e8eaf2; background: white;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .tk-chip:hover { border-color: #6366f1; color: #6366f1; }
        .tk-chip.on {
          background: #6366f1; color: white; border-color: #6366f1;
          box-shadow: 0 4px 12px rgba(99,102,241,0.28);
        }

        /* ── Toast ── */
        .tk-toast {
          position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
          background: #0f172a; color: white;
          padding: 12px 24px; border-radius: 999px;
          font-size: 13px; font-weight: 700;
          box-shadow: 0 10px 30px rgba(0,0,0,0.20);
          z-index: 9999; white-space: nowrap;
          animation: toastUp 0.28s cubic-bezier(0.22,1,0.36,1);
          font-family: 'DM Sans', sans-serif;
        }
        @keyframes toastUp {
          from { opacity:0; transform: translateX(-50%) translateY(14px); }
          to   { opacity:1; transform: translateX(-50%) translateY(0); }
        }

        /* ── Slide in ── */
        @keyframes slideDown {
          from { opacity:0; transform: translateY(-10px); }
          to   { opacity:1; transform: translateY(0); }
        }
        .tk-entry { animation: slideDown 0.22s ease both; }

        /* ── Progress bar ── */
        .tk-prog-fill { transition: width 0.5s cubic-bezier(0.22,1,0.36,1); }

        /* ── Mobile ── */
        @media(max-width:620px) {
          .tk-form-row { grid-template-columns: 1fr !important; }
          .tk-filters  { flex-direction: column !important; }
          .tk-header   { flex-direction: column !important; }
        }
      `}</style>

      {successMsg && <div className="tk-toast">{successMsg}</div>}

      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div className="tk-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, marginBottom:28, flexWrap:"wrap" }}>
          <div>
            <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:36, fontWeight:400, color:"#0f172a", margin:"0 0 4px", letterSpacing:"-0.3px" }}>
              Task Manager
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", color:"#94a3b8", fontSize:14, margin:0 }}>
              Track assignments, deadlines, and exam prep.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display:"flex", gap:10 }}>
            {[
              { n: counts.active, label:"active",    c:"#6366f1", bg:"#eef2ff" },
              { n: counts.done,   label:"completed", c:"#10b981", bg:"#f0fdf4" },
            ].map(s => (
              <div key={s.label} style={{ background:s.bg, border:`1.5px solid ${s.c}22`, borderRadius:14, padding:"12px 18px", textAlign:"center", minWidth:80 }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:26, fontWeight:700, color:s.c, lineHeight:1 }}>{s.n}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#94a3b8", marginTop:3, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Progress bar (only if tasks exist) ── */}
        {counts.all > 0 && (
          <div style={{ background:"white", borderRadius:16, padding:"16px 20px", marginBottom:18, border:"1.5px solid #f0f2f8", boxShadow:"0 2px 8px rgba(15,23,42,0.05)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, color:"#475569" }}>Overall Progress</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:700, color:"#6366f1" }}>{donePercent}%</span>
            </div>
            <div style={{ height:8, background:"#f0f2f8", borderRadius:999, overflow:"hidden" }}>
              <div className="tk-prog-fill" style={{ height:"100%", borderRadius:999, width:`${donePercent}%`, background:"linear-gradient(90deg,#6366f1,#8b5cf6)" }} />
            </div>
          </div>
        )}

        {/* ── Add Form ── */}
        <div style={{ background:"white", borderRadius:20, padding:"20px 22px", border:"1.5px solid #f0f2f8", boxShadow:"0 4px 20px rgba(15,23,42,0.07)", marginBottom:18 }}>
          <div className="tk-form-row" style={{ display:"grid", gridTemplateColumns:"1fr auto auto", gap:10, marginBottom:12 }}>
            <input
              className="tk-inp"
              type="text"
              placeholder="What needs to be done? (Press Enter)"
              style={{ ...inp, flex:1 }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <select className="tk-sel" style={{ ...inp, paddingRight:10, minWidth:130 }} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{priorityConfig[p].icon} {p}</option>
              ))}
            </select>
            <input className="tk-inp" type="date" style={{ ...inp, minWidth:140 }} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <button
            className="tk-add-btn"
            onClick={addTask}
            disabled={title.trim() === ""}
            style={{
              padding:"12px 26px", borderRadius:11, border:"none",
              background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
              color:"white", fontWeight:700, fontSize:14,
              fontFamily:"'DM Sans',sans-serif",
              boxShadow:"0 4px 14px rgba(99,102,241,0.30)",
              cursor: title.trim() === "" ? "not-allowed" : "pointer",
            }}
          >
            + Add Task
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="tk-filters" style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginBottom:20 }}>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {["All","Active","Done"].map((f) => (
              <button key={f} className={`tk-chip${filter===f?" on":""}`} onClick={() => setFilter(f)}>
                {f}{f==="All"?` (${counts.all})`:f==="Active"?` (${counts.active})`:`(${counts.done})`}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {["All",...PRIORITIES].map((p) => {
              const cfg = priorityConfig[p];
              const on  = priorityFilter === p;
              return (
                <button key={p} className="tk-chip" onClick={() => setPriorityFilter(p)}
                  style={{ background:on&&cfg?cfg.bg:undefined, color:on&&cfg?cfg.color:undefined, borderColor:on&&cfg?cfg.color:undefined }}>
                  {cfg ? cfg.icon : "🔘"} {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Task List ── */}
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px", background:"white", borderRadius:20, border:"1.5px dashed #e8eaf2" }}>
            <div style={{ fontSize:52, marginBottom:14 }}>{tasks.length === 0 ? "📋" : "✅"}</div>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:800, fontSize:18, color:"#0f172a", margin:"0 0 8px" }}>
              {tasks.length === 0 ? "No tasks yet" : "Nothing here"}
            </p>
            <p style={{ fontFamily:"'DM Sans',sans-serif", color:"#94a3b8", fontSize:14, margin:0 }}>
              {tasks.length === 0 ? "Add your first task above." : "Try switching filters."}
            </p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filteredTasks.map((task, i) => {
              const cfg     = priorityConfig[task.priority] || priorityConfig["Medium"];
              const overdue = !task.completed && isOverdue(task.dueDate);
              return (
                <div
                  key={task.id}
                  className={`tk-card tk-entry${task.completed ? " done-card" : ""}`}
                  style={{ borderLeftColor: task.completed ? "#e8eaf2" : cfg.accent, animationDelay:`${i*0.04}s` }}
                >
                  {/* Checkbox */}
                  <button className={`tk-chk${task.completed ? " checked" : ""}`} onClick={() => toggleComplete(task.id)}>
                    {task.completed && "✓"}
                  </button>

                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{
                      fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:15,
                      color: task.completed ? "#94a3b8" : "#0f172a",
                      textDecoration: task.completed ? "line-through" : "none",
                      marginBottom:8, wordBreak:"break-word",
                    }}>
                      {task.title}
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"center" }}>
                      {/* Priority */}
                      <span style={{
                        padding:"3px 11px", borderRadius:999, fontSize:12, fontWeight:700,
                        background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`,
                        fontFamily:"'DM Sans',sans-serif",
                        display:"flex", alignItems:"center", gap:4,
                      }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:cfg.color, display:"inline-block" }}/>
                        {task.priority}
                      </span>
                      {/* Due date */}
                      {task.dueDate && (
                        <span style={{
                          fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:600,
                          color: overdue ? "#ef4444" : "#94a3b8",
                          display:"flex", alignItems:"center", gap:4,
                          background: overdue ? "#fef2f2" : "#f8fafc",
                          padding:"3px 10px", borderRadius:999,
                          border:`1px solid ${overdue?"#fecaca":"#e8eaf2"}`,
                        }}>
                          {overdue ? "⚠" : "📅"} {formatDate(task.dueDate)}{overdue && " · Overdue"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button className="tk-del" onClick={() => deleteTask(task.id)}>✕</button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Clear Done ── */}
        {counts.done > 0 && (
          <div style={{ marginTop:20, textAlign:"right" }}>
            <button
              onClick={() => { saveTasks(tasks.filter(t => !t.completed)); showSuccess("Completed tasks cleared!"); }}
              style={{
                background:"none", border:"1.5px solid #fecaca", color:"#ef4444",
                padding:"9px 18px", borderRadius:10, fontSize:13, fontWeight:600,
                cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                transition:"background 0.15s",
              }}
            >
              🗑 Clear {counts.done} completed {counts.done === 1 ? "task" : "tasks"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle = {
  padding: "28px 20px 52px",
  fontFamily: "'DM Sans', sans-serif",
  minHeight: "100vh",
  background: "#f5f6fa",
};

const inp = {
  padding: "12px 14px", borderRadius: 11,
  border: "1.5px solid #e8eaf2", fontSize: 14,
  background: "#fafbfd", color: "#0f172a",
  fontFamily: "'DM Sans', sans-serif",
  width: "100%", boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
};

export default TasksPage;