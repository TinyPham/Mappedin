
import json
import re

# ==========================================
# CONFIGURATION
# ==========================================
OUTPUT_FILE = 'database/seed_master_full.sql'
TARGET_DB = '[MappedIn3DModels]'

# ==========================================
# DATA: LANGUAGES
# ==========================================
languages = [
    ('vn', 'Tiếng Việt', 1, 1),
    ('en', 'English', 2, 1),
    ('zh', '中文 (Chinese)', 3, 1),
    ('ja', '日本語 (Japanese)', 4, 1),
    ('ko', '한국어 (Korean)', 5, 1)
]

# ==========================================
# DATA: UI TRANSATIONS
# ==========================================
ui_data = [
    # APP TITLE / VENUE NAME
    ('venue_name', 'title', 'Cảng Hàng không Quốc tế Long Thành', 'Long Thanh International Airport', '隆塔国际机场', 'ロンタイン国際空港', '롱탄 국제공항'),
    
    # Directions / Navigation Panel
    ('from', 'label', 'Đi từ:', 'From:', '起点：', '出発地：', '출발:'),
    ('to', 'label', 'Đi đến:', 'To:', '终点：', '到着地：', '도착:'),
    ('clear', 'label', 'Xóa', 'Clear', '清除', 'クリア', '지우기'),
    ('start_preview', 'label', 'Bắt đầu', 'Start', '开始', 'スタート', '시작'),
    ('stop_preview', 'label', 'Dừng', 'Stop', '停止', 'ストップ', '정지'),
    ('not_found', 'message', 'Không tìm thấy đường đi', 'No path found', '未找到路线', 'ルートが見つかりません', '경로를 찾을 수 없습니다'),
    ('error_nav', 'message', 'Lỗi khi tìm đường đi', 'Error finding path', '查找路线时出错', 'ルート検索中にエラーが発生しました', '경로 검색 중 오류가 발생했습니다'),
    ('select_origin', 'status', 'Vui lòng chọn điểm đi trên bản đồ', 'Please select a starting point on the map', '请在地图上选择起点', '地図上で出発地を選択してください', '지도에서 출발지를 선택하세요'),
    ('select_destination', 'status', 'Vui lòng chọn điểm đến trên bản đồ', 'Please select a destination on the map', '请在地图上选择目的地', '地図上で到着地を選択してください', '지도에서 목적지를 선택하세요'),
    ('step_by_step', 'title', 'Hướng dẫn từng bước:', 'Step-by-step instructions:', '分步指引：', 'ステップバイステップの案内：', '단계별 안내:'),
    ('step_label', 'label', 'Bước', 'Step', '步骤', 'ステップ', '단계'),
    ('unnamed_area', 'label', 'Khu vực không tên', 'Unnamed Area', '未命名区域', '名前のないエリア', '이름 없는 구역'),
    ('no_desc', 'label', 'Không có mô tả.', 'No description available.', '无描述。', '説明はありません。', '설명이 없습니다.'),

    # Navigation Actions (Verbs)
    ('action_start', 'nav', 'Bắt đầu', 'Start', '开始', 'スタート', '시작'),
    ('action_departure', 'nav', 'Khởi hành', 'Departure', '出发', '出発', '출발'),
    ('action_arrival', 'nav', 'Kết thúc', 'Arrival', '到达', '到着', '도착'),
    ('action_continue', 'nav', 'Tiếp tục', 'Continue', '继续', '直進', '계속'),
    ('action_turn', 'nav', 'Rẽ', 'Turn', '转弯', '曲がる', '회전'),
    ('action_turn_left', 'nav', 'Rẽ trái', 'Turn left', '左转', '左折', '좌회전'),
    ('action_turn_right', 'nav', 'Rẽ phải', 'Turn right', '右转', '右折', '우회전'),
    ('action_turn_slight_left', 'nav', 'Rẽ nhẹ trái', 'Slight left', '向左微转', '少し左', '왼쪽으로 살짝'),
    ('action_turn_slight_right', 'nav', 'Rẽ nhẹ phải', 'Slight right', '向右微转', '少し右', '오른쪽으로 살짝'),
    ('action_turn_around', 'nav', 'Quay lại', 'Turn around', '掉头', 'Uターン', '회전'),
    ('action_arrive', 'nav', 'Đến nơi', 'Arrive', '到达', '到着', '도착'),
    ('action_enter', 'nav', 'Vào', 'Enter', '进入', '入る', '들어가기'),
    ('action_exit', 'nav', 'Ra', 'Exit', 'Exit', '出る', '나가기'),
    ('action_go', 'nav', 'Đi', 'Go', '去', '行く', '가기'),
    ('action_take_connection', 'nav', 'Vào', 'Enter', '进入', '入る', '들어가기'),
    ('action_exit_connection', 'nav', 'Ra khỏi', 'Exit', '离开', '出る', '나가기'),
    ('action_up', 'nav', 'và lên lầu', 'and go up', '并上楼', 'そして上へ', '그리고 위층으로'),
    ('action_down', 'nav', 'và xuống lầu', 'and go down', '并下楼', 'そして下へ', '그리고 아래층으로'),
    ('action_in', 'nav', 'vào', 'into', '进入', 'へ', '~(으)로'),
    
    # 3D Model & Classification
    ('add_model', 'label', 'Thêm model 3D', 'Add 3D Model', '添加3D模型', '3Dモデル追加', '3D 모델 추가'),
    ('classification_btn', 'label', 'Phân loại khu vực', 'Area Classification', '区域分类', 'エリア分類', '구역 분류'),
    ('select_model_title', 'title', 'Chọn mô hình 3D', 'Select 3D Model', '选择3D模型', '3Dモデル選択', '3D 모델 선택'),
    ('classification_title', 'title', 'Phân loại khu vực', 'Area Classification', '区域分类', 'エリア分類', '구역 분류'),
    
    # Categories
    ('main_categories', 'title', 'Danh mục chính', 'Main Categories', '主分类', 'メインカテゴリ', '주요 카테고리'),
    ('sub_categories', 'title', 'Danh mục con', 'Subcategories', '子分类', 'サブカテゴリ', '하위 카테고리'),
    ('search_placeholder', 'placeholder', 'Tìm kiếm khu vực, điểm đến...', 'Search areas, destinations...', '搜索区域、目的地...', 'エリア・目的地を検索...', '구역, 목적지 검색...'),
    ('no_categories_for_floor', 'message', 'Không có danh mục cho tầng này', 'No categories for this floor', '该楼层没有分类', 'このフロアにはカテゴリがありません', '이 층에는 카테고리가 없습니다'),
    
    # Floors (UI Labels)
    ('floor_roof', 'floor', 'Tầng mái', 'Roof Level', '屋顶层', '屋上階', '옥상층'),
    ('floor_3f_checkin', 'floor', 'Tầng 3 - Tầng checkin', '3F - Check-in Floor', '3层 - 值机层', '3階 - チェックインフロア', '3층 - 체크인 층'),
    ('floor_2f_departure', 'floor', 'Tầng 2 - Tầng đi', '2F - Departure Floor', '2层 - 出发层', '2階 - 出発フロア', '2층 - 출발 층'),
    ('floor_1f_arrival', 'floor', 'Tầng 1 - Tầng đến', '1F - Arrival Floor', '1层 - 到达层', '1階 - 到着フロア', '1층 - 도착 층'),
    ('floor_gf_shuttle', 'floor', 'Tầng trệt - Xe đưa đón', 'GF - Shuttle Bus Floor', '底楼', '1階（地上階）', '지상층'),
    
    # Connections
    ('elevator', 'label', 'Thang máy', 'Elevator', '电梯', 'エレベーター', '엘리베이터'),
    ('escalator', 'label', 'Thang cuốn', 'Escalator', '扶梯', 'エスカレーター', '에스컬레이터'),
    ('stairway', 'label', 'Cầu thang bộ', 'Stairs', '楼梯', '階段', '계단'),
    ('connection', 'label', 'Kết nối', 'Connection', '连接', '接続', '연결'),
    ('route_found', 'status', 'Đã tìm thấy đường đi', 'Route found', '已找到路线', 'ルートが見つかりました', '경로를 찾았습니다'),
    ('select_origin_alert', 'message', 'Chưa có điểm xuất phát. Vui lòng chọn điểm xuất phát trên bản đồ.', 'Please select a starting point on the map.', '请在地图上选择起点。', '地図上で出発地を選択してください。', '지도에서 출발지를 선택하세요.'),
    ('select_destination_alert', 'message', 'Chưa có điểm đích đến. Vui lòng chọn điểm đích đến trên bản đồ.', 'Please select a destination on the map.', '请在地图上选择目的地。', '地図上で到着地を選択してください。', '지도에서 목적지를 선택하세요.'),
    ('linked_floors', 'label', 'Tầng liên kết:', 'Linked floors:', '关联楼层：', '関連フロア：', '연결된 층:'),
    ('floor', 'label', 'Tầng', 'Floor', '楼层', 'フロア', '층'),
    ('back_btn', 'label', 'Quay lại', 'Back', '返回', '戻る', '뒤로'),
    ('no_desc', 'message', 'Không có mô tả.', 'No description.', '没有描述。', '説明なし。', '설명 없음'),
    ('main_entrance', 'label', 'Cổng chính', 'Main Entrance', '正门', 'メインエントランス', '정문'),
    ('venue_name', 'label', 'Cảng Hàng không Quốc tế Long Thành', 'Long Thanh International Airport', '隆城国际机场', 'ロンタイン国際空港', '롱탄 국제공항'),
    ('select_origin_placeholder', 'placeholder', 'Chưa chọn điểm đi', 'Please select origin', '未选择起点', '出発地を選択してください', '출발지 미선택'),
    ('select_destination_placeholder', 'placeholder', 'Chưa chọn điểm đến', 'Please select destination', '未选择终点', '目的地を選択してください', '목적지 미선택'),
    ('directions_btn', 'label', 'Dẫn đường', 'Get Directions', '路线', '道順', '길 안내'),
]

