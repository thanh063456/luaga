import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "Không tìm thấy file" }, { status: 400 });

  const text = await file.text();
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const created = [];
  for (const row of data) {
    if (!row.ten_group || !row.khu_vuc) continue;
    const group = await prisma.group.create({
      data: {
        ten_group: row.ten_group || "",
        link_group: row.link_group || "",
        khu_vuc: row.khu_vuc || "",
        ghi_chu: row.ghi_chu || "",
        trang_thai: row.trang_thai || "active",
      },
    });
    created.push(group);
  }

  return NextResponse.json({ created: created.length, groups: created });
}
