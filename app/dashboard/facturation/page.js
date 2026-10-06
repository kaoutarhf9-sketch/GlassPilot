"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  FileText, Search, Loader2, Car, Calendar, 
  Eye, Download, Trash2, CheckCircle2, Clock, 
  Building2, Users, ArrowUpRight
} from 'lucide-react';
import { generateFacturePDF } from '@/lib/generateFacturePDF';

export default function ListeFacturationPage() {
  const [loading, setLoading] = useState(true);
  const [factures, setFactures] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [garage, setGarage] = useState(null);

  useEffect(() => {
    fetchFactures();
  }, []);

  const fetchFactures = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: g } = await supabase
        .from('garages')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!g) return;
      setGarage(g);

      const { data: dossiers, error } = await supabase
        .from('dossiers')
        .select(`
          id,
          numero,
          immatriculation,
          modele_vehicule,
          created_at,
          notes,
          clients (*)
        `)
        .eq('garage_id', g.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const extracted = [];
      dossiers?.forEach(d => {
        if (!d.notes) return;
        try {
          const parsed = JSON.parse(d.notes);
          const fac = parsed.facture;
          const dev = parsed.devis;
          if (fac) {
            extracted.push({
              id: `fac-${d.id}`,
              dossier_id: d.id,
              dossier_numero: d.numero,
              numero: fac.numero || `FAC-${d.numero}`,
              client: d.clients,
              immatriculation: d.immatriculation,
              modele: d.modele_vehicule,
              date_emission: fac.date_emission || d.created_at,
              total_ht: Number(fac.total_ht) || 0,
              total_ttc: Number(fac.total_ttc) || 0,
              du_client: Number(fac.du_client) || 0,
              factureData: fac,
              devisData: dev,
              dossier: d
            });
          }
        } catch (e) {}
      });

      setFactures(extracted);

    } catch (err) {
      console.error('Erreur chargement factures:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (item) => {
    try {
      const doc = generateFacturePDF({
        dossier: item.dossier,
        garage: garage || {},
        devisData: item.devisData,
        factureData: item.factureData,
        isDevis: false
      });
      doc.save(`facture_${item.numero}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erreur génération PDF: " + e.message);
    }
  };

  const filteredFactures = factures.filter(item => {
    const q = searchTerm.toLowerCase();
    return (
      (item.numero || '').toLowerCase().includes(q) ||
      (item.dossier_numero || '').toLowerCase().includes(q) ||
      (item.immatriculation || '').toLowerCase().includes(q) ||
      (item.client?.nom || '').toLowerCase().includes(q) ||
      (item.client?.prenom || '').toLowerCase().includes(q)
    );
  });

  const totalFactureTTC = factures.reduce((acc, f) => acc + f.total_ttc, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-[#00d4ff] mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Chargement des factures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans pb-16">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#1454FF]/10 rounded-full px-3.5 py-1.5 mb-3 border border-[#1454FF]/30">
            <FileText size={14} className="text-[#1454FF]" />
            <span className="text-xs font-bold text-[#00d4ff] uppercase tracking-wider">Facturation Garage</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Facturation</h1>
          <p className="text-slate-400 text-sm mt-1">
            Consultez toutes vos factures générées, montants et téléchargez les PDF
          </p>
        </div>

        <Link
          href="/dashboard/devis"
          className="px-4 py-2.5 bg-[#1454FF] hover:bg-[#1060ff] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#1454FF]/30 flex items-center gap-2"
        >
          Voir les devis en cours
        </Link>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        <div className="bg-[#0d1428] rounded-2xl p-5 border border-[#1e2d4a] shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Total Factures</span>
          <p className="text-3xl font-extrabold text-white">{factures.length}</p>
          <p className="text-xs text-slate-400 mt-1">Factures générées au total</p>
        </div>

        <div className="bg-[#0d1428] rounded-2xl p-5 border border-[#1e2d4a] shadow-lg">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">Chiffre d'affaires facturé</span>
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">
            {totalFactureTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </p>
          <p className="text-xs text-slate-400 mt-1">Montant total TTC émis</p>
        </div>

        <div className="bg-[#0d1428] rounded-2xl p-5 border border-[#1e2d4a] shadow-lg">
          <span className="text-xs font-bold text-[#00d4ff] uppercase tracking-wider block mb-2">Devis associés</span>
          <p className="text-3xl font-extrabold text-[#00d4ff] font-mono">{factures.length}</p>
          <p className="text-xs text-slate-400 mt-1">Liés à une intervention</p>
        </div>

      </div>

      {/* Recherche */}
      <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] shadow-lg p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher par numéro de facture, client, immatriculation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-[#111c35] border border-[#1e2d4a] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00d4ff]"
          />
        </div>
      </div>

      {/* Liste des factures */}
      {filteredFactures.length === 0 ? (
        <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] p-12 text-center shadow-lg">
          <div className="w-16 h-16 bg-[#111c35] border border-[#1e2d4a] rounded-full flex items-center justify-center mx-auto mb-4 text-[#00d4ff]">
            <FileText size={28} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Aucune facture générée</h3>
          <p className="text-slate-400 text-sm">Créez un devis puis cliquez sur « Générer la facture »</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFactures.map((item) => {
            const clientName = item.client 
              ? `${item.client.prenom || ''} ${item.client.nom || ''}`.trim() 
              : 'Client non renseigné';

            return (
              <div 
                key={item.id}
                className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] hover:border-[#00d4ff]/40 shadow-lg overflow-hidden flex flex-col justify-between group transition-all"
              >
                {/* Header card */}
                <div className="p-5 border-b border-[#1e2d4a] bg-[#111c35] flex justify-between items-start gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#00d4ff] bg-[#16223d] border border-[#25375c] px-2.5 py-0.5 rounded-lg">
                      {item.numero}
                    </span>

                    <h2 className="text-base font-bold text-white mt-2 group-hover:text-[#00d4ff] transition-colors truncate">
                      {clientName}
                    </h2>
                    
                    <p className="text-xs text-slate-400 mt-0.5">
                      Dossier : <strong className="text-slate-300">{item.dossier_numero}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-400 font-mono">
                      {item.total_ttc.toFixed(2)} €
                    </p>
                    <p className="text-[11px] text-slate-400">
                      TTC
                    </p>
                  </div>
                </div>

                {/* Body info */}
                <div className="p-5 space-y-3 flex-1 bg-[#0d1428]">
                  
                  {/* Véhicule */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Car size={14} className="text-[#00d4ff]" />
                    <span className="font-mono text-[#00d4ff]">{item.immatriculation || '—'}</span>
                    {item.modele && <span className="text-slate-400 truncate">({item.modele})</span>}
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar size={14} className="text-slate-400" />
                    <span>Émise le {new Date(item.date_emission).toLocaleDateString('fr-FR')}</span>
                  </div>

                </div>

                {/* Actions */}
                <div className="p-4 bg-[#111c35]/80 border-t border-[#1e2d4a] flex items-center gap-2">
                  
                  <button
                    onClick={() => handleDownloadPDF(item)}
                    className="flex-1 py-2 px-3 bg-[#1454FF] hover:bg-[#1060ff] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Eye size={14} /> Voir PDF
                  </button>

                  <Link
                    href={`/dashboard/dossiers/${item.dossier_id}`}
                    className="p-2 bg-[#16223d] hover:bg-[#25375c] text-slate-300 hover:text-white rounded-xl border border-[#25375c] transition-all"
                    title="Voir le dossier"
                  >
                    <ArrowUpRight size={15} />
                  </Link>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
