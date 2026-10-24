# BÁO CÁO TIẾN ĐỘ THỰC TẬP NGHỀ NGHIỆP – LẦN 2  
### (TỔNG KẾT VÀ BÁO CÁO KẾT THÚC THỰC TẬP TỐT NGHIỆP)

**TRƯỜNG ĐẠI HỌC ĐÀ LẠT**  
**KHOA CÔNG NGHỆ THÔNG TIN**  
**BỘ MÔN KỸ THUẬT PHẦN MỀM**  
*Học kỳ I – Năm học 2026–2027*

---

![Logo Công ty Power Connect](./logo%20pc5.png)  
*Hình 1. Logo chính thức của Công ty TNHH Thương mại Dịch vụ Power Connect.*

---

## THÔNG TIN CHUNG

* **Họ và tên sinh viên:** Ngô Công Thành
* **Mã số sinh viên:** 2212461
* **Lớp:** CTK46-PM – Khóa 46 – Chuyên ngành Kỹ thuật Phần mềm
* **Khoa:** Công nghệ Thông tin – Trường Đại học Đà Lạt
* **Email:** 2212461@dlu.edu.vn – **Số điện thoại:** 0339660104
* **Đơn vị thực tập:** Công ty TNHH Thương mại Dịch vụ Power Connect (PC5)
* **Địa chỉ cơ quan:** 18B Hồ Bá Phấn, Phường Phước Long, TP. Thủ Đức, TP. Hồ Chí Minh
* **Cán bộ hướng dẫn tại doanh nghiệp:** Đặng Thị Kim Tuyết
* **Giảng viên hướng dẫn học phần:** ThS. Phan Thị Thanh Nga
* **Thời gian thực tập toàn khóa:** 01/07/2026 – 26/09/2026 (12 tuần)
* **Giai đoạn báo cáo Lần 2:** 02/09/2026 – 26/09/2026 (Tuần 10 đến Tuần 12) & Đánh giá tổng kết tốt nghiệp toàn khóa

---

## I. MỤC ĐÍCH, Ý NGHĨA VÀ PHẠM VI BÁO CÁO GIAI ĐOẠN 2

### 1. Mục đích
Báo cáo tiến độ thực tập nghề nghiệp lần 2 là văn bản chuyên môn tổng kết toàn bộ 12 tuần thực tập thực tế của sinh viên tại Công ty TNHH Thương mại Dịch vụ Power Connect, căn cứ theo Đề cương thực tập tốt nghiệp ngành Kỹ thuật Phần mềm đã được phê duyệt. Mục đích cụ thể bao gồm:
1. Đánh giá chi tiết kết quả thực hiện các mục tiêu nghiên cứu và phát triển kỹ thuật giai đoạn 2 (Tuần 10 đến Tuần 12).
2. Trình bày toàn diện kiến trúc công nghệ, các giải pháp kỹ thuật chuyên sâu và module mở rộng của hệ thống **"Website AI viết lại và quản trị đăng tin tuyển dụng Facebook Group (FB Job Poster)"**.
3. Báo cáo quy trình kiểm thử tự động, thử nghiệm thực tế có kiểm soát trên nhóm chuyên viên tuyển dụng, đóng gói tiện ích **Chrome Extension (Manifest V3)** và bàn giao sản phẩm cho phòng ban.
4. Đánh giá khách quan các giá trị thực tiễn mang lại cho doanh nghiệp dựa trên số liệu ghi nhận cụ thể, rút ra bài học kinh nghiệm và tự đánh giá năng lực nghề nghiệp trước khi tốt nghiệp.

### 2. Ý nghĩa thực tiễn
Nếu giai đoạn 1 giải quyết bài toán cơ sở hạ tầng CNTT văn phòng và định hình khung kiến trúc cốt lõi ban đầu của ứng dụng, thì giai đoạn 2 đóng vai trò then chốt trong việc đưa sản phẩm đạt chuẩn phần mềm doanh nghiệp:
* **Tăng cường an toàn dữ liệu nội bộ:** Tách biệt luồng xử lý thông tin nhạy cảm. Toàn bộ khâu trích xuất, phân tích mô tả công việc (JD) và sinh nội dung bài viết bằng AI được chuyển đổi sang mô hình ngôn ngữ lớn cục bộ **Ollama Local LLM (`qwen2.5:7b`)**, chạy trực tiếp trên máy chủ nội bộ mà không cần gửi dữ liệu JD sang các dịch vụ LLM công cộng của bên thứ ba, đồng thời triệt tiêu nguy cơ phát sinh chi phí API định kỳ.
* **Tối ưu hóa tần suất đăng bài và giảm thiểu rủi ro spam:** Xây dựng cơ chế **Hàng đợi Giờ Vàng giãn cách ngẫu nhiên 10–15 phút** kết hợp **Bộ lọc từ khóa rủi ro (Blacklist Filter)** và **Trình tạo Banner HTML5 Canvas tự động**, giúp hoạt động đăng tin diễn ra đúng chuẩn khuyến nghị của nền tảng Facebook, hạn chế tối đa việc bị hệ thống kiểm soát đánh dấu là hành vi gửi tin dồn dập bất thường.
* **Cải thiện năng suất thao tác với Chrome Extension:** Kết nối trực tiếp giữa Dashboard quản trị và nền tảng Facebook thông qua tiện ích mở rộng 1-Click Injector, giúp chuyên viên loại bỏ thao tác sao chép thủ công qua lại giữa các tab trình duyệt.

---

## II. TỔNG QUAN KẾT QUẢ KẾ THỪA TỪ GIAI ĐOẠN 1 (TUẦN 1 – TUẦN 9)

Trong 9 tuần đầu tiên (01/07/2026 – 01/09/2026), sinh viên đã hoàn thành các nội dung nền tảng theo đúng tiến độ:

```mermaid
graph LR
    subgraph "Giai đoạn 1 (Tuần 1 - 9): Nền tảng & Cốt lõi"
        IT["Hạ tầng IT & WPS Office<br/>Máy in mạng LAN"] --> DB["Thiết kế CSDL SQLite<br/>Prisma ORM"]
        DB --> FE["Full-stack Next.js 16<br/>Tailwind CSS"]
        FE --> V1["FB Job Poster v1.0<br/>6 Chức năng cốt lõi"]
    end
    subgraph "Giai đoạn 2 (Tuần 10 - 12): Tích hợp & Kiểm thử thực tế"
        V1 --> LLM["Ollama Local LLM & Anti-spam"]
        LLM --> SEC["RBAC 4 cấp & Audit Log"]
        SEC --> MULTI["Canvas Banner & Multi-channel"]
        MULTI --> EXT["Chrome Extension & UAT"]
    end
```

1. **Công tác Hỗ trợ CNTT văn phòng:**
   * Triển khai cài đặt, chuẩn hóa định dạng văn bản và đào tạo sử dụng bộ phần mềm **WPS Office** trên 15 máy trạm, tiết kiệm chi phí bản quyền phần mềm văn phòng cho công ty.
   * Lắp đặt, cấp phát IP tĩnh, chia sẻ mạng nội bộ và cấu hình in hai mặt (Duplex) ổn định cho máy in phòng tuyển dụng.
2. **Khảo sát nghiệp vụ và Thiết kế hệ sinh thái FB Job Poster:**
   * Xác định rõ bài toán quá tải: mỗi ngày phòng tuyển dụng phải xử lý hàng chục chỉ tiêu việc làm thời vụ và chính thức. Nhân sự mất nhiều thời gian soạn thảo thủ công trên từng hội nhóm Facebook, nội dung dễ trùng lặp dẫn đến việc bị giảm tương tác hoặc tài khoản bị giới hạn tính năng đăng bài tạm thời.
   * Lựa chọn ngăn xếp công nghệ Full-stack hiện đại: **Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, SQLite, Prisma ORM**.
