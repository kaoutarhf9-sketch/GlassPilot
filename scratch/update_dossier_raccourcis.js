const fs = require('fs');

let code = fs.readFileSync('app/dashboard/dossiers/[id]/page.js', 'utf8');

// 1. Add generateFacturePDF import and Edit3 if missing
if (!code.includes('generateFacturePDF')) {
  code = code.replace(
    /import clsx from 'clsx';/,
    `import clsx from 'clsx';\nimport { generateFacturePDF } from '@/lib/generateFacturePDF';`
  );
}

if (!code.includes('Edit3,')) {
  code = code.replace(/Edit, Printer,/, 'Edit, Edit3, Printer,');
}

// 2. Add devisData, factureData, garageObj states
if (!code.includes('const [devisData, setDevisData]')) {
  code = code.replace(
    /const \[savingInvoice, setSavingInvoice\] = useState\(false\);/,
    `const [savingInvoice, setSavingInvoice] = useState(false);
  const [devisData, setDevisData] = useState(null);
  const [factureData, setFactureData] = useState(null);
  const [garageObj, setGarageObj] = useState(null);`
  );
}

// 3. In fetchUserAndGarage, setGarageObj
code = code.replace(
  /\.select\('id, nom_garage'\)/,
  `.select('*')`
);
code = code.replace(
  /setGarageName\(garage\.nom_garage\);/,
  `setGarageName(garage.nom_garage);\n          setGarageObj(garage);`
);

