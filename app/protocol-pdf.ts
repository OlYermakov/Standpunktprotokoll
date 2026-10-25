import { jsPDF } from "jspdf";
import { assetUrl } from "./asset-url";
import { formatDate, translate, type Language, type MessageKey, type MessageParams } from "./i18n";
import { registerPdfFonts, type PdfFonts } from "./pdf-fonts";
import { buildPageMetadata, buildPrintPages, PRINT_PANELS_PER_PAGE, PRINT_ROWS_PER_PANEL, protocolLegendEntries, targetRemark, type LegendEntry, type PrintRow, type Protocol } from "./protocol-print";

// Loaded on demand: jsPDF is the largest part of the application bundle.
const AIT_LOGO_URL = assetUrl("/ait-logo.png");
let aitLogoDataUriPromise: Promise<string> | null = null;

export function loadAitLogoDataUri() {
  if (!aitLogoDataUriPromise) {
    aitLogoDataUriPromise = fetch(AIT_LOGO_URL)
      .then((response) => {
        if (!response.ok) throw new Error("AIT logo could not be loaded");
        return response.blob();
      })
      .then((blob) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error ?? new Error("AIT logo could not be read"));
        reader.readAsDataURL(blob);
      }))
      .catch((error) => {
        aitLogoDataUriPromise = null;
        throw error;
      });
  }
  return aitLogoDataUriPromise;
}

function drawPdfFooter(doc: jsPDF, entries: LegendEntry[], pageIndex: number, pageCount: number, language: Language) {
  const t = (key: MessageKey, params?: MessageParams) => translate(language, key, params);
  const legendX = 5;
  const legendWidth = 252;
  const startY = 197.2;
  const availableHeight = 10;
  let fontSize = 5.2;
  let lines: LegendEntry[][] = [];
  while (fontSize >= 3.8) {
    doc.setFontSize(fontSize);
    lines = [];
    let line: LegendEntry[] = [];
    let lineWidth = 0;
    entries.forEach((entry) => {
      doc.setFont("ProtocolSans", "bold");
      const abbreviationWidth = doc.getTextWidth(entry.abbreviation);
      doc.setFont("ProtocolSans", "normal");
      const entryWidth = abbreviationWidth + doc.getTextWidth(` - ${entry.description}`);
      const separatorWidth = line.length ? doc.getTextWidth(" · ") : 0;
      if (line.length && lineWidth + separatorWidth + entryWidth > legendWidth) {
        lines.push(line);
        line = [];
        lineWidth = 0;
      }
      lineWidth += (line.length ? doc.getTextWidth(" · ") : 0) + entryWidth;
      line.push(entry);
    });
    if (line.length) lines.push(line);
    const lineHeight = fontSize * 0.3528 * 1.15;
    if (lines.length * lineHeight <= availableHeight) break;
    fontSize -= 0.2;
  }
  doc.setTextColor(34, 34, 34);
  doc.setFontSize(Math.max(3.8, fontSize));
  doc.setLineHeightFactor(1.15);
  const lineHeight = Math.max(3.8, fontSize) * 0.3528 * 1.15;
  lines.forEach((line, lineIndex) => {
    let x = legendX;
    line.forEach((entry, entryIndex) => {
      if (entryIndex) {
        doc.setFont("ProtocolSans", "normal");
        doc.text(" · ", x, startY + lineIndex * lineHeight);
        x += doc.getTextWidth(" · ");
      }
      doc.setFont("ProtocolSans", "bold");
      doc.text(entry.abbreviation, x, startY + lineIndex * lineHeight);
      x += doc.getTextWidth(entry.abbreviation);
      doc.setFont("ProtocolSans", "normal");
      const description = ` - ${entry.description}`;
      doc.text(description, x, startY + lineIndex * lineHeight);
      x += doc.getTextWidth(description);
    });
  });
  doc.setFont("ProtocolSans", "normal");
  doc.setFontSize(5.5);
  doc.text(t("pageNumber", {page: pageIndex + 1, total: pageCount}), 292, 201.5, { align: "right" });
}

function fitPdfText(doc: jsPDF, value: string, width: number) {
  const lines = doc.splitTextToSize(value, width) as string[];
  return lines[0] ?? "";
}

