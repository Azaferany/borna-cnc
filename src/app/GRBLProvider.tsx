import React, {useCallback, useEffect, useRef} from 'react';
import { useStore } from './store.ts';
import type {GCodeOffsets, GRBLState} from '../types/GCodeTypes.ts';
import { Plane } from '../types/GCodeTypes.ts';
import type { ActiveModes } from './store.ts';
import {useShallow} from "zustand/react/shallow";
import {parseGCode} from "./GcodeParserUtils.ts";
import {useShallowCompareEffect} from "react-use";
import GRBLWebSocket from './GRBLWebSocket';
import GRBLSerial from './GRBLSerial';
import {useGRBL} from "./useGRBL.ts";
import {useAutoConnection} from "./useAutoConnection.ts";

export const GRBLProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {isConnected, sendCommand} = useGRBL();

    // Initialize auto-connection
    useAutoConnection();


    const isSending = useStore(x => x.isSending);
    const connectionType = useStore(x => x.connectionType);

    const eventSource = useStore(useShallow(x => x.eventSource));
    const setEventSource = useStore(x => x.setEventSource);

    const updateStatus = useStore(x => x.updateStatus);
    const updateAvailableBufferSlots = useStore(x => x.updateAvailableBufferSlots);
    const updateDwell = useStore(x => x.updateDwell);
    const updateMachineCoordinate = useStore(x => x.updateMachineCoordinate);
    const selectGCodeLine = useStore(x => x.selectGCodeLine);
    const updateWorkPlaceCoordinateOffset = useStore(x => x.updateWorkPlaceCoordinateOffset);
    const updateFeedrate = useStore(x => x.updateFeedrate);
    const updateSpindleSpeed = useStore(x => x.updateSpindleSpeed);
    const updateFeedrateOverridePercent = useStore(x => x.updateFeedrateOverridePercent);
    const updateRapidSpeedOverridePercent = useStore(x => x.updateRapidSpeedOverridePercent);
    const updateSpindleSpeedOverridePercent = useStore(x => x.updateSpindleSpeedOverridePercent);
    const updateGCodeOffsets = useStore(x => x.updateGCodeOffsets);
    const addMessageToHistory = useStore(x => x.addMessageToHistory);
    const clearMessageHistory = useStore(x => x.clearMessageHistory);
    const updateMachineConfig = useStore(x => x.updateMachineConfig);

    const updateActiveModes = useStore(x => x.updateActiveModes);

    const setIsConnected = useStore(x => x.setIsConnected);
    const activeModes = useStore(useShallow(x => x.activeModes));
    const gCodeOffsets = useStore(useShallow(x => x.gCodeOffsets));
    const allGCodes = useStore(useShallow(x => x.allGCodes));
    const loadToolPathGCodes = useStore(x => x.loadToolPathGCodes);
    const dwell = useStore(useShallow(x => x.dwell));

    const dwellTimeoutRef = useRef<NodeJS.Timeout>(undefined);
    const connect = async () => {
        setIsConnected(true);
        addMessageToHistory('received', "Connected ....");
        clearMessageHistory()

        // Send $$ command to get machine configuration
        setTimeout(async () => {
            await sendCommand('$$');
        }, 1000);
    }

    const disconnect = useCallback((async () => {
        setIsConnected(false);
        updateStatus("NotConnected");
        addMessageToHistory('received', "Disconnected ....");

    }), [addMessageToHistory, setIsConnected, updateStatus]);

    // Initialize eventSource based on connection type
    useEffect(() => {
        if (eventSource instanceof GRBLSerial && connectionType == "serial")
            return;

        if (eventSource instanceof GRBLWebSocket && connectionType == "websocket")
            return;

        if (eventSource) {
            eventSource.disconnect();
            disconnect()
        }

        const newEventSource = connectionType === 'websocket' ? new GRBLWebSocket() : new GRBLSerial();
        setEventSource(newEventSource);
    }, [connectionType, disconnect, eventSource, setEventSource]);

    function parseGrblStatus(report : string) : {state: GRBLState,MPos?:string[],WCO?:string[],FS?:string[],Ov?:string[],Ln?:string,Bf?:string[],Dwell?:string[]} {
        // 1. Trim off angle‑brackets and any leading/trailing whitespace
        const inner = report.trim().replace(/^<|>$/g, '');

        // 2. Split on '|' to get each field token
        const tokens = inner.split('|');

        // 3. The first token (before the first '|') is the machine state
        const result : {state: GRBLState,MPos?:string[],WCO?:string[],FS?:string[],Ov?:string[],Ln?:string,Bf?:string[],Dwell?:string[]} = {
            state: tokens.shift()?.replace(/:\d+/, "") as GRBLState,
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

        if(result.state === "Idle" && +(result.Dwell?.[0] ?? "0") > 0)
            result.state = "Run";

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
            const {state, MPos, WCO, FS, Ov, Ln, Bf,Dwell} = gRBLStatus;


            if(Dwell) {
                const newDwellInfo = Dwell.map(Number);
                const remainingSeconds = newDwellInfo[0];
                const totalSeconds = newDwellInfo[1];


                if (remainingSeconds > 0) {
                    updateDwell({RemainingSeconds: remainingSeconds, TotalSeconds: totalSeconds});
                    updateStatus("Run");

                    if (dwellTimeoutRef.current) {
                        clearTimeout(dwellTimeoutRef.current)
                        dwellTimeoutRef.current = undefined;
                    }
                    // Set up timout to clear interval when dwell completes
                    dwellTimeoutRef.current = setTimeout(() => {
                        updateDwell({RemainingSeconds: 0, TotalSeconds: totalSeconds});
                        updateStatus(state);
                        clearTimeout(dwellTimeoutRef.current)
                    }, remainingSeconds * 1000);
                } else {
                    updateDwell({RemainingSeconds: 0, TotalSeconds: totalSeconds});
                    updateStatus(state);
                    clearTimeout(dwellTimeoutRef.current)
                }
            }

            if (dwell.RemainingSeconds <= 0 || state != "Idle")
                updateStatus(state);
            if(Bf) {
                const newAvailableBufferSlots = Bf.map(Number)[0];
                updateAvailableBufferSlots(newAvailableBufferSlots);
            }
            if(MPos) {
                const [mx, my, mz] = MPos.map(Number);

                updateMachineCoordinate({ x: mx, y: my, z: mz });
            }

            if(Ln) {
                const lineNumber = Number(Ln);
                selectGCodeLine(lineNumber);
            }
            if(WCO) {
                const [wx, wy, wz] = WCO.map(Number);

                updateWorkPlaceCoordinateOffset({x: wx, y: wy, z: wz});
            }

            if(FS) {
                const [newFeedrate, newSpindleSpeed] = FS.map(Number);

                updateFeedrate(newFeedrate);
                updateSpindleSpeed(newSpindleSpeed);
            }

            if(Ov) {
                const [newFeedrateOverridePercent, newRapidSpeedOverridePercent, newSpindleSpeedOverridePercent] = Ov.map(Number);
                updateFeedrateOverridePercent(newFeedrateOverridePercent);
                updateRapidSpeedOverridePercent(newRapidSpeedOverridePercent);
                updateSpindleSpeedOverridePercent(newSpindleSpeedOverridePercent);
            }
        }
    }, [dwell.RemainingSeconds, updateStatus, updateDwell, updateAvailableBufferSlots, updateMachineCoordinate, selectGCodeLine, updateWorkPlaceCoordinateOffset, updateFeedrate, updateSpindleSpeed, updateFeedrateOverridePercent, updateRapidSpeedOverridePercent, updateSpindleSpeedOverridePercent]);





    const handleGCodeOffset = useCallback((event: CustomEvent<string>) => {
        const line = event.detail;
        if (line.startsWith('[') && line.endsWith(']') && !line.startsWith('[GC:')) {

            const offsetMatch = line.match(/\[(G\d+):([\d.-]+),([\d.-]+),([\d.-]+)/);

            if (offsetMatch) {

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [_, offsetType  , x, y, z] = offsetMatch;
                updateGCodeOffsets(perv => {
                    if(perv[offsetType as keyof GCodeOffsets].x != parseFloat(x) || perv[offsetType as keyof GCodeOffsets].y != parseFloat(y) ||perv[offsetType as keyof GCodeOffsets].z != parseFloat(z))
                        return {
                            ...perv,
                            [offsetType]: {
                                x: parseFloat(x),
                                y: parseFloat(y),
                                z: parseFloat(z)
                            }
                        }
                    else return  perv
                });

            }
        }
    },[updateGCodeOffsets]);

    const handleActiveModes =useCallback((event: CustomEvent<string>) => {
        const line = event.detail;
        if (line.startsWith('[GC:') && line.endsWith(']')) {
            const modesMatch = line.match(/\[GC:(.*?)\]/);
            if (modesMatch) {
                const modes = modesMatch[1].split(' ');

                // Parse spindle direction from M codes
                let spindleDirection: "CW" | "CCW" | "OFF" = "OFF";
                if (modes.find(m => m === 'M3')) {
                    spindleDirection = "CW";
                } else if (modes.find(m => m === 'M4')) {
                    spindleDirection = "CCW";
                } else if (modes.find(m => m === 'M5')) {
                    spindleDirection = "OFF";
                }
                
                const activeModes: ActiveModes = {
                    WorkCoordinateSystem: modes.find(m => m.startsWith('G5')) as "G54" | "G55" | "G56" | "G57" | "G58" | "G59" || "G54",
                    Plane: modes.find(m => m === 'G17') ? Plane.XY :
                        modes.find(m => m === 'G18') ? Plane.XZ :
                            modes.find(m => m === 'G19') ? Plane.YZ : Plane.XY,
                    UnitsType: modes.find(m => m === 'G21') ? "Millimeters" : "Inches",
                    PositioningMode: modes.find(m => m === 'G90') ? "Absolute" : "Relative",
                    SpindleDirection: spindleDirection
                };
                updateActiveModes(activeModes);
            }
        }
    },[updateActiveModes]);

    const handleMachineConfig = useCallback((event: CustomEvent<string>) => {
        const line = event.detail;

        // Handle $$ configuration responses
        if (line.startsWith('$') && line.includes('=')) {
            const configMatch = line.match(/\$(\d+)=([\d.]+)/);
            if (configMatch) {
                const [, paramNumber, value] = configMatch;
                const numValue = parseFloat(value);

                switch (paramNumber) {
                    // Spindle max RPM ($30)
                    case '30':
                        updateMachineConfig({spindleMaxRpm: numValue == 0 ? 1000 : numValue});
                        break;
                    // Spindle min RPM ($31)
                    case '31':
                        updateMachineConfig({spindleMinRpm: numValue});
                        break;
                    // X-axis steps/mm ($100)
                    case '100': {
                        const currentConfig = useStore.getState().machineConfig;
                        updateMachineConfig({
                            activeAxes: {
                                ...currentConfig.activeAxes,
                                x: numValue > 0
                            }
                        });
                        break;
                    }
                    // Y-axis steps/mm ($101)
                    case '101': {
                        const currentConfig = useStore.getState().machineConfig;
                        updateMachineConfig({
                            activeAxes: {
                                ...currentConfig.activeAxes,
                                y: numValue > 0
                            }
                        });
                        break;
                    }
                    // Z-axis steps/mm ($102)
                    case '102': {
                        const currentConfig = useStore.getState().machineConfig;
                        updateMachineConfig({
                            activeAxes: {
                                ...currentConfig.activeAxes,
                                z: numValue > 0
                            }
                        });
                        break;
                    }
                    // a-axis steps/mm ($103)
                    case '103': {
                        const currentConfig = useStore.getState().machineConfig;
                        updateMachineConfig({
                            activeAxes: {
                                ...currentConfig.activeAxes,
                                a: numValue > 0
                            }
                        });
                        break;
                    }
                    // b-axis steps/mm ($104)
                    case '104': {
                        const currentConfig = useStore.getState().machineConfig;
                        updateMachineConfig({
                            activeAxes: {
                                ...currentConfig.activeAxes,
                                b: numValue > 0
                            }
                        });
                        break;
                    }
                    // c-axis steps/mm ($105)
                    case '105': {
                        const currentConfig = useStore.getState().machineConfig;
                        updateMachineConfig({
                            activeAxes: {
                                ...currentConfig.activeAxes,
                                c: numValue > 0
                            }
                        });
                        break;
                    }
                }
            }
        }
    }, [updateMachineConfig]);

    useShallowCompareEffect(() => {
        if((allGCodes?.length ?? 0) === 0)
            return;
        const parsedCommands = parseGCode(allGCodes!,{
            activeGCodeOffset:activeModes?.WorkCoordinateSystem ?? "G54",
            offsets:gCodeOffsets
        });

        loadToolPathGCodes(allGCodes ?? [], parsedCommands)
    }, [activeModes, gCodeOffsets]);

    useEffect(() => {
        if (!isConnected) return;

        const pollStatusInterval = setInterval(async () => {
            await sendCommand('?');
        }, 430); // Poll every 80ms
        const pollStatusDetailInterval = setInterval(async () => {
            await sendCommand('\x87');
        }, 80);
        let pollGCodeOffsetsInterval:  NodeJS.Timeout | undefined;
        let pollActiveModesInterval:  NodeJS.Timeout | undefined;
        let settingsInterval: NodeJS.Timeout | undefined;
        if(!isSending) {
            pollGCodeOffsetsInterval = setInterval(async () => {
                await sendCommand('$#');
            }, 600); // Poll every 5s
            pollActiveModesInterval = setInterval(async () => {
                await sendCommand('$G');
            }, 1000); // Poll every 5s

            settingsInterval = setInterval(async () => {
                await sendCommand('$$');
            }, 6015);
        }
        return () => {
            clearInterval(pollStatusInterval)
            clearInterval(pollStatusDetailInterval)
            if (pollGCodeOffsetsInterval)
                clearInterval(pollGCodeOffsetsInterval)
            if (pollActiveModesInterval)
                clearInterval(pollActiveModesInterval)
            if (settingsInterval)
                clearInterval(settingsInterval)
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected, eventSource,isSending]);

    const historyListener = useCallback((event: CustomEvent<string>) => {
        addMessageToHistory('received', event.detail);
    }, [addMessageToHistory]);

    useEffect(() => {
        // Initialize GRBL Serial
        const grblSerial = eventSource!;
        // Set up event listener for incoming data
        grblSerial.addEventListener('data', historyListener);
        grblSerial.addEventListener('data', statusListenerAndParse);
        grblSerial.addEventListener('data', handleGCodeOffset);
        grblSerial.addEventListener('data', handleActiveModes);
        grblSerial.addEventListener('data', handleMachineConfig);
        grblSerial.addEventListener('disconnect', disconnect);
        grblSerial.addEventListener('connect', connect);

        return () => {
            // Cleanup on unmount
            if (eventSource) {
                eventSource.removeEventListener('data', historyListener);
                eventSource.removeEventListener('data', statusListenerAndParse);
                eventSource.removeEventListener('data', handleGCodeOffset);
                eventSource.removeEventListener('data', handleActiveModes);
                eventSource.removeEventListener('data', handleMachineConfig);
                grblSerial.removeEventListener('disconnect', disconnect);
                grblSerial.removeEventListener('connect', connect);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusListenerAndParse, eventSource, handleGCodeOffset, handleActiveModes, handleMachineConfig]);

    useEffect(() => {
        // Cleanup dwell timeout and interval on unmount
        return () => {
            if (dwellTimeoutRef.current) {
                clearTimeout(dwellTimeoutRef.current);
                dwellTimeoutRef.current = undefined;
            }
        };
    }, []);

    return <>{children}</>;
};