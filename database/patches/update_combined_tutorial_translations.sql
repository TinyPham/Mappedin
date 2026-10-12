-- Current combined tutorial copy for seven mobile/desktop steps.
-- Safe to rerun: update these 14 keys or insert them when missing.
-- Run after dbo.Translation_UI exists; all language values are Unicode literals.
SET NOCOUNT ON;

MERGE dbo.Translation_UI WITH (HOLDLOCK) AS target
USING (VALUES
  ('guide_title_mobile_search_explore_theme', 'title',
   N'Tìm kiếm, khám phá danh mục và phong cách hiển thị',
   N'Search, browse categories and adjust the display',
   N'搜索、浏览分类与调整显示',
   N'検索・サービス分類・表示の調整',
   N'검색, 서비스 카테고리 및 화면 설정'),

  ('guide_desc_mobile_search_explore_theme', 'label',
   N'Nhập tên cửa hàng hoặc khu vực vào ô tìm kiếm; nhấn mũi tên để mở danh mục dịch vụ. Nhấn nút Cài đặt bên cạnh để chọn chủ đề màu sắc và kéo thanh trượt điều chỉnh độ sáng.',
   N'Enter a shop or area name in the search box. Tap the arrow to open service categories. Tap the Settings button beside it to choose one of six color themes, then drag the slider to adjust brightness.',
   N'在搜索框中输入商店或区域名称。点击箭头展开服务分类。点击旁边的“设置”按钮，从6种配色主题中选择一种，并拖动滑块调整亮度。',
   N'検索欄に店舗名やエリア名を入力します。矢印をタップするとサービス分類が開きます。隣の「設定」ボタンで6つのカラーテーマから選び、スライダーで明るさを調整できます。',
   N'검색창에 매장이나 구역 이름을 입력하세요. 화살표를 누르면 서비스 카테고리가 열립니다. 옆의 설정 버튼에서 6가지 색상 테마 중 하나를 선택하고 슬라이더를 끌어 밝기를 조절하세요.'),

  ('guide_title_mobile_floor_language', 'title',
   N'Chuyển tầng 3D và ngôn ngữ',
   N'Switch 3D map floors and language',
   N'切换3D地图楼层与语言',
   N'3Dマップのフロアと言語の切り替え',
   N'3D 지도 층 및 언어 변경'),

  ('guide_desc_mobile_floor_language', 'label',
   N'Dễ dàng chuyển đổi qua lại giữa các tầng nhà ga và tuỳ chọn ngôn ngữ hiển thị (Tiếng Việt, Anh, Hàn, Nhật...) để việc tra cứu thuận tiện nhất.',
   N'Switch between terminal floors and choose your display language, such as Vietnamese, English, Korean or Japanese, to make the map easier to use.',
   N'切换航站楼楼层，并选择显示语言，如越南语、英语、韩语或日语，让地图查询更方便。',
   N'ターミナルのフロアを切り替え、ベトナム語・英語・韓国語・日本語などの表示言語を選ぶと、マップをより便利に使えます。',
   N'터미널 층을 전환하고 베트남어, 영어, 한국어, 일본어 등 원하는 표시 언어를 선택해 지도를 편리하게 이용하세요.'),

  ('guide_title_mobile_wayfinding_combined', 'title',
   N'Thiết lập dẫn đường và chỉ dẫn lộ trình',
   N'Plan your route and follow directions',
   N'规划路线与查看导航指引',
   N'経路の設定と道順の確認',
   N'경로 설정 및 길 안내'),

  ('guide_desc_mobile_wayfinding_combined', 'label',
   N'Chạm vào tab "Chỉ đường" để thiết lập lộ trình đi. Bạn có thể chọn điểm xuất phát, điểm đến và thêm các điểm dừng chân trung gian. Tuyến đường tối ưu sẽ được vẽ trực quan trên bản đồ 3D.',
   N'Tap the Directions tab to plan your route. Choose a starting point and destination, and add stopovers along the way. The best route will appear on the 3D map.',
   N'点击“路线”选项卡规划行程。选择起点和目的地，并可添加途经点。最佳路线将显示在3D地图上。',
   N'「ルート」タブで経路を設定します。出発地と目的地を選び、途中の経由地も追加できます。最適な経路が3Dマップに表示されます。',
   N'길찾기 탭을 눌러 경로를 설정하세요. 출발지와 목적지를 선택하고 중간 경유지를 추가할 수 있습니다. 최적의 경로가 3D 지도에 표시됩니다.'),

  ('guide_title_desktop_search', 'title',
   N'Tìm kiếm và khám phá theo danh mục',
   N'Search and browse service categories',
   N'搜索与浏览服务分类',
   N'検索とサービス分類の閲覧',
   N'검색 및 서비스 카테고리 탐색'),

  ('guide_desc_desktop_search', 'label',
   N'Chỉ cần nhập tên cửa hàng, quầy thủ tục vào ô tìm kiếm, hoặc dễ dàng duyệt nhanh các nhóm dịch vụ hàng đầu (Ăn uống, Mua sắm...) để xem danh sách và vị trí của chúng. Bản đồ sẽ tự động xoay và di chuyển mượt mà đưa bạn tới tận nơi.',
   N'Enter a shop or check-in counter name in the search box, or browse service categories such as Dining and Shopping to see locations and listings. The map automatically rotates and moves to the selected location.',
   N'在搜索框中输入商店或值机柜台名称，或浏览餐饮、购物等服务分类，查看地点列表及位置。地图会自动旋转并移动到所选地点。',
   N'検索欄に店舗名やチェックインカウンター名を入力するか、飲食・ショッピングなどのサービス分類で一覧と場所を確認します。マップが自動で回転・移動し、選んだ場所を表示します。',
   N'검색창에 매장이나 체크인 카운터 이름을 입력하거나 식음료, 쇼핑 등의 서비스 카테고리에서 목록과 위치를 확인하세요. 지도가 자동으로 회전하고 이동하여 선택한 장소를 보여줍니다.'),

  ('guide_title_desktop_floor', 'title',
   N'Chuyển đổi tầng và đa ngôn ngữ',
   N'Switch floors and language',
   N'切换楼层与语言',
   N'フロアと言語の切り替え',
   N'층 및 언어 변경'),

  ('guide_desc_desktop_floor', 'label',
   N'Chạm vào menu ở góc trái để chuyển đổi góc nhìn giữa các tầng của nhà ga, hoặc nhấp vào menu ở góc phải để tự động đồng bộ hệ thống sang ngôn ngữ bạn chọn (Tiếng Việt, English...).',
   N'Use the menu in the left corner to switch between terminal floors. Use the menu in the right corner to change the interface language, such as Vietnamese or English.',
   N'使用左侧角落的菜单切换航站楼楼层。使用右侧角落的菜单选择越南语、英语等界面语言，系统会自动切换。',
   N'左側の隅にあるメニューでターミナルのフロアを切り替えます。右側の隅にあるメニューでベトナム語・英語などを選ぶと、画面全体の表示言語が切り替わります。',
   N'왼쪽 모서리의 메뉴에서 터미널 층을 전환하세요. 오른쪽 모서리의 메뉴에서 베트남어, 영어 등 원하는 언어를 선택하면 전체 화면의 표시 언어가 변경됩니다.'),

  ('guide_title_desktop_theme', 'title',
   N'Chủ đề và độ sáng hiển thị',
   N'Display theme and brightness',
   N'显示主题与亮度',
   N'表示テーマと明るさ',
   N'화면 테마 및 밝기'),

  ('guide_desc_desktop_theme', 'label',
   N'Tuỳ chỉnh cá nhân hoá trải nghiệm bản đồ bằng cách mở menu Cài đặt. Lựa chọn 1 trong 6 chủ đề màu sắc được thiết kế riêng và kéo thanh trượt điều chỉnh độ sáng để bảo vệ mắt bạn tốt nhất trong mọi môi trường ánh sáng.',
   N'Open Settings to customize the map display. Choose one of six color themes and drag the slider to adjust brightness for comfortable viewing in any lighting.',
   N'打开“设置”菜单，自定义地图显示。从6种配色主题中选择一种，并拖动滑块调整亮度，让不同光线下的观看更舒适。',
   N'「設定」メニューでマップの表示を調整できます。6つのカラーテーマから選び、スライダーで明るさを調整して、周囲の明るさに合わせた見やすい表示にしましょう。',
   N'설정 메뉴에서 지도 화면을 원하는 대로 조정하세요. 6가지 색상 테마 중 하나를 선택하고 슬라이더를 끌어 밝기를 조절하면 주변 조명에 맞춰 편안하게 볼 수 있습니다.'),

  ('guide_title_desktop_wayfinding', 'title',
   N'Thiết lập dẫn đường và chỉ dẫn lộ trình',
   N'Plan your route and follow directions',
   N'规划路线与查看导航指引',
   N'経路の設定と道順の確認',
   N'경로 설정 및 길 안내'),

  ('guide_desc_desktop_wayfinding', 'label',
   N'Mở tab "Chỉ đường" để lập lộ trình đi. Hãy nhấp vào ô "Đi từ" để chọn điểm xuất phát và "Đi đến" cho đích đến. Hệ thống sẽ vẽ tuyến đường trên bản đồ 3D và hiển thị bảng chỉ dẫn lộ trình chi tiết từng bước, khoảng cách và các vị trí thang máy bên dưới.',
   N'Open the Directions tab to plan your route. Select your starting point in From and your destination in To, and add stopovers if needed. The route appears on the 3D map, with step-by-step directions, distances and elevator locations below.',
   N'打开“路线”选项卡规划行程。在“从”栏选择起点，在“到”栏选择目的地，并可按需添加途经点。路线将显示在3D地图上，下方列出逐步指引、距离和电梯位置。',
   N'「ルート」タブで経路を設定します。「出発地」と「目的地」を選び、必要に応じて経由地を追加します。経路が3Dマップに表示され、その下で各区間の道順、距離、エレベーターの位置を確認できます。',
   N'길찾기 탭에서 경로를 설정하세요. 출발지와 목적지 입력란에서 장소를 선택하고 필요하면 경유지를 추가하세요. 경로가 3D 지도에 표시되며, 아래에서 단계별 안내, 거리 및 엘리베이터 위치를 확인할 수 있습니다.')
) AS source (KeyCode, KeyType, VN, EN, ZH, JA, KO)
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN
  UPDATE SET VN = source.VN, EN = source.EN,
             ZH = source.ZH, JA = source.JA, KO = source.KO
WHEN NOT MATCHED BY TARGET THEN
  INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
  VALUES (source.KeyCode, source.KeyType, source.VN, source.EN,
          source.ZH, source.JA, source.KO);
