import { useState, useEffect } from 'react';
import { useStore } from './store';
import { useGRBL } from './useGRBL';
import {useGRBLListener} from "./useGRBLListener.ts";

interface UseGCodeBufferProps {
    allGCodes: string[];
}

export const useGCodeBuffer = ({ allGCodes }: UseGCodeBufferProps) => {
    const { sendCommand, isConnected } = useGRBL();
    const selectedGCodeLine = useStore(s => s.selectedGCodeLine);
    const availableBufferSlots = useStore(s => s.availableBufferSlots);
    const lastSentLine = useStore(s => s.lastSentLine);
    const updateLastSentLine = useStore(s => s.updateLastSentLine);
    const status = useStore(s => s.status);
    const isSending = useStore(s => s.isSending);
    const setIsSending = useStore(s => s.setIsSending);

    const [waitingForOk, setWaitingForOk] = useState(false);

    const handleCommand = async (command: string) => {
        try {
            console.log('Sending command:', command);
            await sendCommand(command);
        } catch (error) {
            console.error('Error sending command:', error);
            stopSending()
            setWaitingForOk(false);
        }
    };

    const sendNextLine = async () => {
        if (waitingForOk) {
            console.log('Waiting for OK response, skipping send');
            return;
        }

        const nextLine = lastSentLine + 1;
        const pendingLines = nextLine - (selectedGCodeLine ?? 0);

        console.log('Send status:', {
            nextLine,
            pendingLines,
            availableBufferSlots,
            lastSentLine,
            selectedGCodeLine,
            totalLines: allGCodes?.length
        });

        if (lastSentLine >= ((allGCodes?.length ?? 0) - 1) || !isConnected || !allGCodes?.[nextLine]) {
            console.log('Stopping send process:', {
                reason: lastSentLine >= ((allGCodes?.length ?? 0) - 1) ? 'Reached end of file' :
                    !isConnected ? 'Not connected' : 'No next line available'
            });
            stopSending()
            return;
        }

        if (pendingLines < availableBufferSlots) {
            console.log('Sending line:', {
                lineNumber: nextLine,
                content: allGCodes[nextLine]
            });
            setWaitingForOk(true);
            await handleCommand(allGCodes[nextLine]);
            updateLastSentLine(nextLine);
        } else {
            console.log('Buffer full, waiting for execution:', {
                pendingLines,
                availableBufferSlots
            });
        }

        if (nextLine === (allGCodes?.length ?? 0)) {
            stopSending()
            return;
        }
    };

    useEffect(() => {
        if (isSending && (lastSentLine === (allGCodes?.length ?? 0) - 1 ||
            status === "Door" ||
            status === "Alarm" ||
            !isConnected)) {
            stopSending()
            return;
        }

        if (
            isConnected &&
            allGCodes &&
            lastSentLine < allGCodes.length - 1 &&
            isSending &&
            !waitingForOk &&
            status !== "Hold" &&
            status !== "Home"
        ) {
            console.log('Effect triggered, attempting to send next line');
            sendNextLine();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedGCodeLine, lastSentLine, isConnected, allGCodes, isSending, waitingForOk, status]);

    const startSending = () => {
        const canStartNow = isConnected && allGCodes && allGCodes.length > 0 && !isSending;
        if (!canStartNow) {
            console.log('Cannot start sending - conditions not met');
            return;
        }
        console.log('Starting G-code send process');
        setIsSending(true);
    };

    const stopSending = () => {
        console.log('Stopping G-code send process');
        setIsSending(false);
        updateLastSentLine(-1);
        setWaitingForOk(false);
    };

    const handleOkResponse = () => {
        console.log('Received OK, ready for next line');
        setWaitingForOk(false);
    };


    useGRBLListener(line => {
        if(line === "ok") {
            handleOkResponse();
        }
        else if(line.includes("error")) {
            stopSending();
        }
    });

    return {
        isSending,
        startSending,
        stopSending,
        canStart: isConnected && allGCodes && allGCodes.length > 0 && !isSending
    };
}; 