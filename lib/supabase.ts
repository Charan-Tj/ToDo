import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tpsgaxlmxrtkpsltqhrb.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwc2dheGxteHJ0a3BzbHRxaHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTI3MTgsImV4cCI6MjA4OTY4ODcxOH0.SYO9uu16OGcM68_hXySUtmuUebTHgxfmVLkjc8KUBoE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