# ==========================================
# DATA: FLOORS
# ==========================================
# (FloorId, MappedinId, FloorCode, SortOrder, VN, EN, ZH, JA, KO)
floors = [
    (1, 'm_dae8f26a40f6017f', 'GF', 1, 'Tầng trệt', 'Ground Floor', '底楼', '1階', '지상층'),
    (2, 'm_41a38d6d0411d397', '1F', 2, 'Tầng 1', '1st Floor', '1层', '1階', '1층'),
    (3, 'm_d4b5674c0b15e099', '2F', 3, 'Tầng 2', '2nd Floor', '2层', '2階', '2층'),
    (4, 'm_1523f7dcde647c40', '3F', 4, 'Tầng 3', '3rd Floor', '3层', '3階', '3층'),
    (5, 'm_419c5f0d5c054d24', 'ROOF', 5, 'Tầng mái', 'Roof Level', '屋顶层', '屋上階', '옥상층')
]

# ==========================================
# DATA: CATEGORIES (with IconPath)
# ==========================================
# (CategoryId, VN, EN, ZH, JA, KO, IconPath)
categories = [
    (8, 'Ăn uống', 'Food & Beverage', '餐饮', '飲食', '식음료', 'food-and-drink.png'),
    (11, 'Cửa hàng', 'Shopping', '购物', 'ショッピング', '쇼핑', 'store.png'),
    (10, 'Dịch vụ sân bay', 'Airport Services', '机场服务', '空港サービス', '공항 서비스', 'airportservice.png'),
    (4, 'Điện tử', 'Electronics', '电子产品', '電子機器', '전자제품', 'electronic.png'),
    (1, 'Hỗ trợ người khuyết tật', 'Accessibility', '无障碍设施', 'バリアフリー', '교통약자 지원', 'accessible.png'),
    (3, 'Kết nối', 'Connections', '交通连接', '連絡通路', '연결시설', 'connection.png'),
    (2, 'Làm đẹp', 'Beauty', '美容', 'ビューティー', '뷰티', 'beauty.png'),
    (9, 'Nhà thuốc', 'Pharmacy', '药房', '薬局', '약국', 'pharmacy.png'),
    (14, 'Phòng chờ', 'Lounges', '贵宾室', 'ラウンジ', '라운지', 'lounge.png'),
    (7, 'Thể thao', 'Fitness', '健身', 'フィットネス', '피트니스', 'fitness.png'),
    (6, 'Thời trang', 'Fashion', '时尚', 'ファッション', '패션', 'fashion.png'),
    (13, 'Thư giãn', 'Entertainment', '休闲娱乐', 'エンターテインメント', 'エンターテインメント', 'entertainment.png'),
    (18, 'Thủ tục chuyến bay đến', 'Arrival Procedures', '到达手续', '到着手続き', '도착 수속', 'arrivalflightprocedures.png'),
    (19, 'Thủ tục chuyến bay đi', 'Departure Procedures', '出发手续', '出発手続き', '출발 수속', 'departureflightprocedures.png'),
    (20, 'Thủ tục nối chuyến', 'Transfer Procedures', '中转手续', '乗継手続き', '환승 수속', 'transitprocedures.png')
]

