import {FireIcon} from '@heroicons/react/24/solid';
import {NoSymbolIcon} from '@heroicons/react/24/outline';
import {useGRBL} from "../../app/useGRBL.ts";
import {useStore} from "../../app/store.ts";

export const MainGasButton = () => {
    const {sendCommand, isConnected} = useGRBL();
    const status = useStore(s => s.status);
    const isSending = useStore(s => s.isSending);
    const spindleSpeed = useStore(s => s.spindleSpeed);

    const handleClick = async () => {
        try {
            const command = spindleSpeed > 0 ? 'M5 s0' : 'M3 s1'; // M3 for gas on, M5 for gas off
            await sendCommand(command);
        } catch (error) {
            console.error('Error sending gas command:', error);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`py-4.5 ${spindleSpeed > 0 ? 'bg-green-600 hover:bg-green-700 active:bg-green-900' : 'bg-red-600 hover:bg-red-700 active:bg-red-900'} p-3 rounded flex flex-col items-center justify-center transition-colors duration-150 ${(!isConnected || isSending || status != "Idle") ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isConnected || isSending || status != "Idle"}
        >
            {spindleSpeed > 0 ? <FireIcon className="h-6 w-6"/> : <NoSymbolIcon className="h-6 w-6"/>}
            <span className="text-sm mt-1">Main Gas {spindleSpeed > 0 ? 'ON' : 'OFF'}</span>
        </button>
    );
}; 