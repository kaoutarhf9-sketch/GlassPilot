"use client";

import { useState, useEffect } from 'react';
import { supabase, getValidUser } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, FileText, Users, Clock, CheckCircle2, 
  AlertCircle, TrendingUp, Calendar, MessageSquare, 
  Sparkles, ChevronRight, Loader2, Bell, Search,
  Filter, Download, Eye, Star, Award, ShieldCheck, Building2,
  ArrowUpRight, ArrowDownRight, Plus, Settings
} from 'lucide-react';
import clsx from 'clsx';

export default function GestionnaireDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gestionnaire, setGestionnaire] = useState(null);
  const [stats, setStats] = useState({
    total_dossiers: 0,
    en_attente: 0,
    en_cours: 0,
    termines: 0,
    dossiers_mois: 0,
    garages_count: 0
  });
  const [dossiersRecents, setDossiersRecents] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');

  useEffect(() => {
    checkAuth();
    fetchDashboardData();

    const handleFocus = () => {
      fetchDashboardData();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleFocus();
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const user = await getValidUser();
      if (!user) {
        router.push('/connexion');
        return;
      }

      // Vérifier si l'utilisateur est un gestionnaire
      const { data: gestionnaireData } = await supabase
        .from('gestionnaires')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!gestionnaireData) {
        router.push('/dashboard');
        return;
      }

      setGestionnaire(gestionnaireData);
    } catch (err) {
      console.error(err);
      router.push('/connexion');
    }
  };

  const isDossierArchive = (d) => {
    if (d.statut === 'reglement_en_cours') return true;
    if (d.statut === 'termine') return true;
    return false;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const user = await getValidUser();
      if (!user) return;

      // Récupérer le gestionnaire
      const { data: gestionnaireData } = await supabase
        .from('gestionnaires')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!gestionnaireData) return;

      // Récupérer les dossiers
      const { data: dossiers, error } = await supabase
        .from('dossiers')
        .select(`*,
 clients (nom, prenom, telephone),
 garages (nom_garage)`)
        .eq('gestionnaire_id', gestionnaireData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calcul des statistiques
      const now = new Date();
      const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const allDossiers = dossiers || [];
      
      const en_attente = allDossiers.filter(d => ['en_attente', 'relance', 'action_requise'].includes(d.statut)).length;
      const en_cours = allDossiers.filter(d => ['en_cours', 'signe', 'envoi_courrier', 'recouvrement', 'reglement_en_cours'].includes(d.statut)).length;
      const termines = allDossiers.filter(d => ['termine', 'reglement_recu'].includes(d.statut)).length;
      const dossiers_mois = allDossiers.filter(d => new Date(d.created_at) >= debutMois).length;

      // Récupérer le nombre de garages partenaires ayant au moins un dossier de ce gestionnaire
      const uniqueGarageIds = Array.from(new Set(allDossiers.map(d => d.garage_id).filter(Boolean)));
      const garagesCount = uniqueGarageIds.length;

      setStats({
        total_dossiers: allDossiers.length,
        en_attente,
        en_cours,
        termines,
        dossiers_mois,
        garages_count: garagesCount
      });

      // Dossiers récents à traiter en priorité ou les plus récents non terminés
      const dossiersActifs = allDossiers.filter(d => !['termine', 'reglement_recu', 'desistement'].includes(d.statut));
      setDossiersRecents(dossiersActifs.slice(0, 5));

      // Vrais messages récents (uniquement pour les dossiers du gestionnaire)
      const dossierIds = dossiers?.map(d => d.id) || [];
      let messages = [];
      if (dossierIds.length > 0) {
        const { data: messagesData } = await supabase
          .from('messages')
          .select('id, message, created_at, is_read, sender_name, dossier_id')
          .eq('sender_role', 'garagiste')
          .in('dossier_id', dossierIds)
          .order('created_at', { ascending: false })
          .limit(5);
        messages = messagesData || [];
      }

      setRecentMessages(messages);

    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut) => {
    const configs = {
      en_attente: { label: 'En attente de vérification', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
      en_cours: { label: 'Démarrer travaux', color: 'bg-sky-100 text-sky-700 border-sky-200', icon: AlertCircle },
      signe: { label: 'Dossier en attente', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: CheckCircle2 },
      termine: { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
      action_requise: { label: 'Action requise', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertCircle },
      relance: { label: 'Relance', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock },
      reglement_en_cours: { label: 'Règlement en cours', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: TrendingUp },
      reglement_recu: { label: 'Règlement reçu', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
      envoi_courrier: { label: 'Envoi courrier', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Bell },
      recouvrement: { label: 'Recouvrement', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertCircle },
      desistement: { label: 'Désistement', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: AlertCircle },
    };
    const config = configs[statut] || configs.en_attente;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
            <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto relative z-10 mt-4" />
          </div>
          <p className="text-slate-500 font-medium animate-pulse">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Bannière de bienvenue */}
      <div className="bg-[var(--white)] rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 rounded-full px-3 py-1 mb-4 border border-indigo-100">
            <Sparkles size={14} />
            <span className="text-xs font-semibold uppercase tracking-wider">Espace Gestionnaire</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--ink)] tracking-tight">
            Bonjour, {gestionnaire?.prenom || 'Gestionnaire'} 👋
          </h2>
          <p className="text-slate-500 mt-2 max-w-xl">
            Voici un aperçu de l'activité de vos garages. Vous avez <strong className="text-indigo-600">{stats.en_attente} dossiers</strong> en attente de traitement aujourd'hui.
          </p>
        </div>
        <div className="relative z-10 flex shrink-0 gap-3">
          <Link href="/gestionnaire/dossiers/nouveau" className="bg-indigo-600 hover:bg-indigo-700 text-[var(--ink)] px-5 py-2.5 rounded-xl font-medium transition-colors shadow-md shadow-indigo-600/20 flex items-center gap-2">
            <Plus size={18} />
            Nouveau dossier
          </Link>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[var(--white)] rounded-2xl p-5 border border-slate-200 shadow-md hover:shadow-md hover:border-slate-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={20} className="text-slate-600" />
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Total</span>
          </div>
          <p className="text-3xl font-bold text-[var(--ink)]">{stats.total_dossiers}</p>
          <p className="text-sm text-slate-500 mt-1">Dossiers traités</p>
        </div>

        <div className="bg-[var(--white)] rounded-2xl p-5 border border-slate-200 shadow-md hover:shadow-md hover:border-slate-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-amber-100">
              <Clock size={20} className="text-amber-600" />
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-md">Urgent</span>
          </div>
          <p className="text-3xl font-bold text-[var(--ink)]">{stats.en_attente}</p>
          <p className="text-sm text-slate-500 mt-1">À traiter</p>
        </div>

        <div className="bg-[var(--white)] rounded-2xl p-5 border border-slate-200 shadow-md hover:shadow-md hover:border-slate-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-sky-100">
              <AlertCircle size={20} className="text-sky-600" />
            </div>
            <span className="text-xs font-medium text-sky-600 bg-sky-50 border border-sky-100 px-2 py-1 rounded-md">Actif</span>
          </div>
          <p className="text-3xl font-bold text-[var(--ink)]">{stats.en_cours}</p>
          <p className="text-sm text-slate-500 mt-1">En traitement</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 shadow-lg shadow-indigo-600/20 text-[var(--ink)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--white)] rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-[var(--white)] backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
              <TrendingUp size={20} className="text-[var(--ink)]" />
            </div>
            <span className="text-xs font-medium bg-[var(--white)] backdrop-blur-sm px-2 py-1 rounded-md border border-white/10">Performance</span>
          </div>
          <p className="relative z-10 text-3xl font-bold">{stats.dossiers_mois}</p>
          <p className="relative z-10 text-sm text-indigo-100 mt-1">Dossiers ce mois</p>
          <div className="relative z-10 mt-4 h-1.5 bg-black/20 rounded-full overflow-hidden">
            <div className="h-full bg-[var(--white)] rounded-full transition-all duration-1000" style={{ width: `${Math.min((stats.dossiers_mois / 50) * 100, 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Section principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Colonne gauche - Dossiers */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Barre de recherche et filtres */}
          <div className="bg-[var(--white)] rounded-2xl border border-slate-200 shadow-md p-2 sm:p-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
                <input 
                  type="text"
                  placeholder="Rechercher un dossier (nom, immatriculation)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-transparent rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:bg-[var(--white)] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder-slate-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2.5 bg-transparent border border-transparent rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:bg-[var(--white)] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"
                  >
                    <option value="tous">Tous statuts</option>
                    <option value="en_attente">En attente</option>
                    <option value="en_cours">En cours</option>
                    <option value="signe">Signature validée</option>
                    <option value="termine">Terminé</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des dossiers récents */}
          <div className="bg-[var(--white)] rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-transparent/50">
              <h2 className="text-lg font-bold text-[var(--ink)]">Dossiers récents</h2>
              <Link href="/gestionnaire/dossiers" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                Voir tout <ChevronRight size={16} />
              </Link>
            </div>
            
            {dossiersRecents.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-transparent rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <FileText size={24} className="text-[var(--muted)]" />
                </div>
                <p className="text-[var(--ink)] font-semibold mb-1">Aucun dossier récent</p>
                <p className="text-slate-500 text-sm">Les nouveaux dossiers apparaîtront ici.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {dossiersRecents.map((dossier) => {
                  const initials = dossier.clients 
                    ? `${dossier.clients.prenom?.[0] || ''}${dossier.clients.nom?.[0] || ''}`.toUpperCase() 
                    : '?';
                    
                  return (
                    <div key={dossier.id} className="bg-[var(--white)] rounded-2xl border border-[var(--stone)] shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col cursor-pointer" onClick={() => router.push(`/gestionnaire/dossiers/${dossier.id}`)}>
                      {/* En-tête : Client & Statut */}
                      <div className="p-4 border-b border-[var(--stone)] bg-[var(--white)]/20 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--blue)]/10 border border-[var(--stone)] flex items-center justify-center text-xs font-bold text-[var(--blue)] shrink-0">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-[var(--ink)] truncate max-w-[120px]" title={dossier.clients ? `${dossier.clients.prenom} ${dossier.clients.nom}` : 'Sans client'}>
                              {dossier.clients ? `${dossier.clients.prenom} ${dossier.clients.nom}` : 'Sans client'}
                            </span>
                            <span className="text-xs text-[var(--muted)] mt-0.5">{dossier.clients?.telephone || 'Aucun numéro'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Corps : Infos Dossier */}
                      <div className="p-4 flex-1 space-y-3">
                        {/* N° et Vitrage */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-[var(--blue)]" />
                            <span className="font-mono font-bold text-[var(--ink)] text-sm tracking-wide">{dossier.numero}</span>
                          </div>
                          {getStatutBadge(dossier.statut)}
                        </div>

                        {/* Véhicule */}
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-5 flex justify-center"><AlertCircle size={14} className="text-[var(--muted)]" /></div>
                          <span className="font-mono font-semibold text-[var(--ink)] text-xs">{dossier.immatriculation || 'INCONNUE'}</span>
                        </div>

                        {/* Garage */}
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-5 flex justify-center"><Building2 size={14} className="text-[var(--muted)]" /></div>
                          <span className="text-[var(--ink)] truncate text-xs">{dossier.garages ? dossier.garages.nom_garage : <span className="italic text-[var(--muted)]">Garage inconnu</span>}</span>
                        </div>

                        {/* Assurance */}
                        {(() => {
                          let nomAssurance = null;
                          try {
                            const notes = JSON.parse(dossier.notes || '{}');
                            nomAssurance = dossier.assurances?.nom || notes.assurance_nom || notes.assurance_nom_ocr || dossier.assurance_nom || null;
                          } catch(e) {}
                          return (
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-5 flex justify-center"><ShieldCheck size={14} className="text-[#18CDEC]" /></div>
                              <span className="text-[var(--ink)] truncate text-xs font-medium" title={nomAssurance || 'Assurance non renseignée'}>
                                {nomAssurance ? nomAssurance : <span className="italic text-[var(--muted)]">Assurance non renseignée</span>}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                      
                      {/* Footer */}
                      <div className="px-4 py-2 bg-[var(--white)]/40 border-t border-[var(--stone)] mt-auto flex items-center justify-center text-[var(--blue)] text-xs font-medium hover:bg-[var(--white)]/60 transition-colors">
                        Ouvrir le dossier <ChevronRight size={14} className="ml-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite - Widgets */}
        <div className="space-y-6">
          
          {/* Garages Partenaires (remplace l'objectif fictif) */}
          <div className="bg-[var(--white)] rounded-2xl p-6 border border-slate-200 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <ShieldCheck size={16} />
                </div>
                <h3 className="font-bold text-[var(--ink)]">Réseau</h3>
              </div>
            </div>
            
            <div className="flex items-end justify-between mb-2">
              <div>
                <span className="text-4xl font-black text-[var(--ink)]">{stats.garages_count}</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium">Garages partenaires inscrits</p>
          </div>

          {/* Statistiques réelles */}
          <div className="bg-[var(--white)] rounded-2xl border border-slate-200 p-6 shadow-md">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                <Award size={16} />
              </div>
              <h3 className="font-bold text-[var(--ink)]">Activité globale</h3>
            </div>
            
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">Dossiers traités au total</span>
                <span className="font-bold text-[var(--ink)]">{stats.total_dossiers}</span>
              </div>
              
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">Dossiers terminés</span>
                <span className="font-bold text-emerald-600">{stats.termines}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Dossiers créés ce mois</span>
                <span className="font-bold text-indigo-600">{stats.dossiers_mois}</span>
              </div>
            </div>
          </div>

          {/* Vrais Messages */}
          <div className="bg-[var(--white)] rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-transparent/50">
              <h3 className="font-bold text-[var(--ink)] flex items-center gap-2">
                <MessageSquare size={16} className="text-indigo-600" />
                Derniers messages
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {recentMessages.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-slate-500">Aucun message récent.</p>
                </div>
              ) : (
                recentMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={clsx("p-4 hover:bg-transparent transition-colors cursor-pointer", !msg.is_read && "bg-indigo-50/30")}
                    onClick={() => router.push(`/gestionnaire/dossiers/${msg.dossier_id}`)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={clsx("text-sm", !msg.is_read ? "font-semibold text-[var(--ink)]" : "font-medium text-slate-700")}>
                        {msg.sender_name || 'Garagiste'}
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">
                        {new Date(msg.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{msg.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

// Composant Target manquant
function Target(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}