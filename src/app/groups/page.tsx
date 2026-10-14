"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

interface Group {
  id: string; ten_group: string; link_group: string; khu_vuc: string; ghi_chu: string; trang_thai: string;
}
const emptyGroup = (): Partial<Group> => ({ ten_group: "", link_group: "", khu_vuc: "", ghi_chu: "", trang_thai: "active" });

const KHU_VUC_OPTIONS = [
  "Hà Nội", "TP.HCM", "Đà Nẵng", "Cần Thơ", "Hải Phòng",
  "Bình Dương", "Đồng Nai", "Hưng Yên", "Bắc Ninh",
  "HCM và lân cận", "Hà Nội và lân cận", "Toàn quốc",
];

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterKhuVuc, setFilterKhuVuc] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [form, setForm] = useState<Partial<Group>>(emptyGroup());
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, addToast, removeToast } = useToast();

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterKhuVuc) params.set("khu_vuc", filterKhuVuc);
      if (filterTrangThai) params.set("trang_thai", filterTrangThai);
      const res = await fetch(`/api/groups?${params}`);
      setGroups(await res.json());
    } catch { addToast("Lỗi tải danh sách group", "error"); }
    finally { setLoading(false); }
  }, [filterKhuVuc, filterTrangThai, addToast]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const openAdd = () => { setEditing(null); setForm(emptyGroup()); setShowModal(true); };
  const openEdit = (g: Group) => { setEditing(g); setForm({ ...g }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.ten_group || !form.khu_vuc) { addToast("Vui lòng nhập tên group và khu vực", "error"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/groups/${editing.id}` : "/api/groups";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Lỗi lưu");
      addToast(editing ? "Đã cập nhật group" : "Đã thêm group mới", "success");
      setShowModal(false);
      fetchGroups();
    } catch { addToast("Lỗi lưu group", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa group "${name}"?`)) return;
    try {
      await fetch(`/api/groups/${id}`, { method: "DELETE" });
      addToast("Đã xóa group", "success");
      setGroups(prev => prev.filter(g => g.id !== id));
    } catch { addToast("Lỗi xóa group", "error"); }
  };

  const handleImportCSV = async (file: File) => {
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/groups/import", { method: "POST", body: fd });
      const data = await res.json();
      addToast(`Đã import ${data.created} group`, "success");
      fetchGroups();
    } catch { addToast("Lỗi import CSV", "error"); }
    finally { setImporting(false); }
  };

  const downloadTemplate = () => {
    const csv = "ten_group,link_group,khu_vuc,ghi_chu,trang_thai\nVí dụ Group HN,https://facebook.com/groups/xxx,Hà Nội,Hashtag bắt buộc: #tuyendung,active";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "groups_template.csv"; a.click();
  };

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>👥 Quản lý Group</h1>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              {groups.length} group · {groups.filter(g => g.trang_thai === "active").length} đang hoạt động
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={downloadTemplate} id="btn-download-template">📥 Tải template CSV</button>
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={importing} id="btn-import-csv">
              {importing ? <><span className="spinner" /> Importing...</> : "📤 Import CSV"}
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleImportCSV(e.target.files[0])} />
            <button className="btn btn-primary" onClick={openAdd} id="btn-add-group">+ Thêm Group</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <select className="form-select" style={{ width: 180 }} value={filterKhuVuc} onChange={e => setFilterKhuVuc(e.target.value)} id="filter-khu-vuc">
            <option value="">Tất cả khu vực</option>
            {KHU_VUC_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <select className="form-select" style={{ width: 160 }} value={filterTrangThai} onChange={e => setFilterTrangThai(e.target.value)} id="filter-trang-thai">
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Tắt</option>
          </select>
        </div>
      </div>

      <div className="page-body">
        {/* Drag-drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleImportCSV(f); }}
          style={{
            border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
            borderRadius: 12, padding: 20, textAlign: "center",
            color: dragOver ? "var(--accent)" : "var(--text-muted)",
            background: dragOver ? "var(--accent-light)" : "transparent",
            marginBottom: 24, transition: "all 0.2s", fontSize: 14,
          }}
        >
          {importing ? <><span className="spinner" /> Đang import...</> : "📂 Kéo thả file CSV vào đây để import hàng loạt"}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}><span className="spinner spinner-lg" style={{ color: "var(--accent)" }} /></div>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>Chưa có group nào</h3>
            <p>Thêm group thủ công hoặc import từ file CSV</p>
          </div>
        ) : (
          <div className="card table-container">
            <table>
              <thead>
                <tr>
                  <th>Tên Group</th>
                  <th>Khu vực</th>
                  <th>Ghi chú</th>
                  <th>Trạng thái</th>
                  <th style={{ width: 120 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(g => (
                  <tr key={g.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{g.ten_group}</div>
                      {g.link_group && (
                        <a href={g.link_group} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>🔗 Xem group</a>
                      )}
                    </td>
                    <td><span className="badge badge-primary">📍 {g.khu_vuc}</span></td>
                    <td style={{ maxWidth: 240 }}>
                      <div className="truncate text-sm text-secondary">{g.ghi_chu || "—"}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${g.trang_thai === "active" ? "active" : "inactive"}`}>
                        {g.trang_thai === "active" ? "● Hoạt động" : "○ Tắt"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(g)} id={`btn-edit-${g.id}`}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.id, g.ten_group)} id={`btn-delete-${g.id}`}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {editing ? "✏️ Sửa Group" : "➕ Thêm Group mới"}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="form-label">Tên Group *</label>
                <input className="form-input" value={form.ten_group || ""} onChange={e => setForm(p => ({ ...p, ten_group: e.target.value }))} placeholder="Ví dụ: Việc làm Hà Nội" id="input-ten-group" />
              </div>
              <div>
                <label className="form-label">Link Group</label>
                <input className="form-input" value={form.link_group || ""} onChange={e => setForm(p => ({ ...p, link_group: e.target.value }))} placeholder="https://facebook.com/groups/..." id="input-link-group" />
              </div>
              <div>
                <label className="form-label">Khu vực *</label>
                <select
                  className="form-select"
                  value={form.khu_vuc && KHU_VUC_OPTIONS.includes(form.khu_vuc) ? form.khu_vuc : (form.khu_vuc ? "Khác" : "")}
                  onChange={e => {
                    const val = e.target.value;
                    setForm(p => ({ ...p, khu_vuc: val === "Khác" ? "" : val }));
                  }}
                  id="select-khu-vuc"
                >
                  <option value="">-- Chọn khu vực --</option>
                  {KHU_VUC_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                  <option value="Khác">Khác</option>
                </select>
                {(!form.khu_vuc || !KHU_VUC_OPTIONS.includes(form.khu_vuc)) && (
                  <input
                    className="form-input"
                    style={{ marginTop: 8 }}
                    value={form.khu_vuc || ""}
                    onChange={e => setForm(p => ({ ...p, khu_vuc: e.target.value }))}
                    placeholder="Nhập khu vực tự chọn (ví dụ: HCM và lân cận)"
                    id="input-khu-vuc-custom"
                  />
                )}
              </div>
              <div>
                <label className="form-label">Ghi chú / Quy định Group</label>
                <textarea className="form-textarea" value={form.ghi_chu || ""} onChange={e => setForm(p => ({ ...p, ghi_chu: e.target.value }))} placeholder="Hashtag bắt buộc, phong cách viết, giới hạn ký tự..." id="input-ghi-chu" />
              </div>
              <div>
                <label className="form-label">Trạng thái</label>
                <select className="form-select" value={form.trang_thai || "active"} onChange={e => setForm(p => ({ ...p, trang_thai: e.target.value }))} id="select-trang-thai">
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Tắt</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="btn-save-group">
                {saving ? <><span className="spinner" /> Đang lưu...</> : "💾 Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
