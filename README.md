# Polyglot Quest：多語學習與戰鬥結合的互動式詞彙冒險平台(全端背單字 & 抽獎券服務平台)

## Public github link
https://github.com/HUANGYUSHIAN/wp1141_final_word.git

## Members
R12631024 黃宇賢(YS)
B11705010 孫寅鈞(Vin)

## Deploy Link
https://word-war-app.vercel.app/

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
- ✅ 單字本建立與管理（手動建立、AI 生成、Excel 上傳）
- ✅ 單字管理（CRUD、批量更新）
- ✅ 單字複習（閃卡系統）
- ✅ 單字測驗（多種題型、點數獎勵）
- ✅ 遊戲功能（Wordle 猜謎遊戲、Snake 貪食蛇遊戲、AI King 電腦知識王）
- ✅ 文法家教（AI 驅動的對話式教學）
- ✅ 優惠券瀏覽與抽獎
- ✅ 我的優惠券查看
- ✅ 個人設定與 LLM 使用統計
- ✅ AI 助手（左下角浮動視窗，提供即時幫助）

### Supplier 功能
- ✅ 優惠券管理（建立、編輯、刪除、查看、擁有者列表）
- ✅ 店鋪管理（建立、編輯、刪除、查看）
- ✅ 供應商設定

### Admin 功能
- ✅ 用戶管理（查看、編輯、刪除、新增、上鎖、LLM 配額查看）
- ✅ 單字本管理（查看、編輯、刪除、新增）
- ✅ 優惠券管理（查看、編輯、刪除、新增）
- ✅ 單字本上傳（Excel 匯入）
- ✅ 系統設定（LLM 額度、抽獎券參數、遊戲參數）
- ✅ 統計數據（PostHog 整合，使用者行為分析）
- ✅ 分頁顯示（大量資料分批載入）

### UI/UX
- ✅ Material-UI 現代化界面
- ✅ 響應式設計（支援桌面與行動裝置）
- ✅ 語言選擇功能
- ✅ 導航系統

## 👥 開發分工

### YS (R12631024 黃宇賢) 負責項目

#### 🔐 認證系統
- ✅ Google OAuth 登入：使用 NextAuth.js 整合 Google OAuth 2.0，支援 PKCE 安全流程，自動建立用戶帳號並儲存 Google ID 與基本資訊
- ✅ 角色選擇系統：新用戶首次登入時導向角色選擇頁面，可選擇 Student 或 Supplier，系統根據選擇初始化對應資料結構
- ✅ 路由保護 Middleware：實作 Next.js Middleware 進行路由保護，根據用戶角色與登入狀態自動重定向，確保權限控制

#### 👨‍🎓 學生功能
- ✅ 單字本管理：支援建立、編輯、刪除單字本，包含名稱、語言設定、公開選項，使用 Prisma 進行資料持久化
- ✅ 單字本瀏覽：提供公開單字本瀏覽功能，支援名稱、語言篩選，可加入個人單字本列表，顯示作者名稱而非 ID
- ✅ 單字本建立（手動）：手動建立單字本功能，透過 LLM API 搜尋單字，驗證格式後建立，最多 30 個單字，支援多語言
- ✅ AI 生成單字本：整合 OpenAI API 自動生成單字本，根據主題、程度、語言生成 30 個單字，非同步處理並顯示生成進度
- ✅ 單字本上傳（Excel）：使用 papaparse 解析 Excel 檔案，自動讀取標題列並匯入單字資料，支援批量建立單字本
- ✅ 單字管理（CRUD）：單字列表分頁顯示，支援編輯、刪除、批量更新，即時儲存至資料庫，包含完整格式驗證
- ✅ 文法家教：整合 OpenAI GPT-4o-mini 提供文法教學，支援英文/日文，可詢問或推薦主題，包含 Quick Replies 快速回應
- ✅ 貪食蛇遊戲：將經典貪食蛇遊戲改造成選擇題遊戲，整合單字測驗功能
- ✅ 知識王遊戲（AI King）：與 AI 對戰的問答遊戲，比較玩家與 AI 的答題表現
- ✅ 單字複習：顯示學生單字本列表，支援篩選與瀏覽，可選擇單字本進行複習，顯示單字詳細資訊，並提供語音功能
- ✅ 單字測驗：提供單字測驗功能，從學生單字本中選擇題目，支援多種測驗模式，記錄測驗結果，並提供語音功能
- ✅ 意見回饋：提供意見回饋表單，可提交對系統的建議或問題，回饋內容儲存至資料庫供管理員查看
- ✅ 個人設定：個人資料設定與 LLM 使用統計

