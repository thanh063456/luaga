"use client";
import { useEffect, useState, useCallback } from "react";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import BannerGeneratorModal from "@/components/BannerGeneratorModal";

interface Group {
  id: string;
  ten_group: string;
  link_group: string;
  khu_vuc: string;
  ghi_chu: string;
  trang_thai: string;
}

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
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface PostDraft {
  id: string;
  job_post_id: string;
  group_id: string;
  noi_dung_ai_viet: string;
  trang_thai: string; // "draft", "copied", "posted"
  trang_thai_duyet: string; // "pending", "approved", "rejected"
  duyet_boi?: string;
  tone: string;
  thoi_gian_tao: string;
  group: Group;
  job_post: JobPost;
  user?: UserInfo;
}

const TONES = [
  { value: "tu_nhien", label: "🌱 Tự nhiên & Thân thiện" },
  { value: "gen_z", label: "⚡ Trẻ trung & Gen Z" },
  { value: "chuyen_nghiep", label: "💼 Chuyên nghiệp & Chuẩn mực" },
  { value: "gap_rut", label: "🚨 Tuyển gấp & CTA mạnh" },
  { value: "storytelling", label: "📖 Kể chuyện (Storytelling)" },
];

const KHU_VUC_OPTIONS = [
  "Hà Nội",
  "TP.HCM",
  "Đà Nẵng",
  "Cần Thơ",
  "Hải Phòng",
  "Bình Dương",
  "Đồng Nai",
  "Hưng Yên",
  "Bắc Ninh",
  "Toàn quốc",
  "Khác",
];

const emptyJob = () => ({
  ten_cong_ty: "",
  vi_tri_tuyen: "",
  khu_vuc: "",
  mo_ta_cong_viec: "",
  yeu_cau: "",
  muc_luong: "",
  thong_tin_lien_he: "",
  ngay_dang: "",
  tone: "tu_nhien",
});

const BLACKLIST_WORDS = [
  "cam kết 100%",
  "việc nhẹ lương cao",
  "thu nhập thụ động",
  "hoa hồng khủng",
  "không cần kinh nghiệm lương 30",
  "cọc tiền",
  "đặt cọc",
  "chuyển khoản trước",
  "bao đậu",
  "làm giàu nhanh",
];

