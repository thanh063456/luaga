import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const ALLOWED_KEYS = [
  "ollama_base_url",
  "ollama_model",
  "system_prompt",
  "google_service_account_json",
  "google_spreadsheet_id",
  "google_sheet_name",
];

export async function GET() {
  const settings = await prisma.setting.findMany();
  const result: Record<string, string> = {
    ollama_base_url: "http://localhost:11434",
    ollama_model: "qwen2.5:7b",
  };
  for (const s of settings) {
    result[s.key] = s.value;
  }
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  if (currentUser && currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER") {
    return NextResponse.json({ error: "Chỉ Admin và Quản lý mới có quyền cập nhật Cài đặt" }, { status: 403 });
  }

  const body: Record<string, string> = await req.json();
  const updated: string[] = [];

  for (const key of ALLOWED_KEYS) {
    if (key in body) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: body[key] },
        create: { key, value: body[key] },
      });
      updated.push(key);
    }
  }

  if (currentUser) {
    await prisma.auditLog.create({
      data: {
        user_id: currentUser.id,
        hanh_dong: "UPDATE_SETTINGS",
        chi_tiet: `Cập nhật cấu hình: ${updated.join(", ")}`,
      },
    });
  }

  return NextResponse.json({ updated });
}
