# Kế hoạch Frontend (Web Admin)

Căn cứ: yêu cầu mục C của đề bài và hợp đồng API trong `openapi.yaml` (Plans, Apps, Promo Codes; chưa có Subscriptions). Mình đã đọc toàn bộ file này, sinh thử type TypeScript từ nó (`openapi-typescript` 7.13, chạy thành công) và lint bằng Redocly. Chưa có code frontend nào được viết hay chạy; các đoạn code bên dưới chỉ là khung tham khảo.

## 0. Tóm tắt

**Yêu cầu của đề**

| Yêu cầu | Cách đáp ứng | Tiêu chí nghiệm thu |
|---|---|---|
| Màn hình danh sách: bảng gói cước | `PlanListPage` với bảng phân trang phía server | Có cột mã, tên, giá, thời hạn; chuyển trang, lọc, sắp xếp gọi lại API |
| Nút Toggle/Switch bật/tắt `is_active` nhanh | Switch trong từng dòng, cập nhật lạc quan, gọi `PATCH /plans/{id}/status` | Bấm là đổi ngay; lỗi thì tự hoàn tác và báo lỗi; tải lại trang vẫn đúng |
| Màn hình Tạo/Sửa: Tên, Mã, Giá, Thời hạn | `PlanFormPage` (tạo và sửa dùng chung) | Lưu được; lỗi hiện đúng ô nhập; sửa không làm mất dữ liệu khác của gói |
| Công nghệ tự chọn | **React 18 + Vite + TypeScript + Ant Design 5** (lý do ở mục 2) | |

**Ba điều rút ra từ `openapi.yaml` ảnh hưởng nhất đến thiết kế**

1. **Form "cơ bản" chưa đủ để gọi API.** `POST /plans` và `PUT /plans/{id}` bắt buộc thêm `quotaType`, `dataQuotaMb`, `cutoffPolicy`, `bonuses` và `appQuotas` (hai mảng này bắt buộc nhưng được phép rỗng). Vì vậy form giai đoạn đầu gồm 4 trường cơ bản **cộng** các trường bắt buộc này (có giá trị mặc định hợp lý).
2. **`PUT` là thay thế toàn bộ.** Gửi `bonuses: []` hoặc `appQuotas: []` sẽ **xóa hết** các dòng con của gói. Nếu form sửa chưa có giao diện cho hai phần này, nó vẫn phải nạp chúng từ `GET /plans/{id}` và gửi lại nguyên vẹn, nếu không mỗi lần sửa tên gói sẽ làm mất bonus và quota app.
3. **Trạng thái đổi riêng.** `isActive` có trong request tạo nhưng **không** có trong `PUT`; bật/tắt dùng `PATCH /plans/{id}/status`. Form sửa không được gửi `isActive`.

**Các quy tắc điều kiện của API** (form phải theo, nếu không sẽ nhận 400)
- `quotaType = PER_CYCLE` thì bắt buộc `cycleDays` (1 đến 32767, và theo backend còn không vượt `durationMonths × 30`); `DAILY` hoặc `MONTHLY` thì `cycleDays` phải là `null`.
- `cutoffPolicy = THROTTLE` thì bắt buộc `throttleSpeedKbps` (>= 1); `DISCONNECT` thì phải là `null`.
- `durationMonths` chỉ nhận 1, 6 hoặc 12. `bonuses` tối đa 2 dòng (mỗi loại một dòng). `appQuotas` tối đa 50 dòng (mỗi app một dòng).
- Mã gói khớp `^[A-Za-z0-9_-]{2,50}$`; server lưu chữ hoa nên giao diện cũng hiển thị chữ hoa.

---

## 1. Lỗi và điểm cần sửa trong `openapi.yaml`

