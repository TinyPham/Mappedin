# Checklist Kiem Thu Thu Cong Tren Browser

Dung checklist nay voi SQL Server that truoc khi danh dau ke hoach hoan tat
100%. Vui long chup anh cho tung muc ben duoi.

## Moi Truong

- Backend dang chay va da ket noi SQL Server that.
- Frontend dang chay o URL public thong thuong.
- Co the mo DevTools Console va Network cua browser.

## Bang Chung Can Chup

1. Public viewer mo khong can dang nhap.
   - Mo URL ban do binh thuong, khong co `?admin=true`.
   - Chup anh ban do da load o viewer mode.

2. Tinh nang doc public hoat dong khong can admin.
   - Tim kiem mot khu vuc.
   - Doi tang.
   - Mo thong tin chuyen bay.
   - Tao mot tuyen chi duong.

3. Cong cu admin bi an truoc khi dang nhap.
   - Chup UI truoc khi dang nhap admin.
   - Xac nhan khong thay nut/chuc nang sua va luu du lieu.

4. Dang nhap admin hoat dong.
   - Mo `?admin=true`.
   - Dang nhap bang tai khoan admin da cau hinh.
   - Chup UI sau khi da dang nhap admin.

5. Luu admin ghi vao `AreaInformation`.
   - Sua ten/mo ta/so dien thoai/gio mo cua cua mot khu vuc.
   - Bam luu thanh cong.
   - Chup SSMS cho thay dong du lieu moi trong `dbo.AreaInformation`.

6. Cac object location cu da drop khong con can thiet.
   - Trong SSMS, chay:

```sql
USE MappedIn3DModels;
GO

SELECT OBJECT_ID('dbo.MasterData_Locations', 'U') AS MasterDataLocationsObjectId;
SELECT OBJECT_ID('dbo.SP_Admin_UpsertLocation', 'P') AS AdminUpsertLocationObjectId;
```

   - Ca hai ket qua phai la `NULL`.
   - Chup anh ket qua.

7. Logout chan thao tac ghi admin.
   - Dang xuat.
   - Thu thao tac luu admin lan nua.
   - Chup bang chung request bi chan hoac UI admin da bi an.

8. Kiem tra static security tra ve 404/khong duoc serve.
   - Mo cac URL nay bang browser hoac PowerShell:

```text
http://localhost:3002/backend/appsettings.json
http://localhost:3002/.env
http://localhost:3002/database/schema.sql
```

   - Chup bang chung cac file nay khong duoc serve.

9. Kiem tra do muot kiosk.
   - Keo/xoay/zoom/doi tang lien tuc toi thieu 2 phut.
   - Chup Console khong co log lap lai theo tung frame va khong co error.
   - Neu co the, chup Task Manager hoac Performance de thay trang thai on dinh.

## Tieu Chi Pass

- Ban do public khong can dang nhap.
- Cong cu admin bat buoc dang nhap.
- Sua thong tin khu vuc luu vao `dbo.AreaInformation`.
- Cac object legacy da drop khong con ton tai.
- File source/config khong bi serve ra ngoai.
- Console khong co loi lap lai khi tuong tac kiosk binh thuong.
