/* ==========================================================================
   کافه‌دانش — کمکی‌های فارسی‌سازی (اعداد و تاریخ جلالی)
   از Intl با تقویم فارسی استفاده می‌شود؛ بدون وابستگی خارجی.
   ========================================================================== */

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function faNum(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

export function enNum(input: string): string {
  return input.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

const jalaliDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'long' });
const jalaliShort = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' });
const jalaliMonthYear = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long' });

export function faDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  try {
    return jalaliDate.format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function faDateShort(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  try {
    return jalaliShort.format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function faMonthYear(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  try {
    return jalaliMonthYear.format(date);
  } catch {
    return date.toISOString().slice(0, 7);
  }
}

export function relativeTimeFa(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'همین حالا';
  if (min < 60) return `${faNum(min)} دقیقه پیش`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${faNum(hr)} ساعت پیش`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${faNum(day)} روز پیش`;
  return faDate(date);
}
