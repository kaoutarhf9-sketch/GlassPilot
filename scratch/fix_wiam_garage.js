const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function repair() {
  const userId = '4517e92c-8f65-44e6-a9a7-ef7655e3a6de';
  const email = 'wiamhanafi21@gmail.com';
  
  console.log("Checking if garage exists for user:", email);
  
  const { data: existingGarage, error: checkError } = await supabaseAdmin
    .from('garages')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  if (checkError) {
    console.error("Error checking garage:", checkError);
    return;
  }

  if (existingGarage) {
    console.log("Garage already exists with ID:", existingGarage.id);
  } else {
    console.log("Garage not found. Creating...");
    const { data: newGarage, error: insertError } = await supabaseAdmin
      .from('garages')
      .insert({
        owner_id: userId,
        nom_garage: "MtoGarage",
        responsable: "kaoutar hanafi",
        email_contact: email,
        telephone: "0601648824",
        adresse: "IMM 3 APPT 4 LOT RYAD OULAD MTAA",
        siret: "12345678910113",
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting garage:", insertError);
      return;
    }

    console.log("Created garage with ID:", newGarage.id);

    const { error: stockError } = await supabaseAdmin
      .from('stock_jetons')
      .insert({
        garage_id: newGarage.id,
        simple: 14, // default demo/initial stock or 0
        prestige: 8
      });

    if (stockError) {
      console.error("Error creating stock:", stockError);
    } else {
      console.log("Initialized token stock successfully.");
    }
  }
}

repair();
