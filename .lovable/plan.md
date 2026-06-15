# Plano: Suporte na Plataforma + Portal do Cliente

Objetivo: cada **empresa** (cliente) vira o ponto central. Dentro dela, ficam os **Produtos** vinculados e uma aba de **Suporte**. As empresas abrem chamados por um **link público exclusivo** (sem login). Vocês veem tudo internamente com métricas.

## 1. Estrutura do banco

Novas tabelas e campos:

- `clients` ganha 2 colunas: `support_slug` (token único pra URL pública) e `support_enabled` (liga/desliga o portal).
- `support_tickets`: empresa, produto (opcional), título, descrição, categoria (bug / ajuste / dúvida / nova feature / outro), prioridade, status (aberto, em andamento, aguardando cliente, resolvido, fechado), quem abriu (nome + email opcional), nota CSAT 1-5 + comentário, e timestamps de abertura, primeira resposta, resolução e fechamento.
- `support_ticket_messages`: thread de mensagens do ticket, com autor (cliente ou equipe).

## 2. Acesso do cliente (portal público)

Como não tem login da empresa, o acesso seguro é via **Edge Functions** que validam o `support_slug` e fazem as operações com privilégio de serviço. Isso evita expor tickets de outras empresas.

Functions:
- `portal-get-tickets` — lista tickets de uma empresa pelo slug
- `portal-create-ticket` — empresa abre chamado
- `portal-add-message` — empresa responde no thread
- `portal-rate-ticket` — empresa envia CSAT ao fechar

## 3. Telas (frontend)

### a) Página da Empresa — `/empresas/:id`
Substitui a navegação atual focada em produto. Abas:
- **Visão Geral** — dados básicos, saúde, contatos
- **Produtos** — lista dos produtos vinculados àquela empresa (vem de `lovable_product_clients`)
- **Suporte** — tickets daquela empresa + botão "copiar link do portal"

### b) Página Suporte (global) — `/suporte`
Nova entrada no sidebar com:
- Lista de todos os tickets, filtros por status / categoria / empresa / produto / período
- Cards de métricas no topo:
  - Tempo médio de **primeira resposta**
  - Tempo médio de **resolução**
  - Volume por **empresa** e por **produto** (top 5)
  - Distribuição por **categoria** (gráfico)
  - **CSAT médio** + nº de avaliações
- Detalhe do ticket abre dialog com thread, status e categoria editáveis

### c) Portal público — `/suporte/p/:slug`
Página sem login, com identidade visual mais clean:
- Cabeçalho com nome da empresa
- Botão "Abrir chamado" (form: título, categoria, descrição, nome de quem está abrindo)
- Lista dos chamados da empresa com status
- Detalhe do chamado: thread de mensagens, campo pra responder
- Quando o ticket é marcado como **resolvido** pela equipe, aparece pro cliente o pedido de **nota CSAT** (estrelas + comentário). Depois disso o ticket vai pra **fechado**.

## 4. Métricas — fórmulas

```text
Primeira resposta = first_response_at - opened_at
Resolução        = resolved_at      - opened_at
Volume           = count por empresa / produto / categoria
CSAT             = média(csat_rating) entre tickets fechados com nota
```

Cálculo no client (React Query) em cima dos tickets já carregados, sem view SQL nesta primeira versão.

## 5. Mudanças adjacentes

- **Sidebar**: adicionar item "Suporte". Manter "Produtos" (já renomeado) — vira mais uma view de catálogo; a operação dia-a-dia migra pra Empresa.
- **Página Clientes** já existente: cada linha vira link pra `/empresas/:id`.
- **Link do portal** copiável no cabeçalho da aba Suporte da empresa, com toggle "ativar/desativar portal".

## 6. O que NÃO entra agora

- Notificação por email/WhatsApp quando chega ticket (fica como próximo passo).
- Upload de anexos no ticket (próximo passo).
- SLA configurável por plano/cliente.
- Login próprio do cliente (continua link público).

---

Se aprovar, eu sigo nessa ordem: (1) migração das tabelas e edge functions, (2) página da Empresa com abas, (3) página Suporte global com métricas, (4) portal público.