| # | Vấn đề | Tác động | Cách sửa |
|---|---|---|---|
| 1 | Dòng 446, `FieldError.message.example` có dấu phẩy chưa đặt trong dấu nháy trong một flow mapping: `{ type: string, example: Plan duration must be 1, 6, or 12 months }` | Redocly báo lỗi cấu trúc; type sinh ra có ví dụ bị cắt thành "Plan duration must be 1" | Đặt trong nháy: `example: "Plan duration must be 1, 6, or 12 months"` |
| 2 | Thiếu `operationId` ở mọi operation (24 cảnh báo) | Nếu dùng công cụ sinh client (Orval, openapi-generator), tên hàm sẽ xấu | Thêm `operationId` như `listPlans`, `createPlan`, `updatePlanStatus`... |
| 3 | `security-defined` (20 lỗi) | Chỉ vì API chưa có xác thực | Bỏ qua hoặc tắt luật này trong cấu hình lint |
| 4 | Một số ví dụ dùng `exclusiveMinimum: true` kiểu OpenAPI 3.0 | Redocly cảnh báo khi kiểm ví dụ (hợp lệ ở 3.0.3) | Bỏ qua, hoặc nâng lên 3.1 và dùng số |
| 5 | Chưa mô tả lỗi 500/9999, 405, 415 | Frontend phải tự xử lý lỗi chung | Frontend dùng nhánh lỗi mặc định (mục 5) |
| 6 | Tạo mới ghi `isActive` mặc định `true`; `voiceMinutes` mặc định 0 | `openapi-typescript` mặc định coi trường có default là bắt buộc | Sinh type với cờ `--default-non-nullable false` (mục 3) |

Chưa có thay đổi nào được áp dụng lên file của bạn.

---

## 2. Chọn công nghệ

| Hạng mục | Chọn | Lý do |
|---|---|---|
| Framework | React 18 + Vite + TypeScript | Admin SPA sau API, không cần SSR; khởi động nhanh; đề khuyến nghị React |
| UI | Ant Design 5 | Có sẵn Table (phân trang, sắp xếp phía server), Switch, Form, Select, InputNumber, Popconfirm, message; ít code nhất cho màn hình quản trị |
| Form | Ant Design `Form` (kèm `Form.List` cho dòng con) | Không thêm thư viện; quy tắc điều kiện dùng `dependencies` và `shouldUpdate`; lỗi server gán bằng `form.setFields` |
| Dữ liệu server | TanStack Query v5 | Cache, huỷ trùng, `useMutation` có `onMutate/onError` cho toggle lạc quan |
| Định tuyến | React Router v6 (`createBrowserRouter`) | Chuẩn |
| HTTP | axios | Interceptor gỡ phong bì `ApiResponse` và chuẩn hóa lỗi |
| Type API | `openapi-typescript` | Sinh type từ chính `openapi.yaml` (contract-first) |
| Ngày giờ | dayjs | Antd dùng sẵn |
| Test | Vitest + React Testing Library + MSW | Giả lập API theo ví dụ trong OpenAPI |

Phương án thay thế nếu bạn thích: Vue 3 + Element Plus (cùng cấu trúc, đổi Query thành `@tanstack/vue-query`); Next.js chỉ cần khi muốn SSR hoặc đã quen sẵn, nhưng thêm độ phức tạp mà đề không đòi hỏi.

---

## 3. Quy trình contract-first và cấu trúc dự án

```
mvno-plan-admin/
├── package.json, vite.config.ts, tsconfig.json, index.html, .env.example
├── Dockerfile, nginx.conf
├── src/
│   ├── main.tsx, App.tsx, router.tsx
│   ├── api/
│   │   ├── schema.d.ts          (SINH RA từ openapi.yaml, không sửa tay)
│   │   ├── client.ts            (axios + interceptor)
│   │   ├── ApiError.ts          (httpStatus, code, message, fieldErrors)
│   │   ├── types.ts             (alias gọn: Plan, PlanSummary, PlanPayload...)
│   │   ├── plans.ts, apps.ts, promos.ts      (hàm gọi API)
│   │   └── queryKeys.ts
│   ├── features/
│   │   ├── plans/
│   │   │   ├── PlanListPage.tsx, PlanFormPage.tsx
│   │   │   ├── hooks/usePlans.ts, usePlan.ts, usePlanMutations.ts
│   │   │   ├── components/PlanStatusSwitch.tsx, PlanFilters.tsx,
│   │   │   │              BonusListField.tsx, AppQuotaListField.tsx
│   │   │   └── form/rules.ts, toFormValues.ts, toPayload.ts
│   │   ├── apps/    (giai đoạn F5)
│   │   └── promos/  (giai đoạn F5)
│   ├── components/ (AppLayout, PageHeader, ErrorResult, EmptyState)
│   ├── lib/ (format.ts, errors.ts, urlState.ts)
│   └── i18n/vi.ts               (chuỗi tiếng Việt, tập trung một chỗ)
└── src/**/*.test.ts(x), src/test/ (msw handlers, factories)
```

