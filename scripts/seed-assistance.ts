import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { cities, emergencyContacts, contentPages, modules } from "../src/db/schema";

const db = getDb();

const VERIFY_FR = "⚠️ Numéro à vérifier/compléter par l'équipe WeTravelGo.";
const VERIFY_EN = "⚠️ Number to be verified/completed by the WeTravelGo team.";
const VERIFY_AR = "⚠️ يجب التحقق من هذا الرقم وإكماله من طرف فريق WeTravelGo.";

async function main() {
  const [essaouira] = await db.select().from(cities).where(eq(cities.slug, "essaouira"));
  if (!essaouira) throw new Error('City "essaouira" not found — run the city backfill first.');
  const cityId = essaouira.id;

  console.log("Seeding emergency contacts...");
  await db
    .insert(emergencyContacts)
    .values(EMERGENCY_CONTACTS_SEED.map((v) => ({ ...v, cityId })))
    .onConflictDoNothing();

  console.log("Seeding practical guides (assistance-guides content pages)...");
  await db
    .insert(contentPages)
    .values(ASSISTANCE_GUIDES_SEED.map((v) => ({ ...v, cityId })))
    .onConflictDoNothing();

  console.log("Adding assistance module...");
  await db.insert(modules).values({ key: "assistance", status: "active" }).onConflictDoNothing();

  console.log("Done. IMPORTANT: several entries need real local phone numbers/addresses — check /admin/assistance.");
}

const EMERGENCY_CONTACTS_SEED = [
      // Urgences — national Morocco emergency numbers (verified, work everywhere incl. Essaouira)
      {
        category: "urgences",
        name: { fr: "Police secours", en: "Police emergency", ar: "الشرطة (طوارئ)" },
        phone: "19",
        hours: { fr: "24h/24", en: "24/7", ar: "24/24" },
        featured: true,
        order: 1,
      },
      {
        category: "urgences",
        name: { fr: "Protection civile (Pompiers / Ambulance)", en: "Civil Protection (Fire / Ambulance)", ar: "الوقاية المدنية (الإطفاء / الإسعاف)" },
        phone: "15",
        hours: { fr: "24h/24", en: "24/7", ar: "24/24" },
        featured: true,
        order: 2,
      },
      {
        category: "urgences",
        name: { fr: "Gendarmerie Royale", en: "Royal Gendarmerie", ar: "الدرك الملكي" },
        phone: "177",
        hours: { fr: "24h/24", en: "24/7", ar: "24/24" },
        featured: true,
        order: 3,
      },
      {
        category: "sante",
        name: { fr: "Hôpital Mohammed V (Essaouira)", en: "Mohammed V Hospital (Essaouira)", ar: "مستشفى محمد الخامس (الصويرة)" },
        address: "Essaouira",
        phone: "",
        notes: { fr: VERIFY_FR, en: VERIFY_EN, ar: VERIFY_AR },
        featured: true,
        order: 1,
      },
      {
        category: "sante",
        name: { fr: "Pharmacie de garde", en: "On-duty pharmacy", ar: "صيدلية الحراسة" },
        notes: {
          fr: "Le planning des pharmacies de garde change chaque semaine. " + VERIFY_FR,
          en: "The on-duty pharmacy schedule changes weekly. " + VERIFY_EN,
          ar: "يتغير جدول صيدليات الحراسة أسبوعياً. " + VERIFY_AR,
        },
        order: 2,
      },
      {
        category: "securite",
        name: { fr: "Commissariat central d'Essaouira", en: "Essaouira Central Police Station", ar: "المفوضية المركزية للصويرة" },
        address: "Essaouira",
        notes: { fr: VERIFY_FR, en: VERIFY_EN, ar: VERIFY_AR },
        order: 1,
      },
      {
        category: "argent",
        name: { fr: "Distributeurs automatiques (banques)", en: "ATMs (banks)", ar: "أجهزة الصراف الآلي" },
        notes: {
          fr: "Plusieurs banques (Attijariwafa Bank, BMCE, Banque Populaire...) ont des agences avec DAB dans la médina et l'avenue Mohammed V.",
          en: "Several banks (Attijariwafa, BMCE, Banque Populaire...) have branches with ATMs in the medina and Avenue Mohammed V.",
          ar: "تتوفر عدة بنوك (التجاري وفا بنك، البنك المغربي للتجارة الخارجية...) بوكالات وأجهزة صراف آلي في المدينة القديمة وشارع محمد الخامس.",
        },
        order: 1,
      },
      {
        category: "transport",
        name: { fr: "Station de taxis — Place Moulay Hassan", en: "Taxi stand — Place Moulay Hassan", ar: "محطة سيارات الأجرة - ساحة مولاي حسن" },
        address: "Place Moulay Hassan, Essaouira",
        order: 1,
      },
      {
        category: "telephone",
        name: { fr: "Opérateurs (Maroc Telecom, Orange, Inwi)", en: "Carriers (Maroc Telecom, Orange, Inwi)", ar: "المشغلون (اتصالات المغرب، أورونج، إنوي)" },
        notes: {
          fr: "Cartes SIM prépayées en vente dans les boutiques des opérateurs et la plupart des kiosques.",
          en: "Prepaid SIM cards sold at carrier shops and most kiosks.",
          ar: "بطاقات SIM مسبقة الدفع متوفرة في محلات المشغلين ومعظم الأكشاك.",
        },
        order: 1,
      },
];

