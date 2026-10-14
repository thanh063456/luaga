import { google } from "googleapis";
import { prisma } from "./prisma";

async function getSheetConfig(): Promise<{
  serviceAccountJson: string;
  spreadsheetId: string;
  sheetName: string;
}> {
  const [saKey, sheetId, sheetName] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "google_service_account_json" } }),
    prisma.setting.findUnique({ where: { key: "google_spreadsheet_id" } }),
    prisma.setting.findUnique({ where: { key: "google_sheet_name" } }),
  ]);

  const serviceAccountJson =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON || saKey?.value || "";
  const spreadsheetId =
    process.env.GOOGLE_SPREADSHEET_ID || sheetId?.value || "";
  const sheetNameVal =
    process.env.GOOGLE_SHEET_NAME || sheetName?.value || "Sheet1";

  if (!serviceAccountJson || !spreadsheetId) {
    throw new Error(
      "Chưa cấu hình Google Sheets. Vui lòng vào trang Cài đặt để nhập thông tin."
    );
  }

  return {
    serviceAccountJson,
    spreadsheetId,
    sheetName: sheetNameVal,
  };
}

export interface SheetRow {
  ngay_dang: string;
  vi_tri_tuyen: string;
  khu_vuc: string;
  mo_ta_cong_viec: string;
  yeu_cau: string;
  muc_luong: string;
  thong_tin_lien_he: string;
}

export async function fetchJobsFromSheet(): Promise<SheetRow[]> {
  const { serviceAccountJson, spreadsheetId, sheetName } =
    await getSheetConfig();

  const credentials = JSON.parse(serviceAccountJson);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: authClient as never });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:G`,
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) return [];

  // Bỏ qua dòng tiêu đề (hàng đầu tiên)
  return rows.slice(1).map((row) => ({
    ngay_dang: row[0] || "",
    vi_tri_tuyen: row[1] || "",
    khu_vuc: row[2] || "",
    mo_ta_cong_viec: row[3] || "",
    yeu_cau: row[4] || "",
    muc_luong: row[5] || "",
    thong_tin_lien_he: row[6] || "",
  }));
}

export async function appendJobToSheet(job: {
  ngay_dang?: string;
  vi_tri_tuyen: string;
  khu_vuc: string;
  mo_ta_cong_viec?: string;
  yeu_cau?: string;
  muc_luong?: string;
  thong_tin_lien_he?: string;
}) {
  const { serviceAccountJson, spreadsheetId, sheetName } = await getSheetConfig();
  const credentials = JSON.parse(serviceAccountJson);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: authClient as never });

  const dateStr = job.ngay_dang || new Date().toLocaleDateString("vi-VN");

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:G`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        dateStr,
        job.vi_tri_tuyen,
        job.khu_vuc,
        job.mo_ta_cong_viec || "",
        job.yeu_cau || "",
        job.muc_luong || "",
        job.thong_tin_lien_he || ""
      ]]
    }
  });
}
