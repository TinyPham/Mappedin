# 🚀 WORKFLOW CHẠY ỨNG DỤNG

## 📖 GIẢI THÍCH KIẾN TRÚC

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   FRONTEND      │ ──HTTP──│   BACKEND API    │ ──SQL───│   SQL SERVER    │
│  (index.html)   │ ←──────→│   (server.ts)    │ ←──────→│   (Database)    │
│  Port: 5173     │         │   Port: 3000     │         │   localhost     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

**ĐÚNG VẬY! Bạn cần chạy SONG SONG 2 servers:**

### 1️⃣ Backend Server (Port 3000)
- Nhiệm vụ: Kết nối SQL Server, cung cấp REST API
- Technology: Node.js + Express + mssql

### 2️⃣ Frontend Dev Server (Port 5173)
- Nhiệm vụ: Serve HTML/JS/CSS, gọi API backend
- Technology: Vite (hoặc http-server)

---

## ⚙️ CÁCH CHẠY

### Terminal 1: Backend Server
```powershell
cd c:\Users\Welcome\Downloads\ERP-Mappedin\backend
npm run dev
```
✅ Chờ message: "🚀 Server running on http://localhost:3000"

### Terminal 2: Frontend Server
```powershell
cd c:\Users\Welcome\Downloads\ERP-Mappedin
npm run dev
```
✅ Truy cập: http://localhost:5173

---

## 📝 FILE CONFIG - appsettings.json

**Giống Visual Studio 2022:**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=..."
  },
  "AppSettings": {
    "Port": 3000
  }
}
```

**Ưu điểm so với .env:**
- ✅ Structured JSON
- ✅ Hierarchical config
- ✅ Dễ version control từng environment
- ✅ Quen thuộc với .NET developers

---

## 🔄 WORKFLOW HOÀN CHỈNH

1. **Lần đầu setup:**
   ```
   Backend: npm install
   Frontend: npm install (nếu cần)
   SQL: Create database + stored procedures
   ```

2. **Mỗi lần develop:**
   ```
   Terminal 1: cd backend && npm run dev
   Terminal 2: cd .. && npm run dev
   ```

3. **Frontend gọi Backend:**
   ```javascript
   // Frontend code
   fetch('http://localhost:3000/api/models')
     .then(res => res.json())
     .then(models => {
       // Load models vào map
     });
   ```

4. **Backend gọi SQL Server:**
   ```typescript
   // Backend code (đã handle)
   const result = await pool.request()
     .execute('SP_GetAllModels');
   ```

---

## 🎯 DEPLOYMENT (Production)

**Option 1: Cùng server**
- Build frontend: `npm run build`
- Backend serve static files từ `dist/`
- Chỉ cần 1 port

**Option 2: Riêng server**
- Frontend: Deploy lên Azure Static Web Apps / Vercel
- Backend: Deploy lên Azure App Service / VM
- CORS config cẩn thận

---

## ❓ FAQ

**Q: Có thể chỉ chạy 1 server không?**  
A: Có! Trong production, backend có thể serve frontend. Nhưng dev mode tiện hơn khi tách riêng (hot reload).

**Q: Frontend gọi Backend như thế nào?**  
A: Qua HTTP requests:
```javascript
// GET models
fetch('http://localhost:3000/api/models')

// POST model
fetch('http://localhost:3000/api/models', {
  method: 'POST',
  body: JSON.stringify(modelData)
})
```

**Q: Có cần database chạy liên tục không?**  
A: SQL Server phải chạy khi Backend hoạt động. Nhưng không cần mở SSMS.
