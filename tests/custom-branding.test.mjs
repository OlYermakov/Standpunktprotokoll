import assert from "node:assert/strict";
import {readFile, mkdir, writeFile} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import test from "node:test";
import {build} from "esbuild";

// Own company logo and own point types (iOS App Store copy).
const root=new URL("../",import.meta.url);
const output=new URL("../.sites-runtime/branding-check/",import.meta.url);
await mkdir(output,{recursive:true});
await build({entryPoints:{pdf:new URL("../app/protocol-pdf.ts",import.meta.url).pathname,print:new URL("../app/protocol-print.ts",import.meta.url).pathname},outdir:output.pathname,outExtension:{".js":".mjs"},bundle:true,platform:"node",format:"esm",jsx:"automatic",packages:"external",logLevel:"silent"});
const {buildProtocolPdf}=await import(new URL("pdf.mjs",output).href);
const {protocolLegendEntries}=await import(new URL("print.mjs",output).href);
const fonts={regular:(await readFile(new URL("public/fonts/DejaVuSans.ttf",root))).toString("base64"),bold:(await readFile(new URL("public/fonts/DejaVuSans-Bold.ttf",root))).toString("base64")};
const customLogo={dataUri:"data:image/png;base64,"+(await readFile(new URL("tests/fixture-logo.png",root))).toString("base64"),width:1200,height:400,caption:"Геодезія та кадастр"};
const target=(id,pointType)=>({id,point:`P${id}`,height:"0,100",remark:"",pointType,isBacksight:false,isConnectionPoint:false,createdAt:"2026-11-12T10:00:00Z"});
const protocol={id:"b",createdAt:"2026-11-12T10:00:00Z",updatedAt:"2026-11-12T10:00:00Z",
  meta:{project:"Brand",projectNumber:"",date:"2026-11-12",startTime:"",endTime:"",instrument:"",crew:"",temperature:"",pressure:"",fpSynced:"",fpFile:"",showCompanyLogo:true},
  stations:[{id:"s",point:"SP1",instrumentHeight:"1,500",targets:[target("1","GVP"),target("2","РП"),target("3","XYZ")]}],
  customPointTypes:[{code:"РП",detail:"Репер"}],companyLogo:customLogo};

test("legend explains own point types next to the standard ones",()=>{
  const entries=protocolLegendEntries(protocol,"uk");
  assert.ok(entries.some((e)=>e.abbreviation==="ПЗК"),"standard type kept");
  assert.deepEqual(entries.find((e)=>e.abbreviation==="РП"),{abbreviation:"РП",description:"Репер"});
  assert.deepEqual(entries.find((e)=>e.abbreviation==="XYZ"),{abbreviation:"XYZ",description:"Власний тип пункту"});
});

test("PDF shows the own logo caption instead of the default AIT caption",async()=>{
  const doc=buildProtocolPdf(protocol,undefined,"uk",fonts);
  const path=new URL("custom-logo.pdf",output).pathname;
  await writeFile(path,Buffer.from(doc.output("arraybuffer")));
  const text=execFileSync("pdftotext",["-layout",path,"-"],{encoding:"utf8"});
  assert.ok(text.includes("Геодезія та кадастр"));
  assert.ok(!text.includes("Інженери в будівництві"));
  assert.ok(text.includes("Репер"));
  const images=execFileSync("pdfimages",["-list",path],{encoding:"utf8"});
  assert.match(images,/\b1200\s+400\b/,"own logo embedded");
});


test("hidden header fields are left out of the PDF and the rest moves up",async()=>{
  const filled={...protocol,companyLogo:undefined,meta:{...protocol.meta,projectNumber:"NR-77",instrument:"TS16",crew:"Team A",fpSynced:"OK-FP",fpFile:"net.gsi",temperature:"12",pressure:"990"}};
  const render=async(hiddenFields,name)=>{const doc=buildProtocolPdf({...filled,hiddenFields},"de",fonts);const path=new URL(name,output).pathname;await writeFile(path,Buffer.from(doc.output("arraybuffer")));return execFileSync("pdftotext",["-layout",path,"-"],{encoding:"utf8"});};
  const all=await render([],"fields-all.pdf");
  for(const value of ["NR-77","TS16","Team A","OK-FP","net.gsi","12 °C","990 hPa"]) assert.ok(all.includes(value),value);
  const some=await render(["fpSynced","fpFile","pressure","instrument"],"fields-some.pdf");
  for(const value of ["OK-FP","net.gsi","990 hPa","TS16","FP-Status","Luftdruck"]) assert.ok(!some.includes(value),value);
  for(const value of ["Brand","NR-77","Team A","12 °C"]) assert.ok(some.includes(value),value);
});
