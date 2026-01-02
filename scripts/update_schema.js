import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function run() {
    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    // sometimes called SUPABASE_DB_URL or just DATABASE_URL. 
    // If not found, we can try to construct it if we had the password, but we don't.

    if (!connectionString) {
        console.error("No DATABASE_URL found in environment variables.");
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Supabase requires SSL
    });

    try {
        await client.connect();
        console.log("Connected to database.");

        // Add ImageUrl column if not exists
        await client.query(`
      ALTER TABLE "dishMapChef" 
      ADD COLUMN IF NOT EXISTS "ImageUrl" TEXT;
    `);

        console.log("Successfully added ImageUrl column.");
        await client.end();
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

run();
