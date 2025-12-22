# PostHog 用戶行為監督功能說明

本文檔說明系統中透過 PostHog 追蹤的用戶行為事件，以及管理員如何在 `/admin/statistics` 頁面查看和分析這些數據。

---

## 📊 統計數據頁面功能

### 頁面位置
- **路徑**: `/admin/statistics`
- **訪問方式**: 管理員左側功能欄位 → "統計數據"

### 頁面功能

#### 1. 時間範圍選擇
- **位置**: 頁面頂部
- **功能**: 下拉選單選擇統計時間範圍
- **選項**: 
  - 最近 7 天
  - 最近 30 天（預設）
  - 最近 90 天

#### 2. Tab 切換
頁面包含三個 Tab，分別顯示不同角色的統計數據：

##### Tab 1: 學生功能
- **總用戶數**: 顯示 Student 角色的總用戶數
- **活躍用戶**: 顯示在選定時間範圍內有活動的用戶數
- **頁面訪問統計表格**: 
  - 顯示各頁面的訪問次數和獨立用戶數
  - 包含頁面：`/student/vocabulary`, `/student/grammar`, `/student/game`, `/student/test`, `/student/review`
- **熱門事件表格**: 
  - 顯示最常觸發的事件及其觸發次數和獨立用戶數
  - 包含事件：`vocabulary_created`, `game_started`, `grammar_question_asked`, `test_started`

##### Tab 2: 供應商功能
- **總用戶數**: 顯示 Supplier 角色的總用戶數
- **活躍用戶**: 顯示在選定時間範圍內有活動的用戶數
- **頁面訪問統計表格**: 
  - 顯示各頁面的訪問次數和獨立用戶數
  - 包含頁面：`/supplier/coupon`, `/supplier/store`
- **熱門事件表格**: 
  - 顯示最常觸發的事件及其觸發次數和獨立用戶數
  - 包含事件：`coupon_created`, `store_created`

##### Tab 3: 功能分析
- **功能受歡迎度表格**: 
  - 顯示各功能的使用率和滿意度評分
  - 包含功能：單字本管理、文法家教、單字遊戲、單字測驗
- **錯誤率分析表格**: 
  - 顯示各功能的錯誤率和總使用次數
  - 錯誤率 > 5% 會顯示紅色上升箭頭，< 5% 顯示綠色下降箭頭
- **放棄率分析表格**: 
  - 顯示各功能的放棄率和總開始次數
  - 放棄率 > 50% 會顯示紅色上升箭頭，< 50% 顯示綠色下降箭頭

---

## 🎯 追蹤的事件列表

### Student 角色追蹤事件

#### 頁面訪問
- **事件名稱**: `page_viewed`
- **觸發時機**: 用戶訪問任何 Student 頁面時自動觸發
- **屬性**:
  - `page`: 頁面路徑（如 `/student/vocabulary`）
  - `role`: 固定為 "Student"

#### 單字本相關

##### 1. 創建單字本
- **事件名稱**: `vocabulary_created`
- **觸發按鈕**: 
  - 手動創建：點擊 "建立單字本" 對話框中的 "儲存" 按鈕
  - AI 生成：點擊 "AI 生成單字本" 對話框中的 "生成" 按鈕
  - Excel 上傳：上傳 Excel 檔案並成功建立單字本後
- **屬性**:
  - `method`: "manual" | "ai_generated" | "excel_upload"
  - `language`: 語言組合（如 "English-Traditional Chinese"）
  - `word_count`: 單字數量

##### 2. 瀏覽公開單字本
- **事件名稱**: `vocabulary_browsed`
- **觸發按鈕**: 點擊 "瀏覽公開單字本" 按鈕
- **屬性**:
  - `filter_applied`: 是否應用了篩選條件

##### 3. 加入單字本
- **事件名稱**: `vocabulary_added`
- **觸發按鈕**: 在瀏覽公開單字本對話框中點擊 "加入我的單字本" 按鈕
- **屬性**:
  - `vocabulary_id`: 單字本 ID
  - `word_count`: 單字數量

##### 4. 編輯單字
- **事件名稱**: `word_edited`
- **觸發按鈕**: 在單字列表頁面點擊 "儲存" 按鈕
- **屬性**:
  - `vocabulary_id`: 單字本 ID
  - `batch_edit`: 是否為批量編輯（編輯多個單字）
  - `word_count`: 編輯的單字數量

#### 文法家教

##### 1. 發送文法問題
- **事件名稱**: `grammar_question_asked`
- **觸發按鈕**: 
  - 點擊 "發送" 按鈕發送問題
  - 在輸入框按 Enter 鍵發送問題
- **屬性**:
  - `language`: "English" | "Japanese"
  - `level`: 程度設定（如 "A1", "N5"）
  - `topic`: 問題主題（前 50 字符）

##### 2. 使用快速回復
- **事件名稱**: `grammar_quick_reply_used`
- **觸發按鈕**: 點擊 AI 回應中的 Quick Reply 選項（如 "基"）
- **屬性**:
  - `topic`: Quick Reply 的主題
  - `language`: "English" | "Japanese"

##### 3. 刪除對話
- **事件名稱**: `grammar_chat_deleted`
- **觸發按鈕**: 勾選對話框後點擊 "刪除選中" 按鈕
- **屬性**:
  - `chat_count`: 刪除的對話數量

#### 遊戲功能

##### 1. 開始遊戲
- **事件名稱**: `game_started`
- **觸發按鈕**: 在遊戲設定對話框中點擊 "開始遊戲" 按鈕
- **屬性**:
  - `game_type`: "wordle" | "snake" | "ai-king"
  - `vocabulary_id`: 選擇的單字本 ID

##### 2. 遊戲完成
- **事件名稱**: `game_completed`
- **觸發時機**: 遊戲結束時自動觸發
- **屬性**:
  - `game_type`: "wordle" | "snake" | "ai-king"
  - `score`: 玩家得分
  - `points_earned`: 獲得的點數
  - `duration_seconds`: 遊戲持續時間（秒）
  - `success`: 是否成功完成（boolean）

##### 3. 遊戲放棄
- **事件名稱**: `game_abandoned`
- **觸發按鈕**: 在遊戲中點擊 "返回" 或關閉遊戲
- **屬性**:
  - `game_type`: "wordle" | "snake" | "ai-king"
  - `progress`: 遊戲進度（百分比）

#### 測驗與複習

##### 1. 開始測驗
- **事件名稱**: `test_started`
- **觸發按鈕**: 在測驗設定頁面點擊 "開始測驗" 按鈕
- **屬性**:
  - `vocabulary_id`: 選擇的單字本 ID
  - `mode`: 測驗模式

##### 2. 測驗完成
- **事件名稱**: `test_completed`
- **觸發時機**: 測驗結束時自動觸發
- **屬性**:
  - `vocabulary_id`: 單字本 ID
  - `score`: 測驗分數
  - `total_questions`: 總題數
  - `duration_seconds`: 測驗持續時間（秒）

##### 3. 開始複習
- **事件名稱**: `review_started`
- **觸發按鈕**: 在複習頁面選擇單字本後點擊 "開始複習" 按鈕
- **屬性**:
  - `vocabulary_id`: 選擇的單字本 ID

#### 兌換券

##### 1. 抽獎
- **事件名稱**: `lottery_drawn`
- **觸發按鈕**: 在 `/student/store` 頁面點擊抽獎按鈕（50/100/200 點）
- **屬性**:
  - `points_used`: 使用的點數（50 | 100 | 200）
  - `won`: 是否中獎（boolean）
  - `coupon_id`: 中獎的優惠券 ID（如果中獎）

##### 2. 查看優惠券
- **事件名稱**: `coupon_viewed`
- **觸發按鈕**: 點擊優惠券卡片或詳細資訊按鈕
- **屬性**:
  - `coupon_id`: 優惠券 ID
  - `source`: "store" | "my_coupons"

