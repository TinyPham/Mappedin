-- =============================================
-- Add Admin Modal UI Translation Keys to Database
-- Generated: 2026-01-20 (Fixed Column Names)
-- =============================================

USE [MappedIn3DModels]
GO

-- Insert Admin Modal UI Translation Keys using INSERT (simpler than MERGE)
-- If key already exists, it will fail silently

-- Admin Modal Title
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'admin_modal_title')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('admin_modal_title', 'title', N'Quản lý Thông tin Khu vực', N'Manage Area Information', N'管理区域信息', N'エリア情報管理', N'지역 정보 관리');

-- Sidebar Button (Area Information)
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'sidebar_area_info')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('sidebar_area_info', 'label', N'Thông tin Khu vực', N'Area Information', N'区域信息', N'エリア情報', N'지역 정보');

-- Select Area Label
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'select_area_label')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('select_area_label', 'label', N'Chọn khu vực để chỉnh sửa:', N'Select area to edit:', N'选择要编辑的区域：', N'編集するエリアを選択：', N'편집할 지역 선택:');

-- Select Placeholder
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'select_area_placeholder')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('select_area_placeholder', 'placeholder', N'-- Chọn khu vực --', N'-- Select area --', N'-- 选择区域 --', N'-- エリアを選択 --', N'-- 지역 선택 --');

-- Filter Placeholder
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'filter_by_name')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('filter_by_name', 'placeholder', N'Lọc theo tên...', N'Filter by name...', N'按名称筛选...', N'名前でフィルタ...', N'이름으로 필터...');

-- Image Label
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'image_url_label')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('image_url_label', 'label', N'Hình ảnh (URL hoặc Upload):', N'Image (URL or Upload):', N'图片（URL或上传）：', N'画像（URLまたはアップロード）：', N'이미지 (URL 또는 업로드):');

-- Upload Button
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'upload_image_btn')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('upload_image_btn', 'label', N'Upload ảnh mới', N'Upload new image', N'上传新图片', N'新しい画像をアップロード', N'새 이미지 업로드');

-- No Image Text
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'no_image')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('no_image', 'label', N'Không có ảnh', N'No Image', N'暂无图片', N'画像なし', N'이미지 없음');

-- Cancel Button
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'cancel_btn')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('cancel_btn', 'label', N'Hủy', N'Cancel', N'取消', N'キャンセル', N'취소');

-- Save Changes Button
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'save_changes_btn')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('save_changes_btn', 'label', N'Lưu Thay Đổi', N'Save Changes', N'保存更改', N'変更を保存', N'변경사항 저장');

-- Saving Status
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'saving_status')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('saving_status', 'status', N'Đang lưu...', N'Saving...', N'正在保存...', N'保存中...', N'저장 중...');

-- Uploading Status
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'uploading_status')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('uploading_status', 'status', N'Đang upload...', N'Uploading...', N'正在上传...', N'アップロード中...', N'업로드 중...');

-- Upload Complete
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'upload_complete')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('upload_complete', 'status', N'Upload xong!', N'Upload complete!', N'上传完成！', N'アップロード完了！', N'업로드 완료!');

-- Network Error
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'network_error')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('network_error', 'error', N'Lỗi mạng', N'Network error', N'网络错误', N'ネットワークエラー', N'네트워크 오류');

-- Save Success
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'save_success')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('save_success', 'status', N'Đã lưu thành công!', N'Saved successfully!', N'保存成功！', N'保存しました！', N'저장 완료!');

-- Save Failed
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'save_failed')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('save_failed', 'error', N'Lỗi lưu dữ liệu', N'Failed to save data', N'保存数据失败', N'データの保存に失敗しました', N'데이터 저장 실패');

-- Translating Status
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'translating_status')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('translating_status', 'status', N'Đang dịch...', N'Translating...', N'正在翻译...', N'翻訳中...', N'번역 중...');

-- No Description
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'no_desc')
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES 
('no_desc', 'label', N'Không có mô tả.', N'No description.', N'暂无描述。', N'説明なし。', N'설명 없음.');

PRINT 'Admin Modal UI Translation Keys added successfully!'
GO
