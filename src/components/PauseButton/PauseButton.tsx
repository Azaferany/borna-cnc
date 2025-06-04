import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { useGRBL } from "../../app/useGRBL.ts";
import { useStore } from "../../app/store.ts";

export const PauseButton = () => {
    const { sendCommand, isConnected } = useGRBL();
    const status = useStore(s => s.status);

    const handleCommand = async (command: string) => {
        try {
            console.log('Sending command:', command);
            await sendCommand(command);
        } catch (error) {
            console.error('Error sending command:', error);
        }
    };

    return (
        <button
            className={`bg-orange-600 hover:bg-orange-700 active:bg-orange-900 p-3 rounded flex flex-col items-center justify-center transition-colors duration-150 ${(!isConnected || status === "Door") ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => {
                const command = status === "Hold" ? '~' : '!'; // '~' for cycle start, '!' for feed hold
                handleCommand(command);
            }}
            disabled={!isConnected || status === "Door"}
        >
            {status === "Hold" ? <PlayIcon className="h-6 w-6" /> : <PauseIcon className="h-6 w-6" />}
            <span className="text-sm mt-1">{status === "Hold" ? 'Continue' : 'Pause'}</span>
        </button>
    );
}; 