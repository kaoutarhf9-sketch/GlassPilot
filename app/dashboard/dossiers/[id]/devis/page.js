"use client";

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Plus, Trash2, Save, FileText, 
  Loader2, Sparkles, CheckCircle2, FileSignature, 
  Download, Eye, Calculator
} from 'lucide-react';
import clsx from 'clsx';
import { generateFacturePDF } from '@/lib/generateFacturePDF';

export default function NouveauDevisPage({ params }) {
  const unwrappedParams = use(params);
  const dossierId = unwrappedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dossier, setDossier] = useState(null);
  const [garage, setGarage] = useState(null);

  // Informations de base
  const [dateEmission, setDateEmission] = useState(() => new Date().toISOString().split('T')[0]);
  const [tauxTvaDefault, setTauxTvaDefault] = useState('20');
  const [numeroDevis, setNumeroDevis] = useState('');
  const [dateValidite, setDateValidite] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Remise générale
  const [remiseGenerale, setRemiseGenerale] = useState(0);
  const [remiseType, setRemiseType] = useState('%'); // '%' ou '€'

  // Lignes d'articles
  const [lignes, setLignes] = useState([
    {
      id: '1',
      designation: '',
      prix_ht: 0,
      quantite: 1,
      tva: 20,
      remise: 0,
      details: ''
    }
  ]);

  useEffect(() => {
    fetchData();
  }, [dossierId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: g } = await supabase
        .from('garages')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (g) setGarage(g);

      const { data: d, error } = await supabase
        .from('dossiers')
        .select('*, clients(*)')
        .eq('id', dossierId)
        .single();

      if (error) throw error;
      setDossier(d);

      // Générer ou charger le numéro de devis
      let loadedNum = '';
      if (d?.notes) {
        try {
          const parsed = JSON.parse(d.notes);
          if (parsed.devis) {
            const dev = parsed.devis;
            loadedNum = dev.numero || '';
            if (dev.date_emission) setDateEmission(dev.date_emission);
            if (dev.date_validite) setDateValidite(dev.date_validite);
            if (dev.taux_tva) setTauxTvaDefault(dev.taux_tva.toString());
            if (dev.remise_generale !== undefined) setRemiseGenerale(dev.remise_generale);
            if (dev.remise_type) setRemiseType(dev.remise_type);
            if (dev.lignes && dev.lignes.length > 0) setLignes(dev.lignes);
          } else if (parsed.facture_lignes && parsed.facture_lignes.length > 0) {
            setLignes(parsed.facture_lignes.map((l, i) => ({
              id: l.id || (i + 1).toString(),
              designation: l.desc || l.designation || '',
              prix_ht: Number(l.prix || l.prix_ht || 0),
              quantite: Number(l.qte || l.quantite || 1),
              tva: 20,
              remise: 0,
              details: ''
            })));
          }
        } catch (e) {
          console.error('Erreur parsing devis existant:', e);
        }
      }

      if (!loadedNum) {
        const year = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        const autoNum = `FAC-${year}-${d.numero?.replace(/[^0-9]/g, '') || rand}`;
        setNumeroDevis(autoNum);
      } else {
        setNumeroDevis(loadedNum);
      }

    } catch (err) {
      console.error('Erreur chargement dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  // Raccourcis Rapides
  const handleShortcutClick = (shortcutType) => {
    const modele = dossier?.modele_vehicule || '';
    const shortcuts = {
      MAIN: {
        designation: "MAIN D'OEUVRE POSE / DEPOSE PARE-BRISE",
        prix_ht: 92.00,
        quantite: 2.5,
        tva: Number(tauxTvaDefault) || 20,
        remise: 0
      },
      KIT: {
        designation: "KIT COLLAGE PARE BRISE BI COMPOSANT",
        prix_ht: 55.59,
        quantite: 1,
        tva: Number(tauxTvaDefault) || 20,
        remise: 0
      },
      GEL: {
        designation: "GEL CAPTEUR DE PLUIE SILICONE",
        prix_ht: 25.00,
        quantite: 1,
        tva: Number(tauxTvaDefault) || 20,
        remise: 0
      },
      RECY: {
        designation: "RECYCLAGE PARE-BRISE",
        prix_ht: 10.00,
        quantite: 1,
        tva: Number(tauxTvaDefault) || 20,
        remise: 0
      },
      ENJ: {
        designation: `ENJOLIVEUR PARE-BRISE ${modele}`.trim(),
        prix_ht: 54.04,
        quantite: 1,
        tva: Number(tauxTvaDefault) || 20,
        remise: 0
      },
      PROD: {
        designation: "PRODUITS CONNEXES",
        prix_ht: 8.75,
        quantite: 1,
        tva: Number(tauxTvaDefault) || 20,
        remise: 0
      },
      VITRAGE: {
        designation: `PARE-BRISE TEINTÉ VERT DÉGRADÉ BLEU ${modele}`.trim(),
        prix_ht: 368.17,
        quantite: 1,
        tva: Number(tauxTvaDefault) || 20,
        remise: 0
      }
    };

    const sc = shortcuts[shortcutType];
    if (!sc) return;

    // Si la première ligne est vide, la remplacer au lieu d'en ajouter une nouvelle
    if (lignes.length === 1 && !lignes[0].designation && lignes[0].prix_ht === 0) {
      setLignes([{
        ...lignes[0],
        ...sc
      }]);
    } else {
      setLignes(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          ...sc,
          details: ''
        }
      ]);
    }
  };

  const addLine = () => {
    setLignes(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        designation: '',
        prix_ht: 0,
        quantite: 1,
        tva: Number(tauxTvaDefault) || 20,
        remise: 0,
        details: ''
      }
    ]);
  };

  const removeLine = (id) => {
    if (lignes.length === 1) {
      setLignes([{
        id: Date.now().toString(),
        designation: '',
        prix_ht: 0,
        quantite: 1,
        tva: Number(tauxTvaDefault) || 20,
        remise: 0,
        details: ''
      }]);
      return;
    }
    setLignes(prev => prev.filter(l => l.id !== id));
  };

  const updateLine = (id, field, value) => {
    setLignes(prev => prev.map(l => {
      if (l.id !== id) return l;
      return { ...l, [field]: value };
    }));
  };

  // Calculs
  const calculateLineTotalHT = (line) => {
    const pu = Number(line.prix_ht) || 0;
    const qte = Number(line.quantite) || 0;
    const rem = Number(line.remise) || 0;
    return pu * qte * (1 - rem / 100);
  };

  const calculateLineTotalTTC = (line) => {
    const totalHT = calculateLineTotalHT(line);
    const tva = Number(line.tva) || 0;
    return totalHT * (1 + tva / 100);
  };

  const subtotalHT = lignes.reduce((acc, l) => acc + calculateLineTotalHT(l), 0);

  const calculateRemiseGeneraleMontant = () => {
    const val = Number(remiseGenerale) || 0;
    if (remiseType === '%') {
      return subtotalHT * (val / 100);
    }
    return val;
  };

  const remiseGeneraleMontant = calculateRemiseGeneraleMontant();
  const finalTotalHT = Math.max(0, subtotalHT - remiseGeneraleMontant);
  const generalTvaRate = Number(tauxTvaDefault) || 20;
  const finalMontantTVA = finalTotalHT * (generalTvaRate / 100);
  const finalTotalTTC = finalTotalHT + finalMontantTVA;

  // Enregistrement
  const handleSaveDevis = async (options = { generateFacture: false }) => {
    setSaving(true);
    try {
      const devisData = {
        numero: numeroDevis,
        date_emission: dateEmission,
        date_validite: dateValidite,
        taux_tva: generalTvaRate,
        lignes: lignes.map(l => ({
          ...l,
          prix_ht: Number(l.prix_ht) || 0,
          quantite: Number(l.quantite) || 1,
          remise: Number(l.remise) || 0,
          tva: Number(l.tva) || generalTvaRate,
          total_ht: calculateLineTotalHT(l),
          total_ttc: calculateLineTotalTTC(l)
        })),
        remise_generale: Number(remiseGenerale) || 0,
        remise_type: remiseType,
        total_remise: remiseGeneraleMontant,
        total_ht: finalTotalHT,
        montant_tva: finalMontantTVA,
        total_ttc: finalTotalTTC,
        statut: options.generateFacture ? 'facture' : 'brouillon',
        updated_at: new Date().toISOString()
      };

      // Lecture des notes actuelles
      const { data: currentDossier } = await supabase
        .from('dossiers')
        .select('notes')
        .eq('id', dossierId)
        .single();

      const currentNotes = JSON.parse(currentDossier?.notes || '{}');
      const updatedNotes = {
        ...currentNotes,
        devis: devisData,
        // Compatibilité avec les anciennes factures
        facture_lignes: lignes.map(l => ({
          id: l.id,
          desc: l.designation,
          qte: Number(l.quantite) || 1,
          prix: Number(l.prix_ht) || 0
        }))
      };

      if (options.generateFacture) {
        const year = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        const facNum = `${year}10${dossier?.numero?.replace(/[^0-9]/g, '').slice(-4) || rand}`;
        
        updatedNotes.facture = {
          numero: facNum,
          date_emission: dateEmission,
          date_echeance: dateValidite,
          lignes: devisData.lignes,
          total_ht: finalTotalHT,
          montant_tva: finalMontantTVA,
          total_ttc: finalTotalTTC,
          du_client: Number(dossier?.franchise_montant || 0),
          statut: 'en_attente',
          created_at: new Date().toISOString()
        };
      }

      const { error: updateError } = await supabase
        .from('dossiers')
        .update({ 
          notes: JSON.stringify(updatedNotes),
          montant: finalTotalTTC
        })
        .eq('id', dossierId);

      if (updateError) throw updateError;

      alert(options.generateFacture 
        ? "Devis et Facture générés avec succès !" 
        : "Devis enregistré avec succès !"
      );

      router.push(`/dashboard/dossiers/${dossierId}`);

    } catch (err) {
      console.error('Erreur enregistrement devis:', err);
      alert("Erreur lors de l'enregistrement du devis : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewPDF = () => {
    try {
      const devisData = {
        numero: numeroDevis,
        date_emission: dateEmission,
        date_validite: dateValidite,
        taux_tva: generalTvaRate,
        lignes,
        total_ht: finalTotalHT,
        montant_tva: finalMontantTVA,
        total_ttc: finalTotalTTC
      };

      const doc = generateFacturePDF({
        dossier,
        garage: garage || {},
        devisData,
        isDevis: true
      });

      doc.save(`${numeroDevis}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erreur génération aperçu PDF: " + e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-[#00d4ff] mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Chargement du devis...</p>
        </div>
      </div>
    );
  }

  const client = dossier?.clients;
  const clientNom = client ? `${client.prenom || ''} ${client.nom || ''}`.trim().toUpperCase() : 'CLIENT INCONNU';

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans pb-16">
      
      {/* En-tête */}
      <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Nouveau devis
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#00d4ff] mt-1 flex items-center gap-2">
            <span>Dossier : <strong className="text-white">{clientNom}</strong></span>
            {dossier?.immatriculation && (
              <span className="font-mono text-xs bg-[#16223d] border border-[#25375c] px-2 py-0.5 rounded text-[#00d4ff]">
                {dossier.immatriculation}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href={`/dashboard/dossiers/${dossierId}`}
            className="px-4 py-2 bg-[#111c35] hover:bg-[#16223d] text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-[#1e2d4a] transition-all flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Retour au dossier
          </Link>

          <button
            onClick={handlePreviewPDF}
            className="px-4 py-2 bg-[#1454FF]/20 hover:bg-[#1454FF] text-[#00d4ff] hover:text-white rounded-xl text-xs font-bold border border-[#00d4ff]/30 transition-all flex items-center gap-2 cursor-pointer"
            title="Aperçu PDF"
          >
            <Eye size={14} /> Aperçu PDF
          </button>
        </div>
      </div>

      {/* Carte 1 : Informations de base */}
      <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] p-5 sm:p-6 shadow-lg space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Informations de base
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Date d'émission */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
              Date d'émission
            </label>
            <input 
              type="date"
              value={dateEmission}
              onChange={(e) => setDateEmission(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#111c35] border border-[#1e2d4a] rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-[#00d4ff]"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Date de création du devis</span>
          </div>

          {/* Taux de TVA */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
              Taux de TVA
            </label>
            <select
              value={tauxTvaDefault}
              onChange={(e) => {
                setTauxTvaDefault(e.target.value);
                setLignes(prev => prev.map(l => ({ ...l, tva: Number(e.target.value) })));
              }}
              className="w-full px-3.5 py-2.5 bg-[#111c35] border border-[#1e2d4a] rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-[#00d4ff]"
            >
              <option value="20">20% TVA</option>
              <option value="10">10% TVA</option>
              <option value="5.5">5.5% TVA</option>
              <option value="0">0% TVA</option>
            </select>
          </div>

          {/* Numéro de devis auto-généré */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
              Numéro de devis (auto-généré)
            </label>
            <input 
              type="text"
              value={numeroDevis}
              onChange={(e) => setNumeroDevis(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#111c35] border border-[#1e2d4a] rounded-xl text-sm font-mono font-bold text-[#00d4ff] focus:outline-none focus:border-[#00d4ff]"
            />
          </div>

        </div>

        {/* Date limite de validité */}
        <div className="pt-2">
          <div className="max-w-md">
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
              Date limite de validité
            </label>
            <input 
              type="date"
              value={dateValidite}
              onChange={(e) => setDateValidite(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#111c35] border border-[#1e2d4a] rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-[#00d4ff]"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Optionnel - Date d'expiration du devis</span>
          </div>
        </div>
      </div>

      {/* Carte 2 : Raccourcis Rapides */}
      <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] p-5 sm:p-6 shadow-lg space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Raccourcis Rapides
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cliquez sur un raccourci pour l'ajouter comme ligne au devis
            </p>
          </div>
          <span className="text-xs font-bold text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/30 px-3 py-1 rounded-lg">
            Gérer les raccourcis
          </span>
        </div>

        {/* Boutons Raccourcis (fidèle à la maquette de la capture 3) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          
          <button
            type="button"
            onClick={() => handleShortcutClick('MAIN')}
            className="p-3 bg-[#111c35] hover:bg-[#16223d] border border-[#1e2d4a] hover:border-[#00d4ff]/40 rounded-xl text-left transition-all group cursor-pointer shadow-sm"
          >
            <span className="text-amber-400 font-black text-xs block group-hover:text-amber-300">MAIN</span>
            <span className="text-[11px] font-semibold text-slate-300 block truncate mt-0.5">MAIN D'OEUVRE POSE/DEPOSE</span>
          </button>

          <button
            type="button"
            onClick={() => handleShortcutClick('KIT')}
            className="p-3 bg-[#111c35] hover:bg-[#16223d] border border-[#1e2d4a] hover:border-[#00d4ff]/40 rounded-xl text-left transition-all group cursor-pointer shadow-sm"
          >
            <span className="text-amber-400 font-black text-xs block group-hover:text-amber-300">KIT</span>
            <span className="text-[11px] font-semibold text-slate-300 block truncate mt-0.5">KIT COLLAGE BI COMPOSANT</span>
          </button>

          <button
            type="button"
            onClick={() => handleShortcutClick('GEL')}
            className="p-3 bg-[#111c35] hover:bg-[#16223d] border border-[#1e2d4a] hover:border-[#00d4ff]/40 rounded-xl text-left transition-all group cursor-pointer shadow-sm"
          >
            <span className="text-amber-400 font-black text-xs block group-hover:text-amber-300">GEL</span>
            <span className="text-[11px] font-semibold text-slate-300 block truncate mt-0.5">GEL CAPTEUR SILICONE</span>
          </button>

          <button
            type="button"
            onClick={() => handleShortcutClick('RECY')}
            className="p-3 bg-[#111c35] hover:bg-[#16223d] border border-[#1e2d4a] hover:border-[#00d4ff]/40 rounded-xl text-left transition-all group cursor-pointer shadow-sm"
          >
            <span className="text-amber-400 font-black text-xs block group-hover:text-amber-300">RECY</span>
            <span className="text-[11px] font-semibold text-slate-300 block truncate mt-0.5">RECYCLAGE PARE-BRISE</span>
          </button>

          <button
            type="button"
            onClick={() => handleShortcutClick('ENJ')}
            className="p-3 bg-[#111c35] hover:bg-[#16223d] border border-[#1e2d4a] hover:border-[#00d4ff]/40 rounded-xl text-left transition-all group cursor-pointer shadow-sm"
          >
            <span className="text-amber-400 font-black text-xs block group-hover:text-amber-300">ENJ</span>
            <span className="text-[11px] font-semibold text-slate-300 block truncate mt-0.5">ENJOLIVEUR PARE-BRISE</span>
          </button>

        </div>
      </div>

      {/* Carte 3 : Lignes du devis */}
      <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] p-5 sm:p-6 shadow-lg space-y-5">
        
        <div className="flex justify-between items-center pb-2 border-b border-[#1e2d4a]">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Lignes du devis
            </h3>
            <span className="px-2.5 py-0.5 bg-[#1454FF]/20 border border-[#00d4ff]/30 text-[#00d4ff] text-[11px] font-bold rounded-full">
              {lignes.length} ARTICLE{lignes.length > 1 ? 'S' : ''}
            </span>
          </div>

          <button
            type="button"
            onClick={addLine}
            className="px-4 py-2 bg-[#1454FF] hover:bg-[#1060ff] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#1454FF]/30 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} /> Ajouter une ligne
          </button>
        </div>

        {/* Liste des articles */}
        <div className="space-y-4">
          {lignes.map((line, idx) => {
            const lineTotalHT = calculateLineTotalHT(line);
            const lineTotalTTC = calculateLineTotalTTC(line);

            return (
              <div 
                key={line.id} 
                className="bg-[#111c35] rounded-xl border border-[#1e2d4a] p-4 space-y-3.5 relative shadow-sm"
              >
                {/* Header ligne */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#1454FF] text-white font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white uppercase">Article</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} /> Supprimer
                  </button>
                </div>

                {/* Désignation */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Désignation
                  </label>
                  <input 
                    type="text"
                    value={line.designation}
                    onChange={(e) => updateLine(line.id, 'designation', e.target.value)}
                    placeholder="Description de l'article"
                    className="w-full px-3.5 py-2.5 bg-[#0d1428] border border-[#1e2d4a] rounded-xl text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00d4ff]"
                  />
                </div>

                {/* Grille : Prix HT, Quantité, TVA, Remise, Total HT, Total TTC */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 items-end">
                  
                  {/* Prix HT */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Prix HT
                    </label>
                    <div className="relative">
                      <input 
                        type="number"
                        step="0.01"
                        value={line.prix_ht}
                        onChange={(e) => updateLine(line.id, 'prix_ht', e.target.value)}
                        className="w-full pl-3 pr-7 py-2 bg-[#0d1428] border border-[#1e2d4a] rounded-xl text-sm font-bold text-white text-right focus:outline-none focus:border-[#00d4ff]"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">€</span>
                    </div>
                  </div>

                  {/* Quantité */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Quantité
                    </label>
                    <input 
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={line.quantite}
                      onChange={(e) => updateLine(line.id, 'quantite', e.target.value)}
                      className="w-full px-3 py-2 bg-[#0d1428] border border-[#1e2d4a] rounded-xl text-sm font-bold text-white text-center focus:outline-none focus:border-[#00d4ff]"
                    />
                  </div>

                  {/* TVA */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      TVA
                    </label>
                    <select
                      value={line.tva}
                      onChange={(e) => updateLine(line.id, 'tva', Number(e.target.value))}
                      className="w-full px-2 py-2 bg-[#0d1428] border border-[#1e2d4a] rounded-xl text-xs font-bold text-white text-center focus:outline-none focus:border-[#00d4ff]"
                    >
                      <option value="20">20%</option>
                      <option value="10">10%</option>
                      <option value="5.5">5.5%</option>
                      <option value="0">0%</option>
                    </select>
                  </div>

                  {/* Remise */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Remise
                    </label>
                    <div className="relative">
                      <input 
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={line.remise}
                        onChange={(e) => updateLine(line.id, 'remise', e.target.value)}
                        className="w-full pl-2 pr-6 py-2 bg-[#0d1428] border border-[#1e2d4a] rounded-xl text-sm font-bold text-white text-right focus:outline-none focus:border-[#00d4ff]"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  {/* Total HT calculé */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Total HT
                    </label>
                    <div className="py-2 px-2.5 bg-[#16223d] border border-[#25375c] rounded-xl text-xs font-mono font-bold text-white text-right truncate">
                      {lineTotalHT.toFixed(2)} €
                    </div>
                  </div>

                  {/* Total TTC calculé */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Total TTC
                    </label>
                    <div className="py-2 px-2.5 bg-[#16223d] border border-[#25375c] rounded-xl text-xs font-mono font-bold text-[#00d4ff] text-right truncate">
                      {lineTotalTTC.toFixed(2)} EUR
                    </div>
                  </div>

                </div>

                {/* Détails supplémentaires */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Détails supplémentaires (optionnel)
                  </label>
                  <textarea 
                    rows={1}
                    value={line.details}
                    onChange={(e) => updateLine(line.id, 'details', e.target.value)}
                    placeholder="Spécifications ou notes supplémentaires..."
                    className="w-full px-3.5 py-2 bg-[#0d1428] border border-[#1e2d4a] rounded-xl text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-[#00d4ff] resize-none"
                  />
                </div>

              </div>
            );
          })}
        </div>

        {/* Bouton Ajouter une ligne en bas */}
        <div className="pt-2 flex justify-between items-center border-t border-[#1e2d4a]">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Lignes du devis
          </span>
          <button
            type="button"
            onClick={addLine}
            className="px-4 py-2 bg-[#1454FF] hover:bg-[#1060ff] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#1454FF]/30 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} /> Ajouter une ligne
          </button>
        </div>

      </div>

      {/* Carte 4 : Remise générale */}
      <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] p-5 sm:p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
              Remise générale
            </label>
            <input 
              type="number"
              value={remiseGenerale}
              onChange={(e) => setRemiseGenerale(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#111c35] border border-[#1e2d4a] rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#00d4ff]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
              Type
            </label>
            <select
              value={remiseType}
              onChange={(e) => setRemiseType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#111c35] border border-[#1e2d4a] rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#00d4ff]"
            >
              <option value="%">%</option>
              <option value="€">€</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
              Total remise
            </label>
            <div className="px-3.5 py-2.5 bg-[#111c35] border border-[#1e2d4a] rounded-xl text-sm font-bold text-amber-400 text-right">
              {remiseGeneraleMontant.toFixed(2)} EUR
            </div>
          </div>

        </div>
      </div>

      {/* Carte 5 : Totaux (3 grands blocs comme Image 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] p-5 sm:p-6 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total HT
          </span>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono">
            {finalTotalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </p>
        </div>

        <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] p-5 sm:p-6 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Montant TVA
          </span>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono">
            {finalMontantTVA.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </p>
        </div>

        <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] p-5 sm:p-6 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#00d4ff] block mb-1">
            Total TTC
          </span>
          <p className="text-2xl sm:text-3xl font-black text-[#00d4ff] font-mono">
            {finalTotalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </p>
        </div>

      </div>

      {/* Boutons d'action finaux */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4">
        
        <Link
          href={`/dashboard/dossiers/${dossierId}`}
          className="w-full sm:w-auto px-6 py-3 bg-[#111c35] hover:bg-[#16223d] text-slate-300 hover:text-white rounded-xl text-sm font-bold border border-[#1e2d4a] transition-all text-center"
        >
          Annuler
        </Link>

        <button
          type="button"
          onClick={() => handleSaveDevis({ generateFacture: false })}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-3 bg-[#1454FF] hover:bg-[#1060ff] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#1454FF]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Enregistrer le devis
        </button>

        <button
          type="button"
          onClick={() => handleSaveDevis({ generateFacture: true })}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          Générer la facture
        </button>

      </div>

    </div>
  );
}
