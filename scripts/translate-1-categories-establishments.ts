import { getDb } from "../src/db";
import { categories, establishments } from "../src/db/schema";
import { eq } from "drizzle-orm";

const db = getDb();

const CAT_NAMES: Record<string, Record<string, string>> = {
  hebergement: { es: "Alojamientos", de: "Unterkünfte", it: "Alloggi", pt: "Alojamentos", ru: "Проживание", zh: "住宿", ko: "숙소", tr: "Konaklama", he: "לינה" },
  restaurant: { es: "Restaurantes", de: "Restaurants", it: "Ristoranti", pt: "Restaurantes", ru: "Рестораны", zh: "餐厅", ko: "레스토랑", tr: "Restoranlar", he: "מסעדות" },
  activite: { es: "Actividades", de: "Aktivitäten", it: "Attività", pt: "Atividades", ru: "Активности", zh: "活动", ko: "액티비티", tr: "Aktiviteler", he: "פעילויות" },
  shopping: { es: "Compras", de: "Shopping", it: "Shopping", pt: "Compras", ru: "Шопинг", zh: "购物", ko: "쇼핑", tr: "Alışveriş", he: "קניות" },
};

type Est = {
  description?: Record<string, string>;
  hours?: Record<string, string>;
  services?: Record<string, string[]>;
  ourReview?: Record<string, string>;
  faq?: { q: Record<string, string>; a: Record<string, string> }[];
};

