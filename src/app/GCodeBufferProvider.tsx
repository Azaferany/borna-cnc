import React, {type ReactNode, useCallback, useEffect, useMemo, useState} from "react";
import {useGRBL} from "./useGRBL.ts";
import {useGRBLListener} from "./useGRBLListener.ts";
import {GCodeBufferContext} from "./GCodeBufferContext.ts";
import {extractLineNumber} from "./GcodeParserUtils.ts";
import {useStore} from "./store.ts";
import type {BufferType} from "../types/GCodeTypes.ts";
import { Plane } from "../types/GCodeTypes.ts";

interface GCodeBufferProviderProps {
    children: ReactNode;
}
export const GCodeBufferProvider: React.FC<GCodeBufferProviderProps> = ({
                                                                            children,
                                                                        }) => {
    // Access dependencies from other hooks
    const { sendCommand, isConnected } = useGRBL();
    const selectedGCodeLine = useStore((s) => s.selectedGCodeLine);
    const selectGCodeLine = useStore((s) => s.selectGCodeLine);
    const availableBufferSlots = useStore((s) => s.availableBufferSlots);
    const lastSentLine = useStore((s) => s.lastSentLine);
    const updateLastSentLine = useStore((s) => s.updateLastSentLine);
    const status = useStore((s) => s.status);
    const isSending = useStore((s) => s.isSending);
    const bufferType = useStore((s) => s.bufferType);
    const setIsSending = useStore((s) => s.setIsSending);


    // Component-specific state
    const [bufferGCodesList, setBufferGCodesList] = useState<string[]>([]);
    const [waitingForOk, setWaitingForOk] = useState<boolean>(false);

    const [IsAllLineSent, setIsAllLineSent] = useState(false)


    // useEffect(() => {
    //     if (dwell.RemainingSeconds <= 0 || !isSending || !selectedGCodeLine || bufferGCodesList.length === 0 || lastSentLine <= 0 || lastSentLine == selectedGCodeLine)
    //         return;
    //     const runningDwellIndex = bufferGCodesList.slice(selectedGCodeLine - 1, lastSentLine - 1).findIndex(x => x.includes("G4 P"))
    //     if (runningDwellIndex == -1)
    //         return;
    //     selectGCodeLine(selectedGCodeLine + runningDwellIndex )
    //
    // }, [isSending, dwell, selectedGCodeLine, bufferGCodesList, lastSentLine, selectGCodeLine]);


    /**
     * Halts the G-code sending process.
     */
    const stopSending =useCallback(() => {
        console.debug('Stopping G-code send process');
        setIsSending(false); // Update Zustand store
        setIsAllLineSent(false);

        updateLastSentLine(0); // Update Zustand store
        setWaitingForOk(false); // Reset local state
    },[setIsSending, updateLastSentLine]); // Dependencies for useCallback


    /**
     * Handles sending a single command to GRBL and sets the waitingForOk flag.
     * @param command The G-code command string to send.
     */
    const handleCommand =useCallback(async (command: string) => {
        try {
            console.log('Sending command:', command);
            await sendCommand(command);
            setWaitingForOk(true); // Set true as we are now waiting for an 'ok'
        } catch (error) {
            console.error('Error sending command:', error);
            stopSending(); // Stop sending on error (calls the memoized stopSending from context)
            setWaitingForOk(false); // Reset waiting state
        }
    },[sendCommand, stopSending]);

    /**
     * Attempts to send the next G-code line from the buffer.
     * This function is memoized using useCallback to prevent unnecessary re-renders.
     */
    const sendNextLine = useCallback(async () => {
        const nextLineIndex = lastSentLine; // Calculate the index of the next line to send

        // Skip if already waiting for an 'ok' or if buffer slots are low to prevent overflow
        if (waitingForOk && nextLineIndex > 10) {
            console.debug('AttemptSendNextLine skipped:', { isWaitingForOk: waitingForOk, availableBufferSlots });
            return;
        }

        const totalLines = bufferGCodesList?.length ?? 0;

        if (Math.abs(lastSentLine - (selectedGCodeLine ?? 0)) > 15) {
            console.debug('AttemptSendNextLine skipped:', { buffered: (lastSentLine - (selectedGCodeLine ?? 0)), availableBufferSlots });
            return;
        }

        // Check if all lines have been sent
        if (nextLineIndex >= totalLines) {
            console.debug('All lines sent. Stopping sending process.');
            setIsAllLineSent(true);
            return;
        }

        const lineToSend = bufferGCodesList[nextLineIndex]; // Get the G-code line

        console.debug('Send status:', {
            nextLineIndex,
            availableBufferSlots,
            lastSentLine,
            selectedGCodeLine,
            totalLines: totalLines
        });

        console.debug('Sending line:', {
            lineNumber: nextLineIndex,
            content: lineToSend
        });

        await handleCommand(lineToSend); // Send the command
        updateLastSentLine(nextLineIndex + 1); // Update the last sent line index
    },[availableBufferSlots, bufferGCodesList, handleCommand, lastSentLine, selectedGCodeLine, updateLastSentLine, waitingForOk])


    /**
     * Initiates the G-code sending process.
     * @param gCodes An array of G-code strings to send.
     */
    const startSending = useCallback(
        (gCodes: string[],bufferType:BufferType) => {
            const currentState = useStore.getState(); // Get latest state

            // Pre-flight checks
            if (!isConnected) {
                console.warn('Cannot start sending: Not connected to GRBL.');
                return;
            }
            if (currentState.isSending) { // isSending is from Zustand store
                console.warn('Cannot start sending: Already sending.');
                return;
            }
            if (gCodes.length === 0) {
                console.warn(
                    'Cannot start sending: No G-code lines provided. (This might be the issue in "loop 2" if allGCodes is empty)'
                );
                console.log('Received gCodes for startSending:', gCodes);
                return;
            }

            console.debug('Starting G-code send process');

            // Set the buffer with the provided G-code lines
            setBufferGCodesList(gCodes); // Update local state
            setIsSending(true,bufferType); // Update Zustand store
            selectGCodeLine(1); // Update Zustand store
            updateLastSentLine(0); // Reset to 0 to start from line 1 (Zustand store)
            setWaitingForOk(false); // Ensure not waiting for 'ok' when starting (local state)
        },
        [isConnected, selectGCodeLine, setIsSending, updateLastSentLine] // Dependencies for useCallback
    );

    useEffect(() => {
        const moveGCodes = bufferGCodesList
            .map(x => x.toUpperCase())
            .filter(x=>x.includes("G0") || x.includes("G1")|| x.includes("G2"));
        if (IsAllLineSent && selectedGCodeLine &&
            (
                (moveGCodes[moveGCodes.length - 1] && extractLineNumber(moveGCodes[moveGCodes.length - 1])! - selectedGCodeLine) == 0
                ||
                (moveGCodes.length < 2)

                // when resting because of going back btn slight time status === "Idle"
                // || (status === "Idle" && (extractLineNumber(moveGCodes[moveGCodes.length - 1])! - selectedGCodeLine) < 0)
            ))
            stopSending()
    }, [bufferGCodesList, IsAllLineSent, selectedGCodeLine, stopSending, status]);
    /**
     * Effect hook to manage the G-code sending process.
     * It triggers `sendNextLine` based on various conditions.
     */
    useEffect(() => {
        // Stop sending if GRBL is in an undesirable state or disconnected
        if (
            isSending && // isSending is from Zustand store
            (status === 'Door' || status === 'Alarm' || !isConnected) // status, isConnected from Zustand store/useGRBL
        ) {
            console.warn(
                `Stopping sending due to GRBL status: ${status} or connection lost.`
            );
            stopSending(); // Calls the memoized stopSending from context
            return;
        }
        // If connected, sending, not waiting for 'ok', and GRBL is not on hold or homing, try to send the next line
        if (
            isConnected &&
            isSending &&
            status !== 'Hold' &&
            status !== 'Home'
        ) {
            console.debug('Effect triggered, attempting to send next line');
            sendNextLine();
        }
    }, [selectedGCodeLine, isConnected, isSending, status, waitingForOk, stopSending, sendNextLine]); // Dependencies for useEffect

    /**
     * Callback for when an 'ok' response is received from GRBL.
     * Resets the waitingForOk flag, allowing the next line to be sent.
     */
    const handleOkResponse = () => {
        console.debug('Received OK response.');
        setWaitingForOk(false); // Allow next line to be sent (local state)
    }; // No dependencies as it only sets a boolean state

    /**
     * Listens for incoming lines from GRBL and handles 'ok' or 'error' responses.
     */
    useGRBLListener(line => {
        if(!isSending)
            return;
        console.log(line);
        if (line === 'ok') {
            handleOkResponse(); // Call the memoized handler
        } else if (line.includes('error')) {
            console.error('GRBL reported an error:', line);
            stopSending(); // Stop sending on GRBL error (calls the memoized stopSending)
        }
    },);

    // Add effect to update active modes based on G-code history
    useEffect(() => {
        if (!selectedGCodeLine || !bufferGCodesList.length) return;

        const currentModes = useStore.getState().activeModes;
        if (!currentModes) return;

        const updatedModes = { ...currentModes };
        let foundWorkCoord = false;
        let foundPlane = false;
        let foundUnits = false;
        let foundPositioning = false;

        // Scan backwards from selected line to find most recent mode commands
        for (let i = selectedGCodeLine - 1; i >= 0; i--) {
            const line = bufferGCodesList[i];

            // Skip if line is undefined or empty
            if (!line) continue;
            
            // Skip if we've found all modes
            if (foundWorkCoord && foundPlane && foundUnits && foundPositioning) break;

            // Check work coordinate system (G54-G59)
            if (!foundWorkCoord) {
                const workCoordMatch = line.match(/G(5[4-9])/);
                if (workCoordMatch) {
                    updatedModes.WorkCoordinateSystem = `G${workCoordMatch[1]}` as "G54" | "G55" | "G56" | "G57" | "G58" | "G59";
                    foundWorkCoord = true;
                }
            }

            // Check plane selection (G17, G18, G19)
            if (!foundPlane) {
                if (line.includes('G17')) {
                    updatedModes.Plane = Plane.XY;
                    foundPlane = true;
                } else if (line.includes('G18')) {
                    updatedModes.Plane = Plane.XZ;
                    foundPlane = true;
                } else if (line.includes('G19')) {
                    updatedModes.Plane = Plane.YZ;
                    foundPlane = true;
                }
            }

            // Check units (G20, G21)
            if (!foundUnits) {
                if (line.includes('G20')) {
                    updatedModes.UnitsType = "Inches";
                    foundUnits = true;
                } else if (line.includes('G21')) {
                    updatedModes.UnitsType = "Millimeters";
                    foundUnits = true;
                }
            }

            // Check positioning mode (G90, G91)
            if (!foundPositioning) {
                if (line.includes('G90')) {
                    updatedModes.PositioningMode = "Absolute";
                    foundPositioning = true;
                } else if (line.includes('G91')) {
                    updatedModes.PositioningMode = "Relative";
                    foundPositioning = true;
                }
            }
        }

        // Only update if any changes were made
        if (JSON.stringify(updatedModes) !== JSON.stringify(currentModes)) {
            useStore.getState().updateActiveModes(updatedModes);
        }
    }, [selectedGCodeLine, bufferGCodesList]);

    // Memoize the context value to prevent unnecessary re-renders of consumers
    const contextValue = useMemo(
        () => ({
            isSending,      // Expose isSending from Zustand store
            bufferType,      // Expose bufferType from Zustand store
            startSending,   // Expose memoized function
            stopSending,    // Expose memoized function
            
        }),
        [bufferType, isSending, startSending, stopSending]
    );

    return (
        <GCodeBufferContext.Provider value={contextValue}>
            {children}
        </GCodeBufferContext.Provider>
    );
};
