import 'server-only'
import ZAI from 'z-ai-web-dev-sdk'

// ─── لایه اتصال به مدل هوش مصنوعی (قابل تعویض ارائه‌دهنده) ──────
// کلید و آدرس سرویس از فایل پیکربندی (.z-ai-config) خوانده می‌شود؛
// برای استقرار مستقل، README بخش «اتصال هوش مصنوعی» را ببینید.

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const DEFAULT_TIMEOUT_MS = 90_000
const MAX_OUTPUT_CHARS = 12_000

export async function chatComplete(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {}
): Promise<string> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS

  const zai = await ZAI.create()
  const completion = (await Promise.race([
    zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      ...(opts.maxTokens !== undefined ? { max_tokens: opts.maxTokens } : {}),
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI_TIMEOUT')), timeoutMs)
    ),
  ])) as { choices?: Array<{ message?: { content?: string } }> }

  const text = completion?.choices?.[0]?.message?.content?.trim() ?? ''
  if (!text) throw new Error('AI_EMPTY_RESPONSE')
  return text.slice(0, MAX_OUTPUT_CHARS)
}

// ─── تعریف ابزارهای عمومی سایت ──────────────────────────────────

export interface ToolField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select'
  placeholder?: string
  options?: string[]
  maxLength: number
  required: boolean
}

export interface AiToolDef {
  id: string
  title: string
  description: string
  fields: ToolField[]
  maxOutputTokens: number
  buildPrompt: (input: Record<string, string>) => ChatMessage[]
}

const BASE_STYLE =
  'همیشه فارسی روان، حرفه‌ای و بدون اغراق بنویس. از ادعای تأییدنشده، آمار جعلی و تضمین‌های غیرواقعی پرهیز کن. از عناوين و عبارت‌های کلیشه‌ای تجاری استفاده نکن.'

