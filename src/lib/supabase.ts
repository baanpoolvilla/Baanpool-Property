/**
 * Database Client Configuration
 * 
 * This project uses PostgreSQL + PostgREST (not Supabase cloud service).
 * We use PostgrestClient directly so requests go to the PostgREST root path.
 * (Supabase createClient would append /rest/v1 which doesn't match self-hosted PostgREST)
 * 
 * Setup:
 * - NEXT_PUBLIC_SUPABASE_URL: Your PostgREST server URL (e.g., https://api.example.com)
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Not used, kept for compatibility
 */
import { PostgrestClient } from "@supabase/postgrest-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:3001";

export const supabase = new PostgrestClient(supabaseUrl);
