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
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .limit(10);
    
  console.log('Total Messages in DB (limit 10):', messages?.length || 0);
  if (messages && messages.length > 0) {
    console.log(messages);
  } else {
    console.log("Error:", error);
  }
}

check();
