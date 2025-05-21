import {useGRBL} from "../../app/useGRBL.ts";
import {useStore} from "../../app/store.ts";
import {useEffect, useState} from "react";

export const OverrideControls = () => {
    const spindleSpeedOverridePercent = useStore(state => state.spindleSpeedOverridePercent);
    const feedrateOverridePercent = useStore(state => state.feedrateOverridePercent);
    const rapidSpeedOverridePercent = useStore(state => state.rapidSpeedOverridePercent);

    const { sendCommand } = useGRBL()

    const handleFeedOverride = async (newValue: number) => {
        // Validate feed override limits (10% to 200%)
        if (newValue < 10 || newValue > 200) return;

        if (newValue === feedrateOverridePercent) return; // Ignore if no change

        if (newValue === 100) {
            await sendCommand('\x90'); // Set 100%
        } else if (newValue > feedrateOverridePercent) {
            const diff = newValue - feedrateOverridePercent;
            const steps10 = Math.floor(diff / 10);
            const steps1 = diff % 10;

            for (let i = 0; i < steps10; i++) {
                await sendCommand('\x91'); // Increase 10%
            }
            for (let i = 0; i < steps1; i++) {
                await sendCommand('\x93'); // Increase 1%
            }
        } else {
            const diff = feedrateOverridePercent - newValue;
            const steps10 = Math.floor(diff / 10);
            const steps1 = diff % 10;

            for (let i = 0; i < steps10; i++) {
                await sendCommand('\x92'); // Decrease 10%
            }
            for (let i = 0; i < steps1; i++) {
                await sendCommand('\x94'); // Decrease 1%
            }
        }
    };

    const handleRapidOverride = async (newValue: number) => {
        if (newValue === rapidSpeedOverridePercent) return; // Ignore if no change

        if (newValue === 100) {
            await sendCommand('\x95'); // Set to 100%
        } else if (newValue === 50) {
            await sendCommand('\x96'); // Set to 50%
        } else if (newValue === 25) {
            await sendCommand('\x97'); // Set to 25%
        }
    };

    const handleSpindleOverride = async (newValue: number) => {
        // Validate spindle override limits (10% to 200%)
        console.log(newValue)

        if (newValue < 10 || newValue > 200) return;

        if (newValue === spindleSpeedOverridePercent) return; // Ignore if no change

        if (newValue === 100) {
            await sendCommand('\x99'); // Set 100%
        } else if (newValue > spindleSpeedOverridePercent) {
            const diff = newValue - spindleSpeedOverridePercent;
            const steps10 = Math.floor(diff / 10);
            const steps1 = diff % 10;

            for (let i = 0; i < steps10; i++) {
                await sendCommand('\x9A'); // Increase 10%
            }
            for (let i = 0; i < steps1; i++) {
                await sendCommand('\x9C'); // Increase 1%
            }
        } else {
            const diff = spindleSpeedOverridePercent - newValue;
            const steps10 = Math.floor(diff / 10);
            const steps1 = diff % 10;

            for (let i = 0; i < steps10; i++) {
                await sendCommand('\x9B'); // Decrease 10%
            }
            for (let i = 0; i < steps1; i++) {
                await sendCommand('\x9D'); // Decrease 1%
            }
        }
    };


    const SliderControl = ({
                               value: storeValue,
                               label,
                               onCommit,
                               min = 0,
                               max = 200,
                               step = 1,
                               allowedValues,
                           }: {
        label: string;
        value: number;
        onCommit: (value: number) => void;
        min?: number;
        max?: number;
        step?: number;
        allowedValues?: number[];    }) => {
        // Local thumb position
        const [localValue, setLocalValue] = useState(storeValue);
        const [isLoading, setIsLoading] = useState(false);


        useEffect(() => {
            if (localValue !== storeValue) {
                setIsLoading(true);
            } else {
                setIsLoading(false);
            }
        }, [localValue, storeValue]);

        useEffect(() => {
            setLocalValue(storeValue);
        }, [storeValue]);

        return (
            <div className="space-y-2">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">{label}</label>
                        <span className={`text-sm font-mono px-2 py-1 rounded flex items-center gap-1 ${isLoading ? 'bg-yellow-700' : 'bg-gray-700'}`}>
                            {storeValue}%
                            {isLoading && (
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            )}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        {!allowedValues &&(<button
                            onClick={() => onCommit && onCommit(Math.max(min, storeValue - 10))}
                            className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sm"
                        >
                            -10%
                        </button>)}                <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={localValue}
                        onChange={(e) => {
                            const v = Number(e.target.value);

                            if (allowedValues && !allowedValues.includes(v)) {
                                // Find nearest allowed value
                                const nearest = allowedValues.reduce((prev, curr) =>
                                    Math.abs(curr - v) < Math.abs(prev - v) ? curr : prev
                                );
                                setLocalValue(
                                    nearest
                                );
                            } else {
                                setLocalValue(
                                    v
                                );
                            }
                        }}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"

                        onMouseUp={() => onCommit(localValue)}
                        onTouchEnd={() => onCommit(localValue)}
                    />
                        {!allowedValues && (<button
                            onClick={() => {onCommit(Math.min(max, storeValue + 10))}}
                            className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sm"
                        >
                            +10%
                        </button>)}
                    </div>
                </div>
            </div>
        );
    }




    return (
        <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Override Controls</h2>
            <div className="space-y-4">
                <SliderControl
                    label="Rapid Speed Override"
                    value={rapidSpeedOverridePercent}
                    onCommit={handleRapidOverride}
                    min={0}
                    max={100}
                    step={25}
                    allowedValues={[25, 50, 100]}
                />
                <SliderControl
                    label="Feed Rate Override"
                    value={feedrateOverridePercent}
                    onCommit={handleFeedOverride}
                    min={10}
                    max={200}
                />
                <SliderControl
                    label="Spindle Speed Override"
                    value={spindleSpeedOverridePercent}
                    onCommit={handleSpindleOverride}
                    min={10}
                    max={200}
                />
            </div>
        </div>
    );
};