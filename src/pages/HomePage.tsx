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
import {useState} from "react";

function HomePage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen h-fill bg-gray-900 text-white">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left column - 3D view */}
                    <div className="lg:col-span-9">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                            <header
                                className="col-span-12 pb-3.5 pl-2 md:pl-7 pt-2.5 border-b border-gray-700 flex flex-col md:flex-row justify-items-start items-start md:items-center">
                                <div className="flex items-center justify-between w-full md:w-auto">
                                    <h1 className="text-2xl md:text-3xl font-bold flex items-center">
                                        <svg className="w-6 h-6 md:w-8 md:h-8 mr-2" fill="none" stroke="currentColor"
                                             viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                                        </svg>
                                        Ali Zaferany CNC
                                    </h1>
                                    {/* Mobile menu button */}
                                    <button
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className="md:hidden p-2 rounded-lg hover:bg-gray-800"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}/>
                                        </svg>
                                    </button>
                                </div>

                                {/* Desktop buttons */}
                                <div className="hidden md:flex flex-wrap items-center gap-4 md:gap-4 md:ml-6">
                                    <div className="group relative" title="Connect to your CNC machine">
                                        <ConnectButton/>
                                        <span
                                            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            Connect to Machine
                                        </span>
                                    </div>
                                    <div className="group relative" title="Switch between USB and Network connection">
                                        <ConnectionTypeToggle/>
                                        <span
                                            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            Connection Type
                                        </span>
                                    </div>
                                    <div className="group relative" title="Load G-code file">
                                        <OpenFileButton/>
                                        <span
                                            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            Load G-code File
                                        </span>
                                    </div>
                                    <div className="group relative" title="View machine message history">
                                        <MessageHistoryButton/>
                                        <span
                                            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            Message History
                                        </span>
                                    </div>
                                    <div className="group relative" title="Configure machine settings">
                                        <MachineConfigButton/>
                                        <span
                                            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            Machine Settings
                                        </span>
                                    </div>
                                </div>

                                {/* Mobile dropdown menu */}
                                <div className={`md:hidden w-full mt-4 ${isMenuOpen ? 'block' : 'hidden'}`}>
                                    <div className="flex flex-col space-y-4 bg-gray-800 p-4 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Connect to Machine</span>
                                            <ConnectButton/>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Connection Type</span>
                                            <ConnectionTypeToggle/>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Load G-code File</span>
                                            <OpenFileButton/>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Message History</span>
                                            <MessageHistoryButton/>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <MachineConfigButton/>
                                        </div>
                                    </div>
                                </div>
                            </header>
                            <div className="col-span-12">
                                <Scene3D />
                            </div>
                            <div className="col-span-12 md:col-span-4">
                                <GCodeEditor />
                            </div>
                            <div className="col-span-12 md:col-span-4">
                                <ControlButtons />
                            </div>
                            <div className="col-span-12 md:col-span-4">
                                <OverrideControls/>
                            </div>
                            <div className="col-span-12">
                                <WorkOffsetPanel />
                            </div>
                        </div>
                    </div>

                    {/* Right column - Controls */}
                    <div className="lg:col-span-3 space-y-1.5 pt-1.5">
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