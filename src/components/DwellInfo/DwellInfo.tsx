import {useStore} from "../../app/store.ts";
import {useShallow} from "zustand/react/shallow";
import {useGRBL} from "../../app/useGRBL";

export const DwellInfo = () => {
    const dwell = useStore(useShallow(x => x.dwell));
    const { sendCommand } = useGRBL();
    const progress = dwell.TotalSeconds > 0 ? (dwell.RemainingSeconds / dwell.TotalSeconds) * 100 : 0;

    if (dwell.RemainingSeconds <= 0) return null;

    const handleSkip = async () => {
        try {
            await sendCommand('#');
        } catch (error) {
            console.error('Error skipping dwell:', error);
        }
    };

    return (
        <div className="flex items-center gap-2 bg-gray-700 px-3 py-4 rounded">
            <div className="flex items-center gap-2">
                <div className="animate-spin h-5 w-5 border-4 border-blue-500 border-t-transparent rounded-full" />
                <div className="text-md font-medium text-gray-200">Dwell</div>
            </div>
            <div className="w-full h-4 bg-gray-600 rounded-full overflow-hidden">
                <div
                    className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="text-sm font-medium text-gray-200">
                {dwell.RemainingSeconds.toFixed(1)}s
            </div>
            <button
                onClick={handleSkip}
                className="px-2 py-2 mx-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded transition-colors"
            >
                Skip
            </button>
        </div>
    );
};