---

### Supplier 角色追蹤事件

#### 頁面訪問
- **事件名稱**: `page_viewed`
- **觸發時機**: 用戶訪問任何 Supplier 頁面時自動觸發
- **屬性**:
  - `page`: 頁面路徑（如 `/supplier/coupon`）
  - `role`: 固定為 "Supplier"

#### 優惠券管理

##### 1. 創建優惠券
- **事件名稱**: `coupon_created`
- **觸發按鈕**: 在優惠券管理頁面點擊 "新增優惠券" 對話框中的 "建立" 按鈕
- **屬性**:
  - `supplier_id`: 供應商 ID

##### 2. 編輯優惠券
- **事件名稱**: `coupon_updated`
- **觸發按鈕**: 在編輯優惠券對話框中點擊 "儲存" 按鈕
- **屬性**:
  - `coupon_id`: 優惠券 ID

#### 店鋪管理

##### 1. 創建店鋪
- **事件名稱**: `store_created`
- **觸發按鈕**: 在店鋪管理頁面點擊 "新增店鋪" 對話框中的 "建立" 按鈕
- **屬性**:
  - `supplier_id`: 供應商 ID
  - `has_location`: 是否設定了店鋪位置（boolean）

##### 2. 查看回饋
- **事件名稱**: `feedback_viewed`
- **觸發按鈕**: 在店鋪詳情頁面點擊 "查看回饋" 按鈕
- **屬性**:
  - `store_id`: 店鋪 ID

---

## 🔍 數據分析指標

### 功能受歡迎度
- **使用率**: 使用該功能的用戶數 / 總用戶數 × 100%
- **滿意度**: 基於用戶行為和錯誤率計算的評分（1-5 分）

### 錯誤率
- **計算方式**: 錯誤次數 / 總使用次數 × 100%
- **警示標準**: 
  - 錯誤率 > 5%：顯示紅色上升箭頭，需要優先修復
  - 錯誤率 < 5%：顯示綠色下降箭頭，狀態良好

### 放棄率
- **計算方式**: 放棄次數 / 總開始次數 × 100%
- **警示標準**: 
  - 放棄率 > 50%：顯示紅色上升箭頭，需要改進 UX
  - 放棄率 < 50%：顯示綠色下降箭頭，狀態良好

---

## ⚙️ 技術實現

### PostHog 配置
- **環境變數**:
  - `NEXT_PUBLIC_POSTHOG_KEY`: PostHog 專案 API Key
  - `NEXT_PUBLIC_POSTHOG_HOST`: PostHog 主機地址（預設: `https://app.posthog.com`）

### 追蹤實現
- **Provider**: `src/components/PostHogProvider.tsx`
- **Hook**: `src/hooks/usePostHog.ts`
- **工具函數**: `src/lib/posthog.ts`

### 重要注意事項
1. **Admin 角色不追蹤**: 系統自動排除 Admin 角色的行為追蹤，確保管理員操作不被記錄
2. **自動識別用戶**: 登入後自動識別用戶並關聯追蹤事件
3. **頁面訪問自動追蹤**: 使用 `usePostHog` hook 的頁面會自動追蹤頁面訪問

---

## 📝 使用建議

1. **定期查看統計數據**: 建議每週查看一次統計數據，了解功能使用情況
2. **關注錯誤率**: 優先處理錯誤率 > 5% 的功能
3. **改進高放棄率功能**: 對於放棄率 > 50% 的功能，考慮重新設計 UX
4. **分析熱門功能**: 了解哪些功能最受歡迎，可以作為產品發展方向的參考
5. **對比不同時間範圍**: 使用時間範圍選擇功能，對比不同時期的數據變化

---

## 🔐 隱私與安全

- 所有追蹤數據僅用於產品改進和功能優化
- 不追蹤敏感資訊（如密碼、個人詳細資料）
- Admin 角色的操作完全不被追蹤
- 用戶可以透過瀏覽器設定選擇退出追蹤（需在 PostHog 設定中啟用）

