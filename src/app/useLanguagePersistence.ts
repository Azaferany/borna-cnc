import {useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {secureStorage} from './secureStorage'

const STORAGE_KEY = 'i18nextLng'
const SUPPORTED_LANGUAGES = ['en', 'fa'] as const
const DEFAULT_LANGUAGE = 'en'

export const useLanguagePersistence = () => {
    const {i18n} = useTranslation()

    useEffect(() => {
        const initializeLanguage = async () => {
            try {
                // Get saved language from secure storage
                const savedLanguage = await secureStorage.getItem(STORAGE_KEY)
                console.log(`🔄 Initializing language - Found in storage: ${savedLanguage}`)
                
                // Validate saved language
                const isValidLanguage = SUPPORTED_LANGUAGES.includes(savedLanguage as any)
                const languageToUse = isValidLanguage ? savedLanguage! : DEFAULT_LANGUAGE

                console.log(`🌐 Language to use: ${languageToUse} (valid: ${isValidLanguage})`)

                // Apply language if different from current
                if (languageToUse !== i18n.language) {
                    console.log(`🔄 Changing language from ${i18n.language} to ${languageToUse}`)
                    i18n.changeLanguage(languageToUse)
                }

                // Ensure it's saved to secure storage
                const saveSuccess = await secureStorage.setItem(STORAGE_KEY, languageToUse)
                console.log(`✅ Language persistence initialized: ${languageToUse} (saved: ${saveSuccess})`)
                
            } catch (error) {
                console.warn('❌ Failed to initialize language from secure storage:', error)
                // Fallback to default language
                if (i18n.language !== DEFAULT_LANGUAGE) {
                    console.log(`🔄 Falling back to default language: ${DEFAULT_LANGUAGE}`)
                    i18n.changeLanguage(DEFAULT_LANGUAGE)
                }
            }
        }

        // Initialize language on mount
        initializeLanguage()

    }, [i18n])

    const changeLanguage = async (language: string) => {
        if (SUPPORTED_LANGUAGES.includes(language as any)) {
            try {
                i18n.changeLanguage(language)
                const saveSuccess = await secureStorage.setItem(STORAGE_KEY, language)
                console.log(`✅ Language changed and saved to secure storage: ${language} (saved: ${saveSuccess})`)

                // For verification, try to read it back
                const saved = await secureStorage.getItem(STORAGE_KEY)
                console.log(`🔍 Verification - secure storage contains: ${saved}`)
            } catch (error) {
                console.error('❌ Failed to save language to secure storage:', error)
            }
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