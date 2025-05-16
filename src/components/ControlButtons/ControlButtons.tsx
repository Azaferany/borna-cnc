import {
    PlayIcon,
    StopIcon,
    HomeIcon,
    ArrowPathIcon,
    PauseIcon,
    BackwardIcon,
} from '@heroicons/react/24/solid';


export const ControlButtons = () => {
    const buttons = [
        { icon: PlayIcon, label: 'Start', color: 'bg-green-600 hover:bg-green-700' },
        { icon: StopIcon, label: 'Stop', color: 'bg-red-600 hover:bg-red-700' },
        { icon: HomeIcon, label: 'Home', color: 'bg-blue-600 hover:bg-blue-700' },
        { icon: ArrowPathIcon, label: 'Reset', color: 'bg-yellow-600 hover:bg-yellow-700' },
        { icon: PauseIcon, label: 'Pause', color: 'bg-orange-600 hover:bg-orange-700' },
        { icon: BackwardIcon, label: 'Previous', color: 'bg-purple-600 hover:bg-purple-700' },
    ];

    return (
        <div className="bg-gray-800 p-4 rounded-lg h-full">
            <h2 className="text-xl font-bold mb-4">Machine Control</h2>
            <div className="grid grid-cols-3 gap-4 items-center mt-10">
                {buttons.map(({ icon: Icon, label, color }) => (
                    <button
                        key={label}
                        className={`${color} p-3 rounded flex flex-col items-center justify-center transition-colors duration-150`}
                    >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm mt-1">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};