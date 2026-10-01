"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Search, Mail, User, Phone, MapPin, 
  FileText, Building2, Loader2, CheckCircle2, 
  AlertCircle, Trash2, Copy, Check, ChevronLeft, ChevronRight, CalendarDays,
  ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';

export default function GaragesPage() {
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchError, setFetchError] = useState(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    prenom: '',
    responsable: '',
    nom_garage: '',
    email: '',
    telephone: '',
    adresse: '',
    siret: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const [expandedId, setExpandedId] = useState(null);

  // Delete modal states
  const [garageToDelete, setGarageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selected Garage State for Dossiers View
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [dossiers, setDossiers] = useState([]);
  const [gestionnaires, setGestionnaires] = useState([]);
  const [loadingDossiers, setLoadingDossiers] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchGarages();
    fetchGestionnaires();
  }, []);

  useEffect(() => {
    if (selectedGarage) {
      fetchDossiersForGarage(selectedGarage.id);
    }
  }, [selectedGarage]);

  const fetchGarages = async () => {
    setFetchError(null);
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('garages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGarages(data || []);
    } catch (err) {
      console.error('Erreur chargement garages:', err);
      setFetchError(err.message || 'Impossible de récupérer la liste des garages');
    } finally {
      setLoading(false);
    }
  };

  const fetchGestionnaires = async () => {
    try {
      const { data, error } = await supabase
        .from('gestionnaires')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      setGestionnaires(data || []);
    } catch (err) {
      console.error('Erreur chargement gestionnaires:', err);
    }
  };

  const fetchDossiersForGarage = async (garageId) => {
    try {
      setLoadingDossiers(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) throw new Error("Session introuvable");

      const response = await fetch('/api/admin/dossiers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Erreur serveur");

      const { dossiers: dossiersData, clients: clientsData, managers: managersData } = resData;

      const clientsMap = {};
      clientsData?.forEach(c => { clientsMap[c.id] = c; });

      const managersMap = {};
      managersData?.forEach(m => { managersMap[m.id] = m; });

      const garageDossiers = (dossiersData || [])
        .filter(d => d.garage_id === garageId)
        .map(d => ({
          ...d,
          client: clientsMap[d.clients_id] || null,
          gestionnaire: managersMap[d.gestionnaire_id] || null
        }));

      setDossiers(garageDossiers);
    } catch (err) {
      console.error('Erreur chargement dossiers:', err);
    } finally {
      setLoadingDossiers(false);
    }
  };

  const handleAssignGestionnaire = async (dossierId, managerId) => {
    setUpdatingId(dossierId);
    try {
      const dbValue = managerId === "" ? null : managerId;
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) throw new Error("Session introuvable");

      const response = await fetch('/api/admin/dossiers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dossierId, gestionnaireId: dbValue })
      });

      if (!response.ok) throw new Error("Erreur lors de l'attribution");

      // Update state locally
      setDossiers(prev => prev.map(d => {
        if (d.id === dossierId) {
          return { ...d, gestionnaire_id: dbValue };
        }
        return d;
      }));
    } catch (err) {
      console.error('Erreur assignation:', err);
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredGarages = garages.filter(g => 
    `${g.nom_garage} ${g.responsable} ${g.email_contact} ${g.telephone} ${g.siret}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);
    setCopied(false);

    try {
      const response = await fetch('/api/admin/create-garagiste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          prenom: formData.prenom,
          responsable: formData.responsable,
          nom_garage: formData.nom_garage,
          telephone: formData.telephone,
          adresse: formData.adresse,
          siret: formData.siret
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Erreur lors de la création');

      setSubmitResult({ 
        type: 'success', 
        message: 'Compte garagiste créé avec succès !', 
        password: data.password 
      });
      
      fetchGarages();
    } catch (err) {
      setSubmitResult({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!garageToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/delete-garagiste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: garageToDelete.owner_id }),
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      setGarageToDelete(null);
      if (selectedGarage?.id === garageToDelete.id) {
        setSelectedGarage(null);
      }
      fetchGarages();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (selectedGarage) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
        {/* Header Back Button */}
        <button 
          onClick={() => setSelectedGarage(null)}
          className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--ink)] font-bold text-xs group transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--white)] border border-[var(--stone)] flex items-center justify-center group-hover:bg-[#E6E4DD] transition-all">
            <ChevronLeft size={16} />
          </div>
          Retour aux garages
        </button>

        {/* Garage Hero Details */}
        <div className="bg-[var(--white)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Building2 size={120} />
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-[var(--blue)]/10 text-[var(--blue)] rounded-2xl flex items-center justify-center border border-[#C2CFFF]">
                <Building2 size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-serif-premium text-[var(--ink)]">{selectedGarage.nom_garage}</h2>
                <div className="flex items-center gap-3 mt-1 text-xs font-semibold text-[var(--muted)]">
                  <span className="flex items-center gap-1.5"><User size={14} /> {selectedGarage.responsable}</span>
                  <span className="flex items-center gap-1.5"><Mail size={14} /> {selectedGarage.email_contact}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-[var(--white)]/40 border border-[var(--stone)] rounded-2xl text-center">
                <p className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">Téléphone</p>
                <p className="text-sm font-bold text-[var(--ink)] mt-0.5">{selectedGarage.telephone}</p>
              </div>
              <div className="px-4 py-2 bg-[var(--white)]/40 border border-[var(--stone)] rounded-2xl text-center">
                <p className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">SIRET</p>
                <p className="text-sm font-mono font-bold text-[var(--ink)] mt-0.5">{selectedGarage.siret}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dossiers List for this Garage */}
        <div className="bg-[var(--white)] rounded-3xl border border-[var(--stone)] shadow-md overflow-hidden">
          <div className="p-6 border-b border-[var(--stone)]/60 bg-[var(--white)]/40">
            <h3 className="text-lg font-bold font-serif-premium text-[var(--ink)] flex items-center gap-2">
              <FileText size={20} className="text-[var(--blue)]" /> Dossiers de ce garage
            </h3>
            <p className="text-xs text-[var(--muted)] font-semibold mt-1">Gérez et assignez les dossiers associés à {selectedGarage.nom_garage}.</p>
          </div>

          <div className="overflow-x-auto">
            {loadingDossiers ? (
              <div className="p-16 text-center">
                <Loader2 className="animate-spin text-[var(--blue)] mx-auto" size={24} />
                <p className="mt-3 text-xs font-semibold text-[var(--muted)]">Chargement des dossiers...</p>
              </div>
            ) : dossiers.length === 0 ? (
              <div className="p-16 text-center">
                <FileText size={40} className="mx-auto text-[var(--stone)] mb-4" />
                <p className="text-sm font-bold text-[var(--ink)]">Aucun dossier trouvé</p>
                <p className="text-xs text-[var(--muted)] mt-1 font-semibold">Ce garage n'a soumis aucun dossier pour le moment.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-[var(--stone)]/60 bg-[var(--white)]">
                    <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">Dossier</th>
                    <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">Client</th>
                    <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">Véhicule</th>
                    <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">Statut</th>
                    <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest w-[220px]">Gestionnaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E4DD]/40">
                  {dossiers.map(dossier => {
                    const isUnassigned = !dossier.gestionnaire_id;
                    return (
                      <tr key={dossier.id} className={clsx("group transition-colors", isUnassigned ? "bg-amber-50/10" : "hover:bg-[var(--white)]/40/80")}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-[var(--ink)] text-xs">{dossier.numero}</div>
                          <div className="text-[10px] text-[var(--muted)] font-semibold mt-0.5 uppercase">{dossier.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {dossier.client ? (
                            <div>
                              <div className="text-xs font-bold text-[var(--ink)]">{dossier.client.prenom} {dossier.client.nom}</div>
                              <div className="text-[10px] text-[var(--muted)] font-semibold">{dossier.client.telephone || '-'}</div>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-[var(--ink)] text-xs">{dossier.immatriculation || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-[var(--muted)] font-semibold">
                          {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                            {dossier.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {updatingId === dossier.id ? (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--muted)]">
                              <Loader2 size={12} className="animate-spin text-[var(--blue)]" /> Enregistrement...
                            </div>
                          ) : (
                            <select
                              value={dossier.gestionnaire_id || ""}
                              onChange={e => handleAssignGestionnaire(dossier.id, e.target.value)}
                              className={clsx(
                                "w-full px-3 py-2 bg-[var(--white)] border rounded-xl text-xs font-bold focus:outline-none focus:border-[#1454FF] cursor-pointer transition-all",
                                isUnassigned ? "border-amber-300 text-amber-700 bg-amber-50" : "border-[var(--stone)] text-[var(--ink)]"
                              )}
                            >
                              <option value="">⚠️ Non assigné</option>
                              {gestionnaires.map(g => (
                                <option key={g.id} value={g.id}>{g.prenom} {g.nom}</option>
                              ))}
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- GARAGES LIST VIEW (CARDS) ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--white)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md">
        <div>
          <h2 className="text-3xl font-serif-premium text-[var(--ink)]">Garages partenaires</h2>
          <p className="text-xs font-semibold text-[var(--muted)] mt-1.5">Consultez les fiches garages, analysez leurs dossiers et gérez leurs accès.</p>
        </div>
        <button
          onClick={() => { setIsModalOpen(true); setSubmitResult(null); setCopied(false); }}
          className="flex items-center gap-2 bg-[var(--blue)] hover:bg-[#003BDE] text-[var(--ink)] px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#1454FF]/10 hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus size={16} />
          Nouveau Garagiste
        </button>
      </div>

      <div className="relative max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={16} className="text-[var(--muted)]" />
        </div>
        <input
          type="text"
          placeholder="Rechercher par garage, responsable, SIRET, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-11 pr-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-2xl text-xs font-semibold placeholder-[#89867A] focus:outline-none focus:ring-2 focus:ring-[#1454FF]/10 focus:border-[#1454FF] transition-all shadow-sm"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin text-[var(--blue)] mx-auto" size={32} />
          <p className="mt-4 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Chargement des garages...</p>
        </div>
      ) : filteredGarages.length === 0 ? (
        <div className="py-20 text-center bg-[var(--white)] rounded-3xl border border-[var(--stone)]">
          <Building2 size={48} className="mx-auto text-[var(--stone)] mb-4" />
          <h3 className="text-lg font-bold text-[var(--ink)]">Aucun garage trouvé</h3>
          <p className="text-xs text-[var(--muted)] font-semibold mt-1">Ajustez vos filtres de recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGarages.map((garage) => {
            const isExpanded = expandedId === garage.id;
            return (
              <div
                key={garage.id}
                className="bg-[#0D1B2A] rounded-2xl border border-[#1E3A5F] shadow-lg overflow-hidden transition-all duration-300 flex flex-col"
              >
                {/* Logo + Nom */}
                <div className="flex flex-col items-center pt-8 pb-5 px-5 gap-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-white flex items-center justify-center border border-[#1E3A5F] shadow-md">
                    {garage.logo_url ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${garage.logo_url}`}
                        alt={garage.nom_garage}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#112233] flex items-center justify-center">
                        <Building2 size={32} className="text-[#18CDEC]" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-[#18CDEC] font-bold text-center text-sm uppercase tracking-wide leading-tight">
                    {garage.nom_garage}
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
                        <p className="text-sm text-white font-medium break-all">{garage.email_contact || '—'}</p>
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
                    <div className="pt-2 border-t border-[#1E3A5F] flex justify-between items-center">
                      <button
                        onClick={() => setSelectedGarage(garage)}
                        className="text-[#18CDEC] text-xs font-semibold flex items-center gap-1 hover:opacity-75 transition-opacity"
                      >
                        <FileText size={12} /> Voir les dossiers
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setGarageToDelete(garage); }}
                        className="p-1.5 text-[#6B8299] hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CRÉATION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#090D16]/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
          <div className="bg-[var(--white)] rounded-3xl max-w-lg w-full relative z-10 animate-in zoom-in-95 duration-200 border border-[var(--stone)] overflow-hidden">
            {/* Same form as before */}
            <div className="p-6 border-b border-[var(--stone)]/60 bg-[var(--white)]/40">
              <h3 className="text-xl font-bold font-serif-premium text-[var(--ink)]">Ajouter un Garagiste</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {submitResult ? (
                <div className={clsx("p-4 rounded-2xl border flex items-start gap-3", submitResult.type === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800")}>
                  {submitResult.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5" /> : <AlertCircle size={18} className="mt-0.5" />}
                  <div>
                    <p className="text-xs font-bold">{submitResult.message}</p>
                    {submitResult.password && (
                      <div className="mt-3 p-3 bg-white border border-emerald-200 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="text-[9px] font-bold text-[var(--muted)] uppercase">Mot de passe provisoire</p>
                          <p className="text-sm font-mono font-bold text-emerald-700">{submitResult.password}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-bold text-[var(--ink)] uppercase mb-1">Nom du garage</label>
                    <input type="text" required value={formData.nom_garage} onChange={e => setFormData({...formData, nom_garage: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--ink)] uppercase mb-1">SIRET</label>
                      <input type="text" required value={formData.siret} onChange={e => setFormData({...formData, siret: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-xs font-mono" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--ink)] uppercase mb-1">Téléphone</label>
                      <input type="text" required value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[var(--ink)] uppercase mb-1">Adresse</label>
                    <input type="text" required value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--ink)] uppercase mb-1">Prénom responsable</label>
                      <input type="text" required value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--ink)] uppercase mb-1">Nom responsable</label>
                      <input type="text" required value={formData.responsable} onChange={e => setFormData({...formData, responsable: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[var(--ink)] uppercase mb-1">Email de connexion</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-xs" />
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border rounded-xl text-xs font-bold uppercase hover:bg-gray-50 transition-colors">Annuler</button>
                {!submitResult && (
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-[#1454FF] text-[var(--ink)] rounded-xl text-xs font-bold uppercase hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Créer'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {garageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#090D16]/60 backdrop-blur-sm" onClick={() => !isDeleting && setGarageToDelete(null)}></div>
          <div className="bg-[var(--white)] rounded-3xl max-w-sm w-full relative z-10 p-8 text-center border border-[var(--stone)]">
            <Trash2 size={40} className="mx-auto text-rose-500 mb-4" />
            <h3 className="text-xl font-bold font-serif-premium text-[var(--ink)] mb-2">Supprimer le garage</h3>
            <p className="text-xs text-[var(--muted)] mb-6">Confirmez-vous la suppression de {garageToDelete.nom_garage} ?</p>
            <div className="flex gap-3">
              <button onClick={() => setGarageToDelete(null)} disabled={isDeleting} className="flex-1 py-2.5 border rounded-xl text-xs font-bold">Annuler</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 py-2.5 bg-rose-600 text-[var(--ink)] rounded-xl text-xs font-bold flex justify-center">
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
