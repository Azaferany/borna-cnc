import {PlayIcon} from '@heroicons/react/24/solid';
import {useStore} from "../../app/store.ts";
import {useGCodeBufferContext} from "../../app/GCodeBufferContext.ts";
import {useState} from 'react';
import {useShallow} from "zustand/react/shallow";
import {ContinueFromHereButton} from "../ContinueFromHereButton/ContinueFromHereButton";
import {StartOptionsModal} from "../StartOptionsModal/StartOptionsModal";
import {Plane} from "../../types/GCodeTypes.ts";
import {useTranslation} from 'react-i18next';

export const StartButton = () => {
    const {t} = useTranslation();
    const { isSending, bufferType, startSending, stopSending } = useGCodeBufferContext();
    const allGCodes = useStore(useShallow(s => s.allGCodes));
    const toolPathGCodes = useStore(useShallow(s => s.toolPathGCodes));
    const status = useStore(s => s.status);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isDisabled = (allGCodes?.length ?? 0) <= 0 || status !== "Idle";
    const isSendingRunning = isSending && bufferType === "GCodeFile";
    const buttonText = isSendingRunning ? (status == "Hold" ? t('startButton.sendingPaused') : t('startButton.sending')) : t('startButton.start');

    const handleStart = async (startFromLine: number) => {
        if (isDisabled) return;
        if (!allGCodes) return;
        if (!toolPathGCodes) return;
        let gCodesToSend = [...allGCodes]

        if (startFromLine != 1) {
            const selectedGcodeCommand = toolPathGCodes.find(x => x.lineNumber == startFromLine)!;
            const maxZPlusSafeguardValue =
                Math.min(
                    ...[
                        ...toolPathGCodes?.map(x => x.startPoint.z) ?? [10],
                        ...toolPathGCodes?.map(x => x.endPoint?.z ?? 10) ?? [10]
                    ]) + 50;

            gCodesToSend = gCodesToSend.slice(startFromLine - 1)
            gCodesToSend.unshift(`N${startFromLine} G53 G1 Z${selectedGcodeCommand.startPoint.z} f${selectedGcodeCommand.feedRate}`);
            gCodesToSend.unshift(`N${startFromLine} G53 G0 X${selectedGcodeCommand.startPoint.x} Y${selectedGcodeCommand.startPoint?.y}`);
            gCodesToSend.unshift(`N${startFromLine} G53 G0 Z${maxZPlusSafeguardValue}`);

            gCodesToSend.unshift(selectedGcodeCommand.isIncremental ? "G91" : "G90")
            gCodesToSend.unshift(selectedGcodeCommand.isInches ? "G20" : "G21")

            if (selectedGcodeCommand.activePlane == Plane.XY) {
                gCodesToSend.unshift("G17")
            } else if (selectedGcodeCommand.activePlane == Plane.YZ) {
                gCodesToSend.unshift("G19")
            } else if (selectedGcodeCommand.activePlane == Plane.XZ) {
                gCodesToSend.unshift("G18")
            }
            gCodesToSend.unshift(selectedGcodeCommand.activeWorkSpace)

            for (let i = 0; i < selectedGcodeCommand.activeMCodes.length; i++) {
                const mCode = selectedGcodeCommand.activeMCodes.slice().reverse()[i];
                if (i === 0 && (mCode.includes("M3") || mCode.includes("M4"))) {
                    if (/s\d+/i.test(mCode)) {
                        gCodesToSend.unshift(mCode.replace(/s\d+/i, `s${selectedGcodeCommand.spindleSpeed}`));
                    } else {
                        gCodesToSend.unshift(`${mCode} s${selectedGcodeCommand.spindleSpeed}`);
                    }
                } else {
                    gCodesToSend.unshift(selectedGcodeCommand.activeMCodes[i])
                }
            }
        }

        try {
            setError(null);
            await startSending(gCodesToSend, "GCodeFile");
            setIsModalOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('startButton.failedToStartSending'));
            console.error('Error starting G-code send:', err);
            stopSending();
        }
    };

    if(status === "Hold" && bufferType === "GCodeFileInReverse" && isSending && (allGCodes?.length ?? 0) > 0) {
        return <ContinueFromHereButton />;
    }

    return (
        <div className="relative group h-full">
            <button
                className={`
                    w-full h-full
                    bg-green-600 hover:bg-green-700 active:bg-green-900 
                    p-3 rounded flex flex-col items-center justify-center 
                    transition-all duration-150
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    ${isSendingRunning ? 'animate-pulse' : ''}
                `}
                onClick={() => !isDisabled && !isSendingRunning && setIsModalOpen(true)}
                disabled={isDisabled || isSendingRunning}
                aria-label={buttonText}
                aria-busy={isSendingRunning}
                title={
                    isDisabled
                        ? (allGCodes?.length === 0
                            ? t('startButton.noGCodeAvailable')
                            : t('startButton.machineIdleRequired', {status}))
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
                        ? t('startButton.noGCodeAvailable')
                        : t('startButton.machineIdleRequired', {status})}
                </div>
            )}

            <StartOptionsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onStart={handleStart}
            />
        </div>
    );
};