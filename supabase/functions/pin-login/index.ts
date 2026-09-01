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
    const body = await req.json().catch(() => ({}));
    const { username, pin } = body;

    if (!username || !pin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Identifiant et code PIN requis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

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

    // Rechercher le profil par nom complet (identifiant) et code PIN
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, pin_code')
      .ilike('full_name', username.trim())
      .eq('pin_code', pin.trim())
      .maybeSingle();

    if (profileError) {
      console.error('Erreur recherche profil:', profileError);
      throw profileError;
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Identifiant ou code PIN incorrect' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Récupérer l'email de l'utilisateur
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (userError || !userData.user?.email) {
      console.error('Erreur récupération utilisateur:', userError);
      throw userError || new Error('Utilisateur non trouvé');
    }

    const email = userData.user.email;

    // Générer un OTP par magic link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError) {
      console.error('Erreur génération lien:', linkError);
      throw linkError;
    }

    const otp = linkData.properties?.email_otp;
    if (!otp) {
      throw new Error('OTP non généré');
    }

    return new Response(
      JSON.stringify({ success: true, email, otp }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    console.error('Erreur pin-login:', err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
