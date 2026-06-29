export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  trainingPassword: process.env.TRAINING_PASSWORD ?? "ambassador2024",
  adminPassword: process.env.ADMIN_PASSWORD ?? "supervisor2024",
  isProduction: process.env.NODE_ENV === "production",
  // OpenAI API key for AI Roleplay feature
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  // Resend email notification for trainee completion alerts
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  notificationEmail: process.env.NOTIFICATION_EMAIL ?? "",
  // Legacy aliases kept so llm.ts compiles without changes
  forgeApiUrl: "https://api.openai.com",
  forgeApiKey: process.env.OPENAI_API_KEY ?? "",
  // Legacy fields kept for compatibility with shared/const imports
  appId: "tot-training",
  oAuthServerUrl: "",
  ownerOpenId: "",
};
