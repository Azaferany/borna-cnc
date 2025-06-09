import {StartButton} from "../StartButton/StartButton.tsx";
import {PreviousButton} from "../PreviousButton/PreviousButton.tsx";
import {PauseButton} from "../PauseButton/PauseButton.tsx";
import {ResetButton} from "../ResetButton/ResetButton.tsx";
import {DwellInfo} from "../DwellInfo/DwellInfo.tsx";
import {MainGasButton} from "../MainGasButton/MainGasButton.tsx";
import {SecondaryGasButton} from "../SecondaryGasButton/SecondaryGasButton.tsx";

export const ControlButtons = () => {

    return (
        <div className="bg-gray-800 p-4 rounded-lg h-full">
            <h2 className="text-xl font-bold mb-4">Machine Control</h2>
            <div className="grid grid-cols-3 gap-4 items-center mt-6">
                <PreviousButton />
                <PauseButton />
                <StartButton/>
            </div>
            <div className="grid grid-cols-3 gap-4 items-center mt-4">
                <MainGasButton/>
                <ResetButton/>
                <SecondaryGasButton/>
            </div>
            <div className="grid grid-cols-1 gap-4 items-center mt-4">
                <DwellInfo/>
            </div>

        </div>
    );
};