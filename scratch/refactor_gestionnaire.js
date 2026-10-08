const fs = require('fs');
let content = fs.readFileSync('app/gestionnaire/dossiers/[id]/page.js', 'utf8');

// 1. Add import
if (!content.includes('import { generatePDF }')) {
  content = content.replace("import { supabase } from '@/lib/supabase';", "import { supabase } from '@/lib/supabase';\nimport { generatePDF } from '@/lib/pdfGenerator';");
}

// 2. Add state
if (!content.includes('const [isRegenerating, setIsRegenerating] = useState(false);')) {
  content = content.replace('const [showDeleteModal, setShowDeleteModal] = useState(false);', 'const [showDeleteModal, setShowDeleteModal] = useState(false);\n  const [isRegenerating, setIsRegenerating] = useState(false);');
}

// 3. Add regenerate function
const regenerateFunc = `
  const handleRegenerateCession = async () => {
    if (!formData.assurances_id || !formData.num_contrat) {
      alert("Veuillez remplir l'assurance et le numéro de contrat avant de régénérer la cession de créance.");
      return;
    }
    
    setIsRegenerating(true);
    try {
      // Create a merged dossier object for generation
      const mergedDossier = {
        ...dossier,
        num_contrat: formData.num_contrat,
        assurances_id: formData.assurances_id,
        assurances: { nom: assurancesList.find(a => a.id === formData.assurances_id)?.nom || 'Assurance' }
      };

      // Fetch the raw signature image
      const sigPath = \`dossiers/\${params.id}/signature_client.png\`;
      const { data: { publicUrl: sigUrl } } = supabase.storage.from('documents').getPublicUrl(sigPath);
      
      // Wait for image fetch to verify it exists and to get base64
      let signatureDataUrl = null;
      try {
        const sigRes = await fetch(sigUrl);
        if (sigRes.ok) {
          const sigBlob = await sigRes.blob();
          signatureDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(sigBlob);
          });
        }
      } catch (err) {
        console.warn("Signature brute introuvable ou illisible", err);
      }

      if (!signatureDataUrl) {
        alert("Impossible de régénérer : l'image brute de la signature du client n'a pas été trouvée (ancien dossier ?).");
        setIsRegenerating(false);
        return;
      }

      const doc = generatePDF(mergedDossier, signatureDataUrl);
      const pdfBlob = doc.output('blob');

      const fileName = \`documents_complets_\${dossier.numero}_\${Date.now()}.pdf\`;
      const filePath = \`dossiers/\${params.id}/\${fileName}\`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, pdfBlob, { contentType: 'application/pdf', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl: pdfUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
      await supabase.from('dossiers').update({ signature_url: pdfUrl }).eq('id', params.id);
      
      setDossier(prev => ({ ...prev, signature_url: pdfUrl }));
      alert("Cession de créance régénérée avec succès !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la régénération: " + err.message);
    } finally {
      setIsRegenerating(false);
    }
  };
`;

if (!content.includes('handleRegenerateCession')) {
  content = content.replace('const handleUpdateStatus = async (newStatus) => {', regenerateFunc + '\n  const handleUpdateStatus = async (newStatus) => {');
}

// 4. Add the button
const buttonCode = `
              {/* Régénérer Cession de créance button */}
              {dossier?.statut !== 'nouveau' && dossier?.signature_url && (
                <button
                  onClick={handleRegenerateCession}
                  disabled={isRegenerating || !formData.assurances_id || !formData.num_contrat}
                  title={(!formData.assurances_id || !formData.num_contrat) ? "Remplissez l'assurance et le numéro de contrat pour régénérer" : ""}
                  className={\`w-full py-3 px-4 border border-[#1454FF] hover:bg-[#1454FF]/10 text-[#1454FF] font-bold rounded-xl transition-all flex items-center justify-center gap-2.5 text-sm \${(isRegenerating || !formData.assurances_id || !formData.num_contrat) ? 'opacity-50 cursor-not-allowed' : 'active:scale-98'}\`}
                >
                  {isRegenerating ? <Loader2 className="animate-spin" size={16} /> : <FileSignature size={16} />}
                  Régénérer Cession
                </button>
              )}
`;

if (!content.includes('Régénérer Cession')) {
  content = content.replace('Cession de créance\n              </button>', 'Cession de créance\n              </button>\n' + buttonCode);
}

fs.writeFileSync('app/gestionnaire/dossiers/[id]/page.js', content);
console.log('Done refactoring gestionnaire page.');