#### 👨‍💼 管理員功能
- ✅ 用戶管理：完整的用戶 CRUD 功能，可查看、編輯、刪除、新增用戶，支援帳號上鎖與角色升級，顯示 LLM 配額
- ✅ 單字本管理：管理所有單字本資料，支援查看、編輯、刪除、新增，可查看單字內容並進行編輯，分頁顯示
- ✅ 優惠券管理：管理所有優惠券資料，支援查看、編輯、刪除、新增，可設定公開狀態，分頁顯示大量資料
- ✅ 單字本上傳：支援 Excel 檔案上傳，自動解析並建立單字本，包含完整格式驗證與錯誤處理
- ✅ 回饋管理：設定意見表單，並查看所有使用者提交的意見回饋，協助改善系統功能
- ✅ 管理員設定：系統設定頁面，可調整網頁參數與系統配置，包含用戶每日 LLM 額度、抽獎券參數、遊戲參數
- ✅ 使用者行為追蹤工具：PostHog 整合，統計數據儀表板

#### 🤖 AI 小助手
- ✅ 框架擬定：在 student 與 supplier 功能欄位左下角建立 AI 助手 icon，點開有對話框

### Vin (B11705010 孫寅鈞) 負責項目

#### 👨‍🎓 學生功能
- ✅ Wordle 猜謎遊戲：Wordle 風格的猜單字遊戲，整合單字學習功能
- ✅ 點數兌換：顯示可用優惠券列表，使用點數進行抽獎，實作中獎率機制，抽中後加入我的優惠券列表
- ✅ 我的優惠券：顯示已獲得的優惠券列表，包含優惠券詳細資訊、使用期限、QR Code 或連結，支援過期提醒，並使用 Google Maps URL Scheme，在優惠券詳情對話框中新增「開啟 Google Maps」按鈕，點擊後在新分頁開啟 Google Maps 並載入店家資訊，能看到營業時間、地址、評論等，能利用既有功能導航至指定地點

#### 🏪 供應商功能
- ✅ 優惠券管理：完整的優惠券 CRUD 功能，包含名稱、期限、連結、內容、圖片設計，可查看擁有者列表
- ✅ 店鋪地址驗證：整合 Google Geocoding API 在供應商編輯店鋪資訊時驗證地址，使用 Google Places Autocomplete 提供地址自動完成。輸入地址時使用自動完成功能，驗證地址格式並轉換為座標，確保地址可用於 Google Maps 定位與導航
- ✅ Google Maps 預覽：在供應商店鋪管理頁面使用 Google Maps Embed API 顯示店鋪位置預覽，使用 iframe 嵌入地圖確認地址正確性。編輯店鋪資訊時即時顯示地圖預覽，供應商可確認位置是否正確，避免地址錯誤影響學生使用優惠券的體驗
- ✅ 座標儲存：使用 Google Geocoding API 將地址轉換為經緯度座標，儲存至 Supplier 或 Store 模型的 latitude、longitude 欄位。在資料庫中新增座標欄位，儲存經緯度資訊，減少後續 API 呼叫次數，提升地圖載入速度與系統效能
- ✅ 多分店管理：支援供應商管理多個分店，每個分店可設定獨立地址與座標，優惠券可關聯特定分店，使用 Store 模型儲存。在建立優惠券時可選擇關聯的分店，學生使用優惠券時自動導向對應分店的 Google Maps，提升使用準確度
- ✅ 意見回饋：提供意見回饋表單，可提交對系統的建議或問題，回饋內容儲存至資料庫供管理員查看

