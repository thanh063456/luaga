import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canPerformActions } from "@/lib/auth";

export async function GET() {
  const templates = await prisma.jobTemplate.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !canPerformActions(currentUser.role)) {
      return NextResponse.json(
        { error: "Bạn không có quyền lưu mẫu công việc" },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.ten_cong_ty || !body.vi_tri_tuyen || !body.khu_vuc) {
      return NextResponse.json({ error: "Tên công ty, vị trí tuyển và khu vực là bắt buộc." }, { status: 400 });
    }

    const template = await prisma.jobTemplate.upsert({
      where: {
        ten_cong_ty_vi_tri_tuyen: {
          ten_cong_ty: body.ten_cong_ty,
          vi_tri_tuyen: body.vi_tri_tuyen,
        },
      },
      update: body,
      create: body,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
