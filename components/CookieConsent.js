"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Petit délai pour ne pas submerger l'utilisateur
      setTimeout(() => setVisible(true), 1000);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setVisible(false);
    
    // Optionnel : envoyer l'événement à Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }
  };

  const acceptEssentials = () => {
    localStorage.setItem('cookie-consent', 'essentials');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#18170F] border-t border-[#1454FF]/20 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🍪</span>
                <span className="text-white font-semibold">Respect de votre vie privée</span>
              </div>
              <p className="text-[#89867A] text-sm">
                Nous utilisons des cookies essentiels pour sécuriser votre compte et traiter vos paiements. 
                Vous pouvez accepter tous les cookies pour améliorer votre expérience.
                <Link href="/mentions-legales" className="text-[#1454FF] hover:underline ml-1">
                  En savoir plus
                </Link>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={acceptEssentials}
                className="px-4 py-2 text-sm font-medium text-[#89867A] border border-[#89867A]/30 rounded-xl hover:bg-white/5 transition-colors"
              >
                Cookies essentiels uniquement
              </button>
              <button
                onClick={acceptAll}
                className="px-5 py-2 text-sm font-medium text-white bg-[#1454FF] rounded-xl hover:bg-[#0040CC] transition-colors"
              >
                Accepter tous les cookies
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}