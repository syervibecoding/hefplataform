import { useEffect, useState } from "react";
import { FileText, ImageIcon, Film, Download, Paperclip } from "lucide-react";
import type { SupportAttachment } from "@/hooks/useSupport";

interface Props {
  attachments: SupportAttachment[];
  resolveUrl: (att: SupportAttachment) => Promise<string>;
}

function iconFor(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.startsWith("video/")) return Film;
  return FileText;
}

function humanSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function ImagePreview({ att, resolveUrl }: { att: SupportAttachment; resolveUrl: Props["resolveUrl"] }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    resolveUrl(att).then((u) => !cancelled && setUrl(u)).catch(() => {});
    return () => { cancelled = true; };
  }, [att.id]);
  if (!url) return <div className="h-32 w-32 rounded-md bg-secondary animate-pulse" />;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <img src={url} alt={att.file_name} className="h-32 w-32 object-cover rounded-md border border-border hover:opacity-90" />
    </a>
  );
}

function FileCard({ att, resolveUrl }: { att: SupportAttachment; resolveUrl: Props["resolveUrl"] }) {
  const Icon = iconFor(att.mime_type);
  const open = async () => {
    try {
      const u = await resolveUrl(att);
      window.open(u, "_blank");
    } catch {}
  };
  return (
    <button
      onClick={open}
      className="flex items-center gap-2 p-2 rounded-md border border-border bg-secondary/40 hover:border-primary/30 transition-colors text-left max-w-xs"
    >
      <Icon size={16} className="text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{att.file_name}</p>
        <p className="text-[10px] text-muted-foreground">{humanSize(att.size_bytes)}</p>
      </div>
      <Download size={13} className="text-muted-foreground shrink-0" />
    </button>
  );
}

export default function SupportAttachmentList({ attachments, resolveUrl }: Props) {
  if (!attachments.length) return null;
  const images = attachments.filter((a) => a.mime_type.startsWith("image/"));
  const others = attachments.filter((a) => !a.mime_type.startsWith("image/"));
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Paperclip size={11} />
        <span>{attachments.length} anexo{attachments.length > 1 ? "s" : ""}</span>
      </div>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((a) => <ImagePreview key={a.id} att={a} resolveUrl={resolveUrl} />)}
        </div>
      )}
      {others.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {others.map((a) => <FileCard key={a.id} att={a} resolveUrl={resolveUrl} />)}
        </div>
      )}
    </div>
  );
}

export function AttachmentDropzone({
  files,
  setFiles,
  maxFiles = 5,
  maxMb = 15,
}: {
  files: File[];
  setFiles: (f: File[]) => void;
  maxFiles?: number;
  maxMb?: number;
}) {
  const add = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const merged = [...files];
    for (const f of incoming) {
      if (merged.length >= maxFiles) break;
      if (f.size > maxMb * 1024 * 1024) continue;
      merged.push(f);
    }
    setFiles(merged);
  };
  const remove = (i: number) => setFiles(files.filter((_, idx) => idx !== i));
  return (
    <div>
      <label className="flex items-center gap-2 p-3 rounded-md border border-dashed border-border bg-secondary/40 cursor-pointer hover:border-primary/40 transition-colors">
        <Paperclip size={14} className="text-primary" />
        <span className="text-xs text-muted-foreground">
          Anexar arquivos (até {maxFiles} · {maxMb}MB cada) — print, PDF, vídeo curto, log
        </span>
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { add(e.target.files); e.currentTarget.value = ""; }}
          accept="image/*,video/*,application/pdf,.csv,.txt,.log,.zip,.xlsx,.xls"
        />
      </label>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-secondary/60 border border-border">
              <span className="truncate flex-1">{f.name} <span className="text-muted-foreground">({(f.size/1024/1024).toFixed(2)} MB)</span></span>
              <button onClick={() => remove(i)} className="text-muted-foreground hover:text-red-500 text-[11px] px-1">remover</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const b64 = result.split(",")[1] ?? "";
      resolve(b64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}