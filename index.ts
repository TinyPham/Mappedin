import { getMapData, show3dMap } from "@mappedin/mappedin-js";
import { BlueDot } from "@mappedin/blue-dot";
import { car, tree_palm } from "@mappedin/3d-assets";

import "./styles.css";
import {
  buildSubCategoryLocationEntries,
  buildVisibleCategoryAreas,
  hasAssignmentsOnVisibleFloor,
  mergeLocationRowsByMappedinId,
  normalizeLocationRecord,
  normalizeOptionalNumber
} from "./categoryPanelData.js";
import { shouldRenderFlightNavigationActions } from "./flightNavigationActions.js";
import {
  createInstructionFormatter,
  ensureMinimumRouteInstructions,
  getRouteDisplayDistanceMeters,
  getInstructionDisplayDistance,
  shouldRenderNavigationInstruction,
  simplifyNavigationInstructions
} from "./navigationInstructionRules.js";
import {
  getObjectRouteReferenceCoordinate,
  resolveWayfindingRouteTarget,
  resolveWayfindingRouteTargets
} from "./wayfindingRouteTargets.js";
import { rankWayfindingSearchResults } from "./wayfindingSearchRules.js";
import { getCategoryAreaListStyle } from "./categoryDropdownLayout.js";
import { getModelStreamingZoomThresholds } from "./modelStreamingThresholds.js";
import {
  STARTUP_CAMERA_ROTATION_DURATION_MS,
  STARTUP_CAMERA_ZOOM_DELAY_MS,
  STARTUP_CAMERA_ZOOM_DURATION_MS,
  STARTUP_GUIDE_AFTER_ROTATION_BUFFER_MS,
  STARTUP_GUIDE_OPEN_DELAY_MS,
  shouldAutoOpenUserGuide,
  waitForStartupCameraRotation
} from "./tutorialAutoOpen.js";
import { getTutorialDevice } from "./tutorialDevice.js";
import { tutorialSteps } from "./tutorialSteps.js";

// Global Declarations to resolve scope issues
let ApiService: any = null;
interface ModelMetadata {
  url: string;
  uuid: string;
  name: string;
  desc: string;
  rotation: number[];
  scale: number[];
  originalCoordinate: any;
  floorId?: string;
  thumb?: string;
  displayWebsite?: number | boolean;
  elevation?: number;
}
function getApiBaseUrl(): string {
  const hostname = window.location.hostname;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.startsWith("172.");
  // If local dev environment, point to backend on port 3002, otherwise use current origin
  return isLocal ? `http://${hostname}:3002/api` : `${window.location.origin}/api`;
}

// Helper: Check if running in local environment
function checkIsLocal(): boolean {
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.startsWith("172.");
}

const isViewOnly = (function () {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAdminParam = urlParams.get('admin') === 'true';
    const hasViewOnlyParam = urlParams.get('viewOnly') === 'true' || urlParams.get('viewonly') === 'true';

    // If explicitly requested admin, show admin tools
    if (hasAdminParam) return false;

    // If explicitly requested view-only
    if (hasViewOnlyParam) return true;

    // Check environment (Iframe or specific port)
    const isIframe = window.self !== window.top;
    const isWebsiteHost = window.location.port === '7141' || document.referrer.includes(':7141');

    // DEFAULT: Hide admin buttons on main UI unless ?admin=true is present
    return true;
  } catch (e) { return true; }
})();

