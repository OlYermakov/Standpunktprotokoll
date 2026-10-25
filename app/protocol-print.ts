import { DEFAULT_LANGUAGE } from "./default-language";
import { abbreviation, prismAbbreviation, translate, remarkChoices, pointTypeChoices, PRISMS, prismConstant, type Language, type MessageKey, type MessageParams } from "./i18n";

export type Target = {
  id: string; point: string; height: string; remark: string; pointType: string;
  isBacksight: boolean; isConnectionPoint: boolean; createdAt: string;
};
export type Station = {
  id: string; point: string; instrumentHeight: string; startTime?: string;
  targets: Target[];
};
export type ProtocolMeta = {
  project: string; projectNumber: string; date: string; startTime: string; endTime: string;
  instrument: string; crew: string; temperature: string; pressure: string; fpSynced: string; fpFile: string;
  showCompanyLogo: boolean;
};
export type Protocol = { id: string; createdAt: string; updatedAt: string; meta: ProtocolMeta; stations: Station[]; pageConditions?: Record<string, { temperature?: string; pressure?: string }> };

export function formatProtocolHeight(value: string, language: Language) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const numeric = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(numeric)) return trimmed;
  const roundedMillimeters = Math.round((numeric + Number.EPSILON) * 1000) / 1000;
  return roundedMillimeters.toFixed(3).replace(".", language === "en" ? "." : ",");
}

export const targetRemark = (target: Target | undefined, language: Language) => target
  ? [target.isConnectionPoint ? abbreviation("AP", language) : target.isBacksight ? abbreviation("RB", language) : "", abbreviation(target.pointType, language), prismAbbreviation(target.remark, language)].filter(Boolean).join(" · ")
  : "";

export type LegendEntry = { abbreviation: string; description: string };

export function protocolLegendEntries(protocol: Protocol, language: Language): LegendEntry[] {
  const t = (key: MessageKey, params?: MessageParams) => translate(language, key, params);
  const REMARK_CHOICES = remarkChoices(language);
  const POINT_TYPE_CHOICES = pointTypeChoices(language);
  const PRISM_LEGEND: Record<string, string> = Object.fromEntries(PRISMS.map(([code,key,constant]) => [code, `${t(key)} (${prismConstant(constant, language)} mm)`]));
  const targets = protocol.stations.flatMap((station) => station.targets);
  const usedPointTypes = new Set(targets.map((target) => target.pointType).filter(Boolean));
  const usedPrisms = new Set(targets.map((target) => target.remark).filter((remark) => Boolean(PRISM_LEGEND[remark])));
  const entries: LegendEntry[] = [];
  if (targets.some((target) => target.isBacksight)) entries.push({ abbreviation: abbreviation("RB", language), description: t("backsight") });
  if (targets.some((target) => target.isConnectionPoint)) entries.push({ abbreviation: abbreviation("AP", language), description: t("connection") });
  POINT_TYPE_CHOICES.forEach((choice) => {
    if (usedPointTypes.has(choice.value)) entries.push({ abbreviation: abbreviation(choice.value, language), description: choice.detail });
  });
  REMARK_CHOICES.forEach((choice) => {
    if (usedPrisms.has(choice.value)) entries.push({ abbreviation: prismAbbreviation(choice.value, language), description: PRISM_LEGEND[choice.value] });
  });
  return entries;
}

export type PrintRow = { stationId?: string; continuationTargetId?: string; stationPoint?: string; instrumentHeight?: string; target?: Target };

export const PRINT_ROWS_PER_PANEL = 30;
export const PRINT_PANELS_PER_PAGE = 3;

export function buildPrintPages(protocol: Protocol, language: Language = DEFAULT_LANGUAGE) {
  const rowsPerPage = PRINT_ROWS_PER_PANEL * PRINT_PANELS_PER_PAGE;
  const pageRows: PrintRow[][] = [];
  let currentPage: PrintRow[] = [];

  protocol.stations.forEach((station) => {
    const targets: Array<Target | undefined> = station.targets.length ? station.targets : [undefined];
    const targetRows: PrintRow[] = targets.map((target, index) => ({
      instrumentHeight: index === 0 ? (formatProtocolHeight(station.instrumentHeight, language) || "-") : "",
      target: target ? { ...target, height: formatProtocolHeight(target.height, language) } : undefined,
    }));
    const stationRows: PrintRow[] = [{ stationId: station.id, stationPoint: station.point || "-" }, ...targetRows];

    if (stationRows.length <= rowsPerPage) {
      if (currentPage.length && currentPage.length + stationRows.length > rowsPerPage) {
        pageRows.push(currentPage);
        currentPage = [];
      }
      currentPage.push(...stationRows);
      return;
    }

    if (currentPage.length) {
      pageRows.push(currentPage);
      currentPage = [];
    }
    for (let index = 0; index < targetRows.length; index += rowsPerPage - 1) {
      const continuedTargets = targetRows.slice(index, index + rowsPerPage - 1).map((row, targetIndex) => ({
        ...row,
        instrumentHeight: targetIndex === 0 ? (formatProtocolHeight(station.instrumentHeight, language) || "-") : "",
      }));
      pageRows.push([{ stationId: station.id, continuationTargetId: index > 0 ? continuedTargets[0]?.target?.id : undefined, stationPoint: station.point || "-" }, ...continuedTargets]);
    }
  });

  if (currentPage.length) pageRows.push(currentPage);
  if (!pageRows.length) pageRows.push([]);
  return pageRows.map((rows) => Array.from({ length: PRINT_PANELS_PER_PAGE }, (_, panelIndex) =>
    rows.slice(panelIndex * PRINT_ROWS_PER_PANEL, (panelIndex + 1) * PRINT_ROWS_PER_PANEL)));
}

// Weather follows the first station (or continuation target), not a mutable page number.
export function buildPageMetadata(protocol: Protocol, pages = buildPrintPages(protocol)) {
  let temperature = protocol.meta.temperature;
  let pressure = protocol.meta.pressure;
  return pages.map((page, index) => {
    const first = page.flat().find(row => row.stationId);
    const station = protocol.stations.find(item => item.id === first?.stationId);
    const key = JSON.stringify([first?.stationId ?? "", first?.continuationTargetId ?? ""]);
    const conditions = index > 0 ? protocol.pageConditions?.[key] : undefined;
    temperature = conditions?.temperature ?? temperature;
    pressure = conditions?.pressure ?? pressure;
    return { key, station, meta: { ...protocol.meta, temperature, pressure,
      startTime: index === 0 ? protocol.meta.startTime : station?.startTime ?? "" } };
  });
}
