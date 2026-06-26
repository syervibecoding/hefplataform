import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const url = new URL(req.url)
    const slug = url.searchParams.get('slug')
    const id = url.searchParams.get('id')
    if (!slug || !id) return j({ error: 'missing fields' }, 400)
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: client } = await sb.from('clients').select('id, support_enabled').eq('support_slug', slug).maybeSingle()
    if (!client || !client.support_enabled) return j({ error: 'not_found' }, 404)
    const { data: att } = await sb.from('support_attachments').select('id, file_path, ticket_id, file_name, mime_type').eq('id', id).maybeSingle()
    if (!att) return j({ error: 'not_found' }, 404)
    const { data: ticket } = await sb.from('support_tickets').select('client_id').eq('id', att.ticket_id).maybeSingle()
    if (!ticket || ticket.client_id !== client.id) return j({ error: 'not_found' }, 404)
    const { data: signed, error } = await sb.storage.from('support-attachments').createSignedUrl(att.file_path, 300)
    if (error) throw error
    return j({ url: signed.signedUrl, file_name: att.file_name, mime_type: att.mime_type })
  } catch (e) {
    return j({ error: String(e) }, 500)
  }
})

function j(b: unknown, s = 200) { return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }