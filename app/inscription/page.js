"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Mail, Lock, User, Phone, MapPin, FileText, 
  Loader2, Send, CheckCircle2, ArrowRight, AlertCircle, 
  Eye, EyeOff, Shield
} from 'lucide-react';
import Link from 'next/link';
import AddressAutocomplete from '@/app/components/AddressAutocomplete';

export default function InscriptionGaragiste() {
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const [formData, setFormData] = useState({
    email: '', password: '', prenom: '', nom_garage: '',
    responsable: '', telephone: '', adresse: '', code_postal: '', ville: '', siret: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStatus({ type: '', message: '' });
  };

  const handleInscription = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          prenom: formData.prenom,
          nom_garage: formData.nom_garage,
          responsable: formData.responsable,
          telephone: formData.telephone,
          adresse: `${formData.adresse}, ${formData.code_postal} ${formData.ville}`.trim().replace(/^,\s*/, ''),
          siret: formData.siret
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      setIsSubmitted(true);

    } catch (error) {
      setStatus({ type: 'error', message: error.message || "Une erreur est survenue." });
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[var(--blue)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Send size={40} className="text-white animate-bounce" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-[var(--ink)] mb-3">
            Vérifiez vos emails !
          </h2>
          <p className="text-[var(--muted)] mb-6 leading-relaxed">
            Un lien de confirmation vient d'être envoyé à{' '}
            <span className="font-bold text-[var(--blue)]">{formData.email}</span>.
          </p>
          <p className="text-[var(--muted)] text-sm mb-8">
            Cliquez sur le lien pour activer votre compte GlassPilot.
          </p>
          <Link 
            href="/connexion"
            className="inline-flex items-center gap-2 bg-[var(--blue)] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md"
          >
            Retour à la connexion
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Figtree:wght@300;400;500;600;700;800&display=swap');
        
        :root {
          --white: rgba(11, 19, 41, 0.45);
          --page-bg: #020617;
          --paper: #04090f;
          --stone: rgba(56, 189, 248, 0.15);
          --ink: #FFFFFF;
          --ink-2: #F1F5F9;
          --muted: #94a3b8;
          --blue: #38bdf8;
        }
        
        body { background: var(--page-bg); color: var(--ink); }
        
        .font-serif { font-family: 'Instrument Serif', Georgia, serif; }
        .font-sans { font-family: 'Figtree', system-ui, sans-serif; }
      `}</style>

      <div className="min-h-screen bg-transparent font-sans">
        
        {/* Effets de fond */}
        <div className="fixed top-0 -left-48 w-96 h-96 bg-[var(--blue)]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>
        <div className="fixed bottom-0 -right-48 w-96 h-96 bg-[var(--blue)]/5 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12">
          
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-3 mb-12 group">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover object-center" />
            </div>
            <span className="text-xl font-bold text-[var(--ink)] tracking-tight">
              Glass<span className="text-[var(--blue)]">Pilot</span>
            </span>
          </Link>

          <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            {/* COLONNE GAUCHE - FORMULAIRE */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[var(--white)] shadow-sm rounded-full px-4 py-2 mb-8 border border-[var(--stone)]">
                <span className="w-2 h-2 bg-[var(--blue)] rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-[var(--blue)]">Inscription professionnelle</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-serif text-[var(--ink)] mb-4">
                Créez votre espace pro
              </h1>
              <p className="text-[var(--muted)] text-lg mb-8">
                Rejoignez la plateforme et gérez vos dossiers de vitrage.
              </p>

              {status.message && status.type === 'error' && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-sm text-rose-600">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <span>{status.message}</span>
                </div>
              )}

              <div className="bg-[var(--white)] rounded-[32px] border border-[var(--stone)] p-10 shadow-[0_15px_60px_rgba(10,0,48,0.05)] backdrop-blur-xl">
                <form onSubmit={handleInscription} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
                        Prénom
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                        <input
                          type="text"
                          name="prenom"
                          required
                          value={formData.prenom}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
                          placeholder="Jean"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
                        Nom du garage
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                        <input
                          type="text"
                          name="nom_garage"
                          required
                          value={formData.nom_garage}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
                          placeholder="AutoGlass Pro"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
                      Nom du responsable
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      <input
                        type="text"
                        name="responsable"
                        required
                        value={formData.responsable}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
                        placeholder="Jean Dupont"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
                        Email
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
                          placeholder="contact@mon-centre.fr"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
                        Téléphone
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                        <input
                          type="tel"
                          name="telephone"
                          required
                          value={formData.telephone}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
                          placeholder="01 23 45 67 89"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
                        Adresse
                      </label>
                      <AddressAutocomplete
                        name="adresse"
                        required
                        value={formData.adresse}
                        onChange={handleChange}
                        onSelect={(sugg) => {
                          setFormData(prev => ({
                            ...prev,
                            adresse: sugg.nom_rue,
                            code_postal: sugg.code_postal,
                            ville: sugg.ville
                          }));
                        }}
                        className="w-full pl-11 pr-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
                        Code postal
                      </label>
                      <AddressAutocomplete
                        name="code_postal"
                        searchType="municipality"
                        required
                        value={formData.code_postal}
                        onChange={handleChange}
                        onSelect={(sugg) => {
                          setFormData(prev => ({
                            ...prev,
                            ...(sugg.nom_rue && { adresse: sugg.nom_rue }),
                            ...(sugg.code_postal && { code_postal: sugg.code_postal }),
                            ...(sugg.ville && { ville: sugg.ville })
                          }));
                        }}
                        className="w-full pl-11 pr-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
                        placeholder="75001"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
                        Ville
                      </label>
                      <AddressAutocomplete
                        name="ville"
                        searchType="municipality"
                        required
                        value={formData.ville}
                        onChange={handleChange}
                        onSelect={(sugg) => {
                          setFormData(prev => ({
                            ...prev,
                            ...(sugg.nom_rue && { adresse: sugg.nom_rue }),
                            ...(sugg.code_postal && { code_postal: sugg.code_postal }),
                            ...(sugg.ville && { ville: sugg.ville })
                          }));
                        }}
                        className="w-full pl-11 pr-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
                        placeholder="Paris"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
                        SIRET
                      </label>
                      <div className="relative">
                        <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                        <input
                          type="text"
                          name="siret"
                          required
                          value={formData.siret}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
                          placeholder="123 456 789 00012"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-11 pr-12 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all font-mono"
                        placeholder="6 caractères minimum"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--muted)] hover:text-[var(--blue)] transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-1.5 flex items-center gap-1">
                      <Shield size={10} /> 6 caractères minimum
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[var(--blue)] hover:bg-[#7dd3fc] text-white font-bold py-4 px-6 rounded-full transition-all shadow-[0_6px_20px_rgba(59,15,170,0.3)] hover:shadow-[0_12px_30px_rgba(59,15,170,0.4)] hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Créer mon compte →"}
                  </button>

                  <div className="text-center text-sm text-[var(--muted)]">
                    Déjà inscrit ?{' '}
                    <Link href="/connexion" className="font-semibold text-[var(--ink)] hover:text-[var(--blue)] transition-colors">
                      Se connecter
                    </Link>
                  </div>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[var(--stone)]"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-[var(--white)] text-[var(--muted)]">Inscription sécurisée</span>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4 text-xs text-[var(--muted)]">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-[#10b981]" /> Sécurisé
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-[#10b981]" /> RGPD
                    </span>
                  </div>
                </form>
              </div>
            </div>

            {/* COLONNE DROITE - VISUEL */}
            <div className="hidden lg:block h-full">
              <div className="bg-gradient-to-b from-[var(--surface)] to-[var(--surface2)] rounded-[32px] border border-[var(--stone)] p-12 relative overflow-hidden h-full flex flex-col justify-center shadow-[0_15px_60px_rgba(56,189,248,0.05)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--blue)]/20 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--blue)]/10 rounded-full blur-[80px]"></div>
                
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--blue)]/10 border border-[var(--blue)]/20 mb-8">
                    <span className="w-2 h-2 bg-[var(--blue)] rounded-full animate-pulse shadow-[0_0_10px_#38bdf8]"></span>
                    <span className="text-xs font-bold text-[var(--blue)] tracking-wider uppercase">GlassPilot Pro</span>
                  </div>

                  <h2 className="text-4xl font-serif text-[var(--ink)] mb-6 leading-tight">
                    Rejoignez les centres<br />qui réinventent leur gestion
                  </h2>
                  <p className="text-[var(--ink-2)] text-base mb-10 leading-relaxed font-light">
                    Passez moins de temps sur la paperasse et plus de temps sur l'essentiel.
                  </p>

                  <div className="space-y-5 mb-12">
                    {[
                      "Création de compte rapide",
                      "Gestion simplifiée des dossiers",
                      "Support prioritaire 24/7",
                      "Hébergement France RGPD"
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <CheckCircle2 size={20} className="text-[var(--blue)] drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                        <span className="text-[var(--ink-2)] font-light">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-8 border-t border-[var(--stone)]">
                    <div className="flex -space-x-3">
                      <div className="w-10 h-10 rounded-full border-2 border-[#04090f] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">JD</div>
                      <div className="w-10 h-10 rounded-full border-2 border-[#04090f] bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">MR</div>
                      <div className="w-10 h-10 rounded-full border-2 border-[#04090f] bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">SA</div>
                    </div>
                    <div className="text-right">
                      <p className="text-[var(--ink)] font-semibold text-sm mb-1">+ 1 500 centres équipés</p>
                      <div className="flex justify-end gap-1 mt-1">
                        {[1,2,3,4,5].map(i => (
                          <svg key={i} className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.5)]" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}