# ==========================================
# DATA: SUBCATEGORIES
# ==========================================
subcategories = [
    # PRIORITY SUBCATEGORIES (Specific matches first)
    (185, 10, 'ATM', 'ATM', '自动取款机', 'ATM (現金自動預け払い機)', 'ATM (현금 인출기)'),
    (182, 11, 'Cửa hàng rượu và thuốc lá', 'Liquor & Tobacco Store', '烟酒商店', '酒＆タバコ店', '주류 및 담배 판매점'),
    (165, 3, 'Cổng đến', 'Arrival Gate', '到达口', '到着ゲート', '도착 게이트'),
    (163, 8, 'Quầy cà phê và bánh ngọt', 'Cafe & Bakery', '咖啡和烘焙', 'カフェ＆ベーカリー', '카페 & 베이커리'),
    (164, 8, 'Quầy cà phê', 'Coffee Shop', '咖啡店', 'コーヒーショップ', '커피숍'),
    (183, 18, 'Khu nhận hành lý', 'Baggage Claim', '行李提取', '手荷物受取所', '수하물 수취'),
    (160, 8, 'Quầy bán món ăn địa phương', 'Local Food', '当地美食', '郷土料理', '현지 음식'),
    (161, 8, 'Quầy bán món tráng miệng', 'Dessert Shop', '甜品店', 'デザートショップ', '디저트 가게'),
    (162, 10, 'Quầy dịch vụ viễn thông', 'Telecom Service', '电信服务', '通信サービス', '통신 서비스'),
    (166, 14, 'Phòng Internet', 'Internet Lounge', '网吧', 'インターネットラウンジ', '인터넷 라운지'),
    (167, 10, 'Khu vực bọc hành lý', 'Luggage Wrapping', '行李打包区', '手荷物ラッピングエリア', '수하물 포장 구역'),
    (168, 8, 'Khu ẩm thực cao cấp', 'Fine Dining', '高级餐饮', '高級ダイニング', '파인 다이닝'),
    (169, 11, 'Cửa hàng bán lẻ', 'Retail Shop', '零售店', '小売店', '소매점'),
    (170, 8, 'Quầy thực phẩm đóng gói', 'Packaged Food', '包装食品', '加工食品', '포장 식품'),
    (171, 6, 'Cửa hàng thời trang', 'Fashion Shop', '时装店', 'ファッションショップ', '패션 매장'),
    (172, 19, 'Khu ga đi nội địa', 'Domestic Departures', '国内出发', '国内線出発', '국내선 출발'),
    (173, 13, 'Khu nghỉ ngơi', 'Rest Area', '休息区', '休憩エリア', '휴식 공간'),
    (174, 9, 'Phòng y tế', 'Medical Room', '医务室', '医務室', '의무실'),
    (175, 8, 'F&B', 'Food & Beverage', '餐饮', '飲食', '식음료'),
    (176, 20, 'Điểm nối chuyến', 'Transfer Point', '转机点', '乗り継ぎポイント', '환승 지점'),
    (177, 10, 'Văn phòng', 'Office', '办公室', 'オフィス', '사무실'),
    (178, 10, 'Hệ thống băng chuyền hành lý', 'Baggage Conveyor System', '行李传送带', '手荷物コンベヤー', '수하물 컨베이어'),
    (179, 11, 'Cửa hàng bán sản phẩm du lịch', 'Travel Goods', '旅行用品', '旅行用品', '여행 용품'),
    (180, 8, 'Ẩm thực quốc tế', 'Global Food', '国际美食', '多国籍料理', '세계 음식'),
    (181, 10, 'Đường công vụ', 'Service Road', '公务路', '業務用道路', '업무용 도로'),
    (184, 8, 'Quầy đồ ăn nhanh', 'Fast Food', '快餐', 'ファストフード', '패스트푸드'),

    # Food & Beverage
    (79, 8, 'Cà phê', 'Coffee', '咖啡', 'カフェ', '커피'),
    (82, 8, 'Kem', 'Ice Cream', '冰淇淋', 'アイスクリーム', '아이스크림'),
    (81, 8, 'Khu ẩm thực', 'Food Court', '美食广场', 'フードコート', '푸드코트'),
    (83, 8, 'Nhà hàng', 'Restaurant', '餐厅', 'レストラン', '레스토랑'),
    (27, 8, 'Pizza', 'Pizza', '披萨', 'ピザ', '피자'),
    (78, 8, 'Quầy Bar', 'Bar', '酒吧', 'バー', '바'),
    (76, 8, 'Rượu & Đồ uống có cồn', 'Alcohol & Spirits', '酒类', 'アルコール', '주류'),
    (80, 8, 'Thức ăn nhanh', 'Fast Food', '快餐', 'ファストフード', '패스트푸드'),
    (77, 8, 'Tiệm bánh', 'Bakery', '面包店', 'ベーカリー', '베이커리'),
    
    # Shopping
    (122, 11, 'Cửa hàng hoa', 'Flower Shop', '花店', 'フラワーショップ', '꽃집'),
    (111, 11, 'Cửa hàng bán đồ lưu niệm', 'Souvenir Shop', '纪念品店', 'お土産店', '기념품점'),
    (110, 11, 'Cửa hàng miễn thuế', 'Duty Free Shop', '免税店', '免税店', '면세점'),
    (109, 11, 'Cửa hàng tiện lợi', 'Convenience Store', '便利店', 'コンビニ', '편의점'),
    (108, 11, 'Cửa hàng sách', 'Bookstore', '书店', '書店', '서점'),
    
    # Airport Services
    (98, 10, 'Bãi đỗ xe', 'Parking', '停车场', '駐車場', '주차장'),
    (96, 10, 'Bãi đỗ xe máy', 'Motorbike Parking', '摩托车停车场', 'バイク駐輪場', '오토바이 주차장'),
    (87, 10, 'Bãi đỗ xe ô tô', 'Car Parking', '汽车停车场', '車駐車場', '자동차 주차장'),
    (141, 10, 'Cảnh quan', 'Landscape', '景观', 'ランドスケープ', '조경'),
    (142, 10, 'Dịch vụ bưu điện', 'Post Service', '邮政服务', '郵便服务', '우편 서비스'),
    (143, 10, 'Dịch vụ đón tiễn khách', 'Welcome Service', '迎送服务', 'お迎えサービス', '영접 서비스'),
    (104, 10, 'Điểm đón Taxi', 'Taxi Pickup', '出租车乘车点', 'タクシー乗り場', '택시 승차장'),
    (99, 10, 'Điện thoại công cộng', 'Public Phone', '公用电话', '公衆電話', '공중전화'),
    (89, 10, 'Đổi ngoại tệ', 'Currency Exchange', '货币兑换', '両替', '환전'),
    (106, 10, 'Đóng gói hành lý', 'Baggage Wrapping', '行李打包', '手荷物ラッピング', '수하물 포장'),
    (95, 10, 'Hành lý thất lạc', 'Lost & Found', '失物招领', '遺失物取扱所', '분실물 센터'),
    (100, 10, 'Khu chụp ảnh', 'Photo Zone', '拍照区', 'フォトスポット', '포토존'),
    (91, 10, 'Khu triển lãm', 'Exhibition Area', '展览区', '展示エリア', '전시 구역'),
    (140, 10, 'Khu vực nghỉ chờ xe đưa đón khách sạn', 'Hotel Shuttle Waiting', '酒店班车等候区', 'ホテルシャトル待機所', '호텔 셔틀 대기 구역'),
    (94, 10, 'Khu vui chơi trẻ em', 'Kids Zone', '儿童游乐区', 'キッズゾーン', '어린이 놀이터'),
    (85, 10, 'Máy ATM', 'ATM', '自动取款机', 'ATM (現金自動預け払い機)', 'ATM (현금 인출기)'),
    (101, 10, 'Nhà vệ sinh', 'Restroom', '洗手间', 'トイレ', '화장실'),
    (92, 10, 'Nhà vệ sinh gia đình', 'Family Restroom', '家庭卫生间', 'ファミリートイレ', '가족 화장실'),
    (90, 10, 'Nước uống miễn phí', 'Free Drinking Water', '免费饮水', '無料給水', '무료 음수대'),
    (103, 10, 'Phòng hút thuốc', 'Smoking Room', '吸烟室', '喫煙室', '흡연실'),
    (97, 10, 'Phòng mẹ và bé', 'Nursing Room', '母婴室', '授乳室', '수유실'),
    (102, 10, 'Phòng tắm', 'Shower Room', '淋浴间', 'シャワールーム', '샤워실'),
    (107, 10, 'Phòng tập Yoga', 'Yoga Room', '瑜伽室', 'ヨガルーム', '요가실'),
    (105, 10, 'Quầy thông tin du lịch', 'Tourist Information', '旅游信息', '観光案内', '관광 안내'),
    (93, 10, 'Trạm sạc miễn phí', 'Free Charging Station', '免费充电站', '無料充電ステーション', '무료 충전소'),
    (123, 10, 'Trung tâm văn hóa truyền thống', 'Traditional Cultural Center', '传统文化中心', '伝統文化センター', '전통문화센터'),

    # Electronics
    (64, 4, 'Thiết bị điện tử', 'Electronics', '电子设备', '電子機器', '전자기기'),

    # Accessibility
    (57, 1, 'Hỗ trợ người khuyết tật', 'Accessibility', '无障碍设施', 'バリアフリー', '교통약자 지원'),

    # Connections
    (63, 3, 'Cửa khởi hành', 'Gate', '登机口', 'ゲート', '게이트'),
    (61, 3, 'Lối vào', 'Entrance', '入口', '入口', '입구'),
    (62, 3, 'Thang cuốn', 'Escalator', '扶梯', 'エスカレーター', '에스컬레이터'),
    (60, 3, 'Thang máy', 'Elevator', '电梯', 'エレベーター', '엘리베이터'),

    # Beauty
    (58, 2, 'Mỹ phẩm', 'Cosmetics', '化妆品', 'コスメ', '화장품'),
    (59, 2, 'Spa & Massage', 'Spa & Massage', '水疗按摩', 'スパ&マッサージ', '스파&마사지'),

    # Pharmacy
    (84, 9, 'Nhà thuốc', 'Pharmacy', '药房', '薬局', '약국'),

    # Lounges
    (119, 14, 'Phòng chờ ga đi quốc nội', 'Domestic Departure Lounge', '国内出发贵宾室', '国内線出発ラウンジ', '국내선 출발 라운지'),
    (120, 14, 'Phòng chờ ga đi quốc tế', 'International Departure Lounge', '国际出发贵宾室', '国際線出発ラウンジ', '국제선 출발 라운지'),
    (118, 14, 'Phòng chờ hạng thương gia', 'Business Class Lounge', '商务舱贵宾室', 'ビジネスクラスラウンジ', '비즈니스 라운지'),
    (121, 14, 'Phòng chờ visa', 'Visa Lounge', '签证贵宾室', 'ビザラウンジ', '비자 라운지'),

    # Fitness
    (75, 7, 'Phòng tập Gym', 'Gym', '健身房', 'ジム', '헬스장'),

    # Fashion
    (74, 6, 'Đồ ngủ', 'Sleepwear', '睡衣', 'パジャマ', '잠옷'),
    (70, 6, 'Giày dép', 'Footwear', '鞋类', 'シューズ', '신발'),
    (69, 6, 'Mắt kính', 'Eyewear', '眼镜', '眼鏡', '안경'),
    (68, 6, 'Phụ kiện', 'Accessories', '配饰', 'アクセサリー', '액세서리'),
    (73, 6, 'Thời trang cao cấp', 'Luxury Fashion', '高端时尚', 'ラグジュアリーファッション', '럭셔리 패션'),
    (72, 6, 'Trang sức', 'Jewelry', '珠宝', 'ジュエリー', '주얼리'),
    (71, 6, 'Túi xách', 'Handbag', '手袋', 'ハンドバッグ', '핸드백'),

    # Entertainment
    (112, 13, 'Casino', 'Casino', '赌场', 'カジノ', '카지노'),
    (114, 13, 'Ghế massage', 'Massage Chair', '按摩椅', 'マッサージチェア', '마사지 의자'),
    (113, 13, 'Khu trò chơi', 'Gaming Zone', '游戏区', 'ゲームゾーン', '게임존'),
    (140, 13, 'Khu vực nghỉ ngơi', 'Rest Area', '休息区', '休憩エリア', '휴식 공간'),
    (116, 13, 'Phòng cầu nguyện', 'Prayer Room', '祈祷室', '祈祷室', '기도실'),
    (115, 13, 'Rạp chiếu phim', 'Movie Theater', '电影院', '映画館', '영화관'),

    # Arrival Procedures
    (124, 18, 'Đăng ký sinh trắc học', 'Biometric Registration', '生物识别登记', '生体認証登録', '생체 인식 등록'),
    (125, 18, 'Hải quan', 'Customs', '海关', '税関', '세관'),
    (129, 18, 'Hành lý quá khổ', 'Oversized Baggage', '超大行李', '大型手荷物', '대형 수하물'),
    (126, 18, 'Khu ga đến quốc nội', 'Domestic Arrivals', '国内到达', '国内線到着', '국내선 도착'),
    (128, 18, 'Khu ga đến quốc tế', 'International Arrivals', '国际到达', '国際線到着', '국제선 도착'),
    (86, 18, 'Khu vực nhận hành lý', 'Baggage Claim', '行李提取', '手荷物受取所', '수하물 수취'),
    (127, 18, 'Nhập cảnh', 'Immigration', '入境', '入国審査', '입국 심사'),

    # Departure Procedures
    (139, 19, 'An ninh soi chiếu nội địa', 'Domestic Security Screening', '国内安检', '国内線保安検査', '국내선 보안 검색'),
    (135, 19, 'An ninh soi chiếu quốc tế', 'International Security Screening', '国际安检', '国際線保安検査', '국제선 보안 검색'),
    (130, 19, 'Khu ga đi quốc nội', 'Domestic Departures', '国内出发', '国内線出発', '국내선 출발'),
    (133, 19, 'Khu ga đi quốc tế', 'International Departures', '国际出发', '国際線出発', '국제선 출발'),
    (88, 19, 'Khu vực làm thủ tục', 'Check-in Area', '值机区', 'チェックインエリア', '체크인 구역'),
    (132, 19, 'Làn làm thủ tục ưu tiên', 'Priority Check-in Lane', '优先值机通道', '優先チェックインレーン', '우선 체크인 레인'),
    (134, 19, 'Lưu trữ hành lý', 'Luggage Storage', '行李寄存', '手荷物一時預かり', '수하물 보관'),
    (131, 19, 'Xuất cảnh', 'Emigration', '出境', '出国審査', '출국 심사'),

    # Transit Procedures
    (136, 20, 'Nối chuyến Nội địa - Nội địa', 'Domestic to Domestic Transfer', '国内转国内', '国内線乗継', '국내-국내 환승'),
    (137, 20, 'Nối chuyến Nội địa - Quốc tế', 'Domestic to International Transfer', '国内转国际', '国内-国际線乗継', '국내-국제 환승'),
    (138, 20, 'Nối chuyến Quốc tế - Quốc tế', 'International to International Transfer', '国际转国际', '国际線乗継', '국제-국제 환승'),
    (138, 20, 'Nối chuyến Quốc tế - Quốc tế', 'International to International Transfer', '国际转国际', '国际线乗継', '국제-국제 환승'),
]

# ==========================================
# DATA: MANUAL CONNECTIONS (For AreaList)
# ==========================================
# Additional Connections used for labelling elevators/escalators
# We use one representative ID for each physical group to name them in AreaList.
manual_connections = [
    # --- ELEVATORS (Thang máy) ---
    ('c_d5fd1933055221a3', 'Thang máy 1', 'Elevator 1', '电梯 1', 'エレベーター 1', '엘리베이터 1', 60),
    ('c_570f4565a7576a71', 'Thang máy 2', 'Elevator 2', '电梯 2', 'エレベーター 2', '엘리베이터 2', 60),
    ('c_2a9cce244e495262', 'Thang máy 3', 'Elevator 3', '电梯 3', 'エレベーター 3', '엘리베이터 3', 60),
    ('c_08093977b458cf9e', 'Thang máy 4', 'Elevator 4', '电梯 4', 'エレベーター 4', '엘리베이터 4', 60),
    ('c_6140bc948c6dbeb9', 'Thang máy 5', 'Elevator 5', '电梯 5', 'エレベーター 5', '엘리베이터 5', 60),
    ('c_dded2f7fbb748172', 'Thang máy 6', 'Elevator 6', '电梯 6', 'エレベーター 6', '엘리베이터 6', 60),
    ('c_63ac35934627bb0c', 'Thang máy 7', 'Elevator 7', '电梯 7', 'エレベーター 7', '엘리베이터 7', 60),
    ('c_ebd82b533c37ee9e', 'Thang máy 8', 'Elevator 8', '电梯 8', 'エレベーター 8', '엘리베이터 8', 60),
    ('c_e5099e63c0a909ad', 'Thang máy 9', 'Elevator 9', '电梯 9', 'エレベーター 9', '엘리베이터 9', 60),
    ('c_a3ef5d8834130b53', 'Thang máy 10', 'Elevator 10', '电梯 10', 'エレベーター 10', '엘리베이터 10', 60),
    ('c_c9889df116ed99da', 'Thang máy 11', 'Elevator 11', '电梯 11', 'エレベーター 11', '엘리베이터 11', 60),
    ('c_6187df59d3efaf7d', 'Thang máy 12', 'Elevator 12', '电梯 12', 'エレベーター 12', '엘리베이터 12', 60),
    ('c_697daf8041c8c86c', 'Thang máy 13', 'Elevator 13', '电梯 13', 'エレベーター 13', '엘리베이터 13', 60),
    ('c_1fc19515003677c3', 'Thang máy 14', 'Elevator 14', '电梯 14', 'エレベーター 14', '엘리베이터 14', 60),
    ('c_84c71411f270f2b3', 'Thang máy 15', 'Elevator 15', '电梯 15', 'エレベーター 15', '엘리베이터 15', 60),
    ('c_91e3f94690cbedf5', 'Thang máy 16', 'Elevator 16', '电梯 16', 'エレベーター 16', '엘리베이터 16', 60),
    ('c_6d22ee1a5a30b8bb', 'Thang máy 17', 'Elevator 17', '电梯 17', 'エレベーター 17', '엘리베이터 17', 60),
    ('c_64eb10ed6f558f66', 'Thang máy 18', 'Elevator 18', '电梯 18', 'エレベーター 18', '엘리베이터 18', 60),
    ('c_aa132373bf0dc55a', 'Thang máy 19', 'Elevator 19', '电梯 19', 'エレベーター 19', '엘리베이터 19', 60),
    
    # --- ESCALATORS (Thang cuốn - mapping stairs to escalators per user request) ---
    ('c_51224908ba95ba36', 'Thang cuốn 1', 'Escalator 1', '扶梯 1', 'エスカレーター 1', '에스컬레이터 1', 62),
    ('c_50b6cb101302bf84', 'Thang cuốn 2', 'Escalator 2', '扶梯 2', 'エスカレーター 2', '에스컬레이터 2', 62),
    ('c_b20badde3a47f382', 'Thang cuốn 3', 'Escalator 3', '扶梯 3', 'エスカレーター 3', '에스컬레이터 3', 62),
    ('c_a96cd3db2aaaf681', 'Thang cuốn 4', 'Escalator 4', '扶梯 4', 'エスカレーター 4', '에스컬레이터 4', 62),
    ('c_74f0284bbbcf1a8d', 'Thang cuốn 5', 'Escalator 5', '扶梯 5', 'エスカレーター 5', '에스컬레이터 5', 62),
    ('c_4ad1bcb69153b6b7', 'Thang cuốn 6', 'Escalator 6', '扶梯 6', 'エスカレーター 6', '에스컬레이터 6', 62),
    ('c_6e4effaed14574fe', 'Thang cuốn 7', 'Escalator 7', '扶梯 7', 'エスカレーター 7', '에스컬레이터 7', 62),
    ('c_52ca150b96faf3ce', 'Thang cuốn 8', 'Escalator 8', '扶梯 8', 'エスカレーター 8', '에스컬레이터 8', 62),
    ('c_520101982ed1c9fe', 'Thang cuốn 9', 'Escalator 9', '扶梯 9', 'エスカレーター 9', '에스컬레이터 9', 62),
    ('c_2115b521103c313e', 'Thang cuốn 10', 'Escalator 10', '扶梯 10', 'エスカレーター 10', '에스컬레이터 10', 62),
    ('c_b6414068035f4105', 'Thang cuốn 11', 'Escalator 11', '扶梯 11', 'エスカレーター 11', '에스컬레이터 11', 62),
    ('c_38c3b5600948737d', 'Thang cuốn 12', 'Escalator 12', '扶梯 12', 'エスカレーター 12', '에스컬레이터 12', 62),
    ('c_9c4a62c4b375845e', 'Thang cuốn 13', 'Escalator 13', '扶梯 13', 'エスカレーター 13', '에스컬레이터 13', 62),
    ('c_ad2424a620731073', 'Thang cuốn 14', 'Escalator 14', '扶梯 14', 'エスカレーター 14', '에스컬레이터 14', 62),
    ('c_8c53368e9d3a5bb5', 'Thang cuốn 15', 'Escalator 15', '扶梯 15', 'エスカレーター 15', '에스컬레이터 15', 62),
    ('c_2f262858b5a0dd17', 'Thang cuốn 16', 'Escalator 16', '扶梯 16', 'エスカレーター 16', '에스컬레이터 16', 62),
    ('c_990823fcc5faf7bb', 'Thang cuốn 17', 'Escalator 17', '扶梯 17', 'エスカレーター 17', '에스컬레이터 17', 62),
    ('c_c6ba61eb4f997040', 'Thang cuốn 18', 'Escalator 18', '扶梯 18', 'エスカレーター 18', '에스컬레이터 18', 62),
    ('c_57819d6aaf621c2c', 'Thang cuốn 19', 'Escalator 19', '扶梯 19', 'エスカレーター 19', '에스컬레이터 19', 62),
    ('c_ebfa85831e348ae1', 'Thang cuốn 20', 'Escalator 20', '扶梯 20', 'エスカレーター 20', '에스컬레이터 20', 62),
    ('c_483b0ace50cdbc95', 'Thang cuốn 21', 'Escalator 21', '扶梯 21', 'エスカレーター 21', '에스컬레이터 21', 62),
    ('c_3a72f78130e142b6', 'Thang cuốn 22', 'Escalator 22', '扶梯 22', 'エスカレーター 22', '에스컬레이터 22', 62),
    ('c_593fbf839613043a', 'Thang cuốn 23', 'Escalator 23', '扶梯 23', 'エスカレーター 23', '에스컬레이터 23', 62),
]

