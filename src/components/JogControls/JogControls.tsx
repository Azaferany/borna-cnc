import {useState, useEffect, useCallback} from "react";
import { useGRBL } from "../../app/useGRBL.ts";
import { UnitDisplay } from "../UnitDisplay/UnitDisplay";
import { FeedrateUnitDisplay } from "../UnitDisplay/FeedrateUnitDisplay";
import { useStore } from "../../app/store.ts";
import {useShallow} from "zustand/react/shallow";

export const JogControls = () => {
    const [feedrate, setFeedrate] = useState(100);
    const [stepSize, setStepSize] = useState(1);
    const [continuousMode, setContinuousMode] = useState(false);
    const [activeButton, setActiveButton] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [keyboardMode, setKeyboardMode] = useState(false);
    const { sendCommand, isConnected } = useGRBL();
    const status = useStore(state => state.status);
    const isSending = useStore(state => state.isSending);
    const machineCoordinate = useStore(useShallow(state => state.machineCoordinate));
    const machineConfig = useStore(useShallow(state => state.machineConfig));
    const isMachineRunning = status === "Run" || status === "Hold" || isSending;

    useEffect(() => {
        if (isMachineRunning) {
            setIsExpanded(false);
        }
    }, [isMachineRunning]);
    const stopJog = useCallback(async () => {
        try {
            await sendCommand('\x85');
        } catch (error) {
            console.error('Error stopping jog:', error);
        }
    }, [sendCommand]);


    const handleJog = useCallback(async (axis: string, direction: number) => {
        if (!isConnected || isMachineRunning) {
            console.error("Not connected to GRBL device or machine is running");
            return;
        }

        try {
            // Format the jog command
            const distance = direction * (continuousMode ? 1000 : stepSize); // Use large distance for continuous mode
            const command = `$J=G91 ${axis}${distance.toFixed(3)} F${feedrate}`;

            await sendCommand(command);
        } catch (error) {
            console.error('Error sending jog command:', error);
        }
    }, [continuousMode, feedrate, isConnected, isMachineRunning, sendCommand, stepSize]);

    const handleDiagonalJog = useCallback(async (axis1: string, direction1: number, axis2: string, direction2: number) => {
        if (!isConnected || isMachineRunning) {
            console.error("Not connected to GRBL device or machine is running");
            return;
        }

        try {
            const distance = (continuousMode ? 500 : stepSize);
            const command = `$J=G91 ${axis1}${(direction1 * distance).toFixed(3)} ${axis2}${(direction2 * distance).toFixed(3)} F${feedrate}`;
            await sendCommand(command);
        } catch (error) {
            console.error('Error sending diagonal jog command:', error);
        }
    }, [continuousMode, feedrate, isConnected, isMachineRunning, sendCommand, stepSize]);

    const handleJogStart = useCallback((axis: string, direction: number) => {
        if (continuousMode) {
            setActiveButton(`${axis}${direction}`);
            handleJog(axis, direction);
        }
    }, [continuousMode, handleJog]);

    const handleJogEnd = useCallback(() => {
        setActiveButton(null);
        if (continuousMode) {
            stopJog();
        }
    }, [continuousMode, stopJog]);

    const handleDiagonalJogStart = useCallback((axis1: string, direction1: number, axis2: string, direction2: number) => {
        if (continuousMode) {
            setActiveButton(`${axis1}${direction1}${axis2}${direction2}`);
            handleDiagonalJog(axis1, direction1, axis2, direction2);
        }
    }, [continuousMode, handleDiagonalJog]);

    const handleDiagonalClick = (axis1: string, direction1: number, axis2: string, direction2: number) => {
        if (!continuousMode) {
            handleDiagonalJog(axis1, direction1, axis2, direction2);
        }
    };

    const handleClick = (axis: string, direction: number) => {
        if (!continuousMode) {
            handleJog(axis, direction);
        }
    };


    useEffect(() => {
        if (!keyboardMode || !isConnected || isMachineRunning || !isExpanded) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            if (e.repeat) return; // Prevent key repeat

            const isShiftPressed = e.shiftKey;

            switch (e.key) {
                case 'ArrowUp':
                    if (isShiftPressed && machineConfig.activeAxes.x && machineConfig.activeAxes.y) {
                        handleDiagonalJogStart('X', 1, 'Y', 1);
                    } else if (machineConfig.activeAxes.y) {
                        handleJogStart('Y', 1);
                    }
                    break;
                case 'ArrowDown':
                    if (isShiftPressed && machineConfig.activeAxes.x && machineConfig.activeAxes.y) {
                        handleDiagonalJogStart('X', -1, 'Y', -1);
                    } else if (machineConfig.activeAxes.y) {
                        handleJogStart('Y', -1);
                    }
                    break;
                case 'ArrowLeft':
                    if (isShiftPressed && machineConfig.activeAxes.x && machineConfig.activeAxes.y) {
                        handleDiagonalJogStart('X', -1, 'Y', 1);
                    } else if (machineConfig.activeAxes.x) {
                        handleJogStart('X', -1);
                    }
                    break;
                case 'ArrowRight':
                    if (isShiftPressed && machineConfig.activeAxes.x && machineConfig.activeAxes.y) {
                        handleDiagonalJogStart('X', 1, 'Y', -1);
                    } else if (machineConfig.activeAxes.x) {
                        handleJogStart('X', 1);
                    }
                    break;
                case 'PageUp':
                    if (machineConfig.activeAxes.z) {
                        handleJogStart('Z', 1);
                    }
                    break;
                case 'PageDown':
                    if (machineConfig.activeAxes.z) {
                        handleJogStart('Z', -1);
                    }
                    break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            handleJogEnd();

        };

        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [keyboardMode, isConnected, isMachineRunning, continuousMode, stepSize, feedrate, handleJogStart, handleDiagonalJogStart, handleJogEnd, isExpanded, machineConfig.activeAxes]);

    useEffect(() => {
        if (activeButton || !keyboardMode) return;
        stopJog()
    }, [activeButton, keyboardMode, machineCoordinate, stopJog]);



    const renderJogButton = (axis: string, direction: number, label: string) => {
        const isDisabled = !isConnected || isMachineRunning || isMachineRunning || (!continuousMode && stepSize <= 0);
        const isActive = activeButton === `${axis}${direction}`;
        const buttonClass = `p-3 px-6 rounded flex items-center justify-center transition-colors
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${isActive
            ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-500'
            : 'bg-gray-700 hover:bg-gray-600 active:bg-gray-400'}`;

        return (
            <button
                key={`${axis}${direction}`}
                className={buttonClass}
                onClick={() => handleClick(axis, direction)}
                onMouseDown={() => handleJogStart(axis, direction)}
                onMouseUp={handleJogEnd}
                onMouseLeave={handleJogEnd}
                disabled={isDisabled}
                title={`Jog ${axis} axis ${direction > 0 ? 'positive' : 'negative'} direction`}
            >
                <div className="flex flex-col items-center">
                    <span className="text-lg font-bold">{label}</span>
                    {!continuousMode && (
                        <span className="text-xs text-gray-300">
                            {stepSize}<UnitDisplay/>
                        </span>
                    )}
                </div>
            </button>
        );
    };

    const renderDiagonalJogButton = (axis1: string, direction1: number, axis2: string, direction2: number, label: string) => {
        // Only show diagonal buttons if both axes are active
        const axis1Active = (axis1 === 'X' && machineConfig.activeAxes.x) || (axis1 === 'Y' && machineConfig.activeAxes.y);
        const axis2Active = (axis2 === 'X' && machineConfig.activeAxes.x) || (axis2 === 'Y' && machineConfig.activeAxes.y);

        if (!axis1Active || !axis2Active) {
            return <div key={`${axis1}${direction1}${axis2}${direction2}`} className="p-3 px-6"></div>; // Empty space placeholder
        }

        return (
            <button
                key={`${axis1}${direction1}${axis2}${direction2}`}
                className={`p-3 px-6 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeButton === `${axis1}${direction1}${axis2}${direction2}`
                        ? 'bg-blue-600 hover:bg-blue-500'
                        : 'bg-gray-700 hover:bg-gray-600 active:bg-gray-400'
                }`}
                onClick={() => handleDiagonalClick(axis1, direction1, axis2, direction2)}
                onMouseDown={() => handleDiagonalJogStart(axis1, direction1, axis2, direction2)}
                onMouseUp={handleJogEnd}
                onMouseLeave={handleJogEnd}
                disabled={!isConnected || isMachineRunning}
            >
                {label}
            </button>
        );
    };

    // Render center button or empty space
    const renderCenterButton = () => {
        return (
            <button
                className={`p-3 rounded      disabled:opacity-50 disabled:cursor-not-allowed ${
                    status === "Jog"
                        ? "bg-red-500 hover:bg-red-400 active:bg-red-300"
                        : "bg-gray-700 hover:bg-gray-600 active:bg-gray-400"
                }`}
                onClick={() => {
                    if (status === "Jog")
                        stopJog()
                    else {
                        setContinuousMode(!continuousMode)
                        if (continuousMode)
                            setKeyboardMode(!continuousMode)
                    }
                }}
                disabled={!isConnected || isMachineRunning}
            >
                {status === "Jog" ? "✋" : (continuousMode ? "___" : ". . . ")}
            </button>
        );
    };

    return (
        <div className={`bg-gray-800 rounded-lg ${keyboardMode ? 'ring-2 ring-yellow-500 ring-opacity-50' : ''}`}>
            <div
                onClick={() => !isMachineRunning && setIsExpanded(!isExpanded)}
                className={`w-full p-3 flex items-center justify-between text-white transition-colors duration-200 ${
                    isMachineRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-700'
                }`}
            >
                <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    </svg>
                    <h2 className="text-xl font-bold">Jog Controls</h2>
                    {isMachineRunning && (
                        <span className="px-2 py-1 bg-red-600 rounded-md text-xs font-sm">
                            Can't open while running
                        </span>
                    )}
                </div>
                {!isMachineRunning &&(<button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isMachineRunning)
                            return;

                        setIsExpanded(!isExpanded);
                    }}
                    className={`p-1 rounded-md transition-colors duration-200 flex items-center gap-1 ${
                        isMachineRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-600'
                    }`}
                    disabled={isMachineRunning}
                >
                    <span className="text-sm font-medium">{isExpanded ? 'Close' : 'Open Details'}</span>
                    {isExpanded ? (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/>
                        </svg>
                    ) : (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                        </svg>
                    )}
                </button>)}
            </div>
            
            <div className={`overflow-hidden transition-all duration-200 ease-out ${isExpanded ? 'h-auto' : 'h-0'}`}>
                <div className="p-4 pt-2 transform transition-transform duration-200 ease-out" style={{ transform: `translateY(${isExpanded ? '0' : '-100%'})` }}>
                    <div className="space-y-1">
                        <div className="flex space-x-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1" htmlFor={"Feedrate"}>Feedrate (<FeedrateUnitDisplay/>)</label>
                                <input
                                    id={"Feedrate"}
                                    type="number"
                                    defaultValue={feedrate}
                                    onChange={(e) => setFeedrate(Number(e.target.value))}
                                    className="w-full bg-gray-700 rounded px-4 py-2 text-white text-sm"
                                    min={1}
                                    max={10000}
                                    disabled={isMachineRunning}
                                />
                            </div>
                            <div className="flex-1">
                                {!continuousMode &&(<><label className="block text-sm font-medium mb-1" htmlFor={"Distance"}>Distance (<UnitDisplay/>)</label><input
                                    type="number"
                                    id={"Distance"}
                                    defaultValue={stepSize}
                                    onChange={(e) => setStepSize(Number(e.target.value))}
                                    className={`w-full bg-gray-700 rounded px-4 py-2 text-white text-sm ${continuousMode || isMachineRunning ? "cursor-not-allowed" : ""}`}
                                    disabled={continuousMode || isMachineRunning}
                                    min={0.001}
                                    max={1000}/></>)
                                }
                                {continuousMode && (<label className="block text-sm font-medium mt-6">Hold button to jog, release to stop</label>)}
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 mb-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={continuousMode}
                                    onChange={(e) => {
                                        setContinuousMode(e.target.checked)
                                        if (keyboardMode)
                                            setKeyboardMode(e.target.checked)
                                    }}
                                    className="rounded bg-gray-700"
                                    id="continuous-mode"
                                    disabled={isMachineRunning}
                                    title="Toggle between step-by-step and continuous jogging modes"
                                />
                                <label htmlFor="continuous-mode" className="text-sm font-medium cursor-pointer">
                                    Continuous Mode
                                </label>
                            </div>

                            <div
                                className={`flex items-center space-x-2 ${keyboardMode ? 'ring-2 ring-yellow-500 rounded-md p-1' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={keyboardMode}
                                    onChange={(e) => {
                                        setKeyboardMode(e.target.checked)
                                        setContinuousMode(e.target.checked)
                                    }}
                                    className="rounded bg-gray-700"
                                    id="keyboard-mode"
                                    disabled={isMachineRunning}
                                    title="Enable keyboard controls (Arrow keys for X/Y, Page Up/Down for Z, Shift + arrows for diagonal)"
                                />
                                <label htmlFor="keyboard-mode" className="text-sm font-medium cursor-pointer">
                                    Keyboard Mode
                                </label>
                            </div>
                        </div>

                        {keyboardMode && (
                            <div
                                className={`mb-4 p-3 bg-gray-700 rounded text-sm ${keyboardMode ? 'ring-2 ring-yellow-500 ring-opacity-50' : ''}`}>
                                <h3 className="font-medium mb-2">Keyboard Controls:</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    {(machineConfig.activeAxes.x || machineConfig.activeAxes.y) && <li>Arrow Keys:
                                        Move {machineConfig.activeAxes.x && machineConfig.activeAxes.y ? 'X/Y' : machineConfig.activeAxes.x ? 'X' : 'Y'} axis</li>}
                                    {machineConfig.activeAxes.z && <li>Page Up/Down: Move Z axis</li>}
                                    {machineConfig.activeAxes.x && machineConfig.activeAxes.y &&
                                        <li>Shift + Arrows: Diagonal movement</li>}
                                </ul>
                            </div>
                        )}

                        <div className="flex gap-4 justify-center">
                            <div className="grid grid-cols-3 gap-2">
                                {renderDiagonalJogButton('X', -1, 'Y', 1, '↖️')}
                                {machineConfig.activeAxes.y ? renderJogButton('Y', 1, 'Y+') :
                                    <div className="p-3 px-6"></div>}
                                {renderDiagonalJogButton('X', 1, 'Y', 1, '↗️')}

                                {machineConfig.activeAxes.x ? renderJogButton('X', -1, 'X-') :
                                    <div className="p-3 px-6"></div>}
                                {renderCenterButton()}
                                {machineConfig.activeAxes.x ? renderJogButton('X', 1, 'X+') :
                                    <div className="p-3 px-6"></div>}

                                {renderDiagonalJogButton('X', -1, 'Y', -1, '↙️')}
                                {machineConfig.activeAxes.y ? renderJogButton('Y', -1, 'Y-') :
                                    <div className="p-3 px-6"></div>}
                                {renderDiagonalJogButton('X', 1, 'Y', -1, '↘️')}
                            </div>

                            {machineConfig.activeAxes.z && (
                                <div className="grid grid-cols-1 gap-2 justify-between">
                                    {renderJogButton('Z', 1, 'Z+')}
                                    {renderJogButton('Z', -1, 'Z-')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};