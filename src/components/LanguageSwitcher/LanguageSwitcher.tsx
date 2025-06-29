import {useState} from 'react'
import {GlobeAltIcon} from '@heroicons/react/24/outline'
import {useLanguagePersistence} from '../../app/useLanguagePersistence'

const LanguageSwitcher = () => {
    const [isOpen, setIsOpen] = useState(false)
    const {currentLanguage, changeLanguage} = useLanguagePersistence()

    const handleLanguageChange = (language: string) => {
        changeLanguage(language)
        setIsOpen(false)
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="Switch language"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setIsOpen(!isOpen)
                    }
                }}
            >
                <GlobeAltIcon className="w-4 h-4"/>
                <span>{currentLanguage === 'fa' ? 'فارسی' : 'English'}</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                        <button
                            onClick={() => handleLanguageChange('en')}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 focus:outline-none focus:bg-gray-700 ${
                                currentLanguage === 'en' ? 'text-blue-400 bg-gray-700' : 'text-white'
                            }`}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    handleLanguageChange('en')
                                }
                            }}
                        >
                            English
                        </button>
                        <button
                            onClick={() => handleLanguageChange('fa')}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 focus:outline-none focus:bg-gray-700 ${
                                currentLanguage === 'fa' ? 'text-blue-400 bg-gray-700' : 'text-white'
                            }`}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    handleLanguageChange('fa')
                                }
                            }}
                        >
                            فارسی
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LanguageSwitcher 