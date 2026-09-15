"use client";

import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Database, Eye, Trash2, CreditCard, Server, Clock, Mail, AlertCircle } from 'lucide-react';

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-[#F0F5FF] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Bouton retour */}
        <Link href="/" className="inline-flex items-center gap-2 text-[#89867A] hover:text-[#1454FF] mb-8 transition-colors">
          <ArrowLeft size={16} /> Retour au site
        </Link>

        <div className="bg-white rounded-2xl border border-[#E6E4DD] shadow-sm overflow-hidden">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-[#1454FF] to-[#0040CC] px-8 py-6 text-white">
            <h1 className="text-2xl md:text-3xl font-serif mb-2">Mentions légales & RGPD</h1>
            <p className="text-white/70 text-sm">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
          </div>

          <div className="p-8 space-y-8">
            
            {/* Éditeur */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Server size={20} className="text-[#1454FF]" />
                <h2 className="text-xl font-semibold text-[#18170F]">1. Éditeur du site</h2>
              </div>
              <div className="bg-[#FAFAF8] rounded-xl p-5 text-[#89867A] text-sm space-y-2">
                <p><strong className="text-[#18170F]">GlassPilot SAS</strong></p>
                <p>Siège social : 10 rue de l'Innovation, 75001 Paris</p>
                <p>SIRET : 123 456 789 00012</p>
                <p>Email : contact@glasspilot.fr</p>
                <p>Téléphone : 01 23 45 67 89</p>
                <p>Directeur de publication : Le fondateur</p>
              </div>
            </section>

            {/* Hébergement */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Database size={20} className="text-[#1454FF]" />
                <h2 className="text-xl font-semibold text-[#18170F]">2. Hébergement</h2>
              </div>
              <div className="bg-[#FAFAF8] rounded-xl p-5 text-[#89867A] text-sm">
                <p><strong className="text-[#18170F]">Supabase</strong></p>
                <p>Hébergement : France 🇫🇷</p>
                <p>Adresse : Supabase, Inc., 970 Toion, CA 94103, USA</p>
                <p>Certification : GDPR compliant, SOC 2 Type II</p>
              </div>
            </section>

            {/* Traitement des paiements */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <CreditCard size={20} className="text-[#1454FF]" />
                <h2 className="text-xl font-semibold text-[#18170F]">3. Paiements sécurisés (Stripe)</h2>
              </div>
              <div className="bg-[#FAFAF8] rounded-xl p-5 text-[#89867A] text-sm space-y-3">
                <p>Les paiements sont traités par <strong className="text-[#18170F]">Stripe</strong>, prestataire de services de paiement agréé.</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Certification PCI DSS Level 1 (le plus haut niveau de sécurité)</li>
                  <li>Conforme au RGPD et au Privacy Shield</li>
                  <li>Aucune donnée bancaire n'est stockée sur nos serveurs</li>
                  <li>Les informations de carte sont chiffrées et tokenisées</li>
                </ul>
                <p className="mt-3">Pour en savoir plus : <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer" className="text-[#1454FF] underline">Politique de confidentialité Stripe</a></p>
              </div>
            </section>

            {/* Données collectées */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Database size={20} className="text-[#1454FF]" />
                <h2 className="text-xl font-semibold text-[#18170F]">4. Données personnelles collectées</h2>
              </div>
              <div className="bg-[#FAFAF8] rounded-xl p-5 text-[#89867A] text-sm space-y-3">
                <p>Nous collectons les données suivantes :</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Nom, prénom, email, téléphone</li>
                  <li>Adresse, code postal, ville</li>
                  <li>Nom du garage, numéro SIRET</li>
                  <li>Historique des transactions (montant, date, type de jetons)</li>
                  <li>Données de navigation (cookies techniques)</li>
                </ul>
                <p className="mt-3"><strong>Base légale :</strong> Exécution du contrat (CGU) et consentement explicite.</p>
              </div>
            </section>

            {/* Finalités du traitement */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Eye size={20} className="text-[#1454FF]" />
                <h2 className="text-xl font-semibold text-[#18170F]">5. Finalités du traitement</h2>
              </div>
              <div className="bg-[#FAFAF8] rounded-xl p-5 text-[#89867A] text-sm space-y-2">
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Gestion de votre compte professionnel</li>
                  <li>Traitement des paiements (via Stripe)</li>
                  <li>Gestion des jetons et des dossiers</li>
                  <li>Envoi des factures et reçus</li>
                  <li>Amélioration de nos services (analytics anonymisés)</li>
                </ul>
              </div>
            </section>

            {/* Durée de conservation */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Clock size={20} className="text-[#1454FF]" />
                <h2 className="text-xl font-semibold text-[#18170F]">6. Durée de conservation</h2>
              </div>
              <div className="bg-[#FAFAF8] rounded-xl p-5 text-[#89867A] text-sm">
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Données de compte : jusqu'à suppression du compte</li>
                  <li>Transactions : 10 ans (obligation légale)</li>
                  <li>Données de navigation : 13 mois</li>
                </ul>
              </div>
            </section>

            {/* Vos droits */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield size={20} className="text-[#1454FF]" />
                <h2 className="text-xl font-semibold text-[#18170F]">7. Vos droits RGPD</h2>
              </div>
              <div className="bg-[#FAFAF8] rounded-xl p-5 text-[#89867A] text-sm space-y-3">
                <p>Conformément au RGPD, vous disposez des droits suivants :</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Droit d'accès</strong> : consulter vos données</li>
                  <li><strong>Droit de rectification</strong> : modifier vos données erronées</li>
                  <li><strong>Droit à l'effacement</strong> : supprimer votre compte et vos données</li>
                  <li><strong>Droit à la limitation</strong> : restreindre le traitement</li>
                  <li><strong>Droit à la portabilité</strong> : récupérer vos données</li>
                  <li><strong>Droit d'opposition</strong> : refuser certains traitements</li>
                </ul>
                <p className="mt-3">Pour exercer vos droits : <a href="mailto:contact@glasspilot.fr" className="text-[#1454FF] underline">contact@glasspilot.fr</a></p>
                <p className="text-sm">Délai de réponse : 30 jours maximum.</p>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Cookie size={20} className="text-[#1454FF]" />
                <h2 className="text-xl font-semibold text-[#18170F]">8. Cookies</h2>
              </div>
              <div className="bg-[#FAFAF8] rounded-xl p-5 text-[#89867A] text-sm">
                <p>Notre site utilise uniquement :</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Cookies techniques (authentification, panier)</li>
                  <li>Cookies de session Stripe (paiement sécurisé)</li>
                  <li>Cookies d'analyse anonymisés (amélioration du service)</li>
                </ul>
                <p className="mt-3">Aucun cookie publicitaire n'est utilisé.</p>
                <p className="mt-2">Vous pouvez gérer vos préférences via les paramètres de votre navigateur.</p>
              </div>
            </section>

            {/* Contact DPO */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Mail size={20} className="text-[#1454FF]" />
                <h2 className="text-xl font-semibold text-[#18170F]">9. Contact DPO</h2>
              </div>
              <div className="bg-[#FAFAF8] rounded-xl p-5 text-[#89867A] text-sm">
                <p>Pour toute question relative à vos données personnelles :</p>
                <p className="mt-2"><strong className="text-[#18170F]">Délégué à la protection des données (DPO)</strong></p>
                <p>Email : <a href="mailto:dpo@glasspilot.fr" className="text-[#1454FF] underline">dpo@glasspilot.fr</a></p>
                <p>Adresse : 10 rue de l'Innovation, 75001 Paris</p>
              </div>
            </section>

            {/* Réclamation CNIL */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle size={20} className="text-[#1454FF]" />
                <h2 className="text-xl font-semibold text-[#18170F]">10. Réclamation CNIL</h2>
              </div>
              <div className="bg-[#FAFAF8] rounded-xl p-5 text-[#89867A] text-sm">
                <p>En cas de non-respect du RGPD, vous avez le droit d'introduire une réclamation auprès de la <strong className="text-[#18170F]">CNIL</strong> :</p>
                <p className="mt-2">Site : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#1454FF] underline">www.cnil.fr</a></p>
                <p>Adresse : 3 Place de Fontenoy, 75007 Paris</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

// Composant manquant pour l'icône Cookie
function Cookie(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-6-6 4 4 0 0 0-4-4z" />
      <path d="M8.5 8.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" />
      <path d="M15.5 15.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" />
    </svg>
  );
}