import json
import re

# Data Structure for UI Keys (KeyCode -> {VN, EN, ZH, JA, KO})
ui_data = [
    # Directions / Navigation
    ('directions_btn', 'label', 'Dẫn đường', 'Directions', '导航', 'ナビ', '길찾기'),
    ('from', 'label', 'Đi từ:', 'From:', '起点：', '出発地：', '출발:'),
    ('to', 'label', 'Đi đến:', 'To:', '终点：', '到着地：', '도착:'),
    ('clear', 'label', 'Xóa', 'Clear', '清除', 'クリア', '지우기'),
    ('start_preview', 'label', 'Bắt đầu', 'Start', '开始', 'スタート', '시작'),
    
    # 3D Model & Classification
    ('add_model', 'label', 'Thêm model 3D', 'Add 3D Model', '添加3D模型', '3Dモデル追加', '3D 모델 추가'),
    ('classification_btn', 'label', 'Phân loại khu vực', 'Area Classification', '区域分类', 'エリア分類', '구역 분류'),
    ('select_model_title', 'title', 'Chọn mô hình 3D', 'Select 3D Model', '选择3D模型', '3Dモデル選択', '3D 모델 선택'),
    ('classification_title', 'title', 'Phân loại khu vực', 'Area Classification', '区域分类', 'エリア分類', '구역 분류'),
    
    # Categories
    ('main_categories', 'title', 'Danh mục chính', 'Main Categories', '主分类', 'メインカテゴリ', '주요 카테고리'),
    ('sub_categories', 'title', 'Danh mục con', 'Subcategories', '子分类', 'サブカテゴリ', '하위 카테고리'),
    ('search_placeholder', 'placeholder', 'Tìm kiếm khu vực, điểm đến...', 'Search areas, destinations...', '搜索区域、目的地...', 'エリア・目的地を検索...', '구역, 목적지 검색...'),
    
    # Floors (UI Keys)
    ('floor_roof', 'floor', 'Tầng mái', 'Roof Level', '屋顶层', '屋上階', '옥상층'),
    ('floor_3f_checkin', 'floor', 'Tầng 3 - Tầng checkin', '3F - Check-in Floor', '3层 - 值机层', '3階 - チェックインフロア', '3층 - 체크인 층'),
    ('floor_2f_departure', 'floor', 'Tầng 2 - Tầng đi', '2F - Departure Floor', '2层 - 出发层', '2階 - 出発フロア', '2층 - 출발 층'),
    ('floor_1f_arrival', 'floor', 'Tầng 1 - Tầng đến', '1F - Arrival Floor', '1层 - 到达层', '1階 - 到着フロア', '1층 - 도착 층'),
    ('floor_gf_shuttle', 'floor', 'Tầng trệt - Xe đưa đón', 'GF - Shuttle Bus Floor', '底楼', '1階（地上階）', '지상층'),
]

# Data Structure for Categories (Id, VN, EN, ZH, JA, KO)
category_data = [
    (8, 'Ăn uống', 'Food & Beverage', '餐饮', '飲食', '식음료'),
    (11, 'Cửa hàng', 'Shopping', '购物', 'ショッピング', '쇼핑'),
    (10, 'Dịch vụ sân bay', 'Airport Services', '机场服务', '空港サービス', '공항 서비스'),
    (4, 'Điện tử', 'Electronics', '电子产品', '電子機器', '전자제품'),
    (1, 'Hỗ trợ người khuyết tật', 'Accessibility', '无障碍设施', 'バリアフリー', '교통약자 지원'),
    (3, 'Kết nối', 'Connections', '交通连接', '連絡通路', '연결시설'),
    (2, 'Làm đẹp', 'Beauty', '美容', 'ビューティー', '뷰티'),
    (9, 'Nhà thuốc', 'Pharmacy', '药房', '薬局', '약국'),
    (14, 'Phòng chờ', 'Lounges', '贵宾室', 'ラウンジ', '라운지'),
    (7, 'Thể thao', 'Fitness', '健身', 'フィットネス', '피트니스'),
    (6, 'Thời trang', 'Fashion', '时尚', 'ファッション', '패션'),
    (13, 'Thư giãn', 'Entertainment', '休闲娱乐', 'エンターテインメント', '엔터테인먼트'),
    (18, 'Thủ tục chuyến bay đến', 'Arrival Procedures', '到达手续', '到着手続き', '도착 절차'),
    (19, 'Thủ tục chuyến bay đi', 'Departure Procedures', '出发手续', '出発手続き', '출발 절차'),
    (20, 'Thủ tục nối chuyến', 'Transit Procedures', '中转手续', '乗継手続き', '환승 절차')
]

