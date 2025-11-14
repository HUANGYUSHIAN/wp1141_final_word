# 環境變數設定說明

請在專案根目錄創建 `.env` 文件，並填入以下內容：

```env
# Database
DATABASE_URL="mongodb://localhost:27017/oauth"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"
```

## 各變數說明

### DATABASE_URL
MongoDB 連接字串。格式：`mongodb://[username:password@]host[:port]/database`

範例：
- 本地：`mongodb://localhost:27017/oauth`
- MongoDB Atlas：`mongodb+srv://username:password@cluster.mongodb.net/oauth`

### GOOGLE_CLIENT_ID
從 Google Cloud Console 獲取的 OAuth 2.0 Client ID

### GOOGLE_CLIENT_SECRET
從 Google Cloud Console 獲取的 OAuth 2.0 Client Secret

### NEXTAUTH_URL
應用程式的基礎 URL。開發環境通常為 `http://localhost:3000`

### NEXTAUTH_SECRET
用於加密 JWT token 的密鑰。建議使用至少 32 字符的隨機字串。

生成方式：
```bash
openssl rand -base64 32
```

或在 Node.js 中：
```javascript
require('crypto').randomBytes(32).toString('base64')
```

