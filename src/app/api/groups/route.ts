import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  const body = await req.json();
  const group = await prisma.group.create({ data: body });
  return NextResponse.json(group, { status: 201 });
}
