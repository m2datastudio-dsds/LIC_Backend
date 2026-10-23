import "dotenv/config";
import { defineConfig } from "prisma/config";

const buildDatabaseUrl = () => {
  const baseUrl = process.env["DATABASE_URL"] || "postgresql://postgres:vasumathi@localhost:5432/LIC?schema=Insurance";
  return baseUrl;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: buildDatabaseUrl(),
    schemas: ["Insurance"],
  },
});
