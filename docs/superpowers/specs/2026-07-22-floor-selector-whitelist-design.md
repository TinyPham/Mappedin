# Thiết Kế Giới Hạn Danh Sách Chọn Tầng

## Mục tiêu

Dropdown chọn tầng chỉ hiển thị mục Toàn cảnh và bốn tầng hành khách sau:

```text
m_dae8f26a40f6017f
m_41a38d6d0411d397
m_d4b5674c0b15e099
m_1523f7dcde647c40
```

## Thiết kế

Tạo một helper thuần chứa whitelist và hàm kiểm tra tầng được phép hiển thị. Tầng được đưa vào selector khi ID thuộc whitelist hoặc tên tầng được nhận diện là Toàn cảnh. Cả luồng khởi tạo selector và luồng dựng lại selector sau chuyển tầng phải gọi cùng helper này.

Việc lọc chỉ áp dụng lên các option của dropdown. `mapData` vẫn giữ đầy đủ tầng của Mappedin để dẫn đường, liên kết thang, marker và model tiếp tục hoạt động.

## Kiểm thử

- Chấp nhận đúng bốn ID tầng hành khách.
- Chấp nhận tầng Toàn cảnh.
- Loại `GF-Asset` và mọi tầng không nằm trong whitelist.
- Chạy kiểm tra TypeScript và build frontend.
