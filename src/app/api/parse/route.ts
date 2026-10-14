import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTextWithOllama, getOllamaConfig } from "@/lib/ollama";
import * as mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawText = (formData.get("rawText") as string) || "";
    const file = formData.get("file") as File | null;

    let textToAnalyze = rawText;
    let base64Image: string | null = null;

    // 1. Xử lý file nếu được tải lên
    if (file) {
      const mimeType = file.type;
      const buffer = Buffer.from(await file.arrayBuffer());

      if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      ) {
        // Đọc nội dung file Word (.docx)
        try {
          const result = await mammoth.extractRawText({ buffer });
          const docxText = result.value || "";
          textToAnalyze = textToAnalyze
            ? `${textToAnalyze}\n\n[Nội dung từ file Word ${file.name}]:\n${docxText}`
            : docxText;
        } catch (docxErr) {
          console.error("Lỗi đọc file Word:", docxErr);
          return NextResponse.json(
            { error: "Không thể đọc file Word (.docx). File có thể bị lỗi." },
            { status: 400 }
          );
        }
      } else if (mimeType.startsWith("image/")) {
        base64Image = buffer.toString("base64");
      } else {
        return NextResponse.json(
          { error: "Định dạng file không hỗ trợ. Chỉ hỗ trợ file ảnh hoặc file Word (.docx)." },
          { status: 400 }
        );
      }
    }

    if (!textToAnalyze.trim() && !base64Image) {
      return NextResponse.json(
        { error: "Vui lòng nhập văn bản hoặc tải lên file Word/ảnh để phân tích." },
        { status: 400 }
      );
    }

    // 2. Lấy danh sách JobTemplate đã lưu
    const templates = await prisma.jobTemplate.findMany();
    const templatesText =
      templates.length > 0
        ? templates
            .map(
              (t, i) =>
                `${i + 1}. Công ty: "${t.ten_cong_ty}", Vị trí: "${t.vi_tri_tuyen}", Khu vực: "${t.khu_vuc}", Lương: "${t.muc_luong}", Liên hệ: "${t.thong_tin_lien_he}", Mô tả: "${t.mo_ta_cong_viec}", Yêu cầu: "${t.yeu_cau}"`
            )
            .join("\n")
        : "Chưa có mẫu nào lưu trong hệ thống.";

    // 3. Xây dựng prompt phân tích tuyển dụng
    const prompt = `Bạn là trợ lý AI chuyên phân tích tin tuyển dụng chuyên nghiệp. Hãy đọc thông tin tuyển dụng dưới đây và trích xuất thông tin cấu trúc chuẩn JSON.

DANH SÁCH MẪU CÔNG VIỆC ĐÃ LƯU:
${templatesText}

${base64Image ? "Lưu ý: Có hình ảnh tin tuyển dụng đính kèm." : ""}
VĂN BẢN TUYỂN DỤNG CẦN PHÂN TÍCH:
"""
${textToAnalyze || "Xem hình ảnh tuyển dụng được cung cấp"}
"""

YÊU CẦU:
1. Đối chiếu xem có khớp Công ty và Vị trí của mẫu nào đã lưu ở trên không.
   - Nếu khớp: Lấy dữ liệu chuẩn từ mẫu đó, giữ nguyên tên khu_vuc từ mẫu.
   - Nếu không khớp: Tự động trích xuất đầy đủ từ văn bản.
2. Với "khu_vuc": Nếu không rõ, hãy ghi "Toàn quốc".
3. TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON sau:
{
  "ten_cong_ty": "Tên công ty",
  "vi_tri_tuyen": "Tên vị trí tuyển dụng",
  "khu_vuc": "Tỉnh/thành phố hoặc khu công nghiệp",
  "mo_ta_cong_viec": "Mô tả công việc",
  "yeu_cau": "Yêu cầu ứng viên",
  "muc_luong": "Mức lương",
  "thong_tin_lien_he": "Số điện thoại, Zalo, Email...",
  "ngay_dang": "",
  "is_from_template": false,
  "ten_cong_ty_khop": "",
  "do_tin_cay": "cao",
  "ghi_chu_phan_tich": "Ghi chú ngắn gọn"
}`;

    const config = await getOllamaConfig();

    let rawOutput: string;
    try {
      rawOutput = await generateTextWithOllama({
        prompt,
        format: "json",
        images: base64Image ? [base64Image] : undefined,
      });
    } catch (ollamaErr: any) {
      // Nếu model hiện tại không hỗ trợ image (ví dụ qwen2.5 text), thử gọi không kèm image nếu có text
      if (base64Image && textToAnalyze.trim()) {
        rawOutput = await generateTextWithOllama({
          prompt: `Phân tích nội dung sau thành JSON tuyển dụng:\n${textToAnalyze}`,
          format: "json",
        });
      } else {
        throw ollamaErr;
      }
    }

    // Parse JSON
    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Ollama không thể trích xuất được định dạng JSON từ văn bản này." },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.vi_tri_tuyen) {
      return NextResponse.json(
        { error: "Không tìm thấy vị trí tuyển dụng nào trong văn bản được cung cấp." },
        { status: 422 }
      );
    }

    // Tìm các group phù hợp với khu vực
    const allGroups = await prisma.group.findMany({ where: { trang_thai: "active" } });
    const normalize = (s: string) => (s || "").toLowerCase().trim();

    const matchedGroups = allGroups.filter((g) => {
      const jk = normalize(parsed.khu_vuc);
      const gk = normalize(g.khu_vuc);
      if (gk === "toàn quốc" || gk === "toan quoc" || jk === "toàn quốc" || jk === "toan quoc") return true;
      if (jk === gk || jk.includes(gk) || gk.includes(jk)) return true;
      return false;
    });

    return NextResponse.json({
      parsed,
      matchedGroups,
      totalGroups: allGroups.length,
      modelUsed: config.model,
    });
  } catch (err: any) {
    console.error("Parse error:", err);
    return NextResponse.json(
      { error: err?.message || "Lỗi xử lý AI Ollama" },
      { status: 500 }
    );
  }
}