Sinh type (một lệnh, đã chạy thử thành công trên file của bạn):

```
npx openapi-typescript ../openapi.yaml --default-non-nullable false -o src/api/schema.d.ts
```

Thêm vào `package.json`: `"gen:api": "openapi-typescript ../openapi.yaml --default-non-nullable false -o src/api/schema.d.ts"`. Mỗi khi backend đổi hợp đồng: chạy lại, `tsc` sẽ chỉ ra chỗ phải sửa.

Mock khi backend chưa chạy: dùng MSW (cho test) hoặc một mock server dựng từ chính `openapi.yaml` (ví dụ Prism); cả hai đều chưa được thử ở đây.

---

## 4. Lớp dữ liệu

**`api/client.ts`**
- `baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'`, header `Content-Type: application/json`.
- Interceptor phản hồi thành công: nếu `data.code !== 1000` thì ném `ApiError` (phòng trường hợp backend đổi); ngược lại trả `data.result`.
- Interceptor lỗi: nếu có `response.data.code` (đúng khuôn `ApiError` của OpenAPI) thì ném `ApiError { httpStatus, code, message, fieldErrors: result ?? [] }`; nếu là lỗi mạng hoặc không đúng khuôn thì ném `ApiError` với `code = 9999`, `message` chung ("Không kết nối được máy chủ" hoặc "Có lỗi không mong muốn").

**Hàm API (`api/plans.ts`)**

| Hàm | Gọi | Trả về |
|---|---|---|
| `listPlans(params)` | `GET /plans` | `Page<PlanSummary>` |
| `getPlan(id)` | `GET /plans/{id}` | `Plan` |
| `createPlan(body)` | `POST /plans` | `Plan` |
| `updatePlan(id, body)` | `PUT /plans/{id}` | `Plan` |
| `setPlanStatus(id, isActive)` | `PATCH /plans/{id}/status` | `Plan` |
| `deletePlan(id)` | `DELETE /plans/{id}` | `string` |

**Query key và làm mới cache**
- Khóa: `['plans', 'list', params]`, `['plans', 'detail', id]`, `['apps', 'options']`.
- Sau tạo, sửa hoặc xóa: làm mới `['plans']`. Sau toggle: cập nhật dòng trong mọi trang đang cache, rồi `onSettled` làm mới.
- Danh sách dùng `placeholderData: keepPreviousData` để không nháy trống khi đổi trang.

---

## 5. Thiết kế màn hình

### 5.1 Danh sách gói cước (`/plans`)

**Cột** (lấy từ `PlanSummary`)

| Cột | Nguồn | Hiển thị | Sắp xếp |
|---|---|---|---|
| Mã | `code` | chữ đậm, đơn cách | có (`code`) |
| Tên | `name` | | có (`name`) |
| Giá | `price` | `150.000 ₫` (`Intl.NumberFormat('vi-VN')`) | có (`price`) |
| Thời hạn | `durationMonths` | "1 tháng" / "6 tháng" / "12 tháng" | có (`durationMonths`) |
| Dung lượng | `quotaType` + `dataQuotaMb` | "3 GB / ngày", "10 GB / chu kỳ", "5 GB / tháng" (MB >= 1024 đổi sang GB) | không |
| Khi hết data | `cutoffPolicy` | Tag "Ngắt kết nối" hoặc "Giảm tốc" | không |
| Ưu đãi | `hasBonus`, `appQuotaCount` | Tag "Bonus", "N app" | không |
| Trạng thái | `isActive` | **Switch** | không |
| Ngày tạo | `createdAt` | dayjs, giờ địa phương | có (`createdAt`) |
| Thao tác | | Sửa, Xóa | |

Lưu ý: `PlanSummary` không có `cycleDays`, nên cột dung lượng của gói `PER_CYCLE` chỉ ghi "/ chu kỳ"; số ngày xem ở màn hình sửa.

**Bộ lọc và tham số API**

