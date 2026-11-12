"use client";

import { assetUrl } from "./asset-url";

import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { LanguageProvider, LanguageSwitcher, useLanguage } from "./i18n-context";
import { InstructionGuide } from "./instructions";
import { protocolPointSuggestions, lastInstrumentHeightSuggestions } from "./protocol-points";
import { abbreviation, prismAbbreviation, formatDate, formatBackupDate, countLabel, translate, LOCALES, remarkChoices, pointTypeChoices, type Language, type MessageKey, type MessageParams } from "./i18n";
import { loadPdfFonts } from "./pdf-fonts";
import { buildPageMetadata, buildPrintPages, PRINT_ROWS_PER_PANEL, protocolLegendEntries, targetRemark, type CompanyLogo, type CustomPointType, type Protocol, type ProtocolMeta, type Station, type Target } from "./protocol-print";

const loadProtocolPdf = () => import("./protocol-pdf");

type SavedCombination = {
  id: string; point: string; height: string; remark: string; pointType: string;
  isBacksight: boolean; isConnectionPoint: boolean; useCount: number; lastUsedAt: string;
};
type Store = {
  version: 1; activeProtocolId: string; protocols: Protocol[]; savedCombinations: SavedCombination[]; lastBackupAt?: string;
  customPointTypes?: CustomPointType[]; companyLogo?: CompanyLogo;
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
type ThemeChoice = UiTheme | "auto";

const CUSTOM_REMARK = "__custom__";
const CUSTOM_POINT_TYPE = "__custom_point_type__";
const LOGO_MAX_PX = 900;
const APP_VERSION = "1.2.0";

function normalizeCustomPointTypes(value: unknown): CustomPointType[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item) => {
    const code = typeof item?.code === "string" ? item.code.trim() : "";
    if (!code || seen.has(code)) return [];
    seen.add(code);
    return [{ code, detail: typeof item.detail === "string" ? item.detail.trim() : "" }];
  });
}

function normalizeCompanyLogo(value: unknown): CompanyLogo | undefined {
  const logo = value as Partial<CompanyLogo> | undefined;
  if (!logo || typeof logo.dataUri !== "string" || !logo.dataUri.startsWith("data:image/png")) return undefined;
  const width = Number(logo.width), height = Number(logo.height);
  if (!(width > 0 && height > 0)) return undefined;
  return { dataUri: logo.dataUri, width, height, caption: typeof logo.caption === "string" ? logo.caption : "" };
}

/** Adds a point type, or updates its description; an empty description never wipes an existing one. */
function upsertCustomPointType(items: CustomPointType[], next: CustomPointType): CustomPointType[] {
  const existing = items.find((item) => item.code === next.code);
  if (!existing) return [...items, next];
  if (!next.detail) return items;
  return items.map((item) => item.code === next.code ? next : item);
}

/** Reads any image the browser can decode and re-encodes it as a PNG of at most LOGO_MAX_PX. */
async function readLogoFile(file: File): Promise<CompanyLogo> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("logo"));
      element.src = url;
    });
    const scale = Math.min(1, LOGO_MAX_PX / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("logo");
    context.drawImage(image, 0, 0, width, height);
    return { dataUri: canvas.toDataURL("image/png"), width, height, caption: "" };
  } finally {
    URL.revokeObjectURL(url);
  }
}

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
const PERSIST_DELAY_MS = 300;

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
    customPointTypes: normalizeCustomPointTypes(parsed.customPointTypes),
    companyLogo: normalizeCompanyLogo(parsed.companyLogo),
  };
}

let databasePromise: Promise<IDBDatabase> | null = null;

// One connection serves every autosave instead of reopening the database per keystroke.
function openAppDatabase() {
  if (!databasePromise) databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STATE_STORE)) database.createObjectStore(STATE_STORE);
      if (!database.objectStoreNames.contains(SNAPSHOT_STORE)) database.createObjectStore(SNAPSHOT_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => {
      const database = request.result;
      const forget = () => { databasePromise = null; };
      database.onversionchange = () => { database.close(); forget(); };
      database.onclose = forget;
      resolve(database);
    };
    request.onerror = () => reject(request.error ?? new Error("IndexedDB unavailable"));
  }).catch((error) => {
    databasePromise = null;
    throw error;
  });
  return databasePromise;
}

