"use client";

import { useLanguage } from "@/lib/i18n/language-context";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "ro" : "en")}
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-semibold tracking-wide hover:bg-muted/80 transition-colors"
      aria-label={lang === "en" ? "Switch to Romanian" : "Schimbă în engleză"}
    >
      <span className={lang === "en" ? "text-foreground" : "text-muted-foreground">EN</span>
      <span className="text-muted-foreground">/</span>
      <span className={lang === "ro" ? "text-foreground" : "text-muted-foreground"}>RO</span>
    </button>
  );
}
