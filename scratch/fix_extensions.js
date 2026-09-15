const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fixExtensions() {
  // 1. Undo the mistaken folder rename
  console.log("Undoing mistake...");
  await supabaseAdmin.storage.from('documents').move(
    'dossiers/efaa602d-e3df-429c-b5fc-bd6cf60eb82f.jpg',
    'dossiers/efaa602d-e3df-429c-b5fc-bd6cf60eb82f'
  );

  // 2. Actually loop through dossiers and fix files
  const { data: dossiers } = await supabaseAdmin.from('dossiers').select('id, numero');
  for (const d of dossiers || []) {
      const { data: files } = await supabaseAdmin.storage.from('documents').list(`dossiers/${d.id}`);
      for (const f of files || []) {
        if (f.name !== '.emptyFolderPlaceholder' && !f.name.includes('.')) {
          console.log(`Renaming ${d.numero}: ${f.name} to ${f.name}.jpg`);
          await supabaseAdmin.storage.from('documents').move(
            `dossiers/${d.id}/${f.name}`,
            `dossiers/${d.id}/${f.name}.jpg`
          );
        }
      }
  }
}
fixExtensions();
