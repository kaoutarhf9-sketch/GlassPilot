"use client";

import { useState, useEffect } from 'react';
import { supabase, getValidUser, getGestionnaire } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Search, Building2, Phone, Mail, MapPin, 
  FileText, Users, Loader2, ChevronRight, ChevronDown, ChevronUp,
  Eye, CheckCircle2, XCircle, TrendingUp, FolderKanban, Landmark, ShieldCheck, Download
} from 'lucide-react';

export default function GaragesPage() {
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dossiersCount, setDossiersCount] = useState({});
  const [totalDossiers, setTotalDossiers] = useState(0);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchGarages();

    const handleFocus = () => {
      fetchGarages();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleFocus();
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchGarages = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer l'utilisateur connecté
      const user = await getValidUser();
      
      if (!user) {
        setError("Session expirée. Veuillez recharger la page.");
        return;
      }
      
      const { data: gestionnaireData, error: gError } = await supabase
        .from('gestionnaires')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (gError || !gestionnaireData) {
        throw new Error("Impossible de récupérer les informations du gestionnaire");
      }

      const gestionnaireId = gestionnaireData.id;

      // Récupérer TOUS les garages via l'API pour avoir les KBIS et RIB
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/gestionnaire/garages', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      if (!res.ok) {
        throw new Error("Erreur lors de la récupération des garages");
      }
      
      const { garages: garagesData, error: garagesError } = await res.json();

      if (garagesError) {
        console.error('Erreur garages:', garagesError);
        setError(`Erreur garages: ${garagesError}`);
      }
      
      setGarages(garagesData || []);

      // Récupérer le nombre de dossiers pour chaque garage (uniquement ceux de ce gestionnaire)
      const counts = {};
      let total = 0;
      
      for (const garage of (garagesData || [])) {
        const { count, error } = await supabase
          .from('dossiers')
          .select('*', { count: 'exact', head: true })
          .eq('garage_id', garage.id)
          .eq('gestionnaire_id', gestionnaireId);
        
        if (!error) {
          counts[garage.id] = count || 0;
          total += count || 0;
        }
      }
      setDossiersCount(counts);
      setTotalDossiers(total);

    } catch (error) {
      console.error('Erreur générale:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const garagesFiltres = garages.filter(garage =>
    garage.nom_garage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    garage.responsable?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    garage.email_contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    garage.siret?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-[var(--blue)] mx-auto mb-4" />
          <p className="text-[var(--muted)]">Chargement des garages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* En-tête */}
      <div>
        <div className="inline-flex items-center gap-2 bg-[var(--white)] shadow-md rounded-full px-4 py-2 mb-6 border border-[var(--stone)]">
          <Building2 size={14} className="text-[var(--blue)]" />
          <span className="text-xs font-medium text-[var(--blue)] uppercase tracking-wider">Gestion des garages</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif text-[var(--ink)] mb-2">Garages</h1>
        <p className="text-[var(--muted)] font-light">Gérez tous les garages inscrits sur la plateforme</p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-[var(--white)] rounded-2xl p-5 border border-[var(--stone)] shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[var(--blue)]/10 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-[var(--blue)]" />
            </div>
            <span className="text-xs text-[var(--muted)]">Total</span>
          </div>
          <p className="text-3xl font-bold text-[var(--ink)]">{garages.length}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Garages inscrits</p>
        </div>
        <div className="bg-[var(--white)] rounded-2xl p-5 border border-[var(--stone)] shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[var(--blue)]/10 rounded-xl flex items-center justify-center">
              <FolderKanban size={20} className="text-[var(--blue)]" />
            </div>
            <span className="text-xs text-[var(--muted)]">Total dossiers</span>
          </div>
          <p className="text-3xl font-bold text-[var(--ink)]">{totalDossiers}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Tous garages confondus</p>
        </div>
        <div className="bg-[var(--white)] rounded-2xl p-5 border border-[var(--stone)] shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[var(--blue)]/10 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-[var(--blue)]" />
            </div>
            <span className="text-xs text-[var(--muted)]">Moyenne</span>
          </div>
          <p className="text-3xl font-bold text-[var(--ink)]">
            {garages.length > 0 ? Math.round(totalDossiers / garages.length) : 0}
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">Dossiers/garage</p>
        </div>
        <div className="bg-gradient-to-r from-[#1454FF] to-[#0040CC] rounded-2xl p-5 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[var(--white)] rounded-xl flex items-center justify-center">
              <Users size={20} className="text-[var(--ink)]" />
            </div>
            <span className="text-xs text-[var(--ink)]/70">Actifs</span>
          </div>
          <p className="text-3xl font-bold text-[var(--ink)]">{garages.filter(g => g.is_active !== false).length}</p>
          <p className="text-xs text-[var(--ink)]/70 mt-1">Garages actifs</p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-[var(--white)] rounded-2xl border border-[var(--stone)] shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
          <input 
            type="text"
            placeholder="Rechercher un garage par nom, responsable, email ou SIRET..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--white)]/40 border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#1454FF] transition-all"
          />
        </div>
      </div>

      {/* Liste des garages */}
      {garages.length === 0 && !error ? (
        <div className="bg-[var(--white)] rounded-2xl border border-[var(--stone)] p-12 text-center">
          <Building2 size={48} className="text-[var(--muted)] mx-auto mb-4 opacity-50" />
          <p className="text-[var(--muted)] font-medium">Aucun garage trouvé</p>
          <p className="text-sm text-[var(--muted)] mt-1">
            Vérifiez que vous êtes bien connecté en tant que gestionnaire
          </p>
          <button 
            onClick={fetchGarages}
            className="mt-4 px-4 py-2 bg-[var(--blue)] text-[var(--ink)] rounded-xl text-sm font-medium hover:bg-[#0ea5e9] transition-colors"
          >
            Rafraîchir
          </button>
        </div>
      ) : garagesFiltres.length === 0 ? (
        <div className="bg-[var(--white)] rounded-2xl border border-[var(--stone)] p-12 text-center">
          <Building2 size={48} className="text-[var(--muted)] mx-auto mb-4 opacity-50" />
          <p className="text-[var(--muted)] font-medium">Aucun garage correspondant à votre recherche</p>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-2 text-[var(--blue)] text-sm hover:underline"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {garagesFiltres.map((garage) => {
            const isExpanded = expandedId === garage.id;
            const logoUrl = garage.logo_url
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${garage.logo_url}`
              : null;
            return (
              <div key={garage.id} className="bg-[#0D1B2A] rounded-2xl border border-[#1E3A5F] shadow-lg overflow-hidden transition-all duration-300 flex flex-col">
                {/* Logo + Nom */}
                <div className="flex flex-col items-center pt-8 pb-5 px-5 gap-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-white flex items-center justify-center border border-[#1E3A5F] shadow-md">
                    {logoUrl ? (
                      <img src={logoUrl} alt={garage.nom_garage} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-[#112233] flex items-center justify-center">
                        <Building2 size={32} className="text-[#18CDEC]" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-[#18CDEC] font-bold text-center text-sm uppercase tracking-wide leading-tight">
                    {garage.nom_garage || 'Sans nom'}
                  </h3>
                </div>

                {/* Bouton accordéon */}
                <div className="px-4 pb-4">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : garage.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#1E3A5F] text-[#A0B4C8] text-xs font-semibold hover:bg-[#1E3A5F]/40 transition-all"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExpanded ? 'Masquer les détails' : 'Voir les détails'}
                  </button>
                </div>

                {/* Détails dépliables */}
                {isExpanded && (
                  <div className="border-t border-[#1E3A5F] px-5 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start gap-3">
                      <Eye size={14} className="text-[#18CDEC] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#6B8299] uppercase tracking-wider font-semibold">Responsable</p>
                        <p className="text-sm text-white font-medium">{garage.responsable || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail size={14} className="text-[#18CDEC] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#6B8299] uppercase tracking-wider font-semibold">Email</p>
                        <p className="text-sm text-white font-medium break-all">{garage.email_contact || garage.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone size={14} className="text-[#18CDEC] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#6B8299] uppercase tracking-wider font-semibold">Téléphone</p>
                        <p className="text-sm text-white font-medium">{garage.telephone || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin size={14} className="text-[#18CDEC] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#6B8299] uppercase tracking-wider font-semibold">Adresse</p>
                        <p className="text-sm text-white font-medium">{garage.adresse || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileText size={14} className="text-[#18CDEC] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#6B8299] uppercase tracking-wider font-semibold">SIRET</p>
                        <p className="text-sm text-[#18CDEC] font-mono font-bold">{garage.siret || '—'}</p>
                      </div>
                    </div>

                    {/* Section Documents Légaux & Banque (Onboarding) */}
                    <div className="pt-3 border-t border-[#1E3A5F] space-y-3">
                      <p className="text-[10px] text-[#6B8299] uppercase tracking-wider font-bold">Documents d'activation & Banques</p>
                      
                      {/* IBAN & BIC */}
                      {(garage.iban || garage.bic) && (
                        <div className="bg-[#0B172A] p-3 rounded-xl border border-[#1E3A5F] space-y-1.5">
                          {garage.iban && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#6B8299] font-medium">IBAN :</span>
                              <span className="font-mono font-bold text-[#18CDEC]">{garage.iban}</span>
                            </div>
                          )}
                          {garage.bic && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#6B8299] font-medium">BIC / SWIFT :</span>
                              <span className="font-mono text-white">{garage.bic}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Liens vers les documents (KBIS, RIB, CNI) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {garage.kbis_url || garage.onboarding_kbis_url ? (
                          <a
                            href={garage.kbis_url || garage.onboarding_kbis_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold transition-all group"
                          >
                            <FileText size={14} className="text-indigo-400 shrink-0" />
                            <span className="truncate">Extrait KBIS</span>
                            <Download size={12} className="ml-auto opacity-70 group-hover:opacity-100" />
                          </a>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 border border-slate-700/50 text-slate-400 rounded-xl text-xs">
                            <FileText size={14} className="shrink-0 opacity-50" />
                            <span className="truncate">KBIS : Non fourni</span>
                          </div>
                        )}

                        {garage.rib_url || garage.onboarding_rib_url ? (
                          <a
                            href={garage.rib_url || garage.onboarding_rib_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold transition-all group"
                          >
                            <Landmark size={14} className="text-emerald-400 shrink-0" />
                            <span className="truncate">Justificatif RIB</span>
                            <Download size={12} className="ml-auto opacity-70 group-hover:opacity-100" />
                          </a>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 border border-slate-700/50 text-slate-400 rounded-xl text-xs">
                            <Landmark size={14} className="shrink-0 opacity-50" />
                            <span className="truncate">RIB : Non fourni</span>
                          </div>
                        )}

                        {garage.cni_url || garage.onboarding_cni_url ? (
                          <a
                            href={garage.cni_url || garage.onboarding_cni_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 rounded-xl text-xs font-semibold transition-all group"
                          >
                            <ShieldCheck size={14} className="text-sky-400 shrink-0" />
                            <span className="truncate">Pièce d'Identité</span>
                            <Download size={12} className="ml-auto opacity-70 group-hover:opacity-100" />
                          </a>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 border border-slate-700/50 text-slate-400 rounded-xl text-xs">
                            <ShieldCheck size={14} className="shrink-0 opacity-50" />
                            <span className="truncate">CNI : Non fournie</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#1E3A5F] flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FolderKanban size={14} className="text-[#18CDEC]" />
                        <span className="text-sm text-white font-bold">{dossiersCount[garage.id] || 0} dossier(s)</span>
                      </div>
                      <Link
                        href={`/gestionnaire/dossiers?garage_id=${garage.id}`}
                        className="text-[#18CDEC] text-xs font-semibold flex items-center gap-1 hover:opacity-75 transition-opacity"
                      >
                        Voir <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Résumé des dossiers par garage (affichage supplémentaire) */}
      {garages.length > 0 && (
        <div className="bg-[var(--white)] rounded-2xl border border-[var(--stone)] p-5 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-[var(--blue)]" />
            <h3 className="font-semibold text-[var(--ink)]">Classement des garages par nombre de dossiers</h3>
          </div>
          <div className="space-y-3">
            {[...garages]
              .sort((a, b) => (dossiersCount[b.id] || 0) - (dossiersCount[a.id] || 0))
              .slice(0, 5)
              .map((garage, index) => (
                <div key={garage.id} className="flex items-center justify-between p-3 bg-[var(--white)]/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--blue)]/10 flex items-center justify-center text-xs font-bold text-[var(--blue)]">
                      {index + 1}
                    </div>
                    <span className="font-medium text-[var(--ink)]">{garage.nom_garage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--blue)] text-lg">{dossiersCount[garage.id] || 0}</span>
                    <span className="text-xs text-[var(--muted)]">dossier(s)</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}