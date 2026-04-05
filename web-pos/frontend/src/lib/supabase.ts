import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

/**
 * Browser/client-side Supabase client.
 * Use this in Client Components ('use client').
 */
export const createBrowserClient = () =>
  createClientComponentClient<Database>();

/**
 * Server-side Supabase client.
 * Use this in Server Components, Route Handlers, and Server Actions.
 * Reads the auth session from cookies automatically.
 */
export const createServerClient = () =>
  createServerComponentClient<Database>({ cookies });

/**
 * Public Supabase client (no auth session).
 * Use for public data fetching or admin operations with service role key.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
