import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const MAX_BYTES = 15 * 1024 * 1024 // 15 MB
const ALLOWED_MIME = new Set([
  'image/png','image/jpeg','image/jpg','image/webp','image/gif','image/heic',
  'application/pdf',
  'video/mp4','video/webm','video/quicktime',
  'application/zip','application/x-zip-compressed',
  'text/csv','text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream',
])
const FORBIDDEN_EXT = /\.(exe|sh|bat|cmd|com|msi|dll|js|jar|app|scr|ps1)$/i

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'file'
}

async function checkRate(sb: any, slug: string, action: string, max: number) {
  const now = new Date()
  const { data } = await sb.from('portal_rate_limits').select('*').eq('slug', slug).eq('action', action).maybeSingle()
  const windowMs = 60_000
  if (!data || now.getTime() - new Date(data.window_start).getTime() > windowMs) {
    await sb.from('portal_rate_limits').upsert({ slug, action, count: 1, window_start: now.toISOString() })
    return true
  }
  if (data.count >= max) return false
  await sb.from('portal_rate_limits').update({ count: data.count + 1 }).eq('slug', slug).eq('action', action)
  return true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { slug, ticket_id, message_id, file_name, mime_type, file_base64, uploaded_by_name } = await req.json()
    if (!slug || !ticket_id || !file_name || !mime_type || !file_base64) return j({ error: 'missing fields' }, 400)
    if (FORBIDDEN_EXT.test(file_name)) return j({ error: 'tipo de arquivo não permitido' }, 400)
    if (!ALLOWED_MIME.has(mime_type)) return j({ error: 'mime nao permitido' }, 400)

    const bytes = Uint8Array.from(atob(file_base64), (c) => c.charCodeAt(0))
    if (bytes.byteLength > MAX_BYTES) return j({ error: 'arquivo maior que 15MB' }, 400)

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const okRate = await checkRate(sb, slug, 'upload', 30)
    if (!okRate) return j({ error: 'rate_limit' }, 429)

    const { data: client } = await sb.from('clients').select('id, support_enabled').eq('support_slug', slug).maybeSingle()
    if (!client || !client.support_enabled) return j({ error: 'not_found' }, 404)

    const { data: ticket } = await sb.from('support_tickets').select('id, client_id, status').eq('id', ticket_id).maybeSingle()
    if (!ticket || ticket.client_id !== client.id) return j({ error: 'not_found' }, 404)
    if (ticket.status === 'fechado') return j({ error: 'ticket fechado' }, 400)

    if (message_id) {
      const { data: msg } = await sb.from('support_ticket_messages').select('id, ticket_id').eq('id', message_id).maybeSingle()
      if (!msg || msg.ticket_id !== ticket_id) return j({ error: 'mensagem invalida' }, 400)
    }

    const cleanName = safeName(file_name)
    const path = `tickets/${ticket_id}/${crypto.randomUUID()}-${cleanName}`
    const { error: upErr } = await sb.storage.from('support-attachments').upload(path, bytes, {
      contentType: mime_type,
      upsert: false,
    })
    if (upErr) throw upErr

    const { data, error } = await sb.from('support_attachments').insert({
      ticket_id,
      message_id: message_id ?? null,
      file_path: path,
      file_name: cleanName,
      mime_type,
      size_bytes: bytes.byteLength,
      uploaded_by_type: 'cliente',
      uploaded_by_name: uploaded_by_name ? String(uploaded_by_name).slice(0, 120) : null,
    }).select().single()
    if (error) throw error

    return j({ attachment: data })
  } catch (e) {
    return j({ error: String(e) }, 500)
  }
})

function j(b: unknown, s = 200) { return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }