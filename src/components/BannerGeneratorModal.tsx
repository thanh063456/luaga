"use client";
import { useEffect, useRef, useState } from "react";

interface BannerData {
  vi_tri: string;
  cong_ty?: string;
  luong?: string;
  khu_vuc?: string;
  phuc_loi?: string[];
  lien_he?: string;
}

interface BannerGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: BannerData;
}

type TemplateType = "violet" | "blue" | "amber";

export default function BannerGeneratorModal({
  isOpen,
  onClose,
  initialData,
}: BannerGeneratorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [template, setTemplate] = useState<TemplateType>("violet");
  const [title, setTitle] = useState(initialData.vi_tri || "Nhân Viên Tuyển Dụng");
  const [company, setCompany] = useState(initialData.cong_ty || "CÔNG TY TNHH PHÁT TRIỂN");
  const [salary, setSalary] = useState(initialData.luong || "10.000.000 - 15.000.000 VNĐ");
  const [location, setLocation] = useState(initialData.khu_vuc || "Hà Nội / TP.HCM");
  const [benefits, setBenefits] = useState(
    initialData.phuc_loi?.join("\n") ||
      "Thưởng tháng 13 & Lễ Tết hấp dẫn\nĐầy đủ chế độ BHXH, BHYT theo luật\nMôi trường trẻ trung, cơ hội thăng tiến\nĐược đào tạo bài bản từ đầu"
  );
  const [contact, setContact] = useState(initialData.lien_he || "Hotline/Zalo: 0988.xxx.xxx");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialData.vi_tri) setTitle(initialData.vi_tri);
    if (initialData.cong_ty) setCompany(initialData.cong_ty);
    if (initialData.luong) setSalary(initialData.luong);
    if (initialData.khu_vuc) setLocation(initialData.khu_vuc);
    if (initialData.lien_he) setContact(initialData.lien_he);
  }, [initialData]);

  // Vẽ banner lên Canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Kích thước chuẩn tỷ lệ 16:9 chất lượng cao (1200 x 675)
    canvas.width = 1200;
    canvas.height = 675;

    // 1. Nền Gradient
    if (template === "violet") {
      const grad = ctx.createLinearGradient(0, 0, 1200, 675);
      grad.addColorStop(0, "#0f0c29");
      grad.addColorStop(0.5, "#302b63");
      grad.addColorStop(1, "#24243e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 675);

      // Hiệu ứng ánh sáng
      const radial = ctx.createRadialGradient(200, 200, 50, 200, 200, 600);
      radial.addColorStop(0, "rgba(139, 92, 246, 0.45)");
      radial.addColorStop(1, "transparent");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, 1200, 675);
    } else if (template === "blue") {
      const grad = ctx.createLinearGradient(0, 0, 1200, 675);
      grad.addColorStop(0, "#09203f");
      grad.addColorStop(1, "#537895");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 675);

      const radial = ctx.createRadialGradient(1000, 200, 50, 1000, 200, 500);
      radial.addColorStop(0, "rgba(56, 189, 248, 0.35)");
      radial.addColorStop(1, "transparent");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, 1200, 675);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 1200, 675);
      grad.addColorStop(0, "#1f1c18");
      grad.addColorStop(0.5, "#8e0e00");
      grad.addColorStop(1, "#1f1c18");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 675);

      const radial = ctx.createRadialGradient(300, 150, 50, 300, 150, 500);
      radial.addColorStop(0, "rgba(245, 158, 11, 0.4)");
      radial.addColorStop(1, "transparent");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, 1200, 675);
    }

    // Khung trang trí bo góc viền sáng
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 1140, 615);

    // 2. Thẻ "TUYỂN DỤNG GẤP"
    const tagBg =
      template === "violet"
        ? "linear-gradient(to right, #8b5cf6, #ec4899)"
        : template === "blue"
        ? "#0284c7"
        : "#f59e0b";
    ctx.fillStyle = template === "amber" ? "#f59e0b" : template === "blue" ? "#38bdf8" : "#a855f7";
    ctx.font = "bold 18px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillText("🔥 THÔNG BÁO TUYỂN DỤNG CHÍNH THỨC", 60, 85);

    // 3. Tên công ty
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "600 24px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillText(company.toUpperCase(), 60, 125);

    // 4. Tiêu đề Vị trí tuyển dụng (Lớn & Nổi bật)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillText(title, 60, 195);

    // Đường kẻ phân cách
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.moveTo(60, 225);
    ctx.lineTo(800, 225);
    ctx.stroke();

    // 5. Thẻ Lương & Khu vực (Badges)
    // Badge Lương
    ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
    ctx.beginPath();
    ctx.roundRect(60, 250, 380, 54, 10);
    ctx.fill();
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#34d399";
    ctx.font = "bold 22px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillText(`💵 LƯƠNG: ${salary}`, 80, 285);

    // Badge Khu vực
    ctx.fillStyle = "rgba(59, 130, 246, 0.25)";
    ctx.beginPath();
    ctx.roundRect(460, 250, 340, 54, 10);
    ctx.fill();
    ctx.strokeStyle = "#60a5fa";
    ctx.stroke();

    ctx.fillStyle = "#93c5fd";
    ctx.font = "bold 22px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillText(`📍 KHU VỰC: ${location}`, 480, 285);

    // 6. Danh sách Phúc lợi
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillText("✨ QUYỀN LỢI & PHÚC LỢI NỔI BẬT:", 60, 360);

    const benefitList = benefits.split("\n").filter((b) => b.trim().length > 0);
    ctx.font = "400 20px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = "#e2e8f0";

    benefitList.slice(0, 4).forEach((b, idx) => {
      ctx.fillStyle = "#34d399";
      ctx.fillText("✔", 60, 405 + idx * 40);
      ctx.fillStyle = "#f1f5f9";
      ctx.fillText(b.trim(), 90, 405 + idx * 40);
    });

    // 7. Khung Hotline / Liên hệ ở chân Banner
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.roundRect(60, 575, 1080, 52, 10);
    ctx.fill();

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 22px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillText(`📞 ỨNG TUYỂN NGAY: ${contact}`, 90, 608);

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "16px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillText("Nhận việc ngay · Phỏng vấn trực tiếp", 800, 608);
  }, [isOpen, template, title, company, salary, location, benefits, contact]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `banner_${title.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } catch {
      alert("Trình duyệt không cho phép copy ảnh trực tiếp, vui lòng bấm Tải ảnh về máy!");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal"
        style={{ maxWidth: 960, width: "95%", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              🎨 Trình Tạo Banner Tuyển Dụng Facebook Tự Động
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
              Tự động tạo ảnh tuyển dụng sắc nét, thu hút ứng viên gấp 3 lần
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Cột 1: Preview Canvas */}
          <div>
            <div
              style={{
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid var(--border)",
                background: "#000",
                marginBottom: 14,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-primary"
                onClick={handleCopyImage}
                style={{ flex: 1, justifyContent: "center" }}
              >
                {copied ? "✅ Đã copy vào Clipboard!" : "📋 Copy Ảnh"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleDownload}
                style={{ flex: 1, justifyContent: "center" }}
              >
                💾 Tải ảnh PNG
              </button>
            </div>
          </div>

          {/* Cột 2: Tùy biến thông số */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Chọn phong cách mẫu (Template):
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { id: "violet", label: "Tím Neon", color: "#8b5cf6" },
                  { id: "blue", label: "Xanh Doanh Nghiệp", color: "#0284c7" },
                  { id: "amber", label: "Cam Gen Z", color: "#f59e0b" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id as TemplateType)}
                    style={{
                      padding: "8px 6px",
                      borderRadius: 8,
                      border: template === t.id ? `2px solid ${t.color}` : "1px solid var(--border)",
                      background: template === t.id ? `${t.color}25` : "rgba(255,255,255,0.02)",
                      color: template === t.id ? "#fff" : "var(--text-secondary)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ● {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label className="form-label">Tên công ty</label>
                <input
                  className="form-input"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Vị trí tuyển dụng</label>
                <input
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label className="form-label">Mức lương hiển thị</label>
                <input
                  className="form-input"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Khu vực làm việc</label>
                <input
                  className="form-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Quyền lợi (Mỗi dòng 1 ý)</label>
              <textarea
                className="form-textarea"
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                style={{ minHeight: 90, fontSize: 13 }}
              />
            </div>

            <div>
              <label className="form-label">Thông tin liên hệ</label>
              <input
                className="form-input"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
