require('dotenv').config();
const db = require('./src/config/db');

async function migrate() {
    try {
        // Add exam date columns
        await db.query(`
            ALTER TABLE courses 
            ADD COLUMN IF NOT EXISTS midterm_date VARCHAR(100),
            ADD COLUMN IF NOT EXISTS final_date VARCHAR(100)
        `);
        console.log('Added midterm_date and final_date columns.');

        // Update seed courses with exam dates
        const updates = [
            { code: 'CS101', midterm: '20 Jan 2026, 09:00-12:00', final: '18 Mar 2026, 09:00-12:00' },
            { code: 'CS201', midterm: '21 Jan 2026, 09:00-12:00', final: '19 Mar 2026, 09:00-12:00' },
            { code: 'MATH101', midterm: '22 Jan 2026, 13:00-16:00', final: '20 Mar 2026, 13:00-16:00' },
            { code: 'MATH201', midterm: '23 Jan 2026, 13:00-16:00', final: '21 Mar 2026, 13:00-16:00' },
            { code: 'CS301', midterm: '24 Jan 2026, 09:00-12:00', final: '22 Mar 2026, 09:00-12:00' },
            { code: 'CS305', midterm: '25 Jan 2026, 13:00-16:00', final: '23 Mar 2026, 13:00-16:00' },
            { code: 'PHY101', midterm: '20 Jan 2026, 13:00-16:00', final: '18 Mar 2026, 13:00-16:00' },
            { code: 'ENG101', midterm: null, final: '24 Mar 2026, 09:00-12:00' },
        ];

        for (const u of updates) {
            await db.query(
                'UPDATE courses SET midterm_date = $1, final_date = $2 WHERE code = $3',
                [u.midterm, u.final, u.code]
            );
            console.log(`Updated exam dates for ${u.code}`);
        }

        console.log('\nMigration complete!');
        process.exit(0);
    } catch (e) {
        console.error('Migration error:', e.message);
        process.exit(1);
    }
}
migrate();
