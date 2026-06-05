"use client";

import { useLanguage } from "@/lib/i18n/language-context";

export function LanguageSection() {
  const { lang, setLang, t } = useLanguage();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold border-b border-border pb-2">
        {t.settings.language}
      </h2>
      <p className="text-sm text-muted-foreground">{t.settings.languageSubtitle}</p>
      <div className="flex gap-3">
        <button
          onClick={() => setLang("en")}
          className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition-colors ${
            lang === "en"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          🇬🇧 English
        </button>
        <button
          onClick={() => setLang("ro")}
          className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition-colors ${
            lang === "ro"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          🇷🇴 Română
        </button>
      </div>
    </section>
  );
}
