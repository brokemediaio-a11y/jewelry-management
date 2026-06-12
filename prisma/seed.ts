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

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Seed completed: admin user + categories');
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
