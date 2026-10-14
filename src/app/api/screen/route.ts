import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTextWithOllama } from "@/lib/ollama";
import * as mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobPostId = searchParams.get("job_post_id");

  const screenings = await prisma.candidateScreening.findMany({
    where: jobPostId ? { job_post_id: jobPostId } : {},
    include: {
      job_post: {
        select: { id: true, vi_tri_tuyen: true, ten_cong_ty: true, khu_vuc: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(screenings);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const jobPostId = (formData.get("jobPostId") as string) || "";
    const rawText = (formData.get("rawText") as string) || "";
    const file = formData.get("file") as File | null;
    const candidateName = (formData.get("candidateName") as string) || "";

    if (!jobPostId) {
      return NextResponse.json({ error: "Vui lòng chọn vị trí tuyển dụng để đối chiếu CV" }, { status: 400 });
    }

    const job = await prisma.jobPost.findUnique({ where: { id: jobPostId } });
    if (!job) {
      return NextResponse.json({ error: "Không tìm thấy thông tin tin tuyển dụng" }, { status: 404 });
    }

    let cvText = rawText;
    let fileName = "";

    if (file) {
      fileName = file.name;
      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type;

      if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      ) {
        try {
          const docxResult = await mammoth.extractRawText({ buffer });
          cvText = docxResult.value || "";
        } catch (err: any) {
          return NextResponse.json({ error: "Không thể đọc file Word (.docx): " + err.message }, { status: 400 });
        }
      } else if (mimeType === "application/pdf" || file.name.endsWith(".pdf")) {
        try {
          const parser = new PDFParse({ data: buffer });
          const pdfResult = await parser.getText();
          cvText = pdfResult.text || "";
          await parser.destroy().catch(() => {});
        } catch (err: any) {
          return NextResponse.json({ error: "Không thể đọc file PDF: " + err.message }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: "Chỉ hỗ trợ file CV định dạng .docx hoặc .pdf" }, { status: 400 });
      }
    }

    if (!cvText.trim()) {
      return NextResponse.json({ error: "Nội dung CV trống hoặc không thể trích xuất văn bản" }, { status: 400 });
    }

    // Xây dựng prompt cho Ollama chấm điểm
    const jdDetails = `Vị trí tuyển dụng: ${job.vi_tri_tuyen}
Công ty: ${job.ten_cong_ty}
Khu vực: ${job.khu_vuc}
Mô tả công việc: ${job.mo_ta_cong_viec}
Yêu cầu ứng viên: ${job.yeu_cau}
Mức lương: ${job.muc_luong}`;

    const prompt = `Bạn là Trưởng phòng Nhân sự và chuyên gia phỏng vấn chuyên nghiệp. Hãy so sánh, đánh giá chi tiết độ phù hợp giữa CV của ứng viên và Bản mô tả công việc (JD).

--- BẢN MÔ TẢ CÔNG VIỆC (JD):
${jdDetails}

--- NỘI DUNG CV ỨNG VIÊN:
${cvText}

--- YÊU CẦU ĐÁNH GIÁ:
1. Trích xuất tên ứng viên nếu có trong CV.
2. Chấm điểm độ phù hợp từ 0 đến 100 điểm (match_score).
3. Đưa ra đánh giá tổng quát: "phu_hop" (nếu >= 75 điểm), "can_nhac" (từ 50 - 74 điểm), "khong_phu_hop" (< 50 điểm).
4. Liệt kê 3 - 4 ưu điểm nổi bật của ứng viên đối với vị trí này.
5. Liệt kê 2 - 3 điểm còn thiếu, hạn chế hoặc rủi ro cần cân nhắc.
6. Đề xuất 3 câu hỏi phỏng vấn thực chiến chuyên sâu và sắc bén nhất để người phỏng vấn kiểm tra ứng viên này.
7. Tóm tắt nhận xét ngắn gọn trong 2 câu.

TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON sau:
{
  "ten_ung_vien": "${candidateName || "Họ và tên ứng viên trích xuất từ CV"}",
  "match_score": 85,
  "danh_gia": "phu_hop",
  "uu_diem": ["Ưu điểm 1", "Ưu điểm 2", "Ưu điểm 3"],
  "nhuoc_diem": ["Điểm còn thiếu 1", "Điểm còn thiếu 2"],
  "cau_hoi_phong_van": ["Câu hỏi 1", "Câu hỏi 2", "Câu hỏi 3"],
  "tom_tat": "Tóm tắt nhận định chung"
}`;

    const rawResponse = await generateTextWithOllama({
      prompt,
      format: "json",
    });

    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Ollama không thể trích xuất JSON đánh giá" }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Lưu vào CSDL
    const screening = await prisma.candidateScreening.create({
      data: {
        job_post_id: job.id,
        ten_ung_vien: candidateName || parsed.ten_ung_vien || "Ứng viên",
        file_name: fileName,
        match_score: Number(parsed.match_score) || 0,
        danh_gia: parsed.danh_gia || "can_nhac",
        uu_diem: JSON.stringify(parsed.uu_diem || []),
        nhuoc_diem: JSON.stringify(parsed.nhuoc_diem || []),
        cau_hoi_phong_van: JSON.stringify(parsed.cau_hoi_phong_van || []),
        tom_tat: parsed.tom_tat || "",
      },
      include: {
        job_post: true,
      },
    });

    return NextResponse.json({
      success: true,
      screening: {
        ...screening,
        uu_diem: parsed.uu_diem || [],
        nhuoc_diem: parsed.nhuoc_diem || [],
        cau_hoi_phong_van: parsed.cau_hoi_phong_van || [],
      },
    });
  } catch (err: any) {
    console.error("Screening error:", err);
    return NextResponse.json({ error: err?.message || "Lỗi xử lý đánh giá CV" }, { status: 500 });
  }
}
