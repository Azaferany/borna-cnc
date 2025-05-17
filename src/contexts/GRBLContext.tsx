import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import GRBLSerial from '../app/GRBLSerial';
import { useStore } from '../app/store';
import type { GRBLState, Point3D } from '../types/GCodeTypes';

interface GRBLContextType {
    isConnected: boolean;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    sendCommand: (command: string) => Promise<void>;
    lastMessage: string;
    history: string[];
}

const GRBLContext = createContext<GRBLContextType | null>(null);

export const useGRBL = () => {
    const context = useContext(GRBLContext);
    if (!context) {
        throw new Error('useGRBL must be used within a GRBLProvider');
    }
    return context;
};

export const GRBLProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [lastMessage, setLastMessage] = useState<string>('');
    const serialRef = useRef<GRBLSerial | null>(null);
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
    const parseStatus = (response: string) => {
        // Example status: <Idle|MPos:0.000,0.000,0.000|WPos:0.000,0.000,0.000|F:0|S:0>
        const gRBLStatus = parseGrblStatus(response);
        if (gRBLStatus) {
                const {state, MPos, WCO, FS, Ov,Ln ,Bf} = gRBLStatus;

                store.updateStatus(state);


            if(Bf)
            {
                const availableBufferSlots = Bf.map(Number)[0];

                store.updateAvailableBufferSlots(availableBufferSlots);
            }
            if(MPos)
            {
                const [mx, my, mz] = MPos.map(Number);

                const machineCoordinate: Point3D = { x: mx, y: my, z: mz };
                store.updateMachineCoordinate(machineCoordinate);

            }

            if(Ln)
            {
                store.selectGCodeLine(Number(Ln))
            }
            if(WCO)
            {
                const [wx, wy, wz] = WCO.map(Number);

                const workPlaceCoordinateOffset = {x: wx, y: wy, z: wz};

                store.updateWorkPlaceCoordinateOffset(workPlaceCoordinateOffset);
            }

            if(FS)
            {
                const [feedrate, spindleSpeed] = FS.map(Number);

                store.updateFeedrate(feedrate);
                store.updateSpindleSpeed(spindleSpeed);
            }

            if(Ov)
            {
                const [feedrateOverridePercent,rapidSpeedOverride, spindleSpeedOverride] = Ov.map(Number);
                store.updateFeedrateOverridePercent(feedrateOverridePercent);
                store.updateRapidSpeedOverridePercent(rapidSpeedOverride);
                store.updateSpindleSpeedOverridePercent(spindleSpeedOverride);
            }
        }
    };

    useEffect(() => {
        // Initialize GRBL Serial
        serialRef.current = new GRBLSerial();

        // Set up event listener for incoming data
        serialRef.current.addEventListener('data', (event: Event) => {
            const customEvent = event as CustomEvent;
            const message = customEvent.detail;
            setLastMessage(message);
            if (message.includes("> ?")) {
                return;}
            // Parse status responses
            if (message.startsWith('<') && message.endsWith('>')) {
                parseStatus(message);
                return;
            }
            setHistory(prev => [...prev, message]);
        });

        return () => {
            // Cleanup on unmount
            if (serialRef.current) {
                serialRef.current.disconnect();
            }
        };
    }, []);

    const connect = async () => {
        try {
            await serialRef.current?.connect();
            setIsConnected(true);
            setHistory(prev => [...prev, '>> Connected to GRBL device']);
            serialRef.current?.addEventListener('disconnect', () => {disconnect()})
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setHistory(prev => [...prev, `>> Connection error: ${error?.message || 'Unknown error'}`]);
            throw error;
        }
    };

    const disconnect = async () => {
        try {
            setIsConnected(false);
            setHistory(prev => [...prev, '>> Disconnected from GRBL device']);
            serialRef.current?.disconnect();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            if(error.message !== "The device has been lost") {
                setHistory(prev => [...prev, `>> Disconnection error: ${error?.message || 'Unknown error'}`]);
                throw error;
            }
        }
    };

    const sendCommand = async (command: string) => {
        if (!isConnected) {
            throw new Error('Not connected to device');
        }
        try {
            setHistory(prev => [...prev, `> ${command}`]);
            await serialRef.current?.send(command);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setHistory(prev => [...prev, `Error: ${error?.message || 'Unknown error'}`]);
            throw error;
        }
    };

    const value = {
        isConnected,
        connect,
        disconnect,
        sendCommand,
        lastMessage,
        history,
    };

    return <GRBLContext.Provider value={value}>{children}</GRBLContext.Provider>;
}; 