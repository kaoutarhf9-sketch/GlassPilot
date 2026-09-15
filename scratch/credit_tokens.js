const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function creditTokens() {
  const { data: garages } = await supabaseAdmin.from('garages').select('id').order('created_at', { ascending: false }).limit(1);
  if (garages && garages.length > 0) {
    const garageId = garages[0].id;
    console.log("Crediting garage", garageId);
    await supabaseAdmin.from('stock_jetons').update({ prestige: 2 }).eq('garage_id', garageId);
  }
}
creditTokens();