| Điều khiển | Tham số | Ghi chú |
|---|---|---|
| Ô tìm kiếm | `keyword` | debounce 400 ms, cắt khoảng trắng, về trang 0 khi đổi |
| Chọn trạng thái | `isActive` | Tất cả (bỏ tham số) / Đang bật / Đã tắt |
| Chọn thời hạn | `durationMonths` | Tất cả / 1 / 6 / 12 |
| Phân trang Antd | `page` (0-based = `current - 1`), `size` (10, 20, 50, 100) | `total = totalElements` |
| Sắp xếp cột | `sort` | gửi đúng chuỗi trong danh sách cho phép, ví dụ `price,desc`; bỏ sắp xếp thì dùng `createdAt,desc` |

Trạng thái lọc, trang, sắp xếp lưu trong URL (`?q=&active=&dur=&page=&size=&sort=`) để tải lại hoặc quay lại từ form vẫn giữ nguyên.

**Switch bật/tắt (cập nhật lạc quan)**
1. Bấm: `onMutate` hủy truy vấn đang chạy, lưu bản cũ, đổi `isActive` của dòng trong cache ngay.
2. Gửi `PATCH /plans/{id}/status` với `{ isActive: <giá trị mới> }` (gán trạng thái, không "đảo", nên gửi lại an toàn).
3. Lỗi: hoàn tác từ bản đã lưu, hiện thông báo từ server.
4. Xong (`onSettled`): làm mới danh sách (nếu đang lọc theo trạng thái, dòng có thể biến mất, kèm thông báo "Đã tắt gói X").
5. Vô hiệu hóa riêng Switch của dòng đang gửi (`loading`), các dòng khác vẫn bấm được.

**Xóa**: `Popconfirm`, rồi `DELETE /plans/{id}`. Nếu nhận 409 (mã 1111, gói đang được tham chiếu) thì mở hộp thoại: "Gói đang được sử dụng nên không thể xóa. Bạn có muốn tắt gói thay thế?" với nút "Tắt gói" gọi cùng mutation toggle. Xóa dòng cuối của trang (trang > 0) thì lùi một trang.

**Các trạng thái**: đang tải (skeleton), rỗng ("Chưa có gói cước", nút Tạo; khi có lọc: "Không có kết quả", nút Xóa bộ lọc), lỗi tải (Result kèm nút Thử lại).

### 5.2 Form tạo và sửa (`/plans/new`, `/plans/:planId/edit`)

Một component dùng chung; chế độ sửa nạp `GET /plans/{id}` và điền sẵn.

| Trường | Điều khiển | Quy tắc (theo OpenAPI) | Mặc định khi tạo |
|---|---|---|---|
| **Mã** `code` | Input, tự chuyển chữ hoa | bắt buộc, `^[A-Za-z0-9_-]{2,50}$` | trống |
| **Tên** `name` | Input | bắt buộc, 2 đến 150 ký tự | trống |
| **Giá** `price` | InputNumber (định dạng VND, bước 1.000) | bắt buộc, số nguyên 0 đến 999.999.999.999 | trống |
| **Thời hạn** `durationMonths` | Select hoặc Segmented | bắt buộc, 1 / 6 / 12 tháng | 1 |
| Mô tả `description` | TextArea | tùy chọn, <= 1000 ký tự | trống |
| Loại quota `quotaType` | Select | bắt buộc: DAILY, PER_CYCLE, MONTHLY | DAILY |
| Dung lượng `dataQuotaMb` | InputNumber (đơn vị MB/GB chọn được, đổi sang MB khi gửi) | bắt buộc, >= 1 MB | trống |
| Số ngày chu kỳ `cycleDays` | InputNumber, **chỉ hiện khi PER_CYCLE** | bắt buộc khi PER_CYCLE, 1 đến 32767, <= `durationMonths × 30` | ẩn |
| Phút gọi `voiceMinutes` | InputNumber | tùy chọn, >= 0 | 0 |
| Chính sách khi hết data `cutoffPolicy` | Radio | bắt buộc: DISCONNECT hoặc THROTTLE | DISCONNECT |
| Tốc độ sau giảm `throttleSpeedKbps` | InputNumber, **chỉ hiện khi THROTTLE** | bắt buộc khi THROTTLE, >= 1 | ẩn |
| Kích hoạt `isActive` | Switch, **chỉ khi tạo** | | bật |
| Bonus (`bonuses`) | `Form.List` (giai đoạn F3) | tối đa 2 dòng, loại không trùng, `amount >= 1` | rỗng |
| Quota theo app (`appQuotas`) | `Form.List` (giai đoạn F3) | tối đa 50 dòng, app không trùng, `quotaMb >= 1` | rỗng |

