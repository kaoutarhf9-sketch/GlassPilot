import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dossierId = searchParams.get('dossierId');

    if (!dossierId) {
      return NextResponse.json({ error: 'dossierId manquant' }, { status: 400 });
    }

    const { data: files, error } = await supabase.storage
      .from('documents')
      .list(`dossiers/${dossierId}`);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // We don't get publicUrls here because publicUrl doesn't require RLS to get, 
    // it's just string concatenation. The client can do it.
    // We just return the list of files.
    return NextResponse.json({ files });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
