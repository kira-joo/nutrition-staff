// Replaces the QA book "دليل البدائل الغذائية" (food-substitutes-guide)
// frontMatter.aboutBook / frontMatter.introduction and all chapters with
// the real content supplied for this round of manual review — via the
// same repository + block-validation path the real chapter/front-matter
// editing routes use (validateBookBlock, assertBookSizeBudget,
// bookRepository.update with optimistic contentRevision locking), not a
// raw Mongo write. Cover/back-cover assets and Book identity fields are
// left untouched.
//
// Usage: node --env-file=.env --import tsx scripts/qa/update-food-substitutes-guide-content.ts
import mongoose from "mongoose";
import { connectToDatabase } from "../../src/server/core/db/connect";
import { bookRepository } from "../../src/server/books/books.repository";
import { assertBookSizeBudget } from "../../src/server/books/assert-book-size-budget";
import { validateBookBlock } from "../../src/server/books/blocks/validate-book-block";
import { BookBlockType } from "../../src/common/enums";
import type { Chapter } from "../../src/common/interfaces/book-chapter.interface";
import type { BookBlock } from "../../src/common/interfaces/book-block.interface";

const BOOK_ID = "6a7f11ba3076b9a7fe93a8cc";

// ---------------------------------------------------------------------------
// Plain-text block builders. Each returns the raw payload validateBookBlock
// expects (a `type` plus that type's own DTO fields) — id/order are assigned
// by buildBlocks() after validation, matching add-book-block.ts's own
// "{...dto, id: crypto.randomUUID(), order}" pattern.
// ---------------------------------------------------------------------------

function plainRichText(text: string) {
  return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] };
}

function heading(text: string) {
  return { type: BookBlockType.HEADING, text };
}
function subheading(text: string) {
  return { type: BookBlockType.SUBHEADING, text };
}
function paragraph(text: string) {
  return { type: BookBlockType.PARAGRAPH, richText: plainRichText(text) };
}
function bulletList(items: string[]) {
  return { type: BookBlockType.BULLET_LIST, items };
}
function numberedList(items: string[]) {
  return { type: BookBlockType.NUMBERED_LIST, items };
}
function quote(text: string, attribution?: string) {
  return { type: BookBlockType.QUOTE, richText: plainRichText(text), attribution };
}
function tip(text: string, title = "نصيحة د. أمنية") {
  return { type: BookBlockType.TIP, title, richText: plainRichText(text) };
}
function note(text: string, title = "معلومة د. أمنية") {
  return { type: BookBlockType.NOTE, title, richText: plainRichText(text) };
}
function warning(text: string, title?: string) {
  return { type: BookBlockType.WARNING, title, richText: plainRichText(text) };
}

