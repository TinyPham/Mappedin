
import json

# Data Structure for UI Keys (KeyCode -> {VN, EN, ZH, JA, KO})
ui_data = [
    # Directions / Navigation
    ('directions_btn', 'label', 'Dẫn đường', 'Directions', '导航', 'ナビ', '길찾기'),
    ('from', 'label', 'Đi từ:', 'From:', '起点：', '出発地：', '출발:'),
    ('to', 'label', 'Đi đến:', 'To:', '终点：', '到着地：', '도착:'),
    ('clear', 'label', 'Xóa', 'Clear', '清除', 'クリア', '지우기'),
    ('start_preview', 'label', 'Bắt đầu', 'Start', '开始', 'スタート', '시작'),
    ('route_preview', 'label', 'Xem trước lộ trình', 'Route Preview', '路线预览', 'ルートプレビュー', '경로 미리보기'),
    ('route_found', 'badge', 'Đã tìm thấy đường đi', 'Route found', '已找到路线', 'ルートが見つかりました', '경로를 찾았습니다'),
    
    # Instruction Actions
    ('action_departure', 'action', 'Khởi hành', 'Departure', '出发', '出発', '출발'),
    ('action_arrival', 'action', 'Kết thúc', 'Arrival', '到达', '到着', '도착'),
    ('action_continue', 'action', 'Tiếp tục', 'Continue', '继续', '直進', '계속'),
    ('action_go_straight', 'action', 'Đi thẳng', 'Go straight', '直行', '直進', '직진'),
    ('action_turn_left', 'action', 'Rẽ trái', 'Turn left', '左转', '左折', '좌회전'),
    ('action_turn_right', 'action', 'Rẽ rải', 'Turn right', '右转', '右折', '우회전'),
    ('action_slight_left', 'action', 'Rẽ trái nhẹ', 'Slight left', '向左微转', '左に少し曲がる', '약간 좌회전'),
    ('action_slight_right', 'action', 'Rẽ phải nhẹ', 'Slight right', '向右微转', '右に少し曲がる', '약간 우회전'),
    ('action_turn_around', 'action', 'Quay lại', 'Turn around', '掉头', '戻る', '되돌아가기'),
    ('action_enter', 'action', 'Vào', 'Enter', '进入', '入る', '입력'),
    ('action_exit', 'action', 'Ra', 'Exit', '离开', '出る', '출구'),
    ('action_take_connection', 'action', 'Đi qua cổng liên kết', 'Take connection', '采取连接', '乗り継ぎ', '연결 이용'),
    ('action_exit_connection', 'action', 'Rời khỏi liên kết', 'Exit connection', '离开连接', '連絡通路を出る', '연결 종료'),
    
    # Objects & Directions
    ('elevator', 'object', 'thang máy', 'elevator', '电梯', 'エレベーター', '엘리베이터'),
    ('escalator', 'object', 'thang cuốn', 'escalator', '自动扶梯', 'エスカレーター', '에스컬레이터'),
    ('direction_up', 'object', 'đi lên', 'go up', '向上', '上へ', '위로'),
    ('direction_down', 'object', 'đi xuống', 'go down', '向下', '下へ', '아래로'),
    
    # Labels & Time
    ('speed_label', 'label', 'Tốc độ:', 'Speed:', '速度:', '速度:', '속도:'),
    ('minute_label', 'time', 'phút', 'min', '分', '分', '분'),
    ('second_label', 'time', 'giây', 'sec', '秒', '秒', '초'),
    ('minute_label_short', 'time', 'phút', 'min', '分', '分', '분'),
    
    # 3D Model & Classification
    ('add_model', 'label', 'Thêm model 3D', 'Add 3D Model', '添加3D模型', '3Dモデル追加', '3D 모델 추가'),
    ('classification_btn', 'label', 'Phân loại khu vực', 'Area Classification', '区域分类', 'エリア分類', '구역 분류'),
    ('select_model_title', 'title', 'Chọn mô hình 3D', 'Select 3D Model', '选择3D模型', '3Dモデル選択', '3D 모델 선택'),
    ('classification_title', 'title', 'Phân loại khu vực', 'Area Classification', '区域分类', 'エリア分類', '구역 분류'),
    
    # Categories & Search
    ('main_categories', 'title', 'Danh mục chính', 'Main Categories', '主分类', 'メインカテゴリ', '주요 카테고리'),
    ('sub_categories', 'title', 'Danh mục con', 'Subcategories', '子分类', 'サブカテゴリ', '하위 카테고리'),
    ('search_placeholder', 'placeholder', 'Tìm kiếm khu vực, điểm đến...', 'Search areas, destinations...', '搜索区域、目的地...', 'エリア・目的地を検索...', '구역, 목적지 검색...'),
    ('search_departure_placeholder', 'placeholder', 'Tìm điểm đi', 'Search Departure', '搜索起点', '出発地を検索', '출발지 검색'),
    ('search_destination_placeholder', 'placeholder', 'Tìm điểm đến', 'Search Destination', '搜索终点', '目的地を検索', '목적지 검색'),
    
    # UI Text
    ('need_directions', 'label', 'Bạn cần chỉ đường?', 'Need directions?', '需要路线指引吗？', '経路案内が必要ですか？', '길찾기가 필요하신가요?'),
    ('step_by_step', 'label', 'CHỈ DẪN LỘ TRÌNH', 'ROUTE GUIDANCE', '路线指南', '経路案内', '경로 안내'),
    ('not_found', 'error', 'Không tìm thấy đường đi', 'Route not found', '未找到路线', 'ルートが見つかりません', '경로를 찾을 수 없습니다'),
    ('error_nav', 'error', 'Lỗi khi tìm đường đi', 'Error finding route', '寻道错误', 'ルート検索エラー', '경로 검색 오류'),
    ('back_btn', 'label', 'Quay lại danh mục', 'Back to categories', '返回分类', 'カテゴリに戻る', '카테고리로 돌아가기'),
    ('area_color_btn', 'label', 'Màu nền khu vực', 'Area background', '区域背景颜色', 'エリアの背景色', '구역 배경색'),
    ('sidebar_area_info', 'label', 'Thông tin khu vực', 'Area information', '区域详情', 'エリア情報', '구역 정보'),
]

sql_lines = []
sql_lines.append("-- ============================================")
sql_lines.append("-- UI & LANGUAGE UPDATE SCRIPT")
sql_lines.append("-- Target Database: MappedIn3DModels")
sql_lines.append("-- ============================================")
sql_lines.append("USE [MappedIn3DModels]")
sql_lines.append("GO")
sql_lines.append("")

# 1. Update Data: Translation_UI
sql_lines.append("-- Clean up existing and re-seed")
sql_lines.append("DELETE FROM Translation_UI;")
sql_lines.append("GO")
sql_lines.append("")

for item in ui_data:
    key, mode, vn, en, zh, ja, ko = item
    vn = f"N'{vn}'"
    en = f"N'{en}'"
    zh = f"N'{zh}'"
    ja = f"N'{ja}'"
    ko = f"N'{ko}'"
    sql = f"INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('{key}', '{mode}', {vn}, {en}, {zh}, {ja}, {ko});"
    sql_lines.append(sql)

with open('database/seed_ui_fix.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"Generated seed_ui_fix.sql with {len(sql_lines)} lines.")
