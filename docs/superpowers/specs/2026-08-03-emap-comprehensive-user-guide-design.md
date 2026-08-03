# Thiết kế tài liệu hướng dẫn sử dụng Hệ thống Bản đồ 3D Long Thành

## 1. Mục tiêu

Tạo một tài liệu Microsoft Word bằng tiếng Việt, chi tiết nhưng dễ tiếp cận, hướng dẫn đầy đủ cách sử dụng Hệ thống Bản đồ 3D Cảng Hàng không Quốc tế Long Thành cho bốn nhóm độc giả:

1. Hành khách và người dùng phổ thông sử dụng bản đồ trên máy tính, máy tính bảng hoặc điện thoại.
2. Nhân sự trực kiosk sử dụng và kiểm tra kiosk trong ca vận hành.
3. Quản trị viên được cấp quyền cập nhật dữ liệu và cấu hình hệ thống.
4. Nhân sự kỹ thuật vận hành chịu trách nhiệm khởi chạy dịch vụ, kết nối backend/SQL Server, CORS và xử lý sự cố hạ tầng.

Tài liệu phải dựa trên giao diện và hành vi của mã nguồn hiện tại tại commit `733e7c5`, sử dụng ảnh chụp từ ứng dụng thật, có khung chữ nhật màu đỏ và chú thích đánh số tại đúng vị trí thao tác.

## 2. Sản phẩm bàn giao

Tạo thư mục `docs/user-guide/` chứa:

- `Huong-dan-su-dung-He-thong-Ban-do-3D-Long-Thanh.docx`: tài liệu Word chính.
- `Huong-dan-su-dung-He-thong-Ban-do-3D-Long-Thanh.pdf`: bản xuất PDF dùng để kiểm tra và chia sẻ.
- `images/`: ảnh chụp đã dùng trong tài liệu, đặt tên theo chương và thứ tự.
- `source/`: script tạo ảnh và script dựng tài liệu để có thể tái tạo khi giao diện thay đổi.
- `source/feature-matrix.csv`: ma trận hữu hạn ánh xạ từng chức năng tới vai trò, chương/quy trình, ảnh minh họa và trạng thái nghiệm thu.
- `README.md`: hướng dẫn tái tạo và cập nhật tài liệu.

Tài liệu dự kiến 60–80 trang, khoảng 35–45 hình minh họa. Số trang thực tế được quyết định bởi khả năng đọc rõ hình và không ép nội dung quá dày.

## 3. Phạm vi chức năng

### 3.1. Người dùng bản đồ công cộng

Tài liệu bao phủ:

- Màn hình khởi động và bố cục tổng quan.
- Mở, đóng và chuyển tab trên sidebar.
- Tìm kiếm địa điểm, xóa từ khóa, đọc nhãn tầng và xử lý không có kết quả.
- Duyệt danh mục, danh mục con và chọn địa điểm.
- Xem thông tin địa điểm: ảnh, mô tả, giờ mở cửa, vị trí, điện thoại.
- Dùng các nút Đi từ đây, Điểm dừng và Tới đây.
- Tạo tuyến với điểm đi, điểm đến và tối đa năm điểm dừng; đổi chiều, xóa và sắp xếp điểm.
- Đọc tổng thời gian, khoảng cách và chỉ dẫn từng bước; chuyển tầng theo chỉ dẫn.
- Mô phỏng tuyến bằng Blue Dot, Play/Pause, Stop và lựa chọn tốc độ.
- Đổi tầng, ngôn ngữ, theme và độ sáng.
- Zoom, Home/Reset, toàn màn hình, xoay và nghiêng bản đồ.
- Tra cứu chuyến bay đi/đến, chọn ngày, tìm kiếm, lọc trạng thái và tạo tuyến đến quầy check-in, cửa ra tàu bay hoặc băng chuyền hành lý khi dữ liệu cho phép.
- Mở lại hướng dẫn tích hợp bằng nút `i`.
- Khác biệt thao tác trên desktop, tablet và mobile.
- Cài PWA chỉ ở mức tùy chọn vì nút cài phụ thuộc trình duyệt.

### 3.2. Nhân sự trực kiosk

Tài liệu bao phủ:

