import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import {CoordinateAxes} from "./CoordinateAxes.tsx";
import {useStore} from "../../app/store.ts";
import {useEffect, useState} from "react";
import type {GCodePointData} from "../../types/GCodeTypes.ts";
import {Color} from "three";
import {SpatialPartition} from "./SpatialPartition.tsx";
import {processor} from "./GCodeToPointProcessor.ts";
import {ToolHead} from "./ToolHead.tsx";
import {findGCodeCommandOrLatestBaseOnLine} from "../../app/findGCodeCommandOrLatestBaseOnLine.ts";


export const Scene3D = () => {
    const toolPathGCodes = useStore(x => x.toolPathGCodes);
    const selectedGCodeLine = useStore(x => x.selectedGCodeLine);
    const machineCoordinate = useStore(x => x.machineCoordinate);
    const [completeData, setCompleteData] = useState<GCodePointData | null>(null);
    useEffect(() => {
            setCompleteData(processor.processCommands(toolPathGCodes ??[]))
    }, [toolPathGCodes]);


    return (
        <div className="w-full h-full min-h-[370px] relative">
            <div className="absolute top-4 left-4 z-10 bg-transparent p-4 rounded text-white shadow-xl">

                <h4 className="font-bold mb-2">Legend</h4>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-red-500"></div>
                    <span>Rapid moves (G0)</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-yellow-500"></div>
                    <span>Feed moves (G1)</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-green-500"></div>
                    <span>Arc moves (G2/G3)</span>
                </div>
            </div>
            <Canvas shadows camera={{
                fov: 45,
                position: [50, -50,   200]
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
                    args={[100, 100]}
                    cellSize={10}
                    cellThickness={0.5}
                    cellColor="#6b7280"
                    sectionSize={100}
                    sectionThickness={1}
                    sectionColor="#9ca3af"
                    fadeDistance={500}
                    fadeStrength={0.5}
                    followCamera={false}
                    infiniteGrid
                    rotation={[Math.PI / 2, 0, 0]}
                />
                {machineCoordinate &&(
                    <ToolHead position={machineCoordinate}
                              gCodeCommand={selectedGCodeLine && toolPathGCodes ? findGCodeCommandOrLatestBaseOnLine(selectedGCodeLine,toolPathGCodes) : undefined}
                    />

                )}

                {(completeData?.feedMovePoints  || completeData?.rapidMovePoints || completeData?.arkMovePoints) && (
                    <>

                        {completeData?.feedMovePoints.map(value => (

                            <SpatialPartition
                                points={value.flatMap(x=>x.points)}
                                color={new Color(0xffa500)}
                                lineWidth={2}/>

                        ))}


                        {completeData?.rapidMovePoints.map(value => (

                            <SpatialPartition
                                points={value.flatMap(x=>x.points)}
                                color={new Color(0xff0000)}
                                lineWidth={1.5}/>

                        ))}
                        {completeData?.arkMovePoints.map(value => (

                            <SpatialPartition
                                points={value.flatMap(x=>x.points)}
                                color={new Color(0x008000)}
                                lineWidth={2}/>

                        ))}

                        {selectedGCodeLine && selectedGCodeLine > 0 && toolPathGCodes && findGCodeCommandOrLatestBaseOnLine(selectedGCodeLine,toolPathGCodes) != null && (
                            <SpatialPartition
                                points={processor.getGCodePoints(findGCodeCommandOrLatestBaseOnLine(selectedGCodeLine,toolPathGCodes)!).points}
                                color={new Color(0x0000ff)}
                                lineWidth={5}/>
                        )}
                    </>
                    )}

                {/* Add your CNC visualization components here */}
            </Canvas>
        </div>
    );
};