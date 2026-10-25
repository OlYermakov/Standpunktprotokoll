import assert from "node:assert/strict";
import {readFile, mkdir, writeFile} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import test from "node:test";
import {build} from "esbuild";
import {LANGUAGES, PRISMS, POINT_TYPES, translate, abbreviation, prismAbbreviation, prismLegendAbbreviation, prismConstant, remarkChoices} from "../app/i18n.ts";

const root=new URL("../",import.meta.url);
const output=new URL("../.sites-runtime/pdf-check/",import.meta.url);
await mkdir(output,{recursive:true});
await build({entryPoints:{pdf:new URL("../app/protocol-pdf.ts",import.meta.url).pathname,print:new URL("../app/protocol-print.ts",import.meta.url).pathname},outdir:output.pathname,outExtension:{".js":".mjs"},bundle:true,platform:"node",format:"esm",jsx:"automatic",packages:"external",logLevel:"silent"});
const {buildProtocolPdf}=await import(new URL("pdf.mjs",output).href);
const {buildPrintPages,buildPageMetadata,targetRemark}=await import(new URL("print.mjs",output).href);
const fonts={regular:(await readFile(new URL("public/fonts/DejaVuSans.ttf",root))).toString("base64"),bold:(await readFile(new URL("public/fonts/DejaVuSans-Bold.ttf",root))).toString("base64")};
const logo="data:image/png;base64,"+(await readFile(new URL("public/ait-logo.png",root))).toString("base64");
const protocol={id:"fixture",createdAt:"2026-09-14T07:00:00Z",updatedAt:"2026-09-14T07:00:00Z",meta:{project:"Київ Köln ñ è",projectNumber:"2026-TEST",date:"2026-09-14",startTime:"07:15",endTime:"",instrument:"Leica TS12",crew:"Олексій Müller",temperature:"18,5",pressure:"1013",fpSynced:"14.09.2026",fpFile:"Тест.gsi",showCompanyLogo:true},stations:[{id:"sp1",point:"SP_Україна",instrumentHeight:"1,73456",targets:PRISMS.map(([code],i)=>({id:`target${i}`,point:`Пункт_${i+1}`,height:"0,1004",remark:code,pointType:POINT_TYPES[i%POINT_TYPES.length],isBacksight:i===0,isConnectionPoint:i===1,createdAt:"2026-09-14T07:00:00Z"}))},{id:"sp2",point:"SP_Äñè",instrumentHeight:"1.300",targets:[{id:"custom",point:"Пункт_ЇЄҐ",height:"-0,0252",remark:"Власна ñ è",pointType:"",isBacksight:false,isConnectionPoint:false,createdAt:"2026-09-14T07:00:00Z"}]}]};
const original=JSON.stringify(protocol);
function freeze(value){Object.freeze(value);for(const item of Object.values(value))if(item&&typeof item==="object")freeze(item);}
freeze(protocol);

test("five PDF languages localize prism rows and legends while preserving user data, constants and layout",async()=>{
  for(const language of LANGUAGES){
    const doc=buildProtocolPdf(protocol,logo,language,fonts);
    assert.ok(doc.internal.pageSize.getWidth()>doc.internal.pageSize.getHeight());
    assert.equal(doc.getNumberOfPages(),1);
    const path=new URL(`record-${language}.pdf`,output).pathname;
    await writeFile(path,Buffer.from(doc.output("arraybuffer")));
    const text=execFileSync("pdftotext",["-layout",path,"-"],{encoding:"utf8"});
    assert.ok(text.includes(translate(language,"appTitle")),language);
    assert.ok(text.includes("Київ Köln ñ è"),language+" project");
    assert.ok(text.includes("Олексій Müller"),language+" crew");
    assert.ok(text.includes("Пункт_ЇЄҐ"),language+" point");
    assert.ok(text.includes("Власна ñ è"),language+" custom remark");
    assert.ok(text.includes(language==="en"?"1.735":"1,735"),language+" height");
    for(const [code,key,constant] of PRISMS){
      const target=protocol.stations[0].targets.find(target=>target.remark===code);
      const row=text.split("\n").find(line=>line.includes(target.point+" "));
      assert.ok(row?.includes(targetRemark(target,language)),language+" table row "+code);
      const legend=`${prismAbbreviation(code,language)} - ${translate(language,key)} (${prismConstant(constant,language)} mm)`;
      assert.ok(text.includes(legend),language+" prism legend "+code);
      assert.ok(!text.includes(`(${code})`),language+" no duplicate prism code "+code);
    }
    for(const code of [...POINT_TYPES,"RB","AP"]){
      assert.ok(text.includes(`${abbreviation(code,language)} - `),language+" legend "+code);
      assert.ok(!text.includes(`(${code})`),language+" no duplicate point code "+code);
    }
    assert.ok(text.includes(translate(language,"pageNumber",{page:1,total:1})),language+" footer");
    assert.equal(JSON.stringify(protocol),original,"PDF must not mutate input data");
  }
});

