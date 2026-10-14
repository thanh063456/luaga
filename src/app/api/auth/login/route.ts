import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ensureDefaultAdmin,
  verifyPassword,
  createToken,
  AUTH_COOKIE_NAME,
  SESSION_EXPIRY_DAYS,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await ensureDefaultAdmin();

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ Email và Mật khẩu" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    if (user.trang_thai !== "active") {
      return NextResponse.json(
        { error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin." },
        { status: 403 }
      );
    }

    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    const exp = Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const token = createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      exp,
    });

    // Ghi audit log
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        hanh_dong: "LOGIN",
        chi_tiet: `Đăng nhập thành công từ ${req.headers.get("user-agent") || "trình duyệt"}`,
        ip_address: req.headers.get("x-forwarded-for") || "localhost",
      },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi trong quá trình đăng nhập" },
      { status: 500 }
    );
  }
}
