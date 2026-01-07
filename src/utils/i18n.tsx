import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
i18n
  .use(Backend)
  .use(LanguageDetector) // detect language and use localStorage
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'th'],
    nonExplicitSupportedLngs: true,
    debug: false,
    ns: ['login', 'home', "vehicle", "mission", "drawer", "user"],
    defaultNS: 'login',
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'Language'
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;