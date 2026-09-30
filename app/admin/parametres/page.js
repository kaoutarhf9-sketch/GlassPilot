"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Shield, User, Key, Save, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import clsx from 'clsx';

export default function AdminParametresPage() {
  const [activeTab, setActiveTab] = useState('profil');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      setFormData(prev => ({
        ...prev,
        prenom: user?.user_metadata?.prenom || user?.user_metadata?.first_name || '',
        nom: user?.user_metadata?.nom || user?.user_metadata?.last_name || '',
        email: user?.email || '',
      }));
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (activeTab === 'securite') {
        if (!formData.newPassword) throw new Error("Le nouveau mot de passe est requis");
        if (formData.newPassword !== formData.confirmPassword) throw new Error("Les mots de passe ne correspondent pas");
        if (formData.newPassword.length < 6) throw new Error("Le mot de passe doit faire au moins 6 caractères");

        const { error: pwdError } = await supabase.auth.updateUser({ password: formData.newPassword });
        if (pwdError) throw pwdError;

        setSuccess("Mot de passe mis à jour avec succès !");
        setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
      } else {
        const { error: userUpdateError } = await supabase.auth.updateUser({
          data: {
            prenom: formData.prenom,
            nom: formData.nom,
            first_name: formData.prenom,
            last_name: formData.nom,
          }
        });
        if (userUpdateError) throw userUpdateError;

        setSuccess("Profil mis à jour avec succès !");
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 bg-[#1454FF] rounded-full animate-ping opacity-20"></div>
          <Loader2 size={48} className="animate-spin text-[#1454FF] relative z-10" />
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2.5 bg-transparent border border-slate-200 rounded-xl text-sm text-[var(--ink)] focus:bg-[var(--white)]   focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] transition-all outline-none placeholder:text-[var(--muted)]";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* En-tête */}
      <div>
        <div className="inline-flex items-center gap-2 bg-[var(--white)] shadow-md rounded-full px-4 py-2 mb-6 border border-slate-200">
          <Sparkles size={14} className="text-[#1454FF]" />
          <span className="text-xs font-medium text-[#1454FF] uppercase tracking-wider">Super Admin</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif text-[var(--ink)] mb-2">Paramètres de la plateforme</h1>
        <p className="text-slate-500 font-light">Gérez votre compte administrateur</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar des paramètres */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col space-y-2">
            <button 
              onClick={() => { setActiveTab('profil'); setError(''); setSuccess(''); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profil' ? 'bg-[#1454FF]/10 text-[#1454FF]' : 'text-slate-600 hover:bg-[var(--stone)] hover:text-[var(--ink)]'}`}
            >
              <User size={18} className={activeTab === 'profil' ? 'text-[#1454FF]' : 'text-[var(--muted)]'} />
              Mon Profil
            </button>
            <button 
              onClick={() => { setActiveTab('securite'); setError(''); setSuccess(''); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'securite' ? 'bg-[#1454FF]/10 text-[#1454FF]' : 'text-slate-600 hover:bg-[var(--stone)] hover:text-[var(--ink)]'}`}
            >
              <Shield size={18} className={activeTab === 'securite' ? 'text-[#1454FF]' : 'text-[var(--muted)]'} />
              Sécurité & Mot de passe
            </button>
          </nav>
        </div>

        {/* Contenu principal */}
        <div className="flex-1">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-600 text-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-600 text-sm animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          <div className="bg-[var(--white)] rounded-2xl shadow-md border border-slate-200 overflow-hidden">
            <form onSubmit={handleSubmit}>
              
              {activeTab === 'profil' && (
                <div className="p-6 md:p-8 space-y-6">
                  <h2 className="text-lg font-bold text-[var(--ink)] mb-4">Informations de l'administrateur</h2>
                  
                  <div className="grid grid-cols-1 gap-5 max-w-md">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Prénom</label>
                      <input 
                        type="text" 
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Nom</label>
                      <input 
                        type="text" 
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Adresse Email Principale</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        disabled
                        className={clsx(inputClass, "opacity-70 cursor-not-allowed")}
                      />
                      <p className="text-xs text-[var(--muted)] mt-1.5">L'adresse email ne peut pas être modifiée ici.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'securite' && (
                <div className="p-6 md:p-8 space-y-6">
                  <h2 className="text-lg font-bold text-[var(--ink)] mb-4">Sécurité du compte</h2>
                  <div className="space-y-5 max-w-md">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Nouveau mot de passe</label>
                      <input 
                        type="password" 
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Confirmer le mot de passe</label>
                      <input 
                        type="password" 
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#1454FF] hover:bg-[#0ea5e9] text-[var(--ink)] text-sm font-medium rounded-xl transition-all shadow-md shadow-[#1454FF]/20 disabled:opacity-70"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
