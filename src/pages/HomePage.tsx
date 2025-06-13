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
import {MessageHistoryButton} from "../components/MessageHistoryButton/MessageHistoryButton.tsx";
import {ConnectionTypeToggle} from "../components/ConnectionTypeToggle/ConnectionTypeToggle.tsx";
import {MachineConfigButton} from "../components/MachineConfigButton/MachineConfigButton.tsx";

function HomePage() {
    return (
        <div className="min-h-screen h-fill bg-gray-900 text-white">
            <div className="container mx-auto">
                <div className="grid grid-cols-12 gap-4">
                    {/* Left column - 3D view */}
                    <div className="col-span-9">
                        <div className="grid grid-cols-12 gap-2">
                            <header
                                className="col-span-12 pb-3.5 pl-7 pt-2.5 border-b border-gray-700 flex justify-items-start items-center">
                                <h1 className="text-3xl font-bold flex items-center">
                                    <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                                    </svg>
                                    CNC Control Panel
                                </h1>
                                <div className="pl-5" title="Connect to your CNC machine">
                                    <ConnectButton />
                                </div>
                                <div className="pl-2" title="Switch between USB and Network connection">
                                    <ConnectionTypeToggle/>
                                </div>
                                <div className="pl-10" title="Load G-code file">
                                    <OpenFileButton />
                                </div>
                                <div className="pl-4" title="View machine message history">
                                    <MessageHistoryButton/>
                                </div>
                                <div className="pl-15" title="Configure machine settings">
                                    <MachineConfigButton/>
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
                                <OverrideControls/>
                            </div>
                            <div className="col-span-12">
                                <WorkOffsetPanel />
                            </div>
                        </div>
                    </div>

                    {/* Right column - Controls */}
                    <div className="col-span-3 space-y-4 pt-2.5">
                        <StatusDisplay />
                        <JogControls />
                        <Console />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;