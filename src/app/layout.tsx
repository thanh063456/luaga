import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/hooks/useAuth";

export const metadata: Metadata = {
  title: "FB Job Poster - Quản lý đăng tin tuyển dụng đa người dùng",
  description: "Ứng dụng AI Ollama viết lại và quản lý đăng tin tuyển dụng vào Facebook Group",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