const EST: Record<string, Est> = {
  "riad-dar-safran": {
    description: {
      es: "Un riad tradicional renovado en el corazón de la medina, con patio, terraza con vista al océano y habitaciones decoradas con artesanía local.",
      de: "Ein traditionelles, renoviertes Riad im Herzen der Medina, mit Innenhof, Terrasse mit Meerblick und Zimmern, die mit lokalem Kunsthandwerk dekoriert sind.",
      it: "Un riad tradizionale rinnovato nel cuore della medina, con patio, terrazza vista oceano e camere decorate con artigianato locale.",
      pt: "Um riad tradicional renovado no coração da medina, com pátio, terraço com vista para o oceano e quartos decorados com artesanato local.",
      ru: "Традиционный отреставрированный риад в самом сердце медины, с внутренним двориком, террасой с видом на океан и номерами, украшенными изделиями местных ремесленников.",
      zh: "位于麦地那老城中心的传统翻新里亚德庭院住宅，设有庭院、可欣赏海景的露台，客房以当地手工艺品装饰。",
      ko: "메디나 중심부에 위치한 전통적으로 개조된 리아드로, 안뜰과 바다가 보이는 테라스, 현지 공예품으로 장식된 객실을 갖추고 있습니다.",
      tr: "Medine'nin kalbinde yenilenmiş geleneksel bir riad; avlusu, okyanus manzaralı terası ve yerel el sanatlarıyla dekore edilmiş odaları bulunmaktadır.",
      he: "ריאד מסורתי משופץ בלב המדינה העתיקה, עם חצר פנימית, מרפסת עם נוף לאוקיינוס וחדרים המעוצבים במלאכת יד מקומית.",
    },
    hours: {
      es: "Recepción abierta 24 horas", de: "Rezeption 24 Stunden geöffnet", it: "Reception aperta 24 ore su 24",
      pt: "Receção aberta 24 horas", ru: "Стойка регистрации работает круглосуточно", zh: "前台24小时开放",
      ko: "24시간 프런트 데스크 운영", tr: "Resepsiyon 24 saat açık", he: "קבלה פתוחה 24 שעות ביממה",
    },
    services: {
      es: ["Desayuno incluido", "Terraza", "Hammam privado"],
      de: ["Frühstück inbegriffen", "Terrasse", "Privates Hammam"],
      it: ["Colazione inclusa", "Terrazza", "Hammam privato"],
      pt: ["Pequeno-almoço incluído", "Terraço", "Hammam privado"],
      ru: ["Завтрак включён", "Терраса", "Частный хаммам"],
      zh: ["含早餐", "露台", "私人汗蒸浴室"],
      ko: ["조식 포함", "테라스", "전용 하맘"],
      tr: ["Kahvaltı dahil", "Teras", "Özel hamam"],
      he: ["ארוחת בוקר כלולה", "מרפסת", "חמאם פרטי"],
    },
    ourReview: {
      es: "Un entorno auténtico y tranquilo, ideal para una estancia romántica en la medina.",
      de: "Ein authentisches und ruhiges Ambiente, ideal für einen romantischen Aufenthalt in der Medina.",
      it: "Un ambiente autentico e tranquillo, ideale per un soggiorno romantico nella medina.",
      pt: "Um ambiente autêntico e tranquilo, ideal para uma estadia romântica na medina.",
      ru: "Аутентичная и спокойная атмосфера, идеально подходит для романтического отдыха в медине.",
      zh: "环境原汁原味且宁静，是在麦地那老城浪漫小住的理想之选。",
      ko: "고요하고 진정성 있는 분위기로 메디나에서의 로맨틱한 숙박에 이상적입니다.",
      tr: "Medine'de romantik bir konaklama için ideal, otantik ve sakin bir ortam.",
      he: "אווירה אותנטית ושקטה, אידיאלית לשהות רומנטית במדינה העתיקה.",
    },
    faq: [{
      q: {
        es: "¿Se puede llegar al riad en coche?", de: "Ist das Riad mit dem Auto erreichbar?", it: "Il riad è raggiungibile in auto?",
        pt: "O riad é acessível de carro?", ru: "Можно ли добраться до риада на машине?", zh: "里亚德可以开车到达吗？",
        ko: "리아드까지 자동차로 접근할 수 있나요?", tr: "Riad'a araba ile ulaşılabilir mi?", he: "האם ניתן להגיע לריאד ברכב?",
      },
      a: {
        es: "La medina es peatonal; un mozo puede recibirle en la entrada más cercana.",
        de: "Die Medina ist eine Fußgängerzone; ein Gepäckträger kann Sie am nächstgelegenen Eingang empfangen.",
        it: "La medina è pedonale; un facchino può accogliervi all'ingresso più vicino.",
        pt: "A medina é pedonal; um carregador pode recebê-lo na entrada mais próxima.",
        ru: "Медина является пешеходной зоной; носильщик может встретить вас у ближайшего входа.",
        zh: "麦地那老城为步行区，脚夫可在最近的入口迎接您。",
        ko: "메디나는 보행자 전용 구역으로, 짐꾼이 가장 가까운 입구에서 맞이해 드릴 수 있습니다.",
        tr: "Medine yayalara açıktır; bir hamal en yakın girişte sizi karşılayabilir.",
        he: "המדינה העתיקה היא אזור הולכי רגל; סבל יכול לקבל את פניכם בכניסה הקרובה ביותר.",
      },
    }],
  },
  "hotel-atlantic-essaouira": {
    description: {
      es: "Hotel moderno frente al océano con piscina, spa y restaurante panorámico.",
      de: "Modernes Hotel direkt am Ozean mit Pool, Spa und Panorama-Restaurant.",
      it: "Hotel moderno fronte oceano con piscina, spa e ristorante panoramico.",
      pt: "Hotel moderno de frente para o oceano com piscina, spa e restaurante panorâmico.",
      ru: "Современный отель на берегу океана с бассейном, спа и панорамным рестораном.",
      zh: "现代化海景酒店，设有泳池、水疗中心和全景餐厅。",
      ko: "수영장, 스파, 파노라마 레스토랑을 갖춘 대양이 보이는 현대적인 호텔입니다.",
      tr: "Havuzu, spa'sı ve panoramik restoranı ile okyanus manzaralı modern bir otel.",
      he: "מלון מודרני מול האוקיינוס עם בריכה, ספא ומסעדה פנורמית.",
    },
    hours: {
      es: "Recepción abierta 24 horas", de: "Rezeption 24 Stunden geöffnet", it: "Reception aperta 24 ore su 24",
      pt: "Receção aberta 24 horas", ru: "Стойка регистрации работает круглосуточно", zh: "前台24小时开放",
      ko: "24시간 프런트 데스크 운영", tr: "Resepsiyon 24 saat açık", he: "קבלה פתוחה 24 שעות ביממה",
    },
    services: {
      es: ["Piscina", "Spa", "Gimnasio"], de: ["Pool", "Spa", "Fitnessraum"], it: ["Piscina", "Spa", "Palestra"],
      pt: ["Piscina", "Spa", "Ginásio"], ru: ["Бассейн", "Спа", "Тренажёрный зал"], zh: ["游泳池", "水疗中心", "健身房"],
      ko: ["수영장", "스파", "피트니스 센터"], tr: ["Havuz", "Spa", "Spor salonu"], he: ["בריכה", "ספא", "חדר כושר"],
    },
    ourReview: {
      es: "Excelente relación calidad-precio con unas vistas impresionantes al Atlántico.",
      de: "Ausgezeichnetes Preis-Leistungs-Verhältnis mit atemberaubendem Blick auf den Atlantik.",
      it: "Ottimo rapporto qualità-prezzo con una vista mozzafiato sull'Atlantico.",
      pt: "Excelente relação qualidade-preço com uma vista deslumbrante sobre o Atlântico.",
      ru: "Отличное соотношение цены и качества с потрясающим видом на Атлантику.",
      zh: "性价比极高，可欣赏壮丽的大西洋美景。",
      ko: "대서양의 멋진 전망과 함께 훌륭한 가성비를 자랑합니다.",
      tr: "Muhteşem Atlantik manzarasıyla mükemmel fiyat-performans oranı.",
      he: "יחס מחיר-תמורה מצוין עם נוף עוצר נשימה לאוקיינוס האטלנטי.",
    },
  },
  "maison-hote-bab-marrakech": {
    description: {
      es: "Pequeña casa de huéspedes acogedora llevada por una familia local, cerca de Bab Marrakech.",
      de: "Kleines, familiengeführtes Gästehaus in der Nähe von Bab Marrakech.",
      it: "Piccola casa per ospiti accogliente gestita da una famiglia locale, vicino a Bab Marrakech.",
      pt: "Pequena casa de hóspedes acolhedora gerida por uma família local, perto de Bab Marrakech.",
      ru: "Небольшой уютный гостевой дом, которым управляет местная семья, недалеко от Баб Марракеш.",
      zh: "由当地家庭经营的温馨小型民宿，靠近巴卜·马拉喀什城门。",
      ko: "밥 마라케시 근처에 위치한, 현지 가족이 운영하는 아늑한 소규모 게스트하우스입니다.",
      tr: "Bab Marrakech yakınında, yerel bir aile tarafından işletilen samimi küçük bir pansiyon.",
      he: "בית הארחה קטן וחמים המנוהל על ידי משפחה מקומית, ליד באב מראכש.",
    },
    hours: {
      es: "Recepción 8h-22h", de: "Rezeption 8-22 Uhr", it: "Reception 8-22", pt: "Receção 8h-22h",
      ru: "Стойка регистрации с 8:00 до 22:00", zh: "前台8:00-22:00开放", ko: "프런트 데스크 오전 8시-오후 10시",
      tr: "Resepsiyon 8.00-22.00", he: "קבלה 8:00-22:00",
    },
    services: {
      es: ["Desayuno marroquí", "Terraza compartida"], de: ["Marokkanisches Frühstück", "Gemeinsame Terrasse"],
      it: ["Colazione marocchina", "Terrazza comune"], pt: ["Pequeno-almoço marroquino", "Terraço partilhado"],
      ru: ["Марокканский завтрак", "Общая терраса"], zh: ["摩洛哥式早餐", "共用露台"],
      ko: ["모로코식 조식", "공용 테라스"], tr: ["Fas usulü kahvaltı", "Ortak teras"], he: ["ארוחת בוקר מרוקאית", "מרפסת משותפת"],
    },
    ourReview: {
      es: "Una acogida calurosa y precios muy razonables, perfecto para viajeros solos.",
      de: "Herzlicher Empfang und sehr faire Preise, perfekt für Alleinreisende.",
      it: "Accoglienza calorosa e prezzi molto ragionevoli, perfetto per i viaggiatori solitari.",
      pt: "Acolhimento caloroso e preços muito razoáveis, perfeito para viajantes solo.",
      ru: "Тёплый приём и очень разумные цены, идеально для путешественников в одиночку.",
      zh: "热情友好的接待和非常合理的价格，非常适合单独旅行者。",
      ko: "따뜻한 환대와 매우 합리적인 가격으로 나 홀로 여행자에게 완벽합니다.",
      tr: "Sıcak bir karşılama ve çok makul fiyatlar, tek başına seyahat edenler için mükemmel.",
      he: "אירוח חם ומחירים סבירים מאוד, מושלם למטיילים בודדים.",
    },
  },
  "restaurant-la-table-du-port": {
    description: {
      es: "Pescado y marisco a la parrilla, con vistas a los barcos azules del puerto.",
      de: "Gegrillter Fisch und Meeresfrüchte mit Blick auf die blauen Boote des Hafens.",
      it: "Pesce e frutti di mare alla griglia, con vista sulle barche blu del porto.",
      pt: "Peixe e marisco grelhados, com vista para os barcos azuis do porto.",
      ru: "Рыба и морепродукты на гриле с видом на синие лодки порта.",
      zh: "烤鱼和海鲜，可欣赏港口蓝色渔船的景色。",
      ko: "항구의 파란 배들을 바라보며 즐기는 그릴 생선과 해산물 요리.",
      tr: "Limanın mavi teknelerine bakan, ızgara balık ve deniz ürünleri.",
      he: "דגים ופירות ים על הגריל, מול הסירות הכחולות של הנמל.",
    },
    hours: {
      es: "12h-15h / 19h-22h30, cerrado los lunes", de: "12-15 Uhr / 19-22.30 Uhr, montags geschlossen",
      it: "12-15 / 19-22.30, chiuso il lunedì", pt: "12h-15h / 19h-22h30, encerrado às segundas-feiras",
      ru: "12:00-15:00 / 19:00-22:30, по понедельникам закрыто", zh: "12:00-15:00 / 19:00-22:30，周一休息",
      ko: "12-15시 / 19-22시 30분, 월요일 휴무", tr: "12.00-15.00 / 19.00-22.30, Pazartesi kapalı",
      he: "12:00-15:00 / 19:00-22:30, סגור בימי שני",
    },
    services: {
      es: ["Terraza con vista al puerto", "Pescado del día"], de: ["Terrasse mit Hafenblick", "Fisch des Tages"],
      it: ["Terrazza vista porto", "Pesce del giorno"], pt: ["Terraço com vista para o porto", "Peixe do dia"],
      ru: ["Терраса с видом на порт", "Рыба дня"], zh: ["可观港口景色的露台", "每日鲜鱼"],
      ko: ["항구 전망 테라스", "오늘의 생선"], tr: ["Liman manzaralı teras", "Günün balığı"], he: ["מרפסת עם נוף לנמל", "דג היום"],
    },
    ourReview: {
      es: "El mejor pescado a la parrilla de la ciudad, a precios justos.",
      de: "Der beste gegrillte Fisch der Stadt zu fairen Preisen.",
      it: "Il miglior pesce alla griglia della città, a prezzi onesti.",
      pt: "O melhor peixe grelhado da cidade, a preços justos.",
      ru: "Лучшая рыба на гриле в городе по справедливым ценам.",
      zh: "全城最棒的烤鱼，价格公道。",
      ko: "합리적인 가격의 이 도시 최고의 그릴 생선 요리.",
      tr: "Şehrin en iyi ızgara balığı, uygun fiyatlarla.",
      he: "הדג הכי טוב על הגריל בעיר, במחירים הוגנים.",
    },
  },
  "restaurant-dar-mama": {
    description: {
      es: "Cocina marroquí tradicional casera en un ambiente cálido.",
      de: "Traditionelle hausgemachte marokkanische Küche in warmer Atmosphäre.",
      it: "Cucina marocchina tradizionale casalinga in un'atmosfera calorosa.",
      pt: "Cozinha marroquina tradicional caseira num ambiente acolhedor.",
      ru: "Традиционная домашняя марокканская кухня в тёплой атмосфере.",
      zh: "在温馨的氛围中享用传统摩洛哥家常菜。",
      ko: "따뜻한 분위기 속에서 즐기는 전통 모로코 가정식 요리.",
      tr: "Sıcak bir ortamda geleneksel ev yapımı Fas mutfağı.",
      he: "מטבח מרוקאי מסורתי ביתי באווירה חמימה.",
    },
    hours: {
      es: "12h-22h todos los días", de: "12-22 Uhr täglich", it: "12-22 tutti i giorni", pt: "12h-22h todos os dias",
      ru: "12:00-22:00 ежедневно", zh: "每日12:00-22:00", ko: "매일 12-22시", tr: "Her gün 12.00-22.00", he: "12:00-22:00 מדי יום",
    },
    services: {
      es: ["Tayines", "Cuscús los viernes"], de: ["Tajines", "Couscous am Freitag"], it: ["Tajine", "Couscous del venerdì"],
      pt: ["Tajines", "Cuscuz à sexta-feira"], ru: ["Тажины", "Кускус по пятницам"], zh: ["塔吉锅菜肴", "周五古斯古斯"],
      ko: ["타진 요리", "금요일 쿠스쿠스"], tr: ["Tajinler", "Cuma günü kuskus"], he: ["טאג'ין", "קוסקוס בימי שישי"],
    },
    ourReview: {
      es: "Una dirección familiar imprescindible para un auténtico tayín casero.",
      de: "Eine unverzichtbare Familienadresse für einen echten hausgemachten Tajine.",
      it: "Un indirizzo familiare imperdibile per un vero tajine fatto in casa.",
      pt: "Um endereço familiar imperdível para um verdadeiro tajine caseiro.",
      ru: "Обязательное семейное заведение для настоящего домашнего тажина.",
      zh: "不可错过的家庭餐厅，品尝正宗的家常塔吉锅菜。",
      ko: "진짜 홈메이드 타진을 맛볼 수 있는 꼭 가봐야 할 가족 운영 맛집입니다.",
      tr: "Gerçek ev yapımı bir tajin için vazgeçilmez bir aile mekanı.",
      he: "כתובת משפחתית שאסור לפספס לטאג'ין ביתי אמיתי.",
    },
  },
  "cafe-des-arts": {
    description: {
      es: "Café-galería de moda, un buen sitio para tomar un café y trabajar con tranquilidad.",
      de: "Angesagtes Café-Galerie, ein toller Ort für Kaffee und ruhiges Arbeiten.",
      it: "Café-galleria alla moda, un buon posto per un caffè e per lavorare in tranquillità.",
      pt: "Café-galeria descontraído, um bom sítio para um café e trabalhar em tranquilidade.",
      ru: "Модное кафе-галерея, отличное место для кофе и спокойной работы.",
      zh: "时尚的咖啡画廊，是喝咖啡和安静工作的好去处。",
      ko: "트렌디한 카페 겸 갤러리로, 커피 한잔과 조용한 작업을 즐기기 좋은 곳입니다.",
      tr: "Trend bir kafe-galeri, kahve içmek ve sakin bir şekilde çalışmak için güzel bir yer.",
      he: "בית קפה-גלריה טרנדי, מקום נחמד לקפה ועבודה שקטה.",
    },
    hours: {
      es: "8h-20h", de: "8-20 Uhr", it: "8-20", pt: "8h-20h", ru: "8:00-20:00", zh: "8:00-20:00", ko: "오전 8시-오후 8시", tr: "8.00-20.00", he: "8:00-20:00",
    },
    services: {
      es: ["Wi-Fi rápido", "Repostería casera"], de: ["Schnelles WLAN", "Hausgemachtes Gebäck"], it: ["Wi-Fi veloce", "Pasticceria fatta in casa"],
      pt: ["Wi-Fi rápido", "Pastelaria caseira"], ru: ["Быстрый Wi-Fi", "Домашняя выпечка"], zh: ["高速无线网络", "自制糕点"],
      ko: ["빠른 와이파이", "홈메이드 페이스트리"], tr: ["Hızlı Wi-Fi", "Ev yapımı hamur işleri"], he: ["Wi-Fi מהיר", "מאפים ביתיים"],
    },
    ourReview: {
      es: "Ideal para una pausa con vistas a la plaza principal.",
      de: "Ideal für eine Pause mit Blick auf den Hauptplatz.",
      it: "Ideale per una pausa con vista sulla piazza principale.",
      pt: "Ideal para uma pausa com vista para a praça principal.",
      ru: "Идеально для перерыва с видом на главную площадь.",
      zh: "非常适合小憩，还能欣赏主广场的景色。",
      ko: "메인 광장이 보이는 곳에서 잠시 쉬어가기 좋습니다.",
      tr: "Ana meydana bakan bir mola için ideal.",
      he: "אידיאלי להפסקה עם נוף לכיכר הראשית.",
    },
  },
  "essaouira-surf-school": {
    description: {
      es: "Clases de surf para todos los niveles en las playas ventosas de Essaouira.",
      de: "Surfkurse für alle Niveaus an den windigen Stränden von Essaouira.",
      it: "Lezioni di surf per tutti i livelli sulle spiagge ventose di Essaouira.",
      pt: "Aulas de surf para todos os níveis nas praias ventosas de Essaouira.",
      ru: "Уроки серфинга для всех уровней на ветреных пляжах Эс-Сувейры.",
      zh: "在埃萨维拉多风的海滩上提供适合各水平的冲浪课程。",
      ko: "에사우이라의 바람 부는 해변에서 모든 레벨을 위한 서핑 강습을 제공합니다.",
      tr: "Essaouira'nın rüzgarlı sahillerinde her seviyeye uygun sörf dersleri.",
      he: "שיעורי גלישה לכל הרמות בחופים הסוערים של אסווירה.",
    },
    hours: {
      es: "9h-18h", de: "9-18 Uhr", it: "9-18", pt: "9h-18h", ru: "9:00-18:00", zh: "9:00-18:00", ko: "오전 9시-오후 6시", tr: "9.00-18.00", he: "9:00-18:00",
    },
    services: {
      es: ["Alquiler de material", "Clases particulares", "Cursos semanales"],
      de: ["Materialverleih", "Privatunterricht", "Wochenkurse"],
      it: ["Noleggio attrezzatura", "Lezioni private", "Corsi settimanali"],
      pt: ["Aluguer de material", "Aulas particulares", "Estágios semanais"],
      ru: ["Прокат снаряжения", "Индивидуальные занятия", "Недельные курсы"],
      zh: ["设备租赁", "私人课程", "每周课程"],
      ko: ["장비 대여", "개인 강습", "주간 코스"],
      tr: ["Ekipman kiralama", "Özel dersler", "Haftalık kurslar"],
      he: ["השכרת ציוד", "שיעורים פרטיים", "קורסים שבועיים"],
    },
    ourReview: {
      es: "Instructores pedagógicos, perfecto para empezar con total seguridad.",
      de: "Pädagogisch versierte Lehrer, perfekt für einen sicheren Einstieg.",
      it: "Istruttori pazienti e didattici, perfetto per iniziare in tutta sicurezza.",
      pt: "Instrutores pedagógicos, perfeito para começar em total segurança.",
      ru: "Внимательные инструкторы, отлично подходит для безопасного начала.",
      zh: "教学耐心的教练，非常适合安全地开始学习。",
      ko: "친절한 강사진 덕분에 안전하게 시작하기에 완벽합니다.",
      tr: "Öğretici eğitmenler, güvenli bir başlangıç için mükemmel.",
      he: "מדריכים סבלניים, מושלם להתחלה בטוחה.",
    },
  },
  "hammam-heritage-spa": {
    description: {
      es: "Hammam tradicional y tratamientos con jabón negro y argán en un entorno refinado.",
      de: "Traditionelles Hammam mit Behandlungen mit schwarzer Seife und Arganöl in edlem Ambiente.",
      it: "Hammam tradizionale e trattamenti con sapone nero e argan in un ambiente raffinato.",
      pt: "Hammam tradicional e tratamentos com sabonete preto e argan num ambiente requintado.",
      ru: "Традиционный хаммам и уход с чёрным мылом и аргановым маслом в изысканной обстановке.",
      zh: "传统汗蒸浴，配以黑皂和摩洛哥坚果油护理，环境雅致。",
      ko: "고급스러운 환경에서 즐기는 전통 하맘과 블랙 솝, 아르간 오일 트리트먼트.",
      tr: "Zarif bir ortamda geleneksel hamam ve siyah sabun ile argan yağı bakımları.",
      he: "חמאם מסורתי וטיפולים בסבון שחור ושמן ארגן בסביבה מהודרת.",
    },
    hours: {
      es: "10h-20h", de: "10-20 Uhr", it: "10-20", pt: "10h-20h", ru: "10:00-20:00", zh: "10:00-20:00", ko: "오전 10시-오후 8시", tr: "10.00-20.00", he: "10:00-20:00",
    },
    services: {
      es: ["Exfoliación", "Masaje con aceite de argán"], de: ["Peeling", "Massage mit Arganöl"], it: ["Scrub", "Massaggio all'olio di argan"],
      pt: ["Esfoliação", "Massagem com óleo de argan"], ru: ["Пилинг", "Массаж с аргановым маслом"], zh: ["去角质", "摩洛哥坚果油按摩"],
      ko: ["스크럽", "아르간 오일 마사지"], tr: ["Peeling", "Argan yağı masajı"], he: ["פילינג", "עיסוי בשמן ארגן"],
    },
    ourReview: {
      es: "Un verdadero momento de relax, personal muy profesional.",
      de: "Ein wahrer Moment der Entspannung, sehr professionelles Personal.",
      it: "Un vero momento di relax, personale molto professionale.",
      pt: "Um verdadeiro momento de relaxamento, pessoal muito profissional.",
      ru: "Настоящий момент расслабления, очень профессиональный персонал.",
      zh: "真正的放松时刻，员工非常专业。",
      ko: "매우 전문적인 직원과 함께하는 진정한 휴식의 시간.",
      tr: "Gerçek bir dinlenme anı, çok profesyonel personel.",
      he: "רגע אמיתי של הרפיה, צוות מקצועי מאוד.",
    },
  },
  "excursion-vallee-argan": {
    description: {
      es: "Un día para descubrir las cooperativas de argán y las cabras trepadoras en los árboles de argán.",
      de: "Ein Tag zur Entdeckung der Arganöl-Kooperativen und der Ziegen, die auf Arganbäume klettern.",
      it: "Una giornata alla scoperta delle cooperative di argan e delle capre arrampicate sugli alberi di argan.",
      pt: "Um dia para descobrir as cooperativas de argan e as cabras que trepam às árvores de argan.",
      ru: "Однодневная поездка для знакомства с кооперативами по производству арганового масла и козами, лазающими по деревьям аргании.",
      zh: "用一天时间探访摩洛哥坚果油合作社，观赏爬树的山羊。",
      ko: "아르간 협동조합과 아르간 나무에 오르는 염소들을 만나는 하루 여행.",
      tr: "Argan kooperatiflerini ve argan ağaçlarına tırmanan keçileri keşfetmek için bir gün.",
      he: "יום גילוי של קואופרטיבים לשמן ארגן והעזים המטפסות על עצי הארגן.",
    },
    hours: {
      es: "Salida a las 9h, regreso a las 17h", de: "Abfahrt 9 Uhr, Rückkehr 17 Uhr", it: "Partenza alle 9, ritorno alle 17",
      pt: "Partida às 9h, regresso às 17h", ru: "Отправление в 9:00, возвращение в 17:00", zh: "9点出发，17点返回",
      ko: "오전 9시 출발, 오후 5시 귀환", tr: "Kalkış 9.00, dönüş 17.00", he: "יציאה בשעה 9:00, חזרה בשעה 17:00",
    },
    services: {
      es: ["Transporte incluido", "Guía en francés/inglés"], de: ["Transport inbegriffen", "Französisch-/englischsprachiger Guide"],
      it: ["Trasporto incluso", "Guida in francese/inglese"], pt: ["Transporte incluído", "Guia em francês/inglês"],
      ru: ["Транспорт включён", "Гид, говорящий на французском/английском"], zh: ["含交通", "法语/英语导游"],
      ko: ["교통편 포함", "프랑스어/영어 가이드"], tr: ["Ulaşım dahil", "Fransızca/İngilizce rehber"], he: ["הסעה כלולה", "מדריך דובר צרפתית/אנגלית"],
    },
    ourReview: {
      es: "Una hermosa escapada fuera de lo común, en grupo reducido.",
      de: "Ein schöner Ausflug abseits der ausgetretenen Pfade, in kleiner Gruppe.",
      it: "Una bella gita fuori dai sentieri battuti, in piccolo gruppo.",
      pt: "Um belo passeio fora do habitual, em pequeno grupo.",
      ru: "Прекрасная поездка вдали от туристических троп, в небольшой группе.",
      zh: "一次远离常规路线的美好出游，小团体出行。",
      ko: "소규모 그룹으로 즐기는 색다른 아름다운 나들이입니다.",
      tr: "Küçük bir grupla, alışılmışın dışında güzel bir gezi.",
      he: "טיול יפה מחוץ למסלולים השגרתיים, בקבוצה קטנה.",
    },
  },
  "atelier-marqueterie-thuya": {
    description: {
      es: "Cooperativa de artesanos que trabajan la madera de tuya, un saber hacer local único en el mundo.",
      de: "Handwerkergenossenschaft, die Thuja-Holz verarbeitet – ein weltweit einzigartiges lokales Know-how.",
      it: "Cooperativa di artigiani che lavorano il legno di tuia, un know-how locale unico al mondo.",
      pt: "Cooperativa de artesãos que trabalham a madeira de tuia, um saber-fazer local único no mundo.",
      ru: "Кооператив ремесленников, работающих с древесиной туи — уникальное местное мастерство, аналогов которому нет в мире.",
      zh: "手工艺人合作社，专注于加工崖柏木，这是当地独一无二的世界级手艺。",
      ko: "튜야 나무를 가공하는 장인 협동조합으로, 세계에서 유일무이한 현지 전통 기술을 보유하고 있습니다.",
      tr: "Dünyada eşi benzeri olmayan yerel bir zanaat olan tuya ağacı işleyen zanaatkarlar kooperatifi.",
      he: "קואופרטיב של בעלי מלאכה העובדים עם עץ תויה, מיומנות מקומית ייחודית בעולם.",
    },
    hours: {
      es: "9h-19h", de: "9-19 Uhr", it: "9-19", pt: "9h-19h", ru: "9:00-19:00", zh: "9:00-19:00", ko: "오전 9시-오후 7시", tr: "9.00-19.00", he: "9:00-19:00",
    },
    services: {
      es: ["Demostración en vivo", "Envío al extranjero"], de: ["Live-Vorführung", "Versand ins Ausland"], it: ["Dimostrazione dal vivo", "Spedizione all'estero"],
      pt: ["Demonstração ao vivo", "Envio para o estrangeiro"], ru: ["Демонстрация вживую", "Отправка за границу"], zh: ["现场演示", "海外邮寄"],
      ko: ["라이브 시연", "해외 배송"], tr: ["Canlı gösterim", "Yurt dışına gönderim"], he: ["הדגמה חיה", "משלוח לחו״ל"],
    },
    ourReview: {
      es: "Una artesanía auténtica que no hay que perderse, precios negociables.",
      de: "Ein authentisches Handwerk, das man sich nicht entgehen lassen sollte, Preise verhandelbar.",
      it: "Un artigianato autentico da non perdere, prezzi negoziabili.",
      pt: "Um artesanato autêntico a não perder, preços negociáveis.",
      ru: "Подлинное ремесло, которое обязательно стоит увидеть, цены можно обсудить.",
      zh: "不容错过的地道手工艺，价格可议。",
      ko: "놓쳐서는 안 될 진정한 공예품, 가격 흥정 가능.",
      tr: "Kaçırılmaması gereken otantik bir el sanatı, fiyatlar pazarlığa açık.",
      he: "מלאכת יד אותנטית שאסור לפספס, מחירים ניתנים למיקוח.",
    },
  },
  "bijouterie-argent-medina": {
    description: {
      es: "Joyas artesanales de plata y piedras locales, creaciones únicas.",
      de: "Handgefertigter Silberschmuck mit lokalen Steinen, einzigartige Kreationen.",
      it: "Gioielli artigianali in argento e pietre locali, creazioni uniche.",
      pt: "Joias artesanais em prata e pedras locais, criações únicas.",
      ru: "Ювелирные изделия ручной работы из серебра с местными камнями, уникальные украшения.",
      zh: "手工银饰配以当地宝石，独一无二的创作。",
      ko: "현지 원석을 사용한 수제 은 세공품으로, 유일무이한 작품들입니다.",
      tr: "Yerel taşlarla el yapımı gümüş takılar, eşsiz tasarımlar.",
      he: "תכשיטי כסף בעבודת יד עם אבנים מקומיות, יצירות ייחודיות.",
    },
    hours: {
      es: "9:30h-19:30h", de: "9.30-19.30 Uhr", it: "9.30-19.30", pt: "9h30-19h30", ru: "9:30-19:30", zh: "9:30-19:30",
      ko: "오전 9시 30분-오후 7시 30분", tr: "9.30-19.30", he: "9:30-19:30",
    },
    services: {
      es: ["A medida", "Grabado"], de: ["Maßanfertigung", "Gravur"], it: ["Su misura", "Incisione"],
      pt: ["Sob medida", "Gravação"], ru: ["На заказ", "Гравировка"], zh: ["定制", "刻字"],
      ko: ["맞춤 제작", "각인"], tr: ["Özel tasarım", "Gravür"], he: ["בהתאמה אישית", "חריטה"],
    },
    ourReview: {
      es: "Una selección de joyas originales a precios muy razonables.",
      de: "Eine Auswahl origineller Schmuckstücke zu sehr fairen Preisen.",
      it: "Una selezione di gioielli originali a prezzi molto convenienti.",
      pt: "Uma seleção de joias originais a preços muito razoáveis.",
      ru: "Подборка оригинальных украшений по очень доступным ценам.",
      zh: "精选原创珠宝，价格非常实惠。",
      ko: "매우 합리적인 가격의 독특한 주얼리 컬렉션입니다.",
      tr: "Çok makul fiyatlarla özgün takı seçkisi.",
      he: "מבחר תכשיטים מקוריים במחירים הוגנים מאוד.",
    },
  },
};