async function buildBlocks(payloads: Record<string, unknown>[]): Promise<BookBlock[]> {
  const blocks: BookBlock[] = [];
  for (const payload of payloads) {
    const dto = await validateBookBlock(payload);
    blocks.push({ ...dto, id: crypto.randomUUID(), order: blocks.length } as BookBlock);
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// Front matter
// ---------------------------------------------------------------------------

const OPENING_QUOTE =
  "التغذية ليست حرماناً، بل هي وعيٌ واختيار. هذا الدليل صُمم ليكون صديقك اليومي والمرجع الذي يمنحك مرونة كاملة في إدارة وجباتك دون مساس بأهدافك الصحية.";

const ABOUT_BOOK_PAYLOADS = [
  heading("نبذة عن الكتاب"),
  paragraph(
    "دليل البدائل الغذائية هو مرجعك اليومي لتبسيط قرارات الطعام دون تعقيد أو حرمان. صُمم هذا الدليل ليمنحك حرية استبدال الأصناف الغذائية بما يناسب ذوقك وظروف يومك، مع الحفاظ الكامل على توازن خطتك الغذائية وأهدافك الصحية."
  ),
  paragraph(
    "من النشويات والبروتينات إلى الدهون والفواكه والحلويات ووجبات الطعام خارج المنزل، ستجد في هذه الصفحات بدائل عملية ومدروسة تدعمك في رحلتك نحو نمط حياة صحي ومستدام."
  ),
  paragraph("إعداد: د. أمنية أحمد — أخصائية التغذية العلاجية والسمنة والنحافة."),
];

const INTRODUCTION_PAYLOADS = [
  heading("المقدمة"),
  quote(OPENING_QUOTE, "د. أمنية أحمد"),
  paragraph(
    "في الصفحات القادمة، ستجد دليلاً عملياً منظّماً على هيئة مجموعات غذائية وموضوعات يومية، بدءاً من القواعد الذهبية للاستبدال، ومروراً بجميع المجموعات الغذائية الأساسية، وصولاً إلى نصائح التعامل مع الرغبة الشديدة في الطعام والتسوق الذكي. استخدم هذا الدليل كمرجع مرن يواكب حياتك اليومية، لا كقائمة ممنوعات."
  ),
];

// ---------------------------------------------------------------------------
// Chapters — wording preserved verbatim from the supplied content; only
// structural grouping into blocks and trivial paste-artifact punctuation
// (stray leading periods, missing separators, mid-word line breaks) is
// cleaned up.
// ---------------------------------------------------------------------------

interface ChapterSpec {
  title: string;
  subtitle: string;
  payloads: Record<string, unknown>[];
}

const CHAPTERS: ChapterSpec[] = [
  {
    title: "كيف تستخدم هذا الدليل؟",
    subtitle: "القواعد الذهبية",
    payloads: [
      paragraph(
        "قد لا تتوافر لديك دائماً عناصر وجبتك المحددة، أو قد تشعر بالرغبة في كسر الروتين والتنويع. يُعد هذا الدليل أداة مرنة تُتيح لك تبديل الأطعمة بحرية وأمان كاملين، مع الحفاظ على التوازن السعري والماكروز."
      ),
      subheading("📌 القواعد الذهبية للاستبدال"),
      bulletList([
        "قاعدة المجموعة الواحدة: يُستبدل الصنف بصنف آخر من نفس المجموعة الغذائية حصراً (نشويات بنشويات، بروتين ببروتين).",
        "معادلة الحصة والتوازن: التزم بالكمية المعادلة المحددة لك في البرنامج المخصص لك.",
        "عدم الجمع: لا تدمج بين الأصناف الأصلية وبدائلها في نفس الوجبة إلا إذا صُرّح لك بذلك في الخطة.",
        "مرونة ومتابعة: في حال الشك أو وجود حالة صحية خاصة (مثل مقاومة الأنسولين أو القولون العصبي)، يُفضل دائماً مراجعة د. أمنية.",
      ]),
      tip("الالتزام لا يعني التكرار؛ التنويع الذكي هو السر الحقيقي للاستمرار دون ملل أو ثبات في الوزن!"),
    ],
  },
  {
    title: "🍞 مجموعة النشويات والمعقدات",
    subtitle: "Carbohydrates",
    payloads: [
      note("النشويات المعقدة غنية بالألياف، وتساعد على ضبط مستويات السكر في الدم واستدامة الطاقة."),
      subheading("إذا كان نظامك يحتوي على (حصة نشويات standard = ¼ رغيف بلدي)"),
      bulletList([
        "شريحة واحدة توست بني / أسمر (كامل الحبة).",
        "3 ملاعق كبيرة (مستوية) أرز مطبوخ (يفضل بني أو بسمتي).",
        "3 ملاعق كبيرة (مستوية) معكرونة مسلوقة (يفضل القمح الكامل).",
        "ثمرة بطاطس صغيرة (حوالي 100 جم) مسلوقة أو مشوية.",
        "ثمرة بطاطا حلوة صغيرة (حوالي 80 - 100 جم).",
        "½ كوب شوفان مطبوخ بالماء أو الحليب.",
        "3 ملاعق كبيرة برغل / فريك / كينوا مطبوخة.",
        "3 أكواب فشار بدون زيت أو بزيت قليل جداً.",
      ]),
      warning("الكميات المحددة هنا هي حصص معيارية، وتختلف الكمية الموصى بها طبقاً للبرنامج المخصص لك."),
    ],
  },
  {
    title: "🥩 مجموعة البروتين البنائي",
    subtitle: "Proteins",
    payloads: [
      note("مرّن جسمك بين مصادر البروتين النباتي والحيواني للوصول لأعلى جودة من الأحماض الأمينية وتحسين الهضم."),
      subheading("البديل المعادل لـ (100 جم صدر دجاج مطبوخ)"),
      bulletList([
        "100 جم سمك مشوي (مثل البولطي، البوري، أو السلمون).",
        "100 جم لحم أحمر قليل الدهن (كندوز/بتلو).",
        "120 جم جمبري أو أسماك بحرية مشوية.",
        "2 بيضة كاملة (أو 1 بيضة كاملة + 2 بياض بيض).",
        "150 جم جبن قريش طازج.",
        "150 جم زبادي يوناني (عالي البروتين/خالي الدسم).",
        "1 علبة تونة مصفاة تماماً من الزيت أو محفوظة في الماء.",
        "½ كوب بقوليات مطبوخة (عدس، حمص، فاصوليا بيضاء) — ملاحظة: تُحسب كبروتين ونشويات معاً.",
      ]),
      tip("حاول إدخال الأسماك الزيتية (كالسلمون والسردين) مرتين أسبوعياً للحصول على أحماض أوميجا-3 المضادة للالتهابات."),
    ],
  },
  {
    title: "🥛 مجموعة الألبان والبدائل",
    subtitle: "Dairy & Alternatives",
    payloads: [
      note("الألبان مصدر ممتاز للكالسيوم والبروتين، ويدعم الزبادي صحة الميكروبيوم (بكتيريا الأمعاء النافعة)."),
      subheading("خيارات التبادلات المتاحة (كوب لبن سائل = 200 مل)"),
      bulletList([
        "1 كوب لبن/حليب (خالي أو قليل الدسم).",
        "1 كوب زبادي طبيعي/بلدي (بدون قشطة).",
        "¾ كوب زبادي يوناني ساده.",
        "100 جم جبنة قريش طازجة.",
        "2 شريحة جبن لايت (قليل الدسم / منخفض الصوديوم).",
        "1 كوب حليب اللوز أو حليب الشوفان (غير محلى ومقوّى بالكالسيوم).",
      ]),
    ],
  },
  {
    title: "🥜 مجموعة الدهون الصحية",
    subtitle: "Healthy Fats",
    payloads: [
      note("الدهون الصحية ضرورية لامتصاص الفيتامينات الذائبة في الدهون وتنظيم هرمونات الجسم."),
      subheading("بديل (1 ملعقة كبيرة زيت زيتون نقي)"),
      bulletList([
        "10 حبات لوز ناضج (غير مملح).",
        "10 حبات فول سوداني خام أو محمص خفيف.",
        "6 أنصاف عين جمل (جوز) — ممتاز لصحة الدماغ.",
        "¼ ثمرة أفوكادو متوسطة.",
        "1 ملعقة كبيرة طحينة خام أو زبدة فول سوداني 100% طبيعية.",
        "1 ملعقة كبيرة بذور الشيا / بذور الكتان / بذور القرع.",
        "5-6 حبات زيتون أسود أو أخضر.",
      ]),
    ],
  },
  {
    title: "🍎 مجموعة الفواكه: حصص وحسابات",
    subtitle: "Fruits",
    payloads: [
      paragraph("تُحسب الحصة الواحدة من الفاكهة في المتوسط بـ 15 جم كربوهيدرات (حوالي 60 سعرة حرارية)."),
      subheading("🍏 فواكه ذات مؤشر جليسمي منخفض إلى متوسط"),
      bulletList([
        "تفاح / كمثرى: ثمرة متوسطة.",
        "برتقال: ثمرة متوسطة (أو 2 يوسفي).",
        "خوخ / برقوق: 2 ثمرة متوسطة.",
        "فراولة: 1 كوب كامل (حوالي 12-15 حبة).",
        "بطيخ / شمام: 1 كوب مكعبات.",
        "أناناس: 2 شريحة دائرية.",
      ]),
      warning("تُتناول بحذر وحسب المكتوب في برنامجك.", "فواكه ذات كثافة سكرية عالية"),
      bulletList([
        "موز: ½ ثمرة كبيرة أو 1 ثمرة صغيرة جداً.",
        "عنب: 10 - 12 حبة فقط.",
        "مانجو: ½ كوب مكعبات (حوالي 80 جم).",
        "تينة طازجة: 2 ثمرة متوسطة.",
        "تمر: 2-3 حبات متوسطة.",
      ]),
    ],
  },
  {
    title: "🥒 الخضروات والمشروبات والحصص الحرة",
    subtitle: "Veggies & Drinks",
    payloads: [
      subheading("🥗 الخضروات الحرة (Free Veggies)"),
      paragraph("(نقدر ناخد منها كميات كبيرة إلى حد ما)"),
      paragraph("غنية بالماء والألياف وقليلة السعرات:"),
      bulletList([
        "الأوراق الخضراء: خيار، خس، جرجير، سبانخ، ملفوف، كابوتشا.",
        "الخضار المطبوخ/النيء: بروكلي، كوسة، فلفل ألوان، طماطم، باذنجان، فاصوليا خضراء، باميا.",
      ]),
      subheading("🌽 الخضروات النشوية (تُحسب ضمن حصص النشويات)"),
      paragraph("البطاطس / البطاطا / الذرة / البازلاء / اللوبيا."),
      subheading("☕ المشروبات المسموحة"),
      bulletList([
        "الماء: المشروب الذهبي (3-4 ليتر يومياً).",
        "المشروبات الدافئة بدون سكر: الشاي، القهوة، القرفة، الزنجبيل، اليانسون، النعناع، والكركديه.",
        'المحليات البديلة: يُسمح باستخدام محلي "ستيفيا" بحد أقصى 1-2 ظروف يومياً عند الحاجة.',
      ]),
      subheading("🥤 بدائل المشروبات الغازية والعصائر المعلبة"),
      bulletList([
        "المياه الفوارة (Sparkling Water): مع إضافة شرائح ليمون طازجة وأوراق النعناع.",
        "الشاي المثلج المنزلي (Iced Tea): شاي أخضر أو أعشاب مغلي ومبرد ومحلى بنقط من الاستيفيا أو بدون سكر.",
        "الماء المنقوع (Infused Water): ماء نقي مع قطع الفاكهة أو الخيار (الانتعاش الطبيعي).",
      ]),
    ],
  },
  {
    title: "🍽️ إتيكيت واستراتيجيات الأكل خارج المنزل",
    subtitle: "Dining Out",
    payloads: [
      subheading("💡 قواعد د. أمنية الـ 4 للوجبات الخارجية"),
      numberedList([
        "شرب 2 كوب من الماء قبل الوجبة بـ 15 دقيقة.",
        "رتب وجبتك: ابدأ بالسلطة والبروتين قبل النشويات لتأخير امتصاص السكر وتقليل الجوع.",
        "طلب الصوصات جانبياً (On the side) — تحكم بنفسك في كمية الدهون والسعرات الحرارية المضافة للوجبة.",
        "اختر المشوي بدلاً من المقلي دائماً.",
      ]),
    ],
  },
  {
    title: "🛍️ دليل التسوق المبتكر وقراءة الملصق الغذائي",
    subtitle: "Smart Shopping",
    payloads: [
      bulletList([
        "🥛 الزبادي واللبن: اختر المكونات البسيطة (حليب + بادئ زبادي)، وتجنب السكر المضاف.",
        "🌾 الشوفان: اختر الشوفان الكامل (Rolled Oats) وتجنب الأنواع المنكهة سريعة التحضير.",
        "🥜 زبدة المكسرات: اختر منتجاً يحتوي على (100% مكسرات) بدون زيوت مهدرجة أو زيت النخيل.",
        "🐟 التونة المعلبة: يفضل التونة المحفوظة في الماء، وإذا كانت في الزيت تُصفى وتُغسل جيداً.",
      ]),
      warning('تجنب المنتجات التي تحتوي على: "زيوت مهدرجة"، "زيت النخيل"، أو "سكر مضاف / شراب الذرة عالي الفركتوز".'),
      paragraph("اختر المكونات القصيرة والواضحة (كلما قلّ عدد المكونات على الغلاف، كان المنتج أنقى وأقل معالجة)."),
      subheading("🥩 بدائل اللحوم المصنعة (اللانشون، السوسيس، البرجر الجاهز)"),
      bulletList([
        "الشرائح المنزلية المجهزة: صدور دجاج أو رومي مطبوخة ومقطعة شرائح مسبقاً في الثلاجة.",
        "المأكولات البحرية والبيض: علب تونة بالماء، بيض مسلوق، أو جبن قريش بالأعشاب ورشة زيت الزيتون.",
      ]),
      subheading("🥫 بدائل الصوصات والمايونيز الجاهز"),
      bulletList([
        "صوص الزبادي والأعشاب: زبادي يوناني خفيف مع ثوم مفروم، نعناع، وليمون.",
        "الطحينة الخام: طحينة سمسم نقي مجهزة بالماء والليمون والخل بدون إضافات مصنعة.",
        "صلصة الطماطم الطبيعية: معجون طماطم منزلي مع توابل وبدون سكر مضاف.",
      ]),
    ],
  },
  {
    title: "🍲 بدائل الأكلات والمطابخ الشعبية",
    subtitle: "Smart Egyptian Swaps",
    payloads: [
      note("لا داعي للحرمان من أكلاتنا الذائعة؛ السر يكمن في طريقة الطهي ونسب المكونات."),
      subheading("المحشي الصحي"),
      paragraph("البديل: استبدل نصف كمية الأرز بالفريك أو الكينوا أو لحم مفروم بدون دهن، وزد من كمية الخضرة (بقدونس، كزبرة، شبت)."),
      subheading("المسقعة الصحية"),
      paragraph("البديل: شوي الباذنجان والفلفل في الفرن أو القلاية الهوائية (Air Fryer) مع رشة زيت زيتون بدلاً من القلي الأعمق."),
      subheading("صينية البشاميل"),
      paragraph(
        "البديل: استخدام معكرونة القمح الكامل، وحليب خالي الدسم، وتكثيف الصوص بالشوفان المطحون بدلاً من الدقيق الأبيض والزبدة الكثيفة."
      ),
      subheading("الكفتة"),
      paragraph("البديل: إضافة البرغل أو الشوفان المطحون للكفتة بدلاً من الخبز والدهون العالية، مع طهيها بالفرن."),
    ],
  },
  {
    title: "🧠 دليل التعامل مع الجوع العاطفي والسكريات",
    subtitle: "Cravings Guide",
    payloads: [
      note("الجوع المفاجئ الشديد غالباً ما يكون جوعاً عاطفياً أو عطشاً مشفراً!"),
      subheading("🛑 خطة الـ 15 دقيقة عند الشعور بالرغبة في السكريات"),
      numberedList([
        "اشرب 2 كوب من الماء الدافئ أو كوب يانسون/نعناع.",
        "انتظر 15 دقيقة وشغل نفسك بنشاط آخر.",
        "إذا استمر الشعور، اختر أحد البدائل الذكية التالية:",
      ]),
      subheading("🍫 بدائل الحلويات والمقرمشات"),
      bulletList([
        "بديل الشوكولاتة العادية: 2 مربع شوكولاتة داكنة (70% كاكاو فأكثر).",
        "بديل الآيس كريم: موز مجمد مجروش مع 2 ملعقة زبادي يوناني ورشة كاكاو خام.",
        "الزبادي المثلج بالفاكهة: زبادي يوناني مثلج مع التوت والفراولة.",
        "بديل الحلويات الشرقية: 2 ثمرة تمر محشوة بـ 2 حبة مكسرات أو رشة طحينة خام أو زبدة فول سوداني طبيعية 100%.",
        "بديل الشيبس والمقرمشات: ½ كوب حمص شام محمص بالكمون والبابريكا، أو 3 أكواب فشار بدون زيت.",
      ]),
    ],
  },
  {
    title: "💧 المشروبات العشبية وتنظيم المكملات",
    subtitle: "Hydration & Supplements",
    payloads: [
      subheading("☕ مشروبات لدعم الهضم والتقليل من الانتفاخ"),
      bulletList([
        "النعناع والينسون: لتهدئة القولون والاسترخاء.",
        "الشمر والزنجبيل: لتحسين حركة الأمعاء وتقليل احتباس السوائل.",
        "الكركديه البارد: ممتاز لضبط ضغط الدم وتنشيط الدورة الدموية.",
      ]),
      subheading("💊 الجدول الموصى به لتناول المكملات (إذا كانت مدونة لك)"),
      bulletList([
        "فيتامين د (Vitamin D): يُتناول فوراً بعد وجبة غنية بدهون صحية (مثل الغداء).",
        "الحديد (Iron): يُتناول على معدة فارغة مع كوب ماء أو ليمون (فيتامين C)، ويُفصل عن الألبان والشاي بـ 2 ساعة.",
        "أوميجا 3 (Omega 3): أثناء الوجبة الرئيسية لمنع التجشؤ أو اضطراب المعدة.",
        "الزنك / المغنيسيوم: يُفضل تناولهما مساءً قبل النوم لتهدئة الأعصاب وتحسين جودة النوم.",
      ]),
    ],
  },
  {
    title: "💚 رسالة د. أمنية والجمارك الغذائية",
    subtitle: "Mindset & Final Words",
    payloads: [
      quote(
        "لا يوجد طعام سيئ وطعام جيد بشكل مطلق.. العلاقة مع الطعام هي علاقة توازن ووعي، وليست قائمة من الممنوعات. الهدف هو تحويل التغذية إلى نمط حياة مستدام تحبه وتستمتع به.",
        "د. أمنية أحمد"
      ),
      subheading("📋 خلاصة الدليل السريعة"),
      bulletList([
        "التبديل يكون دائماً من نفس المجموعة.",
        "احترم حجوم الحصص المحددة لك.",
        "شرب الماء والألياف هما حجر الزاوية لجهاز هضمي نشط.",
        "اقرأ المكونات والملصق التغذوي قبل الشراء.",
        "استمتع وركز على رحلتك والصحة المستدامة!",
      ]),
      subheading("📞 للتواصل والمتابعة الطبية"),
      paragraph("د. أمنية أحمد — أخصائية التغذية العلاجية والسمنة والنحافة."),
    ],
  },
];

async function main() {
  await connectToDatabase();

  const book = await bookRepository.findOne({ where: { _id: BOOK_ID } });
  console.log(`Loaded book "${book.title}" (contentRevision ${book.contentRevision}, ${book.chapters.length} existing chapters)`);

  const nextAboutBookBlocks = await buildBlocks(ABOUT_BOOK_PAYLOADS);
  const nextIntroductionBlocks = await buildBlocks(INTRODUCTION_PAYLOADS);

  const nextChapters: Chapter[] = [];
  for (const spec of CHAPTERS) {
    const blocks = await buildBlocks(spec.payloads);
    nextChapters.push({
      id: crypto.randomUUID(),
      title: spec.title,
      subtitle: spec.subtitle,
      coverImage: null,
      startOnNewPage: true,
      includeInToc: true,
      blocks,
      order: nextChapters.length,
    });
  }

  const nextFrontMatter = {
    aboutBook: { blocks: nextAboutBookBlocks },
    introduction: { blocks: nextIntroductionBlocks },
  };

  assertBookSizeBudget({ ...book, chapters: nextChapters, frontMatter: nextFrontMatter } as unknown as Record<string, unknown>);

  const saved = await bookRepository.update(
    { where: { _id: BOOK_ID, contentRevision: book.contentRevision } },
    { chapters: nextChapters, frontMatter: nextFrontMatter, contentRevision: book.contentRevision + 1 }
  );

  console.log(`Saved. New contentRevision: ${saved.contentRevision}, chapters: ${saved.chapters.length}`);
  console.log("NOTE: this only updates the DRAFT. Publish a new Edition (and regenerate the PDF) to reflect this in the public reader / PDF.");

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
