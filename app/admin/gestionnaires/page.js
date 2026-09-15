"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Mail, User, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import clsx from 'clsx';

export default function GestionnairesPage() {
  const [gestionnaires, setGestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchError, setFetchError] = useState(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  
  // Delete modal states
  const [managerToDelete, setManagerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchGestionnaires();
  }, []);

  const fetchGestionnaires = async () => {
    setFetchError(null);
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gestionnaires')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGestionnaires(data || []);
    } catch (err) {
      console.error('Erreur chargement gestionnaires:', err);
      let errMsg = 'Erreur inconnue';
      if (err instanceof Error) {
        errMsg = `${err.name}: ${err.message}\n${err.stack || ''}`;
      } else if (typeof err === 'object' && err !== null) {
        errMsg = JSON.stringify(err, null, 2);
      } else {
        errMsg = String(err);
      }
      setFetchError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const filteredGestionnaires = gestionnaires.filter(g => 
    `${g.nom} ${g.prenom} ${g.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch('/api/admin/create-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création');
      }

      setSubmitResult({ type: 'success', message: 'Gestionnaire créé avec succès ! Un email lui a été envoyé avec son mot de passe.', password: data.password });
      setFormData({ nom: '', prenom: '', email: '' });
      fetchGestionnaires();
      
      // Auto-close success modal after 5 seconds
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitResult(null);
      }, 5000);
      
    } catch (err) {
      setSubmitResult({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!managerToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/delete-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: managerToDelete.user_id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      setManagerToDelete(null);
      fetchGestionnaires();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md">
        <div>
          <h2 className="text-3xl font-serif-premium text-[var(--ink)]">Gestionnaires</h2>
          <p className="text-xs font-semibold text-[var(--muted)] mt-1.5">Gérez l'équipe des gestionnaires et supervisez leurs accès de traitement.</p>
        </div>
        <button
          onClick={() => { setIsModalOpen(true); setSubmitResult(null); }}
          className="flex items-center gap-2 bg-[var(--blue)] hover:bg-[#003BDE] text-white px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#1454FF]/10 hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus size={16} />
          Nouveau Gestionnaire
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
              placeholder="Rechercher par nom, prénom ou email..."
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
                  Utilisateur
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-widest">
                  Contact
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
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="max-w-md mx-auto p-6 bg-[var(--white)]/40 border border-[var(--stone)] rounded-3xl text-center space-y-4 shadow-md">
                      <div className="flex items-center justify-center gap-2 text-rose-600 font-bold text-sm">
                        <AlertCircle size={18} />
                        <span>Erreur de chargement</span>
                      </div>
                      <p className="text-xs text-[var(--muted)] font-semibold">Impossible de charger la liste des gestionnaires.</p>
                      <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl p-3 border border-[var(--stone)]/60 text-[10px] font-mono text-[var(--ink)] overflow-x-auto text-left whitespace-pre-wrap max-h-32 shadow-inner">
                        {fetchError}
                      </div>
                      <button
                        onClick={() => fetchGestionnaires()}
                        className="px-4 py-2.5 bg-[var(--blue)] hover:bg-[#003BDE] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#1454FF]/10 cursor-pointer"
                      >
                        Réessayer
                      </button>
                    </div>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Loader2 className="animate-spin text-[var(--blue)] mx-auto" size={24} />
                    <p className="mt-3 text-xs font-semibold text-[var(--muted)]">Chargement de l'équipe...</p>
                  </td>
                </tr>
              ) : filteredGestionnaires.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <p className="text-xs font-semibold text-[var(--muted)]">Aucun gestionnaire trouvé.</p>
                  </td>
                </tr>
              ) : (
                filteredGestionnaires.map((gestionnaire) => (
                  <tr key={gestionnaire.id} className="hover:bg-[var(--white)]/40/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-[var(--blue)]/10 text-[var(--blue)] rounded-full border border-[#C2CFFF] flex items-center justify-center font-extrabold text-xs">
                          {gestionnaire.prenom.charAt(0).toUpperCase()}{gestionnaire.nom.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-xs font-bold text-[var(--ink)]">
                            {gestionnaire.prenom} {gestionnaire.nom}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-xs text-[var(--ink)] font-medium">
                        <Mail size={13} className="mr-2 text-[var(--muted)]" />
                        {gestionnaire.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-[var(--muted)] font-medium">
                      {new Date(gestionnaire.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-[10px] leading-5 font-bold rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10">
                        Actif
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setManagerToDelete(gestionnaire)}
                        className="text-[var(--muted)] hover:text-rose-600 transition-all p-2 rounded-xl hover:bg-rose-50"
                        title="Supprimer"
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
          <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-3xl shadow-2xl max-w-md w-full relative z-10 animate-in zoom-in-95 duration-200 border border-[var(--stone)] overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-[var(--stone)]/60 bg-[var(--white)]/40">
              <h3 className="text-xl font-bold font-serif-premium text-[var(--ink)]">Ajouter un Gestionnaire</h3>
              <p className="text-xs font-semibold text-[var(--muted)] mt-1.5">
                Un email contenant le mot de passe généré automatiquement lui sera envoyé instantanément.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
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
                      <div className="mt-2.5 p-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-xl border border-emerald-200 text-[10px] font-mono text-emerald-800">
                        Mot de passe temporaire : <span className="font-bold">{submitResult.password}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">Prénom</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={14} className="text-[var(--muted)]" />
                    </div>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={formData.prenom}
                      onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                      className="block w-full pl-9 pr-3 py-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-2xl text-xs font-semibold placeholder-[#89867A] focus:outline-none focus:ring-2 focus:ring-[#1454FF]/10 focus:border-[#1454FF] disabled:opacity-50"
                      placeholder="Jean"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">Nom</label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="block w-full px-3.5 py-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-2xl text-xs font-semibold placeholder-[#89867A] focus:outline-none focus:ring-2 focus:ring-[#1454FF]/10 focus:border-[#1454FF] disabled:opacity-50"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">Adresse email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={14} className="text-[var(--muted)]" />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="block w-full pl-9 pr-3 py-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-2xl text-xs font-semibold placeholder-[#89867A] focus:outline-none focus:ring-2 focus:ring-[#1454FF]/10 focus:border-[#1454FF] disabled:opacity-50"
                    placeholder="jean.dupont@exemple.com"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-[var(--stone)]/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[var(--white)] border border-[var(--stone)] text-[var(--ink)] rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-[#E6E4DD] transition-all disabled:opacity-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || submitResult?.type === 'success'}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[var(--blue)] text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-[#003BDE] transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-[#1454FF]/10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Création...
                    </>
                  ) : (
                    'Créer le compte'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {managerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#090D16]/60 backdrop-blur-sm" onClick={() => !isDeleting && setManagerToDelete(null)}></div>
          <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-3xl shadow-2xl max-w-sm w-full relative z-10 animate-in zoom-in-95 duration-200 p-6 sm:p-8 text-center border border-[var(--stone)]">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Trash2 size={20} />
            </div>
            <h3 className="text-xl font-bold font-serif-premium text-[var(--ink)] mb-2">Supprimer le compte</h3>
            <p className="text-xs font-semibold text-[var(--muted)] leading-relaxed mb-6">
              Êtes-vous sûr de vouloir supprimer définitivement <strong>{managerToDelete.prenom} {managerToDelete.nom}</strong> ? Cette action est irréversible et retirera tous ses accès.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setManagerToDelete(null)}
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
