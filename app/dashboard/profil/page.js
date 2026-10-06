"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, Mail, Phone, MapPin, Building2, Save, Loader2, 
  AlertCircle, CheckCircle2, Shield, Key, Image as ImageIcon,
  Award, ArrowRight, Sparkles, FileText, Camera
} from 'lucide-react';
import Image from 'next/image';
import clsx from 'clsx';

export default function ProfilPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profil');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [garage, setGarage] = useState(null);
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    code_postal: '',
    ville: '',
    nom_garage: '',
    siret: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!authUser) return router.push('/connexion');

      setUser(authUser);
      
      const { data: garageData, error: garageError } = await supabase
        .from('garages')
        .select('*')
        .eq('owner_id', authUser.id)
        .maybeSingle();

      if (garageError) throw garageError;
      setGarage(garageData);
      
      if (garageData?.logo_url) {
        if (garageData.logo_url.startsWith('http')) {
          setLogoPreview(garageData.logo_url);
        } else {
          const { data } = supabase.storage.from('documents').getPublicUrl(garageData.logo_url);
          if (data && data.publicUrl) {
            setLogoPreview(data.publicUrl);
          }
        }
      }
      
      let street = '', cp = '', city = '';
      if (garageData?.adresse) {
        const parts = garageData.adresse.split(',');
        if (parts.length > 1) {
          street = parts[0].trim();
          const rest = parts.slice(1).join(',').trim();
          const cpMatch = rest.match(/^(\d{5})\s+(.*)$/);
          if (cpMatch) {
            cp = cpMatch[1];
            city = cpMatch[2].trim();
          } else {
            city = rest;
          }
        } else {
          const cpMatch = garageData.adresse.match(/(\d{5})/);
          if (cpMatch) {
            cp = cpMatch[1];
            const index = garageData.adresse.indexOf(cp);
            street = garageData.adresse.substring(0, index).trim();
            city = garageData.adresse.substring(index + 5).trim();
          } else {
            street = garageData.adresse;
          }
        }
      }

      let defaultPrenom = authUser.user_metadata?.prenom || authUser.user_metadata?.first_name || '';
      let defaultNom = authUser.user_metadata?.nom || authUser.user_metadata?.last_name || '';

      if (!defaultPrenom && !defaultNom && garageData?.responsable) {
        const nameParts = garageData.responsable.trim().split(' ');
        if (nameParts.length > 1) {
          defaultNom = nameParts.pop();
          defaultPrenom = nameParts.join(' ');
        } else {
          defaultNom = garageData.responsable;
        }
      }

      setFormData(prev => ({
        ...prev,
        prenom: defaultPrenom,
        nom: defaultNom,
        email: authUser.email || '',
        telephone: garageData?.telephone || '',
        adresse: street,
        code_postal: cp,
        ville: city,
        nom_garage: garageData?.nom_garage || '',
        siret: garageData?.siret || '',
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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setError('');
      setSuccess('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // 1. Update Password if requested
      if (activeTab === 'securite') {
        if (!formData.newPassword) throw new Error("Le nouveau mot de passe est requis");
        if (formData.newPassword !== formData.confirmPassword) throw new Error("Les mots de passe ne correspondent pas");
        if (formData.newPassword.length < 6) throw new Error("Le mot de passe doit faire au moins 6 caractères");

        const { error: pwdError } = await supabase.auth.updateUser({ password: formData.newPassword });
        if (pwdError) throw pwdError;

        setSuccess("Mot de passe mis à jour avec succès !");
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        setSaving(false);
        return;
      }

      // 2. Update Profile & Garage
      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: {
          prenom: formData.prenom,
          nom: formData.nom,
          first_name: formData.prenom,
          last_name: formData.nom,
        }
      });
      if (userUpdateError) throw userUpdateError;

      let finalLogoUrl = garage?.logo_url;
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `logos/${user.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
        finalLogoUrl = publicUrl;
      }

      const { error: garageError } = await supabase
        .from('garages')
        .upsert({
          id: garage?.id || undefined,
          owner_id: user.id,
          nom_garage: formData.nom_garage,
          responsable: `${formData.prenom} ${formData.nom}`.trim(),
          email_contact: formData.email,
          telephone: formData.telephone,
          adresse: `${formData.adresse}, ${formData.code_postal} ${formData.ville}`.trim().replace(/^,\s*/, ''),
          siret: formData.siret,
          logo_url: finalLogoUrl
        });
      if (garageError) throw garageError;

      setSuccess("Profil mis à jour avec succès !");
      setTimeout(() => setSuccess(''), 3000);
      fetchProfile();

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
          <div className="absolute inset-0 bg-[var(--blue)] rounded-full animate-ping opacity-20"></div>
          <Loader2 size={48} className="animate-spin text-[var(--blue)] relative z-10" />
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2.5 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/10 transition-all placeholder:text-[var(--muted)]";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* En-tête */}
      <div>
        <div className="inline-flex items-center gap-2 bg-[var(--white)] shadow-md rounded-full px-4 py-2 mb-6 border border-white/10">
          <Sparkles size={14} className="text-[#1454FF]" />
          <span className="text-xs font-medium text-[#1454FF] uppercase tracking-wider">Configuration</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif text-slate-200 mb-2">Mon Profil</h1>
        <p className="text-slate-400 font-light">Gérez vos informations et préférences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar des paramètres */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col space-y-2">
            <button 
              onClick={() => { setActiveTab('profil'); setError(''); setSuccess(''); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profil' ? 'bg-[#1454FF]/10 text-[#1454FF]' : 'text-slate-600 hover:bg-[var(--stone)] hover:text-slate-200'}`}
            >
              <User size={18} className={activeTab === 'profil' ? 'text-[#1454FF]' : 'text-[var(--muted)]'} />
              Personnel & Garage
            </button>
            <button 
              onClick={() => { setActiveTab('securite'); setError(''); setSuccess(''); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'securite' ? 'bg-[#1454FF]/10 text-[#1454FF]' : 'text-slate-600 hover:bg-[var(--stone)] hover:text-slate-200'}`}
            >
              <Shield size={18} className={activeTab === 'securite' ? 'text-[#1454FF]' : 'text-[var(--muted)]'} />
              Sécurité du compte
            </button>
          </nav>

          <div className="mt-8 bg-[#120052] text-white rounded-2xl border-white/10 border-[var(--stone)] p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[var(--blue)]/10 flex items-center justify-center">
                <Award size={16} className="text-[var(--blue)]" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-wide">JETONS GLASSPILOT</h2>
            </div>
            <p className="text-xs text-[var(--muted)] mb-5 leading-relaxed font-medium">Gérez vos crédits pour soumettre vos dossiers d'assurance.</p>
            <Link href="/dashboard/abonnement" className="inline-flex text-xs font-semibold text-[#1454FF] items-center gap-2 bg-[#1454FF]/5 hover:bg-[#1454FF]/10 px-4 py-2 rounded-xl transition-all group">
              Voir mon solde <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
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

          <div className="bg-[#120052] text-white rounded-2xl shadow-md border-white/10 border-[var(--stone)] overflow-hidden">
            <form onSubmit={handleSubmit}>
              
              {activeTab === 'profil' && (
                <div className="p-6 md:p-8 space-y-8">
                  {/* Logo Upload */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4">Logo du Garage</h2>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-white/5 overflow-hidden border-white/10 relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-2" />
                        ) : (
                          <ImageIcon size={32} className="text-[var(--muted)]" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera size={20} className="text-slate-200" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-300">Importer un logo</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">Ce logo s'affichera sur votre espace et sur les documents générés (Ordre de réparation, etc.). Format carré recommandé.</p>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleLogoChange} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-3 text-xs font-medium text-[#1454FF] border border-[#1454FF]/20 px-3 py-1.5 rounded-lg hover:bg-[#1454FF]/5">
                          Choisir un fichier
                        </button>
                      </div>
                    </div>
                  </div>

                  <hr className="border-white/10" />

                  {/* Infos persos */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4">Informations personnelles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wide mb-1.5">Prénom</label>
                        <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wide mb-1.5">Nom</label>
                        <input type="text" name="nom" value={formData.nom} onChange={handleChange} className={inputClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wide mb-1.5">Adresse email de connexion</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                          <input type="email" name="email" value={formData.email} disabled className={clsx(inputClass, "pl-10 opacity-70 cursor-not-allowed")} />
                        </div>
                        <p className="text-xs text-[var(--muted)] mt-1.5">L'adresse email de connexion ne peut pas être modifiée ici.</p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-white/10" />

                  {/* Infos garage */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4">Informations du Garage</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wide mb-1.5">Nom du garage</label>
                        <input type="text" name="nom_garage" value={formData.nom_garage} onChange={handleChange} className={inputClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wide mb-1.5">Adresse postale</label>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                          <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} className={clsx(inputClass, "pl-10")} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wide mb-1.5">Code postal</label>
                        <input type="text" name="code_postal" value={formData.code_postal} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wide mb-1.5">Ville</label>
                        <input type="text" name="ville" value={formData.ville} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wide mb-1.5">Téléphone professionnel</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                          <input type="tel" name="telephone" value={formData.telephone} onChange={handleChange} className={clsx(inputClass, "pl-10")} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wide mb-1.5">Numéro SIRET</label>
                        <div className="relative">
                          <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                          <input type="text" name="siret" value={formData.siret} onChange={handleChange} className={clsx(inputClass, "pl-10")} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'securite' && (
                <div className="p-6 md:p-8">
                  <h2 className="text-lg font-bold text-white mb-6">Sécurité du compte</h2>
                  <div className="space-y-5 max-w-md">
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wide mb-1.5">Nouveau mot de passe</label>
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
                      <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wide mb-1.5">Confirmer le mot de passe</label>
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

              <div className="px-6 py-4 border-t border-[var(--stone)] bg-slate-50/50 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#1454FF] hover:bg-[#0ea5e9] text-slate-200 font-medium rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-70"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}