"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Loader2, ArrowLeft, Eye, EyeOff, Sparkles, CheckCircle2, ShieldCheck, Check } from 'lucide-react';

export default function ReinitialiserMotDePassePage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Vérifier s'il y a un token de récupération dans l'URL ou une session active
    const checkSession = async () => {
      // Supabase a besoin d'un court instant pour traiter le hash dans l'URL et restaurer la session
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasSession(true);
      } else {
        // En l'absence de session, on vérifie si l'URL contient des fragments typiques de Supabase Auth
        if (typeof window !== 'undefined' && (window.location.hash.includes('access_token') || window.location.hash.includes('error'))) {
          setHasSession(true);
        }
      }
      setSessionChecked(true);
    };

    checkSession();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Optionnel : déconnexion automatique pour forcer l'utilisateur à se reconnecter avec le nouveau mot de passe
      await supabase.auth.signOut();

      setTimeout(() => {
        router.push('/connexion?reset=success');
      }, 2000);

    } catch (err) {
      console.error("Erreur mise à jour mot de passe:", err);
      setError(err.message || "Le lien a expiré ou est invalide. Veuillez effectuer une nouvelle demande.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Figtree:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --white: #FFFFFF;
          --page-bg: #ECFEFF;
          --paper: #F8FAFC;
          --stone: rgba(10, 0, 48, 0.08);
          --ink: #0A0030;
          --ink-2: #120052;
          --muted: #64748B;
          --blue: #3B0FAA;
          --blue-light: rgba(59, 15, 170, 0.08);
          --blue-mid: rgba(59, 15, 170, 0.25);
          --green: #10b981;
          --green-light: rgba(16, 185, 129, 0.15);
          --ff-serif: 'Instrument Serif', Georgia, serif;
          --ff-sans: 'Figtree', system-ui, sans-serif;
          --r: 16px;
          --r-sm: 10px;
          --sh-sm: 0 1px 3px rgba(0,0,0,.35),0 1px 2px rgba(0,0,0,.2);
          --sh-md: 0 4px 16px rgba(0,0,0,.45),0 1px 4px rgba(0,0,0,.3);
        }

        body { background: var(--page-bg); color: var(--ink); font-family: var(--ff-sans); }

        /* NAV */
        .nav {
          position: fixed; top: 0; width: 100%; z-index: 100;
          height: 66px; display: flex; align-items: center; padding: 0 2rem;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--stone);
        }
        .nav-in { max-width: 1200px; margin: 0 auto; width: 100%; display: flex; align-items: center; justify-content: space-between; }

        .logo { display: flex; align-items: center; gap: .5rem; text-decoration: none; }
        .logo-m {
          width: 30px; height: 30px; background: linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%); border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--ff-serif); font-style: italic; font-size: 1.15rem; color: #020617;
          font-weight: 900;
        }
        .logo-t { font-family: var(--ff-sans); font-weight: 700; font-size: .95rem; color: var(--ink); letter-spacing: -.01em; }
        .logo-t span { color: var(--blue); }

        .btn-n {
          font-family: var(--ff-sans); font-weight: 600; font-size: .875rem;
          background: var(--ink); color: var(--white); border: none; cursor: pointer;
          padding: .5rem 1.25rem; border-radius: var(--r-sm); text-decoration: none;
          display: inline-flex; align-items: center; gap: .35rem;
          transition: background .2s, transform .15s;
        }
        .btn-n:hover { background: var(--blue); transform: translateY(-1px); }

        /* SECTION MAIN */
        .main-section {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 2rem 80px;
          position: relative;
          overflow: hidden;
          background: var(--page-bg);
        }
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
        }
        .b1 { width: 650px; height: 650px; background: rgba(20,84,255,.055); top: -120px; right: -80px; }
        .b2 { width: 450px; height: 450px; background: rgba(0,135,90,.035); bottom: -60px; left: 5%; }

        .card-container {
          max-width: 500px;
          width: 100%;
          position: relative;
          z-index: 1;
        }

        /* BADGE */
        .badge {
          display: inline-flex;
          align-items: center;
          gap: .45rem;
          font-size: .7rem;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--blue);
          background: var(--blue-light);
          border: 1px solid var(--blue-mid);
          border-radius: 100px;
          padding: .28rem .85rem;
          margin-bottom: 1.7rem;
        }

        /* FORMULAIRE */
        .card {
          background: var(--white);
          border: 1.5px solid var(--stone);
          border-radius: 18px;
          padding: 2.5rem 2rem;
          box-shadow: 0 15px 60px rgba(10,0,48,0.05);
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-label {
          display: block;
          font-size: .7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .05em;
          color: var(--muted);
          margin-bottom: .5rem;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          pointer-events: none;
        }

        .input-field {
          width: 100%;
          padding: .85rem 1rem .85rem 2.8rem;
          background: var(--paper);
          border: 1.5px solid var(--stone);
          border-radius: 12px;
          font-family: var(--ff-sans);
          font-size: .9rem;
          color: var(--ink);
          transition: all .2s ease;
        }
        .input-field:focus {
          outline: none;
          border-color: var(--blue);
          background: var(--white);
          box-shadow: 0 0 0 3px rgba(20,84,255,.1);
        }

        .btn-main {
          font-family: var(--ff-sans); font-weight: 700; font-size: .9rem;
          background: var(--blue); color: #fff; border: none; cursor: pointer;
          width: 100%;
          padding: .9rem;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .45rem;
          box-shadow: 0 4px 18px rgba(20,84,255,.28);
          transition: transform .2s, box-shadow .2s;
        }
        .btn-main:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(20,84,255,.38); }
        .btn-main:disabled { opacity: 0.7; cursor: not-allowed; transform: none; box-shadow: none; }

        .btn-secondary {
          font-family: var(--ff-sans); font-weight: 600; font-size: .85rem;
          background: transparent; color: var(--ink); border: 1.5px solid var(--stone); cursor: pointer;
          width: 100%;
          padding: .85rem;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .45rem;
          transition: background .2s, border-color .2s;
          text-decoration: none;
          margin-top: 1rem;
        }
        .btn-secondary:hover { background: var(--paper); border-color: var(--muted); }

        .security-badges {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--stone);
          font-size: .7rem;
          color: var(--muted);
        }
        .security-badges span {
          display: inline-flex;
          align-items: center;
          gap: .3rem;
        }
      `}</style>

      {/* NAVIGATION */}
      <nav className="nav">
        <div className="nav-in">
          <Link href="/" className="logo">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover object-center" />
            </div>
            <span className="logo-t">Glass<span>Pilot</span></span>
          </Link>
          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
            <Link href="/" className="lnk" style={{ fontSize: '.875rem', fontWeight: 500, color: 'var(--muted)', textDecoration: 'none' }}>Accueil</Link>
            <Link href="/connexion" className="btn-n">Connexion</Link>
          </div>
        </div>
      </nav>

      {/* CONTENU PRINCIPAL */}
      <section className="main-section">
        <div className="blob b1" />
        <div className="blob b2" />

        <div className="card-container">
          <div className="badge">
            <Sparkles size={12} />
            Sécurité renforcée
          </div>

          <h1 style={{ fontFamily: 'var(--ff-serif)', fontSize: 'clamp(2.2rem, 3.5vw, 3rem)', fontWeight: 400, marginBottom: '1rem', color: 'var(--ink)', lineHeight: 1.1 }}>
            Nouveau mot de passe
          </h1>
          <p style={{ fontSize: '.95rem', color: 'var(--muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Veuillez choisir un mot de passe robuste d'au moins 6 caractères pour sécuriser l'accès à votre espace.
          </p>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#DC2626' }}>
              <ShieldCheck size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="card">
            {!sessionChecked ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--muted)' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto .75rem' }} />
                <span>Chargement de la session de récupération...</span>
              </div>
            ) : !hasSession ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: 56, height: 56, background: '#FEF2F2', color: '#DC2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <ShieldCheck size={32} />
                </div>
                <h2 style={{ fontFamily: 'var(--ff-serif)', fontSize: '1.8rem', fontWeight: 400, marginBottom: '1rem', color: 'var(--ink)' }}>
                  Lien expiré ou invalide
                </h2>
                <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
                  Ce lien de récupération est expiré ou a déjà été utilisé. 
                  Veuillez refaire une demande de mot de passe oublié pour en recevoir un nouveau.
                </p>
                <Link href="/mot-de-passe-oublie" className="btn-main">
                  Refaire une demande
                </Link>
                <Link href="/connexion" className="btn-secondary">
                  Retour à la connexion
                </Link>
              </div>
            ) : !success ? (
              <form onSubmit={handleResetPassword}>
                {/* MOT DE PASSE */}
                <div className="input-group">
                  <label className="input-label">Nouveau mot de passe</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      placeholder="••••••••"
                      style={{ fontFamily: 'monospace' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* CONFIRMATION */}
                <div className="input-group">
                  <label className="input-label">Confirmer le mot de passe</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field"
                      placeholder="••••••••"
                      style={{ fontFamily: 'monospace' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-main">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : (
                    <>
                      Enregistrer le mot de passe
                      <Check size={14} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: 56, height: 56, background: 'var(--green-light)', color: 'var(--green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h2 style={{ fontFamily: 'var(--ff-serif)', fontSize: '1.8rem', fontWeight: 400, marginBottom: '1rem', color: 'var(--ink)' }}>
                  Changement réussi !
                </h2>
                <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Votre mot de passe a été réinitialisé avec succès.
                </p>
                <div style={{ fontSize: '.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                  <Loader2 size={14} className="animate-spin" />
                  Redirection vers l'écran de connexion...
                </div>
              </div>
            )}

            <div className="security-badges">
              <span><CheckCircle2 size={12} style={{ color: 'var(--green)' }} /> Chiffrement fort</span>
              <span><CheckCircle2 size={12} style={{ color: 'var(--green)' }} /> RGPD conforme</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
