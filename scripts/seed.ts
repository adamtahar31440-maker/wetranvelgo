import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import {
  cities,
  categories,
  establishments,
  contentPages,
} from "../src/db/schema";

const db = getDb();

const img = (seed: string, n: number) =>
  Array.from({ length: n }, (_, i) => `https://picsum.photos/seed/${seed}-${i}/900/600`);

async function main() {
  const [essaouira] = await db.select().from(cities).where(eq(cities.slug, "essaouira"));
  if (!essaouira) throw new Error('City "essaouira" not found — run the city backfill first.');
  const cityId = essaouira.id;

  console.log("Seeding categories...");
  const catRows = await db
    .insert(categories)
    .values([
      { type: "hebergement", slug: "hebergements", name: { fr: "Hébergements", en: "Stays", ar: "الإقامة" }, icon: "bed", order: 1 },
      { type: "restaurant", slug: "restaurants", name: { fr: "Restaurants", en: "Restaurants", ar: "المطاعم" }, icon: "utensils", order: 2 },
      { type: "activite", slug: "activites", name: { fr: "Activités", en: "Activities", ar: "الأنشطة" }, icon: "waves", order: 3 },
      { type: "shopping", slug: "shopping", name: { fr: "Shopping", en: "Shopping", ar: "التسوق" }, icon: "shopping-bag", order: 4 },
    ])
    .onConflictDoNothing()
    .returning();

  const catByType: Record<string, number> = {};
  const existing = await db.select().from(categories);
  for (const c of existing) catByType[c.type] = c.id;

  console.log("Seeding establishments...");
  const est = [
    {
      categoryId: catByType.hebergement,
      subcategory: "riad",
      slug: "riad-dar-safran",
      name: { fr: "Riad Dar Safran", en: "Riad Dar Safran", ar: "رياض دار الزعفران" },
      description: {
        fr: "Un riad traditionnel rénové au cœur de la médina, avec patio, terrasse vue océan et chambres décorées à l'artisanat local.",
        en: "A traditional riad renovated in the heart of the medina, with a patio, ocean-view terrace and rooms decorated with local craftsmanship.",
        ar: "رياض تقليدي مجدد في قلب المدينة القديمة، بفناء وتراس بإطلالة على المحيط وغرف مزينة بالحرف اليدوية المحلية.",
      },
      address: "12 Rue Sidi Mohamed Ben Abdellah, Médina, Essaouira",
      lat: 31.5131, lng: -9.7679,
      phone: "+212 524 47 00 00", whatsapp: "+212 661 00 00 01",
      website: "https://example.com/riad-dar-safran", instagram: "https://instagram.com/riaddarsafran",
      hours: { fr: "Réception ouverte 24h/24", en: "Front desk open 24/7", ar: "الاستقبال مفتوح 24/24" },
      priceLevel: "€€", services: { fr: ["Petit-déjeuner inclus", "Terrasse", "Hammam privé"], en: ["Breakfast included", "Terrace", "Private hammam"], ar: ["فطور مشمول", "تراس", "حمام خاص"] },
      parking: false, wifi: true, accessibility: false,
      ourReview: { fr: "Un cadre authentique et calme, idéal pour un séjour romantique en médina.", en: "An authentic, quiet setting, ideal for a romantic stay in the medina.", ar: "أجواء أصيلة وهادئة، مثالية لإقامة رومانسية في المدينة القديمة." },
      faq: [{ q: { fr: "Le riad est-il accessible en voiture ?", en: "Is the riad accessible by car?", ar: "هل يمكن الوصول بالسيارة؟" }, a: { fr: "La médina est piétonne, un porteur peut vous accueillir à l'entrée la plus proche.", en: "The medina is pedestrian-only, a porter can meet you at the nearest gate.", ar: "المدينة القديمة مخصصة للمشاة، يمكن لحمّال استقبالك عند أقرب باب." } }],
      images: img("riad-safran", 5), featured: true, badge: "Partenaire",
    },
    {
      categoryId: catByType.hebergement,
      subcategory: "hotel",
      slug: "hotel-atlantic-essaouira",
      name: { fr: "Hôtel Atlantic Essaouira", en: "Atlantic Essaouira Hotel", ar: "فندق أطلانتيك الصويرة" },
      description: { fr: "Hôtel moderne face à l'océan avec piscine, spa et restaurant panoramique.", en: "Modern ocean-facing hotel with pool, spa and panoramic restaurant.", ar: "فندق حديث يطل على المحيط مع مسبح وسبا ومطعم بانورامي." },
      address: "Avenue Mohammed V, Essaouira",
      lat: 31.5051, lng: -9.7712,
      phone: "+212 524 47 11 22", whatsapp: "+212 661 00 00 02",
      website: "https://example.com/hotel-atlantic",
      hours: { fr: "Réception ouverte 24h/24", en: "Front desk open 24/7", ar: "الاستقبال مفتوح 24/24" },
      priceLevel: "€€€", services: { fr: ["Piscine", "Spa", "Salle de sport"], en: ["Pool", "Spa", "Gym"], ar: ["مسبح", "سبا", "قاعة رياضية"] },
      parking: true, wifi: true, accessibility: true,
      ourReview: { fr: "Excellent rapport confort/prix avec une vue imprenable sur l'Atlantique.", en: "Excellent comfort-to-price ratio with a stunning Atlantic view.", ar: "نسبة راحة إلى سعر ممتازة مع إطلالة رائعة على الأطلسي." },
      faq: [], images: img("hotel-atlantic", 5), featured: true, badge: null,
    },
    {
      categoryId: catByType.hebergement,
      subcategory: "maison-hote",
      slug: "maison-hote-bab-marrakech",
      name: { fr: "Maison d'hôtes Bab Marrakech", en: "Bab Marrakech Guesthouse", ar: "دار الضيافة باب مراكش" },
      description: { fr: "Petite maison d'hôtes conviviale tenue par une famille locale, près de Bab Marrakech.", en: "Cosy family-run guesthouse near Bab Marrakech.", ar: "دار ضيافة عائلية دافئة قرب باب مراكش." },
      address: "5 Derb Laalouj, Essaouira", lat: 31.5117, lng: -9.7658,
      phone: "+212 524 47 22 33", whatsapp: "+212 661 00 00 03", website: null,
      hours: { fr: "Réception 8h-22h", en: "Front desk 8am-10pm", ar: "الاستقبال 8-22" },
      priceLevel: "€", services: { fr: ["Petit-déjeuner marocain", "Terrasse commune"], en: ["Moroccan breakfast", "Shared terrace"], ar: ["فطور مغربي", "تراس مشترك"] },
      parking: false, wifi: true, accessibility: false,
      ourReview: { fr: "Accueil chaleureux et prix très raisonnable, parfait pour les voyageurs solo.", en: "Warm welcome and very fair prices, perfect for solo travellers.", ar: "استقبال دافئ وأسعار معقولة جداً، مثالية للمسافرين المنفردين." },
      faq: [], images: img("bab-marrakech", 4), featured: false, badge: null,
    },
    {
      categoryId: catByType.restaurant,
      subcategory: "poisson",
      slug: "restaurant-la-table-du-port",
      name: { fr: "La Table du Port", en: "La Table du Port", ar: "مائدة الميناء" },
      description: { fr: "Poissons et fruits de mer grillés servis face aux bateaux bleus du port.", en: "Grilled fish and seafood served facing the port's blue boats.", ar: "أسماك ومأكولات بحرية مشوية تُقدم أمام القوارب الزرقاء بالميناء." },
      address: "Port de pêche, Essaouira", lat: 31.5076, lng: -9.7699,
      phone: "+212 524 47 33 44", whatsapp: "+212 661 00 00 04", website: "https://example.com/table-du-port",
      hours: { fr: "12h-15h / 19h-22h30, fermé le lundi", en: "12-3pm / 7-10:30pm, closed Mondays", ar: "12-15 / 19-22:30، مغلق الاثنين" },
      priceLevel: "€€", services: { fr: ["Terrasse vue port", "Poisson du jour"], en: ["Port-view terrace", "Catch of the day"], ar: ["تراس بإطلالة على الميناء", "صيد اليوم"] },
      parking: false, wifi: false, accessibility: true,
      ourReview: { fr: "Le meilleur poisson grillé de la ville, à des prix justes.", en: "The best grilled fish in town, at fair prices.", ar: "أفضل سمك مشوي في المدينة وبأسعار عادلة." },
      faq: [], images: img("table-port", 5), featured: true, badge: "Partenaire",
    },
    {
      categoryId: catByType.restaurant,
      subcategory: "marocain",
      slug: "restaurant-dar-mama",
      name: { fr: "Dar Mama", en: "Dar Mama", ar: "دار ماما" },
      description: { fr: "Cuisine marocaine traditionnelle façon maison dans un cadre chaleureux.", en: "Traditional home-style Moroccan cuisine in a warm setting.", ar: "مطبخ مغربي تقليدي على الطريقة المنزلية في أجواء دافئة." },
      address: "2 Rue Houmman El Fetouaki, Essaouira", lat: 31.5127, lng: -9.7691,
      phone: "+212 524 47 44 55", whatsapp: "+212 661 00 00 05", website: null,
      hours: { fr: "12h-22h tous les jours", en: "12pm-10pm daily", ar: "12-22 يومياً" },
      priceLevel: "€", services: { fr: ["Tajines", "Couscous du vendredi"], en: ["Tagines", "Friday couscous"], ar: ["طاجين", "كسكس الجمعة"] },
      parking: false, wifi: true, accessibility: false,
      ourReview: { fr: "Une adresse familiale incontournable pour un vrai tajine fait maison.", en: "A must-visit family address for a real home-made tagine.", ar: "عنوان عائلي لا بد منه لتذوق طاجين منزلي أصيل." },
      faq: [], images: img("dar-mama", 4), featured: false, badge: null,
    },
    {
      categoryId: catByType.restaurant,
      subcategory: "cafe",
      slug: "cafe-des-arts",
      name: { fr: "Café des Arts", en: "Café des Arts", ar: "مقهى الفنون" },
      description: { fr: "Café-galerie branché, bon endroit pour un café et du travail au calme.", en: "Trendy café-gallery, great spot for coffee and quiet work.", ar: "مقهى-معرض عصري، مكان رائع للقهوة والعمل الهادئ." },
      address: "Place Moulay Hassan, Essaouira", lat: 31.5106, lng: -9.7701,
      phone: "+212 524 47 55 66", whatsapp: null, website: null,
      hours: { fr: "8h-20h", en: "8am-8pm", ar: "8-20" },
      priceLevel: "€", services: { fr: ["Wi-Fi rapide", "Pâtisseries maison"], en: ["Fast Wi-Fi", "Home-made pastries"], ar: ["واي فاي سريع", "حلويات منزلية"] },
      parking: false, wifi: true, accessibility: true,
      ourReview: { fr: "Idéal pour une pause avec vue sur la place principale.", en: "Ideal for a break overlooking the main square.", ar: "مثالي لاستراحة بإطلالة على الساحة الرئيسية." },
      faq: [], images: img("cafe-arts", 3), featured: false, badge: null,
    },
    {
      categoryId: catByType.activite,
      subcategory: "surf",
      slug: "essaouira-surf-school",
      name: { fr: "Essaouira Surf School", en: "Essaouira Surf School", ar: "مدرسة الصويرة لركوب الأمواج" },
      description: { fr: "Cours de surf pour tous niveaux sur les plages venteuses d'Essaouira.", en: "Surf lessons for all levels on Essaouira's windy beaches.", ar: "دروس ركوب الأمواج لجميع المستويات على شواطئ الصويرة العاصفة." },
      address: "Plage d'Essaouira, Diabat", lat: 31.4735, lng: -9.7757,
      phone: "+212 524 47 66 77", whatsapp: "+212 661 00 00 06", website: "https://example.com/surf-school",
      hours: { fr: "9h-18h", en: "9am-6pm", ar: "9-18" },
      priceLevel: "€€", services: { fr: ["Location matériel", "Cours particuliers", "Stages semaine"], en: ["Equipment rental", "Private lessons", "Weekly packages"], ar: ["تأجير المعدات", "دروس خاصة", "برامج أسبوعية"] },
      parking: true, wifi: false, accessibility: false,
      ourReview: { fr: "Moniteurs pédagogues, parfait pour débuter en toute sécurité.", en: "Great teaching instructors, perfect for a safe start.", ar: "مدربون محترفون، مثالي للبدء بأمان." },
      faq: [], images: img("surf-school", 5), featured: true, badge: "Partenaire",
    },
    {
      categoryId: catByType.activite,
      subcategory: "hammam",
      slug: "hammam-heritage-spa",
      name: { fr: "Hammam Heritage Spa", en: "Hammam Heritage Spa", ar: "حمام هيريتاج سبا" },
      description: { fr: "Hammam traditionnel et soins au savon noir et argan dans un cadre raffiné.", en: "Traditional hammam with black soap and argan treatments in a refined setting.", ar: "حمام تقليدي وعلاجات بالصابون الأسود والأرغان في أجواء أنيقة." },
      address: "Rue Mohamed El Qorry, Essaouira", lat: 31.5121, lng: -9.7669,
      phone: "+212 524 47 77 88", whatsapp: "+212 661 00 00 07", website: null,
      hours: { fr: "10h-20h", en: "10am-8pm", ar: "10-20" },
      priceLevel: "€€", services: { fr: ["Gommage", "Massage à l'huile d'argan"], en: ["Scrub", "Argan oil massage"], ar: ["تقشير", "تدليك بزيت الأرغان"] },
      parking: false, wifi: false, accessibility: false,
      ourReview: { fr: "Un vrai moment de détente, personnel très professionnel.", en: "A true moment of relaxation, very professional staff.", ar: "لحظة استرخاء حقيقية، طاقم محترف جداً." },
      faq: [], images: img("hammam-heritage", 4), featured: false, badge: null,
    },
    {
      categoryId: catByType.activite,
      subcategory: "excursion",
      slug: "excursion-vallee-argan",
      name: { fr: "Excursion Vallée de l'Argan", en: "Argan Valley Excursion", ar: "رحلة وادي الأركان" },
      description: { fr: "Journée découverte des coopératives d'argan et des chèvres perchées dans les arganiers.", en: "Day trip discovering argan cooperatives and goats climbing argan trees.", ar: "رحلة يوم لاكتشاف تعاونيات الأركان والماعز المتسلقة لأشجار الأركان." },
      address: "Départ Place Moulay Hassan, Essaouira", lat: 31.5106, lng: -9.7701,
      phone: "+212 524 47 88 99", whatsapp: "+212 661 00 00 08", website: "https://example.com/excursion-argan",
      hours: { fr: "Départ 9h, retour 17h", en: "Departure 9am, return 5pm", ar: "الانطلاق 9، العودة 17" },
      priceLevel: "€€", services: { fr: ["Transport inclus", "Guide francophone/anglophone"], en: ["Transport included", "French/English speaking guide"], ar: ["النقل مشمول", "دليل بالفرنسية/الإنجليزية"] },
      parking: true, wifi: false, accessibility: false,
      ourReview: { fr: "Une belle sortie hors des sentiers battus, en petit groupe.", en: "A great off-the-beaten-path outing in a small group.", ar: "رحلة جميلة بعيدة عن الزحام في مجموعة صغيرة." },
      faq: [], images: img("vallee-argan", 4), featured: false, badge: null,
    },
    {
      categoryId: catByType.shopping,
      subcategory: "bois-thuya",
      slug: "atelier-marqueterie-thuya",
      name: { fr: "Atelier Marqueterie de Thuya", en: "Thuya Marquetry Workshop", ar: "ورشة خشب العرعار" },
      description: { fr: "Coopérative d'artisans travaillant le bois de thuya, savoir-faire local unique au monde.", en: "Cooperative of craftsmen working thuya wood, unique local know-how.", ar: "تعاونية حرفيين يعملون خشب العرعار، خبرة محلية فريدة في العالم." },
      address: "Rue de la Skala, Médina, Essaouira", lat: 31.5147, lng: -9.7716,
      phone: "+212 524 47 99 00", whatsapp: "+212 661 00 00 09", website: null,
      hours: { fr: "9h-19h", en: "9am-7pm", ar: "9-19" },
      priceLevel: "€€", services: { fr: ["Démonstration en direct", "Expédition à l'étranger"], en: ["Live demonstration", "International shipping"], ar: ["عرض مباشر", "شحن دولي"] },
      parking: false, wifi: false, accessibility: false,
      ourReview: { fr: "Un artisanat authentique à voir absolument, prix négociables.", en: "Authentic craftsmanship not to be missed, prices negotiable.", ar: "حرفة أصيلة يجب مشاهدتها، الأسعار قابلة للتفاوض." },
      faq: [], images: img("thuya-workshop", 5), featured: true, badge: "Partenaire",
    },
    {
      categoryId: catByType.shopping,
      subcategory: "bijoux",
      slug: "bijouterie-argent-medina",
      name: { fr: "Bijouterie Argent Médina", en: "Medina Silver Jewellery", ar: "مجوهرات الفضة بالمدينة" },
      description: { fr: "Bijoux artisanaux en argent et pierres locales, créations uniques.", en: "Handcrafted silver jewellery with local stones, unique pieces.", ar: "مجوهرات فضية يدوية بأحجار محلية، قطع فريدة." },
      address: "Souk Joutia, Médina, Essaouira", lat: 31.5124, lng: -9.7686,
      phone: "+212 524 47 10 11", whatsapp: "+212 661 00 00 10", website: null,
      hours: { fr: "9h30-19h30", en: "9:30am-7:30pm", ar: "9:30-19:30" },
      priceLevel: "€", services: { fr: ["Sur-mesure", "Gravure"], en: ["Custom pieces", "Engraving"], ar: ["حسب الطلب", "نقش"] },
      parking: false, wifi: false, accessibility: false,
      ourReview: { fr: "Un choix de bijoux originaux, à des prix très corrects.", en: "A great choice of original jewellery, very fair prices.", ar: "تشكيلة مجوهرات أصلية، بأسعار جيدة جداً." },
      faq: [], images: img("bijoux-medina", 3), featured: false, badge: null,
    },
  ];

  for (const e of est) {
    await db.insert(establishments).values({ ...e, cityId } as any).onConflictDoNothing();
  }

  console.log("Seeding content pages...");
  await db.insert(contentPages).values([
    {
      cityId, section: "decouvrir", slug: "histoire", order: 1,
      title: { fr: "Histoire d'Essaouira", en: "History of Essaouira", ar: "تاريخ الصويرة" },
      body: { fr: "Fondée au XVIIIe siècle par le sultan Mohammed III, Essaouira (anciennement Mogador) fut conçue comme un port stratégique ouvert sur l'Europe...", en: "Founded in the 18th century by Sultan Mohammed III, Essaouira (formerly Mogador) was designed as a strategic port open to Europe...", ar: "تأسست الصويرة في القرن الثامن عشر على يد السلطان محمد الثالث، وكانت (المعروفة سابقاً بموكادور) مصممة كميناء استراتيجي منفتح على أوروبا..." },
      coverImage: img("histoire", 1)[0],
    },
    {
      cityId, section: "decouvrir", slug: "medina", order: 2,
      title: { fr: "La Médina", en: "The Medina", ar: "المدينة القديمة" },
      body: { fr: "Classée au patrimoine mondial de l'UNESCO, la médina d'Essaouira séduit par ses ruelles blanches et bleues, ses remparts et ses souks animés...", en: "Listed as a UNESCO World Heritage site, Essaouira's medina charms with its blue-and-white alleys, ramparts and lively souks...", ar: "المدرجة في التراث العالمي لليونسكو، تسحر المدينة القديمة بأزقتها البيضاء والزرقاء وأسوارها وأسواقها النابضة بالحياة..." },
      coverImage: img("medina", 1)[0],
    },
    {
      cityId, section: "decouvrir", slug: "plages", order: 3,
      title: { fr: "Les Plages", en: "The Beaches", ar: "الشواطئ" },
      body: { fr: "La grande plage d'Essaouira s'étend sur plusieurs kilomètres, idéale pour le vent, le surf et les balades à cheval ou à chameau...", en: "Essaouira's long beach stretches for several kilometres, ideal for wind sports, surfing and horse or camel rides...", ar: "يمتد شاطئ الصويرة الكبير على مسافة عدة كيلومترات، وهو مثالي للرياضات الهوائية وركوب الأمواج والخيل أو الجمال..." },
      coverImage: img("plages", 1)[0],
    },
    {
      cityId, section: "decouvrir", slug: "culture", order: 4,
      title: { fr: "Culture et Artisanat", en: "Culture and Crafts", ar: "الثقافة والحرف اليدوية" },
      body: { fr: "Essaouira est un carrefour culturel où se mêlent musique gnaoua, arts plastiques et artisanat du bois de thuya...", en: "Essaouira is a cultural crossroads blending Gnaoua music, visual arts and thuya woodcraft...", ar: "الصويرة ملتقى ثقافي يمزج بين موسيقى كناوة والفنون التشكيلية والحرف اليدوية لخشب العرعار..." },
      coverImage: img("culture", 1)[0],
    },
    {
      cityId, section: "vivre", slug: "cout-de-la-vie", order: 1,
      title: { fr: "Coût de la vie à Essaouira", en: "Cost of living in Essaouira", ar: "تكلفة المعيشة في الصويرة" },
      body: { fr: "Le coût de la vie à Essaouira reste abordable comparé à l'Europe : logement, alimentation et transport à des prix raisonnables...", en: "The cost of living in Essaouira remains affordable compared to Europe: housing, food and transport at reasonable prices...", ar: "تظل تكلفة المعيشة في الصويرة معقولة مقارنة بأوروبا: السكن والغذاء والنقل بأسعار معقولة..." },
      coverImage: img("cout-vie", 1)[0],
    },
    {
      cityId, section: "vivre", slug: "sante", order: 2,
      title: { fr: "Santé à Essaouira", en: "Healthcare in Essaouira", ar: "الصحة في الصويرة" },
      body: { fr: "Essaouira dispose d'un hôpital public, de cliniques privées et de pharmacies de garde pour les résidents et expatriés...", en: "Essaouira has a public hospital, private clinics and on-call pharmacies for residents and expats...", ar: "تتوفر الصويرة على مستشفى عمومي وعيادات خاصة وصيدليات للحراسة للسكان والمقيمين الأجانب..." },
      coverImage: img("sante", 1)[0],
    },
  ]).onConflictDoNothing();

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
