
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const runSeed = async () => {
    try {
        const schemaPath = path.join(__dirname, '../seeders/07_booking_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema update...');
        await pool.query(schemaSql);
        console.log('Schema update completed successfully.');
    } catch (err) {
        console.error('Error executing schema:', err);
    } finally {
        await pool.end();
    }
};

runSeed();
