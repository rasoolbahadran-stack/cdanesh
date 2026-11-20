/// <reference types="astro/client" />

/* اعلان Locals با فرمت استاندارد Astro 5 — تایپ‌های واقعی astro را نمی‌پوشاند */
declare namespace App {
  interface Locals {
    admin: { u: string; role: string; exp: number } | null;
  }
}