async function readIndexedDbStore() {
  const database = await openAppDatabase();
  return new Promise<Store | null>((resolve, reject) => {
    const transaction = database.transaction(STATE_STORE, "readonly");
    const request = transaction.objectStore(STATE_STORE).get(STORE_RECORD_KEY);
    request.onsuccess = () => resolve(normalizeStore(request.result));
    request.onerror = () => reject(request.error ?? new Error("Stored protocol could not be read"));
  });
}

async function writeIndexedDbStore(store: Store) {
  const database = await openAppDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STATE_STORE, "readwrite");
    transaction.objectStore(STATE_STORE).put(store, STORE_RECORD_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => { reject(transaction.error ?? new Error("Protocol could not be stored")); };
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
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => { reject(transaction.error ?? new Error("Snapshot could not be stored")); };
  });
}

async function listSnapshots() {
  const database = await openAppDatabase();
  return new Promise<StoreSnapshot[]>((resolve, reject) => {
    const transaction = database.transaction(SNAPSHOT_STORE, "readonly");
    const request = transaction.objectStore(SNAPSHOT_STORE).getAll();
    request.onsuccess = () => resolve((request.result as StoreSnapshot[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    request.onerror = () => reject(request.error ?? new Error("Snapshots could not be read"));
  });
}

let pendingStore: Store | null = null;

function flushPendingStore() {
  const store = pendingStore;
  if (!store) return;
  pendingStore = null;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // IndexedDB remains the primary store if Safari blocks this mirror.
  }
  void writeIndexedDbStore(store).catch(() => undefined);
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


function Field({ label, value, onChange, type = "text", inputMode, placeholder }: {
  label: string; value: string; onChange: (value: string) => void; type?: string;
  inputMode?: "text" | "decimal" | "numeric"; placeholder?: string;
}) {
  const { language } = useLanguage();
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
  const { t } = useLanguage();
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
  const { t } = useLanguage();
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
  const { t } = useLanguage();
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


function pdfFilename(protocol: Protocol, language: Language) {
  const project = protocol.meta.project.trim().replace(/[<>:"/\\|?*\x00-\x1F]+/g, "_") || translate(language, "project");
  return `Standpunktprotokoll_${project}_${protocol.meta.date || localDate()}.pdf`;
}

async function createProtocolPdf(protocol: Protocol, language: Language) {
  const { buildProtocolPdf, loadAitLogoDataUri } = await loadProtocolPdf();
  const [fonts, logoDataUri] = await Promise.all([loadPdfFonts(), protocol.meta.showCompanyLogo && !protocol.companyLogo ? loadAitLogoDataUri() : undefined]);
  return buildProtocolPdf(protocol, logoDataUri, language, fonts);
}

async function downloadProtocolPdf(protocol: Protocol, language: Language) {
  const pdfWindow = window.open("", "_blank");
  let doc: Awaited<ReturnType<typeof createProtocolPdf>>;
  try {
    doc = await createProtocolPdf(protocol, language);
  } catch (error) {
    pdfWindow?.close();
    throw error;
  }
  if (pdfWindow) {
    const pdfUrl = URL.createObjectURL(doc.output("blob"));
    pdfWindow.location.href = pdfUrl;
    window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
  } else {
    doc.save(pdfFilename(protocol, language));
  }
}

async function shareProtocolPdf(protocol: Protocol, language: Language) {
  const filename = pdfFilename(protocol, language);
  const doc = await createProtocolPdf(protocol, language);
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

// Hidden until the browser prints; memoized so typing does not rebuild every sheet.
const PrintProtocol = memo(function PrintProtocol({ protocol }: { protocol: Protocol }) {
  const { language, t } = useLanguage();
  const pages = buildPrintPages(protocol, language);
  const pageMetadata = buildPageMetadata(protocol, pages);
  const legendEntries = protocolLegendEntries(protocol, language);

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
            {protocol.meta.showCompanyLogo && protocol.companyLogo ? (
              <div className="print-brand print-brand-custom">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="print-logo-custom" src={protocol.companyLogo.dataUri} alt="" />
                {protocol.companyLogo.caption.trim() ? <span>{protocol.companyLogo.caption}</span> : null}
              </div>
            ) : protocol.meta.showCompanyLogo ? (
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
          <footer className="print-footer"><span className="print-legend">{legendEntries.map((entry, index) => <span key={entry.abbreviation}>{index > 0 && " · "}<b>{entry.abbreviation}</b>{` - ${entry.description}`}</span>)}</span><span className="print-page-number">{t("pageNumber", {page: pageIndex + 1, total: pages.length})}</span></footer>
        </section>
      ))}
    </div>
  );
});

export default function Home() {
  return <LanguageProvider><HomeContent /></LanguageProvider>;
}

function HomeContent() {
  const { language, t } = useLanguage();
  const REMARK_CHOICES = useMemo(() => remarkChoices(language), [language]);
  const POINT_TYPE_CHOICES = useMemo(() => pointTypeChoices(language), [language]);
  const [store, setStore] = useState<Store>(() => createInitialStore());
  const [hydrated, setHydrated] = useState(false);
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>("auto");
  const [systemDark, setSystemDark] = useState(true);
  const uiTheme: UiTheme = themeChoice === "auto" ? (systemDark ? "dark" : "light") : themeChoice;
  const [menuOpen, setMenuOpen] = useState(false);
  const [targetSheet, setTargetSheet] = useState<TargetSheet | null>(null);
  const [targetForm, setTargetForm] = useState<TargetForm>(DEFAULT_TARGET_FORM);
  const [customRemarkMode, setCustomRemarkMode] = useState(false);
  const [customPointTypeMode, setCustomPointTypeMode] = useState(false);
  const [customPointTypeDetail, setCustomPointTypeDetail] = useState("");
  const [logoError, setLogoError] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [protocolsOpen, setProtocolsOpen] = useState(false);
  const [valuesOpen, setValuesOpen] = useState(false);
  const [instructionOpen, setInstructionOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<StoreSnapshot[]>([]);
  const [backupMessage, setBackupMessage] = useState<{key: MessageKey; params?: MessageParams} | null>(null);
  const [valueEdit, setValueEdit] = useState<SavedCombination | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(null);
  const [pdfActionsOpen, setPdfActionsOpen] = useState(false);
  const lastStationRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const lastSnapshotValueRef = useRef("");

  useEffect(() => {
    let active = true;
    void loadPdfFonts().catch(() => undefined);
    void loadProtocolPdf().catch(() => undefined);
    let initialChoice: ThemeChoice = "auto";
    try {
      const stored = localStorage.getItem(UI_THEME_KEY);
      if (stored === "light" || stored === "dark") initialChoice = stored;
    } catch {
      // "Auto" (follow the phone) remains available if storage is restricted.
    }
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const initialTheme: UiTheme = initialChoice === "auto" ? (darkQuery.matches ? "dark" : "light") : initialChoice;
    document.documentElement.dataset.theme = initialTheme;
    const themeFrame = window.requestAnimationFrame(() => {
      if (!active) return;
      setThemeChoice(initialChoice);
      setSystemDark(darkQuery.matches);
    });
    const followSystemTheme = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    darkQuery.addEventListener("change", followSystemTheme);
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
      setHydrated(true);
      void navigator.storage?.persist?.().catch(() => false);
    })();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(assetUrl("/sw.js")).then(async () => {
        const registration = await navigator.serviceWorker.ready;
        const urls = performance.getEntriesByType("resource").map((entry) => entry.name)
          .filter((url) => url.startsWith(location.origin));
        registration.active?.postMessage({ type: "CACHE_URLS", urls });
      }).catch(() => undefined);
    }
    return () => {
      active = false;
      window.cancelAnimationFrame(themeFrame);
      darkQuery.removeEventListener("change", followSystemTheme);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.theme = uiTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", uiTheme === "dark" ? "#0b100e" : "#f4f7f5");
    try {
      if (themeChoice === "auto") localStorage.removeItem(UI_THEME_KEY);
      else localStorage.setItem(UI_THEME_KEY, themeChoice);
    } catch {
      // Theme switching still works for the current session.
    }
  }, [hydrated, uiTheme, themeChoice]);

  useEffect(() => {
    if (!hydrated) return;
    pendingStore = store;
    const timer = window.setTimeout(flushPendingStore, PERSIST_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [hydrated, store]);

  useEffect(() => {
    // Save immediately when iOS suspends or closes the app instead of waiting for the delay.
    const flushWhenHidden = () => { if (document.visibilityState === "hidden") flushPendingStore(); };
    window.addEventListener("pagehide", flushPendingStore);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      window.removeEventListener("pagehide", flushPendingStore);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      flushPendingStore();
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !hasMeaningfulData(store)) return;
    const timer = window.setTimeout(() => {
      const snapshotValue = JSON.stringify({ ...store, lastBackupAt: undefined });
      if (snapshotValue === lastSnapshotValueRef.current) return;
      void saveSnapshot(store).then(() => {
        lastSnapshotValueRef.current = snapshotValue;
      }).catch(() => undefined);
    }, 1400);
    return () => window.clearTimeout(timer);
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
  const customPointTypes = useMemo(() => store.customPointTypes ?? [], [store.customPointTypes]);
  const savedPointTypeOptions = useMemo<Choice[]>(() => {
    const standard = new Set<string>(POINT_TYPE_CHOICES.map((option) => option.value));
    return [...POINT_TYPE_CHOICES, ...customPointTypes.filter((item) => !standard.has(item.code))
      .map((item) => ({ value: item.code, label: item.code, detail: item.detail || t("customPointType") }))];
  }, [POINT_TYPE_CHOICES, customPointTypes, t]);
  const pointTypeOptions = useMemo<Choice[]>(() => [...savedPointTypeOptions,
    { value: CUSTOM_POINT_TYPE, label: t("customPointType"), detail: t("enterPointType") }], [savedPointTypeOptions, t]);
  const recentCombinations = useMemo(() => [...store.savedCombinations]
    .sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt)).slice(0, 12), [store.savedCombinations]);
  const pdfSheets = useMemo(() => pdfActionsOpen && activeProtocol ? buildPageMetadata(activeProtocol) : [], [pdfActionsOpen, activeProtocol]);
  // App-wide settings (own logo, own point types) travel with the protocol into print and PDF.
  const brandedProtocol = useMemo<Protocol>(() => ({ ...activeProtocol, customPointTypes, companyLogo: store.companyLogo }),
    [activeProtocol, customPointTypes, store.companyLogo]);
  const printableProtocol = useDeferredValue(brandedProtocol);
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
    setCustomPointTypeMode(false);
    setCustomPointTypeDetail("");
    setTargetForm({
      ...DEFAULT_TARGET_FORM,
      height: last?.height ?? "",
    });
    setTargetSheet({ stationId });
  }

  function openEditTarget(stationId: string, target: Target) {
    setCustomRemarkMode(Boolean(target.remark && !remarkOptions.some((option) => option.value === target.remark)));
    setCustomPointTypeMode(Boolean(target.pointType && !savedPointTypeOptions.some((option) => option.value === target.pointType)));
    setCustomPointTypeDetail("");
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
    if (match?.pointType) setCustomPointTypeMode(!savedPointTypeOptions.some((option) => option.value === match.pointType));
  }

  function selectPointType(pointType: string) {
    if (pointType === CUSTOM_POINT_TYPE) {
      setCustomPointTypeMode(true);
      setCustomPointTypeDetail("");
      setTargetForm((form) => ({ ...form, pointType: "" }));
      return;
    }
    setCustomPointTypeMode(false);
    setTargetForm((form) => ({ ...form, pointType }));
  }

  function removeCustomPointType(code: string) {
    setStore((current) => ({ ...current, customPointTypes: (current.customPointTypes ?? []).filter((item) => item.code !== code) }));
  }

  async function chooseLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const logo = await readLogoFile(file);
      setLogoError(false);
      setStore((current) => ({ ...current, companyLogo: { ...logo, caption: current.companyLogo?.caption ?? "" } }));
    } catch {
      setLogoError(true);
    }
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
      pointType: targetForm.pointType.trim(),
      ...normalizedRemark,
    };
    const targetId = targetSheet.targetId;
    const newPointType = customPointTypeMode && cleaned.pointType && !POINT_TYPE_CHOICES.some((option) => option.value === cleaned.pointType)
      ? { code: cleaned.pointType, detail: customPointTypeDetail.trim() } : null;
    setStore((current) => ({
      ...current,
      customPointTypes: newPointType ? upsertCustomPointType(current.customPointTypes ?? [], newPointType) : current.customPointTypes,
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
    void downloadProtocolPdf(brandedProtocol, language).catch(() => window.alert(t("pdfError")));
  }

  function shareProtocol() {
    void shareProtocolPdf(brandedProtocol, language).catch(() => window.alert(t("pdfError")));
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
            <span className="brand-mark" aria-hidden="true" />
            <div><p className="eyebrow">{t("fieldLog")}</p><h1>{t("appTitle")}</h1></div>
          </div>
          <div className="topbar-actions">
            <LanguageSwitcher />
            <button type="button" className="menu-button" onClick={() => setMenuOpen(true)}
            aria-label={backupNeeded ? `${t("menu")}: ${t("backupNeededBadge")}` : t("menu")} aria-haspopup="dialog">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
            {backupNeeded ? <span className="menu-dot" /> : null}
          </button>
        </div>
        </header>

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
            {activeProtocol.meta.showCompanyLogo ? (
              <div className="company-logo-settings">
                <div className="company-logo-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={store.companyLogo?.dataUri ?? assetUrl("/ait-logo.png")} alt={t("companyLogo")} />
                </div>
                <div className="company-logo-copy">
                  <b>{t("companyLogo")}</b>
                  <small>{t("companyLogoDetail")}</small>
                  <div className="company-logo-actions">
                    <button type="button" className="secondary-button" onClick={() => logoInputRef.current?.click()}>{store.companyLogo ? t("replaceLogo") : t("uploadLogo")}</button>
                    {store.companyLogo ? <button type="button" className="quiet-button" onClick={() => setStore((current) => ({ ...current, companyLogo: undefined }))}>{t("resetLogo")}</button> : null}
                  </div>
                  {logoError ? <small className="company-logo-error" role="alert">{t("logoError")}</small> : null}
                </div>
                {store.companyLogo ? (
                  <Field label={t("logoCaption")} value={store.companyLogo.caption} placeholder={t("logoCaptionPlaceholder")}
                    onChange={(caption) => setStore((current) => current.companyLogo ? { ...current, companyLogo: { ...current.companyLogo, caption } } : current)} />
                ) : null}
                <input ref={logoInputRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/*" onChange={(event) => void chooseLogo(event)} />
              </div>
            ) : null}
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
            {pdfSheets.length > 1 ? <section className="page-weather-review">
              <h3>{t("pageWeather")}</h3><p>{t("pageWeatherHint")}</p>
              {pdfSheets.slice(1).map((sheet, index, following) => (
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
              <SelectField label={t("pointType")} value={customPointTypeMode ? CUSTOM_POINT_TYPE : targetForm.pointType} onChange={selectPointType} options={pointTypeOptions} placeholder={t("noPointType")} />
              {customPointTypeMode ? (
                <>
                  <Field label={t("pointTypeCode")} value={targetForm.pointType} onChange={(pointType) => setTargetForm((form) => ({ ...form, pointType: pointType.slice(0, 12) }))} placeholder={t("pointTypeCodePlaceholder")} />
                  <Field label={t("pointTypeDetail")} value={customPointTypeDetail} onChange={setCustomPointTypeDetail} placeholder={t("pointTypeDetailPlaceholder")} />
                </>
              ) : null}
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
            {!valueEdit && customPointTypes.length ? (
              <div className="custom-point-types">
                <h3>{t("customPointTypes")}</h3>
                {customPointTypes.map((item) => (
                  <div className="custom-point-type" key={item.code}>
                    <span><b>{item.code}</b>{item.detail ? <small>{item.detail}</small> : null}</span>
                    <button type="button" className="quiet-button" aria-label={`${t("deleteCustomPointType")}: ${item.code}`} onClick={() => removeCustomPointType(item.code)}>×</button>
                  </div>
                ))}
              </div>
            ) : null}
            {valueEdit ? (
              <div className="value-editor">
                <Field label={t("target")} value={valueEdit.point} onChange={(point) => setValueEdit({ ...valueEdit, point })} />
                <SelectField label={t("pointType")} value={valueEdit.pointType} onChange={(pointType) => setValueEdit({ ...valueEdit, pointType })} options={savedPointTypeOptions} placeholder={t("noPointType")} />
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



      {instructionOpen ? (
        <Modal title={t("help")} onClose={() => setInstructionOpen(false)} full>
          <InstructionGuide>
            <section className="about-app help-about">
              <div className="about-brand"><span className="brand-mark" aria-hidden="true" /><div><h3>{t("appTitle")}</h3><p>{t("version", {version: APP_VERSION})}</p></div></div>
              <section><h4>{t("about")}</h4><p>{t("author")}</p><p className="copyright">{t("copyright")}</p><p>{t("usageTerms")}</p><p>{t("restrictions")}</p></section>
              <section><h4>{t("install")}</h4><p><b>iPhone:</b> {t("iphoneInstall")}</p><p><b>Android:</b> {t("androidInstall")}</p><p>{t("offlineInstall")}</p></section>
            </section>
          </InstructionGuide>
          <div className="modal-actions single"><button type="button" className="primary-button" onClick={() => setInstructionOpen(false)}>{t("close")}</button></div>
        </Modal>
      ) : null}

      {menuOpen ? (
        <Modal title={t("menu")} onClose={() => setMenuOpen(false)}>
          <div className="modal-scroll app-menu">
            <button type="button" className="primary-button menu-new" onClick={() => { setMenuOpen(false); startNewProtocol(); }}>
              <span aria-hidden="true">+</span>{t("newProtocol")}
            </button>
            <div className="menu-group">
              <button type="button" className="menu-row" onClick={() => { setMenuOpen(false); setProtocolsOpen(true); }}>
                <span className="menu-icon green" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 3h8l4 4v14H7z" /><path d="M15 3v4h4M10 12h6M10 16h6" /></svg></span>
                <span className="menu-copy"><b>{t("protocols")}</b></span>
                <span className="count-badge">{store.protocols.length}</span><span className="menu-chevron" aria-hidden="true">›</span>
              </button>
              <button type="button" className="menu-row" onClick={() => { setMenuOpen(false); setValuesOpen(true); }}>
                <span className="menu-icon blue" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h11" /></svg></span>
                <span className="menu-copy"><b>{t("values")}</b></span>
                <span className="menu-chevron" aria-hidden="true">›</span>
              </button>
              <button type="button" className="menu-row" onClick={() => { setMenuOpen(false); openBackupCenter(); }}>
                <span className="menu-icon orange" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7z" /><path d="M12 16v-5M9.5 13.5 12 11l2.5 2.5" /></svg></span>
                <span className="menu-copy"><b>{t("backupMenu")}</b>
                  <small>{t("lastBackup")}: {formatBackupDate(store.lastBackupAt, language)}</small></span>
                {backupNeeded ? <span className="menu-warning">{t("backupNeededBadge")}</span> : null}
                <span className="menu-chevron" aria-hidden="true">›</span>
              </button>
            </div>
            <div className="menu-group">
              <button type="button" className="menu-row" onClick={() => { setMenuOpen(false); setInstructionOpen(true); }}>
                <span className="menu-icon blue" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01" /></svg></span>
                <span className="menu-copy"><b>{t("help")}</b></span>
                <span className="menu-chevron" aria-hidden="true">›</span>
              </button>
            </div>
            <div className="menu-theme">
              <b id="menu-theme-label">{t("theme")}</b>
              <div className="theme-segments" role="radiogroup" aria-labelledby="menu-theme-label">
                {(["dark", "light", "auto"] as const).map((choice) => (
                  <button type="button" role="radio" aria-checked={themeChoice === choice} key={choice}
                    className={themeChoice === choice ? "on" : ""} onClick={() => setThemeChoice(choice)}>
                    {t(choice === "dark" ? "themeDark" : choice === "light" ? "themeLight" : "themeAuto")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      <PrintProtocol protocol={printableProtocol} />
    </>
  );
}
