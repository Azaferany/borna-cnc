import {PlayIcon} from '@heroicons/react/24/solid';
import {useStore} from "../../app/store.ts";
import {useGCodeBufferContext} from "../../app/GCodeBufferContext.ts";
import {useState} from 'react';
import {useShallow} from "zustand/react/shallow";
import {ContinueFromHereButton} from "../ContinueFromHereButton/ContinueFromHereButton";

export const StartButton = () => {
    const { isSending, bufferType, startSending, stopSending } = useGCodeBufferContext();
    const allGCodes = useStore(useShallow(s => s.allGCodes));
    const status = useStore(s => s.status);

    const [error, setError] = useState<string | null>(null);

    const isDisabled = (allGCodes?.length ?? 0) <= 0 || status !== "Idle";
    const isSendingRunning = isSending && bufferType === "GCodeFile";
    const buttonText =  isSendingRunning ? (status == "Hold" ? "Sending Paused" : 'Sending...') : 'Start';

    const handleStart = async () => {
        if (isDisabled) return;

        try {
            setError(null);
            await startSending(allGCodes ?? [], "GCodeFile");
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start sending G-code');
            console.error('Error starting G-code send:', err);
            stopSending();
        }
    };

    if(status === "Hold" && bufferType === "GCodeFileInReverse" && isSending && (allGCodes?.length ?? 0) > 0) {
        return <ContinueFromHereButton />;
    }

    return (
        <div className="relative group flex flex-col gap-2">
            <button
                className={`
                    bg-green-600 hover:bg-green-700 active:bg-green-900 
                    p-3 rounded flex flex-col items-center justify-center 
                    transition-all duration-150
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isSendingRunning ? 'animate-pulse' : ''}
                `}
                onClick={handleStart}
                disabled={isDisabled || isSendingRunning}
                aria-label={buttonText}
                aria-busy={isSendingRunning}
                title={
                    isDisabled
                        ? (allGCodes?.length === 0
                            ? 'No G-code available to send'
                            : `Machine must be in Idle state (current: ${status})`)
                        : buttonText
                }
            >
                <PlayIcon
                    className={`h-6 w-6 ${
                        isSendingRunning ? 'animate-spin' : ''
                    }`}
                />
                <span className="text-sm mt-1">
                    {buttonText}
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