export const AI_TOOLS: AiToolDef[] = [
  {
    id: 'content-writer',
    title: 'دستیار تولید محتوای فارسی',
    description: 'تولید متن ساختاریافته و روان فارسی بر اساس موضوع و لحن دلخواه شما.',
    fields: [
      { name: 'topic', label: 'موضوع', type: 'text', placeholder: 'مثلاً: مزایای طراحی سایت اختصاصی برای کسب‌وکارهای کوچک', maxLength: 300, required: true },
      { name: 'tone', label: 'لحن', type: 'select', options: ['رسمی و حرفه‌ای', 'صمیمی و ساده', 'آموزشی', 'تبلیغاتی ملایم'], maxLength: 50, required: true },
      { name: 'length', label: 'حجم تقریبی', type: 'select', options: ['کوتاه (حدود ۱۵۰ کلمه)', 'متوسط (حدود ۳۰۰ کلمه)', 'بلند (حدود ۵۰۰ کلمه)'], maxLength: 50, required: false },
      { name: 'notes', label: 'نکات دلخواه (اختیاری)', type: 'textarea', placeholder: 'هر نکته‌ای که باید در متن رعایت شود', maxLength: 800, required: false },
    ],
    maxOutputTokens: 2000,
    buildPrompt: (i) => [
      { role: 'system', content: `تو یک نویسنده محتوای حرفه‌ای فارسی هستی. ${BASE_STYLE}` },
      { role: 'user', content: `یک متن درباره موضوع زیر بنویس.\n\nموضوع: ${i.topic}\nلحن: ${i.tone}${i.length ? `\nحجم: ${i.length}` : ''}${i.notes ? `\nنکات: ${i.notes}` : ''}\n\nمتن را با ساختار تمیز (در صورت نیاز با تیترهای Markdown) ارائه کن.` },
    ],
  },
  {
    id: 'seo-draft',
    title: 'پیش‌نویس مقاله سئو شده',
    description: 'تولید پیش‌نویس ساختاریافته مقاله با کلمه کلیدی هدف، مقدمه، تیترها و جمع‌بندی.',
    fields: [
      { name: 'keyword', label: 'کلمه کلیدی اصلی', type: 'text', placeholder: 'مثلاً: طراحی سایت فروشگاهی', maxLength: 100, required: true },
      { name: 'audience', label: 'مخاطب هدف', type: 'text', placeholder: 'مثلاً: صاحبان کسب‌وکارهای کوچک', maxLength: 200, required: true },
      { name: 'goal', label: 'هدف مقاله', type: 'text', placeholder: 'مثلاً: آگاهی‌بخشی و هدایت به صفحه خدمات', maxLength: 300, required: false },
    ],
    maxOutputTokens: 3500,
    buildPrompt: (i) => [
      { role: 'system', content: `تو متخصص سئو و نویسنده محتوای فارسی هستی. ${BASE_STYLE} ساختار خروجی باید شامل این بخش‌ها باشد: یک عنوان پیشنهادی، توضیحات متا (حدود ۱۵۵ کاراکتر)، مقدمه، تیترهای H2 و H3 به‌صورت Markdown، متن هر بخش، و جمع‌بندی. کلمه کلیدی را طبیعی و بدون تکرار اغراق‌آمیز به کار ببر.` },
      { role: 'user', content: `برای کلمه کلیدی «${i.keyword}» و مخاطب «${i.audience}»${i.goal ? ` با هدف «${i.goal}»` : ''} یک پیش‌نویس مقاله کامل بنویس.` },
    ],
  },
  {
    id: 'meta-suggest',
    title: 'پیشنهاد عنوان و توضیحات متا',
    description: 'پیشنهاد چند گزینه عنوان SEO و توضیحات متا با طول استاندارد.',
    fields: [
      { name: 'pageTopic', label: 'موضوع صفحه یا مقاله', type: 'textarea', placeholder: 'خلاصه‌ای از محتوای صفحه', maxLength: 600, required: true },
      { name: 'keyword', label: 'کلمه کلیدی اصلی', type: 'text', maxLength: 100, required: true },
    ],
    maxOutputTokens: 1200,
    buildPrompt: (i) => [
      { role: 'system', content: 'تو متخصص سئو فارسی هستی. برای هر گزینه، عنوان (حداکثر ۶۰ کاراکتر) و توضیحات متا (۱۴۰ تا ۱۶۰ کاراکتر) ارائه کن. خروجی را به‌صورت فهرست شماره‌دار با ۴ گزینه متفاوت بده و طول هر مورد را کنارش بنویس.' },
      { role: 'user', content: `موضوع: ${i.pageTopic}\nکلمه کلیدی: ${i.keyword}` },
    ],
  },
  {
    id: 'idea-brainstorm',
    title: 'ایده‌پردازی مقاله و تقویم محتوایی',
    description: 'تولید ایده‌های مقاله و پیشنهاد برنامه انتشار ماهانه بر اساس حوزه کسب‌وکار.',
    fields: [
      { name: 'business', label: 'حوزه کسب‌وکار', type: 'text', placeholder: 'مثلاً: خدمات طراحی سایت و سئو', maxLength: 200, required: true },
      { name: 'count', label: 'تعداد ایده', type: 'select', options: ['۱۰ ایده', '۲۰ ایده', '۳۰ ایده'], maxLength: 20, required: false },
      { name: 'extra', label: 'نکات تکمیلی', type: 'textarea', maxLength: 500, required: false },
    ],
    maxOutputTokens: 2500,
    buildPrompt: (i) => [
      { role: 'system', content: 'تو استراتژیست محتوای فارسی هستی. ایده‌ها را در قالب جدول Markdown ارائه کن با ستون‌های: عنوان مقاله، کلمه کلیدی هدف، intent جست‌وجو (اطلاعاتی/تجاری)، و توضیح یک‌خطی. در پایان یک تقویم انتشار ۴ هفته‌ای پیشنهاد بده.' },
      { role: 'user', content: `برای کسب‌وکار «${i.business}» ${i.count ?? '۲۰ ایده'} ایده مقاله بده.${i.extra ? `\nنکات: ${i.extra}` : ''}` },
    ],
  },
  {
    id: 'heading-structure',
    title: 'ساختار سرفصل‌ها (H1، H2، H3)',
    description: 'پیشنهاد ساختار منطقی هدینگ‌ها برای مقاله یا صفحه بر اساس موضوع.',
    fields: [
      { name: 'topic', label: 'موضوع', type: 'textarea', placeholder: 'موضوع مقاله یا صفحه و نکات کلیدی آن', maxLength: 600, required: true },
    ],
    maxOutputTokens: 1500,
    buildPrompt: (i) => [
      { role: 'system', content: 'تو متخصص معماری محتوای سئو هستی. یک ساختار سلسله‌مراتبی هدینگ پیشنهاد بده: یک H1، بین ۴ تا ۷ عدد H2 و در صورت نیاز H3 زیرمجموعه. برای هر هدینگ یک جمله توضیح درباره محتوای پیشنهادی آن بخش بنویس. از Markdown برای نمایش سلسله‌مراتب استفاده کن.' },
      { role: 'user', content: `موضوع: ${i.topic}` },
    ],
  },
  {
    id: 'rewrite',
    title: 'بازنویسی و بهبود متن',
    description: 'بازنویسی متن شما با رعایت املای درست، روانی و لحن انتخابی.',
    fields: [
      { name: 'text', label: 'متن ورودی', type: 'textarea', placeholder: 'متنی که باید بازنویسی شود', maxLength: 4000, required: true },
      { name: 'mode', label: 'نوع بازنویسی', type: 'select', options: ['روان‌سازی و اصلاح نگارش', 'خلاصه‌سازی', 'رسمی‌تر کردن', 'ساده‌تر کردن'], maxLength: 50, required: true },
    ],
    maxOutputTokens: 2500,
    buildPrompt: (i) => [
      { role: 'system', content: `تو ویراستار حرفه‌ای فارسی هستی. ${BASE_STYLE} فقط متن بازنویسی‌شده را خروجی بده؛ توضیح اضافه ننویس.` },
      { role: 'user', content: `متن زیر را با سبک «${i.mode}» بازنویسی کن:\n\n${i.text}` },
    ],
  },
  {
    id: 'social-ideas',
    title: 'ایده محتوای شبکه‌های اجتماعی',
    description: 'تولید ایده پست و کپشن پیشنهادی برای شبکه‌های اجتماعی کسب‌وکار شما.',
    fields: [
      { name: 'business', label: 'کسب‌وکار / برند', type: 'text', maxLength: 200, required: true },
      { name: 'platform', label: 'پلتفرم', type: 'select', options: ['اینستاگرام', 'لینکدین', 'تلگرام', 'ایکس (توییتر)'], maxLength: 30, required: true },
      { name: 'count', label: 'تعداد ایده', type: 'select', options: ['۵ ایده', '۱۰ ایده'], maxLength: 20, required: false },
    ],
    maxOutputTokens: 2000,
    buildPrompt: (i) => [
      { role: 'system', content: 'تو مدیر شبکه‌های اجتماعی فارسی‌زبان هستی. برای هر ایده: نوع پست، توضیح محتوا، و یک کپشن پیشنهادی کوتاه با هشتگ‌های مرتبط ارائه کن. از ادعاهای غیرواقعی و سبک‌های تمام‌تبلیغاتی پرهیز کن.' },
      { role: 'user', content: `کسب‌وکار: ${i.business}\nپلتفرم: ${i.platform}\nتعداد: ${i.count ?? '۵ ایده'}` },
    ],
  },
  {
    id: 'faq-assistant',
    title: 'دستیار پرسش و پاسخ خدمات',
    description: 'پاسخ عمومی به سؤالات شما درباره خدمات طراحی سایت، محتوا و سئو.',
    fields: [
      { name: 'question', label: 'سؤال شما', type: 'textarea', placeholder: 'مثلاً: طراحی سایت شرکتی چه مدت زمان می‌برد؟', maxLength: 500, required: true },
    ],
    maxOutputTokens: 1500,
    buildPrompt: (i) => [
      { role: 'system', content: `تو دستیار هوشمند یک آژانس خدمات دیجیتال ایرانی به نام «کافه‌دانش» هستی که خدمات طراحی سایت، تولید محتوا و سئو ارائه می‌دهد. به سؤالات کاربر به فارسی، دقیق و بدون اغراق پاسخ بده. برای موارد خاص (قیمت دقیق، زمان تحویل قطعی) توضیح بده که برای استعلام دقیق باید با تیم مشورت کرد. اگر سؤال خارج از حوزه خدمات دیجیتال بود، محترمانه اعلام کن که خارج از تخصص این دستیار است.` },
      { role: 'user', content: i.question },
    ],
  },
]

