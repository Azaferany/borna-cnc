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

        const handleLanguageChange = (lng: string) => {
            try {
                // Save to localStorage whenever language changes
                localStorage.setItem(STORAGE_KEY, lng)

                // Also save to sessionStorage as backup
                sessionStorage.setItem(STORAGE_KEY, lng)

                console.log(`Language changed and saved: ${lng}`)
            } catch (error) {
                console.warn('Failed to save language to storage:', error)
            }
        }

        // Initialize language on mount
        initializeLanguage()

        // Listen for language changes
        i18n.on('languageChanged', handleLanguageChange)

        // Cleanup
        return () => {
            i18n.off('languageChanged', handleLanguageChange)
        }
    }, [i18n])

    const changeLanguage = (language: string) => {
        if (SUPPORTED_LANGUAGES.includes(language as any)) {
            i18n.changeLanguage(language)
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