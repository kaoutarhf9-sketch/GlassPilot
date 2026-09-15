const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const dossierId = '2dfca1fc-a1e3-4544-902a-6c4a739bd650';
  
  // Get dossier to get garage_id
  const { data: dossier } = await supabase.from('dossiers').select('*').eq('id', dossierId).single();
  
  if (!dossier) {
    console.log("Dossier introuvable");
    return;
  }
  
  // Insert a test message from garagiste
  const { error } = await supabase.from('messages').insert({
    dossier_id: dossierId,
    garage_id: dossier.garage_id,
    sender_id: '00000000-0000-0000-0000-000000000000', // Dummy
    sender_name: 'Garagiste Test',
    sender_role: 'garagiste',
    message: 'Bonjour, ceci est un test du garagiste.',
    is_read: false
  });
  
  console.log("Insert result:", error || "Success");
}

testInsert();
