"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, User, Phone, Mail, MapPin, 
  FileText, Loader2, ChevronRight, Users,
  Car, FolderOpen, Sparkles, Plus,
  ShieldCheck, ArrowUpRight
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
    const searchStr = `${client.nom || ''} ${client.prenom || ''} ${client.telephone || ''} ${client.email || ''} ${fullAdresse} ${client.vehicules?.join(' ') || ''}`.toLowerCase();
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
            <div className="absolute inset-0 bg-[#00d4ff] rounded-full animate-ping opacity-20"></div>
            <Loader2 size={48} className="animate-spin text-[#00d4ff] mx-auto relative z-10" />
          </div>
          <p className="text-slate-300 font-medium">Chargement du répertoire clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-10">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#00d4ff]/10 rounded-full px-3.5 py-1.5 mb-3 border border-[#00d4ff]/30 shadow-sm">
            <Users size={14} className="text-[#00d4ff]" />
            <span className="text-xs font-bold text-[#00d4ff] uppercase tracking-wider">Répertoire clients</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Répertoire clients du garage</h1>
          <p className="text-slate-400 text-sm mt-1">Consultez et retrouvez l'ensemble des coordonnées et véhicules de vos clients</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/dossiers/nouveau"
            className="px-4 py-2.5 bg-[#1454FF] hover:bg-[#1060ff] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#1454FF]/30 flex items-center gap-2"
          >
            <Plus size={16} />
            Nouveau dossier
          </Link>
        </div>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#0d1428] rounded-2xl p-5 border border-[#1e2d4a] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#1454FF]/20 rounded-xl flex items-center justify-center text-[#00d4ff] border border-[#00d4ff]/30">
              <Users size={20} />
            </div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{clients.length}</p>
          <p className="text-xs text-slate-400 mt-1">Client(s) enregistré(s)</p>
        </div>

        <div className="bg-[#0d1428] rounded-2xl p-5 border border-[#1e2d4a] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#1454FF]/20 rounded-xl flex items-center justify-center text-[#00d4ff] border border-[#00d4ff]/30">
              <FileText size={20} />
            </div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Interventions</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{clients.reduce((acc, c) => acc + (c.nb_dossiers || 0), 0)}</p>
          <p className="text-xs text-slate-400 mt-1">Dossiers créés au total</p>
        </div>

        <div className="bg-[#0d1428] rounded-2xl p-5 border border-[#1e2d4a] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#1454FF]/20 rounded-xl flex items-center justify-center text-[#00d4ff] border border-[#00d4ff]/30">
              <Car size={20} />
            </div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Véhicules</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{clients.reduce((acc, c) => acc + (c.vehicules?.length || 0), 0)}</p>
          <p className="text-xs text-slate-400 mt-1">Véhicules répertoriés</p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] shadow-lg p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher par nom, prénom, téléphone, email, adresse, immatriculation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#111c35] border border-[#1e2d4a] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/30 transition-all"
          />
        </div>
      </div>

      {/* Liste des clients */}
      {clientsFiltres.length === 0 ? (
        <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] p-12 text-center shadow-lg">
          <div className="w-16 h-16 bg-[#111c35] border border-[#1e2d4a] rounded-full flex items-center justify-center mx-auto mb-4 text-[#00d4ff]">
            <User size={28} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Aucun client trouvé</h3>
          <p className="text-slate-400 text-sm">Modifiez votre recherche ou créez un nouveau dossier</p>
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
              <div 
                key={client.id} 
                className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] hover:border-[#00d4ff]/50 shadow-lg hover:shadow-xl hover:shadow-[#00d4ff]/10 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                
                {/* En-tête de la carte */}
                <div className="p-5 border-b border-[#1e2d4a] bg-[#111c35]">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1454FF] to-[#00d4ff] text-white font-extrabold text-base flex items-center justify-center shadow-md shadow-[#1454FF]/30 shrink-0 group-hover:scale-105 transition-transform">
                      {initiales}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold text-white truncate group-hover:text-[#00d4ff] transition-colors">
                        {client.prenom ? `${client.prenom} ${client.nom}` : client.nom}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] rounded-md text-xs font-semibold">
                          <FileText size={12} /> {client.nb_dossiers} dossier{client.nb_dossiers > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Corps de la carte */}
                <div className="p-5 space-y-3.5 flex-1 bg-[#0d1428]">
                  
                  {/* Téléphone */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#111c35] border border-[#1e2d4a] text-[#00d4ff] shrink-0">
                      <Phone size={14} />
                    </div>
                    {client.telephone ? (
                      <a 
                        href={`tel:${client.telephone}`} 
                        className="text-sm font-semibold text-slate-200 hover:text-[#00d4ff] transition-colors"
                      >
                        {client.telephone}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Téléphone non renseigné</span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#111c35] border border-[#1e2d4a] text-[#00d4ff] shrink-0">
                      <Mail size={14} />
                    </div>
                    {client.email ? (
                      <a 
                        href={`mailto:${client.email}`} 
                        className="text-sm font-medium text-slate-300 hover:text-[#00d4ff] truncate transition-colors"
                      >
                        {client.email}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Email non renseigné</span>
                    )}
                  </div>

                  {/* Adresse complète */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#111c35] border border-[#1e2d4a] text-[#00d4ff] shrink-0 mt-0.5">
                      <MapPin size={14} />
                    </div>
                    {fullAdresse ? (
                      <span className="text-xs font-medium leading-relaxed text-slate-300 line-clamp-2">
                        {fullAdresse}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Adresse non renseignée</span>
                    )}
                  </div>

                  {/* Véhicules & Immatriculations */}
                  {client.vehicules && client.vehicules.length > 0 && (
                    <div className="pt-3 border-t border-[#1e2d4a]/80">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
                        <Car size={13} className="text-[#00d4ff]" />
                        <span>Véhicule(s) :</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {client.vehicules.map((veh, idx) => (
                          <span 
                            key={idx}
                            className="px-2.5 py-1 bg-[#16223d] hover:bg-[#1f3054] text-[#00d4ff] text-xs font-mono font-bold rounded-lg border border-[#25375c] transition-colors"
                          >
                            {veh}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bouton d'action pour voir les dossiers du client */}
                <div className="p-4 bg-[#111c35]/80 border-t border-[#1e2d4a]">
                  <button 
                    onClick={() => handleFilterDossiers(client)}
                    className="w-full py-2.5 px-4 bg-[#1454FF] hover:bg-[#1060ff] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-[#1454FF]/25 hover:shadow-[#1454FF]/40 cursor-pointer"
                  >
                    <FolderOpen size={14} />
                    Voir ses dossiers ({client.nb_dossiers})
                    <ChevronRight size={13} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-slate-400 pt-4 border-t border-[#1e2d4a]">
        <span>{clientsFiltres.length} client(s) répertorié(s)</span>
        <div className="flex items-center gap-1">
          <Sparkles size={11} className="text-[#00d4ff]" />
          <span>GlassPilot Répertoire</span>
        </div>
      </div>
    </div>
  );
}