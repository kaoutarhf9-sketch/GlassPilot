import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Récupère l'utilisateur connecté en garantissant un token JWT valide et rafraîchi.
 * Évite la perte des dossiers lorsque l'utilisateur reste connecté longtemps.
 */
export async function getValidUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return session.user;
    }

    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
    if (refreshedSession?.user) {
      return refreshedSession.user;
    }

    const { data: { user } } = await supabase.auth.getUser();
    return user || null;
  } catch (err) {
    console.error("Erreur récupération session utilisateur:", err);
    return null;
  }
}