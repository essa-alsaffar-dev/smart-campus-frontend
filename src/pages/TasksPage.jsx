import { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";

const API = "https://smart-campus-backend-production-bf5e.up.railway.app";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [apiError, setApiError] = useState(false);
  const [toast, setToast] = useState("");

  const token = localStorage.getItem("token");

  const getHeaders = useCallback(() => {
    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2200);
  };

  const mapTask = (task) => ({
    id: task.id,
    title: task.title || "",
    description: task.description || "",
    priority: task.type || "Medium",
    dueDate: task.dueDate || "",
    completed: task.status === "COMPLETED",
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setApiError(false);

    try {
      const res = await axios.get(`${API}/tasks`, {
        headers: getHeaders(),
      });

      const mapped = Array.isArray(res.data) ? res.data.map(mapTask) : [];
      setTasks(mapped);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setTasks([]);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = async () => {
    if (!title.trim()) {
      showToast("Please enter a task title.");
      return;
    }

    setSaving(true);

    try {
      const res = await axios.post(
        `${API}/tasks`,
        {
          title: title.trim(),
          description: "",
          type: priority,
          dueDate: dueDate || null,
        },
        {
          headers: getHeaders(),
        }
      );

      setTasks((prev) => [mapTask(res.data), ...prev]);
      setTitle("");
      setPriority("Medium");
      setDueDate("");
      showToast("✅ Task added!");
    } catch (err) {
      console.error("Failed to add task:", err);
      showToast("❌ Failed to save task.");
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (task) => {
    if (task.completed) return;

    try {
      const res = await axios.patch(
        `${API}/tasks/${task.id}/complete`,
        {},
        {
          headers: getHeaders(),
        }
      );

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? mapTask(res.data) : t))
      );
      showToast("✅ Task completed!");
    } catch (err) {
      console.error("Failed to complete task:", err);
      showToast("❌ Failed to update task.");
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API}/tasks/${id}`, {
        headers: getHeaders(),
      });

      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast("🗑 Task deleted.");
    } catch (err) {
      console.error("Failed to delete task:", err);
      showToast("❌ Failed to delete task.");
    }
  };

  const clearDone = async () => {
    const doneTasks = tasks.filter((t) => t.completed);

    if (!doneTasks.length) {
      showToast("No completed tasks to clear.");
      return;
    }

    try {
      await Promise.all(
        doneTasks.map((t) =>
          axios.delete(`${API}/tasks/${t.id}`, {
            headers: getHeaders(),
          })
        )
      );

      setTasks((prev) => prev.filter((t) => !t.completed));
      showToast("🗑 Completed tasks cleared!");
    } catch (err) {
      console.error("Failed to clear completed tasks:", err);
      showToast("❌ Failed to clear completed tasks.");
    }
  };

  const filteredTasks = useMemo(() => {
    if (filter === "completed") return tasks.filter((t) => t.completed);
    if (filter === "active") return tasks.filter((t) => !t.completed);
    return tasks;
  }, [tasks, filter]);

  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = totalTasks - completedCount;

  return (
    <div style={page}>
      <div style={container}>
        <div style={headerRow}>
          <div>
            <h1 style={titleStyle}>Tasks</h1>
            <p style={subTitle}>Manage your tasks and keep them synced everywhere.</p>
          </div>

          <button style={refreshBtn} onClick={loadTasks}>
            ⟳ Refresh
          </button>
        </div>

        {toast && <div style={toastStyle}>{toast}</div>}

        {apiError && (
          <div style={errorBox}>
            Could not load tasks from the server. Please try again.
          </div>
        )}

        <div style={statsRow}>
          <div style={statCard}>
            <div style={statNumber}>{totalTasks}</div>
            <div style={statLabel}>Total</div>
          </div>
          <div style={statCard}>
            <div style={statNumber}>{activeCount}</div>
            <div style={statLabel}>Active</div>
          </div>
          <div style={statCard}>
            <div style={statNumber}>{completedCount}</div>
            <div style={statLabel}>Completed</div>
          </div>
        </div>

        <div style={formCard}>
          <h3 style={sectionTitle}>Add New Task</h3>

          <input
            style={input}
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div style={row}>
            <select
              style={input}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <input
              style={input}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <button style={primaryBtn} onClick={addTask} disabled={saving}>
            {saving ? "Saving..." : "Add Task"}
          </button>
        </div>

        <div style={toolbar}>
          <div style={filters}>
            <button
              style={filter === "all" ? activeFilterBtn : filterBtn}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              style={filter === "active" ? activeFilterBtn : filterBtn}
              onClick={() => setFilter("active")}
            >
              Active
            </button>
            <button
              style={filter === "completed" ? activeFilterBtn : filterBtn}
              onClick={() => setFilter("completed")}
            >
              Completed
            </button>
          </div>

          <button style={dangerBtn} onClick={clearDone}>
            Clear Completed
          </button>
        </div>

        <div style={listCard}>
          <h3 style={sectionTitle}>Your Tasks</h3>

          {loading ? (
            <div style={emptyState}>Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div style={emptyState}>No tasks found.</div>
          ) : (
            <div style={taskList}>
              {filteredTasks.map((task) => (
                <div key={task.id} style={taskItem}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        ...taskTitle,
                        textDecoration: task.completed ? "line-through" : "none",
                        opacity: task.completed ? 0.65 : 1,
                      }}
                    >
                      {task.title}
                    </div>

                    <div style={taskMeta}>
                      <span style={priorityBadge(task.priority)}>
                        {task.priority}
                      </span>
                      {task.dueDate && <span>📅 {task.dueDate}</span>}
                    </div>
                  </div>

                  <div style={actions}>
                    {!task.completed && (
                      <button
                        style={completeBtn}
                        onClick={() => toggleComplete(task)}
                      >
                        Complete
                      </button>
                    )}

                    <button
                      style={deleteBtn}
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================== styles ================== */

const page = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "20px",
};

const container = {
  width: "100%",
  maxWidth: "1000px",
  margin: "0 auto",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const titleStyle = {
  margin: 0,
  fontSize: "30px",
  color: "#0f172a",
};

const subTitle = {
  marginTop: "6px",
  color: "#64748b",
};

const refreshBtn = {
  border: "1px solid #cbd5e1",
  background: "white",
  borderRadius: "10px",
  padding: "10px 14px",
  cursor: "pointer",
};

const toastStyle = {
  background: "#dcfce7",
  color: "#166534",
  border: "1px solid #86efac",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "16px",
};

const errorBox = {
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fca5a5",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "16px",
};

const statsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
  marginBottom: "20px",
};

const statCard = {
  background: "white",
  borderRadius: "14px",
  padding: "18px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const statNumber = {
  fontSize: "28px",
  fontWeight: "800",
  color: "#2563eb",
};

const statLabel = {
  color: "#64748b",
  marginTop: "4px",
};

const formCard = {
  background: "white",
  borderRadius: "14px",
  padding: "18px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  marginBottom: "20px",
};

const sectionTitle = {
  marginTop: 0,
  color: "#0f172a",
};

const input = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #dbe2ea",
  marginBottom: "12px",
  fontSize: "14px",
};

const row = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const primaryBtn = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  cursor: "pointer",
  fontWeight: "700",
};

const toolbar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

const filters = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const filterBtn = {
  background: "white",
  border: "1px solid #cbd5e1",
  borderRadius: "999px",
  padding: "8px 14px",
  cursor: "pointer",
};

const activeFilterBtn = {
  ...filterBtn,
  background: "#2563eb",
  color: "white",
  border: "1px solid #2563eb",
};

const dangerBtn = {
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  cursor: "pointer",
};

const listCard = {
  background: "white",
  borderRadius: "14px",
  padding: "18px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const emptyState = {
  padding: "30px 10px",
  textAlign: "center",
  color: "#64748b",
};

const taskList = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const taskItem = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  padding: "14px",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  flexWrap: "wrap",
};

const taskTitle = {
  fontWeight: "700",
  color: "#0f172a",
  marginBottom: "8px",
};

const taskMeta = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  flexWrap: "wrap",
  color: "#64748b",
  fontSize: "13px",
};

const priorityBadge = (priority) => ({
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "700",
  background:
    priority === "High"
      ? "#fee2e2"
      : priority === "Medium"
      ? "#fef3c7"
      : "#dcfce7",
  color:
    priority === "High"
      ? "#b91c1c"
      : priority === "Medium"
      ? "#92400e"
      : "#166534",
});

const actions = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const completeBtn = {
  background: "#10b981",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "9px 12px",
  cursor: "pointer",
};

const deleteBtn = {
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "9px 12px",
  cursor: "pointer",
};