function drawPdfMetaField(doc: jsPDF, label: string, value: string, x: number, y: number, width: number) {
  doc.setTextColor(8, 8, 8);
  doc.setFont("ProtocolSans", "bold");
  doc.setFontSize(5.8);
  const labelWidth = Math.min(doc.getTextWidth(label), width * 0.56);
  const labelLines = doc.splitTextToSize(label, labelWidth + 0.1) as string[];
  doc.text(labelLines, x, y + (labelLines.length > 1 ? 1.45 : 3.5), { lineHeightFactor: 1.05 });
  const lineX = x + labelWidth + 1.2;
  doc.setLineWidth(0.25);
  doc.line(lineX, y + 4.1, x + width, y + 4.1);
  doc.setFont("ProtocolSans", "normal");
  doc.setFontSize(8);
  doc.text(fitPdfText(doc, value, Math.max(1, x + width - lineX - 1.5)), lineX + 0.8, y + 3.35);
}

function drawPdfHeader(doc: jsPDF, protocol: Protocol, logoDataUri: string | undefined, language: Language) {
  const t = (key: MessageKey, params?: MessageParams) => translate(language, key, params);
  doc.setTextColor(8, 8, 8);
  doc.setFont("ProtocolSans", "bold");
  doc.setFontSize(7.3);
  doc.text(t("appTitle"), 6, 8);

  drawPdfMetaField(doc, t("project") + ":", protocol.meta.project, 6, 8.6, 69);
  drawPdfMetaField(doc, t("date") + ":", formatDate(protocol.meta.date, language), 6, 13.8, 69);
  drawPdfMetaField(doc, t("instrument") + ":", protocol.meta.instrument, 6, 19, 69);
  drawPdfMetaField(doc, t("fpStatus") + ":", protocol.meta.fpSynced, 6, 24.2, 69);

  drawPdfMetaField(doc, t("projectNumber") + ":", protocol.meta.projectNumber, 83.5, 8.6, 64);
  drawPdfMetaField(doc, t("time") + ":", protocol.meta.startTime, 83.5, 13.8, 64);
  drawPdfMetaField(doc, t("crew"), protocol.meta.crew, 83.5, 19, 64);
  drawPdfMetaField(doc, t("fpFile") + ":", protocol.meta.fpFile, 83.5, 24.2, 64);

  drawPdfMetaField(doc, t("temperature") + ":", protocol.meta.temperature ? `${protocol.meta.temperature} °C` : "", 154.2, 8.6, 42.5);
  drawPdfMetaField(doc, t("pressure") + ":", protocol.meta.pressure ? `${protocol.meta.pressure} hPa` : "", 203, 8.6, 42.5);

  if (protocol.meta.showCompanyLogo && logoDataUri) {
    const brandX = 274;
    const brandWidth = 18;
    doc.addImage(logoDataUri, "PNG", brandX, 2.5, brandWidth, 9.29, undefined, "FAST");
    doc.setTextColor(8, 8, 8);
    doc.setFont("ProtocolSans", "normal");
    let taglineSize = 4.1;
    doc.setFontSize(taglineSize);
    while (doc.getTextWidth(t("companyCaption")) > brandWidth && taglineSize > 2.8) {
      taglineSize -= 0.1;
      doc.setFontSize(taglineSize);
    }
    doc.text(t("companyCaption"), brandX + brandWidth / 2, 13.6, { align: "center" });
  }
}

