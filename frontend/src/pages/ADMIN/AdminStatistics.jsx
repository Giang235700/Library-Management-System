import { useEffect, useState } from "react";
import api from "../../lib/axios";
import Header from "../../components/Header";
import SideBar from "../../components/SideBar";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function AdminStatistics() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStatistics = async (selectedYear) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/statistics", {
        params: { year: selectedYear },
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics(year);
  }, [year]);

  const handleYearChange = (e) => {
    setYear(Number(e.target.value));
  };

  if (loading) {
    return (
      <div className="mainContent">
        <p>Loading statistics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="mainContent">
        <p>{error || "No statistics available."}</p>
      </div>
    );
  }

  // ===================== DATA =====================
  // Lấy dữ liệu readers theo tháng, fallback sang borrowingsByMonth nếu backend chưa đổi
  const rawReadersByMonth =
    stats.readersByMonth ?? stats.borrowingsByMonth ?? [];

  const genreDistribution = stats.genreDistribution ?? [];
  const mostBorrowedBooks = stats.mostBorrowedBooks ?? [];

  const monthName = (key) => {
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en", {
      month: "short",
    });
  };

  const borrowingLabels = rawReadersByMonth.map((item) => monthName(item.month));
  const borrowingCounts = rawReadersByMonth.map((item) => item.count);

  // ========== BAR CHART COLORS ==========
  const borrowingChartData = {
    labels: borrowingLabels,
    datasets: [
      {
        label: `New readers in ${year}`,
        data: borrowingCounts,
        backgroundColor: "rgba(59, 130, 246, 0.65)",
        borderColor: "rgba(37, 99, 235, 1)",
        borderWidth: 2,
        borderRadius: 8,
        maxBarThickness: 32,
      },
    ],
  };

  const borrowingChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: "#374151" },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: "#374151" },
        grid: { color: "rgba(209, 213, 219, 0.4)" },
      },
    },
    plugins: {
      legend: {
        labels: { color: "#374151" },
      },
    },
  };

  // ========== DOUGHNUT CHART COLORS ==========
  const genreLabels = genreDistribution.map((g) => g.genre);
  const genreCounts = genreDistribution.map((g) => g.count);

  const genreColors = [
    "#60a5fa",
    "#34d399",
    "#fbbf24",
    "#f87171",
    "#a78bfa",
    "#2dd4bf",
    "#fb923c",
    "#93c5fd",
    "#4ade80",
    "#cbd5e1",
  ];

  const genreChartData = {
    labels: genreLabels,
    datasets: [
      {
        data: genreCounts,
        backgroundColor: genreColors.slice(0, genreCounts.length),
        borderColor: "#ffffff",
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const genreChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#374151",
          boxWidth: 14,
          padding: 10,
        },
      },
    },
  };

  return (
    <div className="appMain">
      <Header />

      <div className="mainContentWrapper">
        <SideBar />

        <div className="admin-stats-page">
          {/* TITLE */}
          <div className="admin-stats-header">
            <div>
              <h2 className="admin-stats-title">Library Statistics</h2>
              <p className="admin-stats-subtitle">
                Detailed usage statistics and trends for your library system.
              </p>
            </div>

            <div className="admin-stats-filters">
              <label className="admin-stats-filter-label">
                Year
                <select
                  value={year}
                  onChange={handleYearChange}
                  className="admin-stats-select"
                >
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </label>
            </div>
          </div>

          {/* GRID */}
          <div className="admin-stats-grid">
            {/* --- BAR CHART --- */}
            <section className="admin-stats-card admin-stats-card-large">
              <div className="admin-stats-card-header">
                <h3>New readers per month</h3>
                <span className="admin-stats-tag">Year {year}</span>
              </div>
              <div className="admin-stats-chart-wrapper">
                {borrowingCounts.length > 0 ? (
                  <Bar
                    data={borrowingChartData}
                    options={borrowingChartOptions}
                  />
                ) : (
                  <p className="admin-stats-message">
                    No reader data available.
                  </p>
                )}
              </div>
            </section>

            {/* --- DOUGHNUT CHART --- */}
            <section className="admin-stats-card admin-stats-card-medium">
              <div className="admin-stats-card-header">
                <h3>Books by genre</h3>
                <span className="admin-stats-tag">Current catalog</span>
              </div>
              <div className="admin-stats-chart-wrapper admin-stats-chart-center">
                {genreCounts.length > 0 ? (
                  <Doughnut
                    data={genreChartData}
                    options={genreChartOptions}
                  />
                ) : (
                  <p className="admin-stats-message">No genre data.</p>
                )}
              </div>
            </section>

            {/* --- MOST BORROWED --- */}
            <section className="admin-stats-card admin-stats-card-full">
              <div className="admin-stats-card-header">
                <h3>Most borrowed books</h3>
                <span className="admin-stats-tag">Top titles</span>
              </div>

              <div className="admin-stats-table-wrapper">
                <table className="admin-stats-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Borrow count</th>
                    </tr>
                  </thead>

                  <tbody>
                    {mostBorrowedBooks.map((b, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{b.title}</td>
                        <td>{b.author}</td>
                        <td>{b.borrowCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
