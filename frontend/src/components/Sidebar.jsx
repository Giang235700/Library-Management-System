import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaBook,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaClipboardList,
  FaChartBar,
  FaUserCog
} from "react-icons/fa";
import authStore from "../store/useAuthStore";

export default function SideBar() {
  const location = useLocation();
  const { user } = authStore();
  const role = user?.role?.toLowerCase() || "admin";

  const adminMenu = [
    { icon: FaHome, label: "Dashboard", path: "/admin/dashboard" },
    { icon: FaUsers, label: "Staff Management", path: "/admin/staffs" },
    { icon: FaBook, label: "Book Management", path: "/admin/books" },
    { icon: FaClipboardList, label: "Reader Management", path: "/admin/readers" },
    { icon: FaChartBar, label: "Statistics", path: "/admin/statistics" },
  ];

  const librarianMenu = [
    { icon: FaHome, label: "Dashboard", path: "/lib/dashboard" },
    { icon: FaBook, label: "Book List", path: "/lib/books" },
    { icon: FaUsers, label: "Readers", path: "/lib/readers" },
    { icon: FaCalendarAlt, label: "Borrow & Return", path: "/lib/borrow-return" },
  ];

  const accountantMenu = [
    { icon: FaHome, label: "Dashboard", path: "/acc/dashboard" },
    { icon: FaMoneyBillWave, label: "Fees", path: "/acc/fees" },
    { icon: FaClipboardList, label: "Transaction History", path: "/acc/records" },
    { icon: FaChartBar, label: "Financial Report", path: "/acc/reports" },
  ];

  const readerMenu = [
    { icon: FaHome, label: "Home", path: "/reader" },
    { icon: FaBook, label: "Browse Books", path: "/reader/books" },
    { icon: FaClipboardList, label: "Borrow History", path: "/reader/borrows" },
    { icon: FaCalendarAlt, label: "Schedule Borrow", path: "/reader/schedule" },
    { icon: FaUserCog, label: "Profile", path: "/reader/profile" },
  ];

  const menuItems =
    role === "admin"
      ? adminMenu
      : role === "librarian"
      ? librarianMenu
      : role === "accountant"
      ? accountantMenu
      : readerMenu;

  return (
    <aside className="sidebar">
      <ul>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <li key={index}>
              <Link to={item.path} className={isActive ? "active" : ""}>
                <div className="menu-item">
                  <span className="icon">
                    <Icon size={20} />
                  </span>
                  <span className="label">{item.label}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
