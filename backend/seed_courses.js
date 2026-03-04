require('dotenv').config();
const db = require('./src/config/db');

async function seed() {
    try {
        // Check if courses already exist
        const existing = await db.query('SELECT COUNT(*) as count FROM courses');
        if (parseInt(existing.rows[0].count) > 0) {
            console.log('Courses already seeded. Skipping.');
            process.exit(0);
        }

        const courses = [
            { name: 'Introduction to Computer Science', code: 'CS101', description: 'Foundational concepts of computing, algorithms, and problem solving.', credits: 3, schedule_time: 'Mon/Wed 09:00-10:30', room: 'Building A, Room 301', capacity: 40 },
            { name: 'Data Structures and Algorithms', code: 'CS201', description: 'Study of fundamental data structures, sorting, searching, and algorithmic complexity.', credits: 3, schedule_time: 'Tue/Thu 09:00-10:30', room: 'Building A, Room 302', capacity: 35 },
            { name: 'Calculus I', code: 'MATH101', description: 'Limits, derivatives, integrals, and their applications.', credits: 4, schedule_time: 'Mon/Wed 11:00-12:30', room: 'Building B, Room 201', capacity: 50 },
            { name: 'Linear Algebra', code: 'MATH201', description: 'Vectors, matrices, linear transformations, and eigenvalues.', credits: 3, schedule_time: 'Tue/Thu 11:00-12:30', room: 'Building B, Room 202', capacity: 45 },
            { name: 'Database Systems', code: 'CS301', description: 'Relational databases, SQL, normalization, and database design.', credits: 3, schedule_time: 'Mon/Wed 13:00-14:30', room: 'Building A, Room 401', capacity: 30 },
            { name: 'Web Application Development', code: 'CS305', description: 'Modern web technologies including HTML, CSS, JavaScript, React, and Node.js.', credits: 3, schedule_time: 'Tue/Thu 13:00-14:30', room: 'Building A, Room 402', capacity: 30 },
            { name: 'Physics I', code: 'PHY101', description: 'Mechanics, thermodynamics, and waves.', credits: 4, schedule_time: 'Mon/Wed 09:00-10:30', room: 'Building C, Room 101', capacity: 60 },
            { name: 'English Communication', code: 'ENG101', description: 'Academic English reading, writing, and presentation skills.', credits: 2, schedule_time: 'Fri 09:00-12:00', room: 'Building D, Room 105', capacity: 40 },
        ];

        for (const c of courses) {
            await db.query(
                `INSERT INTO courses (name, code, description, credits, schedule_time, room, capacity) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [c.name, c.code, c.description, c.credits, c.schedule_time, c.room, c.capacity]
            );
            console.log(`Seeded: ${c.code} - ${c.name}`);
        }

        console.log('\nAll courses seeded successfully!');
        process.exit(0);
    } catch (e) {
        console.error('Seed error:', e.message);
        process.exit(1);
    }
}
seed();
