const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function reset() {
  const adminId = '421ea92b-a6e0-4734-9bd1-cb17d350eca4';
  const email = 'kaoutarhf9@gmail.com';
  const newPassword = 'Admin2026!';
  
  console.log("Resetting password for admin:", email);
  
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(adminId, {
    password: newPassword
  });

  if (error) {
    console.error("Failed to reset password:", error);
  } else {
    console.log("Password successfully updated to:", newPassword);
  }
}

reset();
