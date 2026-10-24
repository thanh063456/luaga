const API_BASE = "http://localhost:3000/api";

let currentTab = "drafts";
let draftsData = [];
let queueData = [];
let activeFbTab = null;

document.addEventListener("DOMContentLoaded", async () => {
  const listContainer = document.getElementById("listContainer");
  const tabStatus = document.getElementById("tabStatus");
  const btnRefresh = document.getElementById("btnRefresh");
  const tabDrafts = document.getElementById("tabDrafts");
  const tabQueue = document.getElementById("tabQueue");
  const searchInput = document.getElementById("searchInput");
  const countDrafts = document.getElementById("countDrafts");
  const countQueue = document.getElementById("countQueue");

  // Kiểm tra tab hiện tại
  async function checkActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      activeFbTab = tab;
      const isFacebook = tab?.url?.includes("facebook.com");
      if (isFacebook) {
        tabStatus.textContent = "● Đang mở Facebook";
        tabStatus.style.color = "#34d399";
      } else {
        tabStatus.textContent = "○ Nhấn '🚀 Mở & Điền' để tự mở nhóm";
        tabStatus.style.color = "#94a3b8";
      }
    } catch (e) {
      console.warn("Lỗi kiểm tra tab:", e);
    }
  }

  // Tải dữ liệu từ web app
  async function loadData() {
    listContainer.innerHTML = '<div class="empty-state">Đang tải dữ liệu...</div>';
    try {
      const [dRes, qRes] = await Promise.all([
        fetch(`${API_BASE}/drafts`),
        fetch(`${API_BASE}/queue?trang_thai=waiting`),
      ]);

      if (dRes.ok) {
        draftsData = await dRes.json();
        countDrafts.textContent = draftsData.length;
      }
      if (qRes.ok) {
        queueData = await qRes.json();
        countQueue.textContent = queueData.length;
      }

      renderList();
    } catch (err) {
      listContainer.innerHTML = `
        <div class="empty-state" style="color: #f87171">
          ⚠️ Không kết nối được tới FB Job Poster.<br/>
          Hãy chắc chắn ứng dụng đang chạy tại <code>localhost:3000</code>.
        </div>
      `;
    }
  }

  function renderList() {
    const query = (searchInput.value || "").toLowerCase().trim();
    const sourceList = currentTab === "drafts" ? draftsData : queueData;

    const filtered = sourceList.filter((item) => {
      const title = (item.job_post?.vi_tri_tuyen || item.draft?.job_post?.vi_tri_tuyen || "").toLowerCase();
      const group = (item.group?.ten_group || item.draft?.group?.ten_group || "").toLowerCase();
      return title.includes(query) || group.includes(query);
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          📭 Không có bài viết nào trong mục này.<br/>
          ${query ? "Không tìm thấy kết quả phù hợp với từ khóa." : "Vui lòng tạo bài viết trên Dashboard."}
        </div>
      `;
      return;
    }

    listContainer.innerHTML = "";
    filtered.slice(0, 20).forEach((item) => {
      const draftObj = currentTab === "drafts" ? item : item.draft;
      const draftId = draftObj.id;
      const title = draftObj.job_post?.vi_tri_tuyen || "Tin tuyển dụng";
      const company = draftObj.job_post?.ten_cong_ty || "";
      const groupName = draftObj.group?.ten_group || "Nhóm";
      const groupLink = draftObj.group?.link_group || "";
      const location = draftObj.group?.khu_vuc || "";
      const content = draftObj.noi_dung_ai_viet || "";
      const isPosted = draftObj.trang_thai === "posted";

      const card = document.createElement("div");
      card.className = "item-card";

      card.innerHTML = `
        <div class="card-top">
          <div>
            <div class="item-title">${title} ${company ? `· ${company}` : ""}</div>
            <div class="item-group">👥 ${groupName} · 📍 ${location}</div>
          </div>
          <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${isPosted ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}; color: ${isPosted ? "#34d399" : "#fbbf24"}">
            ${isPosted ? "Đã đăng" : "Chờ đăng"}
          </span>
        </div>
        <div class="item-preview">${content}</div>
        <div class="actions">
          <button class="btn btn-primary btn-auto" title="Tự động mở Facebook Group và điền bài">
            🚀 Mở & Điền
          </button>
          <button class="btn btn-secondary btn-inject" title="Điền trực tiếp vào tab Facebook hiện tại">
            ⚡ Điền
          </button>
          <button class="btn btn-outline btn-copy" title="Copy nội dung">
            📋 Copy
          </button>
          <button class="btn btn-outline btn-mark" title="Đánh dấu đã đăng bài">
            ${isPosted ? "↩ Nháp" : "✅ Xong"}
          </button>
        </div>
      `;

      // Copy
      card.querySelector(".btn-copy").addEventListener("click", () => {
        navigator.clipboard.writeText(content);
        const btn = card.querySelector(".btn-copy");
        btn.textContent = "✓ Đã copy";
        setTimeout(() => (btn.textContent = "📋 Copy"), 1500);
      });

      // Điền trực tiếp vào tab hiện tại
      card.querySelector(".btn-inject").addEventListener("click", async () => {
        await checkActiveTab();
        if (!activeFbTab?.url?.includes("facebook.com")) {
          alert("Tab hiện tại không phải Facebook! Vui lòng mở Facebook Group hoặc dùng nút '🚀 Mở & Điền'.");
          return;
        }

        chrome.tabs.sendMessage(
          activeFbTab.id,
          { action: "INJECT_POST", content, draftId },
          (res) => {
            if (chrome.runtime.lastError) {
              alert("Hãy tải lại (F5) tab Facebook Group rồi thử lại!");
            } else {
              const btn = card.querySelector(".btn-inject");
              btn.textContent = "✓ Đã điền";
              setTimeout(() => (btn.textContent = "⚡ Điền"), 2000);
            }
          }
        );
      });

      // Tự động mở Group và điền
      card.querySelector(".btn-auto").addEventListener("click", async () => {
        if (!groupLink) {
          alert("Group này chưa có link Facebook trong hệ thống!");
          return;
        }

        const btn = card.querySelector(".btn-auto");
        btn.textContent = "⏳ Đang mở...";

        // Mở tab mới
        const newTab = await chrome.tabs.create({ url: groupLink, active: true });

        // Chờ tab load xong
        const listener = (tabId, changeInfo) => {
          if (tabId === newTab.id && changeInfo.status === "complete") {
            chrome.tabs.onUpdated.removeListener(listener);
            setTimeout(() => {
              chrome.tabs.sendMessage(
                newTab.id,
                { action: "INJECT_POST", content, draftId },
                () => {
                  btn.textContent = "✓ Hoàn tất";
                  setTimeout(() => (btn.textContent = "🚀 Mở & Điền"), 2500);
                }
              );
            }, 1800);
          }
        };

        chrome.tabs.onUpdated.addListener(listener);
      });

      // Đánh dấu đã đăng
      card.querySelector(".btn-mark").addEventListener("click", async () => {
        const nextStatus = isPosted ? "draft" : "posted";
        try {
          await fetch(`${API_BASE}/drafts/${draftId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trang_thai: nextStatus }),
          });
          loadData();
        } catch (e) {
          alert("Lỗi cập nhật trạng thái");
        }
      });

      listContainer.appendChild(card);
    });
  }

  // Switch tabs
  tabDrafts.addEventListener("click", () => {
    currentTab = "drafts";
    tabDrafts.classList.add("active");
    tabQueue.classList.remove("active");
    renderList();
  });

  tabQueue.addEventListener("click", () => {
    currentTab = "queue";
    tabQueue.classList.add("active");
    tabDrafts.classList.remove("active");
    renderList();
  });

  searchInput.addEventListener("input", renderList);
  btnRefresh.addEventListener("click", loadData);

  await checkActiveTab();
  loadData();
});