# Data for SubCategories (Id, VN, EN, ZH, JA, KO) - Simplified selection
subcategory_data = [
    # Food & Beverage
    (79, 'Cà phê', 'Coffee', '咖啡', 'カフェ', '커피'),
    (82, 'Kem', 'Ice Cream', '冰淇淋', 'アイスクリーム', '아이스크림'),
    (81, 'Khu ẩm thực', 'Food Court', '美食广场', 'フードコート', '푸드코트'),
    (83, 'Nhà hàng', 'Restaurant', '餐厅', 'レストラン', '레스토랑'),
    (27, 'Pizza', 'Pizza', '披萨', 'ピザ', '피자'),
    (78, 'Quầy Bar', 'Bar', '酒吧', 'バー', '바'),
    (76, 'Rượu & Đồ uống có cồn', 'Alcohol & Spirits', '酒类', 'アルコール', '주류'),
    (80, 'Thức ăn nhanh', 'Fast Food', '快餐', 'ファストフード', '패스트푸드'),
    (77, 'Tiệm bánh', 'Bakery', '面包店', 'ベーカリー', '베이커리'),
    
    # Shopping
    (122, 'Cửa hàng hoa', 'Flower Shop', '花店', 'フラワーショップ', '꽃집'),
    (111, 'Cửa hàng lưu niệm', 'Souvenir Shop', '纪念品店', 'お土産店', '기념품점'),
    (110, 'Cửa hàng miễn thuế', 'Duty Free Shop', '免税店', '免税店', '면세점'),
    (109, 'Cửa hàng tiện lợi', 'Convenience Store', '便利店', 'コンビニ', '편의점'),
    (108, 'Hiệu sách', 'Bookstore', '书店', '書店', '서점'),
    
    # Airport Services
    (98, 'Bãi đỗ xe', 'Parking', '停车场', '駐車場', '주차장'),
    (96, 'Bãi đỗ xe máy', 'Motorbike Parking', '摩托车停车场', 'バイク駐輪場', '오토바이 주차장'),
    (87, 'Bãi đỗ xe ô tô', 'Car Parking', '汽车停车场', '車駐車場', '자동차 주차장'),
    (141, 'Cảnh quan', 'Landscape', '景观', 'ランドスケープ', '조경'),
    (142, 'Dịch vụ bưu điện', 'Post Service', '邮政服务', '郵便サービス', '우편 서비스'),
    (143, 'Dịch vụ đón tiễn khách', 'Welcome Service', '迎送服务', 'お迎えサービス', '영접 서비스'),
    (104, 'Điểm đón Taxi', 'Taxi Pickup', '出租车乘车点', 'タクシー乗り場', '택시 승차장'),
    (99, 'Điện thoại công cộng', 'Public Phone', '公用电话', '公衆電話', '공중전화'),
    (89, 'Đổi ngoại tệ', 'Currency Exchange', '货币兑换', '両替', '환전'),
    (106, 'Đóng gói hành lý', 'Baggage Wrapping', '行李打包', '手荷物ラッピング', '수하물 포장'),
    (95, 'Hành lý thất lạc', 'Lost & Found', '失物招领', '遺失物取扱所', '분실물 센터'),
    (100, 'Khu chụp ảnh', 'Photo Zone', '拍照区', 'フォトスポット', '포토존'),
    (91, 'Khu triển lãm', 'Exhibition Area', '展览区', '展示エリア', '전시 구역'),
    (140, 'Khu vực chờ xe khách sạn', 'Hotel Shuttle Waiting', '酒店班车等候区', 'ホテルシャトル待機所', '호텔 셔틀 대기 구역'),
    (94, 'Khu vui chơi trẻ em', 'Kids Zone', '儿童游乐区', 'キッズゾーン', '어린이 놀이터'),
    (85, 'Máy ATM', 'ATM', '自动取款机', 'ATM', 'ATM'),
    (101, 'Nhà vệ sinh', 'Restroom', '洗手间', 'トイレ', '화장실'),
    (92, 'Nhà vệ sinh gia đình', 'Family Restroom', '家庭卫生间', 'ファミリートイレ', '가족 화장실'),
    (90, 'Nước uống miễn phí', 'Free Drinking Water', '免费饮水', '無料給水', '무료 음수대'),
    (103, 'Phòng hút thuốc', 'Smoking Room', '吸烟室', '喫煙室', '흡연실'),
    (97, 'Phòng mẹ và bé', 'Nursing Room', '母婴室', '授乳室', '수유실'),
    (102, 'Phòng tắm', 'Shower Room', '淋浴间', 'シャワールーム', '샤워실'),
    (107, 'Phòng tập Yoga', 'Yoga Room', '瑜伽室', 'ヨガルーム', '요가실'),
    (105, 'Thông tin du lịch', 'Tourist Information', '旅游信息', '観光案内', '관광 안내'),
    (93, 'Trạm sạc miễn phí', 'Free Charging Station', '免费充电站', '無料充電ステーション', '무료 충전소'),
    (123, 'Trung tâm văn hóa truyền thống', 'Traditional Cultural Center', '传统文化中心', '伝統文化センター', '전통문화센터'),
    
    # Electronics
    (64, 'Thiết bị điện tử', 'Electronics', '电子设备', '電子機器', '전자기기'),
    
    # Accessibility
    (57, 'Hỗ trợ người khuyết tật', 'Accessibility', '无障碍设施', 'バリアフリー', '교통약자 지원'),
    
    # Connections
    (63, 'Cửa khởi hành', 'Gate', '登机口', 'ゲート', '게이트'),
    (61, 'Lối vào', 'Entrance', '入口', '入口', '입구'),
    (62, 'Thang cuốn', 'Escalator', '扶梯', 'エスカレーター', '에스컬레이터'),
    (60, 'Thang máy', 'Elevator', '电梯', 'エレベーター', '엘리베이터'),
    
    # Beauty
    (58, 'Mỹ phẩm', 'Cosmetics', '化妆品', 'コスメ', '화장품'),
    (59, 'Spa & Massage', 'Spa & Massage', '水疗按摩', 'スパ・マッサージ', '스파 & 마사지'),
    
    # Pharmacy
    (84, 'Nhà thuốc', 'Pharmacy', '药房', '薬局', '약국'),
    
    # Lounges
    (119, 'Phòng chờ ga đi quốc nội', 'Domestic Departure Lounge', '国内出发贵宾室', '国内線出発ラウンジ', '국내선 출발 라운지'),
    (120, 'Phòng chờ ga đi quốc tế', 'International Departure Lounge', '国际出发贵宾室', '国際線出発ラウンジ', '국제선 출발 라운지'),
    (118, 'Phòng chờ thương gia', 'Business Class Lounge', '商务舱贵宾室', 'ビジネスクラスラウンジ', '비즈니스 라운지'),
    (121, 'Phòng chờ visa', 'Visa Lounge', '签证贵宾室', 'ビザラウンジ', '비자 라운지'),
    
    # Fitness
    (75, 'Phòng tập Gym', 'Gym', '健身房', 'ジム', '헬스장'),
    
    # Fashion
    (74, 'Đồ ngủ', 'Sleepwear', '睡衣', 'パジャマ', '잠옷'),
    (70, 'Giày dép', 'Footwear', '鞋类', 'シューズ', '신발'),
    (69, 'Mắt kính', 'Eyewear', '眼镜', '眼镜', '안경'),
    (68, 'Phụ kiện', 'Accessories', '配饰', 'アクセサリー', '액세서리'),
    (73, 'Thời trang cao cấp', 'Luxury Fashion', '高端时尚', 'ラグジュアリーファッション', '럭셔리 패션'),
    (72, 'Trang sức', 'Jewelry', '珠宝', 'ジュエリー', '주얼리'),
    (71, 'Túi xách', 'Handbag', '手袋', 'ハンドバッグ', '핸드백'),
    
    # Entertainment
    (112, 'Casino', 'Casino', '赌场', 'カジノ', '카지노'),
    (114, 'Ghế massage', 'Massage Chair', '按摩椅', 'マッサージチェア', '마사지 의자'),
    (113, 'Khu trò chơi', 'Gaming Zone', '游戏区', 'ゲームゾーン', '게임존'),
    (117, 'Khu vực nghỉ ngơi', 'Rest Area', '休息区', '休憩エリア', '휴식 공간'),
    (116, 'Phòng cầu nguyện', 'Prayer Room', '祈祷室', '祈祷室', '기도실'),
    (115, 'Rạp chiếu phim', 'Movie Theater', '电影院', '映画館', '영화관'),
    
    # Arrival Procedures
    (124, 'Đăng ký sinh trắc học', 'Biometric Registration', '生物识别登记', '生体認証登録', '생체 인식 등록'),
    (125, 'Hải quan', 'Customs', '海关', '税関', '세관'),
    (129, 'Hành lý quá khổ', 'Oversized Baggage', '超大行李', '大型手荷物', '대형 수하물'),
    (126, 'Khu ga đến quốc nội', 'Domestic Arrival', '国内到达', '国内線到着', '국내선 도착'),
    (128, 'Khu ga đến quốc tế', 'International Arrival', '国际到达', '国際線到着', '국제선 도착'),
    (86, 'Khu vực nhận hành lý', 'Baggage Claim', '行李提取', '手荷物受取所', '수하물 수취'),
    (127, 'Nhập cảnh', 'Immigration', '入境', '入国審査', '입국 심사'),
    
    # Departure Procedures
    (139, 'An ninh soi chiếu nội địa', 'Domestic Security Screening', '国内安检', '国内線保安検査', '국내선 보안 검색'),
    (135, 'An ninh soi chiếu quốc tế', 'International Security Screening', '国际安检', '国際線保安検査', '국제선 보안 검색'),
    (130, 'Khu ga đi quốc nội', 'Domestic Departure', '国内出发', '国内線出発', '국내선 출발'),
    (133, 'Khu ga đi quốc tế', 'International Departure', '国际出发', '国際線出発', '국제선 출발'),
    (88, 'Khu vực làm thủ tục', 'Check-in Area', '值机区', 'チェックインエリア', '체크인 구역'),
    (132, 'Làn làm thủ tục ưu tiên', 'Fast Track', '快速通道', 'ファストトラック', '패스트 트랙'),
    (134, 'Lưu trữ hành lý', 'Luggage Storage', '行李寄存', '手荷物一时预', '수하물 보관'),
    (131, 'Xuất cảnh', 'Emigration', '出境', '出国審査', '출국 심사'),
    
    # Transit Procedures
    (136, 'Nối chuyến Nội địa - Nội địa', 'Domestic to Domestic Transit', '国内转国内', '国内線乗継', '국내-국내 환승'),
    (137, 'Nối chuyến Nội địa - Quốc tế', 'Domestic to International Transit', '国内转国际', '国内-国际線乗継', '국내-국제 환승'),
    (138, 'Nối chuyến Quốc tế - Quốc tế', 'International to International Transit', '国际转国际', '国际線乗継', '국제-국제 환승')
]

# Floor Data
floor_data = [
    ('GF', 'm_dae8f26a40f6017f', 1, 'Tầng trệt', 'Ground Floor', '底楼', '1階', '지상층'),
    ('1F', 'm_41a38d6d0411d397', 2, 'Tầng 1 - Đến', '1F - Arrival', '1层', '1階', '1층'),
    ('2F', 'm_d4b5674c0b15e099', 3, 'Tầng 2 - Đi', '2F - Departure', '2层', '2階', '2층'),
    ('3F', 'm_1523f7dcde647c40', 4, 'Tầng 3 - Check-in', '3F - Check-in', '3层', '3階', '3층'),
    ('ROOF', 'm_419c5f0d5c054d24', 5, 'Tầng mái', 'Roof', '屋顶', '屋上', '옥상')
]

def sanitize(s):
    if s is None:
        return 'NULL'
    s = s.replace("'", "''")
    return f"N'{s}'"

def parse_name(full_name):
    # Try pattern: "Vietnamese (English)"
    pattern = r"^(.*?)\s*\((.*?)\)$"
    match = re.search(pattern, full_name)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return full_name.strip(), full_name.strip()

# Set to track duplicates
processed_ids = set()

# Load JSON Data
map_objects = []
try:
    with open('database/raw_gf_1f.json', 'r', encoding='utf-8') as f:
        map_objects.extend(json.load(f))
except Exception as e:
    print(f"Warning: Could not read raw_gf_1f.json: {e}")

try:
    with open('database/raw_2f_3f.json', 'r', encoding='utf-8') as f:
        map_objects.extend(json.load(f))
except Exception as e:
    print(f"Warning: Could not read raw_2f_3f.json: {e}")

print(f"Loaded {len(map_objects)} map objects.")

# SQL Generation
sql_lines = []

sql_lines.append("-- ============================================")
sql_lines.append("-- SEED ALL FINAL: Unified Translations Script")
sql_lines.append("-- ============================================")
sql_lines.append("")

# 1. UI Translations
sql_lines.append("-- 1. UI Translations")
sql_lines.append("TRUNCATE TABLE Translation_UI;")
for item in ui_data:
    key, ktype, vn, en, zh, ja, ko = item
    sql_lines.append(f"INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('{key}', '{ktype}', {sanitize(vn)}, {sanitize(en)}, {sanitize(zh)}, {sanitize(ja)}, {sanitize(ko)});")

sql_lines.append("")

# 2. Categories
sql_lines.append("-- 2. Category Translations")
sql_lines.append("TRUNCATE TABLE Translation_Categories;")
for item in category_data:
    cid, vn, en, zh, ja, ko = item
    sql_lines.append(f"INSERT INTO Translation_Categories (CategoryId, VN, EN, ZH, JA, KO) VALUES ({cid}, {sanitize(vn)}, {sanitize(en)}, {sanitize(zh)}, {sanitize(ja)}, {sanitize(ko)});")

sql_lines.append("")

# 3. SubCategories
sql_lines.append("-- 3. SubCategory Translations")
sql_lines.append("TRUNCATE TABLE Translation_SubCategories;")
for item in subcategory_data:
    scid, vn, en, zh, ja, ko = item
    # Assuming CategoryId is nullable now
    sql_lines.append(f"INSERT INTO Translation_SubCategories (SubCategoryId, CategoryId, VN, EN, ZH, JA, KO) VALUES ({scid}, NULL, {sanitize(vn)}, {sanitize(en)}, {sanitize(zh)}, {sanitize(ja)}, {sanitize(ko)});")

sql_lines.append("")

# 4. Floors
sql_lines.append("-- 4. Floor Translations")
sql_lines.append("TRUNCATE TABLE Translation_Floors;")
for item in floor_data:
    code, mid, order, vn, en, zh, ja, ko = item
    sql_lines.append(f"INSERT INTO Translation_Floors (MappedinId, FloorCode, SortOrder, VN, EN, ZH, JA, KO) VALUES ('{mid}', '{code}', {order}, {sanitize(vn)}, {sanitize(en)}, {sanitize(zh)}, {sanitize(ja)}, {sanitize(ko)});")

sql_lines.append("")

# 5. Locations
sql_lines.append("-- 5. Location Translations (Map Objects)")
sql_lines.append("TRUNCATE TABLE Translation_Locations;")

for obj in map_objects:
    oid = obj.get('id')
    oname = obj.get('name')
    otype = obj.get('type', 'room')

    if not oid or not oname:
        continue
    
    if oid in processed_ids:
        continue
    processed_ids.add(oid)

    vn, en = parse_name(oname)
    
    # Basic fallbacks for ZH, JA, KO (use EN if available, else VN)
    zh = en if en else vn
    ja = en if en else vn
    ko = en if en else vn

    sql_lines.append(f"INSERT INTO Translation_Locations (MappedinId, LocationType, CategoryId, VN, EN, ZH, JA, KO) VALUES ('{oid}', '{otype}', NULL, {sanitize(vn)}, {sanitize(en)}, {sanitize(zh)}, {sanitize(ja)}, {sanitize(ko)});")

# Write to file
with open('database/seed_all_final.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"Generated database/seed_all_final.sql with {len(sql_lines)} lines.")
