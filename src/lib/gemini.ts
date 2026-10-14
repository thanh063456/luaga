import { GoogleGenAI } from "@google/genai";
import { prisma } from "./prisma";

async function getGeminiApiKey(): Promise<string> {
  // Ưu tiên env, fallback lấy từ DB settings
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const setting = await prisma.setting.findUnique({ where: { key: "gemini_api_key" } });
  if (setting?.value) return setting.value;
  throw new Error("Chưa cấu hình Gemini API Key. Vui lòng vào trang Cài đặt để nhập API Key.");
}

async function getSystemPrompt(): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key: "system_prompt" } });
  return (
    setting?.value ||
    `Bạn là chuyên gia viết nội dung tuyển dụng cho mạng xã hội. Nhiệm vụ của bạn là viết lại bài đăng tuyển dụng dựa trên thông tin được cung cấp, điều chỉnh cho phù hợp với quy định và phong cách của từng Facebook Group cụ thể.

Quy tắc bắt buộc:
1. Giữ nguyên và đầy đủ thông tin quan trọng: vị trí tuyển dụng, khu vực làm việc, mức lương, thông tin liên hệ.
2. KHÔNG bịa đặt hoặc thêm thông tin không có trong bài gốc.
3. Viết lại khác đủ so với bài gốc (đổi cấu trúc câu, dùng từ ngữ khác) để tránh Facebook phát hiện spam nội dung trùng lặp.
4. Áp dụng đúng quy định của group: hashtag, văn phong, giới hạn ký tự nếu có.
5. Giọng văn tự nhiên, thân thiện, thu hút người đọc.
6. Chỉ trả về nội dung bài đăng, không kèm giải thích hay ghi chú.`
  );
}

export const MODEL_CANDIDATES = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-flash-latest",
];

export async function generateContentWithFallback(ai: GoogleGenAI, contents: any) {
  let lastError: any = null;
  for (const model of MODEL_CANDIDATES) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
      });
      return response;
    } catch (err: any) {
      console.warn(`Model ${model} không khả dụng/bị giới hạn (chuyển sang model dự phòng):`, err?.message || err);
      lastError = err;
    }
  }
  throw lastError;
}

export async function rewriteJobPost(
  jobInfo: string,
  groupName: string,
  groupRules: string
): Promise<string> {
  const apiKey = await getGeminiApiKey();
  const systemPrompt = await getSystemPrompt();

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `${systemPrompt}

---
THÔNG TIN TIN TUYỂN DỤNG GỐC:
${jobInfo}

---
TÊN FACEBOOK GROUP: ${groupName}
QUY ĐỊNH VÀ GHI CHÚ CỦA GROUP:
${groupRules || "Không có quy định đặc biệt. Viết theo phong cách chung, tự nhiên."}

---
Hãy viết lại bài đăng phù hợp cho group này:`;

  const response = await generateContentWithFallback(ai, prompt);

  return response.text ?? "";
}
