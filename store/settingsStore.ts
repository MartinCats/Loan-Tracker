import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { create } from "zustand";

import {
  normalizeLanguage,
  setI18nLanguage,
  type AppLanguage
} from "@/services/i18n";

const languageStorageKey = "loan-tracker-language";

type SettingsState = {
  isLanguageLoaded: boolean;
  language: AppLanguage;
  initializeLanguage: () => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  isLanguageLoaded: false,
  language: "th",

  initializeLanguage: async () => {
    const storedLanguage = await AsyncStorage.getItem(languageStorageKey);
    const deviceLanguage = getLocales()[0]?.languageCode;
    const language = normalizeLanguage(storedLanguage ?? deviceLanguage);

    setI18nLanguage(language);
    set({ language, isLanguageLoaded: true });
  },

  setLanguage: async (language) => {
    setI18nLanguage(language);
    await AsyncStorage.setItem(languageStorageKey, language);
    set({ language, isLanguageLoaded: true });
  }
}));
