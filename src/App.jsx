import { Routes, Route } from "react-router-dom";
import Home             from "./pages/Home";
import Login            from "./pages/Login";
import Register         from "./pages/Register";
import Dashboard        from "./pages/Dashboard";
import ProtectedRoute   from "./pages/ProtectedRoute";
import AdminRoute       from "./pages/AdminRoute";
import AdminLogin       from "./pages/AdminLogin";
import AdminLayout      from "./pages/AdminLayout";
import Layout           from "./pages/Layout";
import TasksPage        from "./pages/TasksPage";
import SchedulePage     from "./pages/SchedulePage";
import ParkingPage      from "./pages/ParkingPage";
import ClassroomsPage   from "./pages/ClassroomsPage";
import AdminParkingPage from "./pages/AdminParkingPage";
import ProfilePage      from "./pages/ProfilePage";
import AboutPage       from "./pages/AboutPage";
import ForgotPassword  from "./pages/ForgotPassword";

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"            element={<Home />}       />
      <Route path="/login"       element={<Login />}      />
      <Route path="/register"    element={<Register />}   />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/about"          element={<AboutPage />}      />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Student routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard"  element={<Dashboard />}     />
        <Route path="/tasks"      element={<TasksPage />}      />
        <Route path="/schedule"   element={<SchedulePage />}   />
        <Route path="/parking"    element={<ParkingPage />}    />
        <Route path="/classrooms" element={<ClassroomsPage />} />
        <Route path="/profile"    element={<ProfilePage />}    />
      </Route>

      {/* Admin routes */}
      <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route path="/admin/parking" element={<AdminParkingPage />} />
      </Route>
    </Routes>
  );
}

export default App;