import React, {useState} from 'react';

export const SecondaryGasButton = () => {
    const [isOn, setIsOn] = useState(false);

    return (
        <button
            onClick={() => setIsOn(!isOn)}
            className={`w-full h-12 rounded-lg ${
                isOn ? 'bg-green-600' : 'bg-red-600'
            } text-white font-semibold hover:opacity-90 transition-opacity`}
        >
            Secondary Gas {isOn ? 'ON' : 'OFF'}
        </button>
    );
}; 