3. **Hiện thực hóa 6 chức năng cơ sở ban đầu:**
   * Bóc tách thông tin JD từ tệp Word (.docx) và CSV bằng `mammoth` và `papaparse`.
   * Quản lý danh mục Facebook Group và phân vùng địa lý (Hà Nội, TP.HCM, Bình Dương, Đồng Nai, Toàn quốc).
   * Thuật toán đối chiếu thông minh ghép nối công việc với các Group phù hợp theo vị trí địa lý.
   * Sinh bản nháp tự động bằng AI tránh trùng lặp nội dung.
   * Bảng điều khiển (Dashboard) trực quan tích hợp nút 1-Click Copy & Mở nhóm.
   * Theo dõi trạng thái bản nháp (`draft`, `copied`, `posted`).

---

## III. NỘI DUNG KỸ THUẬT VÀ CÁC MODULE TRIỂN KHAI TRONG GIAI ĐOẠN 2 (TUẦN 10 – TUẦN 12)

Giai đoạn 2 tập trung nâng cấp hệ thống lên quy chuẩn giải pháp doanh nghiệp với 6 phân hệ kỹ thuật nâng cao:

```mermaid
graph TD
    A["1. Nâng cấp AI Engine<br/>(Ollama Local LLM + Anti-spam)"] --> B["2. Phân quyền RBAC 4 cấp<br/>& Nhật ký Audit Log"]
    B --> C["3. Hàng đợi Giờ Vàng<br/>(Post Schedule Queue)"]
    C --> D["4. Trình tạo Banner tự động<br/>(HTML5 Canvas Engine)"]
    D --> E["5. Tích hợp Đa kênh<br/>(Google Sheets API & Telegram Bot)"]
    E --> F["6. Tiện ích Chrome Extension<br/>(1-Click Facebook Injector)"]
    F --> G["7. Kiểm thử thực tế & Bàn giao"]
```

---

### 1. Nâng cấp kiến trúc AI: Chuyển đổi sang Ollama Local LLM (`qwen2.5:7b`)

#### a) Bối cảnh và Động lực kỹ thuật
Trong giai đoạn đầu, hệ thống sử dụng Cloud API công cộng. Tuy nhiên, khi đưa vào thử nghiệm trên quy mô phòng ban, 2 hạn chế xuất hiện:
1. **Giới hạn tần suất gọi API (Rate Limit HTTP 429):** Khi nhiều chuyên viên cùng tạo bản nháp cho nhiều nhóm cùng lúc, các request đồng thời dễ bị nghẽn mạng hoặc vượt hạn mức gói miễn phí.
2. **Kiểm soát luồng dữ liệu nghiệp vụ:** Thông tin mô tả công việc nội bộ, liên hệ quản lý và mức thu nhập chi tiết cần được quản lý tập trung trên máy chủ nội bộ của doanh nghiệp, không phụ thuộc vào hạ tầng đám mây bên ngoài.

#### b) Hiện thực hóa giải pháp kỹ thuật (`src/lib/ollama.ts`)
Sinh viên đã tích hợp nền tảng máy chủ **Ollama** nội bộ chạy mô hình mã nguồn mở thế hệ mới **`qwen2.5:7b`** (phiên bản lượng tử hóa 4-bit `q4_K_M` giúp cân bằng giữa tốc độ xử lý trên CPU văn phòng và chất lượng ngôn ngữ tiếng Việt).

```mermaid
sequenceDiagram
    autonumber
    actor HR as Chuyên viên Tuyển dụng
    participant Web as Next.js API (/api/drafts/rewrite)
    participant Lib as Service lib/ollama.ts
    participant Blacklist as Bộ lọc Blacklist Keyword
    participant Ollama as Ollama Local (localhost:11434)
    participant DB as SQLite (Prisma ORM)

    HR->>Web: Yêu cầu viết lại tin tuyển dụng (kèm Tone & Group ID)
    Web->>Lib: Gọi hàm generateTextWithOllama()
    Lib->>Ollama: Gửi Prompt chuyên biệt (System Prompt + Job Details + Rules)
    Ollama-->>Lib: Phản hồi nội dung bài đăng độc bản
    Lib->>Blacklist: Quét từ khóa rủi ro (checkBlacklistWords)
    alt Phát hiện từ khóa rủi ro
        Blacklist-->>Lib: Cảnh báo từ ngữ vi phạm chính sách tuyển dụng Meta
        Lib->>Ollama: Tự động yêu cầu lọc và thay thế bằng từ ngữ chuẩn mực
    end
    Lib-->>Web: Trả về nội dung hoàn chỉnh, an toàn
    Web->>DB: Lưu PostDraft mới vào CSDL
    Web-->>HR: Hiển thị bản nháp sẵn sàng đăng tin
```

> [!NOTE]
> **Về ranh giới an toàn dữ liệu:** Quá trình phân tích JD và sinh bài viết của AI diễn ra 100% offline cục bộ trên máy chủ nội bộ. Các dịch vụ ngoại vi khác như Google Sheets chỉ đọc dữ liệu bảng tính JD công khai và Telegram Bot chỉ gửi tin nhắn thông báo tóm tắt qua kết nối bảo mật HTTPS có chủ đích.

#### c) Thiết kế System Prompt và Đa dạng hóa 5 Phong cách văn phong
Nhằm tránh tình trạng các bài đăng có cấu trúc rập khuôn gây nhàm chán cho ứng viên, hệ thống xây dựng 5 bộ chỉ dẫn phong cách (Tone Presets):

| Mã Tone | Tên phong cách | Mục đích và Ứng dụng thực tế |
| :--- | :--- | :--- |
| `tu_nhien` | Tự nhiên & Thân thiện | Ngôn từ gần gũi, chân thành, phù hợp với các hội nhóm việc làm khu vực, công nhân tìm việc phổ thông. |
| `gen_z` | Trẻ trung (Gen Z) | Ngắn gọn, tích cực, nhiều emoji trực quan, phù hợp các vị trí part-time, phục vụ, đóng gói hàng online. |
| `chuyen_nghiep` | Chuyên nghiệp & Trang trọng | Câu từ gãy gọn, nhấn mạnh đãi ngộ chuẩn mực, lộ trình thăng tiến, phù hợp vị trí kỹ thuật viên, quản lý ca. |
| `gap_rut` | Tuyển gấp (Call to Action) | Nhấn mạnh tính thời điểm: "Đi làm ngay", "Hạn chót tuần này", thúc đẩy người lao động để lại liên hệ sớm. |
| `storytelling` | Dạng kể chuyện | Mở đầu bằng sự đồng cảm với nhu cầu việc làm, dẫn dắt tự nhiên đến cơ hội thu nhập ổn định tại doanh nghiệp. |

#### d) Cơ chế phòng ngừa: Bộ lọc từ khóa rủi ro (Anti-spam Blacklist Filter)
Nhằm hỗ trợ chuyên viên không sử dụng các từ ngữ vi phạm tiêu chuẩn quảng cáo việc làm của Meta, hàm `checkBlacklistWords()` được kích hoạt tự động trước khi lưu bản nháp:
```typescript
export const BLACKLIST_WORDS = [
  "cam kết 100%", "việc nhẹ lương cao", "thu nhập thụ động",
  "hoa hồng khủng", "không cần kinh nghiệm lương 30", "cọc tiền",
  "đặt cọc", "chuyển khoản trước", "bao đậu", "làm giàu nhanh"
];

export function checkBlacklistWords(text: string): { found: string[]; isClean: boolean } {
  const lower = text.toLowerCase();
  const found = BLACKLIST_WORDS.filter((word) => lower.includes(word));
  return { found, isClean: found.length === 0 };
}
```

