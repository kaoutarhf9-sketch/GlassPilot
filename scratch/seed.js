const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seed() {
  console.log("🌱 Début du remplissage de la base de données...");

  // 1. Création d'un Garagiste
  console.log("\nCréation du compte Garagiste (garage@exemple.fr)...");
  const { data: garagisteAuth, error: garagisteAuthErr } = await supabase.auth.admin.createUser({
    email: 'garage@exemple.fr',
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { role: 'garagiste', first_name: 'Jean', prenom: 'Dupont', onboarding_completed: true }
  });

  if (garagisteAuthErr && garagisteAuthErr.message !== 'User already registered') {
    console.error("Erreur Auth Garagiste:", garagisteAuthErr.message);
  } else {
    let garagisteId;
    if (garagisteAuthErr && garagisteAuthErr.message === 'User already registered') {
        const { data: { users } } = await supabase.auth.admin.listUsers();
        garagisteId = users.find(u => u.email === 'garage@exemple.fr')?.id;
    } else {
        garagisteId = garagisteAuth.user.id;
    }

    if (garagisteId) {
      // Nettoyer s'il existe déjà
      await supabase.from('garages').delete().eq('owner_id', garagisteId);
      
      const { data: garage, error: garageErr } = await supabase.from('garages').insert({
        owner_id: garagisteId,
        nom_garage: 'AutoGlass Pro',
        responsable: 'Jean Dupont',
        email_contact: 'garage@exemple.fr',
        telephone: '0612345678',
        adresse: '123 Rue de la Réparation, 75001 Paris',
        siret: '12345678901234',
        is_active: true
      }).select().single();

      if (garageErr) console.error("Erreur Table Garage:", garageErr.message);
      else {
        console.log(`✅ Garage 'AutoGlass Pro' créé !`);
        // Ajouter du stock
        await supabase.from('stock_jetons').insert({
          garage_id: garage.id,
          simple: 10,
          prestige: 5
        });
        console.log(`✅ 10 jetons simples et 5 prestiges ajoutés au garage.`);
      }
    }
  }

  // 2. Création d'un Gestionnaire
  console.log("\nCréation du compte Gestionnaire (admin@exemple.fr)...");
  const { data: gestionnaireAuth, error: gestionnaireAuthErr } = await supabase.auth.admin.createUser({
    email: 'admin@exemple.fr',
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { role: 'gestionnaire', first_name: 'Alice', prenom: 'Admin' }
  });

  if (gestionnaireAuthErr && gestionnaireAuthErr.message !== 'User already registered') {
    console.error("Erreur Auth Gestionnaire:", gestionnaireAuthErr.message);
  } else {
    let adminId;
    if (gestionnaireAuthErr && gestionnaireAuthErr.message === 'User already registered') {
        const { data: { users } } = await supabase.auth.admin.listUsers();
        adminId = users.find(u => u.email === 'admin@exemple.fr')?.id;
    } else {
        adminId = gestionnaireAuth.user.id;
    }

    if (adminId) {
      // Nettoyer s'il existe déjà
      await supabase.from('gestionnaires').delete().eq('user_id', adminId);

      const { error: gestErr } = await supabase.from('gestionnaires').insert({
        user_id: adminId,
        email: 'admin@exemple.fr',
        nom: 'Admin',
        prenom: 'Alice',
        role: 'gestionnaire',
        is_active: true
      });

      if (gestErr) console.error("Erreur Table Gestionnaire:", gestErr.message);
      else console.log(`✅ Gestionnaire 'Alice Admin' créé !`);
    }
  }

  console.log("\n🎉 Terminé ! Les utilisateurs de test ont été créés.");
}

seed();
