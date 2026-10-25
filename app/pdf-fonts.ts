import type { jsPDF } from "jspdf";

export type PdfFonts = { regular: string; bold: string };
let fontPromise: Promise<PdfFonts> | null = null;

async function readFont(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("PDF font could not be loaded");
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (let start = 0; start < bytes.length; start += 8192) binary += String.fromCharCode(...bytes.subarray(start, start + 8192));
  return btoa(binary);
}

export function loadPdfFonts(): Promise<PdfFonts> {
  if (!fontPromise) fontPromise = Promise.all([readFont("/fonts/DejaVuSans.ttf"), readFont("/fonts/DejaVuSans-Bold.ttf")])
    .then(([regular, bold]) => ({regular, bold})).catch(error => {fontPromise = null; throw error;});
  return fontPromise;
}

export function registerPdfFonts(doc: jsPDF, fonts: PdfFonts) {
  doc.addFileToVFS("ProtocolSans.ttf", fonts.regular);
  doc.addFileToVFS("ProtocolSans-Bold.ttf", fonts.bold);
  doc.addFont("ProtocolSans.ttf", "ProtocolSans", "normal");
  doc.addFont("ProtocolSans-Bold.ttf", "ProtocolSans", "bold");
  doc.setFont("ProtocolSans", "normal");
}

