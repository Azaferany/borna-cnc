import React, {useCallback, useEffect} from 'react';
import { useStore } from './store.ts';
import type {GCodeOffsets, GRBLState} from '../types/GCodeTypes.ts';
import { Plane } from '../types/GCodeTypes.ts';
import type { ActiveModes } from './store.ts';
import {useShallow} from "zustand/react/shallow";
import {parseGCode} from "./GcodeParserUtils.ts";
import {useShallowCompareEffect} from "react-use";

export const GRBLProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const isConnected = useStore(x => x.isConnected);
    const eventSource = useStore(useShallow(x => x.eventSource));

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

    const updateActiveModes = useStore(x => x.updateActiveModes);

    const setIsConnected = useStore(x => x.setIsConnected);
    const activeModes = useStore(useShallow(x => x.activeModes));
    const gCodeOffsets = useStore(useShallow(x => x.gCodeOffsets));
    const allGCodes = useStore(useShallow(x => x.allGCodes));
    const loadToolPathGCodes = useStore(x => x.loadToolPathGCodes);


    function parseGrblStatus(report : string) : {state: GRBLState,MPos?:string[],WCO?:string[],FS?:string[],Ov?:string[],Ln?:string,Bf?:string[],Dwell?:string[]} {
        // 1. Trim off angle‑brackets and any leading/trailing whitespace
        const inner = report.trim().replace(/^<|>$/g, '');

        // 2. Split on '|' to get each field token
        const tokens = inner.split('|');

        // 3. The first token (before the first '|') is the machine state
        const result : {state: GRBLState,MPos?:string[],WCO?:string[],FS?:string[],Ov?:string[],Ln?:string,Bf?:string[],Dwell?:string[]} = {
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

            updateStatus(state);

            if(Dwell) {
                const newDwellInfo = Dwell.map(Number);
                updateDwell({RemainingSeconds: newDwellInfo[0],TotalSeconds: newDwellInfo[1]});
            }
            else {
                updateDwell({RemainingSeconds: 0,TotalSeconds: 0});

            }

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
    }, [selectGCodeLine, updateAvailableBufferSlots, updateDwell, updateFeedrate, updateFeedrateOverridePercent, updateMachineCoordinate, updateRapidSpeedOverridePercent, updateSpindleSpeed, updateSpindleSpeedOverridePercent, updateStatus, updateWorkPlaceCoordinateOffset]);

    const sendCommand = async (command: string) => {
        await eventSource?.send(command);
    };



    const connect = async () => {
        setIsConnected(true);
    }

    const disconnect = async () => {
        setIsConnected(false);
        updateStatus("NotConnected");
    };

    const handleGCodeOffset = useCallback((event: CustomEvent<string>) => {
        const line = event.detail;
        if (line.startsWith('[') && line.endsWith(']') && !line.startsWith('[GC:')) {
            const offsetMatch = line.match(/\[(G\d+):([\d.-]+),([\d.-]+),([\d.-]+)\]/);
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
                const activeModes: ActiveModes = {
                    WorkCoordinateSystem: modes.find(m => m.startsWith('G5')) as "G54" | "G55" | "G56" | "G57" | "G58" | "G59" || "G54",
                    Plane: modes.find(m => m === 'G17') ? Plane.XY :
                        modes.find(m => m === 'G18') ? Plane.XZ :
                            modes.find(m => m === 'G19') ? Plane.YZ : Plane.XY,
                    UnitsType: modes.find(m => m === 'G21') ? "Millimeters" : "Inches",
                    PositioningMode: modes.find(m => m === 'G90') ? "Absolute" : "Relative"
                };
                updateActiveModes(activeModes);
            }
        }
    },[updateActiveModes]);


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
        }, 70); // Poll every 80ms
        const pollGCodeOffsetsInterval = setInterval(async () => {
            //await sendCommand('$#');
        }, 600); // Poll every 5s
        const pollActiveModesInterval = setInterval(async () => {
            await sendCommand('$G');
        }, 1000); // Poll every 5s
        try {
            sendCommand('$#');
            sendCommand('$G');
        }
        catch {
            console.log('Error sending command');
        }
        return () => {
            clearInterval(pollStatusInterval)
            clearInterval(pollGCodeOffsetsInterval)
            clearInterval(pollActiveModesInterval)
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected, eventSource]);
    useEffect(() => {
        // Initialize GRBL Serial
        const grblSerial = eventSource!;
        // Set up event listener for incoming data
        grblSerial.addEventListener('data', statusListenerAndParse);
        grblSerial.addEventListener('data', handleGCodeOffset);
        grblSerial.addEventListener('data', handleActiveModes);
        grblSerial.addEventListener('disconnect', disconnect);
        grblSerial.addEventListener('connect', connect);

        return () => {
            // Cleanup on unmount
            if (eventSource) {
                eventSource.removeEventListener('data', statusListenerAndParse);
                eventSource.removeEventListener('data', handleGCodeOffset);
                eventSource.removeEventListener('data', handleActiveModes);
                grblSerial.removeEventListener('disconnect', disconnect);
                grblSerial.removeEventListener('connect', connect);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusListenerAndParse, eventSource, handleGCodeOffset, handleActiveModes]);

    return <>{children}</>;
};