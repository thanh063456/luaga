// Content script: Trợ lý tự động điền tin tuyển dụng trên Facebook Group
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "INJECT_POST") {
    injectPostContent(request.content, request.draftId)
      .then((res) => sendResponse(res))
      .catch((err) => {
        console.error("Lỗi điền bài viết:", err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // async
  }
});

function showAssistantOverlay(message, isSuccess = true, draftId = null) {
  // Xóa overlay cũ nếu có
  const existing = document.getElementById("fb-job-poster-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "fb-job-poster-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "20px";
  overlay.style.right = "24px";
  overlay.style.zIndex = "9999999";
  overlay.style.background = "#0f172a";
  overlay.style.border = `2px solid ${isSuccess ? "#10b981" : "#f59e0b"}`;
  overlay.style.borderRadius = "14px";
  overlay.style.padding = "16px 20px";
  overlay.style.color = "#f8fafc";
  overlay.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  overlay.style.fontSize = "13px";
  overlay.style.boxShadow = "0 20px 40px rgba(0,0,0,0.6)";
  overlay.style.maxWidth = "360px";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.gap = "10px";
  overlay.style.animation = "fbSlideIn 0.3s ease-out";

  overlay.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
      <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: ${isSuccess ? "#34d399" : "#fbbf24"}; font-size: 14px;">
        <span>${isSuccess ? "🎉" : "⚠️"}</span> FB Job Poster Assistant
      </div>
      <button id="fb-overlay-close" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 16px;">✕</button>
    </div>
    <div style="line-height: 1.5; color: #cbd5e1;">${message}</div>
    <div style="display: flex; gap: 8px; margin-top: 4px;">
      <button id="fb-overlay-mark-posted" style="flex: 1; padding: 7px 12px; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">
        ✅ Đã đăng xong
      </button>
      <button id="fb-overlay-copy-again" style="padding: 7px 12px; background: #334155; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">
        📋 Copy lại
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("fb-overlay-close")?.addEventListener("click", () => overlay.remove());

  document.getElementById("fb-overlay-mark-posted")?.addEventListener("click", async () => {
    if (draftId) {
      try {
        await fetch(`http://localhost:3000/api/drafts/${draftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trang_thai: "posted" }),
        });
      } catch (e) {
        console.warn("Không thể cập nhật trạng thái về localhost:3000", e);
      }
    }
    overlay.remove();
  });
}

async function waitForElement(selectorFn, timeoutMs = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const el = selectorFn();
    if (el) return el;
    await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

async function injectPostContent(text, draftId) {
  // Luôn copy vào clipboard trước để đề phòng
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    console.warn("Clipboard write failed:", e);
  }

  // 1. Tìm ô tạo bài viết
  let postBox = document.querySelector('div[role="textbox"][contenteditable="true"]');

  // Nếu chưa mở modal tạo bài viết, tìm các nút trigger
  if (!postBox) {
    const clickableButtons = Array.from(document.querySelectorAll('div[role="button"], span'));
    const openBtn = clickableButtons.find((b) => {
      const t = (b.innerText || b.getAttribute("aria-label") || "").toLowerCase();
      return (
        t.includes("bạn đang nghĩ gì") ||
        t.includes("viết gì đó") ||
        t.includes("bạn viết gì đi") ||
        t.includes("tạo bài viết") ||
        t.includes("write something") ||
        t.includes("create a post")
      );
    });

    if (openBtn) {
      openBtn.scrollIntoView({ behavior: "smooth", block: "center" });
      openBtn.click();
      // Chờ Facebook mở modal
      postBox = await waitForElement(() =>
        document.querySelector('div[role="textbox"][contenteditable="true"], div[aria-label*="Bạn đang nghĩ gì"][role="textbox"]')
      );
    }
  }

  if (!postBox) {
    showAssistantOverlay(
      "Đã copy nội dung vào Clipboard! Hãy bấm vào ô 'Tạo bài viết' trên Facebook và nhấn <strong>Ctrl + V</strong>.",
      false,
      draftId
    );
    return { success: true, method: "clipboard" };
  }

  // Focus vào khung soạn thảo
  postBox.focus();
  postBox.scrollIntoView({ behavior: "smooth", block: "center" });

  // Thử điền bằng execCommand (chuẩn nhất cho React/DraftJS của Facebook)
  let success = false;
  try {
    success = document.execCommand("insertText", false, text);
  } catch {
    success = false;
  }

  if (!success) {
    // Fallback: Dispatch synthetic keyboard input
    postBox.textContent = text;
    postBox.dispatchEvent(new Event("input", { bubbles: true }));
    postBox.dispatchEvent(new Event("change", { bubbles: true }));
  }

  showAssistantOverlay(
    "Đã tự động điền tin tuyển dụng vào Facebook! Bạn hãy kiểm tra lại, đính kèm ảnh (nếu có) và bấm nút <strong>Đăng</strong>.",
    true,
    draftId
  );

  return { success: true, method: "injected" };
}
