"use client";

import { useLanguage } from "@/lib/i18n/language-context";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "ro" : "en")}
      className={`flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all w-full justify-center ${className}`}
      aria-label="Switch language"
    >
      <span className={lang === "en" ? "text-foreground" : "text-muted-foreground/50"}>EN</span>
      <span className="text-muted-foreground/40">/</span>
      <span className={lang === "ro" ? "text-foreground" : "text-muted-foreground/50"}>RO</span>
    </button>
  );
}
