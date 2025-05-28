import { PlayIcon } from '@heroicons/react/24/solid';
import { useStore } from "../../app/store.ts";
import { useGCodeBufferContext } from "../../app/GCodeBufferContext.ts";
import { useGRBL } from "../../app/useGRBL.ts";
import { useState, useEffect } from 'react';

export const StartButton = () => {
    const { isSending, bufferType, startSending, stopSending } = useGCodeBufferContext();
    const { sendCommand } = useGRBL();
    const allGCodes = useStore(s => s.allGCodes);
    const status = useStore(s => s.status);
    const [error, setError] = useState<string | null>(null);
    const [shouldRestartAfterStop, setShouldRestartAfterStop] = useState<string[] | null>(null);

    const isDisabled = (allGCodes?.length ?? 0) <= 0 || status !== "Idle";
    const isSendingRunning = isSending && bufferType === "GCodeFile";
    const buttonText =  isSendingRunning ? (status == "Hold" ? "Sending Paused" : 'Sending...') : 'Start';

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

    const handleStart = async () => {
        if (isDisabled) return;

        try {
            setError(null);
            // If machine is not in Idle state, send a soft reset first
            if (status !== "Idle") {
                await handleCommand('\x18'); // Soft reset
                setShouldRestartAfterStop(allGCodes ?? []);
                stopSending();
                return;
            }

            await startSending(allGCodes ?? [], "GCodeFile");
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start sending G-code');
            console.error('Error starting G-code send:', err);
            stopSending();
        }
    };

    // Effect to watch for status changes and restart if needed
    useEffect(() => {
        if (shouldRestartAfterStop && status === "Idle" && !isSending) {
            console.log("Machine is idle, now attempting to start sending G-code.");
            startSending(shouldRestartAfterStop, "GCodeFile");
            setShouldRestartAfterStop(null);
        }
    }, [status, isSending, shouldRestartAfterStop, startSending]);

    return (
        <div className="relative group flex flex-col">
            <button
                className={`
                    bg-green-600 hover:bg-green-700 active:bg-green-900 
                    p-3 rounded flex flex-col items-center justify-center 
                    transition-all duration-150
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isSendingRunning ? 'animate-pulse' : ''}
                    ${shouldRestartAfterStop ? 'animate-pulse' : ''}
                `}
                onClick={handleStart}
                disabled={isDisabled || isSendingRunning || shouldRestartAfterStop !== null}
                aria-label={buttonText}
                aria-busy={isSendingRunning}
                title={
                    isDisabled 
                        ? allGCodes?.length === 0 
                            ? 'No G-code available to send' 
                            : `Machine must be in Idle state (current: ${status})`
                        : buttonText
                }
            >
                <PlayIcon 
                    className={`h-6 w-6 ${
                        isSendingRunning || shouldRestartAfterStop ? 'animate-spin' : ''
                    }`} 
                />
                <span className="text-sm mt-1">
                    {shouldRestartAfterStop ? 'Resetting...' : buttonText}
                </span>
            </button>
            
            {error && (
                <div className="absolute bottom-full mb-2 p-2 bg-red-100 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}
            
            {isDisabled && (
                <div className="absolute bottom-full mb-2 p-2 bg-gray-100 text-gray-700 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    {allGCodes?.length === 0 
                        ? 'No G-code available to send' 
                        : `Machine must be in Idle state (current: ${status})`}
                </div>
            )}
        </div>
    );
}; 