- Nhận biết website mode và kiosk mode qua URL.
- Ý nghĩa `mode=kiosk` và `kioskId`.
- Điểm đi cố định, ô điểm đi chỉ đọc và hành vi không cho đổi/swap/xóa origin.
- Chọn điểm đến, tạo tuyến và tra cứu chuyến bay trong kiosk mode.
- Home/Reset, reload và việc giữ nguyên origin kiosk.
- Thông báo kiosk không tồn tại, inactive, mất kết nối hoặc cấu hình không hợp lệ.
- Checklist trước khi đưa kiosk vào vận hành.

Nhân sự trực kiosk không được hướng dẫn đăng nhập hoặc thay đổi cấu hình. Khi phát hiện origin sai, kiosk inactive hoặc lỗi cấu hình, họ ghi nhận `kioskId` và chuyển yêu cầu cho quản trị viên.

Không mô tả `heading` và `defaultZoom` là đã điều khiển camera runtime vì mã nguồn hiện chỉ lưu và kiểm tra hai giá trị này.

### 3.3. Quản trị viên

Luồng vận hành chính là `/?admin=true`. Tài liệu bao phủ:

- Đăng nhập, hiển thị/ẩn mật khẩu, trạng thái phiên, logout và xử lý hết phiên.
- Quản lý thông tin khu vực đa ngôn ngữ, ảnh, điện thoại và giờ hoạt động.
- Phân loại khu vực theo danh mục chính và danh mục con.
- Áp dụng hoặc xóa màu nền cho một hay nhiều khu vực.
- Chọn, thêm, chỉnh sửa, sao chép, di chuyển và xóa model 3D.
- Quản lý kiosk và preview cấu hình trước khi lưu.
- Tạo, sửa hoặc deactivate kiosk; chọn object hoặc tọa độ, preview tuyến và yêu cầu thiết bị reload sau khi lưu.
- Cảnh báo an toàn trước các thao tác ghi, xóa hoặc cập nhật hàng loạt.

Trang `main/html/admin.html` không được hướng dẫn như một luồng vận hành hợp lệ vì giao diện và payload không còn tương thích đầy đủ với API hiện tại. Tài liệu chỉ nêu đây là trang kế thừa không nên sử dụng.

### 3.4. Nhân sự kỹ thuật vận hành và xử lý sự cố

Phụ lục bao phủ:

- Cổng hiện hành: frontend `3000`, backend `3002` trong development.
- Lệnh chạy frontend/backend và URL truy cập đúng.
- Các tham số URL thường dùng và cảnh báo với `sync=true` hoặc `debug=true`.
- Xử lý lỗi tải dữ liệu, không có tuyến, thiếu mapping chuyến bay, kiosk `404/503`, hết phiên quản trị, sai CORS và lỗi kết nối SQL Server.
- Câu hỏi thường gặp, thuật ngữ và checklist bàn giao.

Các tài liệu cũ ghi frontend `5173` hoặc backend `3000` không được dùng làm nguồn cổng hiện hành.

## 4. Kiến trúc nội dung Word

Tài liệu có cấu trúc sau:

1. Bìa.
2. Thông tin tài liệu, phiên bản và lịch sử cập nhật.
3. Quy ước ký hiệu và cách đọc.
4. Mục lục tự động.
5. Danh mục hình tự động.
6. Chương 1 – Giới thiệu và yêu cầu sử dụng.
7. Chương 2 – Làm quen giao diện.
8. Chương 3 – Tìm kiếm và khám phá địa điểm.
9. Chương 4 – Chỉ đường và mô phỏng tuyến.
10. Chương 5 – Tra cứu chuyến bay.
11. Chương 6 – Tùy chỉnh và điều khiển bản đồ.
12. Chương 7 – Sử dụng trên điện thoại và máy tính bảng.
13. Chương 8 – Sử dụng và kiểm tra kiosk trong ca trực; không chứa thao tác thay đổi cấu hình.
14. Chương 9 – Quản trị hệ thống, bao gồm cấu hình kiosk; Chương 8 dẫn tham chiếu tới đây khi cần chuyển yêu cầu.
15. Chương 10 – Vận hành và xử lý sự cố.
16. Phụ lục – URL, thuật ngữ, checklist và giới hạn đã biết.

