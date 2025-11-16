import { useEffect, useState } from "react";
import api from "../../lib/axios";

export default function AdminScheduleBorrow() {
  const [schedules, setSchedules] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await api.get("/admin/schedules");
        setSchedules(res.data || []);
      } catch (err) {
        setError("Không tải được lịch đặt mượn.", err);
      }
    };
    fetchSchedules();
  }, []);

  if (error) {
    return <p style={{ color: "red", padding: "16px" }}>{error}</p>;
  }

  return (
    <div style={{ padding: "16px" }}>
      <h2>Schedule Borrow</h2>
      {schedules.length === 0 ? (
        <p>No scheduled borrows.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
          <thead>
            <tr>
              <th align="left">Reader</th>
              <th align="left">Book</th>
              <th align="left">Scheduled date</th>
              <th align="left">Status</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id}>
                <td>{s.readerName}</td>
                <td>{s.bookTitle}</td>
                <td>{s.scheduleDate?.slice(0, 10)}</td>
                <td>{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
