import {useState} from "react";

export const OverrideControls = () => {
    const [rapidOverride, setRapidOverride] = useState(100);
    const [feedOverride, setFeedOverride] = useState(100);
    const [spindleOverride, setSpindleOverride] = useState(100);

    const SliderControl = ({
                               label,
                               value,
                               onChange
                           }: {
        label: string;
        value: number;
        onChange: (value: number) => void;
    }) => (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium">{label}</label>
                <span className="text-sm font-mono bg-gray-700 px-2 py-1 rounded">
          {value}%
        </span>
            </div>
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => onChange(Math.max(0, value - 10))}
                    className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sm"
                >
                    -10%
                </button>
                <input
                    type="range"
                    min="0"
                    max="200"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <button
                    onClick={() => onChange(Math.min(200, value + 10))}
                    className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sm"
                >
                    +10%
                </button>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Override Controls</h2>
            <div className="space-y-4">
                <SliderControl
                    label="Rapid Speed Override"
                    value={rapidOverride}
                    onChange={setRapidOverride}
                />
                <SliderControl
                    label="Feed Rate Override"
                    value={feedOverride}
                    onChange={setFeedOverride}
                />
                <SliderControl
                    label="Spindle Speed Override"
                    value={spindleOverride}
                    onChange={setSpindleOverride}
                />
            </div>
        </div>
    );
};