# ==========================================
# UTIL FUNCTIONS
# ==========================================
def sanitize(s):
    if s is None: return 'NULL'
    s = str(s).replace("'", "''")
    return f"N'{s}'"

def parse_name(full_name):
    pattern = r"^(.*?)\s*\((.*?)\)$"
    match = re.search(pattern, full_name)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return full_name.strip(), full_name.strip()

# ==========================================
# PROCESSING MAP OBJECTS (ALL FLOORS)
# ==========================================
map_objects = []
# Load GF & 1F
try:
    with open('database/raw_gf_1f.json', 'r', encoding='utf-8') as f:
        map_objects.extend(json.load(f))
except Exception as e:
    print(f"Warning: Could not read raw_gf_1f.json: {e}")

# Load 2F & 3F
try:
    with open('database/raw_2f_3f.json', 'r', encoding='utf-8') as f:
        map_objects.extend(json.load(f))
except Exception as e:
    print(f"Warning: Could not read raw_2f_3f.json: {e}")

print(f"Loaded {len(map_objects)} total map objects.")

processed_ids = set()

# ==========================================
# GENERATE SQL
# ==========================================
lines = []
lines.append(f"USE {TARGET_DB}")
lines.append("GO")
lines.append("")

# --- TABLE CREATION (Ensure schema exists) ---
# MasterData_Languages
lines.append("IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MasterData_Languages]') AND type in (N'U'))")
lines.append("BEGIN")
lines.append("CREATE TABLE [dbo].[MasterData_Languages]([LanguageId] [varchar](5) NOT NULL, [LanguageName] [nvarchar](50) NOT NULL, [SortOrder] [int] NOT NULL, [IsActive] [bit] NOT NULL, CONSTRAINT [PK_MasterData_Languages] PRIMARY KEY CLUSTERED ([LanguageId] ASC))")
lines.append("END")
lines.append("GO")

