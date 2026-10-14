"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const baseNavItems = [
  { href: "/", label: "Dashboard", icon: "⚡", roles: ["ADMIN", "MANAGER", "RECRUITER", "VIEWER"] },
  { href: "/parse", label: "Dán & Phân tích AI", icon: "🧠", roles: ["ADMIN", "MANAGER", "RECRUITER"] },
  { href: "/queue", label: "Hàng đợi Giờ Vàng", icon: "⏰", roles: ["ADMIN", "MANAGER", "RECRUITER"] },
  { href: "/screen", label: "Sàng lọc CV AI", icon: "📄", roles: ["ADMIN", "MANAGER", "RECRUITER"] },
  { href: "/groups", label: "Quản lý Group", icon: "👥", roles: ["ADMIN", "MANAGER", "RECRUITER", "VIEWER"] },
  { href: "/jobs", label: "Tin tuyển dụng", icon: "📋", roles: ["ADMIN", "MANAGER", "RECRUITER", "VIEWER"] },
  { href: "/history", label: "Lịch sử", icon: "📜", roles: ["ADMIN", "MANAGER", "RECRUITER", "VIEWER"] },
  { href: "/users", label: "Quản lý Tài khoản", icon: "🛡️", roles: ["ADMIN", "MANAGER"] },
  { href: "/settings", label: "Cài đặt & Ollama", icon: "⚙️", roles: ["ADMIN", "MANAGER"] },
];

const ROLE_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: "Admin", color: "#f87171", bg: "rgba(239, 68, 68, 0.15)" },
  MANAGER: { label: "Trưởng nhóm", color: "#fbbf24", bg: "rgba(245, 158, 11, 0.15)" },
  RECRUITER: { label: "Tuyển dụng", color: "#60a5fa", bg: "rgba(59, 130, 246, 0.15)" },
  VIEWER: { label: "Chỉ xem", color: "#9ca3af", bg: "rgba(156, 163, 175, 0.15)" },
};

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  // Ẩn sidebar ở trang đăng nhập
  if (pathname === "/login") return null;

  const userRole = user?.role || "VIEWER";
  const roleBadge = ROLE_BADGES[userRole] || ROLE_BADGES.VIEWER;

  const visibleNav = baseNavItems.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="mobile-menu-btn btn btn-ghost"
        style={{ position: "fixed", top: 16, left: 16, zIndex: 200 }}
        onClick={() => setOpen(!open)}
        id="mobile-menu-toggle"
      >
        {open ? "✕" : "☰"}
      </button>

      {/* Overlay for mobile */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 49 }}
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar${open ? " open" : ""}`}>
        {/* Logo */}
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              📣
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                FB Job Poster
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Ollama · Auto · Multi-Role</div>
            </div>
          </div>
        </div>

        {/* User Badge Info */}
        {user && (
          <div
            style={{
              padding: "12px 14px",
              margin: "12px 10px 4px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.name}
              </div>
              <span
                style={{
                  display: "inline-block",
                  marginTop: 2,
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  color: roleBadge.color,
                  background: roleBadge.bg,
                }}
              >
                {roleBadge.label}
              </span>
            </div>
            <button
              onClick={() => logout()}
              title="Đăng xuất"
              className="btn btn-ghost btn-sm"
              style={{ padding: "4px 8px", fontSize: 13, color: "var(--text-muted)" }}
              id="btn-logout"
            >
              🚪
            </button>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 10px", overflowY: "auto" }}>
          {visibleNav.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-${item.href.replace("/", "") || "dashboard"}`}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  marginBottom: 3,
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? "var(--accent-light)" : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  border: isActive ? "1px solid var(--accent)30" : "1px solid transparent",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid var(--border)",
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
            <span>Ollama AI Local Engine</span>
          </div>
          <div style={{ marginTop: 2, fontSize: 10 }}>Bảo mật dữ liệu 100% nội bộ</div>
        </div>
      </aside>
    </>
  );
}
