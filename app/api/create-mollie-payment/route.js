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

    // L'URL de notre application
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    // Création du paiement Mollie
    const payment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: formattedAmount,
      },
      description: description,
      redirectUrl: `${appUrl}/dashboard/abonnement?success=true`,
      webhookUrl: `${appUrl}/api/mollie-webhook`,
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
