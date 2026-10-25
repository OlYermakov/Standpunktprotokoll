"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { DEFAULT_LANGUAGE } from "./default-language";
import { LanguageProvider, LanguageSwitcher, useLanguage } from "./i18n-context";
import { InstructionGuide } from "./instructions";
import { protocolPointSuggestions, lastInstrumentHeightSuggestions } from "./protocol-points";
import { abbreviation, prismAbbreviation, formatDate, formatBackupDate, countLabel, translate, LOCALES, remarkChoices, pointTypeChoices, PRISMS, prismConstant, type Language, type MessageKey, type MessageParams } from "./i18n";
import { loadPdfFonts, registerPdfFonts, type PdfFonts } from "./pdf-fonts";

type Target = {
  id: string; point: string; height: string; remark: string; pointType: string;
  isBacksight: boolean; isConnectionPoint: boolean; createdAt: string;
};
type Station = {
  id: string; point: string; instrumentHeight: string; startTime?: string;
  targets: Target[];
};
type ProtocolMeta = {
  project: string; projectNumber: string; date: string; startTime: string; endTime: string;
  instrument: string; crew: string; temperature: string; pressure: string; fpSynced: string; fpFile: string;
  showCompanyLogo: boolean;
};
type Protocol = { id: string; createdAt: string; updatedAt: string; meta: ProtocolMeta; stations: Station[]; pageConditions?: Record<string, { temperature?: string; pressure?: string }> };
type SavedCombination = {
  id: string; point: string; height: string; remark: string; pointType: string;
  isBacksight: boolean; isConnectionPoint: boolean; useCount: number; lastUsedAt: string;
};
type Store = {
  version: 1; activeProtocolId: string; protocols: Protocol[]; savedCombinations: SavedCombination[]; lastBackupAt?: string;
};
type StoreSnapshot = { id: string; createdAt: string; store: Store };
type BackupFile = { format: "standpunktprotokoll-backup"; version: 1; createdAt: string; store: Store };
type TargetSheet = { stationId: string; targetId?: string };
type DeleteRequest =
  | { kind: "station"; stationId: string; label: string; targetCount: number }
  | { kind: "target"; stationId: string; targetId: string; label: string; stationLabel: string }
  | { kind: "protocol"; protocolId: string; label: string; stationCount: number; targetCount: number };
type TargetForm = {
  point: string; height: string; remark: string; pointType: string; isBacksight: boolean; isConnectionPoint: boolean;
};
type Choice = { value: string; label: string; detail?: string };
type UiTheme = "dark" | "light";

const CUSTOM_REMARK = "__custom__";

const DEFAULT_TARGET_FORM: TargetForm = {
  point: "", height: "", remark: "", pointType: "", isBacksight: false, isConnectionPoint: false,
};

const LEGACY_REMARKS: Record<string, string> = {
  "GPR1/111/121": "RP", GPH1P: "PP", "GMP101/111": "MP", "GMP111-0": "MP0",
  "GRZ4/GRZ122": "P360", MPR122: "MPR122", GRZ101: "MP360", "GMP004/GMP104": "MMP",
  "GZM29/30/31": "RF", GPR105: "FP", NP: "OP",
};

const normalizeRemark = (value: string) => LEGACY_REMARKS[value] ?? value;

function normalizeTargetRemark(value: string, isBacksight = false, isConnectionPoint = false) {
  const containsBacksight = /(^|[\s/·,;|])RB(?=$|[\s/·,;|])/i.test(value);
  const containsConnectionPoint = /(^|[\s/·,;|])AP(?=$|[\s/·,;|])/i.test(value);
  const withoutFlags = value
    .replace(/(^|[\s/·,;|])(?:RB|AP)(?=$|[\s/·,;|])/gi, " ")
    .replace(/\s*[/·,;|]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const normalizedConnectionPoint = isConnectionPoint || containsConnectionPoint;
  const normalizedBacksight = !normalizedConnectionPoint && (isBacksight || containsBacksight);
  return {
    remark: normalizeRemark(withoutFlags),
    isBacksight: normalizedBacksight,
    isConnectionPoint: normalizedConnectionPoint,
  };
}

const STORAGE_KEY = "standpunktprotokoll-store-v1";
const UI_THEME_KEY = "standpunktprotokoll-ui-theme";
const DATABASE_NAME = "standpunktprotokoll-db";
const DATABASE_VERSION = 1;
const STATE_STORE = "state";
const SNAPSHOT_STORE = "snapshots";
const STORE_RECORD_KEY = "current-store";
const MAX_SNAPSHOTS = 12;
const AIT_LOGO_URL = "/ait-logo.png";
let aitLogoDataUriPromise: Promise<string> | null = null;

function loadAitLogoDataUri() {
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

function id() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function localDate(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localTime(value = new Date()) {
  return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
}

const nowIso = () => new Date().toISOString();

function createStation(): Station {
  return {
    id: id(), point: "", instrumentHeight: "", startTime: localTime(),
    targets: [],
  };
}

function createProtocol(carry?: Protocol): Protocol {
  const timestamp = nowIso();
  return {
    id: id(), createdAt: timestamp, updatedAt: timestamp,
    meta: {
      project: carry?.meta.project ?? "", projectNumber: carry?.meta.projectNumber ?? "",
      date: localDate(), startTime: localTime(), endTime: "",
      instrument: carry?.meta.instrument ?? "", crew: carry?.meta.crew ?? "",
      temperature: "", pressure: "", fpSynced: carry?.meta.fpSynced ?? "",
      fpFile: carry?.meta.fpFile ?? "", showCompanyLogo: true,
    },
    stations: [createStation()],
  };
}

function createInitialStore(): Store {
  const protocol = createProtocol();
  return { version: 1, activeProtocolId: protocol.id, protocols: [protocol], savedCombinations: [] };
}

const normalizeHeight = (value: string) => value.trim().replace(".", ",");

function formatProtocolHeight(value: string, language: Language) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const numeric = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(numeric)) return trimmed;
  const roundedMillimeters = Math.round((numeric + Number.EPSILON) * 1000) / 1000;
  return roundedMillimeters.toFixed(3).replace(".", language === "en" ? "." : ",");
}

function rememberCombination(items: SavedCombination[], target: TargetForm) {
  const point = target.point.trim();
  const height = normalizeHeight(target.height);
  const remark = target.remark.trim();
  const pointType = target.pointType.trim();
  const isBacksight = target.isBacksight;
  const isConnectionPoint = target.isConnectionPoint;
  const key = `${point.toLocaleLowerCase()}|${height.toLocaleLowerCase()}|${remark.toLocaleLowerCase()}|${pointType}|${isBacksight}|${isConnectionPoint}`;
  const existing = items.findIndex((item) =>
    `${item.point.toLocaleLowerCase()}|${item.height.toLocaleLowerCase()}|${item.remark.toLocaleLowerCase()}|${item.pointType ?? ""}|${Boolean(item.isBacksight)}|${Boolean(item.isConnectionPoint)}` === key,
  );
  const timestamp = nowIso();
  if (existing < 0) {
    return [{ id: id(), point, height, remark, pointType, isBacksight, isConnectionPoint, useCount: 1, lastUsedAt: timestamp }, ...items];
  }
  return items
    .map((item, index) => index === existing
      ? { ...item, point, height, remark, pointType, isBacksight, isConnectionPoint, useCount: item.useCount + 1, lastUsedAt: timestamp }
      : item)
    .sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt));
}

function normalizeSavedCombinations(items: SavedCombination[]) {
  const merged = new Map<string, SavedCombination>();
  items.forEach((item) => {
    const normalized = { ...item, pointType: item.pointType ?? "", ...normalizeTargetRemark(item.remark, Boolean(item.isBacksight), Boolean(item.isConnectionPoint)) };
    const key = `${normalized.point.trim().toLocaleLowerCase()}|${normalizeHeight(normalized.height).toLocaleLowerCase()}|${normalized.remark.toLocaleLowerCase()}|${normalized.pointType}|${normalized.isBacksight}|${normalized.isConnectionPoint}`;
    const previous = merged.get(key);
    merged.set(key, previous ? {
      ...previous,
      useCount: previous.useCount + normalized.useCount,
      lastUsedAt: previous.lastUsedAt > normalized.lastUsedAt ? previous.lastUsedAt : normalized.lastUsedAt,
    } : normalized);
  });
  return [...merged.values()].sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt));
}

