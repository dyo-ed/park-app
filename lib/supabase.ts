import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'your-supabase-url';
// const supabaseKey = Constants.expoConfig?.extra?.supabaseAnonKey || 'your-supabase-anon-key';
const supabaseUrl = "https://fwugapivrojysjeqhgei.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3dWdhcGl2cm9qeXNqZXFoZ2VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MTY4NTksImV4cCI6MjA3NTQ5Mjg1OX0.SZXpJTlNpFghsUSF-SC4CGnu56tMF8sMyPOu6bG6SKs";

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or ANON KEY is missing!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);