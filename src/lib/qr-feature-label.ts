// What to call the "digital catalog + QR code" feature depends on the kind of
// business — a restaurant's is a menu, a hotel's is room rates, a shop's is a
// catalog, and so on. Everything else about the feature (translation, QR
// code, printable poster, public page, scan stats) is identical across
// categories; only this label changes.
const QR_FEATURE_LABELS: Record<string, Record<string, string>> = {
  restaurant: {
    fr: "Menu digital", en: "Digital Menu", ar: "القائمة الرقمية", es: "Menú Digital",
    de: "Digitales Menü", it: "Menu Digitale", pt: "Menu Digital", ru: "Цифровое меню",
    zh: "数字菜单", ko: "디지털 메뉴", tr: "Dijital Menü", he: "תפריט דיגיטלי",
  },
  hebergement: {
    fr: "Chambres & tarifs", en: "Rooms & Rates", ar: "الغرف والأسعار", es: "Habitaciones y Tarifas",
    de: "Zimmer & Tarife", it: "Camere e Tariffe", pt: "Quartos e Tarifas", ru: "Номера и тарифы",
    zh: "客房和价格", ko: "객실 및 요금", tr: "Odalar ve Fiyatlar", he: "חדרים וחיובים",
  },
  shopping: {
    fr: "Catalogue digital", en: "Digital Catalog", ar: "الكتالوج الرقمي", es: "Catálogo Digital",
    de: "Digitaler Katalog", it: "Catalogo Digitale", pt: "Catálogo Digital", ru: "Цифровой каталог",
    zh: "数字目录", ko: "디지털 카탈로그", tr: "Dijital Katalog", he: "קטלוג דיגיטלי",
  },
  activite: {
    fr: "Prestations & tarifs", en: "Services & Rates", ar: "الخدمات والأسعار", es: "Servicios y Tarifas",
    de: "Leistungen & Tarife", it: "Servizi e Tariffe", pt: "Serviços e Tarifas", ru: "Услуги и тарифы",
    zh: "服务和价格", ko: "서비스 및 요금", tr: "Hizmetler ve Fiyatlar", he: "שירותים וחיובים",
  },
  "location-vehicules": {
    fr: "Tarifs de location", en: "Rental Rates", ar: "أسعار الإيجار", es: "Tarifas de Alquiler",
    de: "Mietpreise", it: "Tariffe di Noleggio", pt: "Tarifas de Aluguel", ru: "Тарифы на аренду",
    zh: "租赁价格", ko: "렌탈 요금", tr: "Kiralama Fiyatları", he: "תעריפי השכרה",
  },
  "agences-immobilieres": {
    fr: "Biens immobiliers", en: "Real Estate Properties", ar: "العقارات", es: "Propiedades Inmobiliarias",
    de: "Immobilien", it: "Proprietà Immobiliari", pt: "Propriedades Imobiliárias", ru: "Недвижимость",
    zh: "房地产物业", ko: "부동산", tr: "Gayrimenkul", he: "נכסי נדלן",
  },
};

const DEFAULT_LABEL: Record<string, string> = {
  fr: "Catalogue digital", en: "Digital Catalogue", ar: "كتالوج رقمي", es: "Catálogo Digital",
  de: "Digitaler Katalog", it: "Catalogo Digitale", pt: "Catálogo Digital", ru: "Цифровой каталог",
  zh: "数字目录", ko: "디지털 카탈로그", tr: "Dijital Katalog", he: "קטלוג דיגיטלי",
};

export function qrFeatureLabel(categoryType: string | undefined | null, locale: string): string {
  const entry = (categoryType && QR_FEATURE_LABELS[categoryType]) || DEFAULT_LABEL;
  return entry[locale] ?? entry.fr;
}
