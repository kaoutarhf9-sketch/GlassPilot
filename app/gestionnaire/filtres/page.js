"use client";

import { useState, useEffect } from 'react';
import { supabase, getValidUser } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Filter, Clock, CheckCircle2, AlertCircle, FileSignature,
  Car, Loader2, ChevronRight, Calendar, Phone, User,
  Sparkles, BarChart3, TrendingUp, FileText, ShieldCheck
} from 'lucide-react';
import clsx from 'clsx';

const STATUTS = [
  { id: 'en_attente', label: 'En attente de vérification', icon: Clock, color: 'amber', count: 0 },
  { id: 'signe', label: 'Dossier en attente', icon: FileSignature, color: 'teal', count: 0 },
  { id: 'en_cours', label: 'Démarrer travaux', icon: Car, color: 'sky', count: 0 },
  { id: 'action_requise', label: 'Action requise', icon: AlertCircle, color: 'rose', count: 0 },
  { id: 'reglement_recu', label: 'Règlement reçu', icon: CheckCircle2, color: 'emerald', count: 0 },
  { id: 'termine', label: 'Terminé', icon: CheckCircle2, color: 'emerald', count: 0 },
];

export default function FiltresPage() {
  const [selectedStatut, setSelectedStatut] = useState('en_attente');
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchDossiers();
    fetchStats();

    const handleFocus = () => {
      fetchDossiers();
      fetchStats();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleFocus();
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchDossiers = async () => {
    setLoading(true);
    try {
      const user = await getValidUser();
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

      const { data, error } = await supabase
        .from('dossiers')
        .select(`*,
 clients (nom, prenom, telephone),
 garages (nom_garage)`)
        .eq('gestionnaire_id', gestionnaireId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const activeDossiers = (data || []).filter(d => {
        if (d.statut === 'reglement_en_cours') return false;
        if (d.statut === 'termine') return false;
        return true;
      });

      setDossiers(activeDossiers);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const user = await getValidUser();
      if (!user) return;

      const { data: gestionnaireData, error: gError } = await supabase
        .from('gestionnaires')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (gError || !gestionnaireData) return;

      const gestionnaireId = gestionnaireData.id;
      const statsData = {};

      for (const statut of STATUTS) {
        if (statut.id === 'termine') {
          statsData[statut.id] = 0;
        } else {
          const { count } = await supabase
            .from('dossiers')
            .select('*', { count: 'exact', head: true })
            .eq('gestionnaire_id', gestionnaireId)
            .eq('statut', statut.id);
          statsData[statut.id] = count || 0;
        }
      }
      setStats(statsData);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const dossiersFiltres = dossiers.filter(d => d.statut === selectedStatut);

  const getStatutIcon = (statut) => {
    const config = {
      en_attente: Clock,
      en_cours: Car,
      action_requise: AlertCircle,
      signe: FileSignature,
      reglement_recu: CheckCircle2,
      termine: CheckCircle2,
    };
    const Icon = config[statut] || Clock;
    return <Icon size={14} />;
  };

  const getStatutColor = (statut) => {
    const colors = {
      en_attente: 'bg-amber-100 text-amber-700 border-amber-200',
      en_cours: 'bg-sky-100 text-sky-700 border-sky-200',
      action_requise: 'bg-rose-100 text-rose-700 border-rose-200',
      signe: 'bg-teal-100 text-teal-700 border-teal-200',
      reglement_recu: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      termine: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return colors[statut] || colors.en_attente;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={48} className="animate-spin text-[var(--blue)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* En-tête */}
      <div>
        <div className="inline-flex items-center gap-2 bg-[var(--white)] shadow-md rounded-full px-4 py-2 mb-6 border border-[var(--stone)]">
          <Filter size={14} className="text-[var(--blue)]" />
          <span className="text-xs font-medium text-[var(--blue)] uppercase tracking-wider">Filtres avancés</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif text-[var(--ink)] mb-2">Filtres par statut</h1>
        <p className="text-[var(--muted)] font-light">Visualisez les dossiers par statut</p>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {STATUTS.map((statut) => {
          const Icon = statut.icon;
          const isSelected = selectedStatut === statut.id;
          return (
            <button
              key={statut.id}
              onClick={() => setSelectedStatut(statut.id)}
              className={clsx(
                "bg-[var(--white)]   rounded-xl p-4 border transition-all text-left",
                isSelected 
                  ? `border-${statut.color}-400 shadow-md ring-2 ring-${statut.color}-400/20` 
                  : "border-[var(--stone)] hover:border-[#1454FF]"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  `bg-${statut.color}-100`
                )}>
                  <Icon size={14} className={`text-${statut.color}-600`} />
                </div>
                <span className="text-2xl font-bold text-[var(--ink)]">{stats[statut.id] || 0}</span>
              </div>
              <p className="text-xs text-[var(--muted)]">{statut.label}</p>
            </button>
          );
        })}
      </div>

      {/* Résultats */}
      <div className="bg-[var(--white)] rounded-2xl border border-[var(--stone)] shadow-md overflow-hidden">
        <div className="p-5 border-b border-[var(--stone)] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-[var(--blue)]" />
            <h2 className="font-semibold text-[var(--ink)]">Dossiers {STATUTS.find(s => s.id === selectedStatut)?.label}</h2>
          </div>
          <span className="text-sm text-[var(--muted)]">{dossiersFiltres.length} dossier(s)</span>
        </div>

        {dossiersFiltres.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="text-[var(--muted)] mx-auto mb-4 opacity-50" />
            <p className="text-[var(--muted)] font-medium">Aucun dossier dans cette catégorie</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F3EF]">
            {dossiersFiltres.map((dossier) => (
              <div key={dossier.id} className="p-5 hover:bg-[var(--white)]/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--white)] rounded-xl flex items-center justify-center">
                      <FileText size={16} className="text-[var(--muted)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-mono font-bold text-[var(--ink)]">{dossier.numero}</p>
                        <span className={clsx(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                          getStatutColor(dossier.statut)
                        )}>
                          {getStatutIcon(dossier.statut)}
                          {STATUTS.find(s => s.id === dossier.statut)?.label}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--muted)] mt-1">
                        <span className="font-medium">{dossier.garages?.nom_garage}</span> • 
                        {dossier.clients?.prenom} {dossier.clients?.nom}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted)] flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-[var(--ink)]">
                          <ShieldCheck size={12} className="text-[#18CDEC]" />
                          {(() => {
                            let nomAssurance = null;
                            try {
                              const notes = JSON.parse(dossier.notes || '{}');
                              nomAssurance = dossier.assurances?.nom || notes.assurance_nom || notes.assurance_nom_ocr || dossier.assurance_nom || null;
                            } catch(e) {}
                            return nomAssurance || <span className="italic text-[var(--muted)] font-normal">Assurance non renseignée</span>;
                          })()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} /> {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Car size={10} /> {dossier.immatriculation}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link 
                    href={`/gestionnaire/dossiers/${dossier.id}`}
                    className="text-[var(--blue)] hover:text-[#0ea5e9] text-sm font-medium flex items-center gap-1"
                  >
                    Voir détails <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}