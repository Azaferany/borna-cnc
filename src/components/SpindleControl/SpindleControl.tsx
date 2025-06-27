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
    const activeModes = useStore(useShallow(s => s.activeModes));

    const [targetSpeed, setTargetSpeed] = useState(0);
    const [isSpindleOn, setIsSpindleOn] = useState(false);
    const [spindleDirection, setSpindleDirection] = useState<'CW' | 'CCW'>('CW');

    // Sync with store state
    useEffect(() => {
        // Spindle is on when GRBL reports M3 or M4 (not M5/OFF) AND speed > 0
        const grblSpindleOn = activeModes?.SpindleDirection !== 'OFF';
        setIsSpindleOn(grblSpindleOn && spindleSpeed > 0);
        setTargetSpeed(spindleSpeed);
    }, [spindleSpeed, activeModes?.SpindleDirection, status, isSending]);

    // Sync spindle direction state based on conditions
    useEffect(() => {
        const isDisabled = !isConnected || isSending || status !== "Idle";
        const grblSpindleOn = activeModes?.SpindleDirection !== 'OFF';

        // Update direction from GRBL when disabled OR when spindle is running
        if (isDisabled || grblSpindleOn) {
            const grblDirection = activeModes?.SpindleDirection === 'CCW' ? 'CCW' : 'CW';
            setSpindleDirection(grblDirection);
        }
        // When spindle is off and not disabled, keep user's manual selection
    }, [isConnected, isSending, status, activeModes?.SpindleDirection]);

    const getSpindleCommand = (speed: number): string => {
        return spindleDirection === 'CW' ? `M3 S${speed}` : `M4 S${speed}`;
    };

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
                await sendCommand(getSpindleCommand(speed));
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
                await sendCommand(getSpindleCommand(newSpeed));
            } catch (error) {
                console.error('Error changing spindle speed:', error);
            }
        }
    };

    const handleDirectionChange = async (newDirection: 'CW' | 'CCW') => {
        setSpindleDirection(newDirection);

        // If spindle is running, restart it with new direction
        if (isSpindleOn && targetSpeed > 0) {
            try {
                await sendCommand('M5'); // Stop first
                await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause
                const command = newDirection === 'CW' ? `M3 S${targetSpeed}` : `M4 S${targetSpeed}`;
                await sendCommand(command);
            } catch (error) {
                console.error('Error changing spindle direction:', error);
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
            {/* Direction control */}
            <div className="mb-2">
                <div className="text-gray-300 text-xs mb-1">Direction</div>
                {isSpindleOn ? (
                    // Show only active direction when running
                    <div className="w-full">
                        <button
                            className="w-full py-1 px-2 text-xs rounded font-medium bg-blue-600 text-white"
                            disabled={true}
                        >
                            {spindleDirection === 'CW' ? 'CW (M3)' : 'CCW (M4)'} - ACTIVE
                        </button>
                    </div>
                ) : (
                    // Show both direction options when stopped
                    <div className="grid grid-cols-2 gap-1">
                        <button
                            className={`
                                py-1 px-2 text-xs rounded font-medium
                                transition-colors duration-150
                                ${spindleDirection === 'CW'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }
                                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            onClick={() => handleDirectionChange('CW')}
                            disabled={isDisabled}
                        >
                            CW (M3)
                        </button>
                        <button
                            className={`
                                py-1 px-2 text-xs rounded font-medium
                                transition-colors duration-150
                                ${spindleDirection === 'CCW'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }
                                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            onClick={() => handleDirectionChange('CCW')}
                            disabled={isDisabled}
                        >
                            CCW (M4)
                        </button>
                    </div>
                )}
            </div>

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
                        START SPINDLE ({spindleDirection})
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