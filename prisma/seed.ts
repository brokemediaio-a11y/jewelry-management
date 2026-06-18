import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const categories = [
  'Rings',
  'Bracelets',
  'Necklaces',
  'Chains',
  'Real Rings',
  'Real Premium Necklaces',
  'Zircon Bracelets',
  'Onix Chains',
];

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const workerPasswordHash = await bcrypt.hash('worker123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@venus.com' },
    update: {
      name: 'Admin',
      passwordHash,
      role: UserRole.ADMIN,
    },
    create: {
      name: 'Admin',
      email: 'admin@venus.com',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'worker@venus.com' },
    update: {
      name: 'Worker',
      passwordHash: workerPasswordHash,
      role: UserRole.WORKER,
    },
    create: {
      name: 'Worker',
      email: 'worker@venus.com',
      passwordHash: workerPasswordHash,
      role: UserRole.WORKER,
    },
  });

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const stoneOptions = [
    { kind: 'TYPE' as const, names: ['Ruby', 'Emerald', 'Sapphire', 'Rock', 'Beads', 'Zircon', 'Feroza'] },
    { kind: 'COLOR' as const, names: ['Glassy', 'Gray', 'Deep Green'] },
    { kind: 'CUT' as const, names: ['Hexagonal', 'Round', 'Solitaire', 'Triangle'] },
    { kind: 'CLARITY' as const, names: ['Black', 'Full Clear', 'Hair', 'Mild'] },
  ];

  for (const group of stoneOptions) {
    for (const name of group.names) {
      await prisma.stoneOption.upsert({
        where: {
          kind_name: { kind: group.kind, name },
        },
        update: {},
        create: { kind: group.kind, name },
      });
    }
  }

  console.log('Seed completed: admin + worker users, categories, stone options');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
