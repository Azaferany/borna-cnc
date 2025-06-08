import React, {useState} from 'react';

export const GasControls = () => {
    const [mainGasOn, setMainGasOn] = useState(false);
    const [secondaryGasOn, setSecondaryGasOn] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <span className="text-white">Main Gas</span>
                <button
                    onClick={() => setMainGasOn(!mainGasOn)}
                    className={`px-4 py-2 rounded-lg ${
                        mainGasOn ? 'bg-green-600' : 'bg-red-600'
                    } text-white font-semibold`}
                >
                    {mainGasOn ? 'ON' : 'OFF'}
                </button>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-white">Secondary Gas</span>
                <button
                    onClick={() => setSecondaryGasOn(!secondaryGasOn)}
                    className={`px-4 py-2 rounded-lg ${
                        secondaryGasOn ? 'bg-green-600' : 'bg-red-600'
                    } text-white font-semibold`}
                >
                    {secondaryGasOn ? 'ON' : 'OFF'}
                </button>
            </div>
        </div>
    );
}; 