import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [drafts, total] = await Promise.all([
    prisma.postDraft.findMany({
      where: { trang_thai: "posted" },
      include: { job_post: true, group: true },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.postDraft.count({ where: { trang_thai: "posted" } }),
  ]);

  return NextResponse.json({ drafts, total, page, limit });
}
