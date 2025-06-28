import {useEffect} from 'react'
import {useTranslation} from 'react-i18next'

const FontController = () => {
    const {i18n} = useTranslation()

    useEffect(() => {
        const applyLanguageFont = () => {
            const body = document.body

            // Remove existing language classes
            body.classList.remove('font-farsi', 'font-english')

            // Apply appropriate class based on current language
            if (i18n.language === 'fa') {
                body.classList.add('font-farsi')
            } else {
                body.classList.add('font-english')
            }
        }

        // Apply font when component mounts
        applyLanguageFont()

        // Listen for language changes
        i18n.on('languageChanged', applyLanguageFont)

        // Cleanup listener on unmount
        return () => {
            i18n.off('languageChanged', applyLanguageFont)
        }
    }, [i18n])

    // This component doesn't render anything
    return null
}

export default FontController 