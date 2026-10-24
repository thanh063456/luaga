"use client";
import { useEffect, useState, useCallback } from "react";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

interface JobPost {
  id: string;
  ten_cong_ty: string;
  vi_tri_tuyen: string;
  khu_vuc: string;
  mo_ta_cong_viec: string;
  yeu_cau: string;
  muc_luong: string;
  thong_tin_lien_he: string;
  ngay_dang: string;
  trang_thai_sync: string;
  createdAt: string;
  draftCount?: number;
}

interface JobTemplate {
  id: string;
  ten_cong_ty: string;
  vi_tri_tuyen: string;
  khu_vuc: string;
  mo_ta_cong_viec: string;
  yeu_cau: string;
  muc_luong: string;
  thong_tin_lien_he: string;
  updatedAt: string;
}

const KHU_VUC_OPTIONS = [
  "Hà Nội", "TP.HCM", "Đà Nẵng", "Cần Thơ", "Hải Phòng",
  "Bình Dương", "Đồng Nai", "Hưng Yên", "Bắc Ninh",
  "HCM và lân cận", "Hà Nội và lân cận", "Toàn quốc",
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [showEditTplModal, setShowEditTplModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<JobTemplate | null>(null);
  const [tplForm, setTplForm] = useState<Partial<JobTemplate>>({});
  const [savingTpl, setSavingTpl] = useState(false);
  const [activeTab, setActiveTab] = useState<"jobs" | "templates">("jobs");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();
  const { user: currentUser } = useAuth();
  const isManagerOrAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drafts");
      const drafts = await res.json();
      const jobMap = new Map<string, JobPost & { draftCount: number }>();
      for (const d of drafts) {
        if (!jobMap.has(d.job_post_id)) {
          jobMap.set(d.job_post_id, { ...d.job_post, draftCount: 0 });
        }
        jobMap.get(d.job_post_id)!.draftCount++;
      }
      setJobs(Array.from(jobMap.values()));
    } catch {
      addToast("Lỗi tải tin tuyển dụng", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(data);
    } catch {
      addToast("Lỗi tải danh sách bộ nhớ công việc", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (activeTab === "jobs") {
      fetchJobs();
    } else {
      fetchTemplates();
    }
  }, [activeTab, fetchJobs, fetchTemplates]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi");
      addToast(data.message, "success");
      fetchJobs();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Lỗi đồng bộ", "error");
    } finally {
      setSyncing(false);
    }
  };

  const openEditTemplate = (tpl: JobTemplate) => {
    setEditingTemplate(tpl);
    setTplForm({ ...tpl });
    setShowEditTplModal(true);
  };

  const handleSaveTemplateEdit = async () => {
    if (!editingTemplate) return;
    if (!tplForm.ten_cong_ty || !tplForm.vi_tri_tuyen || !tplForm.khu_vuc) {
      addToast("Tên công ty, vị trí tuyển và khu vực là bắt buộc.", "info");
      return;
    }
    setSavingTpl(true);
    try {
      const res = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ten_cong_ty: tplForm.ten_cong_ty,
          vi_tri_tuyen: tplForm.vi_tri_tuyen,
          khu_vuc: tplForm.khu_vuc,
          mo_ta_cong_viec: tplForm.mo_ta_cong_viec || "",
          yeu_cau: tplForm.yeu_cau || "",
          muc_luong: tplForm.muc_luong || "",
          thong_tin_lien_he: tplForm.thong_tin_lien_he || "",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lỗi lưu");
      }
      addToast("Đã cập nhật bộ nhớ công việc thành công!", "success");
      setShowEditTplModal(false);
      fetchTemplates();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Lỗi", "error");
    } finally {
      setSavingTpl(false);
    }
  };

  const handleDeleteTemplate = async (id: string, company: string, position: string) => {
    if (!confirm(`Bạn có muốn xóa bộ nhớ tuyển dụng của "${company} - ${position}" không? AI sẽ không tự điền tin này nữa.`)) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Lỗi");
      addToast("Đã xóa bộ nhớ thành công", "success");
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch {
      addToast("Không thể xóa bộ nhớ", "error");
    }
  };

  const handleDeleteJob = async (id: string, company: string, position: string) => {
    const title = company ? `[${company}] ${position}` : position;
    if (!confirm(`Bạn có chắc chắn muốn xóa tin tuyển dụng "${title}" và toàn bộ các bản nháp liên quan không?`)) return;
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Lỗi");
      addToast("Đã xóa tin tuyển dụng thành công", "success");
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch {
      addToast("Không thể xóa tin tuyển dụng", "error");
    }
  };

  const handleSaveToTemplate = async (job: JobPost) => {
    if (!job.ten_cong_ty) {
      addToast("Tin tuyển dụng cần có Tên công ty để lưu vào bộ nhớ AI đối chiếu sau này.", "info");
      return;
    }
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ten_cong_ty: job.ten_cong_ty,
          vi_tri_tuyen: job.vi_tri_tuyen,
          khu_vuc: job.khu_vuc,
          mo_ta_cong_viec: job.mo_ta_cong_viec || "",
          yeu_cau: job.yeu_cau || "",
          muc_luong: job.muc_luong || "",
          thong_tin_lien_he: job.thong_tin_lien_he || "",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lỗi lưu");
      }
      addToast(`Đã lưu thông tin tuyển dụng của "${job.ten_cong_ty}" vào bộ nhớ AI thành công!`, "success");
      fetchTemplates();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Lỗi lưu bộ nhớ", "error");
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>📋 Quản lý tin tuyển dụng</h1>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              Xem tin đã đồng bộ và quản lý bộ nhớ công việc đã lưu của AI
            </p>
          </div>
          {activeTab === "jobs" && isManagerOrAdmin && (
            <button className="btn btn-primary btn-lg" onClick={handleSync} disabled={syncing} id="btn-sync-jobs">
              {syncing ? <><span className="spinner" /> Đang đồng bộ...</> : "🔄 Đồng bộ Sheet"}
            </button>
          )}
        </div>

        {/* Tab selector */}
        <div style={{ display: "flex", gap: 12, marginTop: 24, borderBottom: "1px solid var(--border)", paddingBottom: 1 }}>
          <button
            onClick={() => setActiveTab("jobs")}
            style={{
              padding: "10px 16px",
              border: "none",
              background: "none",
              color: activeTab === "jobs" ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: activeTab === "jobs" ? 600 : 400,
              borderBottom: activeTab === "jobs" ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
              fontSize: 14,
              transition: "all 0.15s"
            }}
            id="tab-jobs"
          >
            📋 Tin tuyển dụng ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            style={{
              padding: "10px 16px",
              border: "none",
              background: "none",
              color: activeTab === "templates" ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: activeTab === "templates" ? 600 : 400,
              borderBottom: activeTab === "templates" ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
              fontSize: 14,
              transition: "all 0.15s"
            }}
            id="tab-templates"
          >
            🧠 Bộ nhớ đã lưu ({templates.length})
          </button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <span className="spinner spinner-lg" style={{ color: "var(--accent)" }} />
          </div>
        ) : activeTab === "jobs" ? (
          /* TAB 1: LIST OF SYNCED JOBS */
          jobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>Chưa có tin tuyển dụng</h3>
              <p>Đồng bộ dữ liệu từ Google Sheets hoặc nhập tay để bắt đầu</p>
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={handleSync} id="btn-sync-empty">
                🔄 Đồng bộ ngay
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {jobs.map((job) => (
                <div key={job.id} className="card">
                  <div
                    style={{ padding: "18px 24px", cursor: "pointer", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}
                    onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>
                          {job.ten_cong_ty ? `[${job.ten_cong_ty}] ` : ""}{job.vi_tri_tuyen}
                        </span>
                        <span className="badge badge-primary">📍 {job.khu_vuc}</span>
                        {job.muc_luong && <span className="badge" style={{ background: "var(--success-light)", color: "var(--success)" }}>💰 {job.muc_luong}</span>}
                        <span className={`badge badge-${job.trang_thai_sync === "processed" ? "posted" : "draft"}`}>
                          {job.trang_thai_sync === "processed" ? "✅ Đã xử lý" : "⏳ Chưa xử lý"}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        {job.ngay_dang && `📅 ${job.ngay_dang} · `}
                        {job.draftCount || 0} bản nháp được tạo
                      </div>
                    </div>
                    <span style={{ color: "var(--text-muted)", fontSize: 18 }}>{expandedJob === job.id ? "▲" : "▼"}</span>
                  </div>

                  {expandedJob === job.id && (
                    <div style={{ padding: "0 24px 20px", borderTop: "1px solid var(--border)" }}>
                      <div className="grid-2" style={{ marginTop: 16, gap: 12 }}>
                        {[
                          { label: "Tên công ty", value: job.ten_cong_ty },
                          { label: "Mô tả công việc", value: job.mo_ta_cong_viec },
                          { label: "Yêu cầu", value: job.yeu_cau },
                          { label: "Mức lương", value: job.muc_luong },
                          { label: "Thông tin liên hệ", value: job.thong_tin_lien_he },
                        ].map(field => field.value ? (
                          <div key={field.label}>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{field.label.toUpperCase()}</div>
                            <div style={{ fontSize: 14, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{field.value}</div>
                          </div>
                        ) : null)}
                      </div>

                      {/* Nút hành động xóa và lưu bộ nhớ */}
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20, paddingTop: 16, borderTop: "1px dashed var(--border)" }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveToTemplate(job);
                          }}
                          id={`btn-save-job-tpl-${job.id}`}
                        >
                          🧠 Lưu vào bộ nhớ AI
                        </button>
                        {isManagerOrAdmin && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteJob(job.id, job.ten_cong_ty, job.vi_tri_tuyen);
                            }}
                            id={`btn-delete-job-${job.id}`}
                          >
                            🗑 Xóa tin tuyển dụng
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* TAB 2: LIST OF SAVED AI TEMPLATES (MEMORY) */
          templates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧠</div>
              <h3>Trống bộ nhớ tuyển dụng</h3>
              <p>AI sẽ tự động ghi nhớ sau khi bạn phân tích tin tuyển dụng thủ công hoặc lưu tin mới.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8, background: "var(--accent-light)", padding: "10px 14px", borderRadius: 8 }}>
                💡 Đây là danh sách các công ty và vị trí tuyển dụng AI đã học thuộc. Khi bạn dán đoạn tin nhắn thô liên quan đến tên công ty này, AI sẽ tự động điền các thông tin (Mô tả, Lương, Yêu cầu, Liên hệ) tương ứng.
              </div>
              {templates.map((tpl) => (
                <div key={tpl.id} className="card">
                  <div
                    style={{ padding: "18px 24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}
                    onClick={() => setExpandedTemplate(expandedTemplate === tpl.id ? null : tpl.id)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 16, color: "var(--accent)" }}>
                          🏢 {tpl.ten_cong_ty}
                        </span>
                        <span style={{ fontSize: 16, color: "var(--text-primary)", fontWeight: 600 }}>
                          — {tpl.vi_tri_tuyen}
                        </span>
                        <span className="badge badge-primary">📍 {tpl.khu_vuc}</span>
                        {tpl.muc_luong && <span className="badge" style={{ background: "var(--success-light)", color: "var(--success)" }}>💰 {tpl.muc_luong}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Cập nhật lần cuối: {new Date(tpl.updatedAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isManagerOrAdmin && (
                        <>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", fontSize: 12 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditTemplate(tpl);
                            }}
                            id={`btn-edit-tpl-${tpl.id}`}
                          >
                            ✏️ Sửa bộ nhớ
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(tpl.id, tpl.ten_cong_ty, tpl.vi_tri_tuyen);
                            }}
                            id={`btn-delete-tpl-${tpl.id}`}
                          >
                            🗑 Xóa
                          </button>
                        </>
                      )}
                      <span style={{ color: "var(--text-muted)", fontSize: 18, marginLeft: 8 }}>{expandedTemplate === tpl.id ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {expandedTemplate === tpl.id && (
                    <div style={{ padding: "0 24px 20px", borderTop: "1px solid var(--border)" }}>
                      <div className="grid-2" style={{ marginTop: 16, gap: 12 }}>
                        {[
                          { label: "Mô tả công việc", value: tpl.mo_ta_cong_viec },
                          { label: "Yêu cầu tuyển dụng", value: tpl.yeu_cau },
                          { label: "Mức lương", value: tpl.muc_luong },
                          { label: "Thông tin liên hệ", value: tpl.thong_tin_lien_he },
                        ].map(field => field.value ? (
                          <div key={field.label}>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{field.label.toUpperCase()}</div>
                            <div style={{ fontSize: 14, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{field.value}</div>
                          </div>
                        ) : null)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modal sửa bộ nhớ */}
      {showEditTplModal && editingTemplate && (
        <div className="modal-overlay" onClick={() => setShowEditTplModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                ✏️ Chỉnh sửa bộ nhớ AI
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEditTplModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="grid-2" style={{ gap: 12 }}>
                <div>
                  <label className="form-label">Tên công ty *</label>
                  <input className="form-input" value={tplForm.ten_cong_ty || ""} onChange={e => setTplForm(p => ({ ...p, ten_cong_ty: e.target.value }))} id="input-tpl-company" />
                </div>
                <div>
                  <label className="form-label">Vị trí tuyển dụng *</label>
                  <input className="form-input" value={tplForm.vi_tri_tuyen || ""} onChange={e => setTplForm(p => ({ ...p, vi_tri_tuyen: e.target.value }))} id="input-tpl-position" />
                </div>
              </div>
              <div>
                <label className="form-label">Khu vực *</label>
                <select
                  className="form-select"
                  value={tplForm.khu_vuc && KHU_VUC_OPTIONS.includes(tplForm.khu_vuc) ? tplForm.khu_vuc : (tplForm.khu_vuc ? "Khác" : "")}
                  onChange={e => {
                    const val = e.target.value;
                    setTplForm(p => ({ ...p, khu_vuc: val === "Khác" ? "" : val }));
                  }}
                  id="select-tpl-khu-vuc"
                >
                  <option value="">-- Chọn khu vực --</option>
                  {KHU_VUC_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                  <option value="Khác">Khác</option>
                </select>
                {(!tplForm.khu_vuc || !KHU_VUC_OPTIONS.includes(tplForm.khu_vuc)) && (
                  <input
                    className="form-input"
                    style={{ marginTop: 8 }}
                    value={tplForm.khu_vuc || ""}
                    onChange={e => setTplForm(p => ({ ...p, khu_vuc: e.target.value }))}
                    placeholder="Nhập khu vực tự chọn (ví dụ: HCM và lân cận)"
                    id="input-tpl-khu-vuc-custom"
                  />
                )}
              </div>
              <div>
                <label className="form-label">Mô tả công việc</label>
                <textarea className="form-textarea" style={{ minHeight: 80 }} value={tplForm.mo_ta_cong_viec || ""} onChange={e => setTplForm(p => ({ ...p, mo_ta_cong_viec: e.target.value }))} id="input-tpl-mo-ta" />
              </div>
              <div>
                <label className="form-label">Yêu cầu tuyển dụng</label>
                <textarea className="form-textarea" style={{ minHeight: 80 }} value={tplForm.yeu_cau || ""} onChange={e => setTplForm(p => ({ ...p, yeu_cau: e.target.value }))} id="input-tpl-yeu-cau" />
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div>
                  <label className="form-label">Mức lương</label>
                  <input className="form-input" value={tplForm.muc_luong || ""} onChange={e => setTplForm(p => ({ ...p, muc_luong: e.target.value }))} id="input-tpl-luong" />
                </div>
                <div>
                  <label className="form-label">Thông tin liên hệ</label>
                  <input className="form-input" value={tplForm.thong_tin_lien_he || ""} onChange={e => setTplForm(p => ({ ...p, thong_tin_lien_he: e.target.value }))} id="input-tpl-lien-he" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditTplModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveTemplateEdit} disabled={savingTpl} id="btn-save-tpl-edit">
                {savingTpl ? <><span className="spinner" /> Đang lưu...</> : "💾 Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
