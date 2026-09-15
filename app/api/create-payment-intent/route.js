import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

    // Calcul du montant en centimes (Stripe utilise les centimes)
    const amountInCents = Math.round(forfait.prix * 100);

    // Créer la session de paiement Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${forfait.quantite} jeton${forfait.quantite > 1 ? 's' : ''} ${forfait.type === 'simple' ? 'Simple' : 'Prestige'}`,
              description: forfait.description,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/abonnement?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/abonnement?canceled=true`,
      client_reference_id: garageId,
      customer_email: userEmail,
      metadata: {
        garage_id: garageId,
        garage_name: garageName,
        forfait_id: forfait.id,
        forfait_nom: forfait.nom,
        quantite: forfait.quantite.toString(),
        type: forfait.type,
        prix: forfait.prix.toString(),
        consent: consent.toString(),
        consent_date: consentDate || new Date().toISOString()
      },
    });

    // Retourner l'URL de redirection Stripe
    return NextResponse.json({ 
      url: session.url, 
      sessionId: session.id 
    });

  } catch (err) {
    console.error('Erreur Stripe:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}