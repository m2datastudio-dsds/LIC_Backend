import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const values = [
  ['Endowment Plans','endowment','Savings and protection plans for long-term goals.'],
  ['Money Back Plans','money-back','Plans offering scheduled survival benefits.'],
  ['Whole Life Plans','whole-life','Long-duration lifelong protection plans.'],
  ['Term Plans','term','Pure life protection plans.'],
  ['Annuity Plans','pension','Retirement and regular-income plans.'],
  ['Unit Linked Plans','ulip','Market-linked insurance plans.'],
  ['Child Plans','child','Plans for a child’s education and milestones.'],
];
for (const [name, slug, description] of values) await prisma.insurancePlanType.upsert({ where: { slug }, update: { name, description }, create: { name, slug, description } });
await prisma.$disconnect();
