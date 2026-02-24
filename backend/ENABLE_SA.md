# HƯỚNG DẪN KÍCH HOẠT TÀI KHOẢN SA VÀ ĐẶT MẬT KHẨU

Để Backend có thể kết nối, bạn cần bật tài khoản **sa** và đặt mật khẩu.

### CÁC BƯỚC THỰC HIỆN TRONG SSMS

1.  **Đăng nhập SSMS** bằng chế độ **Windows Authentication**.
2.  Ở cột bên trái (Object Explorer), mở rộng thư mục **Security** -> **Logins**.
3.  Tìm tài khoản tên là **sa**.
4.  Chuột phải vào **sa**, chọn **Properties**.

---

### TRONG CỬA SỔ LOGIN PROPERTIES:

**Bước A: Đặt mật khẩu (Tab General)**
1.  Chọn tab **General** ở cột trái.
2.  Ở ô **Password** và **Confirm password**: nhập mật khẩu bạn muốn (ví dụ: `123`).
3.  Bỏ chọn (Uncheck) mục **"Enforce password policy"** (để tránh lỗi mật khẩu quá đơn giản).

**Bước B: Cấp quyền (Tab Status) - QUAN TRỌNG**
1.  Chọn tab **Status** ở cột trái.
2.  Mục **Permission to connect to database engine**: chọn **Grant**.
3.  Mục **Login**: chọn **Enabled**.

4.  Bấm **OK** để lưu lại.

---

### BƯỚC CUỐI CÙNG: RESTART SERVER
1.  Chuột phải vào tên Server (dòng đầu tiên trên cùng của Object Explorer, ví dụ: `DESKTOP-1711NIU...`).
2.  Chọn **Restart**.
3.  Bấm **Yes** để xác nhận restart dịch vụ SQL Server.

---
### SAU KHI XONG:
Cập nhật lại file `backend/appsettings.json` với mật khẩu bạn vừa đặt:
```json
"DefaultConnection": "...;User Id=sa;Password=MẬT_KHẨU_CỦA_BẠN;..."
```
Rồi chạy `npm run dev` lại.
