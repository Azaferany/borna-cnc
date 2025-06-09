import React from 'react';
import {useStore} from '../../app/store';
import {useShallow} from 'zustand/react/shallow';

interface MessageHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MessageHistoryModal: React.FC<MessageHistoryModalProps> = ({isOpen, onClose}) => {
    const messageHistory = useStore(useShallow(x => x.messageHistory));
    const clearMessageHistory = useStore(x => x.clearMessageHistory);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-[600px] max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Message History</h2>
                    <div className="space-x-2">
                        <button
                            onClick={clearMessageHistory}
                            className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded active:bg-red-800 text-white"
                        >
                            Clear
                        </button>
                        <button
                            onClick={onClose}
                            className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 rounded active:bg-gray-800 text-white"
                        >
                            Close
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                        {messageHistory.map((msg, index) => (
                            <div
                                key={index}
                                className={`p-2 rounded ${
                                    msg.type === 'sent' ? 'bg-blue-900/50' : 'bg-green-900/50'
                                }`}
                            >
                                <div className="flex justify-between text-sm text-gray-400 mb-1">
                                    <span>{msg.type === 'sent' ? 'Sent' : 'Received'}</span>
                                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="font-mono text-white break-all">{msg.message}</div>
                            </div>
                        ))}
                        {messageHistory.length === 0 && (
                            <div className="text-gray-400 text-center py-4">No messages yet</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}; 