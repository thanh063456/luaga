"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || "Đăng nhập thất bại");
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at top, #1e1b4b 0%, #09090b 100%)",
        padding: 20,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "36px 32px",
          borderRadius: 16,
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(18, 18, 24, 0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 16px",
              borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              boxShadow: "0 8px 24px rgba(99, 102, 241, 0.4)",
            }}
          >
            📣
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 6 }}>
            FB Job Poster
          </h1>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 13 }}>
            Đăng nhập hệ thống quản lý tin & phân quyền tuyển dụng
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              fontSize: 13,
              marginBottom: 18,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Email tài khoản
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              required
              id="input-login-email"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Mật khẩu
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              id="input-login-password"
              style={{ width: "100%" }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting}
            id="btn-submit-login"
            style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
          >
            {submitting ? (
              <>
                <span className="spinner" /> Đang xác thực...
              </>
            ) : (
              "Đăng nhập ngay →"
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            padding: "12px 14px",
            borderRadius: 8,
            background: "rgba(99, 102, 241, 0.1)",
            border: "1px dashed rgba(99, 102, 241, 0.25)",
            fontSize: 12,
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
            💡 Tài khoản mặc định:
          </div>
          <div>Email: <strong style={{ color: "var(--accent)" }}>admin@gmail.com</strong></div>
          <div>Mật khẩu: <strong style={{ color: "var(--accent)" }}>admin123</strong></div>
        </div>
      </div>
    </div>
  );
}
