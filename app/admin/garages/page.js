"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Search, Mail, User, Phone, MapPin, 
  FileText, Building2, Loader2, CheckCircle2, 
  AlertCircle, Trash2, Copy, Check 
} from 'lucide-react';
import clsx from 'clsx';

export default function GaragesPage() {
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchError, setFetchError] = useState(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    prenom: '',
    responsable: '', // Nom du responsable
    nom_garage: '',
    email: '',
    telephone: '',
    adresse: '',
    siret: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Delete modal states
  const [garageToDelete, setGarageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchGarages();
  }, []);

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
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du garagiste');
      }

      setSubmitResult({ 
        type: 'success', 
        message: 'Compte garagiste et garage créés avec succès ! Un email a été envoyé avec le mot de passe de connexion.', 
        password: data.password 
      });
      
      // Reset form
      setFormData({
        prenom: '',
        responsable: '',
        nom_garage: '',
        email: '',
        telephone: '',
        adresse: '',
        siret: ''
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      setGarageToDelete(null);
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md">
        <div>
          <h2 className="text-3xl font-serif-premium text-[var(--ink)]">Garages partenaires</h2>
          <p className="text-xs font-semibold text-[var(--muted)] mt-1.5">Gérez les comptes des garagistes et l'activation de leurs espaces de travail.</p>
        </div>
        <button
          onClick={() => { setIsModalOpen(true); setSubmitResult(null); setCopied(false); }}
          className="flex items-center gap-2 bg-[var(--blue)] hover:bg-[#003BDE] text-white px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#1454FF]/10 hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus size={16} />
          Nouveau Garagiste
        </button>
      </div>

      <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-3xl border border-[var(--stone)] shadow-md overflow-hidden">
        <div className="p-5 border-b border-[var(--stone)]/60 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={16} className="text-[var(--muted)]" />
            </div>
            <input
              type="text"
              placeholder="Rechercher par garage, responsable, SIRET, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 bg-[var(--white)]/40 border border-[var(--stone)] rounded-2xl text-xs font-semibold placeholder-[#89867A] focus:outline-none focus:ring-2 focus:ring-[#1454FF]/10 focus:border-[#1454FF] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E6E4DD]/60">
            <thead className="bg-[var(--white)]">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">
                  Garage & Responsable
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">
                  Coordonnées
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">
                  SIRET
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">
                  Date d'ajout
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">
                  Statut
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] divide-y divide-[#E6E4DD]/40">
              {fetchError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="max-w-md mx-auto p-6 bg-[var(--white)]/40 border border-[var(--stone)] rounded-3xl text-center space-y-4 shadow-md">
                      <div className="flex items-center justify-center gap-2 text-rose-600 font-bold text-sm">
                        <AlertCircle size={18} />
                        <span>Erreur de chargement</span>
                      </div>
                      <p className="text-xs text-[var(--muted)] font-semibold">Impossible de récupérer la liste des garages.</p>
                      <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl p-3 border border-[var(--stone)]/60 text-[10px] font-mono text-[var(--ink)] overflow-x-auto text-left whitespace-pre-wrap max-h-32 shadow-inner">
                        {fetchError}
                      </div>
                      <button
                        onClick={() => fetchGarages()}
                        className="px-4 py-2.5 bg-[var(--blue)] hover:bg-[#003BDE] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#1454FF]/10 cursor-pointer"
                      >
                        Réessayer
                      </button>
                    </div>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="animate-spin text-[var(--blue)] mx-auto" size={24} />
                    <p className="mt-3 text-xs font-semibold text-[var(--muted)]">Chargement des établissements...</p>
                  </td>
                </tr>
              ) : filteredGarages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <p className="text-xs font-semibold text-[var(--muted)]">Aucun garage trouvé.</p>
                  </td>
                </tr>
              ) : (
                filteredGarages.map((garage) => (
                  <tr key={garage.id} className="hover:bg-[var(--white)]/40/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-[var(--blue)]/10 text-[var(--blue)] rounded-2xl border border-[#C2CFFF] flex items-center justify-center font-bold">
                          <Building2 size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="text-xs font-bold text-[var(--ink)]">
                            {garage.nom_garage}
                          </div>
                          <div className="text-[10px] text-[var(--muted)] font-semibold mt-0.5">
                            Resp: {garage.responsable}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-[var(--ink)] font-semibold flex flex-col gap-1">
                        <span className="flex items-center gap-1.5"><Mail size={12} className="text-[var(--muted)]" /> {garage.email_contact}</span>
                        <span className="flex items-center gap-1.5"><Phone size={12} className="text-[var(--muted)]" /> {garage.telephone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-[var(--ink)] font-semibold">
                      {garage.siret ? garage.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-[var(--muted)] font-semibold">
                      {garage.created_at ? new Date(garage.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx(
                        "px-3 py-1 inline-flex text-[10px] leading-5 font-bold rounded-full",
                        garage.is_active !== false 
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10" 
                          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                      )}>
                        {garage.is_active !== false ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setGarageToDelete(garage)}
                        className="text-[var(--muted)] hover:text-rose-600 transition-all p-2 rounded-xl hover:bg-rose-50"
                        title="Supprimer le garage"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CRÉATION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#090D16]/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
          <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-3xl shadow-2xl max-w-lg w-full relative z-10 animate-in zoom-in-95 duration-200 border border-[var(--stone)] overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-[var(--stone)]/60 bg-[var(--white)]/40">
              <h3 className="text-xl font-bold font-serif-premium text-[var(--ink)]">Ajouter un Garagiste</h3>
              <p className="text-xs font-semibold text-[var(--muted)] mt-1.5">
                Le compte de connexion sera créé et ses accès temporaires lui seront envoyés instantanément par email.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {submitResult && (
                <div className={clsx(
                  "p-4 rounded-2xl border flex items-start gap-3",
                  submitResult.type === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
                )}>
                  {submitResult.type === 'success' ? (
                    <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="text-rose-500 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold">{submitResult.message}</p>
                    {submitResult.password && (
                      <div className="mt-3.5 p-4 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-emerald-200 rounded-2xl flex justify-between items-center shadow-md">
                        <div>
                          <p className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-wider">Mot de passe temporaire</p>
                          <p className="text-sm font-mono font-bold text-emerald-700 mt-0.5">{submitResult.password}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(submitResult.password)}
                          className="p-2 text-[var(--muted)] hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-[var(--stone)] hover:border-emerald-200 cursor-pointer"
                          title="Copier le mot de passe"
                        >
                          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!submitResult && (
                <div className="space-y-5">
                  {/* Infos Garage */}
                  <div className="p-5 bg-[var(--white)]/40 border border-[var(--stone)] rounded-2xl space-y-4">
                    <h4 className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-[var(--stone)]/60">
                      <Building2 size={13} /> Établissement
                    </h4>
                    
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">Nom du garage</label>
                      <input
                        type="text"
                        required
                        value={formData.nom_garage}
                        onChange={(e) => setFormData({...formData, nom_garage: e.target.value})}
                        className="block w-full px-3.5 py-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-2xl text-xs font-semibold placeholder-[#89867A] focus:outline-none focus:ring-2 focus:ring-[#1454FF]/10 focus:border-[#1454FF] transition-all"
                        placeholder="AutoGlass Pro Paris"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">SIRET</label>
                        <input
                          type="text"
                          required
                          maxLength={14}
                          value={formData.siret}
                          onChange={(e) => setFormData({...formData, siret: e.target.value.replace(/\D/g, '')})}
                          className="block w-full px-3.5 py-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-2xl text-xs font-semibold placeholder-[#89867A] focus:outline-none focus:ring-2 focus:ring-[#1454FF]/10 focus:border-[#1454FF] transition-all font-mono"
                          placeholder="12345678900012"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">Téléphone</label>
                        <input
                          type="tel"
                          required
                          value={formData.telephone}
                          onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                          className="block w-full px-3.5 py-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-2xl text-xs font-semibold placeholder-[#89867A] focus:outline-none focus:ring-2 focus:ring-[#1454FF]/10 focus:border-[#1454FF] transition-all"
                          placeholder="01 45 67 89 10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">Adresse complète</label>
                      <input
                        type="text"
                        required
                        value={formData.adresse}
                        onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                        className="block w-full px-3.5 py-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-2xl text-xs font-semibold placeholder-[#89867A] focus:outline-none focus:ring-2 focus:ring-[#1454FF]/10 focus:border-[#1454FF] transition-all"
                        placeholder="12 rue de l'Industrie, 75011 Paris"
                      />
                    </div>
                  </div>

                  {/* Infos Responsable */}
                  <div className="p-5 bg-[var(--white)]/40 border border-[var(--stone)] rounded-2xl space-y-4">
                    <h4 className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-[var(--stone)]/60">
                      <User size={13} /> Contact & Représentant
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">Prénom</label>
                        <input
                          type="text"
                          required
                          value={formData.prenom}
                          onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                          className="block w-full px-3.5 py-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-2xl text-xs font-semibold placeholder-[#89867A] focus:outline-none focus:ring-2 focus:ring-[#1454FF]/10 focus:border-[#1454FF] transition-all"
                          placeholder="Jean"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">Nom</label>
                        <input
                          type="text"
                          required
                          value={formData.responsable}
                          onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                          className="block w-full px-3.5 py-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-2xl text-xs font-semibold placeholder-[#89867A] focus:outline-none focus:ring-2 focus:ring-[#1454FF]/10 focus:border-[#1454FF] transition-all"
                          placeholder="Dupont"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">Email de connexion</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="block w-full px-3.5 py-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-2xl text-xs font-semibold placeholder-[#89867A] focus:outline-none focus:ring-2 focus:ring-[#1454FF]/10 focus:border-[#1454FF] transition-all"
                        placeholder="contact@autoglasspro.fr"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3 border-t border-[var(--stone)]/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-grow px-4 py-3 bg-[var(--white)] border border-[var(--stone)] text-[var(--ink)] rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-[#E6E4DD] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitResult?.type === 'success' ? 'Fermer' : 'Annuler'}
                </button>
                {!submitResult && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-grow flex items-center justify-center gap-1.5 px-4 py-3 bg-[var(--blue)] text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-[#003BDE] transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-[#1454FF]/10"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Création...
                      </>
                    ) : (
                      'Créer le garagiste'
                    )}
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
          <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-3xl shadow-2xl max-w-sm w-full relative z-10 animate-in zoom-in-95 duration-200 p-6 sm:p-8 text-center border border-[var(--stone)]">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Trash2 size={20} />
            </div>
            <h3 className="text-xl font-bold font-serif-premium text-[var(--ink)] mb-2">Supprimer le garage</h3>
            <p className="text-xs font-semibold text-[var(--muted)] leading-relaxed mb-6">
              Êtes-vous sûr de vouloir supprimer définitivement le garage <strong>{garageToDelete.nom_garage}</strong> et l'accès de son responsable <strong>{garageToDelete.responsable}</strong> ? Cette action est irréversible.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setGarageToDelete(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-[var(--white)] border border-[var(--stone)] text-[var(--ink)] rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-[#E6E4DD] transition-all disabled:opacity-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-rose-700 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-rose-600/10"
              >
                {isDeleting ? <Loader2 size={13} className="animate-spin" /> : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
