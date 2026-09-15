import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID requis' }, { status: 400 });
    }

    // Récupérer la session Stripe avec la clé secrète
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Paiement non validé par Stripe' }, { status: 400 });
    }

    const { garage_id, forfait_id, quantite, type } = session.metadata;

    const isUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const dbForfaitId = isUuid(forfait_id) ? forfait_id : null;

    // Vérifier si cet achat a déjà été enregistré pour éviter les doublons avec le Webhook
    const { data: existingAchat } = await supabase
      .from('achats_jetons')
      .select('id')
      .eq('reference_transaction', session.id)
      .maybeSingle();

    if (existingAchat) {
      return NextResponse.json({ success: true, message: 'Déjà traité' });
    }

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
          [updateField]: (currentStock[updateField] || 0) + parseInt(quantite),
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

    return NextResponse.json({ success: true, credited: true });

  } catch (err) {
    console.error('Erreur vérification paiement:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