# Translation_UI
lines.append("IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Translation_UI]') AND type in (N'U'))")
lines.append("BEGIN")
lines.append("CREATE TABLE [dbo].[Translation_UI]([UIKeyId] [int] IDENTITY(1,1) NOT NULL, [KeyCode] [varchar](100) NOT NULL, [KeyType] [varchar](50) NULL, [VN] [nvarchar](500) NULL, [EN] [nvarchar](500) NULL, [ZH] [nvarchar](500) NULL, [JA] [nvarchar](500) NULL, [KO] [nvarchar](500) NULL, CONSTRAINT [PK_Translation_UI] PRIMARY KEY CLUSTERED ([UIKeyId] ASC))")
lines.append("END")
lines.append("GO")

# NOTE: Translation_Categories and Translation_SubCategories tables REMOVED in favor of merged schema

# Translation_Floors
lines.append("IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Translation_Floors]') AND type in (N'U'))")
lines.append("BEGIN")
lines.append("CREATE TABLE [dbo].[Translation_Floors]([FloorId] [int] NOT NULL, [MappedinId] [varchar](50) NOT NULL, [FloorCode] [varchar](20) NOT NULL, [SortOrder] [int] NOT NULL, [VN] [nvarchar](100) NULL, [EN] [nvarchar](100) NULL, [ZH] [nvarchar](100) NULL, [JA] [nvarchar](100) NULL, [KO] [nvarchar](100) NULL, CONSTRAINT [PK_Translation_Floors] PRIMARY KEY CLUSTERED ([FloorId] ASC))")
lines.append("END")
lines.append("GO")

# Translation_Locations removed (Logic merged into AreaList)
# Explicitly drop obsolete tables
lines.append("IF OBJECT_ID(N'[dbo].[Translation_Locations]', N'U') IS NOT NULL DROP TABLE [dbo].[Translation_Locations];")
lines.append("GO")
lines.append("IF OBJECT_ID(N'[dbo].[MasterData_UI_Components]', N'U') IS NOT NULL DROP TABLE [dbo].[MasterData_UI_Components];")
lines.append("GO")
lines.append("IF OBJECT_ID(N'[dbo].[Translation_Categories]', N'U') IS NOT NULL DROP TABLE [dbo].[Translation_Categories];")
lines.append("GO")
lines.append("IF OBJECT_ID(N'[dbo].[Translation_SubCategories]', N'U') IS NOT NULL DROP TABLE [dbo].[Translation_SubCategories];")
lines.append("GO")


# NOTE: FK constraints for Translation tables removed (tables dropped)

# --- RE-ORDERED DROP STG ---
# 1. Drop AreaCategory (Child)
lines.append("IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AreaCategory]') AND type in (N'U'))")
lines.append("BEGIN")
lines.append("    DROP TABLE [dbo].[AreaCategory]")
lines.append("END")
lines.append("GO")

# 2. Drop AreaList (Parent)
lines.append("IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AreaList]') AND type in (N'U'))")
lines.append("BEGIN")
lines.append("    DROP TABLE [dbo].[AreaList]")
lines.append("END")
lines.append("GO")

# 3. Create AreaList
lines.append("CREATE TABLE [dbo].[AreaList]([AreaListID] [int] IDENTITY(1,1) NOT NULL, [MappedinID] [nvarchar](100) NOT NULL, [Name] [nvarchar](255) NULL, [VN] [nvarchar](255) NULL, [EN] [nvarchar](255) NULL, [ZH] [nvarchar](255) NULL, [JA] [nvarchar](255) NULL, [KO] [nvarchar](255) NULL, CONSTRAINT [PK_AreaList] PRIMARY KEY CLUSTERED ([AreaListID] ASC))")
lines.append("GO")

# 4. Create AreaCategory
lines.append("CREATE TABLE [dbo].[AreaCategory]([AssignmentID] [int] IDENTITY(1,1) NOT NULL, [AreaListID] [int] NOT NULL, [SubCategoryID] [int] NOT NULL, CONSTRAINT [PK_AreaCategory] PRIMARY KEY CLUSTERED ([AssignmentID] ASC))")
lines.append("GO")
lines.append("ALTER TABLE [dbo].[AreaCategory]  WITH CHECK ADD  CONSTRAINT [FK_AreaCategory_AreaList] FOREIGN KEY([AreaListID])")
lines.append("REFERENCES [dbo].[AreaList] ([AreaListID])")
lines.append("ON DELETE CASCADE")
lines.append("GO")
lines.append("ALTER TABLE [dbo].[AreaCategory] CHECK CONSTRAINT [FK_AreaCategory_AreaList]")
lines.append("GO")

lines.append("")

# --- DATA SEEDING ---
lines.append("-- 1. Seed Languages")
lines.append("DELETE FROM MasterData_Languages;")
for l in languages:
    lines.append(f"INSERT INTO MasterData_Languages (LanguageId, LanguageName, SortOrder, IsActive) VALUES ('{l[0]}', N'{l[1]}', {l[2]}, {l[3]});")
lines.append("")

lines.append("-- 2. Seed UI")
lines.append("DELETE FROM Translation_UI;")
for item in ui_data:
    key, kt, vn, en, zh, ja, ko = item
    lines.append(f"INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('{key}', '{kt}', {sanitize(vn)}, {sanitize(en)}, {sanitize(zh)}, {sanitize(ja)}, {sanitize(ko)});")
lines.append("")

