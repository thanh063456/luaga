import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkAndIncrementAiQuota } from "@/lib/auth";
import { generatePostVariations } from "@/lib/ollama";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(req);
    if (currentUser?.role === "VIEWER") {
      return NextResponse.json({ error: "Cộng tác viên (Chỉ xem) không có quyền sinh biến thể" }, { status: 403 });
    }

    const quotaCheck = await checkAndIncrementAiQuota(currentUser?.id);
    if (!quotaCheck.allowed) {
      return NextResponse.json({ error: quotaCheck.error }, { status: 429 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const count = Number(body.count) || 3;
    const tone = body.tone || "tu_nhien";

    const draft = await prisma.postDraft.findUnique({
      where: { id },
      include: {
        job_post: true,
        group: true,
      },
    });

    if (!draft) {
      return NextResponse.json({ error: "Không tìm thấy bản nháp" }, { status: 404 });
    }

    const jobInfo = `Vị trí: ${draft.job_post.vi_tri_tuyen}
Khu vực: ${draft.job_post.khu_vuc}
Công ty: ${draft.job_post.ten_cong_ty}
Mô tả công việc: ${draft.job_post.mo_ta_cong_viec}
Yêu cầu: ${draft.job_post.yeu_cau}
Mức lương: ${draft.job_post.muc_luong}
Thông tin liên hệ: ${draft.job_post.thong_tin_lien_he}`;

    const variations = await generatePostVariations({
      jobInfo,
      groupName: draft.group.ten_group,
      groupRules: draft.group.ghi_chu,
      toneKey: tone,
      count,
    });

    return NextResponse.json({
      success: true,
      draftId: id,
      variations,
    });
  } catch (err: any) {
    console.error("Lỗi sinh biến thể bài viết:", err);
    return NextResponse.json({ error: err?.message || "Lỗi tạo biến thể bài viết" }, { status: 500 });
  }
}
