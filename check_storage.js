const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'C:\\mon-app-garage\\.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  console.log("Checking storage buckets...");
  
  // List all buckets
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error("Error fetching buckets:", bucketError);
    return;
  }
  console.log("Buckets:", buckets.map(b => b.name).join(', '));
  
  if (!buckets.find(b => b.name === 'documents')) {
    console.error("Bucket 'documents' not found!");
    return;
  }

  // Find a dossier that has files
  const { data: dossiers, error: dossierError } = await supabase
    .from('dossiers')
    .select('id, numero')
    .limit(10);
    
  if (dossierError) {
    console.error("Error fetching dossiers:", dossierError);
    return;
  }
  
  console.log("Checking dossiers for files...");
  for (const dossier of dossiers) {
    const { data: files, error: fileError } = await supabase.storage.from('documents').list(`dossiers/${dossier.id}`);
    
    if (fileError) {
      console.error(`Error listing files for ${dossier.id}:`, fileError);
    } else if (files && files.length > 0) {
      console.log(`Dossier ${dossier.numero} (${dossier.id}) has ${files.length} files:`);
      files.forEach(f => console.log(`  - ${f.name}`));
    }
  }

  // Also try inserting a policy if one doesn't exist? 
  // Wait, the REST API doesn't let us read policies easily. But we know service_role bypasses RLS.
}

checkStorage();
