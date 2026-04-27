/**
 * Database Client Configuration
 * 
 * This project uses PostgreSQL + PostgREST (not Supabase cloud service).
 * We use the Supabase JS client library because it provides a clean API
 * that works perfectly with PostgREST endpoints.
 * 
 * Setup:
 * - NEXT_PUBLIC_SUPABASE_URL: Your PostgREST server URL (e.g., http://localhost:3001)
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Any string (not used for auth, but required by client)
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:3001";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