// Detect Mobile Device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Apply global hide style ASAP if viewOnly
if (isViewOnly) {
  const style = document.createElement('style');
  style.textContent = `
    #btn-add-model, #btn-open-classification, #btn-open-admin-info, #btn-open-area-color, .sidebar-actions, #controls-panel {
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

/**
 * Tính diện tích Polygon (m2) dựa trên tọa độ Lat/Lng
 */
function calculatePolygonArea(coordinates: any[]): number {
  if (!coordinates || coordinates.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    area += coordinates[i].longitude * coordinates[j].latitude;
    area -= coordinates[j].longitude * coordinates[i].latitude;
  }
  area = Math.abs(area) / 2;
  // Chuyển đổi từ độ sang mét vuông xấp xỉ (tại Long Thành: 1 deg lat ~ 111km, 1 deg lng ~ 109km)
  return area * 111111 * 109000;
}

/**
 * Loại bỏ dấu tiếng Việt để phục vụ tìm kiếm không dấu
 */
function removeVietnameseTones(str: string): string {
  if (!str) return "";
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  // Some system combine normal characters with combine characters
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  return str;
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
    locations: {},
    areaColors: {}
  };

  // NEW: Immediate detection logic to prevent UI flicker
  static {
    try {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const langParam = params.get('lang');
      const langSegment = (path.split('/')[1] || "").toLowerCase();

      if (langParam) {
        const lpLower = langParam.toLowerCase();
        if (['vn', 'en', 'zh', 'ja', 'ko'].includes(lpLower)) {
          this.currentLang = lpLower;
        }
      } else if (['vn', 'en', 'zh', 'ja', 'ko'].includes(langSegment)) {
        this.currentLang = langSegment;
      } else {
        this.currentLang = 'vn';
      }
    } catch (e) {
      this.currentLang = 'vn';
    }
  }

  static async init() {
    try {
      // Dynamic API URL resolution
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/init-data`);
      const json = await res.json();
      const normalizedLocations: Record<string, any> = {};
      Object.values(json?.locations || {}).forEach((location: any) => {
        const normalized = normalizeLocationRecord(location);
        if (normalized.MappedinID) {
          normalizedLocations[normalized.MappedinID] = normalized;
        }
      });
      this.data = {
        ...json,
        locations: normalizedLocations,
        areaColors: json?.areaColors || {}
      };
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
        // Nếu selector đã có giá trị (do browser cache hoặc SSR), ưu tiên nó
        if (selector.value && ['vn', 'en', 'zh', 'ja', 'ko'].includes(selector.value)) {
          this.currentLang = selector.value;
        } else {
          selector.value = this.currentLang;
        }

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
    'pwa_install_title': {
      'vn': 'Trải nghiệm tốt hơn với ứng dụng',
      'en': 'Get a better experience with our app',
      'zh': '使用应用获得更好的体验',
      'ja': 'アプリでより快適な体験を',
      'ko': '앱으로 더 나은 경험을 누려보세요'
    },
    'pwa_install_btn_label': {
      'vn': 'Cài đặt 3D Map',
      'en': 'Install 3D Map',
      'zh': '安装 3D 地图',
      'ja': '3Dマップをインストール',
      'ko': '3D 지도 설치하기'
    },
    'guide_btn_done': {
      'vn': 'Đã xong',
      'en': 'Done',
      'zh': '完成',
      'ja': '完了',
      'ko': '완료'
    },
    'guide_title_mobile_map_overview': {
      'vn': 'Làm quen bản đồ',
      'en': 'Explore the 3D Map',
      'zh': '熟悉地图',
      'ja': '3Dマップの操作',
      'ko': '3D 지도 시작하기'
    },
    'guide_desc_mobile_map_overview': {
      'vn': 'Chào mừng bạn đến với Bản đồ 3D! Hãy thử dùng 1 ngón tay vuốt nhẹ để di chuyển bản đồ, hoặc chụm/mở 2 ngón để phóng to, thu nhỏ và khám phá toàn cảnh sân bay nhé.',
      'en': 'Welcome to the 3D Map! Simply swipe with 1 finger to move the map, or pinch/spread 2 fingers to zoom in and out to explore the entire airport.',
      'zh': '欢迎来到3D地图！只需用单指滑动即可移动地图，或者用双指捏合/张开以进行缩放，探索机场的全景。',
      'ja': '3Dマップへようこそ！指1本でスワイプして地図を移動し、指2本でピンチイン・アウトしてズームし、空港の全景を探索できます。',
      'ko': '3D 지도에 오신 것을 환영합니다! 한 손가락으로 가볍게 밀어 지도를 이동하거나, 두 손가락을 모으고 벌려 공항 전체를 확대/축소하여 탐색해 보세요.'
    },
    'guide_title_mobile_search': {
      'vn': 'Tìm kiếm nhanh',
      'en': 'Quick Search',
      'zh': '快速搜索',
      'ja': 'クイック検索',
      'ko': '빠른 검색'
    },
    'guide_desc_mobile_search': {
      'vn': 'Bạn muốn đi đâu? Chỉ cần nhập tên cửa hàng, quầy thủ tục hoặc dịch vụ vào ô này. Chạm vào kết quả và bản đồ sẽ tự động xoay và di chuyển mượt mà đưa bạn tới vị trí đó ngay lập tức.',
      'en': 'Where would you like to go? Just enter the name of a shop, check-in counter, or service. Tap the result and the map will smoothly fly you to its location instantly.',
      'zh': '您想去哪里？只需在此输入商店、值机柜台或服务的名称。点击结果，地图将立即平滑地移动并带您前往该位置。',
      'ja': 'どこへ行きたいですか？ショップ、チェックインカウンター、サービスの名称を入力するだけです。結果をタップすると、地図がスムーズに移動してその場所に案内します。',
      'ko': '어디로 가고 싶으신가요? 상점, 체크인 카운터 또는 서비스 이름을 입력해 보세요. 결과를 터치하면 지도가 부드럽게 회전 및 이동하여 해당 위치로 즉시 안내해 드립니다.'
    },
    'guide_title_mobile_category_toggle': {
      'vn': 'Mở nhanh danh mục',
      'en': 'Quick Categories',
      'zh': '快速分类',
      'ja': 'クイックカテゴリー',
      'ko': '카테고리 퀵 메뉴'
    },
    'guide_desc_mobile_category_toggle': {
      'vn': 'Khám phá thêm bằng cách chạm vào nút mũi tên nhỏ ở góc ô tìm kiếm để mở hoặc đóng nhanh danh sách dịch vụ đa dạng trên tầng hiện tại.',
      'en': 'Discover more by tapping the small arrow button in the search box to quickly open or close the rich service categories available on the current floor.',
      'zh': '点击搜索栏角落的小箭头按钮，即可快速打开或关闭当前楼层可用的丰富服务分类，发现更多精彩。',
      'ja': '検索ボックスの角にある小さな矢印ボタンをタップすると、現在のフロアで利用可能な豊富なサービスカテゴリーを素早く開閉できます。',
      'ko': '검색창 모퉁이에 있는 작은 화살표 버튼을 터치하여 현재 층의 다양한 서비스 카테고리를 빠르게 열고 닫으며 더 많은 서비스를 발견해 보세요.'
    },
    'guide_title_mobile_category_list': {
      'vn': 'Khám phá dịch vụ',
      'en': 'Discover Services',
      'zh': '探索服务',
      'ja': 'サービスを検索',
      'ko': '서비스 탐색'
    },
    'guide_desc_mobile_category_list': {
      'vn': 'Từ Ăn uống, Mua sắm đến Nhà thuốc hay Thư giãn... Chỉ một chạm vào danh mục, tất cả các địa điểm liên quan sẽ hiển thị rõ ràng trên bản đồ để bạn tha hồ lựa chọn.',
      'en': 'From Dining and Shopping to Pharmacy or Relaxation... With just one tap on a category, all related locations will be highlighted on the map for your convenience.',
      'zh': '从餐饮、购物到药房或放松休闲……只需点击一个分类，所有相关地点都将清晰地在地图上标出，方便您挑选。',
      'ja': 'レストランやショップから薬局、リラクゼーションまで… カテゴリーを1回タップするだけで、関連するすべての場所が地図上に明確に表示され、選択しやすくなります。',
      'ko': '식음료, 쇼핑부터 약국, 휴식 공간까지... 카테고리를 한 번만 터치하면 관련된 모든 장소가 지도 위에 명확히 표시되어 편리하게 선택하실 수 있습니다.'
    },
    'guide_title_mobile_floor': {
      'vn': 'Chuyển tầng dễ dàng',
      'en': 'Easy Floor Selector',
      'zh': '轻松切换楼层',
      'ja': '簡単な階層切替',
      'ko': '편리한 층간 이동'
    },
    'guide_desc_mobile_floor': {
      'vn': 'Sân bay có nhiều tầng? Đừng lo, hãy chạm nút chọn tầng ở góc dưới này để dễ dàng chuyển qua lại giữa các tầng hoặc xem toàn cảnh 3D của nhà ga.',
      'en': 'Multiple floors in the airport? Don\'t worry, just tap the floor selector at the bottom to easily switch between floors or view the 3D terminal overview.',
      'zh': '机场有多楼层？别担心，只需点击底部的楼层选择器，即可轻松切换楼层或查看航站楼的3D全景。',
      'ja': '空港に複数のフロアがありますか？心配いりません。底部のフロアセレクターをタップするだけで、フロア間を簡単に切り替えるか、ターミナルの3D全景を表示できます。',
      'ko': '공항에 여러 층이 있어도 걱정 마세요! 아래에 있는 층 선택 버튼을 터치하여 각 층 사이를 간편하게 전환하거나 여객터미널의 3D 전체 전경을 확인해 보세요.'
    },
    'guide_title_mobile_language': {
      'vn': 'Ngôn ngữ toàn cầu',
      'en': 'Global Languages',
      'zh': '全球语言',
      'ja': '多言語対応',
      'ko': '글로벌 언어 지원'
    },
    'guide_desc_mobile_language': {
      'vn': 'Bản đồ hỗ trợ đa ngôn ngữ! Bạn có thể chuyển đổi nhanh chóng sang Tiếng Việt, Tiếng Anh, Trung, Nhật, Hàn... để việc tìm đường và tra cứu thuận tiện nhất.',
      'en': 'The map supports multiple languages! You can quickly switch to Vietnamese, English, Chinese, Japanese, Korean... for the most convenient navigation.',
      'zh': '地图支持多语言！您可以快速切换到越南语、英语、中文、日语、韩语……以便更方便地寻找路线和查询信息。',
      'ja': '地図は多言語に対応しています！ベトナム語、英語、中国語、日本語、韓国語に素早く切り替えることができ、最も便利なルート検索と照会が可能です。',
      'ko': '지도는 다국어를 지원합니다! 한국어, 베트남어, 영어, 중국어, 일본어 등으로 빠르게 전환하여 가장 편리하게 길을 찾고 정보를 검색하실 수 있습니다.'
    },
    'guide_title_mobile_theme': {
      'vn': 'Giao diện bản đồ',
      'en': 'Map Styles',
      'zh': '地图风格',
      'ja': '地図スタイル',
      'ko': '지도 테마 변경'
    },
    'guide_desc_mobile_theme': {
      'vn': 'Cá nhân hóa trải nghiệm với 4 tông màu độc đáo: Cổ điển tinh tế, Rực rỡ năng động, Xanh đêm dịu mắt hay Biển xanh mát mẻ để tối ưu tầm nhìn của bạn.',
      'en': 'Personalize your experience with 4 unique themes: Classic, Vibrant, Night Blue, or Beach Please to match your taste and optimize visibility.',
      'zh': '个性化您的体验！拥有4个独特的主题：经典、活力、夜蓝或阳光沙滩，以符合您的口味并优化可视性。',
      'ja': '個性を表現できる4つのユニークなテーマ：クラシック、バイブラント、ナイトブルー、ビーチプリーズからお好みに合わせて選択し、見やすさを最適化できます。',
      'ko': '취향에 따라 4가지 독특한 테마(클래식, 바이브런트, 나이트 블루, 비치 플리즈) 중 하나를 선택해 화면 밝기를 최적화하고 나만의 지도를 꾸며보세요.'
    },
    'guide_title_mobile_brightness': {
      'vn': 'Chế độ bảo vệ mắt',
      'en': 'Eye Comfort Brightness',
      'zh': '护眼亮度',
      'ja': 'アイケア輝度',
      'ko': '눈 보호 밝기 조절'
    },
    'guide_desc_mobile_brightness': {
      'vn': 'Dễ dàng điều chỉnh độ sáng bản đồ bằng thanh trượt hoặc nút cộng/trừ (+/-) để mắt bạn luôn dễ chịu dù ở trong nhà ga hay dưới trời nắng.',
      'en': 'Easily adjust the map brightness using the slider or +/- buttons to keep your eyes comfortable, whether you\'re inside the terminal or under the sun.',
      'zh': '使用滑块或 +/- 按钮轻松调节地图亮度，让您的眼睛保持舒适，无论是在航站楼内还是在烈日下。',
      'ja': 'スライダーや +/- ボタンで地図の明るさを簡単に調整できます。ターミナル内でも日差しの下でも、目を快適な状態に保ちます。',
      'ko': '터미널 내부나 야외 햇빛 아래에서도 눈이 편안할 수 있도록 슬라이더나 +/- 버튼을 이용해 지도의 밝기를 간편하게 조절해 보세요.'
    },
    'guide_title_mobile_wayfinding_entry': {
      'vn': 'Bắt đầu chỉ đường',
      'en': 'Get Directions',
      'zh': '开始导航',
      'ja': '経路案内を開始',
      'ko': '길찾기 시작'
    },
    'guide_desc_mobile_wayfinding_entry': {
      'vn': 'Cần tìm đường đi ngắn nhất? Hãy chạm vào tab "Chỉ đường" để bắt đầu thiết lập lộ trình di chuyển thông minh và tối ưu nhất của riêng bạn.',
      'en': 'Need the shortest route? Tap the "Directions" tab to start setting up your own smart and optimal transit route across the airport.',
      'zh': '需要最短的路线？点击“路线”标签，开始为您量身定制贯穿整个机场的最优智能路线。',
      'ja': '最短ルートが必要ですか？「経路」タブをタップして、空港内を移動するための独自のスマートで最適なルートの設定を開始します。',
      'ko': '가장 빠른 경로를 찾고 싶으신가요? \'길찾기\' 탭을 터치하여 나만의 스마트하고 최적화된 공항 내 이동 경로 설정을 시작해 보세요.'
    },
    'guide_title_mobile_wayfinding_points': {
      'vn': 'Lập lộ trình linh hoạt',
      'en': 'Flexible Routing',
      'zh': '灵活路径规划',
      'ja': '柔軟なルート設定',
      'ko': '자유로운 경로 설정'
    },
    'guide_desc_mobile_wayfinding_points': {
      'vn': 'Chỉ cần chọn điểm xuất phát và điểm đến mong muốn. Bạn cũng có thể thêm các điểm dừng chân trung gian (như quầy nước, nhà vệ sinh) trên đường đi.',
      'en': 'Simply choose your starting point and destination. You can also add intermediate stops (like cafes, lounges, or restrooms) along your way.',
      'zh': '只需选择您的起点和终点即可。您还可以在途中添加中间经停点（例如咖啡馆、贵宾厅或洗手间）。',
      'ja': '出発地と目的地を選択するだけです。移動の途中に経由地（カフェ、ラウンジ、トイレなど）を追加することもできます。',
      'ko': '출발지와 목적지를 선택하기만 하면 됩니다. 경로에 카페, 라운지, 화장실과 같은 경유지를 추가하여 이동할 수도 있습니다.'
    },
    'guide_title_mobile_wayfinding_route': {
      'vn': 'Chỉ dẫn chi tiết',
      'en': 'Step-by-Step Guide',
      'zh': '详细指示',
      'ja': '詳細な道案内',
      'ko': '단계별 상세 안내'
    },
    'guide_desc_mobile_wayfinding_route': {
      'vn': 'Tuyến đường tối ưu sẽ được vẽ trực quan trên bản đồ 3D kèm danh sách chỉ dẫn chi tiết từng bước, giúp bạn di chuyển cực kỳ tự tin và thong thả.',
      'en': 'The optimal route will be drawn visually on the 3D map with a step-by-step navigation list, helping you travel with total confidence and ease.',
      'zh': '最优路线将以可视化方式绘制在3D地图上，并配有详细的步骤指示列表，帮助您充满信心、轻松地前往目的地。',
      'ja': '最適なルートが3Dマップ上に視覚的に描かれ、詳細なステップバイステップの案内リストが表示されます。自信を持って快適に移動できます。',
      'ko': '최적의 경로가 3D 지도 위에 실시간으로 표시되며 단계별 상세 안내 목록이 제공되므로 낯선 공항에서도 자신 있게 이동하실 수 있습니다.'
    },
    'guide_title_mobile_location_detail': {
      'vn': 'Thông tin địa điểm',
      'en': 'Location Details',
      'zh': '地点信息',
      'ja': 'スポット情報',
      'ko': '상세 위치 정보'
    },
    'guide_desc_mobile_location_detail': {
      'vn': 'Chạm vào bất kỳ vị trí hay biểu tượng nào trên bản đồ để xem ngay hình ảnh thực tế, mô tả chi tiết, giờ hoạt động và nhanh chóng nhấn "Chỉ đường đến" hoặc "Đi từ đây".',
      'en': 'Tap any shop, gate, or marker on the map to see its photos, details, opening hours, and quickly hit "Directions to" or "Start from here".',
      'zh': '点击地图上的任意商店、登机口或标记，查看实景照片、详细描述、营业时间，并快速点击“导航至此”或“从此出发”。',
      'ja': '地図上の任意のショップ、搭乗口、マーカーをタップすると、実物写真、詳細、営業時間を確認でき、素早く「目的地に設定」や「出発地に設定」を実行できます。',
      'ko': '지도 위의 매장, 탑승구 또는 마커를 터치하여 실제 사진, 상세 정보, 운영 시간을 바로 확인하고 \'도착지로 설정\' 또는 \'출발지로 설정\'할 수 있습니다.'
    },
    'guide_title_mobile_flight_info': {
      'vn': 'Tra cứu chuyến bay',
      'en': 'Flight Board',
      'zh': '航班查询',
      'ja': 'フライト検索',
      'ko': '실시간 항공편 조회'
    },
    'guide_desc_mobile_flight_info': {
      'vn': 'Theo dõi lịch trình bay trực tiếp! Nhấn biểu tượng máy bay để tìm chuyến bay, sau đó nhấp vào Cổng bay hoặc Băng chuyền hành lý để bản đồ vẽ đường đi đón/tiễn ngay lập tức.',
      'en': 'Track your flights live! Tap the flight icon to search for your flight, then click on the gate or baggage belt for immediate pathfinding to greet or board.',
      'zh': '实时跟踪您的航班！点击航班图标搜索您的航班，然后点击登机口或行李提取传送带，即可立即规划路线去接机或登机。',
      'ja': 'フライトスケジュールをリアルタイム追跡！飛行機アイコンをタップしてフライトを検索し、搭乗口や手荷物受取所をクリックすると、すぐに出迎えや搭乗のためのルートが描かれます。',
      'ko': '실시간 항공편 일정을 확인해 보세요! 비행기 아이콘을 터치하여 항공편을 조회한 뒤, 표시된 탑승구 또는 수하물 수취대를 클릭하면 지도가 최적의 마중/탑승 경로를 즉시 안내해 드립니다.'
    },
    'guide_title_mobile_map_controls': {
      'vn': 'Tiện ích bản đồ',
      'en': 'Camera Controls',
      'zh': '地图工具',
      'ja': '便利な地図操作',
      'ko': '지도 유틸리티'
    },
    'guide_desc_mobile_map_controls': {
      'vn': 'Tận dụng các phím tắt nhanh ở rìa phải để bật/tắt toàn màn hình, phóng to, thu nhỏ hoặc nhấn biểu tượng Ngôi nhà để nhanh chóng đưa bản đồ về góc nhìn mặc định.',
      'en': 'Take advantage of the quick floating controls on the right to toggle fullscreen, zoom in, zoom out, or press the Home icon to instantly reset to default view.',
      'zh': '利用右侧浮动快捷键可开启/关闭全屏、放大、缩小，或按主页按钮瞬间将地图重置为默认视角。',
      'ja': '右端にあるクイックショートカットを活用して、全画面表示の切り替え、ズームイン、ズームアウトを行えます。ホームボタンを押せば、地図を素早く初期の角度に戻せます。',
      'ko': '오른쪽 가장자리에 있는 빠른 도구들을 활용하여 전체 화면 전환, 확대, 축소를 하거나 홈 아이콘을 터치하여 지도를 초기 기본 각도로 빠르게 되돌릴 수 있습니다.'
    },
    'guide_title_mobile_finish': {
      'vn': 'Trải nghiệm ngay!',
      'en': 'Ready to Go!',
      'zh': '立即体验！',
      'ja': '今すぐ体験！',
      'ko': '지금 체험하기!'
    },
    'guide_desc_mobile_finish': {
      'vn': 'Tuyệt vời! Bạn đã nắm rõ cách sử dụng bản đồ 3D Long Thành. Nếu cần xem lại hướng dẫn này, hãy nhấn vào nút chữ (i) bất kỳ lúc nào nhé. Chúc bạn có hành trình tuyệt vời!',
      'en': 'Fantastic! You\'ve mastered the Long Thanh 3D Map. If you ever need to view this guide again, just tap the (i) button anytime. Have an amazing trip!',
      'zh': '太棒了！您已完全掌握龙城国际机场3D地图的使用方法。如果您需要再次查看本指南，只需随时点击(i)按钮即可。祝您旅途愉快！',
      'ja': '素晴らしい！ロンタイン国際空港 glass 3Dマップの操作方法をマスターしました。このガイドをもう一度見たいときは、いつでも (i) ボタンをタップしてください。良い旅を！',
      'ko': '훌륭합니다! 이제 롱탄 국제공항 3D 지도 사용법을 모두 마스터하셨습니다. 이 안내가 다시 필요할 때는 언제든지 우측의 (i) 버튼을 터치해 주세요. 즐거운 여행 되세요!'
    },
    'guide_title_desktop_layout_overview': {
      'vn': 'Tổng quan giao diện',
      'en': 'Layout Overview',
      'zh': '界面总览',
      'ja': 'インターフェース全景',
      'ko': '화면 전체 개요'
    },
    'guide_desc_desktop_layout_overview': {
      'vn': 'Chào mừng bạn đến với Bản đồ 3D! Giao diện được tối ưu với Sidebar bên trái giúp bạn tìm kiếm, chọn dịch vụ và dẫn đường; kết hợp Bản đồ tương tác toàn cảnh ở bên phải.',
      'en': 'Welcome to the 3D Map! The interface features an optimized left sidebar for search, services, and routing, combined with the interactive 3D map panorama on the right.',
      'zh': '欢迎来到3D地图！界面左侧配有经过优化的侧边栏，用于搜索、服务和导航；右侧则是交互式3D地图全景。',
      'ja': '3Dマップへようこそ！インターフェースの左側に検索、サービス、経路案内に最適化されたサイドバーがあり、右側にインタラクティブな3Dマップの全景が表示されます。',
      'ko': '3D 지도에 오신 것을 환영합니다! 검색, 서비스 선택, 길찾기를 돕ng 최적의 좌측 사이드바와 역동적인 우측 3D 지도로 여정이 더욱 편리해집니다.'
    },
    'guide_title_desktop_map_buttons': {
      'vn': 'Thanh công cụ nhanh',
      'en': 'Quick Toolbar',
      'zh': '快捷工具栏',
      'ja': 'クイックツールバー',
      'ko': '빠른 도구 모음'
    },
    'guide_desc_desktop_map_buttons': {
      'vn': 'Sử dụng các phím tắt nhanh ở rìa phải để tra cứu chuyến bay trực tiếp, mở lại hướng dẫn này, chuyển chế độ toàn màn hình, phóng to/thu nhỏ hoặc quay lại góc nhìn mặc định.',
      'en': 'Use the quick shortcuts on the right edge to track live flights, reopen this user guide, toggle fullscreen, zoom in/out, or reset back to default camera angle.',
      'zh': '使用右侧的快捷栏实时查询航班、重新打开指南、切换全屏、放大/缩小，或重置为默认相机视角。',
      'ja': '右端にあるクイックショートカットを使用して、リアルタイムのフライト追跡、このユーザーガイドの再表示、全画面表示の切り替え、ズームイン/アウト、初期アングルへのリセットを行えます。',
      'ko': '우측 가장자리에 있는 단축 버튼들을 사용하여 실시간 항공편 조회, 가이드 다시 열기, 전체 화면 전환, 확대/축소, 또는 기본 화면 각도로 복원할 수 있습니다.'
    },
    'guide_title_desktop_map_rotation': {
      'vn': 'Tương tác Bản đồ 3D',
      'en': '3D Map Interaction',
      'zh': '3D地图互动',
      'ja': '3Dマップの操作方法',
      'ko': '3D 지도 제어'
    },
    'guide_desc_desktop_map_rotation': {
      'vn': 'Kéo chuột trái để di chuyển, cuộn chuột để phóng to/thu nhỏ. Đặc biệt, hãy giữ chuột phải và kéo (hoặc dùng cụm nút D-pad ở góc dưới) để xoay và nghiêng bản đồ cực kỳ mượt mà.',
      'en': 'Left-click and drag to pan, scroll to zoom. Crucially, hold right-click and drag (or use the D-pad in the bottom corner) to rotate and tilt the map smoothly.',
      'zh': '左键拖动可平移地图，滚动鼠标可放大/缩小。最关键的是，按住右键并拖动（或使用角落的D-pad）即可顺畅地旋转和倾斜3D透视图。',
      'ja': '左クリックでドラッグして移動、ホイールを回してズームします。さらに、右クリックしてドラッグする（またはコーナーにあるD-padを使用する）ことで、3Dパースペクティブをスムーズに回転・傾斜させることができます。',
      'ko': '마우스 왼쪽 버튼을 누른 채 끌어서 지도를 이동하고, 휠을 굴려 확대/축소해 보세요. 특히 마우스 오른쪽 버튼을 누른 채 끌거나(또는 구석의 D-pad 버튼 사용) 지도를 부드럽게 회전/기울여 3D 입체 화면을 탐색할 수 있습니다.'
    },
    'guide_title_desktop_search': {
      'vn': 'Tìm kiếm nhanh chóng',
      'en': 'Instant Search',
      'zh': '即时搜索',
      'ja': 'クイック検索',
      'ko': '간편한 검색'
    },
    'guide_desc_desktop_search': {
      'vn': 'Chỉ cần nhập tên cửa hàng, quầy thủ tục hoặc dịch vụ vào ô tìm kiếm. Click chọn kết quả và bản đồ sẽ tự động xoay và di chuyển mượt mà đưa bạn tới tận nơi.',
      'en': 'Simply type the name of a shop, check-in desk, or service. Click a search result and the map will automatically rotate and center to guide you right there.',
      'zh': '只需输入商店、值机台或服务的名称。点击搜索结果，地图将自动旋转并对齐，引导您直接前往该处。',
      'ja': 'ショップ、チェックインカウンター、サービスの名称を入力するだけです。結果をクリックすると、地図が自動的に回転して移動し、その場所へ正確に案内します。',
      'ko': '검색창에 매장, 탑승구, 서비스 이름을 입력해 보세요. 결과 목록을 클릭하면 지도가 자동 회전 및 이동하며 목적지까지 실시간으로 안내합니다.'
    },
    'guide_title_desktop_category': {
      'vn': 'Khám phá theo danh mục',
      'en': 'Browse Categories',
      'zh': '按分类浏览',
      'ja': 'カテゴリーから探す',
      'ko': '카테고리별 검색'
    },
    'guide_desc_desktop_category': {
      'vn': 'Dễ dàng duyệt nhanh các dịch vụ hàng đầu sân bay như Ăn uống, Mua sắm, Nhà thuốc... Click vào nhóm dịch vụ để xem danh sách và vị trí của chúng trên tầng hiện tại.',
      'en': 'Easily scan top airport services like Dining, Shopping, Pharmacy, and rest areas. Click a category to view the locations available on the current floor.',
      'zh': '轻松浏览餐饮、购物、药店和休息区等主要机场服务。点击一个分类，查看当前楼层有哪些服务设施。',
      'ja': 'レストランやショッピング、薬局、休憩エリアなど、空港内の主要サービスを簡単にスキャンできます。カテゴリーをクリックすると、現在のフロアで利用可能なスポット一覧が表示されます。',
      'ko': '식음료, 쇼핑, 약국, 휴게 구역 등 주요 공항 서비스 카테고리를 한눈에 볼 수 있습니다. 카테고리를 클릭하면 현재 층에 위치한 매장들을 한 번에 확인할 수 있습니다.'
    },
    'guide_title_desktop_floor': {
      'vn': 'Chuyển đổi tầng 3D',
      'en': 'Interactive Floors',
      'zh': '交互式楼层',
      'ja': 'インタラクティブ階層',
      'ko': '층별 화면 전환'
    },
    'guide_desc_desktop_floor': {
      'vn': 'Chạm vào menu này để chuyển đổi góc nhìn giữa các tầng của nhà ga (Tầng trệt, Tầng 1, Tầng 2, Tầng 3) hoặc quay về chế độ xem Toàn cảnh sân bay.',
      'en': 'Click this dropdown to switch the 3D map between terminal floors (Ground Floor, Floor 1, 2, 3) or return back to the overall airport layout view.',
      'zh': '点击此下拉菜单可切换航站楼各楼层（地面层、一楼、二楼、三楼），或返回查看机场整体全景规划。',
      'ja': 'このドロップダウンをクリックすると、ターミナルのフロア（地上階、1階、2階、3階）を切り替えるか、空港全体の全景マップ表示に戻ることができます。',
      'ko': '이 드롭다운 버튼을 클릭하여 여객터미널의 각 층(지상층, 1층, 2층, 3층) 화면으로 전환하거나 공항 전체 3D 종합 전경으로 돌아갈 수 있습니다.'
    },
    'guide_title_desktop_language': {
      'vn': 'Đa ngôn ngữ tiện lợi',
      'en': 'Multilingual Support',
      'zh': '多语言支持',
      'ja': '便利な多言語機能',
      'ko': '편리한 다국어 서비스'
    },
    'guide_desc_desktop_language': {
      'vn': 'Bản đồ hỗ trợ nhiều ngôn ngữ phổ biến (Tiếng Việt, English, 中文, 日本語, 한국어). Hệ thống sẽ tự động đồng bộ toàn bộ tên địa điểm và chỉ đường sang ngôn ngữ bạn chọn.',
      'en': 'The map supports standard languages (Vietnamese, English, Chinese, Japanese, Korean). The system synchronizes all locations and route texts to your chosen language.',
      'zh': '地图支持多种语言（越南语、英语、中文、日语、韩语）。系统会自动将所有地点名称和路线指示同步为您选择的语言。',
      'ja': '地図は主要言語（ベトナム語、英語、中国語、日本語、韓国語）に対応しています。システムはすべてのスポット名と経路案内文を、選択した言語に自動的に同期します。',
      'ko': '지도는 다양한 주요 언어(한국어, 베트남어, 영어, 중국어, 일본어)를 지원합니다. 언어를 선택하면 지도 내 모든 상점 명칭과 길안내 텍스트가 해당 언어로 자동 동기화됩니다.'
    },
    'guide_title_desktop_theme': {
      'vn': 'Phong cách hiển thị',
      'en': 'Visual Aesthetics',
      'zh': '视觉美学风格',
      'ja': '表示スタイル',
      'ko': '지도 테마 스타일'
    },
    'guide_desc_desktop_theme': {
      'vn': 'Lựa chọn 1 trong 4 chủ đề màu sắc được thiết kế riêng: Cổ điển sang trọng, Rực rỡ sắc nét, Xanh đêm êm dịu hay Biển xanh mát mắt để tối ưu hóa khả năng quan sát.',
      'en': 'Choose from 4 beautifully designed themes: Classic, Vibrant, Night Blue, or Beach Please to adjust the visuals and optimize map readability.',
      'zh': '从4款设计精美的主题中进行选择：经典、活力、夜蓝或阳光沙滩，调节视觉效果，优化地图可读性。',
      'ja': '美しくデザインされた4つのテーマ：クラシック、バイブラント、ナイトブルー、ビーチプリーズから選択して、視覚効果を調整し、地図の見やすさを最適化できます。',
      'ko': '클래식, 바이브런트, 나이트 블루, 비치 플리즈 등 아름답게 디자인된 4가지 테마 중 하나를 선택하여 지도의 가독성과 시각 디자인을 최적화해 보세요.'
    },
    'guide_title_desktop_brightness': {
      'vn': 'Điều tiết độ sáng',
      'en': 'Brightness Control',
      'zh': '亮度调节',
      'ja': '明るさの調整',
      'ko': '화면 밝기 제어'
    },
    'guide_desc_desktop_brightness': {
      'vn': 'Kéo thanh trượt hoặc dùng phím cộng/trừ (+/-) để tăng/giảm độ sáng của bản đồ, giúp chống lóa và bảo vệ mắt bạn tốt nhất trong mọi môi trường ánh sáng.',
      'en': 'Drag the slider or press the +/- keys to increase or decrease map brightness, helping prevent glare and protecting your eyes in any light environment.',
      'zh': '拖动滑块或按 +/- 键增加或降低地图亮度，有效防止眩光，在任何光线环境下都能保护您的视力。',
      'ja': 'スライダーをドラッグするか +/- キーを押して地図の明るさを調整できます。まぶしさを防ぎ、あらゆる光環境下であなたの目を優しく保護します。',
      'ko': '슬라이더를 밀거나 +/- 단축키를 눌러 지도의 밝기를 조절할 수 있습니다. 눈부심을 방지하고 어떤 조명 환경에서도 눈의 피로를 최소화합니다.'
    },
    'guide_title_desktop_wayfinding': {
      'vn': 'Thiết lập dẫn đường',
      'en': 'Route Planning',
      'zh': '路径规划设定',
      'ja': '経路案内の設定',
      'ko': '길찾기 경로 설정'
    },
    'guide_desc_desktop_wayfinding': {
      'vn': 'Mở tab "Chỉ đường" để lập lộ trình di chuyển tối ưu. Bạn có thể chọn điểm xuất phát, điểm đến và tự do thêm các điểm dừng chân mong muốn trên đường đi.',
      'en': 'Open the "Directions" tab to compute the optimal route. You can specify a start, end, and add multiple custom stopovers along the way.',
      'zh': '打开“路线”标签可计算出最优路线。您可以指定起点、终点，并可以在途中自由添加多个自定义经停点。',
      'ja': '「経路」タブを開いて最適なルートを計算します。出発地、目的地を指定し、その途中に複数の経由地を自由に追加できます。',
      'ko': '우측 사이드바에서 \'길찾기\' 탭을 클릭하여 최적의 이동 경로를 설계해 보세요. 출발지와 목적지를 정하고, 이동 중에 들르고 싶은 경유지를 자유롭게 추가할 수 있습니다.'
    },
    'guide_title_desktop_route_detail': {
      'vn': 'Chỉ dẫn lộ trình chi tiết',
      'en': 'Direction Instructions',
      'zh': '路线详细指示',
      'ja': 'ルート詳細案内',
      'ko': '상세 이동 경로 안내'
    },
    'guide_desc_desktop_route_detail': {
      'vn': 'Hệ thống sẽ vẽ tuyến đường trực quan nhất trên bản đồ 3D và hiển thị hướng dẫn chi tiết từng bước đi, khoảng cách, rẽ hướng và các vị trí thang máy/thang cuốn để bạn di chuyển.',
      'en': 'The system highlights the route on the 3D map and lists precise step-by-step turns, connection points (elevators/escalators), and distance estimates.',
      'zh': '系统会在3D地图上突出显示路线，并列出精确的步骤转向、连接节点（电梯/扶梯）以及估计距离。',
      'ja': 'システムが3Dマップ上にルートを分かりやすくハイライトし、ステップバイステップの曲がり角、接続設備（エレベーター/エスカレーター）、予測距離を正確にリストアップします。',
      'ko': '3D 지도 위에 이동 경로가 시각적으로 표시되며, 거리, 회전 방향, 수직 이동(엘리베이터/에스컬레이터) 위치를 포함한 상세 경로 단계가 우측 목록에 나열됩니다.'
    },
    'guide_title_desktop_location_detail': {
      'vn': 'Xem chi tiết địa điểm',
      'en': 'Explore Locations',
      'zh': '查看地点详情',
      'ja': 'スポット詳細表示',
      'ko': '매장 상세 정보 확인'
    },
    'guide_desc_desktop_location_detail': {
      'vn': 'Nhấp chuột vào bất kỳ gian hàng hoặc khu vực nào trên bản đồ để xem ngay hình ảnh thực tế, mô tả chi tiết, giờ hoạt động và nhanh chóng nhấn nút "Chỉ đường đến" hoặc "Đi từ đây".',
      'en': 'Click any shop, gate, or lounge on the map to see its photographs, descriptions, operation hours, and quickly trigger "Directions to" or "Start from here".',
      'zh': '点击地图上的任意商店、登机口或贵宾室，查看实景照片、详细描述、营业时间，并快速触发“导航至此”或“从此出发”。',
      'ja': '地図上の任意のショップ、搭乗口、ラウンジをクリックすると、実物写真、紹介文、営業時間を確認でき、素早く「目的地に設定」や「出発地に設定」を実行できます。',
      'ko': '지도 위의 상점, 탑승구, 라운지 등을 마우스로 클릭하여 실제 전경 사진, 상세 소개, 운영 시간을 확인하고 바로 \'여기서 출발\' 또는 \'여기로 길찾기\'를 할 수 있습니다.'
    },
    'guide_title_desktop_flight_info': {
      'vn': 'Bảng thông tin chuyến bay',
      'en': 'Live Flight Board',
      'zh': '实时航班看板',
      'ja': 'フライトインフォメーション',
      'ko': '실시간 항공 운항 전광판'
    },
    'guide_desc_desktop_flight_info': {
      'vn': 'Theo dõi trạng thái bay trực tiếp! Click nút máy bay để tra cứu chuyến bay của bạn, sau đó nhấp vào Quầy check-in, Cổng bay hoặc Băng chuyền hành lý để bản đồ vẽ đường đi ngay lập tức.',
      'en': 'Track flight statuses live! Click the aircraft icon to search for your flight, then click its check-in counter, gate, or carousel to instantly map the route.',
      'zh': '实时跟踪航班状态！点击飞机图标搜索您的航班，然后点击其值机柜台、登机口或行李提取处，即可瞬间绘制出导航路线。',
      'ja': 'フライト状況をリアルタイム追跡！飛行機アイコンをクリックしてフライトを検索し、そのチェックインカウンター、搭乗口、手荷物受取所をクリックすると、瞬時に地図上にルートが描かれます。',
      'ko': '실시간 항공편 상황을 모니터링해 보세요! 비행기 단축 아이콘을 클릭하여 항공편을 검색하고, 연결된 체크인 카운터, 탑승구, 수하물 수취대 등을 클릭하면 즉시 안내 경로를 그려줍니다.'
    },
    'guide_title_desktop_finish': {
      'vn': 'Trải nghiệm bản đồ ngay!',
      'en': 'Ready to Explore!',
      'zh': '立即探索！',
      'ja': '今すぐ探索！',
      'ko': '지도 사용 시작하기!'
    },
    'guide_desc_desktop_finish': {
      'vn': 'Tuyệt vời! Bạn đã sẵn sàng tự do khám phá và sử dụng Bản đồ 3D Sân bay Long Thành. Nếu cần xem lại hướng dẫn này, hãy click biểu tượng chữ (i) ở thanh công cụ bên phải nhé. Chúc hành trình của bạn trọn vẹn!',
      'en': 'Brilliant! You are ready to freely explore and use the Long Thanh 3D Map. If you ever need this guide, click the (i) icon on the right toolbar. Have a wonderful journey!',
      'zh': '太棒了！您已准备好自由探索并使用龙城国际机场3D地图。如果您再次需要本指南，点击右侧工具栏的(i)图标即可。祝您拥有完美的旅程！',
      'ja': '素晴らしい！ロンタイン国際空港の3Dマップを自由に探索し、使用する準備が整いました。このガイドが再び必要な場合は、右側のツールバーの (i) アイコンをクリックしてください。それでは快適なご旅行を！',
      'ko': '축하합니다! 이제 롱탄 국제공항 3D 지도를 자유롭게 이용하고 탐색하실 준비가 끝났습니다. 안내가 다시 필요하면 우측 도구 모음의 (i) 단축 아이콘을 클릭해 주세요. 안전하고 행복한 여행 되시길 바랍니다!'
    },

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
    'no_matching_area': {
      'vn': 'Kh\u00f4ng t\u00ecm th\u1ea5y khu v\u1ef1c ph\u00f9 h\u1ee3p',
      'en': 'No matching area found',
      'zh': '\u672a\u627e\u5230\u5339\u914d\u533a\u57df',
      'ja': '\u4e00\u81f4\u3059\u308b\u30a8\u30ea\u30a2\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093',
      'ko': '\uc77c\uce58\ud558\ub294 \uad6c\uc5ed\uc744 \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4'
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
    'nearest': {
      'vn': 'Gần nhất',
      'en': 'Nearest',
      'zh': '最近',
      'ja': '最寄り',
      'ko': '가장 가까움'
    },
    'distance_from_start': {
      'vn': 'Cách điểm đi',
      'en': 'From start',
      'zh': '距起点',
      'ja': '出発地から',
      'ko': '출발지에서'
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
    'full_route': {
      'vn': 'Chi tiết',
      'en': 'Full Route',
      'zh': '完整路线',
      'ja': '全ルート',
      'ko': '전체 경로'
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
    'loading_route': {
      'vn': 'Đang tìm đường đi...',
      'en': 'Finding route...',
      'zh': '正在寻找路线...',
      'ja': 'ルートを検索中...',
      'ko': '경로를 찾는 중...'
    },
    'stopover_label': {
      'vn': 'Điểm dừng',
      'en': 'Stopover',
      'zh': '中转点',
      'ja': '経由地',
      'ko': '경유지'
    },
    'add_stopover': {
      'vn': 'Thêm điểm dừng',
      'en': 'Add stopover',
      'zh': '添加中转点',
      'ja': '経由地を追加',
      'ko': '경유지 추가'
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

  // Get Localized Opening Hours
  static getOpeningHours(id: string, obj?: any): string {
    const locData = this.getLocationContent(id, obj);
    return locData?.openingHours || "";
  }

  // Get Dynamic Opening Status (Open/Closed) based on Time
  static getOpeningStatus(hoursStr: string): { status: 'open' | 'closed' | '', label: string, color: string } {
    if (!hoursStr || hoursStr === "NULL" || hoursStr.trim() === "") return { status: '', label: '', color: '' };

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const lang = (this.currentLang || 'vn').toLowerCase();
    const s = hoursStr.toLowerCase().trim();

    const labels: any = {
      open: {
        vn: 'Mở cửa',
        en: 'Open',
        zh: '营业中',
        ja: '営業中',
        ko: '영업 중'
      },
      closed: {
        vn: 'Đóng cửa',
        en: 'Closed',
        zh: '已打烊',
        ja: '準備中',
        ko: '영업 종료'
      }
    };

    const getLabel = (type: 'open' | 'closed') => {
      const l = labels[type];
      return l[lang] || l['en'];
    };

    // 1. Check for 24h
    if (s.includes("24/7") || s.includes("24h") || s.includes("24 giờ") || s.includes("24 hours")) {
      return {
        status: 'open',
        label: getLabel('open'),
        color: '#3b82f6'
      };
    }

    // 2. Parse range HH:mm ~ HH:mm
    const parts = s.split(/[~\-]/);
    if (parts.length === 2) {
      const parseTime = (t: string) => {
        const match = t.trim().match(/(\d{1,2})[:h](\d{2})/);
        if (match) return parseInt(match[1]) * 60 + parseInt(match[2]);
        return null;
      };

      const start = parseTime(parts[0]);
      const end = parseTime(parts[1]);

      if (start !== null && end !== null) {
        let isOpen = false;
        if (start < end) {
          // Normal case: 07:00 ~ 18:00
          isOpen = (currentMinutes >= start && currentMinutes < end);
        } else {
          // Night shift: 22:00 ~ 06:00
          isOpen = (currentMinutes >= start || currentMinutes < end);
        }

        if (isOpen) {
          return {
            status: 'open',
            label: getLabel('open'),
            color: '#3b82f6'
          };
        }
      }
    }

    return {
      status: 'closed',
      label: getLabel('closed'),
      color: '#ef4444'
    };
  }

  // Get Localized Location Detail (e.g. Near Gate...)
  static getLocationDetail(id: string, obj?: any): string {
    const locData = this.getLocationContent(id, obj);
    const lang = (this.currentLang || 'vn').toLowerCase();
    return locData?.locationDetail?.[lang] || "";
  }

  // Get Localized Features (Amenities) - Reusing Description as requested
  static getFeatures(id: string, obj?: any): string {
    return this.getLocationDescription(id, obj);
  }

  // Get Phone
  static getPhone(id: string, obj?: any): string {
    const locData = this.getLocationContent(id, obj);
    return locData?.phone || "";
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

      // Re-render User Guide step if it's currently open
      if ((window as any).renderUserGuideStep && document.getElementById('user-guide-modal') && !document.getElementById('user-guide-modal')?.classList.contains('hidden')) {
        (window as any).renderUserGuideStep();
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

function getObjectFloorSearchId(obj: any): string | null {
  if (!obj) return null;
  if (typeof obj.floor === 'string') return obj.floor;
  return obj.floor?.mappedinId || obj.floor?.id || obj.floor?.code || obj.floorId || null;
}

function getFloorRecordForObject(obj: any): any | null {
  const floorObj = obj?.floor && typeof obj.floor === 'object' ? obj.floor : null;
  const floorIds = new Set<string>();

  [
    getObjectFloorSearchId(obj),
    obj?.floorId,
    floorObj?.mappedinId,
    floorObj?.id,
    floorObj?.code
  ].forEach((value) => {
    if (value) floorIds.add(String(value));
  });

  return (TranslationManager.data?.floors || []).find((floor: any) =>
    [floor?.id, floor?.mappedinId, floor?.code].some((value) => value && floorIds.has(String(value)))
  ) || null;
}

function inferFloorSortRankFromText(value: any): number {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return Infinity;
  const normalized = removeVietnameseTones(text).toLowerCase();

  if (/tang\s*tret/i.test(normalized) || /ground/i.test(text) || /\bgf\b/i.test(text)) {
    return 0;
  }

  const numericMatch = text.match(/\d+/);
  if (!numericMatch) return Infinity;
  const floorNumber = Number.parseInt(numericMatch[0], 10);
  return Number.isFinite(floorNumber) ? floorNumber : Infinity;
}

function getFloorSortRankForObject(obj: any): number {
  const floorObj = obj?.floor && typeof obj.floor === 'object' ? obj.floor : null;
  const floorRecord = getFloorRecordForObject(obj);

  const sortOrder = Number(floorRecord?.sortOrder);
  if (Number.isFinite(sortOrder)) return sortOrder;

  const candidates = [
    floorRecord?.code,
    ...Object.values(floorRecord?.names || {}),
    floorObj?.code,
    floorObj?.name
  ];

  for (const value of candidates) {
    const inferred = inferFloorSortRankFromText(value);
    if (Number.isFinite(inferred)) return inferred;
  }

  return Infinity;
}

const AREA_COLOR_LOCAL_STORAGE_KEY = 'customAreaColors';
const AREA_COLOR_MIGRATION_FLAG_KEY = 'customAreaColorsMigratedToServer';
const SEARCHABLE_DETAIL_FLOOR_IDS = new Set([
  'm_dae8f26a40f6017f',
  'm_41a38d6d0411d397',
  'm_d4b5674c0b15e099',
  'm_1523f7dcde647c40'
]);

// getApiBaseUrl moved to top

function safeParseAreaColorMap(rawValue: any): Record<string, string> {
  if (!rawValue || rawValue === 'undefined') return {};
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch (error) {
    return {};
  }
}

function normalizeAreaHexColor(value: any): string | null {
  const normalized = String(value || '').trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null;
}

function getServerAreaColors(): Record<string, string> {
  return TranslationManager.data?.areaColors || {};
}

function setServerAreaColors(areaColors: Record<string, string>) {
  TranslationManager.data = {
    ...(TranslationManager.data || {}),
    areaColors
  };
}

function getAreaColorOverride(areaId: string): string | null {
  const color = getServerAreaColors()[areaId];
  return normalizeAreaHexColor(color);
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
  // ApiService moved to top level
  let hideInfo: any = null;
  let updateInfo: any = null;

  // ============================================
  // LAZY LOADING: Cache metadata + track loaded floors
  // ============================================
  // Lưu metadata tất cả models từ API (nhẹ, chỉ JSON)
  let _allModelMetadata: any[] = [];
  // Theo dõi tầng nào đã load models rồi (tránh load lại)
  const _loadedFloors: Set<string> = new Set();
  let _hasSyncedOverviewModelFloor = false;

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
  let isAltPressed = false;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') isShiftPressed = true;
    if (e.key === 'Alt') isAltPressed = true;
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') isShiftPressed = false;
    if (e.key === 'Alt') isAltPressed = false;
  });
  // Also clear on window blur to prevent keys sticking
  window.addEventListener('blur', () => { isShiftPressed = false; isAltPressed = false; });

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
  const isLocal = checkIsLocal();
  const API_BASE_URL = getApiBaseUrl();
  const SERVER_URL = API_BASE_URL.replace("/api", "");

  // Hàm hỗ trợ giải quyết URL động (Sửa lỗi CORS localhost trên Render)
  const resolveUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("data:")) return url; // Base64

    // Replace localhost/127.0.0.1 with the actual server IP if accessing via LAN
    if ((url.includes("localhost:3002") || url.includes("127.0.0.1:3002")) && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      const parts = url.split("/Model3D/");
      if (parts.length > 1) {
        return `${SERVER_URL}/Model3D/${parts[1]}`;
      }
      return url.replace(/http:\/\/(localhost|127\.0\.0\.1):3002/g, SERVER_URL);
    }

    if (url.startsWith("./")) return url.replace("./", `${SERVER_URL}/`);
    if (!url.startsWith("http")) {
      if (url.includes("Model3D/")) return `${SERVER_URL}/${url}`;
      return `${SERVER_URL}/Model3D/${url}`;
    }
    return url;
  };


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
  // Tăng thời gian chờ lên 500ms để chắc chắn layout đã ổn định
  await new Promise(r => setTimeout(r, 500));

  const container = document.getElementById("mappedin-map") as HTMLDivElement;
  if (container) {
    const rect = container.getBoundingClientRect();
    console.log(`🗺️ Map Container Size: ${rect.width}x${rect.height}`);
    if (rect.width === 0 || rect.height === 0) {
      console.warn("⚠️ Warning: Map container has 0 dimensions! Forcing 100% height.");
      container.style.height = "100%";
      container.style.flex = "1";
    }
  }

  // Hiển thị map 3D
  const mapView = await show3dMap(
    container,
    mapData,
    {
      multiFloorView: {
        enabled: true,
        floorGap: "auto", // Tự động tính khoảng cách tầng
        updateCameraElevationOnFloorChange: true,
      },
      watermark: {
        visible: false,
      },
      attribution: {
        feedback: false,
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

  // AGGRESSIVELY HIDE ATTRIBUTIONS VIA JAVASCRIPT (Shadow DOM safe)
  const hideAttributions = () => {
    const selectors = [
      'details.mappedin-ctrl-attrib',
      '.mappedin-ctrl-attrib',
      '.mappedin-ctrl-attrib-bottom-right',
      '.mapboxgl-ctrl-attrib',
      '.mapboxgl-ctrl-attrib-inner',
      '.mapboxgl-ctrl-bottom-right',
      '.mappedin-attribution',
      '.mappedin-feedback',
      '.mappedin-watermark',
      '[class*="attribution"]',
      '[class*="mappedin-ctrl-attrib"]',
      '[class*="copyright"]'
    ];
    
    const applyStyle = (el: any) => {
      if (!el) return;
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
    };

    // 1. Target normal DOM
    selectors.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(applyStyle);
      } catch (e) {}
    });

    // 2. Target Shadow DOM if any
    const mapContainer = document.getElementById("mappedin-map");
    if (mapContainer) {
      const walkShadow = (root: Node) => {
        if (!root) return;
        if (root instanceof HTMLElement && root.shadowRoot) {
          selectors.forEach(sel => {
            try {
              root.shadowRoot?.querySelectorAll(sel).forEach(applyStyle);
            } catch (e) {}
          });
          walkShadow(root.shadowRoot);
        }
        root.childNodes?.forEach(child => walkShadow(child));
      };
      try { walkShadow(mapContainer); } catch (e) {}
    }
  };

  // Run on interval to catch dynamic updates
  setInterval(hideAttributions, 2000); // 2s to be safer on performance

  // Run immediately and then on an interval to catch dynamic updates
  hideAttributions();
  setInterval(hideAttributions, 1000);

  // Expose mapView globally for easier debugging and access from console
  (window as any).mapView = mapView;

  try {
    (mapView as any).on("styleimagemissing", (e: any) => {
      if (e && e.id === "pedestrian_polygon") {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "rgba(0,0,0,0)";
          ctx.fillRect(0, 0, 1, 1);
          try {
            (mapView as any).addImage("pedestrian_polygon", canvas);
          } catch (err) { }
        }
      }
    });
  } catch (err) { }

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

  // --- THEME SELECTOR LOGIC ---
  const themeOptions = document.querySelectorAll('.theme-option');
  const currentThemeNameDisp = document.getElementById('current-theme-name');

  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const themeUrl = option.getAttribute('data-url');
      const themeName = option.querySelector('.theme-name')?.textContent;

      if (themeUrl && (mapView as any).Outdoor) {
        console.log(`🎨 Switching theme to: ${themeName} (${themeUrl})`);
        
        try {
          (mapView as any).Outdoor.setStyle(themeUrl);
          
          // UI Updates
          themeOptions.forEach(opt => opt.classList.remove('active'));
          option.classList.add('active');
          if (currentThemeNameDisp && themeName) {
            currentThemeNameDisp.textContent = themeName;
          }
        } catch (e) {
          console.warn("Failed to set outdoor style", e);
        }

        // Close the menu
        document.getElementById('theme-selector-wrapper')?.classList.remove('open');
      } else {
        console.warn("Theme URL missing or Outdoor controller not available");
      }
    });
  });

  // --- BRIGHTNESS / ANTI-GLARE SLIDER LOGIC ---
  const brightnessSlider = document.getElementById('brightness-slider') as HTMLInputElement;
  const brightnessValue = document.getElementById('brightness-value');
  const brightnessPlus = document.getElementById('brightness-plus');
  const brightnessMinus = document.getElementById('brightness-minus');
  const mapElem = document.getElementById('mappedin-map');

  const updateMapDisplay = (val: number) => {
    if (!mapElem) return;
    const brightnessFactor = val / 100;
    
    // Calculate contrast: as it gets darker (anti-glare), we boost contrast slightly
    const contrast = 1 + (1 - brightnessFactor) * 0.33;
    const saturate = 1 - (1 - brightnessFactor) * 0.5;

    mapElem.style.filter = `brightness(${brightnessFactor}) contrast(${contrast}) saturate(${saturate})`;
    if (brightnessValue) brightnessValue.textContent = val.toString();
    if (brightnessSlider) brightnessSlider.value = val.toString();
  };

  if (brightnessSlider) {
    brightnessSlider.addEventListener('input', (e) => {
      updateMapDisplay(parseInt((e.target as HTMLInputElement).value));
    });
  }

  if (brightnessPlus) {
    brightnessPlus.addEventListener('click', () => {
      const val = parseInt(brightnessSlider?.value || "100");
      if (val < 100) updateMapDisplay(val + 1);
    });
  }

  if (brightnessMinus) {
    brightnessMinus.addEventListener('click', () => {
      const val = parseInt(brightnessSlider?.value || "100");
      if (val > 50) updateMapDisplay(val - 1);
    });
  }

  // LƯU Ý: XÓA LOADING SCREEN KHI HOÀN TẤT
  // --- USER GUIDE TUTORIAL LOGIC ---
  type TutorialStep = {
    id: string;
    title: string;
    description: string;
    image: string;
    targetSelector?: string;
    targetSelectors?: string[];
    highlightPadding?: number;
    placement?: string;
  };

  const USER_GUIDE_COMPLETED_KEY = "mappedinUserGuideCompleted";
  const LAST_AUTO_SHOW_KEY = "mappedinUserGuideLastAutoShowTime";
  let shouldShowGuideOnLoad = false;
  let resolveLoadingOverlayDismissed: () => void = () => { };
  const loadingOverlayDismissedPromise = new Promise<void>((resolve) => {
    resolveLoadingOverlayDismissed = resolve;
  });
  let resolveStartupCameraSequenceCompleted: () => void = () => { };
  const startupCameraSequenceCompletedPromise = new Promise<void>((resolve) => {
    resolveStartupCameraSequenceCompleted = resolve;
  });
  try {
    const lastAutoShow = localStorage.getItem(LAST_AUTO_SHOW_KEY);
    shouldShowGuideOnLoad = shouldAutoOpenUserGuide(lastAutoShow);
    if (shouldShowGuideOnLoad) {
      localStorage.setItem(LAST_AUTO_SHOW_KEY, Date.now().toString());
    }
  } catch (e) {
    console.warn("Failed to check auto user guide schedule", e);
  }
  const userGuideButton = document.getElementById('btn-user-guide') as HTMLButtonElement | null;
  const userGuideModal = document.getElementById('user-guide-modal') as HTMLDivElement | null;
  const userGuidePanel = userGuideModal?.querySelector('.user-guide-panel') as HTMLDivElement | null;
  const userGuideImage = document.getElementById('user-guide-image') as HTMLImageElement | null;
  const userGuideTitle = document.getElementById('user-guide-title');
  const userGuideDescription = document.getElementById('user-guide-description');
  const userGuideProgress = document.getElementById('user-guide-progress');
  const userGuideBack = document.getElementById('user-guide-back') as HTMLButtonElement | null;
  const userGuideNext = document.getElementById('user-guide-next') as HTMLButtonElement | null;
  const userGuideDone = document.getElementById('user-guide-done') as HTMLButtonElement | null;
  const userGuideClose = document.getElementById('user-guide-close') as HTMLButtonElement | null;
  const userGuideHighlight = document.getElementById('user-guide-highlight') as HTMLDivElement | null;
  const userGuideArrowLayer = document.getElementById('user-guide-arrow-layer') as SVGSVGElement | null;
  const userGuideArrowPath = document.getElementById('user-guide-arrow-path') as SVGPathElement | null;
  let activeGuideSteps: TutorialStep[] = [];
  let currentGuideStepIndex = 0;
  let guideReturnFocus: HTMLElement | null = null;

  const getActiveGuideStep = () => activeGuideSteps[currentGuideStepIndex] || null;

  const getGuideTargetSelectors = (step: TutorialStep | null) => {
    if (!step) return [];
    if (Array.isArray(step.targetSelectors) && step.targetSelectors.length > 0) return step.targetSelectors;
    return step.targetSelector ? [step.targetSelector] : [];
  };

  const getVisibleTargetRects = (selectors: string[]) => {
    return selectors
      .map(selector => document.querySelector(selector) as HTMLElement | null)
      .filter((target): target is HTMLElement => Boolean(target))
      .map(target => target.getBoundingClientRect())
      .filter(rect => rect.width > 0 && rect.height > 0);
  };

  const renderUserGuideArrow = (targetRect: DOMRect) => {
    if (!userGuideArrowLayer || !userGuideArrowPath || !userGuidePanel) return;

    const panelRect = userGuidePanel.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    const panelCenterX = panelRect.left + panelRect.width / 2;
    const panelCenterY = panelRect.top + panelRect.height / 2;
    const startX = targetX < panelRect.left ? panelRect.left : targetX > panelRect.right ? panelRect.right : panelCenterX;
    const startY = targetY < panelRect.top ? panelRect.top : targetY > panelRect.bottom ? panelRect.bottom : panelCenterY;
    const controlX = (startX + targetX) / 2;

    const step = getActiveGuideStep();

    // 0. Hide arrow on mobile for center placement or full-map overview steps to prevent pointing to "nothing"
    const isMobile = window.innerWidth <= 768;
    if (isMobile && (step?.placement === 'center' || step?.targetSelector === '#mappedin-map')) {
      userGuideArrowLayer.classList.add('hidden');
      return;
    }

    // 1. Smart controlY calculation to prevent arrows looping off-screen or above top controls
    let controlY: number;
    if (targetY < window.innerHeight / 2) {
      // Target is in the upper half of screen (e.g. top controls): arch downwards / approach from below
      controlY = Math.min(startY, targetY) + 90;
      if (controlY < targetY + 30) {
        controlY = targetY + 60;
      }
    } else {
      // Target is in the lower half (e.g. D-pad, sidebar): arch upwards / approach from above
      controlY = Math.min(startY, targetY) - 90;
      if (controlY < 20) {
        controlY = 20;
      }
    }

    // 2. Custom arrow positioning and intersection calculation
    const padding = step?.highlightPadding ?? 7;
    const borderOffset = 4; // To touch the outer boundary of the highlighted box
    const hw = targetRect.width / 2 + padding + borderOffset;
    const hh = targetRect.height / 2 + padding + borderOffset;

    let arrowEndX = targetX;
    let arrowEndY = targetY;

    if (step?.id === 'desktop-layout-overview') {
      const sidebarWidth = window.innerWidth <= 1200 ? 340 : 380;
      arrowEndX = sidebarWidth;
      arrowEndY = window.innerHeight / 2;
    } else {
      // Normal intersection math
      const dx = targetX - controlX;
      const dy = targetY - controlY;

      if (dx !== 0 || dy !== 0) {
        if (Math.abs(dy) * hw > hh * Math.abs(dx)) {
          // Intersects top or bottom edge of the highlighted box
          if (dy > 0) {
            arrowEndY = targetY - hh;
            arrowEndX = targetX - hh * (dx / dy);
          } else {
            arrowEndY = targetY + hh;
            arrowEndX = targetX + hh * (dx / dy);
          }
        } else {
          // Intersects left or right edge of the highlighted box
          if (dx > 0) {
            arrowEndX = targetX - hw;
            arrowEndY = targetY - hw * (dy / dx);
          } else {
            arrowEndX = targetX + hw;
            arrowEndY = targetY + hw * (dy / dx);
          }
        }
      }
    }

    // 3. Prevent arrowhead distortion by ensuring the last 15px is a perfectly straight line
    let pathD = `M ${startX} ${startY} Q ${controlX} ${controlY} ${arrowEndX} ${arrowEndY}`;
    const tangentDx = arrowEndX - controlX;
    const tangentDy = arrowEndY - controlY;
    const tangentLen = Math.sqrt(tangentDx * tangentDx + tangentDy * tangentDy);
    if (tangentLen > 20) {
      const dirX = tangentDx / tangentLen;
      const dirY = tangentDy / tangentLen;
      const preEndX = arrowEndX - dirX * 15;
      const preEndY = arrowEndY - dirY * 15;
      pathD = `M ${startX} ${startY} Q ${controlX} ${controlY} ${preEndX} ${preEndY} L ${arrowEndX} ${arrowEndY}`;
    }

    userGuideArrowLayer.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    userGuideArrowPath.setAttribute('d', pathD);
    userGuideArrowLayer.classList.remove('hidden');
  };

  const updateUserGuideHighlight = () => {
    if (!userGuideHighlight || !userGuideModal || userGuideModal.classList.contains('hidden')) return;
    const step = getActiveGuideStep();
    const selectors = getGuideTargetSelectors(step);
    const rects = getVisibleTargetRects(selectors);

    userGuideHighlight.innerHTML = '';
    if (rects.length === 0) {
      userGuideHighlight.classList.add('hidden');
      userGuideArrowLayer?.classList.add('hidden');
      return;
    }

    const padding = step?.highlightPadding ?? 7;
    rects.forEach(rect => {
      const box = document.createElement('div');
      box.className = 'user-guide-highlight-box';
      box.style.left = `${Math.max(0, rect.left - padding)}px`;
      box.style.top = `${Math.max(0, rect.top - padding)}px`;
      box.style.width = `${rect.width + padding * 2}px`;
      box.style.height = `${rect.height + padding * 2}px`;
      userGuideHighlight.appendChild(box);
    });
    userGuideHighlight.classList.remove('hidden');
    renderUserGuideArrow(rects[0]);
  };

  const renderUserGuideStep = () => {
    const step = getActiveGuideStep();
    if (!step) return;

    // Auto-expand sidebar if this is the desktop layout overview step
    if (window.innerWidth > 768 && step.id === 'desktop-layout-overview') {
      try {
        if (typeof expandSidebar === 'function') expandSidebar();
      } catch (e) {}
    }

    if (userGuideImage) {
      userGuideImage.src = step.image;
      userGuideImage.alt = step.title;
    }
    if (userGuideTitle) {
      const titleKey = `guide_title_${step.id.replace(/-/g, '_')}`;
      userGuideTitle.textContent = TranslationManager.t(titleKey, step.title);
    }
    if (userGuideDescription) {
      const descKey = `guide_desc_${step.id.replace(/-/g, '_')}`;
      userGuideDescription.textContent = TranslationManager.t(descKey, step.description);
    }
    if (userGuideProgress) {
      userGuideProgress.textContent = `${currentGuideStepIndex + 1}/${activeGuideSteps.length}`;
    }

    const isFirst = currentGuideStepIndex === 0;
    const isLast = currentGuideStepIndex === activeGuideSteps.length - 1;
    if (userGuideBack) userGuideBack.disabled = isFirst;
    if (userGuideNext) userGuideNext.style.display = isLast ? 'none' : 'inline-flex';
    if (userGuideDone) {
      userGuideDone.style.display = isLast ? 'inline-flex' : 'none';
      userGuideDone.textContent = TranslationManager.t('guide_btn_done', 'Đã xong');
    }

    // Manage placement class for mobile top alignment to expose bottom selectors
    if (userGuideModal) {
      if (window.innerWidth <= 768 && step.placement === 'top') {
        userGuideModal.classList.add('mobile-placement-top');
      } else {
        userGuideModal.classList.remove('mobile-placement-top');
      }
    }

    if (step.id === 'desktop-layout-overview') {
      if (userGuideHighlight) userGuideHighlight.classList.add('hidden');
      if (userGuideArrowLayer) userGuideArrowLayer.classList.add('hidden');
      setTimeout(updateUserGuideHighlight, 850);
    } else {
      window.requestAnimationFrame(updateUserGuideHighlight);
      setTimeout(updateUserGuideHighlight, 850);
    }
  };

  const closeUserGuide = (markCompleted = false) => {
    if (markCompleted) {
      try { localStorage.setItem(USER_GUIDE_COMPLETED_KEY, "true"); } catch (e) { }
    }

    userGuideModal?.classList.add('hidden');
    userGuideHighlight?.classList.add('hidden');
    if (userGuideHighlight) userGuideHighlight.innerHTML = '';
    userGuideArrowLayer?.classList.add('hidden');
    document.body.classList.remove('user-guide-open');
    guideReturnFocus?.focus?.();
    guideReturnFocus = null;
  };

  const openUserGuide = () => {
    if (!userGuideModal) return;

    const device = getTutorialDevice();
    const stepKey = device === 'mobile' ? 'mobile' : 'desktop';
    activeGuideSteps = ((tutorialSteps as any)[stepKey] || []) as TutorialStep[];
    if (activeGuideSteps.length === 0) return;

    currentGuideStepIndex = 0;
    guideReturnFocus = document.activeElement as HTMLElement | null;
    userGuideModal.classList.remove('hidden');
    document.body.classList.add('user-guide-open');
    renderUserGuideStep();
    setTimeout(() => userGuidePanel?.focus?.(), 0);
  };

  userGuideButton?.addEventListener('click', openUserGuide);
  userGuideClose?.addEventListener('click', () => closeUserGuide(false));
  userGuideBack?.addEventListener('click', () => {
    if (currentGuideStepIndex > 0) {
      currentGuideStepIndex -= 1;
      renderUserGuideStep();
    }
  });
  userGuideNext?.addEventListener('click', () => {
    if (currentGuideStepIndex < activeGuideSteps.length - 1) {
      currentGuideStepIndex += 1;
      renderUserGuideStep();
    }
  });
  userGuideDone?.addEventListener('click', () => closeUserGuide(true));
  userGuideModal?.addEventListener('click', (event) => {
    if (event.target === userGuideModal) closeUserGuide(false);
  });
  (window as any).renderUserGuideStep = renderUserGuideStep;
  window.addEventListener('resize', updateUserGuideHighlight);
  window.addEventListener('scroll', updateUserGuideHighlight, true);
  document.addEventListener('keydown', (event) => {
    if (!userGuideModal || userGuideModal.classList.contains('hidden')) return;
    if (event.key === 'Escape') closeUserGuide(false);
    if (event.key === 'ArrowRight' && currentGuideStepIndex < activeGuideSteps.length - 1) {
      currentGuideStepIndex += 1;
      renderUserGuideStep();
    }
    if (event.key === 'ArrowLeft' && currentGuideStepIndex > 0) {
      currentGuideStepIndex -= 1;
      renderUserGuideStep();
    }
  });

  if (progressInterval) clearInterval(progressInterval);

  if (loadingScreen && loadingText && loadingBar) {
    // Đẩy vọt lên 100% để user thấy đã chạy xong
    const completeMsg = TranslationManager.t('loading_complete', 'Hoàn tất!');
    loadingText.textContent = `${completeMsg} 100%`;
    loadingBar.style.width = `100%`;

    // Đợi 400ms để hiệu ứng animation % chạy tới đích, rồi mới ẩn Overlay
    setTimeout(() => {
      loadingScreen.classList.add("hidden");
      setTimeout(() => {
        loadingScreen.style.display = "none";
        resolveLoadingOverlayDismissed();
      }, 500);
    }, 400);
  } else {
    resolveLoadingOverlayDismissed();
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



  // ============================================
  // DESKTOP SIDEBAR COLLAPSE/EXPAND SYSTEM
  // ============================================
  const sidebarEl = document.getElementById("main-sidebar-left");
  const sidebarToggleBtn = document.getElementById("sidebar-toggle-btn");
  const floatingSearchBar = document.getElementById("floating-search-bar");
  let isSidebarCollapsed = window.innerWidth > 768; // Start collapsed on desktop

  function collapseSidebar(animate = true) {
    if (!sidebarEl || !sidebarToggleBtn || !floatingSearchBar) return;
    if (window.innerWidth <= 768) return; // Desktop only
    isSidebarCollapsed = true;

    sidebarEl.classList.add("sidebar-collapsed");
    sidebarToggleBtn.title = "Mở thanh bên";

    setTimeout(() => {
      floatingSearchBar.classList.add("visible");
    }, animate ? 250 : 50);

    // Reset camera to initial center and 16.5 zoom when going full screen
    if (typeof mapView !== 'undefined' && mapView?.Camera && typeof initialVenueCenter !== 'undefined' && initialVenueCenter) {
      try {
        mapView.Camera.animate({
          center: initialVenueCenter,
          zoomLevel: 16.5,
          duration: 800,
          easing: "ease-in-out"
        });
      } catch(e) {}
    }
  }

  function expandSidebar(fromSearchBar = false) {
    if (!sidebarEl || !sidebarToggleBtn || !floatingSearchBar) return;
    isSidebarCollapsed = false;

    if (fromSearchBar) {
      // Genie effect: shrink towards the sidebar
      floatingSearchBar.classList.add("genie-shrink");
      setTimeout(() => {
        floatingSearchBar.classList.remove("visible", "genie-shrink");
      }, 800); // matches the 0.8s CSS transition
    } else {
      // Normal hide
      floatingSearchBar.classList.remove("visible");
    }

    sidebarEl.classList.remove("sidebar-collapsed");
    sidebarToggleBtn.title = "Thu gọn thanh bên";

    setTimeout(() => {
      const searchInput = document.getElementById("location-search") as HTMLInputElement;
      if (searchInput) searchInput.focus();
    }, 850);
  }

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", () => {
      if (isSidebarCollapsed) {
        expandSidebar();
      } else {
        collapseSidebar();
      }
    });
  }

  if (floatingSearchBar) {
    floatingSearchBar.addEventListener("click", () => {
      expandSidebar(true);
    });
    floatingSearchBar.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        expandSidebar(true);
      }
    });
  }

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

  // Xoay camera một góc để có góc nhìn tốt hơn (Chạy không chặn luồng khởi động)
  const cameraRotationResult = mapView.Camera.animateTo({
    bearing: mapView.Camera.bearing - 36.7,
  }, {
    duration: STARTUP_CAMERA_ROTATION_DURATION_MS
  });

  // ============================================
  // TỰ ĐỘNG BẬT HƯỚNG DẪN SAU KHI XOAY CAMERA XONG
  // ============================================
  if (shouldShowGuideOnLoad) {
    Promise.all([
      waitForStartupCameraRotation(cameraRotationResult),
      startupCameraSequenceCompletedPromise,
      loadingOverlayDismissedPromise
    ]).then(() => {
      setTimeout(() => {
        console.log("🚀 Mappedin: Startup camera sequence completed. Popping up User Guide.");
        openUserGuide();
      }, STARTUP_GUIDE_OPEN_DELAY_MS);
    });
  }

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
      const targetZoom = 16.5;

      // Animate camera để zoom IN mượt mà với bearing = bearing - 35
      cameraAny.animateTo({
        zoomLevel: targetZoom,
        bearing: mapView.Camera.bearing - 36.7, // Set bearing về góc nhìn ban đầu
        pitch: mapView.Camera.pitch,
        center: mapView.Camera.center, // Giữ nguyên center
      }, {
        duration: STARTUP_CAMERA_ZOOM_DURATION_MS, // 3 giây để zoom IN mượt mà
        easing: "ease-in-out",
      });
      setTimeout(
        resolveStartupCameraSequenceCompleted,
        STARTUP_CAMERA_ZOOM_DURATION_MS + STARTUP_GUIDE_AFTER_ROTATION_BUFFER_MS
      );
      console.log(`🎬 Initial animation: Zoom IN lên ${targetZoom} tại Overview`);
    } catch (e) {
      resolveStartupCameraSequenceCompleted();
      console.warn("Error in initial camera animation:", e);
    }
  }, STARTUP_CAMERA_ZOOM_DELAY_MS); // Delay 1 giây 

  // ============================================
  // 2. THIẾT LẬP FLOOR SELECTOR
  // ============================================
  // Populate dropdown với danh sách các tầng
  if (floorSelector) floorSelector.innerHTML = "";
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

    // Lấy connections (Thang máy, thang cuốn...)
    const connectionTypes = ["connection", "connection-node", "elevator", "escalator", "stair"];
    connectionTypes.forEach(type => {
      try {
        const items = mapData.getByType(type as any);
        if (items && items.length > 0) {
          allObjects.push(...items);
        }
      } catch (e) { }
    });

    // Loại bỏ duplicates dựa trên id
    const uniqueObjects = allObjects.filter((obj, index, self) =>
      index === self.findIndex((o) => o.id === obj.id)
    );

    return uniqueObjects;
  }

  const allMapObjects = getAllMapObjects();
  const getColorRenderObjects = () => {
    const mergedObjects = new Map<string, any>();
    allMapObjects.forEach((obj: any) => {
      if (obj?.id) mergedObjects.set(obj.id, obj);
    });

    try {
      const areas = mapData.getByType("area") || [];
      areas.forEach((area: any) => {
        if (!area?.id || mergedObjects.has(area.id)) return;
        if (!area.name || !area.name.trim()) return;
        mergedObjects.set(area.id, area);
      });
    } catch (e) { }

    return Array.from(mergedObjects.values());
  };

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
  let suppressMapClickUntil = 0;

  const markSidebarInteraction = (durationMs: number = 600) => {
    suppressMapClickUntil = Date.now() + durationMs;
  };
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

      // Case 1: Direct match
      if (t.includes(q)) return true;

      // Case 2: Accent-insensitive match
      const qClean = removeVietnameseTones(q);
      const tClean = removeVietnameseTones(t);
      if (tClean.includes(qClean)) return true;

      // Token based matching
      const qTokens = q.split(/[\s\-\,]+/).filter(tk => tk.length > 0);
      const tTokens = t.split(/[\s\-\,]+/).filter(tk => tk.length > 0);

      if (qTokens.length === 0 || tTokens.length === 0) return false;

      // Token clean (non-accented)
      const qTokensClean = qTokens.map(tk => removeVietnameseTones(tk));
      const tTokensClean = tTokens.map(tk => removeVietnameseTones(tk));

      // A. Query words are ALL in target (Unordered, non-accented)
      const allQueryInTarget = qTokensClean.every(qt => tTokensClean.some(tt => tt.includes(qt)));
      if (allQueryInTarget) return true;

      // B. Target words are ALL in query (non-accented)
      if (tTokensClean.length >= 2) {
        const allTargetInQuery = tTokensClean.every(tt => qTokensClean.some(qt => qt.includes(tt)));
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
    const uniqueResults: any[] = (rankWayfindingSearchResults as any)({
        query,
        objects: allMapObjects,
        nodeType: 'destination',
        currentFloorId: mapView.currentFloor?.id || null,
        getName: (obj: any) => TranslationManager.getName(obj),
        getFloorSortRank: getFloorSortRankForObject,
        allowedFloorIds: SEARCHABLE_DETAIL_FLOOR_IDS
      });


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

  const PERSISTENT_LOWER_FLOOR_MODEL_NAMES = new Set([
    'cay dua',
    'vuon cay xanh',
    'cay trau ba',
    'cay thien dieu',
    'cay duong xi',
    'cay co canh',
    'cay cau canh',
    'tham thuc vat',
    'vietnam airlines',
    'vietjetair',
    'thai airlines',
    'quatas airlines',
    'lufthansa airlines',
    'cathaypacific airlines',
    'atlas air',
    'airfrance',
    'hawaiian airlines',
    'northwest airlines'
  ]);

  const normalizeModelIdentity = (value: any) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.(glb|gltf|json)$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const isPersistentLowerFloorModel = (obj: any) => {
    if (!obj) return false;

    const candidates = [obj.file, obj.url, obj.name, obj.desc];
    return candidates.some((candidate) => {
      const normalized = normalizeModelIdentity(candidate);
      if (!normalized) return false;
      const fileLike = normalized.split('/').pop() || normalized;
      return PERSISTENT_LOWER_FLOOR_MODEL_NAMES.has(fileLike);
    });
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
                <div style="font-size:13px;line-height:1.2;font-weight:700;color:#111;-webkit-text-stroke:3px #fff;paint-order:stroke fill;text-shadow:0 1px 1px rgba(0,0,0,0.22);white-space:nowrap;">
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
                <div style="font-size:13px;line-height:1.2;font-weight:700;color:#111;-webkit-text-stroke:3px #fff;paint-order:stroke fill;text-shadow:0 1px 1px rgba(0,0,0,0.22);white-space:nowrap;">
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
        <div style="font-size:13px;line-height:1.2;font-weight:700;color:#111;-webkit-text-stroke:3px #fff;paint-order:stroke fill;text-shadow:0 1px 1px rgba(0,0,0,0.22);white-space:nowrap;">
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

    // Nếu có tên tùy chỉnh trong DB (và không phải là tên tiếng Nhật chung chung), ưu tiên dùng nó
    if (dbName && dbName !== conn.id && dbName !== 'エスカレーター' && dbName !== 'エレベーター') {
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

  // Khởi tạo và setup listeners (throttled để tránh lag khi zoom animation)
  updateConnectionMarkersVisibility();
  let _connMarkerThrottleTimer: any = null;
  const throttledConnectionMarkersUpdate = () => {
    if (_connMarkerThrottleTimer) return;
    _connMarkerThrottleTimer = setTimeout(() => {
      _connMarkerThrottleTimer = null;
      updateConnectionMarkersVisibility();
    }, 200);
  };
  try {
    (mapView as any).on?.("camera-change", throttledConnectionMarkersUpdate);
  } catch { }

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

    const areaColorOverride = getAreaColorOverride(obj.id);
    if (areaColorOverride) {
      bgColor = areaColorOverride;
    }

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
    getColorRenderObjects().forEach((obj) => {
      if (!obj || !obj.id) return;
      // Skip connections and points as they don't have colorable polygons
      if (obj.id.startsWith("c_") || obj.id.startsWith("p_") || obj.id.startsWith("n_") || obj.type === "connection") return;

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
        // Skip updating state for spaces without location to avoid "No point-of-interest found" errors
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
        style.color = "#4CAF50";     // Green
        style.hoverColor = "#45a049"; // Green hover
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
              <div style="font-size:13px;line-height:1.2;font-weight:700;color:#111;-webkit-text-stroke:3px #fff;paint-order:stroke fill;text-shadow:0 1px 1px rgba(0,0,0,0.22);white-space:nowrap;">
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
              <div style="font-size:13px;line-height:1.2;font-weight:700;color:#111;-webkit-text-stroke:3px #fff;paint-order:stroke fill;text-shadow:0 1px 1px rgba(0,0,0,0.22);white-space:nowrap;">
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
        <div style="font-size:13px;line-height:1.2;font-weight:700;color:#111;-webkit-text-stroke:3px #fff;paint-order:stroke fill;text-shadow:0 1px 1px rgba(0,0,0,0.22);white-space:nowrap;text-align:center;">
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

      // TỐI ƯU: Chỉ render markers SAU KHI animation kết thúc (1200ms) để giữ camera mượt mà tuyệt đối
      setTimeout(() => {
        requestAnimationFrame(() => {
          if (connectionMarkersVisible) renderConnectionOverlaysForCurrentFloor();
          renderObjectMarkersForCurrentFloor();
          updateMarkersForCurrentFloor();
          
          // Defer UI/Categories update to the next frame
          requestAnimationFrame(() => {
            updateUIVisibility();
            if (_allModelMetadata.length > 0) _loadModelsForFloor(id);
            if (activeSubCategoryId) reapplyActiveSubCategoryPins();
            renderCategories(activeCategoryId);
          });
        });
      }, 1200);
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

    const targetZoom = 16.5; // Tất cả các tầng đều zoom về 16.5x

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
      // Nhả khoá sau khi camera animation hoàn tất (1000ms) + buffer
      setTimeout(() => { isGlobalSwitchingFloor = false; }, 1200);
    }

    // Sau khi floor đã được set, animate camera (easeInOut cho mượt mà)
    mapView.Camera.animateTo({
      zoomLevel: targetZoom,
      center: initialVenueCenter || mapView.Camera.center,
      bearing: mapView.Camera.bearing,
      pitch: mapView.Camera.pitch
    }, { duration: 1000, easing: "ease-in-out" });

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
      if (l.SubCategoryID?.toString() === activeSubCategoryId?.toString() ||
        l.subCategoryId?.toString() === activeSubCategoryId?.toString()) {
        assignedMIDs.push(mid);
      }
    });

    // Filter objects on current floor
    const currentFloorId = mapView.currentFloor.id;
    const currentFloorIds = getCurrentFloorFilterIds();
    const objectsToPin = allMapObjects.filter(obj => {
      const objFloorIds = [
        obj.floor?.mappedinId,
        obj.floor?.externalId,
        obj.floor?.id,
        obj.floorId,
        typeof obj.floor === 'string' ? obj.floor : null
      ].filter(Boolean);
      return assignedMIDs.includes(obj.id) && objFloorIds.some((floorId: string) => currentFloorIds.includes(floorId));
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

    if (isOverview) {
      // Keep controls visible in overview
    } else {
      if (topControls) topControls.style.display = "flex";
    }
    // NOTE: renderCategories is called by the floor-change handler directly.
    // Do NOT call it here to avoid redundant re-renders.
  };

  // Expose state for TranslationManager to enable dynamic updates
  try {
    Object.defineProperty(window, 'activeCategoryId', { get: () => activeCategoryId, configurable: true });
    Object.defineProperty(window, 'activeSubCategoryId', { get: () => activeSubCategoryId, configurable: true });
  } catch (e) { console.warn("Could not expose category state", e); }

  const isCategoryDebugEnabled = () => {
    try {
      return checkIsLocal();
    } catch (e) {
      return false;
    }
  };

  const getCurrentFloorFilterIds = () => {
    const floor = mapView.currentFloor as any;
    return [
      floor?.mappedinId,
      floor?.externalId,
      floor?.id
    ].filter(Boolean);
  };

  const getInitialLocationRows = () =>
    Object.values(TranslationManager.data.locations || {})
      .map((location: any) => normalizeLocationRecord(location))
      .filter((location: any) => location.MappedinID);

  const getSubCategoryLocationRows = async (subCatId: string | number) => {
    const selectedSubCategoryId = Number(subCatId);

    // 1. Get initial/cached rows for this subcategory
    const initialRows = getInitialLocationRows()
      .filter((location: any) => {
        const rowSubId = normalizeOptionalNumber(location.SubCategoryID);
        return rowSubId === selectedSubCategoryId;
      });

    // 2. Fetch from API
    let endpointRows: any[] = [];
    try {
      endpointRows = await ApiService.getSubCategoryLocations(String(subCatId));
    } catch (err) {
      console.warn("ApiService.getSubCategoryLocations failed", err);
    }

    const normalizedEndpointRows = (endpointRows || [])
      .map((location: any) => normalizeLocationRecord(location))
      .filter((location: any) => {
        // We don't strictly filter by SubCategoryID here because the endpoint 
        // is already specific to the subcategory ID. This avoids issues if the API 
        // response doesn't include the SubCategoryID field in the rows.
        return location.MappedinID;
      });

    // Merge cached init-data with fresh AreaList rows.
    // Endpoint rows come last so current AreaList language columns win over blank cached values.
    return mergeLocationRowsByMappedinId(initialRows, normalizedEndpointRows);
  };

  let isRenderingCategories = false;
  const getSubCategoryAreaEntries = async (
    subCatId: string | number,
    currentFloorIds: string[] | null,
    isOverviewMode: boolean,
    mapObjectsById: Map<string, any>
  ) => {
    const locationRows = await getSubCategoryLocationRows(subCatId);
    const areaEntries = buildSubCategoryLocationEntries(
      subCatId,
      locationRows,
      currentFloorIds || [],
      isOverviewMode,
      mapObjectsById,
      TranslationManager.currentLang || 'vn'
    );
    return { locationRows, areaEntries };
  };

  const renderCategories = async (parentId: string | number | null = null, forceRefresh: boolean = false) => {
    if (isRenderingCategories && !forceRefresh) return;
    isRenderingCategories = true;

    // Expose function if not already (safeguard)
    if (!(window as any).renderCategories) (window as any).renderCategories = renderCategories;

    const categoryList = document.getElementById("category-list");
    if (!categoryList) {
      isRenderingCategories = false;
      return;
    }

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
      return cat.names?.[lang] || cat.names?.vn || cat[lang] || cat.vn || cat.name || '';
    };

    const currentFloorId = mapView.currentFloor.id;
    const currentFloorIds = getCurrentFloorFilterIds();
    const isOverviewMode = isMapInOverview();
    const mapObjectsById = new Map<string, any>();
    allMapObjects.forEach((obj: any) => {
      if (obj?.id) mapObjectsById.set(obj.id, obj);
    });

    // Get all area assignments to filter active cats per floor.
    // Floor visibility is derived from runtime map objects, not persisted on AreaList.
    const initialLocationRows = getInitialLocationRows();
    const assignedFromInitialData = initialLocationRows
      .filter((location: any) => location.SubCategoryID && location.MappedinID)
      .map((location: any) => ({
        MappedinID: location.MappedinID,
        SubCategoryID: location.SubCategoryID,
        CategoryID: location.CategoryID
      }));

    let apiAssigned: any[] = [];
    try {
      apiAssigned = await ApiService.getAssignedAreas();
    } catch (err) {
      console.warn("ApiService.getAssignedAreas failed", err);
    }

    // Merge both sources to ensure we don't lose data if partial data exists in either
    const mergedAssignedMap = new Map<string, any>();
    (apiAssigned || []).forEach((a: any) => {
      if (a.MappedinID) mergedAssignedMap.set(a.MappedinID, a);
    });
    assignedFromInitialData.forEach((a: any) => {
      mergedAssignedMap.set(a.MappedinID, a);
    });

    const assigned = Array.from(mergedAssignedMap.values());

    if (isCategoryDebugEnabled()) console.groupCollapsed(`🧭 [CATEGORY_DEBUG] renderCategories parent=${parentId ?? 'root'} floor=${currentFloorId} overview=${isOverviewMode}`);
    if (isCategoryDebugEnabled()) console.debug("Context:", {
      parentId,
      forceRefresh,
      selectedFloorIds: currentFloorIds,
      currentFloorName: mapView.currentFloor?.name,
      isOverviewMode,
      selectedCategoryId: activeCategoryId,
      selectedSubCategoryId: activeSubCategoryId,
      categoryTreeCount: categoryTree.length,
      allMapObjectsCount: allMapObjects.length,
      assignedCount: assigned.length
    });
    if (isCategoryDebugEnabled()) console.table(assigned.slice(0, 30).map((entry: any) => ({
      mappedinId: entry.MappedinID,
      subCategoryId: entry.SubCategoryID,
      floorId: entry.FloorID
    })));

    // Map assigned areas to their subcategories
    const assignedMap = new Map<string, string[]>(); // SubID -> MIDs
    assigned.forEach((a: any) => {
      if (!assignedMap.has(a.SubCategoryID.toString())) assignedMap.set(a.SubCategoryID.toString(), []);
      assignedMap.get(a.SubCategoryID.toString())!.push(a.MappedinID);
    });

    // Helper to check if a subcategory has objects on the current floor
    const isSubActiveOnFloor = (subId: string) =>
      hasAssignmentsOnVisibleFloor(subId, assigned, currentFloorIds, isOverviewMode, mapObjectsById);

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
      const parentCat = categoryTree.find(c => c.id.toString() === parentId.toString());
      const parentCategoryName = parentCat ? getCategoryName(parentCat) : TranslationManager.t('back_btn', 'Danh mục');
      const backBtn = document.createElement("div");
      backBtn.className = "category-subcategory-sticky-header";
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
                <span>${parentCategoryName}</span>
            `;
      backBtn.onmouseenter = () => { backBtn.style.background = "#eef3ff"; };
      backBtn.onmouseleave = () => { backBtn.style.background = "#fafbfd"; };
      backBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        markSidebarInteraction();
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

      if (parentCat && parentCat.subcategories) {
        const activeSubs = parentCat.subcategories.filter((s: any) => isSubActiveOnFloor(s.id));
        const visibleSubs = activeSubs;
        if (isCategoryDebugEnabled()) console.debug("Subcategory branch:", {
          parentCategoryId: parentCat.id,
          parentCategoryName: getCategoryName(parentCat),
          totalSubcategories: parentCat.subcategories.length,
          activeSubcategories: activeSubs.map((s: any) => ({
            id: s.id,
            name: getCategoryName(s),
            assignmentCount: (assignedMap.get(s.id.toString()) || []).length
          }))
        });

        if (visibleSubs.length === 0) {
          if (isCategoryDebugEnabled()) console.warn("⚠️ [CATEGORY_DEBUG] No active subcategories for current branch", {
            parentCategoryId: parentCat.id,
            parentCategoryName: getCategoryName(parentCat),
            floorId: currentFloorId,
            isOverviewMode
          });
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

        for (const sub of visibleSubs) {
          try {
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

            item.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              markSidebarInteraction();
              (window as any).highlightSubCategory(String(sub.id));
            };
            categoryList.appendChild(item);

            // === AREA LIST: Render khi active (Incheon accordion style) ===
            if (isActive) {
              const areaContainer = document.createElement("div");
              areaContainer.className = "category-area-list";
              areaContainer.style.cssText = `
                            margin: 0; width: 100%; box-sizing: border-box;
                            overflow-y: auto;
                            background: #fafbfd;
                            border-bottom: 2px solid #e8ecf4;
                            display: block !important;
                            visibility: visible !important;
                        `;

              // Show loading indicator immediately
              areaContainer.innerHTML = `<div style="padding: 15px 28px; font-size: 13px; color: #999; display: flex; align-items: center; gap: 8px;">
                <div class="loading-spinner-small" style="width: 14px; height: 14px; border: 2px solid #f3f3f3; border-top: 2px solid #214ca6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span>${TranslationManager.t('loading', 'Đang tải...')}</span>
              </div>`;
              categoryList.appendChild(areaContainer);

              // Get assigned areas for this subcategory
              const assignedMIDs = assignedMap.get(sub.id.toString()) || [];
              {
                const currentVisibleFloorIds = isOverviewMode ? null : currentFloorIds;
                const { locationRows: subLocations, areaEntries } = await getSubCategoryAreaEntries(
                  sub.id.toString(),
                  currentVisibleFloorIds,
                  isOverviewMode,
                  mapObjectsById
                );

                // Clear loading indicator
                areaContainer.innerHTML = "";

                const subLocationMIDs = subLocations.map((row: any) => row?.MappedinID).filter(Boolean);
                const unmatchedAssignedMIDs = assignedMIDs.filter((mid: string) => !mapObjectsById.has(mid));
                const unmatchedSubLocationMIDs = subLocationMIDs.filter((mid: string) => !mapObjectsById.has(mid));
                const fallbackFilteredEntries = buildVisibleCategoryAreas(
                  subLocations,
                  currentVisibleFloorIds || [],
                  isOverviewMode,
                  mapObjectsById,
                  TranslationManager.currentLang || 'vn'
                );
                if (isCategoryDebugEnabled()) console.debug("Area list branch:", {
                  subCategoryId: sub.id,
                  subCategoryName: getCategoryName(sub),
                  assignedMIDsCount: assignedMIDs.length,
                  subLocationRows: subLocations.length,
                  subLocationMIDsCount: subLocationMIDs.length,
                  currentVisibleFloorIds,
                  areaEntriesCount: areaEntries.length,
                  fallbackFilteredEntriesCount: fallbackFilteredEntries.length,
                  unmatchedAssignedMIDsCount: unmatchedAssignedMIDs.length,
                  unmatchedSubLocationMIDsCount: unmatchedSubLocationMIDs.length,
                  entries: areaEntries.map((entry: any) => ({
                    mappedinId: entry?.mappedinId,
                    floorId: entry?.floorId,
                    hasMapObject: Boolean(entry?.mapObject),
                    dbName: entry?.displayName || entry?.dbRow?.VN || entry?.dbRow?.Name || null
                  }))
                });
                if (isCategoryDebugEnabled() && subLocations.length > 0 && areaEntries.length === 0) {
                  console.error("❌ [CATEGORY_DEBUG] Area list collapsed to zero after filtering", {
                    subCategoryId: sub.id,
                    subCategoryName: getCategoryName(sub),
                    currentVisibleFloorIds,
                    isOverviewMode,
                    assignedMIDs,
                    subLocationMIDs,
                    subLocationRows: subLocations.map((row: any) => ({
                      mappedinId: row.MappedinID,
                      floorId: null,
                      vn: row.VN || row.Name || null,
                      hasMapObject: Boolean(mapObjectsById.get(row.MappedinID)),
                      mapObjectFloorId: (() => {
                        const obj = mapObjectsById.get(row.MappedinID);
                        return obj?.floor?.mappedinId || obj?.floor?.id || obj?.floorId || (typeof obj?.floor === "string" ? obj.floor : null) || null;
                      })()
                    })),
                    unmatchedAssignedMIDs,
                    unmatchedSubLocationMIDs,
                    fallbackFilteredEntries: fallbackFilteredEntries.map((entry: any) => ({
                      mappedinId: entry?.mappedinId,
                      floorId: entry?.floorId
                    }))
                  });
                }
                if (isCategoryDebugEnabled() && (unmatchedAssignedMIDs.length > 0 || unmatchedSubLocationMIDs.length > 0)) {
                  console.warn("⚠️ [CATEGORY_DEBUG] Some assigned mids cannot be resolved to map objects", {
                    subCategoryId: sub.id,
                    subCategoryName: getCategoryName(sub),
                    unmatchedAssignedMIDs,
                    unmatchedSubLocationMIDs
                  });
                }

                areaEntries.sort((a: any, b: any) => {
                  const aName = a?.displayName || TranslationManager.getName(a?.dbRow) || TranslationManager.getName(a?.mapObject) || a?.dbRow?.VN || a?.dbRow?.Name || a?.dbRow?.name || a?.mappedinId || "";
                  const bName = b?.displayName || TranslationManager.getName(b?.dbRow) || TranslationManager.getName(b?.dbRow) || TranslationManager.getName(b?.mapObject) || b?.dbRow?.VN || b?.dbRow?.Name || b?.dbRow?.name || b?.mappedinId || "";
                  return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
                });
                Object.assign(areaContainer.style, getCategoryAreaListStyle(areaEntries.length));

                if (areaEntries.length === 0) {
                  const emptyAreaState = document.createElement("div");
                  emptyAreaState.style.cssText = `
                              padding: 14px 20px 16px 28px;
                              color: #667085;
                              font-size: 13px;
                              border-top: 1px solid #eef2f6;
                          `;
                  emptyAreaState.textContent = isOverviewMode
                    ? "Chưa có khu vực hiển thị cho danh mục này."
                    : "Không có khu vực của danh mục này trên tầng hiện tại.";
                  areaContainer.appendChild(emptyAreaState);
                }

                areaEntries.forEach((areaEntry: any) => {
                  if (!areaEntry) return;
                  const area = areaEntry.mapObject;
                  const focusedResult = currentSearchResults.length === 1 ? currentSearchResults[0] : null;
                  const isFocused = focusedResult?.id === (area?.id || areaEntry.mappedinId);
                  const areaItem = document.createElement("div");

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
                  const areaName =
                    areaEntry.displayName ||
                    TranslationManager.getName(areaEntry.dbRow) ||
                    TranslationManager.getName(area) ||
                    areaEntry.dbRow?.VN ||
                    areaEntry.dbRow?.Name ||
                    areaEntry.dbRow?.name ||
                    area?.name ||
                    areaEntry.mappedinId;
                  const rawFloorName = area?.floor?.name || (typeof area?.floor === 'string' ? area.floor : null);
                  const floorMappedId =
                    area?.floor?.mappedinId ||
                    areaEntry.floorId ||
                    area?.floor?.id ||
                    area?.floorId ||
                    (typeof area?.floor === 'string' ? area.floor : null);
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
                    markSidebarInteraction();
                    e.stopPropagation(); // Prevent subcategory toggle
                    if (!area) {
                      if (floorMappedId && (!mapView.currentFloor || mapView.currentFloor.id !== floorMappedId)) {
                        performFloorSwitch(floorMappedId, "Category Area Fallback Navigation");
                      }
                      return;
                    }
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
                                    <div style="background:#085ebb;color:white;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.2);">${areaName}</div>
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
          } catch (subRenderError) {
            if (isCategoryDebugEnabled()) console.error("❌ [CATEGORY_DEBUG] Failed while rendering subcategory row", {
              subId: sub?.id,
              subName: getCategoryName(sub),
              isActive: activeSubCategoryId === sub?.id?.toString?.(),
              floorId: currentFloorId,
              isOverviewMode,
              error: subRenderError
            });
          }
        }
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
      if (isCategoryDebugEnabled()) console.debug("Main categories branch:", {
        activeMainCategoryCount: activeMainCats.length,
        activeMainCategories: activeMainCats.map((cat: any) => ({
          id: cat.id,
          name: getCategoryName(cat),
          totalSubcategories: cat.subcategories?.length || 0
        }))
      });

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
        item.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          markSidebarInteraction();
          (window as any).highlightCategory(cat.id.toString());
        };
        categoryList.appendChild(item);
      });
    }
    isRenderingCategories = false;
    if (isCategoryDebugEnabled()) console.groupEnd();
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

  const mainSidebar = document.getElementById("main-sidebar-left");
  if (mainSidebar && !(mainSidebar as any).__blocksMapClick) {
    const stopSidebarEvent = (e: Event) => {
      markSidebarInteraction();
      e.stopPropagation();
    };

    ["pointerdown", "mousedown", "touchstart", "click", "dblclick"].forEach((eventName) => {
      mainSidebar.addEventListener(eventName, stopSidebarEvent);
    });

    (mainSidebar as any).__blocksMapClick = true;
  }

  if (mainToggleBtn) {
    mainToggleBtn.addEventListener("click", () => setCategoryPanelState(true));
  }
  if (collapseBtn) {
    collapseBtn.addEventListener("click", () => setCategoryPanelState(false));
  }


  // Floor-change logic đã được xử lý ở lắng nghe sự kiện floor-change chính (dòng 3312+)


  // Helper: Thực hiện chuyển tầng có khóa bảo vệ
  const performFloorSwitch = async (targetFloorId: string, reason: string) => {
    // FIX: Allow switching even if ID matches IF we are currently in Overview mode
    if (isFloorSwitching) return;
    if (!isMapInOverview() && mapView.currentFloor && mapView.currentFloor.id === targetFloorId) return;

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
      (window as any).isInOverview = isInOverview;

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

    // Bỏ qua nếu đang chuyển tầng (chặn spam), zoom do code (category), hoặc đang reset camera
    if (isGlobalSwitchingFloor || isManualFloorSwitch || isProgrammaticZoom || isFloorSwitching || (window as any)._isResettingCamera) return;

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

    // Logic ẩn/hiện nhãn theo mức Zoom (bỏ qua khi đang animation để tránh layout thrashing)
    if (!(window as any)._isResettingCamera && !isGlobalSwitchingFloor && !isManualFloorSwitch) {
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
      const summaryContainer = document.getElementById("wayfinding-summary-container");
      if (summaryContainer) {
        summaryContainer.style.display = "none";
      }
      const previewBar = document.getElementById("route-preview-bar");
      if (previewBar) {
        previewBar.style.display = "none";
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
    getColorRenderObjects().forEach((obj: any) => {
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
    const renderRouteNotFoundState = (messageKey: string = 'not_found', fallback: string = "KhÃ´ng tÃ¬m tháº¥y Ä‘Æ°á»ng Ä‘i") => {
      (window as any).isNavigationActive = false;
      wayfindingDirections = null;
      currentNavigation = null;

      const message = TranslationManager.t(messageKey, fallback);
      const statusEl = document.getElementById("wayfinding-status");
      if (statusEl) {
        statusEl.textContent = "";
        statusEl.style.display = "none";
      }

      const popup = document.getElementById("sidebar-info-panel");
      const categorySection = document.getElementById("category-section");
      const sidebarActions = document.querySelector(".sidebar-actions") as HTMLElement;
      if (popup) popup.style.display = "none";
      if (categorySection) categorySection.style.display = "none";
      if (sidebarActions) sidebarActions.style.display = "none";

      const instructionsListEl = document.getElementById("instructions-list");
      if (instructionsListEl) {
        instructionsListEl.innerHTML = `
          <div style="min-height: 260px; display:flex; align-items:center; justify-content:center; padding:24px 20px; color:#64748b; font-style:italic; text-align:center;">
            ${message}
          </div>`;
      }

      const summaryContainer = document.getElementById("wayfinding-summary-container");
      if (summaryContainer) summaryContainer.style.display = "none";

      const previewBar = document.getElementById("route-preview-bar");
      if (previewBar) {
        previewBar.style.display = "none";
        const dirContent = document.getElementById("directions-tab-content");
        if (dirContent) dirContent.style.paddingBottom = "30px";
      }
    };

    try {
      clearNavigation();

      // Lấy directions với smoothing để có đường đi mượt mà nhưng vẫn đảm bảo điểm đến được kết nối
      // Tối ưu tốc độ: Ưu tiên greedy-los (nhanh nhất) cho hầu hết trường hợp, chỉ dùng dp-optimal cho đường rất gần
      // Mappedin JS tự động tránh cắt ngang qua khu vực bằng cách đi theo lối đi (paths)

      const statusEl = document.getElementById("wayfinding-status");
      const instructionsListEl = document.getElementById("instructions-list");
      
      if (statusEl) {
        statusEl.textContent = TranslationManager.t('loading_route', "Đang tìm đường đi...");
        statusEl.style.display = "block";
      }

      if (instructionsListEl) {
        instructionsListEl.innerHTML = `
          <div style="padding: 60px 20px; text-align: center; color: #64748b;">
            <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid #f3f4f6; border-top: 3px solid #214ca6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px;"></div>
            <div style="font-weight: 500; font-size: 15px;">${TranslationManager.t('loading_route', "Đang tìm đường đi...")}</div>
          </div>
          <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        `;
      }

      // ⏱️ Đợi 50ms để trình duyệt kịp vẽ giao diện Loading trước khi bắt đầu tính toán
      await new Promise(r => setTimeout(r, 50));

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
      const routeTargetFloors = new Map((mapData.getByType("floor") || []).map((floor: any) => [floor.id, floor]));
      const routeTargetOptions = {
        createCoordinate: (latitude: number, longitude: number, floorId?: string) => {
          const floor = floorId ? routeTargetFloors.get(floorId) : mapView.currentFloor;
          return mapView.createCoordinate(latitude, longitude, floor || mapView.currentFloor);
        },
        getDistance: (from: any, to: any) => {
          try {
            return (mapData as any).getDistance(from, to);
          } catch {
            return undefined;
          }
        }
      };
      const routeLegs = resolveWayfindingRouteTargets(waypoints, routeTargetOptions);

      let allCoordinates: any[] = [];
      let allInstructions: any[] = [];
      let totalDistance = 0;
      let allPaths: any[] = [];

      for (let i = 0; i < routeLegs.length; i++) {
        let { origin, destination: dest, routeOrigin, routeDestination } = routeLegs[i];

        if (String((origin as any)?.__type || '').toLowerCase() === 'object' ||
          String((dest as any)?.__type || '').toLowerCase() === 'object') {
          try {
            const previewDirections = await mapData.getDirections(origin, dest, { smoothing: smoothingConfig, accessible: false });
            const previewCoordinates = previewDirections?.coordinates || [];
            const originReference = getObjectRouteReferenceCoordinate(origin, previewCoordinates, 'origin');
            const destinationReference = getObjectRouteReferenceCoordinate(dest, previewCoordinates, 'destination');

            if (originReference) {
              routeOrigin = resolveWayfindingRouteTarget(origin, dest, {
                ...routeTargetOptions,
                routeReferenceCoordinate: originReference
              });
            }

            if (destinationReference) {
              routeDestination = resolveWayfindingRouteTarget(dest, origin, {
                ...routeTargetOptions,
                routeReferenceCoordinate: destinationReference
              });
            }
          } catch { }
        }

        // SMART ROUTING: Tính cả 2 đường (thang máy + thang cuốn), chọn đường ngắn nhất
        const [dirEscalator, dirElevator] = await Promise.all([
          mapData.getDirections(routeOrigin, routeDestination, { smoothing: smoothingConfig, accessible: false }),
          mapData.getDirections(routeOrigin, routeDestination, { smoothing: smoothingConfig, accessible: true }),
        ]);

        // So sánh khoảng cách và chọn đường ngắn hơn
        const distEsc = (dirEscalator?.distance ?? Infinity);
        const distElev = (dirElevator?.distance ?? Infinity);
        const dir = (distElev <= distEsc && (dirElevator?.coordinates?.length ?? 0) > 0) ? dirElevator : dirEscalator;

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
          // Legacy inline simplification is kept inert while the tested helper below owns instruction rules.
          if (false && simplifiedInstructions.length > 0) {
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
        const coordinateFromPathEntry = (entry: any) => entry?.coordinate || entry?.anchor || entry;
        const extractPathCoordinates = (directionsLike: any) => {
          const sources = Array.isArray(directionsLike?.paths) && directionsLike.paths.length > 0
            ? directionsLike.paths
            : [directionsLike?.path].filter(Boolean);
          const coords: any[] = [];
          for (const source of sources) {
            let sourceCoords: any[] = [];
            if (Array.isArray(source)) {
              sourceCoords = source.map(coordinateFromPathEntry).filter(Boolean);
            } else if (Array.isArray(source?.coordinates)) {
              sourceCoords = source.coordinates.filter(Boolean);
            } else if (Array.isArray(source?.segments)) {
              sourceCoords = source.segments.flatMap((segment: any) => segment?.coordinates || []).filter(Boolean);
            }
            if (sourceCoords.length === 0) continue;
            if (coords.length > 0) {
              coords.push(...sourceCoords.slice(1));
            } else {
              coords.push(...sourceCoords);
            }
          }
          return coords.length >= 3 ? coords : (directionsLike.coordinates || []);
        };
        simplifiedInstructions = simplifyNavigationInstructions(directions.instructions || [], {
          pathCoordinates: extractPathCoordinates(directions)
        })
          .filter((instruction: any) => shouldRenderNavigationInstruction(instruction));
        simplifiedInstructions = ensureMinimumRouteInstructions(simplifiedInstructions, {
          coordinates: directions.coordinates || [],
          distance: directions.distance || totalDistance
        });
        const displayDirections = {
          ...directions,
          rawInstructions: directions.instructions || [],
          instructions: simplifiedInstructions
        };
        wayfindingDirections = displayDirections;

        const navigationOptions: any = {
          pathOptions: {
            displayArrowsOnPath: true,
            animateArrowsOnPath: true,
            accentColor: '#214ca6',
            width: 0.7, // Giữ đường dẫn mảnh hơn để giảm lấn tường khi render.
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

        const instructionFormatter = createInstructionFormatter({
          floors: mapData.getByType('floor') || [],
          mapObjects: allMapObjects,
          landmarkExcludeObjects: waypoints,
          t: (key: string, def: string) => TranslationManager.t(key, def),
          getFloorName: (floorId: string, originalName: string = '') => TranslationManager.getFloorName(floorId, originalName),
          getName: (obj: any) => TranslationManager.getName(obj) || obj?.name
        });

        // Translation logic
        const translateActionType = (instruction: any, allInstructions: any[], currentIndex: number): string => {
          return instructionFormatter.format(instruction, allInstructions, currentIndex);
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
              let currentDist = getInstructionDisplayDistance(instruction);

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
          const totalDisplayDist = getRouteDisplayDistanceMeters(simplifiedInstructions, {
            coordinates: directions.coordinates || [],
            distance: directions.distance || totalDistance
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
          if (previewBar) {
            previewBar.style.display = "block";
            const dirContent = document.getElementById("directions-tab-content");
            if (dirContent && window.innerWidth <= 768) dirContent.style.paddingBottom = "55px";
          }

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
        renderRouteNotFoundState();
        return;
      }
    } catch (e) {
      console.error("Error drawing navigation:", e);
      renderRouteNotFoundState('error_nav', "Lỗi khi tìm đường đi");
      return;
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
    if (previewBar) {
      previewBar.style.display = "none";
      const dirContent = document.getElementById("directions-tab-content");
      if (dirContent) dirContent.style.paddingBottom = "30px";
    }
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
    const stop = wayfindingStopovers[index];
    if (stop) resetObjectHighlight(stop);
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

  (window as any).clearNode = (type: string, index: number = -1) => {
    if (type === 'origin') {
      if (wayfindingOrigin) resetObjectHighlight(wayfindingOrigin);
      wayfindingOrigin = null;
    } else if (type === 'destination') {
      if (wayfindingDestination) resetObjectHighlight(wayfindingDestination);
      wayfindingDestination = null;
    } else if (type === 'stopover' && index >= 0) {
      const stop = wayfindingStopovers[index];
      if (stop) resetObjectHighlight(stop);
      wayfindingStopovers.splice(index, 1);
    }
    updateWayfindingUI();
    clearNavigation();

    if (!wayfindingOrigin && wayfindingDestination) {
      updateInfo(wayfindingDestination);
    } else if (!wayfindingDestination && wayfindingOrigin) {
      updateInfo(wayfindingOrigin);
    } else if (!wayfindingOrigin && !wayfindingDestination) {
      const popupInfo = document.getElementById("sidebar-info-panel");
      if (popupInfo) popupInfo.style.display = "none";
    }
  };

  let draggedNodeIndex = -1;
  (window as any).onWayfindingDragStart = (e: any, index: number) => {
    draggedNodeIndex = index;
    e.dataTransfer.effectAllowed = "move";
    e.target.style.opacity = "0.5";
  };
  (window as any).onWayfindingDragEnd = (e: any) => {
    e.target.style.opacity = "1";
    draggedNodeIndex = -1;
  };
  (window as any).onWayfindingDragOver = (e: any) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  (window as any).onWayfindingDrop = (e: any, targetIndex: number) => {
    e.preventDefault();
    if (draggedNodeIndex === -1 || draggedNodeIndex === targetIndex) return;

    const nodes = [wayfindingOrigin, ...wayfindingStopovers, wayfindingDestination];
    const draggedItem = nodes.splice(draggedNodeIndex, 1)[0];
    nodes.splice(targetIndex, 0, draggedItem);

    wayfindingOrigin = nodes[0];
    wayfindingDestination = nodes[nodes.length - 1];
    wayfindingStopovers = nodes.slice(1, nodes.length - 1);

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
      const useDragAndDrop = totalNodes >= 3;
      
      const getDragAttributes = (index: number) => {
        if (!useDragAndDrop) return '';
        return `draggable="true" ondragstart="window.onWayfindingDragStart(event, ${index})" ondragend="window.onWayfindingDragEnd(event)" ondragover="window.onWayfindingDragOver(event)" ondrop="window.onWayfindingDrop(event, ${index})"`;
      };
      
      const dragHandleHtml = useDragAndDrop ? `
        <div style="cursor:grab; display:flex; align-items:center; color:#adb5bd; padding-right:4px;" onmousedown="event.stopPropagation();">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line></svg>
        </div>
      ` : '';

      // ===================================
      // 1. ORIGIN ROW
      // ===================================
      const originName = wayfindingOrigin ? TranslationManager.getName(wayfindingOrigin) : '';
      const originColor = wayfindingOrigin ? '#1a1a2e' : '#999';
      const originBg = 'white';
      const originBorder = 'border:1px solid transparent; border-bottom:1px solid #e0e4ef;';
      nodesHtml += `<div ${getDragAttributes(0)} style="
        display:flex; align-items:center; gap:10px;
        padding:12px 14px; background:${originBg};
        ${originBorder}
        cursor:pointer; transition: background 0.2s;" 
        onclick="window.startSelectingNode('origin')"
        onmouseenter="if(!${isSelectingOrigin}) this.style.background='#fafcff'" onmouseleave="if(!${isSelectingOrigin}) this.style.background='${originBg}'">
        ${dragHandleHtml}
        <div style="width:24px;height:24px;border-radius:50%;background:white; display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#214ca6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </div>
        <div style="flex:1;overflow:hidden; display:flex; flex-direction:column; justify-content:center;">
          <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;line-height:1;">${TranslationManager.t('from_label', 'Đi từ')}</div>
          <input type="text" id="wayfinding-input-origin" autocomplete="off"
            placeholder="${TranslationManager.t('search_departure_placeholder', 'Search Departure')}" 
            value="${originName}" 
            oninput="window.performWayfindingSearch(this.value, 'origin')" 
            onfocus="window.startSelectingNode('origin'); window.performWayfindingSearch(this.value, 'origin');" 
            style="width:100%; border:none; outline:none; background:transparent; font-size:16px; color:${originColor}; padding:0; margin:0; font-weight:500;" 
          />
        </div>
        ${wayfindingOrigin ? `<button onclick="event.stopPropagation(); window.clearNode('origin')" style="background:none;border:none;cursor:pointer;color:#94a3b8;display:flex;align-items:center;justify-content:center;padding:4px;" title="Xóa">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>` : ''}
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

        nodesHtml += `<div ${getDragAttributes(i + 1)} style="
          display:flex; align-items:center; gap:10px;
          padding:12px 14px; background:${stopBg};
          ${stopBorder}
          cursor:pointer; transition: background 0.2s;"
          onclick="window.startSelectingNode('stopover', ${i})"
          onmouseenter="if(!${isSelecting}) this.style.background='#fafcff'" onmouseleave="if(!${isSelecting}) this.style.background='${stopBg}'">
          ${dragHandleHtml}
          <div style="width:24px;height:24px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#64748b;font-size:14px;font-weight:bold;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </div>
          <div style="flex:1;overflow:hidden; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;line-height:1;">${TranslationManager.t('stopover_label', 'Điểm dừng')}</div>
            <input type="text" id="wayfinding-input-stopover-${i}" autocomplete="off"
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
      nodesHtml += `<div ${getDragAttributes(totalNodes - 1)} style="
        display:flex; align-items:center; gap:10px;
        padding:12px 14px; background:${destBg};
        ${destBorder}
        border-radius: 0 0 0 8px;
        cursor:pointer; transition: background 0.2s;"
        onclick="window.startSelectingNode('destination')"
        onmouseenter="if(!${isSelectingDestination}) this.style.background='#fafcff'" onmouseleave="if(!${isSelectingDestination}) this.style.background='${destBg}'">
        ${dragHandleHtml}
        <div style="width:24px;height:24px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="#f59e0b"></circle></svg>
        </div>
        <div style="flex:1;overflow:hidden; display:flex; flex-direction:column; justify-content:center;">
          <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;line-height:1;">${TranslationManager.t('to_label', 'Đi đến')}</div>
          <input type="text" id="wayfinding-input-destination" autocomplete="off"
            placeholder="${TranslationManager.t('search_destination_placeholder', 'Search Destination')}" 
            value="${destName}" 
            oninput="window.performWayfindingSearch(this.value, 'destination')" 
            onfocus="window.startSelectingNode('destination'); window.performWayfindingSearch(this.value, 'destination');" 
            style="width:100%; border:none; outline:none; background:transparent; font-size:16px; color:${destColor}; padding:0; margin:0; font-weight:500;" 
          />
        </div>
        ${wayfindingDestination ? `<button onclick="event.stopPropagation(); window.clearNode('destination')" style="background:none;border:none;cursor:pointer;color:#94a3b8;display:flex;align-items:center;justify-content:center;padding:4px;" title="Xóa">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>` : ''}
      </div>`;

      // Nút Thêm điểm dừng (Add Stopover) nằm dưới ô Điểm đến
      nodesHtml += `<div style="padding: 4px 14px 10px; background: white; border-radius: 0 0 8px 8px; display: flex; align-items: center; justify-content: flex-start;">
        <button onclick="window.addStopover(event)" style="background:none;border:none;cursor:pointer;color:#214ca6;display:flex;align-items:center;gap:6px;padding:6px 8px;font-size:13px;font-weight:500;border-radius:6px;transition:background 0.2s;" onmouseenter="this.style.background='#f0f4ff'" onmouseleave="this.style.background='transparent'" title="${TranslationManager.t('add_stopover', 'Thêm điểm dừng')}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          ${TranslationManager.t('add_stopover', 'Thêm điểm dừng')}
        </button>
      </div>`;

      nodesContainer.innerHTML = nodesHtml;

      // ===================================
      // 4. RESET & SWAP BUTTONS (Right Column)
      // ===================================
      swapHtml += `<button id="wayfinding-reset-btn" title="Xóa tất cả" style="
        background:none; border:none;
        cursor:pointer; padding:6px;
        color: #94a3b8; transition:all 0.3s ease;
        display:flex; align-items:center; justify-content:center;
        margin-bottom: 4px;
      " onmouseenter="this.style.color='#214ca6'; this.style.transform='rotate(90deg)'" onmouseleave="this.style.color='#94a3b8'; this.style.transform='rotate(0)'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>`;

      if (!useDragAndDrop) {
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
      }
      swapContainer.innerHTML = swapHtml;
      swapContainer.style.display = 'flex';

      // Bind Reset Button - cần dùng ID vì render dynamic
      const resBtn = document.getElementById("wayfinding-reset-btn");
      if (resBtn) {
        resBtn.onclick = (e) => {
          e.preventDefault();
          resetWayfinding();
          const resultsContainer = document.getElementById("wayfinding-search-results");
          if (resultsContainer) resultsContainer.style.display = "none";
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
          if (popupInfo) {
            popupInfo.style.display = "none";
          }
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

    const safeQuery = query ? query.trim() : "";
    const isSuggested = !safeQuery;
    const selectedRouteObjects = [wayfindingOrigin, ...wayfindingStopovers, wayfindingDestination].filter(Boolean);
    const excludeObjects = selectedRouteObjects.filter((obj: any) => {
      if (nodeType === 'origin') return obj !== wayfindingOrigin;
      if (nodeType === 'destination') return obj !== wayfindingDestination;
      if (nodeType === 'stopover') return obj !== wayfindingStopovers[index];
      return true;
    });
    const uniqueResults: any[] = (rankWayfindingSearchResults as any)({
      query: safeQuery,
      objects: allMapObjects,
      origin: nodeType === 'destination' ? wayfindingOrigin : null,
      nodeType,
      excludeObjects,
      currentFloorId: mapView.currentFloor?.id || null,
      getName: (obj: any) => TranslationManager.getName(obj),
      getFloorSortRank: getFloorSortRankForObject,
      allowedFloorIds: SEARCHABLE_DETAIL_FLOOR_IDS
    });

    if (uniqueResults.length === 0) {
      const emptyMessageKey = safeQuery ? 'no_matching_area' : 'no_results_found';
      const emptyMessageFallback = safeQuery ? 'Kh\u00f4ng t\u00ecm th\u1ea5y khu v\u1ef1c ph\u00f9 h\u1ee3p' : 'Kh\u00f4ng t\u00ecm th\u1ea5y k\u1ebft qu\u1ea3';
      resultsContainer.innerHTML = `<div style="padding: 15px; color: #999; text-align: center; font-size:13px;">${TranslationManager.t(emptyMessageKey, emptyMessageFallback)}</div>`;
      resultsContainer.style.display = "block";
      return;
    }

    resultsContainer.innerHTML = "";

    // Header for suggested
    let itemsWrapper: HTMLElement;
    if (isSuggested) {
      const header = document.createElement("div");
      header.style.cssText = "position: sticky; top: 0; z-index: 10; padding: 16px 15px 12px; display: flex; align-items: center; justify-content: space-between; font-size: 15px; font-weight: 700; color: #1a1a2e; background: white; cursor: pointer; border-bottom: 1px solid #f0f4f8;";
      const arrowId = `wayfinding-dropdown-arrow`;
      header.innerHTML = `
        <span>${TranslationManager.t('suggested_places', 'Địa điểm gợi ý')}</span>
        <svg id="${arrowId}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.3s;"><polyline points="6 9 12 15 18 9"></polyline></svg>
      `;
      
      itemsWrapper = document.createElement("div");
      
      let isOpen = true;
      header.onclick = () => {
        isOpen = !isOpen;
        itemsWrapper.style.display = isOpen ? 'block' : 'none';
        const arrow = document.getElementById(arrowId);
        if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(-180deg)';
      };

      resultsContainer.appendChild(header);
      resultsContainer.appendChild(itemsWrapper);
    } else {
      itemsWrapper = document.createElement("div");
      resultsContainer.appendChild(itemsWrapper);
    }

    uniqueResults.forEach((result) => {
      const item = document.createElement("div");
      item.style.cssText = "display: flex; align-items: center; padding: 14px 15px; cursor: pointer; background: white; transition: all 0.2s ease; border-bottom: 1px solid #f8fafc;";
      item.onmouseenter = () => item.style.backgroundColor = "#f0f4ff";
      item.onmouseleave = () => item.style.backgroundColor = "white";

      const cleanName = result.name.replace(/room|door|gate/gi, '').trim();
      const floorObj = result.primaryObject.floor || result.primaryObject.floorId;
      let floorName = '';
      if (floorObj) {
        const floorId = floorObj.id || floorObj;
        const rawName = floorObj.name || '';
        floorName = TranslationManager.getFloorName(floorId, rawName);
      }
      const nearestText = result.isNearest && Number.isFinite(result.distanceMeters)
        ? `${TranslationManager.t('nearest', 'Gần nhất')} · ${Math.round(result.distanceMeters || 0)}m`
        : '';
      const distanceText = !nearestText && result.showDistance && Number.isFinite(result.distanceMeters)
        ? `${TranslationManager.t('distance_from_start', 'Cách điểm đi')} · ${Math.round(result.distanceMeters || 0)}m`
        : '';
      const subtitleParts = [nearestText || distanceText, floorName].filter(Boolean);
      const subtitle = subtitleParts.join(' · ');

      item.innerHTML = `
        <div style="width:36px; height:36px; border-radius:50%; background:#f1f5f9; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-right:12px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        </div>
        <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 15px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;">${cleanName}</div>
          ${subtitle ? `<div style="font-size:12px; color:#64748b; margin-top:2px;">${subtitle}</div>` : ''}
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

      itemsWrapper.appendChild(item);
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
  /**
   * Tính toán mức Zoom thông minh dựa trên diện tích và loại đối tượng
   */
  const getSmartZoomLevel = (obj: any): number => {
    if (!obj) return 20.0;

    // 1. Dựa vào diện tích Polygon (Nếu có)
    try {
      let coordinates = null;
      if (obj.polygons && obj.polygons.length > 0) {
        coordinates = obj.polygons[0].coordinates;
      } 
      else if (obj.geoJSON && obj.geoJSON.geometry && obj.geoJSON.geometry.type === 'Polygon') {
        coordinates = obj.geoJSON.geometry.coordinates[0].map((c: any) => ({ longitude: c[0], latitude: c[1] }));
      }

      if (coordinates) {
        const area = calculatePolygonArea(coordinates);
        if (area < 15) return 22.0; 
        if (area < 40) return 21.0; 
        if (area < 100) return 20.0;
      }
    } catch (e) { }

    // 2. Dựa vào Categories (Ưu tiên các khu vực quan trọng nhưng nhỏ)
    const categories = obj.categories || [];
    const isPriorityDetailed = categories.some((c: any) => {
      const cname = (c.name || "").toLowerCase();
      return cname.includes('gate') || cname.includes('cửa ra') || cname.includes('quầy') || 
             cname.includes('check-in') || cname.includes('toilet') || cname.includes('vệ sinh');
    });

    if (isPriorityDetailed) return 21.5;

    // 3. Fallback theo zone (dùng style màu để nhận diện quy mô lớn như Public/Hall)
    const style = getObjectBaseStyle(obj);
    const isLargeArea = (style.color === "#FFF176" || style.color === "#FFCDD2" || style.color === "#FBC02D" || style.color === "#EF9A9A");
    
    return isLargeArea ? 18.5 : 20.0;
  };

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
      // Hiện bảng thông tin ở bất kể tab nào (Search hay Directions)
      popup.style.display = "flex";
      // Ensure vertical layout as per fix
      popup.style.flexDirection = "column";

      // ĐẢM BẢO KHÔNG HIỂN THỊ CÙNG LÚC VỚI EMPTY STATE CỦA ĐIỀU HƯỚNG (Hoa sen)
      // Khi đã có thông tin cụ thể thì ẩn "Bạn cần chỉ đường?" đi
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
        btnEditColor.style.display = isViewOnly ? "none" : "block";
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

    // ============================================
    // PREMIUM METADATA POPULATION (Ảnh 2)
    // ============================================
    const metaPanel = document.getElementById("area-meta-info");
    if (metaPanel) {
      const hours = TranslationManager.getOpeningHours(space.id, space);
      const detail = TranslationManager.getLocationDetail(space.id, space);
      const phone = TranslationManager.getPhone(space.id, space);

      let hasData = false;

      // 1. Giờ mở cửa
      const hRow = document.getElementById("meta-hours-row");
      const hText = document.getElementById("meta-hours");
      const hStatus = document.getElementById("meta-status");
      if (hRow && hText && hStatus) {
        if (hours && hours !== "NULL" && hours.trim() !== "") {
          hText.textContent = hours;
          const statusInfo = TranslationManager.getOpeningStatus(hours);
          hStatus.textContent = statusInfo.label;
          hStatus.style.color = statusInfo.color;
          hRow.style.display = "flex";
          hasData = true;
        } else {
          hRow.style.display = "none";
        }
      }

      // 2. Vị trí chi tiết
      const lRow = document.getElementById("meta-location-row");
      const lText = document.getElementById("meta-location");
      if (lRow && lText) {
        if (detail && detail !== "NULL" && detail.trim() !== "") {
          lText.textContent = detail;
          lRow.style.display = "flex";
          hasData = true;
        } else {
          lRow.style.display = "none";
        }
      }

      // 3. Số điện thoại
      const pRow = document.getElementById("meta-phone-row");
      const pLink = document.getElementById("meta-phone") as HTMLAnchorElement;
      if (pRow && pLink) {
        if (phone && phone !== "NULL" && phone.trim() !== "") {
          pLink.textContent = phone;
          pLink.href = `tel:${phone.replace(/\s/g, '')}`;
          pRow.style.display = "flex";
          hasData = true;
        } else {
          pRow.style.display = "none";
        }
      }

      if (metaPanel) {
        metaPanel.style.display = hasData ? "block" : "none";
      }
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
          // KHÔNG đóng phần nội dung thông tin UI để giữ lại thông tin địa điểm đang chọn theo yêu cầu mới
          // const popup = document.getElementById("sidebar-info-panel");
          // if (popup) popup.style.display = "none";

          const tabDirections = document.getElementById("tab-directions");
          if (tabDirections) (tabDirections as any).click();

          updateWayfindingUI();

          if (wayfindingOrigin && wayfindingDestination) {
            drawNavigation();
          } else {
            updateHighlights();
            focusOnObject(space, getSmartZoomLevel(space));

            const statusEl = document.getElementById("wayfinding-status");
            if (statusEl) {
              statusEl.textContent = "";
            }
          }
        };

        btnStart.onclick = () => {
          wayfindingOrigin = space;
          isSelectingOrigin = false;
          // Loại bỏ auto-selection mode để người dùng có thể xem info địa điểm tiếp theo
          // if (!wayfindingDestination) isSelectingDestination = true; 
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
          // Loại bỏ auto-selection mode để người dùng có thể xem info địa điểm tiếp theo
          // if (!wayfindingOrigin) isSelectingOrigin = true;
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

    // NEW (Updated): We NO LONGER reset wayfinding when closing info panel.
    // The wayfinding state should persist until the user clicks "Clear" in the directions tab.
    // If we closed the info, we just update the sync URL to root state.
    syncURL(true); // Update URL to root/map state

    // Refresh Wayfinding UI to show lotus if empty
    if (typeof updateWayfindingUI === 'function') updateWayfindingUI();
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
    if (Date.now() < suppressMapClickUntil) {
      if (isCategoryDebugEnabled()) console.debug("🧭 [CATEGORY_DEBUG] Suppressed map click after sidebar interaction");
      return;
    }
    // Bỏ qua click vào popup
    const target = event.originalEvent?.target;
    if (target && (target.closest("#info-popup") || target.closest(".close-btn"))) {
      return;
    }

    // ============================================
    // -1. HANDLE MULTI-MODEL PLACEMENT (PRIORITY)
    // ============================================
    if (!isViewOnly && isMultiPlacingMode && multiPlaceSourceModels.length > 0 && event.coordinate) {
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
    if (!isViewOnly && placingModelConfig && event.coordinate) {
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

        if ((placingMode as any) === 'copy' && sourceModelData) {
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
    // 1. SELECT EXISTING 3D MODEL (Alt+Click or Shift+Click only)
    // Normal click → skip models, fall through to area/space selection
    // ============================================
    if (!isViewOnly && event.models && event.models.length > 0) {
      const clickedModel = event.models[0];
      const meta = MODEL_ID_REGISTRY.get(clickedModel.id);
      const isShiftHeld = event.originalEvent?.shiftKey === true || isShiftPressed;
      const isAltHeld = event.originalEvent?.altKey === true || isAltPressed;

      if (isShiftHeld && meta) {
        // SHIFT+CLICK: Toggle multi-selection
        console.log("🔷 Shift+Click: Multi-select model", clickedModel.id);
        toggleMultiSelectModel(clickedModel, meta);
        if (multiSelectedModels.size > 0) {
          controlsPanel?.classList.add("hidden");
          activeModelInstance = null;
        }
        return;
      }

      if (isAltHeld && meta) {
        // ALT+CLICK: Select single model (open controls panel)
        console.log("🎯 Alt+Click: Select model", clickedModel.id);
        if (multiSelectedModels.size > 0) {
          clearMultiSelect();
        }
        activeModelInstance = clickedModel;
        if (typeof hideInfo === 'function') hideInfo();
        syncUIFromModel(meta);
        controlsPanel?.classList.remove("hidden");
        return;
      }

      // NORMAL CLICK on model → DO NOT select model, fall through to area/space below
      console.log("📍 Normal click on model area → selecting space/area underneath");
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
          focusOnObject(clickedObject, getSmartZoomLevel(clickedObject));

          return;
        }

        // ============================================
        // NORMAL CLICK: Hiển thị info và zoom IN
        // (Bỏ phần logic tự động set destination cũ để người dùng tự chọn hành động từ bảng thông tin)
        // ============================================

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

          // Zoom IN: Tự động điều chỉnh mức độ Zoom dựa trên diện tích và loại khu vực
          const targetZoom = getSmartZoomLevel(clickedObject);

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

      // Call updateWayfindingUI instead of hideInfo to let it decide whether to show lotus or info
      if (typeof updateWayfindingUI === 'function') updateWayfindingUI();
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
          easing: "ease-in-out",
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
    if (previewBar) {
      previewBar.style.display = "none";
      const dirContent = document.getElementById("directions-tab-content");
      if (dirContent && window.innerWidth <= 768) dirContent.style.paddingBottom = "0px";
    }

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
    // Ẩn chi tiết lộ trình nếu đang mở (mobile)
    const instructionsListEl = document.getElementById("instructions-list");
    if (instructionsListEl) instructionsListEl.classList.remove("show-on-mobile");
    const fullRouteBtn = document.getElementById("mobile-full-route-btn");
    if (fullRouteBtn) fullRouteBtn.classList.remove("expanded");

    animateBlueDotFullPath();

    // Trên mobile, không tự động chạy autoplay mà chờ người dùng nhấn Play

    if (window.innerWidth <= 768) {
      setTimeout(() => {
        if (!isPaused) pauseResumeAnimation();
      }, 50);
    }
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
      const dirContent = document.getElementById("directions-tab-content");
      if (dirContent && window.innerWidth <= 768) dirContent.style.paddingBottom = "55px";
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
          easing: "ease-in-out",
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
          easing: "ease-in-out",
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

  // Lưu bearing và pitch ban đầu để dùng cho nút home
  const initialBearing = mapView.Camera.bearing - 36;
  const initialPitch = mapView.Camera.pitch;

  /**
   * Helper: Thiết lập sự kiện nhấn giữ (Long Press) cho nút bấm
   */
  const setupContinuousClick = (el: HTMLElement, action: (isContinuous: boolean) => void, intervalTime = 100) => {
    let timer: any = null;
    let timeout: any = null;
    let isHolding = false;

    const start = (e: Event) => {
      if (e instanceof MouseEvent && e.button !== 0) return;
      isHolding = true;
      action(false); 
      timeout = setTimeout(() => {
        if (isHolding) {
          timer = setInterval(() => action(true), intervalTime);
        }
      }, 250);
    };

    const stop = () => {
      isHolding = false;
      if (timeout) clearTimeout(timeout);
      if (timer) clearInterval(timer);
      timeout = null;
      timer = null;
    };

    el.addEventListener("mousedown", start);
    window.addEventListener("mouseup", stop);
    el.addEventListener("mouseleave", stop);
    el.addEventListener("touchstart", (e) => {
      if (e.cancelable) e.preventDefault();
      start(e);
    }, { passive: false });
    el.addEventListener("touchend", stop);
    el.addEventListener("touchcancel", stop);
  };


  // Nút lên (Pitch Up) - xoay lên
  const btnUp = document.getElementById("btn-up");
  if (btnUp) {
    setupContinuousClick(btnUp, (isContinuous) => {
      try {
        const currentPitch = mapView.Camera.pitch || 0;
        const step = isContinuous ? 2 : 5;
        cameraAny.animateTo({
          pitch: currentPitch - step,
          bearing: mapView.Camera.bearing,
          zoomLevel: cameraAny.zoomLevel ?? cameraAny.zoom ?? 16.5,
          center: mapView.Camera.center,
        }, {
          duration: isContinuous ? 100 : 300,
          easing: isContinuous ? "linear" : "ease-in-out",
        });
      } catch (e) { console.warn("Error pitch up:", e); }
    });
  }

  // Nút xuống (Pitch Down) - xoay xuống
  const btnDown = document.getElementById("btn-down");
  if (btnDown) {
    setupContinuousClick(btnDown, (isContinuous) => {
      try {
        const currentPitch = mapView.Camera.pitch || 0;
        const step = isContinuous ? 2 : 5;
        cameraAny.animateTo({
          pitch: currentPitch + step,
          bearing: mapView.Camera.bearing,
          zoomLevel: cameraAny.zoomLevel ?? cameraAny.zoom ?? 16.5,
          center: mapView.Camera.center,
        }, {
          duration: isContinuous ? 100 : 300,
          easing: isContinuous ? "linear" : "ease-in-out",
        });
      } catch (e) { console.warn("Error pitch down:", e); }
    });
  }

  // Nút trái (Rotate Left) - xoay trái
  const btnLeft = document.getElementById("btn-left");
  if (btnLeft) {
    setupContinuousClick(btnLeft, (isContinuous) => {
      try {
        const currentBearing = mapView.Camera.bearing || 0;
        const step = isContinuous ? 2 : 5;
        cameraAny.animateTo({
          bearing: currentBearing + step,
          pitch: mapView.Camera.pitch,
          zoomLevel: cameraAny.zoomLevel ?? cameraAny.zoom ?? 16.5,
          center: mapView.Camera.center,
        }, {
          duration: isContinuous ? 100 : 300,
          easing: isContinuous ? "linear" : "ease-in-out",
        });
      } catch (e) { console.warn("Error rotate left:", e); }
    });
  }

  // Nút phải (Rotate Right) - xoay phải
  const btnRight = document.getElementById("btn-right");
  if (btnRight) {
    setupContinuousClick(btnRight, (isContinuous) => {
      try {
        const currentBearing = mapView.Camera.bearing || 0;
        const step = isContinuous ? 2 : 5;
        cameraAny.animateTo({
          bearing: currentBearing - step,
          pitch: mapView.Camera.pitch,
          zoomLevel: cameraAny.zoomLevel ?? cameraAny.zoom ?? 16.5,
          center: mapView.Camera.center,
        }, {
          duration: isContinuous ? 100 : 300,
          easing: isContinuous ? "linear" : "ease-in-out",
        });
      } catch (e) { console.warn("Error rotate right:", e); }
    });
  }

  // Nút Home (Reset) - đưa về trạng thái ban đầu
  const btnReset = document.getElementById("btn-reset");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      try {
        // Chặn auto-floor-switch trong suốt quá trình animation
        (window as any)._isResettingCamera = true;

         cameraAny.animateTo({
          zoomLevel: 16.5, // Zoom về 16.5x
          bearing: initialBearing, // Bearing ban đầu (bearing - 36)
          pitch: initialPitch, // Pitch ban đầu (góc nhìn dọc)
          center: initialVenueCenter || mapView.Camera.center, // Trung tâm ban đầu
        }, {
          duration: 1000,
          easing: "ease-in-out",
        });

        // Nhả cờ sau khi animation hoàn tất + buffer
        setTimeout(() => {
          (window as any)._isResettingCamera = false;
        }, 1200);
      } catch (e) {
        (window as any)._isResettingCamera = false;
        console.warn("Error reset camera:", e);
      }
    });
  }

  // Nút Zoom In (+) - zoom in 0.2x (tối đa 20x)
  // Nút Zoom In (+)
  const btnZoomIn = document.getElementById("btn-zoom-in");
  if (btnZoomIn) {
    setupContinuousClick(btnZoomIn, (isContinuous) => {
      try {
        let currentZoom = getCameraZoom();
        if (currentZoom === null) {
          const cam: any = mapView.Camera as any;
          currentZoom = cam?.zoom ?? cam?.zoomLevel ?? cam?.position?.zoom ?? 16.5;
        }
        const currentZoomValue: number = typeof currentZoom === 'number' ? currentZoom : 16.5;
        const step = isContinuous ? 0.05 : 0.2;
        const targetZoom = Math.min(currentZoomValue + step, 20.0);

        if (targetZoom > currentZoomValue) {
          cameraAny.animateTo({
            zoomLevel: targetZoom,
            bearing: mapView.Camera.bearing,
            pitch: mapView.Camera.pitch,
            center: mapView.Camera.center,
          }, {
            duration: isContinuous ? 100 : 300,
            easing: isContinuous ? "linear" : "ease-in-out",
          });
        }
      } catch (e) { console.warn("Error zoom in:", e); }
    }, 100);
  }

  // Nút Zoom Out (-)
  const btnZoomOut = document.getElementById("btn-zoom-out");
  if (btnZoomOut) {
    setupContinuousClick(btnZoomOut, (isContinuous) => {
      try {
        let currentZoom = getCameraZoom();
        if (currentZoom === null) {
          const cam: any = mapView.Camera as any;
          currentZoom = cam?.zoom ?? cam?.zoomLevel ?? cam?.position?.zoom ?? 16.5;
        }
        const currentZoomValue: number = typeof currentZoom === 'number' ? currentZoom : 16.5;
        const step = isContinuous ? 0.05 : 0.2;
        const targetZoom = Math.max(currentZoomValue - step, 10.0);

        if (targetZoom < currentZoomValue) {
          cameraAny.animateTo({
            zoomLevel: targetZoom,
            bearing: mapView.Camera.bearing,
            pitch: mapView.Camera.pitch,
            center: mapView.Camera.center,
          }, {
            duration: isContinuous ? 100 : 300,
            easing: isContinuous ? "linear" : "ease-in-out",
          });
        }
      } catch (e) { console.warn("Error zoom out:", e); }
    }, 100);
  }

  // Nút Fullscreen
  const btnFullscreen = document.getElementById("btn-fullscreen");
  const iconEnter = document.getElementById("icon-fullscreen-enter");
  const iconExit = document.getElementById("icon-fullscreen-exit");

  if (btnFullscreen) {
    btnFullscreen.addEventListener("click", () => {
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
          });
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      } catch (e) {
        console.warn("Fullscreen toggle error:", e);
      }
    });
  }

  const syncMapAreasToDB = async () => {
    try {
      // Refresh the list of objects to ensure we have everything (doors, connections, objects, spaces)
      const currentMapObjects = getAllMapObjects();

      const areas = currentMapObjects
        .filter((o: any) => o.id)
        .map((o: any) => {
          // Robust FloorID extraction
          let floorId = o.floor?.id || o.floorId;

          // Case 1: Multi-floor objects (Connections/Elevators)
          if (!floorId && o.floors && Array.isArray(o.floors) && o.floors.length > 0) {
            const firstFloor = o.floors[0];
            floorId = typeof firstFloor === 'string' ? firstFloor : (firstFloor.id || firstFloor.mappedinId);
          }

          // Case 2: Coordinate-based floor ID
          if (!floorId && o.coordinate?.floorId) {
            floorId = o.coordinate.floorId;
          }

          // Case 3: Connection coordinates array
          if (!floorId && o.coordinates && Array.isArray(o.coordinates) && o.coordinates.length > 0) {
            floorId = o.coordinates[0].floorId || o.coordinates[0].floor?.id;
          }

          // Case 4: Target floor fallback
          if (!floorId && o.targetFloorId) {
            floorId = o.targetFloorId;
          }

          // Case 5: Connection node specific
          if (!floorId && o.type === 'connection-node' && o.floorId) {
            floorId = o.floorId;
          }

          // Better naming for objects/doors/connections
          let name = o.name || o.customName || "";
          if (!name) {
            const type = String(o.type || "").toLowerCase();
            if (type === 'door') name = `Cửa (${o.id.substring(0, 6)})`;
            else if (type === 'connection' || type === 'elevator') name = `Thang máy (${o.id.substring(0, 6)})`;
            else if (type === 'escalator') name = `Thang cuốn (${o.id.substring(0, 6)})`;
            else if (type === 'stair') name = `Cầu thang (${o.id.substring(0, 6)})`;
            else if (type === 'object') name = `Vật thể (${o.id.substring(0, 6)})`;
            else name = o.id;
          }

          return {
            id: o.id,
            name: name,
            floorId: floorId || null
          };
        });

      console.info(`🔄 [SYNC] Auto-syncing ${areas.length} items (including doors/objects) to database...`);
      const result = await ApiService.syncAreas(areas);
      console.info("✅ [SYNC] Database updated successfully.", result);
    } catch (e) {
      console.warn("❌ [SYNC] Error syncing map areas:", e);
    }
  };

  const updateFullscreenIcons = () => {
    if (document.fullscreenElement) {
      if (iconEnter) iconEnter.style.display = 'none';
      if (iconExit) iconExit.style.display = 'block';
    } else {
      if (iconEnter) iconEnter.style.display = 'block';
      if (iconExit) iconExit.style.display = 'none';
    }
  };

  document.addEventListener('fullscreenchange', updateFullscreenIcons);




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

  // ModelMetadata moved to top level



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

    async syncOverviewFloor(overviewFloorId: string) {
      try {
        const res = await fetch(`${API_BASE_URL}/models/sync-overview-floor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ overviewFloorId })
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.error || "Failed to sync overview floor");
        }

        return await res.json();
      } catch (err) {
        console.error("API Overview Sync Error:", err);
        return null;
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
  // --- ĐỒNG BỘ DỮ LIỆU FLOOR ID VÀO DATABASE ---
  // Mẹo: Chỉ chạy đồng bộ khi bạn thêm "?sync=true" vào URL (Ví dụ: http://localhost:3000?sync=true)
  // Điều này giúp máy load cực nhanh khi sử dụng bình thường mà vẫn đảm bảo đồng bộ khi cần.
  if (window.location.search.includes("sync=true")) {
    console.log("🔄 Đang chạy chế độ đồng bộ dữ liệu (Sync Mode)...");
    syncMapAreasToDB();
  }


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
    if (isViewOnly) return;

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
      // Fallback: look up coordinate from registry metadata if not on instance
      const meta = MODEL_ID_REGISTRY.get(modelInstance.id);
      const coord = (modelInstance as any).originalCoordinate || (modelInstance as any).coordinate || meta?.originalCoordinate;
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
      let finalUrl = modelAssetMap[m.url] || resolveUrl(m.url);
      if (!finalUrl) return;

      // 3. CHỐNG CACHE FILE LỖI
      const cacheBustedUrl = finalUrl.startsWith("data:") ? finalUrl : `${finalUrl}?v=${Date.now()}`;

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
    // Bỏ qua khi đang reset camera (Home) hoặc chuyển tầng để tránh lag
    if ((window as any)._isResettingCamera || isGlobalSwitchingFloor) return;
    const currentFloor = mapView.currentFloor;
    if (!currentFloor) return;

    const floorName = (currentFloor.name || "").toLowerCase();
    const focalPoint = (mapView.Camera as any).center;
    if (!focalPoint) return;

    const currentZoom = getCameraZoom() || 0;

    // THIẾT LẬP NGƯỠNG (Điều chỉnh Unload 18.5 theo yêu cầu)
    const {
      load: ZOOM_LOAD_THRESHOLD,
      unload: ZOOM_UNLOAD_THRESHOLD,
      loadRadius: LOAD_RADIUS,
      unloadRadius: UNLOAD_RADIUS
    } = getModelStreamingZoomThresholds(isMobile);
    const MAX_CONCURRENT_MODELS = 200;

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
      const isVerticalOnLowerFloor = lowerFloorIds.has(meta.floorId || "") && isThang(meta);
      const isPersistentOnLowerFloor = lowerFloorIds.has(meta.floorId || "") && isPersistentLowerFloorModel(meta);
      const keepAcrossLowerFloors = isVerticalOnLowerFloor || isPersistentOnLowerFloor;

      // LOGIC XÓA MẠNH TAY:
      const shouldUnloadDueToZoom = currentZoom < ZOOM_UNLOAD_THRESHOLD && !isThang(meta) && !isPersistentLowerFloorModel(meta);
      const shouldUnloadDueToDist = !isThang(meta) && !isPersistentLowerFloorModel(meta) && dist > UNLOAD_RADIUS;

      if (!isCurrentFloor && !keepAcrossLowerFloors || shouldUnloadDueToZoom || shouldUnloadDueToDist) {
        try { mapView.Models.remove(instance); MODEL_INSTANCE_REGISTRY.delete(uuid); } catch (e) { }
      }
    }

    // 2. LỌC DANH SÁCH TIỀM NĂNG
    const candidateModels = _allModelMetadata.filter((m: any) => {
      // Allow all models to show in both admin and viewer modes as per request
      const isCurrent = m.floorId === currentFloor.id;
      const isVerticalOnLowerFloor = lowerFloorIds.has(m.floorId || "") && isThang(m);
      const isPersistentOnLowerFloor = lowerFloorIds.has(m.floorId || "") && isPersistentLowerFloorModel(m);
      return isCurrent || isVerticalOnLowerFloor || isPersistentOnLowerFloor;
    });

    const modelsToLoad: any[] = [];
    candidateModels.forEach((m: any) => {
      const isVertical = isThang(m);
      const isPersistent = isPersistentLowerFloorModel(m);
      const dist = calculateDistance(focalPoint, { latitude: Number(m.latitude), longitude: Number(m.longitude) });
      const isLoaded = MODEL_INSTANCE_REGISTRY.has(m.uuid);

      // Thang luôn load (bất chấp zoom/distance), model khác thì theo luật
      const shouldLoad = isVertical || isPersistent || (currentZoom >= ZOOM_LOAD_THRESHOLD && dist <= LOAD_RADIUS);

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
        await new Promise(r => setTimeout(r, 20));
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

      if (!_hasSyncedOverviewModelFloor && overviewFloor?.id) {
        await ApiService.syncOverviewFloor(overviewFloor.id);
        _hasSyncedOverviewModelFloor = true;
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

        // Resolve URL (Sử dụng hàm resolveUrl mới)
        const shadowUrl = resolveUrl((instance as any).url || meta.url);

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

      const thumbSrc = thumbName ? resolveUrl(`Model3D/thumbnail/${thumbName}`) : "";

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
        const previewUrl = resolveUrl(placingModelConfig.file || placingModelConfig.url);

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
    markSidebarInteraction();
    if (isCategoryDebugEnabled()) console.groupCollapsed(`🧭 [CATEGORY_DEBUG] highlightCategory cat=${catId}`);
    if (isCategoryDebugEnabled()) console.debug("Before category click:", {
      catId,
      currentFloorId: mapView.currentFloor?.id,
      currentFloorName: mapView.currentFloor?.name,
      isOverviewMode: isMapInOverview(),
      activeCategoryId,
      activeSubCategoryId,
      categoryTreeCount: categoryTree.length
    });

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
    if (!cat) {
      if (isCategoryDebugEnabled()) console.warn("⚠️ [CATEGORY_DEBUG] Category not found in tree", { catId });
      if (isCategoryDebugEnabled()) console.groupEnd();
      return;
    }
    if (isCategoryDebugEnabled()) console.debug("Resolved category:", {
      id: cat.id,
      name: cat.vn || cat.en || cat.id,
      subcategoryCount: cat.subcategories?.length || 0,
      subcategories: (cat.subcategories || []).map((sub: any) => ({
        id: sub.id,
        name: sub.vn || sub.en || sub.id
      }))
    });

    // Auto-select if only 1 subcategory
    if (cat.subcategories && cat.subcategories.length === 1) {
      // Ensure 'Active' class on the main grid updates
      if (typeof renderActiveCategoryGrid === 'function') renderActiveCategoryGrid();

      (window as any).highlightSubCategory(cat.subcategories[0].id);
      if (isCategoryDebugEnabled()) console.groupEnd();
      return;
    }

    // Just render subcategories (Navigation only)
    renderCategories(catId);

    // Also update main grid to show active state
    if (typeof renderActiveCategoryGrid === 'function') renderActiveCategoryGrid();
    if (isCategoryDebugEnabled()) console.groupEnd();
  };

  // New function to handle subcategory clicks and highlighting
  (window as any).highlightSubCategory = async (subCatId: string) => {
    markSidebarInteraction();
    if (isCategoryDebugEnabled()) console.groupCollapsed(`🧭 [CATEGORY_DEBUG] highlightSubCategory sub=${subCatId}`);
    if (isCategoryDebugEnabled()) console.debug("Before subcategory click:", {
      subCatId,
      activeCategoryId,
      activeSubCategoryId,
      selectedFloorIds: getCurrentFloorFilterIds(),
      currentFloorName: mapView.currentFloor?.name,
      isOverviewMode: isMapInOverview()
    });

    // TOGGLE LOGIC: If same subCategory, turn off highlights
    if (activeSubCategoryId === subCatId.toString()) {
      activeSubCategoryId = null;
      clearSearchMarkers();
      if (currentSearchResults.length > 0) {
        currentSearchResults.forEach((obj: any) => resetObjectHighlight(obj));
        currentSearchResults = [];
      }
      renderCategories(activeCategoryId); // Re-render to update active state
      console.log("Toggled subcategory off", { subCatId });
      if (isCategoryDebugEnabled()) console.groupEnd();
      return;
    }

    activeSubCategoryId = subCatId;

    // Clear existing highlights before applying new ones
    clearSearchMarkers();
    if (currentSearchResults.length > 0) {
      currentSearchResults.forEach((o: any) => { try { resetObjectHighlight(o); } catch (e) { } });
      currentSearchResults = [];
    }

    const mapObjectsById = new Map<string, any>();
    allMapObjects.forEach((obj: any) => {
      if (obj?.id) mapObjectsById.set(obj.id, obj);
    });
    const isOverviewMode = isMapInOverview();
    const selectedFloorIds = isOverviewMode ? null : getCurrentFloorFilterIds();
    const { locationRows: locs, areaEntries } = await getSubCategoryAreaEntries(
      subCatId,
      selectedFloorIds,
      isOverviewMode,
      mapObjectsById
    );
    const allMatchedMIDs = locs.map((l: any) => l.MappedinID).filter(Boolean);
    const highlightedMIDs = areaEntries.map((entry: any) => entry.mappedinId);
    const objectsToHighlight = areaEntries.map((entry: any) => entry.mapObject).filter(Boolean);
    const missingMapObjects = allMatchedMIDs.filter((mid: string) => !mapObjectsById.has(mid));
    if (isCategoryDebugEnabled()) console.debug("Resolved subcategory data:", {
      subCatId,
      selectedFloorIds,
      countBeforeFloorFilter: locs.length,
      countAfterFloorFilter: areaEntries.length,
      matchedMIDsCount: allMatchedMIDs.length,
      objectsToHighlightCount: objectsToHighlight.length,
      missingMapObjectsCount: missingMapObjects.length,
      highlightedMIDs,
      rows: locs.slice(0, 30).map((loc: any) => ({
        mappedinId: loc.MappedinID,
        subCategoryId: loc.SubCategoryID,
        floorId: loc.FloorID || null,
        vn: loc.VN || loc.Name || null
      }))
    });
    if (isCategoryDebugEnabled() && missingMapObjects.length > 0) {
      console.warn("⚠️ [CATEGORY_DEBUG] Assigned rows missing from allMapObjects", {
        subCatId,
        missingMapObjects: missingMapObjects.slice(0, 30)
      });
    }

    // OVERWRITE NAMES WITH DB DATA (Fix: Update TranslationManager directly to avoid read-only error)
    objectsToHighlight.forEach((obj: any) => {
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
        TranslationManager.data.locations[obj.id] = {
          ...(TranslationManager.data.locations[obj.id] || {}),
          names
        };

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
        isProgrammaticZoom = true;
        mapView.Camera.focusOn(objectsToHighlight, {
          duration: 1000,
          minZoomLevel: 16.5,
          maxZoomLevel: 16.5
        } as any);
        setTimeout(() => { isProgrammaticZoom = false; }, 1500);
      } else {
        console.log(`📌 Highlighted ${objectsToHighlight.length} objects for subcategory ${subCatId} (No Zoom in Overview)`);
      }
    } else if (isCategoryDebugEnabled()) {
      console.warn("⚠️ [CATEGORY_DEBUG] No map objects found for clicked subcategory", {
        subCatId,
        matchedMIDs: allMatchedMIDs.slice(0, 30)
      });
    }
    renderCategories(activeCategoryId); // Re-render to update active state
    if (isCategoryDebugEnabled()) console.groupEnd();
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

  // 14. FLIGHT INFO UI
  const initFlightInfoUI = () => {
    const modal = document.getElementById('flight-info-modal') as HTMLDivElement | null;
    const flightBtn = document.getElementById('btn-open-flight-info') as HTMLButtonElement | null;
    if (!modal || !flightBtn) {
      return;
    }

    // HELPER: Find object by Mappedin ID (Scoped to initFlightInfoUI but uses parent mapData)
    const findObjectByMappedinId = (id: string | null | undefined) => {
      if (!id || !allMapObjects) return null;
      return allMapObjects.find((obj: any) => obj.id === id || obj.mappedinId === id);
    };

    // HELPER: Build message when navigation is blocked by flight status
    const buildNavigationUnavailableMessage = (statusLabel: string) => {
      const template = TranslationManager.t('nav_blocked_by_status', 'Tính năng dẫn đường tạm khóa do trạng thái: {status}');
      return template.replace('{status}', statusLabel);
    };

    const closeBtn = modal.querySelector('#btn-close-flight-info') as HTMLButtonElement | null;
    const closeFooterBtn = modal.querySelector('#btn-close-flight-info-footer') as HTMLButtonElement | null;
    const departureTab = modal.querySelector('#flight-tab-departure') as HTMLButtonElement | null;
    const arrivalTab = modal.querySelector('#flight-tab-arrival') as HTMLButtonElement | null;
    const dateInput = modal.querySelector('#flight-date-input') as HTMLInputElement | null;
    const dateText = modal.querySelector('#flight-date-text') as HTMLSpanElement | null;
    const dateDisplay = modal.querySelector('#flight-date-display') as HTMLButtonElement | null;
    const searchInput = modal.querySelector('#flight-search-input') as HTMLInputElement | null;
    const statusFilter = modal.querySelector('#flight-status-filter') as HTMLSelectElement | null;
    const summary = modal.querySelector('#flight-list-summary') as HTMLDivElement | null;
    const loading = modal.querySelector('#flight-list-loading') as HTMLDivElement | null;
    const empty = modal.querySelector('#flight-list-empty') as HTMLDivElement | null;
    const error = modal.querySelector('#flight-list-error') as HTMLDivElement | null;
    const container = modal.querySelector('#flight-list-container') as HTMLDivElement | null;

    if (!closeBtn || !closeFooterBtn || !departureTab || !arrivalTab || !dateInput || !dateText || !dateDisplay || !searchInput || !statusFilter || !summary || !loading || !empty || !error || !container) {
      return;
    }

    type FlightRecord = {
      FlightId: number;
      FlightNo: string;
      FlightDate: string;
      ArrDep: 'A' | 'D';
      Route?: string | null;
      Airline?: string | null;
      Status?: string | null;
      ScheduledTime?: string | null;
      EstimatedTime?: string | null;
      ActualTime?: string | null;
      Gate?: number | null;
      CheckInIsland?: string | null;
      CheckInCounterSpec?: string | null;
      Belt?: number | null;
      Gate_MappedinID?: string | null;
      Belt_MappedinID?: string | null;
      PrimaryCheckIn_MappedinID?: string | null;
      HasCheckInMapping?: boolean;
      HasGateNavigation?: boolean;
      HasBeltNavigation?: boolean;
    };

    type FlightNavigationCounter = {
      FlightId: number;
      CheckInIsland: string;
      CounterNo: number;
      CheckIn_MappedinID?: string | null;
    };

    type FlightNavigationPayload = {
      flight: (FlightRecord & {
        Gate_MappedinID?: string | null;
        Belt_MappedinID?: string | null;
        HasGateNavigation?: boolean;
        HasBeltNavigation?: boolean;
        HasCheckInMapping?: boolean;
      }) | null;
      counters: FlightNavigationCounter[];
    };

    const state = {
      mode: 'D' as 'A' | 'D',
      date: dateInput.value || (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })(),
      search: '',
      status: 'ALL',
      flights: [] as FlightRecord[]
    };

    let currentCalendarDate = new Date(state.date);

    const generateCalendarDays = (year: number, month: number) => {
      const firstDay = new Date(year, month, 1).getDay();
      const lastDate = new Date(year, month + 1, 0).getDate();

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const selectedStr = state.date;

      // Calculate valid range: Today and previous 7 days
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const minDate = new Date(todayMidnight);
      minDate.setDate(todayMidnight.getDate() - 7);

      let html = '';
      // Empty slots before first day of month
      for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
      }
      // Actual days
      for (let d = 1; d <= lastDate; d++) {
        const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        const currentDate = new Date(year, month, d);
        const isValidDate = currentDate >= minDate && currentDate <= todayMidnight;

        const classes = ['calendar-day'];
        if (!isValidDate) classes.push('disabled');
        if (fullDate === todayStr) classes.push('today');
        if (fullDate === selectedStr && isValidDate) classes.push('active');

        if (isValidDate) {
          html += `<div class="${classes.join(' ')}" data-date="${fullDate}">${d}</div>`;
        } else {
          // Disable clicking by omitting data-date and apply inline styling for visual lock
          html += `<div class="${classes.join(' ')}" style="opacity: 0.3; cursor: not-allowed;">${d}</div>`;
        }
      }
      return html;
    };

    const renderCalendar = () => {
      let calendarDropdown = modal.querySelector('.calendar-dropdown') as HTMLDivElement | null;
      if (!calendarDropdown) {
        calendarDropdown = document.createElement('div');
        calendarDropdown.className = 'calendar-dropdown hidden';
        dateDisplay.parentElement?.appendChild(calendarDropdown);
      }

      const year = currentCalendarDate.getFullYear();
      const month = currentCalendarDate.getMonth();
      const monthLabel = TranslationManager.t(`month_${month + 1}`, String(month + 1));

      calendarDropdown.innerHTML = `
        <div class="calendar-header">
          <button class="calendar-nav-btn prev" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div class="calendar-title">${monthLabel} ${year}</div>
          <button class="calendar-nav-btn next" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
        <div class="calendar-grid">
          ${[0, 1, 2, 3, 4, 5, 6].map(d => `<div class="calendar-day-label">${TranslationManager.t(`day_${d}`)}</div>`).join('')}
          ${generateCalendarDays(year, month)}
        </div>
        <div class="calendar-footer">
          <button class="calendar-today-btn" type="button">${TranslationManager.t('today_label', 'Hôm nay')}</button>
        </div>
      `;

      // Calendar Navigation
      calendarDropdown.querySelector('.prev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
      });
      calendarDropdown.querySelector('.next')?.addEventListener('click', (e) => {
        e.stopPropagation();
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
      });

      // Today Selection
      calendarDropdown.querySelector('.calendar-today-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const today = new Date();
        state.date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        updateDateText();
        calendarDropdown?.classList.add('hidden');
        void loadFlights();
      });

      // Day Selection
      calendarDropdown.querySelectorAll('.calendar-day:not(.empty)').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const dayStr = (el as HTMLElement).getAttribute('data-date');
          if (dayStr) {
            state.date = dayStr;
            updateDateText();
            calendarDropdown?.classList.add('hidden');
            void loadFlights();
          }
        });
      });
    };

    const flightApiBaseUrl = getApiBaseUrl();

    const getDepartureStatusOptions = (): Array<[string, string]> => [
      ['ALL', TranslationManager.t('flight_status_all', 'Tất cả trạng thái')],
      ['LAST_CALL', TranslationManager.t('LAST_CALL', 'Hành khách cuối lên tàu bay đi')],
      ['CHECKIN_OPEN', TranslationManager.t('CHECKIN_OPEN', 'Đang làm thủ tục')],
      ['BOARDING', TranslationManager.t('BOARDING', 'Đang lên máy bay')],
      ['DELAYED', TranslationManager.t('DELAYED', 'Chậm / trễ')],
      ['CLOSED', TranslationManager.t('CLOSED', 'Đóng quầy')],
      ['DEPARTED', TranslationManager.t('DEPARTED', 'Đã cất cánh')],
      ['CANCELLED', TranslationManager.t('CANCELLED', 'Hủy chuyến')]
    ];

    const getArrivalStatusOptions = (): Array<[string, string]> => [
      ['ALL', TranslationManager.t('flight_status_all', 'Tất cả trạng thái')],
      ['LANDED', TranslationManager.t('LANDED', 'Đã hạ cánh')],
      ['BAGGAGE_LOADING', TranslationManager.t('BAGGAGE_LOADING', 'Đang trả hành lý')],
      ['BAGGAGE_DONE', TranslationManager.t('BAGGAGE_DONE', 'Trả xong hành lý')],
      ['DELAYED', TranslationManager.t('DELAYED', 'Chậm chuyến')],
      ['CANCELLED', TranslationManager.t('CANCELLED', 'Hủy chuyến')]
    ];

    const formatTimeValue = (value?: string | null) => {
      if (!value) return '-';
      const text = String(value);
      return text.length >= 16 && text[10] === 'T' ? text.slice(11, 16) : text.slice(0, 5);
    };

    const updateDateText = () => {
      dateInput.value = state.date;
      const parts = state.date.split('-');
      if (parts.length === 3) {
        // We stick to DD/MM/YYYY as requested but ensure it's updated
        dateText.textContent = `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else {
        dateText.textContent = state.date;
      }
    };

    const updateTabState = () => {
      departureTab.classList.toggle('active', state.mode === 'D');
      arrivalTab.classList.toggle('active', state.mode === 'A');
    };

    const renderStatusOptions = () => {
      const optionData = state.mode === 'D' ? getDepartureStatusOptions() : getArrivalStatusOptions();
      const selectedValue = optionData.some(([value]) => value === state.status) ? state.status : 'ALL';
      statusFilter.innerHTML = '';
      optionData.forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        option.selected = value === selectedValue;
        statusFilter.appendChild(option);
      });
      state.status = selectedValue;
    };

    const updateSummary = (count: number) => {
      const label = TranslationManager.t('flights_found', 'chuyến bay');
      summary.textContent = state.mode === 'D'
        ? `${TranslationManager.t('flight_departure', 'Chuyến bay đi')} (${count} ${label})`
        : `${TranslationManager.t('flight_arrival', 'Chuyến bay đến')} (${count} ${label})`;
    };

    const canonicalizeStatusStrict = (flight: FlightRecord) => {
      const raw = String(flight.Status || '').trim().toUpperCase();
      if (flight.ArrDep === 'D') {
        if (raw === 'CHECKIN_OPEN') return { key: raw, label: TranslationManager.t(raw, 'Đang làm thủ tục'), tone: 'positive', canNavigateGate: Boolean(flight.Gate_MappedinID), canNavigateCheckin: Boolean(flight.HasCheckInMapping), navigationBlockedByStatus: false };
        if (raw === 'BOARDING') return { key: raw, label: TranslationManager.t(raw, 'Đang lên máy bay'), tone: 'warning', canNavigateGate: false, canNavigateCheckin: false, navigationBlockedByStatus: true };
        if (raw === 'DELAYED') return { key: raw, label: TranslationManager.t(raw, 'Chậm / trễ'), tone: 'warning', canNavigateGate: Boolean(flight.Gate_MappedinID), canNavigateCheckin: Boolean(flight.HasCheckInMapping), navigationBlockedByStatus: false };
        if (raw === 'CLOSED') return { key: raw, label: TranslationManager.t(raw, 'Đóng quầy'), tone: 'warning', canNavigateGate: false, canNavigateCheckin: false, navigationBlockedByStatus: true };
        if (raw === 'DEPARTED') return { key: raw, label: TranslationManager.t(raw, 'Đã cất cánh'), tone: 'danger', canNavigateGate: false, canNavigateCheckin: false, navigationBlockedByStatus: true };
        if (raw === 'CANCELLED') return { key: raw, label: TranslationManager.t(raw, 'Hủy chuyến'), tone: 'danger', canNavigateGate: false, canNavigateCheckin: false, navigationBlockedByStatus: true };
        if (raw === 'LAST_CALL' || raw === 'SCHEDULED') return { key: 'LAST_CALL', label: TranslationManager.t('LAST_CALL', 'Hành khách cuối lên tàu bay đi'), tone: 'warning', canNavigateGate: Boolean(flight.Gate_MappedinID), canNavigateCheckin: Boolean(flight.HasCheckInMapping), navigationBlockedByStatus: false };
        // Fallback to key if no match
        return { key: raw, label: TranslationManager.t(raw, raw), tone: 'warning', canNavigateGate: Boolean(flight.Gate_MappedinID), canNavigateCheckin: Boolean(flight.HasCheckInMapping), navigationBlockedByStatus: false };
      }
      if (raw === 'CANCELLED') return { key: raw, label: TranslationManager.t(raw, 'Hủy chuyến'), tone: 'danger', canNavigateBelt: false, navigationBlockedByStatus: true };
      if (raw === 'DELAYED') return { key: raw, label: TranslationManager.t(raw, 'Chậm chuyến'), tone: 'warning', canNavigateBelt: false, navigationBlockedByStatus: true };

      if (raw === 'LANDED') return { key: raw, label: TranslationManager.t(raw, 'Đã hạ cánh'), tone: 'positive', canNavigateBelt: Boolean(flight.Belt_MappedinID), navigationBlockedByStatus: false };
      if (raw === 'BAGGAGE_LOADING') return { key: raw, label: TranslationManager.t(raw, 'Đang trả hành lý'), tone: 'positive', canNavigateBelt: Boolean(flight.Belt_MappedinID), navigationBlockedByStatus: false };
      if (raw === 'BAGGAGE_DONE') return { key: raw, label: TranslationManager.t(raw, 'Trả xong hành lý'), tone: 'danger', canNavigateBelt: false, navigationBlockedByStatus: true };

      // Fallback to key if no match
      return { key: raw, label: TranslationManager.t(raw, raw), tone: 'warning', canNavigateBelt: Boolean(flight.Belt_MappedinID), navigationBlockedByStatus: false };
    };

    const canonicalizeStatusUi = (flight: FlightRecord) => {
      const meta = canonicalizeStatusStrict(flight) as any;
      if (flight.ArrDep === 'D' && !meta.navigationBlockedByStatus) {
        return { ...meta, canNavigateGate: true, canNavigateCheckin: true };
      }
      if (flight.ArrDep === 'A' && !meta.navigationBlockedByStatus) {
        return { ...meta, canNavigateBelt: true };
      }
      return meta;
    };

    const getNavigationDataIssues = (flight: FlightRecord) => {
      const issues: string[] = [];
      if (flight.ArrDep === 'D') {
        if (!flight.Gate) issues.push(TranslationManager.t('issue_missing_gate', 'Chuyến bay chưa có dữ liệu gate.'));
        else if (!flight.Gate_MappedinID && !flight.HasGateNavigation) issues.push(TranslationManager.t('issue_no_gate_mapping', 'Chưa cấu hình mapping gate cho chuyến bay này.'));

        if (!flight.CheckInIsland || !flight.CheckInCounterSpec) issues.push(TranslationManager.t('issue_missing_checkin', 'Chuyến bay chưa có dữ liệu check-in.'));
        else if (!flight.HasCheckInMapping) issues.push(TranslationManager.t('issue_no_checkin_mapping', 'Chưa cấu hình mapping check-in cho chuyến bay này.'));
      } else {
        if (!flight.Belt) issues.push(TranslationManager.t('issue_missing_belt', 'Chuyến bay chưa có dữ liệu băng chuyền.'));
        else if (!flight.Belt_MappedinID && !flight.HasBeltNavigation) issues.push(TranslationManager.t('issue_no_belt_mapping', 'Chưa cấu hình mapping băng chuyền cho chuyến bay này.'));
      }
      return issues;
    };

    const resolveGateObjectStrict = (flight: FlightRecord) => findObjectByMappedinId(flight.Gate_MappedinID);
    const resolveBeltObjectStrict = (flight: FlightRecord) => findObjectByMappedinId(flight.Belt_MappedinID);
    const resolveCheckInObjectsStrict = (counters: FlightNavigationCounter[]) =>
      counters.map((counter) => findObjectByMappedinId(counter.CheckIn_MappedinID)).filter(Boolean);

    const switchToDirectionsTab = () => {
      const tabDirections = document.getElementById('tab-directions') as HTMLElement | null;
      tabDirections?.click();
    };

    const openInfoForObject = async (obj: any, zoomLevel: number = 20) => {
      if (!obj) return;

      // Space có .floor.id, Location có .floorId
      const targetFloorId = obj.floorId || (obj.floor && obj.floor.id) || (obj.coordinate && obj.coordinate.floorId);
      if (targetFloorId) {
        const isCurrentlyOverview = isMapInOverview();
        if (isCurrentlyOverview || (mapView.currentFloor && mapView.currentFloor.id !== targetFloorId)) {
          console.log(`✈️ Switching floor for Flight Object: ${targetFloorId} (From Overview: ${isCurrentlyOverview})`);
          await performFloorSwitch(targetFloorId, "Flight UI Interaction");
          // Small delay to ensure SDK state is stable before camera focus
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      focusOnObject(obj, zoomLevel);
      if (typeof updateInfo === 'function') updateInfo(obj);
    };

    const routeBetweenObjects = async (originObj: any, destinationObj: any) => {
      if (!originObj || !destinationObj) return false;
      wayfindingOrigin = originObj;
      wayfindingDestination = destinationObj;
      wayfindingStopovers = [];
      updateWayfindingUI();
      updateHighlights();
      switchToDirectionsTab();
      await drawNavigation();

      // Auto-focus on origin to start the journey
      await openInfoForObject(originObj);
      return true;
    };

    const navigateToDestinationFromCurrentContext = async (destinationObj: any) => {
      if (!destinationObj) return false;
      wayfindingDestination = destinationObj;
      wayfindingStopovers = [];
      updateWayfindingUI();
      updateHighlights();
      switchToDirectionsTab();
      if (wayfindingOrigin) await drawNavigation();
      else await openInfoForObject(destinationObj);
      return true;
    };

    const fetchNavigationTargets = async (flightId: number): Promise<FlightNavigationPayload> => {
      const response = await fetch(`${flightApiBaseUrl}/flights/${flightId}/navigation-targets`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || TranslationManager.t('error_nav_data', 'Không lấy được dữ liệu điều hướng chuyến bay'));
      }
      return response.json();
    };

    const showFlightMessage = (message: string) => {
      error.textContent = message;
      error.classList.remove('hidden');
    };

    const renderFlights = () => {
      const filteredFlights = state.flights.filter((flight) => {
        const meta = canonicalizeStatusUi(flight);
        return state.status === 'ALL' || meta.key === state.status;
      });

      updateSummary(filteredFlights.length);
      container.innerHTML = '';
      loading.classList.add('hidden');
      error.classList.add('hidden');
      empty.classList.toggle('hidden', filteredFlights.length > 0);
      container.classList.toggle('hidden', filteredFlights.length === 0);

      filteredFlights.forEach((flight) => {
        const meta = canonicalizeStatusUi(flight);
        const tags: string[] = [];

        // GATE TAG
        if (flight.Gate) {
          const gateObj = resolveGateObjectStrict(flight);
          const gateLabel = gateObj ? TranslationManager.getName(gateObj) : `${TranslationManager.t('flight_gate_tag', 'Cửa')} ${flight.Gate}`;
          tags.push(`<span class="flight-card-tag gate">${gateLabel}</span>`);
        }

        // CHECK-IN TAG
        if (flight.CheckInIsland && flight.CheckInCounterSpec) {
          const islandLabel = TranslationManager.t('flight_checkin_tag', 'Đảo');
          const counterLabel = TranslationManager.t('flight_counter_tag', 'Quầy');
          tags.push(`<span class="flight-card-tag checkin">${islandLabel} ${flight.CheckInIsland} - ${counterLabel} ${flight.CheckInCounterSpec}</span>`);
        }

        // BELT TAG
        if (flight.Belt) {
          const beltObj = resolveBeltObjectStrict(flight);
          const beltLabel = beltObj ? TranslationManager.getName(beltObj) : `${TranslationManager.t('flight_belt_tag', 'Băng chuyền')} ${flight.Belt}`;
          tags.push(`<span class="flight-card-tag belt">${beltLabel}</span>`);
        }

        const showNavigationActions = shouldRenderFlightNavigationActions(meta);
        const departureActions = showNavigationActions ? `
          <div class="flight-card-actions">
            <button class="flight-card-action primary" data-action="checkin" data-flight-id="${flight.FlightId}" ${meta.canNavigateCheckin ? '' : 'disabled'}>${TranslationManager.t('go_to_checkin', 'Đến check-in')}</button>
            <button class="flight-card-action primary" data-action="gate" data-flight-id="${flight.FlightId}" ${meta.canNavigateGate ? '' : 'disabled'}>${TranslationManager.t('go_to_gate', 'Đến gate')}</button>
            <button class="flight-card-action accent" data-action="route" data-flight-id="${flight.FlightId}" ${(meta.canNavigateGate && meta.canNavigateCheckin) ? '' : 'disabled'}>${TranslationManager.t('find_route', 'Tìm đường')}</button>
          </div>
        ` : '';

        const arrivalActions = showNavigationActions ? `
          <div class="flight-card-actions flight-card-actions--arrival">
            <button class="flight-card-action primary" data-action="belt" data-flight-id="${flight.FlightId}" ${meta.canNavigateBelt ? '' : 'disabled'}>${TranslationManager.t('go_to_belt', 'Đến băng chuyền')}</button>
          </div>
        ` : '';

        const statusBlockedMessage = meta.navigationBlockedByStatus
          ? `<div class="flight-card-message">${buildNavigationUnavailableMessage(meta.label)}</div>`
          : '';
        const navigationIssues = getNavigationDataIssues(flight);
        const mappingMessage = (!meta.navigationBlockedByStatus && navigationIssues.length > 0)
          ? `<div class="flight-card-message">${navigationIssues.join(' ')}</div>`
          : '';

        const card = document.createElement('article');
        card.className = `flight-card status-${meta.tone}`;
        card.innerHTML = `
          <div class="flight-card-header">
            <div>
              <div class="flight-card-title-wrap">
                <div class="flight-card-title">${flight.FlightNo}</div>
                <div class="flight-card-route">${flight.Route || 'N/A'}</div>
              </div>
              ${flight.Airline ? `<div class="flight-card-subhead">${flight.Airline}</div>` : ''}
            </div>
            <div class="flight-card-status-badge status-${meta.tone}">${meta.label}</div>
          </div>
          <div class="flight-card-times">
            <div class="flight-time-block"><div class="flight-time-label">${state.mode === 'D' ? TranslationManager.t('SOBT', 'SOBT') : TranslationManager.t('STA', 'STA')}</div><div class="flight-time-value">${formatTimeValue(flight.ScheduledTime)}</div></div>
            <div class="flight-time-block"><div class="flight-time-label">${state.mode === 'D' ? TranslationManager.t('ETOT', 'ETOT') : TranslationManager.t('ETA', 'ETA')}</div><div class="flight-time-value">${formatTimeValue(flight.EstimatedTime)}</div></div>
            <div class="flight-time-block"><div class="flight-time-label">${state.mode === 'D' ? TranslationManager.t('ATOT', 'ATOT') : TranslationManager.t('ALDT', 'ALDT')}</div><div class="flight-time-value">${formatTimeValue(flight.ActualTime)}</div></div>
          </div>
          <div class="flight-card-tags">${tags.join('')}</div>
          ${state.mode === 'D' ? departureActions : arrivalActions}
          ${statusBlockedMessage}
          ${mappingMessage}
        `;

        card.querySelectorAll('[data-action]').forEach((button) => {
          button.addEventListener('click', async () => {
            const action = (button as HTMLElement).getAttribute('data-action');
            const flightId = Number((button as HTMLElement).getAttribute('data-flight-id'));
            if (!action || !Number.isFinite(flightId)) return;
            try {
              error.classList.add('hidden');
              error.textContent = '';
              const payload = await fetchNavigationTargets(flightId);
              if (!payload.flight) throw new Error(TranslationManager.t('error_flight_not_found', 'Không tìm thấy dữ liệu chuyến bay'));
              if (action === 'gate') {
                if (!payload.flight.Gate) throw new Error(TranslationManager.t('issue_missing_gate', 'Chuyến bay chưa có dữ liệu gate.'));
                if (!payload.flight.Gate_MappedinID && !payload.flight.HasGateNavigation) throw new Error(TranslationManager.t('issue_no_gate_mapping', 'Chưa cấu hình mapping gate cho chuyến bay này.'));
                const gateObject = resolveGateObjectStrict(payload.flight);
                if (!gateObject) throw new Error(TranslationManager.t('error_gate_not_found', 'Không tìm thấy gate trên bản đồ'));
                await navigateToDestinationFromCurrentContext(gateObject);
                await openInfoForObject(gateObject);
                closeModal();
                return;
              }
              if (action === 'checkin') {
                if (!payload.flight.CheckInIsland || !payload.flight.CheckInCounterSpec) throw new Error(TranslationManager.t('issue_missing_checkin', 'Chuyến bay chưa có dữ liệu check-in.'));
                if (!payload.flight.HasCheckInMapping) throw new Error(TranslationManager.t('issue_no_checkin_mapping', 'Chưa cấu hình mapping check-in cho chuyến bay này.'));
                const checkinObject = resolveCheckInObjectsStrict(payload.counters || [])[0];
                if (!checkinObject) throw new Error(TranslationManager.t('error_checkin_not_found', 'Không tìm thấy check-in trên bản đồ'));
                await navigateToDestinationFromCurrentContext(checkinObject);
                await openInfoForObject(checkinObject);
                closeModal();
                return;
              }
              if (action === 'route') {
                if (!payload.flight.Gate) throw new Error(TranslationManager.t('issue_missing_gate', 'Chuyến bay chưa có dữ liệu gate.'));
                if (!payload.flight.CheckInIsland || !payload.flight.CheckInCounterSpec) throw new Error(TranslationManager.t('issue_missing_checkin', 'Chuyến bay chưa có dữ liệu check-in.'));
                if (!payload.flight.Gate_MappedinID && !payload.flight.HasGateNavigation) throw new Error(TranslationManager.t('issue_no_gate_mapping', 'Chưa cấu hình mapping gate cho chuyến bay này.'));
                if (!payload.flight.HasCheckInMapping) throw new Error(TranslationManager.t('issue_no_checkin_mapping', 'Chưa cấu hình mapping check-in cho chuyến bay này.'));
                const gateObject = resolveGateObjectStrict(payload.flight);
                const checkinObject = resolveCheckInObjectsStrict(payload.counters || [])[0];
                if (!gateObject || !checkinObject) throw new Error(TranslationManager.t('error_missing_route_points', 'Thiếu gate hoặc check-in để tạo đường đi'));
                await routeBetweenObjects(checkinObject, gateObject);
                closeModal();
                return;
              }
              if (action === 'belt') {
                if (!payload.flight.Belt) throw new Error(TranslationManager.t('issue_missing_belt', 'Chuyến bay chưa có dữ liệu băng chuyền.'));
                if (!payload.flight.Belt_MappedinID && !payload.flight.HasBeltNavigation) throw new Error(TranslationManager.t('issue_no_belt_mapping', 'Chưa cấu hình mapping băng chuyền cho chuyến bay này.'));
                const beltObject = resolveBeltObjectStrict(payload.flight);
                if (!beltObject) throw new Error(TranslationManager.t('error_belt_not_found', 'Không tìm thấy băng chuyền trên bản đồ'));
                await navigateToDestinationFromCurrentContext(beltObject);
                await openInfoForObject(beltObject);
                closeModal();
              }
            } catch (err: any) {
              console.error('[FlightInfo] action failed:', err);
              showFlightMessage(err?.message || TranslationManager.t('error_flight_action', 'Không thực hiện được thao tác chuyến bay'));
            }
          });
        });

        container.appendChild(card);
      });
    };

    const loadFlights = async () => {
      loading.classList.remove('hidden');
      error.classList.add('hidden');
      empty.classList.add('hidden');
      container.classList.add('hidden');
      try {
        const params = new URLSearchParams();
        params.set('date', state.date);
        params.set('arrDep', state.mode);
        if (state.search.trim()) params.set('search', state.search.trim());
        const response = await fetch(`${flightApiBaseUrl}/flights?${params.toString()}`);
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || TranslationManager.t('error_load_flights', 'Không tải được danh sách chuyến bay'));
        }
        state.flights = await response.json();
        renderStatusOptions();
        renderFlights();
      } catch (err: any) {
        container.innerHTML = '';
        loading.classList.add('hidden');
        empty.classList.add('hidden');
        container.classList.add('hidden');
        error.textContent = err?.message || TranslationManager.t('error_load_flights', 'Không tải được dữ liệu chuyến bay');
        error.classList.remove('hidden');
      }
    };

    const openModal = () => {
      modal.classList.remove('hidden');
      updateTabState();
      updateDateText();
      renderStatusOptions();
      void loadFlights();
    };

    const closeModal = () => {
      modal.classList.add('hidden');
    };

    const setMode = (mode: 'A' | 'D') => {
      if (state.mode === mode) return;
      state.mode = mode;
      state.status = 'ALL';
      updateTabState();
      renderStatusOptions();
      void loadFlights();
    };

    let searchTimer: ReturnType<typeof setTimeout> | null = null;
    updateDateText();
    renderStatusOptions();

    flightBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    closeFooterBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal();
    });
    departureTab.addEventListener('click', () => setMode('D'));
    arrivalTab.addEventListener('click', () => setMode('A'));
    dateDisplay.addEventListener('click', (e) => {
      e.stopPropagation();
      const calendarDropdown = modal.querySelector('.calendar-dropdown') as HTMLDivElement | null;
      if (calendarDropdown && !calendarDropdown.classList.contains('hidden')) {
        calendarDropdown.classList.add('hidden');
      } else {
        // Reset calendar view to currently selected date
        currentCalendarDate = new Date(state.date);
        renderCalendar();
        modal.querySelector('.calendar-dropdown')?.classList.remove('hidden');
      }
    });

    // Close calendar on outside click
    document.addEventListener('click', (e) => {
      const calendarDropdown = modal.querySelector('.calendar-dropdown') as HTMLDivElement | null;
      if (calendarDropdown && !calendarDropdown.contains(e.target as Node) && !dateDisplay.contains(e.target as Node)) {
        calendarDropdown.classList.add('hidden');
      }
    });
    dateInput.addEventListener('change', () => {
      state.date = dateInput.value || state.date;
      updateDateText();
      void loadFlights();
    });
    searchInput.addEventListener('input', () => {
      state.search = searchInput.value || '';
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => void loadFlights(), 250);
    });
    statusFilter.addEventListener('change', () => {
      state.status = statusFilter.value || 'ALL';
      renderFlights();
    });

    // Listen for language changes to refresh the modal UI
    window.addEventListener('language-change', () => {
      if (!modal.classList.contains('hidden')) {
        updateDateText();
        renderStatusOptions();
        renderFlights();

        // Also re-render calendar if it's open to update localized headers/days
        const calendarDropdown = modal.querySelector('.calendar-dropdown') as HTMLDivElement | null;
        if (calendarDropdown && !calendarDropdown.classList.contains('hidden')) {
          renderCalendar();
        }
      }
    });
  };

  // 15. INIT ADMIN UI
  try {
    (window as any).globalMapView = mapView;
    (window as any).globalMapData = mapData;
    initAdminUI(allMapObjects);
    initAreaColorUI(allMapObjects, mapView, mapData);
    initFlightInfoUI();

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
      await fetch(`${getApiBaseUrl()}/sync-locations`, {
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

    // Sort objects by name (Natural Sort)
    items.sort((a: any, b: any) => a.name!.localeCompare(b.name!, undefined, { numeric: true, sensitivity: 'base' }));

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
          const apiBase = getApiBaseUrl();
          const res = await fetch(`${apiBase}/translate`, {
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

    // Premium Metadata
    (document.getElementById('phone-global') as HTMLInputElement).value = locData?.phone || "";
    (document.getElementById('hours-global') as HTMLInputElement).value = locData?.openingHours || "";

    (document.getElementById('detail-vi') as HTMLInputElement).value = locData?.locationDetail?.vn || "";
    (document.getElementById('detail-en') as HTMLInputElement).value = locData?.locationDetail?.en || "";
    (document.getElementById('detail-zh') as HTMLInputElement).value = locData?.locationDetail?.zh || "";
    (document.getElementById('detail-ja') as HTMLInputElement).value = locData?.locationDetail?.ja || "";
    (document.getElementById('detail-ko') as HTMLInputElement).value = locData?.locationDetail?.ko || "";

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
        const apiBase = getApiBaseUrl();
        const apiOrigin = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;

        const res = await fetch(`${apiOrigin}/api/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, filename: file.name })
        });
        const data = await res.json();
        if (data.url) {
          // Robust URL handling: ensure the URL uses the same host user is currently on
          let finalUrl = data.url;
          if ((finalUrl.includes('localhost:3002') || finalUrl.includes('127.0.0.1:3002')) && !window.location.hostname.includes('localhost')) {
            const apiBase = getApiBaseUrl();
            const apiOrigin = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
            finalUrl = finalUrl.replace(/http:\/\/(localhost|127\.0\.0\.1):3002/g, apiOrigin);
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
        mappedinImageUrl: currentMappedinImg,
        phone: (document.getElementById('phone-global') as HTMLInputElement).value,
        openingHours: (document.getElementById('hours-global') as HTMLInputElement).value,
        detail_vn: (document.getElementById('detail-vi') as HTMLInputElement).value,
        detail_en: (document.getElementById('detail-en') as HTMLInputElement).value,
        detail_zh: (document.getElementById('detail-zh') as HTMLInputElement).value,
        detail_ja: (document.getElementById('detail-ja') as HTMLInputElement).value,
        detail_ko: (document.getElementById('detail-ko') as HTMLInputElement).value
      };

      try {
        const apiBase = getApiBaseUrl();
        const apiOrigin = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;

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
// init(); // Removed duplicate call

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
  const areaColorShapes = new Map<string, any>();
  const apiBaseUrl = getApiBaseUrl();

  if (!modal || !btnOpen || !listContainer) return;

  const getNamedColorableObjects = () => {
    const isNamedObject = (obj: any) =>
      obj?.name &&
      obj.name.trim() !== '' &&
      !obj.name.toLowerCase().includes("khu vá»±c khÃ´ng tÃªn");

    const spaces = (mapData.getByType('space') || []).filter(isNamedObject);
    const areas = (mapData.getByType('area') || []).filter(isNamedObject);
    const mergedObjects = new Map<string, any>();

    spaces.forEach((obj: any) => {
      if (obj?.id) mergedObjects.set(obj.id, obj);
    });
    areas.forEach((obj: any) => {
      if (obj?.id && !mergedObjects.has(obj.id)) mergedObjects.set(obj.id, obj);
    });

    return Array.from(mergedObjects.values());
  };

  const syncAreaColorOverlays = () => {
    const overlayAltitude = 0.05;
    const areas = (mapData.getByType('area') || []).filter((area: any) => area?.name && area.name.trim() !== '');
    const customColors = getServerAreaColors();
    const activeAreaIds = new Set<string>();

    areas.forEach((area: any) => {
      const color = customColors[area.id];
      if (!color) return;

      activeAreaIds.add(area.id);
      const geometry = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { id: area.id, name: area.name },
            geometry: area.geoJSON.geometry
          }
        ]
      };

      const existingShape = areaColorShapes.get(area.id);
      if (existingShape) {
        try {
          mapView.updateState(existingShape, {
            color,
            opacity: 0.95,
            visible: true,
            altitude: overlayAltitude,
            outline: false
          });
          return;
        } catch (e) {
          try { mapView.Shapes.remove(existingShape); } catch (removeErr) { }
          areaColorShapes.delete(area.id);
        }
      }

      try {
        const shape = mapView.Shapes.add(geometry as any, {
          color,
          opacity: 0.95,
          interactive: false,
          altitude: overlayAltitude,
          outline: false
        } as any, area.floor);
        if (shape) {
          areaColorShapes.set(area.id, shape);
        }
      } catch (e) {
        console.error("Error creating area color overlay", area.id, e);
      }
    });

    Array.from(areaColorShapes.entries()).forEach(([areaId, shape]) => {
      if (activeAreaIds.has(areaId)) return;
      try { mapView.Shapes.remove(shape); } catch (e) { }
      areaColorShapes.delete(areaId);
    });
  };

  const applyAreaColorsToMap = () => {
    syncAreaColorOverlays();
    if (typeof (window as any).refreshMapColors === 'function') {
      (window as any).refreshMapColors();
    }
  };

  const setAreaColorsOnServer = async (areaIds: string[], color: string) => {
    const response = await fetch(`${apiBaseUrl}/area-colors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ areaIds, color })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || 'Không thể lưu màu khu vực');
    }
    setServerAreaColors(data.areaColors || {});
  };

  const clearAreaColorsOnServer = async (areaIds: string[]) => {
    const response = await fetch(`${apiBaseUrl}/area-colors`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ areaIds })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || 'Không thể xóa màu khu vực');
    }
    setServerAreaColors(data.areaColors || {});
  };

  const migrateLegacyLocalAreaColorsToServer = async () => {
    if (isViewOnly) return;
    if (localStorage.getItem(AREA_COLOR_MIGRATION_FLAG_KEY) === '1') return;

    const localColors = safeParseAreaColorMap(localStorage.getItem(AREA_COLOR_LOCAL_STORAGE_KEY));
    const serverColors = getServerAreaColors();
    const colorsToMigrate = new Map<string, string[]>();

    Object.entries(localColors).forEach(([areaId, rawColor]) => {
      const normalizedColor = normalizeAreaHexColor(rawColor);
      if (!normalizedColor) return;
      if (getAreaColorOverride(areaId)) return;

      const bucket = colorsToMigrate.get(normalizedColor) || [];
      bucket.push(areaId);
      colorsToMigrate.set(normalizedColor, bucket);
    });

    if (Object.keys(serverColors).length > 0 && colorsToMigrate.size === 0) {
      localStorage.setItem(AREA_COLOR_MIGRATION_FLAG_KEY, '1');
      return;
    }

    if (colorsToMigrate.size === 0) return;

    for (const [color, areaIds] of colorsToMigrate.entries()) {
      await setAreaColorsOnServer(areaIds, color);
    }

    localStorage.setItem(AREA_COLOR_MIGRATION_FLAG_KEY, '1');
    applyAreaColorsToMap();
  };

  // Render checkbox list
  const renderList = (filter = "") => {
    let spaces = getNamedColorableObjects();

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

    items.sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    const term = filter.toLowerCase();
    const visibleItems = items.filter((i: any) => {
      const name = i.name.toLowerCase();
      return name.includes(term) || removeVietnameseTones(name).includes(removeVietnameseTones(term));
    });

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
            const singleId = Array.from(selectedAreaIds)[0];
            const singleObj = spaces.find((s: any) => s.id === singleId);
            const currentColor = getAreaColorOverride(singleId) || (singleObj?.name ? "#FFFFFF" : "#eeece7");
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
    syncAreaColorOverlays();
    renderList();
  });

  btnClose?.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Apply colors
  btnApply?.addEventListener("click", async () => {
    if (selectedAreaIds.size === 0) {
      alert("Vui lòng chọn ít nhất một khu vực!");
      return;
    }
    const color = normalizeAreaHexColor(colorHex.value);
    if (!color) {
      alert("MÃ u khÃ´ng há»£p lá»‡. Vui lÃ²ng nháº­p Ä‘á»‹nh dáº¡ng #RRGGBB.");
      return;
    }
    const spaces = getNamedColorableObjects();
    let count = 0;

    for (const space of spaces) {
      if (selectedAreaIds.has(space.id)) {
        if (space?.__type === 'area') {
          count++;
          continue;
        }
        try {
          mapView.updateState(space, { color: color });
          count++;
        } catch (e) { console.error("Error setting color", e); }
      }
    }
    try {
      await setAreaColorsOnServer(Array.from(selectedAreaIds), color);
    } catch (error: any) {
      alert(error?.message || "KhÃ´ng thá»ƒ lÆ°u mÃ u khu vá»±c lÃªn server");
      return;
    }
    applyAreaColorsToMap();
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
  btnClear?.addEventListener("click", async () => {
    if (selectedAreaIds.size === 0) {
      alert("Vui lòng chọn ít nhất một khu vực!");
      return;
    }
    const spaces = getNamedColorableObjects();
    let count = 0;

    for (const space of spaces) {
      if (selectedAreaIds.has(space.id)) {
        if (space?.__type === 'area') {
          count++;
          continue;
        }
        try {
          const defaultColor = space.name ? "#FFFFFF" : "#eeece7";
          mapView.updateState(space, { color: defaultColor });
          count++;
        } catch (e) { }
      }
    }
    try {
      await clearAreaColorsOnServer(Array.from(selectedAreaIds));
    } catch (error: any) {
      alert(error?.message || "KhÃ´ng thá»ƒ xÃ³a mÃ u khu vá»±c trÃªn server");
      return;
    }
    applyAreaColorsToMap();
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
      const currentColor = getAreaColorOverride(space.id) || (space.name ? "#FFFFFF" : "#eeece7");
      colorPicker.value = currentColor;
      colorHex.value = currentColor;
    } catch (e) { }

    renderList(searchInput.value);
  };

  syncAreaColorOverlays();
  void migrateLegacyLocalAreaColorsToServer().catch((error) => {
    console.warn('Area color migration skipped:', error);
  });
}

// Custom Speed Dropdown logic
const speedDisplay = document.getElementById("speed-selected-display") as HTMLElement | null;
const speedMenu = document.getElementById("speed-options-menu") as HTMLElement | null;
const speedValueText = document.getElementById("speed-value-text") as HTMLElement | null;
const speedItems = document.querySelectorAll(".speed-item");

if (speedDisplay && speedMenu) {
  speedDisplay.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = speedMenu.style.display === "block";
    speedMenu.style.display = isOpen ? "none" : "block";
    speedDisplay.style.borderColor = isOpen ? "#e9ecef" : "#214ca6";
  });

  document.addEventListener("click", () => {
    if (speedMenu) speedMenu.style.display = "none";
    if (speedDisplay) speedDisplay.style.borderColor = "#e9ecef";
  });

  speedItems.forEach(item => {
    item.addEventListener("click", () => {
      const value = (item as HTMLElement).dataset.value;
      const text = (item as HTMLElement).textContent;
      if (value && speedValueText && text) {
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

init().catch(err => {
  console.error("❌ Critical initialization error:", err);
});
