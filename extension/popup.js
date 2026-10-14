const API_BASE = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", async () => {
  const draftList = document.getElementById("draftList");
  const tabStatus = document.getElementById("tabStatus");
  const btnRefresh = document.getElementById("btnRefresh");

  // Kiểm tra tab hiện tại có phải Facebook không
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isFacebook = activeTab?.url?.includes("facebook.com");

  if (isFacebook) {
    tabStatus.textContent = "● Đang ở Facebook";
    tabStatus.style.color = "#34d399";
  } else {
    tabStatus.textContent = "○ Mở Facebook Group để dùng Auto-Fill";
    tabStatus.style.color = "#f87171";
  }

  async function loadDrafts() {
    draftList.innerHTML = '<div class="empty-state">Đang tải dữ liệu...</div>';
    try {
      const res = await fetch(`${API_BASE}/drafts`);
      if (!res.ok) throw new Error("Không thể kết nối máy chủ FB Job Poster");
      const drafts = await res.json();

      if (!drafts || drafts.length === 0) {
        draftList.innerHTML = `
          <div class="empty-state">
            📭 Chưa có bản nháp nào.<br/>
            Vui lòng tạo hoặc đồng bộ tin tại <a href="http://localhost:3000" target="_blank" style="color: #6366f1">localhost:3000</a>
          </div>
        `;
        return;
      }

      draftList.innerHTML = "";
      drafts.slice(0, 15).forEach((draft) => {
        const card = document.createElement("div");
        card.className = "draft-card";

        const title = draft.job_post?.vi_tri_tuyen || "Tin tuyển dụng";
        const group = draft.group?.ten_group || "Nhóm";
        const location = draft.group?.khu_vuc || "";
        const content = draft.noi_dung_ai_viet || "";

        card.innerHTML = `
          <div class="draft-title">${title}</div>
          <div class="draft-group">👥 ${group} · 📍 ${location}</div>
          <div class="draft-preview">${content}</div>
          <div class="actions">
            <button class="btn btn-primary btn-inject" data-id="${draft.id}">⚡ Điền 1-Click</button>
            <button class="btn btn-secondary btn-copy" data-id="${draft.id}">📋 Copy</button>
          </div>
        `;

        card.querySelector(".btn-copy").addEventListener("click", () => {
          navigator.clipboard.writeText(content);
          const btn = card.querySelector(".btn-copy");
          btn.textContent = "✓ Đã copy";
          setTimeout(() => (btn.textContent = "📋 Copy"), 2000);
        });

        card.querySelector(".btn-inject").addEventListener("click", async () => {
          if (!isFacebook) {
            alert("Vui lòng mở trang Facebook Group trên trình duyệt trước khi bấm Điền!");
            return;
          }

          chrome.tabs.sendMessage(
            activeTab.id,
            { action: "INJECT_POST", content },
            (response) => {
              if (chrome.runtime.lastError) {
                alert("Hãy tải lại (F5) trang Facebook Group và thử lại!");
              } else if (response?.success) {
                const btn = card.querySelector(".btn-inject");
                btn.className = "btn btn-success";
                btn.textContent = "✓ Đã điền vào FB!";
              }
            }
          );
        });

        draftList.appendChild(card);
      });
    } catch (err) {
      draftList.innerHTML = `
        <div class="empty-state" style="color: #f87171">
          ⚠️ Không thể kết nối tới FB Job Poster.<br/>
          Đảm bảo bạn đang chạy <code>npm run dev</code> tại port 3000.
        </div>
      `;
    }
  }

  btnRefresh.addEventListener("click", loadDrafts);
  loadDrafts();
});
