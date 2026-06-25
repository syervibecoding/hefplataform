import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-5-mini';

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
  additionalProperties: false,
  properties: {
    kind: { type: 'string', enum: ['extrato', 'fatura'] },
    origem: { type: 'string' },
    periodo_inicio: { type: 'string' },
    periodo_fim: { type: 'string' },
    transacoes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
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
  required: ['kind', 'origem', 'periodo_inicio', 'periodo_fim', 'transacoes'],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY não configurada.' }), {
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

    const aiRes = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'transacoes_financeiras',
            strict: true,
            schema: SCHEMA,
          },
        },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições da OpenAI atingido. Tente em alguns instantes.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiRes.status === 401) {
        return new Response(JSON.stringify({ error: 'OPENAI_API_KEY inválida ou expirada.' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: `Falha na OpenAI: ${errText}` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ error: 'IA não retornou dados estruturados.' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    let parsed: any;
    try { parsed = typeof content === 'string' ? JSON.parse(content) : content; }
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