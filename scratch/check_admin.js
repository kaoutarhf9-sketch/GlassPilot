const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAdminUser() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const demoUser = users.find(u => u.email === 'demo@glasspilot.com');
  
  if (demoUser) {
    console.log("Demo User Metadata:", JSON.stringify(demoUser.user_metadata));
    
    // Ensure role is exactly 'admin'
    const { error } = await supabase.auth.admin.updateUserById(
      demoUser.id,
      { user_metadata: { ...demoUser.user_metadata, role: 'admin' } }
    );
    
    if (error) {
        console.error("Error updating metadata:", error);
    } else {
        console.log("Role explicitly set to 'admin'");
    }
  }
}
checkAdminUser();
