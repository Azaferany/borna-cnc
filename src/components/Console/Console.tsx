import React, { useState, useRef, useEffect } from 'react';
import {useGRBL} from "../../app/useGRBL.ts";
import {useGRBLListener} from "../../app/useGRBLListener.ts";
import {useStore} from "../../app/store.ts";
import {useNavigate} from 'react-router';
import {ROUTES} from '../../app/routes.ts';

// GRBL error codes and their meanings (based on grblHAL)
const GRBL_ERROR_CODES: Record<number, string> = {
    1: "Expected command letter",
    2: "Bad number format",
    3: "Invalid statement",
    4: "Negative value",
    5: "Setting disabled",
    6: "Setting step pulse min",
    7: "Setting read fail",
    8: "Idle error",
    9: "System GC lock",
    10: "Soft limit error",
    11: "Overflow",
    12: "Max step rate exceeded",
    13: "Check door",
    14: "Line length exceeded",
    15: "Travel exceeded",
    16: "Invalid jog command",
    17: "Setting disabled laser",
    18: "Reset",
    19: "Non positive value",
    20: "Unsupported command",
    21: "Modal group violation",
    22: "Undefined feed rate",
    23: "Command value not integer",
    24: "Axis command conflict",
    25: "Word repeated",
    26: "No axis words",
    27: "Invalid line number",
    28: "Value word missing",
    29: "Unsupported coord sys",
    30: "G53 invalid motion mode",
    31: "Axis words exist",
    32: "No axis words in plane",
    33: "Invalid target",
    34: "Arc radius error",
    35: "No offsets in plane",
    36: "Unused words",
    37: "G43 dynamic axis error",
    38: "Illegal tool table entry",
    39: "Value out of range",
    40: "Tool change pending",
    41: "Spindle not running",
    42: "Illegal plane",
    43: "Max feed rate exceeded",
    44: "RPM out of range",
    45: "Limits engaged",
    46: "Homing required",
    47: "Tool error",
    48: "Value word conflict",
    49: "Self test failed",
    50: "EStop",
    51: "Motor fault",
    52: "Setting value out of range",
    53: "Setting disabled",
    54: "Invalid retract position",
    55: "Illegal homing configuration",
    56: "Coord system locked",
    57: "Unexpected demarcation",
    60: "SD mount error",
    61: "File read error",
    62: "Failed open dir",
    63: "Dir not found",
    64: "SD not mounted",
    65: "FS not mounted",
    66: "FS read only",
    70: "BT init error",
    71: "Expression unknown op",
    72: "Expression divide by zero",
    73: "Expression argument out of range",
    74: "Expression invalid argument",
    75: "Expression syntax error",
    76: "Expression invalid result",
    77: "Authentication required",
    78: "Access denied",
    79: "Not allowed critical event",
    80: "Flow control not executing macro",
    81: "Flow control syntax error",
    82: "Flow control stack overflow",
    83: "Flow control out of memory",
    84: "File open failed"
};

