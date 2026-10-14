import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchJobsFromSheet, appendJobToSheet } from "@/lib/sheets";
import { rewriteJobPost } from "@/lib/ollama";
import { getCurrentUser } from "@/lib/auth";

function cleanKhuVuc(s: string): string {
  let res = s.toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
  
  if (res.includes("hồ chí minh") || res.includes("ho chi minh") || res.includes("hcm") || res.includes("tphcm")) {
    res = res.replace(/hồ chí minh|ho chi minh|hcm|tphcm/g, "tphcm");
  }
  
  if (res.includes("hà nội") || res.includes("ha noi") || res.includes("hn")) {
    res = res.replace(/hà nội|ha noi|hn/g, "hanoi");
  }
  
  return res.replace(/\s+/g, "");
}

function matchKhuVuc(jobKhuVuc: string, groupKhuVuc: string): boolean {
  const jk = cleanKhuVuc(jobKhuVuc);
  const gk = cleanKhuVuc(groupKhuVuc);

  if (gk === "toanquoc" || jk === "toanquoc") return true;
  if (jk === gk) return true;
  if (jk.includes(gk) || gk.includes(jk)) return true;

  const lan_can_hcm = ["tphcm", "bìnhdương", "đồngnai", "longan", "tâyninh", "tayninh", "bàrịa", "baria", "vũngtàu", "vungtau"];
  const lan_can_hn = ["hanoi", "bắcninh", "bacninh", "hưngyên", "hungyen", "vĩnhphúc", "vinhphuc", "hảidương", "haiduong", "hànam", "hanam", "hòabình", "hoabinh"];

  // Nếu nhóm đăng bài cho khu vực "lân cận"
  if (gk.includes("lâncận") || gk.includes("lancan")) {
    if (gk.includes("tphcm")) {
      return lan_can_hcm.some(r => jk.includes(r) || r.includes(jk));
    }
    if (gk.includes("hanoi")) {
      return lan_can_hn.some(r => jk.includes(r) || r.includes(jk));
    }
  }

  // Nếu tin tuyển dụng đăng cho khu vực "lân cận"
  if (jk.includes("lâncận") || jk.includes("lancan")) {
    if (jk.includes("tphcm")) {
      return lan_can_hcm.some(r => gk.includes(r) || r.includes(gk));
    }
    if (jk.includes("hanoi")) {
      return lan_can_hn.some(r => gk.includes(r) || r.includes(gk));
    }
  }

  return false;
}

async function processDraftsForJobs(
  newJobs: Awaited<ReturnType<typeof prisma.jobPost.findFirst>>[],
  groupIds?: string[],
  tone: string = "tu_nhien",
  userId?: string
) {
  const groups = await prisma.group.findMany({
    where: {
      trang_thai: "active",
      ...(groupIds ? { id: { in: groupIds } } : {}),
    },
  });
  let totalDrafts = 0;

  for (const job of newJobs) {
    if (!job) continue;
    const matchedGroups = groupIds ? groups : groups.filter((g) => matchKhuVuc(job.khu_vuc, g.khu_vuc));

    const jobInfo = `Vị trí: ${job.vi_tri_tuyen}
Khu vực: ${job.khu_vuc}
Mô tả công việc: ${job.mo_ta_cong_viec}
Yêu cầu: ${job.yeu_cau}
Mức lương: ${job.muc_luong}
Thông tin liên hệ: ${job.thong_tin_lien_he}`;

    for (const group of matchedGroups) {
      const existingDraft = await prisma.postDraft.findFirst({
        where: { job_post_id: job.id, group_id: group.id },
      });
      if (existingDraft) continue;

      try {
        const aiContent = await rewriteJobPost(jobInfo, group.ten_group, group.ghi_chu, tone);
        await prisma.postDraft.create({
          data: {
            job_post_id: job.id,
            group_id: group.id,
            noi_dung_ai_viet: aiContent,
            tone,
            user_id: userId || null,
            trang_thai_duyet: "pending",
          },
        });
        totalDrafts++;
      } catch (err) {
        console.error(`Lỗi Ollama viết bài cho group ${group.ten_group}:`, err);
      }
    }

    await prisma.jobPost.update({
      where: { id: job.id },
      data: { trang_thai_sync: "processed" },
    });
  }

  return totalDrafts;
}

