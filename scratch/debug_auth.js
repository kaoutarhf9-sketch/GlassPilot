const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testAuth() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test_error_debug@example.com',
    password: 'Password123!',
    email_confirm: true
  });
  
  if (error) {
    console.log("FULL ERROR OBJECT:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success:", data.user.id);
    await supabase.auth.admin.deleteUser(data.user.id);
  }
}
testAuth();
