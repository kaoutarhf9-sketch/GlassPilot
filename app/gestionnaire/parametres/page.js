"use client";

import { Settings, Shield, Bell, User, Key, Save } from 'lucide-react';
import { useState } from 'react';

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState('profil');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* En-tête */}
      <div>
        <div className="inline-flex items-center gap-2 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] shadow-md rounded-full px-4 py-2 mb-6 border border-slate-200">
          <Settings size={14} className="text-indigo-600" />
          <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">Configuration</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif text-[var(--ink)] mb-2">Paramètres</h1>
        <p className="text-slate-500 font-light">Gérez votre compte et vos préférences système</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar des paramètres */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col space-y-1">
            <button 
              onClick={() => setActiveTab('profil')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profil' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-transparent hover:text-[var(--ink)]'}`}
            >
              <User size={18} className={activeTab === 'profil' ? 'text-indigo-600' : 'text-slate-400'} />
              Profil personnel
            </button>
            <button 
              onClick={() => setActiveTab('securite')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'securite' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-transparent hover:text-[var(--ink)]'}`}
            >
              <Shield size={18} className={activeTab === 'securite' ? 'text-indigo-600' : 'text-slate-400'} />
              Sécurité & Accès
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-transparent hover:text-[var(--ink)]'}`}
            >
              <Bell size={18} className={activeTab === 'notifications' ? 'text-indigo-600' : 'text-slate-400'} />
              Notifications
            </button>
          </nav>
        </div>

        {/* Contenu principal */}
        <div className="flex-1">
          <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl shadow-md border border-slate-200 overflow-hidden">
            
            {activeTab === 'profil' && (
              <div className="p-8">
                <h2 className="text-lg font-bold text-[var(--ink)] mb-6">Informations du profil</h2>
                
                <div className="space-y-6 max-w-lg">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nom de l'entreprise / Agence</label>
                    <input 
                      type="text" 
                      defaultValue="Brilglass Gestion"
                      className="w-full px-4 py-2.5 bg-transparent border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nom du responsable</label>
                    <input 
                      type="text" 
                      defaultValue="Admin Gestion"
                      className="w-full px-4 py-2.5 bg-transparent border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Adresse Email Contact</label>
                    <input 
                      type="email" 
                      defaultValue="contact@brilglass.fr"
                      className="w-full px-4 py-2.5 bg-transparent border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                  
                  <div className="pt-4">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-indigo-600/20">
                      <Save size={16} /> Enregistrer les modifications
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'securite' && (
              <div className="p-8">
                <h2 className="text-lg font-bold text-[var(--ink)] mb-6">Sécurité du compte</h2>
                <div className="space-y-6 max-w-lg">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Mot de passe actuel</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2.5 bg-transparent border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nouveau mot de passe</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2.5 bg-transparent border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div className="pt-4">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-all shadow-md">
                      <Key size={16} /> Mettre à jour le mot de passe
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="p-8 text-center text-slate-500 py-20">
                <Bell size={48} className="mx-auto mb-4 opacity-20" />
                <p>La gestion des notifications par email arrivera prochainement.</p>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
