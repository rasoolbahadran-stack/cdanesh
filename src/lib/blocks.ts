// ─── بلوک‌های محتوای مقاله: تایپ، پارسر منبع و مبدل متقابل ──────
// فرمت ذخیره در DB: JSON.stringify(Block[])
// فرمت ویرایش در پنل: متن خط‌محور (## عنوان، - لیست، > نقل‌قول، [img] ...، [cta] ...)

export type Block =
  | { p: string }
  | { h2: string; id?: string }
  | { h3: string }
  | { ul: string[] }
  | { ol: string[] }
  | { img: { src: string; alt: string; cap?: string } }
  | { quote: string }
  | { cta: { pre?: string; label: string; link: string; post?: string } }

export type SourceLine =
  | { t: 'p' | 'h2' | 'h3' | 'quote'; text: string }
  | { t: 'ul' | 'ol'; items: string[] }
  | { t: 'img'; src: string; alt: string; cap?: string }
  | { t: 'cta'; pre?: string; label: string; link: string; post?: string }

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** متن خط‌محور پنل → بلوک‌ها */
export function parseSource(src: string): Block[] {
  const lines = String(src || '').replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let list: { t: 'ul' | 'ol'; items: string[] } | null = null
  const flush = () => {
    if (list && list.items.length) blocks.push(list.t === 'ul' ? { ul: list.items } : { ol: list.items })
    list = null
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flush()
      continue
    }
    if (/^###\s+/.test(line)) {
      flush()
      blocks.push({ h3: line.replace(/^###\s+/, '') })
    } else if (/^##\s+/.test(line)) {
      flush()
      blocks.push({ h2: line.replace(/^##\s+/, '') })
    } else if (/^>\s?/.test(line)) {
      flush()
      blocks.push({ quote: line.replace(/^>\s?/, '') })
    } else if (/^-\s/.test(line)) {
      if (list?.t !== 'ul') {
        flush()
        list = { t: 'ul', items: [] }
      }
      list.items.push(line.replace(/^-\s/, ''))
    } else if (/^\d+\.\s/.test(line)) {
      if (list?.t !== 'ol') {
        flush()
        list = { t: 'ol', items: [] }
      }
      list.items.push(line.replace(/^\d+\.\s/, ''))
    } else if (/^\[img\]\s?/.test(line)) {
      flush()
      // [img] src | alt | caption
      const parts = line.replace(/^\[img\]\s?/, '').split('|').map((s) => s.trim())
      blocks.push({ img: { src: parts[0] || '', alt: parts[1] || '', cap: parts[2] } })
    } else if (/^\[cta\]\s?/.test(line)) {
      flush()
      // [cta] متن قبل | برچسب | لینک | متن بعد
      const parts = line.replace(/^\[cta\]\s?/, '').split('|').map((s) => s.trim())
      blocks.push({ cta: { pre: parts[0] || undefined, label: parts[1] || '', link: parts[2] || '', post: parts[3] || undefined } })
    } else {
      flush()
      blocks.push({ p: line })
    }
  }
  flush()
  return blocks
}

/** بلوک‌ها → متن خط‌محور (برای ویرایشگر پنل) */
export function blocksToSource(blocks: Block[]): string {
  const out: string[] = []
  for (const b of blocks) {
    if ('p' in b) out.push(b.p)
    else if ('h2' in b) out.push(`## ${b.h2}`)
    else if ('h3' in b) out.push(`### ${b.h3}`)
    else if ('ul' in b) b.ul.forEach((i) => out.push(`- ${i}`))
    else if ('ol' in b) b.ol.forEach((i, n) => out.push(`${n + 1}. ${i}`))
    else if ('img' in b) out.push(`[img] ${b.img.src} | ${b.img.alt}${b.img.cap ? ' | ' + b.img.cap : ''}`)
    else if ('quote' in b) out.push(`> ${b.quote}`)
    else if ('cta' in b)
      out.push(`[cta] ${b.cta.pre || ''} | ${b.cta.label} | ${b.cta.link}${b.cta.post ? ' | ' + b.cta.post : ''}`)
    out.push('')
  }
  return out.join('\n').trim()
}

/** متن ساده از بلوک‌ها (برای زمان مطالعه/خلاصه) */
export function blocksPlainText(blocks: Block[]): string {
  const parts: string[] = []
  for (const b of blocks) {
    if ('p' in b) parts.push(b.p)
    else if ('h2' in b) parts.push(b.h2)
    else if ('h3' in b) parts.push(b.h3)
    else if ('ul' in b) parts.push(b.ul.join(' '))
    else if ('ol' in b) parts.push(b.ol.join(' '))
    else if ('quote' in b) parts.push(b.quote)
    else if ('img' in b) parts.push(b.img.alt || '')
    else if ('cta' in b) parts.push(`${b.cta.pre || ''} ${b.cta.label} ${b.cta.post || ''}`)
  }
  return parts.join(' ')
}

/** اسلاگ یکتا از عنوان فارسی (fallback به حروف لاتین/عدد) */
export function slugifyFa(input: string): string {
  let s = input
    .trim()
    .replace(/[\u200c\s]+/g, '-')
    .replace(/[؟?!,،.:؛«»()[\]{}"'@#$%^&*+=|\\/~`]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  if (!/[\da-z]/.test(s)) s = 'post'
  return s.slice(0, 100)
}

export { escapeRe }
