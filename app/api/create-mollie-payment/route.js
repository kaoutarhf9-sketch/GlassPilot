import { NextResponse } from 'next/server';
import { createMollieClient } from '@mollie/api-client';

const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

export async function POST(request) {
  try {
    const { forfait, garageId, garageName, userEmail, consent, consentDate } = await request.json();

    // Vérification RGPD obligatoire
    if (!consent) {
      return NextResponse.json({ error: 'Consentement RGPD requis pour le traitement des données' }, { status: 400 });
    }

    // Validation des données
    if (!forfait || !garageId || !userEmail) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Formatage du montant pour Mollie (string avec 2 décimales, ex: "10.00")
    const formattedAmount = Number(forfait.prix).toFixed(2);
    
    // Description du produit
    const description = `${forfait.quantite} jeton${forfait.quantite > 1 ? 's' : ''} ${forfait.type === 'simple' ? 'Simple' : 'Prestige'}`;

    // Détermination dynamique de l'URL
    let appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      // Sur Vercel, VERCEL_URL est automatiquement défini (sans https://)
      appUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    }

    // Mollie rejette catégoriquement les webhooks pointant vers localhost
    let webhookUrl = `${appUrl}/api/mollie-webhook`;
    if (webhookUrl.includes('localhost')) {
      // En développement local, on met une URL publique bidon juste pour que Mollie accepte de créer le paiement
      webhookUrl = 'https://glasspilot.vercel.app/api/mollie-webhook';
    }

    // Création du paiement Mollie
    const payment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: formattedAmount,
      },
      description: description,
      redirectUrl: `${appUrl}/dashboard/abonnement?success=true`,
      webhookUrl: webhookUrl,
      metadata: {
        garage_id: garageId,
        garage_name: garageName,
        forfait_id: forfait.id,
        forfait_nom: forfait.nom,
        quantite: forfait.quantite.toString(),
        type: forfait.type,
        prix: forfait.prix.toString(),
        consent: consent.toString(),
        consent_date: consentDate || new Date().toISOString(),
        user_email: userEmail
      },
    });

    // Retourner l'URL de redirection Mollie (checkout)
    return NextResponse.json({ 
      url: payment.getCheckoutUrl(), 
      paymentId: payment.id 
    });

  } catch (err) {
    console.error('Erreur Mollie:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
