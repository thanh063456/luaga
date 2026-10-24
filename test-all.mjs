// Test script kiểm tra toàn bộ API endpoints của hệ thống FB Job Poster
async function runTests() {
  const BASE_URL = "http://localhost:3000";
  console.log("==================================================");
  console.log("🚀 BẮT ĐẦU TEST TOÀN BỘ CHỨC NĂNG HỆ THỐNG FB JOB POSTER");
  console.log("==================================================\n");

  let cookieHeader = "";
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failedTests++;
    }
  }

  try {
    // 1. TEST AUTHENTICATION & LOGIN
    console.log("--- 1. Kiểm tra Xác thực & Đăng nhập (RBAC) ---");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gmail.com", password: "admin123" }),
    });
    
    assert(loginRes.ok, `Đăng nhập tài khoản Admin mặc định (HTTP ${loginRes.status})`);
    const setCookie = loginRes.headers.get("set-cookie");
    if (setCookie) {
      cookieHeader = setCookie.split(";")[0];
    }
    const loginData = await loginRes.json();
    assert(loginData.user && loginData.user.role === "ADMIN", `Quyền tài khoản đăng nhập là ADMIN: ${loginData.user?.role}`);

    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: cookieHeader },
    });
    assert(meRes.ok, `Lấy thông tin phiên làm việc /api/auth/me (HTTP ${meRes.status})`);

    // 2. TEST GROUPS API
    console.log("\n--- 2. Kiểm tra Quản lý Facebook Group ---");
    const groupsRes = await fetch(`${BASE_URL}/api/groups`, {
      headers: { Cookie: cookieHeader },
    });
    assert(groupsRes.ok, `Lấy danh sách Facebook Groups /api/groups (HTTP ${groupsRes.status})`);
    const groups = await groupsRes.json();
    assert(Array.isArray(groups), `Số lượng Group hiện có: ${groups.length}`);

    // Tạo group mới nếu chưa có
    let testGroupId = groups[0]?.id;
    if (!testGroupId) {
      const createGroupRes = await fetch(`${BASE_URL}/api/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookieHeader },
        body: JSON.stringify({
          ten_group: "Hội Tìm Việc Làm Thủ Đức - KCN Sóng Thần",
          link_group: "https://facebook.com/groups/timviecthuduc",
          khu_vuc: "TP.HCM",
          ghi_chu: "Bắt buộc ghi rõ mức lương, không để link rút gọn",
        }),
      });
      assert(createGroupRes.ok, "Tạo Facebook Group mới kiểm thử");
      const createdGroup = await createGroupRes.json();
      testGroupId = createdGroup.id;
    }

    // 3. TEST JOB CREATION & TEMPLATES
    console.log("\n--- 3. Kiểm tra Nhập Tin Tuyển Dụng & Bộ Nhớ Công Việc (Templates) ---");
    const templatesRes = await fetch(`${BASE_URL}/api/templates`, {
      headers: { Cookie: cookieHeader },
    });
    assert(templatesRes.ok, `Lấy danh sách mẫu công việc /api/templates (HTTP ${templatesRes.status})`);
    const templates = await templatesRes.json();
    assert(Array.isArray(templates), `Số lượng Template hiện có: ${templates.length}`);

    // Tạo tin tuyển dụng thủ công kèm tự động ghép nối Group
    const createJobRes = await fetch(`${BASE_URL}/api/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify({
        manual: true,
        tone: "tu_nhien",
        job: {
          ten_cong_ty: "Nidec Advanced Motor Vietnam",
          vi_tri_tuyen: "Công nhân Lắp ráp Linh kiện Điện tử",
          khu_vuc: "TP.HCM",
          mo_ta_cong_viec: "Lắp ráp động cơ chính xác trong phòng sạch, kiểm tra sản phẩm",
          yeu_cau: "Nam/Nữ từ 18 - 35 tuổi, không yêu cầu kinh nghiệm, sức khỏe tốt",
          muc_luong: "8.500.000 - 12.000.000 VNĐ/tháng",
          thong_tin_lien_he: "Hotline/Zalo: 0988.123.456 (Chị Tuyết HR)",
          ngay_dang: new Date().toISOString().slice(0, 10),
        },
      }),
    });
    assert(createJobRes.ok, `Nhập tin tuyển dụng & sinh bản nháp tự động /api/sync (HTTP ${createJobRes.status})`);
    const syncResult = await createJobRes.json();
    assert(syncResult.success === true, `Kết quả tạo tin: ${syncResult.message}`);

    // 4. TEST DRAFTS & BATCH APPROVAL (MANAGER UPGRADE)
    console.log("\n--- 4. Kiểm tra Quản lý Bản nháp, Ghi chú & Duyệt hàng loạt (Manager) ---");
    const draftsRes = await fetch(`${BASE_URL}/api/drafts`, {
      headers: { Cookie: cookieHeader },
    });
    assert(draftsRes.ok, `Lấy danh sách bài nháp /api/drafts (HTTP ${draftsRes.status})`);
    const drafts = await draftsRes.json();
    assert(Array.isArray(drafts), `Tổng số bài nháp trên Dashboard: ${drafts.length}`);

    if (drafts.length > 0) {
      const sampleDraft = drafts[0];
      // Test Batch Approval API
      const batchApproveRes = await fetch(`${BASE_URL}/api/drafts/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookieHeader },
        body: JSON.stringify({
          draftIds: [sampleDraft.id],
          action: "approve",
          note: "Đạt chuẩn duyệt hàng loạt từ Test Suite",
        }),
      });
      assert(batchApproveRes.ok, `Duyệt bài hàng loạt /api/drafts/batch (HTTP ${batchApproveRes.status})`);
      const batchApproveData = await batchApproveRes.json();
      assert(batchApproveData.success === true, `Kết quả duyệt hàng loạt: ${batchApproveData.message}`);

      // Test Batch Reject with Note
      const batchRejectRes = await fetch(`${BASE_URL}/api/drafts/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookieHeader },
        body: JSON.stringify({
          draftIds: [sampleDraft.id],
          action: "reject",
          note: "Thiếu thông tin phụ cấp chuyên cần, yêu cầu sửa lại",
        }),
      });
      assert(batchRejectRes.ok, `Từ chối duyệt bài hàng loạt kèm ghi chú (HTTP ${batchRejectRes.status})`);
      const batchRejectData = await batchRejectRes.json();
      assert(batchRejectData.status === "rejected", "Trạng thái cập nhật thành công: rejected");

      // Test Recruiter Bump & Link Facebook Update
      const updateDraftRes = await fetch(`${BASE_URL}/api/drafts/${sampleDraft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: cookieHeader },
        body: JSON.stringify({
          trang_thai: "posted",
          link_bai_dang: "https://facebook.com/groups/timviecthuduc/posts/12345678",
          nhac_day_bai: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      assert(updateDraftRes.ok, `Lưu link bài đăng Facebook & hẹn nhắc đẩy bài sau 24h (HTTP ${updateDraftRes.status})`);
      const updatedDraft = await updateDraftRes.json();
      assert(updatedDraft.draft?.link_bai_dang.includes("facebook.com"), "Đã lưu link bài Facebook thành công");
    }

    // 5. TEST QUEUE (HÀNG ĐỢI GIỜ VÀNG)
    console.log("\n--- 5. Kiểm tra Hàng đợi Giờ Vàng (Queue) ---");
    const queueRes = await fetch(`${BASE_URL}/api/queue`, {
      headers: { Cookie: cookieHeader },
    });
    assert(queueRes.ok, `Lấy danh sách hàng đợi /api/queue (HTTP ${queueRes.status})`);
    const queueItems = await queueRes.json();
    assert(Array.isArray(queueItems), `Số lượng bài trong hàng đợi: ${queueItems.length}`);

    // 6. TEST USERS & AI QUOTA (ADMIN & RBAC UPGRADE)
    console.log("\n--- 6. Kiểm tra Quản lý Người dùng & Hạn ngạch AI (Admin) ---");
    const usersRes = await fetch(`${BASE_URL}/api/users`, {
      headers: { Cookie: cookieHeader },
    });
    assert(usersRes.ok, `Lấy danh sách người dùng /api/users (HTTP ${usersRes.status})`);
    const users = await usersRes.json();
    assert(Array.isArray(users), `Số lượng người dùng trong hệ thống: ${users.length}`);

    const recruiterUser = users.find((u) => u.role === "RECRUITER") || users[0];
    if (recruiterUser) {
      assert(recruiterUser.ai_quota_per_day !== undefined, `Hạn ngạch AI của ${recruiterUser.name}: ${recruiterUser.ai_quota_per_day} lượt/ngày`);
      
      // Test update AI Quota
      const updateQuotaRes = await fetch(`${BASE_URL}/api/users/${recruiterUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: cookieHeader },
        body: JSON.stringify({ ai_quota_per_day: 100 }),
      });
      assert(updateQuotaRes.ok, `Cập nhật hạn ngạch AI lên 100 lượt/ngày (HTTP ${updateQuotaRes.status})`);
    }

    // 7. TEST ADMIN DATABASE BACKUP (ADMIN UPGRADE)
    console.log("\n--- 7. Kiểm tra Sao lưu CSDL 1-Click (Admin Backup) ---");
    const backupGetRes = await fetch(`${BASE_URL}/api/admin/backup`, {
      headers: { Cookie: cookieHeader },
    });
    assert(backupGetRes.ok, `Lấy thông tin sao lưu CSDL /api/admin/backup (HTTP ${backupGetRes.status})`);
    const backupData = await backupGetRes.json();
    assert(backupData.database && backupData.database.size > 0, `Kích thước CSDL dev.db: ${(backupData.database?.size / 1024).toFixed(1)} KB`);

    // Tạo Snapshot CSDL
    const snapshotRes = await fetch(`${BASE_URL}/api/admin/backup`, {
      method: "POST",
      headers: { Cookie: cookieHeader },
    });
    assert(snapshotRes.ok, `Tạo snapshot CSDL trên máy chủ (HTTP ${snapshotRes.status})`);
    const snapshotData = await snapshotRes.json();
    assert(snapshotData.success === true, `Kết quả tạo snapshot: ${snapshotData.message}`);

    // 8. TEST SETTINGS & HISTORY API
    console.log("\n--- 8. Kiểm tra Cấu hình & Lịch sử Hoạt động (Settings & History) ---");
    const settingsRes = await fetch(`${BASE_URL}/api/settings`, {
      headers: { Cookie: cookieHeader },
    });
    assert(settingsRes.ok, `Lấy cấu hình hệ thống /api/settings (HTTP ${settingsRes.status})`);
    const settingsData = await settingsRes.json();
    assert(settingsData.ollama_base_url !== undefined, `Endpoint Ollama cấu hình: ${settingsData.ollama_base_url}`);

    const historyRes = await fetch(`${BASE_URL}/api/history`, {
      headers: { Cookie: cookieHeader },
    });
    assert(historyRes.ok, `Lấy lịch sử bài đã đăng /api/history (HTTP ${historyRes.status})`);
    const historyData = await historyRes.json();
    assert(Array.isArray(historyData), `Số lượng bài trong lịch sử: ${historyData.length}`);

    // TỔNG KẾT KẾT QUẢ
    console.log("\n==================================================");
    console.log(`📊 TỔNG KẾT TEST: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log(`🎯 TỶ LỆ THÀNH CÔNG: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);
    console.log("==================================================");

  } catch (err) {
    console.error("Lỗi ngoại lệ trong quá trình chạy test:", err);
  }
}

runTests();
