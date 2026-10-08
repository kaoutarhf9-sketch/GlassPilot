const fs = require('fs');

let code = fs.readFileSync('app/dashboard/layout.js', 'utf8');

// 1. Add Clock to imports if not present
if (!code.includes('Clock,')) {
  code = code.replace(/BookOpen\r?\n\} from 'lucide-react';/, "BookOpen,\n  Clock\n} from 'lucide-react';");
}

// 2. Add Référentiel Assurance to navSections under COMMUNICATION
if (!code.includes("label: 'Référentiel Assurance'")) {
  code = code.replace(
    /title:\s*'COMMUNICATION',\r?\n\s*items:\s*\[\r?\n\s*\{\s*href:\s*'\/dashboard\/actualites',\s*label:\s*'Actualités',\s*icon:\s*Newspaper\s*\},/,
    `title: 'COMMUNICATION',
      items: [
        { href: '/dashboard/actualites', label: 'Actualités', icon: Newspaper },
        { href: '/dashboard/referentiel-assurance', label: 'Référentiel Assurance', icon: BookOpen },`
  );
}

// 3. Update getNotificationIcon to size 16
code = code.replace(
  /const getNotificationIcon = \(type\) => \{[\s\S]*?return icons\[type\] \|\| icons\.default;\s*\};/,
  `const getNotificationIcon = (type) => {
    const icons = {
      dossier_cree: <FileText size={16} className="text-emerald-400" />,
      signature_validee: <ShieldCheck size={16} className="text-[#00d4ff]" />,
      paiement_recu: <Sparkles size={16} className="text-amber-400" />,
      message: <MessageSquare size={16} className="text-[#00d4ff]" />,
      actualite: <Megaphone size={16} className="text-emerald-400" />,
      assignation: <CheckCheck size={16} className="text-amber-400" />,
      document: <FileText size={16} className="text-indigo-400" />,
      archivage: <Trash2 size={16} className="text-slate-400" />,
      statut: <ShieldCheck size={16} className="text-indigo-400" />,
      default: <Bell size={16} className="text-[#00d4ff]" />
    };
    return icons[type] || icons.default;
  };`
);

// 4. Update fetchNotifications to load unread messages too and calculate total unread
code = code.replace(
  /const fetchNotifications = async \(\) => \{[\s\S]*?setUnreadCount\(\(notifs \|\| \[\]\)\.filter\(n => !n\.is_read\)\.length\);\s*\} catch \(err\) \{[\s\S]*?\}\s*\};/,
  `const fetchNotifications = async (targetGarageId = null) => {
    const gid = targetGarageId || garageId;
    if (!gid) return;
    
    try {
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('garage_id', gid)
        .order('created_at', { ascending: false })
        .limit(30);

      const { data: unreadMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('garage_id', gid)
        .eq('sender_role', 'gestionnaire')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      const msgNotifs = (unreadMsgs || []).map(m => ({
        id: \`msg-\${m.id}\`,
        dossier_id: m.dossier_id,
        type: 'message',
        title: \`Nouveau message de \${m.sender_name || 'Gestionnaire'}\`,
        message: m.message,
        is_read: false,
        created_at: m.created_at,
        link: \`/dashboard/dossiers/\${m.dossier_id}\`
      }));

      const combined = [...msgNotifs, ...(notifs || [])];
      const seen = new Set();
      const unique = combined.filter(n => {
        if (seen.has(n.id)) return false;
        seen.add(n.id);
        return true;
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setNotifications(unique);
      setUnreadCount(unique.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Erreur chargement notifications:', err);
    }
  };`
);

// 5. In fetchUserInfo, call fetchNotifications with garage.id
code = code.replace(
  /setGarageId\(garage\.id\);\s*setGarageName\(garage\.nom_garage\);/,
  `setGarageId(garage.id);
        setGarageName(garage.nom_garage);
        fetchNotifications(garage.id);`
);

// 6. Update notification bell and dropdown JSX
const oldBellAndDropdownRegex = /\{\/\* NOTIFICATIONS \*\/\}[\s\S]*?\{\/\* PROFIL \*\/\}/;

const newBellAndDropdown = `{/* NOTIFICATIONS */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2.5 text-slate-300 hover:text-white hover:bg-[#16223d] transition-colors rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/30 border border-transparent hover:border-[#1e2d4a] cursor-pointer"
                  title="Notifications"
                >
                  <Bell size={20} className="text-slate-300 hover:text-[#00d4ff] transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-rose-600 text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-[#0d1428] shadow-lg shadow-rose-600/50 animate-in zoom-in leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Menu déroulant notifications */}
                {notificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setNotificationsOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-[360px] sm:w-[440px] bg-[#0d1428] rounded-2xl border border-[#1e2d4a] shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                      
                      {/* En-tête notifications */}
                      <div className="px-5 py-4 border-b border-[#1e2d4a] flex justify-between items-center bg-[#111c35]">
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-extrabold text-white text-base">Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="px-2.5 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-full">
                              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-xs font-bold text-[#00d4ff] hover:text-cyan-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <CheckCheck size={16} /> Tout marquer lu
                          </button>
                        )}
                      </div>

                      {/* Liste notifications */}
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
                          notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              className={clsx(
                                "p-4 hover:bg-[#16223d]/80 transition-colors cursor-pointer relative group flex items-start gap-3.5",
                                !notif.is_read ? "bg-[#1454FF]/15 border-l-4 border-l-[#00d4ff]" : "bg-transparent"
                              )}
                              onClick={() => {
                                markAsRead(notif.id);
                                if (notif.link) {
                                  router.push(notif.link);
                                  setNotificationsOpen(false);
                                } else if (notif.type === 'message' || notif.dossier_id) {
                                  router.push(\`/dashboard/dossiers/\${notif.dossier_id}\`);
                                  setNotificationsOpen(false);
                                }
                              }}
                            >
                              <div className="flex-shrink-0 mt-0.5 bg-[#111c35] p-2.5 rounded-xl border border-[#1e2d4a] text-[#00d4ff] shadow-sm group-hover:border-[#00d4ff]/40 transition-colors">
                                {getNotificationIcon(notif.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className={clsx(
                                    "text-sm sm:text-base leading-snug", 
                                    !notif.is_read ? "font-bold text-white" : "font-semibold text-slate-200"
                                  )}>
                                    {notif.title}
                                  </p>
                                  {!notif.is_read && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#00d4ff] shrink-0 shadow-sm shadow-[#00d4ff]/50"></span>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                                  {notif.message}
                                </p>
                                <p className="text-xs font-semibold text-[#00d4ff]/90 mt-2 flex items-center gap-1.5">
                                  <Clock size={13} /> {formatNotificationDate(notif.created_at)}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notif.id);
                                }}
                                className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 p-2 rounded-lg transition-all flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="w-px h-6 bg-slate-700 hidden sm:block mx-1"></div>
              
              {/* PROFIL */}`;

if (oldBellAndDropdownRegex.test(code)) {
  code = code.replace(oldBellAndDropdownRegex, newBellAndDropdown);
  fs.writeFileSync('app/dashboard/layout.js', code, 'utf8');
  console.log('Successfully updated app/dashboard/layout.js');
} else {
  console.error('Could not match oldBellAndDropdownRegex');
}