Ba trường in đậm là phần "cơ bản" mà đề nêu; phần còn lại là bắt buộc của API hoặc mở rộng.

**Logic điều kiện**
- Đổi `quotaType` khỏi PER_CYCLE: xóa `cycleDays` (đặt `null`) vì server từ chối giá trị còn sót. Tương tự đổi `cutoffPolicy` khỏi THROTTLE thì xóa `throttleSpeedKbps`.
- Đổi `durationMonths` thì kiểm tra lại giới hạn của `cycleDays`.

**Hàm chuyển đổi (thuần, có unit test)**
- `toFormValues(plan)`: `Plan` sang giá trị form; `dataQuotaMb` giữ MB; `bonuses` và `appQuotas` ánh xạ về `{bonusType, amount}` và `{appId, quotaType, quotaMb}` (bỏ `appCode`, `appName`).
- `toPayload(values, mode)`:
  - `create`: thêm `isActive`; `update`: **không** gửi `isActive`.
  - `cycleDays = null` trừ khi PER_CYCLE; `throttleSpeedKbps = null` trừ khi THROTTLE.
  - `voiceMinutes ?? 0`; `description` rỗng thì `null`; `code` cắt khoảng trắng.
  - Luôn gửi `bonuses` và `appQuotas` (mảng, kể cả rỗng).

**Luồng lưu**
1. Kiểm tra phía client (cùng quy tắc ở bảng trên).
2. Gửi `POST` hoặc `PUT`; nút Lưu ở trạng thái loading, chặn gửi hai lần.
3. Thành công: thông báo, quay về danh sách với bộ lọc cũ (trạng thái URL).
4. Lỗi 400: dùng `fieldErrors` gán vào ô tương ứng; lỗi 409 mã 1102: gán lỗi vào ô Mã ("Mã gói đã tồn tại"); lỗi khác: hiển thị `Alert` đầu form.
5. Chế độ sửa, nhận 404 (1101): hiển thị trang "Gói không tồn tại" kèm nút quay lại.
6. Cảnh báo khi rời trang có thay đổi chưa lưu.

**Ánh xạ `FieldError.field` sang tên ô của Antd**: tách đường dẫn `bonuses[0].amount` thành `['bonuses', 0, 'amount']`; nếu `field` rỗng hoặc không khớp ô nào thì đưa vào `Alert` ở đầu form.

### 5.3 Xử lý lỗi theo mã

| HTTP / mã | Ý nghĩa | Giao diện |
|---|---|---|
| 400 / 1103 đến 1108, 1113 đến 1115 | sai định dạng trường | lỗi dưới từng ô (theo `fieldErrors`) |
| 400 / 1109, 1110 | bonus hoặc app trùng | lỗi ở dòng tương ứng hoặc `Alert` đầu form |
| 400 / 1002 | `page`, `size` hoặc `sort` sai | quay về trang 0 với sắp xếp mặc định |
| 400 / 1001 | yêu cầu không hợp lệ | toast chung |
| 404 / 1101 | gói không tồn tại | trang 404 (sửa) hoặc toast và làm mới (toggle, xóa) |
| 404 / 1201 | app không tồn tại | `Alert` đầu form, làm mới danh sách app |
| 409 / 1102 | trùng mã | lỗi ở ô Mã |
| 409 / 1111 | gói đang được dùng | hộp thoại gợi ý tắt gói |
| 422 / 1204 | app đã tắt (khi thêm mới quota) | `Alert` ở dòng quota tương ứng |
| 5xx, 9999, mạng | lỗi hệ thống | toast chung, giữ nguyên dữ liệu đang nhập |

---

## 6. Kế hoạch thực hiện theo giai đoạn

Quy mô: S nhỏ, M vừa, L lớn. Mỗi giai đoạn một nhánh hoặc một chuỗi commit nhỏ (Conventional Commits).

### F0. Khởi tạo và hợp đồng (S)
- Vite + React + TS, ESLint, Prettier; cài Antd, TanStack Query, React Router, axios, dayjs, Vitest, RTL, MSW.
- `gen:api`, `schema.d.ts`, `types.ts`, `client.ts`, `ApiError.ts`, `queryKeys.ts`, `format.ts`.
- `AppLayout` (menu: Gói cước; Apps và Mã giảm giá khóa lại cho tới F5), router, trang 404, `.env.example`, proxy dev (`/api` sang `http://localhost:8080`).
- **Xong khi:** `npm run dev` hiển thị khung giao diện; `npm run build` và `tsc` không lỗi; `listPlans` chạy với backend hoặc mock; test cho `ApiError` và interceptor (code 1000, lỗi có khuôn, lỗi mạng) xanh.

### F1. Danh sách và Toggle (M)
- `PlanListPage`, `PlanFilters`, `PlanStatusSwitch`, hooks, `urlState`.
- **Xong khi:** các tiêu chí ở 5.1 đạt: bảng đủ cột; lọc, tìm, sắp xếp và phân trang gọi đúng tham số; URL giữ trạng thái; toggle lạc quan có hoàn tác khi lỗi; các trạng thái tải, rỗng, lỗi hiển thị đúng.

### F2. Form tạo và sửa, phần cơ bản (M)
- `PlanFormPage` với các trường cơ bản và bắt buộc của API (bỏ hai danh sách dòng con), `rules.ts`, `toFormValues`, `toPayload`.
- Chế độ sửa **giữ nguyên** `bonuses` và `appQuotas` đã nạp (gửi lại nguyên vẹn), kèm một dòng tóm tắt chỉ đọc ("2 app, 1 bonus").
- **Xong khi:** tạo gói chỉ với 4 trường cơ bản (các trường còn lại dùng mặc định) thành công; sai điều kiện (PER_CYCLE thiếu `cycleDays`, THROTTLE thiếu tốc độ, mã trùng) hiện lỗi đúng ô; **sửa tên một gói có bonus và quota app rồi lưu, bonus và quota vẫn còn nguyên**; `toPayload` có test cho cả hai chế độ.

### F3. Form đầy đủ: bonus và quota theo app (M)
- `BonusListField` (tối đa 2 dòng, loại không trùng), `AppQuotaListField` (chọn app từ `GET /apps?isActive=true&size=100`, app không trùng, tối đa 50, có loại quota và MB).
- **Xong khi:** thêm, sửa, xóa dòng và lưu đúng (`[]` thực sự xóa hết dòng con, có xác nhận trước khi lưu một gói sẽ mất toàn bộ dòng con); lỗi 1109, 1110, 1201, 1204 hiển thị đúng chỗ; app đang gắn với gói nhưng đã bị tắt vẫn hiển thị và giữ được.

### F4. Hoàn thiện và bàn giao (M)
- Xóa gói (xác nhận, xử lý 1111), cảnh báo rời form, bàn phím và nhãn truy cập cho Switch và Form, i18n tập trung.
- Test (mục 7), Dockerfile + nginx, thêm service `web` vào `docker-compose.yml`, README (chạy dev, build, Docker, cách sinh type).
- **Xong khi:** mọi test xanh; `docker compose up --build` mở được giao diện và gọi được API; danh sách kiểm tra mục 9 đạt.

### F5. Mở rộng, tùy chọn (L)
- **Apps:** bảng, form tạo/sửa (mã, tên), toggle, xóa (xử lý `APP_IN_USE`).
- **Mã giảm giá:** bảng và toggle; form (loại giảm, giá trị, trần, tối thiểu, thời gian, giới hạn, phạm vi plan) theo ràng buộc của `PromoCreateRequest`; công cụ thử mã gọi `POST /promo-codes/validate` và hiển thị `reasonCode`; xử lý 1302, 1303, 1304, 1305, 1306, 1307, 1308.
- **Xong khi:** các màn hình dùng lại `DataTable`, `StatusSwitch` và quy ước lỗi của F0 đến F4 mà không phải sửa hạ tầng.

---

## 7. Kế hoạch kiểm thử

| Lớp | Công cụ | Ca bắt buộc |
|---|---|---|
| Hàm thuần | Vitest | `toPayload` (create thêm `isActive`; update không gửi `isActive`; `cycleDays` và `throttleSpeedKbps` về `null` đúng lúc; `voiceMinutes` mặc định 0; luôn có hai mảng), `toFormValues`, `format` (VND, MB sang GB), ánh xạ `FieldError.field` sang đường dẫn ô, `ApiError` |
| Danh sách | RTL + MSW | hiển thị dòng; đổi trang gọi `page` đúng (0-based); bấm cột `price` gọi `sort=price,desc`; ô tìm kiếm gọi `keyword` sau debounce; toggle thành công; toggle lỗi thì hoàn tác và có thông báo; rỗng, lỗi tải |
| Form | RTL + MSW | chọn PER_CYCLE thì hiện `cycleDays`, đổi sang DAILY thì ẩn và xóa; THROTTLE tương tự; lỗi 400 gán đúng ô (kể cả `bonuses[0].amount`); 409/1102 gán vào ô Mã; sửa gói rồi lưu giữ nguyên `bonuses` và `appQuotas`; cảnh báo rời trang |
| Tích hợp (tùy chọn) | Playwright | tạo gói, thấy trong bảng, tắt gói, tải lại vẫn tắt, sửa, xóa, trên backend thật bằng Docker Compose |

MSW lấy dữ liệu mẫu từ các ví dụ trong `openapi.yaml` và các `factories` trong `src/test/`.

---

## 8. Chạy, build và triển khai

- **Dev:** Vite proxy `/api` sang `http://localhost:8080` nên không cần CORS; hoặc đặt `VITE_API_BASE_URL=http://localhost:8080/api/v1` (khi đó backend phải bật `CorsConfig` cho `http://localhost:5173`).
- **Docker:** Dockerfile hai giai đoạn (Node build, rồi nginx phục vụ `dist/`); `nginx.conf` có `location /api/ { proxy_pass http://app:8080; }` và `try_files $uri /index.html` cho SPA. Trong `docker-compose.yml` thêm `web` (cổng `3000:80`, `depends_on: app`); cùng origin nên không cần CORS. Các file này chưa được viết hay chạy thử.

---

## 9. Danh sách kiểm tra khi hoàn thành

- [ ] Bảng gói cước phân trang, lọc, tìm, sắp xếp phía server; trạng thái lưu trong URL.
- [ ] Switch bật/tắt `isActive` đổi ngay, lưu qua `PATCH`, hoàn tác khi lỗi, tải lại vẫn đúng.
- [ ] Form tạo gói với Tên, Mã, Giá, Thời hạn (kèm trường bắt buộc của API) hoạt động; lỗi hiện đúng ô.
- [ ] Sửa gói không làm mất bonus hoặc quota app.
- [ ] Xóa gói xử lý đúng khi gói đang được dùng (409).
- [ ] Mọi test xanh; `npm run build` sạch; `docker compose up --build` chạy cả hai.
- [ ] README mô tả cách chạy và cách sinh lại type từ `openapi.yaml`.

## 10. Rủi ro và cách xử lý

| Rủi ro | Dấu hiệu | Xử lý |
|---|---|---|
| Form sửa gửi `bonuses: []` do không nạp dữ liệu cũ | Gói mất bonus và quota sau khi đổi tên | `toFormValues` luôn nạp hai mảng; test "sửa tên giữ nguyên con" |
| `cycleDays` hoặc `throttleSpeedKbps` còn sót khi đổi lựa chọn | 400 mã 1107 hoặc 1108 | Xóa trường khi điều kiện hết đúng; `toPayload` ép `null` |
| Gửi `sort` ngoài danh sách cho phép (ví dụ `dataQuotaMb`, `id`) | 400 mã 1002 | Chỉ cột trong allowlist có `sorter` |
| Mã nhập chữ thường | Hiển thị lệch với server | Tự chuyển chữ hoa trong ô nhập; hiển thị theo giá trị server trả |
| Toggle lạc quan lệch với bộ lọc | Dòng biến mất hoặc nhấp nháy | Làm mới sau `onSettled` và báo rõ bằng toast |
| `PlanSummary` không có `cycleDays` | Cột dung lượng thiếu số ngày | Ghi "/ chu kỳ"; chi tiết ở màn hình sửa |
| Hợp đồng API đổi | Lỗi runtime khó đoán | `gen:api` trong quy trình; `tsc` trong CI |
| Số lớn | `price`, `dataQuotaMb` là int64 | Giá trị tối đa của `price` (~10^12) vẫn nằm trong số nguyên an toàn của JavaScript; không cần BigInt |
