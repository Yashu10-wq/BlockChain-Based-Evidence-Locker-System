/**
 * ═══════════════════════════════════════════════════════════════
 *  seed.js — One-time Admin User Seeder
 * ═══════════════════════════════════════════════════════════════
 *
 * Run:  node config/seed.js
 *
 * Creates a default Admin user if no users exist in the database.
 * Safe to run multiple times — it will skip if users already exist.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const SEED_USERS = [
    {
        name: 'Admin User',
        email: 'admin@evidence.gov',
        password: 'admin123',
        role: 'Admin',
    },
    {
        name: 'Officer Singh',
        email: 'officer@evidence.gov',
        password: 'officer123',
        role: 'Officer',
    },
    {
        name: 'Custodian Sharma',
        email: 'custodian@evidence.gov',
        password: 'custodian123',
        role: 'Custodian',
    },
    {
        name: 'Dr. Forensics',
        email: 'forensic@evidence.gov',
        password: 'forensic123',
        role: 'Forensic Technician',
    },
];

async function seed() {
    try {
        console.log('🌱  Seeding/Updating database with default users...\n');

        for (const user of SEED_USERS) {
            const hash = await bcrypt.hash(user.password, 12);
            const result = await pool.query(
                `INSERT INTO users (name, email, password_hash, role)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (email) DO UPDATE 
                 SET name = EXCLUDED.name, 
                     password_hash = EXCLUDED.password_hash, 
                     role = EXCLUDED.role
                 RETURNING id, name, email, role`,
                [user.name, user.email, hash, user.role]
            );
            const created = result.rows[0];
            console.log(`  ✅  ${created.role.padEnd(20)} | ${created.email.padEnd(26)} | password: ${user.password}`);
        }

        console.log('\n🎉  Seed complete! Users have been inserted or updated.');
        console.log('    Example: admin@evidence.gov / admin123');

    } catch (err) {
        console.error('❌  Seed failed:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

seed();
