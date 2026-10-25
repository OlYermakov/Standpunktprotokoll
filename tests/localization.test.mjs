import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import { LANGUAGES, MESSAGES, LANGUAGE_STORAGE_KEY, remarkChoices, pointTypeChoices, translate, formatDate, countLabel } from "../app/i18n.ts";

test("every app message has five translations with matching interpolation parameters", () => {
  assert.deepEqual(LANGUAGES,["de","en","es","it","uk"]);
  const tokens=text=>[...text.matchAll(/\{(\w+)\}/g)].map(match=>match[1]).sort();
  for (const [key,row] of Object.entries(MESSAGES)) {
    assert.equal(row.length,5,key);
    for (const value of row) {
      assert.ok(value.trim(),key);
      assert.deepEqual(tokens(value),tokens(row[0]),key);
    }
  }
});

test("formats display dates and counts without changing stored values or point codes", () => {
  assert.equal(formatDate("2026-09-14","uk"),"14.09.2026");
  assert.equal(formatDate("2026-09-14","en"),"14/09/2026");
  assert.equal(countLabel(1,"station","uk"),"1 станція");
  assert.equal(countLabel(2,"station","uk"),"2 станції");
  assert.equal(countLabel(11,"station","uk"),"11 станцій");
  for(const language of LANGUAGES){
    assert.deepEqual(pointTypeChoices(language).map(x=>x.value),["GVP","BGVP","BVP","GKP","SP","PS0","PS1","PS2","PS3"]);
    assert.deepEqual(remarkChoices(language).map(x=>x.value),remarkChoices("de").map(x=>x.value));
    const raw="Київ_Ä Ö ñ è · Project {not_a_key}";
    assert.ok(translate(language,"deleteItem",{name:raw}).includes(raw));
  }
});

test("language choice is separate from protocol storage and updates document metadata",async()=>{
  const context=await readFile(new URL("../app/i18n-context.tsx",import.meta.url),"utf8");
  const page=await readFile(new URL("../app/page.tsx",import.meta.url),"utf8");
  assert.equal(LANGUAGE_STORAGE_KEY,"standpunktprotokoll-ui-language");
  assert.ok(context.includes("localStorage.getItem(LANGUAGE_STORAGE_KEY)"));
  assert.ok(context.includes("localStorage.setItem(LANGUAGE_STORAGE_KEY,language)"));
  assert.ok(context.includes("document.documentElement.lang=language"));
  assert.doesNotMatch(context,/setStore|writeIndexedDbStore|normalizeStore|savedCombinations/);
  assert.ok(page.includes('const STORAGE_KEY = "standpunktprotokoll-store-v1"'));
  assert.ok(page.includes('const DATABASE_NAME = "standpunktprotokoll-db"'));
  assert.match(page,/isBacksight: event.target.checked, isConnectionPoint: event.target.checked \? false/);
  assert.match(page,/isConnectionPoint: event.target.checked, isBacksight: event.target.checked \? false/);
});

test("no untranslated interface text or text attributes remain in the main form",async()=>{
  const source=await readFile(new URL("../app/page.tsx",import.meta.url),"utf8");
  const tree=ts.createSourceFile("page.tsx",source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const allowed=new Set(["RB","AP","RB ·","AP ·","h","m ·","PDF","A4","iPhone:","Android:"]);
  const errors=[];
  function visit(node){
    if(ts.isJsxText(node)&&/[\p{L}]/u.test(node.text.trim())&&!allowed.has(node.text.trim()))errors.push(node.text.trim());
    if(ts.isJsxAttribute(node)&&["label","placeholder","title","aria-label"].includes(node.name.getText(tree))&&node.initializer&&ts.isStringLiteral(node.initializer))errors.push(node.getText(tree));
    ts.forEachChild(node,visit);
  }
  visit(tree);assert.deepEqual(errors,[]);
});

test("all localized installation manifests retain the existing PWA identity and local assets",async()=>{
  const old=JSON.parse(await readFile(new URL("../public/manifest-v22.webmanifest",import.meta.url),"utf8"));
  const sw=await readFile(new URL("../public/sw.js",import.meta.url),"utf8");
  for(const language of LANGUAGES){
    const manifest=JSON.parse(await readFile(new URL(`../public/manifest-${language}.webmanifest`,import.meta.url),"utf8"));
    assert.equal(manifest.lang,language);
    assert.equal(manifest.name,translate(language,"appTitle"));
    assert.equal(manifest.id,old.id);
    assert.equal(manifest.start_url,old.start_url);
    assert.ok(sw.includes(`/manifest-${language}.webmanifest`));
  }
  for(const font of ["DejaVuSans.ttf","DejaVuSans-Bold.ttf"]){
    assert.ok((await readFile(new URL(`../public/fonts/${font}`,import.meta.url))).length>100000);
    assert.ok(sw.includes(`/fonts/${font}`));
  }
});
