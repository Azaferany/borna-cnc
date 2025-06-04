import { PlayIcon, StopIcon } from '@heroicons/react/24/solid';
import { useGRBL } from "../../app/useGRBL.ts";
import { useStore } from "../../app/store.ts";

export const StopButton = () => {
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

    const handleContinue = async () => {
        if (window.confirm('Are you sure you want to continue? Make sure the door is closed.')) {
            await handleCommand('~');
        }
    };

    return (
        <button
            className={`${status === "Door" ? 'bg-green-600 hover:bg-green-700 active:bg-green-900' : 'bg-red-600 hover:bg-red-700 active:bg-red-900'} p-3 rounded flex flex-col items-center justify-center transition-colors duration-150 ${(!isConnected || status === "Door") ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={status === "Door" ? handleContinue : () => handleCommand('\x84')}
            disabled={!isConnected}
        >
            {status === "Hold" ? <PlayIcon className="h-6 w-6" /> : <StopIcon className="h-6 w-6" />}
            <span className="text-sm mt-1">{status === "Door" ? 'Continue' : 'Stop'}</span>
        </button>
    );
}; 