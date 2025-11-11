import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationAR from './locales/es-AR/translation.json';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    lng: 'es-AR',
    fallbackLng: 'es-AR',
    resources: {
      'es-AR': {
        translation: translationAR,
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
