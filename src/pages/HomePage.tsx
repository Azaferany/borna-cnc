import {ControlButtons} from "../components/ControlButtons/ControlButtons.tsx";
import {StatusDisplay} from "../components/StatusDisplay/StatusDisplay.tsx";
import {GCodeEditor} from "../components/GCodeEditor/GCodeEditor.tsx";
import {Console} from "../components/Console/Console.tsx";
import {Scene3D} from "../components/Scene3D/Scene3D.tsx";
import {JogControls} from "../components/JogControls/JogControls.tsx";
import {OverrideControls} from "../components/OverrideControls/OverrideControls.tsx";
import { ConnectButton } from "../components/ConnectButton/ConnectButton.tsx";
import {OpenFileButton} from "../components/OpenFileButton/OpenFileButton.tsx";
import WorkOffsetPanel from "../components/WorkOffsetPanel/WorkOffsetPanel.tsx";
function HomePage() {
    return (
        <div className="min-h-screen h-fill bg-gray-900 text-white">
            <div className="container mx-auto">
                <div className="grid grid-cols-12 gap-4">
                    {/* Left column - 3D view */}
                    <div className="col-span-9">
                        <div className="grid grid-cols-12 gap-2">
                            <header className="col-span-12 pb-3.5 pl-7  pt-2.5 border-b border-gray-700 flex justify-items-start items-center">
                                <h1 className="text-3xl font-bold">CNC Control Panel</h1>
                                <div className="pl-15">
                                    <ConnectButton />
                                </div>
                                <div className="pl-7">
                                    <OpenFileButton />
                                </div>
                            </header>
                            <div className="col-span-12">
                                <Scene3D />
                            </div>
                            <div className="col-span-4 h-[370px]">
                                <GCodeEditor />
                            </div>
                            <div className="col-span-4 h-[370px]">
                                <ControlButtons />

                            </div>
                            <div className="col-span-4 h-[370px]">
                                <JogControls />

                            </div>
                            <div className="col-span-12">
                                <WorkOffsetPanel />
                            </div>
                        </div>
                    </div>

                    {/* Right column - Controls */}
                    <div className="col-span-3 space-y-4">
                        <StatusDisplay />
                        <OverrideControls/>
                        <Console />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;