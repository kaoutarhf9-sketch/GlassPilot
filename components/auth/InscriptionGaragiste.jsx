"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, User, Mail, Phone, MapPin, FileText, Lock, Loader2 } from 'lucide-react';

export default function InscriptionGaragiste() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const [formData, setFormData] = useState({
    email: '', password: '', prenom: '', nom_garage: '',
    responsable: '', telephone: '', adresse: '', siret: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInscription = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { role: 'garagiste', prenom: formData.prenom } }
      });

      if (authError) throw authError;

      const { error: garageError } = await supabase
        .from('garages')
        .insert([{
          owner_id: authData.user.id,
          nom_garage: formData.nom_garage,
          responsable: formData.responsable,
          email_contact: formData.email,
          telephone: formData.telephone,
          adresse: formData.adresse,
          siret: formData.siret
        }]);

      if (garageError) throw garageError;

      setStatus({ type: 'success', message: 'Inscription réussie ! Votre espace garage est créé.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || "Une erreur est survenue." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Store className="text-blue-600" /> Inscrire mon Garage
      </h2>

      {status.message && (
        <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleInscription} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2 mt-4">1. Identifiants de connexion</div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
            <input type="email" name="email" required onChange={handleChange} className="pl-10 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input type="password" name="password" required minLength={6} onChange={handleChange} className="pl-10 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
          </div>
        </div>

        <div className="md:col-span-2 text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2 mt-4">2. Informations de l'entreprise</div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nom du garage</label>
          <div className="relative">
            <Store className="absolute left-3 top-3 text-slate-400" size={18} />
            <input type="text" name="nom_garage" required onChange={handleChange} className="pl-10 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-slate-400" size={18} />
            <input type="text" name="responsable" required onChange={handleChange} className="pl-10 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">SIRET</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
            <input type="text" name="siret" required onChange={handleChange} className="pl-10 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
            <input type="tel" name="telephone" required onChange={handleChange} className="pl-10 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Adresse complète</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
            <input type="text" name="adresse" required onChange={handleChange} className="pl-10 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="md:col-span-2 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Valider l'inscription"}
        </button>
      </form>
    </div>
  );
}