import { BackwardIcon } from '@heroicons/react/24/solid';
import { useGRBL } from "../../app/useGRBL.ts";
import { useStore } from "../../app/store.ts";
import type { GRBLState } from "../../types/GCodeTypes.ts";
import { reverseGCode } from "./reverseGCode.ts";

export const PreviousButton = () => {
    const { sendCommand } = useGRBL();
    const status = useStore(s => s.status);
    const machineCoordinate = useStore(s => s.machineCoordinate);
    const selectedGCodeLine = useStore(s => s.selectedGCodeLine);
    const toolPathGCodes = useStore(s => s.toolPathGCodes);
    const isButtonEnabled = true;


    const handleCommand = async (command: string) => {
        try {
            console.log('Sending command:', command);
            await sendCommand(command);
        } catch (error) {
            console.error('Error sending command:', error);
        }
    };

    const handlePrevious = async () => {
        if (!isButtonEnabled || !toolPathGCodes || !selectedGCodeLine) return;


        const reversedCommands = reverseGCode(toolPathGCodes, selectedGCodeLine, machineCoordinate);


        for (const command of reversedCommands) {
            // Wait for Idle status before sending next command
            while (status !== "Idle" as GRBLState) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            await handleCommand(command);
        }
    };

    return (
        <button
            onClick={handlePrevious}
            disabled={!isButtonEnabled}
            className={`bg-purple-600 hover:bg-purple-700 active:bg-purple-900 p-3 rounded flex flex-col items-center justify-center transition-colors duration-150 ${
                isButtonEnabled 
                    ? '' 
                    : 'opacity-40 cursor-not-allowed'
            }`}
        >
            <BackwardIcon className="h-6 w-6" />
            <span className="text-sm mt-1">Previous</span>
        </button>
    );
}; 