"use client";
import { formatDate, formatDateTime } from '@/lib/dateUtils';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Users, Building2, FileText, ArrowRight, Bell, X, CheckCheck,
  UserPlus, FileWarning, RefreshCw, TrendingUp
} from 'lucide-react';
import Link from 'next/link';

// ---------- Configuration des statuts (libellé + couleur) ----------
const STATUS_META = {
  nouveau:            { label: 'Nouveau',                    color: '#94a3b8' },
  en_attente:         { label: 'En attente',                 color: '#f59e0b' },
  action_requise:     { label: 'Action requise',             color: '#f43f5e' },
  signe:              { label: 'Dossier en attente',         color: '#14b8a6' },
  en_cours:           { label: 'Travaux en cours',           color: '#38bdf8' },
  envoi_courrier:     { label: 'Envoi courrier',             color: '#818cf8' },
  relance:            { label: 'Relance',                    color: '#fb923c' },
  reglement_en_cours: { label: 'Règlement en cours',         color: '#a855f7' },
  reglement_recu:     { label: 'Règlement reçu',             color: '#22c55e' },
  termine:            { label: 'Terminé',                    color: '#10b981' },
  recouvrement:       { label: 'Recouvrement',               color: '#e11d48' },
  desistement:        { label: 'Désistement',                color: '#64748b' },
  autre:              { label: 'Autre',                      color: '#475569' },
};

const LAST_SEEN_KEY = 'admin_last_seen_garages';
const MONTHS_WINDOW = 6;

// ---------- Utilitaires ----------
function buildLastMonths(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'short', timeZone: 'Europe/Paris' }).replace('.', '');
    out.push({ key, label, start: d });
  }
  return out;
}

function monthKey(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function readLastSeen() {
  try {
    const v = localStorage.getItem(LAST_SEEN_KEY);
    if (v) return v;
    // Première visite : on part de maintenant pour ne pas tout afficher comme « nouveau »
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SEEN_KEY, now);
    return now;
  } catch (e) {
    return new Date().toISOString();
  }
}

