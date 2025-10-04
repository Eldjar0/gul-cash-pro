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

    const { action, userId, email, password, fullName } = await req.json();
    console.log(`Action: ${action}`, { userId, email });

    switch (action) {
      case 'list': {
        const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;
        console.log(`✅ ${users.users.length} utilisateurs récupérés`);
        return new Response(
          JSON.stringify({ success: true, users: users.users }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create': {
        if (!email || !password) {
          throw new Error('Email et mot de passe requis');
        }
        
        console.log(`👤 Création du compte: ${email}`);
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName || 'Utilisateur'
          }
        });

        if (createError) throw createError;

        // Créer le profil
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: newUser.user.id,
            full_name: fullName || 'Utilisateur',
            role: 'cashier'
          });

        if (profileError) {
          console.error('Erreur création profil:', profileError);
        }

        console.log(`✅ Compte créé: ${email}`);
        return new Response(
          JSON.stringify({ success: true, user: newUser.user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        if (!userId) {
          throw new Error('userId requis');
        }

        console.log(`✏️ Mise à jour du compte: ${userId}`);
        const updateData: any = {};
        
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        if (fullName) updateData.user_metadata = { full_name: fullName };

        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          updateData
        );

        if (updateError) throw updateError;

        // Mettre à jour le profil
        if (fullName) {
          await supabaseAdmin
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', userId);
        }

        console.log(`✅ Compte mis à jour: ${userId}`);
        return new Response(
          JSON.stringify({ success: true, user: updatedUser.user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!userId) {
          throw new Error('userId requis');
        }

        console.log(`🗑️ Suppression du compte: ${userId}`);
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
        if (deleteError) throw deleteError;

        console.log(`✅ Compte supprimé: ${userId}`);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Action inconnue: ${action}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
