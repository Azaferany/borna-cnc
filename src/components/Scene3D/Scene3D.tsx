import {Canvas} from '@react-three/fiber';
import {GizmoHelper, GizmoViewport, Grid} from '@react-three/drei';
import {CoordinateAxes} from "./CoordinateAxes.tsx";
import {useStore} from "../../app/store.ts";
import {useEffect, useState} from "react";
import type {GCodePointData} from "../../types/GCodeTypes.ts";
import {Box3, Box3Helper, Color, Vector3} from "three";
import {SpatialPartition} from "./SpatialPartition.tsx";
import {processor} from "./GCodeToPointProcessor.ts";
import {ToolHead} from "./ToolHead.tsx";
import {findGCodeCommandOrLatestBaseOnLine} from "../../app/findGCodeCommandOrLatestBaseOnLine.ts";
import {useShallow} from "zustand/react/shallow";
import {OffsetMarkers} from "./OffsetMarkers.tsx";
import {type CAMERA_PRESETS, CameraController} from "./CameraController.tsx";
import {GridLabels} from "./GridLabels.tsx";

export const Scene3D = () => {
    const toolPathGCodes = useStore(useShallow(x => x.toolPathGCodes));
    const selectedGCodeLine = useStore(x => x.selectedGCodeLine);
    const machineCoordinate = useStore(useShallow(x => x.machineCoordinate));
    const [completeData, setCompleteData] = useState<GCodePointData | null>(null);
    const [cameraPreset, setCameraPreset] = useState<keyof typeof CAMERA_PRESETS | null>(null);
    const [showBoundingBox, setShowBoundingBox] = useState(false);
    const [boundingBox, setBoundingBox] = useState<Box3 | null>(null);
    const [cameraControlsOpen, setCameraControlsOpen] = useState(false);
    const [legendOpen, setLegendOpen] = useState(false);

    // Color states
    const [rapidMoveColor, setRapidMoveColor] = useState("#ff0000");
    const [feedMoveColor, setFeedMoveColor] = useState("#ffa500");
    const [arcMoveColor, setArcMoveColor] = useState("#fb64b6");
    const [runningColor, setRunningColor] = useState("#0000ff");
    const [doneColor, setDoneColor] = useState("#008236");

    useEffect(() => {
        const completeData= processor.processCommands((toolPathGCodes ??[]).filter(x=>x.hasMove));
        setCompleteData(completeData)

        const allPoints = completeData ? [
            ...completeData.feedMovePoints.flatMap(group =>
                group.flatMap(point => point.points.map(p => new Vector3(p.x, p.y, p.z)))
            ),
            ...completeData.rapidMovePoints.flatMap(group =>
                group.flatMap(point => point.points.map(p => new Vector3(p.x, p.y, p.z)))
            ),
            ...completeData.arkMovePoints.flatMap(group =>
                group.flatMap(point => point.points.map(p => new Vector3(p.x, p.y, p.z)))
            )
        ] : [new Vector3(0, 0, 0)];

        if (allPoints.length > 0) {
            const box = new Box3().setFromPoints(allPoints);
            box.expandByScalar(20);
            setBoundingBox(box);
        }

    }, [toolPathGCodes]);

    return (
        <div className="w-full h-full min-h-[370px] relative">
            <div className="absolute top-4 left-4 z-10 bg-black/40 rounded text-white shadow-xl">
                <button
                    onClick={() => setLegendOpen(!legendOpen)}
                    className="w-full px-4 py-2 text-left font-bold hover:bg-black/20 rounded flex items-center justify-between"
                >
                    <span className={`transform mr-3 transition-transform ${!legendOpen ? 'rotate-180' : ''}`}>
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/>
                        </svg>
                    </span>
                    Legend
                </button>

                {legendOpen && (
                    <div className="p-4 pt-0">
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
                )}
            </div>

            {/* Camera Controls - Collapsible */}
            <div className="absolute top-4 right-4 z-10 bg-black/40 rounded text-white shadow-xl">
                <button
                    onClick={() => setCameraControlsOpen(!cameraControlsOpen)}
                    className="w-full px-4 py-2 text-left font-bold hover:bg-black/20 rounded flex items-center justify-between"
                >
                  <span className={`transform mr-3 transition-transform ${!cameraControlsOpen ? 'rotate-180' : ''}`}>
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
                    </span>
                    Camera Controls

                </button>

                {cameraControlsOpen && (
                    <div className="p-4 pt-0">
                        <div className="flex flex-col gap-2 mb-3">
                            <button
                                onClick={() => setCameraPreset("center")}
                                className={`px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm`}
                            >
                                Go to Start
                            </button>
                            <button
                                onClick={() => setCameraPreset('top')}
                                disabled={!completeData || (!completeData.feedMovePoints.length && !completeData.rapidMovePoints.length && !completeData.arkMovePoints.length)}
                                className={`px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm ${(!completeData || (!completeData.feedMovePoints.length && !completeData.rapidMovePoints.length && !completeData.arkMovePoints.length)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Top View
                            </button>
                            <button
                                onClick={() => setCameraPreset('front')}
                                disabled={!completeData || (!completeData.feedMovePoints.length && !completeData.rapidMovePoints.length && !completeData.arkMovePoints.length)}
                                className={`px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm ${(!completeData || (!completeData.feedMovePoints.length && !completeData.rapidMovePoints.length && !completeData.arkMovePoints.length)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Front View
                            </button>
                            <button
                                onClick={() => setCameraPreset('side')}
                                disabled={!completeData || (!completeData.feedMovePoints.length && !completeData.rapidMovePoints.length && !completeData.arkMovePoints.length)}
                                className={`px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm ${(!completeData || (!completeData.feedMovePoints.length && !completeData.rapidMovePoints.length && !completeData.arkMovePoints.length)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Side View
                            </button>
                            <button
                                onClick={() => setCameraPreset('iso')}
                                disabled={!completeData || (!completeData.feedMovePoints.length && !completeData.rapidMovePoints.length && !completeData.arkMovePoints.length)}
                                className={`px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm ${(!completeData || (!completeData.feedMovePoints.length && !completeData.rapidMovePoints.length && !completeData.arkMovePoints.length)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Isometric View
                            </button>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                            <input
                                type="checkbox"
                                id="show-bounding-box"
                                checked={showBoundingBox}
                                onChange={(e) => setShowBoundingBox(e.target.checked)}
                                disabled={!completeData || (!completeData.feedMovePoints.length && !completeData.rapidMovePoints.length && !completeData.arkMovePoints.length)}
                                className={`w-4 h-4 ${(!completeData || (!completeData.feedMovePoints.length && !completeData.rapidMovePoints.length && !completeData.arkMovePoints.length)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <label htmlFor="show-bounding-box"
                                   className={`cursor-pointer text-sm ${(!completeData || (!completeData.feedMovePoints.length && !completeData.rapidMovePoints.length && !completeData.arkMovePoints.length)) ? 'opacity-50 cursor-not-allowed' : ''}`}>Show
                                Bounding Box</label>
                        </div>
                    </div>
                )}
            </div>

            <Canvas shadows camera={{
                fov: 60,
                position: [50, -50, 200],
                far: 100000,
                near: 0.1,
            }}>
                <CameraController
                    preset={cameraPreset}
                    boundingBox={boundingBox}
                    onPresetComplete={() => setCameraPreset(null)}
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
                <GridLabels/>
                <GizmoHelper alignment={"bottom-left"}>
                    <GizmoViewport/>
                </GizmoHelper>
                <OffsetMarkers />
                {machineCoordinate &&(
                    <ToolHead position={machineCoordinate}
                              gCodeCommand={selectedGCodeLine && toolPathGCodes ? findGCodeCommandOrLatestBaseOnLine(selectedGCodeLine,toolPathGCodes) : undefined}
                    />

                )}

                {showBoundingBox && boundingBox && (
                    <primitive object={new Box3Helper(boundingBox, new Color(0x00ff00))} />
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