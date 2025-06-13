import React, {useState, useEffect} from 'react';
import {useGRBL} from '../../app/useGRBL';
import {useStore} from '../../app/store';
import {useGRBLListener} from '../../app/useGRBLListener';
import {UnitDisplay} from '../UnitDisplay/UnitDisplay';
import {FeedrateUnitDisplay} from '../UnitDisplay/FeedrateUnitDisplay';

interface CalibrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    axis: 'X' | 'Y' | 'Z' | 'A' | 'B' | 'C';
}

const CalibrationModal: React.FC<CalibrationModalProps> = ({isOpen, onClose, axis}) => {
    const [firstMeasurement, setFirstMeasurement] = useState<number>(0);
    const [secondMeasurement, setSecondMeasurement] = useState<number>(0);
    const [currentSteps, setCurrentSteps] = useState<number>(0);
    const [newSteps, setNewSteps] = useState<number>(0);
    const [step, setStep] = useState<'first' | 'jog' | 'second'>('first');
    const [startMachineCoordinate, setStartMachineCoordinate] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const {sendCommand, isConnected} = useGRBL();
    const status = useStore(x => x.status);
    const isSending = useStore(x => x.isSending);
    const machineCoordinate = useStore(x => x.machineCoordinate);
    const [feedrate, setFeedrate] = useState(100);
    const [stepSize, setStepSize] = useState(1);
    const [continuousMode, setContinuousMode] = useState(false);
    const [activeButton, setActiveButton] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            sendCommand('$$');
        }
    }, [isOpen, sendCommand]);

    useGRBLListener((line) => {
        if (line.startsWith('$')) {
            const [id, value] = line.substring(1).split('=');
            if (id && value) {
                const paramId = parseInt(id);
                if (paramId === (axis === 'X' ? 100 : axis === 'Y' ? 101 : axis === 'Z' ? 102 : axis === 'A' ? 110 : axis === 'B' ? 111 : 112)) {
                    const currentSteps = parseFloat(value);
                    setCurrentSteps(currentSteps);
                }
            }
        }
    });

    const stopJog = async () => {
        try {
            await sendCommand('\x85');
        } catch (error) {
            console.error('Error stopping jog:', error);
        }
    };

    const handleJog = async (direction: number) => {
        if (!isConnected || isSending || status !== 'Idle') return;

        try {
            const distance = direction * (continuousMode ? 1000 : stepSize);
            const command = `$J=G91 ${axis}${distance.toFixed(3)} F${feedrate}`;
            await sendCommand(command);
        } catch (error) {
            console.error('Error during jog:', error);
        }
    };

    const handleJogStart = (direction: number) => {
        if (continuousMode) {
            setActiveButton(`${direction}`);
            handleJog(direction);
        }
    };

    const handleJogEnd = () => {
        setActiveButton(null);
        if (continuousMode) {
            stopJog();
        }
    };

    const handleClick = (direction: number) => {
        if (!continuousMode) {
            handleJog(direction);
        }
    };

    const renderJogButton = (direction: number, label: string) => (
        <button
            className={`p-3 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                activeButton === `${direction}`
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : 'bg-gray-700 hover:bg-gray-600 active:bg-gray-400'
            }`}
            onClick={() => handleClick(direction)}
            onMouseDown={() => handleJogStart(direction)}
            onMouseUp={handleJogEnd}
            onMouseLeave={handleJogEnd}
            disabled={!isConnected || isSending || status !== 'Idle'}
        >
            {label}
        </button>
    );

    const handleFirstMeasurementSubmit = () => {
        // Save the current machine coordinate for the selected axis
        const currentAxisCoord = machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c'] ?? 0;
        setStartMachineCoordinate(currentAxisCoord);
        setStep('jog');
    };

    const handleSecondMeasurementSubmit = (setStepsPerMm: boolean, measurement: number) => {
        if (measurement <= 0 || startMachineCoordinate === null) return;

        const measuredDistance = Math.abs(measurement - firstMeasurement);
        const machineDistance = Math.abs((machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c'] ?? 0) - startMachineCoordinate);

        // Guard against zero or very small measured distance
        if (measuredDistance < 0.001) {
            setError(`Measured distance too small: ${measuredDistance.toFixed(3)}`);
            return;
        }
        setError(null);

        // Calculate new steps per mm using the machine distance
        const newStepsPerMm = currentSteps * (machineDistance / measuredDistance);

        // Guard against invalid calculations
        if (!isFinite(newStepsPerMm) || newStepsPerMm <= 0) {
            setError('Invalid steps calculation. Please check your measurements.');
            console.log('Invalid steps calculation:', {
                currentSteps,
                machineDistance,
                measuredDistance,
                newStepsPerMm
            });
            return;
        }

        setNewSteps(newStepsPerMm);

        console.log('Calibration Values:', {
            axis,
            firstMeasurement,
            secondMeasurement: measurement,
            startMachineCoordinate,
            currentMachineCoordinate: machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c'],
            measuredDistance,
            machineDistance,
            currentSteps,
            newStepsPerMm,
            command: `$${axis === 'X' ? '100' : axis === 'Y' ? '101' : axis === 'Z' ? '102' : axis === 'A' ? '103' : axis === 'B' ? '104' : '105'}=${newStepsPerMm.toFixed(3)}`
        });

        if (setStepsPerMm) {
            // Update steps per mm
            sendCommand(`$${axis === 'X' ? '100' : axis === 'Y' ? '101' : axis === 'Z' ? '102' : axis === 'A' ? '103' : axis === 'B' ? '104' : '105'}=${newStepsPerMm.toFixed(3)}`);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-[32rem]">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white">Calibrate {axis} Axis</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {step === 'first' && "Enter the first measurement to start calibration"}
                            {step === 'jog' && "Move the machine to a new position"}
                            {step === 'second' && "Enter the second measurement to complete calibration"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    {step === 'first' && (
                        <>
                            <div className="bg-gray-700/50 p-4 rounded-lg mb-4">
                                <h3 className="text-white font-medium mb-2">Instructions:</h3>
                                <ol className="list-decimal list-inside text-gray-300 space-y-2 text-sm">
                                    <li>Place your measurement tool at the starting position</li>
                                    <li>Enter the current measurement value</li>
                                    <li>Click Next to proceed to jogging</li>
                                </ol>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    First Measurement (<UnitDisplay/>)
                                </label>
                                <input
                                    type="number"
                                    value={firstMeasurement}
                                    onChange={(e) => setFirstMeasurement(parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="Enter first measurement"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleFirstMeasurementSubmit}
                                    disabled={!isConnected || isSending || status !== 'Idle'}
                                    className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                                        (!isConnected || isSending || status !== 'Idle')
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                    }`}
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    )}

                    {step === 'jog' && (
                        <>
                            <div className="bg-gray-700/50 p-4 rounded-lg mb-4">
                                <h3 className="text-white font-medium mb-2">Instructions:</h3>
                                <ol className="list-decimal list-inside text-gray-300 space-y-2 text-sm">
                                    <li>Use the jog controls to move the machine to a new position</li>
                                    <li>Make sure to move at least 1mm from the starting position</li>
                                    <li>Click Next when you've reached the desired position</li>
                                </ol>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="bg-gray-700/50 p-3 rounded-lg">
                                        <div className="text-gray-400">First Measurement:</div>
                                        <div className="text-white font-medium">{firstMeasurement.toFixed(3)}
                                            <UnitDisplay/></div>
                                    </div>
                                    <div className="bg-gray-700/50 p-3 rounded-lg">
                                        <div className="text-gray-400">Current Position:</div>
                                        <div
                                            className="text-white font-medium">{machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c']?.toFixed(3)}
                                            <UnitDisplay/></div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex space-x-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium mb-1" htmlFor="jog-feedrate">Feedrate
                                                (<FeedrateUnitDisplay/>)</label>
                                            <input
                                                id="jog-feedrate"
                                                type="number"
                                                value={feedrate}
                                                onChange={(e) => setFeedrate(Number(e.target.value))}
                                                className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                                                min={1}
                                                max={10000}
                                                disabled={isSending || status !== 'Idle'}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            {!continuousMode && (
                                                <>
                                                    <label className="block text-sm font-medium mb-1"
                                                           htmlFor="jog-distance">Distance (<UnitDisplay/>)</label>
                                                    <input
                                                        type="number"
                                                        id="jog-distance"
                                                        value={stepSize}
                                                        onChange={(e) => setStepSize(Number(e.target.value))}
                                                        className={`w-full bg-gray-700 rounded px-4 py-2 text-white text-sm ${continuousMode ? "cursor-not-allowed" : ""}`}
                                                        disabled={continuousMode || isSending || status !== 'Idle'}
                                                        min={0.001}
                                                        max={1000}
                                                    />
                                                </>
                                            )}
                                            {continuousMode && (
                                                <label className="block text-sm font-medium mt-6">Hold button to jog,
                                                    release to stop</label>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 mb-4">
                                        <input
                                            type="checkbox"
                                            checked={continuousMode}
                                            onChange={(e) => setContinuousMode(e.target.checked)}
                                            className="rounded bg-gray-700"
                                            id="continuous-mode"
                                            disabled={isSending || status !== 'Idle'}
                                        />
                                        <label htmlFor="continuous-mode" className="text-sm font-medium">
                                            Continuous Mode
                                        </label>
                                    </div>

                                    <div className="flex justify-center">
                                        <div className="grid grid-cols-1 gap-2">
                                            {renderJogButton(1, `${axis}+`)}
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
                                                disabled={!isConnected || isSending}
                                            >
                                                {status === "Jog" ? "✋" : (continuousMode ? "___" : ". . . ")}
                                            </button>
                                            {renderJogButton(-1, `${axis}-`)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setStep('first')}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep('second')}
                                    disabled={!isConnected || isSending || status !== 'Idle' ||
                                        Math.abs((machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c'] ?? 0) - (startMachineCoordinate ?? 0)) < 0.001}
                                    className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                                        (!isConnected || isSending || status !== 'Idle' ||
                                            Math.abs((machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c'] ?? 0) - (startMachineCoordinate ?? 0)) < 0.001)
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                    }`}
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    )}

                    {step === 'second' && (
                        <>
                            <div className="bg-gray-700/50 p-4 rounded-lg mb-4">
                                <h3 className="text-white font-medium mb-2">Instructions:</h3>
                                <ol className="list-decimal list-inside text-gray-300 space-y-2 text-sm">
                                    <li>Place your measurement tool at the current position</li>
                                    <li>Enter the new measurement value</li>
                                    <li>Review the calibration information</li>
                                    <li>Click Complete Calibration to save the new steps/mm value</li>
                                </ol>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Second Measurement (<UnitDisplay/>)
                                    </label>
                                    <input
                                        type="number"
                                        value={secondMeasurement}
                                        onChange={(e) => {
                                            const value = parseFloat(e.target.value);
                                            setSecondMeasurement(value);
                                            handleSecondMeasurementSubmit(false, value);
                                        }}
                                        className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter second measurement"
                                    />
                                </div>

                                <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
                                    <h3 className="text-lg font-medium text-white">Calibration Information</h3>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="bg-gray-800/50 p-4 rounded-lg">
                                            <div className="text-gray-400 text-sm">First Measurement:</div>
                                            <div className="text-white font-medium text-sm">{firstMeasurement}
                                                <UnitDisplay/></div>
                                        </div>
                                        <div className="bg-gray-800/50 p-3 rounded-lg">
                                            <div className="text-gray-400">Current Steps/mm:</div>
                                            <div className="text-white font-medium">{currentSteps}</div>
                                        </div>
                                        <div className="bg-gray-800/50 p-3 rounded-lg">
                                            <div className="text-gray-400">First {axis} Position:</div>
                                            <div className="text-white font-medium">{startMachineCoordinate}
                                                <UnitDisplay/></div>
                                        </div>

                                        <div className="bg-gray-800/50 p-3 rounded-lg">
                                            <div className="text-gray-400">Current {axis} Position:</div>
                                            <div
                                                className="text-white font-medium">{machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c']}
                                                <UnitDisplay/></div>
                                        </div>

                                    </div>

                                    <div className="border-t border-gray-700 pt-3 mt-3">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="bg-gray-800/50 p-3 rounded-lg">
                                                <div className="text-gray-400">Measured Distance:</div>
                                                <div
                                                    className="text-white font-medium">{Math.abs(secondMeasurement - firstMeasurement)}
                                                    <UnitDisplay/></div>
                                            </div>

                                            <div className="bg-gray-800/50 p-3 rounded-lg">
                                                <div className="text-gray-400">Machine Distance:</div>
                                                <div
                                                    className="text-white font-medium">{Math.abs((machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c'] ?? 0) - (startMachineCoordinate ?? 0))}
                                                    <UnitDisplay/></div>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div
                                            className="mt-3 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
                                            <div className="font-medium mb-1">Error:</div>
                                            {error}
                                        </div>
                                    )}

                                    {newSteps > 0 && !error && (
                                        <div
                                            className="mt-3 p-3 bg-green-900/50 border border-green-500 rounded text-green-200 text-sm">
                                            <div className="font-medium mb-1">New Steps/mm:</div>
                                            {newSteps.toFixed(3)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setStep('jog')}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => handleSecondMeasurementSubmit(true, secondMeasurement)}
                                    disabled={!isConnected || isSending || status !== 'Idle' || secondMeasurement <= 0 || !!error ||
                                        Math.abs((machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c'] ?? 0) - (startMachineCoordinate ?? 0)) < 0.001}
                                    className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                                        (!isConnected || isSending || status !== 'Idle' || secondMeasurement <= 0 || !!error ||
                                            Math.abs((machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c'] ?? 0) - (startMachineCoordinate ?? 0)) < 0.001)
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                    }`}
                                >
                                    Complete Calibration
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalibrationModal; 