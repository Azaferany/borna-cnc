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

export const ControlButtons = () => {
    const { sendCommand, isConnected } = useGRBL();
    const handleCommand = async (command: string) => {
        try {
            await sendCommand(command);
        } catch (error) {
            console.error('Error sending command:', error);
        }
    };

    const buttons = [
        { 
            icon: PlayIcon, 
            label: 'Start', 
            color: 'bg-green-600 hover:bg-green-700 active:bg-green-900',
            command: '~', // Cycle start/resume
            disabled: !isConnected
        },
        { 
            icon: StopIcon, 
            label: 'Stop', 
            color: 'bg-red-600 hover:bg-red-700 active:bg-red-900',
            command: '!', // Feed hold
            disabled: !isConnected
        },
        { 
            icon: HomeIcon, 
            label: 'Home', 
            color: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-900',
            command: '$H', // Home all axes
            disabled: !isConnected
        },
        { 
            icon: ArrowPathIcon, 
            label: 'Reset', 
            color: 'bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-900',
            command: '\x18', // Soft reset (Ctrl-X)
            disabled: !isConnected
        },
        { 
            icon: PauseIcon, 
            label: 'Pause', 
            color: 'bg-orange-600 hover:bg-orange-700 active:bg-orange-900',
            command: '!', // Feed hold (same as stop)
            disabled: !isConnected
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
                {buttons.map(({ icon: Icon, label, color, command, disabled }) => (
                    <button
                        key={label}
                        className={`${color} p-3 rounded flex flex-col items-center justify-center transition-colors duration-150 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => command && handleCommand(command)}
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