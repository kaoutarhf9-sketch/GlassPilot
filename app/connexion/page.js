"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Loader2, ArrowLeft, Eye, EyeOff, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ConnexionPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reset') === 'success') {
        setSuccessMessage("Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.");
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Utilisateur non trouvé');

      // Vérifier si l'utilisateur est un gestionnaire
      const { data: gestionnaire, error: gestionnaireError } = await supabase
        .from('gestionnaires')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      // Vérifier si l'utilisateur est un garagiste
      const { data: garage, error: garageError } = await supabase
        .from('garages')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      // Redirection selon le rôle
      if (user.user_metadata?.role === 'admin') {
        // C'est un administrateur
        router.push('/admin');
      } else if (gestionnaire && !gestionnaireError) {
        // C'est un gestionnaire
        router.push('/gestionnaire/dashboard');
      } else if (garage && !garageError) {
        // C'est un garagiste
        router.push('/dashboard');
      } else {
        // Par défaut, rediriger vers le dashboard garagiste
        router.push('/dashboard');
      }
      
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setError("Email ou mot de passe incorrect. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Figtree:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --white: rgba(15, 23, 42, 0.4);
          --page-bg: #04090f;
          --paper: rgba(11, 19, 41, 0.65);
          --stone: rgba(255, 255, 255, 0.05);
          --ink: #F8FAFC;
          --ink-2: #CBD5E1;
          --muted: #64748B;
          --blue: #38bdf8;
          --blue-light: rgba(56, 189, 248, 0.08);
          --blue-mid: rgba(56, 189, 248, 0.25);
          --green: #10b981;
          --green-light: rgba(16, 185, 129, 0.15);
          --orange: #f97316;
          --orange-light: rgba(249, 115, 22, 0.15);
          --ff-serif: 'Instrument Serif', Georgia, serif;
          --ff-sans: 'Figtree', system-ui, sans-serif;
          --r: 16px;
          --r-sm: 10px;
          --sh-sm: 0 1px 3px rgba(0,0,0,.35),0 1px 2px rgba(0,0,0,.2);
          --sh-md: 0 4px 16px rgba(0,0,0,.45),0 1px 4px rgba(0,0,0,.3);
          --sh-lg: 0 16px 48px rgba(0,0,0,.55),0 4px 12px rgba(0,0,0,.35);
          --sh-xl: 0 32px 80px rgba(0,0,0,.65),0 8px 20px rgba(0,0,0,.4);
        }

        html { scroll-behavior: smooth; }
        body { background: var(--page-bg); color: var(--ink); font-family: var(--ff-sans); overflow-x: hidden; }

        /* NAV */
        .nav {
          position: fixed; top: 0; width: 100%; z-index: 100;
          height: 66px; display: flex; align-items: center; padding: 0 2rem;
          background: rgba(11, 19, 41, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--stone);
          transition: background .35s, box-shadow .35s;
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

        /* SECTION CONNEXION */
        .login-section {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 120px 2rem 80px;
          position: relative;
          overflow: hidden;
          background: var(--page-bg);
        }
        .login-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
        }
        .lb1 { width: 650px; height: 650px; background: rgba(20,84,255,.055); top: -120px; right: -80px; }
        .lb2 { width: 450px; height: 450px; background: rgba(0,135,90,.035); bottom: -60px; left: 5%; }

        .login-in {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 450px;
          gap: 5rem;
          align-items: center;
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
        .login-card {
          background: var(--white);
          border: 1px solid var(--stone);
          border-radius: 32px;
          padding: 3.5rem;
          box-shadow: 0 40px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
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
          font-family: var(--ff-sans); font-weight: 700; font-size: 1rem;
          background: linear-gradient(135deg,#38bdf8,#0284c7); color: #fff; border: none; cursor: pointer;
          width: 100%;
          padding: 1.1rem;
          border-radius: 100px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          box-shadow: 0 6px 28px rgba(56,189,248,.35);
          transition: transform .2s, box-shadow .2s;
        }
        .btn-main:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(56,189,248,.5); }

        .forgot-link {
          font-size: .75rem;
          color: var(--blue);
          text-decoration: none;
        }
        .forgot-link:hover { text-decoration: underline; }

        .signup-link {
          text-align: center;
          margin-top: 1.5rem;
          font-size: .85rem;
          color: var(--muted);
        }
        .signup-link a {
          color: var(--ink);
          font-weight: 700;
          text-decoration: none;
        }
        .signup-link a:hover { color: var(--blue); }

        .security-badges {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 1.5rem;
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

        /* COLONNE DROITE */
        .right-card {
          background: var(--paper);
          border: 1.5px solid var(--stone);
          border-radius: 18px;
          padding: 2rem;
        }
        .right-badge {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          background: var(--white);
          border-radius: 100px;
          padding: .3rem .9rem;
          font-size: .7rem;
          font-weight: 700;
          color: var(--blue);
          margin-bottom: 1.5rem;
        }
        .feature-list {
          list-style: none;
          margin: 1.5rem 0;
        }
        .feature-list li {
          display: flex;
          align-items: center;
          gap: .75rem;
          margin-bottom: 1rem;
          font-size: .85rem;
          color: var(--ink-2);
        }
        .trust-badge {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1.5rem;
          border-top: 1px solid var(--stone);
          margin-top: 1rem;
        }
        .avatars {
          display: flex;
          gap: .5rem;
        }
        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: var(--ink);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--ff-serif);
          font-style: italic;
          font-size: .75rem;
          color: var(--white);
        }
        .stars {
          display: flex;
          gap: 2px;
          color: #F59E0B;
          font-size: .7rem;
        }

        @media (max-width: 1024px) {
          .login-in { grid-template-columns: 1fr; gap: 3rem; }
          .login-section { padding: 100px 1.5rem 60px; }
        }
        @media (max-width: 640px) {
          .nav-lnk, .nav-r { display: none; }
          .nav { padding: 0 1rem; }
        }
      `}</style>

      {/* NAVIGATION - IDENTIQUE */}
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
            <Link href="/inscription" className="btn-n">S'inscrire →</Link>
          </div>
        </div>
      </nav>

      {/* SECTION CONNEXION */}
      <section className="login-section">
        <div className="login-blob lb1" />
        <div className="login-blob lb2" />

        <div className="login-in">
          {/* COLONNE GAUCHE - FORMULAIRE */}
          <div>
            <div className="badge">
              <span style={{ width: 5, height: 5, background: 'var(--blue)', borderRadius: '50%', display: 'inline-block' }} />
              Connexion sécurisée
            </div>
            <h1 style={{ fontFamily: 'var(--ff-serif)', fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 400, marginBottom: '1rem', color: 'var(--ink)' }}>
              Heureux de vous<br />revoir
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
              Connectez-vous pour accéder à votre espace GlassPilot
            </p>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#DC2626' }}>
                <ShieldCheck size={16} />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--green)' }}>
                <CheckCircle2 size={16} />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="login-card">
              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <label className="input-label">Adresse Email</label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="garage@exemple.fr"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                    <label className="input-label">Mot de passe</label>
                    <Link href="/mot-de-passe-oublie" className="forgot-link">Mot de passe oublié ?</Link>
                  </div>
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

                <button type="submit" disabled={loading} className="btn-main">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "Accéder à mon espace →"}
                </button>
              </form>

              <div className="signup-link">
                Nouveau sur GlassPilot ?{' '}
                <Link href="/inscription">Créer un compte</Link>
              </div>

              <div className="security-badges">
                <span><CheckCircle2 size={12} style={{ color: 'var(--green)' }} /> Chiffrement SSL</span>
                <span><CheckCircle2 size={12} style={{ color: 'var(--green)' }} /> RGPD</span>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE - VISUEL */}
          <div className="right-card">
            <div className="right-badge">
              <Sparkles size={12} />
              GlassPilot Pro
            </div>

            <h2 style={{ fontFamily: 'var(--ff-serif)', fontSize: '1.8rem', fontWeight: 400, marginBottom: '1rem', color: 'var(--ink)' }}>
              La gestion de centre<br />réinventée
            </h2>
            <p style={{ fontSize: '.85rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Connectez-vous pour piloter votre activité en temps réel, gérer vos dossiers et accélérer vos paiements.
            </p>

            <ul className="feature-list">
              <li><CheckCircle2 size={16} style={{ color: 'var(--green)' }} /> Tableaux de bord en temps réel</li>
              <li><CheckCircle2 size={16} style={{ color: 'var(--green)' }} /> Cession de créance automatisée</li>
              <li><CheckCircle2 size={16} style={{ color: 'var(--green)' }} /> EDI intégré avec 30+ assureurs</li>
              <li><CheckCircle2 size={16} style={{ color: 'var(--green)' }} /> Espace techniciens web responsive</li>
            </ul>

            <div className="trust-badge">
              <div className="avatars">
                <div className="avatar">JD</div>
                <div className="avatar" style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>MR</div>
                <div className="avatar" style={{ background: 'var(--green-light)', color: 'var(--green)' }}>SA</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.8rem', color: 'var(--ink)' }}>+500 centres équipés</div>
                <div className="stars">★★★★★</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}