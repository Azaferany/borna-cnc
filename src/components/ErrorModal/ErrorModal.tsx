import React from 'react';
import {useTranslation} from 'react-i18next';
import {XMarkIcon, ExclamationTriangleIcon} from '@heroicons/react/24/solid';
import Modal from 'react-modal';
import {useStore} from '../../app/store';
import {UnitDisplay} from '../UnitDisplay/UnitDisplay';
import {useShallow} from "zustand/react/shallow";

// Set the app element for accessibility
Modal.setAppElement('#root');

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    errorMessage: string;
    errorLine?: string;
    selectedGCodeLine?: number;
    selectedGCodeContent?: string;
}

// GRBL error codes and their meanings (based on grblHAL)
const GRBL_ERROR_CODES: Record<number, string> = {
    1: 'Expected command letter - A command letter was expected but not found',
    2: 'Bad number format - A number was expected but not found or has an invalid format',
    3: 'Invalid statement - A statement was not recognized or supported',
    4: 'Negative value - A negative value was provided where a positive value is required',
    5: 'Setting disabled - Homing cycle failure. Homing is not enabled via settings',
    6: 'Setting step pulse min - Minimum step pulse time must be greater than 3μsec',
    7: 'Setting read fail - An EEPROM read failed. Auto-restoring affected EEPROM to default values',
    8: 'Idle error -  \'$\' command cannot be used unless is IDLE',
    9: 'System GC lock - G-code commands are locked out during alarm or jog state',
    10: 'Soft limit error - Soft limits cannot be enabled without homing also enabled',
    11: 'Overflow - Max characters per line exceeded. Received command line was not executed',
    12: 'Max step rate exceeded - \'$\' setting value cause the step rate to exceed the maximum supported',
    13: 'Check door - Safety door detected as opened and door state initiated',
    14: 'Line length exceeded - Build info or startup line exceeded EEPROM line length limit',
    15: 'Travel exceeded - Jog target exceeds machine travel. Jog command has been ignored',
    16: 'Invalid jog command - Jog command has no \'=\' or contains prohibited g-code',
    17: 'Setting disabled laser - Laser mode requires PWM output',
    18: 'Reset - System reset detected',
    19: 'Non positive value - Non-positive value received for an expected positive value',
    20: 'Unsupported command - Unsupported or invalid g-code command found in block',
    21: 'Modal group violation - More than one g-code command from same modal group found in block',
    22: 'Undefined feed rate - Feed rate has not yet been set or is undefined',
    23: 'Command value not integer - G-code command in block requires an integer value',
    24: 'Axis command conflict - More than one g-code command that requires axis words found in block',
    25: 'Word repeated - Repeated g-code word found in block',
    26: 'No axis words - No axis words found in block for g-code command or current modal state which requires them',
    27: 'Invalid line number - Line number value is invalid',
    28: 'Value word missing - G-code command is missing a required value word',
    29: 'Unsupported coord sys - G59.x work coordinate systems are not supported',
    30: 'G53 invalid motion mode - G53 only allowed with G0 and G1 motion modes',
    31: 'Axis words exist - Axis words found in block when no command or current modal state uses them',
    32: 'No axis words in plane - G2 and G3 arcs require at least one in-plane axis word',
    33: 'Invalid target - Motion command target is invalid',
    34: 'Arc radius error - Arc radius value is invalid',
    35: 'No offsets in plane - G2 and G3 arcs require at least one in-plane offset word',
    36: 'Unused words - Unused value words found in block',
    37: 'G43 dynamic axis error - G43.1 dynamic tool length offset is not assigned to configured tool length axis',
    38: 'Illegal tool table entry - Tool number greater than max supported value',
    39: 'Value out of range - G-code value is out of valid range',
    40: 'Tool change pending - Tool change is pending and must be completed before continuing',
    41: 'Spindle not running - Spindle must be running for this operation',
    42: 'Illegal plane - Selected plane is not valid for this operation',
    43: 'Max feed rate exceeded - Commanded feed rate exceeds maximum allowed',
    44: 'RPM out of range - Spindle RPM value is outside valid range',
    45: 'Limits engaged - Limit switches are currently engaged',
    46: 'Homing required - Homing cycle must be performed before operation',
    47: 'Tool error - Tool-related error occurred',
    48: 'Value word conflict - Conflicting value words found in block',
    49: 'Self test failed - System self-test has failed',
    50: 'EStop - Emergency stop has been triggered',
    51: 'Motor fault - Motor driver fault detected',
    52: 'Setting value out of range - Setting value is outside valid range',
    53: 'Setting disabled - Requested setting is disabled',
    54: 'Invalid retract position - Tool retract position is invalid',
    55: 'Illegal homing configuration - Homing configuration is invalid',
    56: 'Coord system locked - Coordinate system is locked and cannot be modified',
    57: 'Unexpected demarcation - Unexpected character or demarcation found',
    60: 'SD mount error - SD card mounting failed',
    61: 'File read error - Error reading from file',
    62: 'Failed open dir - Failed to open directory',
    63: 'Dir not found - Directory not found',
    64: 'SD not mounted - SD card is not mounted',
    65: 'FS not mounted - File system is not mounted',
    66: 'FS read only - File system is read-only',
    70: 'BT init error - Bluetooth initialization failed',
    71: 'Expression unknown op - Unknown operator in expression',
    72: 'Expression divide by zero - Division by zero in expression',
    73: 'Expression argument out of range - Expression argument is out of range',
    74: 'Expression invalid argument - Invalid argument in expression',
    75: 'Expression syntax error - Syntax error in expression',
    76: 'Expression invalid result - Expression result is invalid',
    77: 'Authentication required - Authentication is required for this operation',
    78: 'Access denied - Access to resource is denied',
    79: 'Not allowed critical event - Operation not allowed during critical event',
    80: 'Flow control not executing macro - Flow control command not executing in macro',
    81: 'Flow control syntax error - Syntax error in flow control command',
    82: 'Flow control stack overflow - Flow control stack overflow',
    83: 'Flow control out of memory - Flow control ran out of memory',
    84: 'File open failed - Failed to open file'
};

