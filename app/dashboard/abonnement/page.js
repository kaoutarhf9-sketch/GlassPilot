"use client";

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, CheckCircle2, AlertCircle, Loader2,
  Crown, Star, Zap, ArrowRight, ShoppingCart,
  CreditCard, Shield, X, Lock, Check, Plus, Minus, Coins, ArrowUpRight
} from 'lucide-react';

function AbonnementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [garageId, setGarageId] = useState(null);
  const [garageName, setGarageName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [stock, setStock] = useState({ simple: 0, prestige: 0 });
  const [purchasing, setPurchasing] = useState(false);
  const [selectedForfait, setSelectedForfait] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [rgpdConsent, setRgpdConsent] = useState(false);
  const [activeTab, setActiveTab] = useState('simple');
  const [purchaseQty, setPurchaseQty] = useState({ simple: 1, prestige: 1 });

  // Forfaits disponibles
  const forfaits = {
    simple: [
      { id: 's_unit', nom: 'À l\'unité', type: 'simple', quantite: 1, prixHT: 8.00, prix: 9.60, description: '1 jeton Simple', popular: true, badge: 'Standard' }
    ],
    prestige: [
      { id: 'p_unit', nom: 'À l\'unité', type: 'prestige', quantite: 1, prixHT: 25.00, prix: 30.00, description: '1 jeton Prestige', popular: true, badge: 'Premium' }
    ]
  };

  const qtyOptions = [1, 5, 10, 20, 50];

  useEffect(() => {
    const successParam = searchParams.get('success');
    const canceledParam = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');
    const typeParam = searchParams.get('type');

    if (typeParam === 'prestige' || typeParam === 'simple') {
      setActiveTab(typeParam);
    }

    if (successParam === 'true') {
      setSuccess('✅ Transaction validée ! Vos jetons seront crédités d\'ici quelques instants.');
      
      // HACK LOCAL : Simulation du webhook pour le développement local
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        const localForfait = localStorage.getItem('local_pending_forfait');
        if (localForfait) {
           fetch('/api/simulate-webhook', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: localForfait
           }).then(() => {
             localStorage.removeItem('local_pending_forfait');
             fetchData();
           });
        }
      }

      setTimeout(() => setSuccess(''), 6000);
      router.replace('/dashboard/abonnement');
      fetchData();
      return;
    }

    if (canceledParam === 'true') {
      setError('❌ Paiement annulé. Aucun montant n\'a été débité.');
      setTimeout(() => setError(''), 5000);
      router.replace('/dashboard/abonnement');
    }

    fetchData();
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/connexion');
        return;
      }

      setUserEmail(user.email);

      const { data: garage } = await supabase
        .from('garages')
        .select('id, nom_garage')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!garage) {
        router.push('/dashboard/onboarding');
        return;
      }

      setGarageId(garage.id);
      setGarageName(garage.nom_garage);
        
        // Récupérer le token de session Supabase pour l'authentification
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/get-stock', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });
        const stockData = await res.json();
        
        if (res.ok) {
          setStock({
            simple: stockData.simple,
            prestige: stockData.prestige
          });
        } else {
          console.error("Erreur de récupération du stock via API:", stockData.error);
        }

    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndRefresh = async () => {
    // With Mollie, the webhook handles the database update.
    // We just refresh the local state to see if the tokens arrived.
    await fetchData();
  };

  const handlePurchase = (forfait) => {
    const qty = forfait.type === 'simple' ? purchaseQty.simple : purchaseQty.prestige;
    setSelectedForfait({
      ...forfait,
      quantite: qty,
      prix: forfait.prix * qty,
      description: `${qty} jeton${qty > 1 ? 's' : ''} ${forfait.type === 'simple' ? 'Simple' : 'Prestige'}`
    });
    setRgpdConsent(false);
    setShowConfirmModal(true);
  };

  const confirmPurchase = async () => {
    if (!selectedForfait) {
      setError("Erreur : Aucun forfait sélectionné.");
      return;
    }
    if (!garageId) {
      setError("Erreur d'authentification : Impossible d'identifier votre garage.");
      return;
    }
    if (!rgpdConsent) {
      setError('Veuillez accepter les conditions RGPD pour continuer');
      return;
    }
    
    setPurchasing(true);
    setError('');
    
    try {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        localStorage.setItem('local_pending_forfait', JSON.stringify({
          garageId,
          forfaitId: selectedForfait.id,
          quantite: selectedForfait.quantite,
          type: selectedForfait.type,
          prix: selectedForfait.prix
        }));
      }

      const response = await fetch('/api/create-mollie-payment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forfait: selectedForfait,
          garageId,
          garageName,
          userEmail,
          consent: rgpdConsent,
          consentDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Response error:', text);
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de paiement non trouvée');
      }

    } catch (err) {
      console.error('Erreur détaillée:', err);
      setError(err.message || "Erreur lors de l'initialisation du paiement. Veuillez réessayer.");
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-[var(--blue)] rounded-full animate-ping opacity-20"></div>
            <Loader2 size={48} className="animate-spin text-[var(--blue)] mx-auto relative z-10" />
          </div>
          <p className="text-[var(--muted)] font-light">Chargement des offres en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 font-sans max-w-5xl mx-auto pb-12">
      
      {/* En-tête de page moderne */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-[var(--white)] shadow-md rounded-full px-4.5 py-1.5 border border-[var(--stone)]">
          <Sparkles size={13} className="text-[var(--blue)] animate-pulse" />
          <span className="text-xs font-bold text-[var(--blue)] uppercase tracking-wider">Achat de crédits</span>
        </div>
        <h1 className="text-3xl md:text-4.5xl font-extrabold text-[var(--ink)] tracking-tight leading-tight">
          Jetons GlassPilot
        </h1>
        <p className="text-[var(--muted)] font-normal text-base md:text-lg">
          Achetez des jetons de service à l'unité pour piloter et traiter vos dossiers de vitrage sans engagement.
        </p>
      </div>

      {/* Messages de statut */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="p-1 bg-rose-100 rounded-lg">
            <AlertCircle size={18} />
          </div>
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-600 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="p-1 bg-emerald-100 rounded-lg">
            <CheckCircle2 size={18} />
          </div>
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}

      {/* Section des Portefeuilles Digitaux (Solde Actuel) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Wallet Simple Tokens */}
        <div className="relative overflow-hidden rounded-3xl bg-[var(--white)] border border-[var(--stone)] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(245,158,11,0.06)] hover:-translate-y-1 group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-amber-400/10 to-orange-400/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />
          
          <div className="flex justify-between items-start mb-10">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full w-fit">
                Compte Standard
              </span>
              <h4 className="text-xs font-bold text-[var(--muted)] mt-2 tracking-widest">SOLDE JETONS SIMPLE</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Star size={22} className="text-amber-600" fill="currentColor" />
            </div>
          </div>

          <div className="flex items-end justify-between relative z-10">
            <div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-5xl font-extrabold tracking-tight text-[var(--ink)] font-sans">
                  {stock.simple}
                </span>
                <span className="text-sm font-semibold text-[var(--muted)]">jeton{stock.simple > 1 ? 's' : ''}</span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-2 font-normal">Pour la création et gestion de dossiers standards</p>
            </div>
            
            <div className="w-10 h-7 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-400/10 border border-amber-500/20 flex items-center justify-center shadow-md">
              <Coins size={14} className="text-amber-600" />
            </div>
          </div>
        </div>

        {/* Wallet Prestige Tokens */}
        <div className="relative overflow-hidden rounded-3xl bg-[var(--white)] border border-[var(--stone)] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(20,84,255,0.06)] hover:-translate-y-1 group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-blue-400/10 to-indigo-400/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />
          
          <div className="flex justify-between items-start mb-10">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[var(--blue)] uppercase tracking-widest bg-[var(--blue)]/10 border border-[var(--blue)]/20 px-2.5 py-1 rounded-full w-fit">
                Compte Premium
              </span>
              <h4 className="text-xs font-bold text-[var(--muted)] mt-2 tracking-widest">SOLDE JETONS PRESTIGE</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[var(--blue)]/10 border border-[var(--blue)]/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Crown size={22} className="text-[var(--blue)]" fill="currentColor" />
            </div>
          </div>

          <div className="flex items-end justify-between relative z-10">
            <div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-5xl font-extrabold tracking-tight text-[var(--ink)] font-sans">
                  {stock.prestige}
                </span>
                <span className="text-sm font-semibold text-[var(--muted)]">jeton{stock.prestige > 1 ? 's' : ''}</span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-2 font-normal">Traitement administratif complet et relances prioritaires</p>
            </div>
            
            <div className="w-10 h-7 rounded-lg bg-gradient-to-br from-[#1454FF]/20 to-indigo-500/10 border border-[var(--blue)]/20 flex items-center justify-center shadow-md">
              <Coins size={14} className="text-[var(--blue)]" />
            </div>
          </div>
        </div>

      </div>

      {/* Grid de Cartes de Commande */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CARTE ACHAT JETONS SIMPLE */}
        {forfaits.simple.map((forfait) => (
          <div 
            key={forfait.id} 
            className="bg-[var(--white)] rounded-3xl p-8 border border-[var(--stone)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.8)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative group"
          >
            <div>
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-700 border border-amber-500/20 rounded-full text-xs font-bold mb-3">
                    <Star size={12} fill="currentColor" />
                    Standard
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--ink)] tracking-tight">Jeton Simple</h2>
                  <p className="text-xs text-[var(--muted)] mt-1 font-normal">Idéal pour créer et suivre vos dossiers standards</p>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-md group-hover:rotate-12 transition-transform duration-300">
                  <Star size={24} className="text-amber-600" fill="currentColor" />
                </div>
              </div>

              {/* Affichage du Prix Total Dynamique */}
              <div className="bg-transparent/50 rounded-2xl p-5 border border-[var(--stone)]/50 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">TOTAL HT</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-[var(--blue)] font-sans tracking-tight">
                      {(forfait.prixHT * purchaseQty.simple).toFixed(2).replace('.', ',')}€
                    </span>
                    <span className="text-xs text-[var(--muted)] font-medium">HT</span>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-end h-full">
                  <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">TOTAL TTC</p>
                  <p className="text-sm font-semibold text-[var(--ink-2)]">{(forfait.prix * purchaseQty.simple).toFixed(2).replace('.', ',')}€</p>
                </div>
              </div>

              {/* Sélecteur de Quantité Interactif */}
              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                  <span>Sélectionnez la quantité</span>
                  <span className="text-[var(--blue)] bg-[var(--blue)]/10 px-2 py-0.5 rounded-md">{purchaseQty.simple} unité{purchaseQty.simple > 1 ? 's' : ''}</span>
                </div>
                
                {/* Pilules de quantité rapide */}
                <div className="flex items-center gap-2">
                  {qtyOptions.map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setPurchaseQty(p => ({ ...p, simple: qty }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
 purchaseQty.simple === qty
 ? 'bg-[var(--blue)] text-[var(--ink)] border-slate-900 shadow-md'
 : 'bg-[var(--white)] text-[var(--muted)] border-[var(--stone)] hover:border-amber-500 hover:text-amber-700'
 }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>

                {/* Ajustement manuel */}
                <div className="flex items-center justify-between bg-transparent/50 p-2.5 rounded-xl border border-[var(--stone)]/50">
                  <span className="text-xs font-semibold text-[var(--muted)] pl-2">Ajustement précis :</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPurchaseQty(p => ({ ...p, simple: Math.max(1, p.simple - 1) }))}
                      className="w-8 h-8 rounded-lg bg-[var(--white)] border border-[var(--stone)] flex items-center justify-center text-[var(--muted)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-all shadow-md active:scale-95"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={purchaseQty.simple}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setPurchaseQty(p => ({ ...p, simple: isNaN(val) ? 1 : Math.max(1, Math.min(100, val)) }));
                      }}
                      className="w-12 text-center font-bold text-[var(--ink)] text-sm bg-transparent border-none focus:outline-none focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setPurchaseQty(p => ({ ...p, simple: Math.min(100, p.simple + 1) }))}
                      className="w-8 h-8 rounded-lg bg-[var(--white)] border border-[var(--stone)] flex items-center justify-center text-[var(--muted)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-all shadow-md active:scale-95"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Inclusions */}
              <div className="space-y-4 mb-8 border-t border-[var(--stone)] pt-6">
                <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Fonctionnalités incluses :</p>
                <ul className="space-y-3.5 text-sm text-[var(--muted)]">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                    <span>Création complète de dossier sinistre</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                    <span>Signature électronique de cession de créance</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                    <span>Facturation & devis illimités</span>
                  </li>
                  <li className="flex items-center gap-3 text-[var(--muted)]/80">
                    <div className="w-5 h-5 rounded-full bg-[var(--stone)] flex items-center justify-center text-[var(--muted)] shrink-0">
                      <X size={12} className="stroke-[2.5]" />
                    </div>
                    <span className="line-through">Relances et traitement par gestionnaire</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Commande */}
            <button
              onClick={() => handlePurchase(forfait)}
              className="w-full py-4 bg-[var(--blue)] text-[var(--ink)] rounded-2xl font-bold hover:bg-[var(--blue)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--blue)]/10 hover:shadow-blue-500/20"
            >
              Commander Simple <ArrowRight size={16} />
            </button>
          </div>
        ))}
        
        {/* CARTE ACHAT JETONS PRESTIGE */}
        {forfaits.prestige.map((forfait) => (
          <div 
            key={forfait.id} 
            className="bg-[var(--white)] rounded-3xl p-8 border border-[var(--blue)]/40 shadow-[0_20px_60px_rgba(56,189,248,0.15)] hover:shadow-[0_20px_60px_rgba(56,189,248,0.3)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative group"
          >
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[var(--blue)] to-[#0284c7] text-[var(--ink)] text-[10px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
              Recommandé
            </div>
            
            <div>
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--blue)]/100/10 text-[var(--blue)] border border-[var(--blue)]/20 rounded-full text-xs font-bold mb-3">
                    <Crown size={12} fill="currentColor" />
                    Premium
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--ink)] tracking-tight">Jeton Prestige</h2>
                  <p className="text-xs text-[var(--muted)] mt-1 font-normal">Prise en charge complète de vos dossiers par nos experts</p>
                </div>
                <div className="w-12 h-12 bg-[var(--blue)]/10 rounded-2xl flex items-center justify-center border border-[var(--blue)]/20 shadow-md group-hover:rotate-12 transition-transform duration-300">
                  <Crown size={24} className="text-[var(--blue)]" fill="currentColor" />
                </div>
              </div>

              {/* Affichage du Prix Total Dynamique */}
              <div className="bg-transparent/50 rounded-2xl p-5 border border-[var(--stone)]/50 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">TOTAL HT</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-[var(--blue)] font-sans tracking-tight">
                      {(forfait.prixHT * purchaseQty.prestige).toFixed(2).replace('.', ',')}€
                    </span>
                    <span className="text-xs text-[var(--muted)] font-medium">HT</span>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-end h-full">
                  <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">TOTAL TTC</p>
                  <p className="text-sm font-semibold text-[var(--ink-2)]">{(forfait.prix * purchaseQty.prestige).toFixed(2).replace('.', ',')}€</p>
                </div>
              </div>

              {/* Sélecteur de Quantité Interactif */}
              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center text-xs font-bold text-[var(--muted)] tracking-wider uppercase">
                  <span>Sélectionnez la quantité</span>
                  <span className="text-[var(--blue)] bg-[var(--blue)]/10 px-2 py-0.5 rounded-md">{purchaseQty.prestige} unité{purchaseQty.prestige > 1 ? 's' : ''}</span>
                </div>
                
                {/* Pilules de quantité rapide */}
                <div className="flex items-center gap-2">
                  {qtyOptions.map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setPurchaseQty(p => ({ ...p, prestige: qty }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
 purchaseQty.prestige === qty
 ? 'bg-[var(--blue)] text-[var(--ink)] border-[var(--blue)] shadow-md'
 : 'bg-[var(--white)] text-[var(--muted)] border-[var(--stone)] hover:border-[var(--blue)] hover:text-[var(--blue)]'
 }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>

                {/* Ajustement manuel */}
                <div className="flex items-center justify-between bg-transparent/50 p-2.5 rounded-xl border border-[var(--stone)]/50">
                  <span className="text-xs font-semibold text-[var(--muted)] pl-2">Ajustement précis :</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPurchaseQty(p => ({ ...p, prestige: Math.max(1, p.prestige - 1) }))}
                      className="w-8 h-8 rounded-lg bg-[var(--white)] border border-[var(--stone)] flex items-center justify-center text-[var(--muted)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-all shadow-md active:scale-95"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={purchaseQty.prestige}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setPurchaseQty(p => ({ ...p, prestige: isNaN(val) ? 1 : Math.max(1, Math.min(100, val)) }));
                      }}
                      className="w-12 text-center font-bold text-[var(--ink)] text-sm bg-transparent border-none focus:outline-none focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setPurchaseQty(p => ({ ...p, prestige: Math.min(100, p.prestige + 1) }))}
                      className="w-8 h-8 rounded-lg bg-[var(--white)] border border-[var(--stone)] flex items-center justify-center text-[var(--muted)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-all shadow-md active:scale-95"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Inclusions */}
              <div className="space-y-4 mb-8 border-t border-[var(--stone)] pt-6">
                <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Fonctionnalités incluses :</p>
                <ul className="space-y-3.5 text-sm text-[var(--muted)]">
                  <li className="flex items-center gap-3 font-semibold text-[var(--ink)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--blue)]/10 flex items-center justify-center text-[var(--blue)] shrink-0">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                    <span>Tout l'inclus de l'offre Simple</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                    <span>Accompagnement & relances régulières</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                    <span>Saisie complète des dossiers par le gestionnaire</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                    <span>Support client prioritaire 24h/24 & 7j/7</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Commande */}
            <button
              onClick={() => handlePurchase(forfait)}
              className="w-full py-4 bg-[var(--blue)] text-[var(--ink)] rounded-2xl font-bold hover:bg-[var(--blue)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-[var(--blue)]/20"
            >
              Commander Prestige <ArrowRight size={16} />
            </button>
          </div>
        ))}
        
      </div>

      {/* Trust & Securité Banner */}
      <div className="bg-[var(--white)] rounded-3xl border border-[var(--stone)] p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--ink-2)] transition-colors">
              <Lock size={15} className="text-[var(--muted)]" />
              <span className="text-xs font-semibold">Paiement 100% sécurisé</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-[var(--stone)]" />
            <div className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--ink-2)] transition-colors">
              <Shield size={15} className="text-[var(--muted)]" />
              <span className="text-xs font-semibold">Paiement sécurisé</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-[var(--stone)]" />
            <div className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--ink-2)] transition-colors">
              <CreditCard size={15} className="text-[var(--muted)]" />
              <span className="text-xs font-semibold">Toutes cartes bancaires</span>
            </div>
          </div>
          <Link 
            href="/mentions-legales" 
            className="text-xs text-[var(--blue)] hover:text-[#0ea5e9] font-bold inline-flex items-center gap-1 group"
          >
            Mentions légales & RGPD
            <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Modal de Confirmation Facturation (Receipt style) */}
      {showConfirmModal && selectedForfait && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[var(--blue)]/40 transition-opacity duration-300" 
            onClick={() => setShowConfirmModal(false)} 
          />
          
          <div className="relative bg-[var(--white)] rounded-3xl max-w-md w-full p-8 shadow-2xl border border-[var(--stone)] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Header Modal */}
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--muted)] hover:bg-[var(--stone)] transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-[var(--blue)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--blue)]/20">
                <ShoppingCart size={24} className="text-[var(--blue)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--ink)] tracking-tight">Récapitulatif de commande</h3>
              <p className="text-[var(--muted)] text-xs mt-1">Veuillez vérifier les informations ci-dessous avant le paiement.</p>
            </div>
            
            {/* Ticket de facturation */}
            <div className="border border-[var(--stone)]/60 bg-transparent/50 rounded-2xl p-5 mb-6 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--muted)] font-medium">Offre sélectionnée</span>
                <span className="font-bold text-[var(--ink)] uppercase tracking-wider text-[10px] bg-[var(--stone)]/50 px-2 py-0.5 rounded-md">
                  Jeton {selectedForfait.type === 'simple' ? 'Simple' : 'Prestige'}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--muted)] font-medium">Quantité</span>
                <span className="font-bold text-[var(--ink)]">{selectedForfait.quantite} unité{selectedForfait.quantite > 1 ? 's' : ''}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--muted)] font-medium">Prix unitaire HT</span>
                <span className="font-bold text-[var(--ink)]">{selectedForfait.prixHT.toFixed(2).replace('.', ',')}€ HT</span>
              </div>
              
              <div className="border-t border-[var(--stone)]/60 pt-4 flex justify-between items-end">
                <div>
                  <span className="text-xs text-[var(--muted)] font-semibold block mb-0.5">Montant Total HT</span>
                  <span className="text-[10px] text-[var(--muted)] font-normal italic">TVA 20% ajoutée lors du paiement</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-[var(--blue)] tracking-tight leading-none block">
                    {(selectedForfait.prixHT * selectedForfait.quantite).toFixed(2).replace('.', ',')}€
                  </span>
                  <span className="text-xs text-[var(--muted)] font-semibold mt-1 block">Soit {(selectedForfait.prix * selectedForfait.quantite).toFixed(2).replace('.', ',')}€ TTC</span>
                </div>
              </div>
            </div>

            {/* Consentement RGPD */}
            <div className="mb-6 bg-transparent/30 p-3.5 rounded-xl border border-[var(--stone)]">
              <label htmlFor="rgpd-consent-checkbox" className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="rgpd-consent-checkbox"
                  checked={rgpdConsent}
                  onChange={(e) => setRgpdConsent(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-[var(--stone)] text-[var(--blue)] focus:ring-[#1454FF] cursor-pointer shrink-0 transition-colors"
                />
                <span className="text-xs text-[var(--muted)] leading-relaxed font-normal">
                  J'accepte que mes données soient utilisées pour le paiement sécurisé via Mollie, conformément aux{' '}
                  <Link href="/politique-confidentialite" target="_blank" className="text-[var(--blue)] hover:underline font-semibold">
                    politiques de confidentialité
                  </Link>
                  {' '}et aux{' '}
                  <Link href="/mentions-legales" target="_blank" className="text-[var(--blue)] hover:underline font-semibold">
                    CGU
                  </Link> de GlassPilot.
                </span>
              </label>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 border border-[var(--stone)] rounded-2xl text-[var(--muted)] text-sm font-bold hover:bg-[var(--stone)] transition-colors active:scale-98"
              >
                Annuler
              </button>
              <button
                onClick={confirmPurchase}
                disabled={!rgpdConsent || purchasing}
                className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-98 shadow-md ${
 !rgpdConsent || purchasing
 ? 'bg-[var(--stone)] text-[var(--muted)] border border-[var(--stone)]/50 cursor-not-allowed shadow-none'
 : 'bg-[var(--blue)] text-[var(--ink)] hover:bg-[var(--blue)] hover:shadow-[#1454FF]/10'
 }`}
              >
                {purchasing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Redirection...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>Payer {(selectedForfait.prix * selectedForfait.quantite).toFixed(2).replace('.', ',')}€ TTC</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AbonnementPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={48} className="animate-spin text-[var(--blue)]" />
      </div>
    }>
      <AbonnementContent />
    </Suspense>
  );
}