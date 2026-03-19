import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API = "https://smart-campus-backend-production-bf5e.up.railway.app";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);

  // تنظيف أي جلسة قديمة
  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);

    clearSession();

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email: email.toLowerCase().trim(),
        password,
      });

      const data = response.data;

      // أهم شرط: لازم token + name
      if (!data?.token || !data?.name) {
        clearSession();
        setError("Incorrect email or password. Please try again.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.name);
      localStorage.setItem("userRole", data.role || "");
      localStorage.setItem("userEmail", data.email || email.toLowerCase().trim());

      navigate("/dashboard");

    } catch (err) {
      clearSession();
      setError(
        err?.response?.data?.message ||
        "Incorrect email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div style={page} className="sc-login-page">

      {/* Left Panel (يختفي بالجوال تلقائياً) */}
      <div style={leftPanel} className="left-panel">
        <div style={leftContent}>
          <h2 style={leftTitle}>Smart Campus</h2>
          <p style={leftSub}>
            Your all-in-one university system
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div style={rightPanel}>
        <div style={card}>

          <Link to="/" style={backLink}>← Back</Link>

          <h1 style={cardTitle}>Welcome back</h1>

          {error && <div style={errorBox}>{error}</div>}

          {/* Email */}
          <input
            style={input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* Password */}
          <div style={{ position: "relative" }}>
            <input
              style={input}
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={() => setShowPass(!showPass)}
              style={eyeBtn}
              type="button"
            >
              {showPass ? "🙈" : "👁"}
            </button>
          </div>

          {/* Button */}
          <button style={btn} onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p style={footer}>
            Don’t have an account?{" "}
            <Link to="/register">Register</Link>
          </p>

        </div>
      </div>

    </div>
  );
}

/* ================== STYLES ================== */

const page = {
  display: "flex",
  minHeight: "100vh",
  flexWrap: "wrap",
};

const leftPanel = {
  flex: 1,
  minWidth: "300px",
  background: "#1e293b",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const leftContent = {
  padding: "40px",
  textAlign: "center",
};

const leftTitle = {
  fontSize: "28px",
};

const leftSub = {
  opacity: 0.7,
};

const rightPanel = {
  flex: 1,
  minWidth: "300px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "20px",
  background: "#f8fafc",
};

const card = {
  width: "100%",
  maxWidth: "400px",
  background: "white",
  padding: "30px",
  borderRadius: "16px",
  boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
};

const cardTitle = {
  marginBottom: "20px",
};

const input = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "8px",
  border: "1px solid #ddd",
};

const btn = {
  width: "100%",
  padding: "12px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const errorBox = {
  background: "#fee2e2",
  color: "#dc2626",
  padding: "10px",
  marginBottom: "15px",
  borderRadius: "8px",
};

const footer = {
  marginTop: "15px",
  textAlign: "center",
};

const backLink = {
  display: "block",
  marginBottom: "15px",
};

const eyeBtn = {
  position: "absolute",
  right: "10px",
  top: "10px",
  background: "none",
  border: "none",
  cursor: "pointer",
};