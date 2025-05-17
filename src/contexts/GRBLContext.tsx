import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import GRBLSerial from '../app/GRBLSerial';

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

    useEffect(() => {
        // Initialize GRBL Serial
        serialRef.current = new GRBLSerial();
        
        // Set up event listener for incoming data
        serialRef.current.addEventListener('data', (event: Event) => {
            const customEvent = event as CustomEvent;
            setLastMessage(customEvent.detail);
            setHistory(prev => [...prev, customEvent.detail]);
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