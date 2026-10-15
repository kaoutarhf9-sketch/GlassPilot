"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Building2, FileText, CreditCard, Upload, 
  Loader2, CheckCircle2, AlertCircle, ArrowRight, 
  ArrowLeft, ShieldCheck, Landmark, Sparkles,
  Star, Crown, X, Lock, Check, ShoppingCart,
  Coins, ArrowRight as ArrowRightIcon
} from 'lucide-react';

// ─── Packs disponibles ───────────────────────────────────────────────────────
const PACKS = {
  simple: [
    { id: 's1',  nom: '1 jeton',    quantite: 1,  prixHT: 8.00,  prix: 9.60,   badge: null },
    { id: 's5',  nom: '5 jetons',   quantite: 5,  prixHT: 40.00, prix: 48.00,  badge: null },
    { id: 's10', nom: '10 jetons',  quantite: 10, prixHT: 80.00, prix: 96.00,  badge: 'Populaire' },
    { id: 's20', nom: '20 jetons',  quantite: 20, prixHT: 160.00,prix: 192.00, badge: null },
    { id: 's50', nom: '50 jetons',  quantite: 50, prixHT: 400.00,prix: 480.00, badge: 'Meilleur prix' },
  ],
  prestige: [
    { id: 'p1',  nom: '1 jeton',    quantite: 1,  prixHT: 25.00, prix: 30.00,   badge: null },
    { id: 'p5',  nom: '5 jetons',   quantite: 5,  prixHT: 125.00,prix: 150.00,  badge: null },
    { id: 'p10', nom: '10 jetons',  quantite: 10, prixHT: 250.00,prix: 300.00,  badge: 'Populaire' },
    { id: 'p20', nom: '20 jetons',  quantite: 20, prixHT: 500.00,prix: 600.00,  badge: null },
    { id: 'p50', nom: '50 jetons',  quantite: 50, prixHT:1250.00,prix:1500.00,  badge: 'Meilleur prix' },
  ],
};

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

  // Étape 3 : Achat de jetons
  const [garageId, setGarageId] = useState(null);
  const [garageName, setGarageName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState('prestige');
  const [selectedPack, setSelectedPack] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [rgpdConsent, setRgpdConsent] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/connexion'); return; }
      setUser(authUser);
      setUserEmail(authUser.email || '');
      if (authUser.user_metadata?.siret) setSiret(authUser.user_metadata.siret);
    } catch (err) { console.error(err); }
  };

  // ─── Drag & Drop ─────────────────────────────────────────────────────────
  const handleDrag = (e, setDragActive) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e, setDragActive, setFile) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && ['application/pdf','image/png','image/jpeg','image/jpg'].includes(file.type)) setFile(file);
    else if (file) setError('Format non supporté. Veuillez déposer un fichier PDF, PNG ou JPG.');
  };
  const handleFileChange = (e, setFile) => {
    if (e.target.files?.[0]) { setFile(e.target.files[0]); setError(''); }
  };

  // ─── IBAN ─────────────────────────────────────────────────────────────────
  const handleIbanChange = (e) => {
    const raw = e.target.value.replace(/\s+/g, '').toUpperCase();
    if (raw.length <= 34) setIban(raw.match(/.{1,4}/g)?.join(' ') || raw);
  };

  // ─── Validations ──────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!siret.trim()) { setError('Veuillez saisir votre numéro SIRET.'); return false; }
    if (siret.replace(/\s+/g,'').length !== 14) { setError('Le numéro SIRET doit contenir exactement 14 chiffres.'); return false; }
    if (!kbisFile) { setError('Veuillez charger votre document KBIS.'); return false; }
    if (!cniFile)  { setError("Veuillez charger votre pièce d'identité (CNI)."); return false; }
    setError(''); return true;
  };
  const validateStep2 = () => {
    const clean = iban.replace(/\s+/g,'');
    if (!clean) { setError('Veuillez saisir votre code IBAN.'); return false; }
    if (clean.length < 15 || clean.length > 34) { setError('IBAN invalide. Veuillez vérifier votre saisie.'); return false; }
    if (!bic.trim()) { setError('Veuillez saisir votre code BIC.'); return false; }
    if (bic.trim().length < 8 || bic.trim().length > 11) { setError('Code BIC invalide (8 ou 11 caractères).'); return false; }
    if (!ribFile) { setError('Veuillez charger votre justificatif de RIB.'); return false; }
    setError(''); return true;
  };

  // ─── Navigation ───────────────────────────────────────────────────────────
  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(prev => prev + 1);
  };
  const prevStep = () => { setError(''); setStep(prev => prev - 1); };

  // ─── Soumission Onboarding (étape 2) ─────────────────────────────────────
  const handleSubmitOnboarding = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setLoading(true); setError('');
    try {
      if (!user) throw new Error('Session utilisateur introuvable.');
      const userId = user.id;

      const uploadFile = async (file, prefix) => {
        const ext = file.name.split('.').pop();
        const filePath = `onboarding/${userId}/${prefix}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('documents').upload(filePath, file);
        if (upErr) throw new Error(`Erreur upload ${prefix}: ${upErr.message}`);
        return filePath;
      };

      const kbisPath = await uploadFile(kbisFile, 'kbis');
      const ribPath  = await uploadFile(ribFile,  'rib');
      const cniPath  = await uploadFile(cniFile,  'cni');
      let logoPath = null;
      if (logoFile) logoPath = await uploadFile(logoFile, 'logo');

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ siret, kbisPath, iban: iban.replace(/\s+/g,''), bic: bic.trim(), ribPath, cniPath, logoPath }),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Erreur lors de l'enregistrement.");

      await supabase.auth.refreshSession().catch(() => {});

      // Récupérer le garage créé pour l'étape 3
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      if (freshUser) {
        const { data: garage } = await supabase.from('garages').select('id, nom_garage').eq('owner_id', freshUser.id).maybeSingle();
        if (garage) { setGarageId(garage.id); setGarageName(garage.nom_garage); }
        setUserEmail(freshUser.email || '');
      }

      // Passer à l'étape 3 (achat jetons)
      setStep(3);
    } catch (err) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Achat Mollie (étape 3) ───────────────────────────────────────────────
  const handleSelectPack = (pack, type) => {
    setSelectedPack({ ...pack, type });
    setRgpdConsent(false);
    setShowConfirmModal(true);
  };

  const confirmPurchase = async () => {
    if (!selectedPack || !garageId || !rgpdConsent) return;
    setPurchasing(true);
    try {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        localStorage.setItem('local_pending_forfait', JSON.stringify({
          garageId, forfaitId: selectedPack.id, quantite: selectedPack.quantite,
          type: selectedPack.type, prix: selectedPack.prix,
        }));
      }
      const response = await fetch('/api/create-mollie-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forfait: { ...selectedPack, description: `${selectedPack.quantite} jeton${selectedPack.quantite > 1 ? 's' : ''} ${selectedPack.type === 'simple' ? 'Simple' : 'Prestige'}` },
          garageId, garageName, userEmail,
          consent: rgpdConsent,
          consentDate: new Date().toISOString(),
          redirectTo: '/dashboard?bienvenue=1',
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
      else throw new Error('URL de paiement introuvable');
    } catch (err) {
      setError(err.message || 'Erreur lors du paiement.');
      setPurchasing(false);
    }
  };

  const skipToDashboard = () => { window.location.href = '/dashboard'; };

  // ─── Rendu étape 3 ────────────────────────────────────────────────────────
  if (step === 3) {
    const packs = PACKS[activeTab];
    return (
      <div className="max-w-3xl w-full space-y-6 animate-in fade-in duration-300">

        {/* Header */}
        <div className="bg-[var(--white)] rounded-3xl border border-[var(--stone)] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px]" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--blue)]/5 rounded-full blur-[40px]" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-3">
              <Sparkles size={12} className="text-indigo-600" />
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Étape 3 / 3 — Optionnelle</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--ink)] mb-1">Votre compte est activé ! 🎉</h2>
            <p className="text-[var(--muted)] text-sm">Commencez dès maintenant en achetant des jetons de service.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-600 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Onglets Simple / Prestige */}
        <div className="flex gap-2 bg-[var(--white)] border border-[var(--stone)] rounded-2xl p-1.5">
          {[
            { key: 'simple',   label: 'Jetons Simple',   Icon: Star,  color: 'amber' },
            { key: 'prestige', label: 'Jetons Prestige',  Icon: Crown, color: 'blue'  },
          ].map(({ key, label, Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === key
                  ? color === 'amber'
                    ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                    : 'bg-[var(--blue)]/10 text-[var(--blue)] border border-[var(--blue)]/20'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Icon size={14} fill={activeTab === key ? 'currentColor' : 'none'} />
              {label}
            </button>
          ))}
        </div>

        {/* Info type */}
        {activeTab === 'simple' ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center gap-3 text-amber-700 text-sm">
            <Star size={16} fill="currentColor" />
            <span><strong>Jeton Simple</strong> — Création et suivi de vos dossiers de vitrage. <strong>8,00 € HT / 9,60 € TTC</strong> l'unité.</span>
          </div>
        ) : (
          <div className="bg-[var(--blue)]/5 border border-[var(--blue)]/20 rounded-2xl px-5 py-3 flex items-center gap-3 text-[var(--blue)] text-sm">
            <Crown size={16} fill="currentColor" />
            <span><strong>Jeton Prestige</strong> — Prise en charge complète par un gestionnaire dédié. <strong>25,00 € HT / 30,00 € TTC</strong> l'unité.</span>
          </div>
        )}

        {/* Grille des 5 packs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packs.map((pack) => {
            const isPrestige = activeTab === 'prestige';
            return (
              <div
                key={pack.id}
                className={`relative rounded-2xl border p-5 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
                  pack.badge === 'Populaire'
                    ? 'bg-[#120052] border-[var(--blue)]/30 shadow-[0_0_20px_rgba(56,189,248,0.1)]'
                    : 'bg-[var(--white)] border-[var(--stone)]'
                }`}
                onClick={() => handleSelectPack(pack, activeTab)}
              >
                {pack.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest ${
                    pack.badge === 'Populaire'
                      ? 'bg-[var(--blue)] text-white'
                      : 'bg-emerald-500 text-white'
                  }`}>
                    {pack.badge}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isPrestige ? 'bg-[var(--blue)]/10' : 'bg-amber-500/10'
                  }`}>
                    {isPrestige
                      ? <Crown size={18} className="text-[var(--blue)]" fill="currentColor" />
                      : <Star   size={18} className="text-amber-600"     fill="currentColor" />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    isPrestige
                      ? 'bg-[var(--blue)]/10 text-[var(--blue)]'
                      : 'bg-amber-500/10 text-amber-700'
                  }`}>
                    {pack.quantite} jeton{pack.quantite > 1 ? 's' : ''}
                  </span>
                </div>

                <div>
                  <p className={`text-xs font-medium mb-1 ${pack.badge === 'Populaire' ? 'text-white/60' : 'text-[var(--muted)]'}`}>Total HT</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-extrabold ${pack.badge === 'Populaire' ? 'text-[var(--blue)]' : 'text-[var(--ink)]'}`}>
                      {pack.prixHT.toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${pack.badge === 'Populaire' ? 'text-white/50' : 'text-[var(--muted)]'}`}>
                    soit {pack.prix.toFixed(2).replace('.', ',')} € TTC
                  </p>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleSelectPack(pack, activeTab); }}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    pack.badge === 'Populaire'
                      ? 'bg-[var(--blue)] text-white hover:opacity-90'
                      : isPrestige
                        ? 'bg-[var(--blue)]/10 text-[var(--blue)] hover:bg-[var(--blue)]/20'
                        : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20'
                  }`}
                >
                  Commander <ArrowRightIcon size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bouton passer */}
        <div className="text-center pt-2">
          <button
            onClick={skipToDashboard}
            className="text-[var(--muted)] text-sm hover:text-[var(--ink)] transition-colors underline underline-offset-2"
          >
            Passer pour l'instant — accéder au tableau de bord →
          </button>
        </div>

        {/* Modal confirmation */}
        {showConfirmModal && selectedPack && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
            <div className="relative bg-[#0b1528] text-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
              <button onClick={() => setShowConfirmModal(false)} className="absolute top-5 right-5 p-1.5 rounded-lg text-white/40 hover:text-white/80 transition-colors">
                <X size={18} />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-[var(--blue)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--blue)]/20">
                  <ShoppingCart size={24} className="text-[var(--blue)]" />
                </div>
                <h3 className="text-xl font-bold">Récapitulatif de commande</h3>
                <p className="text-white/50 text-xs mt-1">Vérifiez avant de procéder au paiement</p>
              </div>

              <div className="border border-white/10 rounded-2xl p-5 mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Type</span>
                  <span className="font-bold">Jeton {selectedPack.type === 'simple' ? 'Simple' : 'Prestige'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Quantité</span>
                  <span className="font-bold">{selectedPack.quantite} unité{selectedPack.quantite > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Prix unitaire HT</span>
                  <span className="font-bold">{(selectedPack.prixHT / selectedPack.quantite).toFixed(2).replace('.', ',')} €</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between items-end">
                  <div>
                    <span className="text-xs text-white/50 block">Total HT</span>
                    <span className="text-xs text-white/40 italic">TVA 20% ajoutée</span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-[var(--blue)]">{selectedPack.prixHT.toFixed(2).replace('.', ',')} €</span>
                    <span className="text-xs text-white/50 block mt-0.5">soit {selectedPack.prix.toFixed(2).replace('.', ',')} € TTC</span>
                  </div>
                </div>
              </div>

              <div className="mb-6 bg-white/5 p-3.5 rounded-xl border border-white/10">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rgpdConsent}
                    onChange={(e) => setRgpdConsent(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-white/20 text-[var(--blue)] focus:ring-[var(--blue)] cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-white/60 leading-relaxed">
                    J'accepte que mes données soient utilisées pour le paiement sécurisé via Mollie, conformément à la politique de confidentialité de GlassPilot.
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 border border-white/10 rounded-2xl text-white/60 text-sm font-bold hover:bg-white/5 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmPurchase}
                  disabled={!rgpdConsent || purchasing}
                  className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    !rgpdConsent || purchasing
                      ? 'bg-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-[var(--blue)] text-white hover:opacity-90'
                  }`}
                >
                  {purchasing ? <><Loader2 size={16} className="animate-spin" /> Redirection...</> : <><CreditCard size={16} /> Payer {selectedPack.prix.toFixed(2).replace('.', ',')} € TTC</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Rendu étapes 1 & 2 ───────────────────────────────────────────────────
  return (
    <div className="max-w-2xl w-full bg-[var(--white)] rounded-3xl border border-[var(--stone)] shadow-lg p-6 md:p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--blue)]/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--blue)]/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-3">
            <Sparkles size={12} className="text-indigo-600" />
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Parcours d'activation</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif text-[var(--ink)] tracking-tight">Activez votre espace pro</h2>
          <p className="text-[var(--muted)] text-sm font-light mt-1">Veuillez renseigner vos documents légaux pour commencer à créer vos dossiers de vitrage.</p>
        </div>

        {/* Barre de progression 3 étapes */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { num: 1, label: 'KBIS & SIRET', icon: Building2 },
            { num: 2, label: 'RIB & IBAN',   icon: Landmark },
            { num: 3, label: 'Jetons',        icon: Coins },
          ].map((item) => {
            const isActive = step === item.num;
            const isPassed = step > item.num;
            const Icon = item.icon;
            return (
              <div key={item.num} className="relative">
                <div className={`h-1 rounded-full transition-all duration-300 ${isPassed ? 'bg-indigo-600' : isActive ? 'bg-indigo-600/60' : 'bg-slate-100'}`} />
                <div className="flex items-center gap-2 mt-2.5">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${isPassed ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : isActive ? 'bg-indigo-600 text-white shadow-md' : 'bg-transparent border border-slate-100 text-[var(--muted)]'}`}>
                    {isPassed ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Icon size={12} />}
                  </div>
                  <span className={`text-[10px] font-bold tracking-tight uppercase hidden md:inline transition-colors ${isActive ? 'text-indigo-600' : isPassed ? 'text-slate-700' : 'text-[var(--muted)]'}`}>
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Erreurs */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-600 animate-in fade-in duration-200">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={step === 2 ? handleSubmitOnboarding : (e) => e.preventDefault()} className="space-y-6">

          {/* ── ÉTAPE 1 ── */}
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
                  <input type="text" value={siret} onChange={(e) => setSiret(e.target.value.replace(/[^0-9\s]/g, ''))} placeholder="123 456 789 00012"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all placeholder:text-[var(--muted)]" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  {[
                    { label: 'Extrait KBIS', file: kbisFile, setFile: setKbisFile, drag: kbisDragActive, setDrag: setKbisDragActive, required: true },
                    { label: "Carte d'Identité", file: cniFile, setFile: setCniFile, drag: cniDragActive, setDrag: setCniDragActive, required: true },
                  ].map(({ label, file, setFile, drag, setDrag, required }) => (
                    <div key={label}>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label} {required && <span className="text-rose-500">*</span>}</label>
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px]
                          ${drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}
                          ${file ? 'border-emerald-400 bg-emerald-50/30' : ''}`}
                        onDragEnter={(e) => handleDrag(e, setDrag)} onDragLeave={(e) => handleDrag(e, setDrag)}
                        onDragOver={(e) => handleDrag(e, setDrag)} onDrop={(e) => handleDrop(e, setDrag, setFile)}
                      >
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileChange(e, setFile)} />
                        {file ? (
                          <><div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-2"><CheckCircle2 size={20} className="text-emerald-600" /></div>
                          <p className="text-sm font-bold text-emerald-800 line-clamp-1">{file.name}</p>
                          <p className="text-xs text-emerald-600 font-medium mt-1">{(file.size/1024/1024).toFixed(2)} MB</p></>
                        ) : (
                          <><div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-3"><Upload size={18} className="text-slate-500" /></div>
                          <p className="text-sm font-semibold text-[var(--ink)]">Glissez ou cliquez</p>
                          <p className="text-xs text-[var(--muted)] mt-1">PDF, PNG ou JPG (Max 5Mo)</p></>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Logo du Garage <span className="text-[var(--muted)] font-normal ml-1">(Optionnel)</span></label>
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[120px]
                      ${logoDragActive ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}
                      ${logoFile ? 'border-emerald-400 bg-emerald-50/30' : ''}`}
                    onDragEnter={(e) => handleDrag(e, setLogoDragActive)} onDragLeave={(e) => handleDrag(e, setLogoDragActive)}
                    onDragOver={(e) => handleDrag(e, setLogoDragActive)} onDrop={(e) => handleDrop(e, setLogoDragActive, setLogoFile)}
                  >
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".png,.jpg,.jpeg" onChange={(e) => handleFileChange(e, setLogoFile)} />
                    {logoFile ? (
                      <><div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-2"><CheckCircle2 size={20} className="text-emerald-600" /></div>
                      <p className="text-sm font-bold text-emerald-800 line-clamp-1">{logoFile.name}</p></>
                    ) : (
                      <><div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-3"><Upload size={18} className="text-slate-500" /></div>
                      <p className="text-sm font-semibold text-[var(--ink)]">Logo de l'entreprise</p>
                      <p className="text-xs text-[var(--muted)] mt-1">Sera affiché sur vos factures</p></>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 ── */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-[var(--ink)] uppercase tracking-wider mb-2">Code IBAN</label>
                  <div className="relative">
                    <Landmark size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input type="text" required value={iban} onChange={handleIbanChange}
                      className="w-full pl-11 pr-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all font-mono"
                      placeholder="FR76 3000 6000 0112 3456 7890 123" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--ink)] uppercase tracking-wider mb-2">Code BIC / SWIFT</label>
                  <input type="text" required value={bic} onChange={(e) => setBic(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all font-mono"
                    placeholder="CREDFRPPXXX" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--ink)] uppercase tracking-wider mb-2">Justificatif de RIB</label>
                <div
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group
                    ${ribDragActive ? 'border-indigo-600 bg-indigo-50/20' : ribFile ? 'border-emerald-300 bg-emerald-50/10' : 'border-[var(--stone)] hover:border-indigo-400 bg-[var(--white)]'}`}
                  onDragEnter={(e) => handleDrag(e, setRibDragActive)} onDragOver={(e) => handleDrag(e, setRibDragActive)}
                  onDragLeave={(e) => handleDrag(e, setRibDragActive)} onDrop={(e) => handleDrop(e, setRibDragActive, setRibFile)}
                  onClick={() => document.getElementById('rib-upload').click()}
                >
                  <input type="file" id="rib-upload" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileChange(e, setRibFile)} />
                  {ribFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center mb-3"><FileText size={20} className="text-emerald-600" /></div>
                      <p className="text-sm font-semibold text-[var(--ink)] truncate max-w-xs">{ribFile.name}</p>
                      <p className="text-xs text-[var(--muted)] font-light mt-1">{(ribFile.size/1024/1024).toFixed(2)} MB • Fichier prêt</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-[var(--white)] border border-[var(--stone)] rounded-xl flex items-center justify-center mb-3 group-hover:border-indigo-200 transition-all">
                        <Upload size={18} className="text-[var(--muted)] group-hover:text-indigo-600 transition-colors" />
                      </div>
                      <p className="text-sm font-medium text-[var(--ink)]">Glissez-déposez votre RIB ici</p>
                      <p className="text-xs text-[var(--muted)] font-light mt-1">ou cliquez pour parcourir</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Boutons navigation ── */}
          <div className="pt-6 border-t border-[var(--stone)] flex items-center justify-between">
            {step > 1 ? (
              <button type="button" onClick={prevStep} disabled={loading}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)] transition-all disabled:opacity-50">
                <ArrowLeft size={14} /> Retour
              </button>
            ) : <div />}

            {step < 2 ? (
              <button type="button" onClick={nextStep}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md flex items-center gap-2 hover:-translate-y-0.5 text-sm">
                Continuer <ArrowRight size={14} />
              </button>
            ) : (
              <button type="submit" disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md flex items-center gap-2 hover:-translate-y-0.5 disabled:opacity-75 disabled:pointer-events-none text-sm">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Activation en cours...</> : <><ShieldCheck size={16} /> Finaliser mon activation →</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
