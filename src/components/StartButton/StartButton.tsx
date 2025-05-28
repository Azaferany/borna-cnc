import { PlayIcon } from '@heroicons/react/24/solid';
import { useStore } from "../../app/store.ts";
import { useGCodeBufferContext } from "../../app/GCodeBufferContext.ts";
import { useState } from 'react';

export const StartButton = () => {
    const { isSending, startSending } = useGCodeBufferContext();
    const allGCodes = useStore(s => s.allGCodes);
    const [error, setError] = useState<string | null>(null);

    const handleStart = async () => {
        try {
            setError(null);
            await startSending(allGCodes ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start sending G-code');
            console.error('Error starting G-code send:', err);
        }
    };

    const isDisabled = (allGCodes?.length ?? 0) <= 0;
    const buttonText = isSending ? 'Sending...' : 'Start';

    return (
        <div className="relative group flex flex-col">
            <button
                className={`
                    bg-green-600 hover:bg-green-700 active:bg-green-900 
                    p-3 rounded flex flex-col items-center justify-center 
                    transition-all duration-150
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isSending ? 'animate-pulse' : ''}
                `}
                onClick={handleStart}
                disabled={isDisabled || isSending}
                aria-label={buttonText}
                aria-busy={isSending}
                title={isDisabled ? 'No G-code available to send' : buttonText}
            >
                <PlayIcon className={`h-6 w-6 ${isSending ? 'animate-spin' : ''}`} />
                <span className="text-sm mt-1">{buttonText}</span>
            </button>
            
            {error && (
                <div className="absolute bottom-full mb-2 p-2 bg-red-100 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}
            
            {isDisabled && (
                <div className="absolute bottom-full mb-2 p-2 bg-gray-100 text-gray-700 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    No G-code available to send
                </div>
            )}
        </div>
    );
}; 