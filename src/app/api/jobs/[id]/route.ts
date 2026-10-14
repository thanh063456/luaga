import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Xóa tất cả các bản nháp (drafts) liên quan đến tin tuyển dụng này để đảm bảo toàn vẹn khóa ngoại
    await prisma.postDraft.deleteMany({
      where: { job_post_id: id },
    });

    // Xóa bản ghi tin tuyển dụng (JobPost)
    await prisma.jobPost.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Đã xóa tin tuyển dụng thành công!" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi không xác định";
    console.error("Lỗi xóa tin tuyển dụng:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
