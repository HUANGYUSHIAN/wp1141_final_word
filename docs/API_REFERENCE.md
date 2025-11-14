# API 速查表

所有 API 皆為 Next.js Route Handler，會自動共用 `src/lib/prisma.ts` 配置，因此只要 `.env` 連到遠端 MongoDB，前後端就會讀寫同一份資料。

> Base URL：`/api`

## 使用者

| Method | Path | 說明 |
| --- | --- | --- |
| `GET` | `/user` | 取得目前登入者資訊（自動檢查 session 與鎖定狀態）。 |
| `POST` | `/user/select-role` | 新使用者選擇 `Student` / `Supplier`，會初始化對應資料表。 |

## 管理員：用戶

| Method | Path | 說明 |
| --- | --- | --- |
| `GET` | `/admin/users?page=<p>&limit=<n>` | 分頁列出所有使用者。 |
| `POST` | `/admin/users` | 建立使用者（後端會自動生成 30 碼 `userId`）。 |
| `PUT` | `/admin/users/{userId}` | 更新個人資訊（姓名、Email、生日、語言等）。 |
| `DELETE` | `/admin/users/{userId}` | 刪除使用者。 |
| `POST` | `/admin/users/{userId}/lock` | 切換帳號鎖定狀態。 |

## 管理員：單字本

| Method | Path | 說明 |
| --- | --- | --- |
| `GET` | `/admin/vocabularies?page=<p>&limit=<n>` | 分頁列出單字本，包含單字數。 |
| `POST` | `/admin/vocabularies` | 建立單字本（自動產生 `vocabularyId`）。 |
| `PUT` | `/admin/vocabularies/{vocabularyId}` | 更新單字本基本資料。 |
| `DELETE` | `/admin/vocabularies/{vocabularyId}` | 刪除單字本。 |
| `GET` | `/admin/vocabularies/{vocabularyId}/words?page=<p>&limit=<n>` | 分頁取得單字。 |
| `POST` | `/admin/vocabularies/{vocabularyId}/words/upload` | 批次新增單字（支援 CSV/Excel 解析後的陣列）。 |

## 管理員：優惠券

| Method | Path | 說明 |
| --- | --- | --- |
| `GET` | `/admin/coupons?page=<p>&limit=<n>` | 分頁列出優惠券。 |
| `POST` | `/admin/coupons` | 建立優惠券（自動產生 `couponId`）。 |
| `PUT` | `/admin/coupons/{couponId}` | 更新優惠券內容。 |
| `DELETE` | `/admin/coupons/{couponId}` | 刪除優惠券。 |

> `/admin/coupons/{couponId}` 對應的 Route Handler 位於 `src/app/api/admin/coupons/[couponId]/route.ts`。

## 認證

* Google OAuth 與測試登入皆由 NextAuth (`/api/auth/[...nextauth]`) 處理。
* `src/lib/auth.ts` 會在首次登入時建立 MongoDB 使用者資料，並於 session token 中帶入 `userId`，供上述 API 驗證權限。***

