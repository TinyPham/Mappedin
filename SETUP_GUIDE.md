# HƯỚNG DẪN KẾT NỐI SQL SERVER VỚI WEB

## ✅ ĐÃ HOÀN THÀNH
- [x] Tạo database `MappedIn3DModels`
- [x] Tạo bảng `Models3D` với 5 airplanes
- [x] Cài đặt backend dependencies
- [x] Cấu hình .env file

## 📋 CÁC BƯỚC TIẾP THEO

### BƯỚC 1: Tạo Stored Procedures
1. Mở SQL Server Management Studio (SSMS)
2. Mở file `database/stored_procedures.sql`
3. Click **Execute** (F5)
4. Đợi message "✅ All stored procedures created successfully!"

### BƯỚC 2: Chạy Backend Server  
Mở Terminal/PowerShell trong thư mục `backend`:

```powershell
cd c:\Users\Welcome\Downloads\ERP-Mappedin\backend
npm run dev
```

Nếu thành công, bạn sẽ thấy:
```
✅ Connected to SQL Server
🚀 Server running on http://localhost:3000
```

### BƯỚC 3: Test API
Mở trình duyệt và truy cập:
```
http://localhost:3000/api/models
```

Bạn sẽ thấy JSON với 5 airplanes.

### BƯỚC 4: Update Frontend
Sau khi backend chạy thành công, tôi sẽ update code frontend để gọi API thay vì dùng localStorage.

---

## 🔧 TROUBLESHOOTING

**Lỗi: Cannot connect to SQL Server**
- Kiểm tra SQL Server service đã chạy
- Kiểm tra thông tin trong `.env` file
- Thử đổi `localhost` thành `127.0.0.1` hoặc `.\\SQLEXPRESS`

**Lỗi: Port 3000 already in use**
- Đổi PORT trong `.env` thành 3001 hoặc 3002

**Lỗi: Login failed for user 'sa'**
- Kiểm tra password trong `.env`
- Đảm bảo SQL Server Authentication đã enable
