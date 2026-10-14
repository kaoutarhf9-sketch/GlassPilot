import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Configuration Supabase manquante" },
        { status: 500 }
      );
    }

    const payload = await req.json();
    const {
      garageId,
      ownerId,
      nom_garage,
      responsable,
      email,
      telephone,
      adresse,
      code_postal,
      ville,
      siret,
      iban,
      bic,
      password,
    } = payload;

    if (!garageId) {
      return NextResponse.json(
        { error: "L'identifiant du garage (garageId) est requis" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 1. Mettre à jour la table garages
    const updateGarageData = {};
    if (nom_garage !== undefined) updateGarageData.nom_garage = nom_garage.trim();
    if (responsable !== undefined) updateGarageData.responsable = responsable.trim();
    if (email !== undefined) updateGarageData.email_contact = email.trim().toLowerCase();
    if (telephone !== undefined) updateGarageData.telephone = telephone.trim();
    if (adresse !== undefined) updateGarageData.adresse = adresse.trim();
    if (code_postal !== undefined) updateGarageData.code_postal = code_postal ? code_postal.trim() : null;
    if (ville !== undefined) updateGarageData.ville = ville ? ville.trim() : null;
    if (siret !== undefined) updateGarageData.siret = siret ? siret.replace(/\s+/g, '') : null;

    const { data: updatedGarage, error: garageError } = await supabaseAdmin
      .from("garages")
      .update(updateGarageData)
      .eq("id", garageId)
      .select()
      .maybeSingle();

    if (garageError) {
      console.error("Erreur mise à jour table garages:", garageError);
      return NextResponse.json(
        { error: "Impossible de mettre à jour le garage : " + garageError.message },
        { status: 500 }
      );
    }

    // Récupérer l'owner_id si non fourni
    const targetOwnerId = ownerId || updatedGarage?.owner_id;

    // 2. Mettre à jour l'utilisateur auth.users si owner_id existe
    if (targetOwnerId) {
      try {
        const { data: userRecord } = await supabaseAdmin.auth.admin.getUserById(targetOwnerId);
        const existingMeta = userRecord?.user?.user_metadata || {};

        const updatedMeta = {
          ...existingMeta,
        };

        if (nom_garage !== undefined) updatedMeta.nom_garage = nom_garage.trim();
        if (responsable !== undefined) updatedMeta.responsable = responsable.trim();
        if (telephone !== undefined) updatedMeta.telephone = telephone.trim();
        if (adresse !== undefined) updatedMeta.adresse = adresse.trim();
        if (code_postal !== undefined) updatedMeta.code_postal = code_postal?.trim() || null;
        if (ville !== undefined) updatedMeta.ville = ville?.trim() || null;
        if (siret !== undefined) {
          const cleanSiret = siret ? siret.replace(/\s+/g, '') : null;
          updatedMeta.siret = cleanSiret;
          updatedMeta.onboarding_siret = cleanSiret;
        }
        if (iban !== undefined) {
          const cleanIban = iban ? iban.replace(/\s+/g, '').toUpperCase() : null;
          updatedMeta.iban = cleanIban;
          updatedMeta.onboarding_rib_iban = cleanIban;
        }
        if (bic !== undefined) {
          const cleanBic = bic ? bic.trim().toUpperCase() : null;
          updatedMeta.bic = cleanBic;
          updatedMeta.onboarding_rib_bic = cleanBic;
        }

        const authUserUpdate = {
          user_metadata: updatedMeta,
        };

        if (email && email.trim().toLowerCase() !== userRecord?.user?.email) {
          authUserUpdate.email = email.trim().toLowerCase();
          authUserUpdate.email_confirm = true;
        }

        if (password && password.trim().length >= 6) {
          authUserUpdate.password = password.trim();
        }

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          targetOwnerId,
          authUserUpdate
        );

        if (authError) {
          console.warn("Avertissement mise à jour auth utilisateur:", authError.message);
        }
      } catch (authErr) {
        console.warn("Erreur mise à jour auth.users (non bloquante):", authErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Garagiste mis à jour avec succès",
      garage: updatedGarage,
    });
  } catch (error) {
    console.error("Erreur API update-garagiste:", error);
    return NextResponse.json(
      { error: "Erreur serveur : " + (error.message || "inconnue") },
      { status: 500 }
    );
  }
}
