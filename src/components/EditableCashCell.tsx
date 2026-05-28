import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  value: number;
  isOverride?: boolean;
  disabled?: boolean;
  loading?: boolean;
  tdClassName?: string;
  onSave: (valor: number) => Promise<void> | void;
}

function formatValue(v: number) {
  if (v === 0) return "—";
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

export default function EditableCashCell({
  value,
  isOverride,
  disabled,
  loading,
  tdClassName,
  onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEdit = () => {
    if (disabled || loading || editing) return;
    setDraft(value ? String(Math.round(value)) : "");
    setEditing(true);
  };

  const commit = async () => {
    const cleaned = draft.trim().replace(/\./g, "").replace(",", ".");
    const parsed = cleaned === "" ? 0 : Number(cleaned);
    const v = isFinite(parsed) && parsed >= 0 ? parsed : 0;
    setEditing(false);
    if (Math.round(v) !== Math.round(value)) {
      await onSave(v);
    }
  };

  const base = `px-2 py-1 text-right font-mono text-[11px] ${tdClassName || ""}`;

  if (disabled) {
    return <td className={base}>{formatValue(value)}</td>;
  }

  return (
    <td
      className={`${base} ${isOverride ? "text-primary" : ""} cursor-text relative group`}
      onClick={(e) => {
        e.stopPropagation();
        startEdit();
      }}
      title={isOverride ? "Valor editado manualmente — clique para editar" : "Clique para editar"}
    >
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setEditing(false);
            }
          }}
          className="w-full bg-background border border-primary rounded px-1 py-0.5 text-right font-mono text-[11px] outline-none"
        />
      ) : loading ? (
        <Loader2 size={10} className="inline animate-spin opacity-70" />
      ) : (
        <span className={isOverride ? "underline decoration-dotted underline-offset-2" : "group-hover:underline decoration-dotted underline-offset-2"}>
          {formatValue(value)}
        </span>
      )}
    </td>
  );
}