// POST /api/sync — đồng bộ từ Google Sheets hoặc tạo tin thủ công
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    const body = await req.json().catch(() => ({}));
    const tone = body.tone || "tu_nhien";

    // Nếu có body (nhập thủ công), lưu trực tiếp
    if (body.manual && body.job) {
      const jobData = body.job;
      if (!jobData.vi_tri_tuyen || !jobData.khu_vuc) {
        return NextResponse.json({ error: "Thiếu thông tin: vị trí tuyển và khu vực là bắt buộc." }, { status: 400 });
      }

      const { ten_cong_ty, vi_tri_tuyen, khu_vuc, mo_ta_cong_viec, yeu_cau, muc_luong, thong_tin_lien_he, ngay_dang } = jobData;
      const job = await prisma.jobPost.create({
        data: {
          ten_cong_ty: ten_cong_ty || "",
          vi_tri_tuyen,
          khu_vuc,
          mo_ta_cong_viec: mo_ta_cong_viec || "",
          yeu_cau: yeu_cau || "",
          muc_luong: muc_luong || "",
          thong_tin_lien_he: thong_tin_lien_he || "",
          ngay_dang: ngay_dang || "",
          trang_thai_sync: "raw",
          user_id: currentUser?.id || null,
        }
      });

      // Tự động lưu/cập nhật thông tin vào bộ nhớ (JobTemplate)
      if (ten_cong_ty) {
        await prisma.jobTemplate.upsert({
          where: {
            ten_cong_ty_vi_tri_tuyen: {
              ten_cong_ty,
              vi_tri_tuyen,
            },
          },
          update: {
            khu_vuc,
            mo_ta_cong_viec: mo_ta_cong_viec || "",
            yeu_cau: yeu_cau || "",
            muc_luong: muc_luong || "",
            thong_tin_lien_he: thong_tin_lien_he || "",
          },
          create: {
            ten_cong_ty,
            vi_tri_tuyen,
            khu_vuc,
            mo_ta_cong_viec: mo_ta_cong_viec || "",
            yeu_cau: yeu_cau || "",
            muc_luong: muc_luong || "",
            thong_tin_lien_he: thong_tin_lien_he || "",
          },
        });
      }

      const totalDrafts = await processDraftsForJobs([job], body.groupIds, tone, currentUser?.id);

      // Tự động ghi dữ liệu ngược về Google Sheets (nếu đã cấu hình)
      let sheetWriteSuccess = true;
      try {
        await appendJobToSheet({
          ngay_dang: ngay_dang || "",
          vi_tri_tuyen: ten_cong_ty ? `[${ten_cong_ty}] ${vi_tri_tuyen}` : vi_tri_tuyen,
          khu_vuc,
          mo_ta_cong_viec: mo_ta_cong_viec || "",
          yeu_cau: yeu_cau || "",
          muc_luong: muc_luong || "",
          thong_tin_lien_he: thong_tin_lien_he || "",
        });
      } catch (sheetErr) {
        sheetWriteSuccess = false;
      }

      return NextResponse.json({
        message: `Đã tạo tin thủ công và sinh ${totalDrafts} bản nháp bằng Ollama.${sheetWriteSuccess ? " Đã tự động lưu vào Google Sheet!" : ""}`,
        newJobs: 1,
        totalDrafts,
      });
    }

    // Đồng bộ từ Google Sheets
    let sheetRows;
    try {
      sheetRows = await fetchJobsFromSheet();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi kết nối Google Sheets";
      return NextResponse.json(
        { error: `Không thể đọc Google Sheets: ${msg}. Vui lòng kiểm tra cấu hình tại trang Cài đặt.` },
        { status: 500 }
      );
    }

    if (sheetRows.length === 0) {
      return NextResponse.json({ message: "Không có tin tuyển dụng mới từ Sheet." });
    }

    const newJobs = [];
    for (const row of sheetRows) {
      if (!row.vi_tri_tuyen) continue;
      const exists = await prisma.jobPost.findFirst({
        where: { vi_tri_tuyen: row.vi_tri_tuyen, khu_vuc: row.khu_vuc, ngay_dang: row.ngay_dang },
      });
      if (!exists) {
        const job = await prisma.jobPost.create({
          data: {
            ...row,
            user_id: currentUser?.id || null,
          },
        });
        newJobs.push(job);
      }
    }

    if (newJobs.length === 0) {
      return NextResponse.json({ message: "Tất cả tin đã được đồng bộ trước đó." });
    }

    const totalDrafts = await processDraftsForJobs(newJobs, undefined, tone, currentUser?.id);

    return NextResponse.json({
      message: `Đồng bộ thành công: ${newJobs.length} tin mới, ${totalDrafts} bản nháp được tạo với Ollama.`,
      newJobs: newJobs.length,
      totalDrafts,
    });
  } catch (err: any) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: err?.message || "Lỗi xử lý đồng bộ" }, { status: 500 });
  }
}
