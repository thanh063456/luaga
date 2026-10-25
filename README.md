# FB Job Poster - Hệ Thống Đăng Tin Tuyển Dụng Bán Tự Động Thông Minh

Hệ thống quản lý, tối ưu hóa nội dung và hỗ trợ đăng tin tuyển dụng lên Facebook Groups thông minh. Dự án kết hợp mô hình AI ngôn ngữ lớn cục bộ (Local LLM qua Ollama), phân phối hàng đợi chống thuật toán spam của Facebook, trình tạo banner trực quan và Chrome Extension Manifest V3 hỗ trợ điền tin tự động an toàn.

---

## 🚀 Tính Năng Chính

1. **Quản Lý Tin Tuyển Dụng & Đa Dạng Hóa Nội Dung (Job & Draft Variations)**
   - Quản lý tin nguồn, phân tích JD từ file hoặc văn bản thô.
   - Sinh nhiều biến thể bài đăng với các phong cách (Chuyên nghiệp, Hài hước, Gen Z, Ngắn gọn) tránh thuật toán trùng lặp của Facebook.
   - Bộ lọc từ khóa nhạy cảm (Blacklist filter) tự động cảnh báo hoặc chặn các cụm từ dễ vi phạm tiêu chuẩn cộng đồng.

2. **Tích Hợp AI Cục Bộ (Local LLM qua Ollama)**
   - Sử dụng mô hình mã nguồn mở như `qwen2.5:7b` chạy hoàn toàn offline trên máy chủ, đảm bảo bảo mật dữ liệu tuyệt đối và không phát sinh chi phí token API.
   - Tự động viết lại nội dung phù hợp với văn phong và quy định của từng Facebook Group cụ thể.

3. **Hàng Đợi Đăng Bài Thông Minh (Smart Anti-Spam Queue)**
   - Lập lịch bài đăng theo các khung giờ vàng có tương tác cao (sáng, trưa, tối).
   - Thiết lập khoảng giãn cách thời gian ngẫu nhiên giữa các lần đăng nhằm hạn chế checkpoint/khóa tính năng Facebook.

4. **Trình Tạo Banner Tuyển Dụng (HTML5 Canvas Banner Generator)**
   - Tạo banner hình ảnh tuyển dụng bắt mắt trực tiếp trên trình duyệt bằng HTML5 Canvas.
   - Tùy chỉnh màu sắc thương hiệu, tiêu đề, phúc lợi, mức lương và xuất ảnh định dạng PNG độ nét cao.

5. **Chrome Extension (Manifest V3 - Bán Tự Động)**
   - Điền tự động nội dung bài viết và hình ảnh vào khung đăng bài của Group Facebook theo phương thức bán tự động (Semi-automated).
   - Người dùng trực tiếp kiểm tra và nhấn Đăng, đảm bảo hành vi tự nhiên của con người và phòng chống checkpoint 100%.

6. **Tích Hợp Bên Ngoài (Integrations)**
   - **Google Sheets API**: Đồng bộ tin tuyển dụng hai chiều từ bảng tính Google Sheets của phòng tuyển dụng.
   - **Telegram Bot**: Nhận thông báo tức thì khi có bài mới vào hàng đợi hoặc lỗi phát sinh trong hệ thống.

7. **Bảo Mật & Phân Quyền (RBAC 4 Cấp & Audit Log)**
   - Mã hóa mật khẩu bằng thuật toán PBKDF2 chuẩn bảo mật cao (100.000 rounds, SHA-512, unique salt).
   - Nhật ký kiểm toán (Audit Log) theo dõi mọi thao tác thay đổi dữ liệu quan trọng.
   - Hệ thống sao lưu và khôi phục cơ sở dữ liệu SQLite tự động/thủ công.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend / Fullstack Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **ORM & Database**: Prisma ORM v7, Better-SQLite3 (SQLite cục bộ)
- **AI Engine**: Ollama (mặc định mô hình `qwen2.5:7b`)
- **Browser Extension**: Chrome Extension Manifest V3 (Vanilla JS, Chrome Storage & Message Passing)
- **External APIs**: Google APIs (`googleapis`), Telegram Bot API

---

## 📋 Yêu Cầu Hệ Thống

- **Node.js**: Phiên bản `>= 20.x`
- **npm**: Phiên bản `>= 10.x`
- **Ollama**: Đã cài đặt và đang chạy ngầm (`ollama serve`)

---

## ⚙️ Cài Đặt & Khởi Chạy

### 1. Cài đặt mã nguồn & dependencies

```bash
# Di chuyển vào thư mục dự án
cd fb-job-poster

# Cài đặt thư viện
npm install
```

### 2. Cấu hình biến môi trường

Tạo file `.env` từ file mẫu `.env.example`:

```bash
cp .env.example .env
```

Nội dung cơ bản trong `.env`:
```env
# Ollama Local AI
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# Chuỗi bí mật mã hóa phiên đăng nhập
AUTH_SECRET=your_random_secret_here

# Telegram Bot (Tùy chọn)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Google Sheets API (Tùy chọn)
GOOGLE_SERVICE_ACCOUNT_JSON=
GOOGLE_SPREADSHEET_ID=
GOOGLE_SHEET_NAME=Sheet1
```

