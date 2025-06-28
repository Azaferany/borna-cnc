import React, {useState, useEffect} from 'react';
import {useStore} from '../../app/store';
import {useShallow} from 'zustand/react/shallow';
import {useGRBL} from '../../app/useGRBL';
import {useGRBLListener} from '../../app/useGRBLListener';
import {LockOpenIcon, XMarkIcon, ExclamationTriangleIcon} from '@heroicons/react/24/solid';
import Modal from 'react-modal';
import {Plane} from '../../types/GCodeTypes';

// Set the app element for accessibility
Modal.setAppElement('#root');

interface AlarmModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// GRBLHAL alarm codes and their meanings
const GRBLHAL_ALARM_CODES: Record<number, string> = {
    1: 'Hard limit triggered. Machine position is likely lost due to sudden and immediate halt. Re-homing is highly recommended.',
    2: 'Soft limit alarm. G-code motion target exceeds machine travel. Machine position retained. Alarm may be unlocked.',
    3: 'Reset while in motion. Machine position is likely lost due to sudden and immediate halt. Re-homing is highly recommended.',
    4: 'Probe fail. Probe is not in the expected initial state before starting probe cycle when G38.2 and G38.3 is not triggered and G38.4 and G38.5 is triggered.',
    5: 'Probe fail. Probe did not contact the workpiece within the programmed travel for G38.2 and G38.4.',
    6: 'Homing fail. The active homing cycle was reset.',
    7: 'Homing fail. Safety door was opened during homing cycle.',
    8: 'Homing fail. Pull off travel failed to clear limit switch. Try increasing pull-off setting or check wiring.',
    9: 'Homing fail. Could not find limit switch within search distances. Try increasing max travel, decreasing pull-off distance, or check wiring.',
    10: 'Homing fail. Could not find limit switch within search distances. Try increasing max travel, decreasing pull-off distance, or check wiring.',
    11: 'Homing fail. Homing not enabled in settings.',
    12: 'Homing fail. Second dual axis limit switch failed to trigger within configured search distance after first.',
    13: 'Homing fail. Homing cycle not enabled in settings.',
    14: 'Spindle at speed timeout. Either the spindle hasnt gotten up to speed in the timeframe set for spindle at speed or spindle has been wired incorrectly to your controller.',
    15: 'Homing fail. Could not find second limit switch for auto squared axis within search distances. Try increasing max travel, decreasing pull-off distance, or check wiring.',
    16: 'Homing fail. Homing cycle not enabled in settings.',
    17: 'Motor fault. Issue encountered with closed loop motor tracking. Position likely lost.',
    18: 'Homing fail. Homing cycle not enabled in settings.',
    19: 'Homing fail. Homing cycle not enabled in settings.',
    20: 'Homing fail. Homing cycle not enabled in settings.',
    21: 'Homing fail. Homing cycle not enabled in settings.',
    22: 'Homing fail. Homing cycle not enabled in settings.',
    23: 'Homing fail. Homing cycle not enabled in settings.',
    24: 'Homing fail. Homing cycle not enabled in settings.',
    25: 'Homing fail. Homing cycle not enabled in settings.',
    26: 'Homing fail. Homing cycle not enabled in settings.',
    27: 'Homing fail. Homing cycle not enabled in settings.',
    28: 'Homing fail. Homing cycle not enabled in settings.',
    29: 'Homing fail. Homing cycle not enabled in settings.',
    30: 'Homing fail. Homing cycle not enabled in settings.',
    31: 'Homing fail. Homing cycle not enabled in settings.',
    32: 'Homing fail. Homing cycle not enabled in settings.',
    33: 'Homing fail. Homing cycle not enabled in settings.',
    34: 'Homing fail. Homing cycle not enabled in settings.',
    35: 'Homing fail. Homing cycle not enabled in settings.',
    36: 'Homing fail. Homing cycle not enabled in settings.',
    37: 'Homing fail. Homing cycle not enabled in settings.',
    38: 'Homing fail. Homing cycle not enabled in settings.',
    39: 'Homing fail. Homing cycle not enabled in settings.',
    40: 'Homing fail. Homing cycle not enabled in settings.'
};

