import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Traiter l'événement checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { garage_id, forfait_id, quantite, type } = session.metadata;
    
    const isUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const dbForfaitId = isUuid(forfait_id) ? forfait_id : null;

    // Enregistrer la transaction
    await supabase
      .from('achats_jetons')
      .insert({
        garage_id,
        forfait_id: dbForfaitId,
        quantite: parseInt(quantite),
        montant: session.amount_total / 100,
        statut: 'paye',
        reference_transaction: session.id,
        paye_at: new Date().toISOString()
      });

    // Mettre à jour le stock de jetons
    const { data: currentStock } = await supabase
      .from('stock_jetons')
      .select('*')
      .eq('garage_id', garage_id)
      .maybeSingle();

    const updateField = type === 'simple' ? 'simple' : 'prestige';

    if (currentStock) {
      await supabase
        .from('stock_jetons')
        .update({ 
          [updateField]: currentStock[updateField] + parseInt(quantite),
          updated_at: new Date().toISOString()
        })
        .eq('garage_id', garage_id);
    } else {
      await supabase
        .from('stock_jetons')
        .insert({
          garage_id,
          simple: type === 'simple' ? parseInt(quantite) : 0,
          prestige: type === 'prestige' ? parseInt(quantite) : 0
        });
    }
  }

  return NextResponse.json({ received: true });
}