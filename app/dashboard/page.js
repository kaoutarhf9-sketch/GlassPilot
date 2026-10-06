"use client";

import { useState, useEffect } from 'react';
import { supabase, getValidUser } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Clock, CheckCircle2, AlertCircle, Plus, 
  Loader2, Calendar, Car, FileText, Sparkles,
  ArrowRight, Target, TrendingUp, Users, Euro, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [garageInfo, setGarageInfo] = useState(null);
  const [stats, setStats] = useState({
    en_attente: 0,
    action_requise: 0,
    termines_mois: 0,
    termines_total: 0,
    total_dossiers: 0,
    progression_mois: 0
  });
  const [dossiersRecents, setDossiersRecents] = useState([]);
  
  // États pour le graphique des revenus
  const [chartFilter, setChartFilter] = useState('mois'); // 'jour', 'semaine', 'mois'
  const [revenueData, setRevenueData] = useState({
    jour: [],
    semaine: [],
    mois: []
  });

  useEffect(() => {
    setIsMounted(true);
    fetchDashboardData();

    const handleFocus = () => { fetchDashboardData(); };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleFocus();
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      const user = await getValidUser();
      if (!user) {
        router.push('/connexion');
        return;
      }

      const { data: garage, error: garageError } = await supabase
        .from('garages')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (garageError) throw garageError;

      if (!garage) {
        router.push('/dashboard/onboarding');
        return;
      }
      setGarageInfo(garage);

      const { data: dossiers, error: dossiersError } = await supabase
        .from('dossiers')
        .select(`*,
 clients (nom, prenom, telephone)`)
        .eq('garage_id', garage.id)
        .order('created_at', { ascending: false });

      if (dossiersError) throw dossiersError;

      const now = new Date();
      const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
      const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const en_attente = dossiers?.filter(d => ['en_attente', 'relance'].includes(d.statut)).length || 0;
      const action_requise = dossiers?.filter(d => d.statut === 'action_requise').length || 0;
      const termines_mois = dossiers?.filter(d => 
        ['termine', 'reglement_recu'].includes(d.statut) && 
        new Date(d.created_at) >= debutMois && 
        new Date(d.created_at) <= finMois
      ).length || 0;
      
      const termines_total = dossiers?.filter(d => ['termine', 'reglement_recu'].includes(d.statut)).length || 0;
      const total_dossiers = dossiers?.filter(d => d.statut !== 'desistement').length || 0;
      
      const debutMoisPrecedent = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const finMoisPrecedent = new Date(now.getFullYear(), now.getMonth(), 0);
      
      const termines_mois_precedent = dossiers?.filter(d => 
        ['termine', 'reglement_recu'].includes(d.statut) && 
        new Date(d.created_at) >= debutMoisPrecedent && 
        new Date(d.created_at) <= finMoisPrecedent
      ).length || 0;
      
      let progression_mois = 0;
      if (termines_mois_precedent > 0) {
        progression_mois = Math.round((termines_mois - termines_mois_precedent) / termines_mois_precedent * 100);
      } else if (termines_mois > 0) {
        progression_mois = 100;
      }

      setStats({
        en_attente,
        action_requise,
        termines_mois,
        termines_total,
        total_dossiers,
        progression_mois
      });

      setDossiersRecents(dossiers?.slice(0, 5) || []);

      // --- CALCUL DU REVENU (Graphique) ---
      // On somme le champ 'montant' (s'il existe) des dossiers pour estimer le revenu
      const revenusParMois = Array.from({ length: 12 }, (_, i) => ({
        name: new Date(now.getFullYear(), i, 1).toLocaleDateString('fr-FR', { month: 'short' }),
        revenu: 0
      }));
      
      const revenusParSemaine = Array.from({ length: 4 }, (_, i) => ({
        name: `Semaine ${4 - i}`,
        revenu: 0
      }));
      
      const revenusParJour = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        return {
          dateObj: d,
          name: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
          revenu: 0
        };
      });

      dossiers?.forEach(d => {
        if (!d.montant) return;
        const dDate = new Date(d.created_at);
        const montant = parseFloat(d.montant) || 0;
        
        // Check Année en cours
        if (dDate.getFullYear() === now.getFullYear()) {
          revenusParMois[dDate.getMonth()].revenu += montant;
        }
        
        // Check 4 dernières semaines (approx. 28 jours)
        const diffTime = now - dDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 28) {
          const weekIndex = 3 - Math.floor(diffDays / 7);
          if (weekIndex >= 0 && weekIndex < 4) {
            revenusParSemaine[weekIndex].revenu += montant;
          }
        }
        
        // Check 7 derniers jours
        if (diffDays >= 0 && diffDays < 7) {
          // Find the right day bucket
          const dayMatch = revenusParJour.find(day => day.dateObj.toDateString() === dDate.toDateString());
          if (dayMatch) {
            dayMatch.revenu += montant;
          }
        }
      });

      setRevenueData({
        jour: revenusParJour,
        semaine: revenusParSemaine,
        mois: revenusParMois
      });

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut) => {
    const configs = {
      en_attente: { label: 'En attente', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
      expertise: { label: 'En expertise', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
      action_requise: { label: 'Action requise', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
      signe: { label: 'Signature Validée', color: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500' },
      en_cours: { label: 'En cours', color: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
      reglement_recu: { label: 'Règlement reçu', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
      termine: { label: 'Terminé', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
      facture: { label: 'Facturé', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' }
    };
    const config = configs[statut] || configs.en_attente;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {config.label}
      </span>
    );
  };

  const formatDateRelative = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Hier";
    if (diff < 7) return `Il y a ${diff} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  if (!isMounted || loading) {
    return (
      <div className="min-h-[60vh] bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-[var(--blue)] rounded-full animate-ping opacity-20"></div>
            <Loader2 size={48} className="animate-spin text-[var(--blue)] mx-auto relative z-10" />
          </div>
          <p className="text-[var(--muted)] font-medium">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[var(--white)] shadow-md rounded-full px-3 py-1.5 mb-4 border border-[var(--stone)]">
            <Sparkles size={12} className="text-[var(--blue)]" />
            <span className="text-xs font-medium text-[var(--blue)]">Tableau de bord</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-[var(--ink)] tracking-tight">
            Bonjour, {garageInfo?.responsable?.split(' ')[0] || garageInfo?.nom_garage || 'Garagiste'} 👋
          </h1>
          <p className="text-[var(--muted)] mt-1">
            {garageInfo?.nom_garage} — Vue d'ensemble de votre activité
          </p>
        </div>
        <Link 
          href="/dashboard/dossiers/nouveau"
          className="bg-[var(--blue)] hover:bg-[#0ea5e9] text-[var(--ink)] px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-md shadow-[#1454FF]/25 transition-all hover:-translate-y-0.5 w-fit"
        >
          <Plus size={18} /> Nouveau dossier
        </Link>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-[var(--white)] rounded-2xl p-6 border border-[var(--stone)] shadow-md hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-amber-600" />
            </div>
            <span className="text-xs text-[var(--muted)] font-medium">En attente</span>
          </div>
          <h3 className="text-3xl font-bold text-[var(--ink)] mt-2">{stats.en_attente}</h3>
          <p className="text-xs text-[var(--muted)] mt-1">Dossiers à traiter</p>
        </div>

        <div className="bg-[var(--white)] rounded-2xl p-6 border border-[var(--stone)] shadow-md hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
              <AlertCircle size={18} className="text-rose-600" />
            </div>
            <span className="text-xs text-[var(--muted)] font-medium">Action requise</span>
          </div>
          <h3 className="text-3xl font-bold text-[var(--ink)] mt-2">{stats.action_requise}</h3>
          <p className="text-xs text-[var(--muted)] mt-1">Dossiers nécessitant une action</p>
        </div>

        <div className="bg-[var(--white)] rounded-2xl p-6 border border-[var(--stone)] shadow-md hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <span className="text-xs text-[var(--muted)] font-medium">Terminés</span>
          </div>
          <h3 className="text-3xl font-bold text-[var(--ink)] mt-2">{stats.termines_mois}</h3>
          <p className="text-xs text-[var(--muted)] mt-1">Dossiers terminés ce mois</p>
        </div>

        <div className="bg-[var(--blue)] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[var(--white)] rounded-xl flex items-center justify-center">
              <Target size={18} className="text-[var(--ink)]" />
            </div>
            <span className="text-xs text-[var(--ink)]/70 font-medium">Total dossiers</span>
          </div>
          <h3 className="text-3xl font-bold text-[var(--ink)] mt-2">{stats.total_dossiers}</h3>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[var(--ink)]/70">Dossiers traités</span>
            <span className="text-xs text-[var(--ink)]/80 font-medium">
              {stats.progression_mois > 0 ? `+${stats.progression_mois}%` : stats.progression_mois < 0 ? `${stats.progression_mois}%` : '='}
            </span>
          </div>
          <div className="mt-1 h-1.5 bg-[var(--white)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--white)] rounded-full" style={{ width: `${Math.min((stats.termines_total / stats.total_dossiers) * 100 || 0, 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Graphique des revenus */}
      <div className="bg-[var(--white)] rounded-2xl border border-[var(--stone)] shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--stone)] rounded-xl flex items-center justify-center border border-[var(--stone)]">
              <TrendingUp size={18} className="text-[var(--blue)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--ink)] tracking-tight">Chiffre d'Affaires</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-[var(--ink)]">
                  {revenueData[chartFilter].reduce((sum, item) => sum + item.revenu, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </span>
                <span className="text-xs text-[var(--muted)]">sur la période</span>
              </div>
            </div>
          </div>

          <div className="flex p-1 bg-[var(--surface2)] border border-[var(--stone)] rounded-xl w-fit">
            <button
              onClick={() => setChartFilter('jour')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
 chartFilter === 'jour' 
 ? 'bg-[var(--surface)] text-[var(--blue)] shadow-sm border border-[var(--stone)]' 
 : 'text-[var(--muted)] hover:text-[var(--ink)]'
 }`}
            >
              7 Jours
            </button>
            <button
              onClick={() => setChartFilter('semaine')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
 chartFilter === 'semaine' 
 ? 'bg-[var(--surface)] text-[var(--blue)] shadow-sm border border-[var(--stone)]' 
 : 'text-[var(--muted)] hover:text-[var(--ink)]'
 }`}
            >
              4 Semaines
            </button>
            <button
              onClick={() => setChartFilter('mois')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
 chartFilter === 'mois' 
 ? 'bg-[var(--surface)] text-[var(--blue)] shadow-sm border border-[var(--stone)]' 
 : 'text-[var(--muted)] hover:text-[var(--ink)]'
 }`}
            >
              Année
            </button>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData[chartFilter]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1454FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#1454FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--stone)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => `${value}€`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  border: '1px solid var(--stone)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
                itemStyle={{ color: '#1454FF' }}
                formatter={(value) => [`${parseFloat(value).toFixed(2).replace('.', ',')} €`, 'Revenu']}
              />
              <Area 
                type="monotone" 
                dataKey="revenu" 
                stroke="#1454FF" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenu)" 
                activeDot={{ r: 6, fill: '#1454FF', stroke: 'white', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dossiers récents */}
      <div className="bg-[var(--white)] rounded-2xl border border-[var(--stone)] shadow-md overflow-hidden">
        <div className="p-6 border-b border-[var(--stone)] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--blue)]/10 rounded-lg flex items-center justify-center">
              <FileText size={14} className="text-[var(--blue)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--ink)]">Dossiers récents</h3>
          </div>
          <Link href="/dashboard/dossiers" className="text-sm font-medium text-[var(--blue)] hover:text-[#0ea5e9] transition-colors flex items-center gap-1">
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>
        
        {dossiersRecents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[var(--white)] rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-[var(--muted)]" />
            </div>
            <p className="text-[var(--muted)] font-medium">Aucun dossier pour le moment</p>
            <Link 
              href="/dashboard/dossiers/nouveau"
              className="inline-flex items-center gap-2 mt-4 text-[var(--blue)] font-medium hover:text-[#0ea5e9]"
            >
              <Plus size={16} /> Créer votre premier dossier
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#E6E4DD]">
            {dossiersRecents.map((dossier) => (
              <div key={dossier.id} className="p-5 hover:bg-[var(--white)] transition-colors group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--white)] rounded-xl flex items-center justify-center">
                      <Car size={16} className="text-[var(--muted)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[var(--ink)]">
                          {dossier.clients?.prenom} {dossier.clients?.nom || 'Client sans nom'}
                        </p>
                        {getStatutBadge(dossier.statut)}
                      </div>
                      <p className="text-sm text-[var(--muted)] mt-1">
                        {dossier.modele_vehicule || 'Modèle non renseigné'} • {dossier.immatriculation || 'Sans immatriculation'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted)] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} /> {formatDateRelative(dossier.created_at)}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-[var(--ink)]">
                          <ShieldCheck size={11} className="text-[var(--blue)]" />
                          {(() => {
                            let nomAssurance = null;
                            try {
                              const notes = JSON.parse(dossier.notes || '{}');
                              nomAssurance = dossier.assurances?.nom || notes.assurance_nom || notes.assurance_nom_ocr || dossier.assurance_nom || null;
                            } catch(e) {}
                            return nomAssurance || <span className="italic text-[var(--muted)] font-normal">Assurance non renseignée</span>;
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link 
                    href={`/dashboard/dossiers/${dossier.id}`}
                    className="text-[var(--blue)] hover:text-[#0ea5e9] text-sm font-medium flex items-center gap-1"
                  >
                    Consulter <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer statistiques */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--stone)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-xs text-[var(--muted)]">
              {stats.termines_total} dossiers terminés au total
            </span>
          </div>
          <div className="w-px h-4 bg-[#E6E4DD]"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-xs text-[var(--muted)]">
              {stats.en_attente} dossiers en attente
            </span>
          </div>
        </div>
        <div className="text-xs text-[var(--muted)]">
          Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
        </div>
      </div>

    </div>
  );
}