export const tutorialSteps = {
  mobile: [
    {
      id: 'mobile-map-overview',
      title: 'Làm quen bản đồ',
      description: 'Chào mừng bạn đến với Bản đồ 3D! Hãy thử dùng 1 ngón tay vuốt nhẹ để di chuyển bản đồ, hoặc chụm/mở 2 ngón để phóng to, thu nhỏ và khám phá toàn cảnh sân bay nhé.',
      image: '/tutorial/mobile/01-map-overview.svg',
      targetSelector: '#mappedin-map',
      placement: 'center'
    },
    {
      id: 'mobile-search',
      title: 'Tìm kiếm nhanh',
      description: 'Bạn muốn đi đâu? Chỉ cần nhập tên cửa hàng, quầy thủ tục hoặc dịch vụ vào ô này. Chạm vào kết quả và bản đồ sẽ tự động xoay và di chuyển mượt mà đưa bạn tới vị trí đó ngay lập tức.',
      image: '/tutorial/mobile/02-search.svg',
      targetSelector: '.modern-search-wrapper',
      placement: 'bottom'
    },
    {
      id: 'mobile-category-toggle',
      title: 'Mở nhanh danh mục',
      description: 'Khám phá thêm bằng cách chạm vào nút mũi tên nhỏ ở góc ô tìm kiếm để mở hoặc đóng nhanh danh sách dịch vụ đa dạng trên tầng hiện tại.',
      image: '/tutorial/mobile/03-category-toggle.svg',
      targetSelector: '#mobile-category-toggle',
      placement: 'bottom'
    },
    {
      id: 'mobile-category-list',
      title: 'Khám phá dịch vụ',
      description: 'Từ Ăn uống, Mua sắm đến Nhà thuốc hay Thư giãn... Chỉ một chạm vào danh mục, tất cả các địa điểm liên quan sẽ hiển thị rõ ràng trên bản đồ để bạn tha hồ lựa chọn.',
      image: '/tutorial/mobile/04-category-list.svg',
      targetSelector: '#category-section',
      placement: 'bottom'
    },
    {
      id: 'mobile-floor',
      title: 'Chuyển tầng dễ dàng',
      description: 'Sân bay có nhiều tầng? Đừng lo, hãy chạm nút chọn tầng ở góc dưới này để dễ dàng chuyển qua lại giữa các tầng hoặc xem toàn cảnh 3D của nhà ga.',
      image: '/tutorial/mobile/05-floor-language.svg',
      targetSelector: '#custom-floor-wrapper',
      placement: 'top'
    },
    {
      id: 'mobile-language',
      title: 'Ngôn ngữ toàn cầu',
      description: 'Bản đồ hỗ trợ đa ngôn ngữ! Bạn có thể chuyển đổi nhanh chóng sang Tiếng Việt, Tiếng Anh, Trung, Nhật, Hàn... để việc tìm đường và tra cứu thuận tiện nhất.',
      image: '/tutorial/mobile/05-floor-language.svg',
      targetSelector: '#custom-lang-wrapper',
      placement: 'top'
    },
    {
      id: 'mobile-theme',
      title: 'Giao diện bản đồ',
      description: 'Cá nhân hóa trải nghiệm với 4 tông màu độc đáo: Cổ điển tinh tế, Rực rỡ năng động, Xanh đêm dịu mắt hay Biển xanh mát mẻ để tối ưu tầm nhìn của bạn.',
      image: '/tutorial/mobile/06-theme-brightness.svg',
      targetSelectors: ['#theme-selector-wrapper'],
      placement: 'bottom'
    },
    {
      id: 'mobile-brightness',
      title: 'Chế độ bảo vệ mắt',
      description: 'Dễ dàng điều chỉnh độ sáng bản đồ bằng thanh trượt hoặc nút cộng/trừ (+/-) để mắt bạn luôn dễ chịu dù ở trong nhà ga hay dưới trời nắng.',
      image: '/tutorial/mobile/06-theme-brightness.svg',
      targetSelectors: ['#brightness-selector-wrapper'],
      placement: 'bottom'
    },
    {
      id: 'mobile-wayfinding-entry',
      title: 'Bắt đầu chỉ đường',
      description: 'Cần tìm đường đi ngắn nhất? Hãy chạm vào tab "Chỉ đường" để bắt đầu thiết lập lộ trình di chuyển thông minh và tối ưu nhất của riêng bạn.',
      image: '/tutorial/mobile/07-wayfinding-entry.svg',
      targetSelector: '#tab-directions',
      placement: 'bottom'
    },
    {
      id: 'mobile-wayfinding-points',
      title: 'Lập lộ trình linh hoạt',
      description: 'Chỉ cần chọn điểm xuất phát và điểm đến mong muốn. Bạn cũng có thể thêm các điểm dừng chân trung gian (như quầy nước, nhà vệ sinh) trên đường đi.',
      image: '/tutorial/mobile/08-wayfinding-route.svg',
      targetSelector: '#wayfinding-header-target',
      placement: 'bottom'
    },
    {
      id: 'mobile-wayfinding-route',
      title: 'Chỉ dẫn chi tiết',
      description: 'Tuyến đường tối ưu sẽ được vẽ trực quan trên bản đồ 3D kèm danh sách chỉ dẫn chi tiết từng bước, giúp bạn di chuyển cực kỳ tự tin và thong thả.',
      image: '/tutorial/mobile/08-wayfinding-route.svg',
      targetSelector: '#instructions-list',
      placement: 'center'
    },
    {
      id: 'mobile-location-detail',
      title: 'Thông tin địa điểm',
      description: 'Chạm vào bất kỳ vị trí hay biểu tượng nào trên bản đồ để xem ngay hình ảnh thực tế, mô tả chi tiết, giờ hoạt động và nhanh chóng nhấn "Chỉ đường đến" hoặc "Đi từ đây".',
      image: '/tutorial/mobile/09-location-detail.svg',
      targetSelector: '#sidebar-info-panel',
      placement: 'center'
    },
    {
      id: 'mobile-flight-info',
      title: 'Tra cứu chuyến bay',
      description: 'Theo dõi lịch trình bay trực tiếp! Nhấn biểu tượng máy bay để tìm chuyến bay, sau đó nhấp vào Cổng bay hoặc Băng chuyền hành lý để bản đồ vẽ đường đi đón/tiễn ngay lập tức.',
      image: '/tutorial/mobile/10-flight-info.svg',
      targetSelector: '#btn-open-flight-info',
      placement: 'left'
    },
    {
      id: 'mobile-map-controls',
      title: 'Tiện ích bản đồ',
      description: 'Tận dụng các phím tắt nhanh ở rìa phải để bật/tắt toàn màn hình, phóng to, thu nhỏ hoặc nhấn biểu tượng Ngôi nhà để nhanh chóng đưa bản đồ về góc nhìn mặc định.',
      image: '/tutorial/mobile/11-map-gestures.svg',
      targetSelector: '#camera-controls',
      placement: 'left'
    },
    {
      id: 'mobile-finish',
      title: 'Trải nghiệm ngay!',
      description: 'Tuyệt vời! Bạn đã nắm rõ cách sử dụng bản đồ 3D Long Thành. Nếu cần xem lại hướng dẫn này, hãy nhấn vào nút chữ (i) bất kỳ lúc nào nhé. Chúc bạn có hành trình tuyệt vời!',
      image: '/tutorial/mobile/12-finish.svg',
      targetSelector: '#btn-user-guide',
      placement: 'left'
    }
  ],
  desktop: [
    {
      id: 'desktop-layout-overview',
      title: 'Tổng quan giao diện',
      description: 'Chào mừng bạn đến với Bản đồ 3D! Giao diện được tối ưu với Sidebar bên trái giúp bạn tìm kiếm, chọn dịch vụ và dẫn đường; kết hợp Bản đồ tương tác toàn cảnh ở bên phải.',
      image: '/tutorial/desktop/01-layout-overview.svg',
      targetSelectors: ['#main-sidebar-left', '#mappedin-map'],
      placement: 'center'
    },
    {
      id: 'desktop-map-buttons',
      title: 'Thanh công cụ nhanh',
      description: 'Sử dụng các phím tắt nhanh ở rìa phải để tra cứu chuyến bay trực tiếp, mở lại hướng dẫn này, chuyển chế độ toàn màn hình, phóng to/thu nhỏ hoặc quay lại góc nhìn mặc định.',
      image: '/tutorial/desktop/10-map-controls.svg',
      targetSelectors: ['#camera-actions'],
      highlightPadding: 14,
      placement: 'left'
    },
    {
      id: 'desktop-map-rotation',
      title: 'Tương tác Bản đồ 3D',
      description: 'Kéo chuột trái để di chuyển, cuộn chuột để phóng to/thu nhỏ. Đặc biệt, hãy giữ chuột phải và kéo (hoặc dùng cụm nút D-pad ở góc dưới) để xoay và nghiêng bản đồ cực kỳ mượt mà.',
      image: '/tutorial/desktop/10-map-controls.svg',
      targetSelectors: ['#nav-cross-container'],
      highlightPadding: 12,
      placement: 'left'
    },
    {
      id: 'desktop-search',
      title: 'Tìm kiếm nhanh chóng',
      description: 'Chỉ cần nhập tên cửa hàng, quầy thủ tục hoặc dịch vụ vào ô tìm kiếm. Click chọn kết quả và bản đồ sẽ tự động xoay và di chuyển mượt mà đưa bạn tới tận nơi.',
      image: '/tutorial/desktop/02-search-sidebar.svg',
      targetSelector: '.modern-search-wrapper',
      placement: 'right'
    },
    {
      id: 'desktop-category',
      title: 'Khám phá theo danh mục',
      description: 'Dễ dàng duyệt nhanh các dịch vụ hàng đầu sân bay như Ăn uống, Mua sắm, Nhà thuốc... Click vào nhóm dịch vụ để xem danh sách và vị trí của chúng trên tầng hiện tại.',
      image: '/tutorial/desktop/03-categories.svg',
      targetSelector: '#category-section',
      placement: 'right'
    },
    {
      id: 'desktop-floor',
      title: 'Chuyển đổi tầng 3D',
      description: 'Chạm vào menu này để chuyển đổi góc nhìn giữa các tầng của nhà ga (Tầng trệt, Tầng 1, Tầng 2, Tầng 3) hoặc quay về chế độ xem Toàn cảnh sân bay.',
      image: '/tutorial/desktop/04-floor-language-theme.svg',
      targetSelector: '#custom-floor-wrapper',
      placement: 'bottom'
    },
    {
      id: 'desktop-language',
      title: 'Đa ngôn ngữ tiện lợi',
      description: 'Bản đồ hỗ trợ nhiều ngôn ngữ phổ biến (Tiếng Việt, English, 中文, 日本語, 한국어). Hệ thống sẽ tự động đồng bộ toàn bộ tên địa điểm và chỉ đường sang ngôn ngữ bạn chọn.',
      image: '/tutorial/desktop/04-floor-language-theme.svg',
      targetSelector: '#custom-lang-wrapper',
      placement: 'bottom'
    },
    {
      id: 'desktop-theme',
      title: 'Phong cách hiển thị',
      description: 'Lựa chọn 1 trong 4 chủ đề màu sắc được thiết kế riêng: Cổ điển sang trọng, Rực rỡ sắc nét, Xanh đêm êm dịu hay Biển xanh mát mắt để tối ưu hóa khả năng quan sát.',
      image: '/tutorial/desktop/04-floor-language-theme.svg',
      targetSelectors: ['#theme-selector-wrapper'],
      placement: 'bottom'
    },
    {
      id: 'desktop-brightness',
      title: 'Điều tiết độ sáng',
      description: 'Kéo thanh trượt hoặc dùng phím cộng/trừ (+/-) để tăng/giảm độ sáng của bản đồ, giúp chống lóa và bảo vệ mắt bạn tốt nhất trong mọi môi trường ánh sáng.',
      image: '/tutorial/desktop/05-brightness.svg',
      targetSelectors: ['#brightness-selector-wrapper'],
      placement: 'bottom'
    },
    {
      id: 'desktop-wayfinding',
      title: 'Thiết lập dẫn đường',
      description: 'Mở tab "Chỉ đường" để lập lộ trình di chuyển tối ưu. Bạn có thể chọn điểm xuất phát, điểm đến và tự do thêm các điểm dừng chân mong muốn trên đường đi.',
      image: '/tutorial/desktop/06-wayfinding.svg',
      targetSelector: '#tab-directions',
      placement: 'right'
    },
    {
      id: 'desktop-route-detail',
      title: 'Chỉ dẫn lộ trình chi tiết',
      description: 'Hệ thống sẽ vẽ tuyến đường trực quan nhất trên bản đồ 3D và hiển thị hướng dẫn chi tiết từng bước đi, khoảng cách, rẽ hướng và các vị trí thang máy/thang cuốn để bạn di chuyển.',
      image: '/tutorial/desktop/07-route-detail.svg',
      targetSelector: '#instructions-list',
      placement: 'right'
    },
    {
      id: 'desktop-location-detail',
      title: 'Xem chi tiết địa điểm',
      description: 'Nhấp chuột vào bất kỳ gian hàng hoặc khu vực nào trên bản đồ để xem ngay hình ảnh thực tế, mô tả chi tiết, giờ hoạt động và nhanh chóng nhấn nút "Chỉ đường đến" hoặc "Đi từ đây".',
      image: '/tutorial/desktop/08-location-detail.svg',
      targetSelector: '#sidebar-info-panel',
      placement: 'right'
    },
    {
      id: 'desktop-flight-info',
      title: 'Bảng thông tin chuyến bay',
      description: 'Theo dõi trạng thái bay trực tiếp! Click nút máy bay để tra cứu chuyến bay của bạn, sau đó nhấp vào Quầy check-in, Cổng bay hoặc Băng chuyền hành lý để bản đồ vẽ đường đi ngay lập tức.',
      image: '/tutorial/desktop/09-flight-info.svg',
      targetSelector: '#btn-open-flight-info',
      placement: 'left'
    },
    {
      id: 'desktop-finish',
      title: 'Trải nghiệm bản đồ ngay!',
      description: 'Tuyệt vời! Bạn đã sẵn sàng tự do khám phá và sử dụng Bản đồ 3D Sân bay Long Thành. Nếu cần xem lại hướng dẫn này, hãy click biểu tượng chữ (i) ở thanh công cụ bên phải nhé. Chúc hành trình của bạn trọn vẹn!',
      image: '/tutorial/desktop/11-finish.svg',
      targetSelector: '#btn-user-guide',
      placement: 'left'
    }
  ]
};
