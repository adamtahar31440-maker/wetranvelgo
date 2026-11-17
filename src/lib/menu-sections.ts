import { MENU_SECTION_KINDS, type MenuSectionKind } from "@/lib/menu-types";
import { qrFeatureLabel } from "@/lib/qr-feature-label";

// Tab names on the public QR page, and the section types a pro picks from
// when adding one. Short on purpose: several tabs share a phone-width row.
const SECTION_LABELS: Record<MenuSectionKind, Record<string, string>> = {
  hotel: {
    fr: "Hôtel", en: "Hotel", ar: "الفندق", es: "Hotel", de: "Hotel", it: "Hotel",
    pt: "Hotel", ru: "Отель", zh: "酒店", ko: "호텔", tr: "Otel", he: "מלון",
  },
  restaurant: {
    fr: "Restaurant", en: "Restaurant", ar: "المطعم", es: "Restaurante", de: "Restaurant", it: "Ristorante",
    pt: "Restaurante", ru: "Ресторан", zh: "餐厅", ko: "레스토랑", tr: "Restoran", he: "מסעדה",
  },
  bar: {
    fr: "Bar", en: "Bar", ar: "البار", es: "Bar", de: "Bar", it: "Bar",
    pt: "Bar", ru: "Бар", zh: "酒吧", ko: "바", tr: "Bar", he: "בר",
  },
  spa: {
    fr: "Spa & hammam", en: "Spa & hammam", ar: "سبا وحمام", es: "Spa y hammam", de: "Spa & Hamam",
    it: "Spa e hammam", pt: "Spa e hammam", ru: "Спа и хаммам", zh: "水疗与土耳其浴", ko: "스파 & 하맘",
    tr: "Spa ve hamam", he: "ספא וחמאם",
  },
  coiffeur: {
    fr: "Coiffeur & beauté", en: "Hair & beauty", ar: "الحلاقة والتجميل", es: "Peluquería y belleza",
    de: "Friseur & Beauty", it: "Parrucchiere e bellezza", pt: "Cabeleireiro e beleza", ru: "Парикмахерская и красота",
    zh: "美发与美容", ko: "헤어 & 뷰티", tr: "Kuaför ve güzellik", he: "שיער ויופי",
  },
  boutique: {
    fr: "Boutique", en: "Shop", ar: "المتجر", es: "Tienda", de: "Shop", it: "Negozio",
    pt: "Loja", ru: "Магазин", zh: "商店", ko: "숍", tr: "Mağaza", he: "חנות",
  },
  activites: {
    fr: "Activités & excursions", en: "Activities & tours", ar: "الأنشطة والرحلات", es: "Actividades y excursiones",
    de: "Aktivitäten & Ausflüge", it: "Attività ed escursioni", pt: "Atividades e passeios", ru: "Развлечения и экскурсии",
    zh: "活动与游览", ko: "액티비티 & 투어", tr: "Aktiviteler ve turlar", he: "פעילויות וסיורים",
  },
};

// The section type that IS the establishment's own catalog, per category —
// not offered again as an extra section, and used as its tab name.
const MAIN_KIND_BY_CATEGORY: Record<string, MenuSectionKind> = {
  hebergement: "hotel",
  restaurant: "restaurant",
  shopping: "boutique",
  activite: "activites",
};

export function menuSectionLabel(kind: MenuSectionKind, locale: string): string {
  return SECTION_LABELS[kind][locale] ?? SECTION_LABELS[kind].fr;
}

// The establishment's own catalog, as a tab next to its extra sections.
export function mainSectionLabel(categoryType: string | undefined | null, locale: string): string {
  const kind = categoryType ? MAIN_KIND_BY_CATEGORY[categoryType] : undefined;
  return kind ? menuSectionLabel(kind, locale) : qrFeatureLabel(categoryType, locale);
}

export function mainSectionKind(categoryType: string | undefined | null): MenuSectionKind | null {
  return (categoryType && MAIN_KIND_BY_CATEGORY[categoryType]) || null;
}

// Section types a pro can add on top of their main catalog.
export function availableSectionKinds(categoryType: string | undefined | null): MenuSectionKind[] {
  const main = mainSectionKind(categoryType);
  return MENU_SECTION_KINDS.filter((k) => k !== main);
}

type EditorStrings = {
  title: string;
  intro: string;
  typeLabel: string;
  add: string;
  remove: string;
  removeConfirm: string;
};

