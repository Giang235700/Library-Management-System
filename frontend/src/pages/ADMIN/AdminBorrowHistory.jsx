import { useEffect, useState } from "react";
import api from "../../lib/axios";

export default function AdminBorrowHistory() {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/admin/borrow-history");
        setRecords(res.data || []);
      } catch (err) {
        setError("Không tải được lịch sử mượn.", err);
      }
    };
    fetchHistory();
  }, []);

  if (error) {
    return <p style={{ color: "red", padding: "16px" }}>{error}</p>;
  }

  return (
    <div className="appMain">
      <Header />
      <div className="mainContentWrapper">
        <SideBar />
        <div style={{ padding: "16px" }}>
          <h2>Borrow History</h2>
          {records.length === 0 ? (
            <p>No borrow records.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
              <thead>
                <tr>
                  <th align="left">Reader</th>
                  <th align="left">Book</th>
                  <th align="left">Borrow date</th>
                  <th align="left">Due date</th>
                  <th align="left">Return date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>{r.readerName}</td>
                    <td>{r.bookTitle}</td>
                    <td>{r.borrowDate?.slice(0, 10)}</td>
                    <td>{r.dueDate?.slice(0, 10)}</td>
                    <td>{r.returnDate ? r.returnDate.slice(0, 10) : "Not returned"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
