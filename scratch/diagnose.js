const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

async function diagnose() {
  console.log("--- SUPABASE DIAGNOSTIC ---");
  console.log("Connecting to:", env.NEXT_PUBLIC_SUPABASE_URL);

  // 1. Check Auth Users
  console.log("\n1. Checking Users...");
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error("❌ Error fetching users:", usersError.message);
  } else {
    console.log(`✅ Found ${usersData.users.length} user(s).`);
    usersData.users.forEach(u => {
      console.log(`   - ${u.email} (ID: ${u.id})`);
    });
  }

  // 2. Check Tables (try fetching 1 row from key tables)
  console.log("\n2. Checking Database Tables...");
  const tables = ['garages', 'gestionnaires', 'stock_jetons'];
  
  for (const table of tables) {
    const { error: tableError } = await supabase.from(table).select('id').limit(1);
    if (tableError) {
      console.error(`❌ Table '${table}' error:`, tableError.message);
    } else {
      console.log(`✅ Table '${table}' exists and is accessible.`);
    }
  }
}

diagnose();
