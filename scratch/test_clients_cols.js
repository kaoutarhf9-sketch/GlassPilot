const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://delioukmwvczqhudjwth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbGlvdWttd3ZjenFodWRqd3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk2NjExNCwiZXhwIjoyMDkyNTQyMTE0fQ.p_iugpEBZnSIaltAZGVeJYEgJCvNAskcoFalOlpyEOI'
);

(async () => {
  const { data, error } = await sb
    .from('clients')
    .select('id, nom, prenom, adresse, code_postal, ville')
    .limit(3);

  if (error) {
    console.error('Erreur:', error.message);
  } else {
    console.log('SUCCESS - colonnes accessibles !');
    console.log('Exemple:', JSON.stringify(data, null, 2));
  }
})();
