import { BackwardIcon } from '@heroicons/react/24/solid';
import { useGRBL } from "../../app/useGRBL.ts";
import { useStore } from "../../app/store.ts";

export const PreviousButton = () => {
    const { sendCommand, isConnected } = useGRBL();
    const isSending = useStore(s => s.isSending);

    const handleCommand = async (command: string) => {
        try {
            console.log('Sending command:', command);
            await sendCommand(command);
        } catch (error) {
            console.error('Error sending command:', error);
        }
    };

    const handlePrevious = async () => {
       await handleCommand("!")
    };

    return (
        <button
            className={`bg-purple-600 hover:bg-purple-700 active:bg-purple-900 p-3 rounded flex flex-col items-center justify-center transition-colors duration-150 ${!isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handlePrevious}
            disabled={!isSending || !isConnected}
        >
            <BackwardIcon className="h-6 w-6" />
            <span className="text-sm mt-1">Previous</span>
        </button>
    );
}; 