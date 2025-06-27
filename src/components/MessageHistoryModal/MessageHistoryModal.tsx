import React, {useState, useMemo, useEffect, useRef} from 'react';
import {useStore} from '../../app/store';
import {useShallow} from 'zustand/react/shallow';
import Modal from 'react-modal';

// Set the app element for accessibility
Modal.setAppElement('#root');

interface MessageHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SearchOperator = 'contains' | 'not_contains' | 'equals' | 'not_equals';

interface SearchTerm {
    operator: SearchOperator;
    value: string;
}

const formatTimeDistance = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 1000) return 'just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
};

const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const time = date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${time}.${ms}`;
};

export const MessageHistoryModal: React.FC<MessageHistoryModalProps> = ({isOpen, onClose}) => {
    const messageHistory = useStore(useShallow(x => x.messageHistory));
    const clearMessageHistory = useStore(x => x.clearMessageHistory);
    const [searchQuery, setSearchQuery] = useState('');
    const [messageType, setMessageType] = useState<'all' | 'sent' | 'received'>('all');
    const [isFrozen, setIsFrozen] = useState(true);
    const [frozenMessages, setFrozenMessages] = useState<typeof messageHistory>([]);
    const [autoScroll, setAutoScroll] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: '',
        end: ''
    });
    const [showHelp, setShowHelp] = useState(false);

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const parseSearchTerm = (term: string): SearchTerm => {
        let operator: SearchOperator = 'contains';
        let value = term.trim();

        // Check for operator prefixes
        if (term.startsWith('!=')) {
            operator = 'not_equals';
            value = term.slice(2).trim();
        } else if (term.startsWith('!:')) {
            operator = 'not_contains';
            value = term.slice(2).trim();
        } else if (term.startsWith('=')) {
            operator = 'equals';
            value = term.slice(1).trim();
        } else if (term.startsWith(':')) {
            operator = 'contains';
            value = term.slice(1).trim();
        }

        return {operator, value};
    };

    const matchesSearchTerm = (message: string, term: SearchTerm): boolean => {
        const msgLower = message.toLowerCase();
        const valueLower = term.value.toLowerCase();

        switch (term.operator) {
            case 'contains':
                return msgLower.includes(valueLower);
            case 'not_contains':
                return !msgLower.includes(valueLower);
            case 'equals':
                return msgLower === valueLower;
            case 'not_equals':
                return msgLower !== valueLower;
            default:
                return true;
        }
    };

    const filteredMessages = useMemo(() => {
        return frozenMessages.filter(msg => {
            // Filter by message type
            if (messageType !== 'all' && msg.type !== messageType) {
                return false;
            }

            // Filter by date range
            if (dateRange.start || dateRange.end) {
                const msgDate = new Date(msg.timestamp);
                if (dateRange.start && new Date(dateRange.start) > msgDate) {
                    return false;
                }
                if (dateRange.end && new Date(dateRange.end) < msgDate) {
                    return false;
                }
            }

            // If no search query, show all messages
            if (!searchQuery.trim()) return true;

            // Split by OR operator (|)
            const orGroups = searchQuery.split('|').map(group => group.trim());

            // Check if any OR group matches
            return orGroups.some(orGroup => {
                // Split by AND operator (&)
                const andTerms = orGroup.split('&').map(term => term.trim());

                // All terms in AND group must match
                return andTerms.every(term => {
                    const searchTerm = parseSearchTerm(term);
                    return matchesSearchTerm(msg.message, searchTerm);
                });
            });
        });
    }, [frozenMessages, searchQuery, messageType, dateRange]);

    // Update frozen messages when freeze is toggled
    useEffect(() => {
        if (!isOpen)
            return;
        if (!isFrozen) {
            setFrozenMessages([...messageHistory]);
        }
    }, [isFrozen, isOpen, messageHistory]);

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        if (autoScroll && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({behavior: 'auto'});
        }
    }, [filteredMessages, autoScroll]);

    const modalStyles = {
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        content: {
            background: 'transparent',
            border: 'none',
            padding: 0,
            inset: 'auto',
            position: 'relative' as const,
            width: '800px',
            maxHeight: '80vh',
            overflow: 'visible'
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            style={modalStyles}
            shouldCloseOnOverlayClick={true}
            shouldCloseOnEsc={true}
        >
            <div className="bg-gray-800 rounded-lg p-6 w-[800px] max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white">Message History</h2>
                        <div className="text-sm text-gray-400 font-mono">
                            Current Time: {formatTimestamp(currentTime.getTime())}
                        </div>
                    </div>
                    <div className="space-x-2">
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded text-white"
                            title="Show search help"
                        >
                            Help
                        </button>
                        <button
                            onClick={() => setAutoScroll(!autoScroll)}
                            className={`px-3 py-1 text-sm rounded text-white ${
                                autoScroll ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                            }`}
                            title="Automatically scroll to new messages"
                        >
                            {autoScroll ? 'Auto-scroll On' : 'Auto-scroll Off'}
                        </button>
                        <button
                            onClick={() => {
                                if (!isFrozen) {
                                    setFrozenMessages([...messageHistory]);
                                }
                                setIsFrozen(!isFrozen);
                            }}
                            className={`px-3 py-1 text-sm rounded text-white ${
                                isFrozen ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'
                            }`}
                            title="Freeze current messages to prevent updates"
                        >
                            {isFrozen ? 'Unfreeze' : 'Freeze'}
                        </button>
                        <button
                            onClick={() => {
                                clearMessageHistory()
                                setFrozenMessages([])
                            }}
                            className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded active:bg-red-800 text-white"
                            title="Clear all messages"
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

                {/* Search Help Panel */}
                {showHelp && (
                    <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                        <h3 className="text-white font-bold mb-2">Search Syntax Help</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                            <div>
                                <p className="font-bold mb-1">Operators:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li><code>:</code> contains text</li>
                                    <li><code>!:</code> does not contain text</li>
                                    <li><code>=</code> exact match</li>
                                    <li><code>!=</code> not exact match</li>
                                    <li><code>&</code> AND operator</li>
                                    <li><code>|</code> OR operator</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-bold mb-1">Examples:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li><code>:error</code> - contains "error"</li>
                                    <li><code>:error & :404</code> - contains both</li>
                                    <li><code>=exact | :contains</code> - exact match or contains</li>
                                    <li><code>!:debug</code> - excludes debug messages</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search and Filter Controls */}
                <div className="mb-4 space-y-3">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search messages..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="absolute right-2 top-2 text-gray-400 text-xs">
                                    {searchQuery ? `${filteredMessages.length} matches` : ''}
                                </div>
                            </div>
                        </div>
                        <select
                            value={messageType}
                            onChange={(e) => setMessageType(e.target.value as 'all' | 'sent' | 'received')}
                            className="px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Messages</option>
                            <option value="sent">Sent Only</option>
                            <option value="received">Received Only</option>
                        </select>
                    </div>
                    <div className="flex gap-2 items-center">
                        <div className="flex-1 flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm text-gray-400 mb-1">From</label>
                                <input
                                    type="datetime-local"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm text-gray-400 mb-1">To</label>
                                <input
                                    type="datetime-local"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        {(dateRange.start || dateRange.end) && (
                            <button
                                onClick={() => setDateRange({start: '', end: ''})}
                                className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 rounded text-white"
                            >
                                Clear Dates
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                        {filteredMessages.map((msg, index) => (
                            <div
                                key={index}
                                className={`p-2 rounded transition-colors duration-200 ${
                                    msg.type === 'sent' ? 'bg-blue-900/50 hover:bg-blue-900/70' : 'bg-green-900/50 hover:bg-green-900/70'
                                }`}
                            >
                                <div className="flex justify-between text-sm text-gray-400 mb-1">
                                    <span className="font-medium">{msg.type === 'sent' ? 'Sent' : 'Received'}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono">{formatTimestamp(msg.timestamp)}</span>
                                        <span className="text-xs">({formatTimeDistance(msg.timestamp)})</span>
                                    </div>
                                </div>
                                <div
                                    className="font-mono text-white break-all whitespace-pre-wrap">{msg.message}</div>
                            </div>
                        ))}
                        {filteredMessages.length === 0 && (
                            <div className="text-gray-400 text-center py-4">
                                {messageHistory.length === 0 ? 'No messages yet' : 'No messages match your filters'}
                            </div>
                        )}
                        <div ref={messagesEndRef}/>
                    </div>
                </div>
            </div>
        </Modal>
    );
}; 