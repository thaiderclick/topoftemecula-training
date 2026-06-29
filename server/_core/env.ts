export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  trainingPassword: process.env.TRAINING_PASSWORD ?? "ambassador2024",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Legacy fields kept for compatibility with shared/const imports
  appId: process.env.VITE_APP_ID ?? "tot-training",
  oAuthServerUrl: "",
  ownerOpenId: "",
};
