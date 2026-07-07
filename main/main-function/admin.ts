
// interfaces
interface Language {
    LanguageId: string;
    LanguageName: string;
    FlagIcon: string | null;
}

interface Category {
    id: number;
    code: string;
    names: Record<string, string>;
}

interface LocationData {
    id?: number;
    mappedinId: string;
    categoryId: number;
    slug: string;
    logo?: string;
    image?: string;
    phone?: string;
    website?: string;
    socials?: Record<string, string>;
    hours?: Record<string, string>;
    translations: Record<string, {
        name: string;
        desc: string;
        content: string;
        url: string;
    }>;
}

// State
let languages: Language[] = [];
let categories: Category[] = [];
let locations: Record<string, LocationData> = {};
let currentLocation: LocationData | null = null;

// DOM Elements
const locationTableBody = document.getElementById('locationTableBody') as HTMLElement;
const categorySelect = document.getElementById('categoryFilter') as HTMLSelectElement;
const searchInput = document.getElementById('searchInput') as HTMLInputElement;
const editModal = new (window as any).bootstrap.Modal(document.getElementById('editModal'));

// Tự động chuyển đổi URL API giữa Local và Production
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE_URL = isLocal ? "http://localhost:3002/api" : `${window.location.origin}/api`;

// Initialize
async function init() {
    try {
        const res = await fetch(`${API_BASE_URL}/init-data`);
        const data = await res.json();

        languages = data.languages;
        categories = data.categories;
        locations = data.locations;

        renderFilters();
        renderTable();

        console.log("Admin Data Loaded", data);
    } catch (e) {
        console.error("Failed to load init data", e);
        alert("Failed to load API data. Is server running?");
    }
}

// Render Filters
function renderFilters() {
    categorySelect.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(c => {
        const name = c.names['vi'] || c.names['en'] || c.code;
        const opt = document.createElement('option');
        opt.value = c.id.toString();
        opt.textContent = name;
        categorySelect.appendChild(opt);
    });
}

// Render Table
function renderTable() {
    locationTableBody.innerHTML = '';
    const filterText = searchInput.value.toLowerCase();
    const filterCat = categorySelect.value;

    Object.values(locations).forEach(loc => {
        const defaultName = loc.translations['vi']?.name || loc.translations['en']?.name || loc.mappedinId;

        // Filter Logic
        if (filterCat && loc.categoryId.toString() !== filterCat) return;
        if (filterText && !defaultName.toLowerCase().includes(filterText) && !loc.mappedinId.toLowerCase().includes(filterText)) return;

        const tr = document.createElement('tr');
        tr.className = 'location-row';
        tr.innerHTML = `
            <td>${loc.logo ? `<img src="${loc.logo}" height="30">` : '-'}</td>
            <td>${loc.mappedinId}</td>
            <td>${getCategoryName(loc.categoryId)}</td>
            <td>${defaultName}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-edit" data-mid="${loc.mappedinId}">Edit</button>
            </td>
        `;
        locationTableBody.appendChild(tr);
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e: any) => {
            const mid = e.target.getAttribute('data-mid');
            openModal(mid);
        });
    });
}

function getCategoryName(id: number) {
    const cat = categories.find(c => c.id === id);
    return cat ? (cat.names['vi'] || cat.code) : 'Unknown';
}

