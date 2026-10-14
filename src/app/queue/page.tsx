"use client";
import { useEffect, useState, useCallback } from "react";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

interface QueueItem {
  id: string;
  draft_id: string;
  thoi_gian_du_kien: string;
  trang_thai: string;
  khung_gio: string;
  ghi_chu: string;
  draft: {
    id: string;
    noi_dung_ai_viet: string;
    job_post: {
      vi_tri_tuyen: string;
      khu_vuc: string;
    };
    group: {
      ten_group: string;
      link_group: string;
      khu_vuc: string;
    };
  };
}

interface DraftOption {
  id: string;
  noi_dung_ai_viet: string;
  job_post: { vi_tri_tuyen: string };
  group: { ten_group: string; khu_vuc: string };
}

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableDrafts, setAvailableDrafts] = useState<DraftOption[]>([]);
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [selectedKhungGio, setSelectedKhungGio] = useState("sang");
  const [delayMinutes, setDelayMinutes] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/queue?trang_thai=waiting");
      if (res.ok) setQueue(await res.json());
    } catch {
      addToast("Lỗi tải hàng đợi", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const loadAvailableDrafts = async () => {
    try {
      const res = await fetch("/api/drafts?trang_thai=draft");
      if (res.ok) {
        const data = await res.json();
        setAvailableDrafts(data);
        setShowAddModal(true);
      }
    } catch {
      addToast("Lỗi tải danh sách bản nháp", "error");
    }
  };

  const handleAddToQueue = async () => {
    if (selectedDraftIds.length === 0) {
      addToast("Vui lòng chọn ít nhất 1 bài viết", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftIds: selectedDraftIds,
          khungGio: selectedKhungGio,
          delayMinutes: Number(delayMinutes),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xếp hàng");
      addToast(data.message, "success");
      setShowAddModal(false);
      setSelectedDraftIds([]);
      fetchQueue();
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteItem = async (id: string, groupLink?: string, content?: string) => {
    if (content) {
      await navigator.clipboard.writeText(content);
    }
    if (groupLink) {
      window.open(groupLink, "_blank", "noopener,noreferrer");
    }

    try {
      await fetch(`/api/queue/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trang_thai: "completed" }),
      });
      addToast("Đã copy, mở nhóm và đánh dấu hoàn thành!", "success");
      fetchQueue();
    } catch {
      addToast("Lỗi cập nhật", "error");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await fetch(`/api/queue/${id}`, { method: "DELETE" });
      addToast("Đã xóa khỏi hàng đợi", "info");
      fetchQueue();
    } catch {
      addToast("Lỗi xóa", "error");
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>
              ⏰ Hàng Đợi Thông Minh & Khung Giờ Vàng
            </h1>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              Giãn cách tự động chống spam & nhắc nhở đăng bài vào khung giờ có nhiều ứng viên nhất
            </p>
          </div>

          <button className="btn btn-primary btn-lg" onClick={loadAvailableDrafts}>
            ➕ Xếp lịch bài mới
          </button>
        </div>

        {/* Thẻ 4 Khung Giờ Vàng */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginTop: 20,
          }}
        >
          {[
            { id: "sang", time: "08:00 - 09:30", name: "🌅 Sáng Đầu Ngày", note: "Ứng viên đọc báo sáng" },
            { id: "trua", time: "11:45 - 13:00", name: "☀️ Giờ Nghỉ Trưa", note: "Lướt Facebook nhiều nhất" },
            { id: "chieu", time: "16:30 - 17:30", name: "🌇 Tan Ca Chiều", note: "Tìm việc làm thêm / đổi việc" },
            { id: "toi", time: "19:30 - 21:30", name: "🌙 Giờ Vàng Buổi Tối", note: "Tương tác nộp CV cao đỉnh điểm" },
          ].map((h) => (
            <div
              key={h.id}
              className="card card-p"
              style={{
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{h.name}</div>
              <div style={{ fontSize: 16, fontWeight: 800, margin: "4px 0" }}>{h.time}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{h.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <span className="spinner spinner-lg" style={{ color: "var(--accent)" }} />
          </div>
        ) : queue.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <h3>Hàng đợi đang trống</h3>
            <p style={{ marginBottom: 20 }}>
              Chưa có bài đăng nào được xếp lịch. Hãy chọn bản nháp để lập lịch giãn cách an toàn.
            </p>
            <button className="btn btn-primary" onClick={loadAvailableDrafts}>
              ➕ Xếp lịch ngay
            </button>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", textAlign: "left", fontSize: 13 }}>
                    <th style={{ padding: "14px 18px" }}>Thời gian dự kiến</th>
                    <th style={{ padding: "14px 18px" }}>Vị trí tuyển dụng</th>
                    <th style={{ padding: "14px 18px" }}>Nhóm Facebook</th>
                    <th style={{ padding: "14px 18px" }}>Cơ chế bảo vệ</th>
                    <th style={{ padding: "14px 18px", textAlign: "right" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => {
                    const scheduledDate = new Date(item.thoi_gian_du_kien);
                    const formattedTime = scheduledDate.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const formattedDate = scheduledDate.toLocaleDateString("vi-VN");

                    return (
                      <tr key={item.id} style={{ borderTop: "1px solid var(--border)", fontSize: 13.5 }}>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: 700, color: "var(--accent)", fontSize: 15 }}>
                            {formattedTime}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{formattedDate}</div>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: 600 }}>{item.draft.job_post.vi_tri_tuyen}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            📍 {item.draft.job_post.khu_vuc}
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: 600 }}>{item.draft.group.ten_group}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            📍 {item.draft.group.khu_vuc}
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 4,
                              background: "rgba(16, 185, 129, 0.15)",
                              color: "#34d399",
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            🛡️ {item.ghi_chu}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                handleCompleteItem(
                                  item.id,
                                  item.draft.group.link_group,
                                  item.draft.noi_dung_ai_viet
                                )
                              }
                              title="Tự động copy nội dung và mở nhóm Facebook"
                            >
                              🚀 Mở nhóm & Copy
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDeleteItem(item.id)}
                              title="Hủy khỏi hàng đợi"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Thêm vào hàng đợi */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 18 }}>⏰ Lập lịch Hàng đợi Chống Spam</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="grid-2">
                <div>
                  <label className="form-label">Chọn Khung Giờ Vàng</label>
                  <select
                    className="form-select"
                    value={selectedKhungGio}
                    onChange={(e) => setSelectedKhungGio(e.target.value)}
                  >
                    <option value="sang">🌅 Sáng (08:30)</option>
                    <option value="trua">☀️ Trưa (12:00)</option>
                    <option value="chieu">🌇 Chiều (17:00)</option>
                    <option value="toi">🌙 Tối (20:00)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Giãn cách giữa các bài (phút)</label>
                  <select
                    className="form-select"
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(Number(e.target.value))}
                  >
                    <option value={5}>5 phút (Nhanh)</option>
                    <option value={10}>10 phút (Khuyên dùng - An toàn)</option>
                    <option value={15}>15 phút (Cực kỳ an toàn)</option>
                    <option value={20}>20 phút</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Chọn các bản nháp muốn xếp lịch:</label>
                <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {availableDrafts.length === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", padding: 12 }}>
                      Không có bản nháp nào đang ở trạng thái chưa đăng.
                    </div>
                  ) : (
                    availableDrafts.map((d) => {
                      const isSelected = selectedDraftIds.includes(d.id);
                      return (
                        <label
                          key={d.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 12px",
                            borderRadius: 8,
                            background: isSelected ? "var(--accent-light)" : "rgba(255,255,255,0.02)",
                            border: "1px solid var(--border)",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDraftIds([...selectedDraftIds, d.id]);
                              } else {
                                setSelectedDraftIds(selectedDraftIds.filter((id) => id !== d.id));
                              }
                            }}
                          />
                          <div style={{ flex: 1, fontSize: 12.5 }}>
                            <strong>{d.job_post.vi_tri_tuyen}</strong> ➔ {d.group.ten_group} ({d.group.khu_vuc})
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddToQueue}
                disabled={submitting || selectedDraftIds.length === 0}
              >
                {submitting ? "Đang xử lý..." : `Xếp lịch ${selectedDraftIds.length} bài`}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
