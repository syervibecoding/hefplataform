import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-5-mini';

const SYSTEM_PROMPT = `Você é um assistente financeiro sênior da HefSys, especializado em análise de fluxo de caixa, projeções e tomada de decisão para um negócio de software/consultoria brasileiro.

REGRAS:
- Responda SEMPRE em português do Brasil.
- Use os dados financeiros e operacionais fornecidos no contexto como única fonte verdadeira. Não invente valores.
- Valores em R$ (BRL), no formato brasileiro (R$ 12.345,67).
- Quando fizer projeção, seja explícito sobre as premissas (ex: "mantendo o ritmo atual", "sem novos clientes").
- Quando faltar dado, diga claramente o que falta em vez de chutar.
- Estruture respostas longas com markdown: títulos curtos, listas e tabelas quando ajudar a leitura.
- Em análises críticas, aponte risco/oportunidade no final em uma seção "Pontos de atenção".
- Seja direto e acionável: prefira "faça X" a "talvez você possa pensar em X".`;

function fmtBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n) || 0);
}

function buildContext(payload: any): string {
  const today = new Date().toISOString().slice(0, 10);
  const lines: string[] = [];
  lines.push(`Data atual: ${today}`);

  const cf = payload?.cashFlow;
  if (cf) {
    lines.push('');
    lines.push(`# Fluxo de caixa ${cf.year}`);
    lines.push(`Saldo inicial em ${cf.year}: ${fmtBRL(cf.saldoInicial)}`);
    lines.push('');
    lines.push('| Mês | Receitas | Despesas | Investimentos | Aportes | Retiradas | Resultado | Saldo final |');
    lines.push('|---|---|---|---|---|---|---|---|');
    const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    for (const m of cf.months || []) {
      lines.push(`| ${MESES[m.month]} | ${fmtBRL(m.receitas)} | ${fmtBRL(m.despesas)} | ${fmtBRL(m.investimentos)} | ${fmtBRL(m.aportes)} | ${fmtBRL(m.retiradas)} | ${fmtBRL(m.resultado)} | ${fmtBRL(m.saldoFinal)} |`);
    }
    lines.push('');
    lines.push(`Totais ${cf.year}: receitas ${fmtBRL(cf.totalReceitas)}, despesas ${fmtBRL(cf.totalDespesas)}, investimentos ${fmtBRL(cf.totalInvestimentos)}, aportes ${fmtBRL(cf.totalAportes)}, retiradas ${fmtBRL(cf.totalRetiradas)}, resultado ${fmtBRL(cf.totalResultado)}.`);

    // Top categorias de despesa no ano
    const catTotals: Record<string, number> = {};
    for (const m of cf.months || []) {
      for (const [cat, v] of Object.entries(m.byCategoryDespesa || {})) {
        catTotals[cat] = (catTotals[cat] || 0) + Number(v || 0);
      }
    }
    const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    if (sorted.length) {
      lines.push('');
      lines.push('Despesas por categoria (ano):');
      for (const [cat, v] of sorted) lines.push(`- ${cat}: ${fmtBRL(v)}`);
    }
  }

  const mrr = payload?.mrr;
  if (mrr) {
    lines.push('');
    lines.push('# Clientes ativos e MRR (visão atual)');
    lines.push(`Total de clientes ativos: ${mrr.totalClientes}`);
    lines.push(`MRR estimado: ${fmtBRL(mrr.mrrTotal)}`);
    if (mrr.byProduct?.length) {
      lines.push('');
      lines.push('| Produto | Clientes | Receita mensal estimada | Ticket médio |');
      lines.push('|---|---|---|---|');
      for (const p of mrr.byProduct) {
        const ticket = p.clientes > 0 ? p.receitaMensal / p.clientes : 0;
        lines.push(`| ${p.nome} | ${p.clientes} | ${fmtBRL(p.receitaMensal)} | ${fmtBRL(ticket)} |`);
      }
    }
  }

  return lines.join('\n');
}

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
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhuma mensagem enviada.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contextBlock = buildContext(body?.context || {});

    const payload = {
      model: MODEL,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: `Contexto financeiro e operacional atual:\n\n${contextBlock}` },
        ...messages.map((m: any) => ({ role: m.role, content: String(m.content || '') })),
      ],
    };

    const aiRes = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!aiRes.ok || !aiRes.body) {
      const errText = await aiRes.text();
      const status = aiRes.status === 429 ? 429 : aiRes.status === 401 ? 401 : 502;
      const msg = status === 429 ? 'Limite de requisições da OpenAI atingido. Tente em alguns instantes.'
        : status === 401 ? 'OPENAI_API_KEY inválida ou expirada.'
        : `Falha na OpenAI: ${errText.slice(0, 500)}`;
      return new Response(JSON.stringify({ error: msg }), {
        status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Stream através como SSE (text/event-stream) com chunks `data: { delta }`
    const stream = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        const dec = new TextDecoder();
        const reader = aiRes.body!.getReader();
        let buffer = '';
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += dec.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop() || '';
            for (const part of parts) {
              const line = part.trim();
              if (!line.startsWith('data:')) continue;
              const data = line.slice(5).trim();
              if (data === '[DONE]') {
                controller.enqueue(enc.encode(`data: [DONE]\n\n`));
                continue;
              }
              try {
                const j = JSON.parse(data);
                const delta = j?.choices?.[0]?.delta?.content;
                if (typeof delta === 'string' && delta.length > 0) {
                  controller.enqueue(enc.encode(`data: ${JSON.stringify({ delta })}\n\n`));
                }
              } catch { /* ignore */ }
            }
          }
          controller.enqueue(enc.encode(`data: [DONE]\n\n`));
        } catch (e: any) {
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: e?.message || 'stream error' })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Erro desconhecido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});