import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import {initReactI18next} from "react-i18next";
import i18n from "i18next";

// Import translation files directly
import enTranslation from '../public/locales/en/translation.json';
import faTranslation from '../public/locales/fa/translation.json';

// Initialize i18n before rendering the app
const initI18n = async () => {
    await i18n
        .use(Backend)
        .use(LanguageDetector)
        .use(initReactI18next)
        .init({
            fallbackLng: 'en',
            debug: import.meta.env.DEV, // Only enable debug in development

            interpolation: {
                escapeValue: false,
            },
            detection: {
                order: ['localStorage', 'navigator'],
                caches: ['localStorage'],
            },

            supportedLngs: ['en', 'fa'],

            resources: {
                en: {
                    translation: enTranslation
                },
                fa: {
                    translation: faTranslation
                }
            }
        });

    // Now render the app
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <App/>
        </StrictMode>,
    )
};

initI18n();

