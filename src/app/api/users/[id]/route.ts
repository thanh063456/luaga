import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    return NextResponse.json({ error: "Không có quyền thực hiện thao tác này" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const { name, role, trang_thai, password, groupIds } = body;

    // Trưởng nhóm chỉ được phân công nhóm, không được sửa quyền/mật khẩu
    if (currentUser.role === "MANAGER") {
      if (name || role || trang_thai || password) {
        return NextResponse.json(
          { error: "Trưởng nhóm chỉ có quyền phân công nhóm Facebook cho nhân sự" },
          { status: 403 }
        );
      }
    }

    const data: Record<string, any> = {};
    if (name) data.name = name.trim();
    if (role) data.role = role;
    if (trang_thai) data.trang_thai = trang_thai;
    if (body.ai_quota_per_day !== undefined && currentUser.role === "ADMIN") {
      data.ai_quota_per_day = Number(body.ai_quota_per_day) || 50;
    }
    if (password && password.trim().length >= 6) {
      data.password = hashPassword(password.trim());
    }

    // Cập nhật phân công nhóm nếu có groupIds
    if (Array.isArray(groupIds)) {
      await prisma.groupAssignment.deleteMany({ where: { user_id: id } });
      if (groupIds.length > 0) {
        await prisma.groupAssignment.createMany({
          data: groupIds.map((gid: string) => ({
            user_id: id,
            group_id: gid,
          })),
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        trang_thai: true,
        updatedAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: currentUser.id,
        hanh_dong: "UPDATE_USER",
        chi_tiet: `Cập nhật tài khoản ${updatedUser.email}`,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Lỗi cập nhật người dùng" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Chỉ Quản trị viên (Admin) mới có quyền xóa tài khoản" }, { status: 403 });
  }

  const { id } = await params;
  if (id === currentUser.id) {
    return NextResponse.json({ error: "Không thể tự xóa tài khoản của chính mình" }, { status: 400 });
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        user_id: currentUser.id,
        hanh_dong: "DELETE_USER",
        chi_tiet: `Xóa tài khoản ${targetUser.email}`,
      },
    });

    return NextResponse.json({ success: true, message: "Đã xóa tài khoản" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Lỗi xóa người dùng" }, { status: 500 });
  }
}