const ASSISTANCE_GUIDES_SEED = [
      {
        section: "assistance-guides",
        slug: "passeport-perdu",
        order: 1,
        title: { fr: "J'ai perdu mon passeport", en: "I lost my passport", ar: "فقدت جواز سفري" },
        body: {
          fr: "1. Déclarez la perte au commissariat le plus proche (obligatoire) pour obtenir une déclaration de perte.\n2. Contactez votre ambassade ou consulat pour un passeport temporaire ou de retour.\n3. Gardez une copie numérique de votre passeport (photo sur votre téléphone ou email) pour accélérer les démarches.",
          en: "1. Report the loss at the nearest police station (mandatory) to get a loss statement.\n2. Contact your embassy or consulate for an emergency travel document.\n3. Keep a digital copy of your passport (photo on your phone or email) to speed up the process.",
          ar: "1. أبلغ عن الفقدان في أقرب مفوضية شرطة (إلزامي) للحصول على تصريح بالفقدان.\n2. اتصل بسفارتك أو قنصليتك للحصول على وثيقة سفر مؤقتة.\n3. احتفظ بنسخة رقمية من جواز سفرك (صورة على هاتفك أو بريدك الإلكتروني) لتسريع الإجراءات.",
        },
      },
      {
        section: "assistance-guides",
        slug: "vol-telephone",
        order: 2,
        title: { fr: "Je me suis fait voler mon téléphone", en: "My phone was stolen", ar: "سُرق هاتفي" },
        body: {
          fr: "1. Rendez-vous au commissariat pour déposer plainte (nécessaire pour les assurances).\n2. Bloquez votre carte SIM auprès de votre opérateur.\n3. Verrouillez ou effacez votre téléphone à distance si possible (Localiser mon iPhone / Find My Device).\n4. Changez les mots de passe de vos comptes sensibles.",
          en: "1. Go to the police station to file a report (needed for insurance).\n2. Block your SIM card with your carrier.\n3. Remotely lock or erase your phone if possible (Find My iPhone / Find My Device).\n4. Change passwords on sensitive accounts.",
          ar: "1. توجه إلى المفوضية لتقديم شكوى (ضروري للتأمين).\n2. قم بحظر بطاقة SIM لدى المشغل الخاص بك.\n3. قفل أو مسح هاتفك عن بعد إن أمكن.\n4. غيّر كلمات مرور حساباتك الحساسة.",
        },
      },
      {
        section: "assistance-guides",
        slug: "accident",
        order: 3,
        title: { fr: "J'ai eu un accident", en: "I had an accident", ar: "تعرضت لحادث" },
        body: {
          fr: "1. Appelez immédiatement le 15 (Protection civile) ou le 19 (Police) selon la gravité.\n2. Sécurisez la zone si possible.\n3. En cas d'accident de la route, ne déplacez pas les véhicules avant l'arrivée de la police (sauf urgence vitale) et échangez les constats d'assurance.\n4. Contactez votre assurance voyage si vous en avez une.",
          en: "1. Call 15 (Civil Protection) or 19 (Police) immediately depending on severity.\n2. Secure the area if possible.\n3. For a road accident, don't move vehicles before police arrival (unless life-threatening) and exchange insurance information.\n4. Contact your travel insurance if you have one.",
          ar: "1. اتصل فوراً بـ 15 (الوقاية المدنية) أو 19 (الشرطة) حسب خطورة الحادث.\n2. أمّن المنطقة إن أمكن.\n3. في حادث سير، لا تحرك المركبات قبل وصول الشرطة (إلا في حالة خطر على الحياة) وتبادل معلومات التأمين.\n4. اتصل بشركة تأمين السفر الخاصة بك إن وجدت.",
        },
      },
      {
        section: "assistance-guides",
        slug: "malade",
        order: 4,
        title: { fr: "Je suis malade", en: "I am sick", ar: "أنا مريض" },
        body: {
          fr: "1. Pour une urgence vitale, appelez le 15.\n2. Pour une consultation non urgente, rendez-vous dans une clinique privée ou un cabinet médical (voir section Santé).\n3. La plupart des cliniques privées d'Essaouira acceptent les patients internationaux en paiement direct — gardez vos factures pour le remboursement par votre assurance voyage.",
          en: "1. For a life-threatening emergency, call 15.\n2. For a non-urgent consultation, go to a private clinic or doctor's office (see Health section).\n3. Most private clinics in Essaouira accept international patients on direct payment — keep your invoices for travel insurance reimbursement.",
          ar: "1. في حالة الطوارئ التي تهدد الحياة، اتصل بـ 15.\n2. للاستشارة غير العاجلة، توجه إلى عيادة خاصة أو طبيب (انظر قسم الصحة).\n3. تقبل معظم العيادات الخاصة في الصويرة المرضى الدوليين بالدفع المباشر — احتفظ بفواتيرك لاسترجاع المبلغ من تأمين سفرك.",
        },
      },
      {
        section: "assistance-guides",
        slug: "bagages-perdus",
        order: 5,
        title: { fr: "J'ai perdu mes bagages", en: "I lost my luggage", ar: "فقدت أمتعتي" },
        body: {
          fr: "1. Si c'est à l'aéroport, déclarez immédiatement la perte au comptoir de votre compagnie aérienne avant de quitter la zone bagages.\n2. Conservez votre carte d'embarquement et votre étiquette de bagage.\n3. Demandez un numéro de suivi (PIR) pour suivre votre dossier.",
          en: "1. If at the airport, report the loss immediately at your airline's counter before leaving the baggage area.\n2. Keep your boarding pass and baggage tag.\n3. Ask for a tracking number (PIR) to follow up on your case.",
          ar: "1. إذا كان في المطار، أبلغ فوراً عن الفقدان في مكتب شركة الطيران قبل مغادرة منطقة الأمتعة.\n2. احتفظ ببطاقة الصعود إلى الطائرة وملصق الأمتعة.\n3. اطلب رقم تتبع لمتابعة ملفك.",
        },
      },
      {
        section: "assistance-guides",
        slug: "avocat-traducteur",
        order: 6,
        title: { fr: "J'ai besoin d'un avocat ou d'un traducteur", en: "I need a lawyer or a translator", ar: "أحتاج محامياً أو مترجماً" },
        body: {
          fr: "1. Votre ambassade ou consulat peut vous fournir une liste d'avocats et de traducteurs assermentés locaux.\n2. Le barreau d'Essaouira/Marrakech peut orienter vers un avocat disponible.\n3. En cas d'urgence, l'équipe WeTravelGo peut vous aider à trouver un contact — utilisez le bouton SOS.",
          en: "1. Your embassy or consulate can provide a list of local sworn lawyers and translators.\n2. The Essaouira/Marrakech bar association can direct you to an available lawyer.\n3. In an emergency, the WeTravelGo team can help you find a contact — use the SOS button.",
          ar: "1. يمكن لسفارتك أو قنصليتك تزويدك بقائمة من المحامين والمترجمين المحلفين المحليين.\n2. يمكن لنقابة المحامين بالصويرة/مراكش توجيهك إلى محامٍ متاح.\n3. في حالة الطوارئ، يمكن لفريق WeTravelGo مساعدتك في إيجاد جهة اتصال — استخدم زر SOS.",
        },
      },
];

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