#### 🤖 AI 小助手
- ✅ 針對 student 與 supplier 根據網頁設計導引初次使用者，透過對話學會網站使用

#### 🎨 UI/UX 功能
- ✅ 支援手機顯示：手機打開網頁後，有別於網頁橫向設計，變成垂直設計
- ✅ 視覺設計系統：主題、色彩、字體、間距、陰影
- ✅ 響應式設計：斷點、自適應佈局、行動/平板/桌面優化
- ✅ 互動設計：按鈕回饋、表單驗證、載入狀態、過渡動畫、微互動
- ✅ 導覽系統：側邊欄、麵包屑、標籤頁、返回按鈕、快速操作
- ✅ 內容呈現：表單、表格、清單、對話方塊、資料視覺化
- ✅ 使用者回饋：成功/錯誤/警告/訊息提示、確認對話框
- ✅ 動畫與轉場：頁面轉場、元素進入、載入、捲動、微動畫
- ✅ 視覺層次：標題體系、內容分組、強調重點、空白運用、對齊網格
- ✅ 操作直覺性：圖示、按鈕標籤、表單、操作流程、快速鍵
- ✅ 資料傳送：分頁、篩選搜尋、排序、空狀態、載入最佳化

## 🚀 快速開始

### 前置需求

- Node.js 18+ 
- npm 或 yarn
- MongoDB（如果使用 MongoDB 模式，可選）

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.example` 文件為 `.env`：

```bash
# Windows
copy .env.example .env

# Linux/macOS
cp .env.example .env
```

然後編輯 `.env` 文件，填入必要的環境變數（詳見下方說明）。

**⚠️ 重要：`.env` 文件包含敏感資訊，絕對不要提交到 Git！**

#### 環境變數說明

**必填項目：**

- `DATABASE_local`: 設定為 `"true"` 使用本地 JSON 資料庫（推薦開發用），或 `"false"` 使用 MongoDB
- `NEXTAUTH_URL`: 應用程式基礎 URL（開發環境：`http://localhost:3000`）
- `NEXTAUTH_SECRET`: 用於加密 JWT token 的密鑰（至少 32 字符）

**選填項目（根據功能需求）：**

- `DATABASE_URL`: MongoDB 連接字串（僅在 `DATABASE_local=false` 時需要）
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Google OAuth 憑證（用於 Google 登入）
- `GOOGLE_MAPS_API_KEY`: Google Maps API Key（用於店家地址跳轉）
- `OPENAI_API_KEY`: OpenAI API Key（用於 AI 功能）
- PostHog 相關變數（用於使用者行為追蹤）

詳細說明請參考 `.env.example` 文件中的註解。

### 3. 初始化資料庫

#### 選項 A：使用本地資料庫（推薦開發用）

```bash
# 初始化本地資料庫文件
npm run db:init-local

# 建立測試資料（包含測試用戶、單字本、優惠券等）
npm run db:seed-test-data
```

#### 選項 B：使用 MongoDB

