const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUsers() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  users.forEach(u => {
    console.log(`User: ${u.email}`);
    console.log(`Onboarding completed: ${u.user_metadata?.onboarding_completed}`);
    console.log(`Metadata:`, JSON.stringify(u.user_metadata));
    console.log("-----------------------");
  });
}
checkUsers();
