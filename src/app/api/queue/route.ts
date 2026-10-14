import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Khung giờ vàng đăng bài tuyển dụng Facebook
const GOLDEN_HOURS = {
  sang: { hour: 8, minute: 30, label: "🌅 Sáng (08:30)" },
  trua: { hour: 12, minute: 0, label: "☀️ Trưa (12:00)" },
  chieu: { hour: 17, minute: 0, label: "🌇 Chiều (17:00)" },
  toi: { hour: 20, minute: 0, label: "🌙 Tối (20:00)" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trang_thai = searchParams.get("trang_thai") || "waiting";

  const queueItems = await prisma.postScheduleQueue.findMany({
    where: trang_thai !== "all" ? { trang_thai } : {},
    include: {
      draft: {
        include: {
          job_post: true,
          group: true,
        },
      },
    },
    orderBy: { thoi_gian_du_kien: "asc" },
  });

  return NextResponse.json(queueItems);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { draftIds = [], khungGio = "sang", delayMinutes = 10 } = body;

    if (!Array.isArray(draftIds) || draftIds.length === 0) {
      return NextResponse.json({ error: "Vui lòng chọn ít nhất 1 bài nháp" }, { status: 400 });
    }

    const targetTimeSetting = GOLDEN_HOURS[khungGio as keyof typeof GOLDEN_HOURS] || GOLDEN_HOURS.sang;

    // Tính toán mốc thời gian bắt đầu
    const now = new Date();
    let startTime = new Date();
    startTime.setHours(targetTimeSetting.hour, targetTimeSetting.minute, 0, 0);

    // Nếu giờ đã qua trong ngày hôm nay, xếp lịch cho ngày mai
    if (startTime.getTime() <= now.getTime()) {
      startTime.setDate(startTime.getDate() + 1);
    }

    const createdItems = [];

    for (let i = 0; i < draftIds.length; i++) {
      const draftId = draftIds[i];

      // Thêm jitter ngẫu nhiên từ 1 - 4 phút để trông như người dùng thật
      const randomJitter = Math.floor(Math.random() * 4);
      const scheduledTime = new Date(startTime.getTime() + (i * delayMinutes + randomJitter) * 60 * 1000);

      const item = await prisma.postScheduleQueue.create({
        data: {
          draft_id: draftId,
          thoi_gian_du_kien: scheduledTime,
          khung_gio: khungGio,
          trang_thai: "waiting",
          ghi_chu: `Giãn cách ${delayMinutes} phút (chống spam)`,
        },
      });
      createdItems.push(item);
    }

    return NextResponse.json({
      success: true,
      count: createdItems.length,
      message: `Đã xếp ${createdItems.length} bài vào hàng đợi khung giờ ${targetTimeSetting.label}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Lỗi tạo hàng đợi" }, { status: 500 });
  }
}
