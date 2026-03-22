import { useState, useEffect, useMemo } from "react";
import api from "../api/api";

const mapTask = t => ({ id: t.id, title: t.title, priority: t.type || "Medium", dueDate: t.dueDate || "", completed: t.status === "COMPLETED", createdAt: t.createdAt || "" });
const PRIORITIES = ["Low", "Medium", "High"];
const priorityConfig = {
  High:   { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: "🔴" },
  Medium: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: "🟡" },
  Low:    { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: "🟢" },
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
    api.get("/tasks")
      .then(r => setTasks(r.data.map(mapTask)))
      .catch(() => {
        const saved = JSON.parse(localStorage.getItem(`tasks_v2_${localStorage.getItem("userName") || "guest"}`) || "[]");
        setTasks(saved);
      });
  }, []);

  const saveTasks = (updated) => {
    setTasks(updated);
    localStorage.setItem(`tasks_v2_${localStorage.getItem("userName") || "guest"}`, JSON.stringify(updated));
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 2200);
  };

  const addTask = async () => {
    if (title.trim() === "") return;
    try {
      const r = await api.post("/tasks", { title: title.trim(), description: "", type: priority, dueDate: dueDate || null });
      setTasks(p => [mapTask(r.data), ...p]);
      showSuccess("Task added!");
    } catch {
      const t = { id: Date.now(), title: title.trim(), priority, dueDate, completed: false, createdAt: new Date().toISOString() };
      saveTasks([t, ...tasks]);
      showSuccess("Task added (offline)");
    }
    setTitle(""); setPriority("Medium"); setDueDate("");
  };

  const toggleComplete = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    if (!task.completed) {
      try { await api.patch(`/tasks/${id}/complete`, {}); } catch {}
    }
    setTasks(p => p.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = async (id) => {
    try { await api.delete(`/tasks/${id}`); } catch {}
    setTasks(p => p.filter(t => t.id !== id));
    showSuccess("Task deleted.");
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") addTask(); };

  const filteredTasks = useMemo(() => tasks.filter((t) => {
    const matchStatus   = filter === "All" || (filter === "Active" && !t.completed) || (filter === "Done" && t.completed);
    const matchPriority = priorityFilter === "All" || t.priority === priorityFilter;
    return matchStatus && matchPriority;
  }), [tasks, filter, priorityFilter]);

  const counts = useMemo(() => ({
    all:    tasks.length,
    active: tasks.filter((t) => !t.completed).length,
    done:   tasks.filter((t) =>  t.completed).length,
  }), [tasks]);

  const isOverdue = (dueDate) => dueDate ? new Date(dueDate) < new Date(new Date().toDateString()) : false;
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <div style={pageStyle}>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
* { box-sizing: border-box; }
.task-input:focus, .task-select:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); background: white !important; }
.add-btn { transition: filter 0.15s, transform 0.1s, box-shadow 0.15s; }
.add-btn:hover:not(:disabled) { filter: brightness(1.08); box-shadow: 0 8px 22px rgba(37,99,235,0.35); }
.add-btn:active:not(:disabled) { transform: scale(0.97); }
.add-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.task-card { background: white; border-radius: 14px; padding: 16px 18px; border: 1.5px solid #f1f5f9; border-left: 4px solid transparent; display: flex; align-items: flex-start; gap: 14px; transition: box-shadow 0.18s, transform 0.15s; }
.task-card:hover { box-shadow: 0 6px 20px rgba(15,23,42,0.09); transform: translateY(-1px); }
.task-card.completed { opacity: 0.55; background: #f8fafc; }
.check-btn { width: 22px; height: 22px; border-radius: 7px; border: 2px solid #cbd5e1; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; margin-top: 2px; transition: background 0.15s, border-color 0.15s, transform 0.1s; }
.check-btn:hover { border-color: #2563eb; transform: scale(1.08); }
.check-btn.done { background: #22c55e; border-color: #22c55e; color: white; }
.delete-btn { background: none; border: none; cursor: pointer; color: #cbd5e1; font-size: 16px; padding: 3px 6px; border-radius: 6px; transition: color 0.15s, background 0.15s; flex-shrink: 0; line-height: 1; }
.delete-btn:hover { color: #ef4444; background: #fef2f2; }
.filter-chip { padding: 7px 16px; border-radius: 999px; font-size: 13px; font-weight: 600; border: 1.5px solid #e2e8f0; background: white; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
.filter-chip:hover { border-color: #2563eb; color: #2563eb; }
.filter-chip.active { background: #2563eb; color: white; border-color: #2563eb; box-shadow: 0 4px 12px rgba(37,99,235,0.25); }
.toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: #0f172a; color: white; padding: 12px 22px; border-radius: 999px; font-size: 14px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,0.18); z-index: 9999; white-space: nowrap; animation: fadeInUp 0.25s ease; }
@keyframes fadeInUp { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
@keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
.task-entry { animation: slideIn 0.2s ease both; }

/* ── Mobile form grid fix ── */
.task-form-grid { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; margin-bottom: 12px; }
@media (max-width: 520px) {
  .task-form-grid { grid-template-columns: 1fr; }
  .task-form-grid input[type="date"],
  .task-form-grid select { width: 100%; }
}
      `}</style>

      {successMsg && <div className="toast">{successMsg}</div>}

      <div style={container}>
        <div style={headerRow}>
          <div>
            <h1 style={titleStyle}>Tasks Manager</h1>
            <p style={subtitleStyle}>Track your assignments, exams, and deadlines.</p>
          </div>
          <div style={statsRow}>
            <div style={statPill}>
              <span style={{ color: "#2563eb", fontWeight: "700" }}>{counts.active}</span>
              <span style={{ color: "#64748b", fontSize: "12px", marginLeft: "4px" }}>active</span>
            </div>
            <div style={statPill}>
              <span style={{ color: "#22c55e", fontWeight: "700" }}>{counts.done}</span>
              <span style={{ color: "#64748b", fontSize: "12px", marginLeft: "4px" }}>done</span>
            </div>
          </div>
        </div>

        <div style={formCard}>
          <div className="task-form-grid">
            <input className="task-input" type="text" placeholder="Add a new task... (Press Enter)" style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={handleKeyDown} />
            <select className="task-select" style={inputStyle} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{priorityConfig[p].icon} {p} Priority</option>)}
            </select>
            <input className="task-input" type="date" style={inputStyle} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <button className="add-btn" onClick={addTask} disabled={title.trim() === ""} style={{ ...addBtnStyle, opacity: title.trim() === "" ? 0.5 : 1, cursor: title.trim() === "" ? "not-allowed" : "pointer", width: "100%" }}>
            + Add Task
          </button>
        </div>

        <div style={filtersRow}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["All", "Active", "Done"].map((f) => (
              <button key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f}{f === "All" && ` (${counts.all})`}{f === "Active" && ` (${counts.active})`}{f === "Done" && ` (${counts.done})`}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["All", ...PRIORITIES].map((p) => {
              const cfg = priorityConfig[p];
              const isActive = priorityFilter === p;
              return (
                <button key={p} className="filter-chip" onClick={() => setPriorityFilter(p)} style={{ background: isActive && cfg ? cfg.bg : undefined, color: isActive && cfg ? cfg.color : undefined, borderColor: isActive && cfg ? cfg.color : undefined }}>
                  {cfg ? cfg.icon : "🔘"} {p}
                </button>
              );
            })}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div style={emptyState}>
            <div style={{ fontSize: "44px", marginBottom: "12px" }}>{tasks.length === 0 ? "📋" : "✅"}</div>
            <p style={{ fontWeight: "700", fontSize: "18px", color: "#0f172a", margin: "0 0 6px" }}>{tasks.length === 0 ? "No tasks yet" : "No tasks match this filter"}</p>
            <p style={{ color: "#64748b", margin: 0 }}>{tasks.length === 0 ? "Add your first task above." : "Try switching the filter."}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredTasks.map((task) => {
              const cfg     = priorityConfig[task.priority] || priorityConfig["Medium"];
              const overdue = !task.completed && isOverdue(task.dueDate);
              return (
                <div key={task.id} className={`task-card task-entry${task.completed ? " completed" : ""}`} style={{ borderLeftColor: task.completed ? "#e2e8f0" : cfg.color }}>
                  <button className={`check-btn${task.completed ? " done" : ""}`} onClick={() => toggleComplete(task.id)} title={task.completed ? "Mark as active" : "Mark as done"}>
                    {task.completed && "✓"}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "600", fontSize: "15px", color: task.completed ? "#94a3b8" : "#0f172a", textDecoration: task.completed ? "line-through" : "none", marginBottom: "6px", wordBreak: "break-word" }}>
                      {task.title}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {cfg.icon} {task.priority}
                      </span>
                      {task.dueDate && (
                        <span style={{ fontSize: "12px", fontWeight: "600", color: overdue ? "#dc2626" : "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                          {overdue ? "⚠️" : "📅"} {formatDate(task.dueDate)}{overdue && " — Overdue"}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="delete-btn" onClick={() => deleteTask(task.id)} title="Delete task">✕</button>
                </div>
              );
            })}
          </div>
        )}

        {counts.done > 0 && (
          <div style={{ marginTop: "20px", textAlign: "right" }}>
            <button
              onClick={async () => {
                const done = tasks.filter(t => t.completed);
                await Promise.allSettled(done.map(t => api.delete(`/tasks/${t.id}`)));
                setTasks(p => p.filter(t => !t.completed));
                showSuccess("Completed tasks cleared!");
              }}
              style={clearDoneBtn}
            >
              🗑 Clear {counts.done} completed {counts.done === 1 ? "task" : "tasks"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle    = { padding: "24px 20px 48px", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f8fafc" };
const container    = { maxWidth: "800px", margin: "0 auto" };
const headerRow    = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "22px" };
const titleStyle   = { fontSize: "32px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.6px" };
const subtitleStyle = { color: "#64748b", fontSize: "15px", margin: 0 };
const statsRow     = { display: "flex", gap: "10px", alignItems: "center" };
const statPill     = { background: "white", border: "1.5px solid #e2e8f0", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "baseline", boxShadow: "0 2px 6px rgba(15,23,42,0.05)", fontFamily: "'DM Mono', monospace", fontSize: "18px" };
const formCard     = { background: "white", borderRadius: "18px", padding: "20px", border: "1.5px solid #e2e8f0", boxShadow: "0 4px 16px rgba(15,23,42,0.07)", marginBottom: "18px" };
const inputStyle   = { padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "14px", background: "#f8fafc", color: "#0f172a", fontFamily: "'DM Sans', sans-serif", width: "100%", boxSizing: "border-box" };
const addBtnStyle  = { padding: "11px 22px", borderRadius: "10px", border: "none", background: "#2563eb", color: "white", fontWeight: "700", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 12px rgba(37,99,235,0.25)" };
const filtersRow   = { display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" };
const emptyState   = { textAlign: "center", padding: "50px 20px", background: "white", borderRadius: "16px", border: "1.5px solid #e2e8f0" };
const clearDoneBtn = { background: "none", border: "1.5px solid #fecaca", color: "#dc2626", padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" };

export default TasksPage;