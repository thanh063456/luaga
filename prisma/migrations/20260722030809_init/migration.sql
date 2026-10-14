-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ten_group" TEXT NOT NULL,
    "link_group" TEXT NOT NULL,
    "khu_vuc" TEXT NOT NULL,
    "ghi_chu" TEXT NOT NULL DEFAULT '',
    "trang_thai" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JobPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ngay_dang" TEXT NOT NULL DEFAULT '',
    "vi_tri_tuyen" TEXT NOT NULL,
    "khu_vuc" TEXT NOT NULL,
    "mo_ta_cong_viec" TEXT NOT NULL,
    "yeu_cau" TEXT NOT NULL DEFAULT '',
    "muc_luong" TEXT NOT NULL DEFAULT '',
    "thong_tin_lien_he" TEXT NOT NULL DEFAULT '',
    "trang_thai_sync" TEXT NOT NULL DEFAULT 'raw',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PostDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "job_post_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "noi_dung_ai_viet" TEXT NOT NULL,
    "trang_thai" TEXT NOT NULL DEFAULT 'draft',
    "thoi_gian_tao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PostDraft_job_post_id_fkey" FOREIGN KEY ("job_post_id") REFERENCES "JobPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostDraft_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
