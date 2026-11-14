/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_WHATSAPP_NUMBER: string;
  readonly PUBLIC_WHATSAPP_DEFAULT_PREFIX: string;
  readonly RESEND_API_KEY: string;
  readonly RESEND_FROM_EMAIL: string;
  readonly ADMIN_NOTIFICATION_EMAIL: string;
  readonly GOOGLE_SHEETS_WEBHOOK_URL: string;
  readonly GOOGLE_SHEETS_WEBHOOK_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
