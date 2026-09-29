import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tjgohwpxrcteqgtsfvyc.supabase.co', // Use the URL if you have it from env or just mock
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function run() {
  const { data } = await supabase.from('gestionnaires').select('*');
  console.log(data);
}
run();
