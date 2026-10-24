import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkAndIncrementAiQuota } from "@/lib/auth";
import { rewriteJobPost, checkBlacklistWords } from "@/lib/ollama";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser(req);
  const body = await req.json();

  const currentDraft = await prisma.postDraft.findUnique({
    where: { id },
    include: { group: true, job_post: true },
  });

  if (!currentDraft) {
    return NextResponse.json({ error: "Bản nháp không tồn tại" }, { status: 404 });
  }

  // Yêu cầu viết lại bằng AI với tone mới
  if (body.action === "rewrite") {
    // Kiểm tra hạn ngạch AI của người dùng
    const quotaCheck = await checkAndIncrementAiQuota(currentUser?.id);
    if (!quotaCheck.allowed) {
      return NextResponse.json({ error: quotaCheck.error }, { status: 429 });
    }
    const tone = body.tone || currentDraft.tone || "tu_nhien";
    const jobInfo = `Vị trí: ${currentDraft.job_post.vi_tri_tuyen}
Khu vực: ${currentDraft.job_post.khu_vuc}
Mô tả công việc: ${currentDraft.job_post.mo_ta_cong_viec}
Yêu cầu: ${currentDraft.job_post.yeu_cau}
Mức lương: ${currentDraft.job_post.muc_luong}
Thông tin liên hệ: ${currentDraft.job_post.thong_tin_lien_he}`;

    try {
      const newContent = await rewriteJobPost(
        jobInfo,
        currentDraft.group.ten_group,
        currentDraft.group.ghi_chu,
        tone
      );

      const updated = await prisma.postDraft.update({
        where: { id },
        data: {
          noi_dung_ai_viet: newContent,
          tone,
          trang_thai_duyet: "pending",
        },
        include: { group: true, job_post: true },
      });

      const blacklist = checkBlacklistWords(newContent);

      return NextResponse.json({
        draft: updated,
        blacklistWarnings: blacklist.found,
        message: "Ollama đã viết lại bài thành công",
      });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || "Lỗi viết lại bằng AI" }, { status: 500 });
    }
  }

  // Duyệt bài (Chỉ ADMIN và MANAGER)
  if (body.trang_thai_duyet && body.trang_thai_duyet !== currentDraft.trang_thai_duyet) {
    if (currentUser && currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER") {
      return NextResponse.json({ error: "Chỉ Quản trị viên hoặc Trưởng nhóm mới có quyền duyệt bài" }, { status: 403 });
    }
    body.duyet_boi = currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin";
  }

  const updateData: Record<string, any> = { ...body };
  delete updateData.action;

  const draft = await prisma.postDraft.update({
    where: { id },
    data: updateData,
    include: { group: true, job_post: true },
  });

  const blacklist = checkBlacklistWords(draft.noi_dung_ai_viet);

  return NextResponse.json({
    draft,
    blacklistWarnings: blacklist.found,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser(req);
  if (currentUser && currentUser.role === "VIEWER") {
    return NextResponse.json({ error: "Bạn không có quyền xóa bản nháp" }, { status: 403 });
  }

  await prisma.postDraft.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
