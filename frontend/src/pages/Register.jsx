import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/axios";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaSpinner,
  FaVenusMars,
} from "react-icons/fa";
import "./Login_Register.css";

export default function Register() {
  const { register, handleSubmit, reset } = useForm();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setError("");
    setLoading(true);
    try {
      const submitData = {
        ...data,
        email: data.email.trim().toLowerCase(),
        dob: data.dob ? new Date(data.dob) : null
      };

      await api.post("/auth/register", submitData);

      alert("Registration successful! Please log in.");
      reset();
      navigate("/login");
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Create Reader Account</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="input-group">
            <FaUser />
            <input
              placeholder="Full name"
              {...register("name", { required: true })}
            />
          </div>

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
              {...register("password", { required: true, minLength: 6 })}
            />
          </div>

          <div className="input-group">
            <FaPhone />
            <input placeholder="Phone number" {...register("phone")} />
          </div>

          <div className="two-fields">
            <div className="input-group">
              <FaVenusMars />
              <select {...register("gender", { required: true })}>
                <option value="">Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="input-group">
              <input
                type="date"
                {...register("dob")}
              />
            </div>

          </div>

          <div className="input-group">
            <FaMapMarkerAlt />
            <input
              placeholder="Address"
              {...register("address", { required: true })}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <FaSpinner className="spin" /> Registering...
              </>
            ) : (
              "Register"
            )}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
