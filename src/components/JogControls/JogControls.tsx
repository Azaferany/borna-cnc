import { useState, useEffect } from "react";
import { useGRBL } from "../../app/useGRBL.ts";
import { UnitDisplay } from "../UnitDisplay/UnitDisplay";
import { FeedrateUnitDisplay } from "../UnitDisplay/FeedrateUnitDisplay";
import { useStore } from "../../app/store.ts";

export const JogControls = () => {
    const [feedrate, setFeedrate] = useState(100);
    const [stepSize, setStepSize] = useState(1);
    const [continuousMode, setContinuousMode] = useState(false);
    const [activeButton, setActiveButton] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const { sendCommand, isConnected } = useGRBL();
    const status = useStore(state => state.status);
    const isSending = useStore(state => state.isSending);
    const isMachineRunning = status === "Run" || status === "Hold" || isSending;

    useEffect(() => {
        if (isMachineRunning) {
            setIsExpanded(false);
        }
    }, [isMachineRunning]);

    const stopJog = async () => {
        try {
            await sendCommand('\x85');
        } catch (error) {
            console.error('Error stopping jog:', error);
        }
    };

    const handleJog = async (axis: string, direction: number) => {
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
    };

    const handleDiagonalJog = async (axis1: string, direction1: number, axis2: string, direction2: number) => {
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
    };

    const handleJogStart = (axis: string, direction: number) => {
        if (continuousMode) {
            setActiveButton(`${axis}${direction}`);
            handleJog(axis, direction);
        }
    };

    const handleJogEnd = () => {
        setActiveButton(null);
        if (continuousMode) {
            stopJog();
        }
    };

    const handleDiagonalJogStart = (axis1: string, direction1: number, axis2: string, direction2: number) => {
        if (continuousMode) {
            setActiveButton(`${axis1}${direction1}${axis2}${direction2}`);
            handleDiagonalJog(axis1, direction1, axis2, direction2);
        }
    };

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

    const renderJogButton = (axis: string, direction: number, label: string) => (
        <button 
            className={`p-3 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                activeButton === `${axis}${direction}` 
                    ? 'bg-blue-600 hover:bg-blue-500' 
                    : 'bg-gray-700 hover:bg-gray-600 active:bg-gray-400'
            }`}
            onClick={() => handleClick(axis, direction)}
            onMouseDown={() => handleJogStart(axis, direction)}
            onMouseUp={handleJogEnd}
            onMouseLeave={handleJogEnd}
            disabled={!isConnected || isMachineRunning}
        >
            {label}
        </button>
    );

    const renderDiagonalJogButton = (axis1: string, direction1: number, axis2: string, direction2: number, label: string) => (
        <button 
            className={`p-3 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed ${
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

    return (
        <div className="bg-gray-800 rounded-lg">
            <div
                onClick={() => !isMachineRunning && setIsExpanded(!isExpanded)}
                className={`w-full p-3 flex items-center justify-between text-white transition-colors duration-200 ${
                    isMachineRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'
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
                            Jogging Disabled - Machine Running
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
                        isMachineRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'
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
                                    value={feedrate}
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
                                    value={stepSize}
                                    onChange={(e) => setStepSize(Number(e.target.value))}
                                    className={`w-full bg-gray-700 rounded px-4 py-2 text-white text-sm ${continuousMode || isMachineRunning ? "cursor-not-allowed" : ""}`}
                                    disabled={continuousMode || isMachineRunning}
                                    min={0.001}
                                    max={1000}/></>)
                                }
                                {continuousMode && (<label className="block text-sm font-medium mt-6">Hold button to jog, release to stop</label>)}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 mb-4">
                            <input
                                type="checkbox"
                                checked={continuousMode}
                                onChange={(e) => setContinuousMode(e.target.checked)}
                                className="rounded bg-gray-700"
                                id="continuous-mode"
                                disabled={isMachineRunning}
                            />
                            <label htmlFor="continuous-mode" className="text-sm font-medium">
                                Continuous Mode
                            </label>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <div className="grid grid-cols-3 gap-2">
                                {renderDiagonalJogButton('X', -1, 'Y', 1, '↖️')}
                                {renderJogButton('Y', 1, 'Y+')}
                                {renderDiagonalJogButton('X', 1, 'Y', 1, '↗️')}
                                
                                {renderJogButton('X', -1, 'X-')}
                                <button
                                    className={`p-3 rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                                        status === "Jog"
                                            ? "bg-red-500 hover:bg-red-400 active:bg-red-300"
                                            : "bg-gray-700 hover:bg-gray-600 active:bg-gray-400"
                                    }`}
                                    onClick={() => {
                                        if (status === "Jog")
                                            stopJog()
                                        else
                                            setContinuousMode(!continuousMode)
                                    }}
                                    disabled={!isConnected || isMachineRunning}
                                >
                                    {status === "Jog" ? "✋" : (continuousMode ? "___" : ". . . ")}
                                </button>
                                {renderJogButton('X', 1, 'X+')}

                                {renderDiagonalJogButton('X', -1, 'Y', -1, '↙️')}
                                {renderJogButton('Y', -1, 'Y-')}
                                {renderDiagonalJogButton('X', 1, 'Y', -1, '↘️')}
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2 justify-between">
                                {renderJogButton('Z', 1, 'Z+')}
                                {renderJogButton('Z', -1, 'Z-')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};