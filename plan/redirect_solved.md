# 角色選擇後重定向到 /login 問題解決方案

## 問題描述

在使用 Google OAuth 登入並選擇角色（Student 或 Supplier）後，系統會自動登出並重定向到 `/login` 頁面，導致用戶需要重新登入。

## 問題原因分析

### 1. 選擇角色後調用了 signOut

**位置**：`src/app/page.tsx` 的 `handleSelectRole` 函數

**問題**：
- 在首頁選擇角色後，代碼中明確調用了 `signOut({ callbackUrl: "/login", redirect: true })`
- 這導致用戶被強制登出，然後重定向到登入頁面

**相關代碼**：
```typescript
if (response.ok) {
  // 成功選擇身分，強制登出
  console.log("[Home] Role selected successfully, signing out...");
  await signOut({ callbackUrl: "/login", redirect: true });
}
```

### 2. Layout 檢查邏輯過於嚴格

**位置**：`src/app/student/layout.tsx` 和 `src/app/supplier/layout.tsx`

**問題**：
- 當用戶選擇角色後重定向到 `/student` 或 `/supplier` 時，Layout 會立即檢查 `dataType`
- 由於資料庫更新需要時間，檢查時 `dataType` 可能還是 `null`
- 重試機制不足（只有 3 次，每次 300ms），無法等待資料庫更新完成
- 當檢查失敗時，會重定向到 `/edit`，但某些情況下可能觸發登出邏輯

**相關代碼**：
```typescript
// 重試次數太少
let retries = 3;
// 等待時間太短
await new Promise(resolve => setTimeout(resolve, 300));
```

### 3. Session 狀態檢查時機不當

**位置**：`src/app/edit/page.tsx`、`src/app/student/layout.tsx`、`src/app/supplier/layout.tsx`

**問題**：
- 在 session 建立過程中，`status` 可能會暫時顯示為 `"unauthenticated"`
- 代碼立即重定向到 `/login`，導致誤判
- 沒有等待 session 完全建立就進行檢查

### 4. 重定向方式不當

**位置**：`src/app/edit/page.tsx`

**問題**：
- 使用 `window.location.href` 會在瀏覽器歷史記錄中留下 `/edit` 頁面
- 如果用戶按返回鍵，可能會回到選擇角色頁面
- 沒有明確標記是從角色選擇頁面來的，Layout 無法識別並增加重試次數

## 解決方案

### 1. 移除選擇角色後的 signOut 調用

**修改文件**：`src/app/page.tsx`

**解決方法**：
- 移除 `signOut` 調用
- 改為直接重定向到對應頁面
- 在 URL 中添加 `role` 參數，讓 Layout 識別是從角色選擇頁面來的

**修改後代碼**：
```typescript
if (response.ok) {
  const data = await response.json();
  const selectedRole = data.role || role;
  
  // 等待資料庫更新完成
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 直接重定向到對應頁面，使用 replace 避免歷史記錄
  const timestamp = Date.now();
  if (selectedRole === "Student") {
    window.location.replace(`/student?t=${timestamp}&role=Student`);
  } else {
    window.location.replace(`/supplier?t=${timestamp}&role=Supplier`);
  }
}
```

### 2. 優化 Layout 檢查邏輯

**修改文件**：`src/app/student/layout.tsx`、`src/app/supplier/layout.tsx`

**解決方法**：
- 檢查 URL 參數中的 `role`，如果存在則增加重試次數（從 10 次增加到 20 次）
- 增加等待時間（從 500ms 減少到 300ms，但重試次數更多）
- 如果檢測到是從角色選擇頁面來的，在重試結束後再額外等待 1 秒並再次檢查
- 確保所有錯誤情況都重定向到 `/edit` 而不是 `/login`，且不調用 `signOut`

**修改後代碼**：
```typescript
// 檢查 URL 參數，如果是从选择角色页面重定向来的，增加重试次数
let fromRoleSelection = false;
if (typeof window !== "undefined") {
  const urlParams = new URLSearchParams(window.location.search);
  fromRoleSelection = urlParams.get("role") === "Student"; // 或 "Supplier"
}

// 如果是从角色选择页面来的，增加重试次数
let retries = fromRoleSelection ? 20 : 10;

// 如果重试后还是没有 dataType，且是从角色选择页面来的，继续等待
if (!userData || !userData.dataType) {
  if (fromRoleSelection) {
    // 再等待一下並再次檢查
    await new Promise(resolve => setTimeout(resolve, 1000));
    const finalCheck = await fetch("/api/user");
    if (finalCheck.ok) {
      const finalData = await finalCheck.json();
      if (finalData.dataType === "Student") { // 或 "Supplier"
        setIsStudent(true); // 或 setIsSupplier(true)
        setLoading(false);
        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", "/student"); // 或 "/supplier"
        }
        return;
      }
    }
  }
  // 重定向到選擇頁面（不登出）
  router.push("/edit");
}
```

### 3. 優化 Session 狀態檢查

**修改文件**：`src/app/edit/page.tsx`、`src/app/student/layout.tsx`、`src/app/supplier/layout.tsx`

**解決方法**：
- 等待 `mounted` 和 `status === "loading"` 完成後再檢查
- 對 `unauthenticated` 狀態添加延遲檢查（500ms-1000ms），避免在 session 建立過程中的臨時狀態誤判
- 確保所有檢查都在客戶端執行（使用 `typeof window !== "undefined"` 檢查）

