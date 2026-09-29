import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  // Sécurité de base : ne jamais utiliser en production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    const { garageId, forfaitId, quantite, type, prix } = await request.json();
    
    if (!garageId) {
      return NextResponse.json({ error: 'Missing garageId' }, { status: 400 });
    }

    const isUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const dbForfaitId = isUuid(forfaitId) ? forfaitId : null;
    const fakeTxId = 'tr_local_' + Math.random().toString(36).substring(7);

    // 1. Enregistrer la transaction
    await supabase
      .from('achats_jetons')
      .insert({
        garage_id: garageId,
        forfait_id: dbForfaitId,
        quantite: parseInt(quantite),
        montant: parseFloat(prix),
        statut: 'paye',
        reference_transaction: fakeTxId,
        paye_at: new Date().toISOString()
      });

    // 2. Mettre à jour le stock de jetons
    const { data: currentStock } = await supabase
      .from('stock_jetons')
      .select('*')
      .eq('garage_id', garageId)
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
        .eq('garage_id', garageId);
    } else {
      await supabase
        .from('stock_jetons')
        .insert({
          garage_id: garageId,
          simple: type === 'simple' ? qtyToAdd : 0,
          prestige: type === 'prestige' ? qtyToAdd : 0
        });
    }

    return NextResponse.json({ success: true, message: 'Simulated locally' });

  } catch (err) {
    console.error('Erreur simulation webhook:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
