# 全端背單字 & 抽獎券服務平台

這是一個使用 Next.js、NextAuth、Prisma、MongoDB 和 Material-UI 構建的全端背單字與抽獎券服務平台，提供三種角色完整的服務。

## 📋 專案概述

本平台提供以下服務：

- **Student（學生）**：背單字、管理單字本、獲得優惠券
- **Supplier（優惠券供應者）**：管理優惠券、店鋪資訊、查看使用者回饋
- **Admin（管理員）**：管理用戶、單字本、優惠券、系統設定

## ✨ 功能特色

### 認證系統
- ✅ Google OAuth 登入
- ✅ 測試登入（使用 User ID）
- ✅ 角色選擇（Student/Supplier）
- ✅ Session 管理（30 天有效期）
- ✅ Middleware 路由保護
- ✅ 新用戶導向角色選擇頁面

### Student 功能
- ✅ 單字本瀏覽與加入
- ✅ 單字本建立與管理
- ✅ 單字管理（CRUD、批量更新）
- ✅ 單字本上傳（Excel 匯入）
- ✅ 優惠券瀏覽與抽獎
- ✅ 我的優惠券查看
- ✅ 遊戲功能（猜謎遊戲、貪食蛇遊戲）
- ✅ 複習功能（基本架構）
- ✅ 回饋功能

### Supplier 功能
- ✅ 優惠券管理（建立、編輯、刪除、查看）
- ✅ 優惠券擁有者查看
- ✅ 店鋪管理（建立、編輯、刪除、查看）
- ✅ 回饋查看

### Admin 功能
- ✅ 用戶管理（查看、編輯、刪除、新增、上鎖）
- ✅ 單字本管理（查看、編輯、刪除、新增）
- ✅ 優惠券管理（查看、編輯、刪除、新增）
- ✅ 單字本上傳（Excel 匯入）
- ✅ 分頁顯示（大量資料分批載入）
- ✅ 管理員設定腳本

### UI/UX
- ✅ Material-UI 現代化界面
- ✅ 響應式設計（支援桌面與行動裝置）
- ✅ 語言選擇功能
- ✅ 導航系統

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

創建 `.env` 文件並填入以下內容：

```env
# Database
DATABASE_URL="mongodb://localhost:27017/word-app"
# 或使用 MongoDB Atlas
# DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/word-app"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# 本地資料庫（可選）
DATABASE_local="false"
```

### 3. 初始化資料庫

```bash
# 生成 Prisma Client
npm run db:generate

# 推送 schema 到資料庫
npm run db:push
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000)

## 📖 使用說明

### 登入方式

#### 1. Google OAuth 登入
- 點擊「使用 Google 登入」按鈕
- 首次登入會自動生成 30 字符的唯一 User ID
- 新用戶需要選擇角色（Student 或 Supplier）

#### 2. 測試登入
- 使用 `npm run db:seed` 創建測試用戶
- 在登入頁面輸入 User ID 進行登入

### 角色功能

#### Student（學生）
- **單字本** (`/student/vocabulary`)：建立、管理單字本，上傳 Excel
- **遊戲** (`/student/game`)：猜謎遊戲、貪食蛇遊戲
- **複習** (`/student/review`)：單字複習
- **商店** (`/student/store`)：瀏覽與抽獎優惠券
- **設定** (`/student/setting`)：個人資料設定

#### Supplier（供應商）
- **優惠券** (`/supplier/coupon`)：建立、管理優惠券
- **店鋪** (`/supplier/store`)：管理店鋪資訊
- **設定** (`/supplier/setting`)：供應商資料設定

#### Admin（管理員）
- **用戶管理** (`/admin/user`)：管理所有用戶
- **單字本管理** (`/admin/vocabulary`)：管理所有單字本
- **優惠券管理** (`/admin/coupon`)：管理所有優惠券
- **設定** (`/admin/setting`)：系統設定

## 🛠️ 資料庫管理腳本

### 創建測試用戶

```bash
# 使用預設值創建
npm run db:seed

