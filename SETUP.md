# 專案設置指南

本專案支援兩種資料庫模式：
1. **本地資料庫（Local Database）**：使用 JSON 文件，適合開發和測試
2. **MongoDB**：生產環境使用

## 📋 目錄

- [快速開始](#快速開始)
- [環境變數設定](#環境變數設定)
- [本地資料庫設置](#本地資料庫設置)
- [MongoDB 設置](#mongodb-設置)
- [從 MongoDB 遷移到本地資料庫](#從-mongodb-遷移到本地資料庫)
- [本地部署（使用本地資料庫）](#本地部署使用本地資料庫)
- [創建管理員帳號](#創建管理員帳號)
- [測試登入](#測試登入)
- [資料庫結構](#資料庫結構)
- [常用指令](#常用指令)
- [疑難排解](#疑難排解)

---

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設置環境變數

複製 `.env.example` 文件為 `.env`：

```bash
# Windows
copy .env.example .env

# Linux/macOS
cp .env.example .env
```

然後根據需要修改 `.env` 文件中的設定（參考下方 [環境變數設定](#環境變數設定) 章節）

### 3. 選擇資料庫模式

**選項 A：使用本地資料庫（推薦用於開發）**

```bash
# 在 .env 中設置
DATABASE_local=true
```

然後初始化本地資料庫：

```bash
npm run db:init-local
npm run db:create-admin
```

**選項 B：使用 MongoDB**

```bash
# 在 .env 中設置
DATABASE_local=false
DATABASE_URL="mongodb://localhost:27017/oauth"
```

然後推送 schema 到 MongoDB：

```bash
npm run db:push
npm run db:create-admin
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

訪問 http://localhost:3000

---

## 🔧 環境變數設定

專案根目錄已包含 `.env.example` 文件作為範本。請複製並重新命名為 `.env`，然後根據需要修改：

```bash
# Windows
copy .env.example .env

# Linux/macOS
cp .env.example .env
```

`.env` 文件應包含以下內容：

```env
# 資料庫模式選擇
# true = 使用本地 JSON 資料庫（開發用）
# false = 使用 MongoDB（生產用）
DATABASE_local=true

# MongoDB 連接字串（僅在 DATABASE_local=false 時需要）
DATABASE_URL="mongodb://localhost:27017/oauth"

# Google OAuth（用於 Google 登入功能）
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# NextAuth 設定
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"
```

**⚠️ 重要：`.env` 文件包含敏感資訊，絕對不要提交到 Git！**

### 各變數說明

#### DATABASE_local
- **類型**：`boolean`（字串 "true" 或 "false"）
- **說明**：決定使用本地資料庫或 MongoDB
- **預設**：`false`（使用 MongoDB）

#### DATABASE_URL
- **類型**：`string`
- **說明**：MongoDB 連接字串（僅在 `DATABASE_local=false` 時需要）
- **格式**：`mongodb://[username:password@]host[:port]/database`
- **範例**：
  - 本地：`mongodb://localhost:27017/oauth`
  - MongoDB Atlas：`mongodb+srv://username:password@cluster.mongodb.net/oauth`

#### GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
- **類型**：`string`
- **說明**：從 [Google Cloud Console](https://console.cloud.google.com/) 獲取的 OAuth 2.0 憑證
- **如何獲取**：
  1. 前往 Google Cloud Console
  2. 創建新專案或選擇現有專案
  3. 啟用 Google+ API
  4. 創建 OAuth 2.0 憑證
  5. 設定授權重定向 URI：`http://localhost:3000/api/auth/callback/google`

#### NEXTAUTH_URL
- **類型**：`string`
- **說明**：應用程式的基礎 URL
- **開發環境**：`http://localhost:3000`
- **生產環境**：您的實際網域

#### NEXTAUTH_SECRET
- **類型**：`string`
- **說明**：用於加密 JWT token 的密鑰，建議使用至少 32 字符的隨機字串
- **生成方式**：

  **Linux/macOS:**
  ```bash
  openssl rand -base64 32
  ```

  **Windows PowerShell:**
  ```powershell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
  ```

  **Node.js:**
  ```javascript
  require('crypto').randomBytes(32).toString('base64')
  ```

---

## 💾 本地資料庫設置

本地資料庫使用 JSON 文件存儲資料，所有文件存放在 `.local-db/` 目錄中。

### 初始化本地資料庫

```bash
npm run db:init-local
```

此指令會創建以下文件：
- `users.json` - 使用者資料
- `students.json` - 學生資料
- `suppliers.json` - 廠商資料
- `admins.json` - 管理員資料
- `coupons.json` - 優惠券資料
- `vocabularies.json` - 單字本資料
- `words.json` - 單字資料
- `stores.json` - 店鋪資料
- `comments.json` - 評論資料

### 本地資料庫的優點

- ✅ 無需安裝 MongoDB
- ✅ 快速設置，適合開發和測試
- ✅ 資料以 JSON 格式存儲，易於查看和備份
- ✅ 無需網路連接

### 本地資料庫的限制

- ⚠️ 不適合生產環境
- ⚠️ 不支援複雜的查詢和索引
- ⚠️ 並發寫入可能導致資料不一致

---

## 🍃 MongoDB 設置

### 安裝 MongoDB

**macOS (使用 Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
1. 下載 [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. 執行安裝程式
3. 啟動 MongoDB 服務

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# 啟動服務
sudo systemctl start mongodb
```

### 使用 MongoDB Atlas（雲端）

1. 前往 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 創建免費帳號
3. 創建新集群
4. 獲取連接字串
5. 在 `.env` 中設置 `DATABASE_URL`

### 推送 Schema 到 MongoDB

```bash
# 確保 DATABASE_local=false 在 .env 中
npm run db:push
```

此指令會根據 `prisma/schema.prisma` 創建資料庫結構。

---

## 👤 創建管理員帳號

### 使用本地資料庫

```bash
# 1. 確保 DATABASE_local=true 在 .env 中
# 2. 初始化資料庫（如果尚未初始化）
npm run db:init-local

# 3. 創建管理員帳號
npm run db:create-admin [name] [email]
```

**範例：**
```bash
npm run db:create-admin "Admin User" "admin@example.com"
```

如果不提供參數，會使用預設值：
- Name: "Admin User"
- Email: `admin{timestamp}@example.com`

### 使用 MongoDB

```bash
# 1. 確保 DATABASE_local=false 在 .env 中
# 2. 推送 schema（如果尚未推送）
npm run db:push

# 3. 創建管理員帳號
npm run db:create-admin [name] [email]
```

### 查看所有管理員帳號

```bash
npm run db:list-admins
```

### 管理員帳號資訊

創建成功後，腳本會顯示：
- **User ID**：用於測試登入的唯一識別碼（30 字符）
- **Name**：管理員名稱
- **Email**：管理員電子郵件
- **Role**：Admin

**⚠️ 重要：請複製並保存 User ID，用於測試登入！**

---

## 🧪 測試登入

### 測試登入流程

1. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

2. 訪問登入頁面：
   ```
   http://localhost:3000/login
   ```

3. 選擇「測試登入」選項

4. 輸入管理員的 **User ID**（從 `npm run db:create-admin` 獲取）

5. 登入成功後會自動導向 `/admin` 管理後台

### Google OAuth 登入

1. 確保 `.env` 中已設置 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`

2. 在登入頁面選擇「使用 Google 登入」

3. 首次登入會要求選擇角色（Student 或 Supplier）

4. 選擇角色後會強制登出，需要重新登入

---

## 📊 資料庫結構

### User（使用者）

```typescript
{
  id: string              // MongoDB ObjectId 或本地生成的 ID
  userId: string          // 30 字符的唯一識別碼（用於測試登入）
  googleId?: string       // Google OAuth ID（可選）
  name?: string           // 使用者名稱
  email?: string          // 電子郵件
  image?: string          // 頭像 URL
  phoneNumber?: string    // 手機號碼
  birthday?: Date         // 生日
  language?: string       // 母語
  isLock: boolean         // 帳號是否鎖定
  dataType?: string       // "Student" | "Supplier" | "Admin" | null
  createdAt: Date
  updatedAt: Date
}
```

### Student（學生）

```typescript
{
  id: string
  userId: string          // 關聯到 User.userId
  lvocabuIDs: string[]   // 單字本 ID 列表
  lcouponIDs: string[]   // 優惠券 ID 列表
  paraGame?: string       // 遊戲參數（JSON 字串）
  payments?: string       // 付款資料（JSON 字串）
  lfriendIDs: string[]   // 好友 ID 列表
  createdAt: Date
  updatedAt: Date
}
```

### Supplier（廠商）

```typescript
{
  id: string
  userId: string          // 關聯到 User.userId
  lsuppcoIDs: string[]   // 提供的優惠券 ID 列表
  payments?: string       // 付款資料（JSON 字串）
  stores: Store[]        // 店鋪列表
  createdAt: Date
  updatedAt: Date
}
```

### Admin（管理員）

```typescript
{
  id: string
  userId: string          // 關聯到 User.userId
  permissions: string[]   // 權限列表
  createdAt: Date
  updatedAt: Date
}
```

### Vocabulary（單字本）

```typescript
{
  id: string
  vocabularyId: string    // 單字本唯一 ID
  name: string           // 單字本名稱
  langUse: string        // 背誦單字的語言
  langExp: string        // 解釋單字的語言
  copyrights?: string    // 版權資訊
  establisher: string    // 建立者 ID
  words: Word[]          // 單字列表
  createdAt: Date
  updatedAt: Date
}
```

### Word（單字）

```typescript
{
  id: string
  vocabularyId: string    // 關聯到 Vocabulary.id
  word: string           // 單字
  spelling?: string      // 拼音
  explanation: string    // 解釋
  partOfSpeech?: string  // 詞性
  sentence?: string      // 範例句
  createdAt: Date
  updatedAt: Date
}
```

### Coupon（優惠券）

```typescript
{
  id: string
  couponId: string        // 優惠券唯一 ID
  name: string           // 優惠券名稱
  period: Date           // 使用期限
  link?: string          // QR Code 或 URL
  text?: string          // 內容
  picture?: string       // 圖片 URL
  createdAt: Date
  updatedAt: Date
}
```

### Store（店鋪）

```typescript
{
  id: string
  supplierId: string      // 關聯到 Supplier.id
  name: string           // 分店名稱
  location?: string      // 位置
  website?: string       // 網站
  lscores: number[]     // 評分統計 [1分人數, 2分人數, ..., 5分人數]
  lcomments: Comment[]  // 評論列表
  createdAt: Date
  updatedAt: Date
}
```

### Comment（評論）

```typescript
{
  id: string
  storeId: string        // 關聯到 Store.id
  userId: string         // 評論者 userId
  score: number          // 評分 (1-5)
  content?: string       // 評論內容
  createdAt: Date
  updatedAt: Date
}
```

---

## 📝 常用指令

### 開發相關

```bash
# 啟動開發伺服器
npm run dev

# 建置生產版本
npm run build

# 啟動生產伺服器
npm start

# 執行 Lint
npm run lint
```

### 資料庫相關

```bash
# 初始化本地資料庫
npm run db:init-local

# 生成 Prisma Client
npm run db:generate

# 推送 Schema 到 MongoDB
npm run db:push

# 遷移本地資料到 MongoDB
npm run db:migrate-to-mongodb

# 遷移 MongoDB 資料到本地
npm run db:migrate-to-local

# 創建管理員帳號
npm run db:create-admin [name] [email]

# 列出所有管理員
npm run db:list-admins

# 測試資料庫連接
npm run db:test

# 檢查環境變數
npm run db:check-env
```

### 其他工具

```bash
# 檢查 Google OAuth 設定
npm run check:oauth

# 檢查 Vercel 環境變數
npm run check:vercel

# 測試環境變數
npm run test:env
```

---

## 🔄 從 MongoDB 遷移到本地資料庫

如果您想將 MongoDB 的資料遷移到本地資料庫（例如：為了在本地部署或分享資料）：

### 使用自動遷移腳本（推薦）

1. **備份本地資料庫**（如果已有資料）
   ```bash
   # 備份 .local-db 目錄
   cp -r .local-db .local-db.backup
   ```

2. **更新 `.env` 設定**：
   ```env
   DATABASE_local=false
   DATABASE_URL="mongodb://localhost:27017/oauth"
   # 或使用 MongoDB Atlas 連接字串
   ```

3. **執行遷移**：
   ```bash
   npm run db:migrate-to-local
   ```

此腳本會自動遷移以下資料：
- Users（使用者）
- Students（學生）
- Suppliers（廠商）
- Admins（管理員）
- Vocabularies（單字本）
- Words（單字）
- Coupons（優惠券）
- Stores（店鋪）
- Comments（評論）

4. **切換回本地資料庫模式**：
   ```env
   DATABASE_local=true
   ```

5. **重新啟動應用程式**

**注意事項：**
- ⚠️ 遷移前請確保已備份本地資料庫（會覆蓋現有資料）
- ⚠️ 遷移過程中需要 MongoDB 連接正常
- ⚠️ 遷移完成後記得將 `DATABASE_local` 設置為 `true`

---

## 💻 本地部署（使用本地資料庫）

如果您想使用本地資料庫進行部署（例如：分享給其他開發者或快速測試）：

### 步驟 1：從 GitHub 克隆專案

```bash
git clone <repository-url>
cd OAuth
```

### 步驟 2：安裝依賴

```bash
npm install
```

### 步驟 3：設置環境變數

```bash
# Windows
copy .env.example .env

# Linux/macOS
cp .env.example .env
```

編輯 `.env` 文件，確保以下設定：
```env
DATABASE_local=true
```

### 步驟 4：初始化本地資料庫

如果專案已包含 `.local-db/` 目錄（已提交到 Git），可以直接使用：

```bash
# 如果 .local-db 目錄不存在，初始化
npm run db:init-local
```

### 步驟 5：創建管理員帳號（可選）

```bash
npm run db:create-admin [name] [email]
```

### 步驟 6：啟動應用程式

```bash
npm run dev
```

訪問 http://localhost:3000

### 從 MongoDB 遷移資料到本地（可選）

如果您有 MongoDB 資料庫，想要遷移到本地：

1. **暫時切換到 MongoDB 模式**：
   ```env
   DATABASE_local=false
   DATABASE_URL="mongodb://localhost:27017/oauth"
   ```

2. **執行遷移**：
   ```bash
   npm run db:migrate-to-local
   ```

3. **切換回本地模式**：
   ```env
   DATABASE_local=true
   ```

### 本地資料庫的優點

- ✅ 無需安裝 MongoDB
- ✅ 快速設置，適合開發和測試
- ✅ 資料以 JSON 格式存儲，易於查看和備份
- ✅ 可以提交到 Git（已更新 .gitignore）
- ✅ 方便分享給其他開發者

### 本地資料庫的限制

- ⚠️ 不適合生產環境（大量並發）
- ⚠️ 不支援複雜的查詢和索引
- ⚠️ 並發寫入可能導致資料不一致

---

## 🔄 從本地資料庫遷移到 MongoDB

如果您想將本地資料庫的資料遷移到 MongoDB：

### 使用自動遷移腳本（推薦）

1. **備份 MongoDB 資料庫**（如果已有資料）

2. **更新 `.env` 設定**：
   ```env
   DATABASE_local=false
   DATABASE_URL="mongodb://localhost:27017/oauth"
   ```

3. **推送 Schema 到 MongoDB**：
   ```bash
   npm run db:push
   ```

4. **執行遷移**：
   ```bash
   npm run db:migrate-to-mongodb
   ```

此腳本會自動遷移以下資料：
- Users（使用者）
- Students（學生）
- Suppliers（廠商）
- Admins（管理員）
- Vocabularies（單字本）
- Words（單字）
- Coupons（優惠券）
- Stores（店鋪）
- Comments（評論）

**注意事項：**
- ⚠️ 遷移前請確保已備份 MongoDB 資料庫
- ⚠️ 如果資料已存在（根據唯一鍵判斷），會自動跳過，不會重複創建
- ⚠️ 遷移過程中如有錯誤，會顯示警告但不會中斷整個流程

### 手動遷移

如果需要更細緻的控制，可以參考 `scripts/migrate-local-to-mongodb.ts` 自行編寫遷移腳本。

---

## 🐛 疑難排解

### 問題：本地資料庫文件不存在

**解決方案：**
```bash
npm run db:init-local
```

### 問題：無法連接到 MongoDB

**檢查項目：**
1. MongoDB 服務是否正在運行
2. `DATABASE_URL` 是否正確
3. 防火牆是否阻擋連接
4. 如果使用 MongoDB Atlas，檢查 IP 白名單

**測試連接：**
```bash
npm run db:test
```

### 問題：創建管理員失敗

**檢查項目：**
1. 確保已初始化資料庫（本地）或推送 schema（MongoDB）
2. 檢查 `.env` 中的 `DATABASE_local` 設定是否正確
3. 查看終端錯誤訊息

### 問題：登入後被重定向回登入頁面

**可能原因：**
1. Session 未正確保存
2. `NEXTAUTH_SECRET` 未設置或已變更
3. 資料庫中找不到對應的使用者

**解決方案：**
1. 檢查 `.env` 中的 `NEXTAUTH_SECRET`
2. 清除瀏覽器 Cookie
3. 確認使用者已正確創建在資料庫中

### 問題：Google OAuth 登入失敗

**檢查項目：**
1. `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 是否正確
2. 授權重定向 URI 是否設定為 `http://localhost:3000/api/auth/callback/google`
3. Google Cloud Console 中的 OAuth 同意畫面是否已設定

**測試：**
```bash
npm run check:oauth
```

### 問題：Prisma Client 未生成

**解決方案：**
```bash
npm run db:generate
```

或重新安裝依賴：
```bash
npm install
```

---

## 📚 相關文件

- [Prisma 文件](https://www.prisma.io/docs)
- [NextAuth.js 文件](https://next-auth.js.org/)
- [Next.js 文件](https://nextjs.org/docs)
- [MongoDB 文件](https://docs.mongodb.com/)

---

## 💡 提示

1. **開發環境建議使用本地資料庫**：快速設置，無需額外服務
2. **生產環境必須使用 MongoDB**：確保資料持久性和效能
3. **定期備份資料**：本地資料庫可備份 `.local-db/` 目錄
4. **不要將 `.env` 文件提交到 Git**：已包含在 `.gitignore` 中
5. **`.local-db/` 目錄可以提交到 Git**：方便分享資料給其他開發者（已更新 `.gitignore`）
6. **`.env.example` 可以提交到 Git**：作為環境變數範本（已更新 `.gitignore`）

---

## 📞 需要幫助？

如果遇到問題，請：
1. 檢查本文件的 [疑難排解](#疑難排解) 章節
2. 查看終端錯誤訊息
3. 檢查 `.env` 設定是否正確
4. 確認所有依賴已正確安裝

---

**最後更新：** 2024

npm i -g vercel