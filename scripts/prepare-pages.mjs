import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const out = new URL("../dist-pages/", import.meta.url);
const base = "/Standpunktprotokoll/";
for (const name of await readdir(out)) {
  if (!name.endsWith(".webmanifest")) continue;
  const manifest = JSON.parse(await readFile(new URL(name, out), "utf8"));
  for (const key of ["id", "start_url", "scope"]) {
    if (manifest[key]?.startsWith("/")) manifest[key] = base + manifest[key].slice(1);
  }
  for (const icon of manifest.icons ?? []) if (icon.src.startsWith("/")) icon.src = base + icon.src.slice(1);
  await writeFile(new URL(name, out), JSON.stringify(manifest, null, 2) + "\n");
}
const assets = (await readdir(new URL("assets/", out))).map(name => base + "assets/" + name);
const version = createHash("sha256").update(await readFile(new URL("index.html", out))).update(JSON.stringify(assets)).digest("hex").slice(0, 16);
let sw = await readFile(new URL("sw.js", out), "utf8");
// All quoted absolute paths in the shared worker are application-local.
sw = sw.replace(/"\/(.*?)"/g, (_, path) => JSON.stringify(base + path));
sw = sw.replace(/const CACHE_NAME = .*?;/, `const CACHE_PREFIX = "standpunktprotokoll-pages:" + ${JSON.stringify(base)};\nconst CACHE_NAME = CACHE_PREFIX + ${JSON.stringify(version)};`);
sw = sw.replace("const APP_SHELL = [", "const APP_SHELL = [" + assets.map(x => JSON.stringify(x)).join(",") + ",");
// github.io hosts other applications: never delete their caches.
sw = sw.replace("key !== CACHE_NAME", "key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME");
sw = sw.replace('if (url.origin !== self.location.origin) return;', `if (url.origin !== self.location.origin || !url.pathname.startsWith(${JSON.stringify(base)})) return;`);
await writeFile(new URL("sw.js", out), sw);
await writeFile(new URL(".nojekyll", out), "");
console.log(`Prepared GitHub Pages at ${base}: ${assets.length} bundled assets precached.`);