# 指定名稱和郵箱
npm run db:seed "John Doe" "john@example.com"
```

### 查詢用戶資料

```bash
npm run db:query
```

### 創建管理員

```bash
# 將指定用戶設為管理員
npm run create:admin <userId>
```

### 清除所有資料

```bash
npm run db:clear
```

⚠️ **警告**：此操作會刪除資料庫中所有資料，請謹慎使用！

### 測試資料庫連接

```bash
npm run db:test
```

### 檢查 Google OAuth 設定

```bash
npm run check:oauth
```

此腳本會檢查：
- ✅ GOOGLE_CLIENT_ID 是否設定
- ✅ GOOGLE_CLIENT_SECRET 是否設定
- ✅ NEXTAUTH_URL 是否設定
- ✅ 計算並驗證回調 URL 格式
- ✅ 顯示需要在 Google Cloud Console 中添加的重定向 URI

## 📁 專案結構

```
├── prisma/
│   └── schema.prisma              # Prisma 資料庫 schema
├── scripts/
│   ├── create-test-user.ts        # 創建測試用戶腳本
│   ├── create-admin.ts            # 創建管理員腳本
│   ├── query-users.ts             # 查詢用戶腳本
│   ├── test-env.ts                # 環境測試腳本
│   └── ...                        # 其他工具腳本
├── src/
│   ├── app/
│   │   ├── api/                   # API 路由
│   │   │   ├── auth/              # 認證相關
│   │   │   ├── admin/             # Admin API
│   │   │   ├── student/            # Student API
│   │   │   └── supplier/          # Supplier API
│   │   ├── admin/                 # Admin 頁面
│   │   │   ├── user/              # 用戶管理
│   │   │   ├── vocabulary/        # 單字本管理
│   │   │   └── coupon/            # 優惠券管理
│   │   ├── student/                # Student 頁面
│   │   │   ├── vocabulary/        # 單字本
│   │   │   ├── game/              # 遊戲
│   │   │   ├── review/            # 複習
│   │   │   └── store/             # 商店
│   │   ├── supplier/              # Supplier 頁面
│   │   │   ├── coupon/            # 優惠券管理
│   │   │   └── store/             # 店鋪管理
│   │   ├── login/                 # 登入頁面
│   │   └── edit/                  # 角色選擇頁面
│   ├── components/                # 共用組件
│   │   ├── LanguageSelect.tsx     # 語言選擇
│   │   ├── ResponsiveWrapper.tsx # 響應式包裝
│   │   └── ...                    # 其他組件
│   ├── lib/
│   │   ├── auth.ts                # NextAuth 配置
│   │   ├── prisma.ts              # Prisma 客戶端
│   │   └── utils.ts               # 工具函數
│   └── middleware.ts              # 路由保護中間件
├── plan.md                        # 開發計劃與進度
└── .env                           # 環境變數（需自行創建）
```

## 🗄️ 資料庫 Schema

### 主要模型

- **User**：用戶基本資料
- **Student**：學生資料（單字本列表、優惠券列表等）
- **Supplier**：供應商資料（優惠券列表、店鋪列表等）
- **Admin**：管理員資料（權限設定）
- **Vocabulary**：單字本
- **Word**：單字
- **Coupon**：優惠券
- **Store**：店鋪
- **Comment**：評論

詳細的資料結構請參考 [plan/plan.md](./plan/plan.md)

## 🔧 Google OAuth 設定

### 基本設定步驟

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新專案或選擇現有專案
3. 啟用 Google Identity API
4. 創建 OAuth 2.0 憑證
5. **重要**：設定授權重定向 URI

### 重定向 URI 設定

在 Google Cloud Console 的 OAuth 2.0 客戶端設定中，添加以下重定向 URI：

**本地開發環境：**
```
http://localhost:3000/api/auth/callback/google
```

**Vercel 生產環境：**
```
https://your-vercel-domain.vercel.app/api/auth/callback/google
```

**⚠️ 重要：**
- URI 必須完全匹配（包括協議、域名、路徑）
- 如果有多個環境，需要分別添加每個環境的 URI
- 變更後需等待 1-2 分鐘生效

6. 將 Client ID 和 Client Secret 填入 `.env` 文件（或 Vercel 環境變數）

### 遇到 redirect_uri_mismatch 錯誤？

請參考 [plan/oauth_error.md](./plan/oauth_error.md) 獲取詳細的故障排除指南。

## 📊 開發進度

整體進度：約 **60%**

### 已完成
- ✅ 認證系統：100%
- ✅ 資料庫架構：100%
- ✅ Admin 核心功能：90%
- ✅ Student 核心功能：70%
- ✅ Supplier 核心功能：70%
- ✅ UI/UX 基礎：60%

### 進行中
- 🚧 Student 設定功能完善
- 🚧 Supplier 店鋪功能完善
- 🚧 資料驗證與錯誤處理

詳細的開發計劃請參考 [plan.md](./plan.md)

## 🎯 開發階段

### 第一階段：核心功能開發（現階段）
**目標**：建立完整的 CRUD 功能與基本流程

**不考慮**：
- ❌ 遊戲功能優化（已實作基本功能，優化留待第二階段）
- ❌ 點數計算邏輯（API 已實作，邏輯優化留待第二階段）
- ❌ 用戶體驗優化（動畫、過渡效果等）
- ❌ 進階統計與分析
- ❌ 社交功能

### 第二階段：優化與擴展（未來）
**目標**：遊戲功能、點數計算邏輯、用戶體驗優化、進階功能

## 🛠️ 技術棧

- **框架**: Next.js 16 (App Router)
- **認證**: NextAuth.js 4
- **資料庫**: MongoDB + Prisma
- **UI 框架**: Material-UI (MUI) 5
- **語言**: TypeScript
- **部署**: Vercel

## 📝 相關文檔

- [開發計劃與進度](./plan.md)
- [資料結構與規格](./plan/plan.md)
- [OAuth 錯誤處理](./plan/oauth_error.md)
- [OAuth 規格說明](./plan/oauth_spec.md)

## ⚠️ 注意事項

- 首次 Google 登入會自動生成 30 字符的唯一 User ID
- Google ID (sub) 作為唯一鍵值，用於快速查找用戶
- 會話有效期為 30 天
- 測試登入僅允許 Prisma 資料庫中存在的用戶
- 所有路由（除登入頁面和角色選擇頁面外）都需要認證
- 新用戶首次登入需要選擇角色（Student 或 Supplier）

## 📄 License

MIT
