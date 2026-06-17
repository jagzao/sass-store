const { PrismaClient } = require('@prisma/client');
const c = new PrismaClient();
c.$queryRawUnsafe(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%migrations%' ORDER BY table_name`).then(r => console.log(JSON.stringify(r, null, 2))).catch(e => console.error('Err:', e.message)).finally(() => c.$disconnect());
