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

async function inspectColumns() {
  const { data, error } = await supabase.from('gestionnaires').select('*').limit(1);
  if (error) {
    console.error("Error fetching gestionnaires:", error);
    return;
  }
  console.log("Gestionnaire columns / properties:", data && data[0] ? Object.keys(data[0]) : "No records found");
  if (data && data[0]) {
    console.log("First gestionnaire row sample:", data[0]);
  }
}

inspectColumns();
