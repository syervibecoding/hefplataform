import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const CATEGORIAS = ['bug', 'ajuste', 'duvida', 'feature', 'outro']
const PRIORIDADES = ['baixa', 'normal', 'alta', 'urgente']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = await req.json()
    const { slug, titulo, descricao, categoria, prioridade, submitted_by_name, submitted_by_email, product_id } = body ?? {}
    if (!slug || typeof titulo !== 'string' || typeof descricao !== 'string') return j({ error: 'missing fields' }, 400)
    if (titulo.length < 3 || titulo.length > 200) return j({ error: 'titulo invalido' }, 400)
    if (descricao.length < 3 || descricao.length > 5000) return j({ error: 'descricao invalida' }, 400)
    const cat = CATEGORIAS.includes(categoria) ? categoria : 'duvida'
    const pri = PRIORIDADES.includes(prioridade) ? prioridade : 'normal'
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: client } = await sb.from('clients').select('id, support_enabled').eq('support_slug', slug).maybeSingle()
    if (!client || !client.support_enabled) return j({ error: 'not_found' }, 404)
    const { data, error } = await sb.from('support_tickets').insert({
      client_id: client.id,
      product_id: product_id || null,
      titulo: titulo.trim().slice(0, 200),
      descricao: descricao.trim().slice(0, 5000),
      categoria: cat,
      prioridade: pri,
      submitted_by_name: submitted_by_name ? String(submitted_by_name).slice(0, 120) : null,
      submitted_by_email: submitted_by_email ? String(submitted_by_email).slice(0, 200) : null,
      status: 'aberto',
    }).select().single()
    if (error) throw error
    return j({ ticket: data })
  } catch (e) {
    return j({ error: String(e) }, 500)
  }
})

function j(b: unknown, s = 200) { return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }