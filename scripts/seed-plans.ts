import { getDb } from "../src/db";
import { subscriptionPlans, modules } from "../src/db/schema";

const db = getDb();

// Annual price = 10 months (2 months offered), rounded.
async function main() {
  console.log("Seeding subscription plans...");
  await db
    .insert(subscriptionPlans)
    .values([
      {
        key: "starter",
        name: { fr: "Starter", en: "Starter", ar: "ستارتر" },
        priceMonthlyMad: 0,
        priceYearlyMad: 0,
        maxPhotos: 5,
        features: {
          fr: ["1 fiche établissement", "Description", "Coordonnées", "Carte", "Horaires", "5 photos", "Catégorie principale"],
          en: ["1 listing", "Description", "Contact info", "Map", "Opening hours", "5 photos", "Main category"],
          ar: ["بطاقة مؤسسة واحدة", "وصف", "معلومات الاتصال", "خريطة", "ساعات العمل", "5 صور", "فئة رئيسية"],
        },
        order: 1,
      },
      {
        key: "premium",
        name: { fr: "Premium", en: "Premium", ar: "بريميوم" },
        priceMonthlyMad: 490,
        priceYearlyMad: 4900,
        maxPhotos: 30,
        features: {
          fr: ["Jusqu'à 30 photos", "Galerie complète", "Réseaux sociaux", "WhatsApp", "Promotions", "Statistiques détaillées", "Badge Partenaire Premium", "Priorité dans les résultats", "Formulaire de contact", "Lien site internet", "Mise en avant locale"],
          en: ["Up to 30 photos", "Full gallery", "Social links", "WhatsApp", "Promotions", "Detailed stats", "Premium Partner badge", "Priority in results", "Contact form", "Website link", "Local featuring"],
          ar: ["حتى 30 صورة", "معرض كامل", "شبكات اجتماعية", "واتساب", "عروض ترويجية", "إحصائيات مفصلة", "شارة شريك بريميوم", "أولوية في النتائج", "نموذج اتصال", "رابط الموقع", "إبراز محلي"],
        },
        order: 2,
      },
      {
        key: "business",
        name: { fr: "Business", en: "Business", ar: "بيزنس" },
        priceMonthlyMad: 990,
        priceYearlyMad: 9900,
        maxPhotos: 60,
        features: {
          fr: ["Tout Premium +", "Vidéos", "Offres spéciales", "Événements", "Réservation", "Plusieurs utilisateurs", "Tableau de bord avancé", "Analytics complètes", "Leads prioritaires", "Support prioritaire", "Badge Business"],
          en: ["Everything in Premium +", "Videos", "Special offers", "Events", "Booking", "Multiple users", "Advanced dashboard", "Full analytics", "Priority leads", "Priority support", "Business badge"],
          ar: ["كل مزايا بريميوم +", "فيديوهات", "عروض خاصة", "فعاليات", "حجز", "عدة مستخدمين", "لوحة تحكم متقدمة", "تحليلات كاملة", "عملاء محتملون ذوو أولوية", "دعم ذو أولوية", "شارة بيزنس"],
        },
        order: 3,
      },
      {
        key: "enterprise",
        name: { fr: "Enterprise", en: "Enterprise", ar: "إنتربرايز" },
        priceMonthlyMad: 2990,
        priceYearlyMad: 29900,
        maxPhotos: null,
        features: {
          fr: ["Multi-établissements", "Gestion multi-utilisateurs", "API dédiée", "Statistiques avancées", "Publicité incluse", "Accompagnement personnalisé", "Gestionnaire de compte dédié", "Développements spécifiques sur devis"],
          en: ["Multi-listing", "Multi-user management", "Dedicated API", "Advanced stats", "Advertising included", "Personalized support", "Dedicated account manager", "Custom development on quote"],
          ar: ["مؤسسات متعددة", "إدارة متعددة المستخدمين", "واجهة برمجة مخصصة", "إحصائيات متقدمة", "إعلانات مشمولة", "مرافقة شخصية", "مدير حساب مخصص", "تطويرات خاصة حسب العرض"],
        },
        order: 4,
      },
    ])
    .onConflictDoNothing();

  console.log("Seeding modules...");
  const moduleKeys = [
    "blog", "restaurants", "hotels", "riads", "activites", "shopping",
    "immobilier", "reservations", "paiements", "publicite", "newsletter",
    "marketplace", "avis", "chat", "ia", "traductions", "api",
  ];
  await db
    .insert(modules)
    .values(moduleKeys.map((key) => ({ key, status: "active" as const })))
    .onConflictDoNothing();

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
