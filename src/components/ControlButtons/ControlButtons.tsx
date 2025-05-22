import {
    PlayIcon,
    StopIcon,
    HomeIcon,
    ArrowPathIcon,
    PauseIcon,
    BackwardIcon,
} from '@heroicons/react/24/solid';
import {useGRBL} from "../../app/useGRBL.ts";
import {useStore} from "../../app/store.ts";
import {useEffect, useState} from "react";
import {useGRBLListener} from "../../app/useGRBLListener.ts";

export const ControlButtons = () => {
    const { sendCommand, isConnected } = useGRBL();
    const [isSending, setIsSending] = useState(false);
    const [waitingForOk, setWaitingForOk] = useState(false);

    const allGCodes = useStore(s => s.allGCodes);
    const selectedGCodeLine = useStore(s => s.selectedGCodeLine);
    const availableBufferSlots = useStore(s => s.availableBufferSlots);
    const lastSentLine = useStore(s => s.lastSentLine);
    const updateLastSentLine = useStore(s => s.updateLastSentLine);
    const status = useStore(s => s.status);

    useGRBLListener(line => {
        console.log('GRBL Response:', line);
        if(line == "ok") {
            console.log('Received OK, ready for next line');
            setWaitingForOk(false);
        }
        else if(line.includes("error")) {
            console.error('GRBL Error:', line);
            setIsSending(false);
        }
    });

    const handleCommand = async (command: string) => {
        try {
            console.log('Sending command:', command);
            await sendCommand(command);
        } catch (error) {
            console.error('Error sending command:', error);
        }
    };

    const handleContinue = async () => {
        if (window.confirm('Are you sure you want to continue? Make sure the door is closed.')) {
            await handleCommand('~');
        }
    };

    const sendNextLine = async () => {
        if (waitingForOk) {
            console.log('Waiting for OK response, skipping send');
            return;
        }

        const nextLine = lastSentLine + 1;
        const pendingLines = nextLine - (selectedGCodeLine ?? 0);

        console.log('Send status:', {
            nextLine,
            pendingLines,
            availableBufferSlots,
            lastSentLine,
            selectedGCodeLine,
            totalLines: allGCodes?.length
        });

        if (lastSentLine >= ((allGCodes?.length ?? 0) - 1) || !isConnected || !allGCodes?.[nextLine]) {
            console.log('Stopping send process:', {
                reason: lastSentLine >= ((allGCodes?.length ?? 0) - 1) ? 'Reached end of file' : 
                        !isConnected ? 'Not connected' : 'No next line available'
            });
            setIsSending(false);
            updateLastSentLine(-1);
            return;
        }

        if (pendingLines < availableBufferSlots) {
            console.log('Sending line:', {
                lineNumber: nextLine,
                content: allGCodes[nextLine]
            });
            setWaitingForOk(true);
            await handleCommand(allGCodes[nextLine]);
            updateLastSentLine(nextLine);
        } else {
            console.log('Buffer full, waiting for execution:', {
                pendingLines,
                availableBufferSlots
            });
        }
    };

    useEffect(() => {
        if (isConnected && allGCodes && lastSentLine < allGCodes.length - 1 && isSending && !waitingForOk) {
            console.log('Effect triggered, attempting to send next line');
            sendNextLine();
        }
    }, [selectedGCodeLine, lastSentLine, isConnected, allGCodes, isSending, waitingForOk]);

    const buttons = [
        { 
            icon: PlayIcon, 
            label: 'Start', 
            color: 'bg-green-600 hover:bg-green-700 active:bg-green-900',
            onClick: () => {
                console.log('Start button clicked, beginning send process');
                setIsSending(true);
            },
            disabled: !isConnected || !allGCodes || allGCodes.length === 0 || isSending
        },
        { 
            icon: status === "Door" ? PlayIcon : StopIcon, 
            label: status === "Door" ? 'Continue' : 'Stop', 
            color: status === "Door" ? 'bg-green-600 hover:bg-green-700 active:bg-green-900' : 'bg-red-600 hover:bg-red-700 active:bg-red-900',
            onClick: status === "Door" ? handleContinue : () => handleCommand('\x84'),
            disabled: !isConnected
        },
        { 
            icon: HomeIcon, 
            label: 'Home', 
            color: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-900',
            command: '$H', // Home all axes
            disabled: !isConnected || status === "Door"
        },
        { 
            icon: ArrowPathIcon, 
            label: 'Reset', 
            color: 'bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-900',
            command: '\x18', // Soft reset (Ctrl-X)
            disabled: !isConnected
        },
        { 
            icon: status === "Hold" ? PlayIcon : PauseIcon,
            label: status === "Hold" ? 'Continue' : 'Pause',
            color: 'bg-orange-600 hover:bg-orange-700 active:bg-orange-900',
            onClick: () => {
                const command = status === "Hold" ? '~' : '!'; // '~' for cycle start, '!' for feed hold
                handleCommand(command);
            },
            disabled: !isConnected || status === "Door"
        },
        { 
            icon: BackwardIcon, 
            label: 'Previous', 
            color: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-900',
            command: '', // Not implemented yet
            disabled: true
        },
    ];

    return (
        <div className="bg-gray-800 p-4 rounded-lg h-full">
            <h2 className="text-xl font-bold mb-4">Machine Control</h2>
            <div className="grid grid-cols-3 gap-4 items-center mt-14">
                {buttons.map(({ icon: Icon, label, color, command, disabled, onClick }) => (
                    <button
                        key={label}
                        className={`${color} p-3 rounded flex flex-col items-center justify-center transition-colors duration-150 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => onClick ? onClick() : command && handleCommand(command)}
                        disabled={disabled}
                    >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm mt-1">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};