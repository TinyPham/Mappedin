import { getMapData, show3dMap } from "@mappedin/mappedin-js";
import { BlueDot } from "@mappedin/blue-dot";
import { car, tree_palm } from "@mappedin/3d-assets";

import "./styles.css";

const isViewOnly = (function () {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const hasParam = urlParams.get('viewOnly') === 'true' || urlParams.get('viewonly') === 'true';
    const isIframe = window.self !== window.top;
    const isWebsiteHost = window.location.port === '7141' || document.referrer.includes(':7141');
    return hasParam || isWebsiteHost || isIframe; // Aggressive detect
  } catch (e) { return false; }
})();

// Detect Mobile Device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Apply global hide style ASAP if viewOnly
if (isViewOnly) {
  const style = document.createElement('style');
  style.textContent = `
    #btn-add-model, #btn-open-classification, #btn-open-admin-info, .sidebar-actions, #controls-panel {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
  console.log("🚀 Mappedin: View-Only mode active. Admin bits hidden.");
}

/**
 * Kiểm tra điểm có nằm trong polygon không (Ray casting algorithm)
 * Dùng để xác định click có nằm trong vùng polygon của object không
 */
function isPointInPolygon(point: number[], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

// (Legacy hardcoded model list removed - now loaded from database dynamically)

// ============================================
// I18N TRANSLATION MANAGER (Frontend)
// ============================================

// ============================================
// I18N TRANSLATION MANAGER (Frontend)
// ============================================
class TranslationManager {
  static currentLang = 'vn'; // 'vn' | 'en' | 'zh' | 'ko' | 'ja' (Match DB)
  static data: any = {
    languages: [],
    ui: {},
    categories: [],
    locations: {}
  };

  // NEW: Immediate detection logic to prevent UI flicker
  static {
    try {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const langParam = params.get('lang');
      const browserLang = (navigator.language || (navigator as any).userLanguage || 'vn').split('-')[0].toLowerCase();
      const detectedBrowserLang = browserLang === 'vi' ? 'vn' : (['vn', 'en', 'zh', 'ja', 'ko'].includes(browserLang) ? browserLang : 'vn');
      const langSegment = (path.split('/')[1] || "").toLowerCase();

      if (langParam && ['vn', 'en', 'zh', 'ja', 'ko'].includes(langParam.toLowerCase())) {
        this.currentLang = langParam.toLowerCase();
      } else if (['vn', 'en', 'zh', 'ja', 'ko'].includes(langSegment)) {
        this.currentLang = langSegment;
      } else {
        this.currentLang = detectedBrowserLang;
      }
    } catch (e) {
      this.currentLang = 'vn';
    }
  }

  static async init() {
    try {
      // Dynamic API URL: local → localhost:3002, production → same origin
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const apiBase = isLocal ? "http://localhost:3002/api" : `${window.location.origin}/api`;
      const res = await fetch(`${apiBase}/init-data`);
      const json = await res.json();
      this.data = json;
      console.log('🌐 Init Data loaded:', json);

      // Populate Language Dropdown
      this.populateLanguageDropdown();

      // Language detection handled by static block above
      const validLangs = this.data.languages?.map((l: any) => (l.LanguageId || "").toLowerCase()) || ['vn', 'en', 'zh', 'ja', 'ko'];
      if (!validLangs.includes(this.currentLang)) {
        // Keep current static detected lang
      }

      // Set initial dropdown value
      const selector = document.getElementById('language-selector') as HTMLSelectElement;
      if (selector) {
        selector.value = this.currentLang;

        // RE-ADD MISSING EVENT LISTENER
        selector.onchange = (e) => {
          const newLang = (e.target as HTMLSelectElement).value;
          this.setLanguage(newLang);
        };
      }

      // Sync Custom UI Button Text
      this.syncCustomUI();

      // Apply initial translations
      this.applyTranslations();

      // NEW: Force sync with actual selector value if it differs from detected (Fixes JA/VN mismatch)
      if (selector && selector.value && selector.value !== this.currentLang) {
        console.log(`🔌 Initial Language Mismatch: Detected ${this.currentLang}, UI says ${selector.value}. Syncing...`);
        this.setLanguage(selector.value);
      }

    } catch (e) {
      console.warn('Failed to load init-data', e);
    }
  }

  // Populate Language Dropdown from API data
  static populateLanguageDropdown() {
    const selector = document.getElementById('language-selector') as HTMLSelectElement;
    if (!selector || !this.data.languages?.length) return;

    selector.innerHTML = '';
    this.data.languages.forEach((lang: any) => {
      const opt = document.createElement('option');
      opt.value = lang.LanguageId;

      // Use LanguageName directly from DB (which already includes English name if needed)
      // or just trust the DB name. Removing manual appends to avoid "中文 (Chinese) (Chinese)"
      let label = lang.LanguageName;
      // if (lang.LanguageId === 'zh') label += " (Chinese)";
      // if (lang.LanguageId === 'ja') label += " (Japanese)";
      // if (lang.LanguageId === 'ko') label += " (Korean)";
      // if (lang.LanguageId === 'vi') label += " (Vietnamese)";

      opt.textContent = label;
      if (lang.LanguageId === this.currentLang) opt.selected = true;
      selector.appendChild(opt);
    });
  }

  // Apply translations to all elements with data-i18n attributes
  static applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        if (key === 'need_directions') {
          el.innerHTML = this.t(key);
        } else {
          el.textContent = this.t(key);
        }
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
        el.placeholder = this.t(key);
      }
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key && el instanceof HTMLElement) {
        el.setAttribute('title', this.t(key));
      }
    });
  }

  // Hardcoded fallbacks for critical UI keys missing from DB
  static STATIC_UI_FALLBACKS: any = {
    'locations_count': {
      'vn': 'vị trí',
      'en': 'locations',
      'zh': '个位置',
      'ja': 'か所',
      'ko': '위치'
    },
    'loading_3d_map': {
      'vn': 'Đang khởi tạo bản đồ 3D Cảng Hàng không Quốc tế Long Thành...',
      'en': 'Initializing 3D Map for Long Thanh International Airport...',
      'zh': '正在初始化龙城国际机场3D地图...',
      'ja': 'ロンタイン国際空港の3Dマップを初期化中...',
      'ko': '롱탄 국제공항 3D 지도 초기화 중...'
    },
    'loading_complete': {
      'vn': 'Hoàn tất!',
      'en': 'Completed!',
      'zh': '完成!',
      'ja': '完了!',
      'ko': '완료!'
    },
    'searching': {
      'vn': 'Đang tìm...',
      'en': 'Searching...',
      'zh': '搜索中...',
      'ja': '検索中...',
      'ko': '검색 중...'
    },
    'to_floor_label': {
      'vn': 'đến',
      'en': 'to',
      'zh': '到',
      'ja': 'へ',
      'ko': '~로'
    },
    'at_floor_label': {
      'vn': 'tại',
      'en': 'at',
      'zh': '在',
      'ja': 'で',
      'ko': '에서'
    },
    'action_enter': {
      'vn': 'Vào',
      'en': 'Enter',
      'zh': '进入',
      'ja': '入る',
      'ko': '입력'
    },
    'action_exit': {
      'vn': 'Ra',
      'en': 'Exit',
      'zh': '离开',
      'ja': '出る',
      'ko': '출구'
    },
    'action_take_connection': {
      'vn': 'Đi qua cổng/vạch liên kết',
      'en': 'Take connection',
      'zh': '采取连接',
      'ja': '乗り継ぎ',
      'ko': '연결 이용'
    },
    'action_exit_connection': {
      'vn': 'Rời khỏi khu vực liên kết',
      'en': 'Exit connection',
      'zh': '离开连接',
      'ja': '連絡通路を出る',
      'ko': '연결 종료'
    },
    'no_results_found': {
      'vn': 'Không tìm thấy kết quả',
      'en': 'No results found',
      'zh': '未找到结果',
      'ja': '結果が見つかりません',
      'ko': '검색 결과가 없습니다'
    },
    'towards': {
      'vn': 'về hướng',
      'en': 'towards',
      'zh': '往',
      'ja': '方向',
      'ko': '방향으로'
    },
    'near': {
      'vn': 'gần',
      'en': 'near',
      'zh': '靠近',
      'ja': '近く',
      'ko': '근처'
    },
    'past': {
      'vn': 'qua',
      'en': 'past',
      'zh': '经过',
      'ja': '通過',
      'ko': '지나서'
    },
    'step_label': {
      'vn': 'Bước',
      'en': 'Step',
      'zh': '第',
      'ja': '次',
      'ko': '단계'
    },
    'speed_label': {
      'vn': 'Tốc độ:',
      'en': 'Speed:',
      'zh': '速度:',
      'ja': '速度:',
      'ko': '속도:'
    },
    'step_by_step': {
      'vn': 'CHỈ DẪN LỘ TRÌNH',
      'en': 'ROUTE GUIDANCE',
      'zh': '路线指南',
      'ja': '経路案内',
      'ko': '경로 안내'
    },
    'not_found': {
      'vn': 'Không tìm thấy đường đi',
      'en': 'Route not found',
      'zh': '未找到路线',
      'ja': 'ルートが見つかりません',
      'ko': '경로를 찾을 수 없습니다'
    },
    'error_nav': {
      'vn': 'Lỗi khi tìm đường đi',
      'en': 'Error finding route',
      'zh': '寻道错误',
      'ja': 'ルート検索エラー',
      'ko': '경로 검색 오류'
    },
    'route_found': {
      'vn': 'Đã tìm thấy đường đi',
      'en': 'Route found',
      'zh': '已找到路线',
      'ja': 'ルートが見つかりました',
      'ko': '경로를 찾았습니다'
    },
    'elevator': {
      'vn': 'thang máy',
      'en': 'elevator',
      'zh': '电梯',
      'ja': 'エレベーター',
      'ko': '엘리베이터'
    },
    'escalator': {
      'vn': 'thang cuốn',
      'en': 'escalator',
      'zh': '自动扶梯',
      'ja': 'エスカレーター',
      'ko': '에스컬레이터'
    },
    'direction_up': {
      'vn': 'đi lên',
      'en': 'go up',
      'zh': '向上',
      'ja': '上へ',
      'ko': '위로'
    },
    'direction_down': {
      'vn': 'đi xuống',
      'en': 'go down',
      'zh': '向下',
      'ja': '下へ',
      'ko': '아래로'
    },
    'action_take': {
      'vn': 'Đi',
      'en': 'Take',
      'zh': '乘坐',
      'ja': '利用',
      'ko': '타다'
    },

    'action_start': {
      'vn': 'Bắt đầu',
      'en': 'Start',
      'zh': '开始',
      'ja': '開始',
      'ko': '시작'
    },
    'action_departure': {
      'vn': 'Khởi hành',
      'en': 'Departure',
      'zh': '出发',
      'ja': '出発',
      'ko': '출발'
    },
    'action_arrival': {
      'vn': 'Kết thúc',
      'en': 'Arrival',
      'zh': '到达',
      'ja': '到着',
      'ko': '도착'
    },
    'action_continue': {
      'vn': 'Tiếp tục',
      'en': 'Continue',
      'zh': '继续',
      'ja': '直進',
      'ko': '계속'
    },
    'action_turn': {
      'vn': 'Rẽ',
      'en': 'Turn',
      'zh': '转向',
      'ja': '曲がる',
      'ko': '회전'
    },
    'action_turn_left': {
      'vn': 'Rẽ trái',
      'en': 'Turn left',
      'zh': '左转',
      'ja': '左折',
      'ko': '좌회전'
    },
    'action_turn_right': {
      'vn': 'Rẽ phải',
      'en': 'Turn right',
      'zh': '右转',
      'ja': '右折',
      'ko': '우회전'
    },
    'action_turn_around': {
      'vn': 'Quay lại',
      'en': 'Turn around',
      'zh': '掉头',
      'ja': '戻る',
      'ko': '되돌아가기'
    },
    'action_arrive': {
      'vn': 'Đến nơi',
      'en': 'Arrive',
      'zh': '到达',
      'ja': '到着',
      'ko': '도착'
    },
    'minute_label': {
      'vn': 'phút',
      'en': 'min',
      'zh': '分',
      'ja': '分',
      'ko': '분'
    },
    'second_label': {
      'vn': 'giây',
      'en': 'sec',
      'zh': '秒',
      'ja': '秒',
      'ko': '초'
    },
    'venue_name': {
      'vn': 'Cảng Hàng không Quốc tế Long Thành',
      'en': 'Long Thanh International Airport',
      'zh': '龙城国际机场',
      'ja': 'ロンタイン国際空港',
      'ko': '롱탄 국제공항'
    },
    'linked_floors': {
      'vn': 'Tầng liên kết',
      'en': 'Connected Floors',
      'zh': '连接楼层',
      'ja': '接続フロア',
      'ko': '연결된 층'
    },
    'route_start': {
      'vn': 'Đi từ đây',
      'en': 'Start',
      'zh': '从这出发',
      'ja': 'ここから',
      'ko': '여기서 출발'
    },
    'route_via': {
      'vn': 'Điểm dừng',
      'en': 'Via',
      'zh': '经过',
      'ja': '経由',
      'ko': '경유'
    },
    'route_end': {
      'vn': 'Tới đây',
      'en': 'End',
      'zh': '到这里',
      'ja': 'ここまで',
      'ko': '여기까지'
    },
    'tab_search': {
      'vn': 'Tìm kiếm',
      'en': 'Search',
      'zh': '搜索',
      'ja': '検索',
      'ko': '검색'
    },
    'route_preview': {
      'vn': 'Xem trước lộ trình',
      'en': 'Route Preview',
      'zh': '路线预览',
      'ja': 'ルートプレビュー',
      'ko': '경로 미리보기'
    },

    'back_btn': {
      'vn': 'Quay lại danh mục',
      'en': 'Back to categories',
      'zh': '返回分类',
      'ja': 'カテゴリに戻る',
      'ko': '카테고리로 돌아가기'
    },
    'area_color_btn': {
      'vn': 'Màu nền khu vực',
      'en': 'Area background',
      'zh': '区域背景颜色',
      'ja': 'エリアの背景色',
      'ko': '구역 배경색'
    },
    'sidebar_area_info': {
      'vn': 'Thông tin khu vực',
      'en': 'Area information',
      'zh': '区域详情',
      'ja': 'エリア情報',
      'ko': '구역 정보'
    },

    'tab_directions': {
      'vn': 'Chỉ đường',
      'en': 'Directions',
      'zh': '路线',
      'ja': '経路',
      'ko': '길찾기'
    },
    'from_label': {
      'vn': 'Đi từ',
      'en': 'Departure',
      'zh': '起点',
      'ja': '出発地',
      'ko': '출발지'
    },
    'to_label': {
      'vn': 'Đi đến',
      'en': 'Destination',
      'zh': '终点',
      'ja': '目的地',
      'ko': '목적지'
    },
    'search_departure_placeholder': {
      'vn': 'Tìm điểm đi',
      'en': 'Search Departure',
      'zh': '搜索起点',
      'ja': '出発地を検索',
      'ko': '출발지 검색'
    },
    'search_destination_placeholder': {
      'vn': 'Tìm điểm đến',
      'en': 'Search Destination',
      'zh': '搜索终点',
      'ja': '目的地を検索',
      'ko': '목적지 검색'
    },
    'need_directions': {
      'vn': 'Bạn cần <span style="color: #214ca6;">chỉ đường</span>?',
      'en': 'Need <span style="color: #214ca6;">directions</span>?',
      'zh': '需要 <span style="color: #214ca6;">路线指引</span> 吗？',
      'ja': ' <span style="color: #214ca6;">経路案内</span> が必要ですか？',
      'ko': ' <span style="color: #214ca6;">길찾기</span> 가 필요하신가요?'
    },
    'frequent_locations': {
      'vn': 'Địa điểm gợi ý',
      'en': 'Frequent Locations',
      'zh': '常用地点',
      'ja': 'おすすめの場所',
      'ko': '추천 장소'
    },
    'stopover_label': {
      'vn': 'Điểm dừng',
      'en': 'Stopover',
      'zh': '中转点',
      'ja': '経由地',
      'ko': '경유지'
    },
    'stopover_placeholder': {
      'vn': 'Chọn điểm dừng',
      'en': 'Select Stopover',
      'zh': '选择中转点',
      'ja': '経由地を選択',
      'ko': '경유지 선택'
    },
    'minute_label_short': {
      'vn': 'phút',
      'en': 'min',
      'zh': '分',
      'ja': '分',
      'ko': '분'
    }
  };

  // Get UI text (static)
  static t(key: string, defaultText: string = ''): string {
    if (!key) return defaultText;
    const lowerKey = key.toLowerCase();
    const lang = (this.currentLang || 'vn').toLowerCase();

    // 1. Check DB first
    const uiData = this.data.ui?.[lowerKey];
    if (uiData && uiData[lang]) return uiData[lang];

    // 2. Check Static Fallbacks
    const fallback = this.STATIC_UI_FALLBACKS[lowerKey];
    if (fallback && fallback[lang]) return fallback[lang];

    return defaultText || key;
  }

  // Get Category Name by ID
  static getCategoryName(categoryId: number | string): string {
    const cat = this.data.categories?.find((c: any) => c.id?.toString() === categoryId?.toString());
    if (cat?.names?.[this.currentLang]) {
      return cat.names[this.currentLang];
    }
    return '';
  }

  // Get SubCategory Name by ID  
  static getSubCategoryName(subCategoryId: number | string): string {
    const sub = this.data.subcategories?.find((s: any) => s.id?.toString() === subCategoryId?.toString());
    if (sub?.names?.[this.currentLang]) {
      return sub.names[this.currentLang];
    }
    return '';
  }

  // Get Floor Name by MappedinId or FloorCode
  static getFloorName(floorIdOrCode: string, originalName: string = ''): string {
    // 1. Try to find by MappedinId or Code
    const floor = this.data.floors?.find((f: any) =>
      f.mappedinId === floorIdOrCode || (f.code && f.code === floorIdOrCode)
    );
    if (floor?.names?.[this.currentLang]) {
      return floor.names[this.currentLang];
    }

    // 2. FALLBACK: Check if it's Overview by name
    const searchTarget = (originalName || floorIdOrCode || '').toLowerCase();
    const isOverview = searchTarget.includes('overview') ||
      searchTarget.includes('tổng quan') ||
      searchTarget.includes('tong quan') ||
      searchTarget.includes('toàn cảnh');

    if (isOverview) {
      const overviewFloor = this.data.floors?.find((f: any) => f.code === 'OVERVIEW');
      if (overviewFloor?.names?.[this.currentLang]) {
        return overviewFloor.names[this.currentLang];
      }
    }

    return originalName || floorIdOrCode;
  }

  // Get Name for Map Object logic (Locations, Categories, SubCategories)
  static getName(obj: any): string {
    if (!obj) return '';
    const id = obj.id || obj.mappedinId; // handle mixed objects
    const lang = (this.currentLang || 'vn').toLowerCase();

    // 1. Check if this is a category (has subcategories property)
    if (obj.subcategories !== undefined) {
      const catName = this.getCategoryName(id);
      if (catName) return catName;
    }

    // 2. Check if this is a subcategory (has categoryId property but no subcategories)
    if (obj.categoryId !== undefined && obj.subcategories === undefined) {
      const subName = this.getSubCategoryName(id);
      if (subName) return subName;
    }

    // 3. Check DB locations (Dynamic from Translation_Locations)
    // Thử cả obj.id lẫn obj.mappedinId vì SDK và DB có thể dùng ID format khác nhau
    const locData = this.data.locations?.[id] ||
      (obj.mappedinId ? this.data.locations?.[obj.mappedinId] : null) ||
      (obj.id && obj.id !== id ? this.data.locations?.[obj.id] : null);

    // 3a. Nếu tìm thấy và có bản dịch cho ngôn ngữ hiện tại → trả ngay
    if (locData?.names?.[lang]) {
      return locData.names[lang];
    }

    // 3b. Cross-reference: Nếu ID trực tiếp không có bản dịch,
    // tìm trong tất cả locations khác có cùng tên VN (hoặc cùng obj.name)
    // để lấy bản dịch từ entry đã hoàn chỉnh
    if (lang !== 'vn' && this.data.locations) {
      const vnName = locData?.names?.['vn'] || obj.name || '';
      if (vnName) {
        const allLocs = this.data.locations;
        for (const key of Object.keys(allLocs)) {
          if (key === id) continue;
          const candidate = allLocs[key];
          if (candidate?.names?.['vn'] === vnName && candidate.names[lang]) {
            return candidate.names[lang];
          }
        }
      }
    }

    // 3c. Nếu vẫn không tìm được, fallback theo thứ tự: VN -> EN -> bất kỳ
    if (locData?.names) {
      const fallback = locData.names['vn'] || locData.names['en'] ||
        Object.values(locData.names).find((v: any) => v && (v as string).length > 0);
      if (fallback) return fallback as string;
    }
    // Support string fallback (if any)
    if (typeof locData === 'string') return locData;

    // 4. Fallback to object's original name
    return obj.name || '';
  }


  // Get Rich Content (Desc, Image, etc)
  static getLocationContent(id: string, obj?: any) {
    // Thử tra trực tiếp bằng ID
    let locData = this.data.locations?.[id] || null;

    // Cross-reference: thử mappedinId nếu có obj
    if (!locData && obj?.mappedinId) {
      locData = this.data.locations?.[obj.mappedinId] || null;
    }
    if (!locData && obj?.id && obj.id !== id) {
      locData = this.data.locations?.[obj.id] || null;
    }

    return locData;
  }

  // NEW: Get Localized Description
  static getLocationDescription(id: string, obj?: any): string {
    const locData = this.getLocationContent(id, obj);
    const lang = (this.currentLang || 'vn').toLowerCase();

    // 1. Check for localized descriptions object (from AreaInformation)
    if (locData?.descriptions?.[lang]) {
      return locData.descriptions[lang];
    }

    // 2. Cross-reference: tìm bản ghi khác cùng tên VN có description cho ngôn ngữ hiện tại
    if (lang !== 'vn' && this.data.locations) {
      const vnName = locData?.names?.['vn'] || obj?.name || '';
      if (vnName) {
        const allLocs = this.data.locations;
        for (const key of Object.keys(allLocs)) {
          if (key === id) continue;
          const candidate = allLocs[key];
          if (candidate?.names?.['vn'] === vnName && candidate?.descriptions?.[lang]) {
            return candidate.descriptions[lang];
          }
        }
      }
    }

    // 3. Fallback: thử VN description nếu ngôn ngữ khác không có
    if (locData?.descriptions) {
      const fallback = locData.descriptions['vn'] || locData.descriptions['en'] ||
        Object.values(locData.descriptions).find((v: any) => v && (v as string).length > 0);
      if (fallback) return fallback as string;
    }

    // 4. Fallback to legacy description field if exists
    if (locData?.description) {
      return locData.description;
    }

    return "";
  }

  static async setLanguage(lang: string) {
    const lowerLang = lang.toLowerCase();
    if (this.currentLang === lowerLang) return;
    this.currentLang = lowerLang;
    console.log(`🌐 Switching language to: ${lowerLang}`);

    // Update URL if possible (sync with map state)
    if ((window as any).syncURL) {
      (window as any).syncURL(true); // force replace
    } else {
      const newUrl = `/${lowerLang}/`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }

    // Update Dropdown Selection
    const selector = document.getElementById('language-selector') as HTMLSelectElement;
    if (selector) {
      selector.value = lang;
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('language-change', { detail: lang }));

    // Apply translations to all UI elements
    this.applyTranslations();

    // Update floor selector translations
    if ((window as any).updateFloorSelectorTranslations) {
      (window as any).updateFloorSelectorTranslations();
    }

    // Trigger map redraws
    try {
      if ((window as any).renderCategories) {
        // Force refresh to rebuild tree with new translations
        const activeId = (window as any).activeCategoryId || null;
        // Note: activeCategoryId might be local to init, need to ensure access.
        // Wait, activeCategoryId is local to init? 
        // In setLanguage lines 205-206: (window as any).activeCategoryId.
        (window as any).renderCategories(activeId, true);
      }
      if ((window as any).updateMarkersForCurrentFloor) {
        (window as any).updateMarkersForCurrentFloor();
      }
      if ((window as any).refreshFloorSpecificMarkers) {
        (window as any).refreshFloorSpecificMarkers();
      }
      // Refresh connection overlays
      if ((window as any).renderConnectionOverlaysForCurrentFloor) {
        (window as any).renderConnectionOverlaysForCurrentFloor();
      }
      // Recreate map name marker with new translation
      if ((window as any).createMapNameMarker) {
        (window as any).createMapNameMarker();
      }

      // Re-draw navigation if active to update instruction languages
      if ((window as any).drawNavigation && (window as any).isNavigationActive) {
        (window as any).drawNavigation();
      }
    } catch (e) { console.warn("Failed to refresh some UI components", e); }

    // Sync Custom UI Button Text
    this.syncCustomUI();
  }

  // Helper to sync the custom dropdown UI in index.html
  static syncCustomUI() {
    const textEl = document.getElementById('custom-lang-text');
    if (!textEl) return;

    const langNames: any = {
      'vn': 'Tiếng Việt',
      'en': 'English',
      'zh': '中文',
      'ja': '日本語',
      'ko': '한국어'
    };

    textEl.textContent = langNames[this.currentLang] || langNames['vn'];

    // Update active class in dropdown items
    document.querySelectorAll('#lang-options .pro-dropdown-item').forEach(el => {
      el.classList.remove('custom-active');
      const itemText = (el as HTMLElement).textContent || "";
      if (itemText.includes(textEl.textContent!)) {
        el.classList.add('custom-active');
      }
    });
  }

  // Legacy support for modal (now mostly for Admin, but kept for compatibility)
  static async saveTranslation(id: string, name: string) {
    alert("Use new Admin UI to edit content.");
  }
}

// Expose to window for HTML onclick
(window as any).setLanguage = (lang: string) => {
  TranslationManager.setLanguage(lang);
};
(window as any).TranslationManager = TranslationManager;

(window as any).openEditTranslationModal = async (space: any) => {
  const currentName = TranslationManager.getName(space);
  // Use prompt for MVP
  const newName = prompt(`Enter new name for "${currentName}" (${TranslationManager.currentLang.toUpperCase()}):`, currentName);

  if (newName !== null && newName !== currentName) {
    if (newName.trim() === "") return; // Don't allow empty

    await TranslationManager.saveTranslation(space.id, newName);

    // Refresh Info if function available
    if ((window as any).updateInfo) {
      (window as any).updateInfo(space);
    }
  }
};

async function init() {
  // 0. CHECK VIEW-ONLY MODE - Handled at top level
  if (isViewOnly) {
    console.log("🚀 Mappedin: View-Only mode detected in init()");
  }

  // SHOW LOADING SCREEN AND SIMULATE PROGRESS
  const loadingScreen = document.getElementById("global-loading-screen");
  const loadingText = document.getElementById("loading-text");
  const loadingBar = document.getElementById("loading-progress-bar");

  let simProgress = 0;
  let progressInterval: any = null;

  if (loadingScreen && loadingText && loadingBar) {
    loadingScreen.style.display = "flex";
    loadingScreen.classList.remove("hidden");

    // Giả lập thanh tiến trình chạy mượt lên 90% (vì show3dMap ko có callback %)
    progressInterval = setInterval(() => {
      if (simProgress < 90) {
        simProgress += Math.random() * 4 + 1; // Nhảy random 1-5%
        if (simProgress > 90) simProgress = 90;
        const displayPercent = Math.floor(simProgress);

        // Cập nhật nội dung I18N
        const baseMsg = TranslationManager.t('loading_3d_map', 'Đang khởi tạo bản đồ...');
        loadingText.textContent = `${baseMsg} ${displayPercent}%`;

        loadingBar.style.width = `${displayPercent}%`;
      }
    }, 150);
  }

  // Init Translations
  await TranslationManager.init();
  // ============================================
  // 1. KHỞI TẠO MAP DATA VÀ MAP VIEW
  // ============================================
  const floorSelector = document.getElementById("floor-selector") as HTMLSelectElement;

  // Khai báo blue dot variables (sẽ được khởi tạo sau khi mapView được tạo)
  let blueDot: any = null; // Blue dot instance
  let blueDotAnimationInterval: any = null; // Interval cho animation
  let isAnimating: boolean = false; // Trạng thái đang animate
  let previewMarker: any = null; // Marker dùng để demo thay cho BlueDot thật
  let isPaused: boolean = false; // Trạng thái pause
  let animationState: any = null; // State của animation (để hỗ trợ pause/resume/seek)
  let animationStartTime: number = 0; // Thời gian bắt đầu animation
  let animationPauseTime: number = 0; // Thời gian đã pause
  let totalAnimationDuration: number = 0; // Tổng thời gian animation
  let currentAnimationDistance: number = 0; // Khoảng cách đã đi được
  let animationSegmentCoords: any[] = []; // Coordinates của segment đang animate
  let animationDistances: number[] = []; // Distance table của segment
  let animationTotalDistance: number = 0; // Tổng khoảng cách của segment
  let initialVenueCenter: any = null; // Lưu tọa độ trung tâm khởi tạo để đổi tầng
  let isManualFloorSwitch: boolean = false; // Cờ đánh dấu đang chuyển tầng thủ công (vô hiệu hóa AUTO-SWITCH)
  let _isWarmupSwitch: boolean = false; // Cờ đánh dấu đang warm-up floor (bỏ qua side effects)
  let isProgrammaticZoom: boolean = false; // Cờ đánh dấu đang zoom từ category (vô hiệu hóa AUTO-SWITCH)
  let isInOverview: boolean = true; // Cờ đánh dấu đang ở Overview mode (CRITICAL for floor sync)
  let lastActiveFloorId: string | null = null; // Lưu floor ID cuối cùng trước khi về Overview
  let isGlobalSwitchingFloor: boolean = false; // Khóa ngăn chặn spam chuyển tầng gây sập GPU

  // Declarations for hoisting/scope visibility
  let categoryTree: any[] = [];
  let ApiService: any = null;
  let hideInfo: any = null;
  let updateInfo: any = null;

  // ============================================
  // LAZY LOADING: Cache metadata + track loaded floors
  // ============================================
  // Lưu metadata tất cả models từ API (nhẹ, chỉ JSON)
  let _allModelMetadata: any[] = [];
  // Theo dõi tầng nào đã load models rồi (tránh load lại)
  const _loadedFloors: Set<string> = new Set();

  // Placement Globals
  let placingModelConfig: any = null;
  let placingMode: 'new' | 'copy' | 'move' = 'new';
  let sourceModelData: any = null;
  let sourceModelMappedinId: string | null = null;
  let activeModelInstance: any = null;
  let placingPreviewModel: any = null;
  let isAddingPreview = false; // Lock for async model addition

  // ============================================
  // MULTI-SELECT STATE (Shift+Click)
  // ============================================
  const multiSelectedModels: Map<string, { instance: any; meta: any }> = new Map(); // uuid -> { instance, meta }
  let isMultiPlacingMode = false; // True when placing multiple models
  let multiPlaceSourceModels: { meta: any; offsetLat: number; offsetLon: number }[] = []; // Relative offsets from anchor
  let multiPlaceMode: 'copy' | 'move' = 'copy';
  const multiPlacePreviewModels: any[] = []; // Preview 3D ghosts for multi-place
  let multiPlaceAnchorSet = false;

  // Track shift key globally since SDK might not pass originalEvent reliably
  let isShiftPressed = false;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') isShiftPressed = true;
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') isShiftPressed = false;
  });
  // Also clear shift on window blur to prevent it gracefully sticking
  window.addEventListener('blur', () => { isShiftPressed = false; });

  // UI Elements
  // UI Elements
  let controlsPanel: HTMLElement | null = null;
  let btnCopyModel: HTMLElement | null = null;
  let btnCutModel: HTMLElement | null = null;
  let btnDeleteModel: HTMLElement | null = null;
  let btnCloseControls: HTMLElement | null = null;
  let inputName: HTMLInputElement | null = null;
  let inputDesc: HTMLInputElement | null = null;
  let inputRotX: HTMLInputElement | null = null;
  let sliderRotX: HTMLInputElement | null = null;
  let inputRotY: HTMLInputElement | null = null;
  let sliderRotY: HTMLInputElement | null = null;
  let inputRotZ: HTMLInputElement | null = null;
  let sliderRotZ: HTMLInputElement | null = null;
  let inputElevation: HTMLInputElement | null = null;
  let sliderElevation: HTMLInputElement | null = null;
  let inputScaleX: HTMLInputElement | null = null;
  let inputScaleY: HTMLInputElement | null = null;
  let inputScaleZ: HTMLInputElement | null = null;
  let inputLat: HTMLInputElement | null = null;
  let inputLon: HTMLInputElement | null = null;
  let inpModelPublic: HTMLInputElement | null = null;


  // Tự động chuyển đổi URL API giữa Local và Production (Render)
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const API_BASE_URL = isLocal ? "http://localhost:3002/api" : `${window.location.origin}/api`;
  const SERVER_URL = API_BASE_URL.replace("/api", "");


  // Load map data từ Mappedin API
  const MAP_ID = "693687f4f176dd000ba13a3b";
  const mapData = await getMapData({
    key: "mik_84tXkEaqR5Ogul15S52130732",
    secret: "mis_JuNKdPNKhdMjONyk40x0T8nrCVH4ANPQWtQ9nmoQGEZ86b10fe5",
    mapId: MAP_ID,
  });

  // Tìm overview floor sớm để dùng cho markers
  const overviewFloor = mapData.getByType("floor").find((f: any) => {
    const name = f.name?.toLowerCase() || "";
    return name.includes("overview") || name.includes("tổng quan") || name.includes("tong quan");
  });

  // Lấy danh sách tất cả các tầng để preload
  const allFloors = mapData.getByType("floor");

  // Đợi DOM render xong để tránh lỗi Container size = 0
  await new Promise(r => setTimeout(r, 100));

  // Hiển thị map 3D
  const mapView = await show3dMap(
    document.getElementById("mappedin-map") as HTMLDivElement,
    mapData,
    {
      multiFloorView: {
        enabled: true,
        floorGap: "auto", // Tự động tính khoảng cách tầng
        updateCameraElevationOnFloorChange: true,
      },
      // BƯỚC 4: Comment out native preloadFloors
      // preloadFloors: allFloors,
    }
  );

  // Cấu hình độ nhạy Camera trực tiếp sau khi khởi tạo (Đảm bảo hiệu lực cho Mobile)
  try {
    const cam = mapView.Camera as any;
    const sensitivity = isMobile ? 12.0 : 1.8; // Đẩy lên mức 12.0 cho mobile - cực nhạy

    // Thử nhiều cách gán khác nhau để bao quát mọi phiên bản SDK
    if (typeof cam.setZoomSensitivity === 'function') {
      cam.setZoomSensitivity(sensitivity);
    } else {
      cam.zoomSensitivity = sensitivity;
    }

    if (typeof cam.setPanSensitivity === 'function') cam.setPanSensitivity(isMobile ? 2.5 : 1.2);
    if (typeof cam.setRotateSensitivity === 'function') cam.setRotateSensitivity(isMobile ? 2.5 : 1.2);

    console.log(`🚀 Mappedin: Camera Sensitivity set to ${sensitivity} (Mobile: ${isMobile})`);
  } catch (e) {
    console.warn("Could not set camera sensitivity directly", e);
  }

  // Expose mapView globally for easier debugging and access from console
  (window as any).mapView = mapView;

  // Inject Preview Blue Dot CSS Once
  const previewStyle = document.createElement('style');
  previewStyle.id = 'preview-blue-dot-styles';
  previewStyle.textContent = `
    .preview-blue-dot-container { position: relative; width: 24px; height: 24px; display: flex !important; align-items: center; justify-content: center; transform: translate(-12px, -12px); pointer-events: none; z-index: 1000; }
    .preview-blue-dot-core { position: absolute; width: 14px; height: 14px; background: #214ca6; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.4); z-index: 1002; }
    .preview-blue-dot-pulse { position: absolute; width: 34px; height: 34px; background: rgba(33, 76, 166, 0.4); border-radius: 50%; animation: preview-pulse 1.5s infinite; z-index: 1001; }
    @keyframes preview-pulse { 0% { transform: scale(0.6); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }
  `;
  document.head.appendChild(previewStyle);

  // LƯU Ý: XÓA LOADING SCREEN KHI HOÀN TẤT
  if (progressInterval) clearInterval(progressInterval);

  if (loadingScreen && loadingText && loadingBar) {
    // Đẩy vọt lên 100% để user thấy đã chạy xong
    const completeMsg = TranslationManager.t('loading_complete', 'Hoàn tất!');
    loadingText.textContent = `${completeMsg} 100%`;
    loadingBar.style.width = `100%`;

    // Đợi 400ms để hiệu ứng animation % chạy tới đích, rồi mới ẩn Overlay
    setTimeout(() => {
      loadingScreen.classList.add("hidden");
      setTimeout(() => loadingScreen.style.display = "none", 500);
    }, 400);
  }

  // Tải ngầm cực chậm trong Background (Không block UI/Lag máy)
  setTimeout(async () => {
    try {
      for (const floor of allFloors) {
        // Bỏ qua tầng đang hiển thị
        if (floor.id === mapView.currentFloor?.id) continue;

        try {
          mapView.updateState(floor, { geometry: { visible: true } } as any);
        } catch (e) { }

        // Delay khoảng 500ms mỗi tầng để thả lỏng hoàn toàn Thread chính
        await new Promise(r => setTimeout(r, 500));
      }
      console.log(`✅ Background geometric cache completed.`);
    } catch (e) { }
  }, 2000); // Đợi 2 giây sau khi app hoàn toàn trơn tru mới bắt đầu tải ngầm

  // ASSIGN UI ELEMENTS
  controlsPanel = document.getElementById("model-controls-panel");
  btnCopyModel = document.getElementById("btn-copy-model");
  btnCutModel = document.getElementById("btn-cut-model");
  btnDeleteModel = document.getElementById("btn-delete-model");
  btnCloseControls = document.getElementById("btn-close-controls");
  inputName = document.getElementById("inp-model-name") as HTMLInputElement;
  inputDesc = document.getElementById("inp-model-desc") as HTMLInputElement;
  inputLat = document.getElementById("inp-lat") as HTMLInputElement;
  inputLon = document.getElementById("inp-lon") as HTMLInputElement;
  inputRotX = document.getElementById("inp-rot-x") as HTMLInputElement;
  sliderRotX = document.getElementById("slider-rot-x") as HTMLInputElement;
  inputRotY = document.getElementById("inp-rot-y") as HTMLInputElement;
  sliderRotY = document.getElementById("slider-rot-y") as HTMLInputElement;
  inputRotZ = document.getElementById("inp-rot-z") as HTMLInputElement;
  sliderRotZ = document.getElementById("slider-rot-z") as HTMLInputElement;
  inputElevation = document.getElementById("inp-elevation") as HTMLInputElement;
  sliderElevation = document.getElementById("slider-elevation") as HTMLInputElement;
  inputScaleX = document.getElementById("scale-x") as HTMLInputElement;
  inputScaleY = document.getElementById("scale-y") as HTMLInputElement;
  inputScaleZ = document.getElementById("scale-z") as HTMLInputElement;
  inpModelPublic = document.getElementById("inp-model-public") as HTMLInputElement;


  // HIDE DEFAULT LABELS: Use our custom markers instead (with square avatar style)
  /* BƯỚC 3: COMMENT OUT LABEL HIDING
  try {
    (mapView.Labels as any).all.forEach((l: any) => l.hide());
  } catch (e) {
    console.warn("Could not hide default labels", e);
  }
  */

  // Tùy chỉnh FloatingLabels v6

  // Triệt để ẩn marker nhãn bằng cách cấu hình cả FloatingLabels, FlatLabels và Labels trong SDK
  try {
    const labelSystems = ['FloatingLabels', 'FlatLabels', 'Labels'];
    labelSystems.forEach(sys => {
      if ((mapView as any)[sys]) {
        (mapView as any)[sys].labelAllLocations({
          appearance: {
            marker: {
              size: 0,
              opacity: 0
            }
          }
        });
      }
    });
  } catch (e) { }

  // Lưu tọa độ trung tâm khởi tạo để dùng cho việc căn giữa sau này
  initialVenueCenter = { ...mapView.Camera.center };

  // Xoay camera một góc để có góc nhìn tốt hơn
  mapView.Camera.animateTo({
    bearing: mapView.Camera.bearing - 36.7,
  });

  // ============================================
  // KHỞI TẠO BLUE DOT
  // ============================================
  try {
    blueDot = new BlueDot(mapView);
    // Enable blue dot với options tùy chỉnh
    blueDot.enable({
      color: '#2196F3', // Màu xanh dương
      accuracyRing: {
        color: '#2196F3',
        opacity: 0.2,
      },
      heading: {
        color: '#2196F3',
        opacity: 1,
      },
      inactiveColor: '#9E9E9E',
      timeout: 30000, // 30 giây
      debug: false,
    });
  } catch (e) {
    console.warn("Error initializing Blue Dot:", e);
  }

  // Helper: Lấy thông tin loại tầng hiện tại (moved up for global scope)
  const getFloorType = (floor: any) => {
    if (!floor) return "unknown";
    const name = (floor.name || "").toLowerCase();
    if (name.includes("overview") || name.includes("tổng quan")) return "overview";
    if (name.includes("transit") || name.includes("public")) return "transit";
    return "detail";
  };

  // Helper: Tìm Floor ID bằng từ khóa (ví dụ: "GF", "Public")
  const findFloorIdByKeywords = (keywords: string[]) => {
    const floors = mapData.getByType("floor");
    const found = floors.find((f: any) => {
      const name = (f.name || "").toLowerCase();
      return keywords.every(kw => name.includes(kw.toLowerCase()));
    });
    return found ? found.id : null;
  };

  // ============================================
  // HELPER: Lấy zoom level hiện tại của camera (định nghĩa sớm để dùng trong animation)
  // ============================================
  const getCameraZoom = (): number | null => {
    try {
      const cam = (mapView as any).Camera;
      if (!cam) return null;

      // Thử các biến thể thuộc tính Zoom trong SDK
      let z = cam.zoom;
      if (typeof z !== 'number') z = cam.zoomLevel;
      if (typeof z !== 'number') z = cam.state?.zoom;
      if (typeof z !== 'number') z = cam.camera?.zoom;
      if (typeof z !== 'number' && cam.position) z = cam.position.zoom;

      // Fallback: Nếu vẫn không lấy được (tránh bị 0.00 gây ẩn model)
      if (typeof z !== 'number' || isNaN(z)) {
        return 20; // Giả định là đang zoom gần để hiện model nếu lỗi
      }

      return z;
    } catch {
      return 20;
    }
  };

  // ============================================
  // INITIAL CAMERA SETUP - Set kích thước ban đầu
  // ============================================
  // Set minZoomLevel và maxZoomLevel, và zoom ban đầu = 1.0
  try {
    const cameraAny = mapView.Camera as any;

    // Set minZoomLevel = 1.0 (kích thước ban đầu)
    if (cameraAny.setMinZoomLevel && typeof cameraAny.setMinZoomLevel === 'function') {
      cameraAny.setMinZoomLevel(10.0); // Zoom tối thiểu 10x
    }
    if (cameraAny.setMaxZoomLevel && typeof cameraAny.setMaxZoomLevel === 'function') {
      cameraAny.setMaxZoomLevel(32.0); // Allow maximum zoom capability
    }

    // Set zoom ban đầu = 12.0 (để có hiệu ứng zoom vào 15.0)
    cameraAny.animateTo({
      zoomLevel: 12.0,
      bearing: mapView.Camera.bearing,
      pitch: mapView.Camera.pitch,
      center: mapView.Camera.center,
    });

    console.log(`🎬 Initial setup: Set zoom ban đầu = 1.0`);
  } catch (e) {
    console.warn("Error in initial camera setup:", e);
  }

  // ============================================
  // INITIAL CAMERA ANIMATION - Zoom IN sau 3 giây
  // ============================================
  // Sau khi map load xong, delay 3 giây rồi zoom IN lên 10.0
  setTimeout(() => {
    try {
      const cameraAny = mapView.Camera as any;

      // Lấy zoom hiện tại
      const currentZoom = getCameraZoom() ?? 12.0;

      // Zoom IN (phóng to) lên 16.0 để khởi tạo Overview
      const targetZoom = 15;

      // Animate camera để zoom IN mượt mà với bearing = bearing - 35
      cameraAny.animateTo({
        zoomLevel: targetZoom,
        bearing: mapView.Camera.bearing - 36.7, // Set bearing về góc nhìn ban đầu
        pitch: mapView.Camera.pitch,
        center: mapView.Camera.center, // Giữ nguyên center
      }, {
        duration: 3000, // 3 giây để zoom IN mượt mà
        easing: "easeInOut",
      });
      console.log(`🎬 Initial animation: Zoom IN lên ${targetZoom} tại Overview`);
    } catch (e) {
      console.warn("Error in initial camera animation:", e);
    }
  }, 1000); // Delay 1 giây 

  // ============================================
  // 2. THIẾT LẬP FLOOR SELECTOR
  // ============================================
  // Populate dropdown với danh sách các tầng
  mapData
    .getByType("floor")
    .sort((b, a) => a.elevation - b.elevation)
    .forEach((floor) => {
      // User Request: Only show "Overview" and "Detail" floors in the dropdown. 
      // DO NOT show intermediate (Transit) floors or Roof floors.
      const name = (floor.name || "").toLowerCase();
      const isRoof = name.includes("tầng mái") || name.includes("roof");
      const type = getFloorType(floor);

      if (type === "transit" || isRoof) {
        return;
      }

      const option = document.createElement("option");
      option.text = floor.name;
      option.value = floor.id;
      option.dataset.originalName = floor.name; // Preserve original name for translation lookups
      floorSelector.appendChild(option);
    });

  // ============================================
  // 3. LẤY TẤT CẢ MAP OBJECTS
  // ============================================
  /**
   * Thu thập tất cả các loại objects từ mapData:
   * - spaces (phòng, hành lang)
   * - point-of-interest (điểm quan tâm)
   * - areas (khu vực)
   * - locations (vị trí)
   * - doors (cửa)
   */
  function getAllMapObjects() {
    const allObjects: any[] = [];
    const mapDataAny = mapData as any;

    // Lấy spaces
    try {
      const spaces = mapData.getByType("space");
      if (spaces && spaces.length > 0) {
        allObjects.push(...spaces);
      }
    } catch (e) { }

    // Lấy point-of-interest (POIs)
    try {
      const pois = mapData.getByType("point-of-interest");
      if (pois && pois.length > 0) {
        allObjects.push(...pois);
      }
    } catch (e) { }

    // Lấy areas
    try {
      const areas = mapData.getByType("area");
      if (areas && areas.length > 0) {
        allObjects.push(...areas);
      }
    } catch (e) { }

    // Lấy locations từ mapData.locations
    try {
      if (mapDataAny.locations && Array.isArray(mapDataAny.locations)) {
        const locations = mapDataAny.locations;
        if (locations.length > 0) {
          allObjects.push(...locations);
        }
      }
    } catch (e) { }

    // Lấy locations từ getByType("location")
    try {
      const locations = mapData.getByType("location");
      if (locations && locations.length > 0) {
        allObjects.push(...locations);
      }
    } catch (e) { }

    // Lấy từ các properties khác có thể chứa objects
    const possibleLocationProps = ['customObjects', 'points', 'elevators', 'stairways', 'locations'];
    possibleLocationProps.forEach((prop) => {
      try {
        if (mapDataAny[prop] && Array.isArray(mapDataAny[prop])) {
          const items = mapDataAny[prop];
          if (items.length > 0) {
            allObjects.push(...items);
          }
        }
      } catch (e) { }
    });

    // Lấy doors
    try {
      const doors = mapData.getByType("door");
      if (doors && doors.length > 0) {
        allObjects.push(...doors);
      }
    } catch (e) { }

    // Lấy các objects (Để bắt được các quầy, kệ, booth nhỏ...)
    try {
      const objects = mapData.getByType("object");
      if (objects && objects.length > 0) {
        allObjects.push(...objects);
      }
    } catch (e) { }

    // Loại bỏ duplicates dựa trên id
    const uniqueObjects = allObjects.filter((obj, index, self) =>
      index === self.findIndex((o) => o.id === obj.id)
    );

    return uniqueObjects;
  }

  const allMapObjects = getAllMapObjects();

  // Log Mappedin CDN Image Links
  console.group("📍 Mappedin CDN Image Links");
  const objectImages = allMapObjects.map(o => {
    // 1. Try images array (Suggested)
    let url = "";
    if (o.images && Array.isArray(o.images) && o.images.length > 0) {
      url = o.images[0].url || o.images[0];
    }
    // 2. Try media array
    else if (o.media && Array.isArray(o.media) && o.media.length > 0) {
      url = o.media[0].url || o.media[0];
    }
    // 3. Fallbacks
    else {
      url = o.logo?.original || o.logo?.large || o.logo?.medium || o.logo?.small || o.logo || o.image || o.x_ray_image_url || "";
    }

    return {
      ID: o.id,
      Name: o.name || 'Unnamed',
      CDN_Url: url
    };
  }).filter(o => o.CDN_Url);

  if (objectImages.length > 0) {
    console.table(objectImages);
  } else {
    console.log("No images found in any map objects. Checking raw objects for inspection...");
    console.log("Sample object structure:", allMapObjects[0]);
  }
  console.groupEnd();
  let currentSearchResults: any[] = []; // Track active search results
  let selectedSpace: any = null;
  let currentSearchMarkers: any[] = []; // Track active search markers

  // NEW: Track persistent category/subcategory state
  let activeCategoryId: string | null = null;
  let activeSubCategoryId: string | null = null;
  let activeCategoryIcon: string = "📍";
  let previousFloorId: string | null = null;

  // Helper to check overview state
  const isMapInOverview = () => {
    const selector = document.getElementById("floor-selector") as HTMLSelectElement;
    if (selector && selector.value === "overview") return true;

    const floorName = mapView.currentFloor?.name?.toLowerCase() || "";
    const isOverview = floorName.includes("overview") ||
      floorName.includes("tổng quan") ||
      floorName.includes("tong quan") ||
      floorName.includes("view") ||
      floorName === "overview";
    return isOverview || !mapView.currentFloor;
  };

  // Helper to clear search markers
  const clearSearchMarkers = () => {
    currentSearchMarkers.forEach(m => {
      try { mapView.Markers.remove(m); } catch (e) { }
    });
    currentSearchMarkers = [];
  };

  // Mapping từ khóa trong tên category -> Icon
  const CATEGORY_ICON_MAP: Record<string, string> = {
    'restroom': '🚻', 'toilet': '🚻', 'wc': '🚻', 'vệ sinh': '🚻',
    'elevator': '🛗', 'thang máy': '🛗',
    'stair': '🪜', 'cầu thang': '🪜',
    'atm': '🏧', 'bank': '🏧', 'ngân hàng': '🏧',
    'food': '🍽️', 'restaurant': '🍽️', 'cafe': '🍽️', 'ăn uống': '🍽️', 'dining': '🍽️',
    'shop': '🛍️', 'store': '🛍️', 'mua sắm': '🛍️', 'cửa hàng': '🛍️',
    'exit': '🚪', 'entrance': '🚪', 'gate': '🚪', 'cổng': '🚪',
    'info': 'ℹ️', 'information': 'ℹ️', 'thông tin': 'ℹ️',
    'parking': '🅿️', 'bãi xe': '🅿️',
    'check-in': '🎫', 'check in': '🎫',
    'baggage': '🛄', 'hành lý': '🛄',
    'seat': '💺', 'ghế': '💺', 'ngồi': '💺',
    'security': '👮', 'an ninh': '👮',
    'smoking': '🚬', 'hút thuốc': '🚬',
  };

  const getIconForCategoryName = (name: string): string => {
    if (!name) return '📍';
    const lower = name.toLowerCase();
    for (const key in CATEGORY_ICON_MAP) {
      if (lower.includes(key)) return CATEGORY_ICON_MAP[key];
    }
    return '📍'; // Default
  };

  // ============================================
  // SEARCH FUNCTIONALITY
  // ============================================
  const searchInput = document.getElementById("location-search") as HTMLInputElement;
  const searchResults = document.getElementById("search-results") as HTMLDivElement;
  const searchClearBtn = document.getElementById("search-clear-btn") as HTMLButtonElement;

  if (searchInput && searchResults && searchClearBtn) {
    // Show/hide clear button based on input
    searchInput.addEventListener("input", () => {
      searchClearBtn.style.display = searchInput.value ? "block" : "none";
      performSearch(searchInput.value);
    });

    // Clear search
    searchClearBtn.addEventListener("click", () => {
      searchInput.value = "";
      searchClearBtn.style.display = "none";
      searchResults.style.display = "none";
      searchResults.innerHTML = "";

      // Show categories back
      const categorySection = document.getElementById("category-section");
      if (categorySection) categorySection.style.display = "block";

      // Deselect area (hide info) as per user request
      hideInfo();
    });

    // Hide results when clicking outside
    document.addEventListener("click", (e) => {
      // 1. Hide main search results
      if (!searchInput.contains(e.target as Node) && !searchResults.contains(e.target as Node)) {
        searchResults.style.display = "none";
      }
      // 2. Hide wayfinding inline results
      const wayfindingPanel = document.getElementById("wayfinding-panel");
      const wayfindingResults = document.getElementById("wayfinding-search-results");
      if (wayfindingResults && wayfindingPanel) {
        if (!wayfindingPanel.contains(e.target as Node) && !wayfindingResults.contains(e.target as Node)) {
          wayfindingResults.style.display = "none";
        }
      }
    });

    // Show results when focusing on input with text
    searchInput.addEventListener("focus", () => {
      if (searchInput.value) {
        performSearch(searchInput.value);
      }
    });

    // Perform search
    // Smart Match Helper
    const smartMatch = (query: string, target: string): boolean => {
      if (!query || !target) return false;
      const q = query.toLowerCase().trim();
      const t = target.toLowerCase().trim();

      // Standard includes
      if (t.includes(q)) return true;

      // Token based matching
      const qTokens = q.split(/[\s\-\,]+/).filter(tk => tk.length > 0);
      const tTokens = t.split(/[\s\-\,]+/).filter(tk => tk.length > 0);

      if (qTokens.length === 0 || tTokens.length === 0) return false;

      // A. Query words are ALL in target (Unordered)
      const allQueryInTarget = qTokens.every(qt => tTokens.some(tt => tt.includes(qt)));
      if (allQueryInTarget) return true;

      // B. Target words are ALL in query (User's specific "Cửa ra tàu bay 30" -> "Cửa 30" request)
      // Only if result is descriptive enough (2+ tokens) to avoid noisy single-letter matches
      if (tTokens.length >= 2) {
        const allTargetInQuery = tTokens.every(tt => qTokens.some(qt => qt.includes(tt)));
        if (allTargetInQuery) return true;
      }

      return false;
    };

    const performSearch = async (query: string) => {
      const categorySection = document.getElementById("category-section");
      const sidebarInfo = document.getElementById("sidebar-info-panel");

      if (!query.trim()) {
        searchResults.style.display = "none";
        searchResults.innerHTML = "";
        if (categorySection) categorySection.style.display = "block";
        return;
      }

      // Hide categories while searching
      if (categorySection) categorySection.style.display = "none";
      if (sidebarInfo) sidebarInfo.style.display = "none";

      const lowerQuery = query.toLowerCase();

      // 1. Search for Categories & Subcategories
      const matchedCategories: any[] = [];
      const matchedSubCategories: any[] = [];

      if (!categoryTree || categoryTree.length === 0) {
        try { categoryTree = await ApiService.getCategories(); } catch (e) { }
      }

      /* Categories hidden as per user request to focus on locations
      categoryTree.forEach(cat => {
        const localizedCatName = TranslationManager.getName(cat);
        if (smartMatch(query, localizedCatName)) {
          matchedCategories.push({ ...cat, displayName: localizedCatName });
        }
        if (cat.subcategories) {
          cat.subcategories.forEach((sub: any) => {
            const localizedSubName = TranslationManager.getName(sub);
            if (smartMatch(query, localizedSubName)) {
              matchedSubCategories.push({ ...sub, displayName: localizedSubName, parentDisplayName: localizedCatName });
            }
          });
        }
      });
      */

      // 2. Filter results (DO NOT GROUP, as per user request to list all independently)
      // Tìm kiếm trả kết quả từ TẤT CẢ các tầng, không filter theo tầng hiện tại
      const allMatchedObjects: { name: string, primaryObject: any }[] = [];

      allMapObjects.forEach((obj) => {
        const localizedName = TranslationManager.getName(obj);
        if (localizedName && smartMatch(query, localizedName)) {
          allMatchedObjects.push({ name: localizedName, primaryObject: obj });
        }
      });

      // Show up to 25 items individual locations
      const uniqueResults = allMatchedObjects.slice(0, 25);

      if (uniqueResults.length === 0 && matchedCategories.length === 0 && matchedSubCategories.length === 0) {
        searchResults.innerHTML = `
          <div style="padding: 24px 16px; text-align: center; color: #999; font-size: 13px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" style="margin-bottom:6px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <div>${TranslationManager.t('no_results_found', 'Không tìm thấy kết quả')}</div>
          </div>
        `;
        searchResults.style.display = "block";
        clearSearchMarkers();
        return;
      }

      searchResults.innerHTML = "";

      // Render Location Results
      uniqueResults.forEach((result) => {
        const item = document.createElement("div");
        item.style.cssText = `
          display: flex; align-items: center;
          padding: 10px 16px;
          border-bottom: 1px solid #f0f2f5;
          cursor: pointer;
          background: white;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        `;

        item.onmouseenter = () => {
          item.style.backgroundColor = "#f0f4ff";
          item.style.borderLeft = "3px solid #cbd5e1";
        };
        item.onmouseleave = () => {
          item.style.backgroundColor = "white";
          item.style.borderLeft = "3px solid transparent";
        };

        const cleanName = result.name.replace(/room|door|gate/gi, '').trim();

        const floorObj = result.primaryObject.floor;
        const floorName = floorObj ? TranslationManager.getFloorName(floorObj.mappedinId || floorObj.id || floorObj.code, floorObj.name) : "";

        item.innerHTML = `
          <div style="
            flex-shrink: 0; width: 32px; height: 32px;
            border-radius: 50%; background: #f0f4f8;
            display: flex; align-items: center; justify-content: center;
            margin-right: 12px;
          ">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#214ca6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <div style="flex: 1; overflow: hidden;">
            <div style="font-weight: 500; font-size: 13px; color: #1a1a2e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cleanName}</div>
            ${floorName ? `<div style="font-size: 11px; color: #999; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${floorName}</div>` : ''}
          </div>
          <div style="flex-shrink: 0; margin-left: 8px; color: #ccc;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        `;

        item.addEventListener("click", async () => {
          searchInput.value = "";
          searchClearBtn.style.display = "none";
          searchResults.style.display = "none";

          const categorySection = document.getElementById("category-section");
          if (categorySection) categorySection.style.display = "block";

          const obj = result.primaryObject;
          let floorId = null;
          if (obj.floor) {
            floorId = typeof obj.floor === 'string' ? obj.floor : (obj.floor.id || obj.floorId);
          } else if (obj.floorId) {
            floorId = obj.floorId;
          }

          if (floorId) {
            try {
              // Ensure we exit Overview mode
              if (typeof (window as any).isMapInOverview === "function" && (window as any).isMapInOverview()) {
                (window as any).isInOverview = false;
              }

              const selector = document.getElementById("floor-selector") as HTMLSelectElement;
              if (selector) selector.value = floorId;

              // Use the safe floor switch helper
              await performFloorSwitch(floorId, "Search Result Navigation");
            } catch (e) {
              console.warn("Error switching floor from search:", e);
            }
          }

          setTimeout(() => {
            // Focus and highlight only this single selected location
            highlightObjects([obj], "📍");

            // Focus camera on object with SIDEBAR PADDING (380px)
            // This ensures the object is centered in the VISIBLE map area
            mapView.Camera.focusOn(obj, {
              duration: 1500,
              minZoomLevel: 19,
              maxZoomLevel: 21,
              padding: { top: 0, bottom: 0, left: 380, right: 0 }
            } as any);

            // Open the detail information panel in the sidebar
            if (typeof (window as any).updateInfo === "function") {
              (window as any).updateInfo(obj);
            } else if (typeof updateInfo === "function") {
              updateInfo(obj);
            }
          }, 800);
        });

        searchResults.appendChild(item);
      });

      searchResults.style.display = "block";
    };
  }


  // ============================================
  // 4. HELPER FUNCTIONS CHO DEBUG VÀ UTILITIES
  // ============================================
  /**
   * Resolve object đầy đủ từ id (dùng khi object chỉ có id/__type stub)
   */
  const resolveObjectById = (id: string) => {
    if (!id) return null;
    const tryTypes = [
      "space", "area", "point-of-interest", "point", "door",
      "customObject", "location", "elevator", "stairway", "escalator", "connection", "object",
    ];
    for (const t of tryTypes) {
      try {
        const arr = mapData.getByType(t as any) as any[];
        const found = arr?.find((x: any) => x?.id === id);
        if (found) return found;
      } catch { }
    }
    return null;
  };

  /**
   * Tính centroid từ polygon ring (dùng làm fallback anchor)
   */
  const centroidFromRing = (ring: any[]) => {
    if (!Array.isArray(ring) || ring.length === 0) return null;
    let sx = 0, sy = 0, n = 0;
    for (const p of ring) {
      if (Array.isArray(p) && p.length >= 2) {
        sx += Number(p[0]);
        sy += Number(p[1]);
        n += 1;
      }
    }
    if (!n) return null;
    return { latitude: sy / n, longitude: sx / n };
  };

  /**
   * Lấy anchor/coordinate của object (thử nhiều cách)
   */
  const getObjectAnchor = (obj: any) => {
    if (!obj) return null;
    // Thử lấy trực tiếp
    const direct = obj?.coordinate || obj?.anchor || obj?.position || null;
    if (direct) return direct;

    // Nếu là stub, resolve object đầy đủ
    const resolved = resolveObjectById(obj?.id);
    const resolvedDirect = resolved?.coordinate || resolved?.anchor || resolved?.position || null;
    if (resolvedDirect) return resolvedDirect;

    // Fallback: tính centroid từ polygon
    const geo = resolved?.geoJSON || obj?.geoJSON;
    const coords = geo?.geometry?.coordinates;
    const ring = Array.isArray(coords) ? coords?.[0]?.[0] ?? coords?.[0] : null;
    return centroidFromRing(ring);
  };

  // Expose helper functions cho console debug
  (window as any).listAllObjectIds = () => {
    const getAllByTypes = (types: string[]) => {
      const out: any[] = [];
      types.forEach((t) => {
        try {
          const arr = mapData.getByType(t as any) as any[];
          if (Array.isArray(arr) && arr.length) out.push(...arr);
        } catch { }
      });
      return out.filter((obj, idx, self) => idx === self.findIndex((o: any) => o?.id === obj?.id));
    };

    const getAllLocationsEverywhere = () => {
      const mapDataAny = mapData as any;
      const out: any[] = [];
      try {
        const locs = mapData.getByType("location" as any) as any[];
        if (Array.isArray(locs) && locs.length) out.push(...locs);
      } catch { }
      try {
        if (Array.isArray(mapDataAny.locations) && mapDataAny.locations.length) out.push(...mapDataAny.locations);
      } catch { }
      return out.filter((obj, idx, self) => idx === self.findIndex((o: any) => o?.id === obj?.id));
    };

    const locations = getAllLocationsEverywhere();
    const core = getAllByTypes([
      "space", "area", "point-of-interest", "point", "door",
      "customObject", "elevator", "stairway", "connection", "floor",
    ]);

    const all = [...core, ...locations].filter(
      (obj, idx, self) => idx === self.findIndex((o: any) => o?.id === obj?.id)
    );

    return all.map((o: any) => ({
      id: o?.id,
      name: o?.name,
      type: o?.type || o?.__type,
      category: o?.category,
      floorId: o?.floorId || o?.floor?.id,
      isLocation: (o?.id || "").toString().startsWith("o_"),
    }));
  };

  (window as any).makeLocationUrl = (locationId: string, floorId?: string) => {
    const url = new URL(window.location.href);
    if (floorId) url.searchParams.set("floor", floorId);
    url.searchParams.set("location", locationId);
    return url.toString();
  };

  // ============================================
  // 5. LẤY ELEVATORS VÀ STAIRWAYS
  // ============================================
  let allElevators: any[] = [];
  let allStairways: any[] = [];
  let allEscalators: any[] = [];

  // Lấy elevators từ connections
  try {
    const connections = mapData.getByType("connection");
    if (connections && connections.length > 0) {
      const elevatorConnections = connections.filter((conn: any) => {
        const type = conn.type?.toLowerCase() || '';
        return type.includes('elevator') || conn.type === 'Elevator';
      });
      allElevators.push(...elevatorConnections);

      const stairwayConnections = connections.filter((conn: any) => {
        const type = conn.type?.toLowerCase() || '';
        return type.includes('stair') || conn.type === 'Stairway';
      });
      allStairways.push(...stairwayConnections);

      const escalatorConnections = connections.filter((conn: any) => {
        const type = conn.type?.toLowerCase() || '';
        return type.includes('escalator') || conn.type === 'Escalator';
      });
      allEscalators.push(...escalatorConnections);
    }
  } catch (e) { }

  // Thêm elevators, stairways và escalators vào allMapObjects VỚI tọa độ
  allElevators.forEach((elev: any) => {
    if (!allMapObjects.find((obj: any) => obj.id === elev.id)) {
      const coord = elev.coordinate || (elev.coordinates && elev.coordinates[0]) || null;
      allMapObjects.push({
        id: elev.id,
        name: TranslationManager.getName(elev),
        type: 'elevator',
        floorId: elev.floor?.id,
        coordinate: coord
      });
    }
  });

  allStairways.forEach((stair: any) => {
    if (!allMapObjects.find((obj: any) => obj.id === stair.id)) {
      const coord = stair.coordinate || (stair.coordinates && stair.coordinates[0]) || null;
      allMapObjects.push({
        id: stair.id,
        name: TranslationManager.getName(stair),
        type: 'stairway',
        floorId: stair.floor?.id,
        coordinate: coord
      });
    }
  });

  allEscalators.forEach((esc: any) => {
    if (!allMapObjects.find((obj: any) => obj.id === esc.id)) {
      const coord = esc.coordinate || (esc.coordinates && esc.coordinates[0]) || null;
      allMapObjects.push({
        id: esc.id,
        name: TranslationManager.getName(esc),
        type: 'escalator',
        floorId: esc.floor?.id,
        coordinate: coord
      });
    }
  });

  // Expose cho console
  (window as any).allElevators = allElevators;
  (window as any).allStairways = allStairways;
  (window as any).allEscalators = allEscalators;

  // ============================================
  // 6. OBJECTS TỪ getByType("object")
  // ============================================
  /**
   * Lấy tất cả objects từ mapData.getByType("object")
   * Đây là các objects được tạo trong Mappedin Editor
   */
  const objects = (() => {
    try {
      return mapData.getByType("object") || [];
    } catch {
      return [];
    }
  })();

  // Log chi tiết objects vào console
  console.log("📦 All objects:", objects);

  if (!objects || objects.length === 0) {
    console.warn("⚠️ Không có object nào trong map");
  } else {
    // Log chi tiết từng object
    console.group("🧩 OBJECT DETAILS");
    objects.forEach((obj: any) => {
      console.log({
        id: obj.id,
        name: obj.name,
        type: obj.type,
        category: obj.category,
        floor: obj.floor?.name,
        coordinates: obj.coordinates,
        metadata: obj.metadata,
      });
    });
    console.groupEnd();

    // Thống kê theo type
    const summary: Record<string, number> = {};
    objects.forEach((obj: any) => {
      summary[obj.type] = (summary[obj.type] || 0) + 1;
    });
    console.log("📊 Object summary:", summary);

    // Log object mẫu
    if (objects.length > 0) {
      const sample = objects[0] as any;
      console.log("🔍 Sample object detail:", {
        id: sample.id,
        name: sample.name,
        type: sample.type,
        floor: sample.floor?.name,
        coordinates: sample.coordinates,
        metadata: sample.metadata,
      });
    }
  }

  // Map markerId -> object để click handler có thể resolve
  const markerIdToObject = new Map<string, any>();
  const objectMarkers: any[] = [];

  // Lưu reference đến marker "Main Entrance" để có thể ẩn/hiện
  let mainEntranceMarker: any = null;
  // Lưu object "Main Entrance" để có thể tạo lại marker
  let mainEntranceObject: any = null;
  // Lưu reference đến marker tên bản đồ
  let mapNameMarker: any = null;

  // Box icon fallback (emoji) - thay vì sun icon
  const boxIconFallback = "📦";

  /**
   * Xóa tất cả object markers
   */
  const clearObjectMarkers = () => {
    try {
      objectMarkers.forEach((m) => {
        try {
          mapView.Markers.remove(m);
        } catch { }
      });
    } catch { }
    objectMarkers.length = 0;
    markerIdToObject.clear();
  };

  /**
   * Render object markers cho floor hiện tại
   * Tham khảo cách render connection markers
   */
  const renderObjectMarkersForCurrentFloor = () => {
    clearObjectMarkers();
    if (!objects || objects.length === 0) return;

    const currentFloorId = mapView.currentFloor?.id;

    objects.forEach((objStub: any) => {
      const obj = resolveObjectById(objStub?.id) || objStub;
      if (!obj.name) return;

      if (currentFloorId) {
        const objFloorId = obj.floor?.id || obj.floorId;
        if (objFloorId && objFloorId !== currentFloorId) return;
      }

      // Lấy coordinates (thử nhiều cách)
      let coordsToRender: any[] = [];
      if (Array.isArray(obj.coordinates) && obj.coordinates.length > 0) {
        coordsToRender = obj.coordinates;
      } else {
        const singleCoord = obj.coordinate || obj.anchor || obj.position;
        if (singleCoord) {
          coordsToRender.push(singleCoord);
        }
      }

      if (coordsToRender.length === 0) return;


      // Lấy image nếu có (từ photos/images/metadata)
      let imageUrl: string | null = null;
      if (obj.photos && Array.isArray(obj.photos) && obj.photos.length > 0) {
        const photo = obj.photos[0];
        if (typeof photo === "string") {
          imageUrl = photo;
        } else if (photo?.url || photo?.src || photo?.href) {
          imageUrl = photo.url || photo.src || photo.href;
        }
      } else if (obj.images && Array.isArray(obj.images) && obj.images.length > 0) {
        const img = obj.images[0];
        if (typeof img === "string") {
          imageUrl = img;
        } else if (img?.url || img?.src || img?.href) {
          imageUrl = img.url || img.src || img.href;
        }
      } else if (obj.metadata?.image || obj.metadata?.photo) {
        imageUrl = obj.metadata.image || obj.metadata.photo;
      }

      // Render marker cho mỗi coordinate (tham khảo connection markers style)
      coordsToRender.forEach((coord: any) => {
        try {
          // Ưu tiên lấy tên từ Database thông qua TranslationManager để đồng bộ ngôn ngữ
          const localizedName = TranslationManager.getName(obj);
          const label = (localizedName && localizedName !== obj.id) ? localizedName : obj.name;

          let markerHtml: string;

          // 1. Force ATM Icon override
          // 1. Get SubCategory Icon from TranslationManager data (Pre-fetched from Backend)
          let activeIconUrl = imageUrl;

          try {
            // Look up extended data for this object
            const locData = TranslationManager.data.locations?.[obj.id] || TranslationManager.data.locations?.[obj.mappedinId];
            if (locData && locData.subCategoryIcon) {
              const iconPath = locData.subCategoryIcon;
              // Basic validation: must have extension and not be empty
              if (iconPath && iconPath.indexOf('.') !== -1) {
                if (iconPath.startsWith('/')) {
                  activeIconUrl = iconPath;
                } else {
                  activeIconUrl = `/icon-category/${iconPath}`;
                }
              }
            }
          } catch (e) { }

          // 2. Force ATM Icon override (Preserve specific override as requested)
          // Manual override for ATMs as requested
          if (label && (label.toLowerCase().includes('atm') || label.toLowerCase().includes('ngân hàng') || label.toLowerCase().includes('bank'))) {
            activeIconUrl = "/icon-category/AirportService/atm.png";
          }

          if (activeIconUrl) {
            // Có image → dùng image (Square Style - Premium Design)
            // Use onerror fallback to prevent white boxes
            const onerrorStr = `
              if (this.dataset.tried === 'true') {
                 this.style.display='none'; 
                 // If fallback fails, show text fallback
                 this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-weight:bold;font-size:15px;\\'>${label.charAt(0).toUpperCase()}</div>';
              } else {
                 this.dataset.tried = 'true';
                 // Try reverting to original Mappedin image if different
                 if ('${imageUrl || ''}' !== '' && this.src.indexOf('${imageUrl || 'SHOULD_NOT_MATCH'}') === -1) {
                    this.src = '${imageUrl}';
                 } else {
                    this.style.display='none';
                    this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-weight:bold;font-size:15px;\\'>${label.charAt(0).toUpperCase()}</div>';
                 }
              }
            `.replace(/\s+/g, ' ');

            markerHtml = `
              <div class="mappedin-poi-marker" style="display:flex;flex-direction:column;align-items:center;gap:3px; transition: opacity 0.3s ease, transform 0.3s ease;">
                <div style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:50%;box-shadow:0 3px 6px rgba(0,0,0,0.15);border:1.5px solid #fff;">
                  <img src="${activeIconUrl}" alt="${label}" onerror="${onerrorStr}" style="width:20px;height:20px;object-fit:contain;" />
                </div>
                <div style="font-size:13px;line-height:1.2;font-weight:600;color:#333;text-shadow:0 0 4px rgba(255,255,255,0.9),0 0 8px rgba(255,255,255,0.8);white-space:nowrap;">
                  ${label}
                </div>
              </div>
            `;
          } else {
            // Không có image → dùng box icon 📦
            markerHtml = `
              <div class="mappedin-poi-marker" style="display:flex;flex-direction:column;align-items:center;gap:2px; transition: opacity 0.3s ease, transform 0.3s ease;">
                <div style="display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 4px rgba(255,255,255,0.8));">
                  <div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:20px;">
                    ${boxIconFallback}
                  </div>
                </div>
                <div style="font-size:13px;line-height:1.2;font-weight:600;color:#333;text-shadow:0 0 4px rgba(255,255,255,0.9),0 0 8px rgba(255,255,255,0.8);white-space:nowrap;">
                  ${label}
                </div>
              </div>
            `;
          }

          const marker = mapView.Markers.add(coord, markerHtml, {
            interactive: true,
          } as any);

          objectMarkers.push(marker);
          const markerId = (marker as any)?.id;
          if (markerId) {
            // Lưu object đầy đủ vào map
            markerIdToObject.set(markerId, obj);
          }
        } catch (e) {
          // Bỏ qua nếu có lỗi
        }
      });
    });
  };

  // Initial render
  renderObjectMarkersForCurrentFloor();

  // Thêm objects vào allMapObjects để có thể click và highlight
  objects.forEach((obj: any) => {
    // Resolve object đầy đủ
    const resolvedObj = resolveObjectById(obj?.id) || obj;
    // Chỉ thêm objects có name
    if (resolvedObj.name && !allMapObjects.find((o: any) => o.id === resolvedObj.id)) {
      allMapObjects.push(resolvedObj);
    }
  });

  // Expose cho console debug
  (window as any).allObjects = objects;
  (window as any).renderObjectMarkers = renderObjectMarkersForCurrentFloor;
  (window as any).clearObjectMarkers = clearObjectMarkers;

  // ============================================
  // 7. CONNECTION MARKERS (THANG MÁY, THANG CUỐN)
  // ============================================
  const connections = (() => {
    try {
      // 1. Lấy connections chính thống
      const nativeConns = mapData.getByType("connection") || [];

      // 2. Fallback: Nếu không có hoặc có ít, tìm thêm từ allMapObjects theo từ khóa
      const keywordConns = allMapObjects.filter((obj: any) => {
        const type = (obj.type || "").toLowerCase();
        const category = (obj.category || "").toLowerCase();
        const name = (obj.name || "").toLowerCase();
        return (type.includes("elevator") || category.includes("elevator") || name.includes("thang máy") || name.includes("elevator") ||
          type.includes("escalator") || category.includes("escalator") || name.includes("thang cuốn") || name.includes("escalator") ||
          type.includes("stair") || category.includes("stair") || name.includes("cầu thang") || name.includes("stairway"));
      });

      // Gộp và loại trùng
      const combined = [...nativeConns, ...keywordConns];
      const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

      console.log(`🔌 [CONNECTIONS] Found ${nativeConns.length} native and ${keywordConns.length} keyword-based connections.`);
      if (unique.length > 0) {
        console.group("📋 LIST OF ALL CONNECTIONS");
        console.table(unique.map(c => ({
          ID: c.id,
          Name: c.name || TranslationManager.getName(c) || "Unnamed",
          Type: c.type || "unknown"
        })));
        console.groupEnd();
      }
      return unique;
    } catch (e) {
      console.warn("Error fetching connections:", e);
      return [];
    }
  })();

  const elevatorIconUrl = new URL("./icon/Connection/Elevator.png", import.meta.url).href;
  const escalatorIconUrl = new URL("./icon/Connection/escalators.png", import.meta.url).href;
  const airplaneIconUrl = new URL("./icon/mainBuiding/airplane.jpg", import.meta.url).href;

  const markerIdToConnection = new Map<string, any>();
  const connectionMarkers: any[] = [];

  // Cấu hình zoom threshold (Giảm xuống để hiện sớm hơn)
  const DEFAULT_CONNECTION_MARKER_MIN_ZOOM = 16.5; // Ngưỡng ẩn khi zoom xa
  if ((window as any).CONNECTION_MARKER_MIN_ZOOM == null) {
    (window as any).CONNECTION_MARKER_MIN_ZOOM = DEFAULT_CONNECTION_MARKER_MIN_ZOOM;
  }

  // getCameraZoom đã được định nghĩa ở trên (sau khi mapView được tạo)

  let connectionMarkersVisible = false;
  let lastConnectionZoomBucket: number | null = null;

  /**
   * Tạo HTML cho connection marker (icon + label, scale theo zoom)
   */
  const getConnectionMarkerHtml = (icon: string, text: string) => {
    // Luôn sử dụng kích thước chuẩn như các icon khác (34px container, 20px icon)
    const size = 20;

    return `
      <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
        <div style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:50%;box-shadow:0 3px 6px rgba(0,0,0,0.15);border:1.5px solid #fff;">
          <img src="${icon}" alt="${text}" style="width:${size}px;height:${size}px;object-fit:contain;" />
        </div>
        <div style="font-size:13px;line-height:1.2;font-weight:600;color:#333;text-shadow:0 0 4px rgba(255,255,255,0.9), 0 0 8px rgba(255, 255, 255, 0.8);white-space:nowrap;">
          ${text}
        </div>
      </div>
    `;
  };

  /**
   * Xác định style (text + icon) cho connection dựa trên type
   */
  const resolveConnStyle = (conn: any) => {
    const t = (conn?.type || conn?.category || "").toString().toLowerCase();

    // Check if we have a specific name in AreaList (seeded)
    const dbName = TranslationManager.getName(conn);

    // Default translations from UI keys
    let text = "";
    let icon = escalatorIconUrl;

    if (t.includes("elevator")) {
      text = TranslationManager.t('elevator', 'Thang máy');
      icon = elevatorIconUrl;
    } else if (t.includes("escalator") || t.includes("stair")) {
      text = TranslationManager.t('escalator', 'Thang cuốn');
      icon = escalatorIconUrl;
    } else {
      text = conn?.type || TranslationManager.t('connection', 'Connection');
      icon = escalatorIconUrl;
    }

    // If we have a custom name in DB that isn't just the ID, prefer it
    if (dbName && dbName !== conn.id) {
      text = dbName;
    }

    // NEW: Check for SubCategory Icon override (Priority!)
    try {
      const locData = TranslationManager.data.locations?.[conn.id] || TranslationManager.data.locations?.[conn.mappedinId];
      if (locData && locData.subCategoryIcon) {
        const iconPath = locData.subCategoryIcon;
        if (iconPath && iconPath.indexOf('.') !== -1) {
          if (iconPath.startsWith('/')) {
            icon = iconPath;
          } else {
            icon = `/icon-category/${iconPath}`;
          }
        }
      }
    } catch (e) { }

    // Log resolution for debugging
    if (t.includes("elevator") || t.includes("escalator") || t.includes("stair")) {
      // console.log(`🏷️ [RESOLVE-CONN] ID: ${conn.id}, Type: ${t}, DB Name: ${dbName}, Final Text: ${text}, Icon: ${icon}`);
    }

    return { text, icon };
  };

  // Log raw connections here after resolveConnStyle is defined
  console.log("🔍 [CONNECTIONS] Raw connection objects from mapData:", (connections || []).map((c: any) => {
    const style = resolveConnStyle(c);
    return {
      id: c.id,
      type: c.type,
      resolvedName: style.text,
      floorIds: Array.isArray(c.coordinates) ? [...new Set(c.coordinates.map((coord: any) => coord.floorId))] : []
    };
  }));

  /**
   * Xóa tất cả connection markers
   */
  const clearConnectionOverlays = () => {
    try {
      connectionMarkers.forEach((m) => {
        try {
          mapView.Markers.remove(m);
        } catch { }
      });
    } catch { }
    connectionMarkers.length = 0;
    markerIdToConnection.clear();
  };

  /**
   * Render connection markers cho floor hiện tại
   */
  const renderConnectionOverlaysForCurrentFloor = () => {
    const currentFloorId = mapView.currentFloor?.id;
    console.log(`🔌 [CONNECTIONS] Attempting to render overlays for floor: ${currentFloorId} (Markers Visible: ${connectionMarkersVisible})`);

    if (!connectionMarkersVisible) {
      console.log("🔌 [CONNECTIONS] Skipping render: visibility flag is false");
      return;
    }
    clearConnectionOverlays();
    const currentZoom = getCameraZoom();
    const coordKey = (c: any) =>
      `${c?.floorId || ""}:${c?.latitude?.toFixed?.(6) ?? c?.latitude}:${c?.longitude?.toFixed?.(6) ?? c?.longitude}`;

    (connections || []).forEach((conn: any) => {
      const coords = Array.isArray(conn.coordinates) ? conn.coordinates : [];
      const floorCoords = coords.filter((c: any) => !currentFloorId || c?.floorId === currentFloorId);
      if (floorCoords.length === 0) return;

      // Loại bỏ duplicate coordinates trên cùng floor
      const seen = new Set<string>();
      const uniqueCoords = floorCoords.filter((c: any) => {
        const k = coordKey(c);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      const { text, icon } = resolveConnStyle(conn);
      uniqueCoords.forEach((coord: any) => {
        try {
          const marker = mapView.Markers.add(
            coord,
            getConnectionMarkerHtml(icon, text),
            { interactive: true } as any
          );

          connectionMarkers.push(marker);
          const markerId = (marker as any)?.id;
          if (markerId) {
            (conn as any).__iconUrl = icon;
            (conn as any).__labelText = text;
            markerIdToConnection.set(markerId, conn);
          }
        } catch { }
      });
    });

    console.log(`🔌 Rendered ${connectionMarkers.length} connection markers on floor: ${currentFloorId}`);
    if (connections && connections.length > 0) {
      console.log("📍 Connection objects found in mapData:", connections.map((c: any) => ({
        id: c.id,
        type: c.type,
        coordsCount: c.coordinates?.length || 0
      })));
    }
  };

  (window as any).renderConnectionOverlaysForCurrentFloor = renderConnectionOverlaysForCurrentFloor;

  /**
   * Cập nhật visibility của connection markers dựa trên zoom
   */
  const updateConnectionMarkersVisibility = () => {
    const z = getCameraZoom();
    // Nếu không đọc được zoom, hiển thị luôn
    if (z == null) {
      if (!connectionMarkersVisible) {
        connectionMarkersVisible = true;
        renderConnectionOverlaysForCurrentFloor();
      }
      return;
    }

    const threshold = (window as any).CONNECTION_MARKER_MIN_ZOOM ?? DEFAULT_CONNECTION_MARKER_MIN_ZOOM;
    const shouldShow = z >= threshold;
    // Bucket zoom để tránh rerender liên tục
    const bucket = Math.round(z / 0.15);

    if (shouldShow !== connectionMarkersVisible) {
      connectionMarkersVisible = shouldShow;
      lastConnectionZoomBucket = bucket;
      if (shouldShow) renderConnectionOverlaysForCurrentFloor();
      else clearConnectionOverlays();
      return;
    }

    // Rerender khi zoom bucket thay đổi để icon scale và label xuất hiện
    if (connectionMarkersVisible && bucket !== lastConnectionZoomBucket) {
      lastConnectionZoomBucket = bucket;
      renderConnectionOverlaysForCurrentFloor();
    }
  };

  // Khởi tạo và setup listeners
  updateConnectionMarkersVisibility();
  try {
    (mapView as any).on?.("camera-change", updateConnectionMarkersVisibility);
  } catch { }
  setInterval(updateConnectionMarkersVisibility, 250);

  // NEW: Listen for Language Change to refresh selected Info Panel
  window.addEventListener('language-change', () => {
    if (selectedSpace && (window as any).updateInfo) {
      console.log("🌐 Language changed, refreshing Info Panel for:", selectedSpace.name);
      (window as any).updateInfo(selectedSpace);
    }
  });

  // Expose helpers cho DevTools
  (window as any).logConnectionZoom = () => getCameraZoom();
  if ((window as any).CONNECTION_LABEL_ZOOM_OFFSET == null) (window as any).CONNECTION_LABEL_ZOOM_OFFSET = 0.15;
  if ((window as any).CONNECTION_ICON_MAX_SCALE == null) (window as any).CONNECTION_ICON_MAX_SCALE = 3.0;
  if ((window as any).CONNECTION_SHOW_LABEL_ALWAYS == null) (window as any).CONNECTION_SHOW_LABEL_ALWAYS = true;

  // ============================================
  // 8. SETUP INTERACTIVE STATES CHO OBJECTS
  // ============================================
  /**
   * Thiết lập interactive state cho tất cả objects:
   * - Màu nền trắng
   * - Hover màu vàng nhạt (nếu có name)
   * - Space không có location thì không interactive
   */
  // === HỆ THỐNG MÀU PREMIUM AIRPORT - TẦNG TRỆT ===
  // ID tầng trệt trong Mappedin
  const GF_FLOOR_ID = 'm_dae8f26a40f6017f';

  // Bảng màu phân lớp theo vai trò không gian
  // Nguyên tắc: 70% trung tính sáng, 20% xám xanh lạnh, 10% nhấn ấm
  const GF_ZONE_PALETTE: Record<string, { fill: string; hover: string }> = {
    public_landside: { fill: '#F4F0E8', hover: '#EDE8DC' },  // Sảnh đến, khu công cộng
    airside: { fill: '#E4EBF2', hover: '#D8E2EC' },  // Hành lang airside, pier
    gate: { fill: '#DCE5EC', hover: '#D0DBE5' },  // Cửa ra tàu bay
    operational: { fill: '#C7D0D8', hover: '#BBC6D0' },  // Đường công vụ, hậu cần
    fnb: { fill: '#E8D5BC', hover: '#DFCAAE' },  // F&B, ẩm thực, cà phê
    retail: { fill: '#E2D4C4', hover: '#D9C9B7' },  // Cửa hàng, mua sắm
    restroom: { fill: '#DCEAF2', hover: '#CFE1ED' },  // WC, nhà vệ sinh
    passenger_service: { fill: '#D8E4ED', hover: '#CBDCE8' },  // ATM, thông tin, đổi tiền
    special_amenity: { fill: '#DCC8BE', hover: '#D2BAB0' },  // Massage, cầu nguyện
    security: { fill: '#C8D3DE', hover: '#BBC8D5' },  // Hải quan, nhập cảnh
    lounge: { fill: '#E0D8CE', hover: '#D6CCBF' },  // Phòng chờ VIP, CIP
    office: { fill: '#D0D5DB', hover: '#C4CAD2' },  // Văn phòng
  };

  // Phân loại khu vực tầng trệt theo tên
  const classifyGFZone = (name: string): string => {
    const n = name.toLowerCase();

    // F&B / Ẩm thực - nhấn ấm nhẹ, dễ nhận biết
    if (n.includes('cà phê') || n.includes('coffee') || n.includes('bánh ngọt') ||
      n.includes('bakery') || n.includes('đồ ăn nhanh') || n.includes('fast food') ||
      n.includes('món ăn địa phương') || n.includes('local food') ||
      n.includes('ẩm thực') || n.includes('food court') || n.includes('dining') ||
      n.includes('tráng miệng') || n.includes('dessert') || n.includes('f&b') ||
      n.includes('quầy bar') || n.includes('nhà hàng') || n.includes('restaurant') ||
      n.includes('thực phẩm') || n.includes('đồ ăn') || n.includes('bán đồ ăn')) {
      return 'fnb';
    }

    // WC / Nhà vệ sinh - xanh ice nhạt, sạch sẽ
    if (n.includes('nhà vệ sinh') || n.includes('wc') || n.includes('toilet') ||
      n.includes('restroom') || n.includes('vệ sinh')) {
      return 'restroom';
    }

    // Tiện ích đặc biệt - hồng be ấm, khác biệt với retail
    if (n.includes('massage') || n.includes('cầu nguyện') || n.includes('prayer') ||
      n.includes('nghỉ ngơi') || n.includes('nap zone') || n.includes('rest area') ||
      n.includes('hút thuốc') || n.includes('smoking')) {
      return 'special_amenity';
    }

    // Cửa ra tàu bay / Gates - xanh thép lạnh
    if (n.includes('cửa ra tàu bay') || n.includes('gate ') || n.includes('cổng đến') ||
      n.includes('arrival gate')) {
      return 'gate';
    }

    // Vận hành / Đường công vụ - xám đậm hơn, tách khỏi hành khách
    if (n.includes('công vụ') || n.includes('service road') ||
      n.includes('băng chuyền hành lý') || n.includes('baggage conveyor') ||
      n.includes('hành lý quá khổ') || n.includes('oversized')) {
      return 'operational';
    }

    // An ninh / Hải quan / Nhập cảnh / Hành lý
    if (n.includes('hải quan') || n.includes('customs') || n.includes('nhập cảnh') ||
      n.includes('immigration') || n.includes('an ninh') || n.includes('security') ||
      n.includes('sinh trắc') || n.includes('biometric') ||
      n.includes('nhận hành lý') || n.includes('baggage claim') ||
      n.includes('nối chuyến') || n.includes('transfer') ||
      n.includes('hành lý thất lạc') || n.includes('lost')) {
      return 'security';
    }

    // Phòng chờ / Lounge - be ấm tinh tế
    if (n.includes('phòng chờ') || n.includes('lounge') || n.includes('cip') ||
      n.includes('visa') || n.includes('thương gia') || n.includes('business class')) {
      return 'lounge';
    }

    // Dịch vụ hành khách - xanh dịu, dễ nhận ra
    if (n.includes('atm') || n.includes('thông tin du lịch') || n.includes('tourist info') ||
      n.includes('đổi ngoại tệ') || n.includes('currency') || n.includes('ngoại tệ') ||
      n.includes('viễn thông') || n.includes('telecom') || n.includes('ngân hàng') ||
      n.includes('bank') || n.includes('bưu điện') || n.includes('post') ||
      n.includes('đón tiễn') || n.includes('pick up') || n.includes('welcome') ||
      n.includes('y tế') || n.includes('medical')) {
      return 'passenger_service';
    }

    // Retail / Cửa hàng - be taupe, nổi vừa đủ
    if (n.includes('cửa hàng') || n.includes('shop') || n.includes('store') ||
      n.includes('miễn thuế') || n.includes('duty free') || n.includes('bán lẻ') ||
      n.includes('retail') || n.includes('lưu niệm') || n.includes('souvenir') ||
      n.includes('tiện lợi') || n.includes('convenience') || n.includes('sách') ||
      n.includes('book') || n.includes('tiệm hoa') || n.includes('flower') ||
      n.includes('trang sức') || n.includes('jewelry') || n.includes('mỹ phẩm') ||
      n.includes('cosmetic') || n.includes('thời trang') || n.includes('fashion') ||
      n.includes('rượu') || n.includes('liquor') || n.includes('thuốc lá') ||
      n.includes('tobacco') || n.includes('điện tử') || n.includes('electronic') ||
      n.includes('nhà thuốc') || n.includes('pharmacy')) {
      return 'retail';
    }

    // Văn phòng - xám trung tính
    if (n.includes('văn phòng') || n.includes('office')) {
      return 'office';
    }

    // Khu ga đi / đến - airside
    if (n.includes('ga đến') || n.includes('ga đi') || n.includes('departure') ||
      n.includes('arrival') || n.includes('khu ga')) {
      return 'airside';
    }

    // Khu công cộng / Landside - ấm, sáng, thân thiện
    if (n.includes('sảnh') || n.includes('hall') || n.includes('công cộng') ||
      n.includes('public') || n.includes('cửa ra vào') || n.includes('entrance') ||
      n.includes('vui chơi') || n.includes('kids') || n.includes('văn hóa') ||
      n.includes('cultural') || n.includes('triển lãm') || n.includes('internet') ||
      n.includes('đỗ xe') || n.includes('parking') || n.includes('khách sạn') ||
      n.includes('hotel') || n.includes('taxi')) {
      return 'public_landside';
    }

    // Mặc định cho tầng trệt: airside (phần lớn GF là khu airside)
    return 'airside';
  };

  // === HỆ THỐNG MÀU PREMIUM AIRPORT - TẦNG 1 (PROCESSING FLOOR) ===
  const F1_ZONE_PALETTE: Record<string, { fill: string; hover: string }> = {
    // 1. Processing Zones
    customs_security: { fill: '#AEBAC5', hover: '#A0ACB8' }, // Kiểm soát biên giới/hải quan
    baggage_zone: { fill: '#D4E0EA', hover: '#C8D6E1' }, // Nền nhận hành lý tổng (đậm hơn airside 1 bậc)
    baggage_island: { fill: '#C6D4E1', hover: '#B9C8D5' }, // Băng chuyền neo khối
    transfer_desk: { fill: '#BDCBD6', hover: '#B0BECA' }, // Điểm nối chuyến
    service_counter: { fill: '#C8D3DE', hover: '#BBC8D5' }, // Hành lý thất lạc, đón tiễn

    // 2. Commercial & Comfort
    fnb_retail: { fill: '#D8B58D', hover: '#CDA980' }, // Điểm nhấn ấm F&B Retail
    waiting_lounge: { fill: '#E3DACD', hover: '#D9CFC1' }, // Cầu nối Lounge/Airside
    passenger_service: { fill: '#DCEAF2', hover: '#CFE1ED' }, // Tiện ích phổ thông (WC, ATM)

    // 3. Foundation / Base
    public_landside: { fill: '#F4F0E8', hover: '#EDE8DC' }, // Khu sảnh đón
    airside: { fill: '#DCE5EC', hover: '#D0DBE5' }, // Nền Airside chung
    operational: { fill: '#C7D0D8', hover: '#BBC6D0' }, // Khu vận hành
    neutral_support: { fill: '#EEF2F5', hover: '#E2E8ED' }, // SAFE FALLBACK
  };

  const classifyF1Zone = (name?: string): string => {
    const n = (name || '').toLowerCase().trim();

    // 1. Customs & Security
    if (n.includes('nhập cảnh') || n.includes('hải quan') || n.includes('customs') || n.includes('immigration')) return 'customs_security';

    // 2. Baggage System (Hierarchy 2 lớp không gian)
    // Lớp 1: Khối băng chuyền
    if (n.includes('đảo nhận hành lý') || n.includes('baggage claim island') || n.includes('băng chuyền hành lý') || n.includes('carousel')) return 'baggage_island';
    // Lớp 2: Diện tích nền xung quanh băng chuyền (Bao gồm Hành lý quá khổ)
    if (n.includes('khu nhận hành lý') || n.includes('nhận hành lý nội địa') || n.includes('nhận hành lý quốc tế') || n.includes('baggage claim') || n.includes('hành lý quá khổ')) return 'baggage_zone';

    // 3. Transfer Edge
    if (n.includes('nối chuyến') || n.includes('transfer')) return 'transfer_desk';

    // 4. Retail, F&B & Commercial (Warm Accent)
    if (n.includes('miễn thuế') || n.includes('cửa hàng') || n.includes('shop') || n.includes('retail') ||
      n.includes('cà phê') || n.includes('bánh ngọt') || n.includes('đồ ăn') || n.includes('ẩm thực') ||
      n.includes('nhà thuốc') || n.includes('nhà sách') || n.includes('hoa') || n.includes('flower') ||
      n.includes('món ăn địa phương') || n.includes('văn hóa truyền thống') || n.includes('đổi ngoại tệ') ||
      n.includes('currency exchange') || n.includes('currency')) return 'fnb_retail';

    // 5. Waiting & Lounges (Comforting Area)
    if (n.includes('phòng chờ') || n.includes('lounge') || n.includes('visa') ||
      n.includes('khu ga đến quốc nội') || n.includes('waiting')) return 'waiting_lounge';

    // 6. Service Counters (Operational Services/Resolutions)
    if (n.includes('hành lý thất lạc') || n.includes('lost and found') || n.includes('lost & found') || n.includes('quầy hành lý thất lạc') || n.includes('lost') ||
      n.includes('đón tiễn') || n.includes('pick up')) return 'service_counter';

    // 7. General Passenger Services (Utilities)
    if (n.includes('wc') || n.includes('vệ sinh') || n.includes('thang máy') || n.includes('thang cuốn') ||
      n.includes('elevator') || n.includes('escalator') || n.includes('ngân hàng') || n.includes('bank') ||
      n.includes('thông tin du lịch') || n.includes('atm') || n.includes('information')) return 'passenger_service';

    // 8. Public / Landside (Siết chặt keyword)
    if (n.includes('cửa ra vào sảnh') || n.includes('cửa ra sảnh') || n.includes('sảnh công cộng') || n.includes('public concourse') || n.includes('sảnh đón') || n.includes('sảnh đến')) return 'public_landside';

    // 9. Operational explicitly
    if (n.includes('công vụ') || n.includes('service road')) return 'operational';

    // 10. Cửa ra tàu bay
    if (n.includes('cửa ra tàu bay') || n.includes('gate')) return 'airside';

    // SAFE FALLBACK
    return 'neutral_support';
  };

  // === HỆ THỐNG MÀU PREMIUM AIRPORT - TẦNG 2 (DEPARTURE & WAITING FLOOR) ===
  const F2_ZONE_PALETTE: Record<string, { fill: string; hover: string }> = {
    airside_concourse: { fill: '#DCE5EC', hover: '#D0DBE5' },
    gate_edge: { fill: '#D0DBE5', hover: '#C4D0DB' },
    waiting_lounge: { fill: '#E3DACD', hover: '#D9CFC1' },
    special_amenity: { fill: '#DCC8BE', hover: '#D2BAB0' }, // premium comfort/amenities
    fnb_retail: { fill: '#D8B58D', hover: '#CDA980' },
    passenger_service: { fill: '#DCEAF2', hover: '#CFE1ED' },
    landscape_decor: { fill: '#E4E9E5', hover: '#E4E9E5' }, // không hover
    operational: { fill: '#C7D0D8', hover: '#C7D0D8' }, // không hover
    neutral_support: { fill: '#EEF2F5', hover: '#E2E8ED' },
  };

  const classifyF2Zone = (name?: string): string => {
    const n = (name || '').toLowerCase().trim();

    // 1. Gate edge
    if (n.includes('cửa ra tàu bay') || n.includes('gate')) {
      return 'gate_edge';
    }

    // 2. Special amenity / comfort
    if (
      n.includes('cip') ||
      n.includes('hạng thương gia') ||
      n.includes('vip') ||
      n.includes('cầu nguyện') ||
      n.includes('massage') ||
      n.includes('em bé') ||
      n.includes('trẻ em') ||
      n.includes('internet') ||
      n.includes('game') ||
      n.includes('hút thuốc')
    ) {
      return 'special_amenity';
    }

    // 3. Retail / F&B / hospitality
    if (
      n.includes('quầy bar') ||
      n.includes('cửa hàng') ||
      n.includes('tiện lợi') ||
      n.includes('convenience') ||
      n.includes('thời trang') ||
      n.includes('mỹ phẩm') ||
      n.includes('cosmetics') ||
      n.includes('lưu niệm') ||
      n.includes('souvenir') ||
      n.includes('điện tử') ||
      n.includes('electronics') ||
      n.includes('trang sức') ||
      n.includes('jewelry') ||
      n.includes('rượu') ||
      n.includes('thuốc lá') ||
      n.includes('duty free') ||
      n.includes('ngoại tệ') ||
      n.includes('currency') ||
      n.includes('exchange') ||
      n.includes('cà phê') ||
      n.includes('bánh ngọt') ||
      n.includes('món ăn') ||
      n.includes('tráng miệng') ||
      n.includes('ẩm thực') ||
      n.includes('thực phẩm')
    ) {
      return 'fnb_retail';
    }

    // 4. Waiting rooms / lounges
    if (
      n.includes('phòng chờ') ||
      n.includes('lounge')
    ) {
      return 'waiting_lounge';
    }

    // 5. Airside concourse / departure areas
    if (
      n.includes('khu ga đi') ||
      n.includes('concourse') ||
      n.includes('boarding') ||
      n.includes('airside') ||
      n.includes('departure') ||
      n.includes('hành lang') ||
      n.includes('corridor')
    ) {
      return 'airside_concourse';
    }

    // 6. Landscape
    if (
      n.includes('cảnh quan') ||
      n.includes('landscape') ||
      n.includes('trồng cây')
    ) {
      return 'landscape_decor';
    }

    // 7. Passenger services
    if (
      n.includes('wc') ||
      n.includes('vệ sinh') ||
      n.includes('thang máy') ||
      n.includes('thang cuốn') ||
      n.includes('phòng y tế') ||
      n.includes('medical')
    ) {
      return 'passenger_service';
    }

    // 8. Operational
    if (
      n.includes('kỹ thuật') ||
      n.includes('băng chuyền')
    ) {
      return 'operational';
    }

    return 'neutral_support';
  };

  // === HỆ THỐNG MÀU PREMIUM AIRPORT - TẦNG 3 (CHECK-IN & DEPARTURE HALL) ===
  const F3_ZONE_PALETTE: Record<string, { fill: string; hover: string }> = {
    checkin_island: { fill: '#E1D7C8', hover: '#D4C7B5' },
    customs_security: { fill: '#AEBAC5', hover: '#A0ACB8' },
    baggage_service: { fill: '#C8D3DE', hover: '#C8D3DE' }, // không hover
    service_counter: { fill: '#C8D3DE', hover: '#BBC8D5' }, // Quầy hỗ trợ bưu điện, ngoại tệ
    special_amenity: { fill: '#DCC8BE', hover: '#D2BAB0' }, // CIP, baby care
    fnb_retail: { fill: '#D8B58D', hover: '#CDA980' },
    passenger_service: { fill: '#DCEAF2', hover: '#CFE1ED' },
    public_landside: { fill: '#F4F0E8', hover: '#EDE8DC' },
    exhibit_decor: { fill: '#E4E9E5', hover: '#E4E9E5' }, // không hover
    neutral_support: { fill: '#EEF2F5', hover: '#E2E8ED' },
  };

  const classifyF3Zone = (name?: string): string => {
    const n = (name || '').toLowerCase().trim();

    // 1. Security / screening / exit
    if (
      n.includes('an ninh') ||
      n.includes('xuất cảnh') ||
      n.includes('hải quan') ||
      n.includes('soi chiếu') ||
      n.includes('security')
    ) {
      return 'customs_security';
    }

    // 2. Check-in islands / counters
    if (
      n.includes('đảo làm thủ tục') ||
      n.includes('quầy thủ tục') ||
      n.includes('check-in')
    ) {
      return 'checkin_island';
    }

    // 3. Baggage service / support
    if (
      n.includes('oog') ||
      n.includes('quá khổ') ||
      n.includes('đóng gói') ||
      n.includes('lưu trữ hành lý') ||
      n.includes('gửi hành lý')
    ) {
      return 'baggage_service';
    }

    // 4. Special amenity / premium support
    if (
      n.includes('cip') ||
      n.includes('hạng thương gia') ||
      n.includes('vip') ||
      n.includes('em bé')
    ) {
      return 'special_amenity';
    }

    // 5. Retail / F&B
    if (
      n.includes('cửa hàng') ||
      n.includes('tiện lợi') ||
      n.includes('cà phê') ||
      n.includes('bánh ngọt') ||
      n.includes('đồ ăn') ||
      n.includes('ẩm thực') ||
      n.includes('food') ||
      n.includes('món ăn')
    ) {
      return 'fnb_retail';
    }

    // 6. Service Counter (Tách riêng khỏi passenger service để dọn dẹp)
    if (
      n.includes('ngoại tệ') ||
      n.includes('exchange') ||
      n.includes('bưu điện') ||
      n.includes('post office') ||
      n.includes('dịch vụ')
    ) {
      return 'service_counter';
    }

    // 7. Passenger service
    if (
      n.includes('wc') ||
      n.includes('vệ sinh') ||
      n.includes('thang máy') ||
      n.includes('thang cuốn') ||
      n.includes('thông tin') ||
      n.includes('information')
    ) {
      return 'passenger_service';
    }

    // 8. Exhibition / decor
    if (
      n.includes('triển lãm') ||
      n.includes('exhibition') ||
      n.includes('trưng bày')
    ) {
      return 'exhibit_decor';
    }

    // 9. Public landside / main hall / entrances
    if (
      n.includes('sảnh d') ||
      n.includes('sảnh check-in') ||
      n.includes('check-in hall') ||
      n.includes('departure hall') ||
      n.includes('làm thủ tục') ||
      n.includes('sảnh chính') ||
      n.includes('cửa vào sảnh') ||
      n.includes('cửa ra vào sảnh') ||
      n.includes('public concourse') ||
      n.includes('public')
    ) {
      return 'public_landside';
    }

    return 'neutral_support';
  };

  // === HỆ THỐNG MÀU MASTER (MASTER TOKEN SYSTEM) - Chuẩn sân bay quốc tế ===
  const MASTER_PALETTE: Record<string, { fill: string; hover: string }> = {
    // 1. MACRO ZONES (Khu vực nền lưu thông - Hiệu ứng Pastel)
    // Thay thế Alpha Hex bằng mã màu Pastel chuẩn để tránh Warning Three.js
    international: { fill: '#B5D1F1', hover: '#B5D1F1' }, // Xanh dương nhạt (thay cho #4A90E244)
    domestic: { fill: '#B8F1E5', hover: '#B8F1E5' },      // Xanh ngọc nhạt (thay cho #50E3C244)
    restricted: { fill: '#EBD6F1', hover: '#EBD6F1' },    // Tím nhạt (thay cho #7B1FA233)
    public: { fill: '#FDEBD0', hover: '#FDEBD0' },        // Cam hổ phách nhạt (thay cho #F5A62333)

    // 2. MICRO ZONES (Khu vực chức năng - GIỮ NGUYÊN MÀU ĐẬM ĐỂ NỔI BẬT DƯỚI LỚP XUYÊN THẤU)
    retail: { fill: '#F3E5F5', hover: '#F3E5F5' },        // Bán lẻ, Miễn thuế (Tím Lavender hoàng gia)
    dining: { fill: '#FFF3E0', hover: '#FFF3E0' },        // Ẩm thực, Nhà hàng (Cam đào/Peach)
    special: { fill: '#EFEBE9', hover: '#EFEBE9' },       // CIP, Lounge, VIP (Beige/Nâu cà phê)
    gate: { fill: '#E0F7FA', hover: '#E0F7FA' },          // Cửa ra tàu bay/Khu chờ (Xanh Aqua)
    checkin: { fill: '#FFF9C4', hover: '#FFF9C4' },       // Đảo thủ tục/Check-in (Vàng sáng)
    controlled: { fill: '#FFCCD2', hover: '#FFCCD2' },    // An ninh, Hải quan, Nhập cảnh (Hồng Rose Vivid)
    utility: { fill: '#E8EAF6', hover: '#E8EAF6' },       // WC, Thang máy, Tiện ích (Xanh tím)
    operational: { fill: '#C5D0DE', hover: '#C5D0DE' },   // Hành lý, Băng chuyền, Kỹ thuật (Xanh xám Steel)
  };

  const classifyZone = (name?: string): string => {
    const n = (name || '').toLowerCase().trim();

    // 0. BẪY ĐẶC BIỆT CHO CÁC KHU VỰC LỚN (Macro Zone Traps)
    if (n.includes('phòng chờ cách ly')) return 'restricted';
    if (n.includes('phòng chờ quốc tế') || n.includes('sảnh quốc tế') || n.includes('sảnh đi quốc tế') || n.includes('sảnh đến quốc tế')) return 'international';
    if (n.includes('phòng chờ quốc nội') || n.includes('sảnh quốc nội') || n.includes('sảnh đi quốc nội') || n.includes('sảnh đến quốc nội')) return 'domestic';

    // 1. MICRO FUNCTIONAL ZONES (Ưu tiên kiểm tra trước)
    if (n.includes('an ninh') || n.includes('xuất cảnh') || n.includes('hải quan') ||
      n.includes('soi chiếu') || n.includes('security') || n.includes('nhập cảnh') ||
      n.includes('passport') || n.includes('visa') || n.includes('công an cửa khẩu') || n.includes('kiểm soát') ||
      n.includes('khu vực nhập cảnh') || n.includes('quầy nhập cảnh') || n.includes(' immigration booth') ||
      n.includes('customs') || n.includes('immigration')) return 'controlled';

    if (n.includes('đảo làm thủ tục') || n.includes('quầy thủ tục') ||
      n.includes('check-in')) return 'checkin';

    if (n.includes('cửa ra tàu bay') || n.includes('gate') || n.includes('ghế chờ')) return 'gate';

    if (n.includes('cip') || n.includes('hạng thương gia') || n.includes('vip') ||
      n.includes('em bé') || n.includes('cầu nguyện') || n.includes('massage') ||
      n.includes('hút thuốc') || n.includes('phòng chờ') || n.includes('lounge') ||
      n.includes('vui chơi') || n.includes('trẻ em') || n.includes('kids') || n.includes('play area') ||
      n.includes('nghỉ ngơi') || n.includes('resting') || n.includes('nap zone') ||
      n.includes('văn hóa') || n.includes('truyền thống') || n.includes('culture') ||
      n.includes('triển lãm') || n.includes('trưng bày') || n.includes('exhibition') || n.includes('gallery') ||
      n.includes('nghỉ chờ') || n.includes('xe đưa đón') || n.includes('shuttle') || n.includes('khách sạn') || n.includes('hotel')) return 'special';

    if (n.includes('cà phê') || n.includes('bánh ngọt') || n.includes('đồ ăn') || n.includes('ẩm thực') ||
      n.includes('tráng miệng') || n.includes('dessert') || n.includes('kem') || n.includes('ice cream') ||
      n.includes('food') || n.includes('món ăn') || n.includes('quầy bar') || n.includes('nhà hàng') ||
      n.includes('restaurant') || n.includes('cafe')) return 'dining';

    if (n.includes('cửa hàng') || n.includes('tiện lợi') || n.includes('miễn thuế') ||
      n.includes('duty free') || n.includes('mỹ phẩm') ||
      n.includes('lưu niệm') || n.includes('souvenir') || n.includes('thời trang') ||
      n.includes('trang sức') || n.includes('rượu') || n.includes('thuốc lá') ||
      n.includes('điện tử') || n.includes('nhà thuốc') || n.includes('convenience') ||
      n.includes('nhà sách') || n.includes('shop') || n.includes('retail') || n.includes('bán lẻ')) return 'retail';

    if (n.includes('oog') || n.includes('quá khổ') || n.includes('đóng gói') ||
      n.includes('lưu trữ hành lý') || n.includes('gửi hành lý') ||
      n.includes('băng chuyền') || n.includes('kỹ thuật') || n.includes('công vụ') ||
      n.includes('hành lý thất lạc') || n.includes('lost') ||
      n.includes('đảo nhận hành lý') || n.includes('đảo trả hành lý') || n.includes('carousel') || n.includes('reclaim') ||
      n.includes('nhận hành lý') || n.includes('baggage')) return 'operational';

    if (n.includes('wc') || n.includes('vệ sinh') || n.includes('thang máy') ||
      n.includes('thang cuốn') || n.includes('thông tin') || n.includes('ngoại tệ') ||
      n.includes('thu đổi') || n.includes('đổi tiền') || n.includes('money exchange') ||
      n.includes('viễn thông') || n.includes('telecom') || n.includes('sim card') || n.includes('internet') ||
      n.includes('exchange') || n.includes('bưu điện') || n.includes('atm') ||
      n.includes('ngân hàng') || n.includes('y tế') || n.includes('medical')) return 'utility';

    // 2. MACRO ZONES (Khoảng nền rộng lớn)
    if (n.includes('quốc tế') || n.includes('international') || n.includes('intl')) return 'international';
    if (n.includes('quốc nội') || n.includes('domestic')) return 'domestic';

    if (n.includes('hạn chế') || n.includes('cách ly') || n.includes('restricted') || n.includes('airside') ||
      n.includes('khu ga') || n.includes('concourse') || n.includes('boarding') || n.includes('hành lang') ||
      n.includes('corridor') || n.includes('nối chuyến') || n.includes('transfer')) return 'restricted';

    if (n.includes('sảnh') || n.includes('hall') || n.includes('công cộng') ||
      n.includes('public') || n.includes('cửa ra vào sảnh') || n.includes('cửa vào sảnh') ||
      n.includes('entrance') ||
      n.includes('landside')) return 'public';

    // 3. Fallback mặc định
    return 'public';
  };

  // Lấy style cơ bản cho một khu vực dựa trên phân loại vai trò không gian
  const getObjectBaseStyle = (obj: any) => {
    const name = (obj.name || "");
    const objFloorId = obj?.floor?.id || obj?.floorId || (typeof obj?.floor === 'string' ? obj.floor : null);
    const isOverviewPoly = overviewFloor && objFloorId === overviewFloor.id;

    // Khu vực không có tên (Unclassified Spaces/Structural Voids)
    if (!name || name.trim() === '') {
      if (isOverviewPoly) {
        // Overview Roof: Ngọc trai xám bạc (Pearl Slate Silver) để tôn hình khối 3D nắp nhà
        return { color: '#E2E8F0', hoverColor: '#E2E8F0' };
      }
      // Các không gian chết bên trong tầng (Structural spaces): Slate-50 rất nhạt để hòa chung với nền Public
      return { color: '#F8FAFC', hoverColor: '#F8FAFC' };
    }

    // Phân loại theo Master Token System (áp dụng cho TẤT CẢ tầng)
    const zoneType = classifyZone(name);
    const palette = MASTER_PALETTE[zoneType] || MASTER_PALETTE['public'];
    let bgColor = palette.fill;
    let hoverColor = palette.fill; // KHÓA HOVER: Gán hoverColor bằng chính màu nền tĩnh

    // localStorage override vẫn hoạt động cho tất cả tầng
    try {
      const safeJSONParse = (val: any, fallback = {}) => {
        if (!val || val === "undefined") return fallback;
        try { return JSON.parse(val); } catch (e) { return fallback; }
      };
      const customColors = safeJSONParse(localStorage.getItem('customAreaColors'));
      if (customColors[obj.id]) {
        bgColor = customColors[obj.id];
      }
    } catch (e) { }

    // Hàm hỗ trợ làm sạch mã màu (loại bỏ Alpha) để tránh Warning Three.js
    const cleanColor = (color: string): string => {
      if (!color) return "#F8FAFC";
      if (color.startsWith("rgba")) {
        // Convert rgba(r,g,b,a) to rgb(r,g,b)
        return color.replace("rgba", "rgb").replace(/,[^,]*\)$/, ")");
      }
      if (color.startsWith("#") && color.length > 7) {
        // Convert #RRGGBBAA to #RRGGBB
        return color.substring(0, 7);
      }
      return color;
    };

    return { color: cleanColor(bgColor), hoverColor: cleanColor(hoverColor) };
  };


  let spotlightRefreshTimeout: any = null;
  const triggerSpotlightRefresh = () => {
    if (spotlightRefreshTimeout) clearTimeout(spotlightRefreshTimeout);
    spotlightRefreshTimeout = setTimeout(() => {
      applyAreaColors();
    }, 50);
  };

  /**
   * 8. SETUP INTERACTIVE STATES & AREA COLORING
   */
  const applyAreaColors = () => {
    const currentFloorId = mapView.currentFloor?.id;
    allMapObjects.forEach((obj) => {
      // Filter: Only update objects on the current floor to avoid performance issues
      const objFloorId = obj.floor?.id || obj.floorId;
      if (objFloorId && objFloorId !== currentFloorId) return;

      // Logic for interactive spaces
      const isSpaceWithoutLocation =
        (obj.type?.toLowerCase() === "space" || obj.type?.toLowerCase() === "room") &&
        !obj.location &&
        !obj.locationProfile &&
        !(Array.isArray(obj.locationProfiles) && obj.locationProfiles.length > 0);

      if (isSpaceWithoutLocation) {
        try {
          mapView.updateState(obj, { interactive: false });
        } catch (e) { }
        return;
      }

      // Check if this object is currently selected/highlighted by search
      // 1. Lấy trạng thái Focus
      const isSelected = currentSearchResults.some((s: any) => s.id === obj.id);
      const isSelectedSpaceLocal = selectedSpace && selectedSpace.id === obj.id;
      const isWayfindingPoint = obj.id === (window as any).wayfindingOrigin?.id || obj.id === (window as any).wayfindingDestination?.id;

      const hasAnyFocus = currentSearchResults.length > 0 || selectedSpace || isWayfindingPoint;
      const isTargetFocus = isSelected || isSelectedSpaceLocal || isWayfindingPoint;

      let style = getObjectBaseStyle(obj);

      // 2. BẬT ĐÈN SÂN KHẤU (SPOTLIGHT EFFECT)
      if (isTargetFocus) {
        style.color = "#214ca6";     // Navy Blue
        style.hoverColor = "#214ca6"; // KHÓA HOVER
      }
      // Dập tắt ánh sáng kết cấu xung quanh
      else if (hasAnyFocus) {
        if (obj.name && obj.name.trim() !== '') {
          style.color = "#E8EAEF";
          style.hoverColor = "#E8EAEF";
        }
      }
      const stateUpdate: any = {
        interactive: true,
        color: style.color,
        hoverColor: style.hoverColor
      };

      try {
        mapView.updateState(obj, stateUpdate);
      } catch (e) {
        if (obj.location) {
          try {
            mapView.updateState(obj.location, stateUpdate);
          } catch (e2) { }
        }
      }
    });
  };

  // Initial application
  applyAreaColors();

  // Expose to window
  (window as any).applyAreaColors = applyAreaColors;

  // (Removed redundant manual location, elevator, and stairway color overrides. Everything is now managed centrally by applyAreaColors -> MASTER_PALETTE)

  // ============================================
  // 9. HOVER HANDLER
  // ============================================

  /**
   * Xử lý hover: đảm bảo object đã chọn giữ màu xanh lá khi hover
   */
  mapView.on("hover", (event: any) => {
    if (!selectedSpace) return;

    let hoveredObject: any = null;
    if (event.spaces && event.spaces.length > 0) {
      hoveredObject = event.spaces[0];
    } else if (event.doors && event.doors.length > 0) {
      hoveredObject = event.doors[0];
    } else if (event.points && event.points.length > 0) {
      hoveredObject = event.points[0];
    } else if (event.elevators && event.elevators.length > 0) {
      hoveredObject = event.elevators[0];
    } else if (event.stairways && event.stairways.length > 0) {
      hoveredObject = event.stairways[0];
    } else if (event.customObjects && event.customObjects.length > 0) {
      hoveredObject = event.customObjects[0];
    } else if (event.objects && event.objects.length > 0) {
      hoveredObject = event.objects[0];
    }

    if (hoveredObject && hoveredObject.id === selectedSpace.id) {
      try {
        mapView.updateState(selectedSpace, {
          color: "#4CAF50",
          hoverColor: "#4CAF50",
        });
      } catch (e) { }
    }
  });

  // ============================================
  // 10. LABELS VÀ MARKERS CHO OBJECTS
  // ============================================
  /**
   * Lấy image URL từ object (thử nhiều cách) - tương tự như cách lấy cho connection markers
   */
  const getImageUrlForMarker = (o: any): string | null => {
    if (!o) return null;

    // Thử lấy từ images/photos (ưu tiên)
    const photos = o.photos || o.images;
    if (Array.isArray(photos) && photos.length > 0) {
      const preferred = photos.find((p: any) => p?.useAsLabelMarker || p?.use_as_label_marker) ?? photos[0];
      if (typeof preferred === "string") return preferred;
      if (preferred && typeof preferred === "object") {
        return preferred.url || preferred.src || preferred.href || preferred.path || null;
      }
    }

    // Thử lấy từ image
    if (typeof o.image === "string") return o.image;
    if (o.image && typeof o.image === "object") return o.image.url || o.image.src || o.image.href || null;

    // Thử lấy từ properties/data/attributes
    if (o.properties) {
      const propImg = o.properties.image || o.properties.photo || o.properties.picture;
      if (propImg) return typeof propImg === "string" ? propImg : (propImg.url || propImg.src || null);
    }
    if (o.data) {
      const dataImg = o.data.image || o.data.photo || o.data.picture;
      if (dataImg) return typeof dataImg === "string" ? dataImg : (dataImg.url || dataImg.src || null);
    }
    if (o.attributes) {
      const attrImg = o.attributes.image || o.attributes.photo || o.attributes.picture;
      if (attrImg) return typeof attrImg === "string" ? attrImg : (attrImg.url || attrImg.src || null);
    }

    return null;
  };

  /**
   * Thêm markers với hình tròn có avatar cho objects có name
   * - Thay thế Labels bằng Markers với hình tròn có avatar (hình ảnh từ mô tả)
   * - Nếu có image → hiển thị hình tròn với avatar
   * - Nếu không có image → hiển thị hình tròn với text
   */
  // Track current location markers to clear on refresh
  let currentLocationMarkers: any[] = [];

  // Exposed function to refresh markers (used by setLanguage)
  const refreshLocationMarkers = () => {
    // 1. Clear existing markers
    currentLocationMarkers.forEach(m => {
      try { mapView.Markers.remove(m); } catch (e) { }
    });
    currentLocationMarkers = [];

    // Note: We don't clear markerIdToObject here to avoid breaking other references, 
    // but in a perfect world we should clean up stale IDs. 
    // For now, map will just grow, which is acceptable for this scale.

    // 2. Add new markers with translated names
    allMapObjects.forEach((obj) => {
      // Use TranslationManager to get name (current language)
      const name = TranslationManager.getName(obj);
      if (name) {
        try {
          // Skip Main Entrance (handled separately)
          const nameLower = name.toLowerCase();
          const isMainEntrance = nameLower.includes("main entrance") ||
            nameLower.includes("main terminal entrance") ||
            nameLower.includes("cổng chính") ||
            nameLower.includes("正门") || nameLower.includes("航站楼主入口") ||
            nameLower.includes("メインエントランス") || nameLower.includes("ターミナル") ||
            nameLower.includes("정문") || nameLower.includes("터미널") ||
            nameLower === TranslationManager.t('main_entrance', 'Cổng chính').toLowerCase();

          if (isMainEntrance) {
            mainEntranceObject = obj;
            return;
          }

          // FIX: Hide "Restroom/Toilet" markers that are erroneously placed at Venue Center
          // or generically hide them on Overview to prevent clutter unless zoomed in
          const isRestroom = nameLower.includes("nhà vệ sinh") || nameLower.includes("toilet") || nameLower.includes("restroom") || nameLower.includes("wc");
          if (isRestroom) {
            // Check distance to venue center (approximate)
            const centerLat = 10.77262290;
            const centerLon = 107.04114030;
            // Simple heuristic: if object has no specific coordinate or is at 0,0 or center
            // Access internal coordinate if possible
            const lat = (obj as any).latitude ?? (obj as any).coordinate?.latitude;
            const lon = (obj as any).longitude ?? (obj as any).coordinate?.longitude;

            if (lat && lon) {
              const dLat = Math.abs(lat - centerLat);
              const dLon = Math.abs(lon - centerLon);
              if (dLat < 0.00005 && dLon < 0.00005) {
                // Too close to center label, likely data error or overlap
                return;
              }
            }
          }

          let imgUrl = getImageUrlForMarker(obj);
          let markerHtml = '';

          // Reuse HTML generation logic
          let activeIconUrl = imgUrl;

          try {
            const locData = TranslationManager.data.locations?.[obj.id] || TranslationManager.data.locations?.[obj.mappedinId];
            if (locData && locData.subCategoryIcon) {
              const iconPath = locData.subCategoryIcon;
              // Basic validation
              if (iconPath && iconPath.indexOf('.') !== -1) {
                if (iconPath.startsWith('/')) {
                  activeIconUrl = iconPath;
                } else {
                  activeIconUrl = `/icon-category/${iconPath}`;
                }
              }
            }
          } catch (e) { }

          // 1. Force ATM & Special Area Icon overrides
          const isPublic = nameLower.includes("công cộng") || nameLower.includes("public") ||
            nameLower.includes("公共") || nameLower.includes("공공") ||
            (obj.name && (obj.name.toLowerCase().includes("public") || obj.name.toLowerCase().includes("công cộng")));

          const isRestricted = nameLower.includes("hạn chế") || nameLower.includes("nhân viên") ||
            nameLower.includes("restricted") || nameLower.includes("staff") ||
            nameLower.includes("禁区") || nameLower.includes("制限") || nameLower.includes("禁") ||
            nameLower.includes("スタッフ") || nameLower.includes("직원") ||
            nameLower.includes("立ち入り禁止") ||
            (obj.name && (obj.name.toLowerCase().includes("restricted") || obj.name.toLowerCase().includes("staff") ||
              obj.name.toLowerCase().includes("hạn chế") || obj.name.toLowerCase().includes("nhân viên")));

          if (nameLower.includes('atm') || nameLower.includes('ngân hàng') || nameLower.includes('bank')) {
            activeIconUrl = "/icon-category/AirportService/atm.png";
          } else if (isPublic) {
            activeIconUrl = "/icon-category/landside.png";
            imgUrl = "/icon-category/landside.png"; // Force fallback
            console.log("🎨 Applying Landside icon to:", name || obj.name);
          } else if (isRestricted) {
            activeIconUrl = "/icon-category/airside.png";
            imgUrl = "/icon-category/airside.png"; // Force fallback
            console.log("🎨 Applying Airside icon to:", name || obj.name);
          }

          if (activeIconUrl) {
            // Square Style - Premium Design
            const onerrorStr = `
              if (this.dataset.tried === 'true') {
                 this.style.display='none'; 
                 this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-weight:bold;font-size:15px;\\'>${name.charAt(0).toUpperCase()}</div>';
              } else {
                 this.dataset.tried = 'true';
                 if ('${imgUrl || ''}' !== '' && this.src.indexOf('${imgUrl || 'SHOULD_NOT_MATCH'}') === -1) {
                    this.src = '${imgUrl}';
                 } else {
                    this.style.display='none';
                    this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-weight:bold;font-size:15px;\\'>${name.charAt(0).toUpperCase()}</div>';
                 }
              }
            `.replace(/\s+/g, ' ');

            markerHtml = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
              <div style="width:34px;height:34px;background:#fff;border-radius:50%;box-shadow:0 3px 6px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;border:1.5px solid #fff;">
                <img src="${activeIconUrl}" alt="${name}" onerror="${onerrorStr}" style="width:20px;height:20px;object-fit:contain;" />
              </div>
              <div style="font-size:13px;line-height:1.2;font-weight:600;color:#333;text-shadow:0 0 4px rgba(255,255,255,0.9),0 0 8px rgba(255,255,255,0.8);white-space:nowrap;">
                ${name}
              </div>
            </div>`;
          } else {
            const firstLetter = name.charAt(0).toUpperCase();
            markerHtml = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
              <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:14px;">
                ${firstLetter}
              </div>
              <div style="font-size:13px;line-height:1.2;font-weight:600;color:#333;text-shadow:0 0 4px rgba(255,255,255,0.9),0 0 8px rgba(255,255,255,0.8);white-space:nowrap;">
                ${name}
              </div>
            </div>`;
          }

          // SAFETY CHECK: Ensure the object has a valid coordinate before adding a marker
          // Some objects like elevators/escalators might not have a center coordinate in certain SDK versions
          let hasCoordinate = false;
          try {
            const coord = (obj as any).coordinate || (obj as any).center || mapView.createCoordinate(0, 0);
            // In Mappedin Web SDK, the Markers.add internally calls getCoordinate. 
            // We can't always check easily before call, but we can prevent the crash from being noisy.
            hasCoordinate = !!coord;
          } catch (e) {
            hasCoordinate = false;
          }

          if (hasCoordinate) {
            const marker = mapView.Markers.add(obj, markerHtml, { interactive: true } as any);
            currentLocationMarkers.push(marker); // Track it

            const markerId = (marker as any)?.id;
            if (markerId) {
              markerIdToObject.set(markerId, obj);
            }
          }
        } catch (e) {
          // If it still fails (e.g. internal getCoordinate fails), log it only in debug
          // console.warn("Skipping marker for object without valid coordinate:", name);
        }
      }
    });

    console.log(`📍 Refreshed ${currentLocationMarkers.length} location markers`);
  };

  // Initial call
  refreshLocationMarkers();

  // ============================================
  // LOGGING: List all locations by Floor
  // ============================================
  const logComprehensiveMapContent = () => {
    console.group("🏢 FULL MAP DATA LOG (By Floor)");

    // 1. Get Floors
    const floors = mapData.getByType("floor").sort((a: any, b: any) => (a.elevation > b.elevation ? 1 : -1));

    // 2. Iterate Floors
    floors.forEach((floor: any) => {
      console.group(`📍 Floor: ${floor.name} (ID: ${floor.id})`);

      // Get objects on this floor
      // Note: We use allMapObjects if available, or fetch from mapData
      const floorObjects = (typeof allMapObjects !== 'undefined' ? allMapObjects : [...mapData.getByType("space"), ...mapData.getByType("point")])
        .filter((obj: any) => {
          const fId = obj.floor?.id || obj.floorId || (typeof obj.floor === 'string' ? obj.floor : null);
          return fId === floor.id && obj.type !== "floor";
        });

      if (floorObjects.length === 0) {
        console.log("No objects found.");
      } else {
        // Prepare table data
        const tableData = floorObjects.map((obj: any) => {
          let type = obj.type;
          if (obj.id.startsWith("s_")) type = "space/room";
          if (obj.id.startsWith("p_")) type = "point";
          if (obj.id.startsWith("n_")) type = "node";

          return {
            ID: obj.id,
            "Original Name": obj.name || "(No Name)",
            "Translated (Current)": TranslationManager.getName(obj),
            Type: type
          };
        });
        // Sort by Name
        tableData.sort((a: any, b: any) => a["Original Name"].localeCompare(b["Original Name"]));

        console.table(tableData);
      }
      console.groupEnd();
    });
    console.groupEnd();
  };

  // Run once on load
  setTimeout(logComprehensiveMapContent, 2000);

  // Expose
  (window as any).logMapData = logComprehensiveMapContent;


  // Expose to window for setLanguage
  (window as any).updateMarkersForCurrentFloor = refreshLocationMarkers;

  // Tạo marker tên bản đồ "Cảng Hàng không Quốc tế Long Thành" cho overview
  const createMapNameMarker = () => {
    // Xóa marker cũ nếu có
    if (mapNameMarker) {
      try {
        mapView.Markers.remove(mapNameMarker);
      } catch (e) { }
      mapNameMarker = null;
    }

    // Lấy tên bản đồ từ translation hoặc mapData
    const mapDataAny = mapData as any;
    const mapName = TranslationManager.t('venue_name', 'Cảng Hàng không Quốc tế Long Thành') ||
      mapDataAny?.venue?.name ||
      mapDataAny?.name;

    // 3. Define fixed coordinates as requested
    const lat = 10.77262290;
    const lon = 107.04114030;
    let markerCoordinate: any;
    try {
      markerCoordinate = (mapView as any).createCoordinate(lat, lon);
    } catch (e) {
      // Use current floor if available, otherwise overview
      const floorId = (mapView as any).currentFloor?.id || overviewFloor?.id;
      markerCoordinate = { latitude: lat, longitude: lon, floorId: floorId };
    }

    // Tạo marker HTML cho tên bản đồ với ảnh airplane.jpg
    const markerHtml = `
      <div id="main-airport-label" style="display:flex;flex-direction:column;align-items:center;gap:3px;transition:opacity 0.2s;">
        <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,0.4);background:#fff;display:flex;align-items:center;justify-content:center;">
          <img src="${airplaneIconUrl}" alt="${mapName}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        <div style="font-size:13px;line-height:1.2;font-weight:600;color:#333;text-shadow:0 0 4px rgba(255,255,255,0.9),0 0 8px rgba(255,255,255,0.8);white-space:nowrap;text-align:center;">
          ${mapName}
        </div>
      </div>
    `;

    try {
      mapNameMarker = mapView.Markers.add(markerCoordinate, markerHtml, {
        interactive: false, // Không cho click vào marker tên bản đồ
        anchor: 'center',
        zIndex: 9999
      } as any);

      // Initial check for zoom visibility
      checkZoomVisibility();

    } catch (e) {
      console.warn("Error creating map name marker:", e);
    }
  };

  // Helper to toggle visibility based on zoom
  const checkZoomVisibility = () => {
    if (!mapNameMarker) return;
    const currentZoom = getCameraZoom() || 0;
    // Hide if zoom > 15x, Show if <= 15x
    const shouldShow = currentZoom <= 15;

    // We can togggle visibility via style if we gave it an ID or by using Markers.update (SDK dependent)
    // Simplest way for HTML markers: find the element
    const el = document.getElementById('main-airport-label');
    if (el) {
      el.style.opacity = shouldShow ? '1' : '0';
      el.style.pointerEvents = shouldShow ? 'auto' : 'none';
    }
  };


  // Quản lý trạng thái Marker & Zoom (Đã được hợp nhất vào camera-change bên dưới)


  // Expose createMapNameMarker to window for language change updates
  (window as any).createMapNameMarker = createMapNameMarker;

  // Update floor selector labels with translations
  const updateFloorSelectorTranslations = () => {
    const floorSelector = document.getElementById('floor-selector') as HTMLSelectElement;
    if (!floorSelector) return;

    // Get floors data from API
    const floors = TranslationManager.data.floors;
    if (!floors || floors.length === 0) return;

    // Map floors by mappedinId for quick lookup
    const floorMap = new Map<string, any>();
    floors.forEach((f: any) => {
      if (f.mappedinId) floorMap.set(f.mappedinId, f);
    });

    // Update each option's text
    Array.from(floorSelector.options).forEach((option: HTMLOptionElement) => {
      const floorId = option.value;
      // ALWAYS use the original name if we preserved it, otherwise fallback to current text
      const nameForLookup = (option.dataset.originalName || option.text).toLowerCase();

      // Try to find translation by MappedinId
      let floorData = floorMap.get(floorId);

      // FALLBACK: If MappedinId doesn't match (common for Overview), try to find by FloorCode or name
      if (!floorData) {
        const isOverview = nameForLookup.includes('overview') ||
          nameForLookup.includes('tổng quan') ||
          nameForLookup.includes('tong quan') ||
          nameForLookup.includes('toàn cảnh');

        if (isOverview) {
          // Find specifically the row with FloorCode 'OVERVIEW'
          floorData = floors.find((f: any) => f.code === 'OVERVIEW');
        } else {
          // Try matching by Code if available (some integrations use code as ID)
          floorData = floors.find((f: any) => f.code === floorId);
        }
      }

      if (floorData?.names?.[TranslationManager.currentLang]) {
        option.textContent = floorData.names[TranslationManager.currentLang];
      }
    });

    console.log('🏢 Floor selector translations updated');
  };

  // Expose to window for language change
  (window as any).updateFloorSelectorTranslations = updateFloorSelectorTranslations;

  // Initial floor translation update after a short delay (wait for Mappedin to populate)
  setTimeout(() => {
    updateFloorSelectorTranslations();
  }, 1000);

  // Also try again after 3s just in case Mappedin is slow
  setTimeout(() => {
    updateFloorSelectorTranslations();
  }, 3000);


  // Hàm tạo lại marker "Main Entrance"
  const recreateMainEntranceMarker = () => {
    if (!mainEntranceObject) return;

    // Xóa marker cũ nếu có
    if (mainEntranceMarker) {
      try {
        mapView.Markers.remove(mainEntranceMarker);
      } catch (e) { }
      mainEntranceMarker = null;
    }

    // Tạo lại marker
    const imgUrl = getImageUrlForMarker(mainEntranceObject);
    let markerHtml = '';
    if (imgUrl) {
      markerHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <div style="width:32px;height:32px;border-radius:50%;overflow:hidden;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);background:#fff;">
            <img src="${imgUrl}" alt="${TranslationManager.getName(mainEntranceObject)}" style="width:100%;height:100%;object-fit:cover;" />
          </div>
          <div style="font-size:11px;line-height:11px;background:rgba(255,255,255,0.95);padding:2px 6px;border-radius:999px;color:#111;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.2);font-weight:500;">
            ${TranslationManager.getName(mainEntranceObject)}
          </div>
        </div>
      `;
    } else {
      const name = TranslationManager.getName(mainEntranceObject);
      const firstLetter = name.charAt(0).toUpperCase();
      markerHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:14px;">
            ${firstLetter}
          </div>
          <div style="font-size:11px;line-height:11px;background:rgba(255,255,255,0.95);padding:2px 6px;border-radius:999px;color:#111;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.2);font-weight:500;">
            ${name}
          </div>
        </div>
      `;
    }

    try {
      mainEntranceMarker = mapView.Markers.add(mainEntranceObject, markerHtml, {
        interactive: true,
      } as any);
      const markerId = (mainEntranceMarker as any)?.id;
      if (markerId) {
        markerIdToObject.set(markerId, mainEntranceObject);
      }
    } catch (e) {
      console.warn("Error recreating Main Entrance marker:", e);
    }
  };

  // Hàm để ẩn/hiện markers dựa trên floor hiện tại
  const updateMarkersForCurrentFloor = () => {
    const currentFloor = mapView.currentFloor;
    const floorName = currentFloor?.name?.toLowerCase() || "";
    const isOverview = floorName.includes("overview") ||
      floorName.includes("tổng quan") ||
      floorName === "overview";

    console.log("🔍 Current floor:", currentFloor?.name, "isOverview:", isOverview);

    if (isOverview) {
      // Ở overview: Ẩn "Main Entrance", hiện tên bản đồ
      if (mainEntranceMarker) {
        try {
          mapView.Markers.remove(mainEntranceMarker);
          mainEntranceMarker = null;
          console.log("✅ Removed Main Entrance marker in overview");
        } catch (e) {
          console.warn("Error removing Main Entrance marker:", e);
        }
      }
      if (!mapNameMarker) {
        createMapNameMarker();
        console.log("✅ Created map name marker in overview");
      }
    } else {
      // Không ở overview: Hiện "Main Entrance", ẩn tên bản đồ
      if (mapNameMarker) {
        try {
          mapView.Markers.remove(mapNameMarker);
          mapNameMarker = null;
          console.log("✅ Removed map name marker (not in overview)");
        } catch (e) {
          console.warn("Error removing map name marker:", e);
        }
      }
      // Tạo lại "Main Entrance" nếu chưa có
      if (!mainEntranceMarker && mainEntranceObject) {
        recreateMainEntranceMarker();
        console.log("✅ Created Main Entrance marker (not in overview)");
      }
    }
  };
  (window as any).refreshFloorSpecificMarkers = updateMarkersForCurrentFloor;

  // Gọi lần đầu để set trạng thái ban đầu (sau khi tất cả markers đã được tạo)
  // Delay một chút để đảm bảo floor đã được set
  setTimeout(() => {
    updateMarkersForCurrentFloor();
  }, 100);

  // ============================================
  // 11. FLOOR CHANGE HANDLER
  // ============================================
  mapView.on("floor-change", (event) => {
    const id = event?.floor.id;
    if (!id) return;

    previousFloorId = id;
    floorSelector.value = id;
    console.log("Floor changed to: ", event?.floor.name);

    // SKIP all side effects during warm-up switch (multi-floor activation workaround)
    if (_isWarmupSwitch) return;

    try {
      if ((window as any).syncURL) (window as any).syncURL(true);

      if (connectionMarkersVisible) renderConnectionOverlaysForCurrentFloor();
      // Re-render object markers cho floor mới
      renderObjectMarkersForCurrentFloor();
      // Cập nhật markers (ẩn/hiện Main Entrance và tên bản đồ)
      updateMarkersForCurrentFloor();
      // Cập nhật visibility của UI controls (ví dụ ẩn nút thêm model/phân loại khi ở overview)
      updateUIVisibility();

      // LAZY LOADING: Load models cho tầng mới nếu chưa load
      if (_allModelMetadata.length > 0) {
        _loadModelsForFloor(id);
      }

      // Hook camera-change cho streaming
      mapView.on("camera-change", (window as any).updateModelStreaming);

      // BƯỚC 5: Comment vô hiệu hóa hàm tạo Clone Model 3D (Shadow copies)
      // Hàm này đang gây bão Error 404 do file GLB không tồn tại làm đứt mạng & kẹt GPU!
      /*
      if (typeof (window as any).syncModelInstancesVisibility === 'function') {
        setTimeout(() => {
          (window as any).syncModelInstancesVisibility();
        }, 300);
      }
      */

      // AUTO-REHIGHLIGHT: If a subcategory is active, re-pin locations on this floor
      if (activeSubCategoryId) {
        reapplyActiveSubCategoryPins();
      }
    } catch { }
  });

  floorSelector.value = mapView.currentFloor.id;

  floorSelector.addEventListener("change", async (e) => {
    if (isGlobalSwitchingFloor) {
      // Đang kẹt chuyển tầng, khôi phục lại giá trị dropdown cũ
      (e.target as HTMLSelectElement).value = mapView.currentFloor.id;
      return;
    }

    const floorId = (e.target as HTMLSelectElement)?.value;
    if (!floorId || floorId === mapView.currentFloor.id) return;

    // Khoá chuyển tầng
    isGlobalSwitchingFloor = true;

    // Blur để dropdown đóng lại và bo tròn góc ngay lập tức
    (e.target as HTMLSelectElement).blur();

    const floor = mapData.getByType("floor").find(f => f.id === floorId);
    const isOverview = floor?.name?.toLowerCase().match(/overview|tổng quan|tong quan|view/);

    const targetZoom = isOverview ? 15 : 16; // Overview = 16x, Tầng = 16.5x

    console.log(`🖱️ Manual floor switch via drop-down. Targeted zoom: ${targetZoom}x, Centering: ${initialVenueCenter ? "Initial Center" : "Current Center"}`);

    // Đánh dấu đang chuyển tầng thủ công để vô hiệu hóa AUTO-SWITCH
    isManualFloorSwitch = true;

    // Đợi setFloor hoàn thành trước khi animate camera
    try {
      // MULTI-FLOOR FIX: When switching FROM Overview, the first setFloor only activates
      // the multi-floor system but doesn't fully render see-through.
      // Solution: switch to Overview's ground floor briefly, then to the target floor.
      if (isInOverview && !isOverview) {
        const warmupFloor = allFloors.find((f: any) => f.id !== floorId && f.id !== overviewFloor?.id);
        if (warmupFloor) {
          _isWarmupSwitch = true; // Suppress side effects
          await mapView.setFloor(warmupFloor.id);
          await new Promise(r => setTimeout(r, 50));
          _isWarmupSwitch = false;
        }
      }

      await mapView.setFloor(floorId);
    } catch (err) {
      _isWarmupSwitch = false; // Safety reset
      console.warn("Error setting floor:", err);
    } finally {
      // Nhả khoá sau khi chuyển tầng hoàn tất
      setTimeout(() => { isGlobalSwitchingFloor = false; }, 400);
    }

    // Sau khi floor đã được set, animate camera
    mapView.Camera.animateTo({
      zoomLevel: targetZoom,
      center: initialVenueCenter || mapView.Camera.center,
      bearing: mapView.Camera.bearing,
      pitch: mapView.Camera.pitch
    }, { duration: 1000 });

    // Reset cờ sau khi animation hoàn tất
    setTimeout(() => {
      isManualFloorSwitch = false;
      console.log("✅ Manual floor switch completed. AUTO-SWITCH re-enabled.");
    }, 1500);
  });

  // Bổ sung: Click ra ngoài dropdown thì tự động blur để bo tròn lại
  document.addEventListener("click", (e) => {
    const isClickInside = floorSelector.contains(e.target as Node);
    if (!isClickInside) {
      floorSelector.blur(); // Ép dropdown mất focus để bo tròn lại
    }
  });

  // ============================================
  // CATEGORY & UI VISIBILITY LOGIC
  // ============================================

  // Helper: Highlight list of objects with Markers
  // NEW HANDLERS FOR CATEGORY NAVIGATION
  const reapplyActiveSubCategoryPins = async () => {
    if (!activeSubCategoryId) return;

    // User Request: If a specific item is selected (length===1), DO NOT reset to show entire category.
    // Instead, RE-APPLY the single item highlight (in case floor switch cleared it).
    if (currentSearchResults.length === 1) {
      const obj = currentSearchResults[0];
      try {
        console.log("🔒 Re-applying single item highlight:", obj.name);
        mapView.updateState(obj, { interactive: true, color: "#4CAF50", hoverColor: "#45a049" });
        const anchor = getObjectAnchor(obj);
        if (anchor) {
          // Re-create Name Marker (Persistent)
          const markerHtml = `<div class="search-marker" style="transform:translate(-50%,-100%);">
                                  <div style="background:#085ebb;color:white;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.2);">${obj.name}</div>
                                  <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid #085ebb;margin:0 auto;"></div>
                              </div>`;
          const marker = mapView.Markers.add(anchor, markerHtml, { interactive: false });
          currentSearchMarkers.push(marker);
        }
      } catch (e) { }
      return;
    }

    // Clear existing transient markers but keep track of results
    clearSearchMarkers();

    // Fetch locations for current subcategory from TranslationManager
    // Replaces: const locs = await ApiService.getSubCategoryLocations(activeSubCategoryId);
    const tmLocs = TranslationManager.data.locations || {};
    const assignedMIDs: string[] = [];

    Object.keys(tmLocs).forEach(mid => {
      const l = tmLocs[mid];
      // Check if location belongs to activeSubCategoryId
      // Note: Translation_Locations.CategoryId usually maps to SubCategoryId in this context
      if (l.categoryId?.toString() === activeSubCategoryId?.toString()) {
        assignedMIDs.push(mid);
      }
    });

    // Filter objects on current floor
    const currentFloorId = mapView.currentFloor.id;
    const objectsToPin = allMapObjects.filter(obj => {
      const objFloorId = obj.floor?.id || obj.floorId || (typeof obj.floor === 'string' ? obj.floor : null);
      return assignedMIDs.includes(obj.id) && objFloorId === currentFloorId;
    });

    objectsToPin.forEach((obj: any) => {
      try {
        mapView.updateState(obj, {
          interactive: true,
          color: "#4CAF50",
          hoverColor: "#45a049",
        });

        const anchor = getObjectAnchor(obj);
        if (anchor) {
          const isFilePath = activeCategoryIcon && activeCategoryIcon.indexOf('.') !== -1;
          const markerHtml = isFilePath ? `
            <div class="search-marker">
              <div class="search-marker-icon" style="background:#4CAF50;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid white;">
                <img src="/icon-category/${activeCategoryIcon}" onerror="this.src='/icon-category/default.png'" style="width:24px;height:24px;object-fit:contain;">
              </div>
              <div class="search-marker-arrow" style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid #4CAF50;margin-top:-1px;"></div>
            </div>` : `
            <div class="search-marker">
              <div class="search-marker-icon" style="background:#4CAF50;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid white;">📍</div>
              <div class="search-marker-arrow" style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid #4CAF50;margin-top:-1px;"></div>
            </div>`;
          const marker = mapView.Markers.add(anchor, markerHtml, { interactive: false });
          currentSearchMarkers.push(marker);
        }
      } catch (e) { }
    });
  };

  const highlightObjects = (objectsToHighlight: any[], icon: string = "📍") => {
    // Keep existing highlightObjects for general searches
    clearSearchMarkers();
    if (currentSearchResults.length > 0) {
      currentSearchResults.forEach((obj: any) => resetObjectHighlight(obj));
    }
    currentSearchResults = objectsToHighlight;
    selectedSpace = null; // Clear primary selection when search results are highlighted

    objectsToHighlight.forEach((obj: any) => {
      try {
        mapView.updateState(obj, { interactive: true, color: "#4CAF50", hoverColor: "#45a049" });
        const anchor = getObjectAnchor(obj);
        if (anchor) {
          const markerHtml = `
            <div class="search-marker">
              <div class="search-marker-icon" style="background:#4CAF50;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid white;">${icon}</div>
              <div class="search-marker-arrow" style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid #4CAF50;margin-top:-1px;"></div>
            </div>`;
          const marker = mapView.Markers.add(anchor, markerHtml, { interactive: false });
          currentSearchMarkers.push(marker);
        }
      } catch (e) { }
    });
    /* Focus controlled by caller for better precision */
  };

  // Expose highlightObjects to window for deep linking access
  (window as any).highlightObjects = highlightObjects;

  const updateUIVisibility = () => {
    const isOverview = isMapInOverview();
    const topControls = document.getElementById("top-controls-container");
    // Also manage floor selector explicitly if needed, but it stays visible usually

    if (isOverview) {
      // Keep controls visible and don't clear results in overview if user wants full access
      // if (topControls) topControls.style.display = "none"; 
      renderCategories();
    } else {
      if (topControls) topControls.style.display = "flex";
      renderCategories();
    }
  };

  // Expose state for TranslationManager to enable dynamic updates
  try {
    Object.defineProperty(window, 'activeCategoryId', { get: () => activeCategoryId, configurable: true });
    Object.defineProperty(window, 'activeSubCategoryId', { get: () => activeSubCategoryId, configurable: true });
  } catch (e) { console.warn("Could not expose category state", e); }

  const renderCategories = async (parentId: string | number | null = null, forceRefresh: boolean = false) => {
    // Expose function if not already (safeguard)
    if (!(window as any).renderCategories) (window as any).renderCategories = renderCategories;

    const categoryList = document.getElementById("category-list");
    if (!categoryList) return;

    if (forceRefresh) {
      categoryTree = [];
    }

    if (categoryTree.length === 0) {
      // Fetch categories from API (now with inline translations)
      try {
        const apiCategories = await ApiService.getCategories();
        categoryTree = apiCategories.map((c: any) => ({
          id: c.id,
          vn: c.vn,
          en: c.en,
          zh: c.zh,
          ja: c.ja,
          ko: c.ko,
          icon: c.icon,
          subcategories: c.subcategories.map((s: any) => ({
            id: s.id,
            vn: s.vn,
            en: s.en,
            zh: s.zh,
            ja: s.ja,
            ko: s.ko,
            icon: s.icon
          }))
        }));
      } catch (e) {
        console.error("Failed to load categories:", e);
        categoryTree = [];
      }
    }

    // Helper function to get name in current language
    const getCategoryName = (cat: any) => {
      const lang = TranslationManager.currentLang || 'vn';
      return cat.names?.[lang] || cat.names?.vn || cat[lang] || cat.vn || '';
    };

    const currentFloorId = mapView.currentFloor.id;
    // Get all area assignments to filter active cats per floor
    const assigned = await ApiService.getAssignedAreas(); // [{MappedinID, SubCategoryID}]

    // Map assigned areas to their subcategories
    const assignedMap = new Map<string, string[]>(); // SubID -> MIDs
    assigned.forEach((a: any) => {
      if (!assignedMap.has(a.SubCategoryID.toString())) assignedMap.set(a.SubCategoryID.toString(), []);
      assignedMap.get(a.SubCategoryID.toString())!.push(a.MappedinID);
    });

    // Helper to check if a subcategory has objects on the current floor
    const isSubActiveOnFloor = (subId: string) => {
      const mids = assignedMap.get(subId.toString()) || [];
      if (isMapInOverview()) return mids.length > 0; // Show if it has any assigned areas at all
      return allMapObjects.some(obj => {
        const objFloorId = obj.floor?.id || obj.floorId || (typeof obj.floor === 'string' ? obj.floor : null);
        return mids.indexOf(obj.id) !== -1 && objFloorId === currentFloorId;
      });
    };

    const getIconHtml = (icon: string | null, defaultEmoji: string) => {
      if (!icon) return defaultEmoji;
      // Use absolute path to avoid issues with SPA routes like /vn/
      if (icon.indexOf('.') !== -1) {
        return `<img src="/icon-category/${icon}" onerror="this.src='/icon-category/default.png'" style="width:24px;height:24px;object-fit:contain;">`;
      }
      return icon; // Fallback to emoji/text
    };

    categoryList.innerHTML = "";

    // Add "Back" button if viewing subcategories
    if (parentId !== null) {
      // SUB-CATEGORY VIEW (Accordion Style)
      categoryList.style.display = "flex";
      categoryList.style.flexDirection = "column";
      categoryList.style.gridTemplateColumns = "none"; // disable grid
      const backBtn = document.createElement("div");
      backBtn.style.cssText = `
                display: flex; align-items: center; gap: 10px;
                padding: 12px 16px;
                cursor: pointer; color: #214ca6;
                font-weight: 600; font-size: 14px;
                border-bottom: 1px solid #e8ecf4;
                transition: all 0.2s ease;
                background: #fafbfd;
            `;
      backBtn.innerHTML = `
                <div style="
                    width: 28px; height: 28px; border-radius: 50%;
                    background: #f0f4f8; display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                ">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </div>
                <span>${TranslationManager.t('back_btn', 'Quay lại danh mục')}</span>
            `;
      backBtn.onmouseenter = () => { backBtn.style.background = "#eef3ff"; };
      backBtn.onmouseleave = () => { backBtn.style.background = "#fafbfd"; };
      backBtn.onclick = () => {
        // Clear highlights when returning to main categories
        activeCategoryId = null;
        activeSubCategoryId = null;
        clearSearchMarkers();
        if (currentSearchResults.length > 0) {
          currentSearchResults.forEach((o: any) => { try { resetObjectHighlight(o); } catch (e) { } });
          currentSearchResults = [];
        }
        renderCategories(null);
      };
      categoryList.appendChild(backBtn);

      const parentCat = categoryTree.find(c => c.id.toString() === parentId.toString());
      if (parentCat && parentCat.subcategories) {
        // Filter subcategories that have locations on this floor
        const activeSubs = parentCat.subcategories.filter((s: any) => isSubActiveOnFloor(s.id));

        if (activeSubs.length === 0) {
          const emptyMsg = document.createElement("div");
          emptyMsg.style.cssText = `
                        padding: 32px 20px; text-align: center; color: #999;
                        font-size: 13px; font-style: italic;
                    `;
          emptyMsg.innerHTML = `
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" style="margin-bottom:8px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        <div>${TranslationManager.t('no_categories_for_floor', 'Không có danh mục cho tầng này')}</div>
                    `;
          categoryList.appendChild(emptyMsg);
        }

        activeSubs.forEach((sub: any) => {
          const item = document.createElement("div");
          const isActive = activeSubCategoryId === sub.id.toString();

          // Không dùng class cũ để tránh xung đột CSS
          item.className = isActive ? "sub-item-header-modern" : "";

          const subName = getCategoryName(sub);

          // === INCHEON STYLE: Row layout với icon tròn, text, chevron ===
          item.style.display = "flex";
          item.style.alignItems = "center";
          item.style.padding = "12px 16px";
          item.style.cursor = "pointer";
          item.style.transition = "all 0.2s ease";
          item.style.borderBottom = "1px solid #f0f0f0";
          item.style.width = "100%";
          item.style.boxSizing = "border-box";

          if (isActive) {
            item.style.backgroundColor = "#f0f4ff";
            item.style.borderLeft = "3px solid #214ca6";
          } else {
            item.style.backgroundColor = "white";
            item.style.borderLeft = "3px solid transparent";
          }

          // Icon tròn nền nhạt (chuẩn Incheon style)
          const iconCircle = `<div style="
                        flex-shrink: 0;
                        width: 40px; height: 40px;
                        border-radius: 50%;
                        background: ${isActive ? '#214ca6' : '#f0f4f8'};
                        display: flex; align-items: center; justify-content: center;
                        margin-right: 12px;
                        transition: all 0.2s;
                    ">
                        <div style="
                            width: 22px; height: 22px;
                            display: flex; align-items: center; justify-content: center;
                            ${isActive ? 'filter: brightness(10);' : ''}
                        ">${getIconHtml(sub.icon, "📍")}</div>
                    </div>`;

          // Tên subcategory
          const textBlock = `<div style="flex: 1; overflow: hidden;">
                        <div style="
                            font-weight: ${isActive ? '600' : '500'};
                            font-size: 14px;
                            color: ${isActive ? '#214ca6' : '#1a1a2e'};
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        ">${subName}</div>
                    </div>`;

          // Chevron mũi tên (xoay xuống khi active)
          const chevron = `<div style="
                        flex-shrink: 0; margin-left: 8px; color: ${isActive ? '#214ca6' : '#bbb'};
                        transition: transform 0.3s;
                        transform: ${isActive ? 'rotate(90deg)' : 'rotate(0deg)'};
                    ">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </div>`;

          item.innerHTML = iconCircle + textBlock + chevron;

          // Hover effect (chỉ khi không active)
          if (!isActive) {
            item.onmouseenter = () => {
              item.style.backgroundColor = "#f8faff";
              item.style.borderLeft = "3px solid #cbd5e1";
            };
            item.onmouseleave = () => {
              item.style.backgroundColor = "white";
              item.style.borderLeft = "3px solid transparent";
            };
          }

          item.onclick = () => {
            (window as any).highlightSubCategory(sub.id.toString());
          };
          categoryList.appendChild(item);

          // === AREA LIST: Render khi active (Incheon accordion style) ===
          if (isActive) {
            const areaContainer = document.createElement("div");
            areaContainer.className = "category-area-list";
            areaContainer.style.cssText = `
                            margin: 0; width: 100%; box-sizing: border-box;
                            max-height: 350px; overflow-y: auto;
                            background: #fafbfd;
                            border-bottom: 2px solid #e8ecf4;
                        `;

            // Get assigned areas for this subcategory
            const assignedMIDs = assignedMap.get(sub.id.toString()) || [];
            if (assignedMIDs.length > 0) {
              const currentFloorId = isMapInOverview() ? null : mapView.currentFloor.id;
              let areas = allMapObjects.filter(o => assignedMIDs.indexOf(o.id) !== -1);

              if (currentFloorId) {
                areas = areas.filter(a => {
                  const fId = a.floor?.id || a.floorId || (typeof a.floor === 'string' ? a.floor : null);
                  return fId === currentFloorId;
                });
              }
              // Sort by localized name
              areas.sort((a, b) => (TranslationManager.getName(a) || a.name || '').localeCompare(TranslationManager.getName(b) || b.name || ''));

              areas.forEach((area, index) => {
                const areaItem = document.createElement("div");
                const isFocused = currentSearchResults.length === 1 && currentSearchResults[0].id === area.id;

                // === INCHEON STYLE: Mỗi area item là một row flex đẹp mắt ===
                areaItem.style.cssText = `
                                    display: flex; align-items: center;
                                    padding: 10px 16px 10px 28px;
                                    cursor: pointer;
                                    transition: all 0.2s ease;
                                    border-bottom: 1px solid #f0f2f5;
                                    background: ${isFocused ? '#eef3ff' : 'transparent'};
                                    border-left: 3px solid ${isFocused ? '#214ca6' : 'transparent'};
                                `;

                // Icon pin nhỏ
                const pinIcon = `<div style="
                                    flex-shrink: 0; width: 28px; height: 28px;
                                    border-radius: 50%;
                                    background: ${isFocused ? '#214ca6' : '#e8ecf4'};
                                    display: flex; align-items: center; justify-content: center;
                                    margin-right: 12px;
                                ">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${isFocused ? 'white' : '#666'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                </div>`;

                // Tên + tầng
                const areaName = TranslationManager.getName(area) || area.name || area.id;
                const rawFloorName = area.floor?.name || (typeof area.floor === 'string' ? area.floor : null);
                const floorMappedId = area.floor?.mappedinId || area.floor?.id || area.floorId || (typeof area.floor === 'string' ? area.floor : null);
                const localizedFloorName = floorMappedId ? TranslationManager.getFloorName(floorMappedId, rawFloorName || '') : rawFloorName;

                const textInfo = `<div style="flex: 1; overflow: hidden;">
                                    <div style="
                                        font-weight: ${isFocused ? '600' : '400'};
                                        font-size: 13px;
                                        color: ${isFocused ? '#214ca6' : '#333'};
                                        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                                    ">${areaName}</div>
                                    ${localizedFloorName ? `<div style="
                                        font-size: 11px; color: #999; margin-top: 1px;
                                        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                                    ">${localizedFloorName}</div>` : ''}
                                </div>`;

                // Chevron nhỏ
                const miniChevron = `<div style="flex-shrink:0; margin-left:8px; color:#ccc;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                                </div>`;

                areaItem.innerHTML = pinIcon + textInfo + miniChevron;

                // Hover (chỉ khi không focus)
                if (!isFocused) {
                  areaItem.onmouseenter = () => {
                    areaItem.style.backgroundColor = "#f0f4ff";
                    areaItem.style.borderLeft = "3px solid #cbd5e1";
                  };
                  areaItem.onmouseleave = () => {
                    areaItem.style.backgroundColor = "transparent";
                    areaItem.style.borderLeft = "3px solid transparent";
                  };
                }

                areaItem.onclick = (e) => {
                  e.stopPropagation(); // Prevent subcategory toggle
                  // Focus on this area
                  // Update highlight
                  // 1. Clear OLD highlights/markers (Fix for "Highlight All" issue)
                  clearSearchMarkers();
                  if (currentSearchResults.length > 0) {
                    currentSearchResults.forEach(o => { try { resetObjectHighlight(o); } catch (e) { } });
                  }

                  // 2. Set New Selection
                  currentSearchResults = [area];

                  // Add marker
                  try {
                    mapView.updateState(area, { interactive: true, color: "#4CAF50", hoverColor: "#45a049" }); // Green
                    const anchor = getObjectAnchor(area);
                    if (anchor) {
                      const markerHtml = `<div class="search-marker" style="transform:translate(-50%,-100%);">
                                    <div style="background:#085ebb;color:white;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.2);">${area.name}</div>
                                    <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid #085ebb;margin:0 auto;"></div>
                                </div>`;
                      const marker = mapView.Markers.add(anchor, markerHtml, { interactive: false });
                      currentSearchMarkers.push(marker);
                    }
                  } catch (err) { }

                  // Smart Zoom 16.5x (User Request)
                  const floorId = area.floor?.id || area.floorId || (typeof area.floor === 'string' ? area.floor : null);
                  if (floorId) {
                    // ROBUST FLOOR SWITCH & ZOOM LOGIC (Moved from highlightSubCategory)
                    console.log("🚀 Item Click: Switching to floor", floorId, "for", area.name);

                    const isCurrentlyOverview = isMapInOverview();
                    const currentFloorId = isCurrentlyOverview ? null : mapView.currentFloor.id;

                    const executeZoom = () => {
                      console.log("⚡ Item Zoom Triggered");
                      // Use SIDEBAR PADDING (380px) to center object in visible area
                      mapView.Camera.focusOn(area, {
                        duration: 1500,
                        minZoomLevel: 19,
                        maxZoomLevel: 21,
                        padding: { top: 0, bottom: 0, left: 380, right: 0 }
                      } as any);
                      setTimeout(() => { isProgrammaticZoom = false; }, 2000);
                    };

                    // Always force switch if in Overview, or if ID differs
                    if (!currentFloorId || currentFloorId !== floorId) {
                      isProgrammaticZoom = true;
                      if (isCurrentlyOverview) {
                        (window as any).isInOverview = false;
                        isInOverview = false;
                        lastActiveFloorId = floorId;
                      }

                      let executed = false;
                      const handler = () => {
                        if (executed) return;
                        executed = true;
                        mapView.off("floor-change", handler);
                        setTimeout(executeZoom, 800);
                      };
                      mapView.on("floor-change", handler);
                      setTimeout(() => { if (!executed) { console.warn("Fallback Item Zoom"); handler(); } }, 2000);

                      try {
                        performFloorSwitch(floorId, "Item Click Navigation");
                      } catch (e) { handler(); }
                    } else {
                      // Same ID, but maybe stuck in Overview visual state?
                      if (isCurrentlyOverview) {
                        console.log("⚡ Exiting Overview for Item Click (Same Floor)");
                        (window as any).isInOverview = false;
                        isInOverview = false;
                        isProgrammaticZoom = true;
                        executeZoom();
                      } else {
                        executeZoom();
                      }
                    }
                  }

                  // Re-render to update the Blue Highlight on this item
                  renderCategories(parentId);
                };

                areaContainer.appendChild(areaItem);
              });
              categoryList.appendChild(areaContainer);
            }
          }
        });
      }
    } else {
      // MAIN CATEGORIES VIEW: Use Grid (2 columns)
      categoryList.style.display = "grid";
      categoryList.style.gridTemplateColumns = "1fr 1fr";
      categoryList.style.gap = "8px";
      // Render Main Categories that have at least one active subcategory on this floor
      const activeMainCats = categoryTree.filter(cat =>
        cat.subcategories && cat.subcategories.some((s: any) => isSubActiveOnFloor(s.id))
      );

      if (activeMainCats.length === 0) {
        // Use TranslationManager for correct text
        categoryList.innerHTML = `<div style="grid-column: 1/-1; padding:20px; text-align:center; color:#999;">${TranslationManager.t('no_categories_for_floor', 'Không có danh mục cho tầng này')}</div>`;
      }

      activeMainCats.forEach(cat => {
        const item = document.createElement("div");
        item.className = "category-item";
        if (activeCategoryId === cat.id.toString()) item.classList.add('active');
        item.innerHTML = `
                <div class="category-icon-box">${getIconHtml(cat.icon, "📁")}</div>
                <div class="category-label-box">${getCategoryName(cat)}</div>
            `;
        item.onclick = () => {
          (window as any).highlightCategory(cat.id.toString());
        };
        categoryList.appendChild(item);
      });
    }
  };

  // Category Toggle Logic
  const catPanel = document.getElementById("category-panel");
  const mainToggleBtn = document.getElementById("category-toggle-main-btn");
  const collapseBtn = document.getElementById("category-collapse-btn");

  const setCategoryPanelState = (isOpen: boolean) => {
    if (!catPanel || !mainToggleBtn) return;
    if (isOpen) {
      catPanel.style.display = "flex";
      mainToggleBtn.style.display = "none";
    } else {
      catPanel.style.display = "none";
      mainToggleBtn.style.display = "flex";
    }
  };

  // Default Open
  setCategoryPanelState(true);

  if (mainToggleBtn) {
    mainToggleBtn.addEventListener("click", () => setCategoryPanelState(true));
  }
  if (collapseBtn) {
    collapseBtn.addEventListener("click", () => setCategoryPanelState(false));
  }


  // Floor-change logic đã được xử lý ở lắng nghe sự kiện floor-change chính (dòng 3312+)


  // Helper: Thực hiện chuyển tầng có khóa bảo vệ
  const performFloorSwitch = async (targetFloorId: string, reason: string) => {
    if (isFloorSwitching || mapView.currentFloor.id === targetFloorId) return;

    isFloorSwitching = true;
    console.log(`🚀 [SMART-ZOOM] ${reason}. Target: ${targetFloorId}`);

    try {
      await mapView.setFloor(targetFloorId);
      const floorSelectorEl = document.getElementById("floor-selector") as HTMLSelectElement;

      if (floorSelectorEl) {
        const allFloors = mapData.getByType("floor");
        const selectableFloors = allFloors.filter(f => {
          const type = getFloorType(f);
          const name = (f.name || "").toLowerCase();
          const isRoof = name.includes("tầng mái") || name.includes("roof");
          return type !== "transit" && !isRoof;
        });

        // Rebuild selector only if necessary (to keep it clean)
        if (floorSelectorEl.options.length !== selectableFloors.length) {
          floorSelectorEl.innerHTML = selectableFloors.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
          updateFloorSelectorTranslations();
        }

        const targetFloor = allFloors.find(f => f.id === targetFloorId);
        if (targetFloor) {
          const targetType = getFloorType(targetFloor);

          if (targetType === "detail" || targetType === "overview") {
            floorSelectorEl.value = targetFloorId;
          } else if (targetType === "transit") {
            // If on a Transit floor, show the corresponding Detail floor name in dropdown
            const name = (targetFloor.name || "").toLowerCase();
            let prefix = "GF";
            if (name.includes("1f") || name.includes("tầng 1")) prefix = "1F";
            else if (name.includes("2f") || name.includes("tầng 2")) prefix = "2F";
            else if (name.includes("3f") || name.includes("tầng 3")) prefix = "3F";

            const detailMatch = allFloors.find(f => {
              if (getFloorType(f) !== "detail") return false;
              const n = (f.name || "").toLowerCase();
              return n.includes(prefix.toLowerCase()) || (prefix === "GF" && (n.includes("trệt") || n.includes("ground")));
            });

            if (detailMatch) {
              floorSelectorEl.value = detailMatch.id;
            }
          }
        }
      }

      // Cập nhật trạng thái Overview & Last Active
      const floorObj = mapData.getByType("floor").find(f => f.id === targetFloorId);
      const type = getFloorType(floorObj);
      isInOverview = type === "overview";

      if (type === "detail") {
        lastActiveFloorId = targetFloorId;
      }

      // Ensure colors are re-applied after a programmatic floor switch
      setTimeout(() => applyAreaColors(), 100);
    } catch (e) {
      console.warn("Error in smart floor switch:", e);
    } finally {
      // Delay nhỏ để tránh spam
      setTimeout(() => { isFloorSwitching = false; }, 500);
    }
  };

  // 6. Camera Zoom Listener for Auto-Floor Change (SMART ZOOM V3: Overview <-> Transit <-> Detail)
  let lastZoomLevel = getCameraZoom() || 15;
  let isFloorSwitching = false;

  mapView.on("camera-change", (transform: any) => {
    const zoom = transform.zoomLevel;
    const isZoomingIn = zoom > lastZoomLevel;
    const isZoomingOut = zoom < lastZoomLevel;
    lastZoomLevel = zoom;

    // Bỏ qua nếu đang chuyển tầng (chặn spam) hoặc zoom do code (category)
    if (isGlobalSwitchingFloor || isManualFloorSwitch || isProgrammaticZoom || isFloorSwitching) return;

    const currentFloor = mapView.currentFloor;
    const type = getFloorType(currentFloor);

    // ---------------------------------------------------------
    // KỊCH BẢN PHÓNG TO (ZOOM IN)
    // ---------------------------------------------------------
    if (isZoomingIn) {
      // 1. Overview -> GF Transit (Chạm 16.5x)
      if (type === "overview" && zoom >= 16.5) {
        const targetId = findFloorIdByKeywords(["GF", "Transit"]);
        if (targetId) {
          // performFloorSwitch(targetId, "Zoom IN Overview -> Transit"); // TEST: disable auto floor switch from zoom
        }
      }
      // 2. Transit -> Detail tương ứng (Chạm 17.0x)
      else if (type === "transit" && zoom >= 17.0) {
        const floorName = (currentFloor.name || "");
        // Ví dụ: "1F-Public-Transit" -> lấy "1F" để tìm tầng chi tiết tương ứng
        const prefix = floorName.split('-')[0].trim();
        let targetId = findFloorIdByKeywords([prefix === "GF" ? "Trệt" : prefix]);

        // Fallback cho GF nếu Trệt không khớp
        if (!targetId && prefix === "GF") targetId = findFloorIdByKeywords(["Ground"]);

        if (targetId) {
          performFloorSwitch(targetId, `Zoom IN Transit -> Detail (${prefix})`);
        }
      }
    }

    // ---------------------------------------------------------
    // KỊCH BẢN THU NHỎ (ZOOM OUT)
    // ---------------------------------------------------------
    if (isZoomingOut) {
      // 1. Detail -> Transit tương ứng (Chạm 15.5x)
      if (type === "detail" && zoom <= 15.5) {
        const floorName = (currentFloor.name || "").toUpperCase();
        let prefix = "GF";
        if (floorName.includes("1") || floorName.includes("L1")) prefix = "1F";
        else if (floorName.includes("2") || floorName.includes("L2")) prefix = "2F";
        else if (floorName.includes("3") || floorName.includes("L3")) prefix = "3F";

        const targetId = findFloorIdByKeywords([prefix, "Transit"]);
        if (targetId) {
          performFloorSwitch(targetId, `Zoom OUT Detail -> Transit (${prefix})`);
        }
      }
      // 2. Transit -> Overview (Chạm 15.0x)
      else if (type === "transit" && zoom <= 15.0) {
        if (overviewFloor) {
          performFloorSwitch(overviewFloor.id, "Zoom OUT Transit -> Overview");
        }
      }
    }

    // Logic ẩn/hiện nhãn theo mức Zoom
    const currentZoom = transform.zoomLevel;
    if (currentZoom <= 17.5) {
      document.body.classList.add('zoom-out-mode');
    } else {
      document.body.classList.remove('zoom-out-mode');
    }

    // Luôn cập nhật Marker Overview (Airport name)
    if (type === "overview") {
      checkZoomVisibility();
    }
  });

  // Listen to clicks on map objects to zoom to level 30
  // Listen to clicks on map objects to zoom to level 30
  // User Request: Persistent Selection (Don't clear on empty click)
  // User Request: Persistent Selection & Map Click Selection

  // If user clicks a polygon directly -> what happens?
  // Currently nothing special?

  // Init UI
  setTimeout(updateUIVisibility, 500);

  // ============================================
  // 12. POPUP INFO FUNCTIONS
  // ============================================
  /**
   * Hiển thị popup với thông tin của object được click
   */
  // ============================================
  // URL SYNCHRONIZATION
  // ============================================
  const syncURL = (forceReplace = false) => {
    try {
      const lang = (TranslationManager.currentLang || 'vn').toLowerCase();
      const floorId = mapView.currentFloor?.id;

      let path = `/${lang}/${MAP_ID}`;
      if (wayfindingOrigin || wayfindingDestination) {
        path += `/directions`;
      }

      const params = new URLSearchParams();
      if (floorId) params.set('floor', floorId);

      const getLocationId = (obj: any) => obj?.mappedinId || obj?.id || "";

      if (wayfindingDestination) {
        params.set('location', getLocationId(wayfindingDestination));
      } else if (selectedSpace) {
        params.set('location', getLocationId(selectedSpace));
      }

      if (wayfindingOrigin) {
        params.set('departure', getLocationId(wayfindingOrigin));
      }

      const queryString = params.toString();
      const fullURL = path + (queryString ? `?${queryString}` : '');

      if (forceReplace || window.location.pathname + window.location.search === fullURL) {
        window.history.replaceState({ path: fullURL }, '', fullURL);
      } else {
        window.history.pushState({ path: fullURL }, '', fullURL);
      }
    } catch (e) {
      console.warn("URL Sync error:", e);
    }
  };
  (window as any).syncURL = syncURL;

  // ============================================
  let wayfindingOrigin: any = null;
  let wayfindingDestination: any = null;
  let wayfindingStopovers: any[] = [];
  let isSelectingStopoverIndex: number = -1; // -1 means none
  let wayfindingDirections: any = null;
  let simplifiedInstructionsGlobal: any[] = []; // Global store for demo
  let routeTotalSecondsGlobal: number = 0; // Global store for demo
  let isSelectingOrigin: boolean = false;
  let isSelectingDestination: boolean = false;
  let currentNavigation: any = null;
  let currentSelectedStepIndex: number = -1; // Bước đang được chọn

  // Mảng lưu trữ các vật thể đặc biệt để highlight
  let allLevelConnectors: any[] = [];

  // ============================================
  // BLUE DOT ANIMATION CONSTANTS
  // ============================================
  const BLUE_DOT_SPEED_MPS = 1.4; // Trả về 1.4 m/s để tính toán thời gian đi bộ thực tế chính xác
  const FRAME_INTERVAL = 30; // Giữ 30ms để animation mượt mà
  const PREVIEW_SPEED_BOOST = 3.0; // Nhân tử tăng tốc riêng cho chế độ Preview (giúp snappy mà không sai số liệu thực)
  (window as any).speedMultiplier = 1.0;

  // ============================================
  // HELPER FUNCTIONS CHO BLUE DOT ANIMATION
  // ============================================
  /**
   * Hàm tính khoảng cách giữa 2 coordinates (Haversine formula)
   */
  const calculateDistance = (coord1: any, coord2: any): number => {
    if (!coord1 || !coord2) return 0;

    // Hỗ trợ cả latitude/longitude và lat/lng
    const lat1_val = coord1.latitude !== undefined ? coord1.latitude : coord1.lat;
    const lng1_val = coord1.longitude !== undefined ? coord1.longitude : coord1.lng;
    const lat2_val = coord2.latitude !== undefined ? coord2.latitude : coord2.lat;
    const lng2_val = coord2.longitude !== undefined ? coord2.longitude : coord2.lng;

    if (lat1_val === undefined || lng1_val === undefined || lat2_val === undefined || lng2_val === undefined) {
      return 0;
    }

    const R = 6371000; // Bán kính Trái Đất tính bằng mét
    const lat1 = lat1_val * Math.PI / 180;
    const lat2 = lat2_val * Math.PI / 180;
    const deltaLat = (lat2_val - lat1_val) * Math.PI / 180;
    const deltaLng = (lng2_val - lng1_val) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  /**
   * Hàm tính tổng khoảng cách dọc theo path từ coordinate này đến coordinate kia
   */
  const calculatePathDistance = (fromCoord: any, toCoord: any, pathCoordinates: any[]): number => {
    if (!fromCoord || !toCoord || !pathCoordinates || pathCoordinates.length === 0) {
      return 0;
    }

    // Tìm index của fromCoord và toCoord trong pathCoordinates
    const findNearestIndex = (targetCoord: any, startFrom: number = 0, endBefore?: number): number => {
      if (!targetCoord) return -1;
      let nearestIndex = -1;
      let minDistance = Infinity;
      const searchEnd = endBefore !== undefined ? Math.min(endBefore, pathCoordinates.length) : pathCoordinates.length;

      for (let i = startFrom; i < searchEnd; i++) {
        const coord = pathCoordinates[i];
        if (!coord) continue;

        const latDiff = Math.abs((coord.latitude || 0) - (targetCoord.latitude || 0));
        const lngDiff = Math.abs((coord.longitude || 0) - (targetCoord.longitude || 0));
        const distance = latDiff * latDiff + lngDiff * lngDiff;

        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }
      return nearestIndex;
    };

    const fromIndex = findNearestIndex(fromCoord, 0);
    const toIndex = findNearestIndex(toCoord, fromIndex >= 0 ? fromIndex : 0);

    if (fromIndex === -1 || toIndex === -1 || toIndex <= fromIndex) {
      // Nếu không tìm thấy, tính khoảng cách trực tiếp
      return calculateDistance(fromCoord, toCoord);
    }

    // Tính tổng khoảng cách dọc theo path từ fromIndex đến toIndex
    let totalDistance = 0;
    for (let i = fromIndex; i < toIndex; i++) {
      const coord1 = pathCoordinates[i];
      const coord2 = pathCoordinates[i + 1];
      if (coord1 && coord2) {
        totalDistance += calculateDistance(coord1, coord2);
      }
    }

    return totalDistance;
  };

  /**
   * Build distance table cho path coordinates
   * Trả về mảng distances tích lũy và totalDistance
   */
  const buildDistanceTable = (coords: any[]): { distances: number[]; totalDistance: number } => {
    const distances: number[] = [0];
    let total = 0;

    for (let i = 1; i < coords.length; i++) {
      const d = calculateDistance(coords[i - 1], coords[i]); // mét
      total += d;
      distances.push(total);
    }

    return { distances, totalDistance: total };
  };

  /**
   * Nội suy vị trí tại distance X mét trên path
   * Luôn nội suy mượt để blue dot di chuyển từ từ, không nhảy
   */
  const interpolateByDistance = (
    coords: any[],
    distances: number[],
    targetDistance: number
  ): any => {
    if (!coords || coords.length === 0) {
      return null;
    }

    const totalDistance = distances[distances.length - 1];
    const clampedDistance = Math.max(0, Math.min(targetDistance, totalDistance));

    for (let i = 1; i < distances.length; i++) {
      if (clampedDistance <= distances[i] || i === distances.length - 1) {
        const prevDist = distances[i - 1];
        const nextDist = distances[i];
        const segmentLength = nextDist - prevDist;

        if (segmentLength <= 0) {
          const c = coords[i - 1];
          return { latitude: c.latitude, longitude: c.longitude, floorId: c.floorId || c.floor?.id };
        }

        const ratio = (clampedDistance - prevDist) / segmentLength;
        const clampedRatio = Math.max(0, Math.min(1, ratio));

        const a = coords[i - 1];
        const b = coords[i];

        if (!a || !b) {
          const last = coords[coords.length - 1];
          return { latitude: last.latitude, longitude: last.longitude, floorId: last.floorId || last.floor?.id };
        }

        return {
          latitude: a.latitude + (b.latitude - a.latitude) * clampedRatio,
          longitude: a.longitude + (b.longitude - a.longitude) * clampedRatio,
          floorId: a.floorId || a.floor?.id || b.floorId || b.floor?.id
        };
      }
    }

    const last = coords[coords.length - 1];
    return { latitude: last.latitude, longitude: last.longitude, floorId: last.floorId || last.floor?.id };
  };

  /**
   * Clear navigation path và markers
   */
  const clearNavigation = () => {
    try {
      // Xóa highlighted path section
      if (mapView.Navigation && typeof (mapView.Navigation as any).clearAllHighlightedPathSections === 'function') {
        try {
          (mapView.Navigation as any).clearAllHighlightedPathSections();
        } catch (e) { }
      }
      currentSelectedStepIndex = -1;

      if (mapView.Navigation && typeof (mapView.Navigation as any).clear === 'function') {
        (mapView.Navigation as any).clear();
      }
      if (mapView.Paths && typeof mapView.Paths.removeAll === 'function') {
        mapView.Paths.removeAll();
      }
      currentNavigation = null;

      // Xóa danh sách instructions
      const instructionsListEl = document.getElementById("instructions-list");
      if (instructionsListEl) {
        instructionsListEl.innerHTML = "";
      }

      // Dừng blue dot animation nếu đang chạy
      if (blueDotAnimationInterval) {
        clearInterval(blueDotAnimationInterval);
        blueDotAnimationInterval = null;
      }
      isAnimating = false;
      isPaused = false;
      animationState = null;
      animationStartTime = 0;
      animationPauseTime = 0;
      totalAnimationDuration = 0;
      currentAnimationDistance = 0;

      // Ẩn video control bar
      const videoControlBar = document.getElementById("video-control-bar");
      if (videoControlBar) {
        videoControlBar.style.display = "none";
      }
    } catch (e) {
      console.warn("Error clearing navigation:", e);
      try {
        if (mapView.Paths && typeof mapView.Paths.removeAll === 'function') {
          mapView.Paths.removeAll();
        }
      } catch (e2) {
        console.warn("Error removing paths:", e2);
      }
    }
  };

  /**
   * Reset highlight của một object (bỏ nền xanh)
   */
  const resetObjectHighlight = (obj: any) => {
    if (!obj) return;
    const objectToReset = allMapObjects.find((o: any) => o.id === obj.id);
    if (objectToReset) {
      try {
        // Sử dụng getObjectBaseStyle để lấy màu mặc định theo vai trò khu vực
        const resetStyle = getObjectBaseStyle(objectToReset);
        mapView.updateState(objectToReset, {
          interactive: true,
          color: resetStyle.color,
          hoverColor: resetStyle.hoverColor,
        });
      } catch (e) {
        // Bỏ qua nếu không thể updateState
      }
    }
  };

  /**
   * Highlight một object (nền xanh)
   */
  const highlightObject = (obj: any) => {
    if (!obj) return;
    try {
      mapView.updateState(obj, {
        interactive: true,
        color: "#4CAF50",
        hoverColor: "#4CAF50",
      });
    } catch (e) {
      // Bỏ qua nếu không thể updateState
    }
  };

  /**
   * Quản lý highlight: chỉ highlight origin và destination (tối đa 2)
   * Reset tất cả highlights khác
   */
  const updateHighlights = () => {
    // Reset tất cả objects trước
    allMapObjects.forEach((obj: any) => {
      try {
        // Skip if object is currently a search result
        if (currentSearchResults.some((result: any) => result.id === obj.id)) {
          return;
        }

        // Chỉ reset màu nếu không phải origin, destination hoac selectedSpace hoac thuoc dang chon lam stopovers
        const isStopover = wayfindingStopovers.some(s => s && s.id === obj.id);
        if (obj.id !== wayfindingOrigin?.id && obj.id !== wayfindingDestination?.id && obj.id !== selectedSpace?.id && !isStopover) {
          // Sử dụng getObjectBaseStyle để lấy màu mặc định theo vai trò khu vực
          const refreshStyle = getObjectBaseStyle(obj);
          mapView.updateState(obj, {
            interactive: true,
            color: refreshStyle.color,
            hoverColor: refreshStyle.hoverColor,
          });
        }
      } catch (e) {
        // Bỏ qua
      }
    });

    // Chỉ highlight origin, destination và stopovers
    if (wayfindingOrigin) {
      highlightObject(wayfindingOrigin);
    }
    if (wayfindingDestination && wayfindingDestination.id !== wayfindingOrigin?.id) {
      highlightObject(wayfindingDestination);
    }
    wayfindingStopovers.forEach(stop => {
      if (stop && stop.id !== wayfindingOrigin?.id && stop.id !== wayfindingDestination?.id) {
        highlightObject(stop);
      }
    });

    // Highlight selectedSpace if exists
    if (selectedSpace && !currentSearchResults.some(r => r.id === selectedSpace.id)) {
      highlightObject(selectedSpace);
    }
  };
  (window as any).refreshMapColors = updateHighlights;

  /**
   * Draw navigation path
   */
  const drawNavigation = async () => {
    if (!wayfindingOrigin || !wayfindingDestination) {
      return;
    }
    try {
      clearNavigation();

      // Lấy directions với smoothing để có đường đi mượt mà nhưng vẫn đảm bảo điểm đến được kết nối
      // Tối ưu tốc độ: Ưu tiên greedy-los (nhanh nhất) cho hầu hết trường hợp, chỉ dùng dp-optimal cho đường rất gần
      // Mappedin JS tự động tránh cắt ngang qua khu vực bằng cách đi theo lối đi (paths)

      const statusEl = document.getElementById("wayfinding-status");

      // Helper: Lấy tọa độ anchor của một object (Internal to drawNavigation)
      const getObjAnchor = (obj: any): any => {
        if (obj.anchor) return obj.anchor;
        if (obj.coordinate) return obj.coordinate;
        if (obj.center) return obj.center;
        if (obj.centroid) return obj.centroid;
        if (obj.entrances && obj.entrances.length > 0 && obj.entrances[0].coordinate) return obj.entrances[0].coordinate;
        if (obj.navigableNodes && obj.navigableNodes.length > 0) {
          const node = obj.navigableNodes[0];
          return node.coordinate || node.anchor || null;
        }
        return null;
      };

      // Tính khoảng cách nhanh (chỉ tính khi cần)
      const originAnchor = getObjAnchor(wayfindingOrigin);
      const destAnchor = getObjAnchor(wayfindingDestination);
      let distance: number | null = null;

      if (originAnchor && destAnchor &&
        originAnchor.latitude && originAnchor.longitude &&
        destAnchor.latitude && destAnchor.longitude) {
        // Tính khoảng cách nhanh (bỏ qua sqrt để tăng tốc)
        const latDiff = originAnchor.latitude - destAnchor.latitude;
        const lngDiff = originAnchor.longitude - destAnchor.longitude;
        // Tính khoảng cách xấp xỉ (không dùng sqrt để nhanh hơn)
        distance = (Math.abs(latDiff) + Math.abs(lngDiff)) * 111000;
      }

      const smoothingConfig = {
        enabled: true,
        __EXPERIMENTAL_METHOD: 'dp-optimal' as const,
        radius: 0.5, // Cân bằng: Đủ lớn để xóa zic-zắc, đủ nhỏ để không vát góc quá lượn, bảo toàn ngã tư.
        __EXPERIMENTAL_INCLUDE_DOOR_BUFFER_NODES: true,
      };

      const waypoints = [wayfindingOrigin, ...wayfindingStopovers, wayfindingDestination].filter(Boolean);
      if (waypoints.length < 2) return;

      let allCoordinates: any[] = [];
      let allInstructions: any[] = [];
      let totalDistance = 0;
      let allPaths: any[] = [];

      for (let i = 0; i < waypoints.length - 1; i++) {
        const origin = waypoints[i];
        const dest = waypoints[i + 1];

        const dir = await mapData.getDirections(origin, dest, {
          smoothing: smoothingConfig,
          accessible: true,
        });

        if (dir && dir.coordinates && dir.coordinates.length > 0) {
          if (i > 0 && allCoordinates.length > 0) {
            allCoordinates.push(...dir.coordinates.slice(1));
          } else {
            allCoordinates.push(...dir.coordinates);
          }

          if (dir.instructions) {
            let insts = JSON.parse(JSON.stringify(dir.instructions));
            if (i < waypoints.length - 2) {
              const lastInst = insts[insts.length - 1];
              if (lastInst && lastInst.action) {
                lastInst.action.type = 'stopover';
                const stopLabel = TranslationManager.t('action_stopover', 'Điểm dừng');
                lastInst.instruction = `${stopLabel}: ${TranslationManager.getName(dest)}`;
              }
            }
            if (i > 0 && insts.length > 0) {
              if (insts[0].action?.type === 'departure' || insts[0].action?.type === 'start') {
                insts.splice(0, 1);
              }
            }
            allInstructions.push(...insts);
          }

          if ((dir as any).path) {
            allPaths.push((dir as any).path);
          } else if ((dir as any).paths) {
            allPaths.push(...(dir as any).paths);
          }

          totalDistance += dir.distance || 0;
        }
      }

      const combinedDirections: any = {
        coordinates: allCoordinates,
        instructions: allInstructions,
        distance: totalDistance,
        path: allPaths.length > 0 ? allPaths[0] : null,
        paths: allPaths
      };

      const directions = combinedDirections;
      if (directions && directions.coordinates && directions.coordinates.length > 0) {
        wayfindingDirections = directions;
        syncURL(false); // Push state for navigation start

        // ============================================
        // PRE-PROCESS: Hướng dẫn chi tiết (Granular Instructions Strategy)
        // ============================================
        let simplifiedInstructions: any[] = directions.instructions ? JSON.parse(JSON.stringify(directions.instructions)) : [];

        try {
          if (simplifiedInstructions.length > 0) {
            // ============================================
            // INTELLIGENT MERGING STRATEGY (Siết chặt các bước rẽ thừa)
            // ============================================
            const merged: any[] = [];
            let current = simplifiedInstructions[0];

            console.log("🛠️ Original steps count:", simplifiedInstructions.length);

            for (let i = 1; i < simplifiedInstructions.length; i++) {
              const next = simplifiedInstructions[i];
              const nextType = (next.action?.type || '').toLowerCase();
              const currentType = (current.action?.type || '').toLowerCase();
              const nextBearing = (next.action?.bearing || '').toString().toLowerCase();
              const currentBearing = (current.action?.bearing || '').toString().toLowerCase();

              let shouldMerge = false;
              let overrideAction = false;

              // Rule Blocker: Luôn giữ thang máy/thang cuốn
              if (nextType.includes('connection') || currentType.includes('connection')) {
                merged.push(current);
                current = next;
                continue;
              }

              // 🏷️ Rule 1: Khởi hành + Đoạn đi thẳng ngắn -> Gộp để bước xuất phát có quãng đường
              const isStart = (currentType === 'departure' || currentType === 'start');
              const isNextSlight = nextType === 'turn' && nextBearing.includes('slight');

              if (isStart) {
                // Chỉ gộp nếu bước tiếp theo là đi thẳng HOẶC rẽ cực nhẹ (slight) với khoảng cách ngắn
                if ((nextType === 'continue' && next.distance < 15) || (isNextSlight && next.distance < 5)) {
                  shouldMerge = true;
                  console.log(`  -> Gộp Rule 1: Merging ${nextType} into Start (dist: ${next.distance})`);
                }
              }

              // 🏷️ Rule 2: Hai bước Rẽ NGƯỢC HƯỚNG liên tiếp trong phạm vi ngắn (< 12m)
              // (Ví dụ: Rẽ trái 4m rồi rẽ phải 4m -> Thực tế là đi thẳng hoặc tránh vật cản)
              if (!shouldMerge && currentType === 'turn' && nextType === 'turn') {
                const isOpposite = (currentBearing.includes('left') && nextBearing.includes('right')) ||
                  (currentBearing.includes('right') && nextBearing.includes('left'));
                if (isOpposite && (current.distance + next.distance) < 12) {
                  shouldMerge = true;
                  // Sau khi gộp 2 cái rẽ ngược nhau, ta coi như đi thẳng
                  // PHẢI xóa bearing + instruction để translateActionType không nhầm thành 'Rẽ trái/phải'
                  current.action.type = 'continue';
                  current.action.bearing = '';
                  current.action.instruction = '';
                  if (current.instruction) current.instruction = '';
                  console.log(`  -> Gộp Rule 2: Merging opposite turns into Continue`);
                }
              }

              // 🏷️ Rule 3: Hai bước Rẽ CÙNG HƯỚNG liên tiếp rất ngắn (< 8m)
              if (!shouldMerge && currentType === 'turn' && nextType === 'turn') {
                const isSame = (currentBearing.includes('left') && nextBearing.includes('left')) ||
                  (currentBearing.includes('right') && nextBearing.includes('right'));
                if (isSame && current.distance < 8) {
                  shouldMerge = true;
                  overrideAction = true; // Lấy hành động rẽ của bước sau
                  console.log(`  -> Gộp Rule 3: Merging same direction turns`);
                }
              }

              // 🏷️ Rule 4: Gộp các bước Continue liên tiếp (Mặc định)
              if (!shouldMerge && (currentType === 'continue' && nextType === 'continue')) {
                shouldMerge = true;
                console.log(`  -> Gộp Rule 4: Normal continue merging`);
              }

              // 🏷️ Rule 5: Bước quá ngắn (< 3m) và không phải thang máy/thang cuốn thì gộp luôn
              if (!shouldMerge && next.distance < 3 && !nextType.includes('connection')) {
                shouldMerge = true;
                console.log(`  -> Gộp Rule 5: Micro-step merging (<3m)`);
              }

              // 🏷️ Rule 6: Gộp bước rẽ thông minh
              if (!shouldMerge && nextType === 'turn') {
                if (next.distance < 3) {
                  shouldMerge = true;
                  console.log(`  -> Gộp Rule 6a: Micro-turn (<3m)`);
                } else if (next.distance < 10) {
                  // Thử tính góc rẽ thực tế từ tọa độ
                  const nextNext = simplifiedInstructions[i + 1];
                  const cCoord = current.coordinate;
                  const nCoord = next.coordinate;
                  const nnCoord = nextNext?.coordinate;

                  console.log(`  [Rule 6 DEBUG] next.dist=${next.distance.toFixed(1)}, cCoord=${!!cCoord}, nCoord=${!!nCoord}, nnCoord=${!!nnCoord}, nextNext_type=${nextNext?.action?.type || 'N/A'}`);

                  let canComputeAngle = false;
                  let angleDiff = 999;

                  if (cCoord && nCoord && nnCoord) {
                    const dLat1 = (nCoord.latitude || 0) - (cCoord.latitude || 0);
                    const dLng1 = (nCoord.longitude || 0) - (cCoord.longitude || 0);
                    const dLat2 = (nnCoord.latitude || 0) - (nCoord.latitude || 0);
                    const dLng2 = (nnCoord.longitude || 0) - (nCoord.longitude || 0);

                    // Chỉ tính nếu cả 2 vector đủ dài (tránh chia cho 0)
                    if ((Math.abs(dLat1) + Math.abs(dLng1)) > 0.0000001 && (Math.abs(dLat2) + Math.abs(dLng2)) > 0.0000001) {
                      const h1 = Math.atan2(dLng1, dLat1) * 180 / Math.PI;
                      const h2 = Math.atan2(dLng2, dLat2) * 180 / Math.PI;
                      angleDiff = Math.abs(h2 - h1);
                      if (angleDiff > 180) angleDiff = 360 - angleDiff;
                      canComputeAngle = true;
                      console.log(`  [Rule 6 Angle] h1=${h1.toFixed(1)}°, h2=${h2.toFixed(1)}°, diff=${angleDiff.toFixed(1)}°`);
                    }
                  }

                  if (canComputeAngle && angleDiff < 30) {
                    shouldMerge = true;
                    current.action.type = 'continue';
                    console.log(`  -> Gộp Rule 6b: Gentle angle (${angleDiff.toFixed(1)}° < 30°)`);
                  } else if (!canComputeAngle && next.distance < 8) {
                    // FALLBACK: Không tính được góc → gộp nếu < 8m (ngưỡng an toàn)
                    shouldMerge = true;
                    current.action.type = 'continue';
                    console.log(`  -> Gộp Rule 6c: Fallback merge (no coord, dist=${next.distance.toFixed(1)}m < 8m)`);
                  }
                }
              }

              if (shouldMerge) {
                current.distance += next.distance;
                // Cộng dồn thời gian nếu có (Mappedin có thể dùng .time hoặc .duration)
                if (next.time !== undefined) current.time = (current.time || 0) + next.time;
                if (next.duration !== undefined) current.duration = (current.duration || 0) + next.duration;

                if (overrideAction) current.action = next.action;
              } else {
                merged.push(current);
                current = next;
              }
            }
            merged.push(current);
            console.log("✅ Intelligent Simplification complete. New steps count:", merged.length);

            // POST-MERGE: Gộp Departure + Continue liền kề thành 1 bước "Đi thẳng"
            const postMerged: any[] = [];
            for (let j = 0; j < merged.length; j++) {
              const step = merged[j];
              const stepType = (step.action?.type || '').toLowerCase();
              const prevStep = postMerged[postMerged.length - 1];
              const prevType = prevStep ? (prevStep.action?.type || '').toLowerCase() : '';

              if ((prevType === 'departure' || prevType === 'start') && stepType === 'continue') {
                prevStep.distance += step.distance;
                console.log(`  -> Post-merge: Merging Continue into Departure (total dist: ${prevStep.distance.toFixed(1)})`);
              } else {
                postMerged.push(step);
              }
            }
            merged.length = 0;
            postMerged.forEach(s => merged.push(s));

            // Lưu originalDistance TRƯỚC KHI dịch
            merged.forEach(step => {
              step.originalDistance = step.distance || 0;
            });

            // DISTANCE SHIFTING cho hiển thị UI:
            for (let i = 0; i < merged.length - 1; i++) {
              merged[i].distance = merged[i + 1].distance;
            }
            merged[merged.length - 1].distance = 0;

            simplifiedInstructions = merged;
          }
        } catch (e) {
          console.warn("Error simplifying instructions:", e);
        }

        const navigationOptions: any = {
          pathOptions: {
            displayArrowsOnPath: true,
            animateArrowsOnPath: true,
            accentColor: '#214ca6',
            width: 1.0, // Đã giảm từ 2.0 xuống 1.0 để thanh mảnh tinh tế hơn, không gây rối
          },
          markerOptions: {
            departureColor: '#214ca6',
            destinationColor: '#f59e0b',
          },
        };
        currentNavigation = mapView.Navigation.draw(directions, navigationOptions);

        // ============================================
        // HELPERS CHO NAVIGATION UI
        // ============================================

        // Helper: Tính khoảng cách (mét) giữa 2 tọa độ
        const calcDistanceMeters = (coord1: any, coord2: any): number => {
          if (!coord1 || !coord2) return Infinity;
          const lat1 = coord1.latitude || coord1.lat;
          const lng1 = coord1.longitude || coord1.lng;
          const lat2 = coord2.latitude || coord2.lat;
          const lng2 = coord2.longitude || coord2.lng;
          if (lat1 === undefined || lng1 === undefined || lat2 === undefined || lng2 === undefined) return Infinity;

          const R = 6371000; // Bán kính Trái Đất (mét)
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLng = (lng2 - lng1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };

        // Helper: Lấy tọa độ anchor của một object
        const getObjAnchor = (obj: any): any => {
          if (obj.anchor) return obj.anchor;
          if (obj.coordinate) return obj.coordinate;
          if (obj.center) return obj.center;
          if (obj.centroid) return obj.centroid;
          if (obj.entrances && obj.entrances.length > 0 && obj.entrances[0].coordinate) return obj.entrances[0].coordinate;
          if (obj.navigableNodes && obj.navigableNodes.length > 0) {
            const node = obj.navigableNodes[0];
            return node.coordinate || node.anchor || null;
          }
          return null;
        };

        // Helper: Tìm landmark trên đường đi
        const findLandmarkAlongPath = (pathCoordinates: any[], startIndex: number, endIndex: number, currentFloorId?: string, excludeNames: string[] = []): string | null => {
          if (!pathCoordinates || pathCoordinates.length === 0) return null;
          const highPriorityKeywords = ['immigration', 'nhập cảnh', 'xuất cảnh', 'transfer', 'nối chuyến', 'security', 'an ninh', 'gate', 'cửa ra'];
          const normalPriorityKeywords = ['lounge', 'phòng chờ', 'toilet', 'restroom', 'coffee', 'cafe', 'shop'];

          let foundHigh: string | null = null;
          let foundNormal: string | null = null;

          const searchStep = Math.max(1, Math.floor((endIndex - startIndex) / 20));
          for (let i = startIndex; i < endIndex; i += searchStep) {
            const point = pathCoordinates[i];
            for (const obj of allMapObjects) {
              if (currentFloorId && obj.floor?.id !== currentFloorId) continue;
              const name = TranslationManager.getName(obj) || obj.name;
              if (!name || name.length < 3) continue;
              if (excludeNames.some(ex => name.toLowerCase().includes(ex.toLowerCase()))) continue;

              const anchor = getObjAnchor(obj);
              if (!anchor) continue;

              const dist = calcDistanceMeters(point, anchor);
              if (dist < 10) {
                const lowerName = name.toLowerCase();
                if (highPriorityKeywords.some(kw => lowerName.includes(kw))) {
                  foundHigh = name; break;
                } else if (normalPriorityKeywords.some(kw => lowerName.includes(kw)) && !foundNormal) {
                  foundNormal = name;
                }
              }
            }
            if (foundHigh) break;
          }
          return foundHigh || foundNormal;
        };

        // Helper: Tìm landmark gần tọa độ
        const findNearbyLandmark = (coord: any, currentFloorId?: string, maxDist: number = 30, excludeNames: string[] = []): string | null => {
          if (!coord) return null;
          let bestLandmark: string | null = null;
          let minDist = maxDist;

          for (const obj of allMapObjects) {
            if (currentFloorId && obj.floor?.id !== currentFloorId) continue;
            const name = TranslationManager.getName(obj) || obj.name;
            if (!name || name.length < 3) continue;
            if (excludeNames.some(ex => name.toLowerCase().includes(ex.toLowerCase()))) continue;

            const anchor = getObjAnchor(obj);
            if (!anchor) continue;

            const dist = calcDistanceMeters(coord, anchor);
            if (dist < minDist) {
              minDist = dist;
              bestLandmark = name;
            }
          }
          return bestLandmark;
        };

        // Translation logic
        const translateActionType = (instruction: any, allInstructions: any[], currentIndex: number): string => {
          const actionType = (instruction.action?.type || 'continue').toLowerCase();
          const bearing = (instruction.action?.bearing || '').toLowerCase();
          const connection = instruction.action?.connection;
          const t = (key: string, def: string) => TranslationManager.t(key, def);
          const mappedinText = instruction.action?.instruction || instruction.instruction || "";

          let landmarkText = "";
          const coord = instruction.coordinate;
          if (coord) {
            const nearL = findNearbyLandmark(coord, coord.floorId, 15);
            if (nearL) landmarkText = ` ${t('near', 'gần')} ${nearL}`;
          }

          if (connection) {
            const connName = connection.name || TranslationManager.getName(connection);
            const connType = (connection.type || '').toLowerCase();
            const isElevator = connType.includes('elevator') || (connName && connName.toLowerCase().includes('thang máy'));

            const fromFloor = instruction.action?.fromFloor;
            const toFloor = instruction.action?.toFloor;
            let dirText = '';
            if (fromFloor?.elevation !== undefined && toFloor?.elevation !== undefined) {
              dirText = toFloor.elevation > fromFloor.elevation ? t('direction_up', 'đi lên') : t('direction_down', 'đi xuống');
            }

            const isEnter = actionType === 'takeconnection' || actionType === 'enter';
            const floorId = isEnter ? allInstructions[currentIndex + 1]?.coordinate?.floorId : instruction.coordinate?.floorId;
            const floorName = floorId ? TranslationManager.getFloorName(floorId) : '';
            const floorText = floorName ? ` ${isEnter ? t('to_floor_label', 'đến') : t('at_floor_label', 'tại')} ${floorName}` : '';

            if (isEnter) {
              const action = isElevator ? t('action_enter', 'Vào') : t('action_take', 'Đi');
              const name = isElevator ? t('elevator', 'thang máy') : (connName || t('escalator', 'thang cuốn'));
              return `${action} ${name} ${dirText}${floorText}${landmarkText}`;
            } else {
              const name = isElevator ? t('elevator', 'thang máy') : (connName || t('escalator', 'thang cuốn'));
              return `${t('action_exit_connection', 'Ra khỏi')} ${name}${floorText}`;
            }
          }

          // TRƯỜNG HỢP 1: BẮT ĐẦU
          if (currentIndex === 0 || actionType === 'start' || actionType === 'departure') {
            return `${t('action_departure', 'Khởi hành')} - ${t('action_go_straight', 'Đi thẳng')}`;
          }

          // TRƯỜNG HỢP 2: RẼ
          if (actionType === 'turn' || bearing.includes('turn') || bearing.includes('left') || bearing.includes('right')) {
            if (mappedinText) {
              let vText = mappedinText
                .replace(/Turn\s+left/gi, t('action_turn_left', 'Rẽ trái'))
                .replace(/Turn\s+right/gi, t('action_turn_right', 'Rẽ phải'))
                .replace(/Turn\s+around/gi, t('action_turn_around', 'Quay lại'))
                .replace(/Slight\s+left/gi, t('action_slight_left', 'Rẽ trái nhẹ'))
                .replace(/Slight\s+right/gi, t('action_slight_right', 'Rẽ phải nhẹ'));
              return landmarkText ? `${vText}${landmarkText}` : vText;
            }
            let turnAction = t('action_turn', 'Rẽ');
            if (bearing.includes('left')) turnAction = t('action_turn_left', 'Rẽ trái');
            if (bearing.includes('right')) turnAction = t('action_turn_right', 'Rẽ phải');
            return landmarkText ? `${turnAction}${landmarkText}` : turnAction;
          }

          const actionMap: Record<string, string> = {
            'arrival': t('action_arrival', 'Kết thúc'),
            'continue': t('action_continue', 'Tiếp tục đi thẳng'),
            'arrive': t('action_arrive', 'Đến nơi'),
            'stopover': mappedinText || 'Điểm dừng',
            'departure': t('action_departure', 'Khởi hành'),
          };

          return (actionMap[actionType] || mappedinText || actionType) + (actionType === 'continue' ? landmarkText : '');
        };



        const instructionsListEl = document.getElementById("instructions-list");
        let instructionsHtml = '';
        let routeTotalSeconds = 0;

        try {
          if (!directions.instructions || directions.instructions.length === 0) {
            instructionsHtml = `<div style="padding:10px; color:#666; font-style:italic;">${TranslationManager.t('not_found', "Không tìm thấy đường đi")}</div>`;
          } else {
            instructionsHtml = `<div id="instructions-raw-list" style="padding-top: 10px; padding-bottom: 30px;">`;

            simplifiedInstructions.forEach((instruction: any, index: number) => {
              const isFirstStep = index === 0;
              const isLastStep = index === simplifiedInstructions.length - 1;
              const actionType = (instruction.action?.type || '').toLowerCase();
              const isConnection = actionType.includes('connection') || actionType.includes('elevator') || actionType.includes('stair') || actionType.includes('escalator');

              let actionText = translateActionType(instruction, simplifiedInstructions, index);
              if (!actionText || actionText === 'undefined') {
                actionText = instruction.action?.instruction || instruction.instruction || actionType || TranslationManager.t('action_continue', 'Tiếp tục');
              }
              actionText = actionText.replace('Toà nhà T2:', '').trim();

              let distanceText = '';
              let timeText = '';
              let currentDist = Math.round(instruction.distance || 0);

              if (isConnection) {
                const isEnter = actionType === 'takeconnection' || actionType === 'enter';
                if (isEnter) {
                  const connType = (instruction.action?.connection?.type || '').toLowerCase();
                  const isElevator = connType.includes('elevator') || (instruction.action?.connection?.name || '').toLowerCase().includes('thang máy');
                  currentDist = isElevator ? 3 : 6;
                } else {
                  currentDist = 0;
                }
              }

              if (currentDist > 0 && actionType !== 'arrive' && actionType !== 'arrival') {
                distanceText = `${currentDist}m`;
                let stepSeconds = (isConnection || actionText.toLowerCase().includes('thang')) ? Math.round(currentDist / 0.6) + 20 : Math.round(currentDist / 1.4);
                routeTotalSeconds += stepSeconds;
                timeText = stepSeconds < 60 ? `${stepSeconds}s` : `${Math.floor(stepSeconds / 60)}${TranslationManager.t('minute_label_short', 'm')}`;
              }

              const floorName = TranslationManager.getFloorName(instruction.coordinate?.floorId || "");
              let stepIcon = (index + 1).toString();
              if (isFirstStep) {
                stepIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none"><circle cx="12" cy="12" r="8"/></svg>`;
              } else if (isLastStep) {
                stepIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>`;
              }

              let metaBadges = '';
              if (distanceText) metaBadges += `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:#f8f9fa;border:1px solid #edf2f7;border-radius:6px;font-size:11px;color:#4a5568;font-weight:700;">${distanceText}</span>`;
              if (timeText) metaBadges += `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:#f8f9fa;border:1px solid #edf2f7;border-radius:6px;font-size:11px;color:#4a5568;font-weight:700;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${timeText}</span>`;
              if (floorName) metaBadges += `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:#eef2ff;border:1px solid #d0dfff;border-radius:6px;font-size:11px;color:#214ca6;font-weight:700;">${floorName}</span>`;

              let rowBg = 'white';
              if (isFirstStep) rowBg = 'linear-gradient(90deg, #f0f7ff 0%, #ffffff 100%)';
              else if (isLastStep) rowBg = 'linear-gradient(90deg, #fffcf5 0%, #ffffff 100%)';

              instructionsHtml += `
                <div class="instruction-step" style="position:relative; display:flex; align-items:center; gap:16px; padding:18px 20px; cursor:pointer; width:100%; box-sizing:border-box; background:${rowBg}; border-bottom:1px solid #f8f9fb; transition:all 0.2s;" onclick="window.selectStep(${index})" onmouseenter="this.style.background='rgba(33, 76, 166, 0.03)'" onmouseleave="this.style.background='${rowBg}'">
                  ${!isLastStep ? `<div style="position:absolute; left:33px; top:40px; bottom:-18px; width:2px; background:#dfe6f0; z-index:1;"></div>` : ''}
                  <div style="position:relative; z-index:2; width:26px; height:26px; min-width:26px; background:${isFirstStep ? '#214ca6' : isLastStep ? '#ffa500' : '#214ca6'}; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:13px; font-weight:800;">${stepIcon}</div>
                  <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
                    <div style="font-size:15px; font-weight:700; color:#1a1a2e; line-height:1.3;">${actionText}</div>
                    <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">${metaBadges}</div>
                  </div>
                </div>`;
            });
            instructionsHtml += '</div>';
          }

          let cumulativeDist = 0;
          simplifiedInstructions.forEach(inst => {
            inst.cumulativeDistance = cumulativeDist;
            cumulativeDist += inst.originalDistance || inst.distance || 0;
          });

          simplifiedInstructionsGlobal = simplifiedInstructions;
          routeTotalSecondsGlobal = routeTotalSeconds;
          (window as any).instructionTotalDistance = cumulativeDist;

        } catch (e) {
          console.warn("Error drawing navigation steps:", e);
          instructionsHtml = `<div style="padding:10px; color:#f44336;">${TranslationManager.t('error_nav', "Lỗi khi tìm đường đi")}</div>`;
        }

        if (instructionsListEl) instructionsListEl.innerHTML = instructionsHtml;

        const statusEl = document.getElementById("wayfinding-status");
        if (statusEl) {
          let totalDisplayDist = 0;
          simplifiedInstructions.forEach((inst, idx) => {
            const actType = (inst.action?.type || '').toLowerCase();
            const isConn = actType.includes('connection') || actType.includes('elevator') || actType.includes('stair') || actType.includes('escalator');
            let d = inst.distance || 0;
            if (isConn) {
              const isEnter = actType === 'takeconnection' || actType === 'enter';
              if (isEnter) {
                const isElev = (inst.action?.connection?.type || '').toLowerCase().includes('elevator') || (inst.action?.connection?.name || '').toLowerCase().includes('thang máy');
                d = isElev ? 3 : 6;
              } else d = 0;
            }
            if (!actType.includes('arrive') && !actType.includes('arrival')) totalDisplayDist += Math.round(d);
          });

          const popup = document.getElementById("sidebar-info-panel");
          const categorySection = document.getElementById("category-section");
          const sidebarActions = document.querySelector(".sidebar-actions") as HTMLElement;
          if (popup) popup.style.display = "none";
          if (categorySection) categorySection.style.display = "none";
          if (sidebarActions) sidebarActions.style.display = "none";

          const summaryContainer = document.getElementById("wayfinding-summary-container");
          const previewBar = document.getElementById("route-preview-bar");

          if (summaryContainer) {
            summaryContainer.style.display = "block";
            const mLabelShort = TranslationManager.t('minute_label_short', 'm');
            const largeTime = routeTotalSeconds < 60 ? `${routeTotalSeconds}s` : `${Math.floor(routeTotalSeconds / 60)}${mLabelShort}`;
            summaryContainer.innerHTML = `
              <div style="padding: 24px 20px 15px; background: white; border-top: 1.5px solid #f0f4f8;">
                <div style="display: flex; align-items: flex-end; justify-content: space-between;">
                  <div style="display: flex; align-items: baseline; gap: 10px;">
                    <span style="font-size:38px; font-weight:900; color:#1a1a2e; letter-spacing:-1.5px; line-height:1;">${largeTime}</span>
                    <span style="font-size:18px; font-weight:600; color:#64748b;">${Math.round(totalDisplayDist)}m</span>
                  </div>
                  <div style="margin-bottom:4px;">
                    <span style="display:inline-flex; align-items:center; gap:4px; padding:4px 12px; background:#f0f6ff; border-radius:12px; color:#214ca6; font-size:11px; font-weight:500; border:1px solid #d0dfff;">
                        <svg viewBox="0 0 24 24" style="width:12px;height:12px;fill:#214ca6;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        ${TranslationManager.t('route_found', 'Đã tìm thấy đường đi')}
                    </span>
                  </div>
                </div>
              </div>`;
          }
          if (previewBar) previewBar.style.display = "block";

          (window as any).isNavigationActive = true;
          if (statusEl) statusEl.textContent = "";
        }

        // Navigation segment highlighting (Skeleton)
        const highlightPathSegment = (stepIndex: number) => {
          if (!currentNavigation || !directions.instructions) return;
          if (mapView.Navigation && typeof (mapView.Navigation as any).clearAllHighlightedPathSections === 'function') {
            (mapView.Navigation as any).clearAllHighlightedPathSections();
          }
          const current = directions.instructions[stepIndex];
          if (!current || !current.coordinate) return;
          const next = directions.instructions[stepIndex + 1];
          const toCoord = next?.coordinate || directions.coordinates[directions.coordinates.length - 1];
        };

        (window as any).selectStep = (index: number) => {
          if (isAnimating) return;
          const inst = simplifiedInstructions[index];
          if (!inst || !inst.coordinate) return;
          if (inst.coordinate.floorId !== mapView.currentFloor.id) mapView.setFloor(inst.coordinate.floorId);
          mapView.Camera.animateTo({ center: inst.coordinate }, { duration: 800 });
          (mapView.Camera as any).set({ zoomLevel: 20 });
          document.querySelectorAll('.instruction-step').forEach((s, i) => {
            (s as HTMLElement).style.background = (i === index) ? 'rgba(33, 76, 166, 0.05)' : 'white';
            (s as HTMLElement).style.borderLeft = (i === index) ? '4px solid #214ca6' : '4px solid transparent';
          });
        };
        // Gọi hàm applyAreaColors để render lại toàn bộ mảng sáng tối theo bảng màu Premium
        // applyAreaColors() tự động nhận diện Focus để spotlight đường đi và làm mờ các không gian xung quanh
        applyAreaColors();
      } else {
        const statusEl = document.getElementById("wayfinding-status");
        if (statusEl) {
          statusEl.textContent = TranslationManager.t('not_found', "Không tìm thấy đường đi");
        }
      }
    } catch (e) {
      console.error("Error drawing navigation:", e);
      const statusEl = document.getElementById("wayfinding-status");
      if (statusEl) {
        statusEl.textContent = TranslationManager.t('error_nav', "Lỗi khi tìm đường đi");
      }
    }
  };

  (window as any).drawNavigation = drawNavigation;




  const resetWayfinding = () => {
    (window as any).isNavigationActive = false;
    wayfindingOrigin = null;
    wayfindingDestination = null;
    wayfindingStopovers = [];
    wayfindingDirections = null;
    isSelectingOrigin = false;
    isSelectingDestination = false;
    isSelectingStopoverIndex = -1;

    // Clear detail info panel if open
    if (typeof hideInfo === 'function') hideInfo();

    clearNavigation();
    updateWayfindingUI();
    syncURL(true); // Update URL to remove directions

    // RESET UI BUTTONS
    const directionsBtn = document.getElementById("directions-btn");
    if (directionsBtn) directionsBtn.classList.remove("active");

    const rwPreviewBtn = document.getElementById("wayfinding-preview-btn");
    const rwPreviewBtnMain = document.getElementById("wayfinding-preview-btn-main");
    if (rwPreviewBtn) rwPreviewBtn.textContent = TranslationManager.t('start_preview', "Bắt đầu");
    if (rwPreviewBtnMain) {
      const span = rwPreviewBtnMain.querySelector('span');
      if (span) span.textContent = TranslationManager.t('route_preview', "Route Preview");
    }

    const previewBar = document.getElementById("route-preview-bar");
    if (previewBar) previewBar.style.display = "none";
    const summaryContainer = document.getElementById("wayfinding-summary-container");
    if (summaryContainer) summaryContainer.style.display = "none";
    // Re-highlight selection
    updateHighlights();

    const statusEl = document.getElementById("wayfinding-status");
    if (statusEl) statusEl.textContent = "";
  };

  /**
   * Update wayfinding UI
   */
  (window as any).startSelectingNode = (type: 'origin' | 'destination' | 'stopover', index: number = -1) => {
    // If we're already selecting this node, do not re-render and lose focus
    if (type === 'origin' && isSelectingOrigin) return;
    if (type === 'destination' && isSelectingDestination) return;
    if (type === 'stopover' && isSelectingStopoverIndex === index) return;

    isSelectingOrigin = type === 'origin';
    isSelectingDestination = type === 'destination';
    isSelectingStopoverIndex = type === 'stopover' ? index : -1;
    // Show instruction prompt
    const statusEl = document.getElementById("wayfinding-status");
    if (statusEl) {
      statusEl.innerHTML = '';
    }
    updateWayfindingUI();

    // Restore focus to the input because innerHTML re-render destroys it
    setTimeout(() => {
      let idToFocus = '';
      if (type === 'origin') idToFocus = 'wayfinding-input-origin';
      else if (type === 'destination') idToFocus = 'wayfinding-input-destination';
      else if (type === 'stopover') idToFocus = 'wayfinding-input-stopover-' + index;

      if (idToFocus) {
        const input = document.getElementById(idToFocus) as HTMLInputElement;
        if (input) {
          input.focus();
          const valLen = input.value.length;
          input.setSelectionRange(valLen, valLen);
        }
      }
    }, 10);
  };

  (window as any).addStopover = (e: Event) => {
    e.stopPropagation();
    if (wayfindingStopovers.length >= 5) {
      alert("Tối đa 5 điểm dừng!");
      return;
    }
    wayfindingStopovers.push(null);
    (window as any).startSelectingNode('stopover', wayfindingStopovers.length - 1);
  };

  (window as any).removeStopover = (e: Event, index: number) => {
    e.stopPropagation();
    wayfindingStopovers.splice(index, 1);
    // Reset selection if it was deleted
    if (isSelectingStopoverIndex === index) {
      isSelectingStopoverIndex = -1;
    } else if (isSelectingStopoverIndex > index) {
      isSelectingStopoverIndex--;
    }
    updateWayfindingUI();
    if (wayfindingOrigin && wayfindingDestination) drawNavigation(); else clearNavigation();
  };

  (window as any).swapNodes = (index1: number, index2: number) => {
    const nodes = [wayfindingOrigin, ...wayfindingStopovers, wayfindingDestination];
    const temp = nodes[index1];
    nodes[index1] = nodes[index2];
    nodes[index2] = temp;
    wayfindingOrigin = nodes[0];
    wayfindingDestination = nodes[nodes.length - 1];
    wayfindingStopovers = nodes.slice(1, nodes.length - 1);
    updateWayfindingUI();
    if (wayfindingOrigin && wayfindingDestination) drawNavigation(); else clearNavigation();
  };

  /**
   * Update wayfinding UI (Dynamic Nodes)
   */
  const updateWayfindingUI = () => {
    const nodesContainer = document.getElementById("wayfinding-nodes-container");
    const swapContainer = document.getElementById("wayfinding-swap-container");
    const panelEl = document.getElementById("wayfinding-panel");

    if (nodesContainer && swapContainer) {
      let nodesHtml = '';
      let swapHtml = '';

      const totalNodes = wayfindingStopovers.length + 2;

      // ===================================
      // 1. ORIGIN ROW
      // ===================================
      const originName = wayfindingOrigin ? TranslationManager.getName(wayfindingOrigin) : '';
      const originColor = wayfindingOrigin ? '#1a1a2e' : '#999';
      const originBg = 'white';
      const originBorder = 'border:1px solid transparent; border-bottom:1px solid #e0e4ef;';
      nodesHtml += `<div style="
        display:flex; align-items:center; gap:10px;
        padding:12px 14px; background:${originBg};
        ${originBorder}
        cursor:pointer; transition: background 0.2s;" 
        onclick="window.startSelectingNode('origin')"
        onmouseenter="if(!${isSelectingOrigin}) this.style.background='#fafcff'" onmouseleave="if(!${isSelectingOrigin}) this.style.background='${originBg}'">
        <div style="width:24px;height:24px;border-radius:50%;background:white; display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#214ca6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </div>
        <div style="flex:1;overflow:hidden; display:flex; flex-direction:column; justify-content:center;">
          <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;line-height:1;">${TranslationManager.t('from_label', 'Đi từ')}</div>
          <input type="text" id="wayfinding-input-origin"
            placeholder="${TranslationManager.t('search_departure_placeholder', 'Search Departure')}" 
            value="${originName}" 
            oninput="window.performWayfindingSearch(this.value, 'origin')" 
            onfocus="window.startSelectingNode('origin'); window.performWayfindingSearch(this.value, 'origin');" 
            style="width:100%; border:none; outline:none; background:transparent; font-size:16px; color:${originColor}; padding:0; margin:0; font-weight:500;" 
          />
        </div>
      </div>`;

      // ===================================
      // 2. STOPOVER ROWS
      // ===================================
      wayfindingStopovers.forEach((stop, i) => {
        const stopName = stop ? TranslationManager.getName(stop) : '';
        const stopColor = stop ? '#1a1a2e' : '#999';
        const isSelecting = (isSelectingStopoverIndex === i);
        const stopBg = 'white';
        const stopBorder = 'border:1px solid transparent; border-bottom:1px solid #e0e4ef;';

        nodesHtml += `<div style="
          display:flex; align-items:center; gap:10px;
          padding:12px 14px; background:${stopBg};
          ${stopBorder}
          cursor:pointer; transition: background 0.2s;"
          onclick="window.startSelectingNode('stopover', ${i})"
          onmouseenter="if(!${isSelecting}) this.style.background='#fafcff'" onmouseleave="if(!${isSelecting}) this.style.background='${stopBg}'">
          <div style="width:24px;height:24px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#64748b;font-size:14px;font-weight:bold;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </div>
          <div style="flex:1;overflow:hidden; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;line-height:1;">${TranslationManager.t('stopover_label', 'Điểm dừng')}</div>
            <input type="text" id="wayfinding-input-stopover-${i}"
              placeholder="${TranslationManager.t('stopover_placeholder', 'Chọn điểm dừng')}" 
              value="${stopName}" 
              oninput="window.performWayfindingSearch(this.value, 'stopover', ${i})" 
              onfocus="window.startSelectingNode('stopover', ${i}); window.performWayfindingSearch(this.value, 'stopover', ${i});" 
              style="width:100%; border:none; outline:none; background:transparent; font-size:16px; color:${stopColor}; padding:0; margin:0; font-weight:500;" 
            />
          </div>
          <button onclick="window.removeStopover(event, ${i})" style="background:none;border:none;cursor:pointer;color:#94a3b8;display:flex;align-items:center;justify-content:center;padding:4px;" title="Xóa">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#cbd5e1" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          </button>
        </div>`;
      });

      // ===================================
      // 3. DESTINATION ROW
      // ===================================
      const destName = wayfindingDestination ? TranslationManager.getName(wayfindingDestination) : '';
      const destColor = wayfindingDestination ? '#1a1a2e' : '#999';
      const destBg = 'white';
      const destBorder = 'border:1px solid transparent;';
      nodesHtml += `<div style="
        display:flex; align-items:center; gap:10px;
        padding:12px 14px; background:${destBg};
        ${destBorder}
        border-radius: 0 0 0 8px;
        cursor:pointer; transition: background 0.2s;"
        onclick="window.startSelectingNode('destination')"
        onmouseenter="if(!${isSelectingDestination}) this.style.background='#fafcff'" onmouseleave="if(!${isSelectingDestination}) this.style.background='${destBg}'">
        <div style="width:24px;height:24px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="#f59e0b"></circle></svg>
        </div>
        <div style="flex:1;overflow:hidden; display:flex; flex-direction:column; justify-content:center;">
          <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;line-height:1;">${TranslationManager.t('to_label', 'Đi đến')}</div>
          <input type="text" id="wayfinding-input-destination"
            placeholder="${TranslationManager.t('search_destination_placeholder', 'Search Destination')}" 
            value="${destName}" 
            oninput="window.performWayfindingSearch(this.value, 'destination')" 
            onfocus="window.startSelectingNode('destination'); window.performWayfindingSearch(this.value, 'destination');" 
            style="width:100%; border:none; outline:none; background:transparent; font-size:16px; color:${destColor}; padding:0; margin:0; font-weight:500;" 
          />
        </div>
        <button onclick="window.addStopover(event)" style="background:none;border:none;cursor:pointer;color:#94a3b8;display:flex;align-items:center;justify-content:center;padding:4px;" title="Thêm điểm dừng">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2"><circle cx="12" cy="12" r="10" fill="#f0f4f8"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </button>
      </div>`;

      nodesContainer.innerHTML = nodesHtml;

      // ===================================
      // 4. RESET & SWAP BUTTONS (Right Column)
      // ===================================
      // Reset Button (Circular Refresh Icon at the top)
      swapHtml += `<button id="wayfinding-reset-btn" title="Xóa tất cả" style="
        background:none; border:none;
        cursor:pointer; padding:6px;
        color: #94a3b8; transition:all 0.2s;
        display:flex; align-items:center; justify-content:center;
        margin-bottom: 4px;
      " onmouseenter="this.style.color='#214ca6'; this.style.transform='rotate(45deg)'" onmouseleave="this.style.color='#94a3b8'; this.style.transform='rotate(0)'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      </button>`;

      for (let i = 0; i < totalNodes - 1; i++) {
        swapHtml += `<button onclick="window.swapNodes(${i}, ${i + 1})" title="Hoán đổi" style="
          background:none; border:none;
          cursor:pointer; padding:4px;
          color:#214ca6; transition:all 0.2s;
          display:flex; align-items:center; justify-content:center;
          opacity: 0.6;
        " onmouseenter="this.style.opacity='1'; this.style.color='#f59e0b'" onmouseleave="this.style.opacity='0.6'; this.style.color='#214ca6'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
        </button>`;
      }
      swapContainer.innerHTML = swapHtml;

      // Bind Reset Button - cần dùng ID vì render dynamic
      const resBtn = document.getElementById("wayfinding-reset-btn");
      if (resBtn) {
        resBtn.onclick = (e) => {
          e.preventDefault();
          resetWayfinding();
        };
      }

      const isAnyActive = isSelectingOrigin || isSelectingDestination || isSelectingStopoverIndex >= 0;
      const borderColor = isAnyActive ? '#214ca6' : '#e0e4ef';
      nodesContainer.style.border = `1px solid ${borderColor}`;
    }

    // Toggle Empty State in Directions Tab
    const emptyStateEl = document.getElementById("directions-empty-state");
    const instructionsContainer = document.getElementById("directions-instructions-container");
    const instructionsList = document.getElementById("instructions-list");

    if (emptyStateEl && instructionsContainer) {
      const isAnyActive = isSelectingOrigin || isSelectingDestination || isSelectingStopoverIndex >= 0;
      if (isAnyActive) {
        emptyStateEl.style.display = "none";
        instructionsContainer.style.display = "none";
      } else {
        if (wayfindingOrigin || wayfindingDestination || wayfindingStopovers.length > 0) {
          emptyStateEl.style.display = "none";
          if (instructionsList) instructionsContainer.appendChild(instructionsList);
          instructionsContainer.style.display = "block";
        } else {
          emptyStateEl.style.display = "flex";
          instructionsContainer.style.display = "none";

          // NẾU HIỂN THỊ EMPTY STATE THÌ ẨN PANEL INFORMATION ĐI
          const popupInfo = document.getElementById("sidebar-info-panel");
          if (popupInfo) popupInfo.style.display = "none";
        }
      }
    }

    if (panelEl) {
      const tabDirections = document.getElementById("tab-directions");
      const isDirectionsTabActive = tabDirections && tabDirections.classList.contains("active");

      if (wayfindingOrigin || wayfindingDestination || wayfindingStopovers.length > 0 || isDirectionsTabActive) {
        panelEl.classList.add("active");
      } else {
        panelEl.classList.remove("active");
      }
    }
  };

  (window as any).performWayfindingSearch = (query: string, nodeType: 'origin' | 'destination' | 'stopover', index: number = -1) => {
    const resultsContainer = document.getElementById("wayfinding-search-results");
    if (!resultsContainer) return;

    let isSuggested = false;
    const allMatchedObjects: any[] = [];
    const safeQuery = query ? query.trim() : "";

    const smartMatch = (query: string, target: string): boolean => {
      if (!query || !target) return false;
      const q = query.toLowerCase().trim();
      const t = target.toLowerCase().trim();
      if (t.includes(q)) return true;
      const qTokens = q.split(/[\s\-\,]+/).filter(tk => tk.length > 0);
      const tTokens = t.split(/[\s\-\,]+/).filter(tk => tk.length > 0);
      if (qTokens.length === 0 || tTokens.length === 0) return false;
      const allQueryInTarget = qTokens.every(qt => tTokens.some(tt => tt.includes(qt)));
      if (allQueryInTarget) return true;
      if (tTokens.length >= 2) {
        const allTargetInQuery = tTokens.every(tt => qTokens.some(qt => qt.includes(tt)));
        if (allTargetInQuery) return true;
      }
      return false;
    };

    if (!safeQuery) {
      isSuggested = true;
      // Show default list (Suggested/Frequent)
      allMapObjects.forEach((obj: any) => {
        const localizedName = TranslationManager.getName(obj);
        if (localizedName && localizedName.trim().length > 0 && !localizedName.toLowerCase().includes("khu vực không tên")) {
          allMatchedObjects.push({ name: localizedName, primaryObject: obj });
        }
      });
      // Sort alphabetically for consistency
      allMatchedObjects.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      allMapObjects.forEach((obj: any) => {
        const localizedName = TranslationManager.getName(obj);
        if (localizedName && smartMatch(safeQuery, localizedName)) {
          allMatchedObjects.push({ name: localizedName, primaryObject: obj });
        }
      });
    }

    // Lọc trùng lặp name để list suggested nhìn sạch hơn
    const filteredResults = [];
    const seenNames = new Set();
    for (const item of allMatchedObjects) {
      if (!seenNames.has(item.name)) {
        seenNames.add(item.name);
        filteredResults.push(item);
      }
      if (filteredResults.length >= 15) break; // Limit to 15 items maximum
    }

    const uniqueResults = filteredResults;

    if (uniqueResults.length === 0) {
      resultsContainer.innerHTML = `<div style="padding: 15px; color: #999; text-align: center; font-size:13px;">${TranslationManager.t('no_results_found', 'Không tìm thấy kết quả')}</div>`;
      resultsContainer.style.display = "block";
      return;
    }

    resultsContainer.innerHTML = "";

    // Header for suggested
    if (isSuggested) {
      const header = document.createElement("div");
      header.style.cssText = "padding: 20px 15px 12px; font-size: 16px; font-weight: 700; color: #1a1a2e; background: white;";
      header.innerText = TranslationManager.t('frequent_locations', 'Frequent Locations');
      resultsContainer.appendChild(header);
    }

    uniqueResults.forEach((result) => {
      const item = document.createElement("div");
      item.style.cssText = "display: flex; align-items: center; padding: 14px 15px; cursor: pointer; background: white; transition: all 0.2s ease;";
      item.onmouseenter = () => item.style.backgroundColor = "#f0f4ff";
      item.onmouseleave = () => item.style.backgroundColor = "white";

      const cleanName = result.name.replace(/room|door|gate/gi, '').trim();
      const floorObj = result.primaryObject.floor;

      item.innerHTML = `
        <div style="flex: 1; overflow: hidden;">
          <div style="font-size: 15px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;">${cleanName}</div>
        </div>
      `;

      item.addEventListener("click", () => {
        resultsContainer.style.display = "none";
        isSelectingOrigin = false;
        isSelectingDestination = false;
        isSelectingStopoverIndex = -1;

        if (nodeType === 'origin') {
          wayfindingOrigin = result.primaryObject;
        } else if (nodeType === 'destination') {
          wayfindingDestination = result.primaryObject;
        } else if (nodeType === 'stopover' && index >= 0) {
          wayfindingStopovers[index] = result.primaryObject;
        }

        updateWayfindingUI();
        if (wayfindingOrigin && wayfindingDestination) drawNavigation();
      });

      resultsContainer.appendChild(item);
    });

    resultsContainer.style.display = "block";
  };

  /**
   * Swap origin and destination
   */
  const swapWayfindingPoints = () => {
    const temp = wayfindingOrigin;
    wayfindingOrigin = wayfindingDestination;
    wayfindingDestination = temp;
    updateWayfindingUI();
    updateHighlights();
    if (wayfindingOrigin && wayfindingDestination) {
      drawNavigation();
    }
  };

  // Helper: Focus camera on an object with a specific zoom level
  const focusOnObject = (obj: any, zoomLevel: number) => {
    try {
      if (!obj) return;
      const cameraAny = mapView.Camera as any;

      // Set min/max to allow the target zoom
      if (cameraAny.setMinZoomLevel) cameraAny.setMinZoomLevel(Math.min(10.0, zoomLevel));
      if (cameraAny.setMaxZoomLevel) cameraAny.setMaxZoomLevel(Math.max(32.0, zoomLevel));

      (mapView.Camera as any).focusOn(obj, {
        duration: 1000,
        pitch: mapView.Camera.pitch,
        bearing: mapView.Camera.bearing,
        minZoomLevel: zoomLevel,
        maxZoomLevel: zoomLevel,
        padding: { top: 0, bottom: 0, left: 380, right: 0 } // Offset for sidebar (380px)
      } as any);
      console.log(`🎬 Camera Focus: ${obj.name || obj.id} at zoom ${zoomLevel}`);
    } catch (e) {
      console.warn("Camera focus error:", e);
    }
  };



  /**
   * Update Information Panel
   */
  updateInfo = function (space: any) {
    if (!space) return;
    syncURL(false); // Update URL when info opens

    // Ẩn panel danh mục và search actions
    const categorySection = document.getElementById("category-section");
    // const searchSection = document.getElementById("search-section"); // Keep search visible
    const sidebarActions = document.querySelector(".sidebar-actions") as HTMLElement;

    if (categorySection) categorySection.style.display = "none";
    if (sidebarActions) sidebarActions.style.display = "none";

    const popup = document.getElementById("sidebar-info-panel") as HTMLDivElement;
    const titleElement = document.getElementById("area-title") as HTMLHeadingElement;
    const descriptionElement = document.getElementById("area-description") as HTMLParagraphElement;
    const imgElement = document.getElementById("area-image") as HTMLImageElement;
    const directionsBtn = document.getElementById("directions-btn") as HTMLButtonElement;

    // Show Info Panel
    if (popup) {
      popup.style.display = "flex";
      // Ensure vertical layout as per fix
      popup.style.flexDirection = "column";

      // ĐẢM BẢO KHÔNG HIỂN THỊ CÙNG LÚC VỚI EMPTY STATE CỦA ĐIỀU HƯỚNG
      const emptyStateEl = document.getElementById("directions-empty-state");
      if (emptyStateEl) emptyStateEl.style.display = "none";
    }

    // Build display name
    let displayName = TranslationManager.getName(space);
    if (!displayName || displayName === space.id) {
      if (space.type?.toLowerCase().includes('elevator')) {
        displayName = TranslationManager.t('elevator', 'Thang máy');
      } else if (space.type?.toLowerCase().includes('stair')) {
        displayName = TranslationManager.t('stairway', 'Cầu thang');
      } else {
        displayName = TranslationManager.t('unnamed_area', "Khu vực không tên");
      }
    }

    if (titleElement) {
      titleElement.textContent = displayName;
    }

    const btnEditColor = document.getElementById("btn-edit-current-area-color");
    if (btnEditColor) {
      if (space && space.id && displayName && !displayName.toLowerCase().includes("khu vực không tên")) {
        btnEditColor.style.display = "block";
        btnEditColor.onclick = () => {
          if (typeof (window as any).openAreaColorModalForSingleSpace === 'function') {
            (window as any).openAreaColorModalForSingleSpace(space);
          }
        };
      } else {
        btnEditColor.style.display = "none";
      }
    }

    // AUTO-FILL Search Input (Restored from Backup)
    const searchInput = document.getElementById("location-search") as HTMLInputElement;
    const clearBtn = document.getElementById("search-clear-btn");
    if (searchInput) {
      searchInput.value = displayName;
      // Show clear button when auto-filled
      if (clearBtn) clearBtn.style.display = "block";
    }

    // Lookup Rich Data (Image / Desc) from TranslationManager
    const locData = TranslationManager.getLocationContent(space.id, space);
    console.log('Clicked Space:', space);

    // Build description - Prioritize Database (Manual Overrides/Translations)
    // Truyền space object để hỗ trợ cross-reference tra cứu bản dịch
    let descriptionText = TranslationManager.getLocationDescription(space.id, space);

    // Nếu là Connection, thêm "Tầng liên kết" với format xuống hàng (đã dịch đa ngôn ngữ)
    if (space && Array.isArray((space as any).floors) && (space as any).floors.length > 0) {
      const floorNames = (space as any).floors.map((f: any) => {
        const fId = f?.mappedinId || f?.id || f?.code || '';
        const rawName = f?.name || f?.id || '';
        return TranslationManager.getFloorName(fId, rawName);
      }).filter(Boolean);
      const linkedLabel = TranslationManager.t('linked_floors', 'Tầng liên kết');
      const linkedFloorsText = `${linkedLabel}:\n` + floorNames.map((n: string) => `• ${n}`).join("\n");
      if (descriptionText) {
        descriptionText += "\n\n" + linkedFloorsText;
      } else {
        descriptionText = linkedFloorsText;
      }
    }

    // Clean up 'NULL' string
    if (descriptionText === 'NULL' || descriptionText === 'null') {
      descriptionText = "";
    }

    if (descriptionElement) {
      if (descriptionText && descriptionText.trim().length > 0) {
        descriptionElement.textContent = descriptionText;
        descriptionElement.classList.remove('no-desc'); // Optional styling
      } else {
        // Localized Fallback since 'no_desc' key might be missing
        const noDescMap: any = {
          vi: "Không có mô tả.",
          vn: "Không có mô tả.",
          en: "No description.",
          zh: "暂无描述。",
          ja: "説明なし。",
          ko: "설명 없음."
        };
        const lang = (TranslationManager.currentLang || 'vn').toLowerCase();
        descriptionElement.textContent = noDescMap[lang] || noDescMap['en'];
        descriptionElement.style.color = "#999";
        descriptionElement.style.fontStyle = "italic";
      }
      descriptionElement.style.whiteSpace = "pre-line";
    }

    // Image handling - SMART LATEST SOURCE WINS
    // locData comes from TranslationManager which now includes uiImage and editorImage
    let imageUrl = null;

    if (!imageUrl) {
      // A. Identify current SDK image
      let sdkUrl = null;
      if (space.images && Array.isArray(space.images) && space.images.length > 0) {
        const first = space.images[0];
        sdkUrl = typeof first === 'string' ? first : (first.src || first.url);
      } else if (space.image) {
        sdkUrl = typeof space.image === 'string' ? space.image : (space.image.src || space.image.url);
      }

      // B. Identify DB states
      const dbManualUrl = (locData as any)?.uiImage;

      // Kiểm tra xem dbManualUrl có phải là URL user thực sự upload không
      const isRealUserUpload = dbManualUrl &&
        dbManualUrl !== 'NULL' &&
        dbManualUrl !== 'null' &&
        dbManualUrl.trim().length > 0 &&
        !dbManualUrl.includes('cdn.mappedin.com');

      if (isRealUserUpload) {
        imageUrl = dbManualUrl;
      } else if (sdkUrl) {
        imageUrl = sdkUrl;
      } else {
        const dbImageUrl = (locData as any)?.image;
        if (dbImageUrl && dbImageUrl !== 'NULL' && !dbImageUrl.includes('cdn.mappedin.com')) {
          imageUrl = dbImageUrl;
        }
      }
    }

    // Clean up potential 'NULL' string from database
    if (imageUrl === 'NULL' || imageUrl === 'null') {
      imageUrl = "";
    }


    if (imgElement) {
      if (imageUrl && imageUrl.trim().length > 0) {
        imgElement.src = imageUrl;
        imgElement.style.display = "block";
        imgElement.onerror = () => { imgElement.style.display = "none"; };
      } else {
        imgElement.style.display = "none";
        imgElement.src = "";
      }
    }

    // Routing Buttons logic
    const routingActions = document.getElementById("routing-actions");
    const btnStart = document.getElementById("btn-route-start");
    const btnVia = document.getElementById("btn-route-via");
    const btnEnd = document.getElementById("btn-route-end");

    if (routingActions && btnStart && btnVia && btnEnd) {
      const nameAny = (displayName || "").toLowerCase();
      const isSpecialArea = nameAny.includes("công cộng") || nameAny.includes("public") ||
        nameAny.includes("hạn chế") || nameAny.includes("nhân viên") ||
        nameAny.includes("restricted") || nameAny.includes("staff") ||
        nameAny.includes("禁区") || nameAny.includes("制限") || nameAny.includes("禁") ||
        nameAny.includes("スタッフ") || nameAny.includes("직원") ||
        nameAny.includes("立ち入り禁止") || nameAny.includes("公共") || nameAny.includes("공공");

      if (isSpecialArea) {
        routingActions.style.display = "none";
      } else {
        routingActions.style.display = "flex";

        // Update labels based on current language
        btnStart.textContent = TranslationManager.t('route_start', 'Start');
        btnVia.textContent = TranslationManager.t('route_via', 'Via');
        btnEnd.textContent = TranslationManager.t('route_end', 'End');

        const handleRoutingAction = () => {
          const tabDirections = document.getElementById("tab-directions");
          if (tabDirections) (tabDirections as any).click();

          updateWayfindingUI();

          if (wayfindingOrigin && wayfindingDestination) {
            drawNavigation();
          } else {
            updateHighlights();
            focusOnObject(space, 19.0);

            const statusEl = document.getElementById("wayfinding-status");
            if (statusEl) {
              statusEl.textContent = "";
            }
          }
        };

        btnStart.onclick = () => {
          wayfindingOrigin = space;
          isSelectingOrigin = false;
          if (!wayfindingDestination) isSelectingDestination = true;
          handleRoutingAction();
        };

        btnVia.onclick = () => {
          if (wayfindingStopovers.length >= 5) {
            alert("Tối đa 5 điểm dừng!");
            return;
          }
          wayfindingStopovers.push(space);
          handleRoutingAction();
        };

        btnEnd.onclick = () => {
          wayfindingDestination = space;
          isSelectingDestination = false;
          if (!wayfindingOrigin) isSelectingOrigin = true;
          handleRoutingAction();
        };
      }
    }
  };

  /**
   * Hide Information Panel
   */
  hideInfo = () => {
    const popup = document.getElementById("sidebar-info-panel") as HTMLDivElement;
    const categorySection = document.getElementById("category-section") as HTMLDivElement;
    const sidebarActions = document.querySelector(".sidebar-actions") as HTMLElement;

    if (popup) {
      popup.style.display = "none";
    }
    // Restore Categories
    if (categorySection) {
      categorySection.style.display = "block";
    }
    // Restore Sidebar Actions
    if (sidebarActions) {
      sidebarActions.style.display = "flex";
    }

    // Remove highlight
    if (selectedSpace) { // Changed from clickedPolygon to selectedSpace to match existing logic
      resetObjectHighlight(selectedSpace);
      selectedSpace = null;
    }

    // NEW: Clear search results and input when closing info
    const searchInput = document.getElementById("location-search") as HTMLInputElement;
    const searchResults = document.getElementById("search-results") as HTMLDivElement;
    const searchClearBtn = document.getElementById("search-clear-btn") as HTMLButtonElement;

    if (searchInput) {
      searchInput.value = "";
    }
    if (searchClearBtn) {
      searchClearBtn.style.display = "none";
    }
    if (searchResults) {
      searchResults.style.display = "none";
      searchResults.innerHTML = "";
    }

    // NEW: Full reset of wayfinding state when closing info (X button)
    // Coi như tắt hết về trạng thái ban đầu (Initial State)
    if ((isSelectingOrigin || isSelectingDestination || wayfindingOrigin || wayfindingDestination) && typeof resetWayfinding === 'function') {
      resetWayfinding();
    }
    syncURL(true); // Update URL to root/map state
  };

  // ============================================
  // BLUE DOT NAVIGATION ANIMATION
  // ============================================
  (window as any).toggleAnimation = () => {
    if (isAnimating) {
      if (isPaused) resumeAnimation(); else pauseAnimation();
    } else {
      startNavigationAnimation();
    }
  };

  const startNavigationAnimation = async () => {
    if (!wayfindingDirections || isAnimating) return;
    isAnimating = true;
    isPaused = false;

    const coords = wayfindingDirections.coordinates;
    const { distances, totalDistance } = buildDistanceTable(coords);

    const previewBtn = document.getElementById("wayfinding-preview-btn");
    const previewBtnMain = document.getElementById("wayfinding-preview-btn-main");
    if (previewBtn) previewBtn.textContent = TranslationManager.t('pause_preview', "Tạm dừng");

    const marker = await mapView.Markers.add(coords[0], `
      <div style="width:20px;height:20px;background:#214ca6;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(0,0,0,0.3);"></div>
    `);

    animationState = { marker, coords, distances, totalDistance, currentDist: 0 };

    blueDotAnimationInterval = setInterval(() => {
      if (isPaused) return;

      animationState.currentDist += (BLUE_DOT_SPEED_MPS * ((window as any).speedMultiplier || 1.0) * (FRAME_INTERVAL / 1000));

      if (animationState.currentDist >= totalDistance) {
        stopNavigationAnimation();
        return;
      }

      const newCoord = interpolateByDistance(coords, distances, animationState.currentDist);
      if (newCoord) {
        (mapView.Markers as any).animateTo(marker, newCoord, { duration: FRAME_INTERVAL, easing: 'linear' });

        // AUTO-FOLLOW CAMERA
        mapView.Camera.set({ center: newCoord });

        // AUTO-SWITCH FLOOR IF NEEDED
        if (newCoord.floorId && newCoord.floorId !== mapView.currentFloor.id) {
          mapView.setFloor(newCoord.floorId);
        }

        // SYNC SIDEBAR STEP HIGHLIGHTING
        // Find current instruction index based on distance
        let currentStepIndex = 0;
        let cumulativeDist = 0;
        const insts = (window as any).simplifiedInstructionsGlobal || [];
        for (let i = 0; i < insts.length; i++) {
          cumulativeDist += (insts[i] as any).distance || 0;
          if (animationState.currentDist <= cumulativeDist) {
            currentStepIndex = i;
            break;
          }
        }

        if (currentStepIndex !== currentSelectedStepIndex) {
          currentSelectedStepIndex = currentStepIndex;
          const steps = document.querySelectorAll('.instruction-step');
          steps.forEach((s, idx) => {
            if (idx === currentStepIndex) {
              (s as HTMLElement).style.background = '#f0f4ff';
              (s as HTMLElement).style.borderLeft = '4px solid #214ca6';
              s.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
              (s as HTMLElement).style.background = 'white';
              (s as HTMLElement).style.borderLeft = '4px solid transparent';
            }
          });
        }
      }
    }, FRAME_INTERVAL);
  };

  const stopNavigationAnimation = () => {
    clearInterval(blueDotAnimationInterval);
    if (animationState && animationState.marker) {
      mapView.Markers.remove(animationState.marker);
    }
    isAnimating = false;
    isPaused = false;
    animationState = null;
    const previewBtn = document.getElementById("wayfinding-preview-btn");
    if (previewBtn) previewBtn.textContent = TranslationManager.t('start_preview', "Bắt đầu");
  };

  const pauseAnimation = () => { isPaused = true; };
  const resumeAnimation = () => { isPaused = false; };

  (window as any).setAnimationSpeed = (speed: number) => {
    const oldMultiplier = (window as any).speedMultiplier || 1.0;
    (window as any).speedMultiplier = speed;

    // Nếu đang chạy animation, cập nhật duration và startTime tức thì để không bị giật
    if (isAnimating && animationState && !isPaused) {
      const currentMultiplier = speed * PREVIEW_SPEED_BOOST;
      const baseDurationMs = (routeTotalSecondsGlobal > 0 ? routeTotalSecondsGlobal : (animationState.totalDistance / BLUE_DOT_SPEED_MPS)) * 1000;
      const newTotalDurationMs = baseDurationMs / currentMultiplier;

      // Tính toán lại startTime để duy trì vị trí hiện tại (traveled distance)
      const traveled = currentAnimationDistance;
      const totalDist = animationState.totalDistance;
      if (totalDist > 0) {
        const progress = traveled / totalDist;
        const newElapsed = progress * newTotalDurationMs;
        // Adjust startTime so: performance.now() - startTime - animationPauseTime = newElapsed
        animationState.startTime = performance.now() - newElapsed - animationPauseTime;
        animationState.totalDurationMs = newTotalDurationMs;
        totalAnimationDuration = newTotalDurationMs;
      }
    }
  };

  // Exposed for external access
  (window as any).updateInfo = updateInfo;
  (window as any).hideInfo = hideInfo;
  (window as any).swapWayfindingPoints = swapWayfindingPoints;

  // Language Change Listener
  window.addEventListener('language-change', () => {
    updateWayfindingUI();
    if (wayfindingOrigin && wayfindingDestination) {
      drawNavigation();
    }
    if (selectedSpace) updateInfo(selectedSpace);
  });

  updateWayfindingUI();

  // ============================================
  // 13. CLICK HANDLER
  // ============================================

  /**
   * Xử lý click trên map:
   * - Tìm object được click (từ event hoặc coordinate)
   * - Hiển thị popup với thông tin
   * - Highlight object bằng màu xanh lá
   */
  mapView.on("click", async (event: any) => {
    // Bỏ qua click vào popup
    const target = event.originalEvent?.target;
    if (target && (target.closest("#info-popup") || target.closest(".close-btn"))) {
      return;
    }

    // ============================================
    // -1. HANDLE MULTI-MODEL PLACEMENT (PRIORITY)
    // ============================================
    if (isMultiPlacingMode && multiPlaceSourceModels.length > 0 && event.coordinate) {
      console.log(`🎯 Multi-Place Mode: ${multiPlaceMode} (${multiPlaceSourceModels.length} models)`);
      try {
        const { latitude, longitude } = event.coordinate;
        const targetFloor = mapView.currentFloor;
        let placedCount = 0;

        for (const srcModel of multiPlaceSourceModels) {
          const destLat = latitude + srcModel.offsetLat;
          const destLon = longitude + srcModel.offsetLon;
          const coord = mapView.createCoordinate(destLat, destLon, targetFloor);

          let uuid: string;
          let url = srcModel.meta.url;

          // Resolve URL
          if (url && url.startsWith("./")) {
            url = url.replace("./", `${SERVER_URL}/`);
          } else if (url && !url.startsWith("http")) {
            url = `${SERVER_URL}/${url}`;
          }

          if (multiPlaceMode === 'copy') {
            const filename = (url || "model").split('/').pop() || 'model';
            uuid = generateUUID(filename);
          } else {
            // Move: reuse UUID, remove old instance
            uuid = srcModel.meta.uuid;
            const oldInstance = MODEL_INSTANCE_REGISTRY.get(uuid);
            if (oldInstance) {
              if ((oldInstance as any).marker) mapView.Markers.remove((oldInstance as any).marker);
              try { mapView.Models.remove(oldInstance); } catch (e) { }
              MODEL_ID_REGISTRY.delete(oldInstance.id);
            }
          }

          const model = await mapView.Models.add(coord, url, {
            interactive: true,
            scale: srcModel.meta.scale,
            rotation: srcModel.meta.rotation,
            verticalOffset: srcModel.meta.elevation || 0
          });

          (model as any).url = url;
          (model as any).uuid = uuid;
          (model as any).originalCoordinate = coord;

          const newMeta: ModelMetadata = {
            url: srcModel.meta.url, // keep original URL for DB
            uuid,
            name: srcModel.meta.name,
            desc: srcModel.meta.desc,
            rotation: srcModel.meta.rotation,
            scale: srcModel.meta.scale,
            originalCoordinate: coord,
            floorId: targetFloor.id,
            thumb: srcModel.meta.thumb,
            displayWebsite: srcModel.meta.displayWebsite,
            elevation: srcModel.meta.elevation || 0
          };

          MODEL_ID_REGISTRY.set(model.id, newMeta);
          MODEL_INSTANCE_REGISTRY.set(uuid, model);
          saveModelToAPI(newMeta);
          placedCount++;
        }

        console.log(`✅ Multi-place: ${placedCount} models placed successfully`);
        cleanupMultiPlaceMode();
        return;
      } catch (e) {
        console.error("❌ Multi-Placement Error:", e);
        cleanupMultiPlaceMode();
        return;
      }
    }

    // ============================================
    // 0. HANDLE 3D MODEL PLACEMENT (PRIORITY)
    // ============================================
    if (placingModelConfig && event.coordinate) {
      console.log(`🎯 Placement Mode: ${placingMode}`);
      try {
        const { latitude, longitude } = event.coordinate;
        const targetFloor = mapView.currentFloor;
        const coord = mapView.createCoordinate(latitude, longitude, targetFloor);
        let uuid: string;
        let scale: any;
        let rotation: any;
        let name: string;
        let url: string;

        if (placingMode === 'copy' && sourceModelData) {
          const filename = (placingModelConfig.file || placingModelConfig.url || "model").split('/').pop() || 'model';
          uuid = generateUUID(filename);
          scale = sourceModelData.scale;
          rotation = sourceModelData.rotation;
          name = sourceModelData.name;
          url = sourceModelData.url;
          // FIX: Resolve URL immediately for instant display
          if (url && url.startsWith("./")) {
            url = url.replace("./", `${SERVER_URL}/`);
          } else if (url && !url.startsWith("http")) {
            url = `${SERVER_URL}/${url}`;
          }

        } else if (placingMode === 'move' && sourceModelData) {
          uuid = sourceModelData.uuid;
          scale = sourceModelData.scale;
          rotation = sourceModelData.rotation;
          name = sourceModelData.name;
          url = sourceModelData.url;
          // FIX: Resolve URL immediately for instant display
          if (url && url.startsWith("./")) {
            url = url.replace("./", `${SERVER_URL}/`);
          } else if (url && !url.startsWith("http")) {
            url = `${SERVER_URL}/${url}`;
          }

          const oldInstance = MODEL_INSTANCE_REGISTRY.get(uuid);
          if (oldInstance) {
            if ((oldInstance as any).marker) mapView.Markers.remove((oldInstance as any).marker);
            mapView.Models.remove(oldInstance);
            MODEL_ID_REGISTRY.delete(oldInstance.id);
          }

        } else {
          uuid = generateUUID(placingModelConfig.file || "model");
          scale = placingModelConfig.scale;
          rotation = placingModelConfig.rotation;
          name = placingModelConfig.name;
          url = (placingModelConfig.file && !placingModelConfig.file.startsWith('http'))
            ? `${SERVER_URL}/Model3D/${placingModelConfig.file}`
            : (placingModelConfig.file || placingModelConfig.url);
        }

        if (placingPreviewModel) {
          mapView.Models.remove(placingPreviewModel);
          placingPreviewModel = null;
        }

        const elevation = (placingMode === 'new') ? (placingModelConfig.elevation || 0) : (sourceModelData?.elevation || 0);

        const model = await mapView.Models.add(coord, url, {
          interactive: true,
          scale: scale,
          rotation: rotation,
          verticalOffset: elevation
        });

        console.log("✅ Model added immediately to map view");


        (model as any).url = url;
        (model as any).uuid = uuid;
        (model as any).originalCoordinate = coord;

        const inpPublic = document.getElementById("inp-model-public") as HTMLInputElement;
        let finalDesc = (placingMode === 'new') ? "Nhập thông tin mô tả model 3D tại đây" : sourceModelData?.desc || "";
        if (inpPublic?.checked) {
          if (!finalDesc.includes("[PUBLIC]")) finalDesc = (finalDesc + " [PUBLIC]").trim();
        } else {
          finalDesc = finalDesc.replace("[PUBLIC]", "").trim();
        }

        const newMeta: ModelMetadata = {
          url, uuid, name, desc: finalDesc, rotation, scale, originalCoordinate: coord, floorId: targetFloor.id,
          thumb: (placingMode === 'new') ? placingModelConfig.thumb : sourceModelData?.thumb,
          displayWebsite: inpPublic?.checked ? 1 : 0,
          elevation: elevation
        };


        MODEL_ID_REGISTRY.set(model.id, newMeta);
        MODEL_INSTANCE_REGISTRY.set(uuid, model);
        saveModelToAPI(newMeta);
        cleanupPlacementMode();
        return; // Success, stop click processing
      } catch (e) {
        console.error("❌ Placement Error:", e);
        cleanupPlacementMode();
        return;
      }
    }

    // ============================================
    // 1. SELECT EXISTING 3D MODEL (with Shift+Click multi-select)
    // ============================================
    if (event.models && event.models.length > 0) {
      const clickedModel = event.models[0];
      console.log("🎯 Clicked Model ID:", clickedModel.id);

      const meta = MODEL_ID_REGISTRY.get(clickedModel.id);
      const isShiftHeld = event.originalEvent?.shiftKey === true || isShiftPressed;

      if (isShiftHeld && meta) {
        // SHIFT+CLICK: Toggle multi-selection
        toggleMultiSelectModel(clickedModel, meta);
        // Don't open single-model controls panel in multi-select mode
        if (multiSelectedModels.size > 0) {
          controlsPanel?.classList.add("hidden");
          activeModelInstance = null;
        }
        return;
      }

      // Normal click (no shift): clear multi-select if any, select single model
      if (multiSelectedModels.size > 0) {
        clearMultiSelect();
      }

      activeModelInstance = clickedModel;

      // Hide space info box if open to avoid distraction
      if (typeof hideInfo === 'function') hideInfo();

      if (meta) {
        syncUIFromModel(meta);
        controlsPanel?.classList.remove("hidden");
      }
      return; // Stop processing, we selected a model
    }

    // 2. CLOSE PANEL IF CLICKING EMPTY SPACE
    if (activeModelInstance) {
      activeModelInstance = null;
      controlsPanel?.classList.add("hidden");
      // Continue processing to allow selecting areas
    }
    // Also clear multi-select when clicking empty space (unless in multi-place mode)
    if (multiSelectedModels.size > 0 && !isMultiPlacingMode) {
      clearMultiSelect();
    }

    let clickedObject: any = null;

    // Kiểm tra markers (connection markers hoặc object markers) - ƯU TIÊN 1
    if (event.markers && event.markers.length > 0) {
      const m = event.markers[0];
      const mid = (m as any)?.id;

      // Thử tìm từ markerIdToConnection
      if (mid && markerIdToConnection.has(mid)) {
        const connectionObj = markerIdToConnection.get(mid);

        // NEW: Nếu đang có navigation active, click vào connection marker sẽ CHUYỂN TẦNG
        // thay vì chọn connection làm điểm đến
        if (wayfindingDirections && connectionObj && connectionObj.coordinates && connectionObj.coordinates.length > 0) {
          const currentFloorId = mapView.currentFloor?.id;
          // Tìm tầng khác trong connection (tầng đến)
          const otherFloorCoord = connectionObj.coordinates.find((coord: any) => coord.floorId !== currentFloorId);
          if (otherFloorCoord && otherFloorCoord.floorId) {
            // Chuyển tầng thay vì chọn connection
            console.log(`🔄 Navigation active: Switching floor to ${otherFloorCoord.floorId} via connection click`);
            mapView.setFloor(otherFloorCoord.floorId);
            return; // Không tiếp tục xử lý click
          }
        }

        clickedObject = connectionObj;
      }
      // Thử tìm từ markerIdToObject
      else if (mid && markerIdToObject.has(mid)) {
        clickedObject = markerIdToObject.get(mid);
      }
      // Nếu marker được tạo từ object, thử tìm object từ marker.target, marker.object, hoặc marker.space
      else {
        const targetObj = (m as any)?.target || (m as any)?.object || (m as any)?.space || (m as any)?.location;
        if (targetObj) {
          // Resolve object đầy đủ
          const resolvedObj = resolveObjectById(targetObj?.id) || targetObj;
          if (resolvedObj && resolvedObj.name) {
            clickedObject = resolvedObj;
          }
        }

        // Nếu vẫn chưa tìm thấy, thử tìm object từ marker bằng coordinate
        if (!clickedObject && m.coordinate) {
          const markerObj = allMapObjects.find((obj: any) => {
            // Thử match bằng coordinate
            if (obj.coordinate) {
              const latDiff = Math.abs((m.coordinate.latitude || 0) - (obj.coordinate.latitude || 0));
              const lngDiff = Math.abs((m.coordinate.longitude || 0) - (obj.coordinate.longitude || 0));
              return latDiff < 0.0001 && lngDiff < 0.0001;
            }
            // Thử match bằng anchor
            if (obj.anchor) {
              const latDiff = Math.abs((m.coordinate.latitude || 0) - (obj.anchor.latitude || 0));
              const lngDiff = Math.abs((obj.anchor.longitude || 0) - (obj.anchor.longitude || 0));
              return latDiff < 0.0001 && lngDiff < 0.0001;
            }
            return false;
          });
          if (markerObj) {
            clickedObject = markerObj;
          }
        }

        // Nếu vẫn chưa tìm thấy, log để debug
        if (!clickedObject) {
          console.warn("Marker clicked but object not found:", m, {
            mid,
            hasConnection: mid && markerIdToConnection.has(mid),
            hasObject: mid && markerIdToObject.has(mid),
            hasTarget: !!(m as any)?.target,
            hasObjectProp: !!(m as any)?.object,
            coordinate: m.coordinate
          });
        }
      }
    }
    // Kiểm tra các loại objects trong event (chỉ lấy objects có name)
    else if (event.spaces && event.spaces.length > 0) {
      const space = event.spaces[0];
      // Chỉ lấy space có name
      if (space && space.name) {
        clickedObject = space;
      }
    } else if (event.locations && event.locations.length > 0) {
      const location = event.locations[0];
      // Chỉ lấy location có name
      if (location && location.name) {
        clickedObject = allMapObjects.find((obj: any) => {
          if (obj.location) {
            return obj.location.id === location.id || obj.location === location;
          }
          return obj.id === location.id;
        });
        if (!clickedObject) {
          clickedObject = location;
        }
      }
    } else if (event.doors && event.doors.length > 0) {
      const door = event.doors[0];
      if (door && door.name) {
        clickedObject = door;
      }
    } else if (event.points && event.points.length > 0) {
      const point = event.points[0];
      if (point && point.name) {
        clickedObject = point;
      }
    } else if (event.elevators && event.elevators.length > 0) {
      const elevator = event.elevators[0];
      if (elevator && elevator.name) {
        clickedObject = elevator;
      }
    } else if (event.stairways && event.stairways.length > 0) {
      const stairway = event.stairways[0];
      if (stairway && stairway.name) {
        clickedObject = stairway;
      }
    } else if (event.customObjects && event.customObjects.length > 0) {
      const customObj = event.customObjects[0];
      if (customObj && customObj.name) {
        clickedObject = customObj;
      }
    } else if (event.objects && event.objects.length > 0) {
      const obj = event.objects[0];
      if (obj && obj.name) {
        clickedObject = obj;
      }
    } else if (event.areas && event.areas.length > 0) {
      const area = event.areas[0];
      if (area && area.name) {
        clickedObject = area;
      }
    } else if (event.shapes && event.shapes.length > 0) {
      const shape = event.shapes[0];
      if (shape && shape.name) {
        clickedObject = shape;
      }
    }
    // Nếu không tìm thấy trong event, tìm bằng coordinate
    else {
      const currentFloorId = mapView.currentFloor?.id;
      const objectsOnCurrentFloor = allMapObjects.filter((obj: any) => {
        // Chỉ lấy objects có name
        if (!obj.name) return false;

        if (obj.floorId) {
          return obj.floorId === currentFloorId;
        }
        if (obj.floor) {
          return obj.floor.id === currentFloorId || obj.floor === currentFloorId;
        }
        return true;
      });

      let foundObject: any = null;

      // Thử dùng mapView.Objects.getAt nếu có
      try {
        const mapViewAny = mapView as any;
        if (mapViewAny.Objects && typeof mapViewAny.Objects.getAt === 'function') {
          const objectsAtCoord = mapViewAny.Objects.getAt(event.coordinate);
          if (objectsAtCoord && objectsAtCoord.length > 0) {
            foundObject = objectsAtCoord[0];
          }
        }
      } catch (e) { }

      // Nếu chưa tìm thấy, kiểm tra từng object
      if (!foundObject) {
        for (const obj of objectsOnCurrentFloor) {
          try {
            // Kiểm tra POI bằng coordinate match
            if (obj.coordinate && typeof obj.coordinate === 'object') {
              const poiCoord = obj.coordinate;
              if (poiCoord.latitude !== undefined && poiCoord.longitude !== undefined &&
                event.coordinate.latitude !== undefined && event.coordinate.longitude !== undefined) {
                const latDiff = Math.abs(poiCoord.latitude - event.coordinate.latitude);
                const lngDiff = Math.abs(poiCoord.longitude - event.coordinate.longitude);
                if (latDiff < 0.0001 && lngDiff < 0.0001) {
                  foundObject = obj;
                  break;
                }
              }
            }

            // Kiểm tra Areas bằng polygon
            if (!foundObject && obj.geoJSON && obj.geoJSON.geometry) {
              const geometry = obj.geoJSON.geometry;
              if (geometry.type === 'Polygon' && geometry.coordinates) {
                try {
                  const polygon = geometry.coordinates[0];
                  if (isPointInPolygon([event.coordinate.longitude, event.coordinate.latitude], polygon)) {
                    foundObject = obj;
                    break;
                  }
                } catch (e) { }
              }
            }

            // Kiểm tra bằng anchor/position
            if (!foundObject && obj.anchor) {
              const anchor = obj.anchor;
              if (anchor.latitude !== undefined && anchor.longitude !== undefined &&
                event.coordinate.latitude !== undefined && event.coordinate.longitude !== undefined) {
                const latDiff = Math.abs(anchor.latitude - event.coordinate.latitude);
                const lngDiff = Math.abs(anchor.longitude - event.coordinate.longitude);
                if (latDiff < 0.0001 && lngDiff < 0.0001) {
                  foundObject = obj;
                  break;
                }
              }
            }

            if (!foundObject && obj.position) {
              const pos = obj.position;
              if (pos.latitude !== undefined && pos.longitude !== undefined &&
                event.coordinate.latitude !== undefined && event.coordinate.longitude !== undefined) {
                const latDiff = Math.abs(pos.latitude - event.coordinate.latitude);
                const lngDiff = Math.abs(pos.longitude - event.coordinate.longitude);
                if (latDiff < 0.0001 && lngDiff < 0.0001) {
                  foundObject = obj;
                  break;
                }
              }
            }

            // Kiểm tra bằng polygons.contains
            if (!foundObject && obj.polygons && Array.isArray(obj.polygons) && obj.polygons.length > 0) {
              for (const polygon of obj.polygons) {
                if (polygon.contains && typeof polygon.contains === 'function') {
                  try {
                    if (polygon.contains(event.coordinate)) {
                      foundObject = obj;
                      break;
                    }
                  } catch (e) { }
                }
              }
              if (foundObject) break;
            }

            // Kiểm tra bằng paths.contains
            if (!foundObject && obj.paths && Array.isArray(obj.paths) && obj.paths.length > 0) {
              for (const path of obj.paths) {
                if (path.contains && typeof path.contains === 'function') {
                  try {
                    if (path.contains(event.coordinate)) {
                      foundObject = obj;
                      break;
                    }
                  } catch (e) { }
                }
              }
              if (foundObject) break;
            }
          } catch (e) { }
        }
      }

      if (foundObject) {
        const resolved = resolveObjectById(foundObject?.id) || foundObject;
        // Chỉ set clickedObject nếu object có name
        if (resolved && resolved.name) {
          clickedObject = resolved;
        }
      }
    }

    // Nếu không tìm thấy object hợp lệ, không thực hiện bất kỳ hành động nào (giữ nguyên highlight hiện tại)
    if (!clickedObject) {
      console.log("Empty area clicked - highlights preserved.");
      return;
    }

    // Xử lý clicked object
    if (clickedObject) {
      // Resolve object đầy đủ nếu là stub
      try {
        clickedObject = resolveObjectById(clickedObject?.id) || clickedObject;
      } catch { }

      // NEW: Nếu đang có navigation active, click vào connection/elevator/stairway sẽ CHUYỂN TẦNG
      if (wayfindingDirections && clickedObject) {
        const type = (clickedObject.type || clickedObject.__type || '').toLowerCase();
        const name = (clickedObject.name || '').toLowerCase();
        // Keyword check
        const isConnectionLike =
          type.includes('connection') || type.includes('elevator') ||
          type.includes('escalator') || type.includes('stair') ||
          name.includes('thang máy') || name.includes('thang cuốn') ||
          name.includes('cầu thang') || name.includes('elevator') ||
          name.includes('escalator') || name.includes('stair') ||
          name.includes('điểm nối chuyến') || name.includes('transfer point');

        if (isConnectionLike) {
          // Tìm connection object thực sự (vì clickedObject có thể chỉ là graphic space)
          let connectionObj = clickedObject;

          // Nếu object hiện tại không có coordinates (để biết tầng khác), tìm trong mapData connections
          if (!connectionObj.coordinates || connectionObj.coordinates.length === 0) {
            try {
              const allConnections = mapData.getByType("connection");
              if (allConnections && allConnections.length > 0) {
                // Tìm connection có ID trùng hoặc tên trùng
                connectionObj = allConnections.find((c: any) => c.id === clickedObject.id) ||
                  allConnections.find((c: any) => c.name === clickedObject.name) ||
                  // Hoặc nếu click vào space của connection
                  allConnections.find((c: any) => {
                    // Kiểm tra coordinate gần nhau
                    if (c.coordinates && c.coordinates.length > 0) {
                      const currentFloorCoord = c.coordinates.find((co: any) => co.floorId === mapView.currentFloor.id);
                      if (currentFloorCoord && clickedObject.anchor) {
                        // Tính khoảng cách inline (Haversine)
                        const R = 6371000;
                        const lat1 = currentFloorCoord.latitude;
                        const lng1 = currentFloorCoord.longitude;
                        const lat2 = clickedObject.anchor.latitude;
                        const lng2 = clickedObject.anchor.longitude;
                        const dLat = (lat2 - lat1) * Math.PI / 180;
                        const dLon = (lng2 - lng1) * Math.PI / 180;
                        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                          Math.sin(dLon / 2) * Math.sin(dLon / 2);
                        const c_calc = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                        const dist = R * c_calc;
                        return dist < 5; // 5 mét
                      }
                    }
                    return false;
                  }) || connectionObj;
              }
            } catch (e) { }
          }

          if (connectionObj && connectionObj.coordinates && connectionObj.coordinates.length > 0) {
            const currentFloorId = mapView.currentFloor?.id;
            // Tìm tầng khác tầng hiện tại
            const otherFloorCoord = connectionObj.coordinates.find((coord: any) => coord.floorId !== currentFloorId);

            if (otherFloorCoord && otherFloorCoord.floorId) {
              console.log(`🔄 Navigation active: Switching floor to ${otherFloorCoord.floorId} via object click (${name})`);
              mapView.setFloor(otherFloorCoord.floorId);
              return; // Dừng xử lý click (không select)
            }
          }
        }
      }

      // Lưu event coordinate vào object để dùng làm fallback
      if (event.coordinate) {
        (clickedObject as any).__eventCoordinate = event.coordinate;
      }

      // Chỉ cho phép click vào objects có name (không cho click vào objects không có name)
      if (clickedObject && clickedObject.name) {

        // Clear search results ONLY when clicking a new valid object
        if ((!selectedSpace || selectedSpace.id !== clickedObject.id) &&
          clickedObject.id !== wayfindingOrigin?.id &&
          clickedObject.id !== wayfindingDestination?.id) {
          if (currentSearchResults && currentSearchResults.length > 0) {
            currentSearchResults.forEach((obj: any) => {
              // Don't reset if we just clicked one of the search results (let selection logic handle it)
              if (obj.id !== clickedObject.id) {
                try {
                  resetObjectHighlight(obj);
                } catch (e) { }
              }
            });
            currentSearchResults = [];
            clearSearchMarkers(); // Clear markers when selection changes
          }
          // NEW: Reset active subcategory when a specific object is selected
          if (activeSubCategoryId) {
            activeSubCategoryId = null;
            renderCategories(activeCategoryId);
          }
        }
        // ============================================
        // WAYFINDING: Xử lý chọn điểm đi/đến
        // ============================================
        if (isSelectingOrigin || isSelectingDestination || isSelectingStopoverIndex >= 0) {
          // Bỏ highlight điểm cũ trước khi set điểm mới
          if (isSelectingOrigin && wayfindingOrigin) {
            resetObjectHighlight(wayfindingOrigin);
          } else if (isSelectingDestination && wayfindingDestination) {
            resetObjectHighlight(wayfindingDestination);
          } else if (isSelectingStopoverIndex >= 0 && wayfindingStopovers[isSelectingStopoverIndex]) {
            resetObjectHighlight(wayfindingStopovers[isSelectingStopoverIndex]);
          }

          // Set điểm mới
          if (isSelectingOrigin) {
            wayfindingOrigin = clickedObject;
            (window as any).wayfindingOrigin = wayfindingOrigin;
            isSelectingOrigin = false;
          } else if (isSelectingDestination) {
            wayfindingDestination = clickedObject;
            (window as any).wayfindingDestination = wayfindingDestination;
            isSelectingDestination = false;
            // Cập nhật info box với điểm đến mới
            updateInfo(clickedObject);
          } else if (isSelectingStopoverIndex >= 0) {
            wayfindingStopovers[isSelectingStopoverIndex] = clickedObject;
            isSelectingStopoverIndex = -1;
          }

          // Cập nhật highlights bổ sung
          updateHighlights();

          // Update UI và vẽ navigation
          updateWayfindingUI();
          if (wayfindingOrigin && wayfindingDestination) {
            drawNavigation();
          }

          const statusEl = document.getElementById("wayfinding-status");
          if (statusEl) {
            statusEl.textContent = "";
          }

          // USER REQUEST: Click khu vực dẫn đường thì cần focus vào khu vực đó lên 19x
          focusOnObject(clickedObject, 19.0);

          return;
        }

        // ============================================
        // WAYFINDING: Khi đã có cả origin và destination, click vào khu vực khác → set làm destination mới
        // ============================================
        if (wayfindingOrigin && wayfindingDestination) {
          // Reset highlight của điểm đến cũ trước khi set điểm mới
          resetObjectHighlight(wayfindingDestination);

          // Set điểm mới làm destination
          wayfindingDestination = clickedObject;
          (window as any).wayfindingDestination = wayfindingDestination;
          selectedSpace = clickedObject; // Cập nhật selectedSpace để tránh highlight destination cũ
          isSelectingDestination = false;
          isSelectingOrigin = false;

          // Cập nhật info box với điểm đến mới
          updateInfo(clickedObject);

          // Cập nhật highlights: chỉ highlight origin và destination (tối đa 2)
          updateHighlights();

          // Update UI và vẽ lại navigation
          updateWayfindingUI();
          drawNavigation();

          // USER REQUEST: Click khu vực dẫn đường thì cần focus vào khu vực đó lên 19x
          focusOnObject(clickedObject, 19.0);

          return;
        }

        // ============================================
        // NORMAL CLICK: Hiển thị info và zoom IN
        // ============================================
        // Nếu click vào cùng object, không làm gì
        if (selectedSpace && selectedSpace.id === clickedObject.id) {
          return;
        }

        // Set selectedSpace mới
        selectedSpace = clickedObject;

        // Sync highlights using universal function
        updateHighlights();

        // Luôn hiển thị popup
        updateInfo(clickedObject);


        // ======================
        // CAMERA CONTROL - Zoom IN lên 17.0 và đưa khu vực ra giữa màn hình
        // ============================================
        try {
          const cameraAny = mapView.Camera as any;

          // Set minZoomLevel và maxZoomLevel TRƯỚC để tránh bị clamp
          try {
            if (cameraAny.setMinZoomLevel && typeof cameraAny.setMinZoomLevel === 'function') {
              cameraAny.setMinZoomLevel(10.0); // Zoom tối thiểu 10x
            }
            if (cameraAny.setMaxZoomLevel && typeof cameraAny.setMaxZoomLevel === 'function') {
              cameraAny.setMaxZoomLevel(100.0); // Allow maximum zoom capability even when info is open
            }
          } catch (e) {
            // Bỏ qua nếu không có method này
          }

          // Zoom IN: Adjust based on object type to prevent over-zooming
          const style = getObjectBaseStyle(clickedObject);
          const isSpecialArea = (style.color === "#FFF176" || style.color === "#FFCDD2" || style.color === "#FBC02D" || style.color === "#EF9A9A");

          // Special areas (Public/Restricted) are larger, so use lower zoom to show context.
          // Regular detailed items use the 20x zoom requested by user.
          const targetZoom = isSpecialArea ? 18.0 : 20.0;

          // Lấy anchor/coordinate của object để đưa ra giữa màn hình
          const anchor = getObjectAnchor(clickedObject);

          // Thử nhiều cách để lấy coordinate của object
          let targetCenter: any = null;

          // Ưu tiên 1: anchor từ getObjectAnchor()
          if (anchor && anchor.latitude !== undefined && anchor.longitude !== undefined) {
            targetCenter = anchor;
          }
          // Ưu tiên 2: coordinate trực tiếp từ object
          else if (clickedObject.coordinate && clickedObject.coordinate.latitude !== undefined) {
            targetCenter = clickedObject.coordinate;
          }
          // Ưu tiên 3: anchor từ object
          else if (clickedObject.anchor && clickedObject.anchor.latitude !== undefined) {
            targetCenter = clickedObject.anchor;
          }
          // Ưu tiên 4: position từ object
          else if (clickedObject.position && clickedObject.position.latitude !== undefined) {
            targetCenter = clickedObject.position;
          }
          // Ưu tiên 5: coordinate từ location
          else if (clickedObject.location && clickedObject.location.coordinate) {
            targetCenter = clickedObject.location.coordinate;
          }
          // Ưu tiên 6: coordinate từ space
          else if (clickedObject.space && clickedObject.space.coordinate) {
            targetCenter = clickedObject.space.coordinate;
          }
          // Fallback: dùng event coordinate (vị trí click)
          else {
            const eventCoord = (clickedObject as any).__eventCoordinate;
            if (eventCoord && eventCoord.latitude !== undefined && eventCoord.longitude !== undefined) {
              targetCenter = eventCoord;
            }
          }

          // Đảm bảo LUÔN có targetCenter để đưa khu vực ra giữa màn hình
          if (targetCenter && targetCenter.latitude !== undefined && targetCenter.longitude !== undefined) {
            focusOnObject(clickedObject, targetZoom);
          } else {
            // Nếu không tìm thấy coordinate, log error chi tiết
            console.error("❌ Không thể tìm thấy coordinate của object!", {
              object: clickedObject,
              anchor: anchor,
              hasEventCoord: !!(clickedObject as any).__eventCoordinate
            });
          }
        } catch (e) {
          console.warn("Camera zoom error:", e);
        }

      } // ✅ ĐÓNG if (clickedObject && clickedObject.name)
    }   // ✅ ĐÓNG if (clickedObject)

  }); // ✅✅ ĐÓNG mapView.on("click")

  // ============================================
  // 14. CLOSE BUTTON HANDLER
  // ============================================
  // ===================================
  // TAB SWITCHING LOGIC (Incheon Style)
  // ===================================
  const tabSearch = document.getElementById("tab-search");
  const tabDirections = document.getElementById("tab-directions");
  const searchTabHeader = document.getElementById("search-tab-header");
  const directionsTabHeader = document.getElementById("directions-tab-header");
  const searchTabContent = document.getElementById("search-tab-content");
  const directionsTabContent = document.getElementById("directions-tab-content");
  const wayfindingPanel = document.getElementById("wayfinding-panel");
  const wayfindingHeaderTarget = document.getElementById("wayfinding-header-target");
  const wayfindingTabAnchor = document.getElementById("wayfinding-tab-anchor");

  const switchTab = (tab: 'search' | 'directions') => {
    if (tab === 'search') {
      // Active styles
      tabSearch?.classList.add("active");
      tabSearch!.style.background = "#214ca6";
      tabSearch!.style.color = "white";
      tabDirections?.classList.remove("active");
      tabDirections!.style.background = "white";
      tabDirections!.style.color = "#555";

      // Show/Hide
      if (searchTabHeader) searchTabHeader.style.display = "block";
      if (directionsTabHeader) directionsTabHeader.style.display = "none";
      if (searchTabContent) searchTabContent.style.display = "block";
      if (directionsTabContent) directionsTabContent.style.display = "none";

      const adminActions = document.getElementById("sidebar-admin-actions");
      if (adminActions) adminActions.style.display = "flex";

      // Move wayfinding panel back to anchor in search/info tab
      if (wayfindingPanel && wayfindingTabAnchor) {
        wayfindingTabAnchor.appendChild(wayfindingPanel);
        // Only keep it visible in search info popup if active routing exists
        if (!wayfindingOrigin && !wayfindingDestination && wayfindingStopovers.length === 0) {
          wayfindingPanel.classList.remove("active");
        }
      }
    } else {
      // Active styles
      tabDirections?.classList.add("active");
      tabDirections!.style.background = "#214ca6";
      tabDirections!.style.color = "white";
      tabSearch?.classList.remove("active");
      tabSearch!.style.background = "white";
      tabSearch!.style.color = "#555";

      // Show/Hide
      if (searchTabHeader) searchTabHeader.style.display = "none";
      if (directionsTabHeader) directionsTabHeader.style.display = "block";
      if (searchTabContent) searchTabContent.style.display = "none";
      if (directionsTabContent) directionsTabContent.style.display = "block";

      const adminActions = document.getElementById("sidebar-admin-actions");
      if (adminActions) adminActions.style.display = "none";

      // Move wayfinding panel to header in directions tab
      if (wayfindingPanel && wayfindingHeaderTarget) {
        wayfindingHeaderTarget.appendChild(wayfindingPanel);
        // ALWAYS show input boxes in the Directions tab
        wayfindingPanel.classList.add("active");
      }

      // Also hide info panel when switching to directions tab manually
      // hideInfo();
    }
  };

  if (tabSearch) tabSearch.onclick = () => switchTab('search');
  if (tabDirections) tabDirections.onclick = () => switchTab('directions');
  const closeBtn = document.querySelector(".close-btn") as HTMLButtonElement;
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideInfo();
      // Ensure max zoom is allowed when closing popup
      try {
        const cameraAny = mapView.Camera as any;
        if (cameraAny.setMaxZoomLevel && typeof cameraAny.setMaxZoomLevel === 'function') {
          cameraAny.setMaxZoomLevel(100.0);
        }
      } catch (e) { }
    });
  }

  // ============================================
  // 15. WAYFINDING UI HANDLERS
  // ============================================
  // Click vào "Từ:" để chọn điểm đi
  const originEl = document.getElementById("wayfinding-origin");
  if (originEl) {
    originEl.addEventListener("click", () => {
      isSelectingOrigin = true;
      isSelectingDestination = false;
      const statusEl = document.getElementById("wayfinding-status");
      if (statusEl) {
        statusEl.textContent = "";
      }
    });
  }

  // Click vào "Đến:" để chọn điểm đến
  const destinationEl = document.getElementById("wayfinding-destination");
  if (destinationEl) {
    destinationEl.addEventListener("click", () => {
      isSelectingDestination = true;
      isSelectingOrigin = false;
      const statusEl = document.getElementById("wayfinding-status");
      if (statusEl) {
        statusEl.textContent = "";
      }
    });
  }

  // Nút đảo ngược

  // Nút xóa (Đã chuyển sang icon reset ở cột bên phải)
  // Reset nút Bắt đầu
  const prBtn = document.getElementById("wayfinding-preview-btn");
  if (prBtn) prBtn.textContent = TranslationManager.t('start_preview', "Bắt đầu");

  // Re-highlight selection (selectedSpace vẫn còn giá trị)
  updateHighlights();

  const statusEl = document.getElementById("wayfinding-status");
  if (statusEl) statusEl.textContent = "";

  // ============================================
  // DESELECT HELPER & LISTENERS
  // ============================================
  const deselectAllSteps = () => {
    const instructionsListEl = document.getElementById("instructions-list");
    if (!instructionsListEl) return;
    const allSteps = instructionsListEl.querySelectorAll('.instruction-step');
    allSteps.forEach((step: any) => {
      step.style.background = 'white';
      step.style.borderLeft = 'none';
      const firstDiv = step.querySelector('div:first-child') as HTMLElement;
      const lastDiv = step.querySelector('div:last-child') as HTMLElement;

      if (firstDiv) {
        firstDiv.style.background = '#214ca6';
        firstDiv.style.color = 'white';
      }

      if (lastDiv) {
        const subDivs = lastDiv.querySelectorAll('div');
        if (subDivs.length > 0) subDivs[0].style.color = '#1a1a2e';
        if (subDivs.length > 1) subDivs[1].style.color = '#666';

        const svgs = lastDiv.querySelectorAll('svg');
        svgs.forEach((svg: any) => svg.style.fill = '#666');
      }
    });

    currentSelectedStepIndex = -1;
    updateHighlights();
  };

  // Global click listener to deselect instructions
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    // Nếu click vào các nút điều khiển (preview, swap, clear...) thì các handler riêng sẽ xử lý
    // Nếu click vào map hoặc nơi khác không phải instruction step
    if (!target.closest('.instruction-step')) {
      deselectAllSteps();
    }
  });

  // ============================================
  // BLUE DOT ANIMATION FUNCTIONS
  // ============================================
  /**
   * Hàm animate blue dot dọc theo một đoạn path từ fromCoord đến toCoord
   */
  const animateBlueDotAlongPath = (fromCoord: any, toCoord: any, pathCoordinates: any[]) => {
    if (!blueDot || !fromCoord || !toCoord || !pathCoordinates || pathCoordinates.length < 2) {
      return;
    }

    // Dừng animation cũ nếu đang chạy
    if (blueDotAnimationInterval) {
      clearInterval(blueDotAnimationInterval);
      blueDotAnimationInterval = null;
    }

    // Tìm index của fromCoord và toCoord trong pathCoordinates
    const findNearestIndex = (targetCoord: any, startFrom: number = 0): number => {
      if (!targetCoord) return -1;
      let nearestIndex = -1;
      let minDistance = Infinity;

      // Threshold: ~0.5m (khoảng 0.0000005 độ lat/lng)
      const SNAP_THRESHOLD = 0.0000005;

      for (let i = startFrom; i < pathCoordinates.length; i++) {
        const coord = pathCoordinates[i];
        if (!coord) continue;

        const latDiff = Math.abs((coord.latitude || 0) - (targetCoord.latitude || 0));
        const lngDiff = Math.abs((coord.longitude || 0) - (targetCoord.longitude || 0));
        const distance = latDiff * latDiff + lngDiff * lngDiff;

        // Chỉ chấp nhận nếu trong threshold (tránh nhảy sang lane song song)
        if (distance < minDistance && (latDiff < SNAP_THRESHOLD && lngDiff < SNAP_THRESHOLD)) {
          minDistance = distance;
          nearestIndex = i;
        }
      }

      // Nếu không tìm thấy trong threshold, tìm gần nhất (fallback)
      if (nearestIndex === -1) {
        for (let i = startFrom; i < pathCoordinates.length; i++) {
          const coord = pathCoordinates[i];
          if (!coord) continue;

          const latDiff = Math.abs((coord.latitude || 0) - (targetCoord.latitude || 0));
          const lngDiff = Math.abs((coord.longitude || 0) - (targetCoord.longitude || 0));
          const distance = latDiff * latDiff + lngDiff * lngDiff;

          if (distance < minDistance) {
            minDistance = distance;
            nearestIndex = i;
          }
        }
      }

      return nearestIndex;
    };

    // 1️⃣ Lấy segment path
    const fromIndex = findNearestIndex(fromCoord, 0);
    const toIndex = findNearestIndex(toCoord, fromIndex >= 0 ? fromIndex : 0);

    if (fromIndex < 0 || toIndex <= fromIndex) {
      // Nếu không tìm thấy, chỉ di chuyển đến toCoord
      try {
        const currentFloor = mapView.currentFloor;
        blueDot.update({
          latitude: toCoord.latitude,
          longitude: toCoord.longitude,
          accuracy: 5,
          heading: undefined,
          floorOrFloorId: currentFloor?.id || 'device',
          timestamp: Date.now(),
        }, { animate: false });
        focusCameraOnCoordinate(toCoord, false); // Không zoom
      } catch (e) {
        console.warn("Error updating blue dot:", e);
      }
      return;
    }

    const segmentCoords = pathCoordinates.slice(fromIndex, toIndex + 1);
    if (segmentCoords.length === 0) return;

    // 2️⃣ Build distance table
    const { distances, totalDistance } = buildDistanceTable(segmentCoords);

    if (totalDistance === 0) return;

    // 3️⃣ Tính duration theo vận tốc (Ưu tiên dùng tổng thời gian từ UI)
    const currentMultiplier = ((window as any).speedMultiplier || 1.0) * PREVIEW_SPEED_BOOST;
    const baseDurationMs = (routeTotalSecondsGlobal > 0 ? routeTotalSecondsGlobal : (totalDistance / BLUE_DOT_SPEED_MPS)) * 1000;
    const totalDurationMs = baseDurationMs / currentMultiplier;

    // Use instruction distance for UI scale if available
    const uiScaleDistance = (window as any).instructionTotalDistance || totalDistance;
    // Nếu đang seek, tính startTime dựa trên currentAnimationDistance
    const initialElapsed = currentAnimationDistance > 0
      ? (currentAnimationDistance / totalDistance) * totalDurationMs
      : 0;
    const startTime = performance.now() - initialElapsed;

    // Lưu animation state
    animationState = {
      segmentCoords,
      distances,
      totalDistance,
      totalDurationMs,
      startTime,
      pathCoordinates,
    };
    animationSegmentCoords = segmentCoords;
    animationDistances = distances;
    animationTotalDistance = totalDistance;
    totalAnimationDuration = totalDurationMs;
    if (currentAnimationDistance === 0) {
      currentAnimationDistance = 0; // Reset nếu chưa có
    }

    // RESET animationPauseTime vì startTime đã được re-base theo thời điểm hiện tại
    // Nếu không reset, elapsed sẽ bị trừ đi thời gian pause cũ -> âm -> jump back
    animationPauseTime = 0;

    isAnimating = true;
    isPaused = false;

    // Di chuyển blue dot đến điểm đầu tiên HOẶC điểm hiện tại nếu đang resume/seek/change speed
    let startPos = segmentCoords[0];
    let startHeading: number | undefined = undefined;
    let startFloorId = mapView.currentFloor?.id || 'device';

    // Nếu có distance tích lũy (do change speed hoặc seek), bắt đầu từ điểm đó
    if (currentAnimationDistance > 0 && distances.length > 0) {
      const pos = interpolateByDistance(segmentCoords, distances, currentAnimationDistance);
      if (pos) {
        startPos = pos;

        // Tính heading tại điểm bắt đầu
        const currentIndex = distances.findIndex((d: number) => d >= currentAnimationDistance);
        const segmentCoord = segmentCoords[Math.max(0, Math.min(currentIndex, segmentCoords.length - 1))];
        if (currentIndex > 0 && currentIndex < segmentCoords.length) {
          const prevCoord = segmentCoords[currentIndex - 1];
          const currCoord = segmentCoords[currentIndex];
          if (prevCoord && currCoord) {
            const latDiff = currCoord.latitude - prevCoord.latitude;
            const lngDiff = currCoord.longitude - prevCoord.longitude;
            startHeading = Math.atan2(lngDiff, latDiff) * 180 / Math.PI;
          }
        }

        // Lấy floor
        if (segmentCoord) {
          if (segmentCoord.floor) {
            startFloorId = segmentCoord.floor.id || segmentCoord.floor;
          } else if (segmentCoord.floorId) {
            startFloorId = segmentCoord.floorId;
          }
        }
      }
    }

    try {
      // Remove any previously created fake previewMarker
      if (previewMarker) {
        mapView.Markers.remove(previewMarker);
        previewMarker = null;
      }

      // Use native BlueDot! Make sure it stays enabled.
      if (blueDot) {
        blueDot.update({
          latitude: startPos.latitude,
          longitude: startPos.longitude,
          accuracy: 5,
          heading: undefined,
          floorOrFloorId: startFloorId || mapView.currentFloor?.id || 'device',
          timestamp: Date.now()
        }, { animate: false });
      }

      // Zoom lên 20x và focus vào blue dot khi bắt đầu preview
      focusCameraOnCoordinate(startPos, true);
    } catch (e) {
      console.warn("Error initiating preview blue dot:", e);
    }

    // Animate với vận tốc cố định
    let pauseStartTime = 0;
    blueDotAnimationInterval = setInterval(() => {
      if (isPaused) {
        if (pauseStartTime === 0) {
          pauseStartTime = performance.now();
        }
        return; // Không update nếu đang pause
      } else {
        if (pauseStartTime > 0) {
          animationPauseTime += performance.now() - pauseStartTime;
          pauseStartTime = 0;
        }
      }

      const currentStartTime = animationState?.startTime || startTime;
      const currentDuration = animationState?.totalDurationMs || totalDurationMs;
      const elapsed = performance.now() - currentStartTime - animationPauseTime;
      const traveled = Math.min((elapsed / currentDuration) * totalDistance, totalDistance);
      currentAnimationDistance = traveled;

      // 4️⃣ Nội suy vị trí
      const pos = interpolateByDistance(segmentCoords, distances, traveled);

      // Xác định target floor từ segment hiện tại
      const currentIndex = distances.findIndex((d: number) => d >= traveled);
      const segmentCoord = segmentCoords[Math.max(0, Math.min(currentIndex, segmentCoords.length - 1))];
      let targetFloorId = mapView.currentFloor?.id || 'device';

      if (segmentCoord) {
        if (segmentCoord.floor) {
          targetFloorId = segmentCoord.floor.id || segmentCoord.floor;
        } else if (segmentCoord.floorId) {
          targetFloorId = segmentCoord.floorId;
        }
      }

      // Đảm bảo pos luôn có floorId để Mappedin Marker hiển thị đúng
      if (pos && !pos.floorId) {
        pos.floorId = targetFloorId;
      }

      // Tính heading và lấy floor từ segmentCoords (không tìm nearest)
      let heading: number | undefined = undefined;

      if (currentIndex > 0 && currentIndex < segmentCoords.length) {
        const prevCoord = segmentCoords[currentIndex - 1];
        const currCoord = segmentCoords[currentIndex];
        if (prevCoord && currCoord) {
          const latDiff = currCoord.latitude - prevCoord.latitude;
          const lngDiff = currCoord.longitude - prevCoord.longitude;
          heading = Math.atan2(lngDiff, latDiff) * 180 / Math.PI;
        }
      }

      try {
        // Chuyển tầng nếu cần (targetFloorId đã được tính ở trên)
        const currentFloor = mapView.currentFloor;

        // Lấy floor trực tiếp từ segment coordinate hiện tại
        if (segmentCoord) {
          if (segmentCoord.floor) {
            targetFloorId = segmentCoord.floor.id || segmentCoord.floor;
          } else if (segmentCoord.floorId) {
            targetFloorId = segmentCoord.floorId;
          }
        }

        if (previewMarker) {
          mapView.Markers.remove(previewMarker);
          previewMarker = null;
        }
        try {
          if (blueDot) {
            blueDot.update({
              latitude: pos.latitude,
              longitude: pos.longitude,
              accuracy: 5,
              heading: heading,
              floorOrFloorId: targetFloorId,
              timestamp: Date.now()
            }, { animate: false });
          }
        } catch (err) {
          // Mappedin throws if coordinate is invalid or out of bounds. We safely ignore.
        }

        // Chuyển tầng nếu cần
        if (targetFloorId !== 'device' && targetFloorId !== currentFloor?.id) {
          try {
            mapView.setFloor(targetFloorId);
          } catch (e) {
            console.warn("Error changing floor:", e);
          }
        }

        // 5️⃣ Camera follow - Gọi mỗi frame, hàm focusCameraOnCoordinate sẽ tự throttle theo CAMERA_UPDATE_INTERVAL
        if (!isPaused) {
          focusCameraOnCoordinate(pos, true);
        }

        // Cập nhật progress bar và time liên tục
        updateVideoProgress(elapsed, currentDuration);

        // 6️⃣ Kết thúc
        if (traveled >= totalDistance) {
          updateVideoProgress(currentDuration, currentDuration);

          // Tự động thoát demo khi kết thúc
          setTimeout(() => {
            exitWayfindingDemo();
          }, 1000);
        }
      } catch (e) {
        console.warn("Error updating blue dot:", e);
      }
    }, FRAME_INTERVAL);
  };

  /**
   * Hàm highlight bước cụ thể trong UI
   */
  const highlightStepInUI = (index: number) => {
    const instructionsListEl = document.getElementById("instructions-list");
    if (!instructionsListEl) return;
    const allSteps = instructionsListEl.querySelectorAll('.instruction-step');

    // Reset all
    allSteps.forEach((step: any, i: number) => {
      if (i === index) return;
      step.style.background = 'white';
      step.style.borderLeft = 'none';
      const firstDiv = step.querySelector('div:first-child') as HTMLElement;
      const lastDiv = step.querySelector('div:last-child') as HTMLElement;
      if (firstDiv) {
        firstDiv.style.background = '#214ca6';
        firstDiv.style.color = 'white';
      }
      if (lastDiv) {
        const textDiv = lastDiv.querySelector('div');
        if (textDiv) textDiv.style.color = '#1a1a2e';
        const svgs = lastDiv.querySelectorAll('svg');
        svgs.forEach((svg: any) => svg.style.fill = '#666');
      }
    });

    const step = allSteps[index] as HTMLElement;
    if (step) {
      step.style.background = '#f0f6ff'; // Lighter blue focus
      const firstDiv = step.querySelector('div:first-child') as HTMLElement;
      const lastDiv = step.querySelector('div:last-child') as HTMLElement;
      if (firstDiv) {
        firstDiv.style.background = '#214ca6';
        firstDiv.style.color = 'white';
      }
      if (lastDiv) {
        const textDiv = lastDiv.querySelector('div');
        if (textDiv) textDiv.style.color = '#214ca6'; // Primary color for focused text
        const svgs = lastDiv.querySelectorAll('svg');
        svgs.forEach((svg: any) => svg.style.fill = '#214ca6');
      }
      step.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  /**
   * Hàm cập nhật video progress bar và time
   */
  const updateVideoProgress = (elapsed: number, totalDuration: number) => {
    const progress = Math.min((elapsed / totalDuration) * 100, 100);
    const progressBar = document.getElementById("video-progress") as HTMLInputElement;
    const timeEl = document.getElementById("video-time");
    const durationEl = document.getElementById("video-duration");

    if (progressBar) {
      progressBar.value = progress.toString();
      progressBar.style.background = `linear-gradient(to right, #2196F3 0%, #2196F3 ${progress}%, #ddd ${progress}%, #ddd 100%)`;
      progressBar.disabled = false;
    }

    // Thời gian hiển thị (thời gian đã trôi qua và tổng thời gian mô phỏng)
    const simulatedElapsedMs = elapsed;
    const simulatedTotalMs = totalDuration;

    const formatTime = (ms: number) => {
      const totalSeconds = Math.max(0, Math.floor(ms / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    if (timeEl) timeEl.textContent = formatTime(simulatedElapsedMs);
    if (durationEl) durationEl.textContent = formatTime(simulatedTotalMs);

    // ==========================================
    // Highlight bước tương ứng — dùng cumulativeDistance từ originalDistance (khớp quỹ đạo thực)
    // ==========================================
    if (simplifiedInstructionsGlobal && simplifiedInstructionsGlobal.length > 0 && animationState) {
      const totalSteps = simplifiedInstructionsGlobal.length;
      const uiScaleDist = (window as any).instructionTotalDistance || animationState.totalDistance;
      const traveled = totalDuration > 0 ? (elapsed / totalDuration) * uiScaleDist : 0;

      // Xác định Blue Dot đang ở segment nào dựa trên originalDistance boundaries
      let highlightIdx = 0;
      for (let i = 1; i < totalSteps; i++) {
        const stepStartDist = simplifiedInstructionsGlobal[i].cumulativeDistance || 0;
        if (traveled >= stepStartDist) {
          highlightIdx = i;
        } else {
          break;
        }
      }

      // Xử lý bước cuối (Kết thúc)
      if (traveled >= uiScaleDist - 1.0 || (totalDuration > 0 && elapsed / totalDuration >= 0.98)) {
        highlightIdx = totalSteps - 1;
      }

      if (highlightIdx !== currentSelectedStepIndex) {
        currentSelectedStepIndex = highlightIdx;
        highlightStepInUI(highlightIdx);
      }
    }
  };

  // Lưu camera state trước khi preview
  let cameraStateBeforePreview: any = null;

  /**
   * Hàm pause/resume animation
   */
  const pauseResumeAnimation = () => {
    if (!isAnimating) return;

    isPaused = !isPaused;
    const playPauseBtn = document.getElementById("video-play") || document.getElementById("video-play-pause");
    if (playPauseBtn) {
      const iconEl = document.getElementById("play-pause-icon");
      if (iconEl) {
        // SVG cho Play (Tam giác) và Pause (2 vạch)
        if (isPaused) {
          iconEl.innerHTML = '<path d="M5 3l14 9-14 9V3z" />'; // Play
        } else {
          iconEl.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />'; // Pause
        }
      } else {
        playPauseBtn.textContent = isPaused ? "▶" : "⏸";
      }
    }

    if (isPaused) {
      // Khi pause: KHÔNG ẩn blue dot, giữ nguyên vị trí, giữ nguyên camera
      // Đảm bảo path trở về màu xanh dương (xóa highlight xanh lá)
      deselectAllSteps();

      // Không disable blue dot cũng như không reset camera
    } else {
      // Khi resume: tiếp tục animation, đảm bảo blue dot được enable
      if (blueDot) {
        blueDot.enable();
      }
      // Path luôn xanh dương
      deselectAllSteps();
    }
  };

  /**
   * Hàm seek animation đến một vị trí cụ thể (0-100%)
   * Sử dụng segment coordinates (giống animate) để tránh lệch
   */
  const seekAnimation = (percentage: number) => {
    if (!animationState || !animationSegmentCoords || animationSegmentCoords.length === 0) return;

    // Sử dụng segment coordinates (giống animate) thay vì full path
    const { distances, totalDistance } = buildDistanceTable(animationSegmentCoords);

    if (totalDistance === 0) return;

    // Tính target distance dựa trên percentage của segment
    const targetDistance = (percentage / 100) * totalDistance;
    const { totalDurationMs } = animationState;
    const targetElapsed = (percentage / 100) * totalDurationMs;

    // Cập nhật currentAnimationDistance
    currentAnimationDistance = targetDistance;

    // Cập nhật blue dot position từ segment (giống animate)
    const pos = interpolateByDistance(animationSegmentCoords, distances, targetDistance);

    if (!pos) return;

    // Tính heading và lấy floor từ segment (giống animate)
    let heading: number | undefined = undefined;
    const currentIndex = distances.findIndex((d: number) => d >= targetDistance);
    const segmentCoord = animationSegmentCoords[Math.max(0, Math.min(currentIndex, animationSegmentCoords.length - 1))];

    if (currentIndex > 0 && currentIndex < animationSegmentCoords.length) {
      const prevCoord = animationSegmentCoords[currentIndex - 1];
      const currCoord = animationSegmentCoords[currentIndex];
      if (prevCoord && currCoord) {
        const latDiff = currCoord.latitude - prevCoord.latitude;
        const lngDiff = currCoord.longitude - prevCoord.longitude;
        heading = Math.atan2(lngDiff, latDiff) * 180 / Math.PI;
      }
    }

    try {
      // Lấy floor từ segment coordinate (KHÔNG tìm nearest)
      const currentFloor = mapView.currentFloor;
      let targetFloorId = currentFloor?.id || 'device';

      if (segmentCoord) {
        if (segmentCoord.floor) {
          targetFloorId = segmentCoord.floor.id || segmentCoord.floor;
        } else if (segmentCoord.floorId) {
          targetFloorId = segmentCoord.floorId;
        }
      }

      blueDot.update({
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: 5,
        heading: heading,
        floorOrFloorId: targetFloorId,
        timestamp: Date.now(),
      }, { animate: false });

      // Chuyển tầng nếu cần
      if (targetFloorId !== 'device' && targetFloorId !== currentFloor?.id) {
        try {
          mapView.setFloor(targetFloorId);
        } catch (e) {
          console.warn("Error changing floor:", e);
        }
      }

      // Focus camera với setCenter (không animate) để tránh ảo giác lệch
      focusCameraOnCoordinate(pos, true);
    } catch (e) {
      console.warn("Error seeking blue dot:", e);
    }

    // Cập nhật animation state để animation tiếp tục từ vị trí mới
    if (isAnimating && animationState) {
      // Cập nhật distances trong animation state (segment đã đúng)
      animationState.distances = distances;
      animationState.totalDistance = totalDistance;

      // Restart animation với startTime mới
      animationPauseTime = 0;
      const newStartTime = performance.now() - targetElapsed;
      animationState.startTime = newStartTime;

      // Nếu đang pause, resume
      if (isPaused) {
        isPaused = false;
        const playPauseBtn = document.getElementById("video-play-pause");
        if (playPauseBtn) {
          playPauseBtn.textContent = "⏸";
        }
      }
    }

    updateVideoProgress(targetElapsed, totalDurationMs);
  };

  /**
   * Animate blue dot cho một bước cụ thể
   */
  const animateBlueDotForStep = (stepIndex: number) => {
    if (!wayfindingDirections || !wayfindingDirections.instructions || !wayfindingDirections.coordinates) {
      return;
    }

    const instruction = wayfindingDirections.instructions[stepIndex];
    if (!instruction || !instruction.coordinate) {
      return;
    }

    // Xác định điểm bắt đầu và kết thúc
    let fromCoord: any = instruction.coordinate;
    let toCoord: any = null;

    if (stepIndex + 1 < wayfindingDirections.instructions.length) {
      const nextInstruction = wayfindingDirections.instructions[stepIndex + 1];
      if (nextInstruction && nextInstruction.coordinate) {
        toCoord = nextInstruction.coordinate;
      }
    }

    if (!toCoord && wayfindingDirections.coordinates.length > 0) {
      toCoord = wayfindingDirections.coordinates[wayfindingDirections.coordinates.length - 1];
    }

    if (!toCoord) {
      return;
    }

    // Animate blue dot dọc theo path (sử dụng vận tốc cố định)
    animateBlueDotAlongPath(fromCoord, toCoord, wayfindingDirections.coordinates);
  };

  /**
   * Hàm focus camera vào một coordinate
   * @param coord - Coordinate để focus
   * @param allowZoom - Nếu false, giữ nguyên zoom level hiện tại. Nếu true và đang preview, zoom lên 20x
   */
  let lastCameraUpdateTime = 0;
  const CAMERA_UPDATE_INTERVAL = 500; // Cập nhật camera mỗi 0.5 giây để theo kịp tốc độ 4x

  const focusCameraOnCoordinate = (coord: any, allowZoom: boolean = true) => {
    if (!coord || !mapView || !mapView.Camera) return;

    // Throttle camera updates để tránh giật
    const now = performance.now();
    if (now - lastCameraUpdateTime < CAMERA_UPDATE_INTERVAL) {
      return;
    }
    lastCameraUpdateTime = now;

    try {
      const cameraAny = mapView.Camera as any;
      let targetZoom: number;

      // Nếu allowZoom=true và đang animating (preview), zoom lên 20x
      if (allowZoom && isAnimating) {
        targetZoom = 20.0;
      } else {
        // Giữ nguyên zoom hiện tại
        targetZoom = getCameraZoom() ?? 16.5;
      }

      // Khi preview: setCenter với smooth transition dài hơn để blue dot luôn trong màn hình
      if (isAnimating && !isPaused) {
        // SetCenter với smooth transition dài hơn để giảm giật
        cameraAny.animateTo({
          center: coord,
          zoomLevel: targetZoom,
          bearing: mapView.Camera.bearing,
          pitch: mapView.Camera.pitch,
        }, {
          duration: 800, // Duration dài hơn để mượt, giảm giật
          easing: "easeInOut",
        });
      } else {
        // Khi không preview: animate bình thường
        cameraAny.animateTo({
          center: coord,
          zoomLevel: targetZoom,
          bearing: mapView.Camera.bearing,
          pitch: mapView.Camera.pitch,
        }, {
          duration: 300,
          easing: "easeOut",
        });
      }
    } catch (e) {
      console.warn("Error focusing camera:", e);
    }
  };

  /**
   * Animate blue dot từ đầu đến cuối đường đi - đi qua tất cả các bước tự động
   * Sử dụng vận tốc cố định cho toàn bộ path
   */
  const animateBlueDotFullPath = () => {
    if (!wayfindingDirections || !wayfindingDirections.coordinates || wayfindingDirections.coordinates.length === 0) {
      return;
    }

    // Dừng animation cũ nếu đang chạy
    if (blueDotAnimationInterval) {
      clearInterval(blueDotAnimationInterval);
      blueDotAnimationInterval = null;
    }

    // Lưu camera state trước khi preview (để restore khi tắt preview)
    cameraStateBeforePreview = {
      center: { ...mapView.Camera.center },
      zoomLevel: getCameraZoom() ?? 16.5,
      bearing: mapView.Camera.bearing,
      pitch: mapView.Camera.pitch,
    };

    // Reset state
    currentAnimationDistance = 0;
    currentSelectedStepIndex = -1; // Reset highlight step index
    animationPauseTime = 0;
    isPaused = false;
    animationState = null;

    // Highlight Bước 1 ngay khi bắt đầu
    setTimeout(() => {
      highlightStepInUI(0);
      currentSelectedStepIndex = 0;
    }, 50);

    const fromCoord = wayfindingDirections.coordinates[0];
    const toCoord = wayfindingDirections.coordinates[wayfindingDirections.coordinates.length - 1];

    if (!fromCoord || !toCoord) {
      return;
    }

    // Ẩn preview bar cố định ở dưới và hiển thị control bar mới
    const previewBar = document.getElementById("route-preview-bar");
    if (previewBar) previewBar.style.display = "none";

    // Hiển thị video control bar
    const videoControlBar = document.getElementById("video-control-bar");
    if (videoControlBar) {
      videoControlBar.style.display = "block";
    }

    // Reset play/pause button icon to Pause (vì đang bắt đầu chạy)
    const playPauseBtn = document.getElementById("video-play") || document.getElementById("video-play-pause");
    if (playPauseBtn) {
      const iconEl = document.getElementById("play-pause-icon");
      if (iconEl) iconEl.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />';
      else playPauseBtn.textContent = "⏸";
    }

    // Đảm bảo blue dot được enable
    if (blueDot) {
      blueDot.enable();
    }

    // Focus vào điểm bắt đầu (không zoom, giữ nguyên zoom hiện tại)
    // focusCameraOnCoordinate(fromCoord, false); // REMOVED to fix zoom bounce

    // Animate toàn bộ path với vận tốc cố định
    animateBlueDotAlongPath(fromCoord, toCoord, wayfindingDirections.coordinates);
  };

  // Nút swap positions
  const swapBtn = document.getElementById("wayfinding-swap-btn");
  if (swapBtn) {
    swapBtn.addEventListener("click", () => {
      if (!wayfindingOrigin && !wayfindingDestination) return;

      const temp = wayfindingOrigin;
      wayfindingOrigin = wayfindingDestination;
      wayfindingDestination = temp;

      updateHighlights();
      updateWayfindingUI();

      // Clear navigation cũ
      clearNavigation();

      // Nếu đủ 2 điểm thì vẽ lại đường đi
      if (wayfindingOrigin && wayfindingDestination) {
        drawNavigation();
      }
    });
  }

  // Nút preview (Bắt đầu)
  const mainPreviewBtn = document.getElementById("wayfinding-preview-btn");
  const mainPreviewBtnLarge = document.getElementById("wayfinding-preview-btn-main");

  const startPreviewHandler = () => {
    // VALIDATION: Kiểm tra điểm xuất phát
    if (!wayfindingOrigin) {
      alert(TranslationManager.t('select_origin_alert', "Chưa có điểm xuất phát. Vui lòng chọn điểm xuất phát trên bản đồ."));
      return;
    }
    // VALIDATION: Kiểm tra điểm đích
    if (!wayfindingDestination) {
      alert(TranslationManager.t('select_destination_alert', "Chưa có điểm đích. Vui lòng chọn điểm đích trên bản đồ."));
      return;
    }
    animateBlueDotFullPath();
  };

  if (mainPreviewBtn) mainPreviewBtn.addEventListener("click", startPreviewHandler);
  if (mainPreviewBtnLarge) mainPreviewBtnLarge.addEventListener("click", startPreviewHandler);

  // Video control handlers
  const videoPlayBtn = document.getElementById("video-play") || document.getElementById("video-play-pause");
  if (videoPlayBtn) {
    videoPlayBtn.addEventListener("click", () => {
      pauseResumeAnimation();
    });
  }

  /**
   * Hàm thoát khỏi chế độ demo wayfinding
   */
  const exitWayfindingDemo = () => {
    // Dừng animation
    if (blueDotAnimationInterval) {
      clearInterval(blueDotAnimationInterval);
      blueDotAnimationInterval = null;
    }
    isAnimating = false;
    isPaused = false;
    animationState = null;
    currentAnimationDistance = 0;

    // Ẩn blue dot và xóa preview marker
    if (blueDot) {
      blueDot.disable();
    }
    if (previewMarker) {
      mapView.Markers.remove(previewMarker);
      previewMarker = null;
    }

    // Ẩn video control bar và hiện lại preview bar
    const vBar = document.getElementById("video-control-bar");
    if (vBar) {
      vBar.style.display = "none";
    }
    const previewBar = document.getElementById("route-preview-bar");
    if (previewBar) {
      previewBar.style.display = "block";
    }

    // Reset camera về trạng thái trước preview (hoặc về start point với zoom 19x như yêu cầu)
    if (wayfindingDirections && wayfindingDirections.coordinates && wayfindingDirections.coordinates.length > 0) {
      const startCoord = wayfindingDirections.coordinates[0];
      try {
        const cameraAny = mapView.Camera as any;
        cameraAny.animateTo({
          center: startCoord,
          zoomLevel: 19.0,
          bearing: mapView.Camera.bearing,
          pitch: mapView.Camera.pitch,
        }, {
          duration: 500,
          easing: "easeInOut",
        });
      } catch (e) {
        console.warn("Error resetting camera:", e);
      }
    } else if (cameraStateBeforePreview) {
      // Fallback về state cũ nếu không có coordinates
      try {
        const cameraAny = mapView.Camera as any;
        cameraAny.animateTo({
          center: cameraStateBeforePreview.center,
          zoomLevel: 19.0, // Zoom 19x như yêu cầu (thay vì state cũ)
          bearing: cameraStateBeforePreview.bearing,
          pitch: cameraStateBeforePreview.pitch,
        }, {
          duration: 500,
          easing: "easeInOut",
        });
      } catch (e) {
        console.warn("Error resetting camera:", e);
      }
    }

    // Reset progress
    updateVideoProgress(0, 0);

    // Reset preview button text
    const exitPreviewBtn = document.getElementById("wayfinding-preview-btn");
    const exitPreviewBtnMain = document.getElementById("wayfinding-preview-btn-main");
    if (exitPreviewBtn) {
      exitPreviewBtn.textContent = TranslationManager.t('start_preview', 'Bắt đầu');
    }
    if (exitPreviewBtnMain) {
      const span = exitPreviewBtnMain.querySelector('span');
      if (span) span.textContent = TranslationManager.t('route_preview', 'Route Preview');
    }

    // Reset steps styling
    deselectAllSteps();
  };

  // Nút stop để tắt preview
  const stopBtn = document.getElementById("video-stop");
  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      exitWayfindingDemo();
    });
  }

  // Seek bar bị disable, không cần event handler

  // Speed control dropdown
  const speedSelect = document.getElementById("video-speed-select") as HTMLSelectElement;
  if (speedSelect) {
    speedSelect.addEventListener("change", () => {
      const speed = parseFloat(speedSelect.value);
      (window as any).setAnimationSpeed(speed);
      // Nếu đang animate, restart với speed mới
      if (isAnimating && animationState) {
        // Lưu trạng thái pause hiện tại
        const wasPaused = isPaused;

        // Restart animation với speed mới
        const { pathCoordinates } = animationState;
        const fromCoord = pathCoordinates[0];
        const toCoord = pathCoordinates[pathCoordinates.length - 1];

        // Dừng animation cũ
        if (blueDotAnimationInterval) {
          clearInterval(blueDotAnimationInterval);
          blueDotAnimationInterval = null;
        }

        // Restart với speed mới - KHÔNG tính toán lại currentAnimationDistance, để animateBlueDotAlongPath tự dùng giá trị hiện tại
        animateBlueDotAlongPath(fromCoord, toCoord, pathCoordinates);

        // Khôi phục trạng thái pause nếu cần
        if (wasPaused) {
          isPaused = true;
          const playPauseBtn = document.getElementById("video-play-pause");
          if (playPauseBtn) {
            playPauseBtn.textContent = "▶";
          }
        }
      }
    });
  }

  // ============================================
  // 16. CAMERA CONTROL BUTTONS HANDLERS
  // ============================================
  const cameraAny = mapView.Camera as any;

  // Lưu bearing ban đầu để dùng cho nút home
  const initialBearing = mapView.Camera.bearing - 36;

  // Nút lên (Pitch Up) - xoay lên 5 độ (ĐẢO NGƯỢC: giảm pitch)
  const btnUp = document.getElementById("btn-up");
  if (btnUp) {
    btnUp.addEventListener("click", () => {
      try {
        const currentPitch = mapView.Camera.pitch || 0;
        cameraAny.animateTo({
          pitch: currentPitch - 5, // ĐẢO NGƯỢC: Xoay lên = giảm pitch
          bearing: mapView.Camera.bearing,
          zoomLevel: cameraAny.zoomLevel ?? cameraAny.zoom ?? 16.5,
          center: mapView.Camera.center,
        }, {
          duration: 300,
          easing: "easeInOut",
        });
      } catch (e) {
        console.warn("Error pitch up:", e);
      }
    });
  }

  // Nút xuống (Pitch Down) - xoay xuống 5 độ (ĐẢO NGƯỢC: tăng pitch)
  const btnDown = document.getElementById("btn-down");
  if (btnDown) {
    btnDown.addEventListener("click", () => {
      try {
        const currentPitch = mapView.Camera.pitch || 0;
        cameraAny.animateTo({
          pitch: currentPitch + 5, // ĐẢO NGƯỢC: Xoay xuống = tăng pitch
          bearing: mapView.Camera.bearing,
          zoomLevel: cameraAny.zoomLevel ?? cameraAny.zoom ?? 16.5,
          center: mapView.Camera.center,
        }, {
          duration: 300,
          easing: "easeInOut",
        });
      } catch (e) {
        console.warn("Error pitch down:", e);
      }
    });
  }

  // Nút trái (Rotate Left) - xoay trái 5 độ (ĐẢO NGƯỢC: tăng bearing)
  const btnLeft = document.getElementById("btn-left");
  if (btnLeft) {
    btnLeft.addEventListener("click", () => {
      try {
        const currentBearing = mapView.Camera.bearing || 0;
        cameraAny.animateTo({
          bearing: currentBearing + 5, // ĐẢO NGƯỢC: Xoay trái = tăng bearing
          pitch: mapView.Camera.pitch,
          zoomLevel: cameraAny.zoomLevel ?? cameraAny.zoom ?? 16.5,
          center: mapView.Camera.center,
        }, {
          duration: 300,
          easing: "easeInOut",
        });
      } catch (e) {
        console.warn("Error rotate left:", e);
      }
    });
  }

  // Nút phải (Rotate Right) - xoay phải 5 độ (ĐẢO NGƯỢC: giảm bearing)
  const btnRight = document.getElementById("btn-right");
  if (btnRight) {
    btnRight.addEventListener("click", () => {
      try {
        const currentBearing = mapView.Camera.bearing || 0;
        cameraAny.animateTo({
          bearing: currentBearing - 5, // ĐẢO NGƯỢC: Xoay phải = giảm bearing
          pitch: mapView.Camera.pitch,
          zoomLevel: cameraAny.zoomLevel ?? cameraAny.zoom ?? 16.5,
          center: mapView.Camera.center,
        }, {
          duration: 300,
          easing: "easeInOut",
        });
      } catch (e) {
        console.warn("Error rotate right:", e);
      }
    });
  }

  // Nút Home (Reset) - đưa về trạng thái ban đầu: zoom 16, bearing = bearing - 36, center về giữa
  const btnReset = document.getElementById("btn-reset");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      try {
        cameraAny.animateTo({
          zoomLevel: 16, // Zoom về 16x
          bearing: initialBearing, // Bearing ban đầu (bearing - 36)
          pitch: mapView.Camera.pitch,
          center: initialVenueCenter || mapView.Camera.center, // Trung tâm ban đầu
        }, {
          duration: 1000,
          easing: "easeInOut",
        });
        console.log(`🏠 Reset camera: zoom=16, bearing=${initialBearing}, center=initial`);
      } catch (e) {
        console.warn("Error reset camera:", e);
      }
    });
  }

  // Nút Zoom In (+) - zoom in 0.2x (tối đa 20x)
  const btnZoomIn = document.getElementById("btn-zoom-in");
  if (btnZoomIn) {
    btnZoomIn.addEventListener("click", () => {
      try {
        // Lấy zoom hiện tại từ nhiều nguồn để đảm bảo chính xác
        let currentZoom = getCameraZoom();
        if (currentZoom === null) {
          // Thử lấy từ camera trực tiếp
          const cam: any = mapView.Camera as any;
          currentZoom = cam?.zoom ?? cam?.zoomLevel ?? cam?.position?.zoom ?? 16.5;
        }
        // Đảm bảo currentZoom là number
        const currentZoomValue: number = typeof currentZoom === 'number' ? currentZoom : 16.5;

        const targetZoom = Math.min(currentZoomValue + 0.2, 20.0); // Zoom in 0.2x (tối đa 20x)

        // Chỉ zoom nếu chưa đạt giới hạn
        if (targetZoom > currentZoomValue) {
          cameraAny.animateTo({
            zoomLevel: targetZoom,
            bearing: mapView.Camera.bearing,
            pitch: mapView.Camera.pitch,
            center: mapView.Camera.center,
          }, {
            duration: 300,
            easing: "easeInOut",
          });
          console.log(`🔍 Zoom In: ${currentZoomValue} → ${targetZoom}`);
        } else {
          console.log(`🔍 Zoom In: Đã đạt giới hạn tối đa (20x)`);
        }
      } catch (e) {
        console.warn("Error zoom in:", e);
      }
    });
  }

  // Nút Zoom Out (-) - zoom out 0.2x (tối thiểu 10x)
  const btnZoomOut = document.getElementById("btn-zoom-out");
  if (btnZoomOut) {
    btnZoomOut.addEventListener("click", () => {
      try {
        // Lấy zoom hiện tại từ nhiều nguồn để đảm bảo chính xác
        let currentZoom = getCameraZoom();
        if (currentZoom === null) {
          // Thử lấy từ camera trực tiếp
          const cam: any = mapView.Camera as any;
          currentZoom = cam?.zoom ?? cam?.zoomLevel ?? cam?.position?.zoom ?? 16.5;
        }
        // Đảm bảo currentZoom là number
        const currentZoomValue: number = typeof currentZoom === 'number' ? currentZoom : 16.5;

        const targetZoom = Math.max(currentZoomValue - 0.2, 10.0); // Zoom out 0.2x (tối thiểu 10x)

        // Chỉ zoom nếu chưa đạt giới hạn
        if (targetZoom < currentZoomValue) {
          cameraAny.animateTo({
            zoomLevel: targetZoom,
            bearing: mapView.Camera.bearing,
            pitch: mapView.Camera.pitch,
            center: mapView.Camera.center,
          }, {
            duration: 300,
            easing: "easeInOut",
          });
          console.log(`🔍 Zoom Out: ${currentZoomValue} → ${targetZoom}`);
        } else {
          console.log(`🔍 Zoom Out: Đã đạt giới hạn tối thiểu (10x)`);
        }
      } catch (e) {
        console.warn("Error zoom out:", e);
      }
    });
  }




  // (Legacy Model Picker logic removed - replaced by new Modal Picker)
  // Restore Globals needed for other parts of the app
  // activeModelInstance removed (redeclaration)
  let selectedModel: any = null;

  // (Legacy logic completely removed)

  // ============================================
  // Initialization for Globals
  inputName = document.getElementById("inp-model-name") as HTMLInputElement;
  inputDesc = document.getElementById("inp-model-desc") as HTMLInputElement;
  inputLat = document.getElementById("inp-lat") as HTMLInputElement;
  inputLon = document.getElementById("inp-lon") as HTMLInputElement;
  sliderRotX = document.getElementById("slider-rot-x") as HTMLInputElement;
  inputRotX = document.getElementById("inp-rot-x") as HTMLInputElement;
  sliderRotY = document.getElementById("slider-rot-y") as HTMLInputElement;
  inputRotY = document.getElementById("inp-rot-y") as HTMLInputElement;
  sliderRotZ = document.getElementById("slider-rot-z") as HTMLInputElement;
  inputRotZ = document.getElementById("inp-rot-z") as HTMLInputElement;
  sliderElevation = document.getElementById("slider-elevation") as HTMLInputElement;
  inputElevation = document.getElementById("inp-elevation") as HTMLInputElement;
  inputScaleX = document.getElementById("scale-x") as HTMLInputElement;
  inputScaleY = document.getElementById("scale-y") as HTMLInputElement;
  inputScaleZ = document.getElementById("scale-z") as HTMLInputElement;
  controlsPanel = document.getElementById("model-controls-panel");

  // Metadata Interface
  interface ModelMetadata {
    url: string;
    uuid: string;
    name: string;
    desc: string;
    rotation: number[];
    scale: number[];
    originalCoordinate: any;
    floorId?: string; // Add floorId explicitly
    thumb?: string; // Add thumb to metadata
    displayWebsite?: number | boolean; // 1/true = visible, 0/false = hidden
    elevation?: number; // Add vertical height
  }



  // Registry to track Models by ID (Mappedin ID -> Metadata)
  const MODEL_ID_REGISTRY = new Map<string, ModelMetadata>();
  const MODEL_INSTANCE_REGISTRY = new Map<string, any>(); // UUID -> Model Instance
  let isUpdating = false;

  // controlsPanel already initialized above

  // Use variables declared at start of init()
  btnDeleteModel = document.getElementById("btn-delete-model");
  btnCopyModel = document.getElementById("btn-copy-model");
  btnCutModel = document.getElementById("btn-cut-model");
  btnCloseControls = document.getElementById("btn-close-controls");


  // Helper: Create Marker HTML
  const createMarkerHTML = (name: string, uuid: string) => `
    <div class="custom-3d-label" onclick="window.selectModelByUUID('${uuid}')" 
         style="transition: opacity 0.3s ease; background: white; padding: 6px 10px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); font-size: 14px; font-weight: bold; cursor: pointer; white-space: nowrap; pointer-events: auto; z-index: 9999; border: 2px solid #007bff; color: #333;">
        ${name}
    </div>
  `;

  // Inject CSS for visibility toggle
  const visibilityStyle = document.createElement('style');
  visibilityStyle.textContent = `
    body.zoom-far .custom-3d-label {
      opacity: 0 !important;
      pointer-events: none !important;
    }

    /* Make main venue label (airport name) more prominent */
    .mappedin-label[data-venue-id],
    .mappedin-venue-label,
    div[class*="venue"] div[class*="label"],
    div[data-id*="venue"] {
      font-size: 32px !important;
      font-weight: 900 !important;
      color: #1a1a1a !important;
      text-shadow: 
        0 0 10px rgba(255, 255, 255, 1),
        0 0 20px rgba(255, 255, 255, 0.8),
        2px 2px 4px rgba(0, 0, 0, 0.5) !important;
      letter-spacing: 0.5px !important;
      z-index: 10000 !important;
      opacity: 1 !important;
    }

    /* Alternative selector for venue-level labels */
    canvas + div div[style*="position: absolute"] {
      font-size: 32px !important;
      font-weight: 900 !important;
      color: #1a1a1a !important;
      text-shadow: 
        0 0 10px rgba(255, 255, 255, 1),
        0 0 20px rgba(255, 255, 255, 0.8),
        2px 2px 4px rgba(0, 0, 0, 0.5) !important;
    }
  `;
  document.head.appendChild(visibilityStyle);

  // Helper: Debounce function for auto-update
  const debounce = (func: Function, wait: number) => {
    let timeout: any;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Helper: UUID Generator
  // Helper: UUID Generator (Prefix based on filename)
  const generateUUID = (prefix: string = "model") => {
    // Take first 4 chars of a random string for uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    // Cleanup prefix (remove .glb, spaces)
    const base = prefix.split('.')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `${base}-${randomSuffix}`;
  };

  // ============================================
  // API SERVICE
  // ============================================
  ApiService = {
    async getAllModels() {
      try {
        const res = await fetch(`${API_BASE_URL}/models`);
        if (!res.ok) throw new Error("Failed to fetch models");
        return await res.json();
      } catch (err) {
        console.error("API Get Error:", err);
        return [];
      }
    },

    // NEW: Get Available Models for Picker
    async getAvailableModels() {
      try {
        const response = await fetch(`${API_BASE_URL}/available-models`);
        if (!response.ok) return [];
        return await response.json();
      } catch (err) {
        console.error("API Error:", err);
        return [];
      }
    },

    async upsertModel(model: any) {
      try {
        await fetch(`${API_BASE_URL}/models`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(model)
        });
      } catch (err) {
        console.error("API Save Error:", err);
      }
    },

    async deleteModel(uuid: string) {
      try {
        await fetch(`${API_BASE_URL}/models/${uuid}`, { method: "DELETE" });
      } catch (err) {
        console.error("API Delete Error:", err);
      }
    },

    // AREA CLASSIFICATION METHODS
    async getCategories() {
      try {
        const res = await fetch(`${API_BASE_URL}/categories`);
        return await res.json();
      } catch (err) {
        console.error("API Get Categories Error:", err);
        return [];
      }
    },

    async syncAreas(areas: any[]) {
      try {
        await fetch(`${API_BASE_URL}/areas/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ areas })
        });
      } catch (err) {
        console.error("API Sync Areas Error:", err);
      }
    },

    async getSubCategoryLocations(id: string) {
      try {
        const res = await fetch(`${API_BASE_URL}/categories/subcategory/${id}/locations`);
        return await res.json();
      } catch (err) {
        return [];
      }
    },

    async assignLocations(subCatId: string, areaIds: string[]) {
      try {
        const res = await fetch(`${API_BASE_URL}/categories/subcategory/${subCatId}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ areaIds })
        });
        return await res.json();
      } catch (err) {
        return { error: err };
      }
    },

    async getAssignedAreas() {
      try {
        const res = await fetch(`${API_BASE_URL}/areas/assigned`);
        return await res.json();
      } catch (err) {
        return [];
      }
    },

    async getActiveCategories() {
      try {
        const res = await fetch(`${API_BASE_URL}/categories/active`);
        return await res.json();
      } catch (err) {
        return [];
      }
    }
  };

  // SYNC ALL MAP AREAS ON INIT
  const syncMapAreasToDB = async () => {
    try {
      // Use allMapObjects to ensure we sync Spaces, Locations, Points, etc.
      // This matches the logic in renderAreaAssignments
      const areas = allMapObjects
        .filter((o: any) => o.name) // Only sync named areas
        .map((o: any) => ({
          id: o.id,
          name: o.name,
          floorId: o.floor?.id || o.coordinate?.floorId || null
        }));

      console.log(`🔄 Syncing ${areas.length} areas to database...`);
      await ApiService.syncAreas(areas);
    } catch (e) {
      console.warn("Error syncing map areas:", e);
    }
  };

  syncMapAreasToDB();


  // Helper: Save SINGLE Model to API
  const saveModelToAPI = (meta: ModelMetadata) => {
    const coord = meta.originalCoordinate;
    if (!coord) return;

    // Helper: round rotation to 1 decimal (degrees), scale to 6 decimals (preserve tiny values like 0.002)
    const roundRotation = (nums: number[]) => nums.map(n => parseFloat(n.toFixed(1)));
    const roundScale = (nums: number[]) => nums.map(n => parseFloat(n.toFixed(6)));

    const payload = {
      uuid: meta.uuid,
      url: meta.url,
      name: meta.name,
      desc: meta.desc,
      latitude: coord.latitude,
      longitude: coord.longitude,
      floorId: meta.floorId || (coord as any).floorId,
      rotation: roundRotation(meta.rotation),
      scale: roundScale(meta.scale),
      displayWebsite: meta.displayWebsite || 0,
      thumb: meta.thumb, // Sync thumbnail to DB
      elevation: meta.elevation || 0
    };


    // Call API (No await needed involved in UI loop)
    ApiService.upsertModel(payload);
    console.log("💾 Synced to DB:", meta.uuid);
  };

  // Helper: Delete from API
  const deleteModelFromAPI = (uuid: string) => {
    ApiService.deleteModel(uuid);
    console.log("🗑 Deleted from DB (Soft Delete):", uuid);
  };

  // Replaces old saveModelsToStorage
  const saveModelsToStorage = () => {
    // Legacy function kept to prevent crash, but now does nothing or warns
    console.warn("saveModelsToStorage is deprecated. Use API sync.");
  };

  // Helper: Sync UI from Metadata (Clean [PUBLIC] for display)
  const syncUIFromModel = (meta: ModelMetadata) => {
    const PUBLIC_TAG = "[PUBLIC]";
    const clean = (s: string) => (s || "").replace(/\[PUBLIC\]/g, "").trim();

    if (inputName) inputName.value = clean(meta.name || "3D Model");
    if (inputDesc) inputDesc.value = clean(meta.desc || "");
    if (inpModelPublic) {
      inpModelPublic.checked = meta.displayWebsite == 1 || meta.displayWebsite === true;
    }



    const r = meta.rotation;
    if (inputRotX) inputRotX.value = (r[0] || 0) + "";
    if (sliderRotX) sliderRotX.value = (r[0] || 0) + "";
    if (inputRotY) inputRotY.value = (r[1] || 0) + "";
    if (sliderRotY) sliderRotY.value = (r[1] || 0) + "";
    if (inputRotZ) inputRotZ.value = (r[2] || 0) + "";
    if (sliderRotZ) sliderRotZ.value = (r[2] || 0) + "";

    if (inputElevation) inputElevation.value = (meta.elevation || 0) + "";
    if (sliderElevation) sliderElevation.value = (meta.elevation || 0) + "";

    const s = meta.scale;
    if (inputScaleX) inputScaleX.value = s[0] + "";
    if (inputScaleY) inputScaleY.value = s[1] + "";
    if (inputScaleZ) inputScaleZ.value = s[2] + "";

    if (inputLat) inputLat.value = meta.originalCoordinate.latitude.toFixed(6);
    if (inputLon) inputLon.value = meta.originalCoordinate.longitude.toFixed(6);
  };


  // Expose function for Marker Clicks
  (window as any).selectModelByUUID = (uuid: string) => {
    // Find model ID by UUID
    for (const [id, meta] of MODEL_ID_REGISTRY.entries()) {
      if (meta.uuid === uuid) {
        const model = MODEL_INSTANCE_REGISTRY.get(uuid); // Direct lookup
        if (model) {
          activeModelInstance = model;
          syncUIFromModel(meta);
          controlsPanel?.classList.remove("hidden");
        }
        return;
      }
    }
  };

  // ============================================
  // MULTI-SELECT HELPERS
  // ============================================

  /** Toggle a model in/out of multi-selection */
  const toggleMultiSelectModel = (modelInstance: any, meta: any) => {
    const uuid = meta.uuid;
    if (multiSelectedModels.has(uuid)) {
      // Deselect
      multiSelectedModels.delete(uuid);
      removeMultiSelectHighlight(modelInstance);
    } else {
      // Select
      multiSelectedModels.set(uuid, { instance: modelInstance, meta });
      addMultiSelectHighlight(modelInstance);
    }
    updateMultiSelectToolbar();
    console.log(`🔷 Multi-select: ${multiSelectedModels.size} models selected`);
  };

  /** Clear all multi-selections */
  const clearMultiSelect = () => {
    for (const [, { instance }] of multiSelectedModels) {
      removeMultiSelectHighlight(instance);
    }
    multiSelectedModels.clear();
    updateMultiSelectToolbar();
  };

  /** Add visual highlight (blue tint) to a multi-selected model */
  const addMultiSelectHighlight = (modelInstance: any) => {
    try {
      // Create a highlight marker at the model's position
      const coord = (modelInstance as any).originalCoordinate || (modelInstance as any).coordinate;
      if (coord && mapView.Markers) {
        const markerHtml = `<div class="multi-select-indicator" style="
          width: 24px; height: 24px; 
          background: rgba(8, 94, 187, 0.85); 
          border: 3px solid #fff; 
          border-radius: 50%; 
          box-shadow: 0 0 12px rgba(8, 94, 187, 0.6), 0 0 24px rgba(8, 94, 187, 0.3);
          display: flex; align-items: center; justify-content: center;
          pointer-events: none;
          animation: multiSelectPulse 1.5s infinite;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
            <polyline points="20 6 9 17 4 12" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>`;
        const marker = mapView.Markers.add(coord, markerHtml, { interactive: false });
        (modelInstance as any)._multiSelectMarker = marker;
      }
    } catch (e) {
      console.warn("Could not add multi-select highlight", e);
    }
  };

  /** Remove visual highlight from a model */
  const removeMultiSelectHighlight = (modelInstance: any) => {
    try {
      if ((modelInstance as any)._multiSelectMarker) {
        mapView.Markers.remove((modelInstance as any)._multiSelectMarker);
        delete (modelInstance as any)._multiSelectMarker;
      }
    } catch (e) { }
  };

  /** Update the multi-select floating toolbar visibility and count */
  const updateMultiSelectToolbar = () => {
    let toolbar = document.getElementById('multi-select-toolbar');
    if (!toolbar) {
      // Create toolbar
      toolbar = document.createElement('div');
      toolbar.id = 'multi-select-toolbar';
      toolbar.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; background:rgba(8,94,187,0.95); color:white; padding:10px 18px; border-radius:14px; box-shadow:0 8px 30px rgba(0,0,0,0.3); backdrop-filter:blur(12px); font-family:inherit; font-size:13px; font-weight:600; white-space:nowrap; user-select:none;">
          <span id="multi-select-count" style="background:rgba(255,255,255,0.2); padding:4px 10px; border-radius:8px; min-width:20px; text-align:center;"></span>
          <span>đã chọn</span>
          <div style="width:1px; height:22px; background:rgba(255,255,255,0.3);"></div>
          
          <!-- Nudge controls -->
          <div style="display:flex; gap:2px; background:rgba(0,0,0,0.2); border-radius:8px; padding:4px;">
            <button id="btn-multi-move-up" title="Lên" style="background:none; border:none; color:white; cursor:pointer; border-radius:4px; padding:2px; display:flex; align-items:center; justify-content:center;" onmouseenter="this.style.background='rgba(255,255,255,0.2)'" onmouseleave="this.style.background='none'">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
            </button>
            <button id="btn-multi-move-down" title="Xuống" style="background:none; border:none; color:white; cursor:pointer; border-radius:4px; padding:2px; display:flex; align-items:center; justify-content:center;" onmouseenter="this.style.background='rgba(255,255,255,0.2)'" onmouseleave="this.style.background='none'">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <button id="btn-multi-move-left" title="Trái" style="background:none; border:none; color:white; cursor:pointer; border-radius:4px; padding:2px; display:flex; align-items:center; justify-content:center;" onmouseenter="this.style.background='rgba(255,255,255,0.2)'" onmouseleave="this.style.background='none'">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button id="btn-multi-move-right" title="Phải" style="background:none; border:none; color:white; cursor:pointer; border-radius:4px; padding:2px; display:flex; align-items:center; justify-content:center;" onmouseenter="this.style.background='rgba(255,255,255,0.2)'" onmouseleave="this.style.background='none'">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          <div style="width:1px; height:22px; background:rgba(255,255,255,0.3);"></div>
          
          <button id="btn-multi-copy" title="Copy tất cả" style="background:rgba(255,255,255,0.15); border:none; color:white; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; display:flex; align-items:center; gap:4px; transition:background 0.2s;"
            onmouseenter="this.style.background='rgba(255,255,255,0.3)'" onmouseleave="this.style.background='rgba(255,255,255,0.15)'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
            Copy
          </button>
          <button id="btn-multi-cut" title="Cut (di chuyển) tất cả" style="background:rgba(255,255,255,0.15); border:none; color:white; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; display:flex; align-items:center; gap:4px; transition:background 0.2s;"
            onmouseenter="this.style.background='rgba(255,255,255,0.3)'" onmouseleave="this.style.background='rgba(255,255,255,0.15)'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
            Cut
          </button>
          <button id="btn-multi-delete" title="Xóa tất cả" style="background:rgba(220,50,50,0.8); border:none; color:white; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; display:flex; align-items:center; gap:4px; transition:background 0.2s;"
            onmouseenter="this.style.background='rgba(220,50,50,1)'" onmouseleave="this.style.background='rgba(220,50,50,0.8)'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Xóa
          </button>
          <div style="width:1px; height:22px; background:rgba(255,255,255,0.3);"></div>
          <button id="btn-multi-deselect" title="Bỏ chọn tất cả" style="background:rgba(255,255,255,0.15); border:none; color:white; padding:6px 8px; border-radius:8px; cursor:pointer; display:flex; align-items:center; transition:background 0.2s;"
            onmouseenter="this.style.background='rgba(255,255,255,0.3)'" onmouseleave="this.style.background='rgba(255,255,255,0.15)'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
      toolbar.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); z-index:20000; display:none; animation:multiToolbarSlideUp 0.3s ease;';
      document.body.appendChild(toolbar);

      // Inject animation CSS
      if (!document.getElementById('multi-select-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'multi-select-styles';
        styleEl.textContent = `
          @keyframes multiSelectPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.8; }
          }
          @keyframes multiToolbarSlideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
          .multi-place-cursor {
            position: fixed;
            pointer-events: none;
            z-index: 20001;
            background: rgba(8, 94, 187, 0.9);
            color: white;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            white-space: nowrap;
          }
        `;
        document.head.appendChild(styleEl);
      }

      // Attach event handlers
      document.getElementById('btn-multi-copy')!.addEventListener('click', () => startMultiPlace('copy'));
      document.getElementById('btn-multi-cut')!.addEventListener('click', () => startMultiPlace('move'));
      document.getElementById('btn-multi-delete')!.addEventListener('click', handleMultiDelete);
      document.getElementById('btn-multi-deselect')!.addEventListener('click', clearMultiSelect);

      document.getElementById('btn-multi-move-up')!.addEventListener('click', () => nudgeMultiSelectModels('up'));
      document.getElementById('btn-multi-move-down')!.addEventListener('click', () => nudgeMultiSelectModels('down'));
      document.getElementById('btn-multi-move-left')!.addEventListener('click', () => nudgeMultiSelectModels('left'));
      document.getElementById('btn-multi-move-right')!.addEventListener('click', () => nudgeMultiSelectModels('right'));
    }

    const count = multiSelectedModels.size;
    const countEl = document.getElementById('multi-select-count');
    if (countEl) countEl.textContent = count + '';
    toolbar.style.display = count > 0 ? 'block' : 'none';
  };

  // ============================================
  // PROFESSIONAL MODEL STREAMING ARCHITECTURE
  // ============================================

  /**
   * Entry point để kích hoạt stream models cho một tầng
   */
  const _loadModelsForFloor = async (floorId: string) => {
    console.log(`🌐 [STREAMING] Activating model stream for floor: ${floorId}`);
    _loadedFloors.add(floorId);
    (window as any).updateModelStreaming(); // Kích hoạt ngay lập tức
  };

  /**
   * Helper để load từng model vào Map (Dùng nội bộ cho Streaming)
   */
  const _addSingleModelToMap = async (m: any) => {
    if (MODEL_INSTANCE_REGISTRY.has(m.uuid)) return;

    // 1. CHUẨN HÓA SỐ ĐỂ TRÁNH LỖI UNDEFINED
    const lat = Number(m.latitude);
    const lon = Number(m.longitude);
    if (isNaN(lat) || isNaN(lon)) return;

    const floors = mapData.getByType("floor");
    let targetFloor = floors.find((f: any) => f.id === m.floorId);
    if (!targetFloor) return;

    try {
      const coord = mapView.createCoordinate(lat, lon, targetFloor);
      if (!coord) return;

      // 2. PARSE SCALE/ROTATION
      let s = m.scale;
      if (typeof s === 'string') try { s = JSON.parse(s); } catch (e) { }
      let r = m.rotation;
      if (typeof r === 'string') try { r = JSON.parse(r); } catch (e) { }

      const modelAssetMap: Record<string, any> = { "car": car, "tree_palm": tree_palm, "three_palm": tree_palm };
      let finalUrl = m.url;
      if (!finalUrl) return;

      if (modelAssetMap[finalUrl]) {
        finalUrl = modelAssetMap[finalUrl];
      } else if (finalUrl.startsWith("./")) {
        finalUrl = finalUrl.replace("./", `${SERVER_URL}/`);
      } else if (!finalUrl.startsWith("http")) {
        finalUrl = `${SERVER_URL}${finalUrl.startsWith("/") ? "" : "/"}${finalUrl}`;
      }

      // 3. CHỐNG CACHE FILE LỖI
      const cacheBustedUrl = `${finalUrl}?v=${Date.now()}`;

      // 4. CHỐNG TRÀN BUFFER GPU: Tắt tương tác cho cây cối
      const modelName = (m.name || "").toLowerCase();
      const isDeco = modelName.includes('cây') || modelName.includes('vườn') || modelName.includes('thảm') || modelName.includes('tree') || modelName.includes('plant') || modelName.includes('palm') || modelName.includes('floral') || modelName.includes('cỏ');

      console.log(`📡 [STREAMING] Loading: ${m.name || m.uuid}`);

      const model = await mapView.Models.add(coord, cacheBustedUrl, {
        rotation: r || [0, 0, 0],
        scale: s || [1, 1, 1],
        interactive: !isDeco, // Cây cối không cần click
        verticalOffset: Number(m.elevation) || 0
      });

      MODEL_ID_REGISTRY.set(model.id, {
        url: m.url, uuid: m.uuid, name: m.name, desc: m.desc || "",
        rotation: r, scale: s,
        originalCoordinate: coord,
        floorId: m.floorId,
        elevation: m.elevation || 0
      });

      MODEL_INSTANCE_REGISTRY.set(m.uuid, model);
      return model;
    } catch (err) {
      console.error(`❌ [STREAMING] Failed to load model ${m.uuid}:`, err);
    }
  };

  /**
   * Cập nhật hiển thị models dựa trên khoảng cách Camera (Streaming)
   * Thuật toán tải động giúp hiển thị được cả 166 models mà không sập WebGL
   */
  const updateModelStreaming = debounce(async () => {
    const currentFloor = mapView.currentFloor;
    if (!currentFloor) return;

    const floorName = (currentFloor.name || "").toLowerCase();
    const focalPoint = (mapView.Camera as any).center;
    if (!focalPoint) return;

    const currentZoom = getCameraZoom() || 0;

    // THIẾT LẬP NGƯỠNG (Điều chỉnh Unload 18.5 theo yêu cầu)
    const ZOOM_LOAD_THRESHOLD = 19.0;
    const ZOOM_UNLOAD_THRESHOLD = 18.5; // Đệm 0.5 đơn vị zoom
    const LOAD_RADIUS = 300;
    const UNLOAD_RADIUS = 320;
    const MAX_CONCURRENT_MODELS = 150;

    console.log(`📡 [STREAMING] Current Zoom: ${currentZoom.toFixed(2)} (Target > ${ZOOM_LOAD_THRESHOLD})`);

    // Xác định tầng dưới để giữ Thang máy/Thang cuốn liên thông
    const sortedFloors = [...mapData.getByType("floor")].sort((a, b) => (a as any).elevation - (b as any).elevation);
    const currentIndex = sortedFloors.findIndex(f => f.id === currentFloor.id);
    const lowerFloorIds = new Set(currentIndex > 0 ? sortedFloors.slice(0, currentIndex).map(f => f.id) : []);

    const isThang = (obj: any) => {
      if (!obj) return false;
      
      // 1. Kiểm tra tên Tiếng Việt (VN) gốc trong Database (Nguồn dữ liệu tin cậy nhất)
      const id = obj.uuid || obj.id || obj.mappedinId;
      if (id) {
        const locData = TranslationManager.data.locations?.[id];
        const vnName = (locData?.names?.['vn'] || "").toLowerCase();
        // Kiểm tra từ khóa "thang" để bao quát thang máy, thang cuốn, thang bộ...
        if (vnName.includes("thang") || vnName.includes("elevator") || vnName.includes("escalator")) return true;
      }

      // 2. Kiểm tra tên hiện tại (Dự phòng)
      const name = (typeof obj === 'string') ? obj : (obj.name || "");
      const s = name.toLowerCase();
      if (s.includes("thang") || s.includes("escalator") || s.includes("elevator") || s.includes("stair")) return true;
      
      return false;
    };

    // 1. Tự động dọn dẹp các model xa hoặc sai tầng
    for (const [uuid, instance] of MODEL_INSTANCE_REGISTRY.entries()) {
      const meta = [...MODEL_ID_REGISTRY.values()].find(m => m.uuid === uuid);
      if (!meta || !meta.originalCoordinate) {
        try { mapView.Models.remove(instance); MODEL_INSTANCE_REGISTRY.delete(uuid); } catch (e) { }
        continue;
      }

      const dist = calculateDistance(focalPoint, { latitude: meta.originalCoordinate.latitude, longitude: meta.originalCoordinate.longitude });
      const isCurrentFloor = meta.floorId === currentFloor.id;
      const isVerticalOnLowerFloor = lowerFloorIds.has(meta.floorId) && isThang(meta);

      // LOGIC XÓA MẠNH TAY:
      const shouldUnloadDueToZoom = currentZoom < ZOOM_UNLOAD_THRESHOLD && !isThang(meta);
      const shouldUnloadDueToDist = !isThang(meta) && dist > UNLOAD_RADIUS;

      if (!isCurrentFloor && !isVerticalOnLowerFloor || shouldUnloadDueToZoom || shouldUnloadDueToDist) {
        try { mapView.Models.remove(instance); MODEL_INSTANCE_REGISTRY.delete(uuid); } catch (e) { }
      }
    }

    // 2. LỌC DANH SÁCH TIỀM NĂNG
    const candidateModels = _allModelMetadata.filter((m: any) => {
      if (isViewOnly) {
        const shouldShow = m.displayWebsite == 1 || m.displayWebsite === true;
        if (!shouldShow) return false;
      }
      const isCurrent = m.floorId === currentFloor.id;
      const isVerticalOnLowerFloor = lowerFloorIds.has(m.floorId) && isThang(m);
      return isCurrent || isVerticalOnLowerFloor;
    });

    const modelsToLoad: any[] = [];
    candidateModels.forEach((m: any) => {
      const isVertical = isThang(m);
      const dist = calculateDistance(focalPoint, { latitude: Number(m.latitude), longitude: Number(m.longitude) });
      const isLoaded = MODEL_INSTANCE_REGISTRY.has(m.uuid);

      // Thang luôn load (bất chấp zoom/distance), model khác thì theo luật
      const shouldLoad = isVertical || (currentZoom >= ZOOM_LOAD_THRESHOLD && dist <= LOAD_RADIUS);

      if (shouldLoad && !isLoaded) {
        modelsToLoad.push(m);
      }
    });

    if (modelsToLoad.length > 0 && currentZoom >= ZOOM_LOAD_THRESHOLD) {
      console.log(`📦 [STREAMING] Queueing ${modelsToLoad.length} new models to load...`);
    } else if (modelsToLoad.length > 0) {
      console.log(`📡 [STREAMING] Priority load: ${modelsToLoad.length} vertical assets`);
    }

    // 4. Thực hiện Load mới theo thứ tự ưu tiên gần nhất
    if (modelsToLoad.length > 0) {
      modelsToLoad.sort((a, b) => {
        const dA = calculateDistance(focalPoint, { latitude: Number(a.latitude), longitude: Number(a.longitude) });
        const dB = calculateDistance(focalPoint, { latitude: Number(b.latitude), longitude: Number(b.longitude) });
        return dA - dB;
      });

      const BATCH_SIZE = 3;
      for (let i = 0; i < modelsToLoad.length; i += BATCH_SIZE) {
        if (MODEL_INSTANCE_REGISTRY.size >= MAX_CONCURRENT_MODELS) break;
        const batch = modelsToLoad.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(m => _addSingleModelToMap(m)));
        await new Promise(r => setTimeout(r, 50));
      }
    }
  }, 300);

  (window as any).updateModelStreaming = updateModelStreaming;
  mapView.on("camera-change", updateModelStreaming);

  /** Nudge selected models in a direction */
  const nudgeMultiSelectModels = async (direction: 'up' | 'down' | 'left' | 'right') => {
    if (multiSelectedModels.size === 0) return;
    const step = 0.000005;
    let dLat = 0, dLon = 0;
    if (direction === 'up') dLat = step;
    else if (direction === 'down') dLat = -step;
    else if (direction === 'left') dLon = -step;
    else if (direction === 'right') dLon = step;

    for (const [uuid, data] of multiSelectedModels) {
      const meta = data.meta;
      const oldInstance = data.instance;
      if (!oldInstance || !meta || !meta.originalCoordinate) continue;

      const newLat = meta.originalCoordinate.latitude + dLat;
      const newLon = meta.originalCoordinate.longitude + dLon;
      // Get current floor from globals correctly or fallback
      let currentFloor = mapView.currentFloor;
      if (typeof mapData !== 'undefined' && typeof mapData.getByType === 'function') {
        const floorData = mapData.getByType("floor").find((f: any) => f.id === (meta.floorId || mapView.currentFloor.id));
        if (floorData) currentFloor = floorData;
      }

      const newCoord = mapView.createCoordinate(newLat, newLon, currentFloor);
      meta.originalCoordinate = newCoord;

      const newRot = meta.rotation || [0, 0, 0];
      const newScale = meta.scale || [1, 1, 1];
      const oldId = oldInstance.id;
      const url = oldInstance.url || meta.url;

      try {
        const newInstance = await mapView.Models.add(newCoord, url, {
          interactive: true,
          scale: newScale,
          rotation: newRot,
          verticalOffset: meta.elevation || 0
        });

        // Attach properties
        (newInstance as any).uuid = uuid;
        (newInstance as any).url = url;
        (newInstance as any).originalCoordinate = newCoord;

        // Swap in Registry
        MODEL_ID_REGISTRY.delete(oldId);
        MODEL_ID_REGISTRY.set(newInstance.id, meta);
        MODEL_INSTANCE_REGISTRY.set(uuid, newInstance);

        // Update multi-select struct
        data.instance = newInstance;

        // Remove old after new is added
        try {
          mapView.Models.remove(oldInstance);
          removeMultiSelectHighlight(oldInstance);
        } catch (e) { }

        // Add highlight to new one
        addMultiSelectHighlight(newInstance);

        // Background save
        // We do saveModelToAPI(meta) without await to avoid lag
        if (typeof saveModelToAPI === 'function') {
          saveModelToAPI(meta);
        } else if (typeof debouncedSaveToAPI === 'function') {
          (debouncedSaveToAPI as any)(meta);
        }

      } catch (e) {
        console.error("Nudge failed for", uuid, e);
      }
    }
  };

  /** Start multi-model placement (copy or move) */
  const startMultiPlace = (mode: 'copy' | 'move') => {
    if (multiSelectedModels.size === 0) return;

    multiPlaceMode = mode;
    isMultiPlacingMode = true;
    multiPlaceAnchorSet = false;

    // Calculate center of all selected models (anchor point)
    let sumLat = 0, sumLon = 0;
    const models: { meta: any; instance: any }[] = [];
    for (const [, data] of multiSelectedModels) {
      const coord = data.meta.originalCoordinate;
      if (coord) {
        sumLat += coord.latitude;
        sumLon += coord.longitude;
        models.push(data);
      }
    }
    const anchorLat = sumLat / models.length;
    const anchorLon = sumLon / models.length;

    // Build offset array relative to anchor
    multiPlaceSourceModels = models.map(({ meta }) => ({
      meta: { ...meta },
      offsetLat: meta.originalCoordinate.latitude - anchorLat,
      offsetLon: meta.originalCoordinate.longitude - anchorLon
    }));

    // If mode is 'move', hide originals
    if (mode === 'move') {
      for (const [, data] of multiSelectedModels) {
        try {
          if (typeof data.instance.hide === 'function') {
            data.instance.hide();
          } else {
            mapView.Models.remove(data.instance);
          }
        } catch (e) { }
      }
    }

    // Close controls panel, clear single selection
    controlsPanel?.classList.add("hidden");
    activeModelInstance = null;

    // Add placing mode visual
    document.body.classList.add("placing-mode");

    // Create cursor hint
    let cursorHint = document.getElementById('multi-place-cursor');
    if (!cursorHint) {
      cursorHint = document.createElement('div');
      cursorHint.id = 'multi-place-cursor';
      cursorHint.className = 'multi-place-cursor';
      document.body.appendChild(cursorHint);
    }
    cursorHint.textContent = `📦 ${mode === 'copy' ? 'Copy' : 'Move'} ${multiPlaceSourceModels.length} model — Click để đặt`;
    cursorHint.style.display = 'block';

    // Track mouse for cursor hint
    const mouseHandler = (e: MouseEvent) => {
      if (cursorHint) {
        cursorHint.style.left = (e.clientX + 20) + 'px';
        cursorHint.style.top = (e.clientY + 20) + 'px';
      }
    };
    document.addEventListener('mousemove', mouseHandler);
    (window as any)._multiPlaceMouseHandler = mouseHandler;

    // Listen for Escape to cancel
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanupMultiPlaceMode();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    (window as any)._multiPlaceEscHandler = escHandler;

    console.log(`🔷 Multi-place started: ${mode} ${multiPlaceSourceModels.length} models`);
  };

  /** Cleanup multi-placement mode */
  const cleanupMultiPlaceMode = () => {
    isMultiPlacingMode = false;
    multiPlaceSourceModels = [];
    multiPlaceAnchorSet = false;
    document.body.classList.remove("placing-mode");

    // Remove cursor hint
    const cursorHint = document.getElementById('multi-place-cursor');
    if (cursorHint) {
      cursorHint.style.display = 'none';
    }

    // Remove mouse handler
    if ((window as any)._multiPlaceMouseHandler) {
      document.removeEventListener('mousemove', (window as any)._multiPlaceMouseHandler);
      (window as any)._multiPlaceMouseHandler = null;
    }

    // Remove esc handler
    if ((window as any)._multiPlaceEscHandler) {
      document.removeEventListener('keydown', (window as any)._multiPlaceEscHandler);
      (window as any)._multiPlaceEscHandler = null;
    }

    // Remove preview models
    for (const preview of multiPlacePreviewModels) {
      try { mapView.Models.remove(preview); } catch (e) { }
    }
    multiPlacePreviewModels.length = 0;

    clearMultiSelect();
  };

  /** Handle multi-delete */
  const handleMultiDelete = () => {
    if (multiSelectedModels.size === 0) return;
    if (!confirm(`Bạn có chắc muốn xóa ${multiSelectedModels.size} model đã chọn?`)) return;

    for (const [uuid, data] of multiSelectedModels) {
      try {
        const oldId = (data.instance as any).id;
        // Remove marker
        if ((data.instance as any).marker) {
          mapView.Markers.remove((data.instance as any).marker);
        }
        // Remove highlight marker
        removeMultiSelectHighlight(data.instance);
        // Remove from map
        mapView.Models.remove(data.instance);
        // Remove from registries
        MODEL_ID_REGISTRY.delete(oldId);
        MODEL_INSTANCE_REGISTRY.delete(uuid);
        // Delete from API
        deleteModelFromAPI(uuid);
      } catch (e) {
        console.warn(`Failed to delete model ${uuid}:`, e);
      }
    }

    console.log(`🗑 Multi-delete: Removed ${multiSelectedModels.size} models`);
    multiSelectedModels.clear();
    updateMultiSelectToolbar();
    controlsPanel?.classList.add("hidden");
    activeModelInstance = null;
  };

  // ============================================
  // LOAD MODELS FROM API (LAZY LOADING BY FLOOR)
  // ============================================
  const loadModelsFromAPI = async () => {
    try {
      // Đảm bảo mapView đã sẵn sàng
      if (!mapView) {
        console.warn("⚠️ MapView not ready, delaying model load...");
        setTimeout(loadModelsFromAPI, 1000);
        return;
      }

      console.log("📥 Loading model metadata from API...");
      const models = await ApiService.getAllModels();

      if (!models || models.length === 0) {
        console.log("🆕 Empty DB - No models to load.");
        return;
      }

      _allModelMetadata = models;
      console.log(`📦 Cached ${models.length} model metadata from DB`);

      // Khởi động load cho tầng hiện tại (delay nhẹ để map render xong floor plan)
      setTimeout(async () => {
        const currentFloorId = mapView.currentFloor?.id;
        if (currentFloorId) {
          await _loadModelsForFloor(currentFloorId);
        }
      }, 1000);

    } catch (e) {
      console.error("❌ Error loading from API:", e);
    }
  };

  // HỆ THỐNG MODEL STREAMING ĐÃ ĐƯỢC KÍCH HOẠT Ở TRÊN
  // ĐOẠN CODE CŨ ĐÃ ĐƯỢC LOẠI BỎ ĐỂ TRÁNH TRÙNG LẶP BIẾN.

  // ============================================
  // OVERVIEW MODELS PERSISTENCE ACROSS FLOORS
  // ============================================
  // Mappedin SDK hides models when they belong to a different floor.
  // .show() does NOT override this behavior.
  // SOLUTION: Create temporary "shadow copies" of Overview models on the current floor.
  // When floor changes, remove old shadows and create new ones.

  const overviewShadowInstances: any[] = []; // Track shadow copies for cleanup

  const showOverviewModelsOnAllFloors = async () => {
    const overviewId = overviewFloor?.id;
    if (!overviewId) return;

    const currentFloorId = mapView.currentFloor.id;

    // Step 1: Remove ALL existing shadow copies from previous floor
    for (const shadow of overviewShadowInstances) {
      try {
        mapView.Models.remove(shadow);
      } catch (e) { /* already removed or invalid */ }
    }
    overviewShadowInstances.length = 0; // Clear array

    // Step 2: If we ARE on Overview, originals are shown by SDK - no shadows needed
    if (currentFloorId === overviewId) {
      console.log(`✈️ On Overview floor - originals visible, no shadows needed.`);
      return;
    }

    // Step 3: For each model on the Overview floor, create a shadow copy on the CURRENT floor
    const currentFloor = mapView.currentFloor;
    let shadowCount = 0;

    // Collect Overview models first (iterate registry)
    const overviewModels: { meta: any; instance: any }[] = [];
    MODEL_ID_REGISTRY.forEach((meta) => {
      if (meta.floorId !== overviewId) return;
      const instance = MODEL_INSTANCE_REGISTRY.get(meta.uuid);
      if (!instance) return;
      overviewModels.push({ meta, instance });
    });

    for (const { meta, instance } of overviewModels) {
      try {
        // Create coordinate on CURRENT floor (same lat/lon, different floor)
        const origCoord = meta.originalCoordinate;
        if (!origCoord) continue;

        const shadowCoord = mapView.createCoordinate(
          origCoord.latitude,
          origCoord.longitude,
          currentFloor
        );

        // Resolve URL (same as original)
        let shadowUrl = (instance as any).url || meta.url;
        const modelAssetMap: Record<string, any> = {
          "car": car,
          "three_palm": tree_palm,
          "tree_palm": tree_palm
        };
        if (modelAssetMap[shadowUrl]) {
          shadowUrl = modelAssetMap[shadowUrl];
        } else if (shadowUrl && shadowUrl.startsWith("./")) {
          shadowUrl = shadowUrl.replace("./", `${SERVER_URL}/`);
        } else if (shadowUrl && !shadowUrl.startsWith("http")) {
          shadowUrl = `${SERVER_URL}/${shadowUrl}`;
        }

        const shadowModel = await mapView.Models.add(shadowCoord, shadowUrl, {
          interactive: false, // Shadow copies are NOT interactive (prevents click conflicts)
          scale: meta.scale,
          rotation: meta.rotation,
          verticalOffset: meta.elevation || 0
        });

        // Tag it as shadow
        (shadowModel as any)._isShadow = true;
        (shadowModel as any)._sourceUUID = meta.uuid;

        overviewShadowInstances.push(shadowModel);
        shadowCount++;
      } catch (e) {
        console.warn(`Could not create shadow for Overview model ${meta.uuid}:`, e);
      }
    }

    if (shadowCount > 0) {
      console.log(`✈️ Created ${shadowCount} shadow copies of Overview models on floor: ${currentFloorId}`);
    }
  };

  // Expose globally for floor-change handler
  (window as any).syncModelInstancesVisibility = showOverviewModelsOnAllFloors;

  // Helper: Update Model Transform
  // NEW: Debounced API Save
  const debouncedSaveToAPI = debounce((meta: ModelMetadata) => {
    console.log("💾 Debounced save to API for model:", meta.uuid);
    saveModelToAPI(meta);
  }, 1000);

  // Helper: Update Model Transform (Reliable Live logic)
  let isUpdatingTransform = false;
  let pendingTransformUpdate: { isLive: boolean; forceAPI: boolean } | null = null;
  const updateModelTransform = async (isLive = false, forceAPI = false) => {
    if (!activeModelInstance) return;

    // If already updating, queue the latest request to run after current finishes
    if (isUpdatingTransform) {
      pendingTransformUpdate = { isLive, forceAPI };
      return;
    }

    const oldId = (activeModelInstance as any).id;
    const meta = MODEL_ID_REGISTRY.get(oldId);
    if (!meta) return;

    const currentUUID = meta.uuid;
    const url = (activeModelInstance as any).url || meta.url;

    const angleX = parseFloat(inputRotX?.value || "0") || 0;
    const angleY = parseFloat(inputRotY?.value || "0") || 0;
    const angleZ = parseFloat(inputRotZ?.value || "0") || 0;
    const newRot: [number, number, number] = [angleX, angleY, angleZ];

    const elevationVal = parseFloat(inputElevation?.value || "0") || 0;

    const newScale: [number, number, number] = [
      parseFloat(inputScaleX?.value || "1") || 1,
      parseFloat(inputScaleY?.value || "1") || 1,
      parseFloat(inputScaleZ?.value || "1") || 1
    ];

    let newLat = parseFloat(inputLat?.value || "0");
    let newLon = parseFloat(inputLon?.value || "0");
    if (isNaN(newLat)) newLat = meta.originalCoordinate.latitude;
    if (isNaN(newLon)) newLon = meta.originalCoordinate.longitude;

    const currentFloor = mapData.getByType("floor").find((f: any) => f.id === (meta.floorId || mapView.currentFloor.id)) || mapView.currentFloor;
    const newCoord = mapView.createCoordinate(newLat, newLon, currentFloor);


    // Metadata update (always)
    const newName = inputName?.value || "";
    const newDescInput = inputDesc?.value || "";
    let finalDesc = newDescInput;
    if (inpModelPublic?.checked) {
      if (!finalDesc.includes("[PUBLIC]")) finalDesc = (finalDesc + " [PUBLIC]").trim();
    } else {
      finalDesc = finalDesc.replace(/\[PUBLIC\]/g, "").trim();
    }


    const newMeta: ModelMetadata = {
      ...meta,
      name: newName,
      desc: finalDesc,
      displayWebsite: inpModelPublic?.checked ? 1 : 0,
      rotation: newRot,
      scale: newScale,
      originalCoordinate: newCoord,
      floorId: currentFloor.id,
      elevation: elevationVal
    };

    // Check if position actually changed (lat/lon)
    const oldLat = meta.originalCoordinate?.latitude ?? 0;
    const oldLon = meta.originalCoordinate?.longitude ?? 0;
    const positionChanged = Math.abs(newLat - oldLat) > 0.0000001 || Math.abs(newLon - oldLon) > 0.0000001;

    isUpdatingTransform = true;
    try {
      if (!positionChanged) {
        // FAST PATH: Use updateState for rotation/scale only (no remove+add = no flicker!)
        try {
          mapView.updateState(activeModelInstance, {
            rotation: newRot,
            scale: newScale,
            verticalOffset: elevationVal
          });
        } catch (e) {
          console.warn("updateState failed, falling back to remove+add", e);
          // Fallback to remove+add if updateState doesn't work for this model type
          await replaceModelInstance(activeModelInstance, newCoord, url, newRot, newScale, currentUUID, oldId, newMeta);
        }

        // Update registry metadata
        MODEL_ID_REGISTRY.set(oldId, newMeta);
        MODEL_INSTANCE_REGISTRY.set(currentUUID, activeModelInstance);
      } else {
        // SLOW PATH: Position changed, must remove+add to reposition
        await replaceModelInstance(activeModelInstance, newCoord, url, newRot, newScale, currentUUID, oldId, newMeta);
      }

      // Persistence
      if (forceAPI) {
        saveModelToAPI(newMeta);
      } else {
        debouncedSaveToAPI(newMeta);
      }
    } catch (e) {

      console.warn("Transform update failed", e);
    } finally {
      isUpdatingTransform = false;

      // If there was a pending update while we were busy, apply it now
      if (pendingTransformUpdate) {
        const pending = pendingTransformUpdate;
        pendingTransformUpdate = null;
        updateModelTransform(pending.isLive, pending.forceAPI);
      }
    }
  };

  // Helper: Replace model instance (remove old + add new) - used only when position changes
  const replaceModelInstance = async (
    oldInstance: any, newCoord: any, url: string,
    newRot: [number, number, number], newScale: [number, number, number],
    currentUUID: string, oldId: string, newMeta: any
  ) => {
    const newInstance = await mapView.Models.add(newCoord, url, {
      interactive: true,
      scale: newScale,
      rotation: newRot,
      verticalOffset: newMeta.elevation || 0
    });

    // Attach same properties
    (newInstance as any).uuid = currentUUID;
    (newInstance as any).url = url;
    (newInstance as any).originalCoordinate = newCoord;

    // Swap in Registry
    MODEL_ID_REGISTRY.delete(oldId);
    MODEL_ID_REGISTRY.set(newInstance.id, newMeta);
    MODEL_INSTANCE_REGISTRY.set(currentUUID, newInstance);

    // Safety: Only update activeModelInstance if it hasn't been cleared/changed
    if (activeModelInstance === oldInstance) {
      activeModelInstance = newInstance;
    }

    // Remove old instance AFTER new one is visible
    mapView.Models.remove(oldInstance);
  };


  // Debounced/Immediate Input Handlers
  const debouncedUpdate = debounce(() => updateModelTransform(false), 300);

  if (inputLat) inputLat.addEventListener("input", () => updateModelTransform(true));
  if (inputLon) inputLon.addEventListener("input", () => updateModelTransform(true));

  // Improved Slider Logic with RAF throttling for smooth rotation
  let sliderRAFPending = false;
  const bindSlider = (slider: HTMLInputElement, input: HTMLInputElement) => {
    slider.addEventListener("input", () => {
      input.value = slider.value;
      // Throttle updates to once per animation frame for smooth dragging
      if (!sliderRAFPending) {
        sliderRAFPending = true;
        requestAnimationFrame(() => {
          sliderRAFPending = false;
          updateModelTransform(true);
        });
      }
    });

    input.addEventListener("input", () => {
      slider.value = input.value;
      updateModelTransform(true);
    });

  };

  if (sliderRotX && inputRotX) bindSlider(sliderRotX, inputRotX);
  if (sliderRotY && inputRotY) bindSlider(sliderRotY, inputRotY);
  if (sliderRotZ && inputRotZ) bindSlider(sliderRotZ, inputRotZ);
  if (sliderElevation && inputElevation) bindSlider(sliderElevation, inputElevation);

  if (inputScaleX) inputScaleX.addEventListener("input", () => updateModelTransform(true));
  if (inputScaleY) inputScaleY.addEventListener("input", () => updateModelTransform(true));
  if (inputScaleZ) inputScaleZ.addEventListener("input", () => updateModelTransform(true));


  // Save metadata on input (Real-time debounced)
  if (inputName) inputName.addEventListener("input", debouncedUpdate);
  if (inputDesc) inputDesc.addEventListener("input", debouncedUpdate);
  if (inpModelPublic) inpModelPublic.addEventListener("change", () => updateModelTransform(true));


  // Force Save on Close Button
  // Force Save on Close Button
  const btnCloseControlsForce = document.getElementById("btn-close-controls");
  if (btnCloseControlsForce) {
    btnCloseControlsForce.addEventListener("mousedown", () => {
      // Use mousedown to ensure it fires before click/hide logic
      console.log("💾 Force saving before close...");
      updateModelTransform(false, true);
    });

  }

  if (btnDeleteModel) {
    btnDeleteModel.addEventListener("click", () => {
      if (activeModelInstance) {
        const oldId = (activeModelInstance as any).id;
        const uuidToDelete = MODEL_ID_REGISTRY.get(oldId)?.uuid;

        // Hide panel immediately to improve UX
        if (controlsPanel) controlsPanel.classList.add("hidden");

        if ((activeModelInstance as any).marker) {
          mapView.Markers.remove((activeModelInstance as any).marker);
        }
        mapView.Models.remove(activeModelInstance);
        MODEL_ID_REGISTRY.delete(oldId);
        if (uuidToDelete) {
          MODEL_INSTANCE_REGISTRY.delete(uuidToDelete);
          deleteModelFromAPI(uuidToDelete); // Delete from API
        }

        activeModelInstance = null;
        controlsPanel?.classList.add("hidden");
      }
    });
  }


  // Copy Model Handler
  if (btnCopyModel) {
    btnCopyModel.addEventListener("click", () => {
      if (activeModelInstance) {
        const oldId = (activeModelInstance as any).id;
        const meta = MODEL_ID_REGISTRY.get(oldId);
        if (meta) {
          placingMode = 'copy';
          sourceModelData = meta;
          // Hide panel
          controlsPanel?.classList.add("hidden");
          // Start placing with existing data
          startPlacingModel({
            name: meta.name,
            file: meta.url,
            thumb: meta.thumb, // Use the real thumbnail
            scale: meta.scale,
            rotation: meta.rotation
          });
        }
      }
    });
  }


  // Cut (Move) Model Handler
  if (btnCutModel) {
    btnCutModel.addEventListener("click", () => {
      if (activeModelInstance) {
        const oldId = (activeModelInstance as any).id;
        const meta = MODEL_ID_REGISTRY.get(oldId);
        if (meta) {
          placingMode = 'move';
          sourceModelData = meta;
          sourceModelMappedinId = oldId;
          // Hide panel
          controlsPanel?.classList.add("hidden");
          // Start placing
          startPlacingModel({
            name: meta.name,
            file: meta.url,
            thumb: meta.thumb, // Use the real thumbnail
            scale: meta.scale,
            rotation: meta.rotation
          });

          // Instant feedback: Hide the original model while moving/copying if needed
          if (placingMode === 'move' && activeModelInstance) {
            try {
              if (typeof activeModelInstance.hide === 'function') {
                activeModelInstance.hide();
              } else {
                mapView.Models.remove(activeModelInstance);
              }
            } catch (e) {
              console.warn("Could not hide instance", e);
            }
          }
        }
      }
    });
  }

  if (btnCloseControls) {
    btnCloseControls.addEventListener("click", () => {
      activeModelInstance = null;
      controlsPanel?.classList.add("hidden");
    });
  }

  // ============================================
  // MODEL PICKER LOGIC
  // ============================================
  let AVAILABLE_MODELS: any[] = []; // Dynamic List from API

  // Removed local declarations - using higher scope globals

  // UI Elements
  const btnAddModel = document.getElementById("btn-add-model");
  const modalPicker = document.getElementById("model-picker-modal");
  const btnClosePicker = document.getElementById("btn-close-picker");
  const modelGrid = document.getElementById("model-grid");

  // Open Picker
  if (btnAddModel) {
    btnAddModel.addEventListener("click", () => {
      if (modalPicker && !modalPicker.classList.contains("hidden")) {
        modalPicker.classList.add("hidden");
        btnAddModel.classList.remove("active");
        return;
      }

      // Close Classification if open
      if (!classificationModal?.classList.contains("hidden")) {
        classificationModal?.classList.add("hidden");
        btnOpenClassification?.classList.remove("active");
        if (areaAssignSearch) areaAssignSearch.value = "";
      }

      // Close Admin Info Modal
      const adminInfoModal = document.getElementById('admin-info-modal');
      const btnOpenAdminInfo = document.getElementById('btn-open-admin-info');
      adminInfoModal?.classList.add('hidden');
      if (btnOpenAdminInfo) {
        btnOpenAdminInfo.classList.remove('active');
        btnOpenAdminInfo.style.backgroundColor = '';
        btnOpenAdminInfo.style.color = '';
      }

      btnAddModel.classList.add("active");

      const searchInput = document.getElementById("model-search-input") as HTMLInputElement;
      const searchClear = document.getElementById("model-search-clear") as HTMLButtonElement;
      if (searchInput) searchInput.value = "";
      if (searchClear) searchClear.style.display = "none";

      renderModelPicker();
      modalPicker?.classList.remove("hidden");
    });
  }

  // Close Picker
  if (btnClosePicker) {
    btnClosePicker.addEventListener("click", () => {
      modalPicker?.classList.add("hidden");
      btnAddModel?.classList.remove("active");
    });
  }

  // Render Grid
  const renderModelPicker = async (searchQuery: string = "") => {
    if (!modelGrid) return;

    // Fetch from API if empty
    if (AVAILABLE_MODELS.length === 0) {
      modelGrid.innerHTML = `<div style='grid-column: span 3; text-align: center; padding: 20px;'>${TranslationManager.t('loading', 'Loading models...')}</div>`;
      AVAILABLE_MODELS = await ApiService.getAvailableModels();
    }

    modelGrid.innerHTML = "";

    const query = searchQuery.trim().toLowerCase();
    const visibleModels = AVAILABLE_MODELS.filter(m => (m.name || m.file || '').toLowerCase().includes(query));

    if (visibleModels.length === 0) {
      modelGrid.innerHTML = `<div style='grid-column: span 10; text-align: center; padding: 20px; color: #666;'>Không tìm thấy mô hình nào.</div>`;
      return;
    }

    visibleModels.forEach((model) => {
      const item = document.createElement("div");
      item.className = "model-item";

      // Smart Thumbnail resolution
      let thumbName = model.thumb || model.Thumbnail || model.ThumbNail;
      if (!thumbName && model.file) {
        // Guess thumbnail name: airplane.glb -> airplane.jpg
        thumbName = model.file.replace(/\.(glb|gltf|json)$/i, '.jpg');
      }

      const thumbSrc = thumbName ? `${SERVER_URL}/Model3D/thumbnail/${thumbName}` : "";

      item.innerHTML = `
        <div class="model-item-preview" style="width:100%; height:90px; display:flex; align-items:center; justify-content:center; background:#ffffff; border:1px solid #f0f0f0; border-radius:8px; overflow:hidden; padding:5px;">
          ${thumbSrc ? `<img src="${thumbSrc}" alt="${model.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=\\'font-size:24px;\\'>📦</span>';" style="max-width:100%; max-height:100%; object-fit:contain;" />` : `<span style="font-size:24px;">📦</span>`}
        </div>
        <span style="font-size:12px; margin-top:8px; display:block; text-align:center; font-weight:500; color:#333;">${model.name}</span>
      `;
      item.addEventListener("click", () => {
        startPlacingModel(model);
        modalPicker?.classList.add("hidden");
      });
      modelGrid.appendChild(item);
    });
  };

  // Setup 3D Model Search Listeners
  const modelSearchInput = document.getElementById("model-search-input") as HTMLInputElement;
  const modelSearchClear = document.getElementById("model-search-clear") as HTMLButtonElement;

  if (modelSearchInput && modelSearchClear) {
    modelSearchInput.addEventListener("input", () => {
      const val = modelSearchInput.value;
      if (val.length > 0) {
        modelSearchClear.style.display = "block";
      } else {
        modelSearchClear.style.display = "none";
      }
      renderModelPicker(val);
    });

    modelSearchClear.addEventListener("click", () => {
      modelSearchInput.value = "";
      modelSearchClear.style.display = "none";
      renderModelPicker("");
      modelSearchInput.focus();
    });
  }

  // Start Placement Mode
  const startPlacingModel = (modelConfig: any) => {
    placingModelConfig = modelConfig;
    document.body.classList.add("placing-mode");
    btnAddModel?.classList.add("active");
    console.log("🎯 Start placing:", modelConfig.name, modelConfig);

    // Create cursor preview element if not exists
    let cursorPreview = document.getElementById('cursor-preview');
    if (!cursorPreview) {
      cursorPreview = document.createElement('div');
      cursorPreview.id = 'cursor-preview';
      document.body.appendChild(cursorPreview);
    }

    // Set preview content (2D Fallback for UI areas)
    let thumbName = modelConfig.thumb || modelConfig.Thumbnail || modelConfig.ThumbNail;
    if (!thumbName && (modelConfig.file || modelConfig.url)) {
      const fileName = (modelConfig.file || modelConfig.url).split('/').pop();
      if (fileName) thumbName = fileName.replace(/\.(glb|gltf|json)$/i, '.jpg');
    }

    const thumbSrc = thumbName ? `${SERVER_URL}/Model3D/thumbnail/${thumbName}` : "";

    cursorPreview.innerHTML = `
      <div class="preview-box" style="width:50px; height:50px; background:rgba(255,255,255,1.0); border:2px solid #085ebb; border-radius:8px; display:flex; align-items:center; justify-content:center; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.25); padding:4px;">
        ${thumbSrc ? `<img src="${thumbSrc}" onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=\\'font-size:24px;\\'>📦</span>';" style="max-width:100%; max-height:100%; object-fit:contain;" />` : `<span style="font-size:24px;">📦</span>`}
      </div>
    `;

    // 2D preview guidance (0.7 opacity for visibility until 3D loads)
    cursorPreview.style.display = 'block';
    cursorPreview.style.opacity = '0.7';




    // Track mouse movement (DOM for UI areas)
    const mouseMoveHandler = (e: MouseEvent) => {
      if (cursorPreview && cursorPreview.style.display !== 'none') {
        cursorPreview.style.left = e.clientX + 'px';
        cursorPreview.style.top = e.clientY + 'px';
      }
    };

    // ============================================
    // TRUE 3D GHOST PREVIEW (PROFESSIONAL 3D LOGIC)
    // ============================================
    const handleMapMouseMove = async (event: any) => {
      if (!placingModelConfig) return;

      const coord = event.coordinate;

      if (coord) {
        let previewUrl = placingModelConfig.file || placingModelConfig.url;
        // AGGRESSIVE URL RESOLUTION
        if (previewUrl && previewUrl.startsWith("./")) {
          previewUrl = previewUrl.replace("./", `${SERVER_URL}/`);
        } else if (previewUrl && !previewUrl.startsWith("http") && !previewUrl.includes("Model3D/")) {
          previewUrl = `${SERVER_URL}/Model3D/${previewUrl}`;
        } else if (previewUrl && !previewUrl.startsWith("http")) {
          previewUrl = `${SERVER_URL}/${previewUrl}`;
        }

        if (isAddingPreview) return;

        isAddingPreview = true;
        try {
          const newGhost = await mapView.Models.add(coord, previewUrl, {
            interactive: false,
            scale: placingModelConfig.scale || [1, 1, 1],
            rotation: placingModelConfig.rotation || [0, 0, 0],
            verticalOffset: placingModelConfig.elevation || 0
          });

          // SUCCESSFUL ADD: Now we can cleanup and hide 2D
          if (placingPreviewModel) {
            try { mapView.Models.remove(placingPreviewModel); } catch (e) { }
          }
          placingPreviewModel = newGhost;

          if (cursorPreview) cursorPreview.style.opacity = "0.1";
        } catch (e) {
          console.warn("3D Preview error:", e);
          if (cursorPreview) cursorPreview.style.opacity = "0.7";
        } finally {
          isAddingPreview = false;
        }
      } else {
        // Off-floor: always show 2D
        if (cursorPreview) cursorPreview.style.opacity = "0.7";
      }
    };


    document.addEventListener('mousemove', mouseMoveHandler);

    // Use SDK internal mousemove for perfect coordinate alignment
    (mapView as any).on("mousemove", handleMapMouseMove);
    (window as any).mapPlacementHandler = handleMapMouseMove;


    // (Unified 3D-first handler used)



    // (Unified DOM-based mouse handler used instead of SDK event)



    // HIDE preview when hovering over UI elements
    const floorSelector = document.getElementById("floor-selector");
    if (floorSelector && !(floorSelector as any).hasPlacementListeners) {
      floorSelector.addEventListener("mouseenter", () => {
        const preview = document.getElementById('cursor-preview');
        if (preview && placingModelConfig) preview.style.display = 'none';
      });
      floorSelector.addEventListener("mouseleave", () => {
        const preview = document.getElementById('cursor-preview');
        if (preview && placingModelConfig) preview.style.display = 'block';
      });
      (floorSelector as any).hasPlacementListeners = true;
    }

    // Store handler to remove later
    (window as any).placementMouseHandler = mouseMoveHandler;
  };

  const cleanupPlacementMode = () => {
    console.log("🧹 Cleaning up placement mode");
    placingModelConfig = null;
    document.body.classList.remove("placing-mode");
    const cursorPreview = document.getElementById('cursor-preview');
    if (cursorPreview) {
      cursorPreview.style.display = 'none';
      cursorPreview.innerHTML = "";
      cursorPreview.style.opacity = "1";
    }
    if ((window as any).placementMouseHandler) {
      document.removeEventListener("mousemove", (window as any).placementMouseHandler);
      (window as any).placementMouseHandler = null;
    }
    if (placingPreviewModel) {
      try {
        mapView.Models.remove(placingPreviewModel);
      } catch (e) { }
      placingPreviewModel = null;
    }
    if ((window as any).mapPlacementHandler) {
      // Clean up map listener if it was used in legacy versions
      try { (mapView as any).off?.("mousemove", (window as any).mapPlacementHandler); } catch (e) { }
      (window as any).mapPlacementHandler = null;
    }

    // Reset Globals
    placingMode = 'new';
    sourceModelData = null;
    sourceModelMappedinId = null;
    btnAddModel?.classList.remove("active");
  };


  // Redundant click handler removed.
  const redundantPlaceholder = async (event: any) => {
    /* removed */
    return;
  };

  // Call load on init
  loadModelsFromAPI();


  // Redundant code block removed.


  // Static models migrated to Database.



  // Redundant code block removed.


  // ============================================
  // ADD SPECIFIC STATIC MODELS (User Request)
  // ============================================
  // (addStaticModels removed per user request - data now managed via DB)

  // ============================================
  // POLLING: SYNC FROM DB -> UI
  // ============================================
  if (!isViewOnly) {
    setInterval(async () => {
      if (isUpdating) return; // Don't sync if user is editing

      const apiModels = await ApiService.getAllModels();

      for (const m of apiModels) {
        // Simple Logic: Update transforms if model exists
        const instance = MODEL_INSTANCE_REGISTRY.get(m.uuid);
        if (instance) {
          const r = m.rotation; // Check if changed?
          // For now, let's just log. Full sync requires complex diffing to avoid jitter.
        } else {
          // If new model appears in DB (added by another user/tab), reload likely needed
          // checking diff is complex here.
        }
      }
    }, 5000); // Check every 5s
  }

  // ============================================
  // AREA CLASSIFICATION SYSTEM
  // ============================================

  const btnOpenClassification = document.getElementById("btn-open-classification");
  const classificationModal = document.getElementById("classification-modal");
  const btnCloseClassification = document.getElementById("btn-close-classification");
  const btnCancelClassification = document.getElementById("btn-cancel-classification");
  const btnSaveClassification = document.getElementById("btn-save-classification");

  const mainCatList = document.getElementById("main-category-list");
  const subCatList = document.getElementById("sub-category-list");
  const areaCheckboxList = document.getElementById("area-checkbox-list");
  const areaAssignSearch = document.getElementById("area-assign-search") as HTMLInputElement;

  const activeCategoryGrid = document.getElementById("active-category-grid");

  // Define global classification state at the beginning of the section
  let selectedCategoryId: string | null = null;
  let selectedSubCategoryId: string | null = null;

  let assignedAreasMap: Map<string, string> = new Map(); // MID -> SubCatID
  let pendingAssignments: Set<string> = new Set(); // Track selections in modal

  (window as any).highlightCategory = async (catId: string) => {
    // Parent category click: ONLY show subcategories, DO NOT highlight map objects
    activeCategoryId = catId;
    activeSubCategoryId = null;

    // Reset current highlights if any when navigating between main categories
    clearSearchMarkers();
    if (currentSearchResults.length > 0) {
      currentSearchResults.forEach((o: any) => { try { resetObjectHighlight(o); } catch (e) { } });
      currentSearchResults = [];
    }

    if (categoryTree.length === 0) categoryTree = await ApiService.getCategories();
    const cat = categoryTree.find((c: any) => String(c.id) === String(catId));
    if (!cat) return;

    // Auto-select if only 1 subcategory
    if (cat.subcategories && cat.subcategories.length === 1) {
      // Ensure 'Active' class on the main grid updates
      if (typeof renderActiveCategoryGrid === 'function') renderActiveCategoryGrid();

      (window as any).highlightSubCategory(cat.subcategories[0].id);
      return;
    }

    // Just render subcategories (Navigation only)
    renderCategories(catId);

    // Also update main grid to show active state
    if (typeof renderActiveCategoryGrid === 'function') renderActiveCategoryGrid();
  };

  // New function to handle subcategory clicks and highlighting
  (window as any).highlightSubCategory = async (subCatId: string) => {
    // TOGGLE LOGIC: If same subCategory, turn off highlights
    if (activeSubCategoryId === subCatId.toString()) {
      activeSubCategoryId = null;
      clearSearchMarkers();
      if (currentSearchResults.length > 0) {
        currentSearchResults.forEach((obj: any) => resetObjectHighlight(obj));
        currentSearchResults = [];
      }
      renderCategories(activeCategoryId); // Re-render to update active state
      return;
    }

    activeSubCategoryId = subCatId;

    // Clear existing highlights before applying new ones
    clearSearchMarkers();
    if (currentSearchResults.length > 0) {
      currentSearchResults.forEach((o: any) => { try { resetObjectHighlight(o); } catch (e) { } });
      currentSearchResults = [];
    }

    const locs = await ApiService.getSubCategoryLocations(subCatId);
    const allAssignedMIDs = locs.map((l: any) => l.MappedinID);

    const objectsToHighlight = allMapObjects.filter(obj => allAssignedMIDs.indexOf(obj.id) !== -1);

    // OVERWRITE NAMES WITH DB DATA (Fix: Update TranslationManager directly to avoid read-only error)
    objectsToHighlight.forEach(obj => {
      const dbLoc = locs.find((l: any) => l.MappedinID === obj.id);
      if (dbLoc) {
        // Construct localized names object
        // Assuming DB columns: Name (VN), Name_EN, Name_ZH or similar. 
        // Adapting to likely column names based on common patterns.
        const names = {
          'vn': dbLoc.Name || dbLoc.VN || dbLoc.vn || obj.name,
          'en': dbLoc.Name_EN || dbLoc.EN || dbLoc.en || dbLoc.Name || obj.name,
          'zh': dbLoc.Name_ZH || dbLoc.ZH || dbLoc.zh || dbLoc.Name || obj.name,
          'ja': dbLoc.Name_JA || dbLoc.JA || dbLoc.ja || dbLoc.Name || obj.name,
          'ko': dbLoc.Name_KO || dbLoc.KO || dbLoc.ko || dbLoc.Name || obj.name
        };

        // Update TranslationManager cache so getName(obj) returns the new DB name with correct language
        if (!TranslationManager.data.locations) TranslationManager.data.locations = {};

        // Store in the structure expected by TranslationManager.getName (Case B2)
        TranslationManager.data.locations[obj.id] = { names: names };

        // Remove customName override to allow TranslationManager to handle languages
        delete (obj as any).customName;
      }
    });

    currentSearchResults = objectsToHighlight;
    selectedSpace = null; // Clear primary selection when category group is highlighted


    // Find the parent category to get its icon
    const parentCat = categoryTree.find(c => String(c.id) === String(activeCategoryId));
    const subCat = parentCat?.subcategories.find((s: any) => String(s.id) === String(subCatId));
    const iconPath = subCat?.icon || parentCat?.icon || 'default.png';
    activeCategoryIcon = iconPath; // Sync global icon for floor change re-apply

    objectsToHighlight.forEach((matchObj: any) => {
      try {
        mapView.updateState(matchObj, { interactive: true, color: "#4CAF50", hoverColor: "#45a049" });
        const anchor = getObjectAnchor(matchObj);
        if (anchor) {
          const isFilePath = iconPath && iconPath.indexOf('.') !== -1;
          const markerHtml = isFilePath ? `
            <div class="search-marker">
              <div class="search-marker-icon" style="background:#4CAF50;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid white;">
                <img src="/icon-category/${iconPath}" onerror="this.style.display='none'" style="width:24px;height:24px;object-fit:contain;">
              </div>
              <div class="search-marker-arrow" style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid #4CAF50;margin-top:-1px;"></div>
            </div>` : `
            <div class="search-marker">
              <div class="search-marker-icon" style="background:#4CAF50;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid white;">📂</div>
              <div class="search-marker-arrow" style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid #4CAF50;margin-top:-1px;"></div>
            </div>`;
          const marker = mapView.Markers.add(anchor, markerHtml, { interactive: false });
          currentSearchMarkers.push(marker);
        }
      } catch (e) { }
    });

    if (objectsToHighlight.length > 0) {
      // USER REQUEST:
      // 1. If in Overview: DO NOT AUTO-ZOOM.
      // 2. If on Floor: Auto-zoom to show all items (16.5x).
      if (!isMapInOverview()) {
        console.log(`⚡ Auto-zoom to subcategory group (16.5x) for ${objectsToHighlight.length} items`);
        mapView.Camera.focusOn(objectsToHighlight, {
          duration: 1000,
          minZoomLevel: 16.5,
          maxZoomLevel: 16.5
        } as any);
      } else {
        console.log(`📌 Highlighted ${objectsToHighlight.length} objects for subcategory ${subCatId} (No Zoom in Overview)`);
      }
    }
    renderCategories(activeCategoryId); // Re-render to update active state
  };

  // 2. Classification Modal Logic
  const openClassificationModal = async () => {
    {
      // Close Admin Info Modal
      const adminInfoModal = document.getElementById('admin-info-modal');
      const btnOpenAdminInfo = document.getElementById('btn-open-admin-info');
      adminInfoModal?.classList.add('hidden');
      if (btnOpenAdminInfo) {
        btnOpenAdminInfo.classList.remove('active');
        btnOpenAdminInfo.style.backgroundColor = '';
        btnOpenAdminInfo.style.color = '';
      }

      classificationModal?.classList.remove("hidden");
      btnOpenClassification?.classList.add("active");
      if (areaAssignSearch) areaAssignSearch.value = "";

      // Reset selection state (theo yêu cầu)
      selectedCategoryId = null;
      selectedSubCategoryId = null;

      categoryTree = await ApiService.getCategories();
      assignedAreasMap = new Map((await ApiService.getAssignedAreas()).map((a: any) => [a.MappedinID, a.SubCategoryID]));
      renderMainCategories();
      subCatList!.innerHTML = '<div style="padding:15px;color:#999;">Chọn danh mục chính...</div>';
      areaCheckboxList!.innerHTML = '<div style="padding:15px;color:#999;">Chọn danh mục con...</div>';
    };

    function renderMainCategories() {
      if (!mainCatList) return;
      mainCatList.innerHTML = categoryTree.map(cat => `
      <div class="classification-item ${String(selectedCategoryId) === String(cat.id) ? 'active' : ''}" onclick="window.selectClassificationCat('${cat.id}')">
        <img src="/icon-category/${cat.icon || 'default.png'}" onerror="this.src='/icon-category/default.png'">
        <span>${cat.name}</span>
      </div>
    `).join('');
    };

    (window as any).selectClassificationCat = (id: string) => {
      selectedCategoryId = id;
      selectedSubCategoryId = null;

      const cat = categoryTree.find(c => String(c.id) === String(id));

      // Auto-select if only 1 subcategory
      if (cat && cat.subcategories && cat.subcategories.length === 1) {
        selectedSubCategoryId = cat.subcategories[0].id;
        // Init pending assignments
        pendingAssignments.clear();
        assignedAreasMap.forEach((v, k) => {
          if (String(v) === String(selectedSubCategoryId)) pendingAssignments.add(k);
        });
      }

      renderMainCategories();
      renderSubCategories();

      // If auto-selected, update the area list as well
      if (selectedSubCategoryId) {
        renderAreaAssignments();
      } else {
        // Clear area list if waiting for subcategory selection
        areaCheckboxList!.innerHTML = '<div style="padding:15px;color:#999;">Chọn danh mục con...</div>';
      }
    };

    // Initial render when modal opens
    if (selectedSubCategoryId) {
      renderAreaAssignments();
    } else {
      areaCheckboxList!.innerHTML = '<div style="padding:15px;color:#999;">Chọn danh mục con...</div>';
    }
  };

  function renderSubCategories() {
    if (!subCatList) return;
    const cat = categoryTree.find(c => String(c.id) === String(selectedCategoryId));
    if (!cat) return;
    subCatList.innerHTML = cat.subcategories.map((sub: any) => `
      <div class="classification-item ${String(selectedSubCategoryId) === String(sub.id) ? 'active' : ''}" onclick="window.selectClassificationSub('${sub.id}')">
        <img src="/icon-category/${sub.icon}" onerror="this.src='/icon-category/default.png'">
        <span>${sub.name}</span>
      </div>
    `).join('');
  };

  (window as any).selectClassificationSub = async (id: string) => {
    selectedSubCategoryId = id;

    // Init pending assignments
    pendingAssignments.clear();
    assignedAreasMap.forEach((v, k) => {
      if (String(v) === String(id)) pendingAssignments.add(k);
    });

    renderSubCategories();
    renderAreaAssignments();
  };

  (window as any).toggleAssignment = (id: string) => {
    if (pendingAssignments.has(id)) pendingAssignments.delete(id);
    else pendingAssignments.add(id);
    renderAreaAssignments(); // Re-render to update sort order if desired? 
    // User requested: "checked... đưa lên đầu". So YES, re-render.
    // But re-rendering confuses focus? Maybe just update check state if not re-sorting immediately?
    // User said: "các khu vực được tick chọn đó sẽ được đưa lên đầu". 
    // If I click, it moves up? That might be annoying ("jumping"). 
    // Usually sorting happens on load or search. But user asked for it. 
    // I will re-render.
  };

  (window as any).toggleAllAssignments = (checked: boolean) => {
    const query = areaAssignSearch?.value.toLowerCase() || "";

    // Get currently visible areas based on search
    // Logic must match renderAreaAssignments filter
    const visibleAreas = allMapObjects
      .filter((o: any) => o.name && o.name.toLowerCase().includes(query))
      .filter((o: any) => {
        // Exclude if assigned to OTHER category (same logic as render)
        const assignedToOther = assignedAreasMap.has(o.id) && String(assignedAreasMap.get(o.id)) !== String(selectedSubCategoryId);
        if (assignedToOther) return false;
        return true;
      })
      .map((o: any) => o.id);

    visibleAreas.forEach((id: string) => {
      if (checked) {
        // ONLY select if it's NOT already assigned to another category (conceptually)
        // But the filter above ALREADY filters out "assignedToOther". 
        // So 'visibleAreas' contains only:
        // 1. Unassigned areas
        // 2. Areas ALREADY assigned to THIS category

        // So we can safely add all visible areas
        pendingAssignments.add(id);
      }
      else {
        pendingAssignments.delete(id);
      }
    });
    renderAreaAssignments();
  };


  function renderAreaAssignments() {
    if (!areaCheckboxList) return;
    const query = areaAssignSearch?.value.toLowerCase() || "";

    // allAreas
    const allAreas = allMapObjects
      .filter((o: any) => o.name)
      .map((o: any) => ({
        id: o.id,
        name: o.name,
        floorName: o.floor?.name || (typeof o.floor === 'string' ? o.floor : '') || ''
      }));

    // Filter visible
    let visibleAreas = allAreas.filter(a => {
      // Exclude if assigned to OTHER category
      const assignedToOther = assignedAreasMap.has(a.id) && String(assignedAreasMap.get(a.id)) !== String(selectedSubCategoryId);
      if (assignedToOther) return false;

      return a.name.toLowerCase().includes(query);
    });

    // Sort: Checked first, then Alpha
    visibleAreas.sort((a, b) => {
      const aChecked = pendingAssignments.has(a.id);
      const bChecked = pendingAssignments.has(b.id);
      if (aChecked !== bChecked) return aChecked ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const allChecked = visibleAreas.length > 0 && visibleAreas.every(a => pendingAssignments.has(a.id));

    const html = `
        <div class="area-check-item" style="border-bottom:1px solid #eee; font-weight:bold;">
            <input type="checkbox" id="chk-all" ${allChecked ? 'checked' : ''} onclick="window.toggleAllAssignments(this.checked)">
            <label for="chk-all">Chọn tất cả</label>
        </div>
        ${visibleAreas.map(area => {
      const checked = pendingAssignments.has(area.id);
      const safeId = area.id.replace(/'/g, "\\'");
      return `
              <div class="area-check-item" style="align-items: flex-start;">
                <input type="checkbox" id="chk-${area.id}" value="${area.id}" ${checked ? 'checked' : ''} style="margin-top:3px;" onclick="window.toggleAssignment('${safeId}')">
                <label for="chk-${area.id}" style="line-height:1.2;">
                    <div>${area.name}</div>
                    ${area.floorName ? `<div style="font-size:0.75em; color:#999; margin-top:2px;">${area.floorName}</div>` : ''}
                </label>
              </div>
            `;
    }).join('')}
    `;

    areaCheckboxList.innerHTML = html;
  };

  areaAssignSearch?.addEventListener("input", renderAreaAssignments);

  // 1. Render Active Category Grid in Sidebar
  const renderActiveCategoryGrid = async () => {
    if (!activeCategoryGrid) return;
    const activeCats = await ApiService.getActiveCategories();
    activeCategoryGrid.innerHTML = activeCats.map((cat: any) => {
      const isActive = activeCategoryId === cat.CategoryID.toString();
      return `
        <div class="category-grid-item ${isActive ? 'active' : ''}" onclick="window.highlightCategory('${cat.CategoryID}')">
          <div class="icon-box">
            <img src="/icon-category/${cat.IconPath || 'default.png'}" onerror="this.src='/icon-category/default.png'">
          </div>
          <div class="label">${cat.CategoryName}</div>
        </div>
      `;
    }).join('');
  };

  btnSaveClassification?.addEventListener("click", async () => {
    if (!selectedSubCategoryId) {
      alert("Vui lòng chọn danh mục con!");
      return;
    }
    // Change: Use pendingAssignments instead of DOM
    const areaIds = Array.from(pendingAssignments);

    await ApiService.assignLocations(selectedSubCategoryId, areaIds);
    // classificationModal?.classList.add("hidden"); <-- Don't close

    // Show Success Popup
    const successPopup = document.getElementById("success-popup");
    const okBtn = document.getElementById("btn-success-ok");
    if (successPopup && okBtn) {
      successPopup.style.display = "flex";

      // Remove old listeners to be safe
      okBtn.onclick = async () => {
        successPopup.style.display = "none";

        // FIX: Refresh data immediately so UI reflects changes
        // without needing to close/reopen modal
        try {
          const areas = await ApiService.getAssignedAreas();
          assignedAreasMap = new Map(areas.map((a: any) => [a.MappedinID, a.SubCategoryID]));

          // Re-render current list to update "assignedToOther" logic
          renderAreaAssignments();

          // Also refresh category counts/display if needed
          renderSubCategories();
        } catch (e) {
          console.error("Error refreshing data after save:", e);
        }
      };
    }

    // Update grids in background
    if (areaAssignSearch) areaAssignSearch.value = "";
    renderActiveCategoryGrid();
  });

  btnOpenClassification?.addEventListener("click", () => {
    if (classificationModal && !classificationModal.classList.contains("hidden")) {
      classificationModal.classList.add("hidden");
      btnOpenClassification.classList.remove("active");
      if (areaAssignSearch) areaAssignSearch.value = "";
      return;
    }

    // Cancel Model Placement / Picker if open
    if (!modalPicker?.classList.contains("hidden") || document.body.classList.contains("placing-mode")) {
      modalPicker?.classList.add("hidden");
      cleanupPlacementMode(); // This also removes active class from btnAddModel
    }

    // Close Admin Info Modal
    const adminInfoModal = document.getElementById('admin-info-modal');
    const btnOpenAdminInfo = document.getElementById('btn-open-admin-info');
    adminInfoModal?.classList.add('hidden');
    if (btnOpenAdminInfo) {
      btnOpenAdminInfo.classList.remove('active');
      btnOpenAdminInfo.style.backgroundColor = '';
      btnOpenAdminInfo.style.color = '';
    }

    openClassificationModal();
  });
  btnCloseClassification?.addEventListener("click", () => {
    classificationModal?.classList.add("hidden");
    btnOpenClassification?.classList.remove("active");
    if (areaAssignSearch) areaAssignSearch.value = "";
  });
  btnCancelClassification?.addEventListener("click", () => {
    classificationModal?.classList.add("hidden");
    btnOpenClassification?.classList.remove("active");
    if (areaAssignSearch) areaAssignSearch.value = "";
  });

  // Init Search Clear Button logic inside init() to access hideInfo
  const clearSearchBtn = document.getElementById("search-clear-btn");
  const locationSearchInput = document.getElementById("location-search") as HTMLInputElement;

  if (locationSearchInput && clearSearchBtn) {
    // Toggle button visibility on input
    locationSearchInput.addEventListener("input", () => {
      clearSearchBtn.style.display = locationSearchInput.value.length > 0 ? "block" : "none";
    });

    // Clear action
    clearSearchBtn.addEventListener("click", () => {
      locationSearchInput.value = "";
      clearSearchBtn.style.display = "none";
      locationSearchInput.focus();
      // Trigger input event to update search results
      locationSearchInput.dispatchEvent(new Event('input'));

      // Call hideInfo to reset UI and map highlights
      hideInfo();
    });
  }

  // Initial render calls
  renderActiveCategoryGrid();
  renderCategories(); // Load database categories into sidebar list

  // ============================================
  // DEBUG: Log all translatable names
  // ============================================
  const debugLogAllNames = async () => {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 DEBUG: Danh sách tất cả tên hiển thị trên web (Tiếng Việt)');
    console.log('═══════════════════════════════════════════════════════════════');

    // 1. UI Labels (from data-i18n attributes)
    console.log('\n🔘 UI LABELS (Nút & Nhãn):');
    console.log('─────────────────────────────────────────────────────────────────');
    const uiElements = document.querySelectorAll('[data-i18n]');
    const uiLabels: string[] = [];
    uiElements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = el.textContent?.trim();
      if (key && text) {
        uiLabels.push(`  • ${key}: "${text}"`);
      }
    });
    console.log(uiLabels.join('\n') || '  (Không tìm thấy)');

    // Placeholders
    console.log('\n📝 PLACEHOLDERS:');
    console.log('─────────────────────────────────────────────────────────────────');
    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach((el: any) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const text = el.placeholder;
      console.log(`  • ${key}: "${text}"`);
    });

    // 2. Categories & SubCategories
    console.log('\n📂 DANH MỤC CHÍNH (Categories):');
    console.log('─────────────────────────────────────────────────────────────────');
    let cats = categoryTree;
    if (cats.length === 0) {
      try { cats = await ApiService.getCategories(); } catch (e) { }
    }
    cats.forEach((cat: any) => {
      console.log(`  📁 ${cat.name} (ID: ${cat.id}, Icon: ${cat.icon || 'none'})`);
    });

    console.log('\n📂 DANH MỤC CON (SubCategories):');
    console.log('─────────────────────────────────────────────────────────────────');
    cats.forEach((cat: any) => {
      if (cat.subcategories && cat.subcategories.length > 0) {
        console.log(`  📁 ${cat.name}:`);
        cat.subcategories.forEach((sub: any) => {
          console.log(`     └─ ${sub.name} (ID: ${sub.id}, Icon: ${sub.icon || 'none'})`);
        });
      }
    });

    // 3. Map Areas (Spaces)
    console.log('\n🗺️ KHU VỰC TRÊN BẢN ĐỒ (Spaces/Areas):');
    console.log('─────────────────────────────────────────────────────────────────');
    const spaces = mapData.getByType('space');
    const areaNames: string[] = [];
    spaces.forEach((space: any) => {
      if (space.name) {
        areaNames.push(`  • ${space.name} (ID: ${space.id})`);
      }
    });
    console.log(areaNames.slice(0, 50).join('\n') || '  (Không tìm thấy)');
    if (areaNames.length > 50) {
      console.log(`  ... và ${areaNames.length - 50} khu vực khác`);
    }

    // 4. Points of Interest
    console.log('\n📍 ĐIỂM ĐẾN (Points of Interest):');
    console.log('─────────────────────────────────────────────────────────────────');
    const pois = mapData.getByType('point-of-interest');
    pois.forEach((poi: any) => {
      console.log(`  • ${poi.name || 'Unnamed'} (ID: ${poi.id})`);
    });

    // 5. Map Objects (from allMapObjects)
    console.log('\n🏢 TẤT CẢ MAP OBJECTS:');
    console.log('─────────────────────────────────────────────────────────────────');
    const objectNames = allMapObjects
      .filter((obj: any) => obj.name)
      .map((obj: any) => `  • ${obj.name} (type: ${obj.type || 'unknown'}, ID: ${obj.id})`)
      .slice(0, 100);
    console.log(objectNames.join('\n') || '  (Không tìm thấy)');
    if (allMapObjects.length > 100) {
      console.log(`  ... và ${allMapObjects.length - 100} objects khác`);
    }

    // 6. Floors
    console.log('\n🏗️ CÁC TẦNG (Floors):');
    console.log('─────────────────────────────────────────────────────────────────');
    const floors = mapData.getByType('floor');
    floors.forEach((floor: any) => {
      console.log(`  • ${floor.name || floor.id} (ID: ${floor.id})`);
    });

    // 7. Current Markers
    console.log('\n📌 MARKERS HIỆN TẠI:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`  • Search markers: ${currentSearchMarkers.length}`);
    console.log(`  • Active category: ${activeCategoryId || 'None'}`);
    console.log(`  • Active subcategory: ${activeSubCategoryId || 'None'}`);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ Debug hoàn tất! Gọi window.debugLogAllNames() để chạy lại.');
    console.log('═══════════════════════════════════════════════════════════════');

    // NEW: Init Admin UI
    try {
      initAdminUI(allMapObjects);
    } catch (e) { console.error("Admin UI Init Failed", e); }

    // Return summary object for programmatic use
    return {
      uiLabels: uiLabels.length,
      categories: cats.length,
      subcategories: cats.reduce((sum: number, c: any) => sum + (c.subcategories?.length || 0), 0),
      spaces: spaces.length,
      pois: pois.length,
      allObjects: allMapObjects.length,
      floors: floors.length
    };
  };

  // Expose to window for console access
  (window as any).debugLogAllNames = debugLogAllNames;

  // ============================================
  // URL PARAMETER HANDLING (DEEP LINKING) - RESTORED
  // ============================================
  setTimeout(async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const locationParam = params.get('location');
      const floorParam = params.get('floor');

      if (locationParam || floorParam) {
        const delayParam = params.get('delay');
        const waitTime = delayParam ? parseInt(delayParam) : 3200;

        console.log(`Deep link: Waiting ${waitTime}ms for initial overview animation...`);

        setTimeout(async () => {
          console.log("Deep link: Overview wait finished. Starting location actions...");

          const findObj = (id: string) => {
            // 1. Tìm trong các loại không gian 3D tiêu chuẩn
            const types = ["space", "point-of-interest", "area"];
            for (const t of types) {
              try {
                const found = (mapData as any).getByType(t).find((x: any) => x.id === id || x.mappedinId === id);
                if (found) return found;
              } catch (e) { }
            }
            // 2. Tìm trong danh sách Locations/Objects tổng hợp (Dành cho loc_ và o_)
            const foundInAll = allMapObjects.find((x: any) => x.id === id || x.mappedinId === id);
            if (foundInAll) return foundInAll;

            return null;
          };

          const targetObj = locationParam ? findObj(locationParam) : null;
          let targetFloorId = floorParam;

          if (targetObj) {
            // Space có .floor.id, Location có .floorId
            targetFloorId = targetObj.floor?.id || targetObj.floorId || floorParam;
          }

          // 1. Chuyển tầng (nếu tầng hiện tại khác tầng mục tiêu)
          if (targetFloorId && targetFloorId !== mapView.currentFloor?.id) {
            console.log("Deep link: Switching floor to", targetFloorId);
            await mapView.setFloor(targetFloorId);
            // Đợi 0.6s sau khi chuyển tầng để đảm bảo tầng đã render xong
            await new Promise(r => setTimeout(r, 600));

            const selector = document.getElementById("floor-selector") as HTMLSelectElement;
            if (selector) selector.value = targetFloorId;
          }

          // 2. Ghim vị trí, Focus camera mượt mà và mở Side Panel
          if (targetObj) {
            console.log("Deep link: Focusing and opening info for", targetObj.name || targetObj.id);
            selectedSpace = targetObj;
            updateHighlights();

            if (typeof (window as any).focusOnObject === 'function') {
              (window as any).focusOnObject(targetObj, 22.0);
            } else {
              mapView.Camera.focusOn(targetObj, {
                duration: 1500,
                minZoomLevel: 22.0,
                maxZoomLevel: 22.0
              });
            }

            if (typeof (window as any).updateInfo === 'function') {
              (window as any).updateInfo(targetObj);
            }
          }
        }, waitTime);
      }
    } catch (e) {
      console.error("Deep link handling error:", e);
    }
  }, 1000);

  // 14. INIT ADMIN UI
  try {
    (window as any).globalMapView = mapView;
    (window as any).globalMapData = mapData;
    initAdminUI(allMapObjects);
    initAreaColorUI(allMapObjects, mapView, mapData);

    // Apply custom area colors immediately on load
    if (typeof (window as any).refreshMapColors === 'function') {
      (window as any).refreshMapColors();
    }
  } catch (e) {
    console.error("Failed to initialize Admin UI:", e);
  }
}

// ============================================
// ADMIN AREA INFO MANAGER
// ============================================
function initAdminUI(allMapObjects: any[]) {
  const modal = document.getElementById('admin-info-modal') as HTMLElement;
  const btnOpen = document.getElementById('btn-open-admin-info') as HTMLElement;
  const btnClose = document.getElementById('btn-close-admin') as HTMLElement;
  const btnCancel = document.getElementById('btn-cancel-admin') as HTMLElement;
  const select = document.getElementById('admin-area-select') as HTMLSelectElement;
  const adminForm = document.getElementById('admin-form') as HTMLElement;
  const searchFilter = document.getElementById('admin-search-filter') as HTMLInputElement;
  const btnRefresh = document.getElementById('btn-refresh-areas') as HTMLButtonElement;

  // Store data for handlers to use latest version
  (window as any).allMapObjects = allMapObjects;

  // Image Upload Logic
  const imgInput = document.getElementById('admin-image-url') as HTMLInputElement;
  const fileInput = document.getElementById('admin-image-upload') as HTMLInputElement;
  const btnTriggerUpload = document.getElementById('btn-trigger-upload') as HTMLButtonElement;
  const imgPreview = document.getElementById('admin-image-preview') as HTMLImageElement;
  const noImageText = document.getElementById('no-image-text') as HTMLElement;
  const uploadStatus = document.getElementById('upload-status') as HTMLElement;

  if (!modal || !btnOpen) return;

  // Prevent double init
  if ((btnOpen as any).isInitialized) {
    if (!modal.classList.contains('hidden')) {
      populateAreaSelect(searchFilter?.value || '');
    }
    return;
  }
  (btnOpen as any).isInitialized = true;

  // FORCE UPDATE BUTTON STYLES (To bypass HTML caching)
  if (btnTriggerUpload) {
    btnTriggerUpload.style.backgroundColor = '#085ebb';
    btnTriggerUpload.style.color = 'white';
  }
  const btnSaveEl = document.getElementById('btn-save-admin');
  if (btnSaveEl) {
    btnSaveEl.style.backgroundColor = '#085ebb';
    btnSaveEl.style.color = 'white';
  }

  // Sync helper
  const syncLocationsWithDB = async () => {
    try {
      const objects = (window as any).allMapObjects || allMapObjects;
      const payload = {
        locations: objects.map((o: any) => {
          // Image URL Resolution (Same as console log)
          let resolvedImageUrl = "";
          if (o.images && Array.isArray(o.images) && o.images.length > 0) {
            resolvedImageUrl = o.images[0].url || o.images[0];
          } else if (o.media && Array.isArray(o.media) && o.media.length > 0) {
            resolvedImageUrl = o.media[0].url || o.media[0];
          } else {
            resolvedImageUrl = o.logo?.original || o.logo?.large || o.logo?.medium || o.logo?.small || o.logo || o.image || o.x_ray_image_url || "";
          }

          return {
            id: o.id,
            name: o.name || "",
            description: o.description || "",
            imageUrl: resolvedImageUrl
          };
        })
      };
      await fetch('http://localhost:3002/api/sync-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('Sync failed', e);
    }
  };

  // Open Modal
  btnOpen.onclick = async () => {
    // Close other modals
    const modelPicker = document.getElementById("model-picker-modal");
    const btnAddModel = document.getElementById("btn-add-model");
    const classificationModal = document.getElementById("classification-modal");
    const btnOpenClassification = document.getElementById("btn-open-classification");

    modelPicker?.classList.add("hidden");
    btnAddModel?.classList.remove("active");
    classificationModal?.classList.add("hidden");
    btnOpenClassification?.classList.remove("active");

    if (modal.classList.contains('hidden')) {
      modal.classList.remove('hidden');
      btnOpen.classList.add('active');

      // 1. Sync in background (No await) - Loads list instantly
      syncLocationsWithDB();

      // 2. Populate select immediately from memory
      if (searchFilter) searchFilter.value = "";
      populateAreaSelect();

      // Apply translations to modal content
      TranslationManager.applyTranslations();

      // Focus search
      setTimeout(() => searchFilter?.focus(), 100);
    } else {
      closeModal();
    }
  };

  // Close Modal
  const closeModal = () => {
    modal.classList.add('hidden');
    adminForm.style.display = 'none';
    select.value = "";

    // Remove Highlight
    btnOpen.classList.remove('active');
    btnOpen.style.backgroundColor = '';
    btnOpen.style.color = '';
  };
  btnClose.onclick = closeModal;
  btnCancel.onclick = closeModal;

  // Populate Select
  function populateAreaSelect(filterText = "") {
    const currentId = select.value;
    const placeholder = TranslationManager.t('select_area_placeholder', '-- Chọn khu vực --');
    select.innerHTML = `<option value="">${placeholder}</option>`;
    const lowerFilter = filterText.toLowerCase();
    const objects = (window as any).allMapObjects || allMapObjects;

    // Map objects to display items with localized names
    const items = objects
      .map((obj: any) => {
        const name = TranslationManager.getName(obj) || obj.name;
        return { id: obj.id, name: name, rawObj: obj };
      })
      .filter((item: any) => item.name && item.name.trim().length > 0);

    // Sort objects by name
    items.sort((a: any, b: any) => a.name!.localeCompare(b.name!));

    let foundCurrent = false;
    items.forEach((item: any) => {
      // Filter logic
      if (filterText && !item.name!.toLowerCase().includes(lowerFilter)) return;

      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.name!;
      if (item.id === currentId) {
        opt.selected = true;
        foundCurrent = true;
      }
      select.appendChild(opt);
    });

    if (currentId && !foundCurrent && !filterText) {
      // If we had a selection but it was filtered out, keep the form but show alert? 
      // Actually, if filterText is empty and we lost it, it shouldn't happen unless data changed.
    }
  }

  // Search Filter
  if (searchFilter) {
    searchFilter.addEventListener('input', (e) => {
      populateAreaSelect((e.target as HTMLInputElement).value);
    });
  }

  if (btnRefresh) {
    btnRefresh.onclick = async () => {
      syncLocationsWithDB(); // Run in background
      populateAreaSelect(searchFilter.value);
    };
  }


  // Handle Selection Change
  select.onchange = async () => {
    const id = select.value;
    if (!id) {
      adminForm.style.display = 'none';
      if (searchFilter) searchFilter.value = "";
      return;
    }

    // Sync search filter text to match selection
    if (searchFilter) {
      searchFilter.value = select.options[select.selectedIndex].text;
    }

    adminForm.style.display = 'flex';
    await loadAreaData(id);
  };


  // Name inputs
  const nameInputs = {
    vi: document.getElementById('name-vi') as HTMLInputElement,
    en: document.getElementById('name-en') as HTMLInputElement,
    zh: document.getElementById('name-zh') as HTMLInputElement,
    ja: document.getElementById('name-ja') as HTMLInputElement,
    ko: document.getElementById('name-ko') as HTMLInputElement
  };

  // Load Data
  const loadAreaData = async (id: string) => {
    // 1. Get DB Data
    const locData = TranslationManager.getLocationContent(id);

    // 2. Get Native Mappedin Data
    const rawObj = allMapObjects.find(o => o.id === id);
    let nativeDesc = "";
    let nativeImage = "";
    let nativeName = "";

    if (rawObj) {
      nativeDesc = rawObj.description || "";
      nativeName = rawObj.name || "";

      // Extraction Logic
      if (rawObj.images && Array.isArray(rawObj.images) && rawObj.images.length > 0) {
        nativeImage = rawObj.images[0].url || rawObj.images[0];
      } else if (rawObj.media && Array.isArray(rawObj.media) && rawObj.media.length > 0) {
        nativeImage = rawObj.media[0].url || rawObj.media[0];
      } else {
        nativeImage = rawObj.logo?.original || rawObj.logo?.large || rawObj.logo?.medium || rawObj.logo?.small || rawObj.logo || rawObj.image || rawObj.x_ray_image_url || "";
      }

      // Ensure nativeImage is a string
      if (typeof nativeImage !== 'string') {
        nativeImage = (nativeImage as any).url || (nativeImage as any).src || "";
      }
    }

    // Default values from DB
    let descVI = "", descEN = "", descZH = "", descJA = "", descKO = "";
    let nameVI = "", nameEN = "", nameZH = "", nameJA = "", nameKO = "";
    let img = "";

    if (locData) {
      // Descriptions
      if (locData.descriptions) {
        descVI = locData.descriptions.vn || "";
        descEN = locData.descriptions.en || "";
        descZH = locData.descriptions.zh || "";
        descJA = locData.descriptions.ja || "";
        descKO = locData.descriptions.ko || "";
      } else if (locData.description) {
        descVI = locData.description;
      }

      // Names (From AreaList cache)
      if (locData.names) {
        nameVI = locData.names.vn || "";
        nameEN = locData.names.en || "";
        nameZH = locData.names.zh || "";
        nameJA = locData.names.ja || "";
        nameKO = locData.names.ko || "";
      }

      // Image
      img = locData.image || "";
    }

    // SMART SYNC POLICY:
    // Mappedin CDN URLs use SAS tokens that expire after a few hours.
    // If the DB has a CDN URL, it's almost certainly expired - ALWAYS use SDK's fresh URL.
    const isExpiredCdnUrl = img && img.includes("cdn.mappedin.com");
    const isFakeOrEmpty = !img || img.includes("unsplash.com") || img === "NULL";

    if (isFakeOrEmpty || isExpiredCdnUrl) {
      if (nativeImage) {
        img = nativeImage;
        console.log("Using fresh SDK image instead of expired DB URL");
      }
    }

    // If DB description is empty or looks fake (starts with Lorem), use Native
    if (!descVI || descVI.startsWith("Lorem") || descVI === "NULL") {
      if (nativeDesc) descVI = nativeDesc;
    }

    // AUTO-TRANSLATE (REAL API)
    if (descVI && (!descEN || !descZH || !descJA || !descKO)) {
      const translate = async (text: string, to: string, elId: string) => {
        if ((document.getElementById(elId) as HTMLTextAreaElement).value) return;

        (document.getElementById(elId) as HTMLTextAreaElement).value = "Translating...";
        try {
          const res = await fetch('http://localhost:3002/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, to })
          });
          const data = await res.json();
          if (data.translatedText) {
            (document.getElementById(elId) as HTMLTextAreaElement).value = data.translatedText;
          }
        } catch (e) {
          console.error("Translation failed", e);
          (document.getElementById(elId) as HTMLTextAreaElement).value = text;
        }
      };

      if (!descEN) translate(descVI, 'en', 'info-en');
      if (!descZH) translate(descVI, 'zh-CN', 'info-zh');
      if (!descJA) translate(descVI, 'ja', 'info-ja');
      if (!descKO) translate(descVI, 'ko', 'info-ko');
    }

    // Policy for Names: If DB names are empty, use Native Mappedin Name
    if (!nameVI) nameVI = nativeName;
    if (!nameEN) nameEN = nativeName;
    if (!nameZH) nameZH = nativeName;
    if (!nameJA) nameJA = nativeName;
    if (!nameKO) nameKO = nativeName;

    // Populate UI - Names
    if (nameInputs.vi) nameInputs.vi.value = nameVI;
    if (nameInputs.en) nameInputs.en.value = nameEN;
    if (nameInputs.zh) nameInputs.zh.value = nameZH;
    if (nameInputs.ja) nameInputs.ja.value = nameJA;
    if (nameInputs.ko) nameInputs.ko.value = nameKO;

    // Populate UI - Descriptions
    (document.getElementById('info-vi') as HTMLTextAreaElement).value = descVI;
    (document.getElementById('info-en') as HTMLTextAreaElement).value = descEN;
    (document.getElementById('info-zh') as HTMLTextAreaElement).value = descZH;
    (document.getElementById('info-ja') as HTMLTextAreaElement).value = descJA;
    (document.getElementById('info-ko') as HTMLTextAreaElement).value = descKO;

    imgInput.value = img;
    updateImagePreview(img);
  };

  // Switch Tabs (Event Delegation)
  const modalEl = document.getElementById('admin-info-modal');
  if (modalEl) {
    modalEl.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.tab-btn');
      if (!btn) return;

      console.log('Tab clicked:', btn);

      // Remove active class from all tabs
      modalEl.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        (b as HTMLElement).style.borderBottom = '2px solid transparent';
        (b as HTMLElement).style.fontWeight = 'normal';
      });
      btn.classList.add('active');
      (btn as HTMLElement).style.borderBottom = '2px solid #085ebb';
      (btn as HTMLElement).style.fontWeight = '600';

      // Show specific content
      const lang = (btn as HTMLElement).dataset.lang;
      console.log('Switching to language:', lang);
      modalEl.querySelectorAll('.tab-content').forEach(c => (c as HTMLElement).style.display = 'none');

      const content = document.getElementById(`tab-content-${lang}`);
      if (content) {
        content.style.display = 'block';
      } else {
        console.error(`Content not found for lang: ${lang}`);
      }
    });
  }

  // Image Preview (Simplified)
  const updateImagePreview = (url: string) => {
    console.log("Loading preview:", url);
    if (url && url.length > 5) {
      imgPreview.src = url;
      imgPreview.style.display = 'block';
      noImageText.style.display = 'none';
    } else {
      imgPreview.src = "";
      imgPreview.style.display = 'none';
      noImageText.style.display = 'block';
      noImageText.textContent = "No Image";
    }
  };

  imgPreview.onerror = () => {
    console.warn("Direct image load failed:", imgPreview.src);
    imgPreview.style.display = 'none';
    noImageText.style.display = 'block';
    noImageText.textContent = "Lỗi tải ảnh";
  };

  imgInput.addEventListener('input', () => updateImagePreview(imgInput.value));

  btnTriggerUpload.onclick = () => fileInput.click();

  fileInput.onchange = () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    uploadStatus.textContent = "Đang upload...";
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        const apiOrigin = window.location.origin.includes(':8080')
          ? window.location.origin.replace(':8080', ':3002')
          : `${window.location.protocol}//${window.location.hostname}:3002`;

        const res = await fetch(`${apiOrigin}/api/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, filename: file.name })
        });
        const data = await res.json();
        if (data.url) {
          // Robust URL handling: ensure the URL uses the same host user is currently on
          let finalUrl = data.url;
          if (finalUrl.includes('localhost:3002') && !window.location.hostname.includes('localhost')) {
            finalUrl = finalUrl.replace('localhost:3002', window.location.host.replace(':8080', ':3002'));
          }

          imgInput.value = finalUrl;
          updateImagePreview(finalUrl);
          uploadStatus.textContent = "Upload thành công!";
          setTimeout(() => uploadStatus.textContent = "", 3000);
        } else {
          uploadStatus.textContent = "Lỗi: " + (data.error || "Unknown");
        }
      } catch (err) {
        console.error(err);
        uploadStatus.textContent = "Lỗi kết nối server!";
      }
      // Reset input so same file can be selected again
      fileInput.value = "";
    };
    reader.readAsDataURL(file);
  };

  // Save Data
  const btnSave = document.getElementById('btn-save-admin');
  if (btnSave) {
    btnSave.onclick = async () => {
      const id = select.value;
      if (!id) return;

      const originalText = TranslationManager.t('save_changes_btn', 'Lưu Thay Đổi');
      btnSave.textContent = "⏳ " + TranslationManager.t('saving_status', 'Đang lưu...');
      (btnSave as HTMLButtonElement).disabled = true;

      // Catch current Mappedin Editor URL to act as baseline
      const objects = (window as any).allMapObjects || allMapObjects;
      const rawObj = objects.find((o: any) => o.id === id);
      let currentMappedinImg = "";
      if (rawObj) {
        if (rawObj.image) {
          currentMappedinImg = typeof rawObj.image === 'string' ? rawObj.image : (rawObj.image.url || rawObj.image.src || "");
        } else if (rawObj.images && rawObj.images.length > 0) {
          const first = rawObj.images[0];
          currentMappedinImg = typeof first === 'string' ? first : (first.url || first.src || "");
        }
      }

      const payload = {
        id: id,
        name_vi: nameInputs.vi?.value || '',
        name_en: nameInputs.en?.value || '',
        name_zh: nameInputs.zh?.value || '',
        name_ja: nameInputs.ja?.value || '',
        name_ko: nameInputs.ko?.value || '',
        vn: (document.getElementById('info-vi') as HTMLTextAreaElement).value,
        en: (document.getElementById('info-en') as HTMLTextAreaElement).value,
        zh: (document.getElementById('info-zh') as HTMLTextAreaElement).value,
        ja: (document.getElementById('info-ja') as HTMLTextAreaElement).value,
        ko: (document.getElementById('info-ko') as HTMLTextAreaElement).value,
        imageUrl: imgInput.value,
        mappedinImageUrl: currentMappedinImg
      };

      try {
        const apiOrigin = window.location.origin.includes(':8080')
          ? window.location.origin.replace(':8080', ':3002')
          : `${window.location.protocol}//${window.location.hostname}:3002`;

        const res = await fetch(`${apiOrigin}/api/update-area-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          // Show Success Popup instead of alert
          const popup = document.getElementById('success-popup');
          if (popup) {
            popup.style.display = 'flex';
            // Auto hide logic handled by popup OK button, but let's re-attach listener
            const okBtn = popup.querySelector('#btn-success-ok');
            if (okBtn) {
              okBtn.addEventListener('click', () => {
                popup.style.display = 'none';
                closeModal();
                // Force reload to see changes as requested "updated into database"
                location.reload();
              }, { once: true });
            }
          } else {
            alert("✅ Lưu thành công! Vui lòng reload trang.");
            closeModal();
          }
        } else {
          alert("❌ Lưu thất bại");
        }
      } catch (err) {
        console.error(err);
        alert("❌ Lỗi kết nối server");
      } finally {
        btnSave.textContent = originalText;
        (btnSave as HTMLButtonElement).disabled = false;
      }
    };
  }



  // Auto-open if URL has ?admin=true
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('admin')) {
      modal.classList.remove('hidden');
      populateAreaSelect();
      if (btnOpen) {
        btnOpen.classList.add('active');
      }
    }
  } catch (e) { }
  // Listen for language changes to update the dropdown names dynamically
  window.addEventListener('language-change', () => {
    if (!modal.classList.contains('hidden')) {
      populateAreaSelect(searchFilter.value);
    }
  });
}

// Init Search Clear Button logic
init();

// Hook helper to run after init
const originalInit = (window as any).debugLogAllNames;

export function initAreaColorUI(allMapObjects: any[], mapView: any, mapData: any) {
  const modal = document.getElementById("area-color-modal");
  const btnOpen = document.getElementById("btn-open-area-color");
  const btnClose = document.getElementById("btn-close-area-color");
  const btnApply = document.getElementById("btn-apply-area-color");
  const btnClear = document.getElementById("btn-clear-area-color");
  const searchInput = document.getElementById("color-area-search") as HTMLInputElement;
  const listContainer = document.getElementById("color-area-list");
  const colorPicker = document.getElementById("area-color-picker") as HTMLInputElement;
  const colorHex = document.getElementById("area-color-hex") as HTMLInputElement;

  let selectedAreaIds = new Set<string>();

  if (!modal || !btnOpen || !listContainer) return;

  // Render checkbox list
  const renderList = (filter = "") => {
    let spaces = mapData.getByType('space');

    // Filter out unnamed spaces
    spaces = spaces.filter((s: any) => s.name && s.name.trim() !== '' && !s.name.toLowerCase().includes("khu vực không tên"));

    // Convert to arrays and sort
    const items = spaces.map((s: any) => {
      const name = TranslationManager.getName(s) || s.name || s.id;
      let floorName = s.floor?.name;
      const floorId = s.floor?.id;
      if (floorId && TranslationManager?.data?.floors) {
        let floorData = TranslationManager.data.floors.find((f: any) => f.mappedinId === floorId || f.code === floorId);
        if (!floorData) {
          const nameLookup = (floorName || "").toLowerCase();
          const isOverview = nameLookup.includes('overview') || nameLookup.includes('tổng quan') || nameLookup.includes('tong quan') || nameLookup.includes('toàn cảnh');
          if (isOverview) {
            floorData = TranslationManager.data.floors.find((f: any) => f.code === 'OVERVIEW');
          }
        }
        if (floorData?.names?.[TranslationManager.currentLang]) {
          floorName = floorData.names[TranslationManager.currentLang];
        }
      }
      return { id: s.id, name, floor: floorName || '' };
    });

    items.sort((a: any, b: any) => a.name.localeCompare(b.name));

    const term = filter.toLowerCase();
    const visibleItems = items.filter((i: any) => i.name.toLowerCase().includes(term));

    const allChecked = visibleItems.length > 0 && visibleItems.every((i: any) => selectedAreaIds.has(i.id));

    listContainer.innerHTML = `
      <div style="border-bottom:1px solid #ddd; padding-bottom:5px; margin-bottom:5px; font-weight:bold;">
        <input type="checkbox" id="color-chk-all" ${allChecked ? 'checked' : ''}>
        <label for="color-chk-all" style="cursor:pointer;">Chọn tất cả khu vực hiển thị</label>
      </div>
      ${visibleItems.map((item: any) => {
      const checked = selectedAreaIds.has(item.id) ? 'checked' : '';
      return `
          <div style="display:flex; align-items:flex-start; margin-bottom:6px;">
            <input type="checkbox" class="color-area-checkbox" id="color-chk-${item.id}" value="${item.id}" ${checked} style="margin-top:3px;">
            <label for="color-chk-${item.id}" style="cursor:pointer; line-height:1.2; font-size:13px; color:#333; flex:1; margin-left:8px;">
               <div style="font-weight:500;">${item.name}</div>
               ${item.floor ? `<div style="font-size:11px; color:#888; margin-top:2px;">Tầng: ${item.floor}</div>` : ''}
            </label>
          </div>
        `;
    }).join('')}
    `;

    // Attach events
    const chkAll = document.getElementById("color-chk-all") as HTMLInputElement;
    if (chkAll) {
      chkAll.onchange = (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        visibleItems.forEach((item: any) => {
          if (checked) selectedAreaIds.add(item.id);
          else selectedAreaIds.delete(item.id);
        });
        renderList(filter); // Re-render to update checks
      };
    }

    const checkboxes = listContainer.querySelectorAll('.color-area-checkbox');
    checkboxes.forEach((chk: any) => {
      (chk as HTMLInputElement).onchange = (e: any) => {
        if (e.target.checked) selectedAreaIds.add(e.target.value);
        else selectedAreaIds.delete(e.target.value);

        // Recheck 'select all'
        const allVisibleChecked = visibleItems.every((i: any) => selectedAreaIds.has(i.id));
        if (chkAll) chkAll.checked = allVisibleChecked;

        // If exactly 1 item is selected, display its current color
        if (selectedAreaIds.size === 1) {
          try {
            const customColors = JSON.parse(localStorage.getItem('customAreaColors') || '{}');
            const singleId = Array.from(selectedAreaIds)[0];
            const singleObj = spaces.find((s: any) => s.id === singleId);
            const currentColor = customColors[singleId] || (singleObj?.name ? "#FFFFFF" : "#eeece7");
            colorPicker.value = currentColor;
            colorHex.value = currentColor;
          } catch (e) { }
        }
      };
    });
  };

  // Inputs sync
  colorPicker.oninput = (e) => {
    colorHex.value = (e.target as HTMLInputElement).value;
  };
  colorHex.oninput = (e) => {
    const val = (e.target as HTMLInputElement).value;
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      colorPicker.value = val;
    }
  };

  searchInput.oninput = () => {
    renderList(searchInput.value);
  };

  // Open Handlers
  btnOpen.addEventListener("click", () => {
    modal.classList.remove("hidden");
    selectedAreaIds.clear();
    searchInput.value = "";
    renderList();
  });

  btnClose?.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Apply colors
  btnApply?.addEventListener("click", () => {
    if (selectedAreaIds.size === 0) {
      alert("Vui lòng chọn ít nhất một khu vực!");
      return;
    }
    const color = colorHex.value;
    const spaces = mapData.getByType('space');
    let count = 0;

    const customColors = JSON.parse(localStorage.getItem('customAreaColors') || '{}');

    for (const space of spaces) {
      if (selectedAreaIds.has(space.id)) {
        customColors[space.id] = color;
        try {
          mapView.updateState(space, { color: color });
          count++;
        } catch (e) { console.error("Error setting color", e); }
      }
    }
    localStorage.setItem('customAreaColors', JSON.stringify(customColors));
    if (typeof (window as any).refreshMapColors === 'function') {
      (window as any).refreshMapColors();
    }
    const successPopup = document.getElementById("success-popup");
    const okBtn = document.getElementById("btn-success-ok");
    if (successPopup && okBtn) {
      const msgEl = successPopup.querySelector('p');
      if (msgEl) msgEl.textContent = `Đã đổi màu nền thành công cho ${count} khu vực!`;
      successPopup.style.display = "flex";
      okBtn.onclick = () => successPopup.style.display = "none";
    } else {
      alert(`Đã đổi màu nền thành công cho ${count} khu vực!`);
    }
    modal.classList.add("hidden");
  });

  // Clear colors
  btnClear?.addEventListener("click", () => {
    if (selectedAreaIds.size === 0) {
      alert("Vui lòng chọn ít nhất một khu vực!");
      return;
    }
    const spaces = mapData.getByType('space');
    let count = 0;

    const customColors = JSON.parse(localStorage.getItem('customAreaColors') || '{}');

    for (const space of spaces) {
      if (selectedAreaIds.has(space.id)) {
        delete customColors[space.id];
        try {
          const defaultColor = space.name ? "#FFFFFF" : "#eeece7";
          mapView.updateState(space, { color: defaultColor });
          count++;
        } catch (e) { }
      }
    }
    localStorage.setItem('customAreaColors', JSON.stringify(customColors));
    if (typeof (window as any).refreshMapColors === 'function') {
      (window as any).refreshMapColors();
    }
    const successPopup = document.getElementById("success-popup");
    const okBtn = document.getElementById("btn-success-ok");
    if (successPopup && okBtn) {
      const msgEl = successPopup.querySelector('p');
      if (msgEl) msgEl.textContent = `Đã xóa màu nền thành công cho ${count} khu vực!`;
      successPopup.style.display = "flex";
      okBtn.onclick = () => successPopup.style.display = "none";
    } else {
      alert(`Đã xóa màu nền thành công cho ${count} khu vực!`);
    }
    modal.classList.add("hidden");
  });

  // Export for individual edit support
  (window as any).openAreaColorModalForSingleSpace = (space: any) => {
    modal.classList.remove("hidden");
    selectedAreaIds.clear();
    selectedAreaIds.add(space.id);
    searchInput.value = TranslationManager.getName(space) || space.name || space.id;

    // Set the color picker to the current space's color
    try {
      const customColors = JSON.parse(localStorage.getItem('customAreaColors') || '{}');
      const currentColor = customColors[space.id] || (space.name ? "#FFFFFF" : "#eeece7");
      colorPicker.value = currentColor;
      colorHex.value = currentColor;
    } catch (e) { }

    renderList(searchInput.value);
  };
}

// Custom Speed Dropdown logic
const speedDisplay = document.getElementById("speed-selected-display");
const speedMenu = document.getElementById("speed-options-menu");
const speedValueText = document.getElementById("speed-value-text");
const speedItems = document.querySelectorAll(".speed-item");

if (speedDisplay && speedMenu) {
  speedDisplay.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = speedMenu.style.display === "block";
    speedMenu.style.display = isOpen ? "none" : "block";
    speedDisplay.style.borderColor = isOpen ? "#e9ecef" : "#214ca6";
  });

  document.addEventListener("click", () => {
    speedMenu.style.display = "none";
    if (speedDisplay) speedDisplay.style.borderColor = "#e9ecef";
  });

  speedItems.forEach(item => {
    item.addEventListener("click", () => {
      const value = (item as HTMLElement).dataset.value;
      const text = (item as HTMLElement).textContent;
      if (value && speedValueText) {
        const speed = parseFloat(value);
        if (typeof (window as any).setAnimationSpeed === 'function') {
          (window as any).setAnimationSpeed(speed);
        } else {
          (window as any).speedMultiplier = speed;
        }
        speedValueText.textContent = text;

        // Cập nhật UI menu
        speedItems.forEach(i => {
          (i as HTMLElement).style.background = 'transparent';
          (i as HTMLElement).style.color = '#4a5568';
        });
        (item as HTMLElement).style.background = '#f0f6ff';
        (item as HTMLElement).style.color = '#214ca6';
      }
    });
  });
}