```bash
# 生成 Prisma Client
npm run db:generate

# 推送 schema 到 MongoDB
npm run db:push

# 建立測試資料
npm run db:seed-test-data
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000)

### 5. 測試登入

執行 `npm run db:seed-test-data` 後，會顯示測試帳號的 User ID。使用方式：

1. 前往登入頁面：http://localhost:3000/login
2. 選擇「測試登入」
3. 輸入顯示的 User ID 進行登入

測試帳號包含：
- **學生帳號**：可測試單字本、遊戲、優惠券等功能
- **廠商帳號**：可測試優惠券管理、店鋪管理等功能
- **管理員帳號**：可測試用戶管理、單字本管理等功能

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
- **單字本** (`/student/vocabulary`)：建立、管理單字本，AI 生成，Excel 上傳
- **單字複習** (`/student/review`)：閃卡式單字複習
- **單字測驗** (`/student/test`)：多種題型測驗，獲得點數
- **遊戲** (`/student/game`)：Wordle、Snake、AI King 三種遊戲
- **文法家教** (`/student/grammar`)：AI 驅動的文法教學
- **商店** (`/student/store`)：瀏覽與抽獎優惠券
- **設定** (`/student/setting`)：個人資料與 LLM 使用統計
- **AI 助手**：左下角浮動視窗，提供即時幫助與教學

#### Supplier（供應商）
- **優惠券** (`/supplier/coupon`)：建立、管理優惠券，查看擁有者
- **店鋪** (`/supplier/store`)：管理店鋪資訊
- **設定** (`/supplier/setting`)：供應商資料設定
- **AI 助手**：左下角浮動視窗，提供即時幫助

#### Admin（管理員）
- **用戶管理** (`/admin/user`)：管理所有用戶（含上鎖、LLM 配額）
- **單字本管理** (`/admin/vocabulary`)：管理所有單字本
- **優惠券管理** (`/admin/coupon`)：管理所有優惠券
- **統計數據** (`/admin/statistics`)：PostHog 使用者行為分析
- **設定** (`/admin/setting`)：系統設定（LLM 額度、抽獎參數、遊戲參數）

## 🛠️ 資料庫管理腳本

### 建立測試資料（推薦）

```bash
# 建立完整的測試資料（包含用戶、單字本、優惠券、店鋪等）
npm run db:seed-test-data
```

此腳本會建立：
- 測試用戶（學生、廠商、管理員各一個）
- 3 個範例單字本（TOEIC 基礎單字、JLPT N5 日文單字、餐廳用餐英文）
- 3 個範例優惠券
- 2 個範例分店
- 系統參數

執行後會顯示所有測試帳號的 User ID，可用於測試登入。

### 創建單一測試用戶

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
│   ├── test-posthog.ts            # PostHog 測試腳本
│   └── ...                        # 其他工具腳本
├── src/
│   ├── app/
│   │   ├── api/                   # API 路由
│   │   │   ├── auth/              # 認證相關
│   │   │   ├── admin/             # Admin API (users, vocabularies, coupons, setting, statistics)
│   │   │   ├── student/           # Student API (vocabularies, games, grammar, coupons, llm-usage)
│   │   │   ├── supplier/          # Supplier API (coupons, stores)
│   │   │   └── user/              # 用戶相關 API
│   │   ├── admin/                 # Admin 頁面
│   │   │   ├── user/              # 用戶管理
│   │   │   ├── vocabulary/        # 單字本管理（含 upload）
│   │   │   ├── coupon/            # 優惠券管理
│   │   │   ├── setting/           # 系統設定
│   │   │   └── statistics/        # 統計數據
│   │   ├── student/               # Student 頁面
│   │   │   ├── vocabulary/        # 單字本管理
│   │   │   ├── game/              # 遊戲中心
│   │   │   ├── review/            # 單字複習
│   │   │   ├── test/              # 單字測驗
│   │   │   ├── grammar/           # 文法家教
│   │   │   ├── store/             # 點數兌換
│   │   │   └── setting/           # 個人設定
│   │   ├── supplier/              # Supplier 頁面
│   │   │   ├── coupon/            # 優惠券管理
│   │   │   ├── store/             # 店鋪管理
│   │   │   └── setting/           # 供應商設定
│   │   ├── login/                 # 登入頁面
│   │   └── edit/                  # 角色選擇頁面
│   ├── components/                # 共用組件
│   │   ├── LanguageSelect.tsx     # 語言選擇
│   │   ├── ResponsiveWrapper.tsx  # 響應式包裝
│   │   ├── AIAssistant.tsx        # AI 助手組件
│   │   ├── PostHogProvider.tsx    # PostHog 提供者
│   │   ├── WordleGame.tsx          # Wordle 遊戲
│   │   ├── SnakeGame.tsx           # Snake 遊戲
│   │   ├── AIGame.tsx              # AI King 遊戲
│   │   └── ...                    # 其他組件
│   ├── lib/
│   │   ├── auth.ts                # NextAuth 配置
│   │   ├── prisma.ts              # Prisma 客戶端
│   │   ├── posthog.ts             # PostHog 初始化
│   │   ├── llmQuota.ts            # LLM 配額管理
│   │   ├── llmCost.ts             # LLM 成本計算
│   │   └── utils/                 # 工具函數（examiner, speechUtils, languageUtils）
│   ├── hooks/
│   │   └── usePostHog.ts          # PostHog Hook
│   └── middleware.ts             # 路由保護中間件
├── plan/                          # 計劃文檔
│   ├── plan.md                    # 開發計劃
│   ├── description.md             # 專案描述
│   ├── features.md                # 功能清單
│   └── ...                        # 其他文檔
└── .env                           # 環境變數（需自行創建）
```