lines.append("-- 3. Seed Floors")
lines.append("DELETE FROM Translation_Floors;")
lines.append("SET IDENTITY_INSERT Translation_Floors ON;")
for item in floors:
    fid, mid, code, order, vn, en, zh, ja, ko = item
    lines.append(f"INSERT INTO Translation_Floors (FloorId, MappedinId, FloorCode, SortOrder, VN, EN, ZH, JA, KO) VALUES ({fid}, '{mid}', '{code}', {order}, {sanitize(vn)}, {sanitize(en)}, {sanitize(zh)}, {sanitize(ja)}, {sanitize(ko)});")
lines.append("SET IDENTITY_INSERT Translation_Floors OFF;")
lines.append("")

# --- SEED CATEGORIES & SUBCATEGORIES (Merged Schema) ---
lines.append("-- 4. Seed Categories (Merged Translations)")

# 4a. Migrate Categories schema: Add EN, ZH, JA, KO if missing (CategoryName is VN)
lines.append("-- 4a. Migrate Categories schema")
for col in ['EN', 'ZH', 'JA', 'KO']:
    lines.append(f"IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Categories]') AND name = '{col}')")
    lines.append("BEGIN")
    lines.append(f"    ALTER TABLE Categories ADD {col} NVARCHAR(255) NULL")
    lines.append("END")
lines.append("GO")

lines.append("DELETE FROM SubCategories;") 
lines.append("DELETE FROM Categories;")
lines.append("")

lines.append("SET IDENTITY_INSERT Categories ON;")
for item in categories:
    cid, vn, en, zh, ja, ko, icon_path = item
    lines.append(f"INSERT INTO Categories (CategoryID, CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES ({cid}, {sanitize(vn)}, {sanitize(en)}, {sanitize(zh)}, {sanitize(ja)}, {sanitize(ko)}, '{icon_path}', 0);")
lines.append("SET IDENTITY_INSERT Categories OFF;")
lines.append("")

lines.append("-- 5. Seed SubCategories (Merged Translations)")
# 5a. Migrate SubCategories schema
lines.append("-- 5a. Migrate SubCategories schema")
for col in ['EN', 'ZH', 'JA', 'KO']:
    lines.append(f"IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SubCategories]') AND name = '{col}')")
    lines.append("BEGIN")
    lines.append(f"    ALTER TABLE SubCategories ADD {col} NVARCHAR(255) NULL")
    lines.append("END")
lines.append("GO")

lines.append("SET IDENTITY_INSERT SubCategories ON;")

cat_id_to_folder = {
    8: "Food&Drink", 11: "Store", 10: "AirportService", 4: "Electronic",
    1: "Accessible", 3: "Connection", 2: "Beauty", 9: "Pharmacy",
    14: "Lounge", 7: "Fitness", 6: "Fashion", 13: "Entertainment",
    18: "ArrivalFlightProcedures", 19: "DepartureFlightProcedures",
    20: "TransitProcedures"
}

sub_icon_overrides = {
    "ATM": "atm.png",
    "Coffee": "coffee.png",
    "Coffee Shop": "coffee.png",
    "Cafe & Bakery": "bakery.png",
    "Bakery": "bakery.png",
    "Bar": "bar.png",
    "Fast Food": "fast-food.png",
    "Food Court": "food-court.png",
    "Ice Cream": "ice-cream.png",
    "Pizza": "pizza.png",
    "Restaurant": "restaurant.png",
    "Alcohol & Spirits": "alcohol.png",
    "Liquor & Tobacco Store": "alcohol.png",
    "Bookstore": "book-shop.png",
    "Convenience Store": "convenience-store.png",
    "Duty Free Shop": "duty-free.png",
    "Flower Shop": "flower-store.png",
    "Souvenir Shop": "souvenir-shop.png",
    "Parking": "parking.png",
    "Motorbike Parking": "motorbike-parking.png",
    "Car Parking": "car-parking.png",
    "Restroom": "restroom.png",
    "Family Restroom": "family-restroom.png",
    "Nursing Room": "nursing-room.png",
    "Smoking Room": "smoking-room.png",
    "Lost & Found": "lost-and-found.png",
    "Tourist Information": "tourist-information.png",
    "Baggage Wrapping": "wrapping-baggage-area.png",
    "Luggage Wrapping": "wrapping-baggage-area.png",
    "Currency Exchange": "currency-exchange.png",
    "Taxi Pickup": "taxi-pickup-area.png",
    "Welcome Service": "welcome-service.png",
    "Post Service": "post-service.png",
    "Free Charging Station": "free-charging-station.png",
    "Free Drinking Water": "drinking-water-area.png",
    "Global Food": "restaurant.png",
    "Fine Dining": "restaurant.png",
    "Local Food": "restaurant.png",
    "Dessert Shop": "ice-cream.png",
    "Packaged Food": "fast-food.png",
    "Gym": "fitness.png"
}

for item in subcategories:
    scid, cid, vn, en, zh, ja, ko = item
    
    # Resolve Icon Path
    folder = cat_id_to_folder.get(cid)
    if en in sub_icon_overrides:
        icon_file = sub_icon_overrides[en]
        if folder:
            icon_path = f"{folder}/{icon_file}"
        else:
            icon_path = icon_file
    else:
        # Fallback to Category-level root icon
        cat_icon = next((c[6] for c in categories if c[0] == cid), "default.png")
        icon_path = cat_icon
        
    lines.append(f"INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES ({scid}, {cid}, {sanitize(vn)}, {sanitize(en)}, {sanitize(zh)}, {sanitize(ja)}, {sanitize(ko)}, '{icon_path}', 0);")
lines.append("SET IDENTITY_INSERT SubCategories OFF;")
lines.append("")

# Drop Translation Tables if they exist (Cleanup)
lines.append("-- 6. Drop obsolete Translation tables")
lines.append("IF OBJECT_ID(N'[dbo].[Translation_Categories]', N'U') IS NOT NULL DROP TABLE [dbo].[Translation_Categories];")
lines.append("IF OBJECT_ID(N'[dbo].[Translation_SubCategories]', N'U') IS NOT NULL DROP TABLE [dbo].[Translation_SubCategories];")
lines.append("")

lines.append("-- 6. Seed AreaList & Assignments (with Schema Migration)")
# Migrate AreaList Schema
lines.append("DELETE FROM AreaList;")
lines.append("")

# Migrate AreaList Schema (Add Description & ImageUrl)
for col in ['VN', 'EN', 'ZH', 'JA', 'KO']:
    lines.append(f"IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AreaList]') AND name = '{col}')")
    lines.append("BEGIN")
    lines.append(f"    ALTER TABLE AreaList ADD {col} NVARCHAR(255) NULL")
    lines.append("END")

# --- 7. Create AreaInformation Table
lines.append("IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AreaInformation]') AND type in (N'U'))")
lines.append("BEGIN")
lines.append("CREATE TABLE [dbo].[AreaInformation]([InformationID] [int] IDENTITY(1,1) NOT NULL, [AreaListID] [int] NOT NULL, [InformationVI] [nvarchar](MAX) NULL, [InformationEN] [nvarchar](MAX) NULL, [InformationZH] [nvarchar](MAX) NULL, [InformationJA] [nvarchar](MAX) NULL, [InformationKO] [nvarchar](MAX) NULL, [ImageUrl] [nvarchar](500) NULL, CONSTRAINT [PK_AreaInformation] PRIMARY KEY CLUSTERED ([InformationID] ASC))")
lines.append("END")
lines.append("GO")

