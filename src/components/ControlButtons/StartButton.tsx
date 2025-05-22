import { PlayIcon } from '@heroicons/react/24/solid';
import { useStore } from "../../app/store.ts";
import {useGRBLListener} from "../../app/useGRBLListener.ts";
import {useEffect, useState} from "react";
import {useGRBL} from "../../app/useGRBL.ts";

export const StartButton = () => {
    const { sendCommand, isConnected } = useGRBL();

    const allGCodes = useStore(s => s.allGCodes);
    const selectedGCodeLine = useStore(s => s.selectedGCodeLine);
    const availableBufferSlots = useStore(s => s.availableBufferSlots);
    const lastSentLine = useStore(s => s.lastSentLine);
    const updateLastSentLine = useStore(s => s.updateLastSentLine);
    const status = useStore(s => s.status);
    const isSending = useStore(s => s.isSending);
    const setIsSending = useStore(s => s.setIsSending);
    const [waitingForOk, setWaitingForOk] = useState(false);

    useGRBLListener(line => {
        if(line == "ok") {
            console.log('Received OK, ready for next line');
            setWaitingForOk(false);
        }
        else if(line.includes("error")) {
            console.error('GRBL Error:', line);
            setIsSending(false);
            updateLastSentLine(-1);        }
    });

    const handleCommand = async (command: string) => {
        try {
            console.log('Sending command:', command);
            await sendCommand(command);
        } catch (error) {
            console.error('Error sending command:', error);
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
            setIsSending(false);
            updateLastSentLine(-1);
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
        if (nextLine == (allGCodes?.length ?? 0)){
            setIsSending(false);
            updateLastSentLine(-1);
            return;
        }
    };


    useEffect(() => {
        if (lastSentLine == (allGCodes?.length ?? 0) - 1 || status == "Door" || status == "Alarm" || !isConnected){
            setIsSending(false);
            updateLastSentLine(-1);
            return;
        }
        if (
            isConnected &&
            allGCodes &&
            lastSentLine < allGCodes.length - 1 &&
            isSending &&
            !waitingForOk &&
            status != "Hold" &&
            status != "Home") {
            console.log('Effect triggered, attempting to send next line');
            sendNextLine();
        }
    }, [selectedGCodeLine, lastSentLine, isConnected, allGCodes, isSending, waitingForOk,status]);

    const isDisabled = !isConnected || !allGCodes || allGCodes.length === 0 || isSending;

    return (
        <button
            className={`bg-green-600 hover:bg-green-700 active:bg-green-900 p-3 rounded flex flex-col items-center justify-center transition-colors duration-150 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => {
                console.log('Start button clicked, beginning send process');
                setIsSending(true);
            }}
            disabled={isDisabled}
        >
            <PlayIcon className="h-6 w-6" />
            <span className="text-sm mt-1">{isSending ? 'Sending' : "Start"}</span>
        </button>
    );
}; 