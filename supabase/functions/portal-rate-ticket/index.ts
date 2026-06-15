import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { slug, ticket_id, rating, comment } = await req.json()
    if (!slug || !ticket_id) return j({ error: 'missing fields' }, 400)
    const r = Number(rating)
    if (!Number.isFinite(r) || r < 1 || r > 5) return j({ error: 'rating invalido' }, 400)
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: client } = await sb.from('clients').select('id, support_enabled').eq('support_slug', slug).maybeSingle()
    if (!client || !client.support_enabled) return j({ error: 'not_found' }, 404)
    const { data: ticket } = await sb.from('support_tickets').select('id, client_id, status').eq('id', ticket_id).maybeSingle()
    if (!ticket || ticket.client_id !== client.id) return j({ error: 'not_found' }, 404)
    if (ticket.status !== 'resolvido') return j({ error: 'ticket nao resolvido' }, 400)
    const { data, error } = await sb.from('support_tickets').update({
      csat_rating: Math.round(r),
      csat_comment: comment ? String(comment).slice(0, 2000) : null,
      status: 'fechado',
      closed_at: new Date().toISOString(),
    }).eq('id', ticket_id).select().single()
    if (error) throw error
    return j({ ticket: data })
  } catch (e) {
    return j({ error: String(e) }, 500)
  }
})

function j(b: unknown, s = 200) { return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }