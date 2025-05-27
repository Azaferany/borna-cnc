import {
    PlayIcon,
    StopIcon,
    HomeIcon,
    ArrowPathIcon,
    PauseIcon,
} from '@heroicons/react/24/solid';
import {useGRBL} from "../../app/useGRBL.ts";
import {useStore} from "../../app/store.ts";
import {StartButton} from "../StartButton/StartButton.tsx";
import {PreviousButton} from "../PreviousButton/PreviousButton.tsx";

export const ControlButtons = () => {
    const { sendCommand, isConnected } = useGRBL();
    const status = useStore(s => s.status);
    const setIsSending = useStore(s => s.setIsSending);

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

    const handleReset = async () => {
        // Reset store state to initial values

        setIsSending(false)
        // Send soft reset command
        await handleCommand('\x18');
    };

    const buttons = [
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
            onClick: handleReset,
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
    ];

    return (
        <div className="bg-gray-800 p-4 rounded-lg h-full">
            <h2 className="text-xl font-bold mb-4">Machine Control</h2>
            <div className="grid grid-cols-3 gap-4 items-center mt-14">
                <StartButton/>
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
                <PreviousButton />
            </div>
        </div>
    );
};