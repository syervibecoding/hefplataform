# Diagnóstico do Suporte hoje

O portal público (`/suporte/p/:slug`) já funciona ponta a ponta: cliente abre chamado, troca mensagens, recebe resposta da equipe e avalia (CSAT) quando resolvido. Internamente o admin gerencia tudo na aba **Chamados** com métricas, filtros, status, prioridade e badges de não lidos.

## O que o cliente **NÃO** consegue fazer hoje
1. **Anexar arquivo** (print do erro, PDF, log, vídeo curto) — nem ao abrir o chamado, nem nas respostas. Esse é o ponto que você levantou.
2. **Indicar a qual plataforma** o problema se refere (Meta, Google, etc.) — o campo `product_id` existe mas não é exposto.
3. **Marcar prioridade/urgência** — fica fixo em "normal".
4. **Receber notificação** quando a equipe responde (sem e-mail nem indicador visual no portal).
5. **Reabrir** um chamado fechado se o problema voltar.

## Outras lacunas para ficar "100%"
- Sem busca/filtro nos chamados do cliente (quando tiver volume fica ruim).
- Sem rate limit/captcha no portal público — qualquer um com o link pode criar tickets em massa.
- E-mail/WhatsApp do solicitante não é validado nem usado para retorno.
- Não há autosave/loading state visível ao mudar status pelo lado admin.
- Sem indicação visual no portal de "equipe respondeu" (badge de não lido).

---

# Plano de implementação

## 1. Anexos em chamados e mensagens (prioridade alta)

**Backend**
- Criar bucket privado `support-attachments` no Lovable Cloud.
- Nova tabela `support_attachments`:
  - `ticket_id` (obrigatório), `message_id` (opcional — null = anexo do ticket inicial)
  - `file_path`, `file_name`, `mime_type`, `size_bytes`
  - `uploaded_by_type` ('cliente' | 'equipe'), `uploaded_by_name`
  - timestamps + RLS (equipe interna lê/escreve; portal usa edge functions com service role)
- Novas edge functions públicas (slug-based, sem auth):
  - `portal-upload-attachment`: recebe arquivo base64 + slug + ticket_id (+ message_id opcional), valida slug/ticket, sobe ao bucket, registra na tabela, retorna registro.
  - `portal-get-attachment`: gera signed URL (5 min) para o cliente baixar anexos do seu próprio ticket.
- Validações:
  - Tamanho máx **15 MB** por arquivo, até **5 arquivos** por mensagem.
  - Mime types permitidos: imagens (png, jpg, webp, gif), pdf, vídeo curto (mp4, webm, mov), zip, csv, xlsx, txt, log.
  - Bloquear executáveis (.exe, .sh, .bat, etc.).

**Frontend — Portal público (`PublicSupportPortal.tsx`)**
- No `NewTicketDialog`: dropzone "Anexar arquivos (opcional)" com preview de imagens e lista de outros arquivos, remover antes de enviar.
- Após criar o ticket, sobe os anexos vinculados ao ticket inicial.
- No `TicketThreadDialog`: mesmo dropzone junto da resposta + ao renderizar cada mensagem/ticket, mostrar miniaturas (imagens inline) e cards de download (outros formatos) usando signed URL.

**Frontend — Painel interno**
- `SupportTicketDialog` mostra os mesmos anexos (download/preview) e permite a equipe anexar ao responder.
- `CompanySupportSection` indica quantos anexos cada ticket tem (ícone de clipe + contador).

## 2. Cliente escolhe a plataforma (`product_id`)
- No `NewTicketDialog`, adicionar select "Plataforma relacionada" listando os produtos vinculados àquele cliente (ler de `clients` + `lovable_product_clients`).
- Enviar `product_id` no payload do `portal-create-ticket` (a função já aceita).

## 3. Cliente escolhe prioridade
- Select com 3 opções amigáveis no portal: **Normal** / **Alta — está travando meu trabalho** / **Urgente — sistema fora do ar**, mapeando para `prioridade` (`normal`/`alta`/`urgente`). Sem expor "baixa" pro cliente.

## 4. Reabrir chamado
- Botão "Reabrir chamado" em tickets `fechado`/`resolvido` no portal, abrindo dialog para descrever o motivo.
- Nova edge function `portal-reopen-ticket` que muda status para `aberto`, registra mensagem do cliente e zera `csat_rating` se houver (mantém histórico).

## 5. Indicador de "equipe respondeu" no portal
- O hook `useUnreadSupport` já existe pro admin. Replicar lógica leve no portal usando `localStorage` (`hef:portal-read:<ticket_id>` = última leitura). Badge vermelho na lista de chamados quando há mensagem da equipe mais nova que a última leitura.

## 6. Proteção do portal público
- Rate limit simples nas edge functions de criação/upload: máx **10 requests/min** por slug, usando uma tabela `portal_rate_limits` (slug, action, count, window_start). Resposta 429 + toast amigável no portal.
- Validar e-mail do solicitante quando informado (`zod.email()`).

## 7. Polimentos finais
- Toast "Equipe avisada — respondemos em até X horas" após criar chamado (texto configurável depois).
- Exibir no header do portal o e-mail de contato da empresa de suporte (campo já existe ou usar fallback).
- Esvaziar formulários e refetch consistente ao fechar dialogs.

---

# Detalhes técnicos

**Migration nova (resumo)**
```sql
create table public.support_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  message_id uuid references public.support_ticket_messages(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null,
  uploaded_by_type text not null check (uploaded_by_type in ('cliente','equipe')),
  uploaded_by_name text,
  created_at timestamptz default now()
);
-- GRANTs + RLS (equipe interna via is_internal_team(), service_role full)
create table public.portal_rate_limits (
  slug text not null,
  action text not null,
  count int not null default 0,
  window_start timestamptz not null default now(),
  primary key (slug, action)
);
-- somente service_role
```

**Edge functions novas**: `portal-upload-attachment`, `portal-get-attachment`, `portal-reopen-ticket`.
**Edge functions ajustadas**: `portal-create-ticket` (aceitar `prioridade` validada), `portal-get-tickets` (retornar anexos junto), `portal-add-message` (retornar anexos quando criar).

**Storage**: bucket privado `support-attachments`, path `tickets/{ticket_id}/{uuid}-{filename}`.

**Frontend novo/alterado**
- `src/pages/PublicSupportPortal.tsx` — dropzone, preview, prioridade, plataforma, reabrir, badge não lido.
- `src/components/SupportTicketDialog.tsx` — render + upload de anexos pela equipe.
- `src/components/CompanySupportSection.tsx` — ícone de clipe com contador.
- `src/hooks/useSupport.ts` — tipos `SupportAttachment`, hooks `useTicketAttachments`, mutations.
- Novo componente reutilizável `SupportAttachmentList` (preview imagem / card download).

---

# Fora de escopo (sugiro para outra rodada)
- Notificação por e-mail/WhatsApp para cliente e equipe (depende de provider — pode usar Resend ou similar).
- SLA por prioridade com alertas automáticos.
- Base de conhecimento / FAQ no portal antes de abrir chamado.
- Autenticação opcional do portal (hoje é só slug — qualquer um com o link entra).