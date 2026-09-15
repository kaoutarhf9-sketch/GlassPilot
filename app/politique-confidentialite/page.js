"use client";

import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Database, Eye, Trash2, CreditCard, Server, Clock, Mail, AlertCircle } from 'lucide-react';

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-[#F0F5FF] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        <Link href="/" className="inline-flex items-center gap-2 text-[#89867A] hover:text-[#1454FF] mb-8 transition-colors">
          <ArrowLeft size={16} /> Retour au site
        </Link>

        <div className="bg-white rounded-2xl border border-[#E6E4DD] shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#1454FF] to-[#0040CC] px-8 py-6 text-white">
            <h1 className="text-2xl md:text-3xl font-serif mb-2">Politique de confidentialité</h1>
            <p className="text-white/70 text-sm">Version RGPD - {new Date().toLocaleDateString('fr-FR')}</p>
          </div>

          <div className="p-8 space-y-6 text-[#89867A] text-sm">
            <p className="text-[#18170F] font-medium">GlassPilot attache une importance particulière à la protection de vos données personnelles.</p>
            
            <h2 className="text-lg font-semibold text-[#18170F] mt-6">1. Collecte des données</h2>
            <p>Nous collectons uniquement les données nécessaires à la gestion de votre compte professionnel :</p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Identité (nom, prénom)</li>
              <li>Coordonnées (email, téléphone, adresse)</li>
              <li>Informations professionnelles (nom du garage, SIRET)</li>
              <li>Historique des transactions</li>
            </ul>

            <h2 className="text-lg font-semibold text-[#18170F] mt-6">2. Utilisation des données</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Créer et gérer votre compte</li>
              <li>Traiter vos paiements via Stripe</li>
              <li>Vous envoyer vos factures</li>
              <li>Améliorer nos services</li>
            </ul>

            <h2 className="text-lg font-semibold text-[#18170F] mt-6">3. Partage des données</h2>
            <p>Vos données ne sont jamais vendues. Elles sont partagées uniquement avec :</p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li><strong>Stripe</strong> : pour le traitement des paiements</li>
              <li><strong>Supabase</strong> : pour l'hébergement sécurisé</li>
              <li><strong>Autorités légales</strong> : si requis par la loi</li>
            </ul>

            <h2 className="text-lg font-semibold text-[#18170F] mt-6">4. Sécurité</h2>
            <p>Nous mettons en œuvre les mesures techniques et organisationnelles appropriées pour protéger vos données :</p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Chiffrement SSL/TLS</li>
              <li>Authentification forte</li>
              <li>Accès restreint aux données</li>
              <li>Sauvegardes quotidiennes chiffrées</li>
            </ul>

            <h2 className="text-lg font-semibold text-[#18170F] mt-6">5. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Droit d'accès et de rectification</li>
              <li>Droit à l'effacement ("droit à l'oubli")</li>
              <li>Droit à la portabilité des données</li>
              <li>Droit d'opposition</li>
            </ul>
            <p className="mt-3">Pour exercer vos droits : <a href="mailto:contact@glasspilot.fr" className="text-[#1454FF] underline">contact@glasspilot.fr</a></p>

            <h2 className="text-lg font-semibold text-[#18170F] mt-6">6. Contact DPO</h2>
            <p>Délégué à la protection des données : <a href="mailto:dpo@glasspilot.fr" className="text-[#1454FF] underline">dpo@glasspilot.fr</a></p>
            <p>Adresse : 10 rue de l'Innovation, 75001 Paris</p>

            <div className="bg-[#F0F5FF] rounded-xl p-4 mt-6">
              <p className="text-[#89867A] text-xs">
                Cette politique peut être modifiée à tout moment. La version en vigueur est accessible sur cette page.
                Dernière modification : {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}