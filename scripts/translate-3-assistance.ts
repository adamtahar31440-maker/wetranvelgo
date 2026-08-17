import { getDb } from "../src/db";
import { emergencyContacts, contentPages } from "../src/db/schema";
import { eq } from "drizzle-orm";

const db = getDb();

const VERIFY: Record<string, string> = {
  es: "⚠️ Número por verificar/completar por el equipo de Essaouira Inside.",
  de: "⚠️ Nummer vom Essaouira-Inside-Team zu überprüfen/vervollständigen.",
  it: "⚠️ Numero da verificare/completare da parte del team di Essaouira Inside.",
  pt: "⚠️ Número a verificar/completar pela equipa da Essaouira Inside.",
  ru: "⚠️ Номер требует проверки/уточнения командой Essaouira Inside.",
  zh: "⚠️ 该号码有待Essaouira Inside团队核实/补充。",
  ko: "⚠️ Essaouira Inside 팀이 확인/보완해야 할 번호입니다.",
  tr: "⚠️ Essaouira Inside ekibi tarafından doğrulanacak/tamamlanacak numara.",
  he: "⚠️ מספר שיש לאמת/להשלים על ידי צוות Essaouira Inside.",
};

const HOURS_24: Record<string, string> = {
  es: "24 horas", de: "24 Stunden", it: "24 ore su 24", pt: "24 horas", ru: "Круглосуточно",
  zh: "24小时", ko: "24시간", tr: "24 saat", he: "24 שעות ביממה",
};