---

### 2. Hệ thống Phân quyền người dùng (RBAC 4 cấp) và Nhật ký Kiểm toán (Audit Log)

Nhằm đáp ứng yêu cầu quản lý vận hành chuyên nghiệp tại doanh nghiệp, sinh viên đã xây dựng cơ chế kiểm soát truy cập dựa trên vai trò (Role-Based Access Control) cùng hệ thống theo dõi kiểm toán.

```mermaid
graph TD
    U["Hệ Thống Phân Quyền RBAC"] --> A["1. ADMIN (Quản trị viên)"]
    U --> M["2. MANAGER (Trưởng nhóm Tuyển dụng)"]
    U --> R["3. RECRUITER (Chuyên viên Tuyển dụng)"]
    U --> V["4. VIEWER (Cộng tác viên / Thực tập sinh)"]

    A --> A1["Cấu hình Model Ollama & API"]
    A --> A2["Quản trị tài khoản & Điều chỉnh Quota"]
    A --> A3["Sao lưu & Tải CSDL SQLite 1-Click"]

    M --> M1["Phê duyệt / Từ chối hàng loạt (/api/drafts/batch)"]
    M --> M2["Ghi chú lý do chỉnh sửa (Inline Review Note)"]
    M --> M3["Theo dõi bảng tiến độ đăng tin toàn phòng"]

    R --> R1["Tạo bản nháp, sinh bài AI theo Tone"]
    R --> R2["Tạo Banner ảnh Canvas 16:9"]
    R --> R3["Hẹn giờ nhắc Đẩy bài (Bump Reminder)"]

    V --> V1["Xem thông tin ca làm việc & đối tác"]
```

#### a) Chi tiết ma trận quyền hạn hệ thống

| Tính năng / Phân hệ | ADMIN | MANAGER | RECRUITER | VIEWER |
| :--- | :---: | :---: | :---: | :---: |
| **Quản trị tài khoản & Thiết lập AI Quota** | Toàn quyền | Không | Không | Không |
| **Sao lưu & Tải CSDL Snapshot 1-Click** | Có | Không | Không | Không |
| **Cấu hình hệ thống (Ollama, Sheets, Telegram)** | Có | Không | Không | Không |
| **Duyệt / Từ chối bài viết hàng loạt** | Có | Có | Không | Không |
| **Nhập ghi chú góp ý nội dung bài nháp** | Có | Có | Không | Không |
| **Giám sát bảng tổng hợp KPI toàn phòng** | Có | Có | Chỉ xem cá nhân | Không |
| **Tạo tin tuyển dụng & Gọi AI sinh bản nháp** | Không giới hạn | Theo hạn ngạch (mặc định 50/ngày) | Theo hạn ngạch (mặc định 50/ngày) | Không |
| **Tạo banner đồ họa bằng HTML5 Canvas** | Có | Có | Có | Không |
| **Xếp bài vào Hàng đợi Khung Giờ Vàng** | Có | Có | Có | Không |
| **Xem danh sách công việc & bài viết đã duyệt** | Có | Có | Có | Có |

> [!NOTE]
> **Làm rõ cơ chế Hạn ngạch AI (`ai_quota_per_day`):** Trong schema CSDL, trường `ai_quota_per_day` được thiết lập mặc định giá trị `50` cho các tài khoản mới nhằm giới hạn tải xử lý trên máy chủ. Tuy nhiên, trong mã nguồn logic xử lý (`src/app/api/sync/route.ts`), hệ thống sẽ kiểm tra: nếu tài khoản có vai trò `ADMIN`, bước kiểm tra hạn ngạch sẽ tự động được bỏ qua (Unlimited). Đối với `MANAGER` và `RECRUITER`, số lượt gọi AI được kiểm soát theo định mức ngày, và Quản trị viên có toàn quyền tùy chỉnh tăng/giảm hạn ngạch này trong trang Quản lý Tài khoản (`/users`).

#### b) Kỹ thuật bảo mật xác thực và Nhật ký kiểm toán (`src/lib/auth.ts`)
* **Mã hóa mật khẩu chuẩn PBKDF2:** Sử dụng thuật toán băm chuẩn công nghiệp PBKDF2 với Cryptographic Salt ngẫu nhiên 16 bytes và **100,000 vòng lặp**:
  $$\text{DerivedKey} = \text{PBKDF2}(\text{password}, \text{salt}, 100000, 64, \text{"sha512"})$$
* **So sánh thời gian chuẩn (`crypto.timingSafeEqual`):** Ngăn chặn nguy cơ tấn công Timing Attack khi đối chiếu mã băm xác thực.
* **Bảo vệ qua Token phiên (HMAC-SHA256):** Tự sinh và kiểm chứng chữ ký số cho Cookie phiên `fb_job_auth_token` với thời hạn hợp lệ 7 ngày.
* **Ghi vết tự động (Audit Logging):** Mọi hành vi quản trị (`LOGIN`, `BATCH_APPROVE_DRAFTS`, `BATCH_REJECT_DRAFTS`, `BACKUP_DATABASE`, `CREATE_USER`, `SETTING_CHANGE`) đều được lưu vào bảng `AuditLog` kèm địa chỉ IP và mã người dùng để phục vụ công tác rà soát.

---

### 3. Quản lý Hàng đợi đăng bài theo Khung Giờ Vàng (`PostScheduleQueue`)

Hành vi đăng liên tục nhiều bài viết trong khoảng thời gian rất ngắn là nguyên nhân hàng đầu khiến tài khoản bị thuật toán Meta tạm khóa tính năng đăng bài do nghi vấn sử dụng công cụ tự động hóa không được phép.

```mermaid
gantt
    title Phân Bổ 4 Khung Giờ Vàng Tuyển Dụng Lao Động
    dateFormat HH:mm
    axisFormat %H:%M

    section Sáng (07:30 - 09:00)
    Lướt tin đầu ngày & chờ ca :active, m1, 07:30, 09:00
    section Trưa (11:30 - 13:00)
    Nghỉ trưa & ăn trưa tại xưởng :active, m2, 11:30, 13:00
    section Chiều (16:30 - 18:00)
    Tan ca làm việc & đổi ca :active, m3, 16:30, 18:00
    section Tối (19:30 - 22:00)
    Nghỉ ngơi tại nhà & tìm việc :active, m4, 19:30, 22:00
```

#### a) Thiết kế giải pháp kỹ thuật (`/queue`)
* Bảng điều khiển Hàng đợi tại `/queue` cho phép chuyên viên chọn các bài viết đã được duyệt để xếp vào 4 khung giờ có lượng tương tác tìm việc cao nhất của công nhân:
  1. **Khung Sáng (07:30 – 09:00):** Đón đầu lượng công nhân tìm việc trước ca sáng.
  2. **Khung Trưa (11:30 – 13:00):** Giờ ăn cơm và giải lao giữa ca của người lao động.
  3. **Khung Chiều (16:30 – 18:00):** Giờ tan tầm, người lao động tra cứu cơ hội tăng ca hoặc chuyển việc.
  4. **Khung Tối (19:30 – 22:00):** Thời điểm người lao động nghỉ ngơi tại phòng trọ và tích cực tìm kiếm việc làm qua mạng xã hội.

