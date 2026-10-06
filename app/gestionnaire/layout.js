"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase, getValidUser, getGestionnaire } from '@/lib/supabase';
import { 
  LayoutDashboard, FileText, Users, Settings, LogOut,
  Menu, X, Sparkles, ChevronRight, HelpCircle, ShieldCheck,
  Bell, TrendingUp, Calendar, MessageSquare, Archive, Filter,
  Building2, FolderKanban, CheckCheck, Trash2, Megaphone, BookOpen,
  Clock
} from 'lucide-react';
import clsx from 'clsx';

const statusFilters = [
  { value: 'en_attente', label: 'En attente de vérification', color: 'bg-amber-400' },
  { value: 'signe', label: 'Dossier en attente', color: 'bg-teal-400' },
  { value: 'en_cours', label: 'Démarrer travaux', color: 'bg-blue-400' },
  { value: 'envoi_courrier', label: 'Envoi courrier', color: 'bg-indigo-400' },
  { value: 'relance', label: 'Relance', color: 'bg-orange-400' },
  { value: 'reglement_en_cours', label: 'Règlement en cours', color: 'bg-emerald-400' },
  { value: 'reglement_recu', label: 'Règlement reçu', color: 'bg-emerald-400' },
];

export default function GestionnaireLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [gestionnaireName, setGestionnaireName] = useState('');
  const [garagesCount, setGaragesCount] = useState(0);
  const [dossiersCount, setDossiersCount] = useState(0);
  const [gestionnaireId, setGestionnaireId] = useState(null);
  
  const [statusFiltersOpen, setStatusFiltersOpen] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setCurrentStatus(params.get('status') || '');
    }
  }, [pathname]);

  // Notifications globales
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [latestMessage, setLatestMessage] = useState(null);
  
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const gId = await fetchGestionnaireInfo();
      if (gId) {
        await fetchStats(gId);
        await fetchGlobalUnreadCount(gId);
      }
    };
    initialize();

    // S'assurer de rafraîchir la session quand l'onglet redevient actif
    const handleFocus = () => {
      initialize();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleFocus();
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        initialize();
      }
    });
    
    // S'abonner à TOUS les nouveaux messages destinés au gestionnaire et mises à jour
    const subscription = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotif = payload.new;
          if (!newNotif) return;

          // On vérifie que la notification est bien pour ce gestionnaire
          if (gestionnaireId && newNotif.gestionnaire_id !== gestionnaireId) return;

          if (payload.eventType === 'INSERT') {
            if (!newNotif.is_read) {
              setLatestMessage({
                sender_name: newNotif.title,
                message: newNotif.message
              });
              setShowToast(true);
              
              // Jouer le son de notification
              try {
                const audio = new Audio('/notification.mp3');
                audio.play().catch(e => console.log('Autoplay empêché par le navigateur:', e));
              } catch (e) {
                console.error("Erreur lecture son:", e);
              }
              
              // Notification navigateur (si autorisé)
              if (Notification.permission === 'granted') {
                new Notification(newNotif.title || 'Nouvelle notification', {
                  body: newNotif.message,
                  icon: '/favicon.ico'
                });
              }
              
              setNotifications(prev => [newNotif, ...prev]);
              setGlobalUnreadCount(prev => prev + 1);
            }
          }
        }
      )
      .subscribe();

    // Demander la permission pour les notifications du navigateur
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const fetchGlobalUnreadCount = async (gId) => {
    try {
      let targetGId = gId || gestionnaireId;
      if (!targetGId) {
        const user = await getValidUser();
        if (!user) return;
        const managerData = await getGestionnaire(user);
        targetGId = managerData?.id;
      }
      
      if (!targetGId) return;

      const { data: notifs, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('gestionnaire_id', targetGId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      
      setGlobalUnreadCount(count || 0);
      setNotifications(notifs || []);
    } catch (err) {
      console.error("Erreur unread count:", err);
    }
  };

  const markAsRead = async (msgId) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', msgId);
      setNotifications(prev => prev.filter(n => n.id !== msgId));
      setGlobalUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Erreur markAsRead:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const msgIds = notifications.map(n => n.id);
      if (msgIds.length === 0) return;
      await supabase.from('notifications').update({ is_read: true }).in('id', msgIds);
      setNotifications([]);
      setGlobalUnreadCount(0);
      setNotificationsOpen(false);
    } catch (err) {
      console.error("Erreur markAllAsRead:", err);
    }
  };

  const fetchGestionnaireInfo = async () => {
    try {
      const user = await getValidUser();
      if (!user) return null;
      
      if (user.user_metadata) {
        setGestionnaireName(user.user_metadata.prenom || 'Gestionnaire');
      }

      const managerData = await getGestionnaire(user);
      
      if (managerData?.id) {
        setGestionnaireId(managerData.id);
        return managerData.id;
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const fetchStats = async (gId) => {
    try {
      let targetGId = gId || gestionnaireId;
      if (!targetGId) {
        const user = await getValidUser();
        if (!user) return;
        const managerData = await getGestionnaire(user);
        targetGId = managerData?.id;
      }
      
      if (!targetGId) return;

      // Compter les garages ayant au moins un dossier de ce gestionnaire
      const { data: dossiersGarages } = await supabase
        .from('dossiers')
        .select('garage_id')
        .eq('gestionnaire_id', targetGId);
      
      const uniqueGarageIds = Array.from(new Set(dossiersGarages?.map(d => d.garage_id).filter(Boolean) || []));
      setGaragesCount(uniqueGarageIds.length);

      // Compter les dossiers actifs (non archivés) de ce gestionnaire
      const { data: dossiersData, error } = await supabase
        .from('dossiers')
        .select('statut')
        .eq('gestionnaire_id', targetGId);

      if (error) throw error;

      const activeCount = (dossiersData || []).filter(d => {
        if (d.statut === 'reglement_en_cours') return false;
        if (d.statut === 'termine') return false;
        return true;
      }).length;

      setDossiersCount(activeCount);
    } catch (err) {
      console.error(err);
    }
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navSections = [
    {
      title: 'COMMUNICATION',
      items: [
        { href: '/gestionnaire/actualites', label: 'Actualités', icon: Megaphone },
        { href: '/gestionnaire/referentiel-assurance', label: 'Référentiel Assurance', icon: BookOpen },
      ]
    },
    {
      title: 'GESTION',
      items: [
        { href: '/gestionnaire/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
        { href: '/gestionnaire/garages', label: 'Garages', icon: Building2, badge: garagesCount },
        { href: '/gestionnaire/dossiers', label: 'Dossiers', icon: FolderKanban, badge: dossiersCount },
        { href: '/gestionnaire/filtres', label: 'Filtres par statut', icon: Filter },
        { href: '/gestionnaire/archives', label: 'Archives', icon: Archive },
        { href: '/gestionnaire/parametres', label: 'Paramètres', icon: Settings },
      ]
    }
  ];


  const isActive = (href, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-transparent font-sans text-[var(--ink)] selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Sidebar Desktop (Dark Premium) */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-[var(--page-bg)] border-r border-[var(--stone)]/20 flex-col z-30">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[var(--stone)]/20/60">
          <Link href="/gestionnaire/dashboard" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20 group-hover:bg-indigo-500 transition-colors">
              <Sparkles size={16} className="text-[var(--ink)]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[var(--ink)]">
                Glass<span className="text-[var(--blue)]">Pilot</span>
              </span>
            </div>
          </Link>
        </div>

        {/* User context info */}
        <div className="px-6 py-5 border-b border-[var(--stone)]/20/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-inner text-[var(--ink)] font-bold border border-[var(--stone)]/20">
              {gestionnaireName.charAt(0).toUpperCase() || 'G'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--ink)] truncate">{gestionnaireName || 'Gestionnaire'}</p>
              <p className="text-xs text-[#64748B] truncate">Espace d'administration</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx} className="mb-6 last:mb-0">
              <div className="px-3 mb-2 flex flex-col">
                <span className="text-[10px] font-bold text-[var(--blue)] uppercase tracking-wider">{section.title}</span>
                <div className="h-0.5 w-6 bg-[var(--blue)]/40 rounded-full mt-1"></div>
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
            const Icon = item.icon;

            if (item.label === 'Filtres par statut') {
              const active = pathname === '/gestionnaire/filtres' || (pathname === '/gestionnaire/dossiers' && currentStatus !== '');
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => setStatusFiltersOpen(!statusFiltersOpen)}
                    className={clsx(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group text-left",
                      active 
                        ? "bg-[var(--paper)]/80 text-[var(--ink)]" 
                        : "text-[#64748B] hover:bg-[var(--blue)]/10 hover:text-[var(--ink)]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={clsx("transition-colors", active ? "text-[var(--ink-2)]" : "text-[#64748B] group-hover:text-[#64748B]")} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight 
                      size={14} 
                      className={clsx(
                        "text-[#64748B] transition-transform duration-200 shrink-0", 
                        statusFiltersOpen && "rotate-90"
                      )} 
                    />
                  </button>
                  
                  {statusFiltersOpen && (
                    <div className="pl-6 pr-2 py-1 space-y-1.5 transition-all duration-200">
                      {statusFilters.map((subItem) => {
                        const isSubActive = pathname === '/gestionnaire/dossiers' && currentStatus === subItem.value;
                        return (
                          <Link
                            key={subItem.value}
                            href={`/gestionnaire/dossiers?status=${subItem.value}`}
                            className={clsx(
                              "flex items-center gap-2.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all duration-150",
                              isSubActive
                                ? "text-[var(--ink)] bg-indigo-600/30 font-semibold"
                                : "text-[#64748B] hover:text-[var(--ink-2)] hover:bg-[var(--blue)]/10/30"
                            )}
                          >
                            <span className={clsx(
                              "w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-150",
                              isSubActive ? subItem.color : "bg-slate-600"
                            )} />
                            <span className="truncate">{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  active 
                    ? "bg-[var(--blue)] text-[var(--ink)] shadow-sm shadow-indigo-600/20" 
                    : "text-[#64748B] hover:bg-[var(--blue)]/10 hover:text-[var(--ink)]"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={clsx("transition-colors", active ? "text-[var(--ink)]" : "text-[#64748B] group-hover:text-[#64748B]")} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={clsx(
                    "text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center",
                    active ? "bg-white   text-[var(--ink)]" : "bg-[var(--paper)] text-[#64748B] group-hover:bg-slate-700"
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--stone)]/20/60 space-y-1">
          <Link 
            href="/gestionnaire/aide" 
            className="flex items-center gap-3 px-3 py-2.5 text-[#64748B] hover:text-[var(--ink)] hover:bg-[var(--blue)]/10 rounded-lg text-sm font-medium transition-colors"
          >
            <HelpCircle size={18} className="text-[#64748B]" />
            Support technique
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut size={18} className="text-[#64748B] group-hover:text-rose-400" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        
        {/* Topbar (Light Glassmorphism) */}
        <header className="sticky top-0 z-20 bg-[var(--white)] border-b border-slate-200 shadow-md transition-all h-16 flex-shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              
              <div className="hidden sm:flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
                  {pathname === '/gestionnaire/dashboard' && 'Tableau de bord'}
                  {pathname === '/gestionnaire/garages' && 'Gestion des garages'}
                  {pathname === '/gestionnaire/dossiers' && 'Suivi des dossiers'}
                  {pathname === '/gestionnaire/filtres' && 'Filtres avancés'}
                  {pathname === '/gestionnaire/archives' && 'Archives'}
                  {pathname === '/gestionnaire/parametres' && 'Paramètres'}
                </h1>
              </div>
            </div>
            
            <div className="block sm:hidden flex-1 text-center">
              <span className="text-base font-bold text-[var(--ink)]">Glass<span className="text-indigo-600">Pilot</span></span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2.5 text-slate-300 hover:text-white hover:bg-[#16223d] rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/30 border border-transparent hover:border-[#1e2d4a] cursor-pointer"
                  title="Notifications"
                >
                  <Bell size={20} className="text-slate-300 hover:text-[#00d4ff] transition-colors" />
                  {globalUnreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-rose-600 text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-[#0d1428] shadow-lg shadow-rose-600/50 animate-in zoom-in leading-none">
                      {globalUnreadCount > 99 ? '99+' : globalUnreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Notifications */}
                {notificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setNotificationsOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-[360px] sm:w-[440px] bg-[#0d1428] rounded-2xl border border-[#1e2d4a] shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                      
                      {/* En-tête */}
                      <div className="px-5 py-4 border-b border-[#1e2d4a] flex justify-between items-center bg-[#111c35]">
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-extrabold text-white text-base">Notifications</h3>
                          {globalUnreadCount > 0 && (
                            <span className="px-2.5 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-full">
                              {globalUnreadCount} non lue{globalUnreadCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {globalUnreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-xs font-bold text-[#00d4ff] hover:text-cyan-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <CheckCheck size={16} /> Tout marquer lu
                          </button>
                        )}
                      </div>

                      {/* Liste */}
                      <div className="max-h-[440px] overflow-y-auto custom-scrollbar divide-y divide-[#1e2d4a]/70">
                        {notifications.length === 0 ? (
                          <div className="p-10 text-center flex flex-col items-center">
                            <div className="w-14 h-14 bg-[#111c35] border border-[#1e2d4a] rounded-2xl flex items-center justify-center mb-3.5 text-[#00d4ff]">
                              <Bell size={26} />
                            </div>
                            <p className="text-base font-bold text-white">Aucune notification</p>
                            <p className="text-sm text-slate-400 mt-1">Vous êtes à jour !</p>
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            let NotifIcon = MessageSquare;
                            let iconColor = 'text-[#00d4ff]';
                            if (notif.type === 'actualite') { NotifIcon = Megaphone; iconColor = 'text-emerald-400'; }
                            else if (notif.type === 'assignation') { NotifIcon = CheckCheck; iconColor = 'text-amber-400'; }
                            else if (notif.type === 'document') { NotifIcon = FileText; iconColor = 'text-blue-400'; }
                            else if (notif.type === 'statut') { NotifIcon = ShieldCheck; iconColor = 'text-purple-400'; }
                            const destination = notif.link || (notif.dossier_id ? `/gestionnaire/dossiers/${notif.dossier_id}` : '/gestionnaire/dashboard');
                            
                            return (
                              <div
                                key={notif.id}
                                className={clsx(
                                  "p-4 hover:bg-[#16223d]/80 transition-colors cursor-pointer relative group flex items-start gap-3.5",
                                  !notif.is_read ? "bg-[#1454FF]/15 border-l-4 border-l-[#00d4ff]" : "bg-transparent"
                                )}
                                onClick={() => {
                                  markAsRead(notif.id);
                                  router.push(destination);
                                  setNotificationsOpen(false);
                                }}
                              >
                                <div className="flex-shrink-0 mt-0.5 bg-[#111c35] p-2.5 rounded-xl border border-[#1e2d4a] shadow-sm group-hover:border-[#00d4ff]/40 transition-colors">
                                  <NotifIcon size={16} className={iconColor} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className={clsx(
                                      "text-sm sm:text-base leading-snug",
                                      !notif.is_read ? "font-bold text-white" : "font-semibold text-slate-200"
                                    )}>
                                      {notif.title || 'Nouvelle notification'}
                                    </p>
                                    {!notif.is_read && (
                                      <span className="w-2.5 h-2.5 rounded-full bg-[#00d4ff] shrink-0 shadow-sm shadow-[#00d4ff]/50"></span>
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                                    {notif.message}
                                  </p>
                                  <p className="text-xs font-semibold text-[#00d4ff]/90 mt-2 flex items-center gap-1.5">
                                    <Clock size={13} /> {new Date(notif.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notif.id);
                                  }}
                                  className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/20 p-2 rounded-lg transition-all flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                                  title="Marquer comme lu"
                                >
                                  <CheckCheck size={16} />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="w-px h-6 bg-slate-700 hidden sm:block mx-1"></div>
              
              {/* Profil léger */}
              <div className="flex items-center gap-2 pl-1 cursor-pointer group">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">{gestionnaireName || 'Gestionnaire'}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600 font-bold group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors">
                  {gestionnaireName.charAt(0).toUpperCase() || 'G'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu de la page */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Toast de Notification Globale */}
      {showToast && latestMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[var(--white)] rounded-xl shadow-2xl shadow-indigo-900/10 border border-slate-200/60 p-4 w-[320px] flex items-start gap-3 cursor-pointer hover:border-indigo-300 hover:shadow-indigo-900/20 transition-all"
               onClick={() => {
                 if (latestMessage.link) router.push(latestMessage.link);
                 setShowToast(false);
               }}>
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 border border-indigo-100">
              {latestMessage.type === 'actualite' ? <Megaphone size={18} className="text-emerald-600" /> :
               latestMessage.type === 'assignation' ? <CheckCheck size={18} className="text-amber-600" /> :
               latestMessage.type === 'document' ? <FileText size={18} className="text-blue-600" /> :
               <MessageSquare size={18} className="text-indigo-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="text-sm font-semibold text-[var(--ink)] truncate">{latestMessage.sender_name || 'Notification'}</h4>
                <button onClick={(e) => { e.stopPropagation(); setShowToast(false); }} className="text-[var(--muted)] hover:text-slate-600 focus:outline-none p-1 -mr-1 rounded-md">
                  <X size={14} />
                </button>
              </div>
              <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-wider mb-1">{latestMessage.sender_name || 'Nouvelle notification'}</p>
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{latestMessage.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Menu mobile (Dark Premium) */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-[var(--white)] backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-72 bg-[var(--page-bg)] z-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r border-[var(--stone)]/20">
            <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--stone)]/20/60">
              <Link href="/gestionnaire/dashboard" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg">
                  <Sparkles size={16} className="text-[var(--ink)]" />
                </div>
                <span className="text-xl font-bold tracking-tight text-[var(--ink)]">Glass<span className="text-[var(--blue)]">Pilot</span></span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-[#64748B] hover:text-[var(--ink)] rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="px-6 py-5 border-b border-[var(--stone)]/20/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[var(--ink)] font-bold border border-[var(--stone)]/20">
                  {gestionnaireName.charAt(0).toUpperCase() || 'G'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)] truncate">{gestionnaireName || 'Gestionnaire'}</p>
                  <p className="text-xs text-[#64748B] truncate">Espace d'administration</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
              {navSections.map((section, idx) => (
            <div key={idx} className="mb-6 last:mb-0">
              <div className="px-3 mb-2 flex flex-col">
                <span className="text-[10px] font-bold text-[var(--blue)] uppercase tracking-wider">{section.title}</span>
                <div className="h-0.5 w-6 bg-[var(--blue)]/40 rounded-full mt-1"></div>
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                const Icon = item.icon;

                if (item.label === 'Filtres par statut') {
                  const active = pathname === '/gestionnaire/filtres' || (pathname === '/gestionnaire/dossiers' && currentStatus !== '');
                  return (
                    <div key={item.label} className="space-y-1">
                      <button
                        onClick={() => setStatusFiltersOpen(!statusFiltersOpen)}
                        className={clsx(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                          active ? "bg-[var(--paper)]/80 text-[var(--ink)]" : "text-[#64748B] hover:bg-[var(--blue)]/10 hover:text-[var(--ink)]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={18} className={clsx(active ? "text-[var(--ink)]" : "text-[#64748B]")} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight 
                          size={14} 
                          className={clsx(
                            "text-[#64748B] transition-transform duration-200 shrink-0", 
                            statusFiltersOpen && "rotate-90"
                          )} 
                        />
                      </button>
                      
                      {statusFiltersOpen && (
                        <div className="pl-6 pr-2 py-1 space-y-1.5">
                          {statusFilters.map((subItem) => {
                            const isSubActive = pathname === '/gestionnaire/dossiers' && currentStatus === subItem.value;
                            return (
                              <Link
                                key={subItem.value}
                                href={`/gestionnaire/dossiers?status=${subItem.value}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className={clsx(
                                  "flex items-center gap-2.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all",
                                  isSubActive
                                    ? "text-[var(--ink)] bg-indigo-600/30 font-semibold"
                                    : "text-[#64748B] hover:text-[var(--ink-2)] hover:bg-[var(--blue)]/10/30"
                                )}
                              >
                                <span className={clsx(
                                  "w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-150",
                                  isSubActive ? subItem.color : "bg-slate-600"
                                )} />
                                <span className="truncate">{subItem.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      active ? "bg-[var(--blue)] text-[var(--ink)] shadow-sm" : "text-[#64748B] hover:bg-[var(--blue)]/10 hover:text-[var(--ink)]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={clsx(active ? "text-[var(--ink)]" : "text-[#64748B]")} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--paper)] text-[#64748B]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
                </div>
              </div>
            ))}
            </nav>

            <div className="p-4 border-t border-[var(--stone)]/20/60">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}