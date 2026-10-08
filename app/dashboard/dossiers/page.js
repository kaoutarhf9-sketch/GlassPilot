"use client";

import { useState, useEffect } from 'react';
import { supabase, getValidUser } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Search, Plus, Filter, FileText, Loader2, 
  Car, Calendar, ChevronRight, CheckCircle2, AlertCircle,
  Sparkles, User, Phone, Clock, Eye, FileSignature,
  Star, Award, TrendingUp, ShieldCheck
} from 'lucide-react';

export default function ListeDossiers() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleFocus = () => { fetchDossiers(); };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleFocus();
    });
    if (typeof window !== 'undefined' && window.location.search.includes('success=true')) {
      setShowSuccess(true);
      window.history.replaceState(null, '', '/dashboard/dossiers');
      setTimeout(() => setShowSuccess(false), 5000);
    }
    fetchDossiers();
  }, []);

  const fetchDossiers = async () => {
    setLoading(true);
    try {
      const user = await getValidUser();
      if (!user) return;

      const { data: garage } = await supabase
        .from('garages')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!garage) return;

      const { data, error } = await supabase
        .from('dossiers')
        .select(`*,
 clients (nom, prenom, telephone)`)
        .eq('garage_id', garage.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDossiers(data || []);

    } catch (error) {
      console.error('Erreur chargement des dossiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatutConfig = (statut) => {
    const configs = {
      en_attente: { label: 'En attente', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', icon: Clock },
      action_requise: { label: 'Action requise', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', icon: AlertCircle },
      signe: { label: 'Signature validée', color: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500', icon: FileSignature },
      en_cours: { label: 'En cours', color: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500', icon: Car },
      reglement_recu: { label: 'Règlement reçu', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
      envoi_courrier: { label: 'Envoi courrier', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', icon: Mail },
      relance: { label: 'Relance', color: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', icon: Clock },
      recouvrement: { label: 'Recouvrement', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', icon: AlertCircle },
      termine: { label: 'Terminé', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
    };
    return configs[statut] || configs.en_attente;
  };

  const getStatutBadge = (statut) => {
    const config = getStatutConfig(statut);
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const dossiersFiltres = dossiers.filter(dossier => {
    const matchSearch = 
      (dossier.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dossier.immatriculation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dossier.clients?.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dossier.clients?.prenom || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'tous' || dossier.statut === statusFilter;
    
    return matchSearch && matchStatus;
  });

  const stats = {
    total: dossiers.length,
    en_attente: dossiers.filter(d => d.statut === 'en_attente').length,
    en_cours: dossiers.filter(d => d.statut === 'en_cours').length,
    termine: dossiers.filter(d => d.statut === 'termine').length,
    signe: dossiers.filter(d => d.statut === 'signe').length,
  };

  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-[var(--blue)] rounded-full animate-ping opacity-20"></div>
            <Loader2 size={48} className="animate-spin text-[var(--blue)] mx-auto relative z-10" />
          </div>
          <p className="text-[var(--muted)] font-light">Chargement des dossiers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* Bannière de succès */}
      {showSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-600 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={18} />
          <span>Le dossier a été créé avec succès !</span>
        </div>
      )}

      {/* En-tête */}
      <div>
        <div className="inline-flex items-center gap-2 bg-[var(--white)] shadow-md rounded-full px-4 py-2 mb-6 border border-[var(--stone)]">
          <Sparkles size={14} className="text-[var(--blue)]" />
          <span className="text-xs font-medium text-[var(--blue)] uppercase tracking-wider">Gestion des dossiers</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif text-[var(--ink)] mb-2">Dossiers</h1>
        <p className="text-[var(--muted)] font-light">Gérez toutes vos interventions et cessions de créance</p>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-[var(--white)] rounded-xl p-4 border border-[var(--stone)] shadow-md">
          <p className="text-2xl font-bold text-[var(--ink)]">{stats.total}</p>
          <p className="text-xs text-[var(--muted)]">Total dossiers</p>
        </div>
        <div className="bg-[var(--white)] rounded-xl p-4 border border-[var(--stone)] shadow-md">
          <p className="text-2xl font-bold text-amber-600">{stats.en_attente}</p>
          <p className="text-xs text-[var(--muted)]">En attente</p>
        </div>
        <div className="bg-[var(--white)] rounded-xl p-4 border border-[var(--stone)] shadow-md">
          <p className="text-2xl font-bold text-sky-600">{stats.en_cours}</p>
          <p className="text-xs text-[var(--muted)]">En cours</p>
        </div>
        <div className="bg-[var(--white)] rounded-xl p-4 border border-[var(--stone)] shadow-md">
          <p className="text-2xl font-bold text-teal-600">{stats.signe}</p>
          <p className="text-xs text-[var(--muted)]">Signature validée</p>
        </div>
        <div className="bg-[var(--white)] rounded-xl p-4 border border-[var(--stone)] shadow-md">
          <p className="text-2xl font-bold text-emerald-600">{stats.termine}</p>
          <p className="text-xs text-[var(--muted)]">Terminés</p>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-[var(--white)] rounded-2xl border border-[var(--stone)] shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par numéro, plaque, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/10 transition-all placeholder:text-[var(--muted)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-[var(--muted)]" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm font-medium text-[var(--ink)] focus:outline-none focus:border-[#1454FF] transition-all"
            >
              <option value="tous">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="signe">Signature validée</option>
              <option value="action_requise">Action requise</option>
              <option value="en_cours">En cours</option>
              <option value="reglement_recu">Règlement reçu</option>
              <option value="termine">Terminé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des dossiers */}
      {dossiersFiltres.length === 0 ? (
        <div className="bg-[var(--white)] rounded-2xl border border-[var(--stone)] p-12 text-center">
          <div className="w-16 h-16 bg-[var(--white)] rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-[var(--muted)]" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">Aucun dossier trouvé</h3>
          <p className="text-[var(--muted)] text-sm">Modifiez votre recherche ou créez un nouveau dossier</p>
          <Link 
            href="/dashboard/dossiers/nouveau"
            className="inline-flex items-center gap-2 mt-4 text-[var(--blue)] font-medium hover:text-[#0ea5e9] transition-colors"
          >
            <Plus size={16} /> Créer un dossier
          </Link>
        </div>
      ) : (
        <div className="bg-[var(--white)] rounded-2xl border border-[var(--stone)] shadow-md overflow-hidden">
          {/* Version Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--white)] border-b border-[var(--stone)]">
                  <th className="p-4 pl-6 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">N° dossier</th>
                  <th className="p-4 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Client</th>
                  <th className="p-4 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Assurance</th>
                  <th className="p-4 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Véhicule</th>
                  <th className="p-4 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Statut</th>
                  <th className="p-4 pr-6 text-right text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Action</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F3EF]">
                {dossiersFiltres.map((dossier) => (
                  <tr key={dossier.id} className="hover:bg-[var(--white)] transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-mono font-bold text-[var(--ink)]">{dossier.numero}</div>
                      <div className="text-xs text-[var(--muted)] mt-0.5">{dossier.type_vitrage?.substring(0, 20)}</div>
                     </td>
                    <td className="p-4">
                      <div className="font-medium text-[var(--ink)]">
                        {dossier.clients?.prenom} {dossier.clients?.nom}
                      </div>
                      <div className="text-xs text-[var(--muted)] flex items-center gap-1 mt-0.5">
                        <Phone size={10} /> {dossier.clients?.telephone || 'Non renseigné'}
                      </div>
                     </td>
                    <td className="p-4">
                      {(() => {
                        let nomAssurance = null;
                        try {
                          const notes = JSON.parse(dossier.notes || '{}');
                          nomAssurance = dossier.assurances?.nom || notes.assurance_nom || notes.assurance_nom_ocr || dossier.assurance_nom || null;
                        } catch(e) {}
                        return (
                          <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--ink)]">
                            <ShieldCheck size={14} className="text-[var(--blue)] shrink-0" />
                            <span>{nomAssurance || <span className="italic text-[var(--muted)] text-xs">Non renseignée</span>}</span>
                          </div>
                        );
                      })()}
                     </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-mono font-bold text-[var(--ink)] uppercase text-sm">
                        {dossier.immatriculation || 'N/A'}
                      </div>
                      <div className="text-xs text-[var(--muted)] mt-0.5">{dossier.modele_vehicule}</div>
                     </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-[var(--muted)]">
                        <Calendar size={12} />
                        <span className="text-sm">{new Date(dossier.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                     </td>
                    <td className="p-4">
                      {getStatutBadge(dossier.statut)}
                     </td>
                    <td className="p-4 pr-6 text-right">
                      <Link 
                        href={`/dashboard/dossiers/${dossier.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[var(--blue)] hover:text-[var(--ink)] bg-[var(--blue)]/10 hover:bg-[var(--blue)] rounded-lg transition-all"
                      >
                        Voir <ChevronRight size={14} />
                      </Link>
                     </td>
                   </tr>
                ))}
              </tbody>
             </table>
          </div>

          {/* Version Mobile */}
          <div className="md:hidden divide-y divide-[#F4F3EF]">
            {dossiersFiltres.map((dossier) => (
              <div key={dossier.id} className="p-4 hover:bg-[var(--white)] transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono font-bold text-[var(--ink)] text-sm">{dossier.numero}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{dossier.type_vitrage}</p>
                  </div>
                  {getStatutBadge(dossier.statut)}
                </div>
                
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={14} className="text-[var(--muted)]" />
                    <span className="text-[var(--ink)]">{dossier.clients?.prenom} {dossier.clients?.nom}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck size={14} className="text-[var(--blue)]" />
                    <span className="text-[var(--ink)] font-medium">
                      {(() => {
                        let nomAssurance = null;
                        try {
                          const notes = JSON.parse(dossier.notes || '{}');
                          nomAssurance = dossier.assurances?.nom || notes.assurance_nom || notes.assurance_nom_ocr || dossier.assurance_nom || null;
                        } catch(e) {}
                        return nomAssurance || <span className="italic text-[var(--muted)] text-xs">Assurance non renseignée</span>;
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Car size={14} className="text-[var(--muted)]" />
                    <span className="font-mono text-[var(--ink)] uppercase">{dossier.immatriculation || 'N/A'}</span>
                    <span className="text-xs text-[var(--muted)]">- {dossier.modele_vehicule}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <Calendar size={12} />
                    {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-[#F4F3EF]">
                  <Link 
                    href={`/dashboard/dossiers/${dossier.id}`}
                    className="w-full flex items-center justify-center gap-1 py-2 text-sm font-medium text-[var(--blue)] bg-[var(--blue)]/10 rounded-xl hover:bg-[var(--blue)] hover:text-[var(--ink)] transition-colors"
                  >
                    Voir le dossier <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {dossiersFiltres.length > 0 && (
        <div className="flex justify-between items-center text-xs text-[var(--muted)] pt-4">
          <span>{dossiersFiltres.length} dossier(s) affiché(s)</span>
          <div className="flex items-center gap-1">
            <Sparkles size={10} className="text-[var(--blue)]" />
            <span>GlassPilot Pro</span>
          </div>
        </div>
      )}
    </div>
  );
}