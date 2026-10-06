"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, Search, Plus, Filter, Loader2, 
  Car, Calendar, ChevronRight, Edit3, Eye, 
  Trash2, FileSignature, CheckCircle2, Clock, 
  AlertCircle, Sparkles, Building2, User
} from 'lucide-react';
import clsx from 'clsx';
import { generateFacturePDF } from '@/lib/generateFacturePDF';

export default function ListeDevisPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [devisList, setDevisList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('brouillon'); // Par défaut 'brouillon' pour répondre au souhait du user
  const [garage, setGarage] = useState(null);

  useEffect(() => {
    fetchDevis();
  }, []);

  const fetchDevis = async () => {
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
          kilometrage,
          num_contrat,
          num_sinistre,
          created_at,
          notes,
          clients (*)
        `)
        .eq('garage_id', g.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const extracted = [];
      dossiers?.forEach(d => {
        let dev = null;
        let fac = null;
        if (d.notes) {
          try {
            const parsed = JSON.parse(d.notes);
            dev = parsed.devis || null;
            fac = parsed.facture || null;
          } catch (e) {}
        }

        // Si un devis explicite est enregistré
        if (dev) {
          extracted.push({
            id: `dev-${d.id}`,
            dossier_id: d.id,
            dossier_numero: d.numero,
            numero: dev.numero || `DEV-${d.numero}`,
            client: d.clients,
            immatriculation: d.immatriculation,
            modele: d.modele_vehicule,
            date_emission: dev.date_emission || d.created_at,
            date_validite: dev.date_validite,
            total_ht: Number(dev.total_ht) || 0,
            total_ttc: Number(dev.total_ttc) || 0,
            nb_lignes: dev.lignes?.length || 0,
            statut: fac ? 'facture' : (dev.statut || 'brouillon'),
            devisData: dev,
            factureData: fac,
            dossier: d
          });
        } 
        // Si le dossier n'a pas encore de devis ou a des lignes de facturation brouillon
        else {
          let hasFactureLines = false;
          let parsedLinesCount = 0;
          try {
            const parsed = JSON.parse(d.notes || '{}');
            if (parsed.facture_lignes && parsed.facture_lignes.length > 0) {
              hasFactureLines = true;
              parsedLinesCount = parsed.facture_lignes.length;
            }
          } catch(e) {}

          // Ajoute comme brouillon potentiel non complété
          extracted.push({
            id: `draft-${d.id}`,
            dossier_id: d.id,
            dossier_numero: d.numero,
            numero: `FAC-2026-${d.numero?.replace(/[^0-9]/g, '') || '001'}`,
            client: d.clients,
            immatriculation: d.immatriculation,
            modele: d.modele_vehicule,
            date_emission: d.created_at,
            date_validite: null,
            total_ht: 0,
            total_ttc: 0,
            nb_lignes: parsedLinesCount,
            statut: 'brouillon',
            isUncompleted: true,
            devisData: null,
            factureData: null,
            dossier: d
          });
        }
      });

      setDevisList(extracted);

    } catch (err) {
      console.error('Erreur chargement devis:', err);
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
        isDevis: item.statut !== 'facture'
      });
      doc.save(`${item.numero}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erreur génération PDF: " + e.message);
    }
  };

  const handleDeleteDevis = async (item) => {
    if (!window.confirm(`Voulez-vous supprimer le devis ${item.numero} ?`)) return;
    try {
      const { data: d } = await supabase
        .from('dossiers')
        .select('notes')
        .eq('id', item.dossier_id)
        .single();

      const currentNotes = JSON.parse(d?.notes || '{}');
      delete currentNotes.devis;
      delete currentNotes.facture;

      await supabase
        .from('dossiers')
        .update({ notes: JSON.stringify(currentNotes) })
        .eq('id', item.dossier_id);

      setDevisList(prev => prev.filter(x => x.id !== item.id));
      alert("Devis supprimé avec succès.");
    } catch (e) {
      console.error(e);
      alert("Erreur suppression: " + e.message);
    }
  };

  const filteredDevis = devisList.filter(item => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (item.numero || '').toLowerCase().includes(q) ||
      (item.dossier_numero || '').toLowerCase().includes(q) ||
      (item.immatriculation || '').toLowerCase().includes(q) ||
      (item.client?.nom || '').toLowerCase().includes(q) ||
      (item.client?.prenom || '').toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (statusFilter === 'tous') return true;
    if (statusFilter === 'brouillon') return item.statut === 'brouillon';
    if (statusFilter === 'facture') return item.statut === 'facture';
    return item.statut === statusFilter;
  });

  const stats = {
    total: devisList.length,
    brouillons: devisList.filter(d => d.statut === 'brouillon').length,
    factures: devisList.filter(d => d.statut === 'facture').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-[#00d4ff] mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Chargement des devis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans pb-16">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#00d4ff]/10 rounded-full px-3.5 py-1.5 mb-3 border border-[#00d4ff]/30">
            <FileSignature size={14} className="text-[#00d4ff]" />
            <span className="text-xs font-bold text-[#00d4ff] uppercase tracking-wider">Devis & Chiffrages</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Liste des devis</h1>
          <p className="text-slate-400 text-sm mt-1">
            Gérez vos devis brouillons non complétés, validez-les et convertissez-les en factures
          </p>
        </div>

        <Link
          href="/dashboard/dossiers"
          className="px-4 py-2.5 bg-[#1454FF] hover:bg-[#1060ff] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#1454FF]/30 flex items-center gap-2"
        >
          <Plus size={16} />
          Créer depuis un dossier
        </Link>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        <div 
          onClick={() => setStatusFilter('brouillon')}
          className={clsx(
            "rounded-2xl p-5 border transition-all cursor-pointer shadow-lg",
            statusFilter === 'brouillon'
              ? "bg-[#111c35] border-[#00d4ff] shadow-[#00d4ff]/10"
              : "bg-[#0d1428] border-[#1e2d4a] hover:border-slate-700"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/30">
              <Clock size={20} />
            </div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Brouillons</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.brouillons}</p>
          <p className="text-xs text-slate-400 mt-1">Devis non complétés / en cours</p>
        </div>

        <div 
          onClick={() => setStatusFilter('facture')}
          className={clsx(
            "rounded-2xl p-5 border transition-all cursor-pointer shadow-lg",
            statusFilter === 'facture'
              ? "bg-[#111c35] border-emerald-500 shadow-emerald-500/10"
              : "bg-[#0d1428] border-[#1e2d4a] hover:border-slate-700"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Facturés</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.factures}</p>
          <p className="text-xs text-slate-400 mt-1">Devis convertis en facture</p>
        </div>

        <div 
          onClick={() => setStatusFilter('tous')}
          className={clsx(
            "rounded-2xl p-5 border transition-all cursor-pointer shadow-lg",
            statusFilter === 'tous'
              ? "bg-[#111c35] border-[#1454FF] shadow-[#1454FF]/10"
              : "bg-[#0d1428] border-[#1e2d4a] hover:border-slate-700"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#1454FF]/20 text-[#00d4ff] rounded-xl flex items-center justify-center border border-[#00d4ff]/30">
              <FileText size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">Tous les devis répertoriés</p>
        </div>

      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] shadow-lg p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher par numéro de devis, client, plaque d'immatriculation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-[#111c35] border border-[#1e2d4a] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00d4ff]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('brouillon')}
            className={clsx(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border",
              statusFilter === 'brouillon'
                ? "bg-amber-500 text-black border-amber-500 font-extrabold"
                : "bg-[#111c35] text-slate-300 border-[#1e2d4a] hover:text-white"
            )}
          >
            Brouillons ({stats.brouillons})
          </button>
          
          <button
            onClick={() => setStatusFilter('facture')}
            className={clsx(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border",
              statusFilter === 'facture'
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-[#111c35] text-slate-300 border-[#1e2d4a] hover:text-white"
            )}
          >
            Facturés ({stats.factures})
          </button>

          <button
            onClick={() => setStatusFilter('tous')}
            className={clsx(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border",
              statusFilter === 'tous'
                ? "bg-[#1454FF] text-white border-[#1454FF]"
                : "bg-[#111c35] text-slate-300 border-[#1e2d4a] hover:text-white"
            )}
          >
            Tous ({stats.total})
          </button>
        </div>

      </div>

      {/* Liste des devis */}
      {filteredDevis.length === 0 ? (
        <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] p-12 text-center shadow-lg">
          <div className="w-16 h-16 bg-[#111c35] border border-[#1e2d4a] rounded-full flex items-center justify-center mx-auto mb-4 text-[#00d4ff]">
            <FileSignature size={28} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Aucun devis trouvé</h3>
          <p className="text-slate-400 text-sm">Modifiez vos filtres ou créez un nouveau devis depuis un dossier</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevis.map((item) => {
            const isFacture = item.statut === 'facture';
            const isBrouillon = item.statut === 'brouillon';
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
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#00d4ff] bg-[#16223d] border border-[#25375c] px-2.5 py-0.5 rounded-lg">
                        {item.numero}
                      </span>
                      {isBrouillon && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Brouillon non complété
                        </span>
                      )}
                      {isFacture && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Facturé
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-white mt-2 group-hover:text-[#00d4ff] transition-colors truncate">
                      {clientName}
                    </h2>
                    
                    <p className="text-xs text-slate-400 mt-0.5">
                      Dossier : <strong className="text-slate-300">{item.dossier_numero}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-white font-mono">
                      {item.total_ttc > 0 ? `${item.total_ttc.toFixed(2)} €` : '0,00 €'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {item.total_ht > 0 ? `${item.total_ht.toFixed(2)} € HT` : 'À chiffrer'}
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
                    <span>Créé le {new Date(item.date_emission).toLocaleDateString('fr-FR')}</span>
                  </div>

                  {/* Lignes */}
                  <div className="pt-2 border-t border-[#1e2d4a]/70 flex justify-between items-center text-xs text-slate-400">
                    <span>Articles renseignés :</span>
                    <strong className="text-slate-200">{item.nb_lignes} article{item.nb_lignes > 1 ? 's' : ''}</strong>
                  </div>

                </div>

                {/* Actions */}
                <div className="p-4 bg-[#111c35]/80 border-t border-[#1e2d4a] flex items-center gap-2">
                  
                  <Link
                    href={`/dashboard/dossiers/${item.dossier_id}/devis`}
                    className="flex-1 py-2 px-3 bg-[#1454FF] hover:bg-[#1060ff] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Edit3 size={13} />
                    {isBrouillon ? 'Compléter / Modifier' : 'Ouvrir'}
                  </Link>

                  <button
                    onClick={() => handleDownloadPDF(item)}
                    className="p-2 bg-[#16223d] hover:bg-[#25375c] text-[#00d4ff] hover:text-white rounded-xl border border-[#25375c] transition-all cursor-pointer"
                    title="Voir / Télécharger PDF"
                  >
                    <Eye size={15} />
                  </button>

                  <button
                    onClick={() => handleDeleteDevis(item)}
                    className="p-2 bg-[#16223d] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl border border-[#25375c] transition-all cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
