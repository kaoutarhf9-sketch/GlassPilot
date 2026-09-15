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

async function testUpsert() {
  console.log("Testing upsert WITHOUT code_postal/ville and WITH email_contact:");
  const { data, error } = await supabase
    .from('garages')
    .upsert({
      id: '352aa58d-8988-496e-a963-ca497836cb48',
      owner_id: '3f423c03-b03f-4084-afe4-7d3eac9918a0',
      nom_garage: 'test-updated',
      responsable: 'test test',
      telephone: '0601648824',
      adresse: 'rabat, 75001 Paris',
      siret: '12345678910112',
      email_contact: 'j43534275@gmail.com'
    });
  
  if (error) {
    console.error("Upsert failed:", error);
  } else {
    console.log("Upsert succeeded!", data);
  }
}

testUpsert();