**修改後代碼**：
```typescript
useEffect(() => {
  // 等待 mounted 和 session 加載完成
  if (!mounted || status === "loading") {
    return;
  }

  // 如果明確未登入，重定向到登入頁
  if (status === "unauthenticated") {
    // 延遲一下，避免在 session 建立過程中的臨時狀態誤判
    const timer = setTimeout(() => {
      if (status === "unauthenticated") {
        router.push("/login");
      }
    }, 500); // 或 1000ms
    return () => clearTimeout(timer);
  }
}, [mounted, status, session, router]);
```

### 4. 使用 window.location.replace 替代 window.location.href

**修改文件**：`src/app/edit/page.tsx`

**解決方法**：
- 使用 `window.location.replace` 替代 `window.location.href`
- 這樣不會在瀏覽器歷史記錄中留下 `/edit` 頁面
- 在 URL 中添加 `role` 參數，讓 Layout 能夠識別

**修改後代碼**：
```typescript
// 使用 window.location.replace 避免在歷史記錄中留下 /edit 頁面
const timestamp = Date.now();
if (role === "Student") {
  window.location.replace(`/student?t=${timestamp}&role=Student`);
} else {
  window.location.replace(`/supplier?t=${timestamp}&role=Supplier`);
}
```

### 5. 優化資料庫更新確認機制

**修改文件**：`src/app/edit/page.tsx`

**解決方法**：
- 簡化輪詢邏輯，無論確認成功與否都直接重定向
- 資料庫已更新，只是可能還沒同步到查詢結果
- 依賴 Layout 的重試機制來處理同步延遲

**修改後代碼**：
```typescript
if (response.ok) {
  const data = await response.json();
  
  // 無論確認成功與否，都直接重定向（資料庫已更新，只是可能還沒同步）
  // 使用 window.location.replace 避免在歷史記錄中留下 /edit 頁面
  const timestamp = Date.now();
  if (role === "Student") {
    window.location.replace(`/student?t=${timestamp}&role=Student`);
  } else {
    window.location.replace(`/supplier?t=${timestamp}&role=Supplier`);
  }
}
```

## 修改的文件清單

1. **src/app/edit/page.tsx**
   - 使用 `window.location.replace` 替代 `window.location.href`
   - 在 URL 中添加 `role` 參數
   - 簡化重定向邏輯

2. **src/app/student/layout.tsx**
   - 檢查 URL 參數中的 `role`
   - 增加重試次數（從 10 次增加到 20 次，如果是從角色選擇頁面來的）
   - 延遲 `unauthenticated` 檢查
   - 確保錯誤情況重定向到 `/edit` 而不是 `/login`

3. **src/app/supplier/layout.tsx**
   - 與 `student/layout.tsx` 相同的修改

4. **src/app/page.tsx**
   - 移除選擇角色後的 `signOut` 調用
   - 改為直接重定向到對應頁面

5. **src/app/api/user/select-role/route.ts**
   - 使用 `upsert` 替代 `create`，避免唯一約束衝突
   - 重新查詢用戶資料以確認更新成功

## 測試腳本

創建了測試腳本 `scripts/test-role-selection.ts` 來驗證修復：

1. 創建測試用戶
2. 模擬選擇 Student 角色
3. 驗證資料庫更新
4. 清理並重新測試 Supplier 角色
5. 測試完成後自動刪除測試用戶

**運行測試**：
```bash
npx tsx scripts/test-role-selection.ts
```

## 修復後的流程

1. **用戶登入** → Google OAuth 登入成功
2. **選擇角色** → 在 `/edit` 頁面選擇 Student 或 Supplier
3. **API 更新** → 調用 `/api/user/select-role` 更新資料庫
4. **重定向** → 使用 `window.location.replace` 重定向到 `/student?role=Student` 或 `/supplier?role=Supplier`
5. **Layout 檢查** → 檢測到 `role` 參數，增加重試次數（20 次）
6. **等待同步** → 如果第一次檢查失敗，繼續重試直到 `dataType` 更新
7. **進入頁面** → 驗證成功後進入對應頁面，清除 URL 參數
8. **保持登入** → 整個過程保持登入狀態，不會調用 `signOut`

## 關鍵改進點

1. ✅ **移除 signOut 調用**：選擇角色後不再登出
2. ✅ **使用 replace 替代 href**：避免歷史記錄問題
3. ✅ **URL 參數識別**：Layout 可以識別是從角色選擇頁面來的
4. ✅ **增加重試機制**：從角色選擇頁面來的請求增加重試次數
5. ✅ **延遲狀態檢查**：避免 session 建立過程中的誤判
6. ✅ **錯誤處理優化**：所有錯誤都重定向到 `/edit` 而不是 `/login`

## 注意事項

1. **資料庫同步延遲**：MongoDB 可能存在讀寫延遲，因此需要重試機制
2. **Session 建立時間**：NextAuth 的 session 建立需要時間，需要延遲檢查
3. **瀏覽器歷史記錄**：使用 `replace` 而不是 `href` 可以避免用戶按返回鍵回到選擇頁面
4. **URL 參數清理**：進入頁面後應該清除 URL 參數，保持 URL 乾淨

## 相關文件

- `src/app/edit/page.tsx` - 角色選擇頁面
- `src/app/student/layout.tsx` - Student 頁面 Layout
- `src/app/supplier/layout.tsx` - Supplier 頁面 Layout
- `src/app/page.tsx` - 首頁（也有角色選擇功能）
- `src/app/api/user/select-role/route.ts` - 角色選擇 API
- `scripts/test-role-selection.ts` - 測試腳本

