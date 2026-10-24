import { prisma } from "./prisma";

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  notifyPending: boolean;
  notifyQueue: boolean;
}

export async function getTelegramConfig(): Promise<TelegramConfig> {
  const [tokenSetting, chatSetting, pendingSetting, queueSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "telegram_bot_token" } }),
    prisma.setting.findUnique({ where: { key: "telegram_chat_id" } }),
    prisma.setting.findUnique({ where: { key: "telegram_notify_pending" } }),
    prisma.setting.findUnique({ where: { key: "telegram_notify_queue" } }),
  ]);

  return {
    botToken: tokenSetting?.value?.trim() || process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: chatSetting?.value?.trim() || process.env.TELEGRAM_CHAT_ID || "",
    notifyPending: pendingSetting?.value !== "false", // Mặc định bật nếu có token
    notifyQueue: queueSetting?.value !== "false",
  };
}

export async function sendTelegramMessage(text: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getTelegramConfig();
    if (!config.botToken || !config.chatId) {
      return { success: false, error: "Chưa cấu hình Telegram Bot Token hoặc Chat ID trong Cài đặt" };
    }

    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { success: false, error: data.description || `Lỗi HTTP ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Lỗi kết nối Telegram" };
  }
}

// Thông báo khi có bài viết mới cần duyệt
export async function notifyDraftsPendingApproval(options: {
  count: number;
  jobTitle: string;
  creatorName?: string;
  company?: string;
}): Promise<void> {
  const config = await getTelegramConfig();
  if (!config.botToken || !config.chatId || !config.notifyPending) return;

  const msg = `📢 <b>[FB Job Poster] BÀI VIẾT MỚI CHỜ DUYỆT</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💼 <b>Vị trí:</b> ${options.jobTitle}\n` +
    (options.company ? `🏢 <b>Công ty:</b> ${options.company}\n` : "") +
    `👤 <b>Người tạo:</b> ${options.creatorName || "Tuyển dụng viên"}\n` +
    `📝 <b>Số lượng bản nháp:</b> ${options.count} bài\n` +
    `⏰ <b>Thời gian:</b> ${new Date().toLocaleTimeString("vi-VN")} ${new Date().toLocaleDateString("vi-VN")}\n\n` +
    `👉 <i>Vui lòng đăng nhập Dashboard để phê duyệt bài đăng trước khi đăng lên Group Facebook.</i>`;

  await sendTelegramMessage(msg);
}

// Thông báo nhắc nhở khung giờ vàng
export async function notifyGoldenHourQueue(options: {
  khungGio: string;
  count: number;
}): Promise<void> {
  const config = await getTelegramConfig();
  if (!config.botToken || !config.chatId || !config.notifyQueue) return;

  const khungGioLabel: Record<string, string> = {
    sang: "Buổi sáng (07:00 - 09:00)",
    trua: "Buổi trưa (11:30 - 13:30)",
    chieu: "Buổi chiều (16:30 - 18:30)",
    toi: "Buổi tối (20:00 - 22:30)",
  };

  const msg = `⏰ <b>[FB Job Poster] NHẮC NHỞ KHUNG GIỜ VÀNG</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🌟 <b>Khung giờ:</b> ${khungGioLabel[options.khungGio] || options.khungGio}\n` +
    `📋 <b>Bài viết sẵn sàng:</b> ${options.count} bài\n\n` +
    `🚀 <i>Hãy mở Extension hoặc vào Hàng đợi để đăng bài, đảm bảo tương tác cao nhất và không bị bóp reach!</i>`;

  await sendTelegramMessage(msg);
}
