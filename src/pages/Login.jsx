import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";
import styles from "./Login.module.css";

export default function Login() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", { email, password });

      if (!data.token) {
        setError(data.message || "Incorrect email or password.");
        return;
      }

      localStorage.setItem("token",     data.token);
      localStorage.setItem("userName",  data.name);
      localStorage.setItem("userRole",  data.role);
      localStorage.setItem("userEmail", email.toLowerCase().trim());

      const emails = JSON.parse(localStorage.getItem("registeredEmails") || "[]");
      if (!emails.includes(email.toLowerCase().trim())) {
        localStorage.setItem(
          "registeredEmails",
          JSON.stringify([...emails, email.toLowerCase().trim()])
        );
      }

      navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err.message ||
        "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
        <div className={styles.gridDots} />

        <div className={styles.leftContent}>
          <div className={styles.brand}>
            <div className={styles.brandLogo}>SC</div>
            <span className={styles.brandName}>Smart Campus</span>
          </div>

          <h1 className={styles.headline}>
            Your campus,<br />
            <span className={styles.headlineItalic}>reimagined.</span>
          </h1>
          <p className={styles.subheadline}>
            One portal for schedules, tasks, real-time parking, and classroom finder — built for IAU students.
          </p>

          <div className={styles.featureList}>
            {[
              { icon: "🗓", title: "Weekly Schedule",  desc: "All your classes in one view" },
              { icon: "✓",  title: "Task Manager",     desc: "Deadlines & exam reminders" },
              { icon: "🅿",  title: "Live Parking",     desc: "Real-time spot availability" },
              { icon: "⌂",  title: "Classroom Finder", desc: "170+ rooms — Building A11" },
            ].map((f) => (
              <div key={f.title} className={styles.featureItem}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <div>
                  <div className={styles.featureTitle}>{f.title}</div>
                  <div className={styles.featureDesc}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.card}>
          <Link to="/" className={styles.backLink}>← Back to Home</Link>

          <div className={styles.cardHeader}>
            <div className={styles.cardLogo}>SC</div>
            <h1 className={styles.cardTitle}>Welcome back</h1>
            <p className={styles.cardSubtitle}>Sign in to your Smart Campus account.</p>
          </div>

          {error && (
            <div className={`${styles.errorBox} ${styles.shake}`}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Email</label>
            <input
              className={`${styles.input} ${error ? styles.inputError : ""}`}
              type="email"
              placeholder="you@iau.edu.sa"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.passwordWrapper}>
              <input
                className={`${styles.input} ${styles.inputPadRight} ${error ? styles.inputError : ""}`}
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                autoComplete="current-password"
                disabled={loading}
              />
              <button className={styles.eyeBtn} onClick={() => setShowPass(!showPass)} type="button" tabIndex={-1}>
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div className={styles.forgotRow}>
            <Link to="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
          </div>

          <button className={styles.submitBtn} onClick={handleLogin} disabled={loading}>
            {loading ? <><span className={styles.spinner} />&nbsp; Signing in…</> : "Sign In →"}
          </button>

          <div className={styles.divider}>or</div>

          <p className={styles.registerText}>
            Don&apos;t have an account?{" "}
            <Link to="/register" className={styles.registerLink}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}