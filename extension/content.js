// Content script lắng nghe sự kiện từ Popup Extension trên trang Facebook
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "INJECT_POST") {
    injectPostContent(request.content)
      .then((success) => {
        sendResponse({ success });
      })
      .catch((err) => {
        console.error("Lỗi điền bài viết:", err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // async response
  }
});

function showToast(message, isSuccess = true) {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "24px";
  toast.style.right = "24px";
  toast.style.zIndex = "999999";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "10px";
  toast.style.background = isSuccess ? "#059669" : "#dc2626";
  toast.style.color = "#ffffff";
  toast.style.fontWeight = "600";
  toast.style.fontSize = "14px";
  toast.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.gap = "8px";
  toast.innerHTML = `${isSuccess ? "🎉" : "⚠️"} ${message}`;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.4s";
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

async function injectPostContent(text) {
  // 1. Tìm ô "Bạn đang nghĩ gì?" hoặc "Viết gì đó..." trong Group Facebook
  const triggers = [
    'div[role="button"][tabindex="0"] span:contains("Bạn viết gì đi")',
    'div[role="button"][tabindex="0"]',
    'span:contains("Bạn đang nghĩ gì")',
    'div[aria-label*="Tạo bài viết"]',
    'div[aria-label*="Viết gì đó"]',
  ];

  let postBox = document.querySelector('div[role="textbox"][contenteditable="true"]');

  // Nếu khung soạn thảo chưa mở, tìm nút bấm để mở
  if (!postBox) {
    const clickableButtons = Array.from(document.querySelectorAll('div[role="button"]'));
    const openBtn = clickableButtons.find(
      (b) =>
        b.innerText?.includes("Bạn đang nghĩ gì") ||
        b.innerText?.includes("Viết gì đó") ||
        b.innerText?.includes("Tạo bài viết công khai") ||
        b.innerText?.includes("Tạo bài viết")
    );

    if (openBtn) {
      openBtn.click();
      // Chờ Facebook mở modal soạn bài
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  // Tìm lại ô soạn thảo sau khi mở modal
  postBox = document.querySelector(
    'div[role="textbox"][contenteditable="true"], div[aria-label*="Bạn đang nghĩ gì"][role="textbox"]'
  );

  if (!postBox) {
    // Copy vào Clipboard để người dùng dán thủ công nếu cấu trúc DOM khác
    await navigator.clipboard.writeText(text);
    showToast("Không tìm thấy khung soạn thảo! Đã copy vào Clipboard, bạn chỉ cần bấm Ctrl+V.", false);
    return true;
  }

  // 2. Focus vào khung soạn thảo và điền nội dung
  postBox.focus();

  // Dùng document.execCommand để Facebook nhận diện Synthetic Event chính xác
  const success = document.execCommand("insertText", false, text);

  if (!success) {
    // Fallback nếu execCommand bị chặn
    postBox.textContent = text;
    postBox.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }

  showToast("Đã tự động điền tin tuyển dụng từ FB Job Poster! Bạn có thể xem lại và bấm Đăng.");
  return true;
}
