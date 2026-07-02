export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  trainingPassword: process.env.TRAINING_PASSWORD ?? "ambassador2024",
  adminPassword: process.env.ADMIN_PASSWORD ?? "supervisor2024",
  // True only when ADMIN_PASSWORD is actually set — money-controlling CRM admin
  // procedures refuse to run in production on the repo-visible default above.
  adminPasswordConfigured: !!process.env.ADMIN_PASSWORD,
  isProduction: process.env.NODE_ENV === "production",
  // OpenAI API key for AI Roleplay feature
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  // Resend email notification for trainee completion alerts
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  notificationEmail: process.env.NOTIFICATION_EMAIL ?? "",
  // Ambassador CRM: read-only connection to the SEPARATE website Supabase project.
  // Server-side only; never exposed to the client bundle.
  websiteDatabaseUrl: process.env.WEBSITE_DATABASE_URL ?? "",
  // Shared secret Vercel Cron sends as `Authorization: Bearer <CRON_SECRET>`.
  cronSecret: process.env.CRON_SECRET ?? "",
  // PostHog (attribution-leak monitor §10). Optional — monitor degrades gracefully.
  posthogApiKey: process.env.POSTHOG_API_KEY ?? "",
  posthogProjectId: process.env.POSTHOG_PROJECT_ID ?? "",
  posthogHost: process.env.POSTHOG_HOST ?? "https://us.posthog.com",
  // Legacy aliases kept so llm.ts compiles without changes
  forgeApiUrl: "https://api.openai.com",
  forgeApiKey: process.env.OPENAI_API_KEY ?? "",
  // Legacy fields kept for compatibility with shared/const imports
  appId: "tot-training",
  oAuthServerUrl: "",
  ownerOpenId: "",
};
