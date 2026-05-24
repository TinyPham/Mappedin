type AdminLocationPayload = {
    mappedinId?: string;
    image?: string;
    phone?: string;
    hours?: string;
    translations?: Record<string, { name?: string; description?: string; locationDetail?: string }>;
};

export function buildAreaInformationPayloadFromAdminLocation(payload: AdminLocationPayload) {
    const translations = payload.translations || {};

    return {
        id: payload.mappedinId,
        name_vi: translations.vn?.name,
        name_en: translations.en?.name,
        name_zh: translations.zh?.name,
        name_ja: translations.ja?.name,
        name_ko: translations.ko?.name,
        vn: translations.vn?.description,
        en: translations.en?.description,
        zh: translations.zh?.description,
        ja: translations.ja?.description,
        ko: translations.ko?.description,
        imageUrl: payload.image,
        mappedinImageUrl: null,
        phone: payload.phone,
        openingHours: payload.hours,
        detail_vn: translations.vn?.locationDetail,
        detail_en: translations.en?.locationDetail,
        detail_zh: translations.zh?.locationDetail,
        detail_ja: translations.ja?.locationDetail,
        detail_ko: translations.ko?.locationDetail
    };
}