// Open Modal
function openModal(mid: string | null) {
    currentLocation = mid ? locations[mid] : {
        mappedinId: '', categoryId: 1, slug: '', translations: {}
    } as LocationData;

    // Fill Master Data
    (document.getElementById('mappedinId') as HTMLInputElement).value = currentLocation.mappedinId;
    (document.getElementById('slugKey') as HTMLInputElement).value = currentLocation.slug || '';
    (document.getElementById('logoUrl') as HTMLInputElement).value = currentLocation.logo || '';
    (document.getElementById('coverImageUrl') as HTMLInputElement).value = currentLocation.image || '';
    (document.getElementById('phoneNumber') as HTMLInputElement).value = currentLocation.phone || '';
    (document.getElementById('websiteLink') as HTMLInputElement).value = currentLocation.website || '';

    // Category Select
    const catSelect = document.getElementById('categoryId') as HTMLSelectElement;
    catSelect.innerHTML = '';
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id.toString();
        opt.textContent = c.names['vi'] || c.code;
        if (c.id === currentLocation?.categoryId) opt.selected = true;
        catSelect.appendChild(opt);
    });

    // Generate Tabs & Content
    const tabList = document.getElementById('langTabs') as HTMLElement;
    const tabContent = document.getElementById('langTabContent') as HTMLElement;
    tabList.innerHTML = '';
    tabContent.innerHTML = '';

    languages.forEach((lang, idx) => {
        const isActive = idx === 0 ? 'active' : '';
        const langData = currentLocation?.translations[lang.LanguageId] || { name: '', desc: '', content: '', url: '' };

        // Tab Header
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.innerHTML = `
            <button class="nav-link ${isActive}" data-bs-toggle="tab" data-bs-target="#tab-${lang.LanguageId}" type="button">
                ${lang.LanguageName}
            </button>
        `;
        tabList.appendChild(li);

        // Tab Body
        const div = document.createElement('div');
        div.className = `tab-pane fade show ${isActive} lang-tab-content`;
        div.id = `tab-${lang.LanguageId}`;
        div.innerHTML = `
            <div class="mb-3">
                <label class="form-label">Display Name *</label>
                <input type="text" class="form-control field-name" data-lang="${lang.LanguageId}" value="${langData.name || ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Short Description</label>
                <textarea class="form-control field-desc" data-lang="${lang.LanguageId}" rows="2">${langData.desc || ''}</textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">Full Content (HTML)</label>
                <textarea class="form-control field-content" data-lang="${lang.LanguageId}" rows="5">${langData.content || ''}</textarea>
            </div>
        `;
        tabContent.appendChild(div);
    });

    editModal.show();
}

// Save Logic
document.getElementById('btnSave')?.addEventListener('click', async () => {
    const mid = (document.getElementById('mappedinId') as HTMLInputElement).value;
    if (!mid) return alert("Mappedin ID is required");

    const payload: LocationData = {
        mappedinId: mid,
        categoryId: parseInt((document.getElementById('categoryId') as HTMLSelectElement).value),
        slug: (document.getElementById('slugKey') as HTMLInputElement).value,
        logo: (document.getElementById('logoUrl') as HTMLInputElement).value,
        image: (document.getElementById('coverImageUrl') as HTMLInputElement).value,
        phone: (document.getElementById('phoneNumber') as HTMLInputElement).value,
        website: (document.getElementById('websiteLink') as HTMLInputElement).value,
        translations: {}
    };

    // Gather Translations
    languages.forEach(lang => {
        const name = (document.querySelector(`.field-name[data-lang="${lang.LanguageId}"]`) as HTMLInputElement).value;
        const desc = (document.querySelector(`.field-desc[data-lang="${lang.LanguageId}"]`) as HTMLInputElement).value;
        const content = (document.querySelector(`.field-content[data-lang="${lang.LanguageId}"]`) as HTMLInputElement).value;

        if (name) {
            payload.translations[lang.LanguageId] = {
                name, desc, content,
                url: payload.slug ? `/${lang.LanguageId}/${payload.slug}` : ''
            };
        }
    });

    console.log("Saving...", payload);

    try {
        const res = await fetch(`${API_BASE_URL}/admin/locations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();

        if (json.success) {
            alert('Saved successfully!');
            editModal.hide();
            init(); // Refresh data
        } else {
            alert('Error: ' + json.error);
        }
    } catch (e) {
        console.error(e);
        alert('Failed to save');
    }
});

// Search Filter
searchInput.addEventListener('input', renderTable);
categorySelect.addEventListener('change', renderTable);

// Global Exposure for HTML onclick
(window as any).openModal = () => openModal(null);

// Start
init();
