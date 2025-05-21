import React, {useCallback, useEffect} from 'react';
import { useStore } from './store.ts';
import type { GRBLState, Point3D } from '../types/GCodeTypes.ts';
import {useWhatChanged} from "@simbathesailor/use-what-changed";





export const GRBLProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const store = useStore();


    function parseGrblStatus(report : string) : {state: GRBLState,MPos?:string[],WCO?:string[],FS?:string[],Ov?:string[],Ln?:string,Bf?:string[]} {
        // 1. Trim off angle‑brackets and any leading/trailing whitespace
        const inner = report.trim().replace(/^<|>$/g, '');

        // 2. Split on '|' to get each field token
        const tokens = inner.split('|');

        // 3. The first token (before the first '|') is the machine state
        const result = {
            state: tokens.shift() as GRBLState,
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
    const statusListenerAndParse = useCallback((event: Event) => {
        const customEvent = event as CustomEvent;
        const response = customEvent.detail;
        if (!(response.startsWith('<') && response.endsWith('>'))) {
            return;
        }

        // Example status: <Idle|MPos:0.000,0.000,0.000|WPos:0.000,0.000,0.000|F:0|S:0>
        const gRBLStatus = parseGrblStatus(response);
        if (gRBLStatus) {
            const {state, MPos, WCO, FS, Ov,Ln ,Bf} = gRBLStatus;

            if(store.status != state)
                store.updateStatus(state);


            if(Bf)
            {
                const availableBufferSlots = Bf.map(Number)[0];
                if (store.availableBufferSlots !== availableBufferSlots) {
                    store.updateAvailableBufferSlots(availableBufferSlots);
                }
            }
            if(MPos)
            {
                const [mx, my, mz] = MPos.map(Number);
                const machineCoordinate: Point3D = { x: mx, y: my, z: mz };
                if (store.machineCoordinate.x !== mx ||
                    store.machineCoordinate.y !== my ||
                    store.machineCoordinate.z !== mz) {
                    store.updateMachineCoordinate(machineCoordinate);
                }
            }

            if(Ln)
            {
                const lineNumber = Number(Ln);
                if (store.selectedGCodeLine !== lineNumber) {
                    store.selectGCodeLine(lineNumber);
                }
            }
            if(WCO)
            {
                const [wx, wy, wz] = WCO.map(Number);
                const workPlaceCoordinateOffset = {x: wx, y: wy, z: wz};
                if (store.workPlaceCoordinateOffset.x !== wx ||
                    store.workPlaceCoordinateOffset.y !== wy ||
                    store.workPlaceCoordinateOffset.z !== wz) {
                    store.updateWorkPlaceCoordinateOffset(workPlaceCoordinateOffset);
                }
            }

            if(FS)
            {
                const [feedrate, spindleSpeed] = FS.map(Number);
                if (store.feedrate !== feedrate) {
                    store.updateFeedrate(feedrate);
                }
                if (store.spindleSpeed !== spindleSpeed) {
                    store.updateSpindleSpeed(spindleSpeed);
                }
            }

            if(Ov)
            {
                const [feedrateOverridePercent, rapidSpeedOverride, spindleSpeedOverride] = Ov.map(Number);
                if (store.feedrateOverridePercent !== feedrateOverridePercent) {
                    store.updateFeedrateOverridePercent(feedrateOverridePercent);

                }
                if (store.rapidSpeedOverridePercent !== rapidSpeedOverride) {
                    store.updateRapidSpeedOverridePercent(rapidSpeedOverride);
                }
                if (store.spindleSpeedOverridePercent !== spindleSpeedOverride) {
                    store.updateSpindleSpeedOverridePercent(spindleSpeedOverride);
                }
            }
        }
    },[store]);


    const sendCommand = async (command: string) => {
        await store.eventSource?.send(command);
    };
    useEffect(() => {
        if (!store.isConnected) return;

        const pollInterval = setInterval(() => {
            sendCommand('?').catch(console.error);
        }, 80); // Poll every 80ms

        return () => clearInterval(pollInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store.isConnected]);

    const connect = async () => {
        store.setIsConnected(true);
    }

    const disconnect = async () => {
        store.setIsConnected(false);
    };


    useWhatChanged([statusListenerAndParse, store.eventSource]); // debugs the below useEffect

    useEffect(() => {
        // Initialize GRBL Serial
        const grblSerial = store.eventSource!;
        // Set up event listener for incoming data
        grblSerial.addEventListener('data', statusListenerAndParse);
        grblSerial.addEventListener('disconnect', disconnect);
        grblSerial.addEventListener('connect', connect);

        return () => {

            // Cleanup on unmount
            if (store.eventSource) {
                store.eventSource.removeEventListener('data', statusListenerAndParse);
                grblSerial.removeEventListener('disconnect', disconnect);
                grblSerial.removeEventListener('connect', connect);

            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusListenerAndParse, store.eventSource]);


    return <>{children}</>;
}; 