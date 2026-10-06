"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShoppingBag , Megaphone } from 'lucide-react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Bell,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  UserCircle,
  CheckCheck,
  Trash2,
  MessageSquare,
  Loader2,
  Newspaper,
  BookOpen
} from 'lucide-react';
import clsx from 'clsx';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [garageName, setGarageName] = useState('');
  const [garageId, setGarageId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Notifications des messages
  const [showToast, setShowToast] = useState(false);
  const [latestMessage, setLatestMessage] = useState(null);

  useEffect(() => {
    fetchUserInfo();
    fetchNotifications();
    subscribeToNotifications();
  }, []);

  useEffect(() => {
    if (!checkingOnboarding && !onboardingCompleted && pathname !== '/dashboard/onboarding') {
      router.push('/dashboard/onboarding');
    }
  }, [pathname, onboardingCompleted, checkingOnboarding]);

  useEffect(() => {
    if (!garageId) return;
    
    // S'abonner aux nouveaux messages et mises à jour
    const subscription = supabase
      .channel('global-messages-garagiste')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `garage_id=eq.${garageId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          if (!newMsg) return;

          if (payload.eventType === 'INSERT') {
            if (newMsg.sender_role === 'gestionnaire' && !newMsg.is_read) {
              setLatestMessage(newMsg);
              setShowToast(true);
              
              const notif = {
                id: `msg-${newMsg.id}`,
                dossier_id: newMsg.dossier_id,
                type: 'message',
                title: `Nouveau message de ${newMsg.sender_name || 'Gestionnaire'}`,
                message: newMsg.message,
                is_read: false,
                created_at: newMsg.created_at,
                link: `/dashboard/dossiers/${newMsg.dossier_id}`
              };
              
              setNotifications(prev => {
                const all = [notif, ...prev];
                return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              });
              setUnreadCount(prev => prev + 1);
              
              // Jouer le son de notification
              try {
                const audio = new Audio('/notification.mp3');
                audio.play().catch(e => console.log('Autoplay empêché:', e));
              } catch (e) {
                console.error("Erreur lecture son:", e);
              }
              
              if (Notification.permission === 'granted') {
                new Notification('Nouveau message du gestionnaire', {
                  body: newMsg.message,
                  icon: '/favicon.ico'
                });
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            if (newMsg.sender_role === 'gestionnaire' && newMsg.is_read) {
              setNotifications(prev => {
                let changed = false;
                const next = prev.map(n => {
                  if (n.id === `msg-${newMsg.id}` && !n.is_read) {
                    changed = true;
                    return { ...n, is_read: true };
                  }
                  return n;
                });
                if (changed) {
                  setUnreadCount(c => Math.max(0, c - 1));
                }
                return next;
              });
            }
          }
        }
      )
      .subscribe();

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [garageId]);

  const fetchNotifications = async () => {
    if (!garageId) return;
    
    try {
      const { data: notifs, error: notifsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('garage_id', garageId)
        .order('created_at', { ascending: false })
        .limit(20);

      setNotifications(notifs || []);
      setUnreadCount((notifs || []).filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Erreur chargement notifications:', err);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        setUserName(user.user_metadata?.first_name || user.user_metadata?.prenom || 'Garagiste');
        
        const role = user.user_metadata?.role;
        const isCompleted = user.user_metadata?.onboarding_completed === true || role === 'gestionnaire' || role === 'admin';
        setOnboardingCompleted(isCompleted);
        setCheckingOnboarding(false);

        if (!isCompleted && pathname !== '/dashboard/onboarding') {
          router.push('/dashboard/onboarding');
        }
      } else {
        router.push('/connexion');
      }
      
      const { data: garage } = await supabase
        .from('garages')
        .select('id, nom_garage')
        .eq('owner_id', user?.id)
        .maybeSingle();
      
      if (garage) {
        setGarageId(garage.id);
        setGarageName(garage.nom_garage);
      }
    } catch (err) {
      console.error(err);
      setCheckingOnboarding(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!garageId) return;

    const subscription = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `garage_id=eq.${garageId}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          if (!payload.new.is_read) {
            setUnreadCount(prev => prev + 1);
            
            // Jouer le son de notification
            try {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(e => console.log('Autoplay empêché:', e));
            } catch (e) {
              console.error("Erreur lecture son:", e);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markAsRead = async (notificationId) => {
    try {
      if (typeof notificationId === 'string' && notificationId.startsWith('msg-')) {
        const msgId = notificationId.replace('msg-', '');
        await supabase.from('messages').update({ is_read: true }).eq('id', msgId);
      } else {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId);
        if (error) throw error;
      }

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!garageId) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('garage_id', garageId)
        .eq('is_read', false);

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      if (error) throw error;

      const deleted = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (deleted && !deleted.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Erreur:', err);
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
        { href: '/dashboard/actualites', label: 'Actualités', icon: Newspaper },
              ]
    },
    {
      title: 'GARAGE',
      items: [
        { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
        { href: '/dashboard/dossiers', label: 'Dossiers', icon: FileText },
        { href: '/dashboard/clients', label: 'Répertoire clients', icon: Users },
        { href: '/dashboard/abonnement', label: 'Jetons', icon: ShoppingBag },
      ]
    }
  ];

  const isActive = (href, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const LogoIcon = () => (
    <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-md">
      <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover object-center" />
    </div>
  );

  const getNotificationIcon = (type) => {
    const icons = {
      dossier_cree: <FileText size={14} className="text-emerald-500" />,
      signature_validee: <ShieldCheck size={14} className="text-blue-500" />,
      paiement_recu: <Sparkles size={14} className="text-amber-500" />,
      message: <MessageSquare size={14} className="text-[var(--blue)]" />,
      actualite: <Megaphone size={14} className="text-emerald-500" />,
      assignation: <CheckCheck size={14} className="text-amber-500" />,
      document: <FileText size={14} className="text-indigo-500" />,
      archivage: <Trash2 size={14} className="text-slate-500" />,
      statut: <ShieldCheck size={14} className="text-indigo-500" />,
      default: <Bell size={14} className="text-[var(--muted)]" />
    };
    return icons[type] || icons.default;
  };

  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60));
    
    if (diff < 1) return "À l'instant";
    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return date.toLocaleDateString('fr-FR');
  };

  if (checkingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--white)]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-[var(--blue)]/10 rounded-full animate-ping opacity-20"></div>
            <Loader2 size={48} className="animate-spin text-[var(--blue)] mx-auto relative z-10" />
          </div>
          <p className="text-[var(--muted)] font-light">Chargement de votre espace pro...</p>
        </div>
      </div>
    );
  }

  const isOnboardingPage = pathname === '/dashboard/onboarding';

  if (!onboardingCompleted || isOnboardingPage) {
    return (
      <div className="min-h-screen bg-[var(--white)] font-sans text-[var(--ink)] flex flex-col">
        <header className="h-16 bg-[var(--white)] border-b border-[var(--stone)] shadow-md flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden shadow-md">
              <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover object-center" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--ink)]">
              Glass<span className="text-[var(--blue)]">Pilot</span> <span className="text-xs font-semibold uppercase tracking-wider text-[var(--blue)] ml-2 px-2.5 py-0.5 bg-blue-50 border border-blue-100 rounded-full">Pro</span>
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-medium text-[var(--muted)] hover:text-rose-600 px-3 py-1.5 hover:bg-rose-50 rounded-lg transition-all"
          >
            <LogOut size={14} />
            Se déconnecter
          </button>
        </header>
        <main className="flex-grow flex items-center justify-center p-4 md:p-8 bg-[var(--white)]">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent font-sans text-[var(--ink)] selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Background gradients removed for cleaner SaaS look */}

      {/* ===== SIDEBAR DESKTOP (Dark Premium) ===== */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-[var(--page-bg)] border-r border-[var(--stone)]/20 flex-col z-30">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[var(--stone)]/20/60">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg shadow-lg shadow-indigo-600/20 overflow-hidden group-hover:scale-105 transition-transform">
              <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover object-center" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[var(--ink)]">
                Glass<span className="text-[var(--blue)]">Pilot</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Garage Info */}
        <div className="px-5 py-5 border-b border-[var(--stone)]/20/60">
          <div className="bg-white border border-[var(--stone)]/20 rounded-xl p-3 shadow-inner">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 bg-indigo-500/10 rounded-md flex items-center justify-center">
                <ShieldCheck size={12} className="text-[var(--blue)]" />
              </div>
              <span className="text-[10px] font-bold text-[var(--blue)] uppercase tracking-wider">Mon garage</span>
            </div>
            <p className="font-bold text-[var(--ink)] text-sm truncate">{garageName || 'Mon Garage'}</p>
            <p className="text-xs text-[#64748B] mt-0.5 truncate">Espace professionnel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto custom-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx} className="mb-6 last:mb-0">
              <div className="px-3 mb-2 flex flex-col">
                <span className="text-[10px] font-bold text-[var(--blue)] uppercase tracking-wider">{section.title}</span>
                <div className="h-0.5 w-6 bg-[var(--blue)]/40 rounded-full mt-1"></div>
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                        active 
                          ? "bg-[var(--blue)] text-[var(--ink)] shadow-sm shadow-indigo-600/20" 
                          : "text-[#64748B] hover:bg-[var(--blue)]/10 hover:text-[var(--ink)]"
                      )}
                    >
                      <Icon size={18} className={clsx("transition-colors", active ? "text-[var(--ink)]" : "text-[#64748B] group-hover:text-[#64748B]")} />
                      <span>{item.label}</span>
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
            href="/dashboard/aide" 
            className="flex items-center gap-3 px-3 py-2.5 text-[#64748B] hover:text-[var(--ink)] hover:bg-[var(--blue)]/10 rounded-lg text-sm font-medium transition-colors"
          >
            <HelpCircle size={18} className="text-[#64748B]" />
            Centre d'aide
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

      {/* ===== CONTENU PRINCIPAL ===== */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        
        {/* ===== TOPBAR (Light Glassmorphism) ===== */}
        <header className="sticky top-0 z-20 bg-[var(--white)] border-b border-slate-200 shadow-md transition-all h-16 flex-shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-full">
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div className="hidden sm:block">
                <h2 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-0.5">
                  {pathname === '/dashboard' && 'Vue d\'ensemble'}
                  {pathname === '/dashboard/dossiers' && 'Gestion des dossiers'}
                  {pathname === '/dashboard/clients' && 'Carnet de clients'}
                  {pathname === '/dashboard/parametres' && 'Configuration'}
                </h2>
                <h1 className="text-lg font-bold tracking-tight text-[var(--ink)] leading-none">
                  {pathname === '/dashboard' && 'Tableau de bord'}
                  {pathname === '/dashboard/dossiers' && 'Dossiers'}
                  {pathname === '/dashboard/clients' && 'Clients'}
                  {pathname === '/dashboard/parametres' && 'Paramètres'}
                </h1>
              </div>
            </div>
            
            <div className="block sm:hidden flex-1 flex items-center justify-center gap-2">
              <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 object-cover object-center rounded-md" />
              <span className="text-base font-bold text-[var(--ink)]">Glass<span className="text-indigo-600">Pilot</span></span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* NOTIFICATIONS */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse ring-2 ring-white"></span>
                  )}
                </button>

                {/* Menu déroulant notifications */}
                {notificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setNotificationsOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-[380px] bg-[var(--white)] rounded-xl border border-slate-200 shadow-2xl shadow-slate-200/50 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-transparent/50">
                        <h3 className="font-semibold text-[var(--ink)]">Notifications</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                          >
                            <CheckCheck size={14} /> Tout marquer lu
                          </button>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center flex flex-col items-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                              <Bell size={20} className="text-[var(--muted)]" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">Aucune notification</p>
                            <p className="text-xs text-[var(--muted)] mt-1">Vous êtes à jour !</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                              <div 
                                key={notif.id}
                                className={clsx(
                                  "p-4 border-b border-slate-100 hover:bg-transparent transition-colors cursor-pointer relative group",
                                  !notif.is_read && "bg-indigo-50/30"
                                )}
                                onClick={() => {
                                  markAsRead(notif.id);
                                  if (notif.link) {
                                    router.push(notif.link);
                                    setNotificationsOpen(false);
                                  } else if (notif.type === 'message' || notif.dossier_id) {
                                    router.push(`/dashboard/dossiers/${notif.dossier_id}`);
                                    setNotificationsOpen(false);
                                  }
                                }}
                              >
                                {!notif.is_read && (
                                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500"></div>
                                )}
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1 bg-[var(--white)] p-2 rounded-lg border border-slate-200 shadow-md group-hover:border-indigo-200 transition-colors">
                                  {getNotificationIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={clsx("text-sm", !notif.is_read ? "font-semibold text-[var(--ink)]" : "font-medium text-slate-700")}>{notif.title}</p>
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                                  <p className="text-[10px] font-medium text-[var(--muted)] mt-2 uppercase tracking-wider">{formatNotificationDate(notif.created_at)}</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notif.id);
                                  }}
                                  className="text-[var(--muted)] hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-md transition-all flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title="Supprimer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="w-px h-6 bg-slate-200 hidden sm:block mx-1"></div>
              
              {/* PROFIL */}
              <div className="relative">
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <div className="hidden md:block text-right mr-1">
                    <p className="text-sm font-semibold text-slate-700">{userName || 'Garagiste'}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[var(--white)] flex items-center justify-center shadow-md text-[var(--ink)] font-bold border border-[var(--stone)]">
                    {userName.charAt(0).toUpperCase() || 'G'}
                  </div>
                  <ChevronRight size={14} className={clsx("text-[var(--muted)] transition-transform", profileMenuOpen && "rotate-90")} />
                </button>

                {/* Menu déroulant profil */}
                {profileMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-64 bg-[var(--white)] rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="px-4 py-3 border-b border-slate-100 bg-transparent/50">
                        <p className="text-sm font-semibold text-[var(--ink)] truncate">{userName}</p>
                        <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                      </div>
                      <div className="p-1">
                        <Link 
                          href="/dashboard/profil"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-transparent rounded-lg transition-colors group"
                        >
                          <UserCircle size={16} className="text-[var(--muted)] group-hover:text-indigo-600 transition-colors" />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-[var(--ink)]">Mon profil</span>
                        </Link>
                      </div>
                      <div className="border-t border-slate-100 p-1">
                        <button 
                          onClick={() => {
                            setProfileMenuOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 w-full text-left hover:bg-rose-50 rounded-lg transition-colors group"
                        >
                          <LogOut size={16} className="text-[var(--muted)] group-hover:text-rose-600 transition-colors" />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-rose-600">Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Toast de Notification Globale (Messages) */}
      {showToast && latestMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[var(--white)] rounded-xl shadow-2xl shadow-indigo-900/10 border border-slate-200/60 p-4 w-[320px] flex items-start gap-3 cursor-pointer hover:border-indigo-300 hover:shadow-indigo-900/20 transition-all"
               onClick={() => {
                 router.push(`/dashboard/dossiers/${latestMessage.dossier_id}`);
                 setShowToast(false);
               }}>
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 border border-indigo-100">
              <MessageSquare size={18} className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="text-sm font-semibold text-[var(--ink)] truncate">Gestionnaire</h4>
                <button onClick={(e) => { e.stopPropagation(); setShowToast(false); }} className="text-[var(--muted)] hover:text-slate-600 focus:outline-none p-1 -mr-1 rounded-md">
                  <X size={14} />
                </button>
              </div>
              <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-wider mb-1">Nouveau message</p>
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{latestMessage.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* MENU MOBILE (Dark Premium) */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-[var(--white)] backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-72 bg-[var(--page-bg)] z-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r border-[var(--stone)]/20">
            <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--stone)]/20/60">
              <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                  <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover object-center" />
                </div>
                <span className="text-xl font-bold tracking-tight text-[var(--ink)]">Glass<span className="text-[var(--blue)]">Pilot</span></span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-[#64748B] hover:text-[var(--ink)] rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Garage Info */}
            <div className="px-5 py-5 border-b border-[var(--stone)]/20/60">
              <div className="bg-white border border-[var(--stone)]/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 bg-indigo-500/10 rounded-md flex items-center justify-center">
                    <ShieldCheck size={12} className="text-[var(--blue)]" />
                  </div>
                  <span className="text-[10px] font-bold text-[var(--blue)] uppercase tracking-wider">Mon garage</span>
                </div>
                <p className="font-bold text-[var(--ink)] text-sm truncate">{garageName || 'Mon Garage'}</p>
                <p className="text-xs text-[#64748B] mt-0.5 truncate">Espace professionnel</p>
              </div>
            </div>

            <nav className="flex-1 px-3 py-6 overflow-y-auto custom-scrollbar">
              {navSections.map((section, idx) => (
                <div key={idx} className="mb-6 last:mb-0">
                  <div className="px-3 mb-2 flex flex-col">
                    <span className="text-[10px] font-bold text-[var(--blue)] uppercase tracking-wider">{section.title}</span>
                    <div className="h-0.5 w-6 bg-[var(--blue)]/40 rounded-full mt-1"></div>
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href, item.exact);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={clsx(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                            active ? "bg-[var(--blue)] text-[var(--ink)] shadow-sm" : "text-[#64748B] hover:bg-[var(--blue)]/10 hover:text-[var(--ink)]"
                          )}
                        >
                          <Icon size={18} className={clsx(active ? "text-[var(--ink)]" : "text-[#64748B]")} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-4 border-t border-[var(--stone)]/20/60 space-y-1">
              <Link 
                href="/dashboard/aide" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-[#64748B] hover:text-[var(--ink)] hover:bg-[var(--blue)]/10 rounded-lg text-sm font-medium transition-colors"
              >
                <HelpCircle size={18} className="text-[#64748B]" />
                Centre d'aide
              </Link>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut size={18} className="text-[#64748B] group-hover:text-rose-400" />
                Déconnexion
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}