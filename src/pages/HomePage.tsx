import {ControlButtons} from "../components/ControlButtons/ControlButtons.tsx";
import {StatusDisplay} from "../components/StatusDisplay/StatusDisplay.tsx";
import {GCodeEditor} from "../components/GCodeEditor/GCodeEditor.tsx";
import {Console} from "../components/Console/Console.tsx";
import {Scene3D} from "../components/Scene3D/3DViewer.tsx";
import {JogControls} from "../components/JogControls/JogControls.tsx";
import {OverrideControls} from "../components/OverrideControls/OverrideControls.tsx";

function HomePage() {
    return (
        <div className="min-h-screen h-fill bg-gray-900 text-white">
            <div className="container mx-auto">
                <div className="grid grid-cols-12 gap-4">
                    {/* Left column - 3D view */}
                    <div className="col-span-9 h-[400px]">
                        <div className="grid grid-cols-12 gap-2">

                            <header className="col-span-12 pb-3.5 pl-7 border-b border-gray-700">
                                <h1 className="text-3xl font-bold pt-2.5">CNC Control Panel</h1>
                            </header>
                            <div className="col-span-12">
                                <Scene3D />
                            </div>
                            <div className="col-span-4 h-[350px]">
                                <GCodeEditor />
                            </div>
                            <div className="col-span-4 h-[350px]">
                                <JogControls />
                            </div>
                            <div className="col-span-4 h-[350px]">
                                <ControlButtons />
                            </div>
                        </div>

                    </div>

                    {/* Right column - Controls */}
                    <div className="col-span-3 space-y-4 mt-2 mr-2">
                        <StatusDisplay />
                        <OverrideControls/>
                        <Console />


                    </div>
                </div>
            </div>
        </div>    );
}

export default HomePage;