test("prism selection preserves constants and canonical values through repeated language changes",()=>{
  const originalPrisms=JSON.stringify(PRISMS);
  assert.deepEqual(PRISMS.map(([code,,constant])=>[code,constant]),[
    ["P360",23.1],["HDS",34.4],["MPR122",28.1],["MP",17.5],["MP0",0],
    ["MP360",30],["RF",34.4],["RP",0],["OP",34.4],
  ]);
  for(const language of [...LANGUAGES,...LANGUAGES.toReversed(),"uk","de"]){
    const choices=remarkChoices(language);
    assert.deepEqual(choices.map(choice=>choice.value),PRISMS.map(([code])=>code));
    for(const choice of choices){
      assert.ok(choice.label.startsWith(prismAbbreviation(choice.value,language)+" · "));
      assert.ok(choice.label.includes(choice.name));
    }
    for(const code of ["HDS","MPR122","GRZ4/GRZ122","GMP111-0","GPR1/111/121"]){
      assert.equal(prismAbbreviation(code,language),code,"manufacturer designation "+code);
    }
    for(const text of ["RB","AP","SP","RF / RP · MP","mp"," МP ","Моя призма MPR122","Власна ñ è"]){
      const target={...protocol.stations[0].targets[0],pointType:"",isBacksight:false,remark:text};
      assert.equal(targetRemark(target,language),text,"free text in "+language);
    }
  }
  assert.equal(JSON.stringify(PRISMS),originalPrisms);
  assert.equal(JSON.stringify(protocol),original);
  assert.equal(prismAbbreviation("OP","en"),"RL");
  assert.equal(prismAbbreviation("RF","es"),"LR");
  assert.equal(prismAbbreviation("RF","it"),"PR");
  assert.equal(prismAbbreviation("MP360","uk"),"МП360");
  assert.equal(prismLegendAbbreviation("RP","uk"),"КП (RP)");
});

test("localized badges and PDF remarks preserve canonical codes and free text",()=>{
  const expected={de:["GVP","BGVP","GKP","SP","RB","AP"],en:["TRP","GTRP","TCP","ST","BS","CP"],es:["PRV","PRVS","PCV","EST","VE","PA"],it:["PRB","PRBT","PCB","ST","MI","PA"],uk:["ПЗК","ҐПЗК","ПКК","СТ","ЗН","ПП"]};
  for(const language of LANGUAGES){
    assert.deepEqual(["GVP","BGVP","GKP","SP","RB","AP"].map(code=>abbreviation(code,language)),expected[language]);
    for(const code of ["PS0","PS1","PS2","PS3","Custom Пункт"]) assert.equal(abbreviation(code,language),code);
    const target={...protocol.stations[0].targets[0],remark:"RB AP GVP Власна ñ è"};
    assert.equal(targetRemark(target,language),`${expected[language][4]} · ${expected[language][0]} · RB AP GVP Власна ñ è`);
    assert.equal(target.pointType,"GVP");
  }
});

test("station pagination still keeps station blocks together and continues oversized stations",()=>{
  const targets=Array.from({length:50},(_,i)=>({...protocol.stations[0].targets[0],id:String(i)}));
  const large={...protocol,stations:[{...protocol.stations[0],targets},{...protocol.stations[1],targets}]};
  assert.equal(buildPrintPages(large,"en").length,2);
  large.stations=[{...protocol.stations[0],targets:[...targets,...targets]}];
  const pages=buildPrintPages(large,"uk");
  assert.equal(pages.length,2);
  assert.equal(pages[0][0][0].stationPoint,"SP_Україна");
  assert.equal(pages[1][0][0].stationPoint,"SP_Україна");
});

test("following sheets use their first station time and persistent, inherited weather", async () => {
  const targets = (prefix, count) => Array.from({length:count}, (_,i)=>({...protocol.stations[0].targets[0],id:prefix+i,point:prefix+i}));
  const record = structuredClone(protocol);
  record.stations = [
    {...record.stations[0],id:"a",startTime:"07:15",targets:targets("A",50)},
    {...record.stations[0],id:"b",startTime:"09:42",targets:targets("B",100)},
    {...record.stations[0],id:"c",startTime:undefined,targets:targets("C",80)},
  ];
  const initial = buildPageMetadata(record);
  assert.equal(initial.length,4);
  assert.deepEqual(initial.map(p=>p.meta.startTime),["07:15","09:42","09:42",""]);
  assert.equal(new Set(initial.map(p=>p.key)).size,4);
  record.pageConditions = {[initial[1].key]:{temperature:"23,7",pressure:"998"},[initial[2].key]:{temperature:""}};
  const before = JSON.stringify(record);
  const metadata = buildPageMetadata(JSON.parse(before));
  assert.deepEqual(metadata.map(p=>p.meta.temperature),["18,5","23,7","",""]);
  assert.deepEqual(metadata.map(p=>p.meta.pressure),["1013","998","998","998"]);
  const doc = buildProtocolPdf(record,undefined,"uk",fonts);
  const path = new URL("page-weather.pdf",output).pathname;
  await writeFile(path,Buffer.from(doc.output("arraybuffer")));
  const text=execFileSync("pdftotext",["-layout",path,"-"],{encoding:"utf8"}).split("\f");
  assert.ok(text[0].includes("07:15") && text[0].includes("18,5"));
  assert.ok(text[1].includes("09:42") && text[1].includes("23,7") && text[1].includes("998"));
  assert.ok(text[2].includes("09:42") && !text[2].includes("23,7"));
  assert.ok(!text[3].includes("09:42") && !text[3].includes("07:15"));
  assert.equal(JSON.stringify(record),before);
  // Moving an earlier station does not attach saved weather to a different station.
  record.stations.shift();
  assert.equal(buildPageMetadata(record)[1].key,initial[2].key);
});
