// PreviousButton.tsx
import { BackwardIcon } from '@heroicons/react/24/solid';
import { useGRBL } from "../../app/useGRBL.ts";
import { useStore } from "../../app/store.ts";
import { reverseGCode } from "./reverseGCode.ts";
import { useGCodeBufferContext } from "../../app/GCodeBufferContext.ts";
import { useEffect, useState } from 'react';

export const PreviousButton = () => {
    const { sendCommand } = useGRBL();
    const status = useStore(s => s.status);
    const machineCoordinate = useStore(s => s.machineCoordinate);
    const selectedGCodeLine = useStore(s => s.selectedGCodeLine);
    const toolPathGCodes = useStore(s => s.toolPathGCodes);
    const { isSending, bufferType, startSending, stopSending } = useGCodeBufferContext();
    const [error, setError] = useState<string | null>(null);
    const [shouldRestartAfterStop, setShouldRestartAfterStop] = useState<string[] | null>(null);

    const isDisabled =
        status !== "Hold" ||
        !toolPathGCodes ||
        !selectedGCodeLine ||
        (selectedGCodeLine <= toolPathGCodes[0].lineNumber);
    const isSendingRunning = isSending && bufferType === "GCodeFileInReverse";

    const buttonText = isSendingRunning ? (status == "Hold" ? "Sending Paused" : 'Sending...') : 'Previous';

    const handleCommand = async (command: string) => {
        try {
            console.log('Sending command:', command);
            await sendCommand(command);
        } catch (error) {
            console.error('Error sending command:', error);
            stopSending();
            setError('Failed to send command to machine');
        }
    };

    const handlePrevious = async () => {
        if (isDisabled) return;

        try {
            setError(null);
            const reversedCommands = reverseGCode(toolPathGCodes, selectedGCodeLine, machineCoordinate);

            // First, send the soft reset
            await handleCommand('\x18'); // Soft reset

            // Set a flag that we want to restart sending once isSending is false
            setShouldRestartAfterStop(reversedCommands);
            stopSending();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start sending reversed G-code');
            console.error('Error starting reversed G-code send:', err);
            stopSending();
        }
    };

    // Effect to watch for isSending becoming false after we intended to restart
    useEffect(() => {
        if (shouldRestartAfterStop && !isSending) {
            console.log("isSending is false, now attempting to start sending reversed commands.");
            startSending(shouldRestartAfterStop, "GCodeFileInReverse");
            setShouldRestartAfterStop(null);
        }
    }, [isSending, shouldRestartAfterStop, startSending]);

    return (
        <div className="relative group flex flex-col">
            <button
                className={`
                    bg-purple-600 hover:bg-purple-700 active:bg-purple-900 
                    p-3 rounded flex flex-col items-center justify-center 
                    transition-all duration-150
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isSendingRunning ? 'animate-pulse' : ''}
                    ${shouldRestartAfterStop ? 'animate-pulse' : ''}
                `}
                onClick={handlePrevious}
                disabled={isDisabled || isSendingRunning || shouldRestartAfterStop !== null}
                aria-label={buttonText}
                aria-busy={isSendingRunning}
                title={
                    isDisabled 
                        ? !toolPathGCodes || !selectedGCodeLine
                            ? 'No G-code line selected' 
                            : `Machine must be in Hold state (current: ${status})`
                        : buttonText
                }
            >
                <BackwardIcon 
                    className={`h-6 w-6 ${
                        isSendingRunning || shouldRestartAfterStop ? 'animate-spin' : ''
                    }`} 
                />
                <span className="text-sm mt-1">
                    {shouldRestartAfterStop ? 'Resetting...' : buttonText}
                </span>
            </button>
            
            {error && (
                <div className="absolute top-full mb-2 p-2 bg-red-100 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}
            
            {isDisabled && (
                <div className="absolute top-full mb-2 p-2 bg-gray-100 text-gray-700 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    {!toolPathGCodes || !selectedGCodeLine
                        ? 'No G-code line selected or exist'
                        : `Machine must be in Hold state (current: ${status})`}
                </div>
            )}
        </div>
    );
};