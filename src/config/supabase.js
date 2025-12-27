import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Service Role Key in environment variables.");
}

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Export common modules for use in controllers
export const auth = supabase.auth;
export const db = supabase; // In Supabase, the client itself is used to query the DB