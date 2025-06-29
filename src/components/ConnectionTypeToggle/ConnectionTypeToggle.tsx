import React, {useState} from 'react';
import {useStore} from '../../app/store';
import {useTranslation} from 'react-i18next';

export const ConnectionTypeToggle: React.FC = () => {
    const {t} = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const connectionType = useStore(x => x.connectionType);
    const setConnectionType = useStore(x => x.setConnectionType);
    const isConnected = useStore(x => x.isConnected);

    const connectionTypes = ['websocket', 'serial'] as const;

    const getConnectionTypeLabel = (type: typeof connectionTypes[number]) => {
        return t(`connectionTypeToggle.${type}`);
    };

    const handleTypeSelect = (type: typeof connectionTypes[number]) => {
        setConnectionType(type);
        setIsOpen(false);
    };

    // Don't render anything if not in development environment
    if (!import.meta.env.DEV) {
        return null;
    }

    if (isConnected)
        return null;
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isConnected}
                className={`px-4 py-1.5 rounded-md flex items-center space-x-2 ${
                    isConnected
                        ? 'bg-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-gray-700 hover:bg-gray-600'
                }`}
            >
                <span>{getConnectionTypeLabel(connectionType)}</span>
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
                <div className="absolute top-full left-0 mt-1 bg-gray-800 rounded-md shadow-lg z-10">
                    {connectionTypes.map((type) => (
                        <button
                            key={type}
                            onClick={() => handleTypeSelect(type)}
                            className="block w-full px-4 py-2 text-left hover:bg-gray-700 rounded-md"
                        >
                            {getConnectionTypeLabel(type)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}; 