### 3. Cài đặt mô hình AI với Ollama

Khởi chạy Ollama và tải mô hình Qwen 2.5:
```bash
ollama pull qwen2.5:7b
```

### 4. Khởi tạo Cơ sở dữ liệu SQLite

```bash
# Chạy migration để khởi tạo database
npx prisma migrate dev

# Sinh Prisma Client
npx prisma generate
```

### 5. Khởi chạy ứng dụng

```bash
# Chạy ở chế độ phát triển (Development)
npm run dev

# Mở trình duyệt tại: http://localhost:3000
```

Tài khoản quản trị viên mặc định được khởi tạo khi seed hoặc đăng nhập lần đầu:
- **Email**: `admin@gmail.com`
- **Mật khẩu**: `admin123`

---

## 🧩 Cài Đặt & Sử Dụng Chrome Extension

1. Mở trình duyệt Google Chrome hoặc Microsoft Edge.
2. Truy cập vào trang quản lý tiện ích: `chrome://extensions/`.
3. Bật công tắc **Chế độ dành cho nhà phát triển** (Developer mode) ở góc trên bên phải.
4. Nhấn nút **Tải tiện ích đã giải nén** (Load unpacked).
5. Điều hướng và chọn thư mục `extension/` bên trong thư mục dự án `fb-job-poster`.
6. Mở tiện ích từ thanh công cụ trình duyệt để bắt đầu nạp tin tuyển dụng vào các nhóm Facebook.

---

## 🧪 Kiểm Thử Hệ Thống (Testing)

Dự án có sẵn kịch bản kiểm thử tích hợp tự động qua file `test-all.mjs`:

```bash
# Bước 1: Đảm bảo Web App đang chạy ở một terminal
npm run dev

# Bước 2: Mở terminal mới và thực thi bộ test
npm test
# hoặc
node test-all.mjs
```

---

## 📂 Sơ Đồ Cấu Trúc Thư Mục

```text
fb-job-poster/
├── docs/                        # Tài liệu báo cáo thực tập, ảnh đính kèm và log test
├── extension/                   # Chrome Extension Manifest V3 bán tự động
│   ├── manifest.json            # Cấu hình extension
│   ├── content.js               # Content script tương tác trên giao diện Facebook
│   ├── popup.html               # Giao diện popup extension
│   └── popup.js                 # Xử lý logic nạp tin và trigger autofill
├── prisma/                      # Quản lý cơ sở dữ liệu Prisma
│   ├── schema.prisma            # Định nghĩa bảng dữ liệu (Job, Group, User, Queue...)
│   └── migrations/              # Lịch sử migration SQLite
├── public/                      # Tệp tĩnh (icons, SVGs)
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # REST APIs (auth, queue, drafts, settings, sync...)
│   │   ├── groups/              # Giao diện quản lý danh sách Group Facebook
│   │   ├── history/             # Lịch sử đăng tin
│   │   ├── jobs/                # Quản lý việc làm & sinh biến thể AI
│   │   ├── login/               # Giao diện đăng nhập
│   │   ├── parse/               # Công cụ bóc tách JD nhanh
│   │   ├── queue/               # Hàng đợi đăng bài theo khung giờ
│   │   ├── settings/            # Cài đặt Ollama, Telegram, Sheets
│   │   └── users/               # Quản lý người dùng và phân quyền
│   ├── components/              # Các UI components tái sử dụng (Banner, Sidebar...)
│   ├── hooks/                   # Custom Hooks (useAuth, useToast)
│   └── lib/                     # Thư viện dùng chung (ollama, auth, prisma, sheets...)
├── .env.example                 # Mẫu cấu hình môi trường chuẩn
├── package.json                 # Định nghĩa dependencies và scripts
└── test-all.mjs                 # Bộ kiểm thử tích hợp hệ thống
```

---

## 👥 Phân Quyền Người Dùng (RBAC - 4 Cấp Độ)

| Vai Trò | Mã Quyền | Mô Tả Quyền Hạn |
| :--- | :--- | :--- |
| **Quản trị viên** | `ADMIN` | Toàn quyền kiểm soát hệ thống: quản lý tài khoản người dùng, xem nhật ký kiểm toán, sao lưu DB, cấu hình kết nối Ollama/Telegram/Google Sheets. |
| **Trưởng nhóm** | `MANAGER` | Quản lý việc làm, phê duyệt bài viết nháp, phân công nhóm Facebook và giám sát hàng đợi đăng tin. |
| **Tuyển dụng viên** | `RECRUITER` | Tạo tin tuyển dụng, sinh biến thể nội dung qua AI, tạo banner và trực tiếp đăng bài qua Chrome Extension theo hạn mức hàng ngày. |
| **Khách / Quan sát viên** | `VIEWER` | Quyền chỉ xem (Read-only) các danh sách tin tuyển dụng, nhóm Facebook và thống kê báo cáo. |

---

## 📄 Bản Quyền & Tác Giả

Dự án được xây dựng phục vụ báo cáo tiến độ và triển khai thực tế công tác tuyển dụng nhân sự trên nền tảng mạng xã hội.
Mọi đóng góp và mã nguồn được duy trì tại GitHub repo: [thanh063456/luaga](https://github.com/thanh063456/luaga).
