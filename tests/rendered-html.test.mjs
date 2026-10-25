import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { LANGUAGES, remarkChoices } from "../app/i18n.ts";
import { DEFAULT_LANGUAGE } from "../app/default-language.ts";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;



test("prism picker shows Leica names and constants while storing abbreviations", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  for (const language of LANGUAGES) {
    const choices = remarkChoices(language);
    assert.deepEqual(choices.map(choice=>choice.value), ["P360","HDS","MPR122","MP","MP0","MP360","RF","RP","OP"]);
    assert.equal(choices.length,9);
    assert.ok(choices.every(choice=>choice.label && choice.detail));
  }
  assert.match(source, /role="listbox"/);
  assert.match(source, /<b>\{option\.label\}<\/b>/);
  assert.match(source, /<small>\{option\.detail\}<\/small>/);
  assert.match(source, /choose\(option\.value\)/);
  assert.match(source, /targetRemark\(target, language\)/);
  assert.ok(source.includes('<SelectField label={t("prismSelection")} value={customRemarkMode'));
  assert.doesNotMatch(source, /<SuggestionField label="Zielpunkt" autoFocus/);
});

test("prism picker stays open while the surrounding form is scrolled", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.doesNotMatch(source, /closeOnOutsidePress|addEventListener\("pointerdown"/);
  assert.match(styles, /\.select-options \{[^}]*overflow: visible;[^}]*touch-action: pan-y;/);
  assert.match(styles, /\.select-options button \{[^}]*touch-action: pan-y;/);
});

test("shows up to twelve recent target combinations", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /recentCombinations[\s\S]*?\.slice\(0, 12\)/);
});

test("field UI has a persistent daylight mode and safe action colors", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /UI_THEME_KEY = "standpunktprotokoll-ui-theme"/);
  assert.match(source, /document\.documentElement\.dataset\.theme = uiTheme/);
  assert.match(source, /className="theme-toggle"/);
  assert.ok(source.includes("lang={LOCALES[language]}"));
  assert.match(source, /function LocalizedDateTimeField/);
  assert.ok(source.includes('kind === "date" ? t("datePlaceholder") : t("timePlaceholder")'));
  assert.match(styles, /:root\[data-theme="light"\]/);
  assert.match(styles, /\.primary-small \{[^}]*background: var\(--primary\)/);
  assert.match(styles, /\.row-action\.danger \{[^}]*color: var\(--accent\)/);
  assert.match(styles, /\.bottom-bar \.bottom-primary \{[^}]*background: var\(--signal\)/);
  assert.match(styles, /\.check-field:has\(input:checked\)/);
  assert.match(styles, /--signal: #f28c28/);
  assert.match(styles, /\.add-target-action \{[^}]*background: var\(--signal\)/);
  assert.match(styles, /\.bottom-bar \.bottom-primary \{[^}]*background: var\(--signal\)/);
  assert.match(styles, /\.target-form \.select-options button\.selected/);
  assert.match(styles, /:root\[data-theme="light"\] \.rb-badge \{[^}]*color: #0b5a3a;[^}]*background: #d9f2e5;/);
  assert.match(styles, /:root\[data-theme="light"\] \{[^}]*--primary: #167a52;[^}]*--green: #176b49;[^}]*--accent: #b83227;/);
  assert.match(styles, /:root\[data-theme="light"\] \.field input::placeholder \{ color: #5f6d66; \}/);
});

test("declares installable PWA icons and a dedicated iPhone home-screen icon", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const manifest = JSON.parse(
    await readFile(new URL(`../public/manifest-${DEFAULT_LANGUAGE}.webmanifest`, import.meta.url), "utf8"),
  );
  const appleIcon = await readFile(
    new URL("../public/apple-touch-icon-v20.png", import.meta.url),
  );

  assert.ok(layout.includes("manifest: `/manifest-${DEFAULT_LANGUAGE}.webmanifest`"));
  assert.match(layout, /rel="apple-touch-icon"[^>]*sizes="180x180"[^>]*apple-touch-icon-v20\.png\?v=22/);
  assert.match(layout, /apple-mobile-web-app-capable" content="yes"/);
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/?install=v22");
  assert.deepEqual(
    manifest.icons.map(({ sizes, type }) => [sizes, type]),
    [["192x192", "image/png"], ["512x512", "image/png"]],
  );
  assert.equal(appleIcon.readUInt32BE(16), 180);
  assert.equal(appleIcon.readUInt32BE(20), 180);
});

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});
