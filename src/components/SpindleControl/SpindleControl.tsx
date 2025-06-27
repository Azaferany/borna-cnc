import {useState, useEffect} from 'react';
import {CogIcon, StopIcon} from '@heroicons/react/24/solid';
import {useGRBL} from "../../app/useGRBL.ts";
import {useStore} from "../../app/store.ts";
import {useShallow} from "zustand/react/shallow";

export const SpindleControl = () => {
    const {sendCommand, isConnected} = useGRBL();
    const status = useStore(s => s.status);
    const isSending = useStore(s => s.isSending);
    const spindleSpeed = useStore(s => s.spindleSpeed);
    const machineConfig = useStore(useShallow(s => s.machineConfig));

    const [targetSpeed, setTargetSpeed] = useState(0);
    const [isSpindleOn, setIsSpindleOn] = useState(false);

    // Sync with store state
    useEffect(() => {
        setIsSpindleOn(spindleSpeed > 0);
        setTargetSpeed(spindleSpeed);
    }, [spindleSpeed, status, isSending]);

    const handleToggleSpindle = async () => {
        console.log(isSpindleOn)
        try {
            if (isSpindleOn) {
                // Turn off spindle
                await sendCommand('M5');
                setTargetSpeed(0);

            } else {
                // Turn on spindle with current target speed (minimum from machine config if 0)
                const minSpeed = machineConfig.spindleMinRpm > 0 ? machineConfig.spindleMinRpm : 1000;
                const speed = targetSpeed > 0 ? targetSpeed : minSpeed;
                await sendCommand(`M3 S${speed}`);
                setTargetSpeed(speed);

            }
            setIsSpindleOn(prevState => !prevState);

        } catch (error) {
            console.error('Error toggling spindle:', error);
        }
    };

    const handleSpeedChange = async (newSpeed: number) => {
        setTargetSpeed(newSpeed);

        if (isSpindleOn) {
            try {
                await sendCommand(`M3 S${newSpeed}`);
            } catch (error) {
                console.error('Error changing spindle speed:', error);
            }
        }
    };

    const isDisabled = !isConnected || isSending || status !== "Idle";

    // Generate preset speeds based on machine configuration
    const generatePresets = () => {
        const maxRpm = machineConfig.spindleMaxRpm;
        return [
            0,
            Math.round(maxRpm * 0.25),
            Math.round(maxRpm * 0.5),
            Math.round(maxRpm * 0.75),
            maxRpm
        ];
    };

    const presets = generatePresets();

    return (
        <div className="h-full bg-gray-800 rounded p-1.5 flex flex-col border border-gray-600">
            {/* Main control button */}
            <button
                className={`
                    w-full mb-2 p-2 rounded flex items-center justify-center gap-1
                    transition-all duration-150 font-medium text-sm
                    ${isSpindleOn
                    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
                    : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
                }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={handleToggleSpindle}
                disabled={isDisabled}
            >
                {isSpindleOn ? (
                    <>
                        <StopIcon className="h-4 w-4"/>
                        STOP SPINDLE
                    </>
                ) : (
                    <>
                        <CogIcon className="h-4 w-4"/>
                        START SPINDLE
                    </>
                )}
            </button>

            {/* Speed display */}
            <div className="mb-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300 text-xs">RPM</span>
                    <span className="text-white font-mono text-sm">
                        {targetSpeed.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Speed control slider - This section now grows to fill remaining space */}
            <div className="flex-1 flex flex-col justify-between min-h-0">
                {/* Slider container with flex-1 to take remaining space */}
                <div className="flex-1 flex items-center mb-2">
                    <input
                        type="range"
                        min={machineConfig.spindleMinRpm}
                        max={machineConfig.spindleMaxRpm}
                        step="100"
                        value={targetSpeed}
                        onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
                        disabled={isDisabled}
                        className={`
                            w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer
                            slider-thumb:appearance-none slider-thumb:h-3 slider-thumb:w-3 
                            slider-thumb:rounded-full slider-thumb:bg-blue-500 slider-thumb:cursor-pointer
                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(targetSpeed / machineConfig.spindleMaxRpm) * 100}%, #4b5563 ${(targetSpeed / machineConfig.spindleMaxRpm) * 100}%, #4b5563 100%)`
                        }}
                    />
                </div>

                {/* Quick speed presets - Fixed at bottom */}
                <div className="grid grid-cols-5 gap-1">
                    {presets.map((preset) => (
                        <button
                            key={preset}
                            className={`
                                py-1 px-1 text-xs rounded
                                transition-colors duration-150
                                ${targetSpeed === preset
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }
                                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            onClick={() => handleSpeedChange(preset)}
                            disabled={isDisabled}
                        >
                            {preset === 0 ? '0' : preset >= 1000 ? `${Math.round(preset / 1000)}K` : preset.toString()}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};