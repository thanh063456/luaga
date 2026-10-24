import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Chỉ Quản trị viên (Admin) mới có quyền truy cập bản sao lưu" }, { status: 403 });
    }

    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: "Không tìm thấy tệp CSDL dev.db" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    const stats = fs.statSync(dbPath);
    const backupsDir = path.join(process.cwd(), "prisma", "backups");
    let backupFiles: { name: string; size: number; createdAt: string }[] = [];

    if (fs.existsSync(backupsDir)) {
      backupFiles = fs.readdirSync(backupsDir)
        .filter((f) => f.endsWith(".db") || f.endsWith(".sqlite"))
        .map((f) => {
          const s = fs.statSync(path.join(backupsDir, f));
          return {
            name: f,
            size: s.size,
            createdAt: s.mtime.toISOString(),
          };
        })
        .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    }

    if (action === "download") {
      const fileBuffer = fs.readFileSync(dbPath);
      const dateStr = new Date().toISOString().slice(0, 10);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Disposition": `attachment; filename="dev-backup-${dateStr}.sqlite"`,
          "Content-Type": "application/x-sqlite3",
        },
      });
    }

    return NextResponse.json({
      database: {
        path: "prisma/dev.db",
        size: stats.size,
        updatedAt: stats.mtime.toISOString(),
      },
      backups: backupFiles,
    });
  } catch (err: any) {
    console.error("Lỗi sao lưu CSDL:", err);
    return NextResponse.json({ error: err?.message || "Lỗi xử lý sao lưu CSDL" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Chỉ Quản trị viên (Admin) mới có quyền tạo bản sao lưu" }, { status: 403 });
    }

    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: "Không tìm thấy tệp CSDL dev.db để sao lưu" }, { status: 404 });
    }

    const backupsDir = path.join(process.cwd(), "prisma", "backups");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `dev-snapshot-${timestamp}.sqlite`;
    const targetPath = path.join(backupsDir, backupFileName);

    fs.copyFileSync(dbPath, targetPath);
    const stats = fs.statSync(targetPath);

    // Ghi nhật ký kiểm toán
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        hanh_dong: "BACKUP_DATABASE",
        chi_tiet: `Tạo bản sao lưu CSDL: ${backupFileName} (${(stats.size / 1024).toFixed(1)} KB)`,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Đã tạo bản sao lưu ${backupFileName} thành công!`,
      backup: {
        name: backupFileName,
        size: stats.size,
        createdAt: stats.mtime.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Lỗi tạo bản sao lưu:", err);
    return NextResponse.json({ error: err?.message || "Lỗi tạo bản sao lưu" }, { status: 500 });
  }
}
