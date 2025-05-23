import { PlayIcon } from '@heroicons/react/24/solid';
import { useStore } from "../../app/store.ts";
import { useGCodeBuffer } from "../../app/useGCodeBuffer.ts";

export const StartButton = () => {
    const allGCodes = useStore(s => s.allGCodes) ?? [];

    const { isSending, startSending, canStart } = useGCodeBuffer({ allGCodes });



    return (
        <button
            className={`bg-green-600 hover:bg-green-700 active:bg-green-900 p-3 rounded flex flex-col items-center justify-center transition-colors duration-150 ${!canStart ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={startSending}
            disabled={!canStart}
        >
            <PlayIcon className="h-6 w-6" />
            <span className="text-sm mt-1">{isSending ? 'Sending' : "Start"}</span>
        </button>
    );
}; 