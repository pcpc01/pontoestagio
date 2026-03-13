const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const schedules = await prisma.workSchedule.findMany();
    console.log(JSON.stringify(schedules));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
