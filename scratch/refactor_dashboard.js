const fs = require('fs');
let content = fs.readFileSync('app/dashboard/dossiers/[id]/cession/page.js', 'utf8');

// 1. Add import
if (!content.includes('import { generatePDF }')) {
  content = content.replace("import clsx from 'clsx';", "import clsx from 'clsx';\nimport { generatePDF } from '@/lib/pdfGenerator';");
}

// 2. Remove generatePDF definition
const start = content.indexOf('  // ============================================================');
const end = content.indexOf('  // Preview Generation Effect');
if (start !== -1 && end !== -1) {
  content = content.slice(0, start) + content.slice(end);
}

// 3. Update preview generation to pass dossier
content = content.replace('const doc = generatePDF(null);', 'const doc = generatePDF(dossier, null);');

// 4. Update save handler to upload the signature PNG and pass dossier to generatePDF
const replaceSaveHandler = `  const handleSaveAndGeneratePDF = async () => {
    if (!hasSignature()) {
      alert('Veuillez signer avant de valider.');
      return;
    }
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');
      const doc = generatePDF(dossier, signatureDataUrl);
      const pdfBlob = doc.output('blob');

      const link = document.createElement('a');
      const blobUrl = URL.createObjectURL(pdfBlob);
      link.href = blobUrl;
      link.download = \`dossier_\${dossier.numero}_complet.pdf\`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

      // Upload raw signature for regeneration later
      const sigRes = await fetch(signatureDataUrl);
      const sigBlob = await sigRes.blob();
      const sigPath = \`dossiers/\${params.id}/signature_client.png\`;
      await supabase.storage.from('documents').upload(sigPath, sigBlob, { contentType: 'image/png', upsert: true });

      // Upload generated PDF
      const fileName = \`documents_complets_\${dossier.numero}_\${Date.now()}.pdf\`;
      const filePath = \`dossiers/\${params.id}/\${fileName}\`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, pdfBlob, { contentType: 'application/pdf', upsert: true });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
        await supabase.from('dossiers').update({
          signature_url: publicUrl,
          date_signature: new Date().toISOString(),
          statut: 'signe'
        }).eq('id', params.id);
      }

      setGeneratedPdfBlob(pdfBlob);
      setIsSigned(true);
    } catch (err) {
      console.error(err);
      alert('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };`;

const saveStart = content.indexOf('  const handleSaveAndGeneratePDF = async () => {');
const saveEnd = content.indexOf('  const handleDownload = () => {');
if (saveStart !== -1 && saveEnd !== -1) {
  content = content.slice(0, saveStart) + replaceSaveHandler + '\n\n' + content.slice(saveEnd);
}

fs.writeFileSync('app/dashboard/dossiers/[id]/cession/page.js', content);
console.log('Done refactoring dashboard page.');