export default function DashboardPage() {
  const { user: currentUser } = useAuth();
  const [drafts, setDrafts] = useState<PostDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expandedDrafts, setExpandedDrafts] = useState<Set<string>>(new Set());
  const [editingDraft, setEditingDraft] = useState<PostDraft | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTone, setEditTone] = useState("tu_nhien");
  const [rewriting, setRewriting] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualJob, setManualJob] = useState(emptyJob());
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, posted: 0, pending: 0, approved: 0 });
  const [bannerData, setBannerData] = useState<any>(null);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const isManagerOrAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drafts");
      const data: PostDraft[] = await res.json();
      setDrafts(data);
      setStats({
        total: data.length,
        posted: data.filter((d) => d.trang_thai === "posted").length,
        pending: data.filter((d) => d.trang_thai_duyet === "pending").length,
        approved: data.filter((d) => d.trang_thai_duyet === "approved").length,
      });
    } catch {
      addToast("Lỗi tải dữ liệu bản nháp", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone: "tu_nhien" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSyncError(data.error || "Lỗi không xác định");
        addToast("Đồng bộ thất bại", "error");
        return;
      }
      addToast(data.message, "success");
      await fetchDrafts();
    } catch {
      setSyncError("Không thể kết nối server");
      addToast("Lỗi kết nối", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualJob.vi_tri_tuyen || !manualJob.khu_vuc) {
      addToast("Vui lòng nhập ít nhất Vị trí và Khu vực", "error");
      return;
    }
    setManualSubmitting(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manual: true, job: manualJob, tone: manualJob.tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi");
      addToast(data.message, "success");
      setShowManualModal(false);
      setManualJob(emptyJob());
      await fetchDrafts();
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setManualSubmitting(false);
    }
  };

  // 1-Click Copy & Mở Group Facebook
  const handleCopyAndOpenGroup = async (draft: PostDraft) => {
    await navigator.clipboard.writeText(draft.noi_dung_ai_viet);
    addToast(`Đã copy nội dung & mở nhóm ${draft.group.ten_group}`, "success");

    if (draft.group.link_group) {
      window.open(draft.group.link_group, "_blank", "noopener,noreferrer");
    }
    if (draft.trang_thai === "draft") {
      await updateDraft(draft.id, { trang_thai: "copied" });
    }
  };

  const handleCopyOnly = async (draft: PostDraft) => {
    await navigator.clipboard.writeText(draft.noi_dung_ai_viet);
    addToast(`Đã copy nội dung cho ${draft.group.ten_group}`, "success");
    if (draft.trang_thai === "draft") {
      await updateDraft(draft.id, { trang_thai: "copied" });
    }
  };

  const handleCopyAll = async (jobDrafts: PostDraft[]) => {
    const pending = jobDrafts.filter((d) => d.trang_thai !== "posted");
    const all = pending
      .map((d) => `=== ${d.group.ten_group} ===\n${d.noi_dung_ai_viet}`)
      .join("\n\n---\n\n");
    await navigator.clipboard.writeText(all);
    addToast(`Đã copy ${pending.length} bản nháp`, "success");
  };

  const handleMarkPosted = (draft: PostDraft) =>
    updateDraft(draft.id, {
      trang_thai: draft.trang_thai === "posted" ? "draft" : "posted",
    });

  const handleApprove = async (draft: PostDraft, status: "approved" | "rejected") => {
    await updateDraft(draft.id, { trang_thai_duyet: status });
    addToast(status === "approved" ? "Đã phê duyệt bài đăng" : "Đã từ chối bài đăng", "info");
  };

  const updateDraft = async (id: string, data: Record<string, any>) => {
    const res = await fetch(`/api/drafts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const result = await res.json();
      const updated: PostDraft = result.draft || result;
      setDrafts((prev) => prev.map((d) => (d.id === id ? updated : d)));
    }
  };

  const handleRewriteWithOllama = async () => {
    if (!editingDraft) return;
    setRewriting(true);
    try {
      const res = await fetch(`/api/drafts/${editingDraft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rewrite", tone: editTone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi viết lại");
      setEditContent(data.draft.noi_dung_ai_viet);
      setEditingDraft(data.draft);
      setDrafts((prev) => prev.map((d) => (d.id === editingDraft.id ? data.draft : d)));
      addToast("Ollama đã viết lại bài thành công!", "success");
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setRewriting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingDraft) return;
    await updateDraft(editingDraft.id, {
      noi_dung_ai_viet: editContent,
      tone: editTone,
    });
    setEditingDraft(null);
    addToast("Đã lưu thay đổi", "success");
  };

  const toggleExpand = (id: string) => {
    setExpandedDrafts((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const checkBlacklist = (text: string) => {
    const lower = text.toLowerCase();
    return BLACKLIST_WORDS.filter((w) => lower.includes(w));
  };

  const draftsByJob = drafts.reduce<Record<string, PostDraft[]>>((acc, d) => {
    if (!acc[d.job_post_id]) acc[d.job_post_id] = [];
    acc[d.job_post_id].push(d);
    return acc;
  }, {});

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>
              ⚡ Dashboard Đăng Tin
            </h1>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              Soạn tin với Ollama AI cục bộ — Phân quyền duyệt bài & Đăng 1-click an toàn
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {currentUser?.role !== "VIEWER" && (
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => setShowManualModal(true)}
                id="btn-manual-add"
              >
                ✍️ Nhập tin thủ công
              </button>
            )}
            {isManagerOrAdmin && (
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSync}
                disabled={syncing}
                id="btn-sync"
              >
                {syncing ? (
                  <>
                    <span className="spinner" /> Đang đồng bộ...
                  </>
                ) : (
                  "🔄 Đồng bộ Sheet (Ollama)"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {[
            { label: "Tổng bản nháp", value: stats.total, icon: "📝", color: "var(--accent)" },
            { label: "Chờ phê duyệt", value: stats.pending, icon: "⏳", color: "var(--warning)" },
            { label: "Đã phê duyệt", value: stats.approved, icon: "👍", color: "#38bdf8" },
            { label: "Đã đăng bài", value: stats.posted, icon: "✅", color: "var(--success)" },
          ].map((s) => (
            <div key={s.label} className="card card-p">
              <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}>
                {s.icon}
              </div>
              <div className="stat-value" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-body">
        {syncError && (
          <div
            style={{
              background: "var(--danger-light)",
              border: "1px solid var(--danger)",
              borderRadius: 10,
              padding: "16px 20px",
              marginBottom: 24,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 600, color: "var(--danger)", marginBottom: 6 }}>
                Đồng bộ thất bại
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{syncError}</div>
            </div>
            <button
              onClick={() => setSyncError(null)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div className="spinner spinner-lg" style={{ color: "var(--accent)", margin: "0 auto" }} />
          </div>
        ) : Object.keys(draftsByJob).length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>Chưa có bản nháp nào</h3>
            <p style={{ marginBottom: 20 }}>
              Đồng bộ từ Google Sheet hoặc bấm "Nhập tin thủ công" để AI Ollama viết bài
            </p>
            {currentUser?.role !== "VIEWER" && (
              <button className="btn btn-primary" onClick={() => setShowManualModal(true)}>
                ✍️ Nhập tin ngay
              </button>
            )}
          </div>
        ) : (
          Object.entries(draftsByJob).map(([jobId, jobDrafts]) => {
            const job = jobDrafts[0].job_post;
            const postedCount = jobDrafts.filter((d) => d.trang_thai === "posted").length;
            return (
              <div key={jobId} className="card" style={{ marginBottom: 24 }}>
                <div
                  style={{
                    padding: "18px 24px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{job.vi_tri_tuyen}</h2>
                      {job.ten_cong_ty && (
                        <span className="badge" style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>
                          🏢 {job.ten_cong_ty}
                        </span>
                      )}
                      <span className="badge badge-primary">📍 {job.khu_vuc}</span>
                      {job.muc_luong && (
                        <span
                          className="badge"
                          style={{ background: "var(--success-light)", color: "var(--success)" }}
                        >
                          💰 {job.muc_luong}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                      {postedCount}/{jobDrafts.length} group đã đăng {job.ngay_dang ? ` · ${job.ngay_dang}` : ""}
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopyAll(jobDrafts)}
                    id={`btn-copy-all-${jobId}`}
                  >
                    📋 Copy tất cả ({jobDrafts.length})
                  </button>
                </div>

                <div
                  style={{
                    padding: "16px 20px 20px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: 14,
                  }}
                >
                  {jobDrafts.map((draft) => {
                    const blacklistWarnings = checkBlacklist(draft.noi_dung_ai_viet);
                    return (
                      <div
                        key={draft.id}
                        className={`draft-card ${draft.trang_thai}`}
                        style={{
                          border:
                            draft.trang_thai_duyet === "approved"
                              ? "1px solid rgba(56, 189, 248, 0.4)"
                              : draft.trang_thai_duyet === "rejected"
                              ? "1px solid rgba(239, 68, 68, 0.4)"
                              : "1px solid var(--border)",
                        }}
                        id={`draft-${draft.id}`}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{draft.group.ten_group}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              📍 {draft.group.khu_vuc}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            {/* Trạng thái duyệt */}
                            <span
                              style={{
                                padding: "2px 6px",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                background:
                                  draft.trang_thai_duyet === "approved"
                                    ? "rgba(56, 189, 248, 0.15)"
                                    : draft.trang_thai_duyet === "rejected"
                                    ? "rgba(239, 68, 68, 0.15)"
                                    : "rgba(245, 158, 11, 0.15)",
                                color:
                                  draft.trang_thai_duyet === "approved"
                                    ? "#38bdf8"
                                    : draft.trang_thai_duyet === "rejected"
                                    ? "#f87171"
                                    : "#fbbf24",
                              }}
                            >
                              {draft.trang_thai_duyet === "approved"
                                ? "✓ Đã duyệt"
                                : draft.trang_thai_duyet === "rejected"
                                ? "✕ Bị từ chối"
                                : "⏳ Chờ duyệt"}
                            </span>

                            <span className={`badge badge-${draft.trang_thai}`}>
                              {draft.trang_thai === "posted"
                                ? "✅ Đã đăng"
                                : draft.trang_thai === "copied"
                                ? "📋 Đã copy"
                                : "Nháp"}
                            </span>
                          </div>
                        </div>

                        {/* Cảnh báo từ nhạy cảm */}
                        {blacklistWarnings.length > 0 && (
                          <div
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              background: "rgba(239, 68, 68, 0.12)",
                              border: "1px dashed rgba(239, 68, 68, 0.3)",
                              color: "#fca5a5",
                              fontSize: 11,
                              marginBottom: 8,
                            }}
                          >
                            ⚠️ Chứa từ nhạy cảm dễ bị bóp reach: <strong>{blacklistWarnings.join(", ")}</strong>
                          </div>
                        )}

                        <div
                          className={`draft-content ${
                            expandedDrafts.has(draft.id) ? "expanded" : ""
                          }`}
                        >
                          {draft.noi_dung_ai_viet}
                        </div>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 12, padding: "2px 0", color: "var(--text-muted)" }}
                          onClick={() => toggleExpand(draft.id)}
                        >
                          {expandedDrafts.has(draft.id) ? "▲ Thu gọn" : "▼ Xem toàn bộ"}
                        </button>

                        {/* Thanh nút bấm hành động */}
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            marginTop: 10,
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          {/* Nút 1-Click: Copy & Mở nhóm Facebook */}
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleCopyAndOpenGroup(draft)}
                            title="Tự động copy nội dung bài đăng và mở nhóm Facebook để đăng ngay"
                          >
                            🚀 Copy & Mở Group
                          </button>

                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleCopyOnly(draft)}
                            title="Chỉ copy nội dung"
                          >
                            📋 Copy
                          </button>

                          {currentUser?.role !== "VIEWER" && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setEditingDraft(draft);
                                setEditContent(draft.noi_dung_ai_viet);
                                setEditTone(draft.tone || "tu_nhien");
                              }}
                              title="Chỉnh sửa hoặc yêu cầu Ollama viết lại theo tone"
                              id={`btn-edit-${draft.id}`}
                            >
                              ✏️ Sửa / AI Tone
                            </button>
                          )}

                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setBannerData({
                                vi_tri: draft.job_post.vi_tri_tuyen,
                                cong_ty: draft.job_post.ten_cong_ty,
                                luong: draft.job_post.muc_luong,
                                khu_vuc: draft.job_post.khu_vuc,
                                lien_he: draft.job_post.thong_tin_lien_he,
                              });
                              setShowBannerModal(true);
                            }}
                            title="Tạo ảnh banner tuyển dụng sắc nét cho bài viết này"
                          >
                            🎨 Banner
                          </button>

                          {/* Duyệt bài (Admin/Manager) */}
                          {isManagerOrAdmin && draft.trang_thai_duyet !== "approved" && (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleApprove(draft, "approved")}
                              style={{ color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.4)" }}
                            >
                              ✓ Duyệt
                            </button>
                          )}

                          <button
                            className={`btn btn-sm ${
                              draft.trang_thai === "posted" ? "btn-secondary" : "btn-success"
                            }`}
                            onClick={() => handleMarkPosted(draft)}
                            id={`btn-posted-${draft.id}`}
                          >
                            {draft.trang_thai === "posted" ? "↩ Hủy đăng" : "✅ Đã đăng"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal sửa bản nháp & viết lại với Ollama */}
      {editingDraft && (
        <div className="modal-overlay" onClick={() => setEditingDraft(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  ✏️ Chỉnh sửa & Tùy biến Phong cách AI
                </h3>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Group: <strong>{editingDraft.group.ten_group}</strong> ({editingDraft.group.khu_vuc})
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingDraft(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Chọn Tone để Ollama viết lại */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                  Đổi phong cách:
                </div>
                <select
                  className="form-select"
                  value={editTone}
                  onChange={(e) => setEditTone(e.target.value)}
                  style={{ flex: 1, padding: "6px 10px", fontSize: 13 }}
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleRewriteWithOllama}
                  disabled={rewriting}
                >
                  {rewriting ? (
                    <>
                      <span className="spinner" /> Đang viết...
                    </>
                  ) : (
                    "🤖 Ollama Viết lại"
                  )}
                </button>
              </div>

              <textarea
                className="form-textarea"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{ minHeight: 280, fontSize: 13.5 }}
                id="edit-draft-textarea"
              />
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setEditingDraft(null)}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit} id="btn-save-edit">
                💾 Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nhập tin thủ công */}
      {showManualModal && (
        <div className="modal-overlay" onClick={() => setShowManualModal(false)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                ✍️ Nhập tin tuyển dụng thủ công
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowManualModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  background: "var(--accent-light)",
                  padding: "10px 14px",
                  borderRadius: 8,
                }}
              >
                🦙 Ollama AI sẽ tự động viết lại bài cho từng Group Facebook theo khu vực và phong cách đã chọn
              </div>

              <div className="grid-2">
                <div>
                  <label className="form-label">Tên công ty (tùy chọn)</label>
                  <input
                    className="form-input"
                    value={manualJob.ten_cong_ty}
                    onChange={(e) => setManualJob((p) => ({ ...p, ten_cong_ty: e.target.value }))}
                    placeholder="Công ty TNHH..."
                  />
                </div>
                <div>
                  <label className="form-label">Vị trí tuyển dụng *</label>
                  <input
                    className="form-input"
                    value={manualJob.vi_tri_tuyen}
                    onChange={(e) => setManualJob((p) => ({ ...p, vi_tri_tuyen: e.target.value }))}
                    placeholder="Nhân viên kế toán / Công nhân..."
                    id="manual-vi-tri"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="form-label">Khu vực *</label>
                  <select
                    className="form-select"
                    value={manualJob.khu_vuc}
                    onChange={(e) => setManualJob((p) => ({ ...p, khu_vuc: e.target.value }))}
                    id="manual-khu-vuc"
                  >
                    <option value="">-- Chọn khu vực --</option>
                    {KHU_VUC_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Phong cách AI (Tone)</label>
                  <select
                    className="form-select"
                    value={manualJob.tone}
                    onChange={(e) => setManualJob((p) => ({ ...p, tone: e.target.value }))}
                  >
                    {TONES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Mô tả công việc</label>
                <textarea
                  className="form-textarea"
                  value={manualJob.mo_ta_cong_viec}
                  onChange={(e) => setManualJob((p) => ({ ...p, mo_ta_cong_viec: e.target.value }))}
                  placeholder="Mô tả chi tiết công việc..."
                  id="manual-mo-ta"
                  style={{ minHeight: 80 }}
                />
              </div>

              <div className="grid-2">
                <div>
                  <label className="form-label">Mức lương</label>
                  <input
                    className="form-input"
                    value={manualJob.muc_luong}
                    onChange={(e) => setManualJob((p) => ({ ...p, muc_luong: e.target.value }))}
                    placeholder="10 - 15 triệu"
                    id="manual-luong"
                  />
                </div>
                <div>
                  <label className="form-label">Ngày đăng</label>
                  <input
                    className="form-input"
                    type="date"
                    value={manualJob.ngay_dang}
                    onChange={(e) => setManualJob((p) => ({ ...p, ngay_dang: e.target.value }))}
                    id="manual-ngay"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Yêu cầu ứng viên</label>
                <textarea
                  className="form-textarea"
                  value={manualJob.yeu_cau}
                  onChange={(e) => setManualJob((p) => ({ ...p, yeu_cau: e.target.value }))}
                  placeholder="Không yêu cầu kinh nghiệm, nhanh nhẹn..."
                  id="manual-yeu-cau"
                  style={{ minHeight: 60 }}
                />
              </div>

              <div>
                <label className="form-label">Thông tin liên hệ</label>
                <input
                  className="form-input"
                  value={manualJob.thong_tin_lien_he}
                  onChange={(e) => setManualJob((p) => ({ ...p, thong_tin_lien_he: e.target.value }))}
                  placeholder="SĐT: 0909... / Zalo: 0909..."
                  id="manual-lien-he"
                />
              </div>
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowManualModal(false)}>
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleManualSubmit}
                disabled={manualSubmitting}
                id="btn-submit-manual"
              >
                {manualSubmitting ? (
                  <>
                    <span className="spinner" /> Đang dùng Ollama viết bài...
                  </>
                ) : (
                  "🤖 Tạo bản nháp Ollama AI"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tạo ảnh banner tự động */}
      {showBannerModal && bannerData && (
        <BannerGeneratorModal
          isOpen={showBannerModal}
          onClose={() => setShowBannerModal(false)}
          initialData={bannerData}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
