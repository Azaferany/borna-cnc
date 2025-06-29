import React, {type ReactNode, useCallback, useEffect, useMemo, useState} from "react";
import {useGRBL} from "./useGRBL.ts";
import {useGRBLListener} from "./useGRBLListener.ts";
import {GCodeBufferContext} from "./GCodeBufferContext.ts";
import {extractLineNumber} from "./GcodeParserUtils.ts";
import {useStore} from "./store.ts";
import type {BufferType} from "../types/GCodeTypes.ts";
import {Plane} from "../types/GCodeTypes.ts";
import {ErrorModal} from "../components/ErrorModal/ErrorModal.tsx";

interface ErrorInfo {
    message: string;
    lineNumber?: number;
}

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
    const [okCount, setOkCount] = useState<number>(0);
    const [IsAllLineSent, setIsAllLineSent] = useState(false);

    // Error modal state
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);

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
        setOkCount(0); // Reset ok count
    },[setIsSending, updateLastSentLine]); // Dependencies for useCallback


    /**
     * Handles sending a single command to GRBL.
     * @param command The G-code command string to send.
     */
    const handleCommand =useCallback(async (command: string) => {
        try {
            console.log('Sending command:', command);
            await sendCommand(command);
        } catch (error) {
            console.error('Error sending command:', error);
            stopSending(); // Stop sending on error (calls the memoized stopSending from context)
        }
    },[sendCommand, stopSending]);

    /**
     * Attempts to send the next G-code line from the buffer.
     * This function is memoized using useCallback to prevent unnecessary re-renders.
     */
    const sendNextLine = useCallback(async () => {
        const nextLineIndex = lastSentLine; // Calculate the index of the next line to send

        // Skip if we're waiting for more ok responses (okCount should equal lastSentLine)
        if (okCount < (nextLineIndex - 10)) {
            console.debug('AttemptSendNextLine skipped:', {okCount, lastSentLine, availableBufferSlots});
            return;
        }

        const totalLines = bufferGCodesList?.length ?? 0;

        if (Math.abs(lastSentLine - (selectedGCodeLine ?? 0)) > 10) {
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
            okCount,
            totalLines: totalLines
        });

        console.debug('Sending line:', {
            lineNumber: nextLineIndex,
            content: lineToSend
        });

        await handleCommand(lineToSend); // Send the command
        updateLastSentLine(nextLineIndex + 1); // Update the last sent line index
    }, [availableBufferSlots, bufferGCodesList, handleCommand, lastSentLine, selectedGCodeLine, updateLastSentLine, okCount])


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
            setOkCount(0); // Reset ok count when starting
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
        // If connected, sending, and GRBL is not on hold or homing, try to send the next line
        if (
            isConnected &&
            isSending &&
            status !== 'Hold' &&
            status !== 'Home'
        ) {
            console.debug('Effect triggered, attempting to send next line');
            sendNextLine();
        }
    }, [selectedGCodeLine, isConnected, isSending, status, okCount, stopSending, sendNextLine]); // Dependencies for useEffect

    /**
     * Callback for when an 'ok' response is received from GRBL.
     * Increments the ok count.
     */
    const handleOkResponse = useCallback(() => {
        console.log('Received OK response.');
        setOkCount(prev => {
            if (prev + 1 < lastSentLine)
                return prev + 1;
            return prev;
        }); // Increment ok count
    }, [lastSentLine]); // No dependencies as it only sets a number state

    /**
     * Shows the error modal with error details
     */
    const showError = useCallback((errorInfo: ErrorInfo) => {
        setErrorInfo(errorInfo);
        setIsErrorModalOpen(true);
    }, []);

    /**
     * Closes the error modal and clears error info
     */
    const handleCloseErrorModal = useCallback(() => {
        setIsErrorModalOpen(false);
        setErrorInfo(null);
    }, []);

    /**
     * Listens for incoming lines from GRBL and handles 'ok' or 'error' responses.
     */
    useGRBLListener(line => {
        if (!isSending)
            return;
        if (line === 'ok') {
            handleOkResponse(); // Call the memoized handler
        } else if (line.includes('error')) {
            console.error('GRBL reported an error:', line);
            sendCommand("!")

            setTimeout(() => {
                sendCommand('\x18');
            }, 500)
            // Find the error line based on ok count (the line that caused the error)
            // okCount represents the number of successfully processed lines
            const errorLineNumber = okCount + 2; // Convert to 1-based line number

            // Show error modal with details
            const errorInfoData = {
                message: line,
                lineNumber: errorLineNumber
            };
            showError(errorInfoData);
            
            stopSending(); // Stop sending on GRBL error (calls the memoized stopSending)
        }
    }, [selectedGCodeLine, isSending, handleOkResponse]);

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
            <ErrorModal
                isOpen={isErrorModalOpen}
                onClose={handleCloseErrorModal}
                errorMessage={errorInfo?.message || ''}
                errorLine={bufferGCodesList[errorInfo?.lineNumber ?? 0]}
                selectedGCodeLine={selectedGCodeLine}
                selectedGCodeContent={bufferGCodesList.find(x => x.includes(`N${selectedGCodeLine}`)) ?? ""}
            />
        </GCodeBufferContext.Provider>
    );
};
