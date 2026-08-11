import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface Props {
  data: ArrayBuffer | null;
  className?: string;
}

export default function PdfCanvasPreview({ data, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    (async () => {
      try {
        setError(null);
        const pdf = await pdfjsLib.getDocument({ data: data.slice(0) }).promise;
        if (cancelled) return;
        container.innerHTML = "";
        setPages(pdf.numPages);
        const width = container.clientWidth || 800;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const scale = (width / base.width) * (window.devicePixelRatio || 1);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.className = "rounded-lg border border-border shadow-sm mb-4 bg-white";
          container.appendChild(canvas);
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        }
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setError("Não foi possível renderizar a prévia");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data]);

  return (
    <div className={className}>
      {error && <p className="text-sm text-destructive mb-2">{error}</p>}
      {!data && <p className="text-sm text-muted-foreground">Gerando prévia…</p>}
      <div ref={containerRef} />
      {pages > 0 && (
        <p className="text-[11px] text-muted-foreground text-center">{pages} página(s)</p>
      )}
    </div>
  );
}