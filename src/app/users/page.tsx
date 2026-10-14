"use client";
import { useEffect, useState, useCallback } from "react";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

interface Group {
  id: string;
  ten_group: string;
  khu_vuc: string;
}

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  trang_thai: string;
  createdAt: string;
  _count: {
    drafts: number;
    assignments: number;
  };
  assignments: {
    group: Group;
  }[];
}

const ROLES = [
  { value: "ADMIN", label: "Quản trị viên (Admin)", desc: "Toàn quyền hệ thống & cấu hình API" },
  { value: "MANAGER", label: "Trưởng nhóm (Team Lead)", desc: "Quản lý tuyển dụng, duyệt bài & phân nhóm" },
  { value: "RECRUITER", label: "Nhân viên Tuyển dụng", desc: "Soạn tin, dùng AI sinh bài theo nhóm được giao" },
  { value: "VIEWER", label: "Cộng tác viên / Chỉ xem", desc: "Chỉ xem danh sách bài viết & tin tuyển dụng" },
];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Form tạo user
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "RECRUITER",
    groupIds: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, gRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/groups"),
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (gRes.ok) setAllGroups(await gRes.json());
    } catch {
      addToast("Lỗi tải danh sách người dùng", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tạo tài khoản");

      addToast("Tạo tài khoản thành công!", "success");
      setShowCreateModal(false);
      setNewUser({ name: "", email: "", password: "", role: "RECRUITER", groupIds: [] });
      fetchUsers();
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserItem) => {
    const nextStatus = user.trang_thai === "active" ? "locked" : "active";
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trang_thai: nextStatus }),
      });
      if (!res.ok) throw new Error("Lỗi cập nhật");
      addToast(`Đã ${nextStatus === "active" ? "mở khóa" : "khóa"} tài khoản ${user.email}`, "success");
      fetchUsers();
    } catch {
      addToast("Lỗi cập nhật trạng thái", "error");
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản ${email}?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xóa");
      addToast("Đã xóa tài khoản", "success");
      fetchUsers();
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  const handleSaveAssignments = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupIds: selectedUser.assignments.map((a) => a.group.id) }),
      });
      if (!res.ok) throw new Error("Lỗi gán nhóm");
      addToast("Đã cập nhật phân công nhóm", "success");
      setShowAssignModal(false);
      fetchUsers();
    } catch {
      addToast("Lỗi cập nhật nhóm", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <span className="spinner spinner-lg" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>
              🛡️ Quản lý Tài khoản & Phân quyền (RBAC)
            </h1>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              Phân cấp Admin, Trưởng nhóm, Nhân viên tuyển dụng và CTV
            </p>
          </div>

          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              id="btn-add-user"
            >
              ➕ Thêm tài khoản mới
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Danh sách User */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", textAlign: "left", fontSize: 13 }}>
                  <th style={{ padding: "14px 18px" }}>Người dùng</th>
                  <th style={{ padding: "14px 18px" }}>Vai trò (Role)</th>
                  <th style={{ padding: "14px 18px" }}>Nhóm FB phụ trách</th>
                  <th style={{ padding: "14px 18px" }}>Bản nháp đã tạo</th>
                  <th style={{ padding: "14px 18px" }}>Trạng thái</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleObj = ROLES.find((r) => r.value === u.role) || ROLES[2];
                  return (
                    <tr key={u.id} style={{ borderTop: "1px solid var(--border)", fontSize: 13.5 }}>
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email}</div>
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            background:
                              u.role === "ADMIN"
                                ? "rgba(239, 68, 68, 0.15)"
                                : u.role === "MANAGER"
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(59, 130, 246, 0.15)",
                            color:
                              u.role === "ADMIN" ? "#f87171" : u.role === "MANAGER" ? "#fbbf24" : "#60a5fa",
                          }}
                        >
                          {roleObj.label}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        {u.role === "ADMIN" || u.role === "MANAGER" ? (
                          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Toàn quyền tất cả nhóm</span>
                        ) : u.assignments.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {u.assignments.slice(0, 3).map((a) => (
                              <span
                                key={a.group.id}
                                style={{
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  background: "rgba(255,255,255,0.06)",
                                  fontSize: 11,
                                }}
                              >
                                {a.group.ten_group}
                              </span>
                            ))}
                            {u.assignments.length > 3 && (
                              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                +{u.assignments.length - 3} nhóm
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Chưa gán nhóm</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 18px", fontWeight: 600 }}>{u._count.drafts}</td>
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            marginRight: 6,
                            background: u.trang_thai === "active" ? "#10b981" : "#ef4444",
                          }}
                        />
                        {u.trang_thai === "active" ? "Hoạt động" : "Bị khóa"}
                      </td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                          {isAdmin && u.role !== "ADMIN" && (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => {
                                setSelectedUser(u);
                                setShowAssignModal(true);
                              }}
                              title="Phân công nhóm Facebook"
                            >
                              👥 Gán nhóm
                            </button>
                          )}
                          {isAdmin && u.id !== currentUser?.id && (
                            <>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleToggleStatus(u)}
                                title={u.trang_thai === "active" ? "Khóa tài khoản" : "Mở khóa"}
                              >
                                {u.trang_thai === "active" ? "🔒 Khóa" : "🔓 Mở"}
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteUser(u.id, u.email)}
                              >
                                Xóa
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Tạo tài khoản mới */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 18 }}>➕ Thêm tài khoản mới</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Email đăng nhập
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="recruiter@fbjob.local"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Mật khẩu khởi tạo
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Ít nhất 6 ký tự"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Vai trò (Role)
                  </label>
                  <select
                    className="form-select"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Đang tạo..." : "Xác nhận tạo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Phân công nhóm Facebook */}
      {showAssignModal && selectedUser && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 18 }}>
                👥 Gán nhóm Facebook cho {selectedUser.name}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAssignModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: 380, overflowY: "auto" }}>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 0 }}>
                Chọn các nhóm Facebook mà nhân sự này được phép soạn bài và quản lý:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {allGroups.map((g) => {
                  const isChecked = selectedUser.assignments.some((a) => a.group.id === g.id);
                  return (
                    <label
                      key={g.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: isChecked ? "var(--accent-light)" : "rgba(255,255,255,0.02)",
                        border: "1px solid var(--border)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUser({
                              ...selectedUser,
                              assignments: [...selectedUser.assignments, { group: g }],
                            });
                          } else {
                            setSelectedUser({
                              ...selectedUser,
                              assignments: selectedUser.assignments.filter((a) => a.group.id !== g.id),
                            });
                          }
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{g.ten_group}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{g.khu_vuc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowAssignModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveAssignments}
                disabled={submitting}
              >
                {submitting ? "Đang lưu..." : "Lưu phân công"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
