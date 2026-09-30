"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Building2, FileText, CreditCard, Upload, 
  Loader2, CheckCircle2, AlertCircle, ArrowRight, 
  ArrowLeft, ShieldCheck, Landmark, Sparkles
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  // Étape 1 : Informations Légales & Identité
  const [siret, setSiret] = useState('');
  const [kbisFile, setKbisFile] = useState(null);
  const [kbisDragActive, setKbisDragActive] = useState(false);
  const [cniFile, setCniFile] = useState(null);
  const [cniDragActive, setCniDragActive] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoDragActive, setLogoDragActive] = useState(false);

  // Étape 2 : RIB / IBAN / BIC
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [ribFile, setRibFile] = useState(null);
  const [ribDragActive, setRibDragActive] = useState(false);



  // Étape finale : Célébration
  const [onboardingSuccess, setOnboardingSuccess] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/connexion');
        return;
      }
      setUser(authUser);
      
      // Pré-remplir le SIRET si disponible dans les métadonnées d'inscription
      if (authUser.user_metadata?.siret) {
        setSiret(authUser.user_metadata.siret);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Gestionnaires d'upload (Drag & Drop) ---
  const handleDrag = (e, setDragActive) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e, setDragActive, setFile) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Accepter PDF, PNG, JPG, JPEG
      if (['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        setFile(file);
      } else {
        setError("Format non supporté. Veuillez déposer un fichier PDF, PNG ou JPG.");
      }
    }
  };

  const handleFileChange = (e, setFile) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  // --- Formatage de l'IBAN à la volée ---
  const handleIbanChange = (e) => {
    const rawValue = e.target.value.replace(/\s+/g, '').toUpperCase();
    // Limiter la taille standard d'un IBAN (27 chars pour la France)
    if (rawValue.length <= 34) {
      // Espacer tous les 4 caractères
      const formatted = rawValue.match(/.{1,4}/g)?.join(' ') || rawValue;
      setIban(formatted);
    }
  };



  // --- Validations par étape ---
  const validateStep1 = () => {
    if (!siret.trim()) {
      setError("Veuillez saisir votre numéro SIRET.");
      return false;
    }
    if (siret.replace(/\s+/g, '').length !== 14) {
      setError("Le numéro SIRET doit contenir exactement 14 chiffres.");
      return false;
    }
    if (!kbisFile) {
      setError("Veuillez charger votre document KBIS.");
      return false;
    }
    if (!cniFile) {
      setError("Veuillez charger votre pièce d'identité (CNI).");
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    const cleanIban = iban.replace(/\s+/g, '');
    if (!cleanIban) {
      setError("Veuillez saisir votre code IBAN.");
      return false;
    }
    if (cleanIban.length < 15 || cleanIban.length > 34) {
      setError("IBAN invalide. Veuillez vérifier votre saisie.");
      return false;
    }
    if (!bic.trim()) {
      setError("Veuillez saisir votre code BIC.");
      return false;
    }
    if (bic.trim().length < 8 || bic.trim().length > 11) {
      setError("Code BIC invalide (doit contenir 8 ou 11 caractères).");
      return false;
    }
    if (!ribFile) {
      setError("Veuillez charger votre justificatif de RIB.");
      return false;
    }
    setError('');
    return true;
  };



  // --- Navigation étapes ---
  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  // --- Soumission Finale de l'Onboarding ---
  const handleSubmitOnboarding = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    
    setLoading(true);
    setError('');

    try {
      if (!user) throw new Error("Session utilisateur introuvable.");

      const userId = user.id;

      // 1. Uploader KBIS
      const kbisExt = kbisFile.name.split('.').pop();
      const kbisPath = `onboarding/${userId}/kbis_${Date.now()}.${kbisExt}`;
      const { error: kbisUploadError } = await supabase.storage
        .from('documents')
        .upload(kbisPath, kbisFile);

      if (kbisUploadError) throw new Error(`Erreur lors de l'upload du KBIS: ${kbisUploadError.message}`);

      // 2. Uploader RIB
      const ribExt = ribFile.name.split('.').pop();
      const ribPath = `onboarding/${userId}/rib_${Date.now()}.${ribExt}`;
      const { error: ribUploadError } = await supabase.storage
        .from('documents')
        .upload(ribPath, ribFile);

      if (ribUploadError) throw new Error(`Erreur lors de l'upload du RIB: ${ribUploadError.message}`);

      // 3. Uploader CNI
      const cniExt = cniFile.name.split('.').pop();
      const cniPath = `onboarding/${userId}/cni_${Date.now()}.${cniExt}`;
      const { error: cniUploadError } = await supabase.storage
        .from('documents')
        .upload(cniPath, cniFile);

      if (cniUploadError) throw new Error(`Erreur lors de l'upload de la CNI: ${cniUploadError.message}`);

      // 4. Uploader Logo (Optionnel)
      let logoPath = null;
      if (logoFile) {
        const logoExt = logoFile.name.split('.').pop();
        logoPath = `onboarding/${userId}/logo_${Date.now()}.${logoExt}`;
        const { error: logoUploadError } = await supabase.storage
          .from('documents')
          .upload(logoPath, logoFile);
        
        if (logoUploadError) throw new Error(`Erreur lors de l'upload du Logo: ${logoUploadError.message}`);
      }

      // 5. Appeler l'API d'onboarding serveur pour insérer le garage, le stock et mettre à jour le profil
      const { data: { session } } = await supabase.auth.getSession();
      const cleanIban = iban.replace(/\s+/g, '');
      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          siret,
          kbisPath,
          iban: cleanIban,
          bic: bic.trim(),
          ribPath,
          cniPath,
          logoPath
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Une erreur est survenue lors de l'enregistrement de vos données.");
      }



      // Force-refresh user session to update local cookies/JWT in the browser immediately
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn("Session refresh warning:", refreshError.message);
      }

      // Déclencher la célébration
      setOnboardingSuccess(true);
      
      // Redirection après 3 secondes
      setTimeout(() => {
        // Recharger complètement l'application pour synchroniser le layout principal
        window.location.href = '/dashboard';
      }, 3000);

    } catch (err) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  // --- Animation de succès ---
  if (onboardingSuccess) {
    return (
      <div className="max-w-md w-full bg-[var(--white)] rounded-3xl border border-[var(--stone)] p-10 text-center shadow-xl relative overflow-hidden animate-in zoom-in duration-300">
        {/* Background Sparkles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px]"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px]"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
            <CheckCircle2 size={48} className="text-emerald-500 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-serif text-[var(--ink)] tracking-tight">Inscription Finalisée !</h2>
            <p className="text-[var(--muted)] text-sm font-light leading-relaxed">
              Vos documents légaux et bancaires ont été validés avec succès. Votre compte GlassPilot Pro est désormais entièrement déverrouillé.
            </p>
          </div>
          
          <div className="pt-4 border-t border-[var(--stone)] flex flex-col items-center justify-center gap-3">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Redirection vers le tableau de bord...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full bg-[var(--white)] rounded-3xl border border-[var(--stone)] shadow-lg p-6 md:p-10 relative overflow-hidden">
      
      {/* Sparkles decorations */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--blue)]/5 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--blue)]/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="relative z-10">
        
        {/* Header de l'onboarding */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-3">
            <Sparkles size={12} className="text-indigo-600" />
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Parcours d'activation</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif text-[var(--ink)] tracking-tight">Activez votre espace pro</h2>
          <p className="text-[var(--muted)] text-sm font-light mt-1">Veuillez renseigner vos documents légaux pour commencer à créer vos dossiers de vitrage.</p>
        </div>

        {/* Barre de progression des étapes */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { num: 1, label: 'KBIS & SIRET', icon: Building2 },
            { num: 2, label: 'RIB & IBAN', icon: Landmark }
          ].map((item) => {
            const isActive = step === item.num;
            const isPassed = step > item.num;
            const Icon = item.icon;
            return (
              <div key={item.num} className="relative">
                <div className={`h-1 rounded-full transition-all duration-300 ${
 isPassed ? 'bg-indigo-600' : isActive ? 'bg-indigo-600/60' : 'bg-slate-100'
 }`} />
                <div className="flex items-center gap-2 mt-2.5">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
 isPassed ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : isActive ? 'bg-indigo-600 text-[var(--ink)] shadow-md' : 'bg-transparent border border-slate-100 text-[var(--muted)]'
 }`}>
                    {isPassed ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Icon size={12} />}
                  </div>
                  <span className={`text-[10px] font-bold tracking-tight uppercase hidden md:inline transition-colors ${
 isActive ? 'text-indigo-600 font-bold' : isPassed ? 'text-slate-700' : 'text-[var(--muted)]'
 }`}>
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-600 animate-in fade-in duration-200">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={step === 2 ? handleSubmitOnboarding : (e) => e.preventDefault()} className="space-y-6">

          {/* ================= ÉTAPE 1 ================= */}
          {step === 1 && (
            <div className="bg-[var(--white)] rounded-2xl p-6 sm:p-8 md:p-10 border border-slate-200">
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                    <Building2 size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--ink)]">Informations Légales & Identité</h3>
                    <p className="text-sm text-slate-500">Ces documents sont nécessaires pour vérifier votre compte professionnel.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Numéro SIRET <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={siret}
                    onChange={(e) => setSiret(e.target.value.replace(/[^0-9\s]/g, ''))}
                    placeholder="123 456 789 00012"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all placeholder:text-[var(--muted)]"
                  />
                  <p className="text-xs text-[var(--muted)] mt-2 flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    Utilisé pour la facturation et les contrats
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Extrait KBIS <span className="text-rose-500">*</span></label>
                    <div 
                      className={`relative border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px]
 ${kbisDragActive ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}
 ${kbisFile ? 'border-emerald-400 bg-emerald-50/30' : ''}`}
                      onDragEnter={(e) => handleDrag(e, setKbisDragActive)}
                      onDragLeave={(e) => handleDrag(e, setKbisDragActive)}
                      onDragOver={(e) => handleDrag(e, setKbisDragActive)}
                      onDrop={(e) => handleDrop(e, setKbisDragActive, setKbisFile)}
                    >
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileChange(e, setKbisFile)} />
                      
                      {kbisFile ? (
                        <>
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle2 size={20} className="text-emerald-600" />
                          </div>
                          <p className="text-sm font-bold text-emerald-800 line-clamp-1">{kbisFile.name}</p>
                          <p className="text-xs text-emerald-600 font-medium mt-1">{(kbisFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <Upload size={18} className="text-slate-500" />
                          </div>
                          <p className="text-sm font-semibold text-[var(--ink)]">Glissez ou cliquez</p>
                          <p className="text-xs text-[var(--muted)] mt-1">PDF, PNG ou JPG (Max 5Mo)</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Carte d'Identité <span className="text-rose-500">*</span></label>
                    <div 
                      className={`relative border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px]
 ${cniDragActive ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}
 ${cniFile ? 'border-emerald-400 bg-emerald-50/30' : ''}`}
                      onDragEnter={(e) => handleDrag(e, setCniDragActive)}
                      onDragLeave={(e) => handleDrag(e, setCniDragActive)}
                      onDragOver={(e) => handleDrag(e, setCniDragActive)}
                      onDrop={(e) => handleDrop(e, setCniDragActive, setCniFile)}
                    >
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileChange(e, setCniFile)} />
                      
                      {cniFile ? (
                        <>
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle2 size={20} className="text-emerald-600" />
                          </div>
                          <p className="text-sm font-bold text-emerald-800 line-clamp-1">{cniFile.name}</p>
                          <p className="text-xs text-emerald-600 font-medium mt-1">{(cniFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <Upload size={18} className="text-slate-500" />
                          </div>
                          <p className="text-sm font-semibold text-[var(--ink)]">Glissez ou cliquez</p>
                          <p className="text-xs text-[var(--muted)] mt-1">Recto/Verso (PDF, PNG, JPG)</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Logo du Garage <span className="text-[var(--muted)] font-normal ml-1">(Optionnel)</span></label>
                  <div 
                    className={`relative border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[120px]
 ${logoDragActive ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}
 ${logoFile ? 'border-emerald-400 bg-emerald-50/30' : ''}`}
                    onDragEnter={(e) => handleDrag(e, setLogoDragActive)}
                    onDragLeave={(e) => handleDrag(e, setLogoDragActive)}
                    onDragOver={(e) => handleDrag(e, setLogoDragActive)}
                    onDrop={(e) => handleDrop(e, setLogoDragActive, setLogoFile)}
                  >
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".png,.jpg,.jpeg" onChange={(e) => handleFileChange(e, setLogoFile)} />
                    
                    {logoFile ? (
                      <>
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                          <CheckCircle2 size={20} className="text-emerald-600" />
                        </div>
                        <p className="text-sm font-bold text-emerald-800 line-clamp-1">{logoFile.name}</p>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                          <Upload size={18} className="text-slate-500" />
                        </div>
                        <p className="text-sm font-semibold text-[var(--ink)]">Logo de l'entreprise</p>
                        <p className="text-xs text-[var(--muted)] mt-1">Sera affiché sur vos factures</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= ÉTAPE 2 ================= */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-[var(--ink)] uppercase tracking-wider mb-2">
                    Code IBAN
                  </label>
                  <div className="relative">
                    <Landmark size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="text"
                      required
                      value={iban}
                      onChange={handleIbanChange}
                      className="w-full pl-11 pr-4 py-3 bg-[var(--white)]/40 border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all font-mono"
                      placeholder="FR76 3000 6000 0112 3456 7890 123"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--ink)] uppercase tracking-wider mb-2">
                    Code BIC / SWIFT
                  </label>
                  <input
                    type="text"
                    required
                    value={bic}
                    onChange={(e) => setBic(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-[var(--white)]/40 border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all font-mono"
                    placeholder="CREDFRPPXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--ink)] uppercase tracking-wider mb-2">
                  Justificatif de RIB (Relevé d'Identité Bancaire)
                </label>
                <div 
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group ${
 ribDragActive 
 ? 'border-indigo-600 bg-indigo-50/20' 
 : ribFile 
 ? 'border-emerald-300 bg-emerald-50/10' 
 : 'border-[var(--stone)] hover:border-indigo-400 bg-[var(--white)]/40'
 }`}
                  onDragEnter={(e) => handleDrag(e, setRibDragActive)}
                  onDragOver={(e) => handleDrag(e, setRibDragActive)}
                  onDragLeave={(e) => handleDrag(e, setRibDragActive)}
                  onDrop={(e) => handleDrop(e, setRibDragActive, setRibFile)}
                  onClick={() => document.getElementById('rib-upload').click()}
                >
                  <input
                    type="file"
                    id="rib-upload"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => handleFileChange(e, setRibFile)}
                  />
                  {ribFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center mb-3">
                        <FileText size={20} className="text-emerald-600" />
                      </div>
                      <p className="text-sm font-semibold text-[var(--ink)] truncate max-w-xs">{ribFile.name}</p>
                      <p className="text-xs text-[var(--muted)] font-light mt-1">{(ribFile.size / 1024 / 1024).toFixed(2)} MB • Fichier prêt</p>
                      <span className="text-[10px] font-bold text-indigo-600 mt-3 group-hover:underline">Modifier le fichier</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-[var(--white)] border border-[var(--stone)] rounded-xl flex items-center justify-center mb-3 group-hover:border-indigo-200 group-hover:shadow-md transition-all">
                        <Upload size={18} className="text-[var(--muted)] group-hover:text-indigo-600 transition-colors animate-bounce" />
                      </div>
                      <p className="text-sm font-medium text-[var(--ink)]">Glissez-déposez votre RIB ici</p>
                      <p className="text-xs text-[var(--muted)] font-light mt-1">ou cliquez pour parcourir les dossiers</p>
                      <p className="text-[10px] text-[var(--muted)] font-light mt-2 uppercase tracking-wide">PDF, PNG, JPG jusqu'à 10MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* BOUTONS ACTIONS */}
          <div className="pt-6 border-t border-[var(--stone)] flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                disabled={loading}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)] transition-all disabled:opacity-50"
              >
                <ArrowLeft size={14} /> Retour
              </button>
            ) : (
              <div></div>
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={nextStep}
                className="bg-indigo-600 hover:bg-indigo-700 text-[var(--ink)] font-semibold py-3 px-6 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 hover:-translate-y-0.5 text-sm"
              >
                Continuer <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-[var(--ink)] font-semibold py-3 px-6 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 hover:-translate-y-0.5 disabled:opacity-75 disabled:pointer-events-none text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Activation en cours...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} /> Finaliser mon activation →
                  </>
                )}
              </button>
            )}
          </div>

        </form>

      </div>

    </div>
  );
}