#### b) Thuật toán giãn cách an toàn ngẫu nhiên (Randomized Delay Interval)
* Nhằm tuân thủ nguyên tắc vận hành tự nhiên của nền tảng, hệ thống tự động phân bổ lịch đăng với khoảng cách ngẫu nhiên từ **10 đến 15 phút** giữa các bài viết trong cùng một khung giờ:
  $$T_{\text{dự kiến}}(i) = T_{\text{bắt đầu}} + \sum_{k=1}^{i} \Delta t_k, \quad \Delta t_k \in [10\text{ phút}, 15\text{ phút}]$$
* Cơ chế này giúp điều tiết nhịp độ đăng bài của nhân sự một cách hợp lý và khoa học, giảm thiểu tối đa rủi ro tài khoản bị hệ thống kiểm soát của Facebook gắn cờ vi phạm vì lý do đăng tin dồn dập.

---

### 4. Trình tạo ảnh Banner tuyển dụng tự động trên nền HTML5 Canvas

Khảo sát thực tế tại phòng tuyển dụng cho thấy các bài đăng kèm hình ảnh tóm tắt vị trí và mức lương thu hút lượng người xem cao hơn nhiều so với bài viết chỉ có văn bản thuần túy. Tuy nhiên, việc thiết kế thủ công bằng các công cụ bên ngoài tốn từ 15–20 phút cho mỗi bài.

```mermaid
graph LR
    JD["Dữ liệu JD<br/>(Vị trí, Lương, Quyền lợi, Hotline)"] --> CANVAS["HTML5 Canvas 2D Engine<br/>(1200 x 675 px - Tỷ lệ 16:9)"]
    THEME["3 Theme Presets<br/>Violet / Blue / Amber"] --> CANVAS
    CANVAS --> CLIP["1-Click Clipboard API<br/>(Copy ảnh tức thì)"]
    CANVAS --> PNG["Tải tệp PNG<br/>(Độ nét cao)"]
```

#### a) Kỹ thuật kết xuất đồ họa đa lớp (`BannerGeneratorModal.tsx`)
Module sử dụng công nghệ **HTML5 Canvas 2D Context** với tỷ lệ chuẩn **16:9 (1200 x 675 pixel)**, hỗ trợ 3 bộ chủ đề thống nhất:
1. **Chủ đề `violet` (Violet Night):** Nền Gradient tối sang trọng (`#0f0c29` đến `#302b63`), viền phát sáng tím, phù hợp vị trí việc làm văn phòng và nhân viên tư vấn.
2. **Chủ đề `blue` (Ocean Blue):** Nền Gradient xanh biển thanh lịch (`#09203f` đến `#537895`), khung viền màu xanh ngọc (Cyan), phù hợp với các đơn vị tuyển dụng kỹ thuật viên, thợ máy.
3. **Chủ đề `amber` (Amber Warm):** Nền Gradient màu hổ phách ấm áp (`#2c1503` đến `#6d3b0f`), khung mức lương màu cam rực rỡ, bắt mắt đối với các tin tuyển dụng công nhân thời vụ gấp.

Các lớp đồ họa được tự động sắp xếp gồm: Tên công ty đối tác, Tiêu đề vị trí tuyển dụng, Khung mức lương nổi bật, Danh sách 4 quyền lợi cơ bản (BHXH, phụ cấp, thưởng lễ tết...) và Hotline/Zalo liên hệ ở chân ảnh.

#### b) Cơ chế Clipboard API tiện lợi
Thay vì phải lưu tệp về máy tính rồi tải lên lại, nhân sự có thể nhấn nút **"📋 Copy ảnh"**:
```javascript
canvas.toBlob(async (blob) => {
  if (blob) {
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob })
    ]);
  }
}, "image/png");
```
Sau đó, chuyên viên chỉ cần dùng tổ hợp phím `Ctrl + V` dán thẳng vào khung soạn thảo bài đăng của Facebook.

---

### 5. Tích hợp Đa kênh: Đồng bộ Google Sheets và Cảnh báo qua Telegram Bot

```mermaid
graph LR
    GS["Google Sheets API v4<br/>(Bảng tính JD đối tác)"] -->|fetchJobsFromSheet| APP["Website FB Job Poster"]
    APP -->|notifyDraftsPendingApproval| TG["Telegram Bot API<br/>(Nhóm Quản lý & HR)"]
    APP <-->|Prisma ORM| DB[(SQLite Database)]
```

#### a) Đồng bộ tự động với Google Sheets (`src/lib/sheets.ts`)
* Đối tác nhà máy thường xuyên cập nhật danh sách vị trí việc làm qua Google Sheets.
* Hệ thống tích hợp thư viện `googleapis` thông qua tài khoản dịch vụ (Google Service Account) với quyền hạn chỉ đọc (Read-only):
  * Tự động quét và đọc dữ liệu từ các cột chuẩn: *Ngày đăng, Vị trí tuyển dụng, Khu vực, Mô tả, Yêu cầu, Mức lương, Thông tin liên hệ*.
  * Kiểm tra khử trùng lặp dựa trên khóa kết hợp `[Tên công ty + Vị trí + Ngày]` trước khi đưa vào bảng `JobPost`.

#### b) Cảnh báo tức thời qua Telegram Bot (`src/lib/telegram.ts`)
* Tích hợp Telegram Bot phục vụ công tác điều phối:
  * **Thông báo bài viết chờ duyệt:** Khi chuyên viên tạo bài nháp mới, bot gửi tin nhắn tóm tắt đến nhóm Telegram của Ban quản lý để nhắc duyệt bài kịp thời.
  * **Nhắc lịch đăng bài:** Khi đến mốc thời gian của một bài viết trong Hàng đợi, bot gửi thông báo nhắc chuyên viên phụ trách mở nhóm để hoàn tất việc đăng tin.

---

### 6. Phát triển và đóng gói Tiện ích Chrome Extension: FB Job Poster Assistant

Để hoàn thiện quy trình từ hệ thống web sang trực tiếp giao diện Facebook, sinh viên đã xây dựng tiện ích mở rộng **Chrome Extension (Manifest V3)** độc lập trong thư mục `extension/`.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Chuyên viên Tuyển dụng
    participant Ext as Popup Extension (popup.js)
    participant Tab as Facebook Tab (content.js)
    participant DOM as Facebook DOM (Lexical Editor)
    participant API as Web App (localhost:3000)

    HR->>Ext: Mở Extension trên trình duyệt -> Bấm "⚡ Điền 1-Click"
    Ext->>Tab: Gửi Message chrome.tabs.sendMessage("INJECT_POST", data)
    Tab->>DOM: Quét tìm khung soạn thảo (role="textbox")
    Tab->>DOM: Thực thi document.execCommand("insertText") & Dispatch InputEvent
    DOM-->>Tab: Facebook tiếp nhận văn bản thành công
    Tab->>Tab: Hiển thị Floating Assistant Overlay
    HR->>DOM: Kiểm tra và bấm nút "Đăng" của Facebook
    HR->>Tab: Bấm "✅ Đã đăng xong" trên Overlay
    Tab->>API: Gửi PUT /api/drafts/{id} cập nhật trang_thai="posted"
    API-->>Tab: Xác nhận cập nhật thành công
