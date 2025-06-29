// PreviousButton.tsx
import { BackwardIcon } from '@heroicons/react/24/solid';
import { useStore } from "../../app/store.ts";
import { reverseGCode } from "./reverseGCode.ts";
import { useGCodeBufferContext } from "../../app/GCodeBufferContext.ts";
import { useState } from 'react';
import {useShallow} from "zustand/react/shallow";
import {
    useResetGRBLWithoutResettingActiveGModes,
} from "../../app/useResetGRBLWithoutResettingActiveModes.ts";
import {useTranslation} from 'react-i18next';

export const PreviousButton = () => {
    const {t} = useTranslation();
    const { resetGRBLWithoutResettingActiveGModes } = useResetGRBLWithoutResettingActiveGModes()
    const status = useStore(s => s.status);
    const machineCoordinate = useStore(useShallow(s => s.machineCoordinate));
    const selectedGCodeLine = useStore(s => s.selectedGCodeLine);
    const toolPathGCodes = useStore(useShallow(s => s.toolPathGCodes));
    const gCodeOffsets = useStore(useShallow(s => s.gCodeOffsets));
    const { isSending, bufferType, stopSending,startSending } = useGCodeBufferContext();
    const [error, setError] = useState<string | null>(null);

    const isDisabled =
        status !== "Hold" ||
        !toolPathGCodes ||
        !selectedGCodeLine ||
        (selectedGCodeLine <= toolPathGCodes[0]?.lineNumber);
    const isSendingRunning = isSending && bufferType === "GCodeFileInReverse";

    const buttonText = isSendingRunning ? (status == "Hold" ? t('previousButton.sendingPaused') : t('previousButton.sending')) : t('previousButton.previous');

    const handlePrevious = async () => {
        if (isDisabled) return;

        try {
            setError(null);
            const reversedCommands = reverseGCode(toolPathGCodes, selectedGCodeLine, machineCoordinate,gCodeOffsets);

            // First, send the soft reset
            await resetGRBLWithoutResettingActiveGModes(); // Soft reset

            stopSending();
            startSending(reversedCommands,"GCodeFileInReverse")
        } catch (err) {
            setError(err instanceof Error ? err.message : t('previousButton.failedToStartReverse'));
            console.error('Error starting reversed G-code send:', err);
            stopSending();
        }
    };

    return (
        <div className="relative group h-full">
            <button
                className={`
                    w-full h-full
                    bg-purple-600 hover:bg-purple-700 active:bg-purple-900 
                    p-3 rounded flex flex-col items-center justify-center 
                    transition-all duration-150
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isSendingRunning ? 'animate-pulse' : ''}
                `}
                onClick={handlePrevious}
                disabled={isDisabled || isSendingRunning}
                aria-label={buttonText}
                aria-busy={isSendingRunning}
                title={
                    isDisabled
                        ? !toolPathGCodes || !selectedGCodeLine
                            ? t('previousButton.noGCodeLineSelected')
                            : t('previousButton.machineHoldRequired', {status})
                        : buttonText
                }
            >
                <BackwardIcon
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
                    {!toolPathGCodes || !selectedGCodeLine
                        ? t('previousButton.noGCodeLineSelectedOrExist')
                        : t('previousButton.machineHoldRequired', {status})}
                </div>
            )}
        </div>
    );
};