async function main() {
  console.log("Translating categories...");
  const allCategories = await db.select().from(categories);
  for (const c of allCategories) {
    const extra = CAT_NAMES[c.type];
    if (!extra) continue;
    await db.update(categories).set({ name: { ...c.name, ...extra } }).where(eq(categories.id, c.id));
  }

  console.log("Translating establishments...");
  const allEstablishments = await db.select().from(establishments);
  for (const e of allEstablishments) {
    const extra = EST[e.slug];
    if (!extra) continue;

    const update: Record<string, unknown> = {};
    if (extra.description) update.description = { ...e.description, ...extra.description };
    if (extra.hours) update.hours = { ...(e.hours ?? {}), ...extra.hours };
    if (extra.services) {
      const merged: Record<string, string[]> = { ...(e.services ?? {}) };
      for (const [lang, arr] of Object.entries(extra.services)) merged[lang] = arr;
      update.services = merged;
    }
    if (extra.ourReview) update.ourReview = { ...(e.ourReview ?? {}), ...extra.ourReview };
    if (extra.faq && e.faq) {
      update.faq = e.faq.map((item, i) => {
        const t = extra.faq![i];
        if (!t) return item;
        return { q: { ...item.q, ...t.q }, a: { ...item.a, ...t.a } };
      });
    }

    await db.update(establishments).set(update).where(eq(establishments.id, e.id));
    console.log(`  ${e.slug} done`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
