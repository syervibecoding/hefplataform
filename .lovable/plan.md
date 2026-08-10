# Relatório mensal alimentado pelos chamados

Hoje o relatório do cliente mostra tudo desde o início do contrato. A mudança transforma esse relatório em um **fechamento mensal**: o mês vira o eixo, e todo chamado com atividade naquele mês entra automaticamente no documento que você envia ao cliente.

## Como vai funcionar

1. **Seletor de mês** no topo do relatório (padrão: mês atual, com navegação para mês anterior/próximo). Ele preenche automaticamente o período de/até e a data de referência.
2. **Chamados do mês entram sozinhos**: qualquer chamado da empresa que tenha sido aberto, respondido, resolvido ou fechado dentro do mês. Cada um aparece com título, categoria, status atual, data de abertura e data de resolução (quando houver).
3. **Seção "Chamados atendidos no mês"** no PDF, em tabela: Chamado | Plataforma | Categoria | Status | Aberto em | Resolvido em.
4. **KPIs do mês** substituem os históricos: chamados no mês, resolvidos no mês, tempo médio de resolução e plataformas ativas.
5. **Linha do tempo filtrada pelo mês**, mantendo os marcos históricos (início de contrato, go-live, entregas) numa faixa "Histórico" resumida ao final.
6. **Edição por mês**: você segue renomeando, ocultando itens e escrevendo introdução/conclusão — agora salvos por competência, para que o texto de julho não sobrescreva o de agosto.
7. **Plataformas do cliente no relatório** passam a exibir o link do portal de chamados daquele cliente, reforçando onde abrir novos chamados.
8. **Exportar PDF do mês** com um clique, arquivo nomeado `Relatorio-<Cliente>-<AAAA-MM>.pdf`.

## Fluxo mensal na prática

```text
Cliente abre chamado pelo link público
   -> chamado fica vinculado à empresa e à plataforma
   -> equipe resolve
   -> no fim do mês: Relatórios > escolher cliente > escolher mês
   -> revisar textos > Exportar PDF > enviar ao cliente
```

## Detalhes técnicos

- `client_report_settings` ganha coluna de competência (`periodo_ref`, formato `AAAA-MM`) e a unicidade passa a ser `client_id + periodo_ref`; o registro atual é migrado para o mês vigente.
- `client_report_items` também ganha `periodo_ref`, para overrides e ocultações por mês; chave passa a ser `client_id + periodo_ref + item_key`.
- Migração com os `GRANT` correspondentes, preservando as políticas de acesso existentes.
- `useClientReport` recebe o mês como parâmetro e passa a filtrar e salvar por competência.
- `ClientReportsTab` monta a lista de chamados do mês cruzando `opened_at`, `first_response_at`, `resolved_at` e `closed_at`, resolve a plataforma via `product_id` e o portal via `support_slug`.
- `clientReportPdf.ts` ganha a tabela de chamados, os KPIs mensais e o cabeçalho de competência.

Sem envio automático de e-mail: a entrega segue manual, com o PDF pronto por mês.