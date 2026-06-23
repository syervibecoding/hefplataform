import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

const SYSTEM_PROMPT = `Você extrai transações financeiras de extratos bancários brasileiros e faturas de cartão de crédito.

REGRAS:
- Devolva SOMENTE JSON válido seguindo o schema (sem markdown, sem comentários).
- "tipo" deve ser "receita" para entradas e "despesa" para saídas.
- Datas em formato ISO YYYY-MM-DD. Se faltar ano, assuma o ano do período do documento.
- "valor" sempre positivo (sem sinal).
- "categoria_sugerida" deve ser UMA das: pessoal, infraestrutura, software, marketing, educacao, administrativo, impostos, outros. Use "outros" se incerto. Para receitas, use "outros".
- Para FATURA DE CARTÃO: cada compra vira uma linha de despesa com a data da compra. IGNORE linhas como "Pagamento recebido", "Saldo anterior", "Saldo a pagar", "Total da fatura", crédito de estorno informativo — qualquer coisa que não seja uma compra real.
- Para EXTRATO BANCÁRIO: extraia cada movimentação (PIX, TED, boleto, débito, tarifa). IGNORE "Saldo do dia", "Saldo anterior", linhas de saldo.
- "origem" = banco/bandeira detectado no cabeçalho (ex: "Inter", "Nubank Mastercard", "Itaú"). Se não souber, deixe vazio.
- "kind" = "fatura" se for fatura de cartão, "extrato" se for extrato bancário.
- "periodo_inicio"/"periodo_fim" = período coberto pelo documento (ISO).
- Devolva TODAS as transações que encontrar. Não resuma, não agrupe.`;

const SCHEMA = {
  type: 'object',
  properties: {
    kind: { type: 'string', enum: ['extrato', 'fatura'] },
    origem: { type: 'string' },
    periodo_inicio: { type: 'string' },
    periodo_fim: { type: 'string' },
    transacoes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          data: { type: 'string' },
          descricao: { type: 'string' },
          valor: { type: 'number' },
          tipo: { type: 'string', enum: ['receita', 'despesa'] },
          categoria_sugerida: { type: 'string' },
        },
        required: ['data', 'descricao', 'valor', 'tipo', 'categoria_sugerida'],
      },
    },
  },
  required: ['kind', 'transacoes'],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY não configurada.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null);
    const text = typeof body?.text === 'string' ? body.text : '';
    const filename = typeof body?.filename === 'string' ? body.filename : 'documento.pdf';
    const hint = body?.hint as 'extrato' | 'fatura' | undefined;

    if (!text || text.trim().length < 30) {
      return new Response(JSON.stringify({ error: 'Texto do PDF vazio ou muito curto.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userPrompt = `Arquivo: ${filename}${hint ? ` (tipo informado: ${hint})` : ''}\n\nConteúdo extraído do PDF:\n\n${text.slice(0, 120000)}`;

    const aiRes = await fetch(LOVABLE_AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': apiKey,
        'X-Lovable-AIG-SDK': 'custom-fetch',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'registrar_transacoes',
            description: 'Registra as transações extraídas do documento financeiro',
            parameters: SCHEMA,
          },
        }],
        tool_choice: { type: 'function', function: { name: 'registrar_transacoes' } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições da IA atingido. Tente em alguns instantes.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos da IA esgotados. Recarregue na área de billing.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: `Falha na IA: ${errText}` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    const argsRaw = toolCall?.function?.arguments;
    if (!argsRaw) {
      return new Response(JSON.stringify({ error: 'IA não retornou dados estruturados.' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    let parsed: any;
    try { parsed = typeof argsRaw === 'string' ? JSON.parse(argsRaw) : argsRaw; }
    catch { return new Response(JSON.stringify({ error: 'JSON inválido da IA.' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Erro desconhecido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});