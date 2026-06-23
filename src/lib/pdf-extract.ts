// PDF text extraction in the browser using pdfjs-dist.
// Supports password-protected PDFs by throwing a tagged error
// so the UI can prompt the user for a password.
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export class PdfPasswordRequiredError extends Error {
  constructor(public incorrect: boolean) {
    super(incorrect ? "Senha incorreta" : "PDF protegido por senha");
    this.name = "PdfPasswordRequiredError";
  }
}

export async function extractPdfText(file: File, password?: string): Promise<string> {
  const buf = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buf),
    password: password || undefined,
  });

  let pdf;
  try {
    pdf = await loadingTask.promise;
  } catch (e: any) {
    const name = e?.name || "";
    if (name === "PasswordException") {
      // code 1 = need password, code 2 = incorrect password
      throw new PdfPasswordRequiredError(e?.code === 2);
    }
    throw e;
  }

  const chunks: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str: string; transform?: number[] }>;
    let lastY: number | null = null;
    const line: string[] = [];
    const flush = () => {
      if (line.length) {
        chunks.push(line.join(" "));
        line.length = 0;
      }
    };
    for (const it of items) {
      const y = it.transform?.[5] ?? null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) flush();
      if (it.str) line.push(it.str);
      lastY = y;
    }
    flush();
    chunks.push(""); // page separator
  }
  return chunks.join("\n");
}