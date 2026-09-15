"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, User, Phone, Mail, MapPin, 
  FileText, Loader2, ChevronRight, Users,
  Building2, Car, FolderOpen, Sparkles,
  Star, Award, TrendingUp
} from 'lucide-react';

export default function ListeClients() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: garage } = await supabase
        .from('garages')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!garage) return;

      const { data: dossiers, error } = await supabase
        .from('dossiers')
        .select(`
          immatriculation,
          clients (*)
        `)
        .eq('garage_id', garage.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const clientsMap = new Map();
      
      dossiers.forEach(dossier => {
        const c = dossier.clients;
        if (!c) return;
        
        if (!clientsMap.has(c.id)) {
          clientsMap.set(c.id, { 
            ...c, 
            vehicules: new Set([dossier.immatriculation]),
            nb_dossiers: 1
          });
        } else {
          const existing = clientsMap.get(c.id);
          existing.vehicules.add(dossier.immatriculation);
          existing.nb_dossiers += 1;
        }
      });

      const uniqueClients = Array.from(clientsMap.values()).map(c => ({
        ...c,
        vehicules: Array.from(c.vehicules)
      }));

      setClients(uniqueClients);

    } catch (error) {
      console.error('Erreur chargement des clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const clientsFiltres = clients.filter(client => {
    const searchStr = `${client.nom} ${client.prenom} ${client.telephone} ${client.email} ${client.vehicules.join(' ')}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const handleFilterDossiers = (client) => {
    const searchQuery = encodeURIComponent(`${client.prenom} ${client.nom}`);
    router.push(`/dashboard/dossiers?search=${searchQuery}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-[var(--blue)] rounded-full animate-ping opacity-20"></div>
            <Loader2 size={48} className="animate-spin text-[var(--blue)] mx-auto relative z-10" />
          </div>
          <p className="text-[var(--muted)] font-light">Chargement de votre répertoire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* En-tête */}
      <div>
        <div className="inline-flex items-center gap-2 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] shadow-md rounded-full px-4 py-2 mb-6 border border-[var(--stone)]">
          <Sparkles size={14} className="text-[var(--blue)]" />
          <span className="text-xs font-medium text-[var(--blue)] uppercase tracking-wider">Carnet de clients</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif text-[var(--ink)] mb-2">Répertoire clients</h1>
        <p className="text-[var(--muted)] font-light">Gérez vos contacts et leur historique d'interventions</p>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl p-5 border border-[var(--stone)] shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[var(--blue)]/10 rounded-xl flex items-center justify-center">
              <Users size={18} className="text-[var(--blue)]" />
            </div>
            <span className="text-xs text-[var(--muted)] font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold text-[var(--ink)]">{clients.length}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Clients actifs</p>
        </div>
        <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl p-5 border border-[var(--stone)] shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[var(--blue)]/10 rounded-xl flex items-center justify-center">
              <FileText size={18} className="text-[var(--blue)]" />
            </div>
            <span className="text-xs text-[var(--muted)] font-medium">Dossiers</span>
          </div>
          <p className="text-2xl font-bold text-[var(--ink)]">{clients.reduce((acc, c) => acc + c.nb_dossiers, 0)}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Interventions totales</p>
        </div>
        <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl p-5 border border-[var(--stone)] shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[var(--blue)]/10 rounded-xl flex items-center justify-center">
              <Car size={18} className="text-[var(--blue)]" />
            </div>
            <span className="text-xs text-[var(--muted)] font-medium">Véhicules</span>
          </div>
          <p className="text-2xl font-bold text-[var(--ink)]">{clients.reduce((acc, c) => acc + c.vehicules.length, 0)}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Véhicules suivis</p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl border border-[var(--stone)] shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher par nom, téléphone, email ou plaque d'immatriculation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--white)]/40 border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/10 transition-all placeholder:text-[var(--muted)]"
          />
        </div>
      </div>

      {/* Liste des clients */}
      {clientsFiltres.length === 0 ? (
        <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl border border-[var(--stone)] p-12 text-center">
          <div className="w-16 h-16 bg-[var(--white)] rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-[var(--muted)]" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">Aucun client trouvé</h3>
          <p className="text-[var(--muted)] text-sm">Modifiez votre recherche ou créez un nouveau dossier</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {clientsFiltres.map((client) => (
            <div key={client.id} className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl border border-[var(--stone)] shadow-md hover:shadow-md hover:border-[#1454FF]/30 transition-all duration-300 overflow-hidden group">
              
              {/* En-tête de la carte */}
              <div className="p-5 border-b border-[var(--stone)] bg-gradient-to-b from-[#FAFAF8] to-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#18170F] rounded-2xl flex items-center justify-center shadow-md text-white font-serif italic text-xl group-hover:scale-105 transition-transform">
                      {client.prenom?.charAt(0)}{client.nom?.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--ink)] line-clamp-1">
                        {client.prenom} {client.nom}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--blue)]/10 text-[var(--blue)] rounded-lg text-xs font-medium">
                          <FileText size={10} /> {client.nb_dossiers} dossier{client.nb_dossiers > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Corps de la carte */}
              <div className="p-5 space-y-4">
                
                {/* Véhicules */}
                {client.vehicules.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-[var(--blue)]/10 rounded-lg">
                      <Car size={14} className="text-[var(--blue)]" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {client.vehicules.map((plaque, i) => (
                        <span key={i} className="px-2 py-1 bg-[var(--white)] text-[var(--ink)] text-xs font-mono font-medium rounded border border-[var(--stone)]">
                          {plaque}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Téléphone */}
                {client.telephone && (
                  <a href={`tel:${client.telephone}`} className="flex items-center gap-3 text-[var(--muted)] hover:text-[var(--blue)] transition-colors group/link">
                    <div className="p-1.5 bg-[var(--white)] rounded-lg group-hover/link:bg-[var(--blue)]/10 transition-colors">
                      <Phone size={14} className="text-[var(--muted)] group-hover/link:text-[var(--blue)]" />
                    </div>
                    <span className="text-sm font-medium">{client.telephone}</span>
                  </a>
                )}

                {/* Email */}
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-3 text-[var(--muted)] hover:text-[var(--blue)] transition-colors group/link">
                    <div className="p-1.5 bg-[var(--white)] rounded-lg group-hover/link:bg-[var(--blue)]/10 transition-colors">
                      <Mail size={14} className="text-[var(--muted)] group-hover/link:text-[var(--blue)]" />
                    </div>
                    <span className="text-sm font-medium truncate">{client.email}</span>
                  </a>
                )}

                {/* Adresse */}
                {client.adresse && (
                  <div className="flex items-start gap-3 text-[var(--muted)]">
                    <div className="mt-0.5 p-1.5 bg-[var(--white)] rounded-lg">
                      <MapPin size={14} className="text-[var(--muted)]" />
                    </div>
                    <span className="text-sm font-medium leading-relaxed line-clamp-2">{client.adresse}</span>
                  </div>
                )}
              </div>

              {/* Bouton d'action */}
              <div className="px-5 py-3 bg-[var(--white)]/40 border-t border-[var(--stone)]">
                <button 
                  onClick={() => handleFilterDossiers(client)}
                  className="w-full py-2 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] hover:bg-[var(--blue)]/10 text-[var(--blue)] text-sm font-medium rounded-xl border border-[var(--stone)] hover:border-[#1454FF] transition-all flex items-center justify-center gap-2"
                >
                  <FolderOpen size={14} />
                  Voir ses dossiers <ChevronRight size={12} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-[var(--muted)] pt-4">
        <span>{clientsFiltres.length} client(s) affiché(s)</span>
        <div className="flex items-center gap-1">
          <Sparkles size={10} className="text-[var(--blue)]" />
          <span>GlassPilot Pro</span>
        </div>
      </div>
    </div>
  );
}