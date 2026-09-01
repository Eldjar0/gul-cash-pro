import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Supprimer l'ancien compte jlprod s'il existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users.find(u => u.email === 'jlprod@system.local');
    if (existing) {
      await supabaseAdmin.auth.admin.deleteUser(existing.id);
    }

    // Créer le compte jlprod
    const password = '123456';
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'jlprod@system.local',
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'JLProd'
      }
    });

    if (createError) {
      console.error('Erreur lors de la création du compte jlprod:', createError);
      throw createError;
    }

    if (!userData.user) {
      throw new Error('Aucun utilisateur créé');
    }

    // Créer le profil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userData.user.id,
        full_name: 'JLProd',
        pin_code: '1234',
        is_active: true
      });

    if (profileError) {
      console.error('Erreur lors de la création du profil:', profileError);
      throw profileError;
    }

    // Attribuer le rôle caissier
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userData.user.id,
        role: 'cashier'
      }, { onConflict: 'user_id, role', ignoreDuplicates: true });

    if (roleError) {
      console.error('Erreur lors de l\'assignation du rôle:', roleError);
      throw roleError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Compte jlprod créé avec succès',
        email: 'jlprod@system.local',
        password
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    console.error('Erreur setup-jlprod:', err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
