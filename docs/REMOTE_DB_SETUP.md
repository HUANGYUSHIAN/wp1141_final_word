# 遠端 MongoDB 連線指南

以下步驟可讓專案直接連上雲端 MongoDB（例如 MongoDB Atlas），並確保 Prisma/Next.js API 全部讀寫同一個資料庫。

## 1. 建立 `.env`

在專案根目錄新增 `.env`，填入：

```
# MongoDB
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority"
DATABASE_local="false"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="請改成 32 字以上的隨機字串"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

> ✅ `DATABASE_local` 只在需要 JSON 模擬資料庫時才改成 `"true"`，預設應使用遠端 MongoDB。

## 2. 驗證連線

1. 安裝依賴：`npm install`
2. 生成 Prisma Client：`npm run db:generate`
3. 將 schema 推送到遠端：`npm run db:push`
4. 測試資料庫（含 CRUD）：`npm run db:test`
5. 檢查全域環境：`npm run test:env`

所有腳本都會讀取 `.env`，並直接連到 `DATABASE_URL` 指定的 MongoDB。

## 3. 遷移本地 JSON 資料（可選）

若曾使用 `DATABASE_local=true` 產生的 `.local-db/*.json`，可透過

```
npm run db:migrate-local
```

自動將 JSON 內容灌入遠端 MongoDB。

## 4. 部署與 NextAuth 設定

* 部署環境請將 `NEXTAUTH_URL` 設為正式網域。
* Google OAuth 的 callback URI 必須包含 `https://<domain>/api/auth/callback/google`。
* `NEXTAUTH_SECRET` 應使用 `openssl rand -base64 32` 或 `npx auth secret` 產生。

完成以上設定後，前後端所有 API（`/api/*`）就會直接對應遠端 MongoDB，無需再修改程式碼。***

