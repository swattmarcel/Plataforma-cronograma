import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Na Vercel, VERCEL_URL é preenchido automaticamente (inclusive em preview
// deployments) e serve como fallback caso PUBLIC_APP_URL não seja definido.
const inferredPublicUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:5173";

export const env = {
  port: Number(process.env.PORT ?? 3333),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  publicAppUrl: process.env.PUBLIC_APP_URL ?? inferredPublicUrl,
  uploadsDir: process.env.UPLOADS_DIR ?? "uploads",
};
