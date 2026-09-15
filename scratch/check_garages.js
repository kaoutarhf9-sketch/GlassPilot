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

async function checkGarages() {
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const { data: garages, error: garageError } = await supabaseAdmin.from('garages').select('*');
  
  if (garageError) {
    console.error("Erreur garages:", garageError);
  } else {
    console.log("Garages existants:", JSON.stringify(garages, null, 2));
  }
}
checkGarages();
