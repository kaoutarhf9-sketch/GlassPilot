"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  Loader2, 
  ChevronRight, 
  FolderKanban,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  CalendarDays,
  User,
  SlidersHorizontal,
  FolderInput,
  UserCheck,
  X,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

const STATUTS = [
  { value: 'tous', label: 'Tous les dossiers' },
  { value: 'non_assignes', label: 'Dossiers non assignés' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'action_requise', label: 'Action requise' },
  { value: 'signe', label: 'Signature validée' },
  { value: 'reglement_en_cours', label: 'Règlement en cours' },
  { value: 'reglement_recu', label: 'Règlement reçu' },
  { value: 'termine', label: 'Terminé' },
  { value: 'relance', label: 'Relance' },
  { value: 'envoi_courrier', label: 'Envoi courrier' },
  { value: 'recouvrement', label: 'Recouvrement' },
  { value: 'desistement', label: 'Désistement' },
];

const STATUT_CONFIG = {
  en_attente:     { label: 'En attente',       dot: 'bg-amber-500',   badge: 'bg-[#FEF6E0] text-[#7C5A0B] ring-1 ring-[#F6E1B6]/60' },
  en_cours:       { label: 'En cours',          dot: 'bg-[var(--blue)]',    badge: 'bg-[#E6F0FF] text-[var(--blue)] ring-1 ring-[#C2CFFF]/60' },
  action_requise: { label: 'Action requise',    dot: 'bg-rose-500',    badge: 'bg-[#FFF0F0] text-[#D92D20] ring-1 ring-[#FECDCA]/60' },
  signe:          { label: 'Signature validée', dot: 'bg-emerald-500', badge: 'bg-[#E6F4EA] text-[#137333] ring-1 ring-[#CEEAD6]/60' },
  termine:        { label: 'Terminé',           dot: 'bg-emerald-500', badge: 'bg-[#E6F4EA] text-[#137333] ring-1 ring-[#CEEAD6]/60' },
  relance:        { label: 'Relance',           dot: 'bg-orange-500',  badge: 'bg-[#FFF3E0] text-[#E65100] ring-1 ring-[#FFE0B2]/60' },
  reglement_en_cours: { label: 'Règlement en cours', dot: 'bg-emerald-500', badge: 'bg-[#E6F4EA] text-[#137333] ring-1 ring-[#CEEAD6]/60' },
  reglement_recu:     { label: 'Règlement reçu', dot: 'bg-emerald-500', badge: 'bg-[#E6F4EA] text-[#137333] ring-1 ring-[#CEEAD6]/60' },
  envoi_courrier: { label: 'Envoi courrier',   dot: 'bg-indigo-500',  badge: 'bg-[#F0F0FF] text-[#4F46E5] ring-1 ring-[#D8D8FE]/60' },
  recouvrement:   { label: 'Recouvrement',     dot: 'bg-rose-500',    badge: 'bg-[#FFF0F0] text-[#D92D20] ring-1 ring-[#FECDCA]/60' },
  desistement:    { label: 'Désistement',      dot: 'bg-slate-400',   badge: 'bg-[var(--white)] text-[var(--muted)] ring-1 ring-[#E6E4DD]/60' },
};

