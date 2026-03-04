require('dotenv').config();
const db = require('./src/config/db');

async function check() {
    const e = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'enrollments' ORDER BY ordinal_position");
    console.log('ENROLLMENTS:', JSON.stringify(e.rows));
    const c = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'courses' ORDER BY ordinal_position");
    console.log('COURSES:', JSON.stringify(c.rows));
    process.exit(0);
}
check();
