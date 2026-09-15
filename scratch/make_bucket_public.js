const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function makeBucketPublic() {
  const { data, error } = await supabase.storage.updateBucket('documents', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'image/webp'],
    fileSizeLimit: 10485760 // 10MB
  });

  if (error) {
    console.error("Erreur lors de la mise à jour du bucket:", error);
  } else {
    console.log("Bucket 'documents' est maintenant PUBLIC et prêt à être visualisé.");
  }
}
makeBucketPublic();
