const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if(k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function migrateGarages() {
  console.log("Starting migration...");
  
  // 1. Get all users
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error("Error fetching users:", usersError);
    return;
  }
  
  const users = usersData.users || [];
  console.log(`Found ${users.length} users.`);
  
  // 2. Get all garages
  const { data: garages, error: garagesError } = await supabase.from('garages').select('*');
  if (garagesError) {
    console.error("Error fetching garages:", garagesError);
    return;
  }
  console.log(`Found ${garages.length} garages.`);

  let updatedCount = 0;

  for (const garage of garages) {
    const owner = users.find(u => u.id === garage.owner_id);
    if (owner && owner.user_metadata) {
      const { onboarding_kbis_url, onboarding_rib_url } = owner.user_metadata;
      
      if (onboarding_kbis_url || onboarding_rib_url) {
        console.log(`Updating garage ${garage.id} with kbis: ${onboarding_kbis_url}`);
        
        // Use raw sql if possible, but actually since we couldn't alter table, let's just try to update. Wait! The columns don't exist in `garages`!
        // We failed to add columns earlier.
      }
    }
  }
  
  console.log("Done.");
}

migrateGarages();
