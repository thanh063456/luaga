"use client";
import { useEffect, useState, useCallback } from "react";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

interface HistoryItem {
  id: string; noi_dung_ai_viet: string; trang_thai: string; thoi_gian_tao: string; updatedAt: string;
  job_post: { vi_tri_tuyen: string; khu_vuc: string; ngay_dang: string; };
  group: { ten_group: string; khu_vuc: string; link_group: string; };
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToast();
  const limit = 20;

  const fetchHistory = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/history?page=${p}&limit=${limit}`);
      const data = await res.json();
      setItems(data.drafts);
      setTotal(data.total);
    } catch { addToast("Lỗi tải lịch sử", "error"); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchHistory(page); }, [fetchHistory, page]);

  const totalPages = Math.ceil(total / limit);
  const formatDate = (d: string) => new Date(d).toLocaleString("vi-VN");

  return (
    <>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>📜 Lịch sử đăng bài</h1>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
            {total} bài đã đăng thành công
          </p>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}><span className="spinner spinner-lg" style={{ color: "var(--accent)" }} /></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <h3>Chưa có lịch sử đăng bài</h3>
            <p>Khi bạn đánh dấu bản nháp là "Đã đăng", chúng sẽ xuất hiện ở đây</p>
          </div>
        ) : (
          <>
            <div className="card table-container">
              <table>
                <thead>
                  <tr>
                    <th>Vị trí tuyển dụng</th>
                    <th>Group đã đăng</th>
                    <th>Khu vực</th>
                    <th>Ngày đăng Sheet</th>
                    <th>Thời gian đánh dấu</th>
                    <th>Link Group</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.job_post.vi_tri_tuyen}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>📍 {item.job_post.khu_vuc}</div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{item.group.ten_group}</td>
                      <td><span className="badge badge-primary">📍 {item.group.khu_vuc}</span></td>
                      <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item.job_post.ngay_dang || "—"}</td>
                      <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{formatDate(item.updatedAt)}</td>
                      <td>
                        {item.group.link_group ? (
                          <a href={item.group.link_group} target="_blank" rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>🔗 Mở</a>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
                <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} id="btn-prev-page">← Trước</button>
                <span style={{ padding: "6px 16px", fontSize: 14, color: "var(--text-secondary)" }}>
                  Trang {page} / {totalPages}
                </span>
                <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} id="btn-next-page">Sau →</button>
              </div>
            )}
          </>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
