import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:vasumathi@localhost:5432/LIC?options=-c%20search_path%3DInsurance';
console.log('Using DATABASE_URL:', connectionString);

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const check = async () => {
  const rows = await prisma.$queryRaw`SELECT current_schema() AS current_schema, current_setting('search_path') AS search_path;`;
  console.log('Current schema info:', JSON.stringify(rows, null, 2));

  const tables = await prisma.$queryRaw`SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('public', 'Insurance') ORDER BY table_schema, table_name LIMIT 200;`;
  console.log('Tables:', JSON.stringify(tables, null, 2));
};

check()
  .catch((err) => {
    console.error('DB CHECK ERROR');
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
