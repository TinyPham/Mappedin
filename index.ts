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

      // Check URL for lang prefix or query param
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const langParam = params.get('lang');
      const validLangs = this.data.languages?.map((l: any) => (l.LanguageId || "").toLowerCase()) || ['vn', 'en'];

      const langSegment = (path.split('/')[1] || "").toLowerCase();

      if (langParam && validLangs.includes(langParam.toLowerCase())) {
        this.currentLang = langParam.toLowerCase();
      } else if (validLangs.includes(langSegment)) {
        this.currentLang = langSegment;
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

      // Apply initial translations
      this.applyTranslations();

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
        el.textContent = this.t(key);
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
    'step_by_step': {
      'vn': 'Hướng dẫn từng bước:',
      'en': 'Step-by-step instructions:',
      'zh': '逐步说明:',
      'ja': 'ステップバイステップの手順:',
      'ko': '단계별 지침:'
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
    'action_exit_connection': {
      'vn': 'Ra khỏi',
      'en': 'Exit from',
      'zh': '退出',
      'ja': '出る',
      'ko': '나가기'
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
    const locData = this.data.locations?.[id];
    // Support new object structure { names: { vn, en... } }
    if (locData?.names?.[this.currentLang]) {
      return locData.names[this.currentLang];
    }
    // Support string fallback (if any)
    if (typeof locData === 'string') return locData;

    // 4. Fallback to object's original name
    return obj.name || '';
  }


  // Get Rich Content (Desc, Image, etc)
  static getLocationContent(id: string) {
    return this.data.locations?.[id] || null;
  }

  // NEW: Get Localized Description
  static getLocationDescription(id: string): string {
    const locData = this.getLocationContent(id);
    if (!locData) return "";

    // Check for localized descriptions object (from AreaInformation)
    if (locData.descriptions && locData.descriptions[this.currentLang]) {
      return locData.descriptions[this.currentLang];
    }

    // Fallback to legacy description field if exists
    if (locData.description) {
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
    } catch (e) { console.warn("Failed to refresh some UI components", e); }
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

  // Declarations for hoisting/scope visibility
  let categoryTree: any[] = [];
  let ApiService: any = null;
  let hideInfo: any = null;
  let updateInfo: any = null;

  // Placement Globals
  let placingModelConfig: any = null;
  let placingMode: 'new' | 'copy' | 'move' = 'new';
  let sourceModelData: any = null;
  let sourceModelMappedinId: string | null = null;
  let activeModelInstance: any = null;
  let placingPreviewModel: any = null;
  let isAddingPreview = false; // Lock for async model addition



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
      // CRITICAL: Preload ALL floors so see-through/atrium areas work immediately
      // Without this, floors only load geometry when visited - causing missing see-through
      preloadFloors: allFloors,
    }
  );

  // Expose mapView globally for easier debugging and access from console
  (window as any).mapView = mapView;

  // ============================================
  // PRELOAD ALL FLOORS: Force SDK to load geometry for see-through/atrium
  // Uses updateState to load geometry WITHOUT switching floors (invisible to user)
  // ============================================
  try {
    for (const floor of allFloors) {
      try {
        mapView.updateState(floor, { geometry: { visible: true } } as any);
      } catch (e) { /* some floors may not support this */ }
    }
    console.log(`✅ All ${allFloors.length} floors geometry set to visible for see-through support.`);
  } catch (e) {
    console.warn("Could not preload floor geometry:", e);
  }

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
  inputScaleX = document.getElementById("scale-x") as HTMLInputElement;
  inputScaleY = document.getElementById("scale-y") as HTMLInputElement;
  inputScaleZ = document.getElementById("scale-z") as HTMLInputElement;
  inpModelPublic = document.getElementById("inp-model-public") as HTMLInputElement;


  // HIDE DEFAULT LABELS: Use our custom markers instead (with square avatar style)
  try {
    (mapView.Labels as any).all.forEach((l: any) => l.hide());
  } catch (e) {
    console.warn("Could not hide default labels", e);
  }

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
      const cam: any = (mapView as any).Camera || (mapView as any).camera;
      const z = cam?.zoom ?? cam?.position?.zoom ?? cam?.camera?.zoom ?? cam?.state?.zoom ?? null;
      return typeof z === "number" ? z : null;
    } catch {
      return null;
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
      if (!searchInput.contains(e.target as Node) && !searchResults.contains(e.target as Node)) {
        searchResults.style.display = "none";
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

      // 2. Filter and group objects by name
      const groupedResults = new Map<string, { primaryObject: any; objects: any[] }>();
      const isOverview = isMapInOverview();
      const currentFloorId = mapView.currentFloor?.id;

      allMapObjects.forEach((obj) => {
        const localizedName = TranslationManager.getName(obj);
        if (localizedName && smartMatch(query, localizedName)) {
          const objFloorId = obj.floor?.id || obj.floorId || (typeof obj.floor === 'string' ? obj.floor : null);

          // Filter by floor or show all if in Overview
          if (isOverview || (currentFloorId && objFloorId === currentFloorId)) {
            if (!groupedResults.has(localizedName)) {
              groupedResults.set(localizedName, { primaryObject: obj, objects: [] });
            }
            groupedResults.get(localizedName)!.objects.push(obj);
          }
        }
      });

      const uniqueResults = Array.from(groupedResults.entries())
        .slice(0, 15) // Show slightly more results
        .map(([name, data]) => ({
          name,
          objects: data.objects,
          primaryObject: data.primaryObject
        }));

      if (uniqueResults.length === 0 && matchedCategories.length === 0 && matchedSubCategories.length === 0) {
        searchResults.innerHTML = `<div class="search-result-item" style="cursor:default;">${TranslationManager.t('no_results_found', 'Không tìm thấy kết quả')}</div>`;
        searchResults.style.display = "block";
        clearSearchMarkers();
        return;
      }

      searchResults.innerHTML = "";

      // Render Location Results
      uniqueResults.forEach((result) => {
        const item = document.createElement("div");
        item.className = "search-result-item";

        // Clean name: Remove "room", "door", "gate" (case insensitive) as requested
        const cleanName = result.name.replace(/room|door|gate/gi, '').trim();

        const name = document.createElement("div");
        name.className = "search-result-name";
        name.textContent = cleanName;

        const category = document.createElement("div");
        category.className = "search-result-category";

        const floorObj = result.primaryObject.floor;
        const floorName = floorObj ? TranslationManager.getFloorName(floorObj.mappedinId || floorObj.id || floorObj.code, floorObj.name) : "";
        const count = result.objects.length;

        // Formatting: Only Floor + Count (localized)
        const locCountLabel = TranslationManager.t('locations_count', 'vị trí');
        category.textContent = `${floorName}${count > 1 ? ` • ${count} ${locCountLabel}` : ""}`;

        item.appendChild(name);
        item.appendChild(category);

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
              const selector = document.getElementById("floor-selector") as HTMLSelectElement;
              if (selector) selector.value = floorId;
              await mapView.setFloor(floorId);
            } catch (e) {
              console.warn("Error switching floor:", e);
            }
          }

          setTimeout(() => {
            highlightObjects(result.objects, "📍");
          }, 300);
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
      // Resolve object đầy đủ từ mapData (vì obj có thể là stub như Hp2)
      const obj = resolveObjectById(objStub?.id) || objStub;

      // Chỉ render objects có name (theo yêu cầu: marker sẽ là name của object)
      if (!obj.name) return;

      // Lọc theo floor nếu có
      if (currentFloorId) {
        const objFloorId = obj.floor?.id || obj.floorId;
        if (objFloorId && objFloorId !== currentFloorId) {
          return;
        }
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
          const label = obj.name;
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
              <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
                <div style="width:34px;height:34px;background:#fff;border-radius:4px;padding:2px;box-shadow:0 3px 6px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;border:1px solid rgba(0,0,0,0.05);overflow:hidden;">
                  <img src="${activeIconUrl}" alt="${label}" onerror="${onerrorStr}" style="width:100%;height:100%;object-fit:cover;" />
                </div>
                <div style="font-size:11px;line-height:12px;background:rgba(255,255,255,0.95);padding:2px 8px;border-radius:4px;color:#111;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.15);font-weight:600;border:1px solid rgba(0,0,0,0.05);">
                  ${label}
                </div>
              </div>
            `;
          } else {
            // Không có image → dùng box icon 📦
            markerHtml = `
              <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
                <div style="background:rgba(255,255,255,0.92);border-radius:999px;padding:4px;box-shadow:0 1px 4px rgba(0,0,0,0.18);display:flex;align-items:center;justify-content:center;">
                  <div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:20px;">
                    ${boxIconFallback}
                  </div>
                </div>
                <div style="font-size:11px;line-height:11px;background:rgba(255,255,255,0.92);padding:2px 6px;border-radius:999px;color:#111;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.18);">
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
  const DEFAULT_CONNECTION_MARKER_MIN_ZOOM = 0.1;
  if ((window as any).CONNECTION_MARKER_MIN_ZOOM == null) {
    (window as any).CONNECTION_MARKER_MIN_ZOOM = DEFAULT_CONNECTION_MARKER_MIN_ZOOM;
  }

  // getCameraZoom đã được định nghĩa ở trên (sau khi mapView được tạo)

  let connectionMarkersVisible = false;
  let lastConnectionZoomBucket: number | null = null;

  /**
   * Tạo HTML cho connection marker (icon + label, scale theo zoom)
   */
  const getConnectionMarkerHtml = (icon: string, text: string, zoom: number | null) => {
    const z = zoom ?? DEFAULT_CONNECTION_MARKER_MIN_ZOOM;
    const threshold = (window as any).CONNECTION_MARKER_MIN_ZOOM ?? DEFAULT_CONNECTION_MARKER_MIN_ZOOM;
    const labelOffset: number = (window as any).CONNECTION_LABEL_ZOOM_OFFSET ?? 0.15;
    const maxScale: number = (window as any).CONNECTION_ICON_MAX_SCALE ?? 3.0;

    // Icon scale theo zoom
    const scale = Math.max(1, Math.min(1 + (z - threshold) * 1.0, maxScale));
    const size = Math.round(24 * scale);

    // Hiện label khi zoom đủ gần
    const alwaysShowLabel: boolean = (window as any).CONNECTION_SHOW_LABEL_ALWAYS ?? true;
    const showLabel = alwaysShowLabel ? true : z >= threshold + labelOffset;

    return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
      <div style="background:rgba(255,255,255,0.92);border-radius:999px;padding:4px;box-shadow:0 1px 4px rgba(0,0,0,0.18);display:flex;align-items:center;justify-content:center;">
        <img src="${icon}" alt="${text}" style="width:${size}px;height:${size}px;object-fit:contain;" />
      </div>
      ${showLabel
        ? `<div style="font-size:11px;line-height:11px;background:rgba(255,255,255,0.92);padding:2px 6px;border-radius:999px;color:#111;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.18);">
              ${text}
            </div>`
        : ""
      }
    </div>`;
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
            getConnectionMarkerHtml(icon, text, currentZoom),
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
  // Helper: Get base color for an object based on its name keywords
  const getObjectBaseStyle = (obj: any) => {
    const name = (obj.name || "").toLowerCase();

    let bgColor = "#FFFFFF"; // Default to White

    // User Request: Only color specific areas (Public vs Restricted)
    // Multilingual support for coloring
    const isPublicName = name.includes("công cộng") || name.includes("public") ||
      name.includes("公共") || name.includes("공공");
    const isRestrictedName = name.includes("hạn chế") || name.includes("nhân viên") || name.includes("viên") ||
      name.includes("restricted") || name.includes("staff") ||
      name.includes("禁区") || name.includes("制限") || name.includes("禁") ||
      name.includes("スタッフ") || name.includes("직원") ||
      name.includes("立ち入り禁止");

    if (isPublicName) {
      bgColor = "#FFF176"; // Saturated Yellow for Public Area
    } else if (isRestrictedName) {
      bgColor = "#FFCDD2"; // Saturated Red for Restricted/Staff Area
    }

    return {
      color: obj.name ? bgColor : "#eeece7", // Non-named areas stay gray
      hoverColor: obj.name ? (bgColor === "#FFF176" ? "#FFEE58" : (bgColor === "#FFCDD2" ? "#EF9A9A" : "#FFF7CC")) : "#eeece7"
    };
  };

  /**
   * 8. SETUP INTERACTIVE STATES & AREA COLORING
   */
  const applyAreaColors = () => {
    allMapObjects.forEach((obj) => {
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
      const isSelected = currentSearchResults.some(s => s.id === obj.id);
      const isWayfindingPoint = obj.id === (window as any).wayfindingOrigin?.id || obj.id === (window as any).wayfindingDestination?.id;

      let style = getObjectBaseStyle(obj);

      // WAYFINDING PRIORITY: If it's a wayfinding point, always highlight green
      if (isWayfindingPoint) {
        style.color = "#4CAF50";
      }
      // SEARCH PRIORITY: If selected by search, use tinted base or green
      else if (isSelected) {
        if (style.color === "#FFF176") style.color = "#FBC02D"; // Darker Yellow for selection
        else if (style.color === "#FFCDD2") style.color = "#EF9A9A"; // Darker Red for selection
        else style.color = "#4CAF50"; // Default selection green
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

  // Set interactive cho locations có name
  try {
    const mapDataAny = mapData as any;
    if (mapDataAny.locations && Array.isArray(mapDataAny.locations)) {
      mapDataAny.locations.forEach((location: any) => {
        if (location.name) {
          try {
            // Locations có name → màu trắng
            mapView.updateState(location, {
              interactive: true,
              color: "#FFFFFF",
              hoverColor: updateObjectHoverColor(location), // Sử dụng hàm để set hover color đúng
            });
          } catch (e) { }
        } else {
          // Locations không có name → màu xám
          try {
            mapView.updateState(location, {
              interactive: true,
              color: "#eeece7",
              hoverColor: "#eeece7", // Không có hover cho khu vực không có tên
            });
          } catch (e) { }
        }
      });
    }
  } catch (e) { }

  // Hàm để update hover color dựa trên trạng thái wayfinding
  // Định nghĩa sớm để dùng trong các phần khác
  const updateObjectHoverColor = (obj: any) => {
    // Nếu đã có wayfinding (origin và destination), không cho hover vàng vào objects không có name
    if (wayfindingOrigin && wayfindingDestination) {
      // Chỉ cho hover vàng nếu object có name, không có name thì hover xám
      return obj.name ? "#FFFACD" : "#eeece7"; // Không có hover cho khu vực không có tên
    } else {
      // Logic cũ: cho hover vàng nếu có name, không có name thì hover xám
      return obj.name ? "#FFFACD" : "#eeece7"; // Không có hover cho khu vực không có tên
    }
  };

  // Set interactive cho elevators và stairways
  allElevators.forEach((elev: any) => {
    try {
      // Màu xám cho khu vực không có tên, trắng cho khu vực có tên
      const defaultColor = elev.name ? "#FFFFFF" : "#eeece7";
      mapView.updateState(elev, {
        interactive: true,
        color: defaultColor,
        hoverColor: updateObjectHoverColor(elev),
      });
    } catch (e) { }
  });

  allStairways.forEach((stair: any) => {
    try {
      // Màu xám cho khu vực không có tên, trắng cho khu vực có tên
      const defaultColor = stair.name ? "#FFFFFF" : "#eeece7";
      mapView.updateState(stair, {
        interactive: true,
        color: defaultColor,
        hoverColor: updateObjectHoverColor(stair),
      });
    } catch (e) { }
  });

  // ============================================
  // 9. HOVER HANDLER
  // ============================================
  let selectedSpace: any = null;

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
              <div style="width:34px;height:34px;background:#fff;border-radius:4px;padding:2px;box-shadow:0 3px 6px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;border:1px solid rgba(0,0,0,0.05);overflow:hidden;">
                <img src="${activeIconUrl}" alt="${name}" onerror="${onerrorStr}" style="width:100%;height:100%;object-fit:cover;" />
              </div>
              <div style="font-size:11px;line-height:12px;background:rgba(255,255,255,0.95);padding:2px 8px;border-radius:4px;color:#111;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.15);font-weight:600;border:1px solid rgba(0,0,0,0.05);">
                ${name}
              </div>
            </div>`;
          } else {
            const firstLetter = name.charAt(0).toUpperCase();
            markerHtml = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
              <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:14px;">
                ${firstLetter}
              </div>
              <div style="font-size:11px;line-height:11px;background:rgba(255,255,255,0.95);padding:2px 6px;border-radius:999px;color:#111;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.2);font-weight:500;">
                ${name}
              </div>
            </div>`;
          }

          const marker = mapView.Markers.add(obj, markerHtml, { interactive: true } as any);

          currentLocationMarkers.push(marker); // Track it

          const markerId = (marker as any)?.id;
          if (markerId) {
            markerIdToObject.set(markerId, obj);
          }
        } catch (e) {
          console.warn("Error adding marker for object:", name, e);
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
      <div id="main-airport-label" style="display:flex;flex-direction:column;align-items:center;gap:2px;transition:opacity 0.2s;">
        <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,0.4);background:#fff;display:flex;align-items:center;justify-content:center;">
          <img src="${airplaneIconUrl}" alt="${mapName}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        <div style="font-size:12px;line-height:12px;background:rgba(255,255,255,0.98);padding:4px 8px;border-radius:999px;color:#111;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25);font-weight:600;max-width:250px;text-align:center;">
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

  // Add listener for camera changes to handle zoom visibility
  mapView.on('camera-change', () => {
    // Only check if we are on Overview, as marker is only shown on Overview
    const isOverview = mapData.getByType("floor").find((f: any) =>
      f.name?.toLowerCase().includes("overview") ||
      f.name?.toLowerCase().includes("tổng quan")
    )?.id === mapView.currentFloor?.id;

    if (isOverview) {
      checkZoomVisibility();
    }
  });

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
      // Cập nhật visibility của UI controls (ví hạn ẩn nút thêm model/phân loại khi ở overview)
      updateUIVisibility();

      // NEW: Create shadow copies of Overview models on this floor
      // Small delay to ensure floor render completes before adding shadows
      if (typeof (window as any).syncModelInstancesVisibility === 'function') {
        setTimeout(() => {
          (window as any).syncModelInstancesVisibility();
        }, 300);
      }

      // AUTO-REHIGHLIGHT: If a subcategory is active, re-pin locations on this floor
      if (activeSubCategoryId) {
        reapplyActiveSubCategoryPins();
      }
    } catch { }
  });

  floorSelector.value = mapView.currentFloor.id;

  floorSelector.addEventListener("change", async (e) => {
    const floorId = (e.target as HTMLSelectElement)?.value;
    if (!floorId) return;

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
      // Cập nhật dropdown thủ công để đảm bảo đồng bộ
      floorSelector.value = floorId;

      // CRITICAL: Sync state variables
      if (isOverview) {
        isInOverview = true;
        // Don't update lastActiveFloorId when going to Overview
      } else {
        isInOverview = false;
        lastActiveFloorId = floorId; // Save as last active floor
      }
    } catch (err) {
      _isWarmupSwitch = false; // Safety reset
      console.warn("Error setting floor:", err);
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
    if (objectsToHighlight.length > 0) {
      mapView.Camera.focusOn(objectsToHighlight, { pitch: 45, duration: 1000, minZoomLevel: 17 });
    }
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
      return cat[lang] || cat.vn || '';
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
      backBtn.className = "category-item back-item";
      backBtn.style.gridColumn = "1 / -1";
      backBtn.innerHTML = `
            <div class="category-icon-box">⬅️</div>
            <div class="category-label-box">${TranslationManager.t('back_btn', 'Quay lại')}</div>
        `;
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
          categoryList.innerHTML += `<div style="grid-column: 1/-1; padding:20px; text-align:center; color:#999;">${TranslationManager.t('no_categories_for_floor', 'Không có danh mục cho tầng này')}</div>`;
        }

        activeSubs.forEach((sub: any) => {
          const item = document.createElement("div");
          item.className = "category-item sub-item";
          if (activeSubCategoryId === sub.id.toString()) item.classList.add('active');

          // Subcategory Item Styling
          item.style.width = "100%";
          item.style.boxSizing = "border-box";

          const subName = getCategoryName(sub);

          if (activeSubCategoryId === sub.id.toString()) {
            // ACTIVE STATE: Centered Header WITH ICON (User Request: visible white text)
            item.style.justifyContent = "center";
            item.style.backgroundColor = "#085ebb"; // Dark blue background for white text contrast
            item.style.boxShadow = "none";
            item.style.border = "none";
            item.style.borderBottom = "2px solid #003d82";
            item.style.borderRadius = "0";
            item.style.padding = "10px 0";

            item.innerHTML = `
                  <div class="category-icon-box">${getIconHtml(sub.icon, "📍")}</div>
                  <div style="font-weight:700; color:white; font-size:15px;">${subName}</div>
              `;
          } else {
            item.innerHTML = `
                  <div class="category-icon-box">${getIconHtml(sub.icon, "📍")}</div>
                  <div class="category-label-box">${subName}</div>
              `;
          }

          item.onclick = () => {
            (window as any).highlightSubCategory(sub.id.toString());
          };
          categoryList.appendChild(item);

          // NEW: Render Assigned Areas list if active
          if (activeSubCategoryId === sub.id.toString()) {
            const areaContainer = document.createElement("div");
            areaContainer.className = "category-area-list";
            // Reset margin/padding for full width look
            areaContainer.style.marginLeft = "0";
            areaContainer.style.width = "100%";
            areaContainer.style.boxSizing = "border-box";
            areaContainer.style.marginBottom = "8px";
            areaContainer.style.borderLeft = "none"; // Remove old border
            // Scrollable if too long (User Request)
            areaContainer.style.maxHeight = "300px";
            areaContainer.style.overflowY = "auto";
            areaContainer.style.backgroundColor = "#fff";

            // Get assigned areas for this subcategory
            const assignedMIDs = assignedMap.get(sub.id.toString()) || [];
            if (assignedMIDs.length > 0) {
              // Determine if we are focusing on a specific area
              // We can track this via global or just check highlighting
              // For now, let's just render them.

              // User Request: Filter by floor if not in Overview
              const currentFloorId = isMapInOverview() ? null : mapView.currentFloor.id;
              let areas = allMapObjects.filter(o => assignedMIDs.indexOf(o.id) !== -1);

              if (currentFloorId) {
                areas = areas.filter(a => {
                  const fId = a.floor?.id || a.floorId || (typeof a.floor === 'string' ? a.floor : null);
                  // Match floor logic
                  return fId === currentFloorId;
                });
              }
              // Sort by name
              areas.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

              areas.forEach((area, index) => {
                const areaItem = document.createElement("div");
                areaItem.style.padding = "8px 12px";
                areaItem.style.fontSize = "13px";
                areaItem.style.cursor = "pointer";
                areaItem.style.color = "#333";
                areaItem.style.borderBottom = "1px solid #f0f0f0";
                areaItem.style.display = "flex";
                areaItem.style.flexDirection = "column";

                // ALTERNATING COLORS (User Request: "đan xen nền xám nhẹ và màu trắng")
                areaItem.style.backgroundColor = index % 2 === 0 ? "#f9f9f9" : "white";

                // Name
                const nameSpan = document.createElement("span");
                nameSpan.innerText = TranslationManager.getName(area) || area.name || area.id;
                nameSpan.style.fontWeight = "500";
                areaItem.appendChild(nameSpan);

                // Floor (if available) - User Request
                const floorName = area.floor?.name || (typeof area.floor === 'string' ? area.floor : null);
                if (floorName) {
                  const floorSpan = document.createElement("span");
                  floorSpan.innerText = floorName;
                  floorSpan.style.fontSize = "10px";
                  floorSpan.style.opacity = "0.7";
                  areaItem.appendChild(floorSpan);
                }

                const isFocused = currentSearchResults.length === 1 && currentSearchResults[0].id === area.id;
                if (isFocused) {
                  areaItem.style.backgroundColor = "#085ebb"; // Blue BG (overrides alternating)
                  areaItem.style.color = "white"; // White Text
                  nameSpan.style.color = "white";
                  if (areaItem.children[1]) (areaItem.children[1] as HTMLElement).style.color = "rgba(255,255,255,0.8)";
                } else {
                  // Hover effects (preserve alternating color)
                  const defaultBg = areaItem.style.backgroundColor;
                  areaItem.onmouseenter = () => { areaItem.style.backgroundColor = "#e8f4f8"; };
                  areaItem.onmouseleave = () => { areaItem.style.backgroundColor = defaultBg; };
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
                      // User Request: Center zoom (accounting for sidebar 340px)
                      mapView.Camera.focusOn(area, {
                        duration: 1000,
                        minZoomLevel: 18.5, // User Requested "Smaller by 0.5x" (22 -> 21.5)
                        maxZoomLevel: 20
                        // padding: { left: 340, top: 40, right: 40, bottom: 40 } // REMOVED PADDING per user request (Lech issue)
                      } as any);
                      setTimeout(() => { isProgrammaticZoom = false; }, 1500);
                    };

                    // Always force switch if in Overview, or if ID differs
                    if (!currentFloorId || currentFloorId !== floorId) {
                      isProgrammaticZoom = true;
                      if (isCurrentlyOverview) { isInOverview = false; lastActiveFloorId = floorId; }

                      let executed = false;
                      const handler = () => {
                        if (executed) return; executed = true;
                        mapView.off("floor-change", handler);
                        setTimeout(executeZoom, 300);
                      };
                      mapView.on("floor-change", handler);
                      setTimeout(() => { if (!executed) { console.warn("Fallback Item Zoom"); handler(); } }, 1000);

                      try {
                        mapView.setFloor(floorId);
                      } catch (e) { handler(); }
                    } else {
                      // Same ID, but maybe stuck in Overview visual state?
                      if (isCurrentlyOverview) {
                        console.log("⚡ TOGGLE TRICK for Item Click");
                        isInOverview = false; isProgrammaticZoom = true;
                        const allFloors = mapData.getByType("floor");
                        const tempFloor = allFloors.find((f: any) => f.id !== floorId);
                        if (tempFloor) {
                          try {
                            console.log("⚡ Switching to temp floor:", tempFloor.id);
                            mapView.setFloor(tempFloor.id);
                            setTimeout(() => {
                              console.log("⚡ Switching back to target floor:", floorId);
                              mapView.setFloor(floorId);
                              setTimeout(executeZoom, 500);
                            }, 250);
                          } catch (e) { executeZoom(); }
                          return;
                        }
                      }
                      executeZoom();
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

  // Hook into floor change to update UI and Colors
  mapView.on("floor-change", () => {
    updateUIVisibility();
    applyAreaColors();
  });

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

    // Bỏ qua nếu đang chuyển tầng thủ công hoặc zoom do code (category)
    if (isManualFloorSwitch || isProgrammaticZoom || isFloorSwitching) return;

    const currentFloor = mapView.currentFloor;
    const type = getFloorType(currentFloor);

    // ---------------------------------------------------------
    // KỊCH BẢN PHÓNG TO (ZOOM IN)
    // ---------------------------------------------------------
    if (isZoomingIn) {
      // 1. Overview -> GF Transit (Chạm 16.5x)
      if (type === "overview" && zoom >= 16.5) {
        const targetId = findFloorIdByKeywords(["GF", "Transit"]);
        if (targetId) performFloorSwitch(targetId, "Zoom IN Overview -> Transit");
      }
      // 2. Transit -> Detail tương ứng (Chạm 17.0x)
      else if (type === "transit" && zoom >= 17.0) {
        const floorName = (currentFloor.name || "");
        // Ví dụ: "1F-Public-Transit" -> lấy "1F" để tìm tầng chi tiết tương ứng
        const prefix = floorName.split('-')[0].trim();
        let targetId = findFloorIdByKeywords([prefix === "GF" ? "Trệt" : prefix]);

        // Fallback cho GF nếu Trệt không khớp
        if (!targetId && prefix === "GF") targetId = findFloorIdByKeywords(["Ground"]);

        if (targetId) performFloorSwitch(targetId, `Zoom IN Transit -> Detail (${prefix})`);
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
        if (targetId) performFloorSwitch(targetId, `Zoom OUT Detail -> Transit (${prefix})`);
      }
      // 2. Transit -> Overview (Chạm 15.0x)
      else if (type === "transit" && zoom <= 15.0) {
        if (overviewFloor) performFloorSwitch(overviewFloor.id, "Zoom OUT Transit -> Overview");
      }
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
  let wayfindingDirections: any = null;
  let simplifiedInstructionsGlobal: any[] = []; // Global store for demo
  let routeTotalSecondsGlobal: number = 0; // Global store for demo
  let isSelectingOrigin: boolean = false;
  let isSelectingDestination: boolean = false;
  let currentNavigation: any = null;
  let currentSelectedStepIndex: number = -1; // Bước đang được chọn

  // ============================================
  // BLUE DOT ANIMATION CONSTANTS
  // ============================================
  const BLUE_DOT_SPEED_MPS = 1.4; // 1.4 m/s (tốc độ đi bộ thực tế)
  const FRAME_INTERVAL = 50; // 50ms / frame
  let speedMultiplier: number = 1.0; // Tốc độ multiplier (0.5x, 1x, 2x)

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

    // Đảm bảo targetDistance không vượt quá totalDistance
    const totalDistance = distances[distances.length - 1];
    const clampedDistance = Math.max(0, Math.min(targetDistance, totalDistance));

    // Tìm segment chứa targetDistance
    for (let i = 1; i < distances.length; i++) {
      if (clampedDistance <= distances[i] || i === distances.length - 1) {
        const prevDist = distances[i - 1];
        const nextDist = distances[i];
        const segmentLength = nextDist - prevDist;

        // Tránh chia cho 0
        if (segmentLength <= 0) {
          return coords[i - 1];
        }

        const ratio = (clampedDistance - prevDist) / segmentLength;
        const clampedRatio = Math.max(0, Math.min(1, ratio)); // Đảm bảo ratio trong [0, 1]

        const a = coords[i - 1];
        const b = coords[i];

        if (!a || !b) {
          return coords[coords.length - 1];
        }

        // Luôn nội suy mượt để di chuyển từ từ
        return {
          latitude: a.latitude + (b.latitude - a.latitude) * clampedRatio,
          longitude: a.longitude + (b.longitude - a.longitude) * clampedRatio,
        };
      }
    }

    // Fallback: trả về coordinate cuối cùng
    return coords[coords.length - 1];
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
        // Khu vực không có tên: màu #ffffff, không có hover
        // Khu vực không có tên: màu #ffffff, không có hover (hoverColor = #ffffff)
        // Khu vực có tên: màu trắng, hover vàng
        const defaultColor = objectToReset.name ? "#FFFFFF" : "#eeece7";
        mapView.updateState(objectToReset, {
          interactive: true,
          color: defaultColor,
          hoverColor: updateObjectHoverColor(objectToReset), // #ffffff cho không có tên, #FFFACD cho có tên
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
    // Reset tất cả objects trước
    allMapObjects.forEach((obj: any) => {
      try {
        // Skip if object is currently a search result
        if (currentSearchResults.some((result: any) => result.id === obj.id)) {
          return;
        }

        // Chỉ reset màu nếu không phải origin, destination hoac selectedSpace
        if (obj.id !== wayfindingOrigin?.id && obj.id !== wayfindingDestination?.id && obj.id !== selectedSpace?.id) {
          // Khu vực không có tên: màu #ffffff, không có hover (hoverColor = #ffffff)
          // Khu vực không có tên: màu #ffffff, không có hover (hoverColor = #ffffff)
          // Khu vực có tên: màu trắng, hover vàng
          const defaultColor = obj.name ? "#FFFFFF" : "#eeece7";
          mapView.updateState(obj, {
            interactive: true,
            color: defaultColor,
            hoverColor: updateObjectHoverColor(obj), // #ffffff cho không có tên, #FFFACD cho có tên
          });
        }
      } catch (e) {
        // Bỏ qua
      }
    });

    // Chỉ highlight origin và destination
    if (wayfindingOrigin) {
      highlightObject(wayfindingOrigin);
    }
    if (wayfindingDestination && wayfindingDestination.id !== wayfindingOrigin?.id) {
      highlightObject(wayfindingDestination);
    }

    // Highlight selectedSpace if exists
    if (selectedSpace && !currentSearchResults.some(r => r.id === selectedSpace.id)) {
      highlightObject(selectedSpace);
    }
  };

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

      // Tính khoảng cách nhanh (chỉ tính khi cần)
      const originAnchor = getObjectAnchor(wayfindingOrigin);
      const destAnchor = getObjectAnchor(wayfindingDestination);
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

      // Chọn phương pháp smoothing: Ưu tiên tốc độ
      // Ngưỡng giảm xuống 50m: Chỉ dùng dp-optimal cho đường rất gần, còn lại dùng greedy-los (nhanh nhất)
      const useOptimal = distance !== null && distance <= 50;

      const smoothingConfig = useOptimal
        ? {
          // dp-optimal: Chỉ dùng cho đường rất gần (≤50m) để đảm bảo chính xác
          enabled: true,
          __EXPERIMENTAL_METHOD: 'dp-optimal' as const,
          radius: 3.0, // Tăng radius lên 6.0 để đường đi cực kỳ mượt, xóa bỏ zic-zac địa hình
          __EXPERIMENTAL_INCLUDE_DOOR_BUFFER_NODES: true,
        }
        : {
          // greedy-los: Mặc định cho tất cả trường hợp (nhanh nhất, O(n))
          enabled: true,
          __EXPERIMENTAL_METHOD: 'greedy-los' as const,
          radius: 3.0, // Tăng radius lên 6.0 để siết chặt các đoạn rẽ không cần thiết
        };

      const directions = await mapData.getDirections(wayfindingOrigin, wayfindingDestination, {
        smoothing: smoothingConfig,
        accessible: true, // Ưu tiên thang máy và các lộ trình dễ tiếp cận
      });
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
            // (Xảy ra khi 2 bước rẽ ngược bị Rule 2 gộp thành Continue ngay sau Departure)
            const postMerged: any[] = [];
            for (let j = 0; j < merged.length; j++) {
              const step = merged[j];
              const stepType = (step.action?.type || '').toLowerCase();
              const prevStep = postMerged[postMerged.length - 1];
              const prevType = prevStep ? (prevStep.action?.type || '').toLowerCase() : '';

              if ((prevType === 'departure' || prevType === 'start') && stepType === 'continue') {
                // Gộp Continue vào Departure
                prevStep.distance += step.distance;
                console.log(`  -> Post-merge: Merging Continue into Departure (total dist: ${prevStep.distance.toFixed(1)})`);
              } else {
                postMerged.push(step);
              }
            }
            if (postMerged.length < merged.length) {
              console.log(`  ✅ Post-merge reduced steps: ${merged.length} -> ${postMerged.length}`);
            }
            merged.length = 0;
            postMerged.forEach(s => merged.push(s));

            // Lưu originalDistance TRƯỚC KHI dịch (dùng cho cumulativeDistance đồng bộ chấm xanh)
            merged.forEach(step => {
              step.originalDistance = step.distance || 0;
            });

            // DISTANCE SHIFTING cho hiển thị UI:
            // Mappedin dùng distance = "khoảng cách ĐẾN điểm hành động"
            // Người dùng muốn thấy = "khoảng cách SAU hành động" (giống Google Maps)
            // Ví dụ: "Đi thẳng 22m" thay vì "Đi thẳng 0m"
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
            accentColor: '#2196F3', // Xanh nước biển
            width: 1.2, // Tăng độ rộng đường đi để dễ nhìn hơn và đảm bảo điểm đến dễ thấy khi chạm vào
          },
          markerOptions: {
            departureColor: '#2196F3', // Xanh nước biển giống đường đi
            destinationColor: '#f44336',
          },
        };
        currentNavigation = mapView.Navigation.draw(directions, navigationOptions);

        // ============================================
        // HELPERS CHO NAVIGATION UI
        // ============================================

        // Helper: Tính khoảng cách giữa 2 tọa độ (Haversine formula, trả về mét)
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

          // Lấy text hướng dẫn gốc của Mappedin (đã rẽ trái/phải chuẩn theo map)
          const mappedinText = instruction.action?.instruction || instruction.instruction || "";

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
              return `${action} ${name} ${dirText}${floorText}`;
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
              return vText;
            }
            if (bearing.includes('slight') && bearing.includes('left')) return t('action_slight_left', 'Rẽ trái nhẹ');
            if (bearing.includes('slight') && bearing.includes('right')) return t('action_slight_right', 'Rẽ phải nhẹ');
            if (bearing.includes('left')) return t('action_turn_left', 'Rẽ trái');
            if (bearing.includes('right')) return t('action_turn_right', 'Rẽ phải');
            return t('action_turn', 'Rẽ');
          }

          const actionMap: Record<string, string> = {
            'arrival': t('action_arrival', 'Kết thúc'),
            'continue': t('action_continue', 'Tiếp tục'),
            'arrive': t('action_arrive', 'Đến nơi'),
            // 'takeconnection': t('action_take', 'Đi'), // Đã xử lý riêng
            'enter': t('action_enter', 'Vào'),
            'exit': t('action_exit', 'Ra'),
          };

          return actionMap[actionType] || mappedinText || actionType;
        };

        // Navigation segment highlighting
        const highlightPathSegment = (stepIndex: number) => {
          if (!currentNavigation || !directions.instructions) return;
          if (mapView.Navigation && typeof (mapView.Navigation as any).clearAllHighlightedPathSections === 'function') {
            (mapView.Navigation as any).clearAllHighlightedPathSections();
          }

          const current = directions.instructions[stepIndex];
          if (!current || !current.coordinate) return;

          const next = directions.instructions[stepIndex + 1];
          const toCoord = next?.coordinate || directions.coordinates[directions.coordinates.length - 1];

          /* 
          if (current.coordinate && toCoord && (mapView.Navigation as any).highlightPathSection) {
            (mapView.Navigation as any).highlightPathSection(current.coordinate, toCoord, {
              color: '#4CAF50', widthMultiplier: 1.2, animationDuration: 0
            });
          }
          */
        };

        (window as any).selectStep = (index: number) => {
          if (isAnimating) return; // Không cho phép click khi đang demo
          // highlightPathSegment(index); // REMOVED as per user request to remove colored path segment
        };

        // ============================================
        // TẠO BẢNG HƯỚNG DẪN TỪNG BƯỚC 
        // ============================================

        const instructionsListEl = document.getElementById("instructions-list");
        let instructionsHtml = '';
        let routeTotalSeconds = 0;

        try {
          if (!directions.instructions || directions.instructions.length === 0) {
            instructionsHtml = `<div style="padding:10px; color:#666; font-style:italic;">${TranslationManager.t('not_found', "Không tìm thấy đường đi")}</div>`;
          } else {
            instructionsHtml = `<div style="font-weight:700; font-size:14px; margin-bottom:10px; color:#333; padding:0 4px;">${TranslationManager.t('step_by_step', "Hướng dẫn từng bước:")}</div>`;
            instructionsHtml += '<div style="display:flex; flex-direction:column; gap:8px;">';

            const mentionedLandmarks: string[] = [];
            const originName = TranslationManager.getName(wayfindingOrigin) || wayfindingOrigin?.name || '';
            const destName = TranslationManager.getName(wayfindingDestination) || wayfindingDestination?.name || '';
            if (originName) mentionedLandmarks.push(originName);
            if (destName) mentionedLandmarks.push(destName);

            simplifiedInstructions.forEach((instruction: any, index: number) => {
              const isFirstStep = index === 0;
              const isLastStep = index === simplifiedInstructions.length - 1;

              // 1. Xác định actionText với nhiều fallback để tránh "undefined"
              let actionText = translateActionType(instruction, simplifiedInstructions, index);

              const rawInstruction = instruction.instruction;
              const actionInstruction = instruction.action?.instruction;
              const actionType = (instruction.action?.type || '').toLowerCase();

              if (!actionText || actionText === 'undefined') {
                actionText = actionInstruction || rawInstruction || actionType || TranslationManager.t('action_continue', 'Tiếp tục');
              }

              // Xử lý landmark cho bước 1 hoặc nếu chưa có landmark
              if (isFirstStep) {
                let foundLandmark: string | null = null;
                if (directions.coordinates && directions.coordinates.length > 0) {
                  const searchEnd = Math.max(Math.floor(directions.coordinates.length * 0.8), Math.min(directions.coordinates.length, 10));
                  foundLandmark = findLandmarkAlongPath(directions.coordinates, 0, searchEnd, instruction.coordinate?.floorId, mentionedLandmarks);
                }
                if (foundLandmark) {
                  actionText += ` (${TranslationManager.t('towards', 'về hướng')} ${foundLandmark})`;
                  mentionedLandmarks.push(foundLandmark);
                }
              } else if (!actionText.includes('(')) {
                const landmark = findNearbyLandmark(instruction.coordinate, instruction.coordinate?.floorId, 10, mentionedLandmarks);
                if (landmark) {
                  let prefix = TranslationManager.t('near', 'gần');
                  if (actionType === 'continue' || actionType.includes('arrive') || actionType.includes('arrival')) prefix = TranslationManager.t('past', 'qua');
                  actionText = `${actionText} (${prefix} ${landmark})`;
                  mentionedLandmarks.push(landmark);
                }
              }

              // 2. Logic hiển thị khoảng cách & thời gian
              let distanceText = '';
              let timeText = '';
              let currentDist = Math.round(instruction.distance || 0);
              const nextStep = simplifiedInstructions[index + 1];

              const isArrival = actionType.includes('arrive') || actionType.includes('arrival');
              const isConnection = (instruction.action?.type || '').toLowerCase().includes('connection') ||
                (instruction.action?.type || '').toLowerCase().includes('elevator') ||
                (instruction.action?.type || '').toLowerCase().includes('stair') ||
                (instruction.action?.type || '').toLowerCase().includes('escalator');

              if (isConnection) {
                const isEnter = actionType === 'takeconnection' || actionType === 'enter';
                if (isEnter) {
                  // Kiểm tra loại kết nối: thang máy vs thang cuốn/bộ
                  const connType = (instruction.action?.connection?.type || '').toLowerCase();
                  const isElevator = connType.includes('elevator') || (instruction.action?.connection?.name || '').toLowerCase().includes('thang máy');

                  // Mặc định: Thang máy 3m, Thang cuốn/bộ 6m
                  currentDist = isElevator ? 3 : 6;
                } else {
                  currentDist = 0;
                }
              }

              // Logic Shift đã được loại bỏ để trở về nguyên bản


              if (currentDist > 0 && !isArrival) {
                distanceText = `${currentDist}m`;

                let stepSeconds = 0;
                if (isConnection || actionText.toLowerCase().includes('thang')) {
                  stepSeconds = Math.round(currentDist / 0.6) + 20;
                } else {
                  stepSeconds = Math.round(currentDist / 1.4);
                }
                routeTotalSeconds += stepSeconds;

                let timeString = '';
                const minLabel = TranslationManager.t('minute_label', 'phút');
                const secLabel = TranslationManager.t('second_label', 'giây');
                if (stepSeconds < 60) {
                  timeString = `${stepSeconds}s`;
                } else {
                  const m = Math.floor(stepSeconds / 60);
                  const s = stepSeconds % 60;
                  timeString = s > 0 ? `${m} ${minLabel} ${s} ${secLabel}` : `${m} ${minLabel}`;
                }

                const hourglassIcon = `<svg viewBox="0 0 24 24" style="width:10px;height:10px;vertical-align:middle;fill:#666;margin-right:2px;"><path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z"/></svg>`;
                timeText = `${hourglassIcon}${timeString}`;
              }

              const floorName = TranslationManager.getFloorName(instruction.coordinate?.floorId || "");
              let stepInfo = floorName;
              if (distanceText && timeText) {
                stepInfo = `${distanceText} • ${timeText} • ${floorName}`;
              } else if (distanceText) {
                stepInfo = `${distanceText} • ${floorName}`;
              }

              instructionsHtml += `
                <div class="instruction-step" style="display:flex; gap:10px; padding:10px; background:white; border-radius:4px; box-shadow:0 1px 3px rgba(0,0,0,0.1); cursor:pointer;" onclick="window.selectStep(${index})">
                    <div style="width:24px; height:24px; min-width:24px; background:#085ebb; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;">${index + 1}</div>
                    <div style="flex:1;">
                        <div style="font-size:13px; font-weight:500; color:#333;">${TranslationManager.t('step_label', 'Bước')} ${index + 1}: ${actionText}</div>
                        <div style="font-size:11px; color:#666; margin-top:2px;">${stepInfo}</div>
                    </div>
                </div>
              `;
            });

            instructionsHtml += '</div>';
          }

          // Store for demo - dùng originalDistance (chưa bị dịch) để tính cumulativeDistance
          // Đảm bảo ranh giới bước khớp với quỹ đạo thực tế của chấm xanh
          let cumulativeDist = 0;
          simplifiedInstructions.forEach(inst => {
            inst.cumulativeDistance = cumulativeDist;
            cumulativeDist += inst.originalDistance || inst.distance || 0;
          });

          simplifiedInstructionsGlobal = simplifiedInstructions;
          routeTotalSecondsGlobal = routeTotalSeconds;
          (window as any).instructionTotalDistance = cumulativeDist; // Real scale for demo

          // Reset highlights initially
          deselectAllSteps();

        } catch (e) {
          console.warn("Error drawing navigation steps:", e);
          instructionsHtml = `<div style="padding:10px; color:#f44336;">${TranslationManager.t('error_nav', "Lỗi khi tìm đường đi")}</div>`;
        }

        if (instructionsListEl) {
          instructionsListEl.innerHTML = instructionsHtml;
        }

        // Cập nhật status bar với tổng thời gian thực tế
        if (statusEl) {
          // Tính lại tổng khoảng cách hiển thị thực tế theo logic mới
          let totalDisplayDist = 0;
          simplifiedInstructions.forEach((inst, idx) => {
            const actType = (inst.action?.type || '').toLowerCase();
            const isConn = actType.includes('connection') || actType.includes('elevator') || actType.includes('stair') || actType.includes('escalator');
            let d = inst.distance || 0;

            if (isConn) {
              const isEnter = actType === 'takeconnection' || actType === 'enter';
              if (isEnter) {
                const connType = (inst.action?.connection?.type || '').toLowerCase();
                const isElevator = connType.includes('elevator') || (inst.action?.connection?.name || '').toLowerCase().includes('thang máy');

                // Mặc định: Thang máy 3m, Thang cuốn/bộ 6m
                d = isElevator ? 3 : 6;
              } else {
                d = 0;
              }
            }

            // Không tính bước cuối (Arrival)
            if (!actType.includes('arrive') && !actType.includes('arrival')) {
              totalDisplayDist += Math.round(d);
            }
          });

          let totalTimeString = '';
          const mLabel = TranslationManager.t('minute_label', 'phút');
          const sLabel = TranslationManager.t('second_label', 'giây');
          if (routeTotalSeconds < 60) {
            totalTimeString = `${routeTotalSeconds}s`;
          } else {
            const mins = Math.floor(routeTotalSeconds / 60);
            const secs = routeTotalSeconds % 60;
            totalTimeString = secs > 0 ? `${mins} ${mLabel} ${secs} ${sLabel}` : `${mins} ${mLabel}`;
          }
          const hourglassIcon = `<svg viewBox="0 0 24 24" style="width:14px;height:14px;vertical-align:text-bottom;fill:#555;margin-right:4px;"><path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z"/></svg>`;
          const foundText = TranslationManager.t('route_found', 'Đã tìm thấy đường đi');
          statusEl.innerHTML = `
            ${foundText} <span style="font-weight:600;">(${Math.round(totalDisplayDist)}m)</span>
            <span style="margin-left:10px; font-weight:normal; color:#555;">
              ${hourglassIcon}${totalTimeString}
            </span>
          `;
        }

        // Cập nhật trạng thái Map Objects
        allMapObjects.forEach((obj: any) => {
          try {
            const currentState: any = {
              interactive: true,
              color: obj.name ? "#FFFFFF" : "#eeece7",
              hoverColor: updateObjectHoverColor(obj),
            };
            if (obj.id === wayfindingOrigin?.id || obj.id === wayfindingDestination?.id) {
              currentState.color = "#4CAF50";
              currentState.hoverColor = "#4CAF50";
            }
            mapView.updateState(obj, currentState);
          } catch (e) { }
        });

        allElevators.forEach((elev: any) => {
          try {
            mapView.updateState(elev, {
              interactive: true,
              hoverColor: updateObjectHoverColor(elev),
            });
          } catch (e) { }
        });

        allStairways.forEach((stair: any) => {
          try {
            mapView.updateState(stair, {
              interactive: true,
              hoverColor: updateObjectHoverColor(stair),
            });
          } catch (e) { }
        });
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


  /**
   * Update wayfinding UI
   */
  /**
   * Update wayfinding UI
   */
  const updateWayfindingUI = () => {
    const originEl = document.getElementById("wayfinding-origin");
    const destEl = document.getElementById("wayfinding-destination");
    const panelEl = document.getElementById("wayfinding-panel");

    if (originEl) {
      if (wayfindingOrigin) {
        originEl.textContent = TranslationManager.getName(wayfindingOrigin);
        originEl.style.color = "#085ebb";
      } else {
        originEl.textContent = TranslationManager.t('select_origin_placeholder', "Chưa chọn điểm đi");
        originEl.style.color = "#999";
      }
    }

    if (destEl) {
      if (wayfindingDestination) {
        destEl.textContent = TranslationManager.getName(wayfindingDestination);
        destEl.style.color = "#085ebb";
      } else {
        destEl.textContent = TranslationManager.t('select_destination_placeholder', "Chưa chọn điểm đến");
        destEl.style.color = "#999";
      }
    }

    if (panelEl) {
      if (wayfindingOrigin || wayfindingDestination) {
        panelEl.classList.add("active");
      } else {
        panelEl.classList.remove("active");
      }
    }
  };

  /**
   * Reset wayfinding
   */
  const resetWayfinding = () => {
    wayfindingOrigin = null;
    wayfindingDestination = null;
    wayfindingDirections = null;
    isSelectingOrigin = false;
    isSelectingDestination = false;
    clearNavigation();
    updateWayfindingUI();
    syncURL(true); // Update URL to remove directions

    // RESET UI BUTTONS
    const directionsBtn = document.getElementById("directions-btn");
    if (directionsBtn) directionsBtn.classList.remove("active");

    const previewBtn = document.getElementById("wayfinding-preview-btn");
    if (previewBtn) {
      previewBtn.textContent = TranslationManager.t('start_preview', "Bắt đầu");
    }
    // Re-highlight selection
    updateHighlights();

    const statusEl = document.getElementById("wayfinding-status");
    if (statusEl) statusEl.textContent = "";
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

    // AUTO-FILL Search Input (Restored from Backup)
    const searchInput = document.getElementById("location-search") as HTMLInputElement;
    const clearBtn = document.getElementById("search-clear-btn");
    if (searchInput) {
      searchInput.value = displayName;
      // Show clear button when auto-filled
      if (clearBtn) clearBtn.style.display = "block";
    }

    // Lookup Rich Data (Image / Desc) from TranslationManager
    const locData = TranslationManager.getLocationContent(space.id);
    console.log('Clicked Space:', space);

    // Build description - Prioritize Database (Manual Overrides/Translations)
    let descriptionText = TranslationManager.getLocationDescription(space.id);

    // Only fallback to Mappedin SDK data if DB is empty
    if (!descriptionText) {
      descriptionText = space.description || "";
    }

    // Nếu là Connection, thêm "Tầng liên kết" với format xuống hàng
    if (space && Array.isArray((space as any).floors) && (space as any).floors.length > 0) {
      const floorNames = (space as any).floors.map((f: any) => f?.name || f?.id).filter(Boolean);
      const linkedFloorsText = "Tầng liên kết:\n" + floorNames.map((n: string) => `• ${n}`).join("\n");
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

    // Directions button
    if (directionsBtn) {
      const nameAny = (displayName || "").toLowerCase();
      const isSpecialArea = nameAny.includes("công cộng") || nameAny.includes("public") ||
        nameAny.includes("hạn chế") || nameAny.includes("nhân viên") ||
        nameAny.includes("restricted") || nameAny.includes("staff") ||
        nameAny.includes("禁区") || nameAny.includes("制限") || nameAny.includes("禁") ||
        nameAny.includes("スタッフ") || nameAny.includes("직원") ||
        nameAny.includes("立ち入り禁止") || nameAny.includes("公共") || nameAny.includes("공공");

      if (isSpecialArea) {
        directionsBtn.style.display = "none";
      } else {
        directionsBtn.style.display = "block";
        directionsBtn.onclick = () => {
          wayfindingDestination = space;
          (window as any).wayfindingDestination = space;
          isSelectingOrigin = true;
          const panelEl = document.getElementById("wayfinding-panel");
          if (panelEl) panelEl.classList.add("active");
          updateWayfindingUI();
          updateHighlights();

          // USER REQUEST: Khi bấm dẫn đường thì thu bản đồ về 19x
          focusOnObject(space, 19.0);

          const statusEl = document.getElementById("wayfinding-status");
          if (statusEl) {
            statusEl.textContent = TranslationManager.t('select_origin', "Vui lòng chọn điểm đi trên bản đồ");
          }
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
    // REFRESH INFO PANEL IF OPEN
    if (selectedSpace) {
      updateInfo(selectedSpace);
    }
  });


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

        const model = await mapView.Models.add(coord, url, {
          interactive: true,
          scale: scale,
          rotation: rotation
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
          displayWebsite: inpPublic?.checked ? 1 : 0
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
    // 1. SELECT EXISTING 3D MODEL
    // ============================================
    if (event.models && event.models.length > 0) {
      const clickedModel = event.models[0];
      console.log("🎯 Clicked Model ID:", clickedModel.id);
      activeModelInstance = clickedModel;

      // Hide space info box if open to avoid distraction
      if (typeof hideInfo === 'function') hideInfo();

      const meta = MODEL_ID_REGISTRY.get(clickedModel.id);
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
        if (isSelectingOrigin || isSelectingDestination) {
          // Bỏ highlight điểm cũ trước khi set điểm mới
          if (isSelectingOrigin && wayfindingOrigin) {
            resetObjectHighlight(wayfindingOrigin);
          } else if (isSelectingDestination && wayfindingDestination) {
            resetObjectHighlight(wayfindingDestination);
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
          }

          // Cập nhật highlights: chỉ highlight origin và destination (tối đa 2)
          updateHighlights();

          // Update UI và vẽ navigation
          updateWayfindingUI();
          if (wayfindingOrigin && wayfindingDestination) {
            drawNavigation();
          }

          const statusEl = document.getElementById("wayfinding-status");
          if (statusEl) {
            if (wayfindingOrigin && wayfindingDestination) {
              statusEl.textContent = "";
            } else if (isSelectingOrigin) {
              statusEl.textContent = TranslationManager.t('select_origin', "Vui lòng chọn điểm đi trên bản đồ");
            } else if (isSelectingDestination) {
              statusEl.textContent = TranslationManager.t('select_destination', "Vui lòng chọn điểm đến trên bản đồ");
            }
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
        statusEl.textContent = TranslationManager.t('select_origin', "Vui lòng chọn điểm đi trên bản đồ");
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
        statusEl.textContent = TranslationManager.t('select_destination', "Vui lòng chọn điểm đến trên bản đồ");
      }
    });
  }

  // Nút đảo ngược

  // Nút xóa
  const clearBtn = document.getElementById("wayfinding-clear-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      // Custom Clear Logic: Chỉ xóa dẫn đường, giữ lại selection
      wayfindingOrigin = null;
      wayfindingDestination = null;
      (window as any).wayfindingOrigin = null;
      (window as any).wayfindingDestination = null;
      wayfindingDirections = null;
      isSelectingOrigin = false;
      isSelectingDestination = false;

      clearNavigation();
      updateWayfindingUI();

      // Ẩn panel dẫn đường
      const panelEl = document.getElementById("wayfinding-panel");
      if (panelEl) panelEl.classList.remove("active");

      // Reset nút Dẫn đường
      const directionsBtn = document.getElementById("directions-btn");
      if (directionsBtn) directionsBtn.classList.remove("active");

      // Reset nút Bắt đầu
      const previewBtn = document.getElementById("wayfinding-preview-btn");
      if (previewBtn) previewBtn.textContent = TranslationManager.t('start_preview', "Bắt đầu");

      // Re-highlight selection (selectedSpace vẫn còn giá trị)
      updateHighlights();

      const statusEl = document.getElementById("wayfinding-status");
      if (statusEl) statusEl.textContent = "";
    });
  }

  // ============================================
  // DESELECT HELPER & LISTENERS
  // ============================================
  const deselectAllSteps = () => {
    const instructionsListEl = document.getElementById("instructions-list");
    if (!instructionsListEl) return;
    const allSteps = instructionsListEl.querySelectorAll('.instruction-step');
    allSteps.forEach((step: any) => {
      step.style.background = '#fff';
      const firstDiv = step.querySelector('div:first-child') as HTMLElement;
      const lastDiv = step.querySelector('div:last-child') as HTMLElement;

      if (firstDiv) {
        firstDiv.style.background = '#085ebb';
        firstDiv.style.color = 'white';
      }

      if (lastDiv) {
        const subDivs = lastDiv.querySelectorAll('div');
        if (subDivs.length > 0) subDivs[0].style.color = '#333';
        if (subDivs.length > 1) subDivs[1].style.color = '#666';

        // Reset hourglass icon color
        const svgs = lastDiv.querySelectorAll('svg');
        svgs.forEach((svg: any) => svg.style.fill = '#666');
      }
    });

    currentSelectedStepIndex = -1;
    // Ở đây ta gọi updateHighlights để đảm bảo trạng thái đúng
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
        });
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
    const baseDurationMs = (routeTotalSecondsGlobal > 0 ? routeTotalSecondsGlobal : (totalDistance / BLUE_DOT_SPEED_MPS)) * 1000;
    const totalDurationMs = baseDurationMs / speedMultiplier;

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
      blueDot.update({
        latitude: startPos.latitude,
        longitude: startPos.longitude,
        accuracy: 5,
        heading: startHeading,
        floorOrFloorId: startFloorId,
        timestamp: Date.now(),
      });
      // Zoom lên 20x và focus vào blue dot khi bắt đầu preview
      focusCameraOnCoordinate(startPos, true);
    } catch (e) {
      console.warn("Error updating blue dot:", e);
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

      const elapsed = performance.now() - startTime - animationPauseTime;
      const traveled = Math.min((elapsed / totalDurationMs) * totalDistance, totalDistance);
      currentAnimationDistance = traveled;

      // 4️⃣ Nội suy vị trí
      const pos = interpolateByDistance(segmentCoords, distances, traveled);

      // Tính heading và lấy floor từ segmentCoords (không tìm nearest)
      let heading: number | undefined = undefined;
      const currentIndex = distances.findIndex((d: number) => d >= traveled);
      const segmentCoord = segmentCoords[Math.max(0, Math.min(currentIndex, segmentCoords.length - 1))];

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
        // Lấy floor từ segmentCoords (KHÔNG tìm nearest từ full path)
        const currentFloor = mapView.currentFloor;
        let targetFloorId = currentFloor?.id || 'device';

        // Lấy floor trực tiếp từ segment coordinate hiện tại
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
        });

        // Chuyển tầng nếu cần
        if (targetFloorId !== 'device' && targetFloorId !== currentFloor?.id) {
          try {
            mapView.setFloor(targetFloorId);
          } catch (e) {
            console.warn("Error changing floor:", e);
          }
        }

        // 5️⃣ Camera follow (mỗi 40 frame ~ 2 giây) - zoom lên 20x khi preview, giảm giật
        const frameCount = Math.floor(elapsed / FRAME_INTERVAL);
        if (frameCount % 40 === 0) {
          focusCameraOnCoordinate(pos, true); // Zoom lên 20x khi preview
        }

        // Cập nhật progress bar và time liên tục
        updateVideoProgress(elapsed, totalDurationMs);

        // 6️⃣ Kết thúc
        if (traveled >= totalDistance) {
          updateVideoProgress(totalDurationMs, totalDurationMs);

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
      if (i === index) return; // Skip the current step
      step.style.background = '#fff';
      const firstDiv = step.querySelector('div:first-child') as HTMLElement;
      const lastDiv = step.querySelector('div:last-child') as HTMLElement;
      if (firstDiv) {
        firstDiv.style.background = '#085ebb';
        firstDiv.style.color = 'white';
      }
      if (lastDiv) {
        const subDivs = lastDiv.querySelectorAll('div');
        if (subDivs.length > 0) subDivs[0].style.color = '#333';
        if (subDivs.length > 1) subDivs[1].style.color = '#666';

        // Reset hourglass icon color
        const svgs = lastDiv.querySelectorAll('svg');
        svgs.forEach((svg: any) => svg.style.fill = '#666');
      }
    });

    const step = allSteps[index] as HTMLElement;
    if (step) {
      step.style.background = '#085ebb';
      const firstDiv = step.querySelector('div:first-child') as HTMLElement;
      const lastDiv = step.querySelector('div:last-child') as HTMLElement;
      if (firstDiv) {
        firstDiv.style.background = 'white';
        firstDiv.style.color = '#085ebb';
      }
      if (lastDiv) {
        const subDivs = lastDiv.querySelectorAll('div');
        subDivs.forEach((d: any) => d.style.color = 'white');

        // Hourglass icon to white
        const svgs = lastDiv.querySelectorAll('svg');
        svgs.forEach((svg: any) => svg.style.fill = 'white');
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

    // Thời gian giả lập (real travel time)
    const simulatedElapsedMs = elapsed * speedMultiplier;
    const simulatedTotalMs = totalDuration * speedMultiplier;

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
    const playPauseBtn = document.getElementById("video-play-pause");
    if (playPauseBtn) {
      playPauseBtn.textContent = isPaused ? "▶" : "⏸";
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
      });

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
  const CAMERA_UPDATE_INTERVAL = 1000; // Cập nhật camera mỗi 1 giây để giảm giật

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

    // Hiển thị video control bar
    const videoControlBar = document.getElementById("video-control-bar");
    if (videoControlBar) {
      videoControlBar.style.display = "block";
    }

    // Reset play/pause button
    const playPauseBtn = document.getElementById("video-play-pause");
    if (playPauseBtn) {
      playPauseBtn.textContent = "⏸";
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
  const previewBtn = document.getElementById("wayfinding-preview-btn");
  if (previewBtn) {
    previewBtn.addEventListener("click", () => {
      // VALIDATION: Kiểm tra điểm xuất phát
      if (!wayfindingOrigin) {
        alert(TranslationManager.t('select_origin_alert', "Chưa có điểm xuất phát. Vui lòng chọn điểm xuất phát trên bản đồ."));
        return;
      }
      // VALIDATION: Kiểm tra điểm đích
      if (!wayfindingDestination) {
        alert(TranslationManager.t('select_destination_alert', "Chưa có điểm đích đến. Vui lòng chọn điểm đích đến trên bản đồ."));
        return;
      }

      deselectAllSteps(); // Deselect khi click preview
      previewBtn.textContent = "Demo"; // Change text to Demo
      deselectAllSteps(); // Deselect khi click preview

      // Đảm bảo xóa mọi highlight xanh lá bằng cách redraw navigation
      if (currentNavigation && wayfindingDirections) {
        try {
          if (mapView.Navigation && typeof (mapView.Navigation as any).clear === 'function') {
            (mapView.Navigation as any).clear();
          }

          const navigationOptions: any = {
            pathOptions: {
              displayArrowsOnPath: true,
              animateArrowsOnPath: true,
              accentColor: '#2196F3',
              width: 1.2,
            },
            markerOptions: {
              departureColor: '#2196F3',
              destinationColor: '#f44336',
            },
          };
          currentNavigation = mapView.Navigation.draw(wayfindingDirections, navigationOptions);
        } catch (e) {
          console.warn("Error clearing highlights before preview:", e);
        }
      }

      if (wayfindingDirections && wayfindingDirections.coordinates && wayfindingDirections.coordinates.length > 0) {
        // Hiển thị video control bar
        const videoControlBar = document.getElementById("video-control-bar");
        if (videoControlBar) {
          videoControlBar.style.display = "block";
        }
        animateBlueDotFullPath();
      }
    });
  }

  // Video control handlers
  const playPauseBtn = document.getElementById("video-play-pause");
  if (playPauseBtn) {
    playPauseBtn.addEventListener("click", () => {
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

    // Ẩn blue dot
    if (blueDot) {
      blueDot.disable();
    }

    // Ẩn video control bar
    const vBar = document.getElementById("video-control-bar");
    if (vBar) {
      vBar.style.display = "none";
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
    const previewBtn = document.getElementById("wayfinding-preview-btn");
    if (previewBtn) {
      previewBtn.textContent = TranslationManager.t('start_preview', 'Bắt đầu');
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
      speedMultiplier = speed;
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
  const style = document.createElement('style');
  style.textContent = `
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
  document.head.appendChild(style);

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
      thumb: meta.thumb // Sync thumbnail to DB
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
  // LOAD MODELS FROM API (Replaces localStorage)
  // ============================================
  const loadModelsFromAPI = async () => {
    try {
      console.log("📥 Loading models from API...");
      const models = await ApiService.getAllModels();

      // If NO models (empty DB), create default airplanes
      // If NO models (empty DB), just log
      if (!models || models.length === 0) {
        console.log("🆕 Empty DB - No models to load.");
        return;
      }

      console.log(`📦 Loaded ${models.length} models from DB`);

      for (const m of models) {
        if (isViewOnly) {
          // DATABASE-DRIVEN VISIBILITY: Only show models explicitly marked for website
          const shouldShow = m.displayWebsite == 1 || m.displayWebsite === true;
          if (!shouldShow) continue;
        }

        // Skip duplicate check if we trust DB ID
        if (MODEL_INSTANCE_REGISTRY.has(m.uuid)) continue;

        // Resolve Floor object
        const floors = mapData.getByType("floor");
        let targetFloor = floors.find((f: any) => f.id === m.floorId);

        // Specific fallback for User's Floor 2 ID
        if (!targetFloor && m.floorId === "m_d4b5674c0b15e099") {
          targetFloor = floors.find((f: any) => {
            const n = (f.name || "").toLowerCase();
            return n.includes("tầng 2") || n.includes("tang 2") || n.includes("floor 2");
          });
        }

        // Final fallback
        targetFloor = targetFloor || mapView.currentFloor;

        console.log(`📍 Placing model ${m.name || m.uuid} on floor: ${targetFloor?.name} (${targetFloor?.id})`);

        const coord = mapView.createCoordinate(m.latitude, m.longitude, targetFloor);

        // Ensure URL is absolute or resolve from asset map
        const modelAssetMap: Record<string, any> = {
          "car": car,
          "three_palm": tree_palm,
          "tree_palm": tree_palm
        };

        let finalUrl = m.url;
        if (modelAssetMap[finalUrl]) {
          finalUrl = modelAssetMap[finalUrl];
        } else if (finalUrl && finalUrl.startsWith("./")) {
          finalUrl = finalUrl.replace("./", `${SERVER_URL}/`);
        } else if (finalUrl && !finalUrl.startsWith("http")) {
          finalUrl = `${SERVER_URL}/${finalUrl}`;
        }

        try {
          const model = await mapView.Models.add(coord, finalUrl, {
            interactive: true,
            scale: m.scale,
            rotation: m.rotation,
          });

          // Re-attach Properties
          (model as any).url = finalUrl;
          (model as any).uuid = m.uuid;
          (model as any).originalCoordinate = coord;

          // Register Metadata
          MODEL_ID_REGISTRY.set(model.id, {
            url: m.url,
            uuid: m.uuid,
            name: m.name,
            desc: m.desc,
            rotation: m.rotation,
            scale: m.scale,
            originalCoordinate: coord,
            floorId: targetFloor?.id || m.floorId,
            displayWebsite: m.displayWebsite,
            thumb: m.thumb || m.thumbnail
          });

          // Register Instance
          MODEL_INSTANCE_REGISTRY.set(m.uuid, model);

        } catch (modelError) {
          console.error(`❌ Failed to add model ${m.uuid}:`, modelError);
        }
      }
    } catch (e) {
      console.error("❌ Error loading from API:", e);
    }

    // NEW: After loading all models, ensure Overview models are visible on current floor
    showOverviewModelsOnAllFloors();
  };

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
      floorId: currentFloor.id
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
            scale: newScale
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
      rotation: newRot
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
  const renderModelPicker = async () => {
    if (!modelGrid) return;

    // Fetch from API if empty
    if (AVAILABLE_MODELS.length === 0) {
      modelGrid.innerHTML = `<div style='grid-column: span 3; text-align: center; padding: 20px;'>${TranslationManager.t('loading', 'Loading models...')}</div>`;
      AVAILABLE_MODELS = await ApiService.getAvailableModels();
    }

    modelGrid.innerHTML = "";

    if (AVAILABLE_MODELS.length === 0) {
      modelGrid.innerHTML = `<div style='grid-column: span 3; text-align: center; padding: 20px;'>${TranslationManager.t('no_models', 'No models found. Check folder.')}</div>`;
      return;
    }

    AVAILABLE_MODELS.forEach((model) => {
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
        <div class="model-item-preview" style="width:100%; height:90px; display:flex; align-items:center; justify-content:center; background:#ffffff; border:1px solid #f0f0f0; border-radius:4px; overflow:hidden; padding:5px;">
          ${thumbSrc ? `<img src="${thumbSrc}" alt="${model.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=\\'font-size:24px;\\'>📦</span>';" style="max-width:100%; max-height:100%; object-fit:contain;" />` : `<span style="font-size:24px;">📦</span>`}
        </div>
        <span style="font-size:12px; margin-top:5px; text-align:center; font-weight:500; color:#333;">${model.name}</span>
      `;
      item.addEventListener("click", () => {
        startPlacingModel(model);
        modalPicker?.classList.add("hidden");
      });
      modelGrid.appendChild(item);
    });
  };

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
            rotation: placingModelConfig.rotation || [0, 0, 0]
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
    initAdminUI(allMapObjects);
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
// We need to run initAdminUI *after* map objects are loaded.
// The easiest way is to call it inside init() right before returning or set a timeout.
// I'll append a call to initAdminUI inside the existing init function via a separate edit or assume allMapObjects is global.
// Wait, init() has allMapObjects local const. I should modify init() to call initAdminUI(allMapObjects).
// But init() is huge. I'll search for where init() ends and use the `allMapObjects` variable if it's available or exposed.
// Actually, `allMapObjects` was defined inside `init()`.
// I created `initAdminUI` outside. I need to call it FROM inside `init`.
// I will verify where to call it content-wise.


