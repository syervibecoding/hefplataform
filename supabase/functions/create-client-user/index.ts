import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Não autenticado" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userInfo, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userInfo.user) {
      return json({ error: "Sessão inválida" }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Check admin role
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userInfo.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return json({ error: "Apenas admins podem criar acessos" }, 403);
    }

    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const display_name = String(body.display_name ?? "").trim();
    const platform_company_id = String(body.platform_company_id ?? "");

    if (!email || !email.includes("@") || password.length < 6 || !platform_company_id) {
      return json({ error: "Dados inválidos. Email válido, senha (6+ caracteres) e platform_company_id são obrigatórios." }, 400);
    }

    // Create auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: display_name || email.split("@")[0] },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? "Falha ao criar usuário" }, 400);
    }

    const newUserId = created.user.id;

    // Assign role cliente
    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: newUserId, role: "cliente" });
    if (roleErr) {
      await admin.auth.admin.deleteUser(newUserId);
      return json({ error: `Erro ao atribuir papel: ${roleErr.message}` }, 500);
    }

    // Update profile with platform_company_id (trigger handle_new_user already inserted the profile row)
    const { error: profErr } = await admin
      .from("profiles")
      .update({ platform_company_id, display_name: display_name || email.split("@")[0] })
      .eq("id", newUserId);
    if (profErr) {
      return json({ error: `Erro ao vincular à empresa: ${profErr.message}` }, 500);
    }

    return json({ success: true, user_id: newUserId });
  } catch (err) {
    return json({ error: (err as Error).message ?? "Erro inesperado" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}