export default function AdminDossiersPage() {
  const [dossiers, setDossiers] = useState([]);
  const [gestionnaires, setGestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [fetchError, setFetchError] = useState(null);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    unassigned: 0,
    active: 0,
    completed: 0
  });

  // Action status state
  const [updatingId, setUpdatingId] = useState(null);
  
  // Toast alert state
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setFetchError(null);
    try {
      // 1. Get active session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error("Session introuvable. Veuillez vous reconnecter.");
      }

      // 2. Fetch all admin dossier data from secure server proxy (bypasses RLS for authorized admin)
      const response = await fetch('/api/admin/dossiers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Erreur de communication avec le serveur");
      }

      const { managers: managersData, clients: clientsData, garages: garagesData, dossiers: dossiersData } = resData;

      // Match and map as usual
      setGestionnaires(managersData || []);

      const managersMap = {};
      managersData?.forEach(m => { managersMap[m.id] = m; });

      const clientsMap = {};
      clientsData?.forEach(c => { clientsMap[c.id] = c; });

      const garagesMap = {};
      garagesData?.forEach(g => { garagesMap[g.id] = g; });

      const merged = (dossiersData || []).map(d => ({
        ...d,
        client: clientsMap[d.clients_id] || null,
        garage: garagesMap[d.garage_id] || null,
        gestionnaire: managersMap[d.gestionnaire_id] || null
      }));

      setDossiers(merged);

      // Calcul des stats
      const total = merged.length;
      const unassigned = merged.filter(d => !d.gestionnaire_id).length;
      const active = merged.filter(d => d.statut !== 'termine' && d.statut !== 'reglement_en_cours').length;
      const completed = merged.filter(d => d.statut === 'termine' || d.statut === 'reglement_en_cours').length;

      setStats({ total, unassigned, active, completed });

    } catch (err) {
      console.error('Erreur chargement admin dossiers:', err);
      let errMsg = 'Erreur inconnue';
      if (err instanceof Error) {
        errMsg = `${err.name}: ${err.message}`;
      } else if (typeof err === 'object' && err !== null) {
        errMsg = JSON.stringify(err, null, 2);
      } else {
        errMsg = String(err);
      }
      setFetchError(errMsg);
      showToastMsg('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAssignGestionnaire = async (dossierId, managerId) => {
    setUpdatingId(dossierId);
    try {
      const dbValue = managerId === "" ? null : managerId;
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error("Session introuvable. Veuillez vous reconnecter.");
      }

      const response = await fetch('/api/admin/dossiers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dossierId,
          gestionnaireId: dbValue
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Erreur de communication avec le serveur");
      }

      const selectedManager = gestionnaires.find(g => g.id === managerId) || null;

      // Update state locally
      setDossiers(prev => {
        const updated = prev.map(d => {
          if (d.id === dossierId) {
            return { ...d, gestionnaire_id: dbValue, gestionnaire: selectedManager };
          }
          return d;
        });

        // Update stats
        const unassigned = updated.filter(d => !d.gestionnaire_id).length;
        setStats(prevStats => ({ ...prevStats, unassigned }));

        return updated;
      });

      showToastMsg('Dossier attribué avec succès !');
    } catch (err) {
      console.error('Erreur assignation:', err);
      showToastMsg(err.message || 'Erreur lors de l\'attribution', 'error');
    } finally {
      setUpdatingId(null);
    }
  };


  const StatutBadge = ({ statut }) => {
    const cfg = STATUT_CONFIG[statut] ?? { label: statut, dot: 'bg-slate-400', badge: 'bg-[var(--white)] text-[var(--muted)] ring-1 ring-[#E6E4DD]/60' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${cfg.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  };

  const dossiersFiltres = dossiers.filter(d => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (d.numero || '').toLowerCase().includes(q) ||
      (d.immatriculation || '').toLowerCase().includes(q) ||
      (d.client?.nom || '').toLowerCase().includes(q) ||
      (d.client?.prenom || '').toLowerCase().includes(q) ||
      (d.garage?.nom_garage || '').toLowerCase().includes(q) ||
      (d.gestionnaire?.nom || '').toLowerCase().includes(q) ||
      (d.gestionnaire?.prenom || '').toLowerCase().includes(q);

    let matchStatus = true;
    if (statusFilter === 'non_assignes') {
      matchStatus = !d.gestionnaire_id;
    } else if (statusFilter !== 'tous') {
      matchStatus = d.statut === statusFilter;
    }

    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 size={40} className="animate-spin text-[var(--blue)] mx-auto" />
          <p className="text-xs text-[var(--muted)] font-semibold">Chargement des dossiers d'attribution...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="max-w-md w-full bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-3xl p-6 sm:p-8 shadow-md space-y-4">
          <div className="flex items-center gap-3 text-rose-600">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--ink)]">Erreur de chargement</h3>
              <p className="text-xs text-[var(--muted)] font-semibold">Une erreur est survenue lors du chargement des données.</p>
            </div>
          </div>
          
          <div className="bg-[var(--white)]/40 rounded-2xl p-3 border border-[var(--stone)]/60 text-xs font-mono text-[var(--ink)] overflow-x-auto max-h-40 whitespace-pre-wrap">
            {fetchError}
          </div>

          <button
            onClick={() => { setFetchError(null); fetchData(); }}
            className="w-full py-3 bg-[var(--blue)] hover:bg-[#003BDE] text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#1454FF]/10 cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full relative animate-in fade-in duration-500">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={clsx(
            "rounded-2xl shadow-2xl p-4 w-[340px] flex items-center gap-3 border transition-all",
            toast.type === 'success' 
              ? "bg-emerald-50/90 backdrop-blur-md border-emerald-200 text-emerald-900 shadow-emerald-900/5 shadow-xl" 
              : "bg-rose-50/90 backdrop-blur-md border-rose-200 text-rose-900 shadow-rose-900/5 shadow-xl"
          )}>
            <div className={clsx(
              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
              toast.type === 'success' ? "bg-emerald-100 border-emerald-200 text-emerald-600" : "bg-rose-100 border-rose-200 text-rose-600"
            )}>
              {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-[var(--muted)] hover:text-[var(--ink)] focus:outline-none p-1 rounded-md">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── En-tête ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md">
        <div>
          <h2 className="text-3xl font-serif-premium text-[var(--ink)]">Attribution des dossiers</h2>
          <p className="text-xs font-semibold text-[var(--muted)] mt-1.5">
            Supervisez les affectations et assignez les dossiers aux gestionnaires actifs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-[var(--white)]/40 hover:bg-[var(--white)] border border-[var(--stone)] text-[var(--ink)] px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
          >
            <Loader2 size={14} className={clsx('text-[var(--blue)]', refreshing && 'animate-spin')} />
            {refreshing ? 'Mise à jour...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* ── Statistiques ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total dossiers */}
        <button
          onClick={() => { setStatusFilter('tous'); setSearchTerm(''); }}
          className={clsx(
            "text-left p-6 sm:p-8 rounded-3xl bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border transition-all relative overflow-hidden group cursor-pointer",
            statusFilter === 'tous' 
              ? "border-[#1454FF] ring-2 ring-[#1454FF]/20 shadow-md shadow-[#1454FF]/5 scale-[1.01]" 
              : "border-[var(--stone)] hover:border-[#89867A]/60 shadow-md"
          )}
        >
          <div className="absolute top-0 right-0 p-4 text-[var(--muted)]/10 group-hover:scale-110 transition-transform duration-500">
            <FileText size={48} />
          </div>
          <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Total dossiers</p>
          <p className="text-4xl font-serif-premium text-[var(--ink)] mt-3">{stats.total}</p>
        </button>

        {/* Non assignes dossiers */}
        <button
          onClick={() => { setStatusFilter('non_assignes'); setSearchTerm(''); }}
          className={clsx(
            "text-left p-6 sm:p-8 rounded-3xl bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border transition-all relative overflow-hidden group cursor-pointer",
            statusFilter === 'non_assignes' 
              ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/5 scale-[1.01]" 
              : "border-[var(--stone)] hover:border-amber-500/40 shadow-md"
          )}
        >
          <div className="absolute top-0 right-0 p-4 text-amber-500/10 group-hover:scale-110 transition-transform duration-500">
            <AlertTriangle size={48} />
          </div>
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
            Non assignés <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          </p>
          <p className="text-4xl font-serif-premium text-amber-600 mt-3">{stats.unassigned}</p>
        </button>

        {/* Active dossiers */}
        <div className="text-left p-6 sm:p-8 rounded-3xl bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-[var(--muted)]/10 group-hover:scale-110 transition-transform duration-500">
            <Clock size={48} />
          </div>
          <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Dossiers Actifs</p>
          <p className="text-4xl font-serif-premium text-[var(--ink)] mt-3">{stats.active}</p>
        </div>

        {/* Completed dossiers */}
        <div className="text-left p-6 sm:p-8 rounded-3xl bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-emerald-500/10 group-hover:scale-110 transition-transform duration-500">
            <CheckCircle size={48} />
          </div>
          <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Dossiers Terminés</p>
          <p className="text-4xl font-serif-premium text-emerald-600 mt-3">{stats.completed}</p>
        </div>
      </div>

      {/* ── Contenu Principal (Filtres & Table) ─────────────────── */}
      <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-3xl border border-[var(--stone)] shadow-md overflow-hidden flex flex-col">
        
        {/* Barre d'outils */}
        <div className="p-5 border-b border-[var(--stone)]/60 bg-[var(--white)]/40 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={16} className="text-[var(--muted)]" />
            </div>
            <input
              type="text"
              placeholder="Rechercher dossier, plaque, client, garage..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-2xl text-xs font-semibold placeholder-[#89867A] focus:outline-none focus:ring-2 focus:ring-[#1454FF]/10 focus:border-[#1454FF] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] p-1 rounded-full hover:bg-[var(--white)]/40 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <SlidersHorizontal className="text-[var(--muted)]" size={16} />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-2xl text-xs font-bold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[#1454FF]/10 focus:border-[#1454FF] appearance-none cursor-pointer transition-all"
              >
                {STATUTS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
                <ChevronRight className="text-[var(--muted)] rotate-90" size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Résumé */}
        {(searchTerm || statusFilter !== 'tous') && (
          <div className="px-5 py-3 bg-[#E6F0FF]/30 border-b border-[#C2CFFF]/60 flex items-center gap-2 text-xs font-semibold text-[var(--blue)]">
            <span>{dossiersFiltres.length}</span> résultat{dossiersFiltres.length !== 1 ? 's' : ''}
            {searchTerm && <> pour "<span className="italic font-medium">{searchTerm}</span>"</>}
            {statusFilter !== 'tous' && <> · filtre : <span className="font-bold">{STATUTS.find(s => s.value === statusFilter)?.label}</span></>}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {dossiersFiltres.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-3xl bg-[var(--white)]/40 border border-[var(--stone)]/60 flex items-center justify-center mb-4">
                <Search size={28} className="text-[var(--muted)]/60" />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)] mb-1">Aucun dossier trouvé</h3>
              <p className="text-xs text-[var(--muted)] font-semibold max-w-sm">
                Aucun dossier ne correspond aux filtres de recherche. Essayez d'autres mots-clés ou modifiez les filtres.
              </p>
              {(searchTerm || statusFilter !== 'tous') && (
                <button 
                  onClick={() => { setSearchTerm(''); setStatusFilter('tous'); }} 
                  className="mt-4 text-xs font-bold text-[var(--blue)] hover:text-[#003BDE] transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[var(--stone)]/60 bg-[var(--white)]">
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">Dossier</th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">Véhicule</th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">Garage</th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">Créé le</th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">Statut</th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest w-[240px]">Gestionnaire assigné</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DD]/40">
                {dossiersFiltres.map((dossier) => {
                  const initials = dossier.client 
                    ? `${dossier.client.prenom?.[0] || ''}${dossier.client.nom?.[0] || ''}`.toUpperCase() 
                    : '?';
                  const isUnassigned = !dossier.gestionnaire_id;
                  
                  return (
                    <tr
                      key={dossier.id}
                      className={clsx(
                        "group transition-colors border-b border-[var(--stone)]/40",
                        isUnassigned ? "bg-amber-50/10 hover:bg-amber-50/25" : "hover:bg-[var(--white)]/40/80"
                      )}
                    >
                      {/* N° dossier */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-[var(--ink)] text-xs bg-[var(--white)]/40 border border-[var(--stone)] px-2.5 py-1 rounded-lg w-fit">
                            {dossier.numero}
                          </span>
                          {dossier.type_vitrage && (
                            <span className="text-xs text-[var(--muted)] mt-1.5 font-bold">{dossier.type_vitrage}</span>
                          )}
                          <span className="text-[10px] text-[var(--muted)] font-semibold mt-0.5 capitalize">{dossier.type}</span>
                        </div>
                      </td>
                      
                      {/* Client */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {dossier.client ? (
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-[var(--blue)]/10 text-[var(--blue)] border border-[#C2CFFF] flex items-center justify-center text-xs font-bold shrink-0">
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-[var(--ink)]">{dossier.client.prenom} {dossier.client.nom}</span>
                              <span className="text-[10px] text-[var(--muted)] font-semibold mt-0.5">{dossier.client.telephone || 'Aucun numéro'}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[var(--muted)] text-xs font-semibold italic">—</span>
                        )}
                      </td>

                      {/* Véhicule */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-[var(--ink)] text-xs">{dossier.immatriculation || '—'}</span>
                          {dossier.modele_vehicule && (
                            <span className="text-[10px] text-[var(--muted)] font-semibold mt-0.5">{dossier.modele_vehicule}</span>
                          )}
                        </div>
                      </td>

                      {/* Garage */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {dossier.garage ? (
                          <div className="flex items-center gap-2 text-[var(--ink)]">
                            <Building2 size={13} className="text-[var(--muted)] shrink-0" />
                            <span className="text-xs font-bold truncate max-w-[150px]">{dossier.garage.nom_garage}</span>
                          </div>
                        ) : (
                          <span className="text-[var(--muted)] text-xs font-semibold italic">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-[var(--ink)] text-xs font-semibold">
                          <CalendarDays size={13} className="text-[var(--muted)] shrink-0" />
                          <span className="tabular-nums">
                            {new Date(dossier.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatutBadge statut={dossier.statut} />
                      </td>

                      {/* Assignation */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative w-full max-w-[210px]">
                          {updatingId === dossier.id ? (
                            <div className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[var(--muted)] bg-[var(--white)]/40 border border-[var(--stone)] rounded-2xl">
                              <Loader2 size={12} className="animate-spin text-[var(--blue)]" />
                              Mise à jour...
                            </div>
                          ) : (
                            <select
                              value={dossier.gestionnaire_id || ""}
                              onChange={e => handleAssignGestionnaire(dossier.id, e.target.value)}
                              className={clsx(
                                "w-full pl-3.5 pr-8 py-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1454FF]/10 focus:border-[#1454FF] appearance-none cursor-pointer transition-all",
                                isUnassigned 
                                  ? "border-amber-300 text-amber-700 bg-amber-50/20" 
                                  : "border-[var(--stone)] text-[var(--ink)]"
                              )}
                            >
                              <option value="">⚠️ Non assigné</option>
                              {gestionnaires.map(manager => (
                                <option key={manager.id} value={manager.id}>
                                  👤 {manager.prenom} {manager.nom}
                                </option>
                              ))}
                            </select>
                          )}
                          {updatingId !== dossier.id && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <ChevronRight className="text-[var(--muted)] rotate-90" size={14} />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {dossiersFiltres.length > 0 && (
          <div className="px-6 py-4 border-t border-[var(--stone)]/60 bg-[var(--white)]/40 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs font-bold text-[var(--muted)]">
            <span>
              Affichage de <span className="text-[var(--ink)]">{dossiersFiltres.length}</span> dossier{dossiersFiltres.length !== 1 ? 's' : ''} sur {dossiers.length}
            </span>
            {stats.unassigned > 0 && (
              <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full ring-1 ring-inset ring-amber-200">
                <AlertTriangle size={14} />
                {stats.unassigned} dossier{stats.unassigned > 1 ? 's' : ''} non assigné{stats.unassigned > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
