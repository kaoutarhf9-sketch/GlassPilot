import { NextResponse } from 'next/server';
import { createMollieClient } from '@mollie/api-client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
    // Le webhook de Mollie envoie l'ID du paiement dans le body en urlencoded ou json
    // Mollie envoie form-urlencoded by default (id=tr_xxx)
    const text = await request.text();
    let paymentId;

    if (text.includes('=')) {
      const params = new URLSearchParams(text);
      paymentId = params.get('id');
    } else {
      const data = JSON.parse(text);
      paymentId = data.id;
    }

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
    }

    // Récupérer le statut du paiement depuis l'API Mollie (pour sécurité)
    const payment = await mollieClient.payments.get(paymentId);
    
    // Si le paiement est "paid" et n'a pas été remboursé
    if (payment.isPaid() && !payment.hasRefunds() && !payment.hasChargebacks()) {
      
      const metadata = payment.metadata;
      if (!metadata || !metadata.garage_id) {
        console.error('Webhook Mollie : Métadonnées manquantes pour le paiement', paymentId);
        return NextResponse.json({ success: true }); // On répond 200 à Mollie pour qu'ils arrêtent d'appeler
      }

      const { garage_id, forfait_id, quantite, type, prix } = metadata;

      // Vérifier si ce paiement a déjà été traité
      const { data: existingAchat } = await supabase
        .from('achats_jetons')
        .select('id')
        .eq('reference_transaction', paymentId)
        .maybeSingle();

      if (existingAchat) {
        // Déjà traité, on s'arrête là
        return NextResponse.json({ success: true, message: 'Already processed' });
      }

      const isUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      const dbForfaitId = isUuid(forfait_id) ? forfait_id : null;

      // 1. Enregistrer la transaction
      await supabase
        .from('achats_jetons')
        .insert({
          garage_id,
          forfait_id: dbForfaitId,
          quantite: parseInt(quantite),
          montant: parseFloat(prix),
          statut: 'paye',
          reference_transaction: paymentId,
          paye_at: new Date().toISOString()
        });

      // 2. Mettre à jour le stock de jetons
      const { data: currentStock } = await supabase
        .from('stock_jetons')
        .select('*')
        .eq('garage_id', garage_id)
        .maybeSingle();

      const updateField = type === 'simple' ? 'simple' : 'prestige';
      const qtyToAdd = parseInt(quantite);

      if (currentStock) {
        await supabase
          .from('stock_jetons')
          .update({ 
            [updateField]: (currentStock[updateField] || 0) + qtyToAdd,
            updated_at: new Date().toISOString()
          })
          .eq('garage_id', garage_id);
      } else {
        await supabase
          .from('stock_jetons')
          .insert({
            garage_id,
            simple: type === 'simple' ? qtyToAdd : 0,
            prestige: type === 'prestige' ? qtyToAdd : 0
          });
      }
    }

    // Toujours renvoyer un statut HTTP 200 à Mollie
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Erreur Webhook Mollie:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
