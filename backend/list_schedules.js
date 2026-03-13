const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const schedules = await prisma.workSchedule.findMany();
    console.log(JSON.stringify(schedules, null, 2));
}
main().finally(() => prisma.$disconnect());