export const Console = () => {
    const [command, setCommand] = useState('');
    const historyEndRef = useRef<HTMLDivElement>(null);
    const status = useStore(x=>x.status);
    const isSending = useStore(x => x.isSending);
    const { isConnected, sendCommand } = useGRBL();
    const [history, setHistory] = useState<string[]>([]);
    const navigate = useNavigate();
    
    // Track command history and current position
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [tempCommand, setTempCommand] = useState('');
    const [ShowGCodeOk, setShowGCodeOk] = useState(false)
    const [ShowStatusResponse, setShowStatusResponse] = useState(false)
    const [ShowGCodeOffsetResponse, setShowGCodeOffsetResponse] = useState(false)
    const [ShowActiveModesResponse, setShowActiveModesResponse] = useState(false)

    // Check if GCode file is running
    const isGCodeFileRunning = isSending;

    const clearHistory = () => {
        setHistory([]);
        setCommandHistory([]);
        setHistoryIndex(-1);
        setTempCommand('');
    };

    // Listen for incoming messages
    useGRBLListener((line: string) => {

        if (line.toLowerCase().includes("error:1")) {
            return;
        }
        if (line.toLowerCase().includes("grbl")) {
            return;
        }
        if (line.toLowerCase().includes("grbl")) {
            return;
        }
        // Filter lines that end with ']' but don't contain '['
        if (line.endsWith(']') && !line.includes('[')) {
            return;
        }
        if ((line.startsWith('<') && line.endsWith('>')) && !ShowStatusResponse) {
            return;
        }
        else {
            setShowStatusResponse(false)
        }

        // Filter active modes response (response to $G command)
        if (line.startsWith('[GC:') && line.endsWith(']') && !ShowActiveModesResponse) {
            return;
        }
        if (ShowActiveModesResponse && line.startsWith('[GC:') && line.endsWith(']')) {
            setShowActiveModesResponse(false);
        }

        // Filter G-code offset response (response to $# command)
        if (line.match(/^\[G5[4-9]:|^\[G59\.[1-3]:|^\[G2[8-9]:|^\[G3[0-9]:|^\[G92:|^\[TLO:|^\[PRB:|^\[HOME:|^\[T:|^\[TLR:/) && !ShowGCodeOffsetResponse) {
            return;
        }
        if (ShowGCodeOffsetResponse && line.match(/^\[G5[4-9]:|^\[G59\.[1-3]:|^\[G2[8-9]:|^\[G3[0-9]:|^\[G92:|^\[TLO:|^\[PRB:|^\[HOME:|^\[T:|^\[TLR:/)) {
            setShowGCodeOffsetResponse(false);
        }

        // Filter configuration parameters like $131=305.000
        if (line.includes("$")) {
            return;
        }
        if (line == "ok" && !ShowGCodeOk) {
            return;
        } else {
            setShowGCodeOk(false);
        }
        setHistory(prev => [...prev, line]);

    },[ShowStatusResponse,ShowGCodeOffsetResponse,ShowGCodeOk,ShowActiveModesResponse],true);

    const scrollToBottom = () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        historyEndRef.current?.scrollTo({top:historyEndRef.current.firstChild?.clientHeight, behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
        setTimeout(scrollToBottom, 500);
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
            const c= command.trim();

            // Navigate to config page when "$" is sent
            if (c === "$$") {
                navigate(ROUTES.MACHINE_CONFIG);
                return;
            }
            
            if(c.includes("$") && (status != "Idle" && status !== "Alarm" ))
            {
                setHistory(prev => [...prev, `> ${command}`]);

                setHistory(prev => [...prev, "$ Only Work In Idle State"]);
                return;
            }
            if(c == "?")
            {
                setShowStatusResponse(true)
            }
            else if (c == "$#"){
                setShowGCodeOffsetResponse(true)
            }
            else if (c == "$G"){
                setShowActiveModesResponse(true)
            }
            else {
                setShowGCodeOk(true);
            }
            try {
                // Add the sent command to history
                setHistory(prev => [...prev, `> ${command}`]);
                setCommandHistory(prev => [...prev, command]);
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
                <h2 className="text-xl font-bold flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                    </svg>
                    Console
                </h2>
                <button
                    onClick={clearHistory}
                    className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded active:bg-red-800 cursor-pointer"
                >
                    Clear
                </button>
            </div>
            <div
                className="h-40 max-h-[400px] bg-gray-900 rounded p-2 mb-4 overflow-y-auto custom-scrollbar console-text-selectable"
                ref={historyEndRef}>
                <div className="space-y-1 font-mono text-sm">
                    {history.map((line, index) => {
                        // Check if line contains an error code
                        const errorMatch = line.match(/error:(\d+)/);
                        if (errorMatch) {
                            const errorCode = parseInt(errorMatch[1]);
                            const errorMeaning = GRBL_ERROR_CODES[errorCode] || "Unknown error";
                            return (
                                <div key={index} className="text-red-400 console-text-selectable">
                                    {line} ({errorMeaning})
                                </div>
                            );
                        }
                        return (
                            <div
                                key={index}
                                className={` console-text-selectable ${
                                    line.startsWith('>') ? 'text-green-400' : 'text-gray-300'
                                }`}
                            >
                                {line}
                            </div>
                        );
                    })}
                </div>
            </div>
            {isGCodeFileRunning ? (
                <div className="flex items-center justify-center py-4 text-gray-400 bg-gray-700 rounded text-sm">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Console disabled when GCode file is running
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                    <label htmlFor="command"></label>
                    <input
                        autoComplete="off"
                        id={"command"}
                        type="text"
                        value={command}
                        onChange={(e) => {
                            setCommand(e.target.value);
                            setHistoryIndex(-1); // Reset history index when typing
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter command... (Use ↑↓ for history)"
                        className={`w-full bg-gray-700 rounded px-3 py-2 text-white ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!isConnected}
                    />
                    <button
                        type="submit"
                        className={`w-full sm:w-auto px-4 py-2 active:bg-blue-900 rounded ${isConnected ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-blue-600/50 cursor-not-allowed'}`}
                        disabled={!isConnected}
                    >
                        Send
                    </button>
                </form>
            )}
        </div>
    );
};