const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const scheduleCount = await prisma.workSchedule.count();

    if (scheduleCount === 0) {
        console.log('No schedules found. Creating default ones...');
        await prisma.workSchedule.createMany({
            data: [
                { name: 'Comercial (08:00 - 18:00)', dailyHours: 8, weeklyHours: 40 },
                { name: 'Meio Período (Manhã)', dailyHours: 4, weeklyHours: 20 },
                { name: 'Meio Período (Tarde)', dailyHours: 4, weeklyHours: 20 },
                { name: 'Escala 12x36', dailyHours: 12, weeklyHours: 42 }
            ]
        });
        console.log('Default schedules created.');
    } else {
        console.log('Schedules already exist.');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
