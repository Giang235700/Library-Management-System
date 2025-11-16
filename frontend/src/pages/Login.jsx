import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/axios";
import { FaEnvelope, FaLock, FaSpinner } from "react-icons/fa";
import "./Login_Register.css";
import useAuthStore from "../store/useAuthStore.js";

export default function Login() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  const loginStore = useAuthStore((state) => state.login);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setError("");
    setLoading(true);

    try {
      const submitData = {
        ...data,
        email: data.email.trim().toLowerCase(),
      };

      const res = await api.post("/auth/login", submitData);

      const token = res.data.token;

      localStorage.setItem("token", token);

      loginStore({
        token,
        user: {
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
        },
      });

      const roleRoutes = {
        READER: "/reader/dashboard",
        LIBRARIAN: "/librarian/dashboard",
        ADMIN: "/admin/dashboard",
        ACCOUNTANT: "/accountant/dashboard",
      };

      const userRole = res.data.role;
      navigate(roleRoutes[userRole] || "/login");
    } catch (error) {
      setError(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Welcome Back</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="input-group">
            <FaEnvelope />
            <input
              type="email"
              placeholder="Email"
              {...register("email", { required: true })}
            />
          </div>

          <div className="input-group">
            <FaLock />
            <input
              type="password"
              placeholder="Password"
              {...register("password", { required: true })}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <FaSpinner className="spin" /> Logging in...
              </>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <p>
          Don't have an account? <Link to="/register">Register now</Link>
        </p>
      </div>
    </div>
  );
}
