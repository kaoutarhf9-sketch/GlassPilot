"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, Mail, Phone, MapPin, Building2, Save, Loader2, 
  AlertCircle, CheckCircle2, Calendar, Shield,
  Award, Star, TrendingUp, Clock, FileText, Sparkles,
  CreditCard, Users, Briefcase, ArrowRight
} from 'lucide-react';

export default function ProfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [garage, setGarage] = useState(null);
  const [stats, setStats] = useState({
    total_dossiers: 0,
    dossiers_mois: 0,
    clients_actifs: 0
  });
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    code_postal: '',
    ville: '',
    nom_garage: '',
    siret: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!authUser) {
        router.push('/connexion');
        return;
      }

      setUser(authUser);
      
      const { data: garageData, error: garageError } = await supabase
        .from('garages')
        .select('*')
        .eq('owner_id', authUser.id)
        .maybeSingle();

      if (garageError) throw garageError;

      setGarage(garageData);
      
      if (garageData) {
        const { data: dossiers } = await supabase
          .from('dossiers')
          .select('statut, created_at, clients_id')
          .eq('garage_id', garageData.id);

        if (dossiers) {
          const now = new Date();
          const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
          
          const clientsUniques = new Set(dossiers.map(d => d.clients_id).filter(Boolean));
          
          setStats({
            total_dossiers: dossiers.length,
            dossiers_mois: dossiers.filter(d => new Date(d.created_at) >= debutMois).length,
            clients_actifs: clientsUniques.size
          });
        }
      }
      
      const fullAdresse = garageData?.adresse || '';
      let street = '';
      let cp = '';
      let city = '';

      if (fullAdresse) {
        const parts = fullAdresse.split(',');
        if (parts.length > 1) {
          street = parts[0].trim();
          const rest = parts.slice(1).join(',').trim();
          const cpMatch = rest.match(/^(\d{5})\s+(.*)$/);
          if (cpMatch) {
            cp = cpMatch[1];
            city = cpMatch[2].trim();
          } else {
            city = rest;
          }
        } else {
          const cpMatch = fullAdresse.match(/(\d{5})/);
          if (cpMatch) {
            cp = cpMatch[1];
            const index = fullAdresse.indexOf(cp);
            street = fullAdresse.substring(0, index).trim();
            city = fullAdresse.substring(index + 5).trim();
          } else {
            street = fullAdresse;
          }
        }
      }

      setFormData({
        prenom: authUser.user_metadata?.prenom || authUser.user_metadata?.first_name || '',
        nom: authUser.user_metadata?.nom || authUser.user_metadata?.last_name || '',
        email: authUser.email || '',
        telephone: garageData?.telephone || '',
        adresse: street,
        code_postal: cp,
        ville: city,
        nom_garage: garageData?.nom_garage || '',
        siret: garageData?.siret || '',
      });

    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: {
          prenom: formData.prenom,
          nom: formData.nom,
          first_name: formData.prenom,
          last_name: formData.nom,
        }
      });

      if (userUpdateError) throw userUpdateError;

      const { error: garageError } = await supabase
        .from('garages')
        .upsert({
          id: garage?.id || undefined,
          owner_id: user.id,
          nom_garage: formData.nom_garage,
          responsable: `${formData.prenom} ${formData.nom}`.trim(),
          email_contact: formData.email,
          telephone: formData.telephone,
          adresse: `${formData.adresse}, ${formData.code_postal} ${formData.ville}`.trim().replace(/^,\s*/, ''),
          siret: formData.siret
        });

      if (garageError) throw garageError;

      setSuccess("Profil mis à jour avec succès !");
      setTimeout(() => setSuccess(''), 3000);
      
      fetchProfile();

    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-[var(--blue)] rounded-full animate-ping opacity-20"></div>
            <Loader2 size={48} className="animate-spin text-[var(--blue)] mx-auto relative z-10" />
          </div>
          <p className="text-[var(--muted)] font-light">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* En-tête de page */}
      <div>
        <div className="inline-flex items-center gap-2 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] shadow-md rounded-full px-4 py-2 mb-6 border border-[var(--stone)]">
          <Sparkles size={14} className="text-[var(--blue)]" />
          <span className="text-xs font-medium text-[var(--blue)] uppercase tracking-wider">Mon compte</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif text-[var(--ink)] mb-2">Profil professionnel</h1>
        <p className="text-[var(--muted)] font-light">Gérez vos informations personnelles et professionnelles</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-600 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-600 text-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl p-5 border border-[var(--stone)] shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[var(--blue)]/10 rounded-xl flex items-center justify-center">
              <FileText size={18} className="text-[var(--blue)]" />
            </div>
            <span className="text-xs text-[var(--muted)] font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold text-[var(--ink)]">{stats.total_dossiers}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Dossiers traités</p>
        </div>
        <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl p-5 border border-[var(--stone)] shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[var(--blue)]/10 rounded-xl flex items-center justify-center">
              <Calendar size={18} className="text-[var(--blue)]" />
            </div>
            <span className="text-xs text-[var(--muted)] font-medium">Ce mois</span>
          </div>
          <p className="text-2xl font-bold text-[var(--ink)]">{stats.dossiers_mois}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Dossiers créés</p>
        </div>
        <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl p-5 border border-[var(--stone)] shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[var(--blue)]/10 rounded-xl flex items-center justify-center">
              <Users size={18} className="text-[var(--blue)]" />
            </div>
            <span className="text-xs text-[var(--muted)] font-medium">Clients</span>
          </div>
          <p className="text-2xl font-bold text-[var(--ink)]">{stats.clients_actifs}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Clients actifs</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Carte informations personnelles */}
        <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl border border-[var(--stone)] shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--stone)] bg-[var(--white)]/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--blue)]/10 rounded-lg flex items-center justify-center">
                <User size={16} className="text-[var(--blue)]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--ink)]">Informations personnelles</h2>
                <p className="text-xs text-[var(--muted)] font-light">Vos coordonnées et identité</p>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Prénom</label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[var(--white)]/40 border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/10 transition-all placeholder:text-[var(--muted)]"
                placeholder="Jean"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Nom</label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[var(--white)]/40 border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/10 transition-all placeholder:text-[var(--muted)]"
                placeholder="Dupont"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Adresse email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--white)]/40 border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/10 transition-all placeholder:text-[var(--muted)]"
                  placeholder="contact@moncentre.fr"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Carte informations du garage */}
        <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl border border-[var(--stone)] shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--stone)] bg-[var(--white)]/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--blue)]/10 rounded-lg flex items-center justify-center">
                <Building2 size={16} className="text-[var(--blue)]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--ink)]">Mon garage</h2>
                <p className="text-xs text-[var(--muted)] font-light">Informations professionnelles</p>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Nom du garage</label>
              <input
                type="text"
                name="nom_garage"
                value={formData.nom_garage}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[var(--white)]/40 border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/10 transition-all placeholder:text-[var(--muted)]"
                placeholder="AutoGlass Pro"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Adresse</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--white)]/40 border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/10 transition-all placeholder:text-[var(--muted)]"
                  placeholder="123 rue du Commerce"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Code postal</label>
              <input
                type="text"
                name="code_postal"
                value={formData.code_postal}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[var(--white)]/40 border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/10 transition-all placeholder:text-[var(--muted)]"
                placeholder="75001"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Ville</label>
              <input
                type="text"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[var(--white)]/40 border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/10 transition-all placeholder:text-[var(--muted)]"
                placeholder="Paris"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Téléphone</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--white)]/40 border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/10 transition-all placeholder:text-[var(--muted)]"
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">SIRET</label>
              <div className="relative">
                <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  name="siret"
                  value={formData.siret}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--white)]/40 border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/10 transition-all placeholder:text-[var(--muted)]"
                  placeholder="123 456 789 00012"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Carte abonnement avec lien vers la page des jetons */}
        <div className="bg-gradient-to-r from-[#F0F5FF] to-white rounded-2xl border border-[var(--stone)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-[var(--blue)]/10 rounded-lg flex items-center justify-center">
              <Award size={16} className="text-[var(--blue)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--ink)]">Jetons GlassPilot</h2>
              <p className="text-xs text-[var(--muted)] font-light">Achetez des jetons pour gérer vos dossiers</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-xl px-4 py-2 border border-[var(--stone)]">
                <p className="text-xs text-[var(--muted)]">Simple</p>
                <p className="font-semibold text-[var(--ink)] text-sm">À l'unité</p>
              </div>
              <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-xl px-4 py-2 border border-[var(--stone)]">
                <p className="text-xs text-[var(--muted)]">Prestige</p>
                <p className="font-semibold text-[var(--ink)] text-sm">À l'unité</p>
              </div>
            </div>
            <Link 
              href="/dashboard/abonnement"
              className="px-4 py-2 text-sm font-medium text-[var(--blue)] border border-[#1454FF] rounded-xl hover:bg-[var(--blue)]/10 transition-colors flex items-center gap-2"
            >
              Gérer mes jetons <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Bouton de validation */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-[var(--blue)] hover:bg-[#0ea5e9] text-white font-medium rounded-xl transition-all shadow-md shadow-[#1454FF]/25 flex items-center gap-2 disabled:opacity-70 hover:-translate-y-0.5"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>

      </form>
    </div>
  );
}