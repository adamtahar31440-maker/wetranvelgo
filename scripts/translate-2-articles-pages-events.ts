import { getDb } from "../src/db";
import { contentPages } from "../src/db/schema";
import { eq } from "drizzle-orm";

const db = getDb();

const PAGES: Record<string, { title: Record<string, string>; body: Record<string, string> }> = {
  histoire: {
    title: {
      es: "Historia de Essaouira", de: "Geschichte von Essaouira", it: "Storia di Essaouira", pt: "História de Essaouira",
      ru: "История Эс-Сувейры", zh: "埃萨维拉的历史", ko: "에사우이라의 역사", tr: "Essaouira'nın Tarihi", he: "ההיסטוריה של אסווירה",
    },
    body: {
      es: "Fundada en el siglo XVIII por el sultán Mohammed III, Essaouira (antes Mogador) fue concebida como un puerto estratégico abierto a Europa...",
      de: "Essaouira (früher Mogador) wurde im 18. Jahrhundert von Sultan Mohammed III. gegründet und als strategischer, nach Europa offener Hafen konzipiert...",
      it: "Fondata nel XVIII secolo dal sultano Mohammed III, Essaouira (già Mogador) fu concepita come un porto strategico aperto verso l'Europa...",
      pt: "Fundada no século XVIII pelo sultão Mohammed III, Essaouira (antiga Mogador) foi concebida como um porto estratégico aberto à Europa...",
      ru: "Основанная в XVIII веке султаном Мохаммедом III, Эс-Сувейра (ранее Могадор) была задумана как стратегический порт, открытый для Европы...",
      zh: "埃萨维拉（旧称摩加多尔）由苏丹穆罕默德三世于18世纪建立，最初被设计为面向欧洲的战略港口……",
      ko: "18세기 술탄 모하메드 3세에 의해 세워진 에사우이라(옛 이름 모가도르)는 유럽에 개방된 전략적 항구로 설계되었습니다...",
      tr: "18. yüzyılda Sultan Mohammed III tarafından kurulan Essaouira (eski adıyla Mogador), Avrupa'ya açık stratejik bir liman olarak tasarlandı...",
      he: "נוסדה במאה ה-18 על ידי הסולטאן מוחמד השלישי, אסווירה (לשעבר מוגדור) תוכננה כנמל אסטרטגי הפתוח לאירופה...",
    },
  },
  medina: {
    title: {
      es: "La Medina", de: "Die Medina", it: "La Medina", pt: "A Medina", ru: "Медина", zh: "麦地那老城", ko: "메디나", tr: "Medine", he: "המדינה העתיקה",
    },
    body: {
      es: "Declarada Patrimonio de la Humanidad por la UNESCO, la medina de Essaouira seduce con sus callejuelas blancas y azules, sus murallas y sus animados zocos...",
      de: "Die von der UNESCO zum Weltkulturerbe erklärte Medina von Essaouira begeistert mit ihren weiß-blauen Gassen, Stadtmauern und lebendigen Souks...",
      it: "Dichiarata Patrimonio dell'Umanità dall'UNESCO, la medina di Essaouira seduce con i suoi vicoli bianchi e blu, le mura e i suoi vivaci souk...",
      pt: "Classificada como Património Mundial pela UNESCO, a medina de Essaouira encanta com as suas ruelas brancas e azuis, as suas muralhas e os seus animados souks...",
      ru: "Внесённая в список Всемирного наследия ЮНЕСКО, медина Эс-Сувейры очаровывает своими бело-голубыми улочками, крепостными стенами и оживлёнными сук (рынками)...",
      zh: "被联合国教科文组织列为世界遗产的埃萨维拉麦地那，以其蓝白相间的小巷、城墙和热闹的集市令人着迷……",
      ko: "유네스코 세계문화유산으로 등재된 에사우이라의 메디나는 파란색과 흰색이 어우러진 골목길, 성벽, 활기찬 수크(시장)로 매력을 발산합니다...",
      tr: "UNESCO Dünya Mirası olarak listelenen Essaouira medinesi, beyaz-mavi sokakları, surları ve hareketli çarşılarıyla büyülüyor...",
      he: "המוכרזת כאתר מורשת עולמי על ידי אונסק״ו, המדינה העתיקה של אסווירה מקסימה בסמטאותיה הכחולות-לבנות, בחומותיה ובשווקים התוססים שלה...",
    },
  },
  plages: {
    title: {
      es: "Las Playas", de: "Die Strände", it: "Le Spiagge", pt: "As Praias", ru: "Пляжи", zh: "海滩", ko: "해변", tr: "Plajlar", he: "החופים",
    },
    body: {
      es: "La gran playa de Essaouira se extiende varios kilómetros, ideal para el viento, el surf y los paseos a caballo o en camello...",
      de: "Der lange Strand von Essaouira erstreckt sich über mehrere Kilometer und eignet sich ideal für Windsport, Surfen sowie Pferde- oder Kamelritte...",
      it: "La grande spiaggia di Essaouira si estende per diversi chilometri, ideale per il vento, il surf e le passeggiate a cavallo o in cammello...",
      pt: "A grande praia de Essaouira estende-se por vários quilómetros, ideal para o vento, o surf e passeios a cavalo ou em camelo...",
      ru: "Большой пляж Эс-Сувейры протянулся на несколько километров, идеально подходит для виндсёрфинга, сёрфинга, а также прогулок на лошадях или верблюдах...",
      zh: "埃萨维拉的大海滩绵延数公里，非常适合风上运动、冲浪以及骑马或骑骆驼漫步……",
      ko: "에사우이라의 넓은 해변은 몇 킬로미터에 걸쳐 펼쳐져 있으며, 윈드스포츠, 서핑, 승마나 낙타 타기에 이상적입니다...",
      tr: "Essaouira'nın büyük plajı birkaç kilometre uzanır; rüzgar sporları, sörf ve at ya da deve gezintileri için idealdir...",
      he: "החוף הגדול של אסווירה משתרע על פני מספר קילומטרים, אידיאלי לספורט רוח, גלישה וטיולי סוסים או גמלים...",
    },
  },
  culture: {
    title: {
      es: "Cultura y Artesanía", de: "Kultur und Handwerk", it: "Cultura e Artigianato", pt: "Cultura e Artesanato",
      ru: "Культура и ремёсла", zh: "文化与手工艺", ko: "문화와 공예", tr: "Kültür ve El Sanatları", he: "תרבות ומלאכת יד",
    },
    body: {
      es: "Essaouira es una encrucijada cultural donde se mezclan la música gnaoua, las artes plásticas y la artesanía de la madera de tuya...",
      de: "Essaouira ist ein kultureller Knotenpunkt, an dem sich Gnaoua-Musik, bildende Kunst und Thuja-Holzhandwerk vermischen...",
      it: "Essaouira è un crocevia culturale dove si mescolano musica gnaoua, arti plastiche e artigianato del legno di tuia...",
      pt: "Essaouira é um cruzamento cultural onde se misturam a música gnaoua, as artes plásticas e o artesanato da madeira de tuia...",
      ru: "Эс-Сувейра — это культурный перекрёсток, где переплетаются музыка гнауа, изобразительное искусство и ремесло резьбы по дереву туи...",
      zh: "埃萨维拉是一个文化交汇之地，格纳瓦音乐、造型艺术与崖柏木手工艺在此交融……",
      ko: "에사우이라는 그나와 음악, 조형 예술, 튜야 목공예가 어우러지는 문화의 교차로입니다...",
      tr: "Essaouira; gnaoua müziği, plastik sanatlar ve tuya ağacı el sanatlarının bir araya geldiği kültürel bir kavşaktır...",
      he: "אסווירה היא צומת תרבותי שבו מתמזגים מוזיקת גנאווה, אמנות פלסטית ומלאכת עץ התויה...",
    },
  },
  "cout-de-la-vie": {
    title: {
      es: "Coste de la vida en Essaouira", de: "Lebenshaltungskosten in Essaouira", it: "Costo della vita a Essaouira",
      pt: "Custo de vida em Essaouira", ru: "Стоимость жизни в Эс-Сувейре", zh: "埃萨维拉的生活成本",
      ko: "에사우이라의 생활비", tr: "Essaouira'da Yaşam Maliyeti", he: "עלות המחיה באסווירה",
    },
    body: {
      es: "El coste de la vida en Essaouira sigue siendo asequible comparado con Europa: vivienda, alimentación y transporte a precios razonables...",
      de: "Die Lebenshaltungskosten in Essaouira sind im Vergleich zu Europa nach wie vor erschwinglich: Wohnen, Essen und Transport zu vernünftigen Preisen...",
      it: "Il costo della vita a Essaouira resta accessibile rispetto all'Europa: alloggio, cibo e trasporti a prezzi ragionevoli...",
      pt: "O custo de vida em Essaouira mantém-se acessível em comparação com a Europa: habitação, alimentação e transporte a preços razoáveis...",
      ru: "Стоимость жизни в Эс-Сувейре остаётся доступной по сравнению с Европой: жильё, питание и транспорт по разумным ценам...",
      zh: "与欧洲相比，埃萨维拉的生活成本仍然十分实惠：住房、饮食和交通价格合理……",
      ko: "에사우이라의 생활비는 유럽에 비해 여전히 저렴합니다: 합리적인 가격의 주거, 식비, 교통비...",
      tr: "Essaouira'da yaşam maliyeti Avrupa'ya kıyasla uygun kalmaya devam ediyor: makul fiyatlarla konut, yemek ve ulaşım...",
      he: "עלות המחיה באסווירה נשארת נגישה בהשוואה לאירופה: דיור, מזון ותחבורה במחירים סבירים...",
    },
  },
  sante: {
    title: {
      es: "Salud en Essaouira", de: "Gesundheit in Essaouira", it: "Salute a Essaouira", pt: "Saúde em Essaouira",
      ru: "Здравоохранение в Эс-Сувейре", zh: "埃萨维拉的医疗", ko: "에사우이라의 의료", tr: "Essaouira'da Sağlık", he: "בריאות באסווירה",
    },
    body: {
      es: "Essaouira dispone de un hospital público, clínicas privadas y farmacias de guardia para residentes y expatriados...",
      de: "Essaouira verfügt über ein öffentliches Krankenhaus, private Kliniken und Notfallapotheken für Einwohner und Expats...",
      it: "Essaouira dispone di un ospedale pubblico, cliniche private e farmacie di turno per residenti ed espatriati...",
      pt: "Essaouira dispõe de um hospital público, clínicas privadas e farmácias de serviço para residentes e expatriados...",
      ru: "В Эс-Сувейре есть государственная больница, частные клиники и дежурные аптеки для местных жителей и иностранцев...",
      zh: "埃萨维拉设有公立医院、私人诊所和为居民及外籍人士提供服务的值班药房……",
      ko: "에사우이라에는 주민과 외국인 거주자를 위한 공립 병원, 개인 병원, 당직 약국이 있습니다...",
      tr: "Essaouira'da, yerleşikler ve yabancılar için kamu hastanesi, özel klinikler ve nöbetçi eczaneler bulunmaktadır...",
      he: "באסווירה יש בית חולים ציבורי, מרפאות פרטיות ובתי מרקחת תורנים לתושבים ולמהגרים...",
    },
  },
};

async function main() {
  console.log("Translating content pages...");
  const allPages = await db.select().from(contentPages);
  for (const p of allPages) {
    const t = PAGES[p.slug];
    if (!t) continue;
    await db.update(contentPages).set({
      title: { ...p.title, ...t.title },
      body: { ...p.body, ...t.body },
    }).where(eq(contentPages.id, p.id));
    console.log(`  page ${p.slug} done`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
