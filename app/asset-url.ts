// Defined only by the standalone Pages build; Sites keeps its root paths.
declare const __APP_BASE__: string;
export function assetUrl(path: string): string {
  const base = typeof __APP_BASE__ === "string" ? __APP_BASE__ : "/";
  return base + path.replace(/^\//, "");
}
