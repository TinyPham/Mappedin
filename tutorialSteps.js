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
      id: 'mobile-search-explore-theme',
      title: 'Tìm kiếm, khám phá danh mục và phong cách hiển thị',
      description: 'Tại thanh công cụ này, bạn có thể dễ dàng tìm kiếm địa điểm, mở nhanh danh sách các dịch vụ tiện ích, đồng thời tuỳ chỉnh giao diện bản đồ và độ sáng bảo vệ mắt bằng nút cài đặt bên cạnh.',
      image: '/tutorial/mobile/02-search.svg',
      targetSelector: '#search-tab-header',
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
      id: 'mobile-floor-language',
      title: 'Chuyển tầng 3D và ngôn ngữ',
      description: 'Dễ dàng chuyển đổi qua lại giữa các tầng nhà ga và tuỳ chọn ngôn ngữ hiển thị (Tiếng Việt, Anh, Hàn, Nhật...) để việc tra cứu thuận tiện nhất.',
      image: '/tutorial/mobile/05-floor-language.svg',
      targetSelectors: ['#custom-floor-wrapper', '#custom-lang-wrapper'],
      placement: 'top'
    },
    {
      id: 'mobile-wayfinding-combined',
      title: 'Thiết lập dẫn đường và chỉ dẫn lộ trình',
      description: 'Chạm vào tab "Chỉ đường" để thiết lập lộ trình đi. Bạn có thể chọn điểm xuất phát, điểm đến và thêm các điểm dừng chân trung gian. Tuyến đường tối ưu sẽ được vẽ trực quan trên bản đồ 3D.',
      image: '/tutorial/mobile/07-wayfinding-entry.svg',
      targetSelectors: ['#tab-directions', '#wayfinding-header-target'],
      placement: 'bottom'
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
      targetSelectors: ['#main-sidebar-left'],
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
      title: 'Tìm kiếm và khám phá theo danh mục',
      description: 'Chỉ cần nhập tên cửa hàng, quầy thủ tục vào ô tìm kiếm, hoặc dễ dàng duyệt nhanh các nhóm dịch vụ hàng đầu (Ăn uống, Mua sắm...) để xem danh sách và vị trí của chúng. Bản đồ sẽ tự động xoay và di chuyển mượt mà đưa bạn tới tận nơi.',
      image: '/tutorial/desktop/02-search-sidebar.svg',
      targetSelectors: ['.modern-search-wrapper', '#category-section'],
      mergeHighlight: true,
      placement: 'right'
    },
    {
      id: 'desktop-wayfinding',
      title: 'Thiết lập dẫn đường và chỉ dẫn lộ trình',
      description: 'Mở tab "Chỉ đường" để lập lộ trình đi. Hãy nhấp vào ô "Đi từ" để chọn điểm xuất phát và "Đi đến" cho đích đến. Hệ thống sẽ vẽ tuyến đường trên bản đồ 3D và hiển thị bảng chỉ dẫn lộ trình chi tiết từng bước, khoảng cách và các vị trí thang máy bên dưới.',
      image: '/tutorial/desktop/06-wayfinding.svg',
      targetSelectors: ['#tab-directions', '#wayfinding-header-target'],
      autoSwitchTab: 'directions',
      placement: 'right'
    },
    {
      id: 'desktop-floor',
      title: 'Chuyển đổi tầng và đa ngôn ngữ',
      description: 'Chạm vào menu ở góc trái để chuyển đổi góc nhìn giữa các tầng của nhà ga, hoặc nhấp vào menu ở góc phải để tự động đồng bộ hệ thống sang ngôn ngữ bạn chọn (Tiếng Việt, English...).',
      image: '/tutorial/desktop/04-floor-language-theme.svg',
      targetSelectors: ['#custom-lang-wrapper', '#custom-floor-wrapper'],
      placement: 'bottom'
    },
    {
      id: 'desktop-theme',
      title: 'Chủ đề và độ sáng hiển thị',
      description: 'Tuỳ chỉnh cá nhân hoá trải nghiệm bản đồ bằng cách mở menu Cài đặt. Lựa chọn 1 trong 6 chủ đề màu sắc được thiết kế riêng và kéo thanh trượt điều chỉnh độ sáng để bảo vệ mắt bạn tốt nhất trong mọi môi trường ánh sáng.',
      image: '/tutorial/desktop/04-floor-language-theme.svg',
      targetSelectors: ['#desktop-map-settings-toggle'],
      placement: 'left'
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
      targetSelectors: ['#btn-flight-info-topleft', '#btn-open-flight-info'],
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