function drawPdfTable(doc: jsPDF, page: PrintRow[][], language: Language) {
  const t = (key: MessageKey, params?: MessageParams) => translate(language, key, params);
  const tableX = 5;
  const tableY = 31;
  const tableWidth = 287;
  const headerHeight = 5.8;
  const rowHeight = 5.25;
  const tableHeight = headerHeight + PRINT_ROWS_PER_PANEL * rowHeight;
  const panelWidth = tableWidth / PRINT_PANELS_PER_PAGE;
  const columnRatios = [0.255, 0.279, 0.135, 0.331];
  const headers = [t("stationHeader"), t("target"), t("targetHeight"), t("remark")];

  doc.setFillColor(241, 241, 241);
  doc.rect(tableX, tableY, tableWidth, headerHeight, "F");
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.22);
  for (let row = 0; row <= PRINT_ROWS_PER_PANEL; row += 1) {
    const y = tableY + headerHeight + row * rowHeight;
    doc.line(tableX, y, tableX + tableWidth, y);
  }

  for (let group = 0; group < PRINT_PANELS_PER_PAGE; group += 1) {
    const groupX = tableX + group * panelWidth;
    let x = groupX;
    doc.setLineWidth(0.5);
    doc.line(groupX, tableY, groupX, tableY + tableHeight);
    columnRatios.slice(0, -1).forEach((ratio) => {
      x += panelWidth * ratio;
      doc.setLineWidth(0.22);
      doc.line(x, tableY, x, tableY + tableHeight);
    });
    doc.setLineWidth(0.5);
    doc.line(groupX + panelWidth, tableY, groupX + panelWidth, tableY + tableHeight);
  }
  doc.setLineWidth(0.5);
  doc.rect(tableX, tableY, tableWidth, tableHeight);

  doc.setTextColor(8, 8, 8);
  doc.setFont("ProtocolSans", "bold");
  doc.setFontSize(5.8);
  for (let group = 0; group < PRINT_PANELS_PER_PAGE; group += 1) {
    let x = tableX + group * panelWidth;
    headers.forEach((header, columnIndex) => {
      const width = panelWidth * columnRatios[columnIndex];
      let headerFontSize = 5.8;
      doc.setFontSize(headerFontSize);
      let headerLines = doc.splitTextToSize(header, width - 1.5) as string[];
      while (headerLines.length > 2 && headerFontSize > 4.2) {
        headerFontSize -= 0.2;
        doc.setFontSize(headerFontSize);
        headerLines = doc.splitTextToSize(header, width - 1.5) as string[];
      }
      doc.text(headerLines, x + width / 2, tableY + (headerLines.length > 1 ? 2.35 : 3.7), { align: "center", lineHeightFactor: 1.05 });
      x += width;
    });
  }

  for (let rowIndex = 0; rowIndex < PRINT_ROWS_PER_PANEL; rowIndex += 1) {
    for (let group = 0; group < PRINT_PANELS_PER_PAGE; group += 1) {
      const row = page[group]?.[rowIndex];
      const target = row?.target;
      const values = [
        row?.stationPoint ?? row?.instrumentHeight ?? "",
        target?.point ?? "",
        target?.height ?? "",
        targetRemark(target, language),
      ];
      let x = tableX + group * panelWidth;
      values.forEach((value, columnIndex) => {
        const width = panelWidth * columnRatios[columnIndex];
        doc.setFont("ProtocolSans", row?.stationPoint && columnIndex === 0 ? "bold" : "normal");
        doc.setFontSize(7.4);
        const text = fitPdfText(doc, value, width - 2);
        if (columnIndex === 2) {
          doc.text(text, x + width / 2, tableY + headerHeight + rowIndex * rowHeight + 3.55, { align: "center" });
        } else {
          doc.text(text, x + 1, tableY + headerHeight + rowIndex * rowHeight + 3.55);
        }
        x += width;
      });
    }
  }
}

export function buildProtocolPdf(protocol: Protocol, logoDataUri: string | undefined, language: Language, fonts: PdfFonts) {
  const t = (key: MessageKey, params?: MessageParams) => translate(language, key, params);
  const pages = buildPrintPages(protocol, language);
  const pageMetadata = buildPageMetadata(protocol, pages);
  const legendEntries = protocolLegendEntries(protocol, language);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  if (doc.internal.pageSize.getWidth() <= doc.internal.pageSize.getHeight()) {
    throw new Error("PDF landscape orientation could not be initialized");
  }
  registerPdfFonts(doc, fonts);
  doc.setLanguage(language);
  doc.setProperties({ title: t("appTitle"), subject: protocol.meta.project || t("appTitle") });
  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) doc.addPage("a4", "landscape");
    drawPdfHeader(doc, { ...protocol, meta: pageMetadata[pageIndex].meta }, logoDataUri, language);
    drawPdfTable(doc, page, language);
    drawPdfFooter(doc, legendEntries, pageIndex, pages.length, language);
  });
  return doc;
}
