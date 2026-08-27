import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pklvfialofgylifvdkcn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHZmaWFsb2ZneWxpZnZka2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MDIzMDksImV4cCI6MjEwMzM3ODMwOX0.ysIQcl0KgBvCgkfPxhlfwKZn9EwyCDxi_B95ZxXwtA0';

// Used exclusively for Authentication (Sign Up, Sign In, Sign Out, Session Token retrieval)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
