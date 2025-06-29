import {useEffect} from 'react'
import {useTranslation} from 'react-i18next'

const STORAGE_KEY = 'i18nextLng'
const SUPPORTED_LANGUAGES = ['en', 'fa'] as const
const DEFAULT_LANGUAGE = 'en'

export const useLanguagePersistence = () => {
    const {i18n} = useTranslation()

    useEffect(() => {
        const initializeLanguage = () => {
            try {
                // Get saved language from localStorage
                const savedLanguage = localStorage.getItem(STORAGE_KEY)

                // Validate saved language
                const isValidLanguage = SUPPORTED_LANGUAGES.includes(savedLanguage as any)
                const languageToUse = isValidLanguage ? savedLanguage! : DEFAULT_LANGUAGE

                // Apply language if different from current
                if (languageToUse !== i18n.language) {
                    i18n.changeLanguage(languageToUse)
                }

                // Ensure it's saved to localStorage
                localStorage.setItem(STORAGE_KEY, languageToUse)

            } catch (error) {
                console.warn('Failed to initialize language from localStorage:', error)
                // Fallback to default language
                if (i18n.language !== DEFAULT_LANGUAGE) {
                    i18n.changeLanguage(DEFAULT_LANGUAGE)
                }
            }
        }

        // Initialize language on mount
        initializeLanguage()

    }, [i18n])

    const changeLanguage = (language: string) => {
        if (SUPPORTED_LANGUAGES.includes(language as any)) {
            i18n.changeLanguage(language)
            localStorage.setItem(STORAGE_KEY, language)

        } else {
            console.warn(`Unsupported language: ${language}`)
        }
    }

    return {
        currentLanguage: i18n.language,
        changeLanguage,
        supportedLanguages: SUPPORTED_LANGUAGES,
    }
} 