import React, {useState, useEffect} from 'react';
import {Link} from 'react-router';
import {ROUTES} from '../app/routes';
import {useGRBL} from '../app/useGRBL';
import {useGRBLListener} from '../app/useGRBLListener';
import {
    MagnifyingGlassIcon,
    ExclamationTriangleIcon,
    HomeIcon,
    Cog6ToothIcon,
    Bars3Icon,
    XMarkIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import CalibrationModal from '../components/CalibrationModal/CalibrationModal';
import StartTourButton from '../components/StartTourButton/StartTourButton';
import LanguageSwitcher from "../components/LanguageSwitcher/LanguageSwitcher.tsx";

interface GrblParameter {
    id: number;
    name: string;
    value: string;
    description: string;
    hasDescription: boolean;
    group: string;
    datatype: 'integer' | 'float' | 'boolean' | 'string' | 'axis_mask' | 'coolant_mask' | 'spindle_mask' | 'control_mask' | 'report_mask' | 'network_mask';
    min?: number;
    max?: number;
    options?: Array<{ value: string, label: string }>;
}

const PARAMETER_DESCRIPTIONS: Record<number, {
    name: string;
    description: string;
    datatype: 'integer' | 'float' | 'boolean' | 'string' | 'axis_mask' | 'coolant_mask' | 'spindle_mask' | 'control_mask' | 'report_mask' | 'network_mask';
    min?: number;
    max?: number;
    options?: Array<{ value: string, label: string }>
}> = {
    // Basic Settings
    0: {name: 'Step pulse time', description: 'Microseconds step pulse time', datatype: 'integer', min: 1, max: 10},
    1: {name: 'Step idle delay', description: 'Milliseconds step idle delay', datatype: 'integer', min: 0, max: 65535},
    2: {name: 'Step port invert', description: 'Step port invert mask', datatype: 'axis_mask'},
    3: {name: 'Direction port invert', description: 'Direction port invert mask', datatype: 'axis_mask'},
    4: {name: 'Step enable invert', description: 'Step enable invert mask (per axis)', datatype: 'axis_mask'},
    5: {name: 'Limit pins invert', description: 'Limit pins invert mask', datatype: 'axis_mask'},
    6: {name: 'Probe pin invert', description: 'Probe pin invert mask', datatype: 'boolean'},
    9: {name: 'PWM Spindle Enable', description: 'PWM Spindle Enable', datatype: 'boolean'},
    10: {name: 'Status report options', description: 'Status report options mask', datatype: 'report_mask'},
    11: {name: 'Junction deviation', description: 'Junction deviation in mm', datatype: 'float', min: 0.001, max: 2.0},
    12: {name: 'Arc tolerance', description: 'Arc tolerance in mm', datatype: 'float', min: 0.001, max: 0.5},
    13: {name: 'Report inches', description: 'Report in inches (0=mm, 1=inches)', datatype: 'boolean'},
    14: {name: 'Control pin invert', description: 'Invert control input signals', datatype: 'control_mask'},
    15: {name: 'Coolant pin invert', description: 'Invert coolant output signals', datatype: 'coolant_mask'},
    16: {name: 'Spindle pin invert', description: 'Invert spindle output signals', datatype: 'spindle_mask'},
    17: {name: 'Control pullup disable', description: 'Disable control signal pullup', datatype: 'control_mask'},
    18: {name: 'Limit pullup disable', description: 'Disable limit signals pull up', datatype: 'axis_mask'},
    19: {name: 'Probe pullup disable', description: 'Disable probe pull up', datatype: 'boolean'},

    // Motion Settings
    20: {name: 'Soft limits', description: 'Soft limits enable (0=disable, 1=enable)', datatype: 'boolean'},
    21: {
        name: 'Hard limits',
        description: 'Hard limits enable and strict mode (bitmask)',
        datatype: 'integer',
        options: [{value: '0', label: 'Disabled'}, {value: '1', label: 'Enabled'}, {
            value: '3',
            label: 'Enabled + Strict Mode'
        }]
    },
    22: {
        name: 'Homing cycle',
        description: 'Homing cycle enable and features (bitmask)',
        datatype: 'integer',
        min: 0,
        max: 255
    },
    23: {name: 'Homing dir invert', description: 'Homing direction invert mask', datatype: 'axis_mask'},
    24: {name: 'Homing feed', description: 'Homing feed rate in mm/min', datatype: 'float', min: 1.0, max: 50000.0},
    25: {name: 'Homing seek', description: 'Homing seek rate in mm/min', datatype: 'float', min: 1.0, max: 50000.0},
    26: {name: 'Homing debounce', description: 'Homing debounce delay in ms', datatype: 'integer', min: 0, max: 65535},
    27: {
        name: 'Homing pull-off',
        description: 'Homing pull-off distance in mm',
        datatype: 'float',
        min: 0.0,
        max: 100.0
    },
    28: {name: 'G73 retract', description: 'G73 retract distance in mm', datatype: 'float', min: 0.0, max: 100.0},
    29: {
        name: 'Step pulse delay',
        description: 'Stepper pulse delay in microseconds (0-10)',
        datatype: 'integer',
        min: 0,
        max: 10
    },
    40: {
        name: 'Soft limits jog',
        description: 'Enable soft limits for jogging (0=disable, 1=enable)',
        datatype: 'boolean'
    },
    43: {
        name: 'Homing locate cycles',
        description: 'Number of homing locate cycles (0-255)',
        datatype: 'integer',
        min: 0,
        max: 255
    },
    44: {
        name: 'Homing priority 1',
        description: 'Axis priority for homing (first)',
        datatype: 'integer',
        min: 0,
        max: 5
    },
    45: {
        name: 'Homing priority 2',
        description: 'Axis priority for homing (second)',
        datatype: 'integer',
        min: 0,
        max: 5
    },
    46: {
        name: 'Homing priority 3',
        description: 'Axis priority for homing (third)',
        datatype: 'integer',
        min: 0,
        max: 5
    },
    47: {
        name: 'Homing priority 4',
        description: 'Axis priority for homing (fourth)',
        datatype: 'integer',
        min: 0,
        max: 5
    },
    48: {
        name: 'Homing priority 5',
        description: 'Axis priority for homing (fifth)',
        datatype: 'integer',
        min: 0,
        max: 5
    },
    49: {
        name: 'Homing priority 6',
        description: 'Axis priority for homing (sixth)',
        datatype: 'integer',
        min: 0,
        max: 5
    },

    // Spindle Settings
    30: {
        name: 'Max spindle speed',
        description: 'Maximum spindle speed in RPM',
        datatype: 'integer',
        min: 1,
        max: 100000
    },
    31: {
        name: 'Min spindle speed',
        description: 'Minimum spindle speed in RPM',
        datatype: 'integer',
        min: 0,
        max: 100000
    },
    32: {
        name: 'Machine mode',
        description: 'Machine mode (0=normal, 1=laser, 2=lathe)',
        datatype: 'integer',
        options: [{value: '0', label: 'Normal'}, {value: '1', label: 'Laser'}, {value: '2', label: 'Lathe'}]
    },
    33: {
        name: 'Spindle PWM freq',
        description: 'Spindle PWM frequency in Hz',
        datatype: 'float',
        min: 5.0,
        max: 50000.0
    },
    34: {
        name: 'Spindle PWM off',
        description: 'Spindle off PWM duty cycle in percent',
        datatype: 'float',
        min: 0.0,
        max: 100.0
    },
    35: {
        name: 'Spindle PWM min',
        description: 'Spindle minimum PWM duty cycle in percent',
        datatype: 'float',
        min: 0.0,
        max: 100.0
    },
    36: {
        name: 'Spindle PWM max',
        description: 'Spindle maximum PWM duty cycle in percent',
        datatype: 'float',
        min: 0.0,
        max: 100.0
    },
    37: {
        name: 'Stepper deenergize',
        description: 'Steppers to deenergize when motion completes',
        datatype: 'axis_mask'
    },
    38: {
        name: 'Spindle encoder PPR',
        description: 'Spindle encoder pulses per revolution',
        datatype: 'integer',
        min: 1,
        max: 10000
    },
    340: {
        name: 'Spindle at speed tolerance',
        description: 'Spindle at speed tolerance in percent',
        datatype: 'float',
        min: 0.0,
        max: 100.0
    },

    // PID Settings
    80: {name: 'Spindle PID P', description: 'Spindle PID proportional gain', datatype: 'float', min: 0.0, max: 1000.0},
    81: {name: 'Spindle PID I', description: 'Spindle PID integral gain', datatype: 'float', min: 0.0, max: 1000.0},
    82: {name: 'Spindle PID D', description: 'Spindle PID derivative gain', datatype: 'float', min: 0.0, max: 1000.0},
    84: {
        name: 'Spindle PID max error',
        description: 'Spindle PID max output error',
        datatype: 'float',
        min: 0.0,
        max: 1000.0
    },
    85: {
        name: 'Spindle PID max integral',
        description: 'Spindle PID max integral error',
        datatype: 'float',
        min: 0.0,
        max: 1000.0
    },
    90: {
        name: 'Sync PID P',
        description: 'Spindle synced motion PID proportional gain',
        datatype: 'float',
        min: 0.0,
        max: 1000.0
    },
    91: {
        name: 'Sync PID I',
        description: 'Spindle synced motion PID integral gain',
        datatype: 'float',
        min: 0.0,
        max: 1000.0
    },
    92: {
        name: 'Sync PID D',
        description: 'Spindle synced motion PID derivative gain',
        datatype: 'float',
        min: 0.0,
        max: 1000.0
    },

    // Jogging Settings
    50: {
        name: 'Jog step speed',
        description: 'Jogging step speed in mm/min',
        datatype: 'float',
        min: 1.0,
        max: 50000.0
    },
    51: {
        name: 'Jog slow speed',
        description: 'Jogging slow speed in mm/min',
        datatype: 'float',
        min: 1.0,
        max: 50000.0
    },
    52: {
        name: 'Jog fast speed',
        description: 'Jogging fast speed in mm/min',
        datatype: 'float',
        min: 1.0,
        max: 50000.0
    },
    53: {
        name: 'Jog step distance',
        description: 'Jogging step distance in mm',
        datatype: 'float',
        min: 0.001,
        max: 1000.0
    },
    54: {
        name: 'Jog slow distance',
        description: 'Jogging slow distance in mm',
        datatype: 'float',
        min: 0.001,
        max: 1000.0
    },
    55: {
        name: 'Jog fast distance',
        description: 'Jogging fast distance in mm',
        datatype: 'float',
        min: 0.001,
        max: 1000.0
    },

    // Network Settings
    70: {name: 'Network services', description: 'Network services mask', datatype: 'network_mask'},
    71: {name: 'Bluetooth name', description: 'Bluetooth device name (max 32 chars)', datatype: 'string'},
    72: {name: 'Bluetooth service', description: 'Bluetooth service name (max 32 chars)', datatype: 'string'},
    73: {
        name: 'WiFi mode',
        description: 'WiFi mode (0=NULL, 1=STA, 2=AP, 3=APSTA)',
        datatype: 'integer',
        options: [{value: '0', label: 'NULL'}, {value: '1', label: 'Station'}, {
            value: '2',
            label: 'Access Point'
        }, {value: '3', label: 'Station + AP'}]
    },
    74: {name: 'WiFi STA SSID', description: 'WiFi Station SSID (max 64 chars)', datatype: 'string'},
    75: {name: 'WiFi STA password', description: 'WiFi Station password (max 32 chars)', datatype: 'string'},
    76: {name: 'WiFi AP SSID', description: 'WiFi Access Point SSID (max 64 chars)', datatype: 'string'},
    77: {name: 'WiFi AP password', description: 'WiFi Access Point password (max 32 chars)', datatype: 'string'},
    78: {name: 'WiFi AP country', description: 'WiFi AP Country (max 3 chars)', datatype: 'string'},
    79: {name: 'WiFi AP channel', description: 'WiFi AP Channel (0-11)', datatype: 'integer', min: 0, max: 11},

    // Tool Change Settings
    341: {
        name: 'Tool change mode',
        description: 'Manual tool change mode (0-4)',
        datatype: 'integer',
        options: [{value: '0', label: 'Normal'}, {value: '1', label: 'Manual touch off'}, {
            value: '2',
            label: 'Manual @ G59.3'
        }, {value: '3', label: 'Auto @ G59.3'}, {value: '4', label: 'Ignore M6'}]
    },
    342: {name: 'Probing distance', description: 'Probing distance in mm', datatype: 'float', min: 0.1, max: 1000.0},
    343: {
        name: 'Probing slow feed',
        description: 'Probing slow feed rate in mm/min',
        datatype: 'float',
        min: 1.0,
        max: 1000.0
    },
    344: {
        name: 'Probing seek feed',
        description: 'Probing seek feed rate in mm/min',
        datatype: 'float',
        min: 1.0,
        max: 5000.0
    },

    // Other Settings
    39: {name: 'Realtime commands', description: 'Enable printable realtime command characters', datatype: 'boolean'},
    60: {name: 'Restore overrides', description: 'Restore default overrides when program ends', datatype: 'boolean'},
    61: {name: 'Ignore safety door', description: 'Ignore safety door signal when idle', datatype: 'boolean'},
    62: {name: 'Sleep enable', description: 'Enable sleep function', datatype: 'boolean'},
    63: {name: 'Disable laser hold', description: 'Disable laser during hold', datatype: 'boolean'},
    64: {name: 'Force alarm', description: 'Force grbl to enter alarm mode on startup', datatype: 'boolean'},
    65: {name: 'Probe feed override', description: 'Allow feed rate override during probing', datatype: 'boolean'},

    // Axis Settings
    100: {name: 'X steps/mm', description: 'X axis steps per mm', datatype: 'float', min: 0.001, max: 50000.0},
    101: {name: 'Y steps/mm', description: 'Y axis steps per mm', datatype: 'float', min: 0.001, max: 50000.0},
    102: {name: 'Z steps/mm', description: 'Z axis steps per mm', datatype: 'float', min: 0.001, max: 50000.0},
    103: {name: 'A steps/mm', description: 'A axis steps per mm', datatype: 'float', min: 0.001, max: 50000.0},
    104: {name: 'B steps/mm', description: 'B axis steps per mm', datatype: 'float', min: 0.001, max: 50000.0},
    105: {name: 'C steps/mm', description: 'C axis steps per mm', datatype: 'float', min: 0.001, max: 50000.0},
    110: {name: 'X max rate', description: 'X axis maximum rate in mm/min', datatype: 'float', min: 1.0, max: 200000.0},
    111: {name: 'Y max rate', description: 'Y axis maximum rate in mm/min', datatype: 'float', min: 1.0, max: 200000.0},
    112: {name: 'Z max rate', description: 'Z axis maximum rate in mm/min', datatype: 'float', min: 1.0, max: 200000.0},
    113: {name: 'A max rate', description: 'A axis maximum rate in mm/min', datatype: 'float', min: 1.0, max: 200000.0},
    114: {name: 'B max rate', description: 'B axis maximum rate in mm/min', datatype: 'float', min: 1.0, max: 200000.0},
    115: {name: 'C max rate', description: 'C axis maximum rate in mm/min', datatype: 'float', min: 1.0, max: 200000.0},
    120: {
        name: 'X acceleration',
        description: 'X axis acceleration in mm/sec^2',
        datatype: 'float',
        min: 1.0,
        max: 50000.0
    },
    121: {
        name: 'Y acceleration',
        description: 'Y axis acceleration in mm/sec^2',
        datatype: 'float',
        min: 1.0,
        max: 50000.0
    },
    122: {
        name: 'Z acceleration',
        description: 'Z axis acceleration in mm/sec^2',
        datatype: 'float',
        min: 1.0,
        max: 50000.0
    },
    123: {
        name: 'A acceleration',
        description: 'A axis acceleration in mm/sec^2',
        datatype: 'float',
        min: 1.0,
        max: 50000.0
    },
    124: {
        name: 'B acceleration',
        description: 'B axis acceleration in mm/sec^2',
        datatype: 'float',
        min: 1.0,
        max: 50000.0
    },
    125: {
        name: 'C acceleration',
        description: 'C axis acceleration in mm/sec^2',
        datatype: 'float',
        min: 1.0,
        max: 50000.0
    },
    130: {name: 'X max travel', description: 'X axis maximum travel in mm', datatype: 'float', min: 0.0, max: 10000.0},
    131: {name: 'Y max travel', description: 'Y axis maximum travel in mm', datatype: 'float', min: 0.0, max: 10000.0},
    132: {name: 'Z max travel', description: 'Z axis maximum travel in mm', datatype: 'float', min: 0.0, max: 10000.0},
    133: {name: 'A max travel', description: 'A axis maximum travel in mm', datatype: 'float', min: 0.0, max: 10000.0},
    134: {name: 'B max travel', description: 'B axis maximum travel in mm', datatype: 'float', min: 0.0, max: 10000.0},
    135: {name: 'C max travel', description: 'C axis maximum travel in mm', datatype: 'float', min: 0.0, max: 10000.0},
};

function GrblConfigPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [parameters, setParameters] = useState<Record<number, string>>({});
    const [editedValues, setEditedValues] = useState<Record<number, string>>({});
    const [savingParams, setSavingParams] = useState<Record<number, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [calibrationAxis, setCalibrationAxis] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const {sendCommand, isConnected} = useGRBL();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
        // Initialize all groups as expanded
        const groups = [
            'Basic Settings',
            'Motion Settings',
            'Spindle Settings',
            'PID Settings',
            'Jogging Settings',
            'Network Settings',
            'Tool Change Settings',
            'Other Settings',
            'Axis Settings'
        ];
        return groups.reduce((acc, group) => {
            acc[group] = true;
            return acc;
        }, {} as Record<string, boolean>);
    });

    useEffect(() => {
        const loadParameters = async () => {
            if (!isConnected) return;
            setIsLoading(true);
            try {
                await sendCommand('$$');
            } catch (error) {
                console.error('Failed to load parameters:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadParameters();
    }, [isConnected, sendCommand]);

    useGRBLListener((line) => {
        if (line.startsWith('$')) {
            const [id, value] = line.substring(1).split('=');
            if (id && value) {
                const paramId = parseInt(id);

                // Update the parameter value from the machine
                setParameters(prev => ({
                    ...prev,
                    [paramId]: value
                }));

                // Only clear saving state, preserve all edited values
                setSavingParams(prev => {
                    const newSavingParams = {...prev};
                    delete newSavingParams[paramId];
                    return newSavingParams;
                });

                setIsLoading(false);
            }
        }
    }, []);

    const handleParameterChange = async (id: number, newValue: string) => {
        try {
            setError(null);
            setSavingParams(prev => ({
                ...prev,
                [id]: true
            }));
            await sendCommand(`$${id}=${newValue}`);
            // Only request the specific parameter that was saved, not all parameters
            setTimeout(() => {
                sendCommand(`$${id}`);
            }, 500);
        } catch (error) {
            console.error('Failed to update parameter:', error);
            setError(`Failed to update parameter ${id}. Please try again.`);
            setSavingParams(prev => {
                const newValues = {...prev};
                delete newValues[id];
                return newValues;
            });
        }
    };

    const handleInputChange = (id: number, value: string) => {
        setEditedValues(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleResetValue = (id: number) => {
        setEditedValues(prev => {
            const newValues = {...prev};
            delete newValues[id];
            return newValues;
        });
    };

    // Component for rendering different input types based on datatype
    const renderParameterInput = (param: GrblParameter) => {
        const inputClasses = `w-full bg-gray-700/50 text-white px-3 py-2 rounded-lg border ${
            savingParams[param.id] ? 'border-yellow-500/50' : 'border-gray-600/50'
        } focus:border-blue-500/50 focus:outline-none transition-all duration-200`;

        const isDisabled = savingParams[param.id];

        switch (param.datatype) {
            case 'boolean':
                return (
                    <select
                        value={param.value}
                        onChange={(e) => handleInputChange(param.id, e.target.value)}
                        className={inputClasses}
                        disabled={isDisabled}
                        title={param.description}
                    >
                        <option value="0">False (0)</option>
                        <option value="1">True (1)</option>
                    </select>
                );

            case 'integer':
                if (param.options) {
                    return (
                        <select
                            value={param.value}
                            onChange={(e) => handleInputChange(param.id, e.target.value)}
                            className={inputClasses}
                            disabled={isDisabled}
                            title={param.description}
                        >
                            {param.options.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label} ({option.value})
                                </option>
                            ))}
                        </select>
                    );
                }
                return (
                    <input
                        type="number"
                        value={param.value}
                        onChange={(e) => handleInputChange(param.id, e.target.value)}
                        className={inputClasses}
                        disabled={isDisabled}
                        title={param.description}
                        min={param.min}
                        max={param.max}
                        step="1"
                    />
                );

            case 'float':
                return (
                    <input
                        type="number"
                        value={param.value}
                        onChange={(e) => handleInputChange(param.id, e.target.value)}
                        className={inputClasses}
                        disabled={isDisabled}
                        title={param.description}
                        min={param.min}
                        max={param.max}
                        step="any"
                    />
                );

            case 'string':
                return (
                    <input
                        type="text"
                        value={param.value}
                        onChange={(e) => handleInputChange(param.id, e.target.value)}
                        className={inputClasses}
                        disabled={isDisabled}
                        title={param.description}
                    />
                );

            case 'axis_mask':
                return (
                    <div className="space-y-2">
                        <input
                            type="number"
                            value={param.value}
                            onChange={(e) => handleInputChange(param.id, e.target.value)}
                            className={inputClasses}
                            disabled={isDisabled}
                            title={param.description}
                            min="0"
                            max="63"
                        />
                        <div className="text-xs text-gray-400 grid grid-cols-3 gap-1">
                            {['X', 'Y', 'Z', 'A', 'B', 'C'].map((axis, idx) => {
                                const mask = parseInt(param.value || '0');
                                const isSet = (mask & (1 << idx)) !== 0;
                                return (
                                    <label key={axis} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={isSet}
                                            onChange={(e) => {
                                                const currentMask = parseInt(param.value || '0');
                                                const newMask = e.target.checked
                                                    ? currentMask | (1 << idx)
                                                    : currentMask & ~(1 << idx);
                                                handleInputChange(param.id, newMask.toString());
                                            }}
                                            className="mr-1 text-blue-500"
                                            disabled={isDisabled}
                                        />
                                        {axis}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'coolant_mask':
                return (
                    <div className="space-y-2">
                        <input
                            type="number"
                            value={param.value}
                            onChange={(e) => handleInputChange(param.id, e.target.value)}
                            className={inputClasses}
                            disabled={isDisabled}
                            title={param.description}
                            min="0"
                            max="3"
                        />
                        <div className="text-xs text-gray-400 grid grid-cols-2 gap-1">
                            {['Flood', 'Mist'].map((coolant, idx) => {
                                const mask = parseInt(param.value || '0');
                                const isSet = (mask & (1 << idx)) !== 0;
                                return (
                                    <label key={coolant} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={isSet}
                                            onChange={(e) => {
                                                const currentMask = parseInt(param.value || '0');
                                                const newMask = e.target.checked
                                                    ? currentMask | (1 << idx)
                                                    : currentMask & ~(1 << idx);
                                                handleInputChange(param.id, newMask.toString());
                                            }}
                                            className="mr-1 text-blue-500"
                                            disabled={isDisabled}
                                        />
                                        {coolant}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'spindle_mask':
                return (
                    <div className="space-y-2">
                        <input
                            type="number"
                            value={param.value}
                            onChange={(e) => handleInputChange(param.id, e.target.value)}
                            className={inputClasses}
                            disabled={isDisabled}
                            title={param.description}
                            min="0"
                            max="7"
                        />
                        <div className="text-xs text-gray-400 grid grid-cols-3 gap-1">
                            {['Enable', 'CCW', 'PWM'].map((spindle, idx) => {
                                const mask = parseInt(param.value || '0');
                                const isSet = (mask & (1 << idx)) !== 0;
                                return (
                                    <label key={spindle} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={isSet}
                                            onChange={(e) => {
                                                const currentMask = parseInt(param.value || '0');
                                                const newMask = e.target.checked
                                                    ? currentMask | (1 << idx)
                                                    : currentMask & ~(1 << idx);
                                                handleInputChange(param.id, newMask.toString());
                                            }}
                                            className="mr-1 text-blue-500"
                                            disabled={isDisabled}
                                        />
                                        {spindle}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'control_mask':
                return (
                    <div className="space-y-2">
                        <input
                            type="number"
                            value={param.value}
                            onChange={(e) => handleInputChange(param.id, e.target.value)}
                            className={inputClasses}
                            disabled={isDisabled}
                            title={param.description}
                            min="0"
                            max="255"
                        />
                        <div className="text-xs text-gray-400 grid grid-cols-2 gap-1">
                            {['Reset', 'Feed Hold', 'Cycle Start', 'Safety Door', 'Block Delete', 'Stop Disable', 'E-Stop', 'Probe'].map((control, idx) => {
                                const mask = parseInt(param.value || '0');
                                const isSet = (mask & (1 << idx)) !== 0;
                                return (
                                    <label key={control} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={isSet}
                                            onChange={(e) => {
                                                const currentMask = parseInt(param.value || '0');
                                                const newMask = e.target.checked
                                                    ? currentMask | (1 << idx)
                                                    : currentMask & ~(1 << idx);
                                                handleInputChange(param.id, newMask.toString());
                                            }}
                                            className="mr-1 text-blue-500"
                                            disabled={isDisabled}
                                        />
                                        {control}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'report_mask':
                return (
                    <div className="space-y-2">
                        <input
                            type="number"
                            value={param.value}
                            onChange={(e) => handleInputChange(param.id, e.target.value)}
                            className={inputClasses}
                            disabled={isDisabled}
                            title={param.description}
                            min="0"
                            max="4095"
                        />
                        <div className="text-xs text-gray-400 grid grid-cols-2 gap-1">
                            {['Machine Pos', 'Buffer State', 'Line Numbers', 'Feed/Speed', 'Pin State', 'Work Coords', 'Overrides', 'Probe Coords', 'Sync WCO', 'Parser State', 'Alarm Sub', 'Run Sub'].map((report, idx) => {
                                const mask = parseInt(param.value || '0');
                                const isSet = (mask & (1 << idx)) !== 0;
                                return (
                                    <label key={report} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={isSet}
                                            onChange={(e) => {
                                                const currentMask = parseInt(param.value || '0');
                                                const newMask = e.target.checked
                                                    ? currentMask | (1 << idx)
                                                    : currentMask & ~(1 << idx);
                                                handleInputChange(param.id, newMask.toString());
                                            }}
                                            className="mr-1 text-blue-500"
                                            disabled={isDisabled}
                                        />
                                        {report}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'network_mask':
                return (
                    <input
                        type="number"
                        value={param.value}
                        onChange={(e) => handleInputChange(param.id, e.target.value)}
                        className={inputClasses}
                        disabled={isDisabled}
                        title={param.description}
                        min="0"
                        max="255"
                    />
                );

            default:
                return (
                    <input
                        type="text"
                        value={param.value}
                        onChange={(e) => handleInputChange(param.id, e.target.value)}
                        className={inputClasses}
                        disabled={isDisabled}
                        title={param.description}
                    />
                );
        }
    };

    const parameterList: GrblParameter[] = Object.entries(parameters)
        .map(([id, value]) => {
            const paramId = parseInt(id);
            const paramDesc = PARAMETER_DESCRIPTIONS[paramId];

            // Always prioritize edited values over machine values
            const currentValue = editedValues.hasOwnProperty(paramId)
                ? editedValues[paramId]
                : String(value);
            
            return {
                id: paramId,
                name: paramDesc?.name || `Parameter ${id}`,
                value: currentValue,
                description: paramDesc?.description || 'No description available',
                hasDescription: !!paramDesc?.description,
                group: getParameterGroup(paramId),
                datatype: paramDesc?.datatype || 'string',
                min: paramDesc?.min,
                max: paramDesc?.max,
                options: paramDesc?.options
            };
        })
        .sort((a, b) => {
            // First sort by description presence
            if (a.hasDescription !== b.hasDescription) {
                return b.hasDescription ? 1 : -1;
            }
            // Then sort by group
            if (a.group !== b.group) {
                return a.group.localeCompare(b.group);
            }
            // Finally sort by ID within group
            return a.id - b.id;
        });

    // Helper function to determine parameter group
    function getParameterGroup(id: number): string {
        if (id >= 0 && id <= 19) return 'Basic Settings';
        if (id >= 20 && id <= 49) return 'Motion Settings';
        if ((id >= 30 && id <= 38) || id === 340) return 'Spindle Settings';
        if ((id >= 80 && id <= 85) || (id >= 90 && id <= 92)) return 'PID Settings';
        if (id >= 50 && id <= 55) return 'Jogging Settings';
        if (id >= 70 && id <= 79) return 'Network Settings';
        if (id >= 341 && id <= 344) return 'Tool Change Settings';
        if (id >= 100 && id <= 132) return 'Axis Settings';
        if (id === 39 || (id >= 60 && id <= 65)) return 'Other Settings';

        return 'Other Settings';
    }

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
    };

    // Group parameters by their category
    const groupedParameters = parameterList.reduce((acc, param) => {
        const group = param.group;
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(param);
        return acc;
    }, {} as Record<string, GrblParameter[]>);

    // Sort groups to ensure Other Settings is last
    const sortedGroups = Object.entries(groupedParameters).sort(([groupA], [groupB]) => {
        if (groupA === 'Other Settings') return 1;
        if (groupB === 'Other Settings') return -1;
        return groupA.localeCompare(groupB);
    });

    const filteredParameterList = parameterList.filter(param => {
        const searchLower = searchQuery.toLowerCase();
        return (
            param.name.toLowerCase().includes(searchLower) ||
            param.description.toLowerCase().includes(searchLower) ||
            param.id.toString().includes(searchLower)
        );
    });

    const scrollToGroup = (group: string) => {
        const element = document.getElementById(`group-${group}`);
        if (element) {
            element.scrollIntoView({behavior: 'smooth', block: "center", inline: "start"});
        }
    };

    const getAxisFromParamId = (paramId: number): string | null => {
        switch (paramId) {
            case 100:
                return 'X';
            case 101:
                return 'Y';
            case 102:
                return 'Z';
            case 103:
                return 'A';
            case 104:
                return 'B';
            case 105:
                return 'C';
            default:
                return null;
        }
    };

    const handleExportConfig = () => {
        try {
            const configData = {
                parameters: parameters,
                descriptions: PARAMETER_DESCRIPTIONS,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            const blob = new Blob([JSON.stringify(configData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `grbl-config-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export config:', error);
            setError('Failed to export configuration. Please try again.');
        }
    };

    const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const configData = JSON.parse(content);

                if (!configData.parameters || typeof configData.parameters !== 'object') {
                    throw new Error('Invalid configuration file format');
                }

                // Validate that all parameters are valid numbers
                const validParameters: Record<number, string> = {};
                for (const [key, value] of Object.entries(configData.parameters)) {
                    const paramId = parseInt(key);
                    if (!isNaN(paramId) && typeof value === 'string') {
                        validParameters[paramId] = value;
                    }
                }
                setIsLoading(true)
                // Apply the imported parameters
                for (const [paramId, value] of Object.entries(validParameters)) {
                    try {
                        setSavingParams(prev => ({
                            ...prev,
                            [paramId]: true
                        }));
                        await sendCommand(`$${paramId}=${value}`);
                    } catch (error) {
                        console.error(`Failed to update parameter ${paramId}:`, error);
                    }
                }

                // Refresh parameters after import
                setTimeout(() => {
                    sendCommand('$$');

                }, 1000);
                setTimeout(() => {
                    setIsLoading(false)
                }, 2000)

                setError(null);
            } catch (error) {
                console.error('Failed to import config:', error);
                setError('Failed to import configuration. Please check the file format.');
            }
        };
        reader.readAsText(file);

        // Reset the input
        event.target.value = '';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex">
            {/* Mobile Sidebar Toggle */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 cursor-pointer"
            >
                {isSidebarOpen ? (
                    <XMarkIcon className="w-6 h-6 text-white"/>
                ) : (
                    <Bars3Icon className="w-6 h-6 text-white"/>
                )}
            </button>

            {/* Sidebar */}
            <div
                className={`w-64 bg-gray-800/50 backdrop-blur-lg border-r border-gray-700/50 fixed h-full transform transition-transform duration-300 ease-in-out ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 z-40`}>
                <div className="p-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-8">
                        Borna CNC
                    </h2>
                    <div className="space-y-4">
                        <Link
                            to={ROUTES.HOME}
                            className="flex items-center px-4 py-3 rounded-lg transition-all duration-200 text-gray-300 hover:bg-gray-700/50 hover:text-white cursor-pointer"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <HomeIcon className="w-5 h-5 mr-3"/>
                            Home
                        </Link>

                        <div className="pt-4 border-t border-gray-700/50">
                            <h3 className="px-4 text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
                                Parameter Groups
                            </h3>
                            <nav className="space-y-1">
                                {sortedGroups.filter(([_, params]) => params.length > 0)
                                    .map(([group]) => (
                                        <button
                                            key={group}
                                            onClick={() => {
                                                scrollToGroup(group);
                                                setIsSidebarOpen(false);
                                            }}
                                            className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white rounded-lg transition-all duration-200 cursor-pointer"
                                        >
                                            {group}
                                        </button>
                                    ))}
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 lg:ml-64">
                {/* Fixed Header */}
                <header
                    className="fixed top-0 left-0 right-0 lg:left-64 bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/50 z-10">
                    <div className="container mx-auto px-4 lg:px-6 py-4">
                        <div className="flex items-center space-x-15">
                            <div className="flex items-center">
                                <Link to={ROUTES.HOME}
                                      className="mr-4 bg-gray-700/50 hover:bg-gray-600/50 text-white px-3 py-2 rounded-lg flex items-center transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                                    </svg>
                                    <span className="hidden sm:inline">Back</span>
                                </Link>
                                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                                    Machine Config
                                </h1>
                            </div>

                            {/* Export/Import/Tour Buttons */}
                            <div className="flex items-center space-x-2">
                                <LanguageSwitcher/>

                                <StartTourButton/>
                                
                                <button
                                    onClick={handleExportConfig}
                                    disabled={!isConnected || isLoading || Object.keys(parameters).length === 0}
                                    className="bg-green-600/50 hover:bg-green-500/50 disabled:bg-gray-600/30 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg flex items-center transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10 disabled:hover:shadow-none cursor-pointer"
                                    title="Export configuration"
                                >
                                    <ArrowDownTrayIcon className="w-5 h-5 mr-2"/>
                                    <span className="hidden sm:inline">Export</span>
                                </button>

                                <label
                                    className="bg-blue-600/50 hover:bg-blue-500/50 disabled:bg-gray-600/30 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg flex items-center transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 disabled:hover:shadow-none cursor-pointer">
                                    <ArrowUpTrayIcon className="w-5 h-5 mr-2"/>
                                    <span className="hidden sm:inline">Import</span>
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImportConfig}
                                        className="hidden"
                                        disabled={!isConnected}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="container mx-auto px-4 lg:px-6 pt-24 pb-6">
                    {!isConnected ? (
                        <div
                            className="text-center text-red-400 p-4 sm:p-6 bg-red-900/20 rounded-xl backdrop-blur-sm border border-red-500/20 shadow-lg shadow-red-500/10">
                            <ExclamationTriangleIcon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 text-red-400"/>
                            <p className="text-base sm:text-lg">Please connect to the machine first</p>
                        </div>
                    ) : isLoading ? (
                        <div className="text-center p-6 sm:p-8">
                            <div
                                className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                            <p className="text-base sm:text-lg text-gray-300">Loading machine parameters...</p>
                        </div>
                    ) : (
                        <div className="space-y-4 sm:space-y-6">
                            {/* Search Bar */}
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Search parameters..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-gray-800/50 text-white px-4 py-3 pl-12 rounded-xl border border-gray-700/50 focus:border-blue-500/50 focus:outline-none transition-all duration-200 backdrop-blur-sm shadow-lg shadow-gray-900/20 group-hover:shadow-blue-500/10"
                                />
                                <MagnifyingGlassIcon
                                    className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 group-hover:text-blue-400 transition-colors duration-200"/>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div
                                    className="bg-red-900/20 text-red-400 p-4 rounded-xl backdrop-blur-sm border border-red-500/20 shadow-lg shadow-red-500/10 flex items-center">
                                    <ExclamationTriangleIcon className="w-6 h-6 mr-3 flex-shrink-0"/>
                                    <p>{error}</p>
                                </div>
                            )}

                            {/* Parameters Table */}
                            {!isLoading && (<div className="relative">
                                <div
                                    className="bg-gray-800/50 rounded-xl shadow-lg shadow-gray-900/20 backdrop-blur-sm border border-gray-700/50">
                                    {/* Mobile View */}
                                    <div className="block sm:hidden">
                                        {sortedGroups.map(([group, params]) => {
                                            const filteredParams = params.filter(param =>
                                                filteredParameterList.some(p => p.id === param.id)
                                            );
                                            if (filteredParams.length === 0) return null;

                                            return (
                                                <div key={group}
                                                     className="border-b border-gray-700/50 last:border-b-0">
                                                    <button
                                                        onClick={() => toggleGroup(group)}
                                                        className="w-full px-4 py-3 flex items-center justify-between bg-gray-700/30 hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer"
                                                    >
                                                        <span className="text-blue-400 font-medium">{group}</span>
                                                        <svg
                                                            className={`w-5 h-5 transform transition-transform duration-200 ${
                                                                expandedGroups[group] ? 'rotate-180' : ''
                                                            }`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 9l-7 7-7-7"
                                                            />
                                                        </svg>
                                                    </button>
                                                    {expandedGroups[group] && (
                                                        <div className="p-4 space-y-4">
                                                            {filteredParams.map((param) => (
                                                                <div key={param.id}
                                                                     className="bg-gray-700/20 rounded-lg p-4">
                                                                    <div
                                                                        className="flex justify-between items-start mb-2">
                                                                        <div>
                                                                            <div className="flex items-center mb-1">
                                                                                <div
                                                                                    className="font-medium text-white">{param.name}</div>
                                                                                <span
                                                                                    className={`ml-2 px-2 py-1 text-xs rounded-md ${
                                                                                        param.datatype === 'boolean' ? 'bg-green-600/20 text-green-400' :
                                                                                            param.datatype === 'integer' ? 'bg-blue-600/20 text-blue-400' :
                                                                                                param.datatype === 'float' ? 'bg-purple-600/20 text-purple-400' :
                                                                                                    param.datatype === 'string' ? 'bg-yellow-600/20 text-yellow-400' :
                                                                                                        'bg-orange-600/20 text-orange-400'
                                                                                    }`}>
                                                                                    {param.datatype.replace('_', ' ')}
                                                                                </span>
                                                                            </div>
                                                                            <div
                                                                                className="text-sm text-gray-400">ID: {param.id}</div>
                                                                        </div>
                                                                        {param.id >= 100 && param.id <= 105 && (
                                                                            <button
                                                                                onClick={() => setCalibrationAxis(getAxisFromParamId(param.id))}
                                                                                className="p-2 rounded-lg bg-blue-600/50 hover:bg-blue-500/50 text-white transition-all duration-200 cursor-pointer"
                                                                                title="Calibrate steps/mm"
                                                                            >
                                                                                <Cog6ToothIcon className="w-5 h-5"/>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-sm text-gray-300 mb-3">
                                                                        {param.description}
                                                                        {(param.datatype === 'integer' || param.datatype === 'float') && (param.min !== undefined || param.max !== undefined) && (
                                                                            <div className="text-xs text-gray-400 mt-1">
                                                                                Range: {param.min !== undefined ? param.min : '∞'} to {param.max !== undefined ? param.max : '∞'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="relative">
                                                                        {renderParameterInput(param)}
                                                                        {savingParams[param.id] && (
                                                                            <div
                                                                                className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                                                <div
                                                                                    className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent"></div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="mt-3 flex space-x-2">
                                                                        <button
                                                                            onClick={() => handleParameterChange(param.id, param.value)}
                                                                            className={`flex-1 px-4 py-2 rounded-lg transition-all duration-200 ${
                                                                                editedValues[param.id] && !savingParams[param.id]
                                                                                    ? 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20 cursor-pointer'
                                                                                    : 'bg-gray-600/50 cursor-not-allowed'
                                                                            } text-white`}
                                                                            disabled={!editedValues[param.id] || savingParams[param.id]}
                                                                        >
                                                                            {savingParams[param.id] ? 'Saving...' : 'Save'}
                                                                        </button>
                                                                        {editedValues[param.id] && (
                                                                            <button
                                                                                onClick={() => handleResetValue(param.id)}
                                                                                className="px-3 py-2 rounded-lg bg-gray-600/50 hover:bg-gray-500/50 text-white transition-all duration-200"
                                                                                title="Reset to saved value"
                                                                            >
                                                                                ↺
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Desktop View */}
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="w-full divide-y divide-gray-700/50">
                                            <thead className="bg-gray-700/30">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">ID</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Parameter</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Value</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Description</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700/50">
                                            {sortedGroups.map(([group, params]) => {
                                                const filteredParams = params.filter(param =>
                                                    filteredParameterList.some(p => p.id === param.id)
                                                );
                                                if (filteredParams.length === 0) return null;

                                                return (
                                                    <React.Fragment key={group}>
                                                        <tr id={`group-${group}`} className="bg-gray-700/30">
                                                            <td colSpan={5} className="px-6 py-4 cursor-pointer"
                                                                onClick={() => toggleGroup(group)}>
                                                                <button
                                                                    className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-200 hover:text-white focus:outline-none transition-colors duration-200 cursor-pointer"
                                                                >
                                                                    <span className="text-blue-400">{group}</span>
                                                                    <svg
                                                                        className={`w-5 h-5 transform transition-transform duration-200 ${
                                                                            expandedGroups[group] ? 'rotate-180' : ''
                                                                        }`}
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M19 9l-7 7-7-7"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                        {expandedGroups[group] && filteredParams.map((param) => (
                                                            <tr key={param.id}
                                                                className={`hover:bg-gray-700/30 transition-colors duration-200 ${!param.hasDescription ? 'opacity-50' : ''}`}>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{param.id}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                                    <div className="flex items-center">
                                                                        <span
                                                                            className="font-medium">{param.name}</span>
                                                                        <span
                                                                            className={`ml-2 px-2 py-1 text-xs rounded-md ${
                                                                                param.datatype === 'boolean' ? 'bg-green-600/20 text-green-400' :
                                                                                    param.datatype === 'integer' ? 'bg-blue-600/20 text-blue-400' :
                                                                                        param.datatype === 'float' ? 'bg-purple-600/20 text-purple-400' :
                                                                                            param.datatype === 'string' ? 'bg-yellow-600/20 text-yellow-400' :
                                                                                                'bg-orange-600/20 text-orange-400'
                                                                            }`}>
                                                                            {param.datatype.replace('_', ' ')}
                                                                        </span>
                                                                        {!param.hasDescription && (
                                                                            <span
                                                                                className="ml-2 text-xs text-gray-400">(Undocumented)</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="relative">
                                                                        {renderParameterInput(param)}
                                                                        {savingParams[param.id] && (
                                                                            <div
                                                                                className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                                                <div
                                                                                    className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent"></div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-300">
                                                                    {param.description}
                                                                    {(param.datatype === 'integer' || param.datatype === 'float') && (param.min !== undefined || param.max !== undefined) && (
                                                                        <div className="text-xs text-gray-400 mt-1">
                                                                            Range: {param.min !== undefined ? param.min : '∞'} to {param.max !== undefined ? param.max : '∞'}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                                    <div className="flex items-center space-x-2">
                                                                        <button
                                                                            onClick={() => handleParameterChange(param.id, param.value)}
                                                                            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                                                                                editedValues[param.id] && !savingParams[param.id]
                                                                                    ? 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20 cursor-pointer'
                                                                                    : 'bg-gray-600/50 cursor-not-allowed'
                                                                            } text-white`}
                                                                            disabled={!editedValues[param.id] || savingParams[param.id]}
                                                                        >
                                                                            {savingParams[param.id] ? 'Saving...' : 'Save'}
                                                                        </button>
                                                                        {editedValues[param.id] && (
                                                                            <button
                                                                                onClick={() => handleResetValue(param.id)}
                                                                                className="px-3 py-2 rounded-lg bg-gray-600/50 hover:bg-gray-500/50 text-white transition-all duration-200 cursor-pointer"
                                                                                title="Reset to saved value"
                                                                            >
                                                                                ↺
                                                                            </button>
                                                                        )}
                                                                        {param.id >= 100 && param.id <= 105 && (
                                                                            <button
                                                                                onClick={() => setCalibrationAxis(getAxisFromParamId(param.id))}
                                                                                className="px-4 py-2 rounded-lg bg-blue-600/50 hover:bg-blue-500/50 text-white transition-all duration-200 flex items-center space-x-2 cursor-pointer"
                                                                                title="Calibrate steps/mm"
                                                                            >
                                                                                <Cog6ToothIcon className="w-5 h-5"/>
                                                                                <span>Calibrate</span>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </React.Fragment>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            )}                        </div>
                    )}
                </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {calibrationAxis && (
                <CalibrationModal
                    isOpen={!!calibrationAxis}
                    onClose={() => {
                        setCalibrationAxis(null)
                        setIsLoading(true)
                        setTimeout(() => {
                            sendCommand('$$');
                        }, 1000);
                    }}
                    axis={calibrationAxis as 'X' | 'Y' | 'Z' | 'A' | 'B' | 'C'}
                />
            )}
        </div>
    );
}

export default GrblConfigPage; 