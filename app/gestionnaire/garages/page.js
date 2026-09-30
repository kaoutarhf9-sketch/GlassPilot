"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Search, Building2, Phone, Mail, MapPin, 
  FileText, Users, Calendar, Loader2, ChevronRight,
  Sparkles, Eye, AlertCircle, CheckCircle2, XCircle,
  TrendingUp, FolderKanban
} from 'lucide-react';

export default function GaragesPage() {
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dossiersCount, setDossiersCount] = useState({});
  const [totalDossiers, setTotalDossiers] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGarages();
  }, []);

  const fetchGarages = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Erreur utilisateur:', userError);
        setError(`Erreur utilisateur: ${userError.message}`);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {garagesFiltres.map((garage) => {
            const kbisUrl = garage.onboarding_kbis_url ? supabase.storage.from('documents').getPublicUrl(garage.onboarding_kbis_url).data.publicUrl : null;
            const ribUrl = garage.onboarding_rib_url ? supabase.storage.from('documents').getPublicUrl(garage.onboarding_rib_url).data.publicUrl : null;
            
            return (
            <div key={garage.id} className="bg-[var(--white)] rounded-2xl border border-[var(--stone)] shadow-md hover:shadow-md transition-all overflow-hidden group">
              {/* En-tête avec initiales */}
              <div className="p-5 border-b border-[var(--stone)] bg-[var(--white)]/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#18170F] rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-[var(--ink)] font-serif italic text-lg">
                      {garage.nom_garage?.charAt(0).toUpperCase() || 'G'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[var(--ink)]">{garage.nom_garage || 'Sans nom'}</h3>
                      {garage.is_active !== false ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-medium">
                          <CheckCircle2 size={8} /> Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-medium">
                          <XCircle size={8} /> Inactif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{garage.responsable || 'Responsable non renseigné'}</p>
                  </div>
                </div>
              </div>

              {/* Corps avec infos */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Phone size={14} />
                  <span>{garage.telephone || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Mail size={14} />
                  <span className="truncate">{garage.email_contact || garage.email || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <MapPin size={14} />
                  <span className="truncate">{garage.adresse || 'Non renseignée'}</span>
                </div>
                {garage.siret && (
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <FileText size={14} />
                    <span className="font-mono text-xs">{garage.siret}</span>
                  </div>
                )}
                
                {/* Documents du Garage */}
                {(kbisUrl || ribUrl) && (
                  <div className="flex items-center gap-3 pt-2">
                    {kbisUrl && (
                      <a href={kbisUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-50/10 hover:bg-[var(--blue)]/20 text-[var(--blue)] border border-[var(--stone)] rounded-lg text-xs font-semibold transition-colors">
                        <FileText size={12} /> KBIS
                      </a>
                    )}
                    {ribUrl && (
                      <a href={ribUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-50/10 hover:bg-[var(--blue)]/20 text-[var(--blue)] border border-[var(--stone)] rounded-lg text-xs font-semibold transition-colors">
                        <FileText size={12} /> RIB
                      </a>
                    )}
                  </div>
                )}
                
                {/* Compteur de dossiers avec design mis en avant */}
                <div className="mt-3 pt-3 border-t border-[var(--stone)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[var(--blue)]/10 rounded-lg flex items-center justify-center">
                        <FolderKanban size={14} className="text-[var(--blue)]" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--muted)]">Nombre de dossiers</p>
                        <p className="text-2xl font-bold text-[var(--ink)]">{dossiersCount[garage.id] || 0}</p>
                      </div>
                    </div>
                    <Link 
                      href={`/gestionnaire/dossiers?garage_id=${garage.id}`}
                      className="text-[var(--blue)] hover:text-[#0ea5e9] text-sm font-medium flex items-center gap-1 transition-all"
                    >
                      Voir les dossiers <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Footer avec lien détails */}
              <div className="px-5 py-3 bg-[var(--white)]/40 border-t border-[var(--stone)]">
                <Link 
                  href={`/gestionnaire/garages/${garage.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-[var(--blue)] hover:bg-[var(--white)] rounded-xl transition-all border border-transparent hover:border-[var(--stone)]"
                >
                  Voir les détails du garage
                  <Eye size={14} />
                </Link>
              </div>
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