## 🗄️ 資料庫 Schema

### 主要模型

- **User**：用戶基本資料（userId, googleId, name, email, image, phoneNumber, birthday, language, isLock, dataType, feedback, llmQuota）
- **Student**：學生資料（lvocabuIDs, lcouponIDs, paraGame, payments, lfriendIDs, chathistory）
- **Supplier**：供應商資料（lsuppcoIDs, payments, storeName, storeLocation, storeHours, storeWebsite, stores）
- **Admin**：管理員資料（permissions）
- **Vocabulary**：單字本（vocabularyId, name, langUse, langExp, copyrights, establisher, public, words）
- **Word**：單字（word, spelling, explanation, partOfSpeech, sentence）
- **Coupon**：優惠券（couponId, name, period, link, text, picture, storeName, storeLocation, storeHours, storeWebsite）
- **Store**：店鋪（name, location, website, businessHours, lscores, lcomments）
- **Comment**：評論（userId, score, content）
- **FeedbackForm**：回饋表單（questions）
- **PublicVocabularyList**：公開單字本列表（vocabularyIds）
- **Sys_para**：系統參數（LLM_quota, new_points, gameParams）

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

整體進度：**100%** ✅

### 核心功能已完成

#### 認證系統（100%）
- ✅ Google OAuth 2.0 登入（PKCE 流程）
- ✅ 測試登入（Credentials Provider）
- ✅ 角色選擇系統（Student/Supplier）
- ✅ Session 管理（JWT，30 天有效期）
- ✅ Middleware 路由保護
- ✅ 新用戶導向角色選擇頁面

#### 資料庫架構（100%）
- ✅ Prisma Schema 完整定義
- ✅ MongoDB 整合
- ✅ 所有資料模型實作（User, Student, Supplier, Admin, Vocabulary, Word, Coupon, Store, Comment, FeedbackForm, PublicVocabularyList, Sys_para）

#### Student 功能（100%）
- ✅ 單字本管理（建立、編輯、刪除、瀏覽、加入）
- ✅ 單字本建立方式（手動建立、AI 生成、Excel 上傳）
- ✅ 單字管理（CRUD、批量更新、分頁顯示）
- ✅ 單字複習（閃卡系統）
- ✅ 單字測驗（多種題型、點數獎勵、錯誤查看）
- ✅ 遊戲功能（Wordle、Snake、AI King，含點數系統）
- ✅ 文法家教（AI 驅動，支援多語言，Quick Replies）
- ✅ 優惠券瀏覽與抽獎（中獎率機制）
- ✅ 我的優惠券查看
- ✅ 個人設定與 LLM 使用統計
- ✅ AI 助手（左下角浮動視窗，互動式教學）

#### Supplier 功能（100%）
- ✅ 優惠券管理（建立、編輯、刪除、查看、擁有者列表）
- ✅ 店鋪管理（建立、編輯、刪除、查看）
- ✅ 供應商設定
- ✅ AI 助手（左下角浮動視窗）

