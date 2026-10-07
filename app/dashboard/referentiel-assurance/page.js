"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GaragisteReferentielAssurancePage() {
  const router = useRouter();

  useEffect(() => {
    // Le référentiel d'assurance est strictement réservé au gestionnaire et super admin
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-sm font-semibold text-slate-400">
        Redirection vers le tableau de bord...
      </p>
    </div>
  );
}
