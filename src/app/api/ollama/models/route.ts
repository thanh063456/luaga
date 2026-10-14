import { NextRequest, NextResponse } from "next/server";
import { listOllamaModels, getOllamaConfig } from "@/lib/ollama";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customUrl = searchParams.get("baseUrl");

  const config = await getOllamaConfig();
  const baseUrl = customUrl || config.baseUrl;

  try {
    const models = await listOllamaModels(baseUrl);
    return NextResponse.json({
      connected: models.length > 0,
      models,
      currentConfig: config,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        connected: false,
        models: [],
        error: err?.message || "Không thể kết nối tới Ollama",
        currentConfig: config,
      },
      { status: 200 }
    );
  }
}
