import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shuffle, Trophy } from "lucide-react";
import { LangProvider, useLang } from "@/components/LangContext";

function NavContent({ currentPageName }) {
  const { t, lang, switchLang } = useLang();

  const navItems = [
    { name: "Home", label: t("home"), icon: Shuffle },
    { name: "Results", label: t("resultsNav"), icon: Trophy },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200/80 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="font-extrabold text-slate-900 text-base tracking-tight">🎲 {t("appName")}</span>
        <div className="flex items-center gap-1">
          {navItems.map(({ name, label, icon: Icon }) => (
            <Link
              key={name}
              to={createPageUrl(name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentPageName === name
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
          {/* Language switcher */}
          <div className="ml-2 flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => switchLang("en")}
              className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                lang === "en" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => switchLang("vi")}
              className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                lang === "vi" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              VI
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LangProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <NavContent currentPageName={currentPageName} />
        {children}
      </div>
    </LangProvider>
  );
}