import {useState} from "react";

export const JogControls = () => {
    const [feedrate, setFeedrate] = useState(100);
    const [stepSize, setStepSize] = useState(1);
    const [continuousMode, setContinuousMode] = useState(false);

    const handleJog = (axis: string, direction: number) => {
        // Handle jogging logic here
        console.log(`Jogging ${axis} ${direction > 0 ? 'positive' : 'negative'}`);
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg h-full">
            <h2 className="text-xl font-bold mb-4">Jog Controls</h2>
            <div className="space-y-4">
                <div className="flex space-x-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Feedrate (mm/min)</label>
                        <input
                            type="number"
                            value={feedrate}
                            onChange={(e) => setFeedrate(Number(e.target.value))}
                            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Step Size (mm)</label>
                        <input
                            type="number"
                            value={stepSize}
                            onChange={(e) => setStepSize(Number(e.target.value))}
                            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                            disabled={continuousMode}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                    <input
                        type="checkbox"
                        checked={continuousMode}
                        onChange={(e) => setContinuousMode(e.target.checked)}
                        className="rounded bg-gray-700"
                    />
                    <label className="text-sm font-medium">Continuous Mode</label>
                </div>

                <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
                    <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded" onClick={() => handleJog('Y', 1)}>Y+</button>
                    <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded" onClick={() => handleJog('Z', 1)}>Z+</button>
                    <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded" onClick={() => handleJog('A', 1)}>A+</button>

                    <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded" onClick={() => handleJog('X', -1)}>X-</button>
                    <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded" onClick={() => handleJog('HOME', 0)}>HOME</button>
                    <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded" onClick={() => handleJog('X', 1)}>X+</button>

                    <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded" onClick={() => handleJog('Y', -1)}>Y-</button>
                    <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded" onClick={() => handleJog('Z', -1)}>Z-</button>
                    <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded" onClick={() => handleJog('A', -1)}>A-</button>
                </div>
            </div>
        </div>
    );
};