export const AlarmModal: React.FC<AlarmModalProps> = ({isOpen, onClose}) => {
    const {sendCommand, isConnected} = useGRBL();
    const status = useStore(x => x.status);
    const machineCoordinate = useStore(useShallow(x => x.machineCoordinate));
    const workPlaceCoordinateOffset = useStore(useShallow(x => x.workPlaceCoordinateOffset));
    const activeModes = useStore(useShallow(x => x.activeModes));
    const selectedGCodeLine = useStore(x => x.selectedGCodeLine);
    const allGCodes = useStore(useShallow(x => x.allGCodes));
    const setIsSending = useStore(s => s.setIsSending);
    const [isUnlocking, setIsUnlocking] = useState(false);

    // Local state for alarm data
    const [alarmCode, setAlarmCode] = useState<number | undefined>(undefined);
    const [alarmMessage, setAlarmMessage] = useState<string | undefined>(undefined);

    // Parse alarm data from status response
    const parseAlarmFromStatus = (statusLine: string) => {
        if (statusLine.startsWith('<') && statusLine.endsWith('>')) {
            const inner = statusLine.trim().replace(/^<|>$/g, '');
            const tokens = inner.split('|');
            const stateToken = tokens[0];

            if (stateToken.startsWith('Alarm')) {
                const match = stateToken.match(/Alarm:(\d+)/);
                if (match) {
                    const code = parseInt(match[1]);
                    setAlarmCode(code);
                    setAlarmMessage(GRBLHAL_ALARM_CODES[code] || 'Unknown alarm code');
                } else {
                    setAlarmCode(undefined);
                    setAlarmMessage('Alarm state without specific code');
                }
            } else {
                setAlarmCode(undefined);
                setAlarmMessage(undefined);
            }
        }
    };

    // Listen for status responses
    useGRBLListener(parseAlarmFromStatus, [], true);

    // Clear alarm data when modal closes
    useEffect(() => {
        if (!isOpen) {
            setAlarmCode(undefined);
            setAlarmMessage(undefined);
        }
    }, [isOpen]);

    const handleUnlock = async () => {
        if (!isConnected || isUnlocking) return;
        setIsUnlocking(true);
        try {
            setIsSending(false);
            await sendCommand('\x18');
            setTimeout(async () => {
                try {
                    await sendCommand('$X');
                } catch (error) {
                    console.error('Error sending unlock command:', error);
                } finally {
                    setIsUnlocking(false);
                }
            }, 150);
        } catch (error) {
            console.error('Error during unlock process:', error);
            setIsUnlocking(false);
        }
    };

    const modalStyles = {
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
        },
        content: {
            background: 'transparent',
            border: 'none',
            padding: 0,
            inset: 'auto',
            position: 'relative' as const,
            width: '100%',
            maxWidth: '32rem',
            maxHeight: '90vh',
            overflow: 'visible'
        }
    };

    if (!isOpen || status !== 'Alarm') return null;

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            style={modalStyles}
            shouldCloseOnOverlayClick={true}
            shouldCloseOnEsc={true}
        >
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-500"/>
                            <h2 className="text-xl font-bold text-white">Machine Alarm</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                            aria-label="Close alarm modal"
                        >
                            <XMarkIcon className="h-5 w-5"/>
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {/* Alarm Status */}
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-400"/>
                            <h3 className="text-lg font-semibold text-red-400">Alarm State Active</h3>
                        </div>
                        <p className="text-gray-300 text-sm console-text-selectable">
                            The machine is currently in an alarm state and requires attention before operation can
                            continue.
                        </p>
                        {typeof alarmCode === 'number' && (
                            <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                                <div className="text-white font-bold text-lg mb-1 console-text-selectable">Alarm
                                    Code: {alarmCode}</div>
                                <div className="text-gray-300 text-sm mb-1 console-text-selectable">
                                    {alarmMessage}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Machine State Information */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <h3 className="text-white font-medium mb-3 console-text-selectable">Current Machine State:</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-gray-400 mb-1 console-text-selectable">Machine Coordinates:</div>
                                <div className="text-white font-mono console-text-selectable">
                                    X: {machineCoordinate.x.toFixed(3)}<br/>
                                    Y: {machineCoordinate.y.toFixed(3)}<br/>
                                    Z: {machineCoordinate.z.toFixed(3)}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-400 mb-1 console-text-selectable">Work Offset:</div>
                                <div className="text-white font-mono console-text-selectable">
                                    X: {workPlaceCoordinateOffset.x.toFixed(3)}<br/>
                                    Y: {workPlaceCoordinateOffset.y.toFixed(3)}<br/>
                                    Z: {workPlaceCoordinateOffset.z.toFixed(3)}
                                </div>
                            </div>
                        </div>

                        {/* Last G-Code Information */}
                        {selectedGCodeLine && allGCodes && allGCodes.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-600">
                                <div className="text-gray-400 mb-1 console-text-selectable">Last G-Code Line:</div>
                                <div className="bg-gray-800/50 p-2 rounded">
                                    <div className="text-white font-mono text-sm console-text-selectable">
                                        <span
                                            className="text-blue-400">Line {selectedGCodeLine}:</span> {allGCodes[selectedGCodeLine - 1]}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeModes && (
                            <div className="mt-3 pt-3 border-t border-gray-600">
                                <div className="text-gray-400 mb-1 console-text-selectable">Active Modes:</div>
                                <div className="text-white text-sm console-text-selectable">
                                    {activeModes.WorkCoordinateSystem} |
                                    {activeModes.Plane === Plane.XY ? ' G17' : activeModes.Plane === Plane.XZ ? ' G18' : ' G19'} |
                                    {activeModes.UnitsType === 'Millimeters' ? ' G21' : ' G20'} |
                                    {activeModes.PositioningMode === 'Absolute' ? ' G90' : ' G91'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="sticky bottom-0 bg-gray-800 p-4 border-t border-gray-700">
                    <div className="flex justify-between space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                        <button
                            onClick={handleUnlock}
                            disabled={!isConnected || isUnlocking}
                            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer"
                        >
                            <LockOpenIcon className="h-5 w-5"/>
                            <span>{isUnlocking ? 'Unlocking...' : 'Unlock Machine'}</span>
                        </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-400 console-text-selectable">
                        Note: Unlocking will reset active modes and clear the alarm state.
                    </div>
                </div>
            </div>
        </Modal>
    );
}; 