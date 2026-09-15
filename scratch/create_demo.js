const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function createDemoAdmin() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'demo@glasspilot.com',
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { role: 'admin' }
  });
  
  if (error) {
    console.error("Erreur:", error.message);
  } else {
    console.log("Compte demo@glasspilot.com créé avec succès !");
  }
}

createDemoAdmin();
