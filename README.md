# VNSKY Admin Frontend

Hệ thống quản lý gói cước (MVNO Plan Admin) được phát triển bằng React, TypeScript, Vite và Ant Design.

## 🚀 Tính năng nổi bật
- Xem danh sách gói cước (có phân trang, sắp xếp, lọc theo trạng thái/từ khóa).
- Xem chi tiết cấu hình gói cước, ưu đãi Data, phút gọi và cấu hình Ứng dụng.
- Form tạo và sửa gói cước với kiểm tra tính hợp lệ động (Dynamic Validation).
- Quản lý linh hoạt danh sách "Ưu đãi chu kỳ đầu" và "Ưu đãi ứng dụng".
- Hỗ trợ đầy đủ Accessibility (a11y) và Cảnh báo thoát Form khi chưa lưu.
- Mock API bằng MSW và Unit Test bằng Vitest/React Testing Library.

## 📦 Yêu cầu hệ thống
- Node.js >= 18
- Docker (Tùy chọn, để chạy container)

## 🛠 Hướng dẫn cài đặt và chạy (Development)

1. **Cài đặt thư viện**
   ```bash
   npm install
   ```

2. **Chạy server phát triển (Development)**
   ```bash
   npm run dev
   ```
   *Ứng dụng sẽ chạy tại `http://localhost:5173`.*

3. **Chạy Unit Test**
   ```bash
   npm run test
   ```

4. **Build Production**
   ```bash
   npm run build
   ```

5. **Sinh type từ OpenAPI**
   Nếu file `openapi.yaml` thay đổi, chạy lệnh sau để tự động tạo lại TypeScript interfaces:
   ```bash
   npm run gen:api
   ```

## 🐳 Triển khai với Docker (Production)

Ứng dụng được cấu hình sẵn `Dockerfile` (multi-stage với Nginx) và `docker-compose.yml`.

**Khởi chạy bằng Docker Compose:**
```bash
docker compose up --build -d
```

Sau khi build xong, ứng dụng sẽ phục vụ tại `http://localhost:3000`.

**Dừng ứng dụng Docker:**
```bash
docker compose down
```

## 🌐 Cấu trúc dự án chính
- `src/api/`: Cấu hình API Client, sinh Schema và các hàm gọi API.
- `src/features/plans/`: Module chính quản lý Gói cước (List, Detail, Form).
- `src/components/`: Các Component UI dùng chung.
- `src/lib/`: Các tiện ích (Format, URL State, Error handler).
- `src/test/`: Cấu hình Mock Service Worker (MSW) và Test Utilities.
- `src/i18n/`: File ngôn ngữ (tiếng Việt).
