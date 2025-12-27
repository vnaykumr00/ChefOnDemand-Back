import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runSeeder() {
  try {
    await client.connect();
    
    // Get all SQL files and sort them (01, 02, etc.)
    const files = fs.readdirSync(__dirname)
                    .filter(file => file.endsWith('.sql'))
                    .sort();

    for (const file of files) {
      console.log(`⏳ Running: ${file}...`);
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      await client.query(sql);
    }

    console.log("✅ All schemas and seeds synced successfully!");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.end();
  }
}

runSeeder();