/// <reference types="astro/client" />

declare module 'astro' {
  interface Locals {
    admin: { u: string; role: string; exp: number } | null;
  }
}