const EDITOR_STRINGS: Record<string, EditorStrings> = {
  fr: {
    title: "Autres sections du même QR code",
    intro: "Votre établissement a aussi un restaurant, un spa, un coiffeur… ? Ajoutez une section pour chacun : en scannant le même QR code, vos clients choisiront l'endroit qui les intéresse.",
    typeLabel: "Type de section",
    add: "Ajouter une section QR code",
    remove: "Retirer cette section",
    removeConfirm: "Retirer cette section et tous ses articles ? Pensez ensuite à enregistrer.",
  },
  en: {
    title: "Other sections on the same QR code",
    intro: "Does your business also have a restaurant, a spa, a hair salon…? Add a section for each: scanning the same QR code, your customers will choose the place they're interested in.",
    typeLabel: "Section type",
    add: "Add a QR code section",
    remove: "Remove this section",
    removeConfirm: "Remove this section and all its items? Remember to save afterwards.",
  },
  ar: {
    title: "أقسام أخرى في نفس رمز QR",
    intro: "هل لدى مؤسستك أيضًا مطعم أو سبا أو صالون حلاقة…؟ أضف قسمًا لكل منها: عند مسح نفس رمز QR سيختار عملاؤك المكان الذي يهمهم.",
    typeLabel: "نوع القسم",
    add: "إضافة قسم QR",
    remove: "إزالة هذا القسم",
    removeConfirm: "إزالة هذا القسم وجميع عناصره؟ لا تنسَ الحفظ بعد ذلك.",
  },
  es: {
    title: "Otras secciones del mismo código QR",
    intro: "¿Su establecimiento también tiene restaurante, spa, peluquería…? Añada una sección para cada uno: al escanear el mismo código QR, sus clientes elegirán el lugar que les interesa.",
    typeLabel: "Tipo de sección",
    add: "Añadir una sección QR",
    remove: "Quitar esta sección",
    removeConfirm: "¿Quitar esta sección y todos sus artículos? Recuerde guardar después.",
  },
  de: {
    title: "Weitere Bereiche im selben QR-Code",
    intro: "Hat Ihr Betrieb auch ein Restaurant, einen Spa, einen Friseur…? Fügen Sie für jeden einen Bereich hinzu: Mit demselben QR-Code wählen Ihre Kunden den Ort, der sie interessiert.",
    typeLabel: "Art des Bereichs",
    add: "QR-Bereich hinzufügen",
    remove: "Diesen Bereich entfernen",
    removeConfirm: "Diesen Bereich mit allen Einträgen entfernen? Denken Sie danach ans Speichern.",
  },
  it: {
    title: "Altre sezioni dello stesso codice QR",
    intro: "La tua attività ha anche un ristorante, una spa, un parrucchiere…? Aggiungi una sezione per ognuno: scansionando lo stesso codice QR, i clienti sceglieranno il luogo che li interessa.",
    typeLabel: "Tipo di sezione",
    add: "Aggiungi una sezione QR",
    remove: "Rimuovi questa sezione",
    removeConfirm: "Rimuovere questa sezione e tutti i suoi elementi? Ricorda poi di salvare.",
  },
  pt: {
    title: "Outras secções do mesmo código QR",
    intro: "O seu estabelecimento também tem restaurante, spa, cabeleireiro…? Adicione uma secção para cada um: ao ler o mesmo código QR, os seus clientes escolherão o local que lhes interessa.",
    typeLabel: "Tipo de secção",
    add: "Adicionar uma secção QR",
    remove: "Remover esta secção",
    removeConfirm: "Remover esta secção e todos os seus itens? Lembre-se de guardar depois.",
  },
  ru: {
    title: "Другие разделы того же QR-кода",
    intro: "В вашем заведении есть также ресторан, спа, парикмахерская…? Добавьте раздел для каждого: отсканировав тот же QR-код, клиенты выберут нужное место.",
    typeLabel: "Тип раздела",
    add: "Добавить раздел QR",
    remove: "Удалить этот раздел",
    removeConfirm: "Удалить этот раздел и все его позиции? Не забудьте затем сохранить.",
  },
  zh: {
    title: "同一二维码的其他板块",
    intro: "您的商家还有餐厅、水疗、美发等吗？为每一项添加一个板块：扫描同一个二维码，顾客即可选择感兴趣的地方。",
    typeLabel: "板块类型",
    add: "添加二维码板块",
    remove: "移除此板块",
    removeConfirm: "移除此板块及其所有项目？之后请记得保存。",
  },
  ko: {
    title: "같은 QR 코드의 다른 섹션",
    intro: "업장에 레스토랑, 스파, 미용실 등도 있나요? 각각 섹션을 추가하세요. 같은 QR 코드를 스캔하면 고객이 원하는 곳을 선택할 수 있습니다.",
    typeLabel: "섹션 유형",
    add: "QR 섹션 추가",
    remove: "이 섹션 삭제",
    removeConfirm: "이 섹션과 모든 항목을 삭제할까요? 삭제 후 저장하는 것을 잊지 마세요.",
  },
  tr: {
    title: "Aynı QR koddaki diğer bölümler",
    intro: "İşletmenizin restoranı, spası, kuaförü… da mı var? Her biri için bir bölüm ekleyin: aynı QR kodu tarayan müşterileriniz ilgilendikleri yeri seçecek.",
    typeLabel: "Bölüm türü",
    add: "QR bölümü ekle",
    remove: "Bu bölümü kaldır",
    removeConfirm: "Bu bölüm ve tüm öğeleri kaldırılsın mı? Ardından kaydetmeyi unutmayın.",
  },
  he: {
    title: "חלקים נוספים באותו קוד QR",
    intro: "יש בעסק שלכם גם מסעדה, ספא, מספרה…? הוסיפו חלק לכל אחד מהם: בסריקת אותו קוד QR הלקוחות יבחרו את המקום שמעניין אותם.",
    typeLabel: "סוג החלק",
    add: "הוספת חלק QR",
    remove: "הסרת חלק זה",
    removeConfirm: "להסיר את החלק הזה ואת כל הפריטים שבו? זכרו לשמור לאחר מכן.",
  },
};

export function menuSectionsEditorStrings(locale: string): EditorStrings {
  return EDITOR_STRINGS[locale] ?? EDITOR_STRINGS.fr;
}

// Only accommodation offers extra sections for now (a hotel's restaurant,
// spa, hair salon...) — widen here to open it to other categories.
export function offersMenuSections(categoryType: string | undefined | null): boolean {
  return categoryType === "hebergement";
}
