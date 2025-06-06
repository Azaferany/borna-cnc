import {StopIcon} from '@heroicons/react/24/solid';
import { useGRBL } from "../../app/useGRBL.ts";
import { useStore } from "../../app/store.ts";

export const ResetButton = () => {
    const { sendCommand, isConnected } = useGRBL();
    const status = useStore(s => s.status);
    const setIsSending = useStore(s => s.setIsSending);

    const handleCommand = async (command: string) => {
        try {
            console.log('Sending command:', command);
            await sendCommand(command);
        } catch (error) {
            console.error('Error sending command:', error);
        }
    };

    const handleReset = async () => {
        setIsSending(false);
        await handleCommand('\x18');
    };

    return (
        <button
            className={`bg-red-600 hover:bg-red-700 active:bg-red-900 p-3 rounded flex flex-col items-center justify-center transition-colors duration-150 ${(!isConnected || status === "Door") ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => handleReset()}
            disabled={!isConnected}
        >
            <StopIcon className="h-6 w-6" />
            <span className="text-sm mt-1">Stop!</span>
        </button>
    );
}; 