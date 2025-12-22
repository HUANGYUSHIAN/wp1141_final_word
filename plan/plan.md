# 全端背單字 & 抽獎券服務平台 - 資料結構與規格

## 1. 資料結構 (Data Structure)

### User（使用者）
```
|── id          // MongoDB ObjectId
|── userId      // 30字符的唯一識別碼（用於測試登入）
|── googleId    // Google OAuth 的 id（sub），作為唯一鍵值
|── name        // 使用者的名稱（Google OAuth 提供）
|── email       // 使用者的郵件信箱（Google OAuth 提供）
|── image       // 使用者頭像 URL
|── phoneNumber // 使用者的手機號碼
|── birthday    // 使用者的生日
|── language    // 使用者的母語
|── isLock      // 該使用者帳號是否上鎖（Boolean，處理侵害或非法使用時讓帳戶停權）
|── dataType    // 使用者角色："Student" | "Supplier" | "Admin" | null（未選擇）
|── feedback    // 使用者反饋（JSON string）
|── llmQuota    // LLM API token 使用量記錄（JSON string: { date: string, tokens: number }[]）
|── createdAt   // 建立時間
|── updatedAt   // 更新時間
```

### Student（學生）
```
|── id          // MongoDB ObjectId
|── userId      // 關聯到 User.userId
|── lvocabuIDs  // (vocabulary_ID list) 存放單字本ID的list
|── lcouponIDs  // (coupon ID list) 存放優惠券ID的list
|── paraGame    // (game parameter) 遊戲所需的參數（JSON string）
|── payments    // 存放付款資料（如信用卡資料）（JSON string）
|── lfriendIDs  // (friend ID list) 好友ID列表
|── chathistory // 聊天紀錄（JSON string: Chat[]），將完整對話（時間戳、文字內容）持久化儲存
|── createdAt   // 建立時間
|── updatedAt   // 更新時間
```

### Supplier（供應商）
```
|── id            // MongoDB ObjectId
|── userId        // 關聯到 User.userId
|── lsuppcoIDs    // (supply coupon ID list) 存放該廠商所提供優惠券ID的list
|── payments      // 存放付款資料（如信用卡資料）（JSON string）
|── storeName     // 店鋪名稱
|── storeLocation // 店鋪地址
|── storeHours    // 營業時間
|── storeWebsite  // 店鋪網站
|── stores        // 存放店家店鋪資訊的list（Store[]）
|── createdAt     // 建立時間
|── updatedAt     // 更新時間
```

### Store（店鋪）
```
|── id            // MongoDB ObjectId
|── supplierId    // 關聯到 Supplier.id
|── name          // 分店名稱
|── location      // 分店位置
|── website       // 分店網站
|── businessHours // 營業時間
|── lscores       // score list = [1分人數, 2分人數, 3分人數, 4分人數, 5分人數]
|── lcomments     // (comments list) 存放使用者對於該分店的評論（Comment[]）
|── createdAt     // 建立時間
|── updatedAt     // 更新時間
```

### Comment（評論）
```
|── id        // MongoDB ObjectId
|── storeId   // 關聯到 Store.id
|── userId    // 評論者的 userId
|── score     // 評分（1-5）
|── content   // 評論內容
|── createdAt // 建立時間
|── updatedAt // 更新時間
```

### Admin（管理員）
```
|── id          // MongoDB ObjectId
|── userId      // 關聯到 User.userId
|── permissions // 管理者權限（String[]）
|── createdAt   // 建立時間
|── updatedAt   // 更新時間
```

### Coupon（優惠券）
```
|── id            // MongoDB ObjectId
|── couponId      // 優惠券唯一ID
|── name          // 優惠券名稱
|── period        // 使用期限（截止日期）
|── link          // coupon QRcode or URL
|── text          // 折價券內容
|── picture       // 折價券圖片設計（URL）
|── storeName     // 店鋪名稱
|── storeLocation // 店鋪地址
|── storeHours    // 營業時間
|── storeWebsite  // 店鋪網站
|── createdAt     // 建立時間
|── updatedAt     // 更新時間
```

### Vocabulary（單字本）
```
|── id          // MongoDB ObjectId
|── vocabularyId // 單字本唯一ID
|── name        // 單字本名稱
|── langUse     // 背誦單字的語言
|── langExp     // 解釋單字的語言
|── copyrights  // 單字本版權
|── establisher // 單字本建立者的ID
|── public      // 是否公開（Boolean），true時其他人瀏覽單字本會看到
|── words       // 存放單字（資料結構Word）的list（Word[]）
|── createdAt   // 建立時間
|── updatedAt   // 更新時間
```

### Word（單字）
```
|── id           // MongoDB ObjectId
|── vocabularyId // 關聯到 Vocabulary.id
|── word         // 單字
|── spelling     // 拼音，可以為None（象形文字可能需要拼音顯示）
|── explanation  // 單字解釋
|── partOfSpeech // 詞性，可以為None
|── sentence     // 範例句
|── createdAt    // 建立時間
|── updatedAt    // 更新時間
```

### FeedbackForm（回饋表單）
```
|── id        // MongoDB ObjectId
|── questions // 表單問題（JSON string）
|── createdAt // 建立時間
|── updatedAt // 更新時間
```

### PublicVocabularyList（公開單字本列表）
```
|── id            // MongoDB ObjectId
|── vocabularyIds // 所有公開單字本的 vocabularyId 列表（String[]）
|── updatedAt     // 更新時間
```

### Sys_para（系統參數）
```
|── id         // MongoDB ObjectId
|── LLM_quota  // 每日 LLM 額度（美金，Float）
|── new_points // 初始使用者的兌換卷點數（Int）
|── gameParams // 遊戲參數設定（JSON string）
|── updatedAt  // 更新時間
```

## 2. 資料庫架構

使用 **Prisma ORM + MongoDB** 進行資料持久化，所有模型定義在 `prisma/schema.prisma` 中。

## 4. 開發規格

### 技術棧
- **前端框架**: Next.js 16 (App Router), React 19, TypeScript
- **UI 框架**: Material-UI (MUI) 5, Emotion (CSS-in-JS)
- **後端**: Next.js API Routes
- **資料庫**: Prisma ORM + MongoDB
- **認證**: NextAuth.js 4 (JWT Strategy), Google OAuth 2.0 (PKCE Flow)
- **AI 整合**: OpenAI API (GPT-4o-mini)
- **分析工具**: PostHog Analytics
- **資料處理**: PapaParse (CSV/Excel), XLSX, Franc (Language detection)
- **語音**: Web Speech API (Speech Synthesis)
- **部署**: Vercel
- **環境設定**: dotenv 讀取 `.env` 檔案完成設定（`.env` 檔案會被 cursor ignore）

## 3. 分頁架構

### 根目錄
- `/` - 首頁
- `/login` - 登入頁面（Google OAuth、測試登入）
- `/edit` - 角色選擇頁面（新用戶首次登入）

### Student 頁面 (`/student`)
- `/student` - 學生首頁
- `/student/vocabulary` - 單字本管理（建立、編輯、刪除、瀏覽、加入、AI 生成、Excel 上傳）
- `/student/review` - 單字複習（閃卡系統）
- `/student/test` - 單字測驗（多種題型、點數獎勵）
- `/student/game` - 遊戲中心（Wordle、Snake、AI King）
- `/student/grammar` - 文法家教（AI 驅動的對話式教學）
- `/student/store` - 點數兌換（優惠券瀏覽與抽獎）
- `/student/setting` - 個人設定（帳戶資訊、LLM 使用統計）

### Supplier 頁面 (`/supplier`)
- `/supplier` - 供應商首頁
- `/supplier/coupon` - 優惠券管理（建立、編輯、刪除、查看、擁有者列表）
- `/supplier/store` - 店鋪管理（建立、編輯、刪除、查看）
- `/supplier/setting` - 供應商設定（帳戶資訊等）

### Admin 頁面 (`/admin`)
- `/admin` - 管理員首頁
- `/admin/user` - 用戶管理（查看、編輯、刪除、新增、上鎖、LLM 配額查看）
- `/admin/vocabulary` - 單字本管理（查看、編輯、刪除、新增、Excel 上傳）
- `/admin/coupon` - 優惠券管理（查看、編輯、刪除、新增）
- `/admin/statistics` - 統計數據（PostHog 整合，使用者行為分析）
- `/admin/setting` - 系統設定（LLM 額度、抽獎券參數、遊戲參數）

## 5. 核心功能實作

### 認證系統
- ✅ Google OAuth 2.0 登入（PKCE 流程）
- ✅ 測試登入（Credentials Provider，使用 User ID）
- ✅ 角色選擇系統（新用戶首次登入導向 `/edit`，選擇 Student 或 Supplier）
- ✅ Session 管理（JWT，30 天有效期）
- ✅ Middleware 路由保護（根據角色與登入狀態自動重定向）
- ✅ 管理員設定腳本（`npm run create:admin <userId>`）

### Admin 功能
- ✅ 用戶管理：每筆資料表格化顯示，右側 CRUD 按鈕（查看、編輯、刪除），右上角新增按鈕
- ✅ 單字本管理：顯示 Vocabulary.Name, LangUse, LangExp, 單字數與建立者ID，查看時才顯示單字內容（可 CRUD）
- ✅ 優惠券管理：完整的 CRUD 功能
- ✅ 單字本上傳：使用 PapaParse 讀取 Excel，第一行為標籤（word, spelling 等），PartOfSpeech 與 spelling 可選
- ✅ 分頁顯示：大量資料分批載入（例如 400 字分 50 字 8 頁顯示）
- ✅ 系統設定：LLM 額度、抽獎券參數、遊戲參數（參數化設定）

### Student 功能
- ✅ 單字本管理：建立、編輯、刪除、瀏覽、加入
- ✅ 單字本建立方式：手動建立、AI 生成（OpenAI）、Excel 上傳
- ✅ 單字管理：CRUD、批量更新、分頁顯示
- ✅ 單字複習：閃卡系統
- ✅ 單字測驗：多種題型（看句子選意思、看意思選句子、看句子選單字、聽句子選意思、聽句子選單字、混合選項），點數獎勵
- ✅ 遊戲功能：Wordle（猜謎遊戲）、Snake（貪食蛇選擇題遊戲）、AI King（電腦知識王）
- ✅ 文法家教：AI 驅動的對話式教學，支援多語言，Quick Replies
- ✅ 優惠券：瀏覽與抽獎（中獎率機制），我的優惠券查看
- ✅ 個人設定：帳戶資訊、LLM 使用統計（每日與歷史）
- ✅ AI 助手：左下角浮動視窗，提供即時幫助與教學

### Supplier 功能
- ✅ 優惠券管理：建立、編輯、刪除、查看、擁有者列表
- ✅ 店鋪管理：建立、編輯、刪除、查看（店名、地址、營業時間、網站）
- ✅ 供應商設定：帳戶資訊等

### 系統功能
- ✅ 響應式設計：Material-UI 整合，支援桌面與行動裝置
- ✅ 語言選擇：多語言支援（英文、日文等）
- ✅ 導航系統：側邊欄導航，AI 助手浮動視窗
- ✅ 錯誤處理：完整的錯誤處理與載入狀態
- ✅ PostHog 整合：使用者行為追蹤（Student、Supplier），統計數據儀表板（Admin）
- ✅ LLM 配額管理：每日額度控制，成本追蹤

## 6. 問題解決記錄
- redirect_solved.md: 角色選擇後重定向到 /login 問題的解決方案