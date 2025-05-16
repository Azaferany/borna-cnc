import React, { useState, useRef, useEffect } from 'react';
import GRBLSerial from '../../app/GRBLSerial';

export const Console = () => {
    const [command, setCommand] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const historyEndRef = useRef<HTMLDivElement>(null);
    const serialRef = useRef<GRBLSerial | null>(null);

    const scrollToBottom = () => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if(history.length > 0) {
            scrollToBottom();
        }
    }, [history]);

    useEffect(() => {
        // Initialize GRBL Serial
        serialRef.current = new GRBLSerial();
        
        // Set up event listener for incoming data
        serialRef.current.addEventListener('data', (event: Event) => {
            const customEvent = event as CustomEvent;
            setHistory(prev => [...prev, customEvent.detail]);
        });

        return () => {
            // Cleanup on unmount
            if (serialRef.current) {
                serialRef.current.disconnect();
            }
        };
    }, []);

    const handleConnect = async () => {
        try {
            await serialRef.current?.connect();
            setIsConnected(true);
            setHistory(prev => [...prev, '> Connected to GRBL device']);
        } catch (error: any) {
            setHistory(prev => [...prev, `> Connection error: ${error?.message || 'Unknown error'}`]);
        }
    };

    const handleDisconnect = async () => {
        try {
            await serialRef.current?.disconnect();
            setIsConnected(false);
            setHistory(prev => [...prev, '> Disconnected from GRBL device']);
        } catch (error: any) {
            setHistory(prev => [...prev, `> Disconnection error: ${error?.message || 'Unknown error'}`]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (command.trim()) {
            if (!isConnected) {
                setHistory(prev => [...prev, `> ${command}`, 'Error: Not connected to device']);
            } else {
                try {
                    setHistory(prev => [...prev, `> ${command}`]);
                    await serialRef.current?.send(command);
                } catch (error: any) {
                    setHistory(prev => [...prev, `Error: ${error?.message || 'Unknown error'}`]);
                }
            }
            setCommand('');
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg min-h-[218px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Console</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={isConnected ? handleDisconnect : handleConnect}
                        className={`px-4 py-1 rounded ${
                            isConnected 
                                ? 'bg-red-600 hover:bg-red-700' 
                                : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                        {isConnected ? 'Disconnect' : 'Connect'}
                    </button>
                </div>
            </div>
            <div className="h-40 max-h-[400px] bg-gray-900 rounded p-2 mb-4 overflow-y-auto custom-scrollbar">
                <div className="space-y-1 font-mono text-sm">
                    {history.map((line, index) => (
                        <div
                            key={index}
                            className={`${
                                line.startsWith('>') ? 'text-green-400' : 'text-gray-300'
                            }`}
                        >
                            {line}
                        </div>
                    ))}
                    <div ref={historyEndRef} />
                </div>
            </div>
            <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter command..."
                    className="flex-1 bg-gray-700 rounded px-3 py-2 text-white"
                />
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                    disabled={!isConnected}
                >
                    Send
                </button>
            </form>
        </div>
    );
};