export function getTool(id: string): AiToolDef | undefined {
  return AI_TOOLS.find((t) => t.id === id)
}

// ─── تولید پیش‌نویس مقاله در پنل مدیریت ─────────────────────────

export interface ArticleGenInput {
  topic: string
  keyword: string
  audience: string
  tone: string
  goal: string
}

export const ARTICLE_GEN_MAX = { topic: 300, keyword: 100, audience: 200, tone: 60, goal: 300 }

export function buildArticleGenPrompt(input: ArticleGenInput): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `تو نویسنده و متخصص سئوی ارشد محتوای فارسی هستی. ${BASE_STYLE}
خروجی را دقیقاً با این ساختار JSON معتبر ارائه کن (بدون هیچ متن اضافه قبل یا بعد از JSON):
{
  "seoTitle": "عنوان سئو حداکثر ۶۰ کاراکتر",
  "metaDescription": "توضیحات متا ۱۴۰ تا ۱۶۰ کاراکتر",
  "slug": "english-slug-with-hyphens",
  "title": "عنوان مقاله",
  "excerpt": "خلاصه دو تا سه جمله‌ای",
  "coverImageAlt": "متن جایگزین پیشنهادی برای تصویر شاخص",
  "content": "متن کامل مقاله با Markdown شامل مقدمه، هدینگ‌های ## و ###، متن هر بخش، پرسش‌های متداول در انتها (## پرسش‌های متداول با ۳ سؤال و پاسخ) و جمع‌بندی",
  "tags": ["برچسب۱", "برچسب۲", "برچسب۳"],
  "internalLinkSuggestions": ["پیشنهاد لینک داخلی به صفحه خدمات X", "..."],
  "sourceSuggestions": ["نوع منبع قابل‌استناد برای بررسی نویسنده", "..."]
}
فقط JSON معتبر برگردان. محتوای content باید حداقل ۶۰۰ کلمه باشد و کلمه کلیدی «${input.keyword}» را طبیعی به کار ببرد. منابع را به‌صورت «نوع منبع برای بررسی» پیشنهاد بده نه لینک جعلی.`,
    },
    {
      role: 'user',
      content: `موضوع مقاله: ${input.topic}
کلمه کلیدی اصلی: ${input.keyword}
مخاطب هدف: ${input.audience}
لحن: ${input.tone}
هدف مقاله: ${input.goal}`,
    },
  ]
}

export function extractJson(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[0])
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}
