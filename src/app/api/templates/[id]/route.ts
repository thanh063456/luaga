import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManagerOrAdmin } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !isManagerOrAdmin(currentUser.role)) {
      return NextResponse.json(
        { error: "Chỉ Quản trị viên hoặc Trưởng nhóm mới có quyền sửa mẫu công việc" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const template = await prisma.jobTemplate.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(template);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !isManagerOrAdmin(currentUser.role)) {
      return NextResponse.json(
        { error: "Chỉ Quản trị viên hoặc Trưởng nhóm mới có quyền xóa mẫu công việc" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await prisma.jobTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
