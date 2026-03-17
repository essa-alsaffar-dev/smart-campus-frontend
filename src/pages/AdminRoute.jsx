import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const auth     = localStorage.getItem("adminAuth");
  const authTime = parseInt(localStorage.getItem("adminAuthTime") || "0", 10);
  const SESSION_HOURS = 8; // session expires after 8 hours
  const expired = Date.now() - authTime > SESSION_HOURS * 60 * 60 * 1000;

  if (!auth || expired) {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("adminAuthTime");
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}