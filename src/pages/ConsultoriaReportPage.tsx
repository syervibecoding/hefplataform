import { ArrowLeft, Plus, Trash2, Download, CheckCircle2, Circle, Wrench } from "lucide-react";
import {
  type ConsultoriaClient,
  type RelatorioConsultoria,
  type Marco,
  type Entrega,
  type EntregaStatus,
  ENTREGA_STATUS_LABEL,
  novoMarco,
  novaEntrega,
} from "@/data/consultoria";

interface Props {
  client: ConsultoriaClient;
  onUpdate: (rel: RelatorioConsultoria) => void;
  onBack: () => void;
}

const GREEN = "#5BBE5A";
const GREEN_LIGHT = "#A8E0A7";

function formatBR(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ConsultoriaReportPage({ client, onUpdate, onBack }: Props) {
  const { relatorio } = client;

  // ============ Editor handlers ============
  const setMarcos = (marcos: Marco[]) => onUpdate({ ...relatorio, marcos });
  const setEntregas = (entregas: Entrega[]) => onUpdate({ ...relatorio, entregas });

  const addMarco = () => setMarcos([...relatorio.marcos, novoMarco(todayISO(), "Novo marco", "")]);
  const updateMarco = (id: string, patch: Partial<Marco>) =>
    setMarcos(relatorio.marcos.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeMarco = (id: string) => setMarcos(relatorio.marcos.filter((m) => m.id !== id));

  const addEntrega = () => setEntregas([...relatorio.entregas, novaEntrega("Nova entrega", "")]);
  const updateEntrega = (id: string, patch: Partial<Entrega>) =>
    setEntregas(relatorio.entregas.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const removeEntrega = (id: string) => setEntregas(relatorio.entregas.filter((e) => e.id !== id));

  // ============ Export PDF ============
  const handleExport = () => {
    const html = buildPrintableHTML(client);
    const w = window.open("", "_blank", "width=1200,height=800");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 400);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar para Consultoria
        </button>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all"
        >
          <Download size={16} />
          Exportar PDF
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-heading font-bold tracking-tight">{client.nome}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {client.tipoConsultoria} • início em {formatBR(client.dataInicio)}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* ============ EDITOR ============ */}
        <div className="space-y-5">
          {/* Linha do Tempo */}
          <section className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-base">Linha do Tempo</h3>
              <button
                onClick={addMarco}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
              >
                <Plus size={12} />
                Marco
              </button>
            </div>
            <div className="space-y-3">
              {relatorio.marcos.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum marco ainda.</p>
              )}
              {relatorio.marcos.map((m) => (
                <div key={m.id} className="bg-secondary/50 border border-border rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={m.data}
                      onChange={(e) => updateMarco(m.id, { data: e.target.value })}
                      className="bg-secondary border border-border rounded-md px-2 py-1.5 text-xs font-mono w-36"
                    />
                    <input
                      value={m.titulo}
                      onChange={(e) => updateMarco(m.id, { titulo: e.target.value })}
                      placeholder="Título"
                      className="flex-1 bg-secondary border border-border rounded-md px-2 py-1.5 text-xs font-semibold"
                    />
                    <button
                      onClick={() => removeMarco(m.id)}
                      className="p-1.5 rounded-md text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <textarea
                    value={m.descricao}
                    onChange={(e) => updateMarco(m.id, { descricao: e.target.value })}
                    placeholder="Descrição"
                    rows={2}
                    className="w-full bg-secondary border border-border rounded-md px-2 py-1.5 text-xs resize-none"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Entregas */}
          <section className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-base">Entregas</h3>
              <button
                onClick={addEntrega}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
              >
                <Plus size={12} />
                Entrega
              </button>
            </div>
            <div className="space-y-3">
              {relatorio.entregas.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma entrega ainda.</p>
              )}
              {relatorio.entregas.map((e) => (
                <div key={e.id} className="bg-secondary/50 border border-border rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={e.titulo}
                      onChange={(ev) => updateEntrega(e.id, { titulo: ev.target.value })}
                      placeholder="Título"
                      className="flex-1 bg-secondary border border-border rounded-md px-2 py-1.5 text-xs font-semibold"
                    />
                    <select
                      value={e.status}
                      onChange={(ev) =>
                        updateEntrega(e.id, { status: ev.target.value as EntregaStatus })
                      }
                      className="bg-secondary border border-border rounded-md px-2 py-1.5 text-xs"
                    >
                      {(Object.keys(ENTREGA_STATUS_LABEL) as EntregaStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {ENTREGA_STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeEntrega(e.id)}
                      className="p-1.5 rounded-md text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <textarea
                    value={e.descricao}
                    onChange={(ev) => updateEntrega(e.id, { descricao: ev.target.value })}
                    placeholder="Descrição"
                    rows={2}
                    className="w-full bg-secondary border border-border rounded-md px-2 py-1.5 text-xs resize-none"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ============ LIVE PREVIEW ============ */}
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Preview
          </div>
          <ReportPreview client={client} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Preview component — uses inline styles to escape dark theme
// ============================================================
function ReportPreview({ client }: { client: ConsultoriaClient }) {
  const today = todayISO();
  const periodo = `${formatBR(client.dataInicio)} → ${formatBR(today)}`;

  const serif: React.CSSProperties = {
    fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
  };
  const sans: React.CSSProperties = {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  };

  return (
    <div style={{ background: "#fff", color: "#0f0f0f", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }}>
      {/* CAPA */}
      <div style={{ background: "#000", color: "#fff", padding: "48px 40px", ...sans }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>hefsys.</div>
        <div style={{ marginTop: 56 }}>
          <span
            style={{
              display: "inline-block",
              background: GREEN,
              color: "#000",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              padding: "6px 12px",
              borderRadius: 999,
              textTransform: "uppercase",
            }}
          >
            {client.tipoConsultoria}
          </span>
        </div>
        <h1 style={{ ...serif, fontSize: 56, lineHeight: 1.05, margin: "20px 0 0", fontWeight: 700 }}>
          Transformação Digital.
        </h1>
        <div style={{ display: "flex", gap: 48, marginTop: 56, fontSize: 11 }}>
          <div>
            <div style={{ color: "#888", letterSpacing: 2, textTransform: "uppercase", fontSize: 9 }}>Cliente</div>
            <div style={{ marginTop: 4, fontWeight: 600 }}>{client.nome}</div>
          </div>
          <div>
            <div style={{ color: "#888", letterSpacing: 2, textTransform: "uppercase", fontSize: 9 }}>Período</div>
            <div style={{ marginTop: 4, fontWeight: 600 }}>{periodo}</div>
          </div>
        </div>
      </div>

      {/* LINHA DO TEMPO */}
      <div style={{ padding: "48px 40px", ...sans }}>
        <div style={{ color: GREEN, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
          Linha do Tempo
        </div>
        <h2 style={{ ...serif, fontSize: 32, margin: "8px 0 32px", fontWeight: 700, color: "#0f0f0f" }}>
          Onde começamos, onde estamos.
        </h2>

        <div style={{ position: "relative", paddingLeft: 24 }}>
          {/* spine */}
          <div
            style={{
              position: "absolute",
              left: 7,
              top: 6,
              bottom: 6,
              width: 2,
              background: "#e5e7eb",
            }}
          />
          {client.relatorio.marcos.map((m, idx) => {
            const isHoje = idx === client.relatorio.marcos.length - 1;
            return (
              <div key={m.id} style={{ position: "relative", paddingBottom: 24 }}>
                <div
                  style={{
                    position: "absolute",
                    left: -24,
                    top: 2,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: isHoje ? GREEN : "#fff",
                    border: `2px solid ${isHoje ? GREEN : "#9ca3af"}`,
                    boxShadow: isHoje ? `0 0 0 6px ${GREEN}33` : "none",
                  }}
                />
                <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", letterSpacing: 1, textTransform: "uppercase" }}>
                    {formatBR(m.data)}
                  </div>
                  {isHoje && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        background: GREEN,
                        color: "#000",
                        padding: "2px 8px",
                        borderRadius: 999,
                        letterSpacing: 1.5,
                      }}
                    >
                      HOJE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, color: "#0f0f0f" }}>{m.titulo}</div>
                {m.descricao && (
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 4, lineHeight: 1.5 }}>{m.descricao}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ENTREGAS */}
      <div style={{ padding: "0 40px 48px", ...sans }}>
        <div style={{ color: GREEN, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
          Entregues • Em Produção
        </div>
        <h2 style={{ ...serif, fontSize: 32, margin: "8px 0 24px", fontWeight: 700, color: "#0f0f0f" }}>
          O que está rodando.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {client.relatorio.entregas.map((e) => (
            <EntregaCard key={e.id} entrega={e} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EntregaCard({ entrega }: { entrega: Entrega }) {
  return (
    <div
      style={{
        position: "relative",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "14px 14px 14px 18px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: GREEN,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: GREEN }}>
        <Wrench size={14} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f0f0f", marginTop: 6 }}>{entrega.titulo}</div>
      {entrega.descricao && (
        <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4, lineHeight: 1.45 }}>{entrega.descricao}</div>
      )}
      <div style={{ marginTop: 10 }}>
        <StatusPill status={entrega.status} />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: EntregaStatus }) {
  const label = ENTREGA_STATUS_LABEL[status];
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 10,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 999,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  };
  if (status === "em_producao") {
    return (
      <span style={{ ...base, background: GREEN, color: "#000" }}>
        <CheckCircle2 size={11} />
        {label}
      </span>
    );
  }
  if (status === "em_validacao") {
    return (
      <span style={{ ...base, background: "#fff", color: GREEN, border: `1px solid ${GREEN}` }}>
        <CheckCircle2 size={11} />
        {label}
      </span>
    );
  }
  if (status === "em_desenvolvimento") {
    return (
      <span style={{ ...base, background: GREEN_LIGHT, color: "#0f3a0f" }}>
        {label}
      </span>
    );
  }
  return (
    <span style={{ ...base, background: "#e5e7eb", color: "#4b5563" }}>
      <Circle size={9} />
      {label}
    </span>
  );
}

// ============================================================
// Printable HTML (separate window)
// ============================================================
function buildPrintableHTML(client: ConsultoriaClient): string {
  const today = todayISO();
  const periodo = `${formatBR(client.dataInicio)} → ${formatBR(today)}`;

  const pillStyle = (s: EntregaStatus) => {
    if (s === "em_producao") return `background:${GREEN};color:#000;`;
    if (s === "em_validacao") return `background:#fff;color:${GREEN};border:1px solid ${GREEN};`;
    if (s === "em_desenvolvimento") return `background:${GREEN_LIGHT};color:#0f3a0f;`;
    return `background:#e5e7eb;color:#4b5563;`;
  };

  const marcosHTML = client.relatorio.marcos
    .map((m, idx) => {
      const isHoje = idx === client.relatorio.marcos.length - 1;
      return `
        <div class="marco">
          <div class="dot ${isHoje ? "dot-hoje" : ""}"></div>
          <div class="marco-head">
            <span class="marco-data">${formatBR(m.data)}</span>
            ${isHoje ? `<span class="hoje-pill">HOJE</span>` : ""}
          </div>
          <div class="marco-titulo">${escapeHTML(m.titulo)}</div>
          ${m.descricao ? `<div class="marco-desc">${escapeHTML(m.descricao)}</div>` : ""}
        </div>
      `;
    })
    .join("");

  const entregasHTML = client.relatorio.entregas
    .map(
      (e) => `
    <div class="entrega">
      <div class="entrega-bar"></div>
      <div class="entrega-titulo">${escapeHTML(e.titulo)}</div>
      ${e.descricao ? `<div class="entrega-desc">${escapeHTML(e.descricao)}</div>` : ""}
      <span class="pill" style="${pillStyle(e.status)}">${ENTREGA_STATUS_LABEL[e.status]}</span>
    </div>
  `
    )
    .join("");

  return `<!doctype html>
<html lang="pt-br">
<head>
<meta charset="utf-8" />
<title>Relatório • ${escapeHTML(client.nome)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #0f0f0f; font-family: 'Inter', system-ui, sans-serif; }
  .serif { font-family: 'Playfair Display', Georgia, serif; }
  .page { width: 100%; padding: 40px 56px; page-break-after: always; }
  .page:last-child { page-break-after: auto; }

  /* Capa */
  .capa { background: #000; color: #fff; min-height: 540px; padding: 48px 56px; display: flex; flex-direction: column; }
  .capa .logo { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .capa .badge { display: inline-block; background: ${GREEN}; color: #000; font-size: 11px; font-weight: 700; letter-spacing: 2px; padding: 6px 12px; border-radius: 999px; text-transform: uppercase; }
  .capa h1 { font-size: 72px; line-height: 1.02; margin: 20px 0 0; font-weight: 700; }
  .capa .meta { display: flex; gap: 64px; margin-top: auto; font-size: 12px; padding-top: 56px; }
  .capa .meta .k { color: #888; letter-spacing: 2px; text-transform: uppercase; font-size: 9px; }
  .capa .meta .v { margin-top: 4px; font-weight: 600; }

  /* Eyebrow + heading */
  .eyebrow { color: ${GREEN}; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
  h2.section { font-size: 36px; margin: 8px 0 32px; font-weight: 700; color: #0f0f0f; }

  /* Timeline */
  .timeline { position: relative; padding-left: 28px; }
  .timeline::before { content: ""; position: absolute; left: 7px; top: 8px; bottom: 8px; width: 2px; background: #e5e7eb; }
  .marco { position: relative; padding-bottom: 24px; }
  .dot { position: absolute; left: -28px; top: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 2px solid #9ca3af; }
  .dot-hoje { background: ${GREEN}; border-color: ${GREEN}; box-shadow: 0 0 0 6px ${GREEN}33; }
  .marco-head { display: flex; gap: 12px; align-items: baseline; }
  .marco-data { font-size: 10px; font-weight: 700; color: #6b7280; letter-spacing: 1px; text-transform: uppercase; }
  .hoje-pill { font-size: 9px; font-weight: 800; background: ${GREEN}; color: #000; padding: 2px 8px; border-radius: 999px; letter-spacing: 1.5px; }
  .marco-titulo { font-size: 16px; font-weight: 700; margin-top: 4px; }
  .marco-desc { font-size: 12px; color: #4b5563; margin-top: 4px; line-height: 1.5; }

  /* Entregas */
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .entrega { position: relative; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 14px 14px 20px; overflow: hidden; }
  .entrega-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: ${GREEN}; }
  .entrega-titulo { font-size: 14px; font-weight: 700; }
  .entrega-desc { font-size: 11px; color: #4b5563; margin-top: 4px; line-height: 1.45; }
  .pill { display: inline-block; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 999px; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 10px; }

  @media print {
    @page { size: A4 landscape; margin: 0; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 32px 40px; }
    .capa { min-height: auto; height: calc(100vh - 0px); }
  }
</style>
</head>
<body>
  <section class="page capa">
    <div class="logo">hefsys.</div>
    <div style="margin-top:56px;">
      <span class="badge">${escapeHTML(client.tipoConsultoria)}</span>
    </div>
    <h1 class="serif">Transformação Digital.</h1>
    <div class="meta">
      <div><div class="k">Cliente</div><div class="v">${escapeHTML(client.nome)}</div></div>
      <div><div class="k">Período</div><div class="v">${periodo}</div></div>
    </div>
  </section>

  <section class="page">
    <div class="eyebrow">Linha do Tempo</div>
    <h2 class="section serif">Onde começamos, onde estamos.</h2>
    <div class="timeline">${marcosHTML}</div>
  </section>

  <section class="page">
    <div class="eyebrow">Entregues • Em Produção</div>
    <h2 class="section serif">O que está rodando.</h2>
    <div class="grid">${entregasHTML}</div>
  </section>
</body>
</html>`;
}

function escapeHTML(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}