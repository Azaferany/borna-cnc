import { useState } from "react";
import { useGRBL } from "../../contexts/GRBLContext";

export const JogControls = () => {
    const [feedrate, setFeedrate] = useState(100);
    const [stepSize, setStepSize] = useState(1);
    const [continuousMode, setContinuousMode] = useState(false);
    const { sendCommand, isConnected } = useGRBL();

    const stopJog = async () => {
        try {
            await sendCommand('0x85');
        } catch (error) {
            console.error('Error stopping jog:', error);
        }
    };

    const handleJog = async (axis: string, direction: number) => {
        if (!isConnected) {
            console.error("Not connected to GRBL device");
            return;
        }

        try {
            if (axis === 'HOME') {
                await sendCommand('$H');
                return;
            }

            // Format the jog command
            const distance = direction * (continuousMode ? 1000 : stepSize); // Use large distance for continuous mode
            const command = `$J=G91 ${axis}${distance.toFixed(3)} F${feedrate}`;
            
            await sendCommand(command);
        } catch (error) {
            console.error('Error sending jog command:', error);
        }
    };

    const handleJogEnd = () => {
        if (continuousMode) {
            stopJog();
        }
    };


    const renderJogButton = (axis: string, direction: number, label: string) => (
        <button 
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={() => handleJog(axis, direction)}
            onMouseDown={() => handleJog(axis, direction)}
            onMouseUp={handleJogEnd}
            onMouseLeave={handleJogEnd}
            disabled={!isConnected}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-gray-800 p-4 rounded-lg h-full">
            <h2 className="text-xl font-bold mb-4">Jog Controls</h2>
            <div className="space-y-4">
                <div className="flex space-x-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Feedrate (mm/min)</label>
                        <input
                            type="number"
                            value={feedrate}
                            onChange={(e) => setFeedrate(Number(e.target.value))}
                            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                            min={1}
                            max={10000}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">distance (mm)</label>
                        <input
                            type="number"
                            value={stepSize}
                            onChange={(e) => setStepSize(Number(e.target.value))}
                            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                            disabled={continuousMode}
                            min={0.001}
                            max={1000}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                    <input
                        type="checkbox"
                        checked={continuousMode}
                        onChange={(e) => setContinuousMode(e.target.checked)}
                        className="rounded bg-gray-700"
                        id="continuous-mode"
                    />
                    <label htmlFor="continuous-mode" className="text-sm font-medium">
                        Continuous Mode {continuousMode && "(Hold button to jog, release to stop)"}
                    </label>
                </div>

                <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
                    {renderJogButton('Y', 1, 'Y+')}
                    {renderJogButton('Z', 1, 'Z+')}
                    {renderJogButton('A', 1, 'A+')}

                    {renderJogButton('X', -1, 'X-')}
                    <button 
                        className="p-3 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed" 
                        onClick={() => handleJog('HOME', 0)}
                        disabled={!isConnected}
                    >
                        HOME
                    </button>
                    {renderJogButton('X', 1, 'X+')}

                    {renderJogButton('Y', -1, 'Y-')}
                    {renderJogButton('Z', -1, 'Z-')}
                    {renderJogButton('A', -1, 'A-')}
                </div>
            </div>
        </div>
    );
};