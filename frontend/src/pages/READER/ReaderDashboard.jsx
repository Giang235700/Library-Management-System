import { useEffect, useState } from "react";
import api from "../../lib/axios";
import useAuthStore from "../../store/useAuthStore.js";

export default function ReaderDashboard() {
  const token = useAuthStore((state) => state.token);

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/dashboard/reader-overview", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (error) {
        setError("Failed to load profile", error);
      }
    };

    if (token) {
      fetchProfile();
    } else {
      setError("No token found. Please log in again.");
    }
  }, [token]);

  if (error) {
    return (
      <div className="dashboard-page">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="dashboard-page">
        <p>Loading...</p>
      </div>
    );
  }

  const rp = profile.readerProfile;

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <h2>Welcome, {profile.name}</h2>

        <div className="info-box">
          <h3>Your Information</h3>
          <p>
            <strong>Name:</strong> {profile.name}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>Role:</strong> {profile.role}
          </p>
          <p>
            <strong>Phone:</strong> {profile.phone || "N/A"}
          </p>
          <p>
            <strong>Address:</strong> {rp?.address || "N/A"}
          </p>
          <p>
            <strong>Gender:</strong> {rp?.gender || "N/A"}
          </p>
          <p>
            <strong>Date of birth:</strong> {rp?.dob?.slice(0, 10) || "N/A"}
          </p>
          <p>
            <strong>Registered on:</strong>{" "}
            {rp?.registrationDate?.slice(0, 10) || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
