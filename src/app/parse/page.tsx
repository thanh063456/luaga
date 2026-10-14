"use client";
import { useState, useRef, useEffect } from "react";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";

interface ParsedJob {
  ten_cong_ty: string;
  vi_tri_tuyen: string;
  khu_vuc: string;
  mo_ta_cong_viec: string;
  yeu_cau: string;
  muc_luong: string;
  thong_tin_lien_he: string;
  ngay_dang: string;
  is_from_template?: boolean;
  ten_cong_ty_khop?: string;
  do_tin_cay: string;
  ghi_chu_phan_tich: string;
}

interface Group {
  id: string;
  ten_group: string;
  link_group: string;
  khu_vuc: string;
  ghi_chu: string;
}

const KHU_VUC_OPTIONS = [
  "Hà Nội", "TP.HCM", "Đà Nẵng", "Cần Thơ", "Hải Phòng",
  "Bình Dương", "Đồng Nai", "Hưng Yên", "Bắc Ninh",
  "HCM và lân cận", "Hà Nội và lân cận", "Toàn quốc",
];

function cleanKhuVucClient(s: string): string {
  let res = s.toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
  
  if (res.includes("hồ chí minh") || res.includes("ho chi minh") || res.includes("hcm") || res.includes("tphcm")) {
    res = res.replace(/hồ chí minh|ho chi minh|hcm|tphcm/g, "tphcm");
  }
  
  if (res.includes("hà nội") || res.includes("ha noi") || res.includes("hn")) {
    res = res.replace(/hà nội|ha noi|hn/g, "hanoi");
  }
  
  return res.replace(/\s+/g, "");
}

function matchKhuVucClient(jobKhuVuc: string, groupKhuVuc: string): boolean {
  const jk = cleanKhuVucClient(jobKhuVuc);
  const gk = cleanKhuVucClient(groupKhuVuc);

  if (gk === "toanquoc" || jk === "toanquoc") return true;
  if (jk === gk) return true;
  if (jk.includes(gk) || gk.includes(jk)) return true;

  const lan_can_hcm = ["tphcm", "bìnhdương", "đồngnai", "longan", "tâyninh", "tayninh", "bàrịa", "baria", "vũngtàu", "vungtau"];
  const lan_can_hn = ["hanoi", "bắcninh", "bacninh", "hưngyên", "hungyen", "vĩnhphúc", "vinhphuc", "hảidương", "haiduong", "hànam", "hanam", "hòabình", "hoabinh"];

  // Nếu nhóm đăng bài cho khu vực "lân cận"
  if (gk.includes("lâncận") || gk.includes("lancan")) {
    if (gk.includes("tphcm")) {
      return lan_can_hcm.some(r => jk.includes(r) || r.includes(jk));
    }
    if (gk.includes("hanoi")) {
      return lan_can_hn.some(r => jk.includes(r) || r.includes(jk));
    }
  }

  // Nếu tin tuyển dụng đăng cho khu vực "lân cận"
  if (jk.includes("lâncận") || jk.includes("lancan")) {
    if (jk.includes("tphcm")) {
      return lan_can_hcm.some(r => gk.includes(r) || r.includes(gk));
    }
    if (jk.includes("hanoi")) {
      return lan_can_hn.some(r => gk.includes(r) || r.includes(gk));
    }
  }

  return false;
}

