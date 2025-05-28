import { PlayIcon } from '@heroicons/react/24/solid';
import { useStore } from "../../app/store.ts";
import { useGCodeBufferContext } from "../../app/GCodeBufferContext.ts";
import { useGRBL } from "../../app/useGRBL.ts";
import { useState } from 'react';
import {findGCodeCommandOrLatestBaseOnLine} from "../../app/findGCodeCommandOrLatestBaseOnLine.ts";

export const StartButton = () => {
    const { isSending, bufferType, startSending, stopSending } = useGCodeBufferContext();
    const { sendCommand } = useGRBL();
    const allGCodes = useStore(s => s.allGCodes);
    const status = useStore(s => s.status);
    const selectedGCodeLine = useStore(s => s.selectedGCodeLine);
    const machineCoordinate = useStore(s => s.machineCoordinate);
    const toolPathGCodes = useStore(s => s.toolPathGCodes);

    const [error, setError] = useState<string | null>(null);

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

    const handleContinueFromHere = async () => {
        console.log("asdasd")
        if (status === "Hold" && bufferType === "GCodeFileInReverse" && isSending && (allGCodes?.length ?? 0) > 0) {
            try {
                setError(null);

                const gCodeLines = [...(allGCodes ?? [])].slice((selectedGCodeLine ?? 0) - 1)
                const currentGCodeCommand =
                    findGCodeCommandOrLatestBaseOnLine(selectedGCodeLine ?? 0, toolPathGCodes ?? [])!

                if (currentGCodeCommand?.isArcMove) {
                    const newI = currentGCodeCommand.arcCenter!.x - machineCoordinate.x
                    const newJ = currentGCodeCommand.arcCenter!.y - machineCoordinate.y
                    const newK = currentGCodeCommand.arcCenter!.z - machineCoordinate.z

                    // Update the raw command with new I, J, K values
                    const updatedCommand = currentGCodeCommand.rawCommand
                        .replace(/I[-\d.]+/, `I${newI}`)
                        .replace(/J[-\d.]+/, `J${newJ}`)
                        .replace(/K[-\d.]+/, `K${newK}`);

                    gCodeLines[0] = updatedCommand;
                }

                //set feedRate
                if (!gCodeLines[0].includes('F')) {
                    gCodeLines[0] = `${gCodeLines[0]} F${currentGCodeCommand.feedRate}`;
                }

                await handleCommand('\x18'); // Soft reset
                stopSending();
                startSending(gCodeLines ?? [],"GCodeFile");


            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to start sending reversed G-code');
                console.error('Error starting reversed G-code send:', err);
                stopSending();
            }
        }
    };

    const handleStart = async () => {
        if (isDisabled) return;

        try {
            setError(null);
            // If machine is not in Idle state, send a soft reset first
            if (status !== "Idle") {
                await handleCommand('\x18'); // Soft reset
                stopSending();
                startSending(allGCodes ?? [],"GCodeFile");
                return;
            }

            await startSending(allGCodes ?? [], "GCodeFile");
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start sending G-code');
            console.error('Error starting G-code send:', err);
            stopSending();
        }
    };

    if(status === "Hold" && bufferType === "GCodeFileInReverse" && isSending && (allGCodes?.length ?? 0) > 0) {
        return (
            <button
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-900
                p-3 rounded flex flex-col items-center justify-center
                transition-all duration-150"
                onClick={handleContinueFromHere}
                aria-label="Continue from here"
            >
                <PlayIcon className="h-6 w-6" />
                <span className="text-sm mt-1">Continue from here</span>
            </button>
        )
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