const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://tpsgaxlmxrtkpsltqhrb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwc2dheGxteHJ0a3BzbHRxaHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTI3MTgsImV4cCI6MjA4OTY4ODcxOH0.SYO9uu16OGcM68_hXySUtmuUebTHgxfmVLkjc8KUBoE"
);

async function main() {
  const users = [
    { email: 'charan@copyflow.in', password: 'Copyflow123!' },
    { email: 'subodh@copyflow.in', password: 'Copyflow123!' },
    { email: 'pankaj@copyflow.in', password: 'Copyflow123!' }
  ];

  for (const u of users) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password
    });
    console.log("Signup:", u.email, error ? error.message : "Success");
  }

  // Next, rename any board containing "Daily" with visibility "personal" to "Personal"
  // Since we are Anon, we must do this as the user running the command or using RLS.
  // Wait, RLS prevents updates if not logged in.
  // We can't batch update DB rows from here without bypassing RLS or signing in.
}

main().catch(console.error);