#### Admin 功能（100%）
- ✅ 用戶管理（查看、編輯、刪除、新增、上鎖、LLM 配額查看）
- ✅ 單字本管理（查看、編輯、刪除、新增、Excel 上傳）
- ✅ 優惠券管理（查看、編輯、刪除、新增）
- ✅ 系統設定（LLM 額度、抽獎券參數、遊戲參數）
- ✅ 統計數據（PostHog 整合，使用者行為分析）

#### AI 與分析功能（100%）
- ✅ OpenAI GPT-4o-mini 整合（單字生成、文法教學）
- ✅ LLM 配額管理與成本追蹤
- ✅ PostHog 使用者行為追蹤（Student、Supplier）
- ✅ Web Speech API（語音合成）

#### UI/UX（100%）
- ✅ Material-UI 現代化界面
- ✅ 響應式設計（桌面與行動裝置）
- ✅ 語言選擇功能
- ✅ 導航系統（側邊欄、AI 助手）
- ✅ 遊戲倒數與規則說明
- ✅ 錯誤處理與載入狀態

## 🎯 開發階段

### 第一階段：核心功能開發 ✅
**目標**：建立完整的 CRUD 功能與基本流程

**已完成項目**：
- ✅ 認證系統（Google OAuth、測試登入、角色選擇）
- ✅ 資料庫架構（Prisma + MongoDB）
- ✅ Admin 核心功能（用戶、單字本、優惠券管理）
- ✅ Student 核心功能（單字本、遊戲、複習、測驗）
- ✅ Supplier 核心功能（優惠券、店鋪管理）
- ✅ 基礎 UI/UX（Material-UI、響應式設計）

### 第二階段：遊戲化與 AI 整合 ✅
**目標**：遊戲功能、點數系統、AI 功能、使用者體驗優化

**已完成項目**：
- ✅ 三種遊戲實作（Wordle、Snake、AI King）
- ✅ 完整點數系統（遊戲、測驗點數獎勵，參數化設定）
- ✅ LLM 整合（OpenAI GPT-4o-mini 用於單字生成、文法教學）
- ✅ LLM 配額管理與成本追蹤
- ✅ 單字測驗功能（多種題型、錯誤查看）
- ✅ 遊戲倒數與規則說明
- ✅ 錯誤處理與用戶體驗優化

### 第三階段：分析與優化 ✅
**目標**：使用者行為追蹤、數據分析、系統優化

**已完成項目**：
- ✅ PostHog 整合（使用者行為追蹤、事件捕捉）
- ✅ 統計數據儀表板（Admin 端）
- ✅ AI 助手（左下角浮動視窗，互動式教學）
- ✅ 參數化系統設定（遊戲參數、抽獎參數、LLM 額度）
- ✅ 完整的功能測試與錯誤處理

## 🛠️ 技術棧

### 前端框架
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Material-UI (MUI) 5**
- **Emotion** (CSS-in-JS)

### 後端與資料庫
- **Next.js API Routes**
- **Prisma ORM**
- **MongoDB**

### 認證與授權
- **NextAuth.js 4** (JWT Strategy)
- **Google OAuth 2.0** (PKCE Flow)
- **Middleware Route Protection**

### AI 與分析
- **OpenAI API** (GPT-4o-mini)
- **PostHog Analytics**
- **Web Speech API** (Speech Synthesis)

### 資料處理
- **PapaParse** (CSV/Excel parsing)
- **XLSX** (Excel file handling)
- **Franc** (Language detection)

### 部署與工具
- **Vercel** (部署平台)
- **Dotenv** (環境變數管理)

## 📝 相關文檔

- [專案描述與架構](./plan/description.md)
- [資料結構與規格](./plan/plan.md)
- [功能開發清單](./plan/features.md)
- [監督功能說明](./plan/supervise.md)
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