function normalizeStore(value: unknown): Store | null {
  if (!value || typeof value !== "object") return null;
  const parsed = value as Partial<Store>;
  if (parsed.version !== 1 || !Array.isArray(parsed.protocols) || !parsed.protocols.length) return null;
  const protocols = parsed.protocols.map((protocol) => ({
    ...protocol,
    meta: {
      ...protocol.meta,
      fpSynced: typeof protocol.meta.fpSynced === "string"
        ? protocol.meta.fpSynced
        : protocol.meta.fpSynced ? "Ja" : "",
      showCompanyLogo: protocol.meta.showCompanyLogo !== false,
    },
    stations: (protocol.stations ?? []).map((station) => ({
      ...station,
      targets: (station.targets ?? []).map((target) => ({
        ...target, pointType: target.pointType ?? "",
        ...normalizeTargetRemark(target.remark ?? "", Boolean(target.isBacksight), Boolean(target.isConnectionPoint)),
      })),
    })),
  }));
  const activeProtocolId = protocols.some((protocol) => protocol.id === parsed.activeProtocolId)
    ? String(parsed.activeProtocolId)
    : protocols[0].id;
  return {
    version: 1,
    activeProtocolId,
    protocols,
    savedCombinations: normalizeSavedCombinations(parsed.savedCombinations ?? []),
    lastBackupAt: typeof parsed.lastBackupAt === "string" ? parsed.lastBackupAt : undefined,
  };
}

function openAppDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STATE_STORE)) database.createObjectStore(STATE_STORE);
      if (!database.objectStoreNames.contains(SNAPSHOT_STORE)) database.createObjectStore(SNAPSHOT_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB unavailable"));
  });
}

async function readIndexedDbStore() {
  const database = await openAppDatabase();
  return new Promise<Store | null>((resolve, reject) => {
    const transaction = database.transaction(STATE_STORE, "readonly");
    const request = transaction.objectStore(STATE_STORE).get(STORE_RECORD_KEY);
    request.onsuccess = () => resolve(normalizeStore(request.result));
    request.onerror = () => reject(request.error ?? new Error("Stored protocol could not be read"));
    transaction.oncomplete = () => database.close();
  });
}

async function writeIndexedDbStore(store: Store) {
  const database = await openAppDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STATE_STORE, "readwrite");
    transaction.objectStore(STATE_STORE).put(store, STORE_RECORD_KEY);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error ?? new Error("Protocol could not be stored")); };
  });
}

async function saveSnapshot(store: Store) {
  const database = await openAppDatabase();
  const snapshot: StoreSnapshot = { id: id(), createdAt: nowIso(), store: JSON.parse(JSON.stringify(store)) as Store };
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(SNAPSHOT_STORE, "readwrite");
    const objectStore = transaction.objectStore(SNAPSHOT_STORE);
    objectStore.put(snapshot);
    const allRequest = objectStore.getAll();
    allRequest.onsuccess = () => {
      const snapshots = (allRequest.result as StoreSnapshot[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      snapshots.slice(MAX_SNAPSHOTS).forEach((entry) => objectStore.delete(entry.id));
    };
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error ?? new Error("Snapshot could not be stored")); };
  });
}

