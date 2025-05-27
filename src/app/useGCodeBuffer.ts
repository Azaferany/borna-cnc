import { useState, useEffect } from 'react';
import { useStore } from './store';
import { useGRBL } from './useGRBL';
import {useGRBLListener} from "./useGRBLListener.ts";

export const useGCodeBuffer = (bufferGCodesList:string[],) => {
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
            console.debug('Sending command:', command);
            await sendCommand(command);
        } catch (error) {
            console.error('Error sending command:', error);
            stopSending()
            setWaitingForOk(false);
        }
    };

    const sendNextLine = async () => {
        if (waitingForOk) {
            console.debug('Waiting for OK response, skipping send');
            return;
        }

        const nextLine = lastSentLine + 1;
        const pendingLines = nextLine - (selectedGCodeLine ?? 0);

        console.debug('Send status:', {
            nextLine,
            pendingLines,
            availableBufferSlots,
            lastSentLine,
            selectedGCodeLine,
            totalLines: bufferGCodesList?.length
        });

        if (lastSentLine >= ((bufferGCodesList?.length ?? 0) - 1) || !isConnected || !bufferGCodesList?.[nextLine]) {
            console.debug('Stopping send process:', {
                reason: lastSentLine >= ((bufferGCodesList?.length ?? 0) - 1) ? 'Reached end of file' :
                    !isConnected ? 'Not connected' : 'No next line available'
            });
            stopSending()
            return;
        }

        if (pendingLines < availableBufferSlots) {
            console.debug('Sending line:', {
                lineNumber: nextLine,
                content: bufferGCodesList[nextLine]
            });
            setWaitingForOk(true);
            await handleCommand(bufferGCodesList[nextLine]);
            updateLastSentLine(nextLine);
        } else {
            console.debug('Buffer full, waiting for execution:', {
                pendingLines,
                availableBufferSlots
            });
        }

        if (nextLine === (bufferGCodesList?.length ?? 0)) {
            stopSending()
            return;
        }
    };

    useEffect(() => {
        if (isSending && (
            status === "Door" ||
            status === "Alarm" ||
            !isConnected)) {
            stopSending()
            return;
        }

        if (
            isConnected &&
            bufferGCodesList &&
            isSending &&
            !waitingForOk &&
            status !== "Hold" &&
            status !== "Home"
        ) {
            console.debug('Effect triggered, attempting to send next line');
            sendNextLine();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedGCodeLine, lastSentLine, isConnected, bufferGCodesList, isSending, waitingForOk, status]);

    const startSending = () => {
        const canStartNow = isConnected;
        if (!canStartNow) {
            console.debug('Cannot start sending - conditions not met');
            return;
        }
        console.debug('Starting G-code send process');
        setIsSending(true);
    };

    const stopSending = () => {
        console.debug('Stopping G-code send process');
        setIsSending(false);
        updateLastSentLine(-1);
        setWaitingForOk(false);
    };

    const handleOkResponse = () => {
        console.debug('Received OK, ready for next line');
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
        canStart: isConnected && bufferGCodesList && bufferGCodesList.length > 0 && !isSending
    };
}; 