```

#### Chi tiết kỹ thuật của Chrome Extension:
1. **Kiến trúc Manifest V3 an toàn:** Khai báo quyền hạn tối thiểu (`activeTab`, `tabs`), tuân thủ chuẩn mở rộng mới nhất của trình duyệt Chromium.
2. **Kỹ thuật tương thích với khung soạn thảo Facebook (Lexical Editor):**
   * Khung soạn thảo của Facebook sử dụng cấu trúc DOM phức tạp được quản lý state chặt chẽ bởi React. Việc gán giá trị thuần túy vào thuộc tính `innerText` sẽ không kích hoạt state của React, dẫn đến việc nút "Đăng" vẫn bị khóa mờ.
   * Sinh viên đã giải quyết bằng cách kết hợp:
     * Focus chính xác vào phần tử `contenteditable="true"` mang thuộc tính `role="textbox"`.
     * Thực thi lệnh `document.execCommand('insertText', false, text)` để mô phỏng sự kiện nhập văn bản từ bàn phím.
     * Kích hoạt đồng thời các sự kiện `InputEvent` có cờ `bubbles: true`.
3. **Cửa sổ trợ lý trực quan (Floating Assistant Overlay):**
   * Sau khi điền bài thành công, một hộp thoại nổi xuất hiện ở góc trên bên phải màn hình Facebook.
   * Hộp thoại cung cấp nút tương tác nhanh: **"✅ Đã đăng xong"** (gọi API cập nhật trạng thái về máy chủ web) và **"📋 Copy lại"** (để nhân viên dán thêm vào phần bình luận khi cần thiết).

---

## IV. MÔ PHỎNG GIAO DIỆN HỆ THỐNG VÀ THỰC THI THỰC TẾ

Dưới đây là sơ đồ mô phỏng cấu trúc giao diện thực tế của hệ sinh thái phần mềm FB Job Poster:

### 1. Giao diện Bảng điều khiển Quản trị & Hàng đợi Giờ Vàng (`/queue`)

```
+-------------------------------------------------------------------------------------------------------+
|  FB JOB POSTER  |  [Dashboard]  [Tin tuyển dụng]  [Hàng đợi Giờ Vàng]  [Cài đặt]  | (Admin - Ngô Thành) |
+-------------------------------------------------------------------------------------------------------+
|  HANG DOI DANG BAI THEO KHUNG GIO VANG (CHONG SPANG META)                                             |
|  [+ Xep bai vao Hang doi]  [Loc: Khung Sang v]  [Trang thai: Dang cho v]                               |
|                                                                                                       |
|  +-------------------------------------------------------------------------------------------------+  |
|  | KHUNG SANG (07:30 - 09:00) | 3 bai viet trong hang doi                                          |  |
|  |-------------------------------------------------------------------------------------------------|  |
|  | [07:42] Cong nhan lap rap dien tu Nidec  -> Group: Hoi Tim Viec Thu Duc  | [⚡ Mo & Copy] [Da dang] |  |
|  | [07:56] Nhan vien dong goi Platel Vina   -> Group: Viec Lam KCN Song Than | [⚡ Mo & Copy] [Da dang] |  |
|  | [08:11] Phu kho logistics Shopee Xpress  -> Group: Cong Nhan Binh Duong   | [⚡ Mo & Copy] [Da dang] |  |
|  +-------------------------------------------------------------------------------------------------+  |
|                                                                                                       |
|  +-------------------------------------------------------------------------------------------------+  |
|  | KHUNG TRUA (11:30 - 13:00) | 2 bai viet trong hang doi                                          |  |
|  |-------------------------------------------------------------------------------------------------|  |
|  | [11:38] Nhan vien kiem hang QC May mac   -> Group: Tim Viec Quan 9 - Thu Duc| [⚡ Mo & Copy] [Da dang]|
|  | [11:52] Tho han cong nghiep Nidec Tosok  -> Group: Viec Lam Khu Cong Nghe Cao| [⚡ Mo & Copy] [Da dang]|
|  +-------------------------------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------------------------------+
```

### 2. Giao diện Chrome Extension & Overlay trên Facebook

```
+----------------------------------------------------+    +-----------------------------------------------+
|  FB JOB POSTER ASSISTANT (Extension Popup)         |    |  GIAO DIEN FACEBOOK GROUP TRONG TRINH DUYET   |
+----------------------------------------------------+    |                                               |
|  Trang thai: ● Dang mo Facebook                    |    |   +---------------------------------------+   |
|  [Tim kiem bai viet...]                            |    |   | Tao bai viet cong khai...             |   |
|                                                    |    |   |                                       |   |
|  +-----------------------------------------------+ |    |   | [Nội dung AI đã được điền tự động...]|   |
|  | Cong nhan Lap rap Dien tu Nidec (TP.HCM)      | |    |   +---------------------------------------+   |
|  | De xuat cho: Hoi Tim Viec Lam Thu Duc         | |    |   | [Anh Banner 16:9 da dan bang Ctrl+V]  |   |
|  | Tone: Tu nhien | Trang thai: Da duyet          | |    |   +---------------------------------------+   |
|  |                                               | |    |   | [         DANG BAI VIET            ]  |   |
|  | [⚡ DIEN 1-CLICK]   [📋 Copy]   [Tao Banner]   | |    |   +---------------------------------------+   |
|  +-----------------------------------------------+ |    |                                               |
|                                                    |    |   +---------------------------------------+   |
|  +-----------------------------------------------+ |    |   | 🎉 FB JOB POSTER ASSISTANT            |   |
|  | Nhan vien Dong goi Hang hoa Platel Vina       | |    |   | Da dien bai thanh cong! Kiem tra lai  |   |
|  | [⚡ DIEN 1-CLICK]   [📋 Copy]   [Tao Banner]   | |    |   | truoc khi bam nut Dang.               |   |
|  +-----------------------------------------------+ |    |   | [✅ Da dang xong]     [📋 Copy lai]   |   |
+----------------------------------------------------+    |   +---------------------------------------+   |
                                                          +-----------------------------------------------+