Mỗi quy trình có cùng mẫu trình bày:

- Mục đích.
- Điều kiện trước khi thực hiện.
- Các bước đánh số.
- Hình minh họa và chú thích hình.
- Kết quả mong đợi.
- Lưu ý, mẹo hoặc cảnh báo nếu có.

## 5. Thiết kế hình minh họa

### 5.1. Nguồn ảnh

- Chụp từ giao diện ứng dụng hiện tại bằng Playwright.
- Desktop dùng viewport `1440 × 900`.
- Mobile dùng viewport `390 × 844`.
- Tablet dùng viewport `820 × 1180` ở hướng dọc và `1180 × 820` ở hướng ngang. Có tối thiểu ba ảnh/kiểm tra tablet: tổng quan control, lập tuyến và modal chuyến bay hoặc cài đặt.
- Khi cần trạng thái dữ liệu ổn định, chặn API trong phiên trình duyệt và dùng dữ liệu minh họa đã ẩn danh; không ghi vào cơ sở dữ liệu thật.
- Giao diện, CSS, phần tử DOM và bản đồ nền vẫn là ứng dụng thật.

### 5.2. Quy ước chú thích

- Mỗi vùng thao tác được bao bằng khung chữ nhật đỏ `#D92D20`, nét 3–4 px, góc bo nhẹ, đồng thời có huy hiệu số tương ứng.
- Huy hiệu số màu đỏ nền trắng được đặt gần khung, theo thứ tự đọc từ trái sang phải và trên xuống dưới. Khung và huy hiệu số là một cặp bắt buộc, không thay thế cho nhau.
- Khi cần, nhãn ngắn nền trắng viền đỏ được nối với khung bằng đường dẫn đỏ.
- Không dùng quá năm khung trên một hình; quy trình phức tạp được tách thành nhiều ảnh.
- Không che khuất nội dung quan trọng, không chỉnh sửa ảnh theo cách làm sai lệch trạng thái UI.
- Tên đăng nhập, cookie, connection string, token, dữ liệu cá nhân hoặc thông tin nhạy cảm phải bị loại bỏ hoặc che trước khi lưu ảnh.

### 5.3. Chú thích hình

- Caption đặt dưới ảnh theo mẫu `Hình X.Y – Mô tả ngắn gọn`.
- Phần giải thích ngay sau caption ánh xạ số trên ảnh với tên control và hành động.
- Ảnh giữ đúng tỷ lệ, không kéo méo; độ phân giải đủ đọc chữ khi in A4.
- Ảnh rộng được dùng toàn chiều rộng trang; ảnh mobile được đặt trong khung thiết bị hoặc theo cặp nếu vẫn đọc rõ.

## 6. Thiết kế trình bày

- Khổ A4, hướng dọc; chỉ dùng trang ngang cho hình hoặc bảng quá rộng.
- Lề trên/dưới khoảng 2 cm, lề trong 2.2 cm, lề ngoài 1.8 cm.
- Font Aptos hoặc Arial tương thích tiếng Việt; nội dung 10.5–11 pt, line spacing khoảng 1.15.
- Màu chủ đạo xanh đậm theo giao diện ứng dụng, màu đỏ dành riêng cho chú thích/cảnh báo.
- Heading 1/2/3 dùng style Word chuẩn để mục lục cập nhật được.
- Header ghi tên rút gọn của tài liệu và phiên bản.
- Footer có ngày phát hành và trường số trang `Trang X/Y`.
- Mọi bảng có hàng tiêu đề lặp lại; không để heading hoặc caption nằm đơn độc cuối trang.
- Các hộp `Mẹo`, `Lưu ý`, `Cảnh báo` có màu và biểu tượng nhất quán.

## 7. Dữ liệu minh họa và an toàn

- Không sử dụng hoặc hiển thị mật khẩu quản trị thực.
- Không thực hiện thao tác lưu/xóa trên database thật chỉ để tạo ảnh.
- Với ảnh quản trị, dùng trạng thái DOM và API minh họa ổn định trong phiên chụp.
- Nếu cần ảnh trước/sau của màu hoặc model, tạo trong phiên trình duyệt cô lập và không gửi request ghi thật.
- Không đưa connection string, API key, JWT secret hoặc password hash vào Word, ảnh, log hay script bàn giao.

