import {useState, useEffect} from 'react';
import {Link} from 'react-router';
import {ROUTES} from '../app/routes';
import {useGRBL} from '../app/useGRBL';
import {useGRBLListener} from '../app/useGRBLListener';

interface GrblParameter {
    id: number;
    name: string;
    value: string;
    description: string;
}

const PARAMETER_DESCRIPTIONS: Record<number, { name: string; description: string }> = {
    0: {name: 'Step pulse time', description: 'Microseconds step pulse time'},
    1: {name: 'Step idle delay', description: 'Milliseconds step idle delay'},
    2: {name: 'Step port invert', description: 'Step port invert mask'},
    3: {name: 'Direction port invert', description: 'Direction port invert mask'},
    4: {name: 'Step enable invert', description: 'Step enable invert mask'},
    5: {name: 'Limit pins invert', description: 'Limit pins invert mask'},
    6: {name: 'Probe pin invert', description: 'Probe pin invert mask'},
    10: {name: 'Status report options', description: 'Status report options mask'},
    11: {name: 'Junction deviation', description: 'Junction deviation in mm'},
    12: {name: 'Arc tolerance', description: 'Arc tolerance in mm'},
    13: {name: 'Report inches', description: 'Report in inches (0=mm, 1=inches)'},
    20: {name: 'Soft limits', description: 'Soft limits enable (0=disable, 1=enable)'},
    21: {name: 'Hard limits', description: 'Hard limits enable (0=disable, 1=enable)'},
    22: {name: 'Homing cycle', description: 'Homing cycle enable (0=disable, 1=enable)'},
    23: {name: 'Homing dir invert', description: 'Homing direction invert mask'},
    24: {name: 'Homing feed', description: 'Homing feed rate in mm/min'},
    25: {name: 'Homing seek', description: 'Homing seek rate in mm/min'},
    26: {name: 'Homing debounce', description: 'Homing debounce delay in ms'},
    27: {name: 'Homing pull-off', description: 'Homing pull-off distance in mm'},
    30: {name: 'Max spindle speed', description: 'Maximum spindle speed in RPM'},
    31: {name: 'Min spindle speed', description: 'Minimum spindle speed in RPM'},
    32: {name: 'Laser mode', description: 'Laser mode enable (0=disable, 1=enable)'},
    100: {name: 'X steps/mm', description: 'X axis steps per mm'},
    101: {name: 'Y steps/mm', description: 'Y axis steps per mm'},
    102: {name: 'Z steps/mm', description: 'Z axis steps per mm'},
    110: {name: 'X max rate', description: 'X axis maximum rate in mm/min'},
    111: {name: 'Y max rate', description: 'Y axis maximum rate in mm/min'},
    112: {name: 'Z max rate', description: 'Z axis maximum rate in mm/min'},
    120: {name: 'X acceleration', description: 'X axis acceleration in mm/sec^2'},
    121: {name: 'Y acceleration', description: 'Y axis acceleration in mm/sec^2'},
    122: {name: 'Z acceleration', description: 'Z axis acceleration in mm/sec^2'},
    130: {name: 'X max travel', description: 'X axis maximum travel in mm'},
    131: {name: 'Y max travel', description: 'Y axis maximum travel in mm'},
    132: {name: 'Z max travel', description: 'Z axis maximum travel in mm'},
};

function GrblConfigPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [parameters, setParameters] = useState<Record<number, string>>({});
    const [editedValues, setEditedValues] = useState<Record<number, string>>({});
    const [savingParams, setSavingParams] = useState<Record<number, boolean>>({});
    const {sendCommand, isConnected} = useGRBL();

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
    }, [isConnected]);

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
            }
        }
    }, []);

    const handleParameterChange = async (id: number, newValue: string) => {
        try {
            setSavingParams(prev => ({
                ...prev,
                [id]: true
            }));
            sendCommand(`$${id}=${newValue}`);
            setTimeout(() => {
                sendCommand('$$');
            }, 1000);
        } catch (error) {
            console.error('Failed to update parameter:', error);
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

    const parameterList: GrblParameter[] = Object.entries(parameters).map(([id, value]) => ({
        id: parseInt(id),
        name: PARAMETER_DESCRIPTIONS[parseInt(id)]?.name || `Parameter ${id}`,
        value: editedValues[parseInt(id)] ?? String(value),
        description: PARAMETER_DESCRIPTIONS[parseInt(id)]?.description || 'No description available',
    }));

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-700 z-10">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center">
                        <Link to={ROUTES.HOME}
                              className="mr-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                            </svg>
                            Back
                        </Link>
                        <h1 className="text-3xl font-bold">Machine Configuration</h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-6 pt-24 pb-6">
                {!isConnected ? (
                    <div className="text-center text-red-500">Please connect to the machine first</div>
                ) : isLoading ? (
                    <div className="text-center">Loading machine parameters...</div>
                ) : (
                    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Parameter</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                            {parameterList.map((param) => (
                                <tr key={param.id} className="hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{param.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{param.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={param.value}
                                                onChange={(e) => handleInputChange(param.id, e.target.value)}
                                                className={`bg-gray-600 text-white px-2 py-1 rounded border ${
                                                    savingParams[param.id] ? 'border-yellow-500' : 'border-gray-500'
                                                } focus:border-blue-500 focus:outline-none`}
                                                disabled={savingParams[param.id]}
                                            />
                                            {savingParams[param.id] && (
                                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                    <div
                                                        className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">{param.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        <button
                                            onClick={() => handleParameterChange(param.id, param.value)}
                                            className={`px-3 py-1 rounded ${
                                                editedValues[param.id] && !savingParams[param.id]
                                                    ? 'bg-blue-500 hover:bg-blue-600'
                                                    : 'bg-gray-500 cursor-not-allowed'
                                            } text-white`}
                                            disabled={!editedValues[param.id] || savingParams[param.id]}
                                        >
                                            {savingParams[param.id] ? 'Saving...' : 'Save'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default GrblConfigPage; 