async function main() {
  console.log("Translating emergency contacts...");
  const rows = await db.select().from(emergencyContacts);

  for (const c of rows) {
    const nameFr = c.name.fr;
    let name: Record<string, string> | undefined;
    let hours: Record<string, string> | undefined;
    let notes: Record<string, string> | undefined;

    switch (nameFr) {
      case "Police secours":
        name = {
          es: "Policía de emergencia", de: "Polizei-Notruf", it: "Polizia di emergenza", pt: "Polícia de emergência",
          ru: "Полиция (экстренный вызов)", zh: "警察报警", ko: "경찰 긴급전화", tr: "Polis imdat", he: "משטרה - חירום",
        };
        hours = HOURS_24;
        break;
      case "Protection civile (Pompiers / Ambulance)":
        name = {
          es: "Protección Civil (Bomberos / Ambulancia)", de: "Zivilschutz (Feuerwehr / Krankenwagen)",
          it: "Protezione Civile (Vigili del Fuoco / Ambulanza)", pt: "Proteção Civil (Bombeiros / Ambulância)",
          ru: "Гражданская защита (Пожарные / Скорая помощь)", zh: "民防（消防/救护车）",
          ko: "민방위대 (소방/구급차)", tr: "Sivil Savunma (İtfaiye / Ambulans)", he: "הגנה אזרחית (כבאות / אמבולנס)",
        };
        hours = HOURS_24;
        break;
      case "Gendarmerie Royale":
        name = {
          es: "Gendarmería Real", de: "Königliche Gendarmerie", it: "Gendarmeria Reale", pt: "Gendarmaria Real",
          ru: "Королевская жандармерия", zh: "皇家宪兵队", ko: "왕립 헌병대", tr: "Kraliyet Jandarması", he: "הז'נדרמריה המלכותית",
        };
        hours = HOURS_24;
        break;
      case "Hôpital Mohammed V (Essaouira)":
        name = {
          es: "Hospital Mohammed V (Essaouira)", de: "Krankenhaus Mohammed V (Essaouira)", it: "Ospedale Mohammed V (Essaouira)",
          pt: "Hospital Mohammed V (Essaouira)", ru: "Больница Мохаммед V (Эс-Сувейра)", zh: "穆罕默德五世医院（埃萨维拉）",
          ko: "모하메드 5세 병원 (에사우이라)", tr: "Mohammed V Hastanesi (Essaouira)", he: "בית החולים מוחמד החמישי (אסווירה)",
        };
        notes = VERIFY;
        break;
      case "Pharmacie de garde":
        name = {
          es: "Farmacia de guardia", de: "Notdienstapotheke", it: "Farmacia di turno", pt: "Farmácia de serviço",
          ru: "Дежурная аптека", zh: "值班药房", ko: "당직 약국", tr: "Nöbetçi eczane", he: "בית מרקחת תורן",
        };
        notes = {
          es: "El horario de las farmacias de guardia cambia cada semana. " + VERIFY.es,
          de: "Der Dienstplan der Notdienstapotheken ändert sich wöchentlich. " + VERIFY.de,
          it: "Il calendario delle farmacie di turno cambia ogni settimana. " + VERIFY.it,
          pt: "O calendário das farmácias de serviço muda todas as semanas. " + VERIFY.pt,
          ru: "Расписание дежурных аптек меняется каждую неделю. " + VERIFY.ru,
          zh: "值班药房的排班每周都会变化。" + VERIFY.zh,
          ko: "당직 약국 일정은 매주 변경됩니다. " + VERIFY.ko,
          tr: "Nöbetçi eczane programı her hafta değişir. " + VERIFY.tr,
          he: "לוח הזמנים של בתי המרקחת התורנים משתנה מדי שבוע. " + VERIFY.he,
        };
        break;
      case "Commissariat central d'Essaouira":
        name = {
          es: "Comisaría central de Essaouira", de: "Zentrale Polizeiwache Essaouira", it: "Commissariato centrale di Essaouira",
          pt: "Esquadra central de Essaouira", ru: "Центральный полицейский участок Эс-Сувейры", zh: "埃萨维拉中央警察局",
          ko: "에사우이라 중앙 경찰서", tr: "Essaouira Merkez Karakolu", he: "התחנה המרכזית של המשטרה באסווירה",
        };
        notes = VERIFY;
        break;
      case "Distributeurs automatiques (banques)":
        name = {
          es: "Cajeros automáticos (bancos)", de: "Geldautomaten (Banken)", it: "Bancomat (banche)", pt: "Multibanco (bancos)",
          ru: "Банкоматы (банки)", zh: "自动取款机（银行）", ko: "현금인출기 (은행)", tr: "ATM'ler (bankalar)", he: "כספומטים (בנקים)",
        };
        notes = {
          es: "Varios bancos (Attijariwafa Bank, BMCE, Banque Populaire...) tienen sucursales con cajeros automáticos en la medina y en la avenida Mohammed V.",
          de: "Mehrere Banken (Attijariwafa Bank, BMCE, Banque Populaire...) haben Filialen mit Geldautomaten in der Medina und an der Avenue Mohammed V.",
          it: "Diverse banche (Attijariwafa Bank, BMCE, Banque Populaire...) hanno filiali con bancomat nella medina e nell'avenue Mohammed V.",
          pt: "Vários bancos (Attijariwafa Bank, BMCE, Banque Populaire...) têm agências com multibanco na medina e na avenida Mohammed V.",
          ru: "У нескольких банков (Attijariwafa Bank, BMCE, Banque Populaire...) есть отделения с банкоматами в медине и на проспекте Мохаммед V.",
          zh: "多家银行（Attijariwafa Bank、BMCE、Banque Populaire等）在麦地那老城和穆罕默德五世大道设有分行及自动取款机。",
          ko: "여러 은행(Attijariwafa Bank, BMCE, Banque Populaire 등)이 메디나와 모하메드 5세 대로에 ATM을 갖춘 지점을 운영하고 있습니다.",
          tr: "Birçok banka (Attijariwafa Bank, BMCE, Banque Populaire...) medine ve Mohammed V Caddesi'nde ATM'li şubelere sahiptir.",
          he: "לכמה בנקים (Attijariwafa Bank, BMCE, Banque Populaire...) יש סניפים עם כספומטים במדינה העתיקה ובשדרות מוחמד החמישי.",
        };
        break;
      case "Station de taxis — Place Moulay Hassan":
        name = {
          es: "Parada de taxis — Plaza Moulay Hassan", de: "Taxistand — Place Moulay Hassan", it: "Stazione dei taxi — Place Moulay Hassan",
          pt: "Praça de táxis — Place Moulay Hassan", ru: "Стоянка такси — площадь Мулай-Хасан", zh: "出租车站——穆莱哈桑广场",
          ko: "택시 승강장 — 물레이 하산 광장", tr: "Taksi durağı — Moulay Hassan Meydanı", he: "תחנת מוניות — כיכר מולאי חסן",
        };
        break;
      case "Opérateurs (Maroc Telecom, Orange, Inwi)":
        name = {
          es: "Operadores (Maroc Telecom, Orange, Inwi)", de: "Mobilfunkanbieter (Maroc Telecom, Orange, Inwi)",
          it: "Operatori (Maroc Telecom, Orange, Inwi)", pt: "Operadoras (Maroc Telecom, Orange, Inwi)",
          ru: "Операторы (Maroc Telecom, Orange, Inwi)", zh: "运营商（摩洛哥电信、Orange、Inwi）",
          ko: "통신사 (Maroc Telecom, Orange, Inwi)", tr: "Operatörler (Maroc Telecom, Orange, Inwi)",
          he: "ספקיות סלולר (Maroc Telecom, Orange, Inwi)",
        };
        notes = {
          es: "Tarjetas SIM prepago a la venta en las tiendas de los operadores y en la mayoría de los quioscos.",
          de: "Prepaid-SIM-Karten sind in den Shops der Anbieter und den meisten Kiosken erhältlich.",
          it: "Schede SIM prepagate in vendita nei negozi degli operatori e nella maggior parte dei chioschi.",
          pt: "Cartões SIM pré-pagos à venda nas lojas das operadoras e na maioria dos quiosques.",
          ru: "Предоплаченные SIM-карты продаются в магазинах операторов и в большинстве киосков.",
          zh: "预付费SIM卡可在运营商门店及大多数报刊亭购买。",
          ko: "선불 SIM 카드는 통신사 매장과 대부분의 키오스크에서 구매할 수 있습니다.",
          tr: "Ön ödemeli SIM kartlar operatör mağazalarında ve çoğu büfede satılmaktadır.",
          he: "כרטיסי SIM בתשלום מראש נמכרים בחנויות הספקיות וברוב הדוכנים.",
        };
        break;
      default:
        continue;
    }

    const update: Record<string, unknown> = {};
    if (name) update.name = { ...c.name, ...name };
    if (hours) update.hours = { ...(c.hours ?? {}), ...hours };
    if (notes) update.notes = { ...(c.notes ?? {}), ...notes };
    await db.update(emergencyContacts).set(update).where(eq(emergencyContacts.id, c.id));
    console.log(`  contact "${nameFr}" done`);
  }

  console.log("Translating assistance guides...");
  const GUIDES: Record<string, { title: Record<string, string>; body: Record<string, string> }> = {
    "passeport-perdu": {
      title: {
        es: "Perdí mi pasaporte", de: "Ich habe meinen Reisepass verloren", it: "Ho perso il passaporto",
        pt: "Perdi o meu passaporte", ru: "Я потерял паспорт", zh: "我丢失了护照", ko: "여권을 분실했어요",
        tr: "Pasaportumu kaybettim", he: "איבדתי את הדרכון שלי",
      },
      body: {
        es: "1. Denuncie la pérdida en la comisaría más cercana (obligatorio) para obtener un justificante.\n2. Contacte con su embajada o consulado para un pasaporte temporal o de regreso.\n3. Guarde una copia digital de su pasaporte (foto en el móvil o email) para agilizar los trámites.",
        de: "1. Melden Sie den Verlust bei der nächsten Polizeiwache (Pflicht), um eine Verlustbescheinigung zu erhalten.\n2. Kontaktieren Sie Ihre Botschaft oder Ihr Konsulat für ein Notreisedokument.\n3. Bewahren Sie eine digitale Kopie Ihres Reisepasses auf (Foto auf dem Handy oder per E-Mail), um die Formalitäten zu beschleunigen.",
        it: "1. Denunciate la perdita al commissariato più vicino (obbligatorio) per ottenere una dichiarazione.\n2. Contattate la vostra ambasciata o consolato per un passaporto temporaneo o di rientro.\n3. Conservate una copia digitale del passaporto (foto sul telefono o email) per velocizzare le pratiche.",
        pt: "1. Comunique a perda na esquadra mais próxima (obrigatório) para obter uma declaração.\n2. Contacte a sua embaixada ou consulado para um passaporte temporário ou de regresso.\n3. Guarde uma cópia digital do seu passaporte (foto no telemóvel ou email) para acelerar os trâmites.",
        ru: "1. Заявите о пропаже в ближайшем полицейском участке (обязательно), чтобы получить справку.\n2. Свяжитесь с вашим посольством или консульством для получения временного или возвратного паспорта.\n3. Храните цифровую копию паспорта (фото в телефоне или на email), чтобы ускорить процедуры.",
        zh: "1. 前往最近的警察局报案（必须），获取遗失证明。\n2. 联系您的大使馆或领事馆申请临时旅行证件或回国证件。\n3. 保留护照的电子副本（手机照片或邮件），以加快办理手续。",
        ko: "1. 가까운 경찰서에 분실 신고를 하여(필수) 분실 확인서를 받으세요.\n2. 임시 여행증명서 발급을 위해 대사관이나 영사관에 연락하세요.\n3. 절차를 빠르게 진행하기 위해 여권 사본(휴대폰 사진 또는 이메일)을 보관하세요.",
        tr: "1. Bir kayıp beyanı almak için en yakın karakola kaybı bildirin (zorunludur).\n2. Geçici veya dönüş pasaportu için büyükelçiliğinizle veya konsolosluğunuzla iletişime geçin.\n3. İşlemleri hızlandırmak için pasaportunuzun dijital bir kopyasını (telefonda fotoğraf veya e-posta) saklayın.",
        he: "1. דווחו על האובדן בתחנת המשטרה הקרובה (חובה) כדי לקבל אישור אובדן.\n2. פנו לשגרירות או לקונסוליה שלכם לקבלת מסמך נסיעה זמני.\n3. שמרו עותק דיגיטלי של הדרכון (תמונה בטלפון או במייל) כדי להאיץ את ההליכים.",
      },
    },
    "vol-telephone": {
      title: {
        es: "Me robaron el teléfono", de: "Mein Handy wurde gestohlen", it: "Mi hanno rubato il telefono",
        pt: "Roubaram-me o telemóvel", ru: "У меня украли телефон", zh: "我的手机被盗了", ko: "휴대폰을 도난당했어요",
        tr: "Telefonum çalındı", he: "הטלפון שלי נגנב",
      },
      body: {
        es: "1. Vaya a la comisaría a presentar una denuncia (necesaria para el seguro).\n2. Bloquee su tarjeta SIM con su operador.\n3. Bloquee o borre su teléfono a distancia si es posible (Buscar mi iPhone / Encontrar mi dispositivo).\n4. Cambie las contraseñas de sus cuentas sensibles.",
        de: "1. Erstatten Sie bei der Polizeiwache Anzeige (für die Versicherung erforderlich).\n2. Lassen Sie Ihre SIM-Karte von Ihrem Anbieter sperren.\n3. Sperren oder löschen Sie Ihr Telefon aus der Ferne, falls möglich (Mein iPhone suchen / Mein Gerät finden).\n4. Ändern Sie die Passwörter Ihrer sensiblen Konten.",
        it: "1. Recatevi al commissariato per sporgere denuncia (necessaria per l'assicurazione).\n2. Fate bloccare la SIM dal vostro operatore.\n3. Bloccate o cancellate il telefono da remoto se possibile (Dov'è il mio iPhone / Trova il mio dispositivo).\n4. Cambiate le password dei vostri account sensibili.",
        pt: "1. Dirija-se à esquadra para apresentar queixa (necessário para o seguro).\n2. Bloqueie o seu cartão SIM junto do seu operador.\n3. Bloqueie ou apague o telemóvel remotamente se possível (Localizar o meu iPhone / Localizar o meu dispositivo).\n4. Altere as palavras-passe das suas contas sensíveis.",
        ru: "1. Обратитесь в полицейский участок, чтобы подать заявление (необходимо для страховки).\n2. Заблокируйте SIM-карту у вашего оператора.\n3. Заблокируйте или удалите данные с телефона удалённо, если возможно (Найти iPhone / Найти устройство).\n4. Смените пароли важных учётных записей.",
        zh: "1. 前往警察局报案（保险理赔需要）。\n2. 联系运营商锁定您的SIM卡。\n3. 尽可能远程锁定或清除手机数据（查找我的iPhone/查找我的设备）。\n4. 更改重要账户的密码。",
        ko: "1. 경찰서에 가서 신고하세요(보험 처리에 필요).\n2. 통신사에 연락하여 SIM 카드를 차단하세요.\n3. 가능하다면 원격으로 휴대폰을 잠그거나 초기화하세요(내 iPhone 찾기 / 내 기기 찾기).\n4. 중요한 계정의 비밀번호를 변경하세요.",
        tr: "1. Sigorta için gerekli olan şikayeti sunmak üzere karakola gidin.\n2. Operatörünüzden SIM kartınızı bloke etmesini isteyin.\n3. Mümkünse telefonunuzu uzaktan kilitleyin veya silin (iPhone'umu Bul / Cihazımı Bul).\n4. Hassas hesaplarınızın şifrelerini değiştirin.",
        he: "1. פנו לתחנת המשטרה להגשת תלונה (נדרש לצורך ביטוח).\n2. חסמו את כרטיס ה-SIM מול הספקית שלכם.\n3. נעלו או מחקו את הטלפון מרחוק אם ניתן (איתור ה-iPhone שלי / איתור המכשיר שלי).\n4. שנו סיסמאות לחשבונות הרגישים שלכם.",
      },
    },
    accident: {
      title: {
        es: "He tenido un accidente", de: "Ich hatte einen Unfall", it: "Ho avuto un incidente", pt: "Tive um acidente",
        ru: "Я попал в аварию", zh: "我遇到了事故", ko: "사고를 당했어요", tr: "Bir kaza geçirdim", he: "היה לי תאונה",
      },
      body: {
        es: "1. Llame de inmediato al 15 (Protección Civil) o al 19 (Policía) según la gravedad.\n2. Asegure la zona si es posible.\n3. En caso de accidente de tráfico, no mueva los vehículos antes de que llegue la policía (salvo urgencia vital) e intercambie los datos del seguro.\n4. Contacte con su seguro de viaje si tiene uno.",
        de: "1. Rufen Sie je nach Schwere sofort die 15 (Zivilschutz) oder die 19 (Polizei) an.\n2. Sichern Sie den Bereich, wenn möglich.\n3. Bei einem Verkehrsunfall bewegen Sie die Fahrzeuge nicht, bevor die Polizei eintrifft (außer bei Lebensgefahr), und tauschen Sie die Versicherungsdaten aus.\n4. Kontaktieren Sie Ihre Reiseversicherung, falls vorhanden.",
        it: "1. Chiamate subito il 15 (Protezione Civile) o il 19 (Polizia) a seconda della gravità.\n2. Mettete in sicurezza la zona se possibile.\n3. In caso di incidente stradale, non spostate i veicoli prima dell'arrivo della polizia (salvo emergenza vitale) e scambiatevi i dati assicurativi.\n4. Contattate la vostra assicurazione di viaggio, se ne avete una.",
        pt: "1. Ligue imediatamente para o 15 (Proteção Civil) ou 19 (Polícia), consoante a gravidade.\n2. Proteja a zona, se possível.\n3. Em caso de acidente rodoviário, não desloque os veículos antes da chegada da polícia (exceto em caso de emergência vital) e troque os dados do seguro.\n4. Contacte o seu seguro de viagem, caso tenha um.",
        ru: "1. Немедленно позвоните по номеру 15 (Гражданская защита) или 19 (Полиция) в зависимости от серьёзности ситуации.\n2. По возможности обезопасьте место происшествия.\n3. При ДТП не перемещайте автомобили до приезда полиции (кроме случаев угрозы жизни) и обменяйтесь страховыми данными.\n4. Свяжитесь со своей туристической страховой компанией, если она у вас есть.",
        zh: "1. 根据严重程度立即拨打15（民防）或19（警察）。\n2. 尽可能确保现场安全。\n3. 发生交通事故时，在警察到达前不要移动车辆（除非有生命危险），并交换保险信息。\n4. 如有旅行保险，请联系保险公司。",
        ko: "1. 상황의 심각성에 따라 즉시 15(민방위대) 또는 19(경찰)에 전화하세요.\n2. 가능하다면 현장을 안전하게 확보하세요.\n3. 교통사고의 경우 생명이 위급하지 않는 한 경찰이 도착하기 전에 차량을 이동시키지 말고 보험 정보를 교환하세요.\n4. 여행자 보험이 있다면 보험사에 연락하세요.",
        tr: "1. Duruma göre hemen 15'i (Sivil Savunma) veya 19'u (Polis) arayın.\n2. Mümkünse bölgeyi güvenli hale getirin.\n3. Trafik kazasında, polis gelmeden araçları hareket ettirmeyin (hayati tehlike olmadıkça) ve sigorta bilgilerini değiş tokuş edin.\n4. Varsa seyahat sigortanızla iletişime geçin.",
        he: "1. התקשרו מיד ל-15 (הגנה אזרחית) או ל-19 (משטרה) בהתאם לחומרת המצב.\n2. אבטחו את האזור אם ניתן.\n3. בתאונת דרכים, אל תזיזו את הרכבים לפני הגעת המשטרה (אלא אם יש סכנת חיים) והחליפו פרטי ביטוח.\n4. פנו לביטוח הנסיעות שלכם אם יש לכם.",
      },
    },
    malade: {
      title: {
        es: "Estoy enfermo/a", de: "Ich bin krank", it: "Sono malato/a", pt: "Estou doente",
        ru: "Я заболел(а)", zh: "我生病了", ko: "몸이 아파요", tr: "Hastayım", he: "אני חולה",
      },
      body: {
        es: "1. En caso de emergencia vital, llame al 15.\n2. Para una consulta no urgente, acuda a una clínica privada o consulta médica (ver la sección Salud).\n3. La mayoría de las clínicas privadas de Essaouira aceptan pago directo de pacientes internacionales; conserve sus facturas para el reembolso de su seguro de viaje.",
        de: "1. Bei einem lebensbedrohlichen Notfall rufen Sie die 15 an.\n2. Für eine nicht dringende Konsultation gehen Sie in eine Privatklinik oder Arztpraxis (siehe Abschnitt Gesundheit).\n3. Die meisten Privatkliniken in Essaouira akzeptieren internationale Patienten gegen direkte Zahlung – bewahren Sie Ihre Rechnungen für die Erstattung durch Ihre Reiseversicherung auf.",
        it: "1. In caso di emergenza vitale, chiamate il 15.\n2. Per una visita non urgente, recatevi in una clinica privata o da un medico (vedere la sezione Salute).\n3. La maggior parte delle cliniche private di Essaouira accetta pazienti internazionali con pagamento diretto: conservate le fatture per il rimborso dell'assicurazione di viaggio.",
        pt: "1. Em caso de emergência vital, ligue para o 15.\n2. Para uma consulta não urgente, dirija-se a uma clínica privada ou consultório médico (ver secção Saúde).\n3. A maioria das clínicas privadas de Essaouira aceita pacientes internacionais com pagamento direto — guarde as suas faturas para reembolso pelo seu seguro de viagem.",
        ru: "1. В случае угрозы жизни звоните по номеру 15.\n2. Для неотложной консультации обратитесь в частную клинику или к врачу (см. раздел «Здоровье»).\n3. Большинство частных клиник Эс-Сувейры принимают иностранных пациентов с прямой оплатой — сохраняйте чеки для возмещения по туристической страховке.",
        zh: "1. 如有生命危险，请拨打15。\n2. 如需非紧急就诊，请前往私人诊所或医生诊室（参见医疗部分）。\n3. 埃萨维拉的大多数私人诊所接受国际患者直接付款——请保留发票以便向旅行保险公司报销。",
        ko: "1. 생명이 위급한 응급 상황이라면 15로 전화하세요.\n2. 긴급하지 않은 진료는 개인 병원이나 의원을 방문하세요(건강 섹션 참조).\n3. 에사우이라의 대부분의 개인 병원은 외국인 환자의 직접 결제를 받습니다. 여행자 보험 환급을 위해 영수증을 보관하세요.",
        tr: "1. Hayati bir acil durumda 15'i arayın.\n2. Acil olmayan bir muayene için özel bir klinik veya doktora gidin (Sağlık bölümüne bakın).\n3. Essaouira'daki özel kliniklerin çoğu uluslararası hastalardan doğrudan ödeme kabul eder; seyahat sigortanızdan geri ödeme almak için faturalarınızı saklayın.",
        he: "1. במקרה חירום מסכן חיים, התקשרו ל-15.\n2. לייעוץ שאינו דחוף, פנו למרפאה פרטית או לרופא (ראו קטגוריית בריאות).\n3. רוב המרפאות הפרטיות באסווירה מקבלות מטופלים בינלאומיים בתשלום ישיר — שמרו את החשבוניות שלכם להחזר מביטוח הנסיעות.",
      },
    },
    "bagages-perdus": {
      title: {
        es: "Perdí mi equipaje", de: "Ich habe mein Gepäck verloren", it: "Ho perso il mio bagaglio", pt: "Perdi a minha bagagem",
        ru: "Я потерял багаж", zh: "我丢失了行李", ko: "짐을 분실했어요", tr: "Bagajımı kaybettim", he: "איבדתי את המזוודות שלי",
      },
      body: {
        es: "1. Si es en el aeropuerto, denuncie la pérdida de inmediato en el mostrador de su aerolínea antes de salir de la zona de equipajes.\n2. Conserve su tarjeta de embarque y la etiqueta del equipaje.\n3. Pida un número de seguimiento (PIR) para seguir su caso.",
        de: "1. Falls dies am Flughafen geschieht, melden Sie den Verlust sofort am Schalter Ihrer Fluggesellschaft, bevor Sie den Gepäckbereich verlassen.\n2. Bewahren Sie Ihre Bordkarte und Ihr Gepäckanhänger auf.\n3. Bitten Sie um eine Verfolgungsnummer (PIR), um Ihren Fall zu verfolgen.",
        it: "1. Se avviene in aeroporto, denunciate subito la perdita al banco della vostra compagnia aerea prima di lasciare la zona bagagli.\n2. Conservate la carta d'imbarco e l'etichetta del bagaglio.\n3. Chiedete un numero di tracciamento (PIR) per seguire la pratica.",
        pt: "1. Se for no aeroporto, comunique a perda imediatamente no balcão da sua companhia aérea antes de sair da zona de bagagens.\n2. Guarde o seu cartão de embarque e a etiqueta da bagagem.\n3. Peça um número de referência (PIR) para acompanhar o seu processo.",
        ru: "1. Если это произошло в аэропорту, немедленно сообщите о пропаже на стойке вашей авиакомпании, прежде чем покинуть зону выдачи багажа.\n2. Сохраните посадочный талон и бирку багажа.\n3. Запросите номер отслеживания (PIR), чтобы следить за статусом дела.",
        zh: "1. 如果在机场发生，请在离开行李领取区前立即向航空公司柜台报告丢失。\n2. 保留您的登机牌和行李标签。\n3. 索取跟踪编号（PIR）以便追踪您的案件。",
        ko: "1. 공항에서 발생한 경우, 수하물 구역을 떠나기 전에 즉시 항공사 카운터에 분실 신고를 하세요.\n2. 탑승권과 수하물 태그를 보관하세요.\n3. 사건을 추적할 수 있도록 추적 번호(PIR)를 요청하세요.",
        tr: "1. Havalimanındaysa, bagaj alanından ayrılmadan önce hemen havayolu şirketinizin gişesine kaybı bildirin.\n2. Biniş kartınızı ve bagaj etiketinizi saklayın.\n3. Dosyanızı takip etmek için bir takip numarası (PIR) isteyin.",
        he: "1. אם זה קרה בשדה התעופה, דווחו מיד על האובדן בדלפק חברת התעופה שלכם לפני שתעזבו את אזור המזוודות.\n2. שמרו את כרטיס העלייה למטוס ואת תווית המזוודה.\n3. בקשו מספר מעקב (PIR) כדי לעקוב אחר הטיפול בתיק שלכם.",
      },
    },
    "avocat-traducteur": {
      title: {
        es: "Necesito un abogado o un traductor", de: "Ich brauche einen Anwalt oder Übersetzer", it: "Ho bisogno di un avvocato o di un traduttore",
        pt: "Preciso de um advogado ou de um tradutor", ru: "Мне нужен адвокат или переводчик", zh: "我需要律师或翻译",
        ko: "변호사나 통역사가 필요해요", tr: "Bir avukata veya tercümana ihtiyacım var", he: "אני זקוק לעורך דין או למתרגם",
      },
      body: {
        es: "1. Su embajada o consulado puede proporcionarle una lista de abogados y traductores jurados locales.\n2. El colegio de abogados de Essaouira/Marrakech puede orientarle hacia un abogado disponible.\n3. En caso de emergencia, el equipo de Essaouira Inside puede ayudarle a encontrar un contacto: utilice el botón SOS.",
        de: "1. Ihre Botschaft oder Ihr Konsulat kann Ihnen eine Liste lokaler vereidigter Anwälte und Übersetzer zur Verfügung stellen.\n2. Die Anwaltskammer von Essaouira/Marrakesch kann Sie an einen verfügbaren Anwalt verweisen.\n3. Im Notfall kann Ihnen das Essaouira-Inside-Team helfen, einen Kontakt zu finden – nutzen Sie den SOS-Button.",
        it: "1. La vostra ambasciata o consolato può fornirvi un elenco di avvocati e traduttori giurati locali.\n2. L'ordine degli avvocati di Essaouira/Marrakech può indirizzarvi verso un avvocato disponibile.\n3. In caso di emergenza, il team di Essaouira Inside può aiutarvi a trovare un contatto: usate il pulsante SOS.",
        pt: "1. A sua embaixada ou consulado pode fornecer-lhe uma lista de advogados e tradutores juramentados locais.\n2. A ordem dos advogados de Essaouira/Marraquexe pode encaminhá-lo para um advogado disponível.\n3. Em caso de emergência, a equipa da Essaouira Inside pode ajudá-lo a encontrar um contacto — utilize o botão SOS.",
        ru: "1. Ваше посольство или консульство может предоставить вам список местных присяжных адвокатов и переводчиков.\n2. Коллегия адвокатов Эс-Сувейры/Марракеша может направить вас к доступному адвокату.\n3. В экстренной ситуации команда Essaouira Inside поможет вам найти контакт — воспользуйтесь кнопкой SOS.",
        zh: "1. 您的大使馆或领事馆可以为您提供当地宣誓律师和翻译人员的名单。\n2. 埃萨维拉/马拉喀什律师协会可以为您推荐一位可提供服务的律师。\n3. 紧急情况下，Essaouira Inside团队可以帮助您找到联系人——请使用SOS按钮。",
        ko: "1. 대사관이나 영사관에서 현지 공인 변호사 및 통역사 목록을 제공받을 수 있습니다.\n2. 에사우이라/마라케시 변호사협회에서 이용 가능한 변호사를 안내받을 수 있습니다.\n3. 긴급 상황 시, Essaouira Inside 팀이 연락처를 찾는 데 도움을 드릴 수 있습니다 — SOS 버튼을 이용하세요.",
        tr: "1. Büyükelçiliğiniz veya konsolosluğunuz size yerel yeminli avukat ve tercüman listesi sağlayabilir.\n2. Essaouira/Marakeş Barosu sizi müsait bir avukata yönlendirebilir.\n3. Acil bir durumda, Essaouira Inside ekibi bir kişiyle iletişime geçmenize yardımcı olabilir — SOS düğmesini kullanın.",
        he: "1. השגרירות או הקונסוליה שלכם יכולה לספק לכם רשימה של עורכי דין ומתרגמים מושבעים מקומיים.\n2. לשכת עורכי הדין של אסווירה/מרקש יכולה להפנות אתכם לעורך דין זמין.\n3. במקרה חירום, צוות Essaouira Inside יכול לעזור לכם למצוא איש קשר — השתמשו בכפתור ה-SOS.",
      },
    },
  };

  const allPages = await db.select().from(contentPages);
  for (const p of allPages) {
    const t = GUIDES[p.slug];
    if (!t) continue;
    await db.update(contentPages).set({
      title: { ...p.title, ...t.title },
      body: { ...p.body, ...t.body },
    }).where(eq(contentPages.id, p.id));
    console.log(`  guide ${p.slug} done`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
