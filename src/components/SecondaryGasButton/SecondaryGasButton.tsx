import {useState} from 'react';
import {FireIcon} from '@heroicons/react/24/solid';
import {NoSymbolIcon} from '@heroicons/react/24/outline';
import {useGRBL} from "../../app/useGRBL.ts";
import {useStore} from "../../app/store.ts";

export const SecondaryGasButton = () => {
    const [isOn, setIsOn] = useState(false);
    const {sendCommand, isConnected} = useGRBL();
    const isSending = useStore(s => s.isSending);
    const status = useStore(s => s.status);

    const handleClick = async () => {
        try {
            const command = isOn ? 'M9' : 'M8'; // M8 for gas on, M9 for gas off
            await sendCommand(command);
            setIsOn(!isOn);
        } catch (error) {
            console.error('Error sending gas command:', error);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`py-4.5 ${isOn ? 'bg-green-600 hover:bg-green-700 active:bg-green-900' : 'bg-red-600 hover:bg-red-700 active:bg-red-900'} p-3 rounded flex flex-col items-center justify-center transition-colors duration-150 ${(!isConnected || isSending || status != "Idle") ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isConnected || isSending || status != "Idle"}
        >
            {isOn ? <FireIcon className="h-6 w-6"/> : <NoSymbolIcon className="h-6 w-6"/>}
            <span className="text-sm mt-1">Secondary Gas {isOn ? 'ON' : 'OFF'}</span>
        </button>
    );
}; 