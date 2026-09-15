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

const supabaseAnon = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const dossierId = '2dfca1fc-a1e3-4544-902a-6c4a739bd650';
  
  const { data: messagesAdmin, error: err1 } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('dossier_id', dossierId);
    
  console.log('Messages (Admin):', messagesAdmin?.length || 0, err1 || '');
  
  const { data: messagesAnon, error: err2 } = await supabaseAnon
    .from('messages')
    .select('*')
    .eq('dossier_id', dossierId);
    
  console.log('Messages (Anon):', messagesAnon?.length || 0, err2 || '');
}

check();