// ---------- Composant principal ----------
export default function AdminDashboard() {
  const [garages, setGarages] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [gestionnairesCount, setGestionnairesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Session introuvable. Veuillez vous reconnecter.");

      const response = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Erreur de communication avec le serveur");

      setGarages(resData.garages || []);
      setDossiers(resData.dossiers || []);
      setGestionnairesCount(resData.gestionnairesCount || 0);
      setError('');
    } catch (err) {
      console.error('Erreur lors du chargement du dashboard admin:', err);
      setError(err.message || 'Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLastSeen(readLastSeen());
    fetchData();
    // Rafraîchissement automatique toutes les 30 secondes
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ---------- Notifications ----------
  const newGarages = useMemo(() => {
    if (!lastSeen) return [];
    const ref = new Date(lastSeen).getTime();
    return garages.filter(g => g.created_at && new Date(g.created_at).getTime() > ref);
  }, [garages, lastSeen]);

  const dossiersToAssign = useMemo(
    () => dossiers.filter(d => !d.gestionnaire_id && d.statut !== 'desistement'),
    [dossiers]
  );

  const notifCount = newGarages.length + dossiersToAssign.length;

  const markAllRead = () => {
    const now = new Date().toISOString();
    try { localStorage.setItem(LAST_SEEN_KEY, now); } catch (e) {}
    setLastSeen(now);
  };

  // ---------- Statistiques graphiques ----------
  const months = useMemo(() => buildLastMonths(MONTHS_WINDOW), []);

  const garagesByMonth = useMemo(() => {
    const counts = {};
    months.forEach(m => { counts[m.key] = 0; });
    garages.forEach(g => {
      const k = monthKey(g.created_at);
      if (k && k in counts) counts[k] += 1;
    });
    return months.map(m => ({ ...m, value: counts[m.key] }));
  }, [garages, months]);

  const garagesMaxMonth = Math.max(1, ...garagesByMonth.map(m => m.value));
  const garagesLast6 = garagesByMonth.reduce((acc, m) => acc + m.value, 0);

  const dossiersByMonth = useMemo(() => {
    const counts = {};
    months.forEach(m => { counts[m.key] = 0; });
    dossiers.forEach(d => {
      const k = monthKey(d.created_at);
      if (k && k in counts) counts[k] += 1;
    });
    return months.map(m => ({ ...m, value: counts[m.key] }));
  }, [dossiers, months]);

  const dossiersMaxMonth = Math.max(1, ...dossiersByMonth.map(m => m.value));

  const statusSegments = useMemo(() => {
    const counts = {};
    dossiers.forEach(d => {
      const key = STATUS_META[d.statut] ? d.statut : 'autre';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([key, value]) => ({ key, value, ...STATUS_META[key] }))
      .sort((a, b) => b.value - a.value);
  }, [dossiers]);

  const totalDossiers = dossiers.length;
  const termines = dossiers.filter(d => d.statut === 'termine').length;
  const desistements = dossiers.filter(d => d.statut === 'desistement').length;
  const baseAvancement = Math.max(0, totalDossiers - desistements);
  const avancementPct = baseAvancement > 0 ? Math.round((termines / baseAvancement) * 100) : 0;

  // Anneau SVG
  const R = 70;
  const C = 2 * Math.PI * R;
  let offsetAcc = 0;
  const donutArcs = statusSegments.map(seg => {
    const len = totalDossiers > 0 ? (seg.value / totalDossiers) * C : 0;
    const arc = { ...seg, len, offset: offsetAcc };
    offsetAcc += len;
    return arc;
  });

  const pulse = <span className="inline-block w-6 h-6 bg-white/10 rounded animate-pulse" />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* En-tête + cloche de notifications */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--white)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md">
        <div>
          <h2 className="text-3xl sm:text-4xl font-serif-premium text-[var(--ink)]">
            Bonjour, <span className="italic text-[var(--blue)]">Administrateur</span>
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-[var(--muted)] mt-1.5">
            Voici un aperçu de l'activité globale et de la performance de la plateforme.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchData(true)}
            title="Actualiser"
            className="w-11 h-11 rounded-2xl border border-[var(--stone)] bg-[var(--white)] text-[var(--muted)] hover:text-[var(--blue)] hover:border-[#38bdf8] flex items-center justify-center transition-all cursor-pointer"
          >
            <RefreshCw size={16} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(o => !o)}
              title="Notifications"
              className="relative w-11 h-11 rounded-2xl border border-[var(--stone)] bg-[var(--white)] text-[var(--muted)] hover:text-[var(--blue)] hover:border-[#38bdf8] flex items-center justify-center transition-all cursor-pointer"
            >
              <Bell size={18} />
              {notifCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#04090f] animate-pulse">
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-3 z-50 w-[360px] max-w-[92vw] bg-[#0d1428] border border-[#1e2d4a] rounded-2xl shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2d4a]">
                    <h3 className="text-sm font-extrabold text-white tracking-wide">Notifications</h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-[#38bdf8] hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        title="Marquer les nouveaux garages comme lus"
                      >
                        <CheckCheck size={13} /> Tout lire
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        className="p-1 text-[#94a3b8] hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">
                    {notifCount === 0 && (
                      <div className="px-4 py-10 text-center">
                        <Bell size={26} className="mx-auto text-[#475569] mb-2" />
                        <p className="text-xs font-semibold text-[#94a3b8]">Rien de nouveau pour le moment.</p>
                      </div>
                    )}

                    {/* Nouveaux garages */}
                    {newGarages.length > 0 && (
                      <div className="py-2">
                        <p className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">
                          Nouveaux garages ({newGarages.length})
                        </p>
                        {newGarages.slice(0, 10).map(g => (
                          <Link
                            key={g.id}
                            href="/admin/garages"
                            onClick={() => setNotifOpen(false)}
                            className="flex items-start gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-xl bg-[#16223d] border border-[#25375c] flex items-center justify-center shrink-0">
                              <UserPlus size={14} className="text-[#38bdf8]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                {g.nom_garage || 'Garage sans nom'}
                              </p>
                              <p className="text-[11px] text-[#94a3b8]">
                                Nouvelle inscription · {formatDateTime(g.created_at)}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Dossiers à assigner */}
                    {dossiersToAssign.length > 0 && (
                      <div className="py-2 border-t border-[#1e2d4a]">
                        <p className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">
                          Dossiers à assigner ({dossiersToAssign.length})
                        </p>
                        {dossiersToAssign.slice(0, 10).map(d => (
                          <Link
                            key={d.id}
                            href="/admin/dossiers"
                            onClick={() => setNotifOpen(false)}
                            className="flex items-start gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-xl bg-[#2a1a1f] border border-[#4a2530] flex items-center justify-center shrink-0">
                              <FileWarning size={14} className="text-rose-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                Dossier {d.numero || d.id.slice(0, 8)}
                              </p>
                              <p className="text-[11px] text-[#94a3b8]">
                                En attente d'un gestionnaire · {formatDateTime(d.created_at)}
                              </p>
                            </div>
                          </Link>
                        ))}
                        {dossiersToAssign.length > 10 && (
                          <Link
                            href="/admin/dossiers"
                            onClick={() => setNotifOpen(false)}
                            className="block px-4 py-2 text-[11px] font-bold text-[#38bdf8] hover:underline"
                          >
                            Voir les {dossiersToAssign.length - 10} autres…
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 pl-3.5 pr-4 py-2 bg-[var(--blue)]/10 border border-[#C2CFFF] rounded-2xl text-[11px] font-extrabold text-[var(--blue)] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Système Opérationnel
          </div>
        </div>
      </div>

      {error && (
        <div className="px-5 py-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Alerte dossiers à assigner */}
      {!loading && dossiersToAssign.length > 0 && (
        <Link
          href="/admin/dossiers"
          className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/15 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileWarning size={20} className="text-rose-400" />
            <p className="text-sm font-bold text-white">
              {dossiersToAssign.length} dossier{dossiersToAssign.length > 1 ? 's' : ''} en attente d'assignation
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
            Assigner maintenant <ArrowRight size={14} />
          </span>
        </Link>
      )}

      {/* Cartes de chiffres */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">

        <div className="bg-[var(--white)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1454FF]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:text-[var(--blue)] transition-all duration-500 pointer-events-none">
            <Users size={96} />
          </div>
          <div className="flex items-center gap-5 mb-6 relative z-10">
            <div className="w-14 h-14 bg-[var(--blue)]/10 text-[var(--blue)] rounded-2xl flex items-center justify-center shadow-inner border border-[#C2CFFF] group-hover:scale-105 transition-transform duration-300">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Gestionnaires</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[var(--ink)] tracking-tight mt-1 tabular-nums">
                {loading ? pulse : gestionnairesCount}
              </h3>
            </div>
          </div>
          <Link
            href="/admin/gestionnaires"
            className="text-[11px] font-bold text-[var(--blue)] hover:text-[#003BDE] flex items-center gap-1.5 transition-all mt-4 border-t border-[var(--stone)]/60 pt-4 w-full"
          >
            Gérer les gestionnaires <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="bg-[var(--white)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1454FF]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:text-[var(--blue)] transition-all duration-500 pointer-events-none">
            <Building2 size={96} />
          </div>
          <div className="flex items-center gap-5 mb-6 relative z-10">
            <div className="w-14 h-14 bg-[var(--blue)]/10 text-[var(--blue)] rounded-2xl flex items-center justify-center shadow-inner border border-[#C2CFFF] group-hover:scale-105 transition-transform duration-300">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Garages Partenaires</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[var(--ink)] tracking-tight mt-1 tabular-nums">
                {loading ? pulse : garages.length}
              </h3>
            </div>
          </div>
          <Link
            href="/admin/garages"
            className="text-[11px] font-bold text-[var(--blue)] hover:text-[#003BDE] flex items-center gap-1.5 transition-all mt-4 border-t border-[var(--stone)]/60 pt-4 w-full"
          >
            Gérer les garages <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="bg-[var(--white)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1454FF]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:text-[var(--blue)] transition-all duration-500 pointer-events-none">
            <FileText size={96} />
          </div>
          <div className="flex items-center gap-5 mb-6 relative z-10">
            <div className="w-14 h-14 bg-[var(--blue)]/10 text-[var(--blue)] rounded-2xl flex items-center justify-center shadow-inner border border-[#C2CFFF] group-hover:scale-105 transition-transform duration-300">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Dossiers</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[var(--ink)] tracking-tight mt-1 tabular-nums">
                {loading ? pulse : totalDossiers}
              </h3>
            </div>
          </div>
          <Link
            href="/admin/dossiers"
            className="text-[11px] font-bold text-[var(--blue)] hover:text-[#003BDE] flex items-center gap-1.5 transition-all mt-4 border-t border-[var(--stone)]/60 pt-4 w-full"
          >
            Assigner les dossiers <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Graphiques : garages inscrits + dossiers par mois */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">

        {/* Garages inscrits par mois */}
        <div className="bg-[var(--white)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-extrabold text-[var(--ink)] flex items-center gap-2">
                <Building2 size={18} className="text-[#38bdf8]" />
                Garages inscrits
              </h3>
              <p className="text-xs font-semibold text-[var(--muted)] mt-1">
                Nouvelles inscriptions sur les {MONTHS_WINDOW} derniers mois
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-[var(--ink)] tabular-nums leading-none">
                {loading ? '–' : garages.length}
              </p>
              <p className="text-[11px] font-bold text-emerald-400 mt-1 flex items-center justify-end gap-1">
                <TrendingUp size={12} /> +{garagesLast6} sur {MONTHS_WINDOW} mois
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 sm:gap-3 h-[170px]">
            {garagesByMonth.map(m => {
              const h = Math.round((m.value / garagesMaxMonth) * 100);
              return (
                <div key={m.key} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                  <span className="text-xs font-bold text-[var(--ink)] tabular-nums">{m.value}</span>
                  <div className="w-full flex items-end justify-center flex-1">
                    <div
                      className="w-full max-w-[44px] rounded-t-xl transition-all duration-700"
                      style={{
                        height: `${Math.max(h, m.value > 0 ? 6 : 2)}%`,
                        background: m.value > 0
                          ? 'linear-gradient(180deg, #38bdf8 0%, #1454FF 100%)'
                          : 'rgba(148,163,184,0.25)',
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--muted)] capitalize">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dossiers créés par mois */}
        <div className="bg-[var(--white)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-extrabold text-[var(--ink)] flex items-center gap-2">
                <FileText size={18} className="text-[#a855f7]" />
                Dossiers créés
              </h3>
              <p className="text-xs font-semibold text-[var(--muted)] mt-1">
                Activité sur les {MONTHS_WINDOW} derniers mois
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-[var(--ink)] tabular-nums leading-none">
                {loading ? '–' : totalDossiers}
              </p>
              <p className="text-[11px] font-semibold text-[var(--muted)] mt-1">au total</p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 sm:gap-3 h-[170px]">
            {dossiersByMonth.map(m => {
              const h = Math.round((m.value / dossiersMaxMonth) * 100);
              return (
                <div key={m.key} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                  <span className="text-xs font-bold text-[var(--ink)] tabular-nums">{m.value}</span>
                  <div className="w-full flex items-end justify-center flex-1">
                    <div
                      className="w-full max-w-[44px] rounded-t-xl transition-all duration-700"
                      style={{
                        height: `${Math.max(h, m.value > 0 ? 6 : 2)}%`,
                        background: m.value > 0
                          ? 'linear-gradient(180deg, #c084fc 0%, #7c3aed 100%)'
                          : 'rgba(148,163,184,0.25)',
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--muted)] capitalize">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Avancement des dossiers par statut */}
      <div className="bg-[var(--white)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md">
        <div className="mb-6">
          <h3 className="text-base font-extrabold text-[var(--ink)] flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" />
            Avancement des dossiers
          </h3>
          <p className="text-xs font-semibold text-[var(--muted)] mt-1">
            Répartition par statut. Le pourcentage correspond aux dossiers terminés (hors désistements).
          </p>
        </div>

        {totalDossiers === 0 && !loading ? (
          <p className="text-sm font-semibold text-[var(--muted)] text-center py-10">
            Aucun dossier pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-center">

            {/* Anneau */}
            <div className="relative w-[200px] h-[200px] mx-auto">
              <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="22" />
                {donutArcs.map(arc => (
                  <circle
                    key={arc.key}
                    cx="100"
                    cy="100"
                    r={R}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth="22"
                    strokeDasharray={`${arc.len} ${C - arc.len}`}
                    strokeDashoffset={-arc.offset}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-4xl font-extrabold text-[var(--ink)] tabular-nums leading-none">
                  {loading ? '–' : `${avancementPct}%`}
                </p>
                <p className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mt-1.5">
                  terminés
                </p>
                <p className="text-[11px] font-semibold text-[var(--muted)] mt-0.5">
                  {termines} / {baseAvancement}
                </p>
              </div>
            </div>

            {/* Barres par statut */}
            <div className="space-y-3.5">
              {statusSegments.map(seg => {
                const pct = totalDossiers > 0 ? Math.round((seg.value / totalDossiers) * 100) : 0;
                return (
                  <div key={seg.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }} />
                        <span className="text-xs font-bold text-[var(--ink)]">{seg.label}</span>
                      </div>
                      <span className="text-xs font-bold text-[var(--muted)] tabular-nums">
                        {seg.value} <span className="opacity-70">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[rgba(148,163,184,0.18)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: seg.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}