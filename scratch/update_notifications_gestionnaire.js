const fs = require('fs');

let code = fs.readFileSync('app/gestionnaire/layout.js', 'utf8');

// 1. Add Clock to imports if not present
if (!code.includes('Clock,')) {
  code = code.replace(/Building2, FolderKanban, CheckCheck, Trash2, Megaphone, BookOpen/, 'Building2, FolderKanban, CheckCheck, Trash2, Megaphone, BookOpen,\n  Clock');
}

// 2. Replace bell button and dropdown
const oldBellAndDropdownRegex = /\{\/\* Notifications \*\/\}[\s\S]*?<div className="w-px h-6 bg-slate-200 hidden sm:block mx-1"><\/div>/;

const newBellAndDropdown = `{/* Notifications */}
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
                            const destination = notif.link || (notif.dossier_id ? \`/gestionnaire/dossiers/\${notif.dossier_id}\` : '/gestionnaire/dashboard');
                            
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
              
              <div className="w-px h-6 bg-slate-700 hidden sm:block mx-1"></div>`;

if (oldBellAndDropdownRegex.test(code)) {
  code = code.replace(oldBellAndDropdownRegex, newBellAndDropdown);
  fs.writeFileSync('app/gestionnaire/layout.js', code, 'utf8');
  console.log('Successfully updated app/gestionnaire/layout.js');
} else {
  console.error('Could not match oldBellAndDropdownRegex in gestionnaire');
}
