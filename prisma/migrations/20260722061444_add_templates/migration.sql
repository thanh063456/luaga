-- CreateTable
CREATE TABLE "JobTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ten_cong_ty" TEXT NOT NULL,
    "vi_tri_tuyen" TEXT NOT NULL,
    "khu_vuc" TEXT NOT NULL,
    "mo_ta_cong_viec" TEXT NOT NULL DEFAULT '',
    "yeu_cau" TEXT NOT NULL DEFAULT '',
    "muc_luong" TEXT NOT NULL DEFAULT '',
    "thong_tin_lien_he" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_JobPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ten_cong_ty" TEXT NOT NULL DEFAULT '',
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
INSERT INTO "new_JobPost" ("createdAt", "id", "khu_vuc", "mo_ta_cong_viec", "muc_luong", "ngay_dang", "thong_tin_lien_he", "trang_thai_sync", "updatedAt", "vi_tri_tuyen", "yeu_cau") SELECT "createdAt", "id", "khu_vuc", "mo_ta_cong_viec", "muc_luong", "ngay_dang", "thong_tin_lien_he", "trang_thai_sync", "updatedAt", "vi_tri_tuyen", "yeu_cau" FROM "JobPost";
DROP TABLE "JobPost";
ALTER TABLE "new_JobPost" RENAME TO "JobPost";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "JobTemplate_ten_cong_ty_vi_tri_tuyen_key" ON "JobTemplate"("ten_cong_ty", "vi_tri_tuyen");
