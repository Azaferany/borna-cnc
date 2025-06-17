import {useGRBL} from "../../app/useGRBL.ts";
import {useStore} from "../../app/store.ts";
import {useEffect, useState} from "react";
import { FeedrateUnitDisplay } from "../UnitDisplay/FeedrateUnitDisplay";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const SliderControl = ({
                           value: storeValue,
                           label,
                           onCommit,
                           min = 0,
                           max = 200,
                           step = 1,
                           allowedValues,
                           children,
                       }: {
    label: string;
    value: number;
    onCommit: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    allowedValues?: number[];
    children?: React.ReactNode;
}) => {
    // Local thumb position
    const [localValue, setLocalValue] = useState(storeValue);
    const [isLoading, setIsLoading] = useState(false);
    const isConnected = useStore(state => state.isConnected);

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
        <div className="bg-gray-700/50 p-3 px-4 rounded-lg">
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <label className="text-sm font-medium" htmlFor={label.replace(" ",'')}>{label}</label>
                    <div className="flex items-center gap-2">
                        {children}
                        <span className={`text-sm font-mono px-2 py-1 rounded flex items-center gap-1 ${isLoading ? 'bg-yellow-700' : 'bg-gray-700'}`}>
                            {isLoading ? `${storeValue}%  →  ${localValue}%` : `${storeValue}%`}
                            {isLoading && (
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            )}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                    {!allowedValues && (
                        <button
                            onClick={() => {
                                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                                onCommit && onCommit(Math.max(min, storeValue - 10))
                                setLocalValue(prevState => prevState - 10);
                            }}
                            className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                            disabled={!isConnected}
                        >
                            -10%
                        </button>
                    )}
                    <div className="flex-1 min-w-0">
                        <input
                            id={label.replace(" ", '')}
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
                                    setLocalValue(nearest);
                                } else {
                                    setLocalValue(v);
                                }
                            }}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!isConnected}
                            onMouseUp={() => onCommit(localValue)}
                            onTouchEnd={() => onCommit(localValue)}
                        />
                    </div>
                    {!allowedValues && (
                        <button
                            onClick={() => {
                                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                                onCommit && onCommit(Math.max(min, storeValue + 10))
                                setLocalValue(prevState => prevState + 10);
                            }}
                            className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                            disabled={!isConnected}
                        >
                            +10%
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
export const OverrideControls = () => {
    const spindleSpeedOverridePercent = useStore(state => state.spindleSpeedOverridePercent);
    const feedrateOverridePercent = useStore(state => state.feedrateOverridePercent);
    const rapidSpeedOverridePercent = useStore(state => state.rapidSpeedOverridePercent);
    const feedrate = useStore(state => state.feedrate);
    const spindleSpeed = useStore(state => state.spindleSpeed);

    const { sendCommand } = useGRBL()

    const handleFeedOverride = async (newValue: number) => {
        // Validate feed override limits (10% to 200%)
        if (newValue < 10 || newValue > 200) return;

        if (newValue === feedrateOverridePercent) return; // Ignore if no change

        if (newValue === 100) {
            await sendCommand('\x90'); // Set 100%
            await delay(20);
        } else if (newValue > feedrateOverridePercent) {
            const diff = newValue - feedrateOverridePercent;
            const steps10 = Math.floor(diff / 10);
            const steps1 = diff % 10;

            for (let i = 0; i < steps10; i++) {
                await sendCommand('\x91'); // Increase 10%
                await delay(20);
            }
            for (let i = 0; i < steps1; i++) {
                await sendCommand('\x93'); // Increase 1%
                await delay(20);
            }
        } else {
            const diff = feedrateOverridePercent - newValue;
            const steps10 = Math.floor(diff / 10);
            const steps1 = diff % 10;

            for (let i = 0; i < steps10; i++) {
                await sendCommand('\x92'); // Decrease 10%
                await delay(20);
            }
            for (let i = 0; i < steps1; i++) {
                await sendCommand('\x94'); // Decrease 1%
                await delay(20);
            }
        }
    };

    const handleRapidOverride = async (newValue: number) => {
        if (newValue === rapidSpeedOverridePercent) return; // Ignore if no change

        if (newValue === 100) {
            await sendCommand('\x95'); // Set to 100%
            await delay(20);
        } else if (newValue === 50) {
            await sendCommand('\x96'); // Set to 50%
            await delay(20);
        } else if (newValue === 25) {
            await sendCommand('\x97'); // Set to 25%
            await delay(20);
        }
    };

    const handleSpindleOverride = async (newValue: number) => {
        // Validate spindle override limits (10% to 200%)
        console.log(newValue)

        if (newValue < 10 || newValue > 200) return;

        if (newValue === spindleSpeedOverridePercent) return; // Ignore if no change

        if (newValue === 100) {
            await sendCommand('\x99'); // Set 100%
            await delay(20);
        } else if (newValue > spindleSpeedOverridePercent) {
            const diff = newValue - spindleSpeedOverridePercent;
            const steps10 = Math.floor(diff / 10);
            const steps1 = diff % 10;

            for (let i = 0; i < steps10; i++) {
                await sendCommand('\x9A'); // Increase 10%
                await delay(20);
            }
            for (let i = 0; i < steps1; i++) {
                await sendCommand('\x9C'); // Increase 1%
                await delay(20);
            }
        } else {
            const diff = spindleSpeedOverridePercent - newValue;
            const steps10 = Math.floor(diff / 10);
            const steps1 = diff % 10;

            for (let i = 0; i < steps10; i++) {
                await sendCommand('\x9B'); // Decrease 10%
                await delay(20);
            }
            for (let i = 0; i < steps1; i++) {
                await sendCommand('\x9D'); // Decrease 1%
                await delay(20);
            }
        }
    };

    return (
        <div className="bg-gray-800 p-3 rounded-lg h-full">
            <h2 className="text-xl font-bold mb-8 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                </svg>
                Override Controls
            </h2>
            <div className="grid grid-cols-1 gap-2">
                <div className="col-span-1">
                    <SliderControl
                        label="Rapid Speed Override"
                        value={rapidSpeedOverridePercent}
                        onCommit={handleRapidOverride}
                        min={0}
                        max={100}
                        step={25}
                        allowedValues={[25, 50, 100]}
                    >
                        <span className="text-xs text-gray-400"
                              title="Adjust how fast the machine moves during rapid movements">Quick movements</span>
                    </SliderControl>
                </div>
                <div className="col-span-1">
                    <SliderControl
                        label="Feed Rate Override"
                        value={feedrateOverridePercent}
                        onCommit={handleFeedOverride}
                        min={10}
                        max={200}
                    >
                        <span className="text-sm font-mono px-2 py-1 rounded bg-blue-700" title="Current feed rate">
                            {feedrate.toFixed(0)} <FeedrateUnitDisplay/>
                        </span>
                    </SliderControl>
                </div>
                <div className="col-span-1">
                    <SliderControl
                        label="Spindle Speed Override"
                        value={spindleSpeedOverridePercent}
                        onCommit={handleSpindleOverride}
                        min={10}
                        max={200}
                    >
                        <span className="text-sm font-mono px-2 py-1 rounded bg-blue-700" title="Current spindle speed">
                            {spindleSpeed.toFixed(0)} RPM
                        </span>
                    </SliderControl>
                </div>
            </div>
        </div>
    );
};