const prisma = require('./lib/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  try {
    const email = 'test@example.com';
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log('User already exists');
      return;
    }
    const hashedPassword = await bcrypt.hash('Password123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email,
        password: hashedPassword
      }
    });
    console.log('User created successfully:', user.id);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
