import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/ADMIN/Dashboard.jsx";
import ReaderDashboard from "./pages/READER/ReaderDashboard.jsx"; 

import useAuthStore from "./store/useAuthStore.js"; 
import AdminBorrowHistory from "./pages/ADMIN/AdminBorrowHistory.jsx";
import AdminBrowseBooks from "./pages/ADMIN/AdminBrowseBooks.jsx";
import AdminScheduleBorrow from "./pages/ADMIN/AdminScheduleBorrow.jsx";
import AdminUsers from "./pages/ADMIN/AdminUsers.jsx";


function ProtectedRoute({ children, allowRoles }) {
  const user = useAuthStore((state) => state.user);

  if (!user) return <Navigate to="/login" replace />;

  if (allowRoles && allowRoles.length > 0) {
    const role = user.role?.toLowerCase();
    const allowed = allowRoles.map((r) => r.toLowerCase()).includes(role);
    if (!allowed) {
      const fallback =
        role === "admin"
          ? "/admin"
          : role === "librarian"
          ? "/lib/borrow-return"
          : role === "accountant"
          ? "/acc/fees"
          : role === "reader"
          ? "/reader"
          : "/";
      return <Navigate to={fallback} replace />;
    }
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/reader/dashboard" element={<ReaderDashboard />} />
        <Route path="/admin/books" element={<AdminBrowseBooks />} />
        <Route path="/admin/borrow-history" element={<AdminBorrowHistory />} />
        <Route path="/admin/schedule-borrow" element={<AdminScheduleBorrow />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
