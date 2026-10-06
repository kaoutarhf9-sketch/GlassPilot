"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, Sparkles, CheckCircle2, ShieldCheck, Send } from 'lucide-react';

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'envoi.");
      }

      setSuccess(true);
    } catch (err) {
      console.error("Erreur de demande de réinitialisation:", err);
      setError(err.message || "Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
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
          --white: rgba(11, 19, 41, 0.45);
          --page-bg: #020617;
          --paper: #04090f;
          --stone: rgba(56, 189, 248, 0.15);
          --ink: #FFFFFF;
          --ink-2: #F1F5F9;
          --muted: #94a3b8;
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
          background: rgba(2, 6, 23, 0.85);
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
            Récupération de compte
          </div>

          <h1 style={{ fontFamily: 'var(--ff-serif)', fontSize: 'clamp(2.2rem, 3.5vw, 3rem)', fontWeight: 400, marginBottom: '1rem', color: 'var(--ink)', lineHeight: 1.1 }}>
            Mot de passe oublié ?
          </h1>
          <p style={{ fontSize: '.95rem', color: 'var(--muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Pas d'inquiétude. Entrez votre adresse e-mail ci-dessous et nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe.
          </p>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#DC2626' }}>
              <ShieldCheck size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="card">
            {!success ? (
              <form onSubmit={handleResetRequest}>
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

                <button type="submit" disabled={loading} className="btn-main">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : (
                    <>
                      Envoyer le lien de récupération
                      <Send size={14} />
                    </>
                  )}
                </button>
                
                <Link href="/connexion" className="btn-secondary">
                  <ArrowLeft size={14} />
                  Retour à la connexion
                </Link>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: 56, height: 56, background: 'var(--green-light)', color: 'var(--green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h2 style={{ fontFamily: 'var(--ff-serif)', fontSize: '1.8rem', fontWeight: 400, marginBottom: '1rem', color: 'var(--ink)' }}>
                  Email envoyé !
                </h2>
                <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
                  Un lien sécurisé de réinitialisation a été envoyé à l'adresse <strong>{email}</strong>. 
                  Veuillez consulter votre boîte de réception (et vos spams si nécessaire).
                </p>

                <Link href="/connexion" className="btn-main">
                  <ArrowLeft size={16} />
                  Retour à la connexion
                </Link>
              </div>
            )}

            <div className="security-badges">
              <span><CheckCircle2 size={12} style={{ color: 'var(--green)' }} /> Lien sécurisé</span>
              <span><CheckCircle2 size={12} style={{ color: 'var(--green)' }} /> Validation SSL</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
