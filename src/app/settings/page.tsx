"use client";
import { useEffect, useState, useCallback } from "react";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

const DEFAULT_PROMPT = `Bạn là chuyên gia viết nội dung tuyển dụng cho mạng xã hội. Nhiệm vụ của bạn là viết lại bài đăng tuyển dụng dựa trên thông tin được cung cấp, điều chỉnh cho phù hợp với quy định và phong cách của từng Facebook Group cụ thể.

Quy tắc bắt buộc:
1. Giữ nguyên và đầy đủ thông tin quan trọng: vị trí tuyển dụng, khu vực làm việc, mức lương, thông tin liên hệ.
2. KHÔNG bịa đặt hoặc thêm thông tin không có trong bài gốc.
3. Viết lại khác đủ so với bài gốc để tránh Facebook phát hiện spam nội dung trùng lặp.
4. Áp dụng đúng quy định của group: hashtag, văn phong, giới hạn ký tự nếu có.
5. Giọng văn tự nhiên, thân thiện, thu hút người đọc.
6. Chỉ trả về nội dung bài đăng, không kèm giải thích hay ghi chú.`;

interface Settings {
  ollama_base_url?: string;
  ollama_model?: string;
  system_prompt?: string;
  google_service_account_json?: string;
  google_spreadsheet_id?: string;
  google_sheet_name?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  telegram_notify_pending?: string;
  telegram_notify_queue?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    ollama_base_url: "http://localhost:11434",
    ollama_model: "qwen2.5:7b",
    telegram_notify_pending: "true",
    telegram_notify_queue: "true",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingOllama, setTestingOllama] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{
    connected?: boolean;
    models: { name: string; size: number }[];
    error?: string;
  }>({ models: [] });
  const [backupInfo, setBackupInfo] = useState<{ database?: any; backups: any[] }>({ backups: [] });
  const [creatingBackup, setCreatingBackup] = useState(false);

  const { toasts, addToast, removeToast } = useToast();
  const { user } = useAuth();

  const fetchBackupInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/backup");
      if (res.ok) setBackupInfo(await res.json());
    } catch {}
  }, []);

  const handleCreateSnapshot = async () => {
    setCreatingBackup(true);
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast(data.message || "Tạo bản sao lưu thành công!", "success");
      fetchBackupInfo();
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setCreatingBackup(false);
    }
  };

  const fetchOllamaModels = useCallback(async (baseUrl?: string) => {
    setTestingOllama(true);
    try {
      const url = baseUrl ? `/api/ollama/models?baseUrl=${encodeURIComponent(baseUrl)}` : "/api/ollama/models";
      const res = await fetch(url);
      const data = await res.json();
      setOllamaStatus({
        connected: data.connected,
        models: data.models || [],
        error: data.error,
      });
      if (data.connected) {
        addToast(`Kết nối Ollama thành công (${data.models.length} model sẵn sàng)`, "success");
      } else {
        addToast(`Không thể kết nối Ollama: ${data.error || "Lỗi"}`, "error");
      }
    } catch (err: any) {
      setOllamaStatus({ connected: false, models: [], error: err?.message });
      addToast("Lỗi kiểm tra kết nối Ollama", "error");
    } finally {
      setTestingOllama(false);
    }
  }, [addToast]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings((prev) => ({ ...prev, ...data }));
      fetchOllamaModels(data.ollama_base_url);
    } catch {
      addToast("Lỗi tải cài đặt", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, fetchOllamaModels]);

  useEffect(() => {
    fetchSettings();
    if (user?.role === "ADMIN") {
      fetchBackupInfo();
    }
  }, [fetchSettings, fetchBackupInfo, user?.role]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Lỗi lưu");
      addToast("Đã lưu cấu hình hệ thống & Telegram thành công", "success");
    } catch {
      addToast("Lỗi lưu cài đặt", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try {
      // Lưu trước để API đọc đúng setting mới
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const res = await fetch("/api/settings/test-telegram", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gửi tin nhắn Telegram thất bại");
      addToast(data.message, "success");
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setTestingTelegram(false);
    }
  };

  const update = (key: keyof Settings, val: string) =>
    setSettings((p) => ({ ...p, [key]: val }));

  const { user: currentUser } = useAuth();
  const isManagerOrAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";

  if (currentUser && !isManagerOrAdmin) {
    return (
      <div className="page-body" style={{ textAlign: "center", padding: "100px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Truy cập bị từ chối</h2>
        <p style={{ color: "var(--text-secondary)", maxWidth: 460, margin: "0 auto 24px" }}>
          Chức năng Cấu hình Hệ thống & Ollama AI chỉ dành riêng cho Quản trị viên (Admin) và Trưởng nhóm (Manager).
        </p>
        <a href="/" className="btn btn-primary">
          ↩ Quay lại Trang chủ
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <span className="spinner spinner-lg" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>
              ⚙️ Cấu hình Hệ thống & Ollama AI
            </h1>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              Kết nối mô hình AI cục bộ không giới hạn quota và bảo mật 100% dữ liệu
            </p>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSave}
            disabled={saving}
            id="btn-save-settings"
          >
            {saving ? (
              <>
                <span className="spinner" /> Đang lưu...
              </>
            ) : (
              "💾 Lưu cài đặt"
            )}
          </button>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 840 }}>
        {/* Cấu hình Ollama */}
        <div className="card card-p-lg" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                🦙
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Máy chủ Ollama Cục bộ (Local LLM)</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Thay thế Google Gemini API — Không lo hết hạn mức (Quota 429)
                </div>
              </div>
            </div>

            {/* Trạng thái kết nối */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  background: ollamaStatus.connected ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  color: ollamaStatus.connected ? "#34d399" : "#f87171",
                  border: `1px solid ${ollamaStatus.connected ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                }}
              >
                {ollamaStatus.connected ? "● Đang hoạt động" : "○ Chưa kết nối"}
              </span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => fetchOllamaModels(settings.ollama_base_url)}
                disabled={testingOllama}
                id="btn-test-ollama"
              >
                {testingOllama ? <span className="spinner" /> : "🔄 Kiểm tra kết nối"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Ollama Base URL:
              </label>
              <input
                type="text"
                className="form-input"
                value={settings.ollama_base_url || ""}
                onChange={(e) => update("ollama_base_url", e.target.value)}
                placeholder="http://localhost:11434"
                id="input-ollama-url"
              />
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Mặc định: <code>http://localhost:11434</code>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Mô hình đang chọn (Model):
              </label>
              {ollamaStatus.models.length > 0 ? (
                <select
                  className="form-select"
                  value={settings.ollama_model || "qwen2.5:7b"}
                  onChange={(e) => update("ollama_model", e.target.value)}
                  id="select-ollama-model"
                >
                  {ollamaStatus.models.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB)
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  value={settings.ollama_model || ""}
                  onChange={(e) => update("ollama_model", e.target.value)}
                  placeholder="qwen2.5:7b hoặc qwen2.5:3b"
                  id="input-ollama-model"
                />
              )}
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Khuyên dùng: <strong>qwen2.5:7b</strong> hoặc <strong>qwen2.5:3b</strong> (rất giỏi tiếng Việt)
              </div>
            </div>
          </div>

          {ollamaStatus.models.length > 0 && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                fontSize: 12,
                color: "var(--text-secondary)",
              }}
            >
              📦 <strong>Các model đã cài đặt trên máy:</strong>{" "}
              {ollamaStatus.models.map((m) => m.name).join(", ")}
            </div>
          )}
        </div>

        {/* System Prompt */}
        <div className="card card-p-lg" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                ✍️
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>System Prompt Tổng</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Quy chuẩn và nguyên tắc viết bài cho AI
                </div>
              </div>
            </div>

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => update("system_prompt", DEFAULT_PROMPT)}
              id="btn-reset-prompt"
            >
              ↩ Khôi phục mặc định
            </button>
          </div>

          <textarea
            className="form-textarea"
            value={settings.system_prompt || ""}
            onChange={(e) => update("system_prompt", e.target.value)}
            placeholder={DEFAULT_PROMPT}
            style={{ minHeight: 280, fontSize: 13 }}
            id="input-system-prompt"
          />
        </div>

        {/* Cấu hình Google Sheets */}
        <div className="card card-p-lg">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, #0284c7, #0369a1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              📊
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Google Sheets Tự Động</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Đồng bộ tin từ bảng tính và ghi lại lịch sử
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Spreadsheet ID:
              </label>
              <input
                type="text"
                className="form-input"
                value={settings.google_spreadsheet_id || ""}
                onChange={(e) => update("google_spreadsheet_id", e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Tên trang tính (Sheet Name):
              </label>
              <input
                type="text"
                className="form-input"
                value={settings.google_sheet_name || ""}
                onChange={(e) => update("google_sheet_name", e.target.value)}
                placeholder="Trang tính1"
              />
            </div>
          </div>
        </div>

        {/* Cấu hình Thông báo Telegram Bot */}
        <div className="card card-p-lg" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                ✈️
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Thông báo Telegram Bot Tự Động</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Gửi thông báo tức thì khi có bài viết mới chờ duyệt & nhắc nhở khung giờ vàng
                </div>
              </div>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleTestTelegram}
              disabled={testingTelegram || !settings.telegram_bot_token || !settings.telegram_chat_id}
              id="btn-test-telegram"
            >
              {testingTelegram ? (
                <>
                  <span className="spinner" /> Đang gửi test...
                </>
              ) : (
                "🔔 Gửi tin nhắn test"
              )}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Telegram Bot Token:
              </label>
              <input
                type="text"
                className="form-input"
                value={settings.telegram_bot_token || ""}
                onChange={(e) => update("telegram_bot_token", e.target.value)}
                placeholder="Ví dụ: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                id="input-telegram-token"
              />
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                Lấy từ <strong>@BotFather</strong> trên Telegram (gõ /newbot)
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Telegram Chat ID (hoặc Group ID):
              </label>
              <input
                type="text"
                className="form-input"
                value={settings.telegram_chat_id || ""}
                onChange={(e) => update("telegram_chat_id", e.target.value)}
                placeholder="Ví dụ: 987654321 hoặc -100123456789"
                id="input-telegram-chat-id"
              />
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                Lấy ID cá nhân từ <strong>@userinfobot</strong> hoặc ID nhóm chat quản lý
              </div>
            </div>
          </div>

          {/* Tùy chọn sự kiện nhận thông báo */}
          <div
            style={{
              padding: "14px 16px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Sự kiện kích hoạt gửi tin:</div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.telegram_notify_pending !== "false"}
                onChange={(e) => update("telegram_notify_pending", e.target.checked ? "true" : "false")}
                style={{ width: 16, height: 16, accentColor: "var(--accent)" }}
              />
              <span>📢 Báo cho Quản trị viên & Trưởng nhóm khi có bài viết mới đang chờ duyệt</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.telegram_notify_queue !== "false"}
                onChange={(e) => update("telegram_notify_queue", e.target.checked ? "true" : "false")}
                style={{ width: 16, height: 16, accentColor: "var(--accent)" }}
              />
              <span>⏰ Báo nhắc nhở khi đến khung Giờ Vàng có bài đăng sẵn sàng trong Hàng đợi</span>
            </label>
          </div>
        </div>

        {/* Thẻ Sao lưu CSDL dành riêng cho Quản trị viên */}
        {user?.role === "ADMIN" && (
          <div className="card" style={{ marginBottom: 24 }} id="card-backup">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  💾 Sao lưu & Bảo trì CSDL SQLite (Dành cho Admin)
                </h3>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                  Tải về tệp CSDL dev.db hoặc tạo snapshot lưu trữ trên máy chủ để bảo toàn dữ liệu.
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => window.open("/api/admin/backup?action=download", "_blank")}
                >
                  ⬇️ Tải CSDL về máy (.sqlite)
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleCreateSnapshot}
                  disabled={creatingBackup}
                >
                  {creatingBackup ? "Đang sao lưu..." : "📸 Tạo Snapshot ngay"}
                </button>
              </div>
            </div>

            {backupInfo.database && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Tệp CSDL hoạt động:</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>
                    prisma/dev.db ({(backupInfo.database.size / 1024).toFixed(1)} KB)
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Số bản Snapshot lưu trữ:</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>
                    {backupInfo.backups?.length || 0} bản sao lưu
                  </div>
                </div>
              </div>
            )}

            {backupInfo.backups && backupInfo.backups.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
                  Lịch sử snapshot trên máy chủ:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {backupInfo.backups.slice(0, 5).map((b: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "rgba(255,255,255,0.015)",
                        border: "1px solid var(--border)",
                        fontSize: 12.5,
                      }}
                    >
                      <span style={{ fontFamily: "monospace" }}>📁 {b.name}</span>
                      <span style={{ color: "var(--text-muted)" }}>
                        {(b.size / 1024).toFixed(1)} KB • {new Date(b.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
