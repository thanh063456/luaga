import { prisma } from "./prisma";

export interface OllamaConfig {
  baseUrl: string;
  model: string;
}

export async function getOllamaConfig(): Promise<OllamaConfig> {
  const [baseUrlSetting, modelSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "ollama_base_url" } }),
    prisma.setting.findUnique({ where: { key: "ollama_model" } }),
  ]);

  const baseUrl =
    process.env.OLLAMA_BASE_URL ||
    baseUrlSetting?.value?.trim() ||
    "http://localhost:11434";

  const model =
    process.env.OLLAMA_MODEL ||
    modelSetting?.value?.trim() ||
    "qwen2.5:7b";

  return { baseUrl: baseUrl.replace(/\/+$/, ""), model };
}

export async function getSystemPrompt(): Promise<string> {
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

export async function listOllamaModels(baseUrl?: string): Promise<{ name: string; size: number }[]> {
  const url = (baseUrl || (await getOllamaConfig()).baseUrl) + "/api/tags";
  try {
    const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Ollama tags HTTP ${res.status}`);
    const data = await res.json();
    return (data.models || []).map((m: any) => ({
      name: m.name,
      size: m.size || 0,
    }));
  } catch (err: any) {
    console.error("Lỗi kết nối Ollama:", err?.message || err);
    return [];
  }
}

export const TONE_STYLES: Record<string, { label: string; instruction: string }> = {
  tu_nhien: {
    label: "Tự nhiên & Thân thiện",
    instruction: "Văn phong gần gũi, chân thật, tạo cảm giác đáng tin cậy và ấm áp.",
  },
  gen_z: {
    label: "Trẻ trung & Năng động (Gen Z)",
    instruction: "Dùng từ ngữ trẻ trung, bắt trend hợp lý, nhiều năng lượng, sử dụng emoji sinh động.",
  },
  chuyen_nghiep: {
    label: "Chuyên nghiệp & Trang trọng",
    instruction: "Văn phong chuẩn mực doanh nghiệp, câu từ gãy gọn, nhấn mạnh đãi ngộ và lộ trình thăng tiến.",
  },
  gap_rut: {
    label: "Tuyển gấp & Kêu gọi hành động mạnh",
    instruction: "Nhấn mạnh số lượng có hạn, đi làm ngay, ưu tiên ứng viên liên hệ sớm, CTA dứt khoát.",
  },
  storytelling: {
    label: "Dạng kể chuyện (Storytelling)",
    instruction: "Mở đầu bằng một câu chuyện hoặc một trăn trở thực tế của người tìm việc, sau đó đưa ra cơ hội việc làm.",
  },
};

export const BLACKLIST_WORDS = [
  "cam kết 100%",
  "việc nhẹ lương cao",
  "thu nhập thụ động",
  "hoa hồng khủng",
  "không cần kinh nghiệm lương 30",
  "không cần kinh nghiệm lương 40",
  "cọc tiền",
  "đặt cọc",
  "chuyển khoản trước",
  "bao đậu",
  "làm giàu nhanh",
  "kiếm tiền online không vốn",
];

export function checkBlacklistWords(text: string): { found: string[]; isClean: boolean } {
  const lower = text.toLowerCase();
  const found = BLACKLIST_WORDS.filter((word) => lower.includes(word));
  return {
    found,
    isClean: found.length === 0,
  };
}

export async function generateTextWithOllama(options: {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  format?: "json";
  images?: string[]; // base64 strings
}): Promise<string> {
  const config = await getOllamaConfig();
  const modelToUse = options.model || config.model;
  const url = `${config.baseUrl}/api/generate`;

  const payload: Record<string, any> = {
    model: modelToUse,
    prompt: options.prompt,
    stream: false,
    options: {
      temperature: 0.7,
      top_p: 0.9,
    },
  };

  if (options.systemPrompt) {
    payload.system = options.systemPrompt;
  }
  if (options.format) {
    payload.format = options.format;
  }
  if (options.images && options.images.length > 0) {
    payload.images = options.images;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.response ?? "";
  } catch (err: any) {
    if (err?.name === "TimeoutError" || err?.message?.includes("fetch failed") || err?.code === "ECONNREFUSED") {
      throw new Error(
        `Không thể kết nối đến Ollama tại ${config.baseUrl}. Vui lòng mở ứng dụng Ollama hoặc chạy lệnh 'ollama serve'.`
      );
    }
    throw err;
  }
}

export async function rewriteJobPost(
  jobInfo: string,
  groupName: string,
  groupRules: string,
  toneKey: string = "tu_nhien"
): Promise<string> {
  const systemPrompt = await getSystemPrompt();
  const toneInfo = TONE_STYLES[toneKey] || TONE_STYLES.tu_nhien;

  const prompt = `${systemPrompt}

---
PHONG CÁCH YÊU CẦU:
${toneInfo.label}: ${toneInfo.instruction}

---
THÔNG TIN TIN TUYỂN DỤNG GỐC:
${jobInfo}

---
TÊN FACEBOOK GROUP: ${groupName}
QUY ĐỊNH VÀ GHI CHÚ CỦA GROUP:
${groupRules || "Không có quy định đặc biệt. Viết theo phong cách tự nhiên, thu hút."}

---
Hãy viết lại bài đăng phù hợp cho group này (chỉ trả về nội dung bài viết hoàn chỉnh, không kèm chú thích phụ):`;

  return generateTextWithOllama({ prompt });
}

export interface PostVariationResult {
  id: number;
  label: string;
  angle: string;
  content: string;
  blacklistWarnings: string[];
}

export async function generatePostVariations(options: {
  jobInfo: string;
  groupName?: string;
  groupRules?: string;
  toneKey?: string;
  count?: number;
}): Promise<PostVariationResult[]> {
  const count = Math.min(Math.max(options.count || 3, 2), 5);
  const toneInfo = TONE_STYLES[options.toneKey || "tu_nhien"] || TONE_STYLES.tu_nhien;

  const prompt = `Bạn là chuyên gia sáng tạo nội dung tuyển dụng trên Facebook, chuyên viết nhiều biến thể bài đăng (A/B testing & Paraphrasing) để tránh thuật toán phát hiện spam nội dung trùng lặp của Facebook.

Nhiệm vụ: Viết đúng ${count} BIẾN THỂ HOÀN TOÀN KHÁC NHAU cho cùng một thông tin tuyển dụng dưới đây.

YÊU CẦU CHO TỪNG BIẾN THỂ:
- Biến thể 1 (Góc nhìn Đãi ngộ & Thu nhập): Mở đầu bằng mức lương hấp dẫn, quyền lợi, thưởng nóng, emoji nổi bật, kích thích ứng viên mong muốn thu nhập tốt.
- Biến thể 2 (Góc nhìn Kể chuyện & Thân thiện): Mở đầu bằng câu hỏi trăn trở thực tế hoặc lời tâm sự gần gũi, văn phong ấm áp, như đồng nghiệp giới thiệu cho nhau.
- Biến thể 3 (Góc nhìn Tuyển gấp & Trực diện): Dứt khoát, đi thẳng vào vị trí, số lượng tuyển có hạn, nộp hồ sơ nhận việc ngay, CTA liên hệ nhanh qua SĐT/Zalo.
${count >= 4 ? "- Biến thể 4 (Góc nhìn Môi trường & Phát triển): Nhấn mạnh văn hóa công ty, đồng nghiệp trẻ trung, không áp lực, hỗ trợ đào tạo từ A-Z.\n" : ""}${count >= 5 ? "- Biến thể 5 (Góc nhìn Tối giản & Súc tích): Bố cục gạch đầu dòng rõ ràng, dễ đọc trên điện thoại, đi thẳng vào quyền lợi & cách ứng tuyển.\n" : ""}
QUY TẮC CỐT LÕI:
1. Mỗi biến thể BẮT BUỘC giữ đúng thông tin thực tế: vị trí, địa điểm, lương, liên hệ. Tuyệt đối không bịa đặt số liệu sai lệch.
2. Tuyệt đối KHÔNG dùng các từ nhạy cảm như "việc nhẹ lương cao", "cọc tiền", "bao đậu".
3. Định dạng phân tách: Giữa các biến thể BẮT BUỘC dùng đúng ký hiệu ngăn cách: ===BIEN_THE===
4. Chỉ trả về nội dung của các biến thể phân cách bằng ===BIEN_THE===, không thêm lời chào, không đánh số thứ tự hay giải thích ngoài lề.

---
THÔNG TIN TIN TUYỂN DỤNG:
${options.jobInfo}

TÊN GROUP: ${options.groupName || "Hội nhóm tuyển dụng việc làm"}
QUY ĐỊNH GROUP: ${options.groupRules || "Tự nhiên, tuân thủ tiêu chuẩn cộng đồng"}
TONE CHỦ ĐẠO: ${toneInfo.label} (${toneInfo.instruction})`;

  const rawOutput = await generateTextWithOllama({ prompt });
  const rawParts = rawOutput.split(/===BIEN_THE===/gi).map((p) => p.trim()).filter((p) => p.length > 20);

  const angleLabels = [
    { label: "💰 Góc nhìn Thu nhập & Đãi ngộ", angle: "Nhấn mạnh lương thưởng và chế độ hấp dẫn" },
    { label: "🌱 Góc nhìn Thân thiện & Storytelling", angle: "Gần gũi, chân thực, tạo sự tin cậy" },
    { label: "🚨 Góc nhìn Tuyển gấp & Trực diện", angle: "CTA mạnh mẽ, đi làm ngay, liên hệ gấp" },
    { label: "✨ Góc nhìn Môi trường & Đào tạo", angle: "Đồng nghiệp hòa đồng, hỗ trợ người mới" },
    { label: "📋 Góc nhìn Súc tích & Tối giản", angle: "Trực quan, dễ đọc lướt trên điện thoại" },
  ];

  return rawParts.map((content, idx) => {
    const meta = angleLabels[idx] || { label: `Biến thể số ${idx + 1}`, angle: "Biến thể diễn đạt mới" };
    const blacklist = checkBlacklistWords(content);
    return {
      id: idx + 1,
      label: meta.label,
      angle: meta.angle,
      content,
      blacklistWarnings: blacklist.found,
    };
  });
}

