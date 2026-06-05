"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { translations, type Lang } from "./translations";
import { createClient } from "@/lib/supabase/client";

type TranslationSet = (typeof translations)[Lang];

type LanguageContextType = {
  lang: Lang;
  t: TranslationSet;
  setLang: (lang: Lang) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  t: translations.en,
  setLang: async () => {},
});

export function LanguageProvider({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback(async (newLang: Lang) => {
    setLangState(newLang);
    document.cookie = `gymsync-lang=${newLang};path=/;max-age=31536000;samesite=lax`;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ language: newLang })
          .eq("id", user.id);
      }
    } catch {
      // silent fail — cookie already persists preference
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
