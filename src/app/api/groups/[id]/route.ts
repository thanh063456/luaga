import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManagerOrAdmin } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser || !isManagerOrAdmin(currentUser.role)) {
    return NextResponse.json(
      { error: "Chỉ Quản trị viên hoặc Trưởng nhóm mới có quyền sửa Group" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await req.json();
  const group = await prisma.group.update({ where: { id }, data: body });
  return NextResponse.json(group);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser || !isManagerOrAdmin(currentUser.role)) {
    return NextResponse.json(
      { error: "Chỉ Quản trị viên hoặc Trưởng nhóm mới có quyền xóa Group" },
      { status: 403 }
    );
  }

  const { id } = await params;
  await prisma.group.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

