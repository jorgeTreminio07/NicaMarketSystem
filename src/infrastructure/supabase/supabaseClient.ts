/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const meta = import.meta as unknown as { env?: Record<string, string> };
export const SUPABASE_URL = meta.env?.VITE_SUPABASE_URL || 'https://xjiwhdnrxpsbbegqjicp.supabase.co';
export const SUPABASE_ANON_KEY = meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqaXdoZG5yeHBzYmJlZ3FqaWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNzkyMTgsImV4cCI6MjEwMDk1NTIxOH0.8y6PT2Uyn2ytdc4LfhyzSY_EWNPRmieoYYIaDyPEy3E';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;