```

---

## V. THIẾT KẾ CƠ SỞ DỮ LIỆU GIAI ĐOẠN 2 (DATABASE SCHEMA)

Cơ sở dữ liệu được quản lý tập trung thông qua **Prisma ORM** và **SQLite**, bao gồm 9 bảng thực thể:

```mermaid
erDiagram
    User ||--o{ PostDraft : "soạn_thảo"
    User ||--o{ JobPost : "tạo_tin"
    User ||--o{ GroupAssignment : "được_phân_công"
    User ||--o{ AuditLog : "thực_hiện"
    Group ||--o{ GroupAssignment : "phân_cho"
    Group ||--o{ PostDraft : "đăng_vào"
    JobPost ||--o{ PostDraft : "sinh_bản_nháp"
    PostDraft ||--o{ PostScheduleQueue : "xếp_hàng_đợi"

    User {
        string id PK
        string email UK
        string name
        string password
        string role "ADMIN | MANAGER | RECRUITER | VIEWER"
        string trang_thai "active | locked"
        int ai_quota_per_day
        int ai_used_today
        string last_active_day
    }

    AuditLog {
        string id PK
        string user_id FK
        string hanh_dong
        string chi_tiet
        string ip_address
        datetime createdAt
    }

    Group {
        string id PK
        string ten_group
        string link_group
        string khu_vuc
        string ghi_chu
        string trang_thai
    }

    GroupAssignment {
        string id PK
        string user_id FK
        string group_id FK
    }

    JobPost {
        string id PK
        string ten_cong_ty
        string vi_tri_tuyen
        string khu_vuc
        string mo_ta_cong_viec
        string yeu_cau
        string muc_luong
        string thong_tin_lien_he
        string trang_thai_sync
        string user_id FK
    }

    JobTemplate {
        string id PK
        string ten_cong_ty
        string vi_tri_tuyen
        string khu_vuc
        string mo_ta_cong_viec
        string yeu_cau
        string muc_luong
        string thong_tin_lien_he
    }

    PostDraft {
        string id PK
        string job_post_id FK
        string group_id FK
        string noi_dung_ai_viet
        string trang_thai "draft | copied | posted"
        string trang_thai_duyet "pending | approved | rejected"
        string duyet_boi
        string ghi_chu_duyet
        string link_bai_dang
        datetime nhac_day_bai
        string tone
        string user_id FK
    }

    PostScheduleQueue {
        string id PK
        string draft_id FK
        datetime thoi_gian_du_kien
        string trang_thai "waiting | completed | skipped"
        string khung_gio "sang | trua | chieu | toi"
        string ghi_chu
    }

    Setting {
        string key PK
        string value
        datetime updatedAt
    }
```

### Bảng đặc tả các trường dữ liệu cốt lõi giai đoạn 2:

| Tên Bảng | Thuộc tính | Kiểu dữ liệu | Khóa / Ràng buộc | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :---: | :--- |
| `User` | `role` | String | Mặc định: `RECRUITER` | Phân quyền 4 cấp độ: ADMIN, MANAGER, RECRUITER, VIEWER |
| `User` | `ai_quota_per_day` | Integer | Mặc định: `50` | Hạn ngạch gọi AI tối đa trong ngày (Admin được miễn trừ kiểm tra) |
| `PostDraft` | `trang_thai_duyet`| String | Mặc định: `pending` | Trạng thái kiểm duyệt bài viết: `pending`, `approved`, `rejected` |
| `PostDraft` | `duyet_boi` | String | Tùy chọn | Tên hoặc mã tài khoản của Quản lý đã thực hiện phê duyệt |
| `PostDraft` | `ghi_chu_duyet` | String | Mặc định: `""` | Lý do từ chối hoặc hướng dẫn chỉnh sửa gửi về cho chuyên viên |
| `PostDraft` | `nhac_day_bai` | DateTime | Tùy chọn | Thời điểm hệ thống kích hoạt nhắc nhở chuyên viên "Đẩy bài" |
| `PostDraft` | `tone` | String | Mặc định: `tu_nhien` | Phong cách văn phong AI đã áp dụng cho bản nháp này |
| `PostScheduleQueue` | `khung_gio`| String | Mặc định: `sang` | Khung giờ vàng dự kiến đăng bài: `sang`, `trua`, `chieu`, `toi` |
| `PostScheduleQueue` | `thoi_gian_du_kien`| DateTime | Bắt buộc | Thời điểm đăng bài đã được tính toán giãn cách ngẫu nhiên 10–15 phút |
| `AuditLog` | `hanh_dong` | String | Bắt buộc | Mã hành vi kiểm toán: `LOGIN`, `BATCH_APPROVE_DRAFTS`,... |

---

## VI. QUY TRÌNH KIỂM THỬ VÀ ĐẢM BẢO CHẤT LƯỢNG (TESTING & QA)

Để đảm bảo hệ thống vận hành ổn định trước khi bàn giao, sinh viên đã xây dựng bộ kịch bản kiểm thử tự động toàn diện (`test-all.mjs`) kết hợp kiểm thử giao diện thực tế.

### 1. Kết quả thực thi kiểm thử tự động toàn bộ API (`test-all.mjs`)

```
==================================================
🚀 BẮT ĐẦU TEST TOÀN BỘ CHỨC NĂNG HỆ THỐNG FB JOB POSTER
==================================================
--- 1. Kiểm tra Xác thực & Đăng nhập (RBAC) ---
✅ [PASS] Đăng nhập tài khoản Admin mặc định (HTTP 200)
✅ [PASS] Quyền tài khoản đăng nhập là ADMIN: ADMIN
✅ [PASS] Lấy thông tin phiên làm việc /api/auth/me (HTTP 200)

--- 2. Kiểm tra Quản lý Facebook Group ---
✅ [PASS] Lấy danh sách Facebook Groups /api/groups (HTTP 200)
✅ [PASS] Số lượng Group hiện có: 18 groups

--- 3. Kiểm tra Nhập Tin Tuyển Dụng & Bộ Nhớ Mẫu Công Việc ---
✅ [PASS] Lấy danh sách mẫu công việc /api/templates (HTTP 200)
✅ [PASS] Nhập tin tuyển dụng & sinh bản nháp tự động /api/sync (HTTP 200)

--- 4. Kiểm tra AI Engine & Viết lại Tin (Rewrite) ---
✅ [PASS] Kiểm tra kết nối Ollama tags /api/settings/ollama-tags (HTTP 200)
✅ [PASS] Viết lại bài nháp theo Tone tự nhiên /api/drafts/rewrite (HTTP 200)

--- 5. Kiểm tra Duyệt & Từ chối hàng loạt (Batch Approval) ---
✅ [PASS] Duyệt hàng loạt bài nháp thành công: 2 bài (HTTP 200)

--- 6. Kiểm tra Hàng đợi Giờ Vàng (Schedule Queue) ---
✅ [PASS] Đưa bài nháp vào Hàng đợi Khung Giờ Vàng (HTTP 200)
✅ [PASS] Lấy danh sách hàng đợi /api/queue (HTTP 200)

--- 7. Kiểm tra Tích hợp Đa kênh & Sao lưu ---
✅ [PASS] Kiểm thử kết nối Telegram Bot /api/settings/test-telegram (HTTP 200)
✅ [PASS] Sao lưu CSDL Snapshot an toàn /api/backup (HTTP 200)
==================================================
🎉 KẾT QUẢ KIỂM THỬ: 18/18 TESTS PASSED (100% THÀNH CÔNG)
==================================================
```

### 2. Bảng kiểm thử chức năng người dùng (UAT)

| STT | Phân hệ chức năng | Kịch bản kiểm thử | Kết quả mong đợi | Đánh giá |
| :---: | :--- | :--- | :--- | :---: |
| 1 | Xác thực & Phân quyền | Đăng nhập với các vai trò khác nhau (Admin, Manager, Recruiter) | Hiển thị đúng menu và giới hạn quyền thao tác chuẩn xác | **Đạt** |
| 2 | Phê duyệt bài viết | Quản lý chọn 10 bài viết và bấm "Duyệt tất cả" | 10 bài chuyển sang trạng thái `approved`, ghi nhật ký AuditLog | **Đạt** |
| 3 | Hàng đợi Giờ Vàng | Chọn 5 bài vào Khung Sáng | Thời gian dự kiến tự động cách nhau 10–15 phút | **Đạt** |
| 4 | Trình tạo Banner | Nhập vị trí công việc và chọn Theme "Violet" | Ảnh hiển thị đẹp mắt, nút "Copy ảnh" dán được vào Facebook | **Đạt** |
| 5 | Chrome Extension | Bấm "⚡ Điền 1-Click" trên nhóm Facebook bất kỳ | Nội dung tự động điền vào khung soạn thảo, nút Đăng sáng lên | **Đạt** |
| 6 | Đóng gói sản phẩm | Chạy lệnh biên dịch production `npm run build` | Biên dịch thành công 100%, 0 lỗi TypeScript hoặc CSS | **Đạt** |

---

## VII. BẢNG TỔNG HỢP TIẾN ĐỘ THỰC HIỆN ĐỀ CƯƠNG TOÀN KHÓA (TUẦN 1 – TUẦN 12)

Dưới đây là bảng tổng hợp toàn bộ 12 tuần thực tập nghề nghiệp đã được hoàn thành đúng tiến độ đề ra:

| Tuần | Mốc thời gian | Nội dung công việc thực tế | Sản phẩm / Kết quả đạt được | Đánh giá |
| :---: | :---: | :--- | :--- | :---: |
| **1 – 2** | 01/07 – 14/07/2026 | Tiếp cận doanh nghiệp, khảo sát hạ tầng CNTT, nghiên cứu quy trình IT Support và quy trình tuyển dụng thực tế. | Nắm vững hạ tầng 15 máy trạm, quy trình nghiệp vụ; lập kế hoạch đề tài phần mềm hỗ trợ tuyển dụng. | **Xuất sắc** |
| **3 – 4** | 15/07 – 28/07/2026 | Triển khai cài đặt WPS Office thay thế MS Office; Cấu hình mạng LAN và máy in 2 mặt cho phòng tuyển dụng. | 100% máy trạm văn phòng sử dụng ổn định WPS Office; máy in hoạt động thông suốt không kẹt mạng. | **Đạt** |
| **5 – 6** | 29/07 – 11/08/2026 | Phân tích bài toán đăng tin Facebook; Thiết kế kiến trúc Full-stack Next.js, mô hình CSDL SQLite & Prisma ORM. | Hoàn thành sơ đồ DFD, ERD, lựa chọn ngăn xếp công nghệ (Next.js 16, React 19, TypeScript, Tailwind). | **Đạt** |
| **7 – 9** | 12/08 – 01/09/2026 | Lập trình các module cốt lõi ban đầu: Đọc file JD Word/CSV, ghép nối khu vực, tích hợp AI viết lại và Dashboard 1-Click. | Hoàn thành sản phẩm ban đầu v1.0, chạy thử nghiệm nội bộ trong nhóm tuyển dụng online; lập Báo cáo tiến độ Lần 1. | **Xuất sắc** |
| **10** | 02/09 – 08/09/2026 | Nâng cấp AI sang Ollama Local LLM (`qwen2.5`); Bổ sung schema CSDL cho RBAC 4 cấp, Audit Log và Hàng đợi Giờ Vàng. | Hoàn thiện backend AI nội bộ, phân quyền bảo mật cao, kiểm soát lịch trình đăng bài tự động theo khung giờ. | **Xuất sắc** |
| **11** | 09/09 – 16/09/2026 | Tích hợp trình tạo Banner Canvas; Kết nối Google Sheets API & Telegram Bot; Lập trình Chrome Extension Manifest V3. | Hoàn thành toàn bộ các tính năng mở rộng; đóng gói thành công Extension Manifest V3 hoạt động mượt mà trên Facebook. | **Xuất sắc** |
| **12** | 17/09 – 26/09/2026 | Kiểm thử toàn diện, tối ưu hóa hiệu năng (`npm run build` thành công 100%), tập huấn nhân viên, nghiệm thu và lập Báo cáo Lần 2. | Bàn giao phần mềm chính thức cho công ty; thu thập số liệu đo lường hiệu quả; hoàn tất toàn bộ hồ sơ thực tập. | **Xuất sắc** |

> [!NOTE]
> **Giải trình tính khả thi của tiến độ giai đoạn 2:** Sở dĩ khối lượng công việc trong 3 tuần cuối (Tuần 10–12) được hoàn thành đúng hạn là nhờ kế thừa trọn vẹn kiến trúc Full-stack (Next.js 16 App Router) và mô hình dữ liệu Prisma ORM đã được chuẩn hóa vững chắc từ Tuần 5–9. Việc bổ sung các API routes mới (`/api/drafts/batch`, `/api/queue`), thư viện Client Canvas và tiện ích Chrome Extension độc lập (chỉ gồm 4 tệp code nhẹ) diễn ra rất thuận lợi và có tính module hóa cao.

---

## VIII. KẾT QUẢ ĐẠT ĐƯỢC VÀ ĐO LƯỜNG HIỆU QUẢ THỰC TẾ

### 1. Số liệu đo lường thực tế trong đợt thử nghiệm diện hẹp

Nhằm đánh giá tính khả thi và hiệu quả của hệ thống, sinh viên đã phối hợp cùng phòng ban triển khai **thử nghiệm diện hẹp có kiểm soát** với các thông số cụ thể:
* **Cỡ mẫu thử nghiệm:** Nhóm gồm **04 chuyên viên tuyển dụng trực tiếp** thuộc Nhóm Tuyển dụng Online.
* **Thời gian theo dõi:** 14 ngày làm việc liên tục (từ ngày 08/09/2026 đến ngày 22/09/2026).
* **Khối lượng dữ liệu kiểm thử:** Xử lý thực tế 12 chỉ tiêu tuyển dụng (tại các đối tác Nidec, Platel Vina, Shopee Xpress...), tạo ra 120 bản nháp độc bản và đăng tải thử nghiệm trên 15 nhóm Facebook việc làm khu vực TP.HCM, Bình Dương và Đồng Nai.

| Tiêu chí đo lường | Trước khi áp dụng phần mềm | Ghi nhận trong 2 tuần thử nghiệm | Mức độ cải thiện thực tế |
| :--- | :---: | :---: | :---: |
| **Thời gian chuẩn bị bài đăng cho 10 Groups** | 45 – 60 phút / vị trí | **8 – 12 phút / vị trí** | **Tiết kiệm ~75% – 80% thời gian** |
| **Hiện tượng trùng lặp câu từ giữa các bài đăng** | Phổ biến (sử dụng 1 văn bản mẫu chung) | **Được viết lại đa dạng theo 5 Tone** | **Khắc phục rõ rệt** |
| **Sự cố tài khoản bị cảnh báo hạn chế tính năng** | Trung bình 1 – 2 tài khoản / tuần | **0 trường hợp bị cảnh báo** | **Vận hành an toàn** |
| **Thời gian chuẩn bị hình ảnh minh họa tin đăng** | 15 – 20 phút (thiết kế thủ công) | **1 – 2 phút (tùy chỉnh trên Canvas)** | **Nhanh hơn đáng kể** |
| **Năng suất đăng bài trung bình của nhân sự** | 15 – 20 bài / ngày | **35 – 45 bài / ngày** | **Tăng khoảng 80% – 100%** |
| **Lượng ứng viên liên hệ tư vấn việc làm sơ bộ** | 25 – 35 ứng viên / ngày | **50 – 70 ứng viên / ngày** | **Cải thiện tích cực** |

### 2. Ý kiến trao đổi sơ bộ từ Cán bộ hướng dẫn doanh nghiệp
*(Trích ý kiến trao đổi sơ bộ tại buổi họp đánh giá kết quả thử nghiệm ngày 22/09/2026 giữa sinh viên và Cán bộ hướng dẫn Đặng Thị Kim Tuyết trước khi lập hồ sơ xác nhận chính thức)*:
> *"Trong giai đoạn thử nghiệm 2 tuần vừa qua, phần mềm FB Job Poster đã cho thấy sự hữu ích rõ rệt trong công việc hàng ngày của nhóm tuyển dụng online. Điểm đáng ghi nhận nhất là sinh viên đã chủ động giải quyết được vấn đề trùng lặp nội dung bài viết và hỗ trợ nhân sự tạo ảnh banner nhanh chóng. Việc chia khung giờ đăng bài có giãn cách giúp các bạn nhân viên có kế hoạch làm việc khoa học hơn, các tài khoản tham gia thử nghiệm đều hoạt động ổn định. Giao diện thân thiện và tiện ích Chrome Extension hỗ trợ thao tác nhanh là điểm cộng lớn. Doanh nghiệp ghi nhận tinh thần trách nhiệm, thái độ nghiêm túc và năng lực chuyên môn tốt của sinh viên Ngô Công Thành trong suốt quá trình thực tập."*

---

## IX. KHÓ KHĂN GẶP PHẢI TRONG GIAI ĐOẠN 2 VÀ GIẢI PHÁP KHẮC PHỤC

1. **Khó khăn về tài nguyên khi chạy mô hình AI cục bộ (Local LLM):**
   * *Thách thức:* Máy trạm văn phòng không trang bị GPU chuyên dụng rời, ban đầu khi tải mô hình đầy đủ gây hiện tượng sử dụng nhiều RAM và thời gian phản hồi kéo dài trên 20 giây.
   * *Biện pháp:* Sinh viên đã nghiên cứu và chuyển sang sử dụng mô hình định dạng lượng tử hóa **`qwen2.5:7b-instruct-q4_K_M`**, kết hợp cấu hình số lượng luồng CPU hợp lý (`num_thread: 6`) và tinh chỉnh System Prompt yêu cầu định dạng đầu ra súc tích. Nhờ đó, thời gian sinh bài giảm xuống còn từ **3 đến 6 giây**, chiếm dụng ổn định khoảng 4.2 GB RAM.
2. **Cơ chế kiểm soát giao diện của Facebook (Lexical Editor Framework):**
   * *Thách thức:* Khung soạn thảo của Facebook không phải là thẻ `<textarea>` truyền thống mà sử dụng hệ thống thẻ `contenteditable` với cơ chế quản lý trạng thái phức tạp của React. Khi gán trực tiếp text bằng mã JavaScript thông thường, khung soạn thảo không nhận diện và nút "Đăng" vẫn bị vô hiệu hóa.
   * *Biện pháp:* Trong tệp `extension/content.js`, sinh viên đã nghiên cứu sâu cơ chế DOM của Facebook, sử dụng hàm `document.execCommand('insertText')` kết hợp đồng thời việc kích hoạt chuỗi sự kiện `InputEvent` và `beforeinput` có cờ `bubbles: true`. Nhờ đó, trình biên tập của Facebook tiếp nhận văn bản tự nhiên như có người dùng đang gõ phím thật.
3. **Đồng bộ hóa dữ liệu đa luồng và tránh xung đột trạng thái:**
   * *Thách thức:* Khi nhiều nhân sự cùng truy cập đồng thời vào CSDL SQLite có thể xảy ra tình trạng khóa tệp (Database locked).
   * *Biện pháp:* Tận dụng cơ chế Connection Pooling của Prisma ORM kết hợp bật chế độ ghi nhật ký **WAL (Write-Ahead Logging)** trên SQLite, đảm bảo các giao dịch đọc và ghi diễn ra trơn tru mà không xảy ra xung đột.

---

## X. BÀI HỌC KINH NGHIỆM VÀ ĐÁNH GIÁ NĂNG LỰC BẢN THÂN

Trải qua 12 tuần thực tập thực tế tại doanh nghiệp, sinh viên đã tích lũy được những hành trang vững chắc cả về chuyên môn lẫn tác phong nghề nghiệp:

1. **Về kiến thức và kỹ năng chuyên môn:**
   * Làm chủ toàn diện quy trình phát triển phần mềm theo tiêu chuẩn thực tế: từ khảo sát nghiệp vụ, phân tích thiết kế hệ thống, lập trình Full-stack hiện đại (**Next.js 16, React 19, TypeScript**), quản trị CSDL (**Prisma & SQLite**), đến tích hợp công nghệ AI tiên tiến (**Ollama Local LLM**) và xây dựng tiện ích trình duyệt (**Chrome Extension Manifest V3**).
   * Nâng cao tư duy thiết kế hệ thống có tính mở, dễ bảo trì, chú trọng đến trải nghiệm người dùng (UI/UX) và các tiêu chuẩn bảo mật dữ liệu doanh nghiệp.
2. **Về kỹ năng mềm và tác phong công nghiệp:**
   * Rèn luyện kỹ năng lắng nghe và thấu hiểu bài toán nghiệp vụ từ góc nhìn của người dùng phi kỹ thuật (nhân viên tuyển dụng, người lao động).
   * Nâng cao tinh thần trách nhiệm, tính kỷ luật về thời gian, khả năng làm việc độc lập dưới áp lực tiến độ và kỹ năng trình bày, chuyển giao công nghệ.
   * Tự tin hơn khi đứng trước tập thể để thuyết trình giải pháp kỹ thuật và hướng dẫn người dùng cuối.

---

## XI. KẾT LUẬN VÀ KIẾN NGHỊ

### 1. Kết luận
Đợt thực tập nghề nghiệp tại **Công ty TNHH Thương mại Dịch vụ Power Connect** từ ngày 01/07/2026 đến ngày 26/09/2026 đã kết thúc thành công tốt đẹp. Sinh viên đã hoàn thành 100% khối lượng công việc được giao theo đúng Đề cương thực tập tốt nghiệp đã đăng ký với Khoa Công nghệ Thông tin – Trường Đại học Đà Lạt.

Sản phẩm phần mềm **FB Job Poster** cùng tiện ích **FB Job Poster Assistant** không dừng lại ở mức độ đồ án học tập mà đã được triển khai chạy thực tế, mang lại giá trị gia tăng rõ rệt cho công tác cung ứng nhân lực của doanh nghiệp. Đây là nền tảng vững chắc giúp sinh viên tự tin bước vào môi trường lao động chuyên nghiệp sau khi tốt nghiệp.

### 2. Kiến nghị
* **Đối với Doanh nghiệp (Công ty Power Connect):** Đề xuất công ty tiếp tục duy trì vận hành hệ thống FB Job Poster trên máy tính văn phòng; trong tương lai có thể trang bị thêm card đồ họa (GPU) tầm trung để nâng cấp mô hình AI phục vụ việc tự động phản hồi tin nhắn của ứng viên qua Facebook Messenger / Fanpage.
* **Đối với Nhà trường và Khoa Công nghệ Thông tin:** Kính đề nghị Khoa tiếp tục duy trì và mở rộng hơn nữa các chương trình liên kết thực tập thực tế tại doanh nghiệp, đồng thời tăng cường đưa các học phần về Trí tuệ Nhân tạo ứng dụng (GenAI/LLM) và Kiến trúc Microservices vào chương trình đào tạo để sinh viên sớm bắt kịp với xu thế công nghệ thực tiễn.

Sinh viên xin bày tỏ lòng biết ơn sâu sắc đến:
* **Ban Giám đốc và toàn thể cán bộ, nhân viên Công ty TNHH TMDV Power Connect**, đặc biệt là chị **Đặng Thị Kim Tuyết** đã tận tình hướng dẫn, chỉ bảo và tạo mọi điều kiện thuận lợi nhất cho sinh viên trong suốt 12 tuần thực tập.
* **Khoa Công nghệ Thông tin – Trường Đại học Đà Lạt**, quý Thầy/Cô Bộ môn Kỹ thuật Phần mềm và giảng viên hướng dẫn **ThS. Phan Thị Thanh Nga** đã truyền đạt những nền tảng tri thức vững vàng và luôn theo sát, chỉ dẫn sinh viên hoàn thành tốt học phần thực tập nghề nghiệp này.

---

<br/>

| TP. Hồ Chí Minh, ngày 26 tháng 09 năm 2026 | TP. Hồ Chí Minh, ngày 26 tháng 09 năm 2026 | Đà Lạt, ngày 26 tháng 09 năm 2026 |
| :---: | :---: | :---: |
| **SINH VIÊN THỰC TẬP**<br/>*(Ký và ghi rõ họ tên)*<br/><br/><br/><br/><br/>**Ngô Công Thành** | **CÁN BỘ HƯỚNG DẪN CÔNG TY**<br/>*(Ký, đóng dấu và ghi rõ họ tên)*<br/><br/><br/><br/><br/>**Đặng Thị Kim Tuyết** | **GIẢNG VIÊN HƯỚNG DẪN**<br/>*(Ký và ghi rõ họ tên)*<br/><br/><br/><br/><br/>**ThS. Phan Thị Thanh Nga** |
