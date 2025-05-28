import React, {useCallback, useEffect} from 'react';
import { useStore } from './store.ts';
import type { GRBLState } from '../types/GCodeTypes.ts';

export const GRBLProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const status = useStore(x => x.status);
    const availableBufferSlots = useStore(x => x.availableBufferSlots);
    const machineCoordinate = useStore(x => x.machineCoordinate);
    const selectedGCodeLine = useStore(x => x.selectedGCodeLine);
    const workPlaceCoordinateOffset = useStore(x => x.workPlaceCoordinateOffset);
    const feedrate = useStore(x => x.feedrate);
    const spindleSpeed = useStore(x => x.spindleSpeed);
    const feedrateOverridePercent = useStore(x => x.feedrateOverridePercent);
    const rapidSpeedOverridePercent = useStore(x => x.rapidSpeedOverridePercent);
    const spindleSpeedOverridePercent = useStore(x => x.spindleSpeedOverridePercent);
    const isConnected = useStore(x => x.isConnected);
    const eventSource = useStore(x => x.eventSource);

    const updateStatus = useStore(x => x.updateStatus);
    const updateAvailableBufferSlots = useStore(x => x.updateAvailableBufferSlots);
    const updateMachineCoordinate = useStore(x => x.updateMachineCoordinate);
    const selectGCodeLine = useStore(x => x.selectGCodeLine);
    const updateWorkPlaceCoordinateOffset = useStore(x => x.updateWorkPlaceCoordinateOffset);
    const updateFeedrate = useStore(x => x.updateFeedrate);
    const updateSpindleSpeed = useStore(x => x.updateSpindleSpeed);
    const updateFeedrateOverridePercent = useStore(x => x.updateFeedrateOverridePercent);
    const updateRapidSpeedOverridePercent = useStore(x => x.updateRapidSpeedOverridePercent);
    const updateSpindleSpeedOverridePercent = useStore(x => x.updateSpindleSpeedOverridePercent);
    const setIsConnected = useStore(x => x.setIsConnected);

    function parseGrblStatus(report : string) : {state: GRBLState,MPos?:string[],WCO?:string[],FS?:string[],Ov?:string[],Ln?:string,Bf?:string[]} {
        // 1. Trim off angle‑brackets and any leading/trailing whitespace
        const inner = report.trim().replace(/^<|>$/g, '');

        // 2. Split on '|' to get each field token
        const tokens = inner.split('|');

        // 3. The first token (before the first '|') is the machine state
        const result = {
            state: tokens.shift()?.replace(":0","") as GRBLState,
        };

        // 4. Parse remaining tokens of the form KEY:VAL or KEY:VAL1,VAL2,...
        tokens.forEach(token => {
            const [key, rawVal] = token.split(':', 2);

            // Some tokens may not include ':' (e.g. alarms, or custom info)
            if (rawVal === undefined) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                result[key] = true;          // flag-only token
            } else if (rawVal.includes(',')) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                result[key] = rawVal.split(',');
            } else {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                result[key] = rawVal;
            }
        });

        return result;
    }
    // Parse GRBL status response
    const statusListenerAndParse = useCallback((event: CustomEvent<string>) => {
        const response = event.detail;
        if (!(response.startsWith('<') && response.endsWith('>'))) {
            return;
        }

        // Example status: <Idle|MPos:0.000,0.000,0.000|WPos:0.000,0.000,0.000|F:0|S:0>
        const gRBLStatus = parseGrblStatus(response);
        if (gRBLStatus) {
            const {state, MPos, WCO, FS, Ov, Ln, Bf} = gRBLStatus;

            if(status != state)
                updateStatus(state);

            if(Bf) {
                const newAvailableBufferSlots = Bf.map(Number)[0];
                if (newAvailableBufferSlots !== availableBufferSlots) {
                    updateAvailableBufferSlots(newAvailableBufferSlots);
                }
            }
            if(MPos) {
                const [mx, my, mz] = MPos.map(Number);
                if (machineCoordinate.x !== mx ||
                    machineCoordinate.y !== my ||
                    machineCoordinate.z !== mz) {
                    updateMachineCoordinate({ x: mx, y: my, z: mz });
                }
            }

            if(Ln) {
                const lineNumber = Number(Ln);
                if (selectedGCodeLine !== lineNumber) {
                    selectGCodeLine(lineNumber);
                }
            }
            if(WCO) {
                const [wx, wy, wz] = WCO.map(Number);
                if (workPlaceCoordinateOffset.x !== wx ||
                    workPlaceCoordinateOffset.y !== wy ||
                    workPlaceCoordinateOffset.z !== wz) {
                    updateWorkPlaceCoordinateOffset({x: wx, y: wy, z: wz});
                }
            }

            if(FS) {
                const [newFeedrate, newSpindleSpeed] = FS.map(Number);
                if (newFeedrate !== feedrate) {
                    updateFeedrate(newFeedrate);
                }
                if (newSpindleSpeed !== spindleSpeed) {
                    updateSpindleSpeed(newSpindleSpeed);
                }
            }

            if(Ov) {
                const [newFeedrateOverridePercent, newRapidSpeedOverridePercent, newSpindleSpeedOverridePercent] = Ov.map(Number);
                if (feedrateOverridePercent !== newFeedrateOverridePercent) {
                    updateFeedrateOverridePercent(newFeedrateOverridePercent);
                }
                if (rapidSpeedOverridePercent !== newRapidSpeedOverridePercent) {
                    updateRapidSpeedOverridePercent(newRapidSpeedOverridePercent);
                }
                if (spindleSpeedOverridePercent !== newSpindleSpeedOverridePercent) {
                    updateSpindleSpeedOverridePercent(newSpindleSpeedOverridePercent);
                }
            }
        }
    }, [status, availableBufferSlots, machineCoordinate, selectedGCodeLine, workPlaceCoordinateOffset, 
        feedrate, spindleSpeed, feedrateOverridePercent, rapidSpeedOverridePercent, spindleSpeedOverridePercent,
        updateStatus, updateAvailableBufferSlots, updateMachineCoordinate, selectGCodeLine, 
        updateWorkPlaceCoordinateOffset, updateFeedrate, updateSpindleSpeed, 
        updateFeedrateOverridePercent, updateRapidSpeedOverridePercent, updateSpindleSpeedOverridePercent]);

    const sendCommand = async (command: string) => {
        await eventSource?.send(command);
    };

    useEffect(() => {
        if (!isConnected) return;

        const pollInterval = setInterval(async () => {
            await sendCommand('?');
        }, 80); // Poll every 50ms

        return () => clearInterval(pollInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected, eventSource]);

    const connect = async () => {
        setIsConnected(true);
    }

    const disconnect = async () => {
        setIsConnected(false);
        updateStatus("NotConnected");
    };

    useEffect(() => {
        // Initialize GRBL Serial
        const grblSerial = eventSource!;
        // Set up event listener for incoming data
        grblSerial.addEventListener('data', statusListenerAndParse);
        grblSerial.addEventListener('disconnect', disconnect);
        grblSerial.addEventListener('connect', connect);

        return () => {
            // Cleanup on unmount
            if (eventSource) {
                eventSource.removeEventListener('data', statusListenerAndParse);
                grblSerial.removeEventListener('disconnect', disconnect);
                grblSerial.removeEventListener('connect', connect);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusListenerAndParse, eventSource]);

    return <>{children}</>;
}; 