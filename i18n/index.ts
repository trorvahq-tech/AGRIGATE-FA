import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { Platform } from "react-native";

import en from "../locales/en.json";
import fr from "../locales/fr.json";
import ha from "../locales/ha.json";
import ig from "../locales/ig.json";
import yo from "../locales/yo.json";

const resources = {
    en: { translation: en },
    fr: { translation: fr },
    yo: { translation: yo },
    ig: { translation: ig },
    ha: { translation: ha },
};

const getInitialLanguage = (): string => {
    try {
        const locales = Localization.getLocales();
        if (locales && locales.length > 0 && locales[0]?.languageCode) {
            return locales[0].languageCode;
        }
    } catch {
        // Fallback for SSR/Node environments where expo-localization is unavailable
    }
    return "en";
};

// Initialize i18n synchronously with fallback/device language so it is immediately available
i18n.use(initReactI18next).init({
    compatibilityJSON: "v4" as any,
    resources,
    lng: getInitialLanguage(),
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
    },
});

// Load saved language asynchronously, guarding against SSR/Node environments where window is undefined
const loadSavedLanguage = async () => {
    try {
        if (Platform.OS === "web" && typeof window === "undefined") {
            return;
        }
        const savedLanguage = await AsyncStorage.getItem("language");
        if (savedLanguage && savedLanguage !== i18n.language) {
            await i18n.changeLanguage(savedLanguage);
        }
    } catch (error) {
        console.warn("Failed to load saved language:", error);
    }
};

loadSavedLanguage();

export default i18n;
