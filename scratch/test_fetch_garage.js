const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testFetch() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'garage@exemple.fr',
    password: 'Password123!'
  });
  
  if (error) {
    console.error("Login failed:", error);
    return;
  }
  
  const userId = data.user.id;
  console.log("Logged in as:", userId);
  
  const { data: garage, error: garageError } = await supabase
    .from('garages')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle();
    
  if (garageError) {
    console.error("Fetch garage failed:", garageError);
  } else {
    console.log("Fetched garage:", garage);
  }
}
testFetch();
