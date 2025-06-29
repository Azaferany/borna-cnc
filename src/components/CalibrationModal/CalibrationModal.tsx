import React, {useState, useEffect} from 'react';
import {useGRBL} from '../../app/useGRBL';
import {useStore} from '../../app/store';
import {useGRBLListener} from '../../app/useGRBLListener';
import {UnitDisplay} from '../UnitDisplay/UnitDisplay';
import {FeedrateUnitDisplay} from '../UnitDisplay/FeedrateUnitDisplay';
import Modal from 'react-modal';
import {useTranslation} from 'react-i18next';

// Set the app element for accessibility
Modal.setAppElement('#root');

interface CalibrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    axis: 'X' | 'Y' | 'Z' | 'A' | 'B' | 'C';
}

const CalibrationModal: React.FC<CalibrationModalProps> = ({isOpen, onClose, axis}) => {
    const {t} = useTranslation();
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
            className={`p-3 px-6 rounded disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${
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
            <div className="flex flex-col items-center">
                <span className="text-lg font-bold  text-white">{label}</span>
                {!continuousMode && (
                    <span className="text-xs text-gray-400">
                        {stepSize}<UnitDisplay/>
                    </span>
                )}
            </div>
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
            setError(t('calibrationModal.errors.measuredDistanceTooSmall', {distance: measuredDistance.toFixed(3)}));
            return;
        }
        setError(null);

        // Calculate new steps per mm using the machine distance
        const newStepsPerMm = currentSteps * (machineDistance / measuredDistance);

        // Guard against invalid calculations
        if (!isFinite(newStepsPerMm) || newStepsPerMm <= 0) {
            setError(t('calibrationModal.errors.invalidStepsCalculation'));
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

    const modalStyles = {
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '8px',
            overflowY: 'auto' as const
        },
        content: {
            background: 'transparent',
            border: 'none',
            padding: 0,
            inset: 'auto',
            position: 'relative' as const,
            width: '100%',
            maxWidth: '32rem',
            margin: '8px 0',
            overflow: 'visible'
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            style={modalStyles}
            shouldCloseOnOverlayClick={true}
            shouldCloseOnEsc={true}
        >
            <div className="bg-gray-800 p-4 rounded-lg shadow-xl w-full max-w-[32rem] my-2">
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <h2 className="text-lg font-bold text-white">{t('calibrationModal.title', {axis})}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {step === 'first' && t('calibrationModal.stepDescriptions.first')}
                            {step === 'jog' && t('calibrationModal.stepDescriptions.jog')}
                            {step === 'second' && t('calibrationModal.stepDescriptions.second')}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 cursor-pointer hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div className="space-y-3">
                    {step === 'first' && (
                        <>
                            <div className="bg-gray-700/50 p-3 rounded-lg mb-2">
                                <h3 className="text-white font-medium mb-1 text-sm">{t('calibrationModal.instructions.title')}</h3>
                                <ol className="list-decimal list-inside text-gray-300 space-y-1 text-xs">
                                    <li>{t('calibrationModal.instructions.first.step1')}</li>
                                    <li>{t('calibrationModal.instructions.first.step2')}</li>
                                    <li>{t('calibrationModal.instructions.first.step3')}</li>
                                </ol>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">
                                    {t('calibrationModal.firstMeasurement')} (<UnitDisplay/>)
                                </label>
                                <input
                                    type="number"
                                    value={firstMeasurement}
                                    onChange={(e) => setFirstMeasurement(parseFloat(e.target.value))}
                                    className="w-full px-2 py-1.5 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                    placeholder={t('calibrationModal.firstMeasurementPlaceholder')}
                                />
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                                <button
                                    onClick={onClose}
                                    className="px-3 py-1.5 cursor-pointer bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                                >
                                    {t('calibrationModal.buttons.cancel')}
                                </button>
                                <button
                                    onClick={handleFirstMeasurementSubmit}
                                    disabled={!isConnected || isSending || status !== 'Idle'}
                                    className={`px-3 cursor-pointer py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm ${
                                        (!isConnected || isSending || status !== 'Idle')
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                    }`}
                                >
                                    {t('calibrationModal.buttons.next')}
                                </button>
                            </div>
                        </>
                    )}

                    {step === 'jog' && (
                        <>
                            <div className="bg-gray-700/50 p-3 rounded-lg mb-2">
                                <h3 className="text-white font-medium mb-1 text-sm">{t('calibrationModal.instructions.title')}</h3>
                                <ol className="list-decimal list-inside text-gray-300 space-y-1 text-xs">
                                    <li>{t('calibrationModal.instructions.jog.step1')}</li>
                                    <li>{t('calibrationModal.instructions.jog.step2')}</li>
                                    <li>{t('calibrationModal.instructions.jog.step3')}</li>
                                </ol>
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-gray-700/50 p-2 rounded-lg">
                                        <div className="text-gray-400">{t('calibrationModal.firstMeasurement')}:</div>
                                        <div className="text-white font-medium">{firstMeasurement.toFixed(3)}
                                            <UnitDisplay/></div>
                                    </div>
                                    <div className="bg-gray-700/50 p-2 rounded-lg">
                                        <div className="text-gray-400">{t('calibrationModal.currentPosition')}:</div>
                                        <div
                                            className="text-white font-medium">{machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c']?.toFixed(3)}
                                            <UnitDisplay/></div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex space-x-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium mb-1 text-white"
                                                   htmlFor="jog-feedrate">{t('calibrationModal.feedrate')}
                                                (<FeedrateUnitDisplay/>)</label>
                                            <input
                                                id="jog-feedrate"
                                                type="number"
                                                value={feedrate}
                                                onChange={(e) => setFeedrate(Number(e.target.value))}
                                                className="w-full bg-gray-700 rounded px-4 py-2 text-white text-sm"
                                                min={1}
                                                max={10000}
                                                disabled={isSending || status !== 'Idle'}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            {!continuousMode && (
                                                <>
                                                    <label className="block text-sm font-medium mb-1 text-white"
                                                           htmlFor="jog-distance">{t('calibrationModal.distance')} (<UnitDisplay/>)</label>
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
                                                <label
                                                    className="block text-sm font-medium mt-6 text-white">{t('calibrationModal.holdButtonToJog')}</label>
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
                                            title={t('calibrationModal.continuousModeTooltip')}
                                        />
                                        <label htmlFor="continuous-mode"
                                               className="text-sm font-medium cursor-pointer text-white">
                                            {t('calibrationModal.continuousMode')}
                                        </label>
                                    </div>

                                    <div className="flex justify-center">
                                        <div className="grid grid-cols-1 gap-2 w-full max-w-[180px]">
                                            {renderJogButton(1, `${axis}+`)}
                                            <button
                                                className={`p-3 cursor-pointer rounded disabled:opacity-50 text-white disabled:cursor-not-allowed ${
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

                            <div className="flex justify-end space-x-2 mt-4">
                                <button
                                    onClick={() => setStep('first')}
                                    className="px-3 cursor-pointer py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                                >
                                    {t('calibrationModal.buttons.back')}
                                </button>
                                <button
                                    onClick={() => setStep('second')}
                                    disabled={!isConnected || isSending || status !== 'Idle' ||
                                        Math.abs((machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c'] ?? 0) - (startMachineCoordinate ?? 0)) < 0.001}
                                    className={`px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm ${
                                        (!isConnected || isSending || status !== 'Idle' ||
                                            Math.abs((machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c'] ?? 0) - (startMachineCoordinate ?? 0)) < 0.001)
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                    }`}
                                >
                                    {t('calibrationModal.buttons.next')}
                                </button>
                            </div>
                        </>
                    )}

                    {step === 'second' && (
                        <>
                            <div className="bg-gray-700/50 p-3 rounded-lg mb-2">
                                <h3 className="text-white font-medium mb-1 text-sm">{t('calibrationModal.instructions.title')}</h3>
                                <ol className="list-decimal list-inside text-gray-300 space-y-1 text-xs">
                                    <li>{t('calibrationModal.instructions.second.step1')}</li>
                                    <li>{t('calibrationModal.instructions.second.step2')}</li>
                                    <li>{t('calibrationModal.instructions.second.step3')}</li>
                                    <li>{t('calibrationModal.instructions.second.step4')}</li>
                                </ol>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1">
                                        {t('calibrationModal.secondMeasurement')} (<UnitDisplay/>)
                                    </label>
                                    <input
                                        type="number"
                                        value={secondMeasurement}
                                        onChange={(e) => {
                                            const value = parseFloat(e.target.value);
                                            setSecondMeasurement(value);
                                            handleSecondMeasurementSubmit(false, value);
                                        }}
                                        className="w-full px-2 py-1.5 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                        placeholder={t('calibrationModal.secondMeasurementPlaceholder')}
                                    />
                                </div>

                                <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
                                    <h3 className="text-base font-medium text-white">{t('calibrationModal.calibrationInformation')}</h3>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-gray-800/50 p-2 rounded-lg">
                                            <div className="text-gray-400">{t('calibrationModal.firstMeasurement')}:
                                            </div>
                                            <div className="text-white font-medium">{firstMeasurement}
                                                <UnitDisplay/></div>
                                        </div>
                                        <div className="bg-gray-800/50 p-2 rounded-lg">
                                            <div className="text-gray-400">{t('calibrationModal.currentStepsMm')}:</div>
                                            <div className="text-white font-medium">{currentSteps}</div>
                                        </div>
                                        <div className="bg-gray-800/50 p-2 rounded-lg">
                                            <div
                                                className="text-gray-400">{t('calibrationModal.firstPosition', {axis})}:
                                            </div>
                                            <div className="text-white font-medium">{startMachineCoordinate}
                                                <UnitDisplay/></div>
                                        </div>

                                        <div className="bg-gray-800/50 p-2 rounded-lg">
                                            <div
                                                className="text-gray-400">{t('calibrationModal.currentAxisPosition', {axis})}:
                                            </div>
                                            <div
                                                className="text-white font-medium">{machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c']}
                                                <UnitDisplay/></div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-700 pt-2 mt-2">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-gray-800/50 p-2 rounded-lg">
                                                <div
                                                    className="text-gray-400">{t('calibrationModal.measuredDistance')}:
                                                </div>
                                                <div
                                                    className="text-white font-medium">{Math.abs(secondMeasurement - firstMeasurement)}
                                                    <UnitDisplay/></div>
                                            </div>

                                            <div className="bg-gray-800/50 p-2 rounded-lg">
                                                <div
                                                    className="text-gray-400">{t('calibrationModal.machineDistance')}:
                                                </div>
                                                <div
                                                    className="text-white font-medium">{Math.abs((machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c'] ?? 0) - (startMachineCoordinate ?? 0))}
                                                    <UnitDisplay/></div>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div
                                            className="mt-2 p-2 bg-red-900/50 border border-red-500 rounded text-red-200 text-xs">
                                            <div className="font-medium mb-0.5">{t('calibrationModal.error')}:</div>
                                            {error}
                                        </div>
                                    )}

                                    {newSteps > 0 && !error && (
                                        <div
                                            className="mt-2 p-2 bg-green-900/50 border border-green-500 rounded text-green-200 text-xs">
                                            <div className="font-medium mb-0.5">{t('calibrationModal.newStepsMm')}:
                                            </div>
                                            {newSteps.toFixed(3)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 mt-4">
                                <button
                                    onClick={() => setStep('jog')}
                                    className="px-3 cursor-pointer py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                                >
                                    {t('calibrationModal.buttons.back')}
                                </button>
                                <button
                                    onClick={() => handleSecondMeasurementSubmit(true, secondMeasurement)}
                                    disabled={!isConnected || isSending || status !== 'Idle' || secondMeasurement <= 0 || !!error ||
                                        Math.abs((machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c'] ?? 0) - (startMachineCoordinate ?? 0)) < 0.001}
                                    className={`px-3 cursor-pointer py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm ${
                                        (!isConnected || isSending || status !== 'Idle' || secondMeasurement <= 0 || !!error ||
                                            Math.abs((machineCoordinate?.[axis.toLowerCase() as 'x' | 'y' | 'z' | 'a' | 'b' | 'c'] ?? 0) - (startMachineCoordinate ?? 0)) < 0.001)
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                    }`}
                                >
                                    {t('calibrationModal.buttons.completeCalibration')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default CalibrationModal; 