## 8. Giới hạn và cảnh báo phải thể hiện trung thực

- Thanh tiến trình mô phỏng tuyến hiện không hỗ trợ kéo để seek.
- Một số nút điều hướng chuyến bay chỉ xuất hiện khi có mapping và trạng thái bay phù hợp.
- `admin.html` là giao diện kế thừa, không phải luồng quản trị được khuyến nghị.
- Xóa model 3D là thao tác nhạy cảm; tài liệu yêu cầu xác minh đối tượng trước khi bấm xóa.
- Một số phản hồi thành công của giao diện quản trị chưa phản ánh chắc chắn trạng thái HTTP; tài liệu yêu cầu kiểm tra kết quả sau lưu.
- Cấu hình kiosk thay đổi chỉ có hiệu lực ở thiết bị sau khi tải lại trang.
- Kiosk dùng tọa độ có thể không nối với mạng lưới chỉ đường; phải preview một tuyến thực tế trước khi kích hoạt.

## 9. Phương pháp tạo Word

- Dùng `python-docx` để dựng nội dung và style DOCX có tính tái tạo; chèn field Word gốc cho TOC, danh mục hình, caption `SEQ`, cross-reference `REF`, header/footer và đánh số trang.
- Dùng Microsoft Word COM để mở lại tài liệu, cập nhật toàn bộ field/cross-reference, repaginate, lưu DOCX và xuất PDF. Word COM là bước bắt buộc để bảo đảm các field động hiển thị đúng.
- Script có tính tái tạo: nội dung, thứ tự hình và metadata được khai báo rõ; không phụ thuộc thao tác thủ công không ghi lại.
- Dùng LibreOffice/PDF renderer làm kiểm tra bổ sung khi cần.

## 10. Tiêu chí nghiệm thu

Tài liệu chỉ được coi là hoàn tất khi:

1. Có đủ bốn nhóm độc giả và mọi nhóm tính năng trong mục 3.
2. Các quy trình UI chính gồm: tìm kiếm; duyệt danh mục; xem chi tiết địa điểm; tạo tuyến; đọc và mô phỏng tuyến; tra cứu chuyến bay; đổi tầng/ngôn ngữ/theme/độ sáng; camera; mobile/tablet; sử dụng kiosk; đăng nhập/logout; thông tin khu vực; phân loại; màu khu vực; model 3D và cấu hình kiosk. Mỗi quy trình UI có ảnh thực tế, bước thao tác, kết quả mong đợi và lưu ý cần thiết. Quy trình kỹ thuật khởi chạy dịch vụ và xử lý sự cố được phép dùng code block, bảng quyết định và đầu ra lệnh đã xác minh thay cho ảnh nếu cách đó rõ hơn.
3. Mỗi vùng được chú thích trên ảnh có cả khung chữ nhật đỏ và huy hiệu số; phần giải thích dưới hình có mục số tương ứng.
4. Mục lục, danh mục hình, caption, header, footer và số trang hiển thị đúng sau khi cập nhật field.
5. DOCX mở được bằng Microsoft Word mà không báo sửa chữa file.
6. PDF xuất thành công; tất cả trang được render kiểm tra không có chữ tràn, ảnh vỡ, caption mồ côi hoặc trang trắng bất thường.
7. Đối chiếu `docs/user-guide/source/feature-matrix.csv`; mọi dòng phải có vai trò, chương/quy trình, ảnh hoặc lý do không cần ảnh, và trạng thái `verified` trước khi bàn giao.
8. Kiểm tra không có secret hoặc thông tin đăng nhập trong toàn bộ thư mục bàn giao.
9. So sánh với commit gốc `733e7c5` và chỉ đánh giá các đường dẫn `docs/superpowers/specs/2026-08-03-emap-comprehensive-user-guide-design.md`, kế hoạch tương ứng và `docs/user-guide/`; thay đổi có sẵn ngoài các đường dẫn này không làm thất bại nghiệm thu.
