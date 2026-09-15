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

async function inspect() {
  console.log("Listing all garages...");
  const { data: garages, error: errorGarages } = await supabaseAdmin
    .from('garages')
    .select('*');
    
  if (errorGarages) {
    console.error("Error garages:", errorGarages);
    return;
  }
  console.log("Garages count:", garages.length);
  garages.forEach(g => {
    console.log(`- ID: ${g.id} | owner_id: ${g.owner_id} | Name: ${g.nom_garage} | SIRET: ${g.siret}`);
  });
}

inspect();
