import { useEffect, useState } from "react";
import api from "../../lib/axios";
import Header from "../../components/Header";
import SideBar from "../../components/SideBar";

const ROLE_OPTIONS = ["LIBRARIAN", "ACCOUNTANT", "READER"];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [formMode, setFormMode] = useState("create"); // "create" | "edit"
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "LIBRARIAN",
    phone: "",
    password: "",
  });

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const resetForm = () => {
    setFormMode("create");
    setSelectedUserId(null);
    setFormData({
      name: "",
      email: "",
      role: "LIBRARIAN",
      phone: "",
      password: "",
    });
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchChange = (e) => setSearch(e.target.value);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (formMode === "create") {
        if (!formData.password) {
          setError("Vui lòng nhập mật khẩu cho tài khoản mới.");
          return;
        }

        await api.post("/admin/users", {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
          password: formData.password,
        });
      } else if (formMode === "edit" && selectedUserId) {
        await api.put(`/admin/users/${selectedUserId}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
        });
      }

      resetForm();
      fetchUsers();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        (formMode === "create"
          ? "Không tạo được tài khoản."
          : "Không cập nhật được tài khoản.");
      setError(msg);
    }
  };

  const handleEdit = (user) => {
    setFormMode("edit");
    setSelectedUserId(user.id);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "LIBRARIAN",
      phone: user.phone || "",
      password: "",
    });
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Xóa tài khoản này? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      if (selectedUserId === userId) resetForm();
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError("Không xóa được tài khoản.");
    }
  };

  const openPasswordModal = (userId) => {
    setSelectedUserId(userId);
    setNewPassword("");
    setPasswordModalOpen(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }

    setPasswordLoading(true);
    setError("");

    try {
      await api.patch(`/admin/users/${selectedUserId}/password`, {
        newPassword,
      });
      setPasswordModalOpen(false);
      setNewPassword("");
    } catch (err) {
      console.error(err);
      setError("Không đổi được mật khẩu.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    return (
      (u.name || "").toLowerCase().includes(keyword) ||
      (u.email || "").toLowerCase().includes(keyword) ||
      (u.role || "").toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="appMain">
      <Header />
      <div className="mainContentWrapper">
        <SideBar />
        <div className="mainContainer">
          <h2 className="admin-title">User Management</h2>

          {/* TOP BAR: Search + Form tạo / sửa tài khoản */}
          <div className="admin-topbar admin-users-topbar">
            <input
              type="text"
              className="admin-search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name, email, or role"
            />

            <form className="admin-add-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full name"
                required
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
              />
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone"
              />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {formMode === "create" && (
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                />
              )}

              <button className="admin-btn-add" type="submit">
                {formMode === "create" ? "Add User" : "Save changes"}
              </button>

              {formMode === "edit" && (
                <button
                  type="button"
                  className="admin-btn-cancel"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </form>
          </div>

          {error && <p className="admin-error">{error}</p>}

          {loading ? (
            <p>Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th align="left">ID</th>
                    <th align="left">Name</th>
                    <th align="left">Email</th>
                    <th align="left">Role</th>
                    <th align="left">Phone</th>
                    <th align="left">Created at</th>
                    <th align="left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{u.phone || "-"}</td>
                      <td>
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>
                        <div className="admin-user-actions">
                          <button
                            type="button"
                            className="admin-btn-small"
                            onClick={() => handleEdit(u)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-btn-small admin-btn-warning"
                            onClick={() => openPasswordModal(u.id)}
                          >
                            Change password
                          </button>
                          <button
                            type="button"
                            className="admin-btn-small admin-btn-danger"
                            onClick={() => handleDelete(u.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* MODAL đổi mật khẩu */}
          {passwordModalOpen && (
            <div className="modal-backdrop">
              <div className="modal">
                <h3>
                  Change password for user ID 
                  <span className="highlight-id"> {selectedUserId}</span>
                </h3>
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={handleChangePassword}>
                  <div className="form-group">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="New password"
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? "Saving..." : "Save password"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setPasswordModalOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
