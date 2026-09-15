const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function listFiles() {
  const { data: dossiers } = await supabaseAdmin.from('dossiers').select('id, numero');
  for (const d of dossiers) {
      console.log("Dossier", d.numero);
      const { data } = await supabaseAdmin.storage.from('documents').list(`dossiers/${d.id}`);
      if (data) console.log("Files:", data.map(f => f.name));
  }
}
listFiles();
