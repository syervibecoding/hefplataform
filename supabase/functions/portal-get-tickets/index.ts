import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const url = new URL(req.url)
    const slug = url.searchParams.get('slug')
    if (!slug) return j({ error: 'slug required' }, 400)
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: client, error: cErr } = await sb.from('clients').select('id, nome, support_enabled').eq('support_slug', slug).maybeSingle()
    if (cErr) throw cErr
    if (!client || !client.support_enabled) return j({ error: 'not_found' }, 404)
    const { data: prodLinks } = await sb
      .from('lovable_product_clients')
      .select('product_id, lovable_products(id, nome)')
      .eq('client_id', client.id)
    const products = (prodLinks ?? [])
      .map((p: any) => p.lovable_products)
      .filter(Boolean)
    const { data: tickets, error: tErr } = await sb.from('support_tickets').select('*').eq('client_id', client.id).order('created_at', { ascending: false })
    if (tErr) throw tErr
    const ids = (tickets ?? []).map((t: any) => t.id)
    let messages: any[] = []
    let attachments: any[] = []
    if (ids.length) {
      const { data: msgs } = await sb.from('support_ticket_messages').select('*').in('ticket_id', ids).order('created_at')
      messages = msgs ?? []
      const { data: atts } = await sb.from('support_attachments').select('*').in('ticket_id', ids).order('created_at')
      attachments = atts ?? []
    }
    return j({ client: { id: client.id, nome: client.nome }, products, tickets: tickets ?? [], messages, attachments })
  } catch (e) {
    return j({ error: String(e) }, 500)
  }
})

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}