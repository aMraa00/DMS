# Журмаар тохируулга (tracking)

Энэ файл нь журмын заалтын хүснэгт ба одоогийн кодын **байршил / төлөв**-ийг хадгална. Сүүлийн шинэчлэлт кодтой синк хийж шинэчилнэ.

| Модуль | Функц | Журмын заалт | Төлөв | Код / тэмдэглэл |
|--------|--------|--------------|--------|------------------|
| Нэвтрэлт | WEST API | 3.1.1 | **Бэлэн** | `server/src/services/west.service.ts`, `POST /api/v1/auth/login` |
| Бүртгэл | Шинэ элсэгч | 3.1.1 | **Бэлэн** | `POST /api/v1/auth/register` |
| Өрөө захиалга | Хүсэлт | 3.1.4 | **Бэлэн** | `POST /api/v1/applications` |
| | Байр/давхар/өрөө | 3.1.4 | **Бэлэн** | `PUT .../select-room`, `GET /api/v1/rooms/available` |
| | Эрэмбэ 5 түвшин | 3.1.5 | **Хэсэгчлэн** | `priority.service.ts` (тохируулга шаардлагатай) |
| | Төлбөр 4 цаг | 3.1.6 | **Хэсэгчлэн** | `paymentDueAt`; QPay webhook дутуу |
| | Цахим төлбөр | 4.1 | **Голомт** | `POST …/applications/:id/pay` (stub) |
| Төлбөр | Буцаалт (~1 сар) | 4.6–4.7 | **Голомт** | `POST /api/v1/payments/refunds`, `Refund` загвар |
| | Шимтгэл 10% / 1 сар | 4.4–4.5 | **Голомт** | `penalty.service.ts`, body: `neverSignedContract` / `contractCancelled` |
| Гэрээ | e-sign | 3.2.1 | **Голомт** | `POST /api/v1/contracts/:id/sign` + `GET /contracts/me` |
| | 7 хоног | 4.4 | **Голомт** | `signDeadlineAt` — гэрээ үүсгэх урсгал (төлбөр дараа) дутуу |
| Өдөр тутмын | Зочин (20:00) | Дэг-3 | **Бэлэн** | `POST/GET /api/v1/daily/guest-passes`, `…/my` |
| | Түр чөлөө 1–3 өдөр | 4.2.11 | **Бэлэн** | `POST/GET /api/v1/daily/leave-requests` |
| | Байраас гарах 7 хоног | 3.3.2 | **Бэлэн** | `POST/GET /api/v1/daily/exit-requests` |
| | Санал гомдол | 6.2.2 | **Бэлэн** | `POST/GET /api/v1/daily/complaints` |
| | Эд хогшил (зун) | 4.10 | **Бэлэн** | `POST/GET /api/v1/daily/storage-requests` |
| Удирдлага | Өрөө хуваарилалт | 8.1 | **Голомт** | `GET /api/v1/admin/pending-overview` |
| | Эд хөрөнгө | 3.2.6 | **Загвар** | `Inventory` модел — админ POST дутуу |
| | Зөрчил/сануулга | 6.3.x | **Загвар** | моделүүд байна; REST дутуу |
| | Гэрээ цуцлах | 6.3.3 | **Төлөвлөгөө** | админ `PUT /contracts/:id/cancel` дутуу |
| | Хөнгөлөлт ≤50% | 5.7.7 | **Загвар** | `CouncilMember.feeDiscount` — логик дутуу |
| Тайлан | Сард | 5.4.2 | **Голомт** | `GET /api/v1/reports/monthly-summary` |
| | Excel/PDF | — | **Төлөвлөгөө** | `exceljs` / `pdfkit` |
| Мэдэгдэл | SMS / Имэйл | — | **Төлөвлөгөө** | SendGrid / операторын API |

### API (`/api/v1/...`) хурдан индекс

| Хэсэг | Метод ба зам |
|--------|----------------|
| Өдөр тутмын | `POST/GET /api/v1/daily/guest-passes` (+ `/my`), `…/leave-requests`, `…/exit-requests`, `…/complaints`, `…/storage-requests` |
| Гэрээ | `GET /contracts/me`, `POST /contracts/:id/sign` |
| Төлбөр буцаах | `GET /payments/me`, `POST /payments/refunds`, `GET /payments/refunds/my` |
| Тайлан | `GET /reports/monthly-summary?yearMonth=2026-05` *(admin/accountant/staff)* |
| Админ | `GET /admin/pending-overview`, `GET /admin/payments/overview` |

**Тэмдэглэл:** FE хуудаснууд ихэнхидээ placeholder (`/contract`, `/payments`, `/daily`, `/admin`). Дээрх endpoint-уудыг UI-тай холбоход хангалттай суурь бэлэн.
