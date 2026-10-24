import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManagerOrAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const khu_vuc = searchParams.get("khu_vuc");
  const trang_thai = searchParams.get("trang_thai");

  const groups = await prisma.group.findMany({
    where: {
      ...(khu_vuc ? { khu_vuc: { contains: khu_vuc } } : {}),
      ...(trang_thai ? { trang_thai } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser || !isManagerOrAdmin(currentUser.role)) {
    return NextResponse.json(
      { error: "Chỉ Quản trị viên (Admin) hoặc Trưởng nhóm (Manager) mới có quyền tạo Group" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const group = await prisma.group.create({ data: body });
  return NextResponse.json(group, { status: 201 });
}
