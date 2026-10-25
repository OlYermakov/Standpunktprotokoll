"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANGUAGE } from "./default-language";
import { isLanguage, LANGUAGES, LANGUAGE_NAMES, LANGUAGE_STORAGE_KEY, translate, type Language, type MessageKey, type MessageParams } from "./i18n";

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: MessageKey, params?: MessageParams) => string };
const LanguageContext = createContext<LanguageContextValue>({language: DEFAULT_LANGUAGE, setLanguage:()=>{}, t:(key,params)=>translate(DEFAULT_LANGUAGE,key,params)});

export function LanguageProvider({children}: {children: React.ReactNode}) {
  const [language,setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [ready,setReady] = useState(false);
  useEffect(()=>{
    // This preference deliberately lives outside the protocol store and backups.
    try {
      const requested=new URL(window.location.href).searchParams.get("lang");
      const stored=isLanguage(requested) ? requested : localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if(isLanguage(stored)) setLanguage(stored);
    } catch { /* Language selection still works in this session. */ }
    setReady(true);
  },[]);
  useEffect(()=>{
    if(!ready) return;
    document.documentElement.lang=language;
    document.title=translate(language,"appTitle");
    document.querySelectorAll('meta[name="description"]').forEach(el=>el.setAttribute("content",translate(language,"appDescription")));
    document.querySelectorAll('meta[name="apple-mobile-web-app-title"], meta[name="application-name"]').forEach(el=>el.setAttribute("content",translate(language,"appTitle")));
    document.querySelectorAll('link[rel="manifest"]').forEach(el=>el.setAttribute("href",`/manifest-${language}.webmanifest`));
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY,language); } catch { /* Keep session language without storage. */ }
  },[ready,language]);
  const t=useCallback((key:MessageKey,params?:MessageParams)=>translate(language,key,params),[language]);
  const context=useMemo(()=>({language,setLanguage,t}),[language,t]);
  return <LanguageContext.Provider value={context}>{children}</LanguageContext.Provider>;
}

export function useLanguage(){ return useContext(LanguageContext); }

export function LanguageSwitcher(){
  const {language,setLanguage,t}=useLanguage();
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    if(!open) return;
    const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false);};
    document.addEventListener("keydown",close);
    return ()=>document.removeEventListener("keydown",close);
  },[open]);
  return <div className="language-switcher" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}>
    <button type="button" className="language-toggle" aria-label={`${t("language")}: ${LANGUAGE_NAMES[language]}`} title={t("language")} aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18M12 3c-5 5-5 13 0 18"/></svg>
      <span>{language.toUpperCase()}</span>
    </button>
    {open ? <div className="language-options" role="listbox" aria-label={t("language")}>
      {LANGUAGES.map(code=><button key={code} type="button" lang={code} role="option" aria-selected={code===language} onClick={()=>{setLanguage(code);setOpen(false);}}><span>{LANGUAGE_NAMES[code]}</span><b>{code===language?"✓":code.toUpperCase()}</b></button>)}
    </div>:null}
  </div>;
}
