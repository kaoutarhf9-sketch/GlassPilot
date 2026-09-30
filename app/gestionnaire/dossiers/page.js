"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Search, FileText, Loader2, ChevronRight,
  RefreshCw, SlidersHorizontal, TrendingUp,
  AlertTriangle, CheckCircle, Clock, Hourglass,
  Car, Building2, User, CalendarDays, Hash
} from 'lucide-react';

const STATUTS = [
  { value: 'tous', label: 'Tous les dossiers' },
  { value: 'en_attente', label: 'En attente de vérification' },
  { value: 'signe', label: 'Dossier en attente' },
  { value: 'en_cours', label: 'Démarrer travaux' },
  { value: 'envoi_courrier', label: 'Envoi courrier' },
  { value: 'relance', label: 'Relance' },
  { value: 'reglement_en_cours', label: 'Règlement en cours' },
  { value: 'reglement_recu', label: 'Règlement reçu' },
  { value: 'action_requise', label: 'Action requise' },
  { value: 'termine', label: 'Terminé' },
  { value: 'recouvrement', label: 'Recouvrement' },
  { value: 'desistement', label: 'Désistement' },
];

const STATUT_CONFIG = {
  en_attente:     { label: 'En attente de vérification', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 ring-amber-200',  icon: Hourglass },
  en_cours:       { label: 'Démarrer travaux',          dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700 ring-blue-200',     icon: Clock },
  action_requise: { label: 'Action requise',            dot: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 ring-rose-200',     icon: AlertTriangle },
  signe:          { label: 'Dossier en attente',        dot: 'bg-teal-400',    badge: 'bg-teal-50 text-teal-700 ring-teal-200',     icon: CheckCircle },
  termine:        { label: 'Terminé',                   dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: CheckCircle },
  relance:        { label: 'Relance',                   dot: 'bg-orange-400',  badge: 'bg-orange-50 text-orange-700 ring-orange-200', icon: Clock },
  reglement_en_cours: { label: 'Règlement en cours',    dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: TrendingUp },
  reglement_recu:     { label: 'Règlement reçu',        dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: CheckCircle },
  envoi_courrier: { label: 'Envoi courrier',            dot: 'bg-indigo-400',  badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200', icon: RefreshCw },
  recouvrement:   { label: 'Recouvrement',              dot: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 ring-rose-200',     icon: AlertTriangle },
  desistement:    { label: 'Désistement',               dot: 'bg-slate-400',   badge: 'bg-transparent text-slate-700 ring-slate-200',   icon: AlertTriangle },
};

const STAT_CARDS = [
  { key: 'total',          label: 'Total',                      color: 'text-slate-800',   bg: 'bg-transparent',   border: 'border-slate-200', icon: FileText },
  { key: 'en_attente',     label: 'En attente de vérification', color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200', icon: Hourglass },
  { key: 'en_cours',       label: 'Démarrer travaux',           color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',  icon: Clock },
  { key: 'action_requise', label: 'Action requise',             color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200',  icon: AlertTriangle },
  { key: 'signe',          label: 'Dossier en attente',         color: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-200',  icon: CheckCircle },
  { key: 'termine',        label: 'Terminés',                   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: TrendingUp },
];

function DossiersList() {
  const searchParams = useSearchParams();
  const statusParam = searchParams ? searchParams.get('status') : null;

  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [stats, setStats] = useState({
    total: 0, en_attente: 0, en_cours: 0,
    action_requise: 0, signe: 0, termine: 0
  });

  useEffect(() => {
    if (statusParam) {
      setStatusFilter(statusParam);
    } else {
      setStatusFilter('tous');
    }
  }, [statusParam]);

  useEffect(() => { fetchData(); }, []);

  const isDossierArchive = (d) => {
    if (d.statut === 'reglement_en_cours') return true;
    if (d.statut === 'termine') return true;
    return false;
  };

  const fetchData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: gestionnaireData, error: gError } = await supabase
        .from('gestionnaires')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (gError || !gestionnaireData) {
        throw new Error("Impossible de récupérer les informations du gestionnaire");
      }

      const gestionnaireId = gestionnaireData.id;

      const { data: clientsData } = await supabase.from('clients').select('id, nom, prenom, telephone');
      const clientsMap = {};
      clientsData?.forEach(c => { clientsMap[c.id] = c; });

      const { data: garagesData } = await supabase.from('garages').select('id, nom_garage, responsable');
      const garagesMap = {};
      garagesData?.forEach(g => { garagesMap[g.id] = g; });

      const { data: dossiersData, error } = await supabase
        .from('dossiers')
        .select('*')
        .eq('gestionnaire_id', gestionnaireId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;

      const merged = (dossiersData || []).map(d => ({
        ...d,
        client: clientsMap[d.clients_id] || null,
        garage: garagesMap[d.garage_id] || null,
      }));

      // Filter out archived dossiers for active calculations
      const activeDossiers = merged.filter(d => !isDossierArchive(d));

      setDossiers(merged);
      setStats({
        total: activeDossiers.length,
        en_attente:     merged.filter(d => d.statut === 'en_attente').length,
        en_cours:       merged.filter(d => d.statut === 'en_cours').length,
        action_requise: merged.filter(d => d.statut === 'action_requise').length,
        signe:          merged.filter(d => d.statut === 'signe').length,
        termine:        merged.filter(d => d.statut === 'termine').length,
      });
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const StatutBadge = ({ statut }) => {
    const cfg = STATUT_CONFIG[statut] ?? STATUT_CONFIG.en_attente;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${cfg.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  };

  const getCardStyle = (key) => {
    switch(key) {
      case 'total': return { ring: 'ring-slate-200', text: 'text-[var(--ink)]', iconBg: 'bg-slate-100', iconText: 'text-slate-600', activeRing: 'ring-slate-400' };
      case 'en_attente': return { ring: 'ring-amber-200', text: 'text-amber-900', iconBg: 'bg-amber-100', iconText: 'text-amber-600', activeRing: 'ring-amber-400' };
      case 'en_cours': return { ring: 'ring-blue-200', text: 'text-blue-900', iconBg: 'bg-blue-100', iconText: 'text-blue-600', activeRing: 'ring-blue-400' };
      case 'action_requise': return { ring: 'ring-rose-200', text: 'text-rose-900', iconBg: 'bg-rose-100', iconText: 'text-rose-600', activeRing: 'ring-rose-400' };
      case 'signe': return { ring: 'ring-teal-200', text: 'text-teal-900', iconBg: 'bg-teal-100', iconText: 'text-teal-600', activeRing: 'ring-teal-400' };
      case 'termine': return { ring: 'ring-emerald-200', text: 'text-emerald-900', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', activeRing: 'ring-emerald-400' };
      default: return { ring: 'ring-slate-200', text: 'text-[var(--ink)]', iconBg: 'bg-slate-100', iconText: 'text-slate-600', activeRing: 'ring-slate-400' };
    }
  };

  const dossiersFiltres = dossiers.filter(d => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (d.numero || '').toLowerCase().includes(q) ||
      (d.immatriculation || '').toLowerCase().includes(q) ||
      (d.client?.nom || '').toLowerCase().includes(q) ||
      (d.client?.prenom || '').toLowerCase().includes(q) ||
      (d.garage?.nom_garage || '').toLowerCase().includes(q);
    
    // If filtering by 'tous', hide archived/completed ones (reglement_en_cours and termine)
    // If filtering by a specific status, show all of that status (even if archived/termine)
    const matchStatus = statusFilter === 'tous' 
      ? !isDossierArchive(d) 
      : d.statut === statusFilter;
      
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 size={40} className="animate-spin text-[var(--blue)] mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Chargement des dossiers…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 py-6 max-w-7xl mx-auto">

      {/* ── En-tête ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--white)] p-6 rounded-2xl border border-slate-200 shadow-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText size={18} className="text-[var(--blue)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight">Dossiers</h1>
          </div>
          <p className="text-sm text-slate-500 ml-11">
            Gérez et suivez l'avancement de vos {stats.total} dossiers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-[var(--white)] border border-slate-200 rounded-lg hover:bg-transparent hover:text-[var(--ink)] transition-all disabled:opacity-50 shadow-md"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-[var(--blue)]' : ''} />
            {refreshing ? 'Mise à jour' : 'Actualiser'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--ink)] bg-[var(--blue)] rounded-lg hover:bg-[var(--blue)] transition-all shadow-md shadow-blue-200">
            <span className="text-lg leading-none mb-0.5">+</span> Nouveau Dossier
          </button>
        </div>
      </div>

      {/* ── Statistiques ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon }) => {
          const style = getCardStyle(key);
          const isActive = statusFilter === (key === 'total' ? 'tous' : key);
          
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key === 'total' ? 'tous' : key)}
              className={`group relative text-left p-5 rounded-2xl bg-[var(--white)] border transition-all duration-200
 ${isActive 
 ?`border-transparent ring-2 ${style.activeRing} shadow-md scale-[1.02] z-10`: 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg} ${isActive ? 'ring-2 ring-white shadow-md' : ''}`}>
                  <Icon size={18} className={style.iconText} />
                </div>
                <span className={`text-2xl font-bold ${style.text}`}>{stats[key]}</span>
              </div>
              <p className="text-sm text-slate-600 font-medium">{label}</p>
            </button>
          );
        })}
      </div>

      {/* ── Contenu Principal (Filtres & Table) ─────────────────── */}
      <div className="bg-[var(--white)] rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col">
        
        {/* Barre d'outils */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-transparent/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="Rechercher par numéro, plaque, client..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-[var(--white)] border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] transition-all shadow-md"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              ><span className="sr-only">Effacer</span>×</button>
            )}
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <SlidersHorizontal className="text-[var(--muted)]" size={16} />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-[var(--white)] border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md appearance-none cursor-pointer transition-all"
              >
                {STATUTS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
                <ChevronRight className="text-[var(--muted)] rotate-90" size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Résumé */}
        {(searchTerm || statusFilter !== 'tous') && (
          <div className="px-5 py-3 bg-blue-50/50 border-b border-blue-100 flex items-center gap-2 text-sm text-blue-800">
            <span className="font-semibold">{dossiersFiltres.length}</span> résultat{dossiersFiltres.length !== 1 ? 's' : ''}
            {searchTerm && <> pour "<span className="font-medium italic">{searchTerm}</span>"</>}
            {statusFilter !== 'tous' && <> · statut : <span className="font-medium">{STATUTS.find(s => s.value === statusFilter)?.label}</span></>}
          </div>
        )}

        {/* Grille des dossiers */}
        <div className="p-4 sm:p-5">
          {dossiersFiltres.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center bg-[var(--white)]/20 rounded-2xl border border-[var(--stone)]">
              <div className="w-16 h-16 rounded-2xl bg-[var(--white)]/40 border border-[var(--stone)] flex items-center justify-center mb-4">
                <Search size={28} className="text-[var(--blue)] opacity-50" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--ink)] mb-1">Aucun dossier trouvé</h3>
              <p className="text-sm text-[var(--muted)] max-w-sm">
                {searchTerm ? 'Nous n\'avons trouvé aucun dossier correspondant à votre recherche. Essayez un autre terme.' : 'Il n\'y a aucun dossier avec ce statut pour le moment.'}
              </p>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="mt-4 text-sm font-medium text-[var(--blue)] hover:underline">
                  Effacer la recherche
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dossiersFiltres.map((dossier) => {
                const initials = dossier.client 
                  ? `${dossier.client.prenom?.[0] || ''}${dossier.client.nom?.[0] || ''}`.toUpperCase() 
                  : '?';
                
                return (
                  <div key={dossier.id} className="bg-[var(--white)] rounded-2xl border border-[var(--stone)] shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col">
                    {/* En-tête : Client & Statut */}
                    <div className="p-5 border-b border-[var(--stone)] bg-[var(--white)]/20 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--blue)]/10 border border-[var(--stone)] flex items-center justify-center text-xs font-bold text-[var(--blue)] shrink-0">
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-[var(--ink)] truncate max-w-[120px]" title={dossier.client ? `${dossier.client.prenom} ${dossier.client.nom}` : 'Sans client'}>
                            {dossier.client ? `${dossier.client.prenom} ${dossier.client.nom}` : 'Sans client'}
                          </span>
                          <span className="text-xs text-[var(--muted)] mt-0.5">{dossier.client?.telephone || 'Aucun numéro'}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <StatutBadge statut={dossier.statut} />
                      </div>
                    </div>

                    {/* Corps : Infos Dossier */}
                    <div className="p-5 flex-1 space-y-4">
                      {/* N° et Vitrage */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-[var(--blue)]" />
                          <span className="font-mono font-bold text-[var(--ink)] text-sm tracking-wide">{dossier.numero}</span>
                        </div>
                        {dossier.type_vitrage && (
                          <div className="ml-5 text-xs text-[var(--muted)] font-medium bg-[var(--white)]/40 w-fit px-2 py-0.5 rounded border border-[var(--stone)]">
                            {dossier.type_vitrage}
                          </div>
                        )}
                      </div>

                      {/* Véhicule */}
                      <div className="flex items-center gap-3 text-sm">
                        <Car size={16} className="text-[var(--muted)] shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-mono font-semibold text-[var(--ink)] text-xs">{dossier.immatriculation || 'IMMATRICULATION INCONNUE'}</span>
                          {dossier.modele_vehicule && (
                            <span className="text-xs text-[var(--muted)] mt-0.5">{dossier.modele_vehicule}</span>
                          )}
                        </div>
                      </div>

                      {/* Garage */}
                      <div className="flex items-center gap-3 text-sm">
                        <Building2 size={16} className="text-[var(--muted)] shrink-0" />
                        <span className="text-[var(--ink)] truncate">{dossier.garage ? dossier.garage.nom_garage : <span className="italic text-[var(--muted)]">Garage inconnu</span>}</span>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-3 text-sm">
                        <CalendarDays size={16} className="text-[var(--muted)] shrink-0" />
                        <span className="text-[var(--ink)]">
                          {new Date(dossier.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 bg-[var(--white)]/40 border-t border-[var(--stone)] mt-auto">
                      <Link
                        href={`/gestionnaire/dossiers/${dossier.id}`}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-[var(--blue)] hover:bg-[var(--white)] rounded-xl transition-all border border-transparent hover:border-[var(--stone)]"
                      >
                        Voir le dossier
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {dossiersFiltres.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-100 bg-transparent/50 flex items-center justify-between text-sm text-slate-500">
            <span>Affichage de <span className="font-medium text-slate-700">{dossiersFiltres.length}</span> dossier{dossiersFiltres.length !== 1 ? 's' : ''}</span>
            {stats.action_requise > 0 && (
              <span className="flex items-center gap-1.5 text-rose-600 font-medium bg-rose-50 px-3 py-1.5 rounded-full ring-1 ring-inset ring-rose-200">
                <AlertTriangle size={14} />
                {stats.action_requise} action{stats.action_requise > 1 ? 's' : ''} requise{stats.action_requise > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GestionnaireDossiers() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 size={40} className="animate-spin text-[var(--blue)] mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Chargement des dossiers…</p>
        </div>
      </div>
    }>
      <DossiersList />
    </Suspense>
  );
}