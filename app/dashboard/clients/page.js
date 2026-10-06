"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, User, Phone, Mail, MapPin, 
  FileText, Loader2, ChevronRight, Users,
  Building2, Car, FolderOpen, Sparkles,
  Calendar, ShieldCheck
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
          id,
          numero,
          immatriculation,
          modele_vehicule,
          created_at,
          clients (*)
        `)
        .eq('garage_id', garage.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const clientsMap = new Map();
      
      dossiers?.forEach(dossier => {
        const c = dossier.clients;
        if (!c) return;
        
        const vehiculeInfo = dossier.immatriculation 
          ? `${dossier.immatriculation}${dossier.modele_vehicule ? ` (${dossier.modele_vehicule})` : ''}`
          : null;

        if (!clientsMap.has(c.id)) {
          clientsMap.set(c.id, { 
            ...c, 
            vehicules: vehiculeInfo ? [vehiculeInfo] : [],
            nb_dossiers: 1,
            dernier_dossier: dossier.numero || null,
            derniere_date: dossier.created_at || c.created_at
          });
        } else {
          const existing = clientsMap.get(c.id);
          if (vehiculeInfo && !existing.vehicules.includes(vehiculeInfo)) {
            existing.vehicules.push(vehiculeInfo);
          }
          existing.nb_dossiers += 1;
        }
      });

      setClients(Array.from(clientsMap.values()));

    } catch (error) {
      console.error('Erreur chargement des clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const clientsFiltres = clients.filter(client => {
    const fullAdresse = `${client.adresse || ''} ${client.code_postal || ''} ${client.ville || ''}`;
    const searchStr = `${client.nom || ''} ${client.prenom || ''} ${client.telephone || ''} ${client.email || ''} ${fullAdresse} ${client.vehicules.join(' ')}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const handleFilterDossiers = (client) => {
    const searchQuery = encodeURIComponent(`${client.nom || ''}`);
    router.push(`/dashboard/dossiers?search=${searchQuery}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-[#1454FF] rounded-full animate-ping opacity-20"></div>
            <Loader2 size={48} className="animate-spin text-[#1454FF] mx-auto relative z-10" />
          </div>
          <p className="text-slate-400 font-medium">Chargement du répertoire clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#1454FF]/10 rounded-full px-3.5 py-1.5 mb-3 border border-[#1454FF]/20">
            <Users size={14} className="text-[#1454FF]" />
            <span className="text-xs font-bold text-[#1454FF] uppercase tracking-wider">Répertoire clients</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--ink)] tracking-tight">Répertoire clients du garage</h1>
          <p className="text-slate-500 text-sm mt-1">Consultez et retrouvez l'ensemble des coordonnées et véhicules de vos clients</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/dossiers/nouveau"
            className="px-4 py-2.5 bg-[#1454FF] hover:bg-[#1060ff] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-[#1454FF]/20 flex items-center gap-2"
          >
            <FolderOpen size={16} />
            Nouveau dossier
          </Link>
        </div>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[var(--white)] rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#1454FF]">
              <Users size={20} />
            </div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total</span>
          </div>
          <p className="text-3xl font-extrabold text-[var(--ink)]">{clients.length}</p>
          <p className="text-xs text-slate-500 mt-1">Client(s) enregistré(s)</p>
        </div>
        <div className="bg-[var(--white)] rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <FileText size={20} />
            </div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Interventions</span>
          </div>
          <p className="text-3xl font-extrabold text-[var(--ink)]">{clients.reduce((acc, c) => acc + c.nb_dossiers, 0)}</p>
          <p className="text-xs text-slate-500 mt-1">Dossiers créés au total</p>
        </div>
        <div className="bg-[var(--white)] rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
              <Car size={20} />
            </div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Véhicules</span>
          </div>
          <p className="text-3xl font-extrabold text-[var(--ink)]">{clients.reduce((acc, c) => acc + c.vehicules.length, 0)}</p>
          <p className="text-xs text-slate-500 mt-1">Véhicules répertoriés</p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-[var(--white)] rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher par nom, prénom, téléphone, ville, code postal, immatriculation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--white)] border border-slate-200 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/10 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Liste des clients */}
      {clientsFiltres.length === 0 ? (
        <div className="bg-[var(--white)] rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-slate-400" size={28} />
          </div>
          <h3 className="text-lg font-bold text-[var(--ink)] mb-2">Aucun client trouvé</h3>
          <p className="text-slate-500 text-sm">Modifiez votre recherche ou créez un nouveau dossier</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {clientsFiltres.map((client) => {
            const initiales = `${client.prenom?.charAt(0) || ''}${client.nom?.charAt(0) || ''}`.toUpperCase() || 'CL';
            const fullAdresse = [
              client.adresse,
              [client.code_postal, client.ville].filter(Boolean).join(' ')
            ].filter(Boolean).join(', ');

            return (
              <div key={client.id} className="bg-[var(--white)] rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#1454FF]/40 transition-all duration-300 overflow-hidden flex flex-col justify-between group">
                
                {/* En-tête de la carte */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1454FF] to-indigo-700 text-white font-bold text-base flex items-center justify-center shadow-md shadow-[#1454FF]/20 shrink-0 group-hover:scale-105 transition-transform">
                        {initiales}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-[var(--ink)] truncate group-hover:text-[#1454FF] transition-colors">
                          {client.prenom ? `${client.prenom} ${client.nom}` : client.nom}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#1454FF] rounded-md text-xs font-semibold">
                            <FileText size={11} /> {client.nb_dossiers} dossier{client.nb_dossiers > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Corps de la carte avec les informations complètes */}
                <div className="p-5 space-y-3.5 flex-1">
                  
                  {/* Téléphone */}
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                      <Phone size={14} className="text-[#1454FF]" />
                    </div>
                    {client.telephone ? (
                      <a href={`tel:${client.telephone}`} className="text-sm font-semibold hover:text-[#1454FF] transition-colors">
                        {client.telephone}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Téléphone non renseigné</span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                      <Mail size={14} className="text-[#1454FF]" />
                    </div>
                    {client.email ? (
                      <a href={`mailto:${client.email}`} className="text-sm font-medium hover:text-[#1454FF] truncate transition-colors">
                        {client.email}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Email non renseigné</span>
                    )}
                  </div>

                  {/* Adresse complète */}
                  <div className="flex items-start gap-3 text-slate-600">
                    <div className="p-2 bg-slate-100 rounded-lg shrink-0 mt-0.5">
                      <MapPin size={14} className="text-[#1454FF]" />
                    </div>
                    {fullAdresse ? (
                      <span className="text-xs font-medium leading-relaxed line-clamp-2 text-slate-700">
                        {fullAdresse}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Adresse non renseignée</span>
                    )}
                  </div>

                  {/* Véhicules & Immatriculations */}
                  {client.vehicules && client.vehicules.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                        <Car size={13} className="text-teal-600" />
                        <span>Véhicule(s) :</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {client.vehicules.map((veh, idx) => (
                          <span 
                            key={idx}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-[var(--ink)] text-xs font-mono font-bold rounded-lg border border-slate-200 transition-colors"
                          >
                            {veh}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bouton d'action pour voir les dossiers du client */}
                <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100">
                  <button 
                    onClick={() => handleFilterDossiers(client)}
                    className="w-full py-2 bg-white hover:bg-[#1454FF] hover:text-white text-[#1454FF] text-xs font-bold rounded-xl border border-slate-200 hover:border-[#1454FF] transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <FolderOpen size={14} />
                    Consulter ses dossiers ({client.nb_dossiers})
                    <ChevronRight size={13} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-slate-400 pt-4 border-t border-slate-200">
        <span>{clientsFiltres.length} client(s) répertorié(s)</span>
        <div className="flex items-center gap-1">
          <Sparkles size={11} className="text-[#1454FF]" />
          <span>GlassPilot Répertoire</span>
        </div>
      </div>
    </div>
  );
}