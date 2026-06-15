import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { slug, ticket_id, body, author_name } = await req.json()
    if (!slug || !ticket_id || typeof body !== 'string') return j({ error: 'missing fields' }, 400)
    if (body.trim().length < 1 || body.length > 5000) return j({ error: 'body invalido' }, 400)
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: client } = await sb.from('clients').select('id, support_enabled').eq('support_slug', slug).maybeSingle()
    if (!client || !client.support_enabled) return j({ error: 'not_found' }, 404)
    const { data: ticket } = await sb.from('support_tickets').select('id, client_id, status').eq('id', ticket_id).maybeSingle()
    if (!ticket || ticket.client_id !== client.id) return j({ error: 'not_found' }, 404)
    if (ticket.status === 'fechado') return j({ error: 'ticket fechado' }, 400)
    const { data, error } = await sb.from('support_ticket_messages').insert({
      ticket_id,
      author_type: 'cliente',
      author_name: author_name ? String(author_name).slice(0, 120) : null,
      body: body.trim().slice(0, 5000),
    }).select().single()
    if (error) throw error
    if (ticket.status === 'aguardando_cliente') {
      await sb.from('support_tickets').update({ status: 'em_andamento' }).eq('id', ticket_id)
    }
    return j({ message: data })
  } catch (e) {
    return j({ error: String(e) }, 500)
  }
})

function j(b: unknown, s = 200) { return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }