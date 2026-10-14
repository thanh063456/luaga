import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  const { searchParams } = new URL(req.url);
  const trang_thai = searchParams.get("trang_thai");
  const job_post_id = searchParams.get("job_post_id");
  const trang_thai_duyet = searchParams.get("trang_thai_duyet");

  let whereClause: Record<string, any> = {
    ...(trang_thai ? { trang_thai } : {}),
    ...(job_post_id ? { job_post_id } : {}),
    ...(trang_thai_duyet ? { trang_thai_duyet } : {}),
  };

  // Nếu là RECRUITER, xem bản nháp của chính mình hoặc các nhóm mình phụ trách
  if (currentUser && currentUser.role === "RECRUITER") {
    const assignments = await prisma.groupAssignment.findMany({
      where: { user_id: currentUser.id },
      select: { group_id: true },
    });
    const assignedGroupIds = assignments.map((a) => a.group_id);

    whereClause = {
      ...whereClause,
      OR: [
        { user_id: currentUser.id },
        ...(assignedGroupIds.length > 0 ? [{ group_id: { in: assignedGroupIds } }] : []),
      ],
    };
  }

  const drafts = await prisma.postDraft.findMany({
    where: whereClause,
    include: {
      job_post: true,
      group: true,
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { thoi_gian_tao: "desc" },
  });

  return NextResponse.json(drafts);
}
