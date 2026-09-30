"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Building2, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    gestionnairesCount: 0,
    garagesCount: 0,
    dossiersCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // 1. Get active session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error("Session introuvable. Veuillez vous reconnecter.");
      }

      // 2. Fetch admin counts from secure server proxy (bypasses RLS for authorized admin)
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Erreur de communication avec le serveur");
      }

      setStats({
        gestionnairesCount: resData.gestionnairesCount || 0,
        garagesCount: resData.garagesCount || 0,
        dossiersCount: resData.dossiersCount || 0
      });
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--white)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md">
        <div>
          <h2 className="text-3xl sm:text-4xl font-serif-premium text-[var(--ink)]">
            Bonjour, <span className="italic text-[var(--blue)]">Administrateur</span>
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-[var(--muted)] mt-1.5">
            Voici un aperçu de l'activité globale et de la performance de la plateforme.
          </p>
        </div>
        <div className="flex items-center gap-2 pl-3.5 pr-4 py-2 bg-[var(--blue)]/10 border border-[#C2CFFF] rounded-2xl text-[11px] font-extrabold text-[var(--blue)] uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Système Opérationnel
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Card 1: Gestionnaires */}
        <div className="bg-[var(--white)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          {/* Subtle Radial Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1454FF]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:text-[var(--blue)] transition-all duration-500 pointer-events-none">
            <Users size={96} />
          </div>
          
          <div className="flex items-center gap-5 mb-6 relative z-10">
            <div className="w-14 h-14 bg-[var(--blue)]/10 text-[var(--blue)] rounded-2xl flex items-center justify-center shadow-inner border border-[#C2CFFF] group-hover:scale-105 transition-transform duration-300">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Gestionnaires</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[var(--ink)] tracking-tight mt-1 tabular-nums">
                {loading ? (
                  <span className="inline-block w-6 h-6 bg-slate-100 rounded animate-pulse" />
                ) : stats.gestionnairesCount}
              </h3>
            </div>
          </div>
          
          <Link 
            href="/admin/gestionnaires" 
            className="text-[11px] font-bold text-[var(--blue)] hover:text-[#003BDE] flex items-center gap-1.5 transition-all mt-4 border-t border-[var(--stone)]/60 pt-4 w-full"
          >
            Gérer les gestionnaires <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 2: Garages */}
        <div className="bg-[var(--white)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          {/* Subtle Radial Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1454FF]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:text-[var(--blue)] transition-all duration-500 pointer-events-none">
            <Building2 size={96} />
          </div>
          
          <div className="flex items-center gap-5 mb-6 relative z-10">
            <div className="w-14 h-14 bg-[var(--blue)]/10 text-[var(--blue)] rounded-2xl flex items-center justify-center shadow-inner border border-[#C2CFFF] group-hover:scale-105 transition-transform duration-300">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Garages Partenaires</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[var(--ink)] tracking-tight mt-1 tabular-nums">
                {loading ? (
                  <span className="inline-block w-6 h-6 bg-slate-100 rounded animate-pulse" />
                ) : stats.garagesCount}
              </h3>
            </div>
          </div>
          
          <Link 
            href="/admin/garages" 
            className="text-[11px] font-bold text-[var(--blue)] hover:text-[#003BDE] flex items-center gap-1.5 transition-all mt-4 border-t border-[var(--stone)]/60 pt-4 w-full"
          >
            Gérer les garages <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 3: Dossiers */}
        <div className="bg-[var(--white)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          {/* Subtle Radial Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1454FF]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:text-[var(--blue)] transition-all duration-500 pointer-events-none">
            <FileText size={96} />
          </div>
          
          <div className="flex items-center gap-5 mb-6 relative z-10">
            <div className="w-14 h-14 bg-[var(--blue)]/10 text-[var(--blue)] rounded-2xl flex items-center justify-center shadow-inner border border-[#C2CFFF] group-hover:scale-105 transition-transform duration-300">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Dossiers</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[var(--ink)] tracking-tight mt-1 tabular-nums">
                {loading ? (
                  <span className="inline-block w-6 h-6 bg-slate-100 rounded animate-pulse" />
                ) : stats.dossiersCount}
              </h3>
            </div>
          </div>
          
          <Link 
            href="/admin/dossiers" 
            className="text-[11px] font-bold text-[var(--blue)] hover:text-[#003BDE] flex items-center gap-1.5 transition-all mt-4 border-t border-[var(--stone)]/60 pt-4 w-full"
          >
            Assigner les dossiers <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
