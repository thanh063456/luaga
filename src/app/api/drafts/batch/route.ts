import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManagerOrAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !isManagerOrAdmin(currentUser.role)) {
      return NextResponse.json(
        { error: "Chỉ Quản trị viên hoặc Trưởng nhóm mới có quyền duyệt/từ chối bài hàng loạt" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { draftIds, action, note } = body;

    if (!Array.isArray(draftIds) || draftIds.length === 0) {
      return NextResponse.json({ error: "Vui lòng chọn ít nhất 1 bài viết để xử lý" }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Hành động không hợp lệ (chỉ chấp nhận 'approve' hoặc 'reject')" }, { status: 400 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    const approverName = `${currentUser.name} (${currentUser.role})`;

    const result = await prisma.postDraft.updateMany({
      where: {
        id: { in: draftIds },
      },
      data: {
        trang_thai_duyet: newStatus,
        duyet_boi: approverName,
        ghi_chu_duyet: note || (action === "approve" ? "Đã duyệt hàng loạt" : "Từ chối duyệt hàng loạt"),
      },
    });

    // Ghi nhật ký kiểm toán
    await prisma.auditLog.create({
      data: {
        user_id: currentUser.id,
        hanh_dong: action === "approve" ? "BATCH_APPROVE_DRAFTS" : "BATCH_REJECT_DRAFTS",
        chi_tiet: `${action === "approve" ? "Duyệt" : "Từ chối"} ${result.count} bài viết hàng loạt. Ghi chú: ${note || "Không có"}`,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      count: result.count,
      status: newStatus,
      message: `Đã ${action === "approve" ? "duyệt" : "từ chối"} thành công ${result.count} bài viết!`,
    });
  } catch (err: any) {
    console.error("Lỗi duyệt bài hàng loạt:", err);
    return NextResponse.json({ error: err?.message || "Lỗi xử lý duyệt bài hàng loạt" }, { status: 500 });
  }
}
