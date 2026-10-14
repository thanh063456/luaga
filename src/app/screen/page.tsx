"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

interface JobPost {
  id: string;
  vi_tri_tuyen: string;
  ten_cong_ty: string;
  khu_vuc: string;
}

interface ScreeningResult {
  id: string;
  ten_ung_vien: string;
  file_name: string;
  match_score: number;
  danh_gia: "phu_hop" | "can_nhac" | "khong_phu_hop" | string;
  uu_diem: string[] | string;
  nhuoc_diem: string[] | string;
  cau_hoi_phong_van: string[] | string;
  tom_tat: string;
  createdAt: string;
  job_post?: {
    vi_tri_tuyen: string;
    ten_cong_ty: string;
  };
}

export default function ScreenPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<ScreeningResult | null>(null);
  const [history, setHistory] = useState<ScreeningResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, addToast, removeToast } = useToast();

  const fetchJobsAndHistory = useCallback(async () => {
    try {
      const [jRes, hRes] = await Promise.all([
        fetch("/api/jobs"),
        fetch("/api/screen"),
      ]);
      if (jRes.ok) {
        const jData = await jRes.json();
        setJobs(jData);
        if (jData.length > 0 && !selectedJobId) {
          setSelectedJobId(jData[0].id);
        }
      }
      if (hRes.ok) {
        const hData = await hRes.json();
        setHistory(hData);
      }
    } catch {
      addToast("Lỗi tải dữ liệu", "error");
    }
  }, [addToast, selectedJobId]);

  useEffect(() => {
    fetchJobsAndHistory();
  }, [fetchJobsAndHistory]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) {
      addToast("Vui lòng chọn vị trí tuyển dụng", "error");
      return;
    }
    if (!file && !rawText.trim()) {
      addToast("Vui lòng tải lên file CV (PDF/Word) hoặc dán văn bản", "error");
      return;
    }

    setAnalyzing(true);
    setCurrentResult(null);

    try {
      const formData = new FormData();
      formData.append("jobPostId", selectedJobId);
      if (candidateName) formData.append("candidateName", candidateName);
      if (rawText) formData.append("rawText", rawText);
      if (file) formData.append("file", file);

      const res = await fetch("/api/screen", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi phân tích CV");

      addToast("Ollama đã chấm điểm CV thành công!", "success");
      setCurrentResult(data.screening);
      fetchJobsAndHistory();
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const parseJsonArray = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return [val];
    }
    return [];
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>
            📄 AI Sàng Lọc & Chấm Điểm CV Ứng Viên
          </h1>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
            Ollama AI tự động đọc CV (PDF/Word), tính điểm khớp với JD và gợi ý câu hỏi phỏng vấn
          </p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24, alignItems: "start" }}>
          {/* Cột 1: Form Tải CV & Nhập liệu */}
          <div className="card card-p-lg">
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
              📥 Nhập thông tin & Tải lên hồ sơ ứng viên
            </h3>

            <form onSubmit={handleAnalyze} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="form-label">Chọn Vị trí Tuyển dụng để đối chiếu (JD) *</label>
                <select
                  className="form-select"
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn tin tuyển dụng --</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.vi_tri_tuyen} {j.ten_cong_ty ? `(${j.ten_cong_ty})` : ""} - {j.khu_vuc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Tên ứng viên (tùy chọn)</label>
                <input
                  type="text"
                  className="form-input"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Nguyễn Văn A (hoặc để trống AI tự trích xuất)"
                />
              </div>

              {/* Khu vực Upload file kéo thả */}
              <div>
                <label className="form-label">File CV ứng viên (.pdf hoặc .docx)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed var(--border)",
                    borderRadius: 12,
                    padding: "24px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: file ? "var(--accent-light)" : "rgba(255,255,255,0.01)",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) setFile(e.target.files[0]);
                    }}
                  />
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📎</div>
                  {file ? (
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--accent)" }}>{file.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {(file.size / 1024).toFixed(1)} KB · Bấm để đổi file khác
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        Bấm vào đây để chọn file CV từ máy tính
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                        Hỗ trợ định dạng PDF (.pdf) hoặc Word (.docx)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dán text thủ công nếu không có file */}
              <div>
                <label className="form-label">Hoặc Dán nội dung CV dạng văn bản:</label>
                <textarea
                  className="form-textarea"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Dán nội dung học vấn, kinh nghiệm của ứng viên vào đây..."
                  style={{ minHeight: 90, fontSize: 12.5 }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={analyzing}
                style={{ justifyContent: "center" }}
              >
                {analyzing ? (
                  <>
                    <span className="spinner" /> Ollama đang đọc & chấm điểm CV...
                  </>
                ) : (
                  "🤖 Bắt đầu Sàng Lọc & Chấm Điểm"
                )}
              </button>
            </form>
          </div>

          {/* Cột 2: Kết quả chấm điểm */}
          <div>
            {currentResult ? (
              <div
                className="card card-p-lg"
                style={{
                  border:
                    currentResult.danh_gia === "phu_hop"
                      ? "1px solid rgba(16, 185, 129, 0.5)"
                      : currentResult.danh_gia === "can_nhac"
                      ? "1px solid rgba(245, 158, 11, 0.5)"
                      : "1px solid rgba(239, 68, 68, 0.5)",
                }}
              >
                {/* Header Kết quả */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                      {currentResult.ten_ung_vien}
                    </h3>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {currentResult.file_name || "Hồ sơ nhập tay"}
                    </div>
                  </div>

                  {/* Vòng tròn điểm số */}
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      fontWeight: 800,
                      background:
                        currentResult.match_score >= 75
                          ? "rgba(16, 185, 129, 0.15)"
                          : currentResult.match_score >= 50
                          ? "rgba(245, 158, 11, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                      color:
                        currentResult.match_score >= 75
                          ? "#34d399"
                          : currentResult.match_score >= 50
                          ? "#fbbf24"
                          : "#f87171",
                      border: `2px solid ${
                        currentResult.match_score >= 75
                          ? "#10b981"
                          : currentResult.match_score >= 50
                          ? "#f59e0b"
                          : "#ef4444"
                      }`,
                    }}
                  >
                    {currentResult.match_score}%
                  </div>
                </div>

                {/* Badge Đánh giá */}
                <div style={{ marginBottom: 14 }}>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      background:
                        currentResult.danh_gia === "phu_hop"
                          ? "rgba(16, 185, 129, 0.2)"
                          : currentResult.danh_gia === "can_nhac"
                          ? "rgba(245, 158, 11, 0.2)"
                          : "rgba(239, 68, 68, 0.2)",
                      color:
                        currentResult.danh_gia === "phu_hop"
                          ? "#34d399"
                          : currentResult.danh_gia === "can_nhac"
                          ? "#fbbf24"
                          : "#f87171",
                    }}
                  >
                    {currentResult.danh_gia === "phu_hop"
                      ? "🌟 RẤT PHÙ HỢP (Khuyên mời phỏng vấn)"
                      : currentResult.danh_gia === "can_nhac"
                      ? "⚖️ CÂN NHẮC (Cần phỏng vấn thêm)"
                      : "✕ KHÔNG PHÙ HỢP"}
                  </span>
                </div>

                {/* Nhận xét chung */}
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.03)",
                    fontSize: 13,
                    lineHeight: 1.5,
                    marginBottom: 16,
                  }}
                >
                  💡 <strong>Nhận định:</strong> {currentResult.tom_tat}
                </div>

                {/* Ưu điểm & Nhược điểm */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div
                    style={{
                      padding: "12px",
                      borderRadius: 8,
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#34d399", fontSize: 13, marginBottom: 6 }}>
                      ✓ Ưu điểm nổi bật:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.5 }}>
                      {parseJsonArray(currentResult.uu_diem).map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>

                  <div
                    style={{
                      padding: "12px",
                      borderRadius: 8,
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#f87171", fontSize: 13, marginBottom: 6 }}>
                      ⚠️ Điểm còn thiếu:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.5 }}>
                      {parseJsonArray(currentResult.nhuoc_diem).map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Gợi ý câu hỏi phỏng vấn */}
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: "rgba(99, 102, 241, 0.1)",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "var(--accent)", fontSize: 13, marginBottom: 6 }}>
                    🎯 3 Câu hỏi phỏng vấn gợi ý cho HR:
                  </div>
                  <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.6 }}>
                    {parseJsonArray(currentResult.cau_hoi_phong_van).map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <div
                className="card card-p-lg"
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "var(--text-muted)",
                }}
              >
                <div style={{ fontSize: 42, marginBottom: 12 }}>🎯</div>
                <h4 style={{ margin: 0, fontSize: 16, color: "var(--text-secondary)" }}>
                  Chưa có kết quả sàng lọc
                </h4>
                <p style={{ fontSize: 13, margin: "6px 0 0" }}>
                  Hãy chọn vị trí tuyển dụng và tải file CV bên trái để Ollama tính điểm độ phù hợp.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Lịch sử các CV đã chấm điểm */}
        {history.length > 0 && (
          <div className="card" style={{ marginTop: 32, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>
              📜 Lịch sử các ứng viên đã sàng lọc ({history.length})
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", textAlign: "left", fontSize: 12.5 }}>
                    <th style={{ padding: "12px 16px" }}>Ứng viên</th>
                    <th style={{ padding: "12px 16px" }}>Vị trí ứng tuyển</th>
                    <th style={{ padding: "12px 16px" }}>Điểm phù hợp</th>
                    <th style={{ padding: "12px 16px" }}>Kết luận</th>
                    <th style={{ padding: "12px 16px" }}>Tóm tắt</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} style={{ borderTop: "1px solid var(--border)", fontSize: 13 }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{item.ten_ung_vien}</td>
                      <td style={{ padding: "12px 16px" }}>{item.job_post?.vi_tri_tuyen || "Tin tuyển dụng"}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                        <span
                          style={{
                            color:
                              item.match_score >= 75
                                ? "#34d399"
                                : item.match_score >= 50
                                ? "#fbbf24"
                                : "#f87171",
                          }}
                        >
                          {item.match_score}%
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontWeight: 600,
                            background:
                              item.danh_gia === "phu_hop"
                                ? "rgba(16, 185, 129, 0.15)"
                                : item.danh_gia === "can_nhac"
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(239, 68, 68, 0.15)",
                            color:
                              item.danh_gia === "phu_hop"
                                ? "#34d399"
                                : item.danh_gia === "can_nhac"
                                ? "#fbbf24"
                                : "#f87171",
                          }}
                        >
                          {item.danh_gia === "phu_hop"
                            ? "Phù hợp"
                            : item.danh_gia === "can_nhac"
                            ? "Cân nhắc"
                            : "Không đạt"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)" }}>
                        {item.tom_tat.slice(0, 60)}...
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setCurrentResult(item)}
                        >
                          👁️ Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
