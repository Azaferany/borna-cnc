import {useStore} from "../../app/store";
import {WifiIcon, ExclamationTriangleIcon} from '@heroicons/react/24/solid';
import {useTranslation} from 'react-i18next';

export const ConnectionStatus = ({className = ''}: { className?: string }) => {
    const {t} = useTranslation();
    const isConnected = useStore(x => x.isConnected);

    return (
        <div className={`px-4 py-2 rounded flex items-center gap-1 ${
            isConnected
                ? 'bg-green-900/30 text-green-400 border border-green-700/50'
                : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50'
        } ${className}`}>
            {isConnected ? (
                <>
                    <WifiIcon className="h-4 w-4"/>
                    <span className="text-sm font-medium">{t('connectionStatus.connected')}</span>
                </>
            ) : (
                <>
                    <ExclamationTriangleIcon className="h-4 w-4"/>
                    <span className="text-sm font-medium">{t('connectionStatus.connecting')}</span>
                </>
            )}
        </div>
    );
}; 