async function listSnapshots() {
  const database = await openAppDatabase();
  return new Promise<StoreSnapshot[]>((resolve, reject) => {
    const transaction = database.transaction(SNAPSHOT_STORE, "readonly");
    const request = transaction.objectStore(SNAPSHOT_STORE).getAll();
    request.onsuccess = () => resolve((request.result as StoreSnapshot[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    request.onerror = () => reject(request.error ?? new Error("Snapshots could not be read"));
    transaction.oncomplete = () => database.close();
  });
}

function hasMeaningfulData(store: Store) {
  return store.protocols.some((protocol) => Boolean(
    protocol.meta.project.trim() || protocol.meta.projectNumber.trim() || protocol.meta.instrument.trim()
    || protocol.meta.crew.trim() || protocol.stations.some((station) => station.point.trim() || station.targets.length),
  ));
}

function backupFilename(value = new Date()) {
  const date = localDate(value);
  const time = `${String(value.getHours()).padStart(2, "0")}-${String(value.getMinutes()).padStart(2, "0")}`;
  return `Standpunktprotokoll_Backup_${date}_${time}.json`;
}

function uniqueValues(items: SavedCombination[], key: "point" | "height" | "remark") {
  const seen = new Set<string>();
  return [...items]
    .sort((a, b) => b.useCount - a.useCount || b.lastUsedAt.localeCompare(a.lastUsedAt))
    .map((item) => item[key])
    .filter((value) => {
      const normalized = value.trim().toLocaleLowerCase();
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

function parseLocalizedDate(value: string) {
  const match = value.trim().match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const probe = new Date(`${iso}T00:00:00`);
  if (probe.getFullYear() !== Number(year) || probe.getMonth() + 1 !== Number(month) || probe.getDate() !== Number(day)) return null;
  return iso;
}

function parseLocalizedTime(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

const protocolLabel = (protocol: Protocol, language: Language) => protocol.meta.project.trim() || `${translate(language, "protocol")} ${formatDate(protocol.meta.date, language)}`;
const countTargets = (protocol: Protocol) => protocol.stations.reduce((sum, station) => sum + station.targets.length, 0);
export const targetRemark = (target: Target | undefined, language: Language) => target
  ? [target.isConnectionPoint ? abbreviation("AP", language) : target.isBacksight ? abbreviation("RB", language) : "", abbreviation(target.pointType, language), prismAbbreviation(target.remark, language)].filter(Boolean).join(" · ")
  : "";

type LegendEntry = { abbreviation: string; description: string };

function protocolLegendEntries(protocol: Protocol, language: Language): LegendEntry[] {
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

function drawPdfFooter(doc: jsPDF, protocol: Protocol, pageIndex: number, pageCount: number, language: Language) {
  const t = (key: MessageKey, params?: MessageParams) => translate(language, key, params);
  const entries = protocolLegendEntries(protocol, language);
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

function Field({ label, value, onChange, type = "text", inputMode, placeholder }: {
  label: string; value: string; onChange: (value: string) => void; type?: string;
  inputMode?: "text" | "decimal" | "numeric"; placeholder?: string;
}) {
  const { language, t } = useLanguage();
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} inputMode={inputMode} value={value} placeholder={placeholder}
        lang={LOCALES[language]}
        onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function LocalizedDateTimeField({ label, value, onChange, kind }: {
  label: string; value: string; onChange: (value: string) => void; kind: "date" | "time";
}) {
  const { language, t } = useLanguage();
  const [draft, setDraft] = useState(kind === "date" ? (value ? formatDate(value, language) : "") : value);
  const parse = kind === "date" ? parseLocalizedDate : parseLocalizedTime;
  const format = (nextValue: string) => kind === "date" ? (nextValue ? formatDate(nextValue, language) : "") : nextValue;

  function updateDraft(nextDraft: string) {
    setDraft(nextDraft);
    if (!nextDraft.trim()) {
      onChange("");
      return;
    }
    const parsed = parse(nextDraft);
    if (parsed) onChange(parsed);
  }

  function finishEditing() {
    if (!draft.trim()) return;
    const parsed = parse(draft);
    setDraft(parsed ? format(parsed) : format(value));
  }

  return (
    <label className="field localized-field">
      <span>{label}</span>
      <input type="text" inputMode="text" autoComplete="off" value={draft}
        placeholder={kind === "date" ? t("datePlaceholder") : t("timePlaceholder")} lang={LOCALES[language]}
        onChange={(event) => updateDraft(event.target.value)} onBlur={finishEditing} />
      <i aria-hidden="true">{kind === "date" ? "▦" : "◷"}</i>
    </label>
  );
}

function SelectField({ label, value, onChange, options, placeholder: suppliedPlaceholder }: {
  label: string; value: string; onChange: (value: string) => void; options: Choice[]; placeholder?: string;
}) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const placeholder = suppliedPlaceholder ?? t("select");
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const choose = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div className={`field select-field${open ? " open" : ""}`}>
      <span>{label}</span>
      <button type="button" className="select-trigger" aria-haspopup="listbox" aria-expanded={open}
        aria-label={`${label}: ${selected?.label ?? placeholder}`} onClick={() => setOpen((current) => !current)}>
        <span className="select-copy">
          {selected ? <><b>{selected.label}</b>{selected.detail ? <small>{selected.detail}</small> : null}</>
            : <span className="select-placeholder">{placeholder}</span>}
        </span>
        <span className="select-chevron" aria-hidden="true">⌄</span>
      </button>
      {open ? (
        <div className="select-options" role="listbox" aria-label={label}>
          <button type="button" role="option" aria-selected={!value} className={!value ? "selected" : ""} onClick={() => choose("")}>
            <b>{placeholder}</b>
          </button>
          {options.map((option) => (
            <button type="button" role="option" aria-selected={option.value === value}
              className={option.value === value ? "selected" : ""} key={option.value} onClick={() => choose(option.value)}>
              <b>{option.label}</b>
              {option.detail ? <small>{option.detail}</small> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SuggestionField({ label, value, onChange, suggestions, onPick, inputMode, autoFocus, placeholder, maxSuggestions = 7 }: {
  label: string; value: string; onChange: (value: string) => void; suggestions: string[];
  onPick?: (value: string) => void; inputMode?: "text" | "decimal"; autoFocus?: boolean; placeholder?: string;
  maxSuggestions?: number;
}) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const options = suggestions
    .filter((item) => !value || item.toLocaleLowerCase().includes(value.toLocaleLowerCase()))
    .slice(0, maxSuggestions);
  return (
    <label className="field suggestion-field">
      <span>{label}</span>
      <input autoFocus={autoFocus} inputMode={inputMode} value={value} placeholder={placeholder} autoComplete="off"
        onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => { onChange(event.target.value); setOpen(true); }} />
      {open && options.length > 0 ? (
        <div className="suggestions" role="listbox" aria-label={t("savedSuggestions", {label})}>
          {options.map((option) => (
            <button type="button" key={option} onMouseDown={(event) => event.preventDefault()}
              onClick={() => { (onPick ?? onChange)(option); setOpen(false); }}>
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </label>
  );
}

function Modal({ title, onClose, children, wide = false, full = false }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean; full?: boolean;
}) {
  const { language, t } = useLanguage();
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`modal ${wide ? "modal-wide" : ""} ${full ? "modal-full" : ""}`} role="dialog" aria-modal="true"
        aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-handle" />
        <header className="modal-header">
          <h2>{title}</h2>
          <LanguageSwitcher />
          <button className="close-button" type="button" onClick={onClose} aria-label={t("close")}>×</button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Disclosure({ className, startOpen = false, children }: {
  className: string; startOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(startOpen);
  return <details className={className} open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>{children}</details>;
}

function PrintCols() {
  return <><col style={{ width: "8.5%" }} /><col style={{ width: "9.3%" }} /><col style={{ width: "4.5%" }} /><col style={{ width: "11.03%" }} /></>;
}

function TargetCrosshairIcon() {
  return <svg className="target-crosshair-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="7.2" /><circle cx="12" cy="12" r="4.2" /><path d="M12 1.5v21M1.5 12h21" /></svg>;
}

type PrintRow = { stationId?: string; continuationTargetId?: string; stationPoint?: string; instrumentHeight?: string; target?: Target };

const PRINT_ROWS_PER_PANEL = 30;
const PRINT_PANELS_PER_PAGE = 3;

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
    drawPdfFooter(doc, protocol, pageIndex, pages.length, language);
  });
  return doc;
}

async function downloadProtocolPdf(protocol: Protocol, language: Language) {
  const pdfWindow = window.open("", "_blank");
  const project = protocol.meta.project.trim().replace(/[<>:"/\\|?*\x00-\x1F]+/g, "_") || translate(language, "project");
  const filename = `Standpunktprotokoll_${project}_${protocol.meta.date || localDate()}.pdf`;
  let doc: jsPDF;
  try {
    const [fonts, logoDataUri] = await Promise.all([loadPdfFonts(), protocol.meta.showCompanyLogo ? loadAitLogoDataUri() : undefined]);
    doc = buildProtocolPdf(protocol, logoDataUri, language, fonts);
  } catch (error) {
    pdfWindow?.close();
    throw error;
  }
  if (pdfWindow) {
    const pdfUrl = URL.createObjectURL(doc.output("blob"));
    pdfWindow.location.href = pdfUrl;
    window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
  } else {
    doc.save(filename);
  }
}

async function shareProtocolPdf(protocol: Protocol, language: Language) {
  const project = protocol.meta.project.trim().replace(/[<>:"/\\|?*\x00-\x1F]+/g, "_") || translate(language, "project");
  const filename = `Standpunktprotokoll_${project}_${protocol.meta.date || localDate()}.pdf`;
  const logoDataUri = protocol.meta.showCompanyLogo ? await loadAitLogoDataUri() : undefined;
  const doc = buildProtocolPdf(protocol, logoDataUri, language, await loadPdfFonts());
  const file = new File([doc.output("blob")], filename, { type: "application/pdf" });
  const shareData: ShareData = { files: [file] };
  if (navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }
  doc.save(filename);
}

function PrintMetaField({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return <div className={`print-meta-field ${className}`}><b>{label}</b><span>{value || " "}</span></div>;
}

function PrintProtocol({ protocol }: { protocol: Protocol }) {
  const { language, t } = useLanguage();
  const pages = buildPrintPages(protocol, language);
  const pageMetadata = buildPageMetadata(protocol, pages);

  return (
    <div className="print-root" aria-hidden="true">
      {pages.map((page, pageIndex) => (
        <section className="print-page" key={`${protocol.id}-${pageIndex}`}>
          <header className="print-header">
            <h1>{t("appTitle")}</h1>
            <PrintMetaField className="print-project" label={t("project") + ":"} value={protocol.meta.project} />
            <PrintMetaField className="print-date" label={t("date") + ":"} value={formatDate(protocol.meta.date, language)} />
            <PrintMetaField className="print-instrument" label={t("instrument") + ":"} value={protocol.meta.instrument} />
            <PrintMetaField className="print-fp-status" label={t("fpStatus") + ":"} value={protocol.meta.fpSynced} />
            <PrintMetaField className="print-project-number" label={t("projectNumber") + ":"} value={protocol.meta.projectNumber} />
            <PrintMetaField className="print-time" label={t("time") + ":"} value={pageMetadata[pageIndex].meta.startTime} />
            <PrintMetaField className="print-crew" label={t("crew")} value={protocol.meta.crew} />
            <PrintMetaField className="print-fp-file" label={t("fpFile") + ":"} value={protocol.meta.fpFile} />
            <PrintMetaField className="print-temperature" label={t("temperature") + ":"} value={pageMetadata[pageIndex].meta.temperature ? `${pageMetadata[pageIndex].meta.temperature} °C` : ""} />
            <PrintMetaField className="print-pressure" label={t("pressure") + ":"} value={pageMetadata[pageIndex].meta.pressure ? `${pageMetadata[pageIndex].meta.pressure} hPa` : ""} />
            {protocol.meta.showCompanyLogo ? (
              <div className="print-brand" aria-label={`A.I.T. GmbH - ${t("companyCaption")}`}>
                <div className="print-logo" aria-hidden="true" />
                <span>{t("companyCaption")}</span>
              </div>
            ) : null}
          </header>
          <table className="print-table">
            <colgroup>{Array.from({ length: 3 }).map((_, index) => <PrintCols key={index} />)}</colgroup>
            <thead>
              <tr>{Array.from({ length: 3 }).flatMap((_, group) => [
                <th key={`${group}-sp`}>{t("stationHeader")}</th>, <th key={`${group}-zp`}>{t("target")}</th>,
                <th key={`${group}-zh`}>{t("targetHeight")}</th>, <th key={`${group}-be`}>{t("remark")}</th>,
              ])}</tr>
            </thead>
            <tbody>
              {Array.from({ length: PRINT_ROWS_PER_PANEL }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.from({ length: 3 }).flatMap((__, groupIndex) => {
                    const row = page[groupIndex]?.[rowIndex];
                    const target = row?.target;
                    return [
                      <td key={`${groupIndex}-sp`} className={row?.stationPoint ? "print-station-point" : ""}>{row?.stationPoint ?? row?.instrumentHeight ?? ""}</td>,
                      <td key={`${groupIndex}-zp`}>{target?.point ?? ""}</td>,
                      <td key={`${groupIndex}-zh`}>{target?.height ?? ""}</td>,
                      <td key={`${groupIndex}-be`}>{targetRemark(target, language)}</td>,
                    ];
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <footer className="print-footer"><span className="print-legend">{protocolLegendEntries(protocol, language).map((entry, index) => <span key={entry.abbreviation}>{index > 0 && " · "}<b>{entry.abbreviation}</b>{` - ${entry.description}`}</span>)}</span><span className="print-page-number">{t("pageNumber", {page: pageIndex + 1, total: pages.length})}</span></footer>
        </section>
      ))}
    </div>
  );
}

export default function Home() {
  return <LanguageProvider><HomeContent /></LanguageProvider>;
}

function HomeContent() {
  const { language, t } = useLanguage();
  const REMARK_CHOICES = useMemo(() => remarkChoices(language), [language]);
  const POINT_TYPE_CHOICES = useMemo(() => pointTypeChoices(language), [language]);
  const [store, setStore] = useState<Store>(() => createInitialStore());
  const [hydrated, setHydrated] = useState(false);
  const [online, setOnline] = useState(true);
  const [uiTheme, setUiTheme] = useState<UiTheme>("dark");
  const [offlineReady, setOfflineReady] = useState(false);
  const [targetSheet, setTargetSheet] = useState<TargetSheet | null>(null);
  const [targetForm, setTargetForm] = useState<TargetForm>(DEFAULT_TARGET_FORM);
  const [customRemarkMode, setCustomRemarkMode] = useState(false);
  const [protocolsOpen, setProtocolsOpen] = useState(false);
  const [valuesOpen, setValuesOpen] = useState(false);
  const [installHint, setInstallHint] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [instructionOpen, setInstructionOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<StoreSnapshot[]>([]);
  const [backupMessage, setBackupMessage] = useState<{key: MessageKey; params?: MessageParams} | null>(null);
  const [valueEdit, setValueEdit] = useState<SavedCombination | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(null);
  const [pdfActionsOpen, setPdfActionsOpen] = useState(false);
  const lastStationRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const snapshotTimerRef = useRef<number | null>(null);
  const lastSnapshotValueRef = useRef("");

  useEffect(() => {
    let active = true;
    void loadPdfFonts().catch(() => undefined);
    let initialTheme: UiTheme = "dark";
    try {
      initialTheme = localStorage.getItem(UI_THEME_KEY) === "light" ? "light" : "dark";
    } catch {
      // The default dark theme remains available if storage is restricted.
    }
    document.documentElement.dataset.theme = initialTheme;
    const themeFrame = window.requestAnimationFrame(() => {
      if (active) setUiTheme(initialTheme);
    });
    const installUrl = new URL(window.location.href);
    if (installUrl.searchParams.get("install") !== "v22") {
      installUrl.searchParams.set("install", "v22");
      window.history.replaceState(window.history.state, "", `${installUrl.pathname}${installUrl.search}${installUrl.hash}`);
    }
    void (async () => {
      let restored: Store | null = null;
      try {
        restored = await readIndexedDbStore();
      } catch {
        // localStorage remains a second independent copy on older Safari versions.
      }
      if (!restored) {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          restored = raw ? normalizeStore(JSON.parse(raw)) : null;
          if (restored) void writeIndexedDbStore(restored).catch(() => undefined);
        } catch {
          // A malformed local draft should never block field work.
        }
      }
      if (!active) return;
      if (restored) setStore(restored);
      setOnline(navigator.onLine);
      setHydrated(true);
      void navigator.storage?.persist?.().catch(() => false);
    })();
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(async () => {
        const registration = await navigator.serviceWorker.ready;
        setOfflineReady(true);
        const urls = performance.getEntriesByType("resource").map((entry) => entry.name)
          .filter((url) => url.startsWith(location.origin));
        registration.active?.postMessage({ type: "CACHE_URLS", urls });
      }).catch(() => setOfflineReady(false));
    }
    return () => {
      active = false;
      window.cancelAnimationFrame(themeFrame);
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.theme = uiTheme;
    try {
      localStorage.setItem(UI_THEME_KEY, uiTheme);
    } catch {
      // Theme switching still works for the current session.
    }
  }, [hydrated, uiTheme]);

  useEffect(() => {
    if (!hydrated) return;
    const serialized = JSON.stringify(store);
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // IndexedDB remains the primary store if Safari blocks this mirror.
    }
    void writeIndexedDbStore(store).catch(() => undefined);
    if (!hasMeaningfulData(store)) return;
    const snapshotValue = JSON.stringify({ ...store, lastBackupAt: undefined });
    if (snapshotValue === lastSnapshotValueRef.current) return;
    if (snapshotTimerRef.current) window.clearTimeout(snapshotTimerRef.current);
    snapshotTimerRef.current = window.setTimeout(() => {
      void saveSnapshot(store).then(() => {
        lastSnapshotValueRef.current = snapshotValue;
      }).catch(() => undefined);
    }, 1400);
    return () => {
      if (snapshotTimerRef.current) window.clearTimeout(snapshotTimerRef.current);
    };
  }, [hydrated, store]);

  const activeProtocol = store.protocols.find((protocol) => protocol.id === store.activeProtocolId) ?? store.protocols[0];
  const pointSuggestions = useMemo(() => uniqueValues(store.savedCombinations, "point"), [store.savedCombinations]);
  const heightSuggestions = useMemo(() => uniqueValues(store.savedCombinations, "height"), [store.savedCombinations]);
  const remarkSuggestions = useMemo(() => uniqueValues(store.savedCombinations, "remark"), [store.savedCombinations]);
  const remarkOptions = useMemo<Choice[]>(() => {
    const fixed = new Set(REMARK_CHOICES.map((option) => option.value.toLocaleLowerCase()));
    const previous = uniqueValues(store.savedCombinations, "remark")
      .filter((value) => !fixed.has(value.toLocaleLowerCase()))
      .map((value) => ({ value, label: value, detail: t("previous") }));
    return [...REMARK_CHOICES, ...previous, { value: CUSTOM_REMARK, label: t("other"), detail: t("enterRemark") }];
  }, [store.savedCombinations, REMARK_CHOICES, t]);
  const recentCombinations = useMemo(() => [...store.savedCombinations]
    .sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt)).slice(0, 12), [store.savedCombinations]);
  const backupNeeded = useMemo(() => {
    if (!hasMeaningfulData(store)) return false;
    if (!store.lastBackupAt) return true;
    return store.protocols.some((protocol) => protocol.updatedAt > store.lastBackupAt!);
  }, [store]);

  async function refreshSnapshots() {
    try {
      setSnapshots(await listSnapshots());
    } catch {
      setSnapshots([]);
    }
  }

  function openBackupCenter() {
    setProtocolsOpen(false);
    setBackupMessage(null);
    setBackupOpen(true);
    void refreshSnapshots();
  }

  async function exportBackup() {
    const createdAt = nowIso();
    const exportedStore: Store = { ...store, lastBackupAt: createdAt };
    const payload: BackupFile = { format: "standpunktprotokoll-backup", version: 1, createdAt, store: exportedStore };
    const file = new File([JSON.stringify(payload, null, 2)], backupFilename(), { type: "application/json" });
    try {
      const shareData: ShareData = { files: [file] };
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setStore((current) => ({ ...current, lastBackupAt: createdAt }));
      setBackupMessage({key: "backupCreated"});
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setBackupMessage({key: "backupFailed"});
    }
  }

  async function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as BackupFile | Store;
      const candidate = "format" in parsed && parsed.format === "standpunktprotokoll-backup" ? parsed.store : parsed;
      const restored = normalizeStore(candidate);
      if (!restored) throw new Error("Invalid backup");
      if (!window.confirm(t("restoreConfirm", {count: restored.protocols.length}))) return;
      await saveSnapshot(store).catch(() => undefined);
      setStore(restored);
      setBackupMessage({key: "restored", params: {count: restored.protocols.length}});
      void refreshSnapshots();
    } catch {
      setBackupMessage({key: "backupInvalid"});
    }
  }

  async function restoreSnapshot(snapshot: StoreSnapshot) {
    const restored = normalizeStore(snapshot.store);
    if (!restored) return;
    if (!window.confirm(t("snapshotConfirm", {date: formatBackupDate(snapshot.createdAt, language)}))) return;
    await saveSnapshot(store).catch(() => undefined);
    setStore(restored);
    setBackupMessage({key: "snapshotRestored", params: {date: formatBackupDate(snapshot.createdAt, language)}});
    void refreshSnapshots();
  }

  function updateActive(mutator: (protocol: Protocol) => Protocol) {
    setStore((current) => ({
      ...current,
      protocols: current.protocols.map((protocol) => protocol.id === current.activeProtocolId
        ? { ...mutator(protocol), updatedAt: nowIso() }
        : protocol),
    }));
  }

  function updateMeta<K extends keyof ProtocolMeta>(key: K, value: ProtocolMeta[K]) {
    updateActive((protocol) => ({ ...protocol, meta: { ...protocol.meta, [key]: value } }));
  }

  function updateStation(stationId: string, patch: Partial<Station>) {
    updateActive((protocol) => ({ ...protocol, stations: protocol.stations.map((station) =>
      station.id === stationId ? { ...station, ...patch } : station) }));
  }

  function addStation() {
    updateActive((protocol) => ({ ...protocol, stations: [...protocol.stations, createStation()] }));
    window.setTimeout(() => lastStationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function openNewTarget(stationId: string) {
    if (!stationId) return;
    const last = recentCombinations[0];
    setCustomRemarkMode(false);
    setTargetForm({
      ...DEFAULT_TARGET_FORM,
      height: last?.height ?? "",
    });
    setTargetSheet({ stationId });
  }

  function openEditTarget(stationId: string, target: Target) {
    setCustomRemarkMode(Boolean(target.remark && !remarkOptions.some((option) => option.value === target.remark)));
    setTargetForm({
      point: target.point, height: target.height, remark: target.remark, pointType: target.pointType,
      isBacksight: target.isBacksight, isConnectionPoint: target.isConnectionPoint,
    });
    setTargetSheet({ stationId, targetId: target.id });
  }

  function pickPoint(point: string) {
    const match = [...store.savedCombinations]
      .filter((item) => item.point.toLocaleLowerCase() === point.toLocaleLowerCase())
      .sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt))[0];
    setTargetForm((form) => ({
      ...form, point,
      height: match?.height ?? form.height,
      remark: match?.remark ?? form.remark,
      pointType: match?.pointType ?? form.pointType,
      isBacksight: match?.isBacksight ?? form.isBacksight,
      isConnectionPoint: match?.isConnectionPoint ?? form.isConnectionPoint,
    }));
    if (match?.remark) setCustomRemarkMode(!remarkOptions.some((option) => option.value === match.remark));
  }

  function selectRemark(remark: string) {
    if (remark === CUSTOM_REMARK) {
      setCustomRemarkMode(true);
      setTargetForm((form) => ({
        ...form,
        remark: REMARK_CHOICES.some((option) => option.value === form.remark) ? "" : form.remark,
      }));
      return;
    }
    setCustomRemarkMode(false);
    setTargetForm((form) => ({ ...form, remark }));
  }

  function saveTarget() {
    if (!targetSheet || !targetForm.point.trim()) return;
    const normalizedRemark = normalizeTargetRemark(targetForm.remark, targetForm.isBacksight, targetForm.isConnectionPoint);
    const cleaned: TargetForm = {
      ...targetForm, point: targetForm.point.trim(), height: normalizeHeight(targetForm.height),
      ...normalizedRemark,
    };
    const targetId = targetSheet.targetId;
    setStore((current) => ({
      ...current,
      savedCombinations: rememberCombination(current.savedCombinations, cleaned),
      protocols: current.protocols.map((protocol) => protocol.id === current.activeProtocolId ? {
        ...protocol, updatedAt: nowIso(),
        stations: protocol.stations.map((station) => station.id === targetSheet.stationId ? {
          ...station,
          targets: targetId
            ? station.targets.map((target) => target.id === targetId ? { ...target, ...cleaned } : target)
            : [...station.targets, { id: id(), ...cleaned, createdAt: nowIso() }],
        } : station),
      } : protocol),
    }));
    setTargetSheet(null);
  }

  function confirmRequestedDeletion() {
    if (!deleteRequest) return;
    void saveSnapshot(store).catch(() => undefined);
    if (deleteRequest.kind === "station") {
      updateActive((protocol) => ({
        ...protocol,
        stations: protocol.stations.filter((station) => station.id !== deleteRequest.stationId),
      }));
    } else if (deleteRequest.kind === "target") {
      updateActive((protocol) => ({ ...protocol, stations: protocol.stations.map((station) => station.id === deleteRequest.stationId
        ? { ...station, targets: station.targets.filter((target) => target.id !== deleteRequest.targetId) }
        : station) }));
    } else {
      setStore((current) => {
        const remaining = current.protocols.filter((protocol) => protocol.id !== deleteRequest.protocolId);
        if (remaining.length) return {
          ...current, protocols: remaining,
          activeProtocolId: current.activeProtocolId === deleteRequest.protocolId ? remaining[0].id : current.activeProtocolId,
        };
        const empty = createProtocol();
        return { ...current, protocols: [empty], activeProtocolId: empty.id };
      });
    }
    setDeleteRequest(null);
  }

  function startNewProtocol() {
    const next = createProtocol(activeProtocol);
    setStore((current) => ({ ...current, activeProtocolId: next.id, protocols: [next, ...current.protocols] }));
    setProtocolsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectProtocol(protocolId: string) {
    setStore((current) => ({ ...current, activeProtocolId: protocolId }));
    setProtocolsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteProtocol(protocolId: string) {
    const protocol = store.protocols.find((entry) => entry.id === protocolId);
    if (!protocol) return;
    setDeleteRequest({
      kind: "protocol", protocolId, label: protocolLabel(protocol, language),
      stationCount: protocol.stations.length, targetCount: countTargets(protocol),
    });
    setProtocolsOpen(false);
  }

  function printProtocol() {
    setStore((current) => ({ ...current, protocols: current.protocols.map((protocol) =>
      protocol.id === current.activeProtocolId ? {
        ...protocol, updatedAt: nowIso(),
      } : protocol) }));
    void downloadProtocolPdf(activeProtocol, language).catch(() => window.alert(t("pdfError")));
  }

  function shareProtocol() {
    void shareProtocolPdf(activeProtocol, language).catch(() => window.alert(t("pdfError")));
  }

  function saveEditedValue() {
    if (!valueEdit?.point.trim()) return;
    const normalizedRemark = normalizeTargetRemark(valueEdit.remark, valueEdit.isBacksight, valueEdit.isConnectionPoint);
    setStore((current) => ({ ...current, savedCombinations: current.savedCombinations.map((item) =>
      item.id === valueEdit.id ? {
        ...valueEdit, point: valueEdit.point.trim(), height: normalizeHeight(valueEdit.height),
        ...normalizedRemark,
        lastUsedAt: nowIso(),
      } : item) }));
    setValueEdit(null);
  }

  if (!hydrated || !activeProtocol) {
    return <main className="loading-screen"><div className="brand-mark" aria-hidden="true" /><p>{t("loading")}</p></main>;
  }

  return (
    <>
      <main className="app-shell">
        <header className="topbar">
          <div className="brand-row">
            <button type="button" className="brand-button" onClick={() => setAboutOpen(true)} aria-label={t("aboutAria")}>
              <span className="brand-mark" aria-hidden="true" />
            </button>
            <div><p className="eyebrow">{t("fieldLog")}</p><h1>{t("appTitle")}</h1></div>
          </div>
          <div className="status-row">
            <LanguageSwitcher />
            <span className={`status-dot ${online ? "online" : "offline"}`} />
            <span className="connection-status">{online ? (offlineReady ? t("offlineReady") : t("offlinePreparing")) : t("offline")}</span>
            <button type="button" className="theme-toggle"
              aria-label={uiTheme === "dark" ? t("enableLight") : t("enableDark")}
              title={uiTheme === "dark" ? t("light") : t("dark")}
              onClick={() => setUiTheme((theme) => theme === "dark" ? "light" : "dark")}>
              {uiTheme === "dark" ? (
                <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 15.4A8.5 8.5 0 0 1 8.6 4a8.5 8.5 0 1 0 11.4 11.4Z" /></svg>
              )}
            </button>
          </div>
          <div className="header-actions">
            <button type="button" className="quiet-button" onClick={() => setValuesOpen(true)}>{t("values")}</button>
            <button type="button" className="quiet-button" onClick={() => setProtocolsOpen(true)}>
              {t("protocols")} <span className="count-badge">{store.protocols.length}</span>
            </button>
            <button type="button" className="primary-small" onClick={startNewProtocol}>{t("new")}</button>
          </div>
        </header>

        {!offlineReady && online ? (
          <button type="button" className="install-card" onClick={() => setInstallHint(true)}>
            <span className="install-icon">↓</span>
            <span><b>{t("offlineSetup")}</b><small>{t("homeScreen")}</small></span>
            <span>›</span>
          </button>
        ) : null}

        {backupNeeded ? (
          <button type="button" className="backup-reminder" onClick={openBackupCenter}>
            <span className="backup-reminder-icon">↥</span>
            <span><b>{t("backupReminder")}</b><small>{t("backupReminderDetail")}</small></span>
            <span>›</span>
          </button>
        ) : null}

        <section className="protocol-hero">
          <div><p className="eyebrow">{t("currentProtocol")}</p><h2>{protocolLabel(activeProtocol, language)}</h2>
            <p>{formatDate(activeProtocol.meta.date, language)} · {countLabel(activeProtocol.stations.length, "station", language)} · {countLabel(countTargets(activeProtocol), "target", language)}</p></div>
          <span className="autosave">{t("autosave")}</span>
        </section>

        <Disclosure className="card project-card" startOpen>
          <summary>
            <span><span className="step-number">01</span><span><b>{t("projectData")}</b><small>{activeProtocol.meta.project || t("fillProject")}</small></span></span>
            <span className="chevron">⌄</span>
          </summary>
          <div className="form-grid">
            <Field label={t("project")} value={activeProtocol.meta.project} onChange={(value) => updateMeta("project", value)} placeholder={t("exampleProject")} />
            <Field label={t("projectNumber")} value={activeProtocol.meta.projectNumber} onChange={(value) => updateMeta("projectNumber", value)} placeholder={t("exampleNumber")} />
            <LocalizedDateTimeField key={`date-${activeProtocol.id}-${language}`} label={t("date")} kind="date" value={activeProtocol.meta.date} onChange={(value) => updateMeta("date", value)} />
            <LocalizedDateTimeField key={`time-${activeProtocol.id}-${language}`} label={t("start")} kind="time" value={activeProtocol.meta.startTime} onChange={(value) => updateMeta("startTime", value)} />
            <Field label={t("instrument")} value={activeProtocol.meta.instrument} onChange={(value) => updateMeta("instrument", value)} placeholder={t("exampleInstrument")} />
            <Field label={t("crew")} value={activeProtocol.meta.crew} onChange={(value) => updateMeta("crew", value)} placeholder={t("namesPlaceholder")} />
            <Field label={t("temperature") + " [°C]"} inputMode="decimal" value={activeProtocol.meta.temperature} onChange={(value) => updateMeta("temperature", value)} />
            <Field label={t("pressure") + " [hPa]"} inputMode="decimal" value={activeProtocol.meta.pressure} onChange={(value) => updateMeta("pressure", value)} />
            <Field label={t("fpStatus")} value={activeProtocol.meta.fpSynced} onChange={(value) => updateMeta("fpSynced", value)} placeholder={t("statusPlaceholder")} />
            <Field label={t("fpFile")} value={activeProtocol.meta.fpFile} onChange={(value) => updateMeta("fpFile", value)} placeholder={t("filePlaceholder")} />
            <label className="check-field pdf-logo-field">
              <input type="checkbox" checked={activeProtocol.meta.showCompanyLogo} onChange={(event) => updateMeta("showCompanyLogo", event.target.checked)} />
              <span><b>{t("showLogo")}</b><small>{t("logoDetail")}</small></span>
            </label>
          </div>
        </Disclosure>

        <section className="stations-section">
          <div className="section-heading">
            <div><span className="step-number">02</span><span><h2>{t("stations")}</h2><p>{t("stationDetail")}</p></span></div>
            <button className="secondary-button desktop-add" type="button" onClick={addStation}>{t("newStation")}</button>
          </div>
          <div className="station-list">
            {activeProtocol.stations.map((station, stationIndex) => (
              <div ref={stationIndex === activeProtocol.stations.length - 1 ? lastStationRef : undefined} key={station.id}>
                <Disclosure className="card station-card" startOpen={stationIndex === activeProtocol.stations.length - 1}>
                  <summary>
                    <span className="station-summary"><span className="station-index">{String(stationIndex + 1).padStart(2, "0")}</span>
                      <span><b>{station.point || `${t("station")} ${stationIndex + 1}`}</b><small>{countLabel(station.targets.length, "target", language)}</small></span>
                    </span><span className="chevron">⌄</span>
                  </summary>
                  <div className="station-content">
                    <div className="station-fields">
                      <SuggestionField label={t("station")} value={station.point} onChange={(value) => updateStation(station.id, { point: value })} suggestions={protocolPointSuggestions(activeProtocol.stations, station.id)} maxSuggestions={Infinity} placeholder={t("pointPlaceholder")} />
                      <SuggestionField label={t("instrumentHeight")} inputMode="decimal" value={station.instrumentHeight} onChange={(value) => updateStation(station.id, { instrumentHeight: normalizeHeight(value) })} suggestions={lastInstrumentHeightSuggestions(activeProtocol.stations, station.id, station.point)} placeholder={t("heightPlaceholder")} />
                      <LocalizedDateTimeField key={`station-time-${station.id}-${language}`} label={t("stationTime")} kind="time" value={station.startTime ?? ""} onChange={(value) => updateStation(station.id, { startTime: value })} />
                    </div>
                    <div className="targets-header">
                      <div><h3>{t("targets")}</h3><p>{t("targetColumns")}</p></div>
                      <button type="button" className="primary-small add-target-action" onClick={() => openNewTarget(station.id)}>{t("add")}</button>
                    </div>
                    {station.targets.length ? (
                      <ol className="target-list">
                        {station.targets.map((target, targetIndex) => (
                          <li key={target.id}>
                            <span className="target-number">{String(targetIndex + 1).padStart(2, "0")}</span>
                            <button className="target-main" type="button" onClick={() => openEditTarget(station.id, target)}>
                              <b className="target-name">{target.point}{target.isBacksight ? <em className="rb-badge">{abbreviation("RB", language)}</em> : null}{target.isConnectionPoint ? <em className="ap-badge">{abbreviation("AP", language)}</em> : null}{target.pointType ? <em className="point-type-badge">{abbreviation(target.pointType, language)}</em> : null}</b><span>h {target.height || "—"} m · {prismAbbreviation(target.remark, language) || t("noRemark")}</span>
                            </button>
                            <button className="row-action" type="button" onClick={() => openEditTarget(station.id, target)}>{t("edit")}</button>
                            <button className="row-action danger" type="button" onClick={() => setDeleteRequest({
                              kind: "target", stationId: station.id, targetId: target.id,
                              label: target.point || `${t("target")} ${targetIndex + 1}`,
                              stationLabel: station.point || `${t("station")} ${stationIndex + 1}`,
                            })} aria-label={t("deleteItem", {name: target.point})}>×</button>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <button type="button" className="empty-targets desktop-empty-target-action" onClick={() => openNewTarget(station.id)}>
                        <span>＋</span><b>{t("firstTarget")}</b><small>{t("firstTargetDetail")}</small>
                      </button>
                    )}
                    {!station.targets.length ? (
                      <div className="empty-targets mobile-empty-state" aria-hidden="true">
                        <span>◎</span><b>{t("noTargets")}</b><small>{t("bottomTargetHint")}</small>
                      </div>
                    ) : null}
                    <div className="station-footer"><button type="button" className="text-danger" onClick={() => setDeleteRequest({
                      kind: "station", stationId: station.id,
                      label: station.point || `${t("station")} ${stationIndex + 1}`,
                      targetCount: station.targets.length,
                    })}>{t("deleteStation")}</button><span>{t("changesSaved")}</span></div>
                  </div>
                </Disclosure>
              </div>
            ))}
          </div>
        </section>

        <section className="pdf-card">
          <div className="pdf-preview-icon"><span>PDF</span></div>
          <div><p className="eyebrow">{t("officeReady")}</p><h2>{t("appTitle")} A4</h2><p>{t("pdfDetail")}</p></div>
          <button type="button" className="primary-button" onClick={() => setPdfActionsOpen(true)}>PDF</button>
        </section>
        <div className="bottom-spacer" />
      </main>

      <nav className="bottom-bar" aria-label={t("quickActions")}>
        <button type="button" onClick={addStation}><span>＋</span>{t("station")}</button>
        <button type="button" className="bottom-primary" onClick={() => openNewTarget(activeProtocol.stations.at(-1)?.id ?? "")} disabled={!activeProtocol.stations.length}><span><TargetCrosshairIcon /></span>{t("target")}</button>
        <button type="button" onClick={() => setPdfActionsOpen(true)}><span>▤</span>PDF</button>
      </nav>

      {pdfActionsOpen ? (
        <Modal title={t("pdfRecord")} onClose={() => setPdfActionsOpen(false)}>
          <div className="modal-scroll pdf-choice-list">
            {buildPageMetadata(activeProtocol).length > 1 ? <section className="page-weather-review">
              <h3>{t("pageWeather")}</h3><p>{t("pageWeatherHint")}</p>
              {buildPageMetadata(activeProtocol).slice(1).map((sheet, index, following) => (
                <fieldset className="page-weather-fields" key={sheet.key}>
                  <legend>{t("pageNumber", { page: index + 2, total: following.length + 1 })}{` · ${t("station")}: ${sheet.station?.point || "—"}`}</legend>
                  <LocalizedDateTimeField key={`sheet-time-${sheet.key}-${language}`} label={t("stationTime")} kind="time" value={sheet.meta.startTime} onChange={(value) => { if (sheet.station) updateStation(sheet.station.id, { startTime: value }); }} />
                  <Field label={t("temperature") + " [°C]"} inputMode="decimal" value={sheet.meta.temperature} onChange={(value) => updateActive(protocol => ({ ...protocol, pageConditions: { ...protocol.pageConditions, [sheet.key]: { ...protocol.pageConditions?.[sheet.key], temperature: value } } }))} />
                  <Field label={t("pressure") + " [hPa]"} inputMode="decimal" value={sheet.meta.pressure} onChange={(value) => updateActive(protocol => ({ ...protocol, pageConditions: { ...protocol.pageConditions, [sheet.key]: { ...protocol.pageConditions?.[sheet.key], pressure: value } } }))} />
                </fieldset>
              ))}
            </section> : null}
            <button type="button" className="pdf-choice-button" onClick={() => { setPdfActionsOpen(false); printProtocol(); }}><span>▤</span><b>{t("viewPrint")}</b><small>{t("viewPrintDetail")}</small></button>
            <button type="button" className="pdf-choice-button" onClick={() => { setPdfActionsOpen(false); shareProtocol(); }}><span>↗</span><b>{t("saveShare")}</b><small>{t("saveShareDetail")}</small></button>
          </div>
        </Modal>
      ) : null}

      {targetSheet ? (
        <Modal title={targetSheet.targetId ? t("editTarget") : t("newTarget")} onClose={() => setTargetSheet(null)}>
          <div className="modal-scroll">
            {recentCombinations.length ? (
              <div className="recent-block"><p>{t("recent")}</p><div className="recent-chips">
                {recentCombinations.map((item) => (
                  <button type="button" key={item.id} onClick={() => {
                    setCustomRemarkMode(false);
                    setTargetForm({
                      point: item.point, height: item.height, remark: item.remark, pointType: item.pointType,
                      isBacksight: item.isBacksight, isConnectionPoint: item.isConnectionPoint,
                    });
                  }}>
                    <b>{item.point}{item.isBacksight ? <em className="rb-badge">{abbreviation("RB", language)}</em> : null}{item.isConnectionPoint ? <em className="ap-badge">{abbreviation("AP", language)}</em> : null}{item.pointType ? <em className="point-type-badge">{abbreviation(item.pointType, language)}</em> : null}</b><span>{item.height || "—"} · {prismAbbreviation(item.remark, language) || t("noRemark")}</span>
                  </button>
                ))}
              </div></div>
            ) : null}
            <div className="target-form">
              <SuggestionField label={t("target")} value={targetForm.point} onChange={(point) => setTargetForm((form) => ({ ...form, point }))} onPick={pickPoint} suggestions={pointSuggestions} placeholder={t("pointPlaceholder")} />
              <SelectField label={t("pointType")} value={targetForm.pointType} onChange={(pointType) => setTargetForm((form) => ({ ...form, pointType }))} options={POINT_TYPE_CHOICES} placeholder={t("noPointType")} />
              <SuggestionField label={t("targetHeightUnit")} inputMode="decimal" value={targetForm.height} onChange={(height) => setTargetForm((form) => ({ ...form, height }))} suggestions={heightSuggestions} placeholder={t("exampleHeight")} />
              <label className="check-field rb-check-field">
                <input type="checkbox" checked={targetForm.isBacksight} onChange={(event) => setTargetForm((form) => ({ ...form, isBacksight: event.target.checked, isConnectionPoint: event.target.checked ? false : form.isConnectionPoint }))} />
                <span><b>{abbreviation("RB", language)} · {t("backsight")}</b><small>{t("rbHint")}</small></span>
              </label>
              <label className="check-field ap-check-field">
                <input type="checkbox" checked={targetForm.isConnectionPoint} onChange={(event) => setTargetForm((form) => ({ ...form, isConnectionPoint: event.target.checked, isBacksight: event.target.checked ? false : form.isBacksight }))} />
                <span><b>{abbreviation("AP", language)} · {t("connection")}</b><small>{t("apHint")}</small></span>
              </label>
              <SelectField label={t("prismSelection")} value={customRemarkMode ? CUSTOM_REMARK : targetForm.remark} onChange={selectRemark} options={remarkOptions} />
              {customRemarkMode ? (
                <SuggestionField label={t("customRemark")} value={targetForm.remark} onChange={(remark) => setTargetForm((form) => ({ ...form, remark }))} suggestions={remarkSuggestions} placeholder={t("remarkPlaceholder")} />
              ) : null}
            </div>
          </div>
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setTargetSheet(null)}>{t("cancel")}</button><button type="button" className="primary-button" disabled={!targetForm.point.trim()} onClick={saveTarget}>{t("saveTarget")}</button></div>
        </Modal>
      ) : null}

      {deleteRequest ? (
        <Modal title={deleteRequest.kind === "station" ? t("deleteStationTitle") : deleteRequest.kind === "target" ? t("deleteTargetTitle") : t("deleteProtocolTitle")} onClose={() => setDeleteRequest(null)}>
          <div className="delete-confirmation">
            <span className="delete-warning" aria-hidden="true">!</span>
            <div>
              <b>{deleteRequest.label}</b>
              <p>{deleteRequest.kind === "station"
                ? t("deleteStationBody", {count: deleteRequest.targetCount})
                : deleteRequest.kind === "target"
                  ? t("deleteTargetBody", {name: deleteRequest.stationLabel})
                  : t("deleteProtocolBody", {stations: deleteRequest.stationCount, targets: deleteRequest.targetCount})}</p>
              <small>{t("beforeDelete")}</small>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={() => setDeleteRequest(null)}>{t("cancel")}</button>
            <button type="button" className="primary-button confirm-danger" onClick={confirmRequestedDeletion}>{t("delete")}</button>
          </div>
        </Modal>
      ) : null}

      {protocolsOpen ? (
        <Modal title={t("protocols")} onClose={() => setProtocolsOpen(false)} wide>
          <div className="modal-scroll protocol-browser">
            <button className="backup-entry-card" type="button" onClick={openBackupCenter}>
              <span>↥</span><b>{t("dataProtection")}</b><small>{t("backupSummary")} · {formatBackupDate(store.lastBackupAt, language)}</small><em>›</em>
            </button>
            <button className="new-protocol-card" type="button" onClick={startNewProtocol}><span>＋</span><b>{t("newProtocol")}</b><small>{t("carryHint")}</small></button>
            {[...store.protocols].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((protocol) => (
              <article className={`protocol-row ${protocol.id === activeProtocol.id ? "active" : ""}`} key={protocol.id}>
                <button type="button" className="protocol-select" onClick={() => selectProtocol(protocol.id)}><b>{protocolLabel(protocol, language)}</b><span>{formatDate(protocol.meta.date, language)} · {countLabel(protocol.stations.length, "station", language)} · {countLabel(countTargets(protocol), "target", language)}</span></button>
                {protocol.id === activeProtocol.id ? <span className="active-label">{t("active")}</span> : null}
                <button type="button" className="row-action danger" onClick={() => deleteProtocol(protocol.id)} aria-label={t("deleteProtocol")}>×</button>
              </article>
            ))}
          </div>
        </Modal>
      ) : null}

      {backupOpen ? (
        <Modal title={t("dataProtection")} onClose={() => setBackupOpen(false)} wide>
          <div className="modal-scroll backup-center">
            <section className="backup-status-card">
              <span className="backup-shield" aria-hidden="true">✓</span>
              <div><b>{t("localStorageTitle")}</b><p>{t("localStorageDetail")}</p></div>
            </section>

            <section className="backup-section">
              <div className="backup-section-heading"><div><h3>{t("fileBackup")}</h3><p>{t("lastBackup")}: {formatBackupDate(store.lastBackupAt, language)}</p></div></div>
              <div className="backup-actions">
                <button type="button" className="primary-button" onClick={() => void exportBackup()}>{t("createBackup")}</button>
                <button type="button" className="secondary-button" onClick={() => importInputRef.current?.click()}>{t("restoreFile")}</button>
              </div>
              <input ref={importInputRef} className="visually-hidden" type="file" accept=".json,application/json" onChange={(event) => void importBackup(event)} />
              <small className="backup-explainer">{t("backupExplainer")}</small>
            </section>

            {backupMessage ? <p className="backup-message" role="status">{t(backupMessage.key, backupMessage.params)}</p> : null}

            <section className="backup-section">
              <div className="backup-section-heading"><div><h3>{t("snapshots")}</h3><p>{t("snapshotLimit", {count: MAX_SNAPSHOTS})}</p></div><span>{snapshots.length}</span></div>
              {snapshots.length ? (
                <div className="snapshot-list">
                  {snapshots.map((snapshot) => (
                    <article key={snapshot.id}>
                      <div><b>{formatBackupDate(snapshot.createdAt, language)}</b><span>{countLabel(snapshot.store.protocols.length, "protocol", language)} · {countLabel(snapshot.store.protocols.reduce((sum, protocol) => sum + countTargets(protocol), 0), "target", language)}</span></div>
                      <button type="button" className="row-action" onClick={() => void restoreSnapshot(snapshot)}>{t("restore")}</button>
                    </article>
                  ))}
                </div>
              ) : <p className="empty-snapshots">{t("noSnapshots")}</p>}
            </section>
          </div>
        </Modal>
      ) : null}

      {valuesOpen ? (
        <Modal title={t("valueDirectory")} onClose={() => { setValuesOpen(false); setValueEdit(null); }} wide>
          <div className="modal-scroll values-browser">
            <p className="helper-text">{t("valueHint")}</p>
            {valueEdit ? (
              <div className="value-editor">
                <Field label={t("target")} value={valueEdit.point} onChange={(point) => setValueEdit({ ...valueEdit, point })} />
                <SelectField label={t("pointType")} value={valueEdit.pointType} onChange={(pointType) => setValueEdit({ ...valueEdit, pointType })} options={POINT_TYPE_CHOICES} placeholder={t("noPointType")} />
                <Field label={t("targetHeightUnit")} inputMode="decimal" value={valueEdit.height} onChange={(height) => setValueEdit({ ...valueEdit, height })} />
                <label className="check-field rb-check-field">
                  <input type="checkbox" checked={valueEdit.isBacksight} onChange={(event) => setValueEdit({ ...valueEdit, isBacksight: event.target.checked, isConnectionPoint: event.target.checked ? false : valueEdit.isConnectionPoint })} />
                  <span><b>{abbreviation("RB", language)} · {t("backsight")}</b><small>{t("rememberRb")}</small></span>
                </label>
                <label className="check-field ap-check-field">
                  <input type="checkbox" checked={valueEdit.isConnectionPoint} onChange={(event) => setValueEdit({ ...valueEdit, isConnectionPoint: event.target.checked, isBacksight: event.target.checked ? false : valueEdit.isBacksight })} />
                  <span><b>{abbreviation("AP", language)} · {t("connection")}</b><small>{t("rememberAp")}</small></span>
                </label>
                <SelectField label={t("remark")} value={remarkOptions.some((option) => option.value === valueEdit.remark) ? valueEdit.remark : CUSTOM_REMARK} onChange={(remark) => {
                  if (remark === CUSTOM_REMARK) {
                    setValueEdit({ ...valueEdit, remark: REMARK_CHOICES.some((option) => option.value === valueEdit.remark) ? "" : valueEdit.remark });
                    return;
                  }
                  setValueEdit({ ...valueEdit, remark });
                }} options={remarkOptions} />
                {!remarkOptions.some((option) => option.value === valueEdit.remark) ? <Field label={t("customRemark")} value={valueEdit.remark} onChange={(remark) => setValueEdit({ ...valueEdit, remark })} /> : null}
                <div className="inline-actions"><button className="secondary-button" type="button" onClick={() => setValueEdit(null)}>{t("cancel")}</button><button className="primary-button" type="button" onClick={saveEditedValue}>{t("save")}</button></div>
              </div>
            ) : null}
            {store.savedCombinations.length ? (
              <div className="saved-list">
                {[...store.savedCombinations].sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt)).map((item) => (
                  <article key={item.id}>
                    <button type="button" onClick={() => setValueEdit({ ...item })}><b>{item.point}{item.isBacksight ? <em className="rb-badge">{abbreviation("RB", language)}</em> : null}{item.isConnectionPoint ? <em className="ap-badge">{abbreviation("AP", language)}</em> : null}{item.pointType ? <em className="point-type-badge">{abbreviation(item.pointType, language)}</em> : null}</b><span>h {item.height || "—"} m · {prismAbbreviation(item.remark, language) || t("noRemark")}</span></button>
                    <span className="usage-count">×{item.useCount}</span><button className="row-action" type="button" onClick={() => setValueEdit({ ...item })}>{t("edit")}</button>
                    <button className="row-action danger" type="button" aria-label={t("deleteItem", {name: item.point})} onClick={() => setStore((current) => ({ ...current, savedCombinations: current.savedCombinations.filter((entry) => entry.id !== item.id) }))}>×</button>
                  </article>
                ))}
              </div>
            ) : <div className="empty-library"><span>◎</span><b>{t("emptyValues")}</b><p>{t("emptyValuesHint")}</p></div>}
          </div>
        </Modal>
      ) : null}

      {installHint ? (
        <Modal title={t("offlineIphone")} onClose={() => setInstallHint(false)}>
          <div className="install-steps">
            {(["iphone1", "iphone2", "iphone3", "offlineInstall"] as const).map((key,index) => <div key={key}><span>{index+1}</span><p>{t(key)}</p></div>)}
          </div>
          <div className="modal-actions single"><button type="button" className="primary-button" onClick={() => setInstallHint(false)}>{t("understood")}</button></div>
        </Modal>
      ) : null}

      {aboutOpen ? (
        <Modal title={t("about")} onClose={() => setAboutOpen(false)}>
          <div className="modal-scroll about-app">
            <div className="about-brand"><span className="brand-mark" aria-hidden="true" /><div><h3>{t("appTitle")}</h3><p>{t("version", {version: "1.1.0"})}</p></div></div>
            <section><h4>1. {t("about")}</h4><p>{t("author")}</p><p className="copyright">{t("copyright")}</p><p>{t("usageTerms")}</p><p>{t("restrictions")}</p></section>
            <section className="about-action-section"><h4>2. {t("instructions")}</h4><p>{t("instructionIntro")}</p><button type="button" className="primary-button" onClick={() => { setAboutOpen(false); setInstructionOpen(true); }}>{t("openInstructions")}</button></section>
            <section><h4>3. {t("install")}</h4><p><b>iPhone:</b> {t("iphoneInstall")}</p><p><b>Android:</b> {t("androidInstall")}</p><p>{t("offlineInstall")}</p></section>
          </div>
          <div className="modal-actions single"><button type="button" className="primary-button" onClick={() => setAboutOpen(false)}>{t("close")}</button></div>
        </Modal>
      ) : null}

      {instructionOpen ? (
        <Modal title={t("instructions")} onClose={() => setInstructionOpen(false)} full>
          <InstructionGuide />
          <div className="modal-actions single"><button type="button" className="primary-button" onClick={() => setInstructionOpen(false)}>{t("closeInstructions")}</button></div>
        </Modal>
      ) : null}

      <PrintProtocol protocol={activeProtocol} />
    </>
  );
}