// 4. In fetchDossierAndDocs, parse devis and facture
code = code.replace(
  /if \(dossierData\.notes\) \{[\s\S]*?const parsedNotes = typeof dossierData\.notes === 'string' \? JSON\.parse\(dossierData\.notes\) : dossierData\.notes;/,
  `if (dossierData.notes) {
          const parsedNotes = typeof dossierData.notes === 'string' ? JSON.parse(dossierData.notes) : dossierData.notes;
          setDevisData(parsedNotes.devis || null);
          setFactureData(parsedNotes.facture || null);`
);

// 5. Add handlers handleGenerateFactureFromDossier, handleViewFacturePDF, handleDeleteFacture
if (!code.includes('handleGenerateFactureFromDossier')) {
  const handlerCode = `
  const handleGenerateFactureFromDossier = async () => {
    if (!dossier) return;
    try {
      const currentNotes = JSON.parse(dossier.notes || '{}');
      const dev = currentNotes.devis || devisData;
      if (!dev) {
        router.push(\`/dashboard/dossiers/\${dossier.id}/devis\`);
        return;
      }

      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      const facNum = \`\${year}10\${dossier.numero?.replace(/[^0-9]/g, '').slice(-4) || rand}\`;

      const fac = {
        numero: facNum,
        date_emission: dev.date_emission || new Date().toISOString().split('T')[0],
        date_echeance: dev.date_validite,
        lignes: dev.lignes || [],
        total_ht: dev.total_ht || 0,
        montant_tva: dev.montant_tva || 0,
        total_ttc: dev.total_ttc || 0,
        du_client: Number(dossier.franchise_montant || 0),
        statut: 'en_attente',
        created_at: new Date().toISOString()
      };

      currentNotes.facture = fac;
      if (currentNotes.devis) {
        currentNotes.devis.statut = 'facture';
      }

      await supabase
        .from('dossiers')
        .update({ 
          notes: JSON.stringify(currentNotes),
          montant: dev.total_ttc || 0
        })
        .eq('id', dossier.id);

      setFactureData(fac);
      setDevisData(currentNotes.devis);

      const doc = generateFacturePDF({
        dossier,
        garage: garageObj || { nom_garage: garageName },
        devisData: dev,
        factureData: fac,
        isDevis: false
      });
      doc.save(\`facture_\${fac.numero}.pdf\`);

      alert("Facture générée avec succès !");
    } catch (err) {
      console.error("Erreur génération facture:", err);
      alert("Impossible de générer la facture: " + err.message);
    }
  };

  const handleViewFacturePDF = () => {
    try {
      const doc = generateFacturePDF({
        dossier,
        garage: garageObj || { nom_garage: garageName },
        devisData,
        factureData,
        isDevis: !factureData
      });
      const num = factureData?.numero || devisData?.numero || dossier?.numero;
      doc.save(\`\${num}.pdf\`);
    } catch (err) {
      console.error("Erreur téléchargement PDF:", err);
      alert("Erreur génération PDF: " + err.message);
    }
  };

  const handleDeleteFacture = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette facture ?")) return;
    try {
      const currentNotes = JSON.parse(dossier.notes || '{}');
      delete currentNotes.facture;
      if (currentNotes.devis) {
        currentNotes.devis.statut = 'brouillon';
      }

      await supabase
        .from('dossiers')
        .update({ notes: JSON.stringify(currentNotes) })
        .eq('id', dossier.id);

      setFactureData(null);
      if (currentNotes.devis) setDevisData(currentNotes.devis);
      alert("Facture supprimée.");
    } catch (err) {
      console.error(err);
      alert("Erreur suppression facture: " + err.message);
    }
  };
`;

  code = code.replace(
    /const generateAndSaveInvoicePDF = async \(\) => \{/,
    `${handlerCode}\n  const generateAndSaveInvoicePDF = async () => {`
  );
}

// 6. Insert the RACCOURCIS widget in the right column
const widgetJSX = `
            {/* WIDGET RACCOURCIS (Fidèle à l'image 2 de la maquette) */}
            <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                RACCOURCIS
              </h3>

              {/* Ligne Devis */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileText size={18} className="text-[#00d4ff]" />
                  <span className="text-base font-bold text-white">
                    Devis {devisData?.total_ttc ? \`( \${devisData.total_ttc.toFixed(2)} € )\` : ''}
                  </span>
                </div>
                
                <Link
                  href={\`/dashboard/dossiers/\${dossier.id}/devis\`}
                  className="px-3.5 py-1.5 bg-[#16223d] hover:bg-[#1454FF] text-white rounded-xl text-xs font-bold border border-[#25375c] hover:border-[#1454FF] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={14} className="text-[#00d4ff]" />
                  {devisData ? 'Modifier devis' : 'Créer un devis'}
                </Link>
              </div>

              <div className="h-px bg-[#1e2d4a]" />

              {/* Ligne Facture */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <FileText size={18} className="text-emerald-400" />
                    <span className="text-base font-bold text-white">
                      Facture {factureData?.total_ttc ? \`( \${factureData.total_ttc.toFixed(2)} € )\` : (devisData?.total_ttc ? \`( \${devisData.total_ttc.toFixed(2)} € )\` : '')}
                    </span>
                  </div>

                  {!factureData && devisData && (
                    <button
                      onClick={handleGenerateFactureFromDossier}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText size={13} />
                      Générer la facture
                    </button>
                  )}
                </div>

                {/* Boutons d'action sous la facture : Ouvrir/Modifier, Voir PDF, Supprimer */}
                <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                  
                  {/* Ouvrir / Modifier */}
                  <Link
                    href={\`/dashboard/dossiers/\${dossier.id}/devis\`}
                    className="px-3 py-1.5 rounded-xl border border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Edit3 size={13} className="text-emerald-400" />
                    Ouvrir / Modifier
                  </Link>

                  {/* Voir PDF */}
                  <button
                    onClick={handleViewFacturePDF}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-600/80 hover:bg-slate-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <FileText size={13} className="text-[#00d4ff]" />
                    Voir PDF
                  </button>

                  {/* Trash icon */}
                  <button
                    onClick={handleDeleteFacture}
                    className="p-2 rounded-xl bg-[#16223d] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-[#25375c] transition-all cursor-pointer"
                    title="Supprimer la facture"
                  >
                    <Trash2 size={15} />
                  </button>

                </div>
              </div>
            </div>
`;

if (!code.includes('WIDGET RACCOURCIS')) {
  code = code.replace(
    /\{\/\* Colonne droite - Widgets \*\/\}[\r\n\s]*<div className="space-y-6">/,
    `{/* Colonne droite - Widgets */}\n          <div className="space-y-6">\n${widgetJSX}`
  );
}

fs.writeFileSync('app/dashboard/dossiers/[id]/page.js', code, 'utf8');
console.log('Successfully updated app/dashboard/dossiers/[id]/page.js with RACCOURCIS widget');
