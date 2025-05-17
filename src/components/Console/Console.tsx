import React, { useState, useRef, useEffect } from 'react';
import { useGRBL } from '../../contexts/GRBLContext';

export const Console = () => {
    const [command, setCommand] = useState('');
    const historyEndRef = useRef<HTMLDivElement>(null);
    const { isConnected, connect, disconnect, sendCommand, history } = useGRBL();
    
    // Track command history and current position
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [tempCommand, setTempCommand] = useState('');

    const scrollToBottom = () => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if(history.length > 0) {
            scrollToBottom();
        }
    }, [history]);

    // Extract commands from history
    useEffect(() => {
        const commands = history
            .filter(line => line.startsWith('> '))
            .map(line => line.substring(2));
        setCommandHistory(commands);
    }, [history]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex === -1) {
                // Save current input before navigating history
                setTempCommand(command);
            }
            if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
            } else if (historyIndex === 0) {
                // Restore the temporary command when reaching the bottom
                setHistoryIndex(-1);
                setCommand(tempCommand);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (command.trim()) {
            try {
                await sendCommand(command);
                setCommand('');
                setHistoryIndex(-1); // Reset history index after sending command
                setTempCommand(''); // Clear temporary command
            } catch {
                // Error is already handled in the context
                setCommand('');
            }
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg min-h-[218px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Console</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={isConnected ? disconnect : connect}
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
                    onChange={(e) => {
                        setCommand(e.target.value);
                        setHistoryIndex(-1); // Reset history index when typing
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter command... (Use ↑↓ for history)"
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