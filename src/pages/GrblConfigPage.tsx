import React, {useState, useEffect} from 'react';
import {Link} from 'react-router';
import {ROUTES} from '../app/routes';
import {useGRBL} from '../app/useGRBL';
import {useGRBLListener} from '../app/useGRBLListener';
import {MagnifyingGlassIcon, ExclamationTriangleIcon, HomeIcon, Cog6ToothIcon} from '@heroicons/react/24/outline';
import CalibrationModal from '../components/CalibrationModal/CalibrationModal';

interface GrblParameter {
    id: number;
    name: string;
    value: string;
    description: string;
    hasDescription: boolean;
    group: string;
}

const PARAMETER_DESCRIPTIONS: Record<number, { name: string; description: string }> = {
    // Basic Settings
    0: {name: 'Step pulse time', description: 'Microseconds step pulse time'},
    1: {name: 'Step idle delay', description: 'Milliseconds step idle delay'},
    2: {name: 'Step port invert', description: 'Step port invert mask'},
    3: {name: 'Direction port invert', description: 'Direction port invert mask'},
    4: {name: 'Step enable invert', description: 'Step enable invert mask (per axis)'},
    5: {name: 'Limit pins invert', description: 'Limit pins invert mask'},
    6: {name: 'Probe pin invert', description: 'Probe pin invert mask'},
    9: {name: 'PWM Spindle Enable', description: 'PWM Spindle Enable'},
    10: {name: 'Status report options', description: 'Status report options mask'},
    11: {name: 'Junction deviation', description: 'Junction deviation in mm'},
    12: {name: 'Arc tolerance', description: 'Arc tolerance in mm'},
    13: {name: 'Report inches', description: 'Report in inches (0=mm, 1=inches)'},
    14: {name: 'Control pin invert', description: 'Invert control input signals'},
    15: {name: 'Coolant pin invert', description: 'Invert coolant output signals'},
    16: {name: 'Spindle pin invert', description: 'Invert spindle output signals'},
    17: {name: 'Control pullup disable', description: 'Disable control signal pullup'},
    18: {name: 'Limit pullup disable', description: 'Disable limit signals pull up'},
    19: {name: 'Probe pullup disable', description: 'Disable probe pull up'},

    // Motion Settings
    20: {name: 'Soft limits', description: 'Soft limits enable (0=disable, 1=enable)'},
    21: {name: 'Hard limits', description: 'Hard limits enable and strict mode (bitmask)'},
    22: {name: 'Homing cycle', description: 'Homing cycle enable and features (bitmask)'},
    23: {name: 'Homing dir invert', description: 'Homing direction invert mask'},
    24: {name: 'Homing feed', description: 'Homing feed rate in mm/min'},
    25: {name: 'Homing seek', description: 'Homing seek rate in mm/min'},
    26: {name: 'Homing debounce', description: 'Homing debounce delay in ms'},
    27: {name: 'Homing pull-off', description: 'Homing pull-off distance in mm'},
    28: {name: 'G73 retract', description: 'G73 retract distance in mm'},
    29: {name: 'Step pulse delay', description: 'Stepper pulse delay in microseconds (0-10)'},
    40: {name: 'Soft limits jog', description: 'Enable soft limits for jogging (0=disable, 1=enable)'},
    43: {name: 'Homing locate cycles', description: 'Number of homing locate cycles (0-255)'},
    44: {name: 'Homing priority 1', description: 'Axis priority for homing (first)'},
    45: {name: 'Homing priority 2', description: 'Axis priority for homing (second)'},
    46: {name: 'Homing priority 3', description: 'Axis priority for homing (third)'},
    47: {name: 'Homing priority 4', description: 'Axis priority for homing (fourth)'},
    48: {name: 'Homing priority 5', description: 'Axis priority for homing (fifth)'},
    49: {name: 'Homing priority 6', description: 'Axis priority for homing (sixth)'},

    // Spindle Settings
    30: {name: 'Max spindle speed', description: 'Maximum spindle speed in RPM'},
    31: {name: 'Min spindle speed', description: 'Minimum spindle speed in RPM'},
    32: {name: 'Machine mode', description: 'Machine mode (0=normal, 1=laser, 2=lathe)'},
    33: {name: 'Spindle PWM freq', description: 'Spindle PWM frequency in Hz'},
    34: {name: 'Spindle PWM off', description: 'Spindle off PWM duty cycle in percent'},
    35: {name: 'Spindle PWM min', description: 'Spindle minimum PWM duty cycle in percent'},
    36: {name: 'Spindle PWM max', description: 'Spindle maximum PWM duty cycle in percent'},
    37: {name: 'Stepper deenergize', description: 'Steppers to deenergize when motion completes'},
    38: {name: 'Spindle encoder PPR', description: 'Spindle encoder pulses per revolution'},
    340: {name: 'Spindle at speed tolerance', description: 'Spindle at speed tolerance in percent'},

    // PID Settings
    80: {name: 'Spindle PID P', description: 'Spindle PID proportional gain'},
    81: {name: 'Spindle PID I', description: 'Spindle PID integral gain'},
    82: {name: 'Spindle PID D', description: 'Spindle PID derivative gain'},
    84: {name: 'Spindle PID max error', description: 'Spindle PID max output error'},
    85: {name: 'Spindle PID max integral', description: 'Spindle PID max integral error'},
    90: {name: 'Sync PID P', description: 'Spindle synced motion PID proportional gain'},
    91: {name: 'Sync PID I', description: 'Spindle synced motion PID integral gain'},
    92: {name: 'Sync PID D', description: 'Spindle synced motion PID derivative gain'},

    // Jogging Settings
    50: {name: 'Jog step speed', description: 'Jogging step speed in mm/min'},
    51: {name: 'Jog slow speed', description: 'Jogging slow speed in mm/min'},
    52: {name: 'Jog fast speed', description: 'Jogging fast speed in mm/min'},
    53: {name: 'Jog step distance', description: 'Jogging step distance in mm'},
    54: {name: 'Jog slow distance', description: 'Jogging slow distance in mm'},
    55: {name: 'Jog fast distance', description: 'Jogging fast distance in mm'},

    // Network Settings
    70: {name: 'Network services', description: 'Network services mask'},
    71: {name: 'Bluetooth name', description: 'Bluetooth device name (max 32 chars)'},
    72: {name: 'Bluetooth service', description: 'Bluetooth service name (max 32 chars)'},
    73: {name: 'WiFi mode', description: 'WiFi mode (0=NULL, 1=STA, 2=AP, 3=APSTA)'},
    74: {name: 'WiFi STA SSID', description: 'WiFi Station SSID (max 64 chars)'},
    75: {name: 'WiFi STA password', description: 'WiFi Station password (max 32 chars)'},
    76: {name: 'WiFi AP SSID', description: 'WiFi Access Point SSID (max 64 chars)'},
    77: {name: 'WiFi AP password', description: 'WiFi Access Point password (max 32 chars)'},
    78: {name: 'WiFi AP country', description: 'WiFi AP Country (max 3 chars)'},
    79: {name: 'WiFi AP channel', description: 'WiFi AP Channel (0-11)'},

    // Tool Change Settings
    341: {name: 'Tool change mode', description: 'Manual tool change mode (0-4)'},
    342: {name: 'Probing distance', description: 'Probing distance in mm'},
    343: {name: 'Probing slow feed', description: 'Probing slow feed rate in mm/min'},
    344: {name: 'Probing seek feed', description: 'Probing seek feed rate in mm/min'},

    // Other Settings
    39: {name: 'Realtime commands', description: 'Enable printable realtime command characters'},
    60: {name: 'Restore overrides', description: 'Restore default overrides when program ends'},
    61: {name: 'Ignore safety door', description: 'Ignore safety door signal when idle'},
    62: {name: 'Sleep enable', description: 'Enable sleep function'},
    63: {name: 'Disable laser hold', description: 'Disable laser during hold'},
    64: {name: 'Force alarm', description: 'Force grbl to enter alarm mode on startup'},
    65: {name: 'Probe feed override', description: 'Allow feed rate override during probing'},

    // Axis Settings
    100: {name: 'X steps/mm', description: 'X axis steps per mm'},
    101: {name: 'Y steps/mm', description: 'Y axis steps per mm'},
    102: {name: 'Z steps/mm', description: 'Z axis steps per mm'},
    103: {name: 'A steps/mm', description: 'A axis steps per mm'},
    104: {name: 'B steps/mm', description: 'B axis steps per mm'},
    105: {name: 'C steps/mm', description: 'C axis steps per mm'},
    110: {name: 'X max rate', description: 'X axis maximum rate in mm/min'},
    111: {name: 'Y max rate', description: 'Y axis maximum rate in mm/min'},
    112: {name: 'Z max rate', description: 'Z axis maximum rate in mm/min'},
    113: {name: 'A max rate', description: 'A axis maximum rate in mm/min'},
    114: {name: 'B max rate', description: 'B axis maximum rate in mm/min'},
    115: {name: 'C max rate', description: 'C axis maximum rate in mm/min'},
    120: {name: 'X acceleration', description: 'X axis acceleration in mm/sec^2'},
    121: {name: 'Y acceleration', description: 'Y axis acceleration in mm/sec^2'},
    122: {name: 'Z acceleration', description: 'Z axis acceleration in mm/sec^2'},
    123: {name: 'A acceleration', description: 'A axis acceleration in mm/sec^2'},
    124: {name: 'B acceleration', description: 'B axis acceleration in mm/sec^2'},
    125: {name: 'C acceleration', description: 'C axis acceleration in mm/sec^2'},
    130: {name: 'X max travel', description: 'X axis maximum travel in mm'},
    131: {name: 'Y max travel', description: 'Y axis maximum travel in mm'},
    132: {name: 'Z max travel', description: 'Z axis maximum travel in mm'},
    133: {name: 'A max travel', description: 'A axis maximum travel in mm'},
    134: {name: 'B max travel', description: 'B axis maximum travel in mm'},
    135: {name: 'C max travel', description: 'C axis maximum travel in mm'},
};

function GrblConfigPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [parameters, setParameters] = useState<Record<number, string>>({});
    const [editedValues, setEditedValues] = useState<Record<number, string>>({});
    const [savingParams, setSavingParams] = useState<Record<number, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [calibrationAxis, setCalibrationAxis] = useState<string | null>(null);
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
                setParameters(prev => ({
                    ...prev,
                    [paramId]: value
                }));
                // Clear edited value and saving state when we receive the actual value
                setEditedValues(prev => {
                    const newValues = {...prev};
                    delete newValues[paramId];
                    return newValues;
                });
                setSavingParams({});
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
            setTimeout(() => {
                sendCommand('$$');
            }, 1000);
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

    const parameterList: GrblParameter[] = Object.entries(parameters)
        .map(([id, value]) => ({
            id: parseInt(id),
            name: PARAMETER_DESCRIPTIONS[parseInt(id)]?.name || `Parameter ${id}`,
            value: editedValues[parseInt(id)] ?? String(value),
            description: PARAMETER_DESCRIPTIONS[parseInt(id)]?.description || 'No description available',
            hasDescription: !!PARAMETER_DESCRIPTIONS[parseInt(id)]?.description,
            group: getParameterGroup(parseInt(id))
        }))
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-800/50 backdrop-blur-lg border-r border-gray-700/50 fixed h-full">
                <div className="p-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-8">
                        Borna CNC
                    </h2>
                    <div className="space-y-4">
                        <Link
                            to={ROUTES.HOME}
                            className="flex items-center px-4 py-3 rounded-lg transition-all duration-200 text-gray-300 hover:bg-gray-700/50 hover:text-white"
                        >
                            <HomeIcon className="w-5 h-5 mr-3"/>
                            Home
                        </Link>

                        <div className="pt-4 border-t border-gray-700/50">
                            <h3 className="px-4 text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
                                Parameter Groups
                            </h3>
                            <nav className="space-y-1">
                                {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
                                {sortedGroups.filter(([_, params]) => params.length > 0)
                                    .map(([group]) => (
                                        <button
                                            key={group}
                                            onClick={() => scrollToGroup(group)}
                                            className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white rounded-lg transition-all duration-200"
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
            <div className="flex-1 ml-64">
                {/* Fixed Header */}
                <header
                    className="fixed top-0 left-64 right-0 bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/50 z-10">
                    <div className="container mx-auto px-6 py-4">
                        <div className="flex items-center">
                            <Link to={ROUTES.HOME}
                                  className="mr-4 bg-gray-700/50 hover:bg-gray-600/50 text-white px-4 py-2 rounded-lg flex items-center transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                                </svg>
                                Back
                            </Link>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                                Machine Configuration
                            </h1>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="container mx-auto px-6 pt-24 pb-6">
                    {!isConnected ? (
                        <div
                            className="text-center text-red-400 p-6 bg-red-900/20 rounded-xl backdrop-blur-sm border border-red-500/20 shadow-lg shadow-red-500/10">
                            <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-3 text-red-400"/>
                            <p className="text-lg">Please connect to the machine first</p>
                        </div>
                    ) : isLoading ? (
                        <div className="text-center p-8">
                            <div
                                className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                            <p className="text-lg text-gray-300">Loading machine parameters...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
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
                            <div
                                className="bg-gray-800/50 rounded-xl shadow-lg shadow-gray-900/20 backdrop-blur-sm border border-gray-700/50 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-700/50">
                                    <thead className="bg-gray-700/30">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Parameter</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Value</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
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
                                                                <span className="font-medium">{param.name}</span>
                                                                {!param.hasDescription && (
                                                                    <span
                                                                        className="ml-2 text-xs text-gray-400">(Undocumented)</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    value={param.value}
                                                                    onChange={(e) => handleInputChange(param.id, e.target.value)}
                                                                    className={`bg-gray-700/50 text-white px-3 py-2 rounded-lg border ${
                                                                        savingParams[param.id] ? 'border-yellow-500/50' : 'border-gray-600/50'
                                                                    } focus:border-blue-500/50 focus:outline-none transition-all duration-200 w-full`}
                                                                    disabled={savingParams[param.id]}
                                                                    title={param.description}
                                                                />
                                                                {savingParams[param.id] && (
                                                                    <div
                                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                                        <div
                                                                            className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-300">{param.description}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                            <div className="flex items-center space-x-2">
                                                                <button
                                                                    onClick={() => handleParameterChange(param.id, param.value)}
                                                                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                                                                        editedValues[param.id] && !savingParams[param.id]
                                                                            ? 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20'
                                                                            : 'bg-gray-600/50 cursor-not-allowed'
                                                                    } text-white`}
                                                                    disabled={!editedValues[param.id] || savingParams[param.id]}
                                                                >
                                                                    {savingParams[param.id] ? 'Saving...' : 'Save'}
                                                                </button>
                                                                {param.id >= 100 && param.id <= 105 && (
                                                                    <button
                                                                        onClick={() => setCalibrationAxis(getAxisFromParamId(param.id))}
                                                                        className="px-4 py-2 rounded-lg bg-blue-600/50 hover:bg-blue-500/50 text-white transition-all duration-200 flex items-center space-x-2"
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
                    )}
                </div>
            </div>

            {calibrationAxis && (
                <CalibrationModal
                    isOpen={!!calibrationAxis}
                    onClose={() => {
                        setCalibrationAxis(null)
                        setIsLoading(true)
                        sendCommand("$$")
                    }}
                    axis={calibrationAxis as 'X' | 'Y' | 'Z' | 'A' | 'B' | 'C'}
                />
            )}
        </div>
    );
}

export default GrblConfigPage; 