lines.append("ALTER TABLE [dbo].[AreaInformation] WITH CHECK ADD CONSTRAINT [FK_AreaInformation_AreaList] FOREIGN KEY([AreaListID])")
lines.append("REFERENCES [dbo].[AreaList] ([AreaListID])")
lines.append("ON DELETE CASCADE")
lines.append("GO")

# Clear AreaInformation
lines.append("DELETE FROM AreaInformation;")
lines.append("GO")
lines.append("")

# Use IDENTITY_INSERT for AreaList to have explicit control over IDs
lines.append("SET IDENTITY_INSERT AreaList ON;")
area_list_id_counter = 0

for obj in map_objects:
    oid = obj.get('id')
    oname = obj.get('name')
    otype = obj.get('type', 'room')

    if not oid or not oname: continue
    if oid in processed_ids: continue
    
    processed_ids.add(oid)
    
    # Logic: Parse VN (EN)
    vn, en = parse_name(oname)
    
    # Auto-fill others from EN or VN
    zh = en if en else vn
    ja = en if en else vn
    ko = en if en else vn
    
    # AUTO-TAGGING LOGIC
    assigned_cat_id = 'NULL'
    assigned_sub_cat_id = None
    
    search_str = oname.lower()
    
    for sc in subcategories:
        sc_id = sc[0]
        sc_cat_id = sc[1]
        sc_vn = sc[2].lower()
        sc_en = sc[3].lower()
        
        # Check if name contains subcategory name
        if sc_vn in search_str or sc_en in search_str:
            assigned_cat_id = sc_cat_id
            assigned_sub_cat_id = sc_id
            
            # Improve translation: Use Subcategory translations if available
            # (Fixes issue where ZH/JA/KO were just defaulting to EN)
            if len(sc) >= 7:
                zh = sc[4]
                ja = sc[5]
                ko = sc[6]
                
                # PRESERVE NUMBERS (User request: Gate 1 -> Gate 1, not just Gate)
                # Regex matches: "135", "5A", "B12"
                num_match = re.search(r'\b([A-Za-z]?\d+[A-Za-z]?)\b', oname)
                if not num_match:
                     # Try simpler search if word boundary fails
                     num_match = re.search(r'(\d+[A-Z]?)$', oname)
                     
                if num_match:
                    nstr = num_match.group(1)
                    # Use extracted number if it has digits
                    if any(c.isdigit() for c in nstr):
                        # Append if not present
                        if nstr not in zh: zh = f"{zh} {nstr}"
                        if nstr not in ja: ja = f"{ja} {nstr}"
                        if nstr not in ko: ko = f"{ko} {nstr}"
            
            break
            
    # DUMMY RICH CONTENT LOGIC (Populate AreaInformation)
    desc_vi = 'NULL'
    desc_en = 'NULL'
    desc_zh = 'NULL'
    desc_ja = 'NULL'
    desc_ko = 'NULL'
    img_url = 'NULL'
    
    # Simple keyword mapping for demo - VIETNAMESE SOURCE (as requested)
    lower_en = en.lower()
    if 'food' in lower_en or 'restaurant' in lower_en or 'coffee' in lower_en:
        raw_vi = f"Thưởng thức các món ăn ngon và đồ uống tại {vn}.\\nVị trí thuận tiện cho hành khách."
        desc_vi = sanitize(raw_vi)
        # Fake translations
        desc_en = sanitize(f"Enjoy delicious meals and drinks at {en}.\\nConvenient location for passengers.")
        desc_zh = sanitize(f"在 {zh} 享用美味的餐点和饮料。\\n方便旅客的位置。")
        desc_ja = sanitize(f"{ja} で美味しい食事と飲み物をお楽しみください。\\n乗客に便利な場所。")
        desc_ko = sanitize(f"{ko} 에서 맛있는 식사와 음료를 즐기세요.\\n승객에게 편리한 위치.")
        img_url = "'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop'"
    elif 'shop' in lower_en or 'store' in lower_en or 'duty free' in lower_en:
        raw_vi = f"Khám phá nhiều loại sản phẩm tại {vn}.\\nNhiều ưu đãi hấp dẫn đang chờ bạn."
        desc_vi = sanitize(raw_vi)
        desc_en = sanitize(f"Discover a wide range of products at {en}.\\nAttractive offers await you.")
        desc_zh = sanitize(f"在 {zh} 发现各种产品。\\n诱人的优惠等着您。")
        desc_ja = sanitize(f"{ja} で幅広い製品をご覧ください。\\n魅力的なオファーがあなたを待っています。")
        desc_ko = sanitize(f"{ko} 에서 다양한 제품을 만나보세요.\\n매력적인 혜택이 기다리고 있습니다.")
        img_url = "'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop'"
    elif 'lounge' in lower_en:
        raw_vi = f"Thư giãn thoải mái tại {vn}.\\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi."
        desc_vi = sanitize(raw_vi)
        desc_en = sanitize(f"Relax in comfort at {en}.\\nAmenities include snacks, drinks, and Wi-Fi.")
        desc_zh = sanitize(f"在 {zh} 舒适放松。\\n设施包括小吃、饮料和 Wi-Fi。")
        desc_ja = sanitize(f"{ja} で快適にリラックス。\\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。")
        desc_ko = sanitize(f"{ko} 에서 편안하게 휴식하세요.\\n간식, 음료 및 Wi-Fi가 제공됩니다.")
        img_url = "'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop'" 
    elif 'restroom' in lower_en:
        img_url = "'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop'"

    # Insert AreaList (No desc/img)
    area_list_id_counter += 1
    lines.append(f"INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES ({area_list_id_counter}, '{oid}', {sanitize(vn)}, {sanitize(vn)}, {sanitize(en)}, {sanitize(zh)}, {sanitize(ja)}, {sanitize(ko)});")
    
    # Insert AreaInformation (Only if there is content)
    if desc_vi != 'NULL' or img_url != 'NULL':
        lines.append(f"INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES ({area_list_id_counter}, {desc_vi}, {desc_en}, {desc_zh}, {desc_ja}, {desc_ko}, {img_url});")
    
    # Insert AreaCategory Assignment if found
    if assigned_sub_cat_id:
        lines.append(f"INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES ({area_list_id_counter}, {assigned_sub_cat_id});")

# 7. Seed Manual Connections
lines.append("-- 7. Seed Manual Connections")
for conn in manual_connections:
    mid, vn, en, zh, ja, ko, scid = conn
    if mid in processed_ids: continue
    processed_ids.add(mid)
    
    area_list_id_counter += 1
    lines.append(f"INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES ({area_list_id_counter}, '{mid}', {sanitize(vn)}, {sanitize(vn)}, {sanitize(en)}, {sanitize(zh)}, {sanitize(ja)}, {sanitize(ko)});")
    lines.append(f"INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES ({area_list_id_counter}, {scid});")

# Close IDENTITY_INSERT for AreaList
lines.append("SET IDENTITY_INSERT AreaList OFF;")
lines.append("GO")

with open(OUTPUT_FILE, 'w', encoding='utf-8-sig') as f:
    f.write('\n'.join(lines))

print(f"SUCCESS: Generated {OUTPUT_FILE} with {len(lines)} lines.")
