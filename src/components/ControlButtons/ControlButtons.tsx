import {StartButton} from "../StartButton/StartButton.tsx";
import {PauseButton} from "../PauseButton/PauseButton.tsx";
import {ResetButton} from "../ResetButton/ResetButton.tsx";
import {DwellInfo} from "../DwellInfo/DwellInfo.tsx";
import {SpindleControl} from "../SpindleControl/SpindleControl.tsx";

export const ControlButtons = () => {
    return (
        <div className="bg-gray-800 p-4 rounded-lg h-full">
            <h2 className="text-xl font-bold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                Machine Control
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4 items-stretch mt-2">
                <PauseButton/>
                <StartButton/>
                <ResetButton/>

            </div>
            <div className="grid grid-cols-1 gap-4 items-stretch mt-2">
                <SpindleControl/>
            </div>
            <div className="grid grid-cols-1 gap-4 items-stretch mt-1">
                <DwellInfo/>
            </div>
        </div>
    );
};