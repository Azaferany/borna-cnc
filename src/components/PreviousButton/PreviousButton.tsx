// PreviousButton.tsx
import { BackwardIcon } from '@heroicons/react/24/solid';
import { useGRBL } from "../../app/useGRBL.ts";
import { useStore } from "../../app/store.ts";
import { reverseGCode } from "./reverseGCode.ts";
import { useGCodeBufferContext } from "../../app/GCodeBufferContext.ts";
import { useEffect, useState } from 'react'; // Import useState and useEffect

export const PreviousButton = () => {
    const { sendCommand } = useGRBL();
    const status = useStore(s => s.status);
    const machineCoordinate = useStore(s => s.machineCoordinate);
    const selectedGCodeLine = useStore(s => s.selectedGCodeLine);
    const toolPathGCodes = useStore(s => s.toolPathGCodes);
    const isButtonEnabled = status === "Hold"; // Use strict equality
    const { isSending, startSending, stopSending } = useGCodeBufferContext();

    // State to track if we initiated a stop and intend to restart sending
    const [shouldRestartAfterStop, setShouldRestartAfterStop] = useState<string[] | null>(null);

    const handleCommand = async (command: string) => {
        try {
            console.log('Sending command:', command);
            await sendCommand(command);
        } catch (error) {
            console.error('Error sending command:', error);
            // Consider stopping sending here too if an error occurs during direct command
            stopSending();
        }
    };

    const handlePrevious = async () => {
        if (!isButtonEnabled || !toolPathGCodes || !selectedGCodeLine) return;

        const reversedCommands = reverseGCode(toolPathGCodes, selectedGCodeLine, machineCoordinate);

        // First, send the soft reset. This is critical for GRBL state.
        // It might take a moment for GRBL to acknowledge and for GRBLListener to pick up any state changes.
        await handleCommand('\x18'); // Soft reset

        // Set a flag that we want to restart sending once isSending is false
        // This is the crucial part for handling the asynchronous state update
        setShouldRestartAfterStop(reversedCommands);
        stopSending(); // Initiate the stop. This will update isSending to false asynchronously.
    };

    // Effect to watch for isSending becoming false after we intended to restart
    useEffect(() => {
        if (shouldRestartAfterStop && !isSending) {
            console.log("isSending is false, now attempting to start sending reversed commands.");
            startSending(shouldRestartAfterStop);
            setShouldRestartAfterStop(null); // Reset the flag
        }
    }, [isSending, shouldRestartAfterStop, startSending]); // Dependencies

    return (
        <button
            onClick={handlePrevious}
            disabled={!isButtonEnabled || shouldRestartAfterStop !== null} // Disable if already attempting restart
            className={`bg-purple-600 hover:bg-purple-700 active:bg-purple-900 p-3 rounded flex flex-col items-center justify-center transition-colors duration-150 ${
                isButtonEnabled && shouldRestartAfterStop === null
                    ? ''
                    : 'opacity-40 cursor-not-allowed'
            }`}
        >
            <BackwardIcon className="h-6 w-6" />
            <span className="text-sm mt-1">Previous</span>
        </button>
    );
};