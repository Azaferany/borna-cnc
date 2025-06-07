import { Canvas } from '@react-three/fiber';
import {OrbitControls, Grid} from '@react-three/drei';
import {CoordinateAxes} from "./CoordinateAxes.tsx";
import {useStore} from "../../app/store.ts";
import {useEffect, useState} from "react";
import type {GCodePointData} from "../../types/GCodeTypes.ts";
import {Color} from "three";
import {SpatialPartition} from "./SpatialPartition.tsx";
import {processor} from "./GCodeToPointProcessor.ts";
import {ToolHead} from "./ToolHead.tsx";
import {findGCodeCommandOrLatestBaseOnLine} from "../../app/findGCodeCommandOrLatestBaseOnLine.ts";
import {useShallow} from "zustand/react/shallow";
import {OffsetMarkers} from "./OffsetMarkers.tsx";


export const Scene3D = () => {
    const toolPathGCodes = useStore(useShallow(x => x.toolPathGCodes));
    const selectedGCodeLine = useStore(x => x.selectedGCodeLine);
    const machineCoordinate = useStore(useShallow(x => x.machineCoordinate));
    const [completeData, setCompleteData] = useState<GCodePointData | null>(null);

    // Color states
    const [rapidMoveColor, setRapidMoveColor] = useState("#ff0000");
    const [feedMoveColor, setFeedMoveColor] = useState("#ffa500");
    const [arcMoveColor, setArcMoveColor] = useState("#fb64b6");
    const [runningColor, setRunningColor] = useState("#0000ff");
    const [doneColor, setDoneColor] = useState("#008236");

    useEffect(() => {
        const x= processor.processCommands((toolPathGCodes ??[]).filter(x=>x.hasMove));
        console.log(x)
            setCompleteData(x)
    }, [toolPathGCodes]);

    return (
        <div className="w-full h-full min-h-[370px] relative">
            <div className="absolute top-4 left-4 z-10 bg-black/40 p-4 rounded text-white shadow-xl">
                <h4 className="font-bold mb-2">Legend</h4>
                <div className="flex items-center gap-2 mb-2">
                    <input 
                        type="color" 
                        id="rapid-move-color"
                        className="p-0 h-6 w-8 block bg-white border border-gray-200 cursor-pointer rounded-sm disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700" 
                        value={rapidMoveColor}
                        onChange={(e) => setRapidMoveColor(e.target.value)}
                        title="Choose rapid move color"
                    />
                    <label htmlFor="rapid-move-color" className="cursor-pointer">Rapid moves (G0)</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <input 
                        type="color" 
                        id="feed-move-color"
                        className="p-0 h-6 w-8 block bg-white border border-gray-200 cursor-pointer rounded-sm disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700" 
                        value={feedMoveColor}
                        onChange={(e) => setFeedMoveColor(e.target.value)}
                        title="Choose feed move color"
                    />
                    <label htmlFor="feed-move-color" className="cursor-pointer">Feed moves (G1)</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <input 
                        type="color" 
                        id="arc-move-color"
                        className="p-0 h-6 w-8 block bg-white border border-gray-200 cursor-pointer rounded-sm disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700" 
                        value={arcMoveColor}
                        onChange={(e) => setArcMoveColor(e.target.value)}
                        title="Choose arc move color"
                    />
                    <label htmlFor="arc-move-color" className="cursor-pointer">Arc moves (G2/G3)</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <input 
                        type="color" 
                        id="running-color"
                        className="p-0 h-6 w-8 block bg-white border border-gray-200 cursor-pointer rounded-sm disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700" 
                        value={runningColor}
                        onChange={(e) => setRunningColor(e.target.value)}
                        title="Choose running color"
                    />
                    <label htmlFor="running-color" className="cursor-pointer">Running</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <input 
                        type="color" 
                        id="done-color"
                        className="p-0 h-6 w-8 block bg-white border border-gray-200 cursor-pointer rounded-sm disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700" 
                        value={doneColor}
                        onChange={(e) => setDoneColor(e.target.value)}
                        title="Choose done color"
                    />
                    <label htmlFor="done-color" className="cursor-pointer">Done</label>
                </div>
            </div>
            <Canvas shadows  camera={{
                fov: 20,
                position: [50, -50,   200],
                far: 100000,
                near: 0.1,

            }}>
                <OrbitControls
                    enabled={true}
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    enableDamping={true}
                />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
                <pointLight position={[10, 10, 10]} />
                <CoordinateAxes />

                <Grid
                    args={[5000, 5000]}
                    cellSize={10}
                    cellThickness={0.5}
                    cellColor="#6b7280"
                    sectionSize={100}
                    sectionThickness={1}
                    sectionColor="#9ca3af"
                    fadeDistance={10000}
                    fadeStrength={2}
                    followCamera={false}
                    rotation={[Math.PI / 2, 0, 0]}
                />
                <OffsetMarkers />
                {machineCoordinate &&(
                    <ToolHead position={machineCoordinate}
                              gCodeCommand={selectedGCodeLine && toolPathGCodes ? findGCodeCommandOrLatestBaseOnLine(selectedGCodeLine,toolPathGCodes) : undefined}
                    />

                )}

                {(completeData?.feedMovePoints  || completeData?.rapidMovePoints || completeData?.arkMovePoints) && (
                    <>

                        {completeData?.feedMovePoints.map((value,i) => (

                            <SpatialPartition
                                key={`${i}feedMovePoints`}

                                points={value
                                    .filter(x=>x.gCodeLineNumber > (selectedGCodeLine ?? 0))
                                    .flatMap(x=>x.points)}
                                color={new Color(feedMoveColor)}
                                lineWidth={2}/>

                        ))}
                        {completeData?.feedMovePoints.map((value,i) => (

                            <SpatialPartition
                                key={`${i}feedMovePointsDone`}

                                points={value
                                    .filter(x=>x.gCodeLineNumber < (selectedGCodeLine ?? 0))
                                    .flatMap(x=>x.points)}
                                color={new Color(doneColor)}
                                lineWidth={3.5}/>

                        ))}


                        {completeData?.rapidMovePoints.map((value,i) => (

                            <SpatialPartition
                                key={`${i}rapidMovePoints`}
                                points={value
                                    .filter(x=>x.gCodeLineNumber > (selectedGCodeLine ?? 0))
                                    .flatMap(x=>x.points)}
                                color={new Color(rapidMoveColor)}
                                lineWidth={1.5}/>

                        ))}
                        {completeData?.rapidMovePoints.map((value,i) => (

                            <SpatialPartition
                                key={`${i}rapidMovePointsDone`}
                                points={value
                                    .filter(x=>x.gCodeLineNumber < (selectedGCodeLine ?? 0))
                                    .flatMap(x=>x.points)}
                                color={new Color(doneColor)}
                                lineWidth={3.5}/>

                        ))}
                        {completeData?.arkMovePoints.map((value,i) => (

                            <SpatialPartition
                                key={`${i}arkMovePoints`}
                                points={value
                                    .filter(x=>x.gCodeLineNumber > (selectedGCodeLine ?? 0))
                                    .flatMap(x=>x.points)}
                                color={new Color(arcMoveColor)}
                                lineWidth={2}/>

                        ))}
                        {completeData?.arkMovePoints.map((value,i) => (

                            <SpatialPartition
                                key={`${i}arkMovePointsDone`}
                                points={value
                                    .filter(x=>x.gCodeLineNumber < (selectedGCodeLine ?? 0))
                                    .flatMap(x=>x.points)}
                                color={new Color(doneColor)}
                                lineWidth={3.5}/>

                        ))}

                        {selectedGCodeLine && selectedGCodeLine > 0 && toolPathGCodes && findGCodeCommandOrLatestBaseOnLine(selectedGCodeLine,toolPathGCodes.filter(x=>x.hasMove)) != null && (
                            <SpatialPartition
                                points={processor.getGCodePoints(findGCodeCommandOrLatestBaseOnLine(selectedGCodeLine,toolPathGCodes.filter(x=>x.hasMove))!).points}
                                color={new Color(runningColor)}
                                lineWidth={7}/>
                        )}
                    </>
                    )}

                {/* Add your CNC visualization components here */}
            </Canvas>
        </div>
    );
};