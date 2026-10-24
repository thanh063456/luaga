import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      trang_thai: true,
      ai_quota_per_day: true,
      ai_used_today: true,
      createdAt: true,
      _count: {
        select: {
          drafts: true,
          assignments: true,
        },
      },
      assignments: {
        include: {
          group: {
            select: { id: true, ten_group: true, khu_vuc: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Chỉ Quản trị viên (Admin) mới có quyền tạo tài khoản" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, name, password, role = "RECRUITER", groupIds = [], ai_quota_per_day = 50 } = body;

    if (!email || !name || !password) {
      return NextResponse.json({ error: "Vui lòng điền đủ Email, Họ tên và Mật khẩu" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email này đã được sử dụng" }, { status: 400 });
    }

    const validRoles = ["ADMIN", "MANAGER", "RECRUITER", "VIEWER"];
    const finalRole = validRoles.includes(role) ? role : "RECRUITER";

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name.trim(),
        password: hashPassword(password),
        role: finalRole,
        trang_thai: "active",
        ai_quota_per_day: Number(ai_quota_per_day) || 50,
        assignments: {
          create: groupIds.map((groupId: string) => ({
            group: { connect: { id: groupId } },
          })),
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        trang_thai: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: currentUser.id,
        hanh_dong: "CREATE_USER",
        chi_tiet: `Tạo tài khoản ${newUser.email} với quyền ${newUser.role}`,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Lỗi tạo tài khoản" }, { status: 500 });
  }
}
