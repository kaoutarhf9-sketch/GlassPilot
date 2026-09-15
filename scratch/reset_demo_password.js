const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function resetDemoPassword() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const demoUser = users.find(u => u.email === 'demo@glasspilot.com');
  
  if (demoUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(
      demoUser.id,
      { password: 'Password123!' }
    );
    
    if (error) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error.message);
    } else {
      console.log("Mot de passe mis à jour avec succès pour demo@glasspilot.com");
    }
  } else {
    console.log("L'utilisateur demo@glasspilot.com n'a pas été trouvé.");
  }
}

resetDemoPassword();
