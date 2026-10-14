import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const AUTH_COOKIE_NAME = "fb_job_auth_token";
const SESSION_EXPIRY_DAYS = 7;
const JWT_SECRET = process.env.AUTH_SECRET || "fb-job-poster-secure-auth-secret-key-2025";

export interface AuthSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string; // "ADMIN" | "MANAGER" | "RECRUITER" | "VIEWER"
  exp: number;
}

// Hàm băm mật khẩu chuẩn PBKDF2 (an toàn tuyệt đối, không phụ thuộc package ngoài)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(":");
    if (!salt || !originalHash) return false;
    const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(testHash, "hex"), Buffer.from(originalHash, "hex"));
  } catch {
    return false;
  }
}

// Ký token bảo mật
export function createToken(payload: AuthSessionPayload): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${data}`)
    .digest("base64url");
  return `${header}.${data}.${signature}`;
}

// Giải mã và kiểm tra token
export function verifyToken(token: string): AuthSessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${data}`)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const payload: AuthSessionPayload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (payload.exp < Date.now()) return null; // Token hết hạn

    return payload;
  } catch {
    return null;
  }
}

// Lấy thông tin user hiện tại từ Cookie trong API Route hoặc Server Component
export async function getCurrentUser(req?: NextRequest) {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      return null;
    }
  }

  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      trang_thai: true,
    },
  });

  if (!user || user.trang_thai !== "active") return null;
  return user;
}

// Đảm bảo luôn có ít nhất 1 tài khoản Admin mặc định khi khởi chạy
export async function ensureDefaultAdmin() {
  const count = await prisma.user.count();
  if (count === 0) {
    const adminPassword = hashPassword("admin123");
    await prisma.user.create({
      data: {
        email: "admin@gmail.com",
        name: "Quản trị viên (Admin)",
        password: adminPassword,
        role: "ADMIN",
        trang_thai: "active",
      },
    });
    console.log("Đã khởi tạo tài khoản quản trị mặc định: admin@gmail.com / admin123");
  }
}

export { AUTH_COOKIE_NAME, SESSION_EXPIRY_DAYS };