export const ErrorModal: React.FC<ErrorModalProps> = ({
                                                          isOpen,
                                                          onClose,
                                                          errorMessage,
                                                          errorLine,
                                                          selectedGCodeLine,
                                                          selectedGCodeContent,
                                                      }) => {
    const {t} = useTranslation();
    const machineCoordinate = useStore(useShallow(x => x.machineCoordinate));
    const workPlaceCoordinateOffset = useStore(useShallow(x => x.workPlaceCoordinateOffset));
    const activeModes = useStore(useShallow(x => x.activeModes));
    const machineConfig = useStore(useShallow(x => x.machineConfig));
    // Extract error code from error message
    const extractErrorCode = (message: string): number | undefined => {
        const match = message.match(/error:(\d+)/i);
        return match ? parseInt(match[1]) : undefined;
    };

    const errorCode = extractErrorCode(errorMessage);
    const getErrorDescription = (code: number): string | undefined => {
        try {
            return t(`errorModal.grblErrors.${code}`);
        } catch {
            return GRBL_ERROR_CODES[code];
        }
    };

    const errorDescription = errorCode ? getErrorDescription(errorCode) : undefined;

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

    if (!isOpen) return null;

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
                            <h2 className="text-xl font-bold text-white">{t('errorModal.title')}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                            aria-label={t('errorModal.closeAriaLabel')}
                        >
                            <XMarkIcon className="h-5 w-5"/>
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {/* Error Status */}
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-400"/>
                            <h3 className="text-lg font-semibold text-red-400">{t('errorModal.executionStopped')}</h3>
                        </div>
                        <p className="text-gray-300 text-sm console-text-selectable">
                            {t('errorModal.executionStoppedDescription')}
                        </p>
                    </div>

                    {/* Error Details */}
                    <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-3">{t('errorModal.errorDetails')}</h4>

                        {/* Error Code */}
                        {errorCode && (
                            <div className="mb-3">
                                <div className="text-white font-bold text-lg mb-1 console-text-selectable">
                                    {t('errorModal.errorCode')} {errorCode}
                                </div>
                                {errorDescription && (
                                    <div
                                        className="text-red-400 text-sm bg-gray-800 p-2 rounded console-text-selectable">
                                        {errorDescription}
                                    </div>
                                )}
                            </div>
                        )}


                        {/* Problematic Line */}
                        {errorLine && (
                            <div className="mb-3">
                                <div
                                    className=" text-yellow-400 text-white font-semibold mb-1">{t('errorModal.problematicGCode')}
                                </div>
                                <div
                                    className="text-yellow-400 text-sm font-mono bg-gray-800 p-2 rounded console-text-selectable">
                                    {errorLine}
                                </div>
                            </div>
                        )}


                    </div>

                    {/* Current Coordinates */}
                    {(machineCoordinate || workPlaceCoordinateOffset) && (
                        <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                            {/* Selected G-Code Line */}
                        {selectedGCodeLine && (
                            <div className="mb-3">
                                <div className="text-white font-semibold mb-1">{t('errorModal.stoppedDuringLine')}</div>
                                <div
                                    className="text-blue-400 text-sm font-mono bg-gray-800 p-2 rounded console-text-selectable">
                                    {t('errorModal.line')} {selectedGCodeLine}: {selectedGCodeContent || t('errorModal.noContentAvailable')}
                                </div>
                            </div>
                        )}
                            {/* Machine Coordinates */}
                            {machineCoordinate && (
                                <div className="mb-3">
                                    <div
                                        className="text-green-400 font-semibold mb-1">{t('errorModal.machineCoordinates')}:
                                    </div>
                                    <div
                                        className="text-green-300 text-sm font-mono bg-gray-800 p-2 rounded console-text-selectable">
                                        {machineConfig?.activeAxes.x && `X: ${machineCoordinate.x.toFixed(3)} `}
                                        {machineConfig?.activeAxes.y && `Y: ${machineCoordinate.y.toFixed(3)} `}
                                        {machineConfig?.activeAxes.z && `Z: ${machineCoordinate.z.toFixed(3)} `}
                                        {activeModes?.UnitsType && <UnitDisplay/>}
                                    </div>
                                </div>
                            )}

                            {/* Work Coordinates */}
                            {workPlaceCoordinateOffset && (
                                <div>
                                    <div className="text-blue-400 font-semibold mb-1">
                                        {t('errorModal.workCoordinates')} ({activeModes?.WorkCoordinateSystem || 'G54'}):
                                    </div>
                                    <div
                                        className="text-blue-300 text-sm font-mono bg-gray-800 p-2 rounded console-text-selectable">
                                        {machineConfig?.activeAxes.x && `X: ${(machineCoordinate.x - workPlaceCoordinateOffset.x).toFixed(3)} `}
                                        {machineConfig?.activeAxes.y && `Y: ${(machineCoordinate.y - workPlaceCoordinateOffset.y).toFixed(3)} `}
                                        {machineConfig?.activeAxes.z && `Z: ${(machineCoordinate.z - workPlaceCoordinateOffset.z).toFixed(3)} `}
                                        {activeModes?.UnitsType && <UnitDisplay/>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                        >
                            {t('errorModal.close')}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}; 