import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  if (currentUser && currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER") {
    return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
  }

  const testMessage = `🎉 <b>[FB Job Poster] KẾT NỐI TELEGRAM THÀNH CÔNG!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `✅ Hệ thống đã liên kết thành công với Telegram của bạn.\n` +
    `👤 <b>Người thử nghiệm:</b> ${currentUser?.name || "Quản trị viên"}\n` +
    `⏰ <b>Thời gian:</b> ${new Date().toLocaleTimeString("vi-VN")} ${new Date().toLocaleDateString("vi-VN")}\n\n` +
    `<i>Từ bây giờ, hệ thống sẽ tự động gửi thông báo khi có bài viết mới cần duyệt hoặc khi đến khung Giờ Vàng!</i>`;

  const result = await sendTelegramMessage(testMessage);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: "Đã gửi tin nhắn thử nghiệm thành công tới Telegram!" });
}