export default function ParsePage() {
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedJob | null>(null);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [editedJob, setEditedJob] = useState<ParsedJob | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState<"input" | "review" | "done">("input");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, addToast, removeToast } = useToast();
  const router = useRouter();

  // Load toàn bộ Group đang hoạt động từ backend khi trang mở ra
  useEffect(() => {
    fetch("/api/groups")
      .then(res => res.json())
      .then(data => {
        setAllGroups(data.filter((g: any) => g.trang_thai === "active"));
      })
      .catch(err => console.error("Lỗi tải danh sách group:", err));
  }, []);

  const handleFileChange = (selectedFile: File) => {
    const isImage = selectedFile.type.startsWith("image/");
    const isDocx = selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || selectedFile.name.endsWith(".docx");

    if (!isImage && !isDocx) {
      addToast("Chỉ hỗ trợ file ảnh (PNG, JPG, WEBP) hoặc file tài liệu Word (.docx)", "error");
      return;
    }

    setFile(selectedFile);

    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview("docx"); // Đánh dấu là file Word
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleParse = async () => {
    if (!rawText.trim() && !file) {
      addToast("Vui lòng dán văn bản hoặc tải lên một file ảnh/Word", "error");
      return;
    }
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("rawText", rawText);
      if (file) {
        fd.append("file", file);
      }

      const res = await fetch("/api/parse", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi phân tích");

      // Tính toán khớp nhóm tự động ngay lập tức dựa trên allGroups và khu_vuc mới
      const matched = allGroups.filter(g => matchKhuVucClient(data.parsed.khu_vuc || "", g.khu_vuc));

      setParsed(data.parsed);
      setEditedJob({ ...data.parsed });
      setSelectedGroupIds(new Set(matched.map(g => g.id)));
      setStep("review");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Lỗi phân tích", "error");
    } finally {
      setParsing(false);
    }
  };

  const handleCreateDrafts = async () => {
    if (!editedJob) return;
    if (selectedGroupIds.size === 0) {
      addToast("Vui lòng chọn ít nhất 1 group để tạo bài viết", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manual: true,
          job: editedJob,
          groupIds: Array.from(selectedGroupIds),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tạo bản nháp");
      addToast(data.message, "success");
      setStep("done");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Lỗi", "error");
    } finally {
      setCreating(false);
    }
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const confidenceBadge = (level: string) => {
    if (level === "cao") return <span className="badge badge-active">✅ Độ tin cậy cao</span>;
    if (level === "trung_binh") return <span className="badge badge-draft">⚠️ Cần kiểm tra lại</span>;
    return <span className="badge badge-inactive">❌ Thông tin không rõ</span>;
  };

  const dynamicMatchedGroups = allGroups.filter(g => {
    if (!editedJob) return false;
    return matchKhuVucClient(editedJob.khu_vuc || "", g.khu_vuc);
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>🧠 Dán tin & AI Phân tích</h1>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
            Hỗ trợ Dán text, Tải ảnh banner hoặc file Word (.docx) — AI tự động nhận diện và đối chiếu bộ nhớ
          </p>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 800 }}>

        {/* BƯỚC 1: NHẬP VĂN BẢN / FILE */}
        {step === "input" && (
          <div>
            <div className="card card-p-lg" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
                📥 Chọn tệp tin tuyển dụng hoặc dán văn bản
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                Bạn có thể kéo thả <strong>hình ảnh banner</strong>, file tài liệu <strong>Word (.docx)</strong> hoặc dán văn bản thô vào ô bên dưới.
              </div>

              {/* Khu vực kéo thả file */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFileChange(f);
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: 12,
                  padding: "24px 20px",
                  textAlign: "center",
                  background: dragOver ? "var(--accent-light)" : "var(--bg-primary)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  marginBottom: 16
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  accept=".docx,image/*"
                  style={{ display: "none" }}
                />

                {!file ? (
                  <div>
                    <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>📁</span>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      Kéo & thả ảnh / file Word tại đây, hoặc <span style={{ color: "var(--accent)", fontWeight: 600 }}>Chọn từ máy tính</span>
                    </span>
                    <span style={{ fontSize: 11, display: "block", color: "var(--text-muted)", marginTop: 4 }}>
                      Hỗ trợ: PNG, JPG, WEBP hoặc .docx
                    </span>
                  </div>
                ) : (
                  <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
                    {filePreview === "docx" ? (
                      <div style={{ fontSize: 32 }}>📄</div>
                    ) : filePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={filePreview}
                        alt="Preview"
                        style={{ maxWidth: 80, maxHeight: 80, borderRadius: 6, objectFit: "contain", border: "1px solid var(--border)" }}
                      />
                    ) : (
                      <span className="spinner" />
                    )}
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }} className="truncate">
                        {file.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {(file.size / 1024).toFixed(1)} KB · {filePreview === "docx" ? "File Word (.docx)" : "Hình ảnh"}
                      </div>
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={handleRemoveFile}
                      style={{ padding: "4px 8px", fontSize: 11, marginLeft: 12 }}
                    >
                      Xóa tệp
                    </button>
                  </div>
                )}
              </div>

              {/* Ô dán văn bản */}
              <div style={{ marginBottom: 6 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Hoặc dán văn bản thô vào đây (nếu không tải file):</label>
              </div>
              <textarea
                className="form-textarea"
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={"Ví dụ:\n- Dán tin từ Zalo/Facebook...\n- Gõ ghi chú ngắn: \"Cần tuyển gấp 3 người ở platel ngày mai\"..."}
                style={{ minHeight: 160, fontSize: 14 }}
                id="input-raw-text"
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {rawText.length} ký tự
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {(rawText || file) && (
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setRawText("");
                        handleRemoveFile();
                      }}
                    >
                      🗑 Xóa hết
                    </button>
                  )}
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleParse}
                    disabled={parsing || (!rawText.trim() && !file)}
                    id="btn-parse"
                  >
                    {parsing ? (
                      <>
                        <span className="spinner" />
                        {filePreview === "docx"
                          ? " Đang đọc Word & phân tích..."
                          : file
                            ? " AI đang đọc quét ảnh..."
                            : " AI đang phân tích text..."}
                      </>
                    ) : (
                      "🧠 Phân tích bằng AI"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Gợi ý sử dụng */}
            <div className="card card-p" style={{ background: "var(--accent-light)", border: "1px solid var(--accent)30" }}>
              <div style={{ fontWeight: 600, color: "var(--accent)", marginBottom: 10 }}>💡 Cách sử dụng bộ quét ảnh / Word</div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "var(--text-secondary)", lineHeight: 2 }}>
                <li><strong>Quét hình ảnh</strong>: Chụp màn hình tin tuyển dụng/banner và kéo vào đây. AI tự đọc chữ trong ảnh (Nidec, Platel...) để điền chi tiết và khớp bộ nhớ.</li>
                <li><strong>Quét file Word</strong>: Kéo file mô tả công việc (.docx) của đối tác gửi. AI tự lọc thông tin tuyển dụng quan trọng.</li>
                <li><strong>Kết hợp</strong>: Bạn có thể vừa tải file ảnh vừa gõ thêm text phụ đề (ví dụ: *"Đăng tin này gấp vào ngày mai"*).</li>
              </ul>
            </div>
          </div>
        )}

        {/* BƯỚC 2: XEM LẠI & CHỈNH SỬA */}
        {step === "review" && parsed && editedJob && (
          <div>
            {/* Header review */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setStep("input");
                  }}
                  id="btn-back"
                >
                  ← Quay lại
                </button>
                {confidenceBadge(parsed.do_tin_cay)}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                AI phân tích xong — kiểm tra và chỉnh sửa nếu cần
              </div>
            </div>

            {/* Ghi chú AI */}
            {parsed.ghi_chu_phan_tich && (
              <div style={{
                background: "var(--warning-light)", border: "1px solid var(--warning)50",
                borderRadius: 10, padding: "12px 16px", marginBottom: 20,
                fontSize: 13, color: "var(--warning)", display: "flex", gap: 10
              }}>
                <span>💬</span>
                <span><strong>AI ghi chú:</strong> {parsed.ghi_chu_phan_tich}</span>
              </div>
            )}

            {/* Thông báo khớp mẫu đã ghi nhớ */}
            {editedJob.is_from_template && (
              <div style={{
                background: "var(--success-light)", border: "1px solid var(--success)30",
                color: "var(--success)", padding: "12px 16px", borderRadius: 10,
                fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 8
              }}>
                <span>✨</span>
                <span>Tự động khớp dữ liệu mẫu đã nhớ của <strong>{editedJob.ten_cong_ty_khop || editedJob.ten_cong_ty}</strong>.</span>
              </div>
            )}

            {/* Form chỉnh sửa thông tin */}
            <div className="card card-p-lg" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 20 }}>
                📝 Thông tin tuyển dụng (có thể chỉnh sửa)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">Tên công ty *</label>
                    <input
                      className="form-input"
                      value={editedJob.ten_cong_ty || ""}
                      onChange={e => setEditedJob(p => p ? { ...p, ten_cong_ty: e.target.value } : p)}
                      placeholder="Ví dụ: Platel, Samsung..."
                      id="edit-cong-ty"
                    />
                  </div>
                  <div>
                    <label className="form-label">Vị trí tuyển dụng *</label>
                    <input
                      className="form-input"
                      value={editedJob.vi_tri_tuyen}
                      onChange={e => setEditedJob(p => p ? { ...p, vi_tri_tuyen: e.target.value } : p)}
                      id="edit-vi-tri"
                    />
                  </div>
                  <div>
                    <label className="form-label">Khu vực *</label>
                    <select
                      className="form-select"
                      value={editedJob.khu_vuc && KHU_VUC_OPTIONS.includes(editedJob.khu_vuc) ? editedJob.khu_vuc : (editedJob.khu_vuc ? "Khác" : "")}
                      onChange={e => {
                        const val = e.target.value;
                        setEditedJob(p => p ? { ...p, khu_vuc: val === "Khác" ? "" : val } : p);
                      }}
                      id="edit-khu-vuc"
                    >
                      <option value="">-- Chọn khu vực --</option>
                      {KHU_VUC_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                      <option value="Khác">Khác</option>
                    </select>
                    {(!editedJob.khu_vuc || !KHU_VUC_OPTIONS.includes(editedJob.khu_vuc)) && (
                      <input
                        className="form-input"
                        style={{ marginTop: 8 }}
                        value={editedJob.khu_vuc || ""}
                        onChange={e => setEditedJob(p => p ? { ...p, khu_vuc: e.target.value } : p)}
                        placeholder="Nhập khu vực tự chọn (ví dụ: HCM và lân cận)"
                        id="edit-khu-vuc-custom"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="form-label">Mô tả công việc</label>
                  <textarea className="form-textarea" value={editedJob.mo_ta_cong_viec} onChange={e => setEditedJob(p => p ? { ...p, mo_ta_cong_viec: e.target.value } : p)} style={{ minHeight: 80 }} id="edit-mo-ta" />
                </div>
                <div className="grid-2">
                  <div>
                    <label className="form-label">Mức lương</label>
                    <input className="form-input" value={editedJob.muc_luong} onChange={e => setEditedJob(p => p ? { ...p, muc_luong: e.target.value } : p)} id="edit-luong" />
                  </div>
                  <div>
                    <label className="form-label">Ngày đăng</label>
                    <input className="form-input" type="date" value={editedJob.ngay_dang} onChange={e => setEditedJob(p => p ? { ...p, ngay_dang: e.target.value } : p)} id="edit-ngay" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Yêu cầu ứng viên</label>
                  <textarea className="form-textarea" value={editedJob.yeu_cau} onChange={e => setEditedJob(p => p ? { ...p, yeu_cau: e.target.value } : p)} style={{ minHeight: 60 }} id="edit-yeu-cau" />
                </div>
                <div>
                  <label className="form-label">Thông tin liên hệ</label>
                  <input className="form-input" value={editedJob.thong_tin_lien_he} onChange={e => setEditedJob(p => p ? { ...p, thong_tin_lien_he: e.target.value } : p)} id="edit-lien-he" />
                </div>
              </div>
            </div>

            {/* Chọn Group */}
            <div className="card card-p-lg" style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>
                  👥 Group phù hợp ({dynamicMatchedGroups.length}/{allGroups.length} group)
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedGroupIds(new Set(dynamicMatchedGroups.map(g => g.id)))} id="btn-select-all">
                    Chọn tất cả
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedGroupIds(new Set())} id="btn-deselect-all">
                    Bỏ chọn tất cả
                  </button>
                </div>
              </div>

              {dynamicMatchedGroups.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)", fontSize: 14 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>😕</div>
                  Không tìm thấy group phù hợp với khu vực <strong>{editedJob.khu_vuc}</strong>.
                  <br />Hãy thêm group tại trang <a href="/groups" style={{ color: "var(--accent)" }}>Quản lý Group</a>.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {dynamicMatchedGroups.map(g => (
                    <label
                      key={g.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                        borderRadius: 8, cursor: "pointer",
                        background: selectedGroupIds.has(g.id) ? "var(--accent-light)" : "var(--bg-primary)",
                        border: `1px solid ${selectedGroupIds.has(g.id) ? "var(--accent)50" : "var(--border)"}`,
                        transition: "all 0.15s",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.has(g.id)}
                        onChange={() => toggleGroup(g.id)}
                        style={{ width: 16, height: 16, accentColor: "var(--accent)", cursor: "pointer" }}
                        id={`check-group-${g.id}`}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{g.ten_group}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>📍 {g.khu_vuc}{g.ghi_chu ? ` · ${g.ghi_chu.slice(0, 50)}...` : ""}</div>
                      </div>
                      {g.link_group && (
                        <a href={g.link_group} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>🔗</a>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Nút hành động */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setStep("input")}>← Nhập lại</button>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleCreateDrafts}
                disabled={creating || selectedGroupIds.size === 0}
                id="btn-create-drafts"
              >
                {creating
                  ? <><span className="spinner" /> AI đang viết bản nháp...</>
                  : `🤖 Tạo bản nháp cho ${selectedGroupIds.size} group`}
              </button>
            </div>
          </div>
        )}

        {/* BƯỚC 3: HOÀN THÀNH */}
        {step === "done" && (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <h3 style={{ color: "var(--success)" }}>Tạo bản nháp thành công!</h3>
            <p>AI đã viết nội dung riêng cho từng group. Vào Dashboard để copy và đăng bài.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setStep("input");
                  setRawText("");
                  handleRemoveFile();
                  setParsed(null);
                  setEditedJob(null);
                }}
                id="btn-parse-another"
              >
                ➕ Phân tích tiếp tin khác
              </button>
              <button className="btn btn-primary btn-lg" onClick={() => router.push("/")} id="btn-go-dashboard">
                ⚡ Vào Dashboard để đăng bài
              </button>
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
