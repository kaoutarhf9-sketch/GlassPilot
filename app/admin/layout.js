"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Users, 
  LogOut,
  Menu,
  X,
  Shield,
  FolderKanban,
  Building2,
  Settings
} from 'lucide-react';
import clsx from 'clsx';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchUserInfo();
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const fetchUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.email || 'Administrateur');
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { href: '/admin', label: 'Vue globale', icon: LayoutDashboard, exact: true },
    { href: '/admin/gestionnaires', label: 'Gestionnaires', icon: Users },
    { href: '/admin/garages', label: 'Garages', icon: Building2 },
    { href: '/admin/dossiers', label: 'Assigner Dossiers', icon: FolderKanban },
    { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
  ];

  const isActive = (href, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-transparent text-[var(--ink)] selection:bg-[var(--blue)]/10 selection:text-[var(--blue)] admin-layout-root flex">
      {/* Google Fonts Import & Theme overrides */}
      <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Figtree:wght@300;400;500;600;700;800&display=swap');
 
 .admin-layout-root {
 font-family: 'Figtree', system-ui, -apple-system, sans-serif !important;
 }
 .font-serif-premium {
 font-family: 'Instrument Serif', Georgia, serif !important;
 }
 .custom-scrollbar::-webkit-scrollbar {
 width: 5px;
 }
 .custom-scrollbar::-webkit-scrollbar-track {
 background: transparent;
 }
 .custom-scrollbar::-webkit-scrollbar-thumb {
 background: rgba(255, 255, 255, 0.1);
 border-radius: 99px;
 }
 .custom-scrollbar::-webkit-scrollbar-thumb:hover {
 background: rgba(255, 255, 255, 0.2);
 }`}} />
      
      {/* ===== SIDEBAR DESKTOP (Dark Premium Glassmorphic) ===== */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-[#E6FAFC] border-r border-[#1B253B]/60 flex-col z-30 shadow-2xl">
        {/* Glowing Background Blob */}
        <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-[#18CDEC]/10 rounded-full filter blur-[80px] pointer-events-none" />

        {/* Logo */}
        <div className="h-20 flex items-center px-8 border-b border-[#1B253B]/40 relative z-10">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.3)] overflow-hidden group-hover:scale-105 transition-all duration-300">
              <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover object-center" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#090D16] animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-[#0A0030]">
                Glass<span className="text-[#3B0FAA]">Pilot</span>
              </span>
              <span className="block text-[9px] font-bold text-[#64748B] tracking-wider uppercase -mt-0.5">Console Admin</span>
            </div>
          </Link>
        </div>

        {/* User Info Card */}
        <div className="px-6 py-6 border-b border-[#1B253B]/40 relative z-10">
          <div className="bg-[#111827]/60 border border-[#1B253B]/50 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-[#18CDEC]/10 rounded-md flex items-center justify-center border border-[#1454FF]/20">
                <Shield size={10} className="text-[#3B0FAA]" />
              </div>
              <span className="text-[9px] font-bold text-[#3B0FAA] uppercase tracking-widest">Super Admin</span>
            </div>
            <p className="font-bold text-[#0A0030] text-xs truncate" title={userName}>{userName || 'Administrateur'}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar relative z-10">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 group relative",
                  active 
                    ? "bg-[#18CDEC] text-[#0A0030] shadow-lg shadow-[#1454FF]/20" 
                    : "text-[#64748B] hover:bg-[#111827]/50 hover:text-[#0A0030]"
                )}
              >
                {active && (
                  <span className="absolute left-[-4px] top-1/3 bottom-1/3 w-1 bg-white rounded-r-full" />
                )}
                <Icon size={18} className={clsx("transition-transform duration-200", active ? "text-[#0A0030]" : "text-[#64748B] group-hover:text-[#0A0030] group-hover:scale-105")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#1B253B]/40 relative z-10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer"
          >
            <LogOut size={18} className="text-[#64748B] transition-colors" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* ===== MOBILE SIDEBAR OVERLAY ===== */}
      <div className={clsx(
        "fixed inset-0 z-40 lg:hidden transition-opacity duration-300",
        mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        {/* Backdrop blur */}
        <div className="absolute inset-0 bg-[var(--paper)]/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        
        {/* Drawer content */}
        <aside className={clsx(
          "absolute top-0 bottom-0 left-0 w-80 bg-[var(--paper)] border-r border-[#1B253B]/60 flex flex-col z-50 p-6 transition-transform duration-300 shadow-2xl",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#1B253B]/40">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover object-center" />
              </div>
              <span className="text-md font-extrabold text-[#0A0030]">Glass<span className="text-[#3B0FAA]">Pilot</span></span>
            </Link>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-[#64748B] hover:text-[#0A0030] rounded-lg hover:bg-[#111827]"
            >
              <X size={18} />
            </button>
          </div>

          <div className="bg-[#111827]/60 border border-[#1B253B]/50 rounded-2xl p-4 shadow-xl mb-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[8px] font-bold text-[#3B0FAA] uppercase tracking-widest">Super Admin</span>
            </div>
            <p className="font-bold text-[#0A0030] text-xs truncate">{userName}</p>
          </div>

          <nav className="flex-1 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all",
                    active 
                      ? "bg-[#18CDEC] text-[#0A0030] shadow-lg" 
                      : "text-[#64748B] hover:bg-[#111827]/50 hover:text-[#0A0030]"
                  )}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl text-[13px] font-semibold transition-all mt-auto"
          >
            <LogOut size={18} />
            Se déconnecter
          </button>
        </aside>
      </div>

      {/* ===== MAIN BODY CONTENT ===== */}
      <div className="lg:pl-72 flex flex-col min-h-screen flex-1 w-full overflow-hidden">
        
        {/* ===== TOPBAR (Glassmorphic Frosted White) ===== */}
        <header className="sticky top-0 z-20 bg-[var(--white)] border-b border-[var(--stone)] transition-all h-20 flex-shrink-0">
          <div className="flex items-center justify-between px-6 sm:px-8 h-full">
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 -ml-2 text-[var(--ink)] hover:text-[var(--blue)] hover:bg-[var(--white)] rounded-xl transition-all"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div>
                <h2 className="text-[10px] font-extrabold text-[var(--blue)] uppercase tracking-wider mb-0.5">
                  Administration Globale
                </h2>
                <h1 className="text-md sm:text-lg font-extrabold tracking-tight text-[var(--ink)] leading-none">
                  {pathname === '/admin' && 'Vue globale'}
                  {pathname === '/admin/gestionnaires' && 'Gestionnaires d\'Équipe'}
                  {pathname === '/admin/garages' && 'Garages & Propriétaires'}
                  {pathname === '/admin/dossiers' && 'Dossiers & Assignations'}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-[var(--white)] border border-[var(--stone)] shadow-md">
                <div className="w-7 h-7 rounded-full bg-[var(--blue)] flex items-center justify-center shadow-md text-[var(--ink)] font-black text-xs">
                  {userName ? userName.charAt(0).toUpperCase() : 'A'}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-[var(--ink)] tracking-tight">Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full transition-all">
          {children}
        </main>
      </div>
    </div>
  );
}

