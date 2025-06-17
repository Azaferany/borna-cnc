import {useStore} from "../../app/store.ts";
import {useShallow} from "zustand/react/shallow";
import {useGRBL} from "../../app/useGRBL";
import {useEffect} from "react";

export const DwellInfo = () => {
    const dwell = useStore(useShallow(x => x.dwell));
    const status = useStore(x => x.status);
    const { sendCommand } = useGRBL();
    const updateDwell = useStore(x => x.updateDwell);

    const progress = dwell.TotalSeconds > 0 ? (dwell.RemainingSeconds / dwell.TotalSeconds) * 100 : 0;

    useEffect(() => {
        if (dwell.RemainingSeconds <= 0) return;

        const interval = setInterval(() => {
            updateDwell({
                ...dwell,
                RemainingSeconds: Math.max(0, dwell.RemainingSeconds - 1)
            });
        }, 1000);

        if (status != "Run") clearInterval(interval);

        return () => clearInterval(interval);
    }, [dwell, updateDwell, status]);

    if (dwell.RemainingSeconds <= 0) return (
        <div className="h-[68px] bg-gray-700 px-3 py-4 rounded opacity-0"/>
    );

    const handleSkip = async () => {
        try {
            await sendCommand('\xA4');
            setTimeout(() => updateDwell({RemainingSeconds: 0, TotalSeconds: 0}), 200)
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
