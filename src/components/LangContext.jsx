import React, { createContext, useContext, useState } from "react";
import { translations, defaultLang } from "./i18n";

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("lang") || defaultLang; } catch { return defaultLang; }
  });

  const t = (key) => translations[lang]?.[key] ?? translations[defaultLang][key] ?? key;

  const switchLang = (l) => {
    setLang(l);
    try { localStorage.setItem("lang", l); } catch {}
  };

  return (
    <LangContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}