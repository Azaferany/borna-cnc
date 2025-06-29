import {PlayIcon} from '@heroicons/react/24/solid';
import {useTranslation} from 'react-i18next';
import {useStore} from "../../app/store.ts";
import {useGCodeBufferContext} from "../../app/GCodeBufferContext.ts";
import {useGRBL} from "../../app/useGRBL.ts";
import {useState} from 'react';
import {findGCodeCommandOrLatestBaseOnLine} from "../../app/findGCodeCommandOrLatestBaseOnLine.ts";
import {Vector3} from "three";
import {Plane} from "../../types/GCodeTypes.ts";
import {determineHelixPointOrder, intersectSphereHelix} from "../../app/intersectSphereHelix.ts";
import {useShallow} from "zustand/react/shallow";

export const ContinueFromHereButton = () => {
    const {t} = useTranslation();
    const { isSending, bufferType, startSending, stopSending } = useGCodeBufferContext();
    const { sendCommand } = useGRBL();
    const allGCodes = useStore(useShallow(s => s.allGCodes));
    const status = useStore(s => s.status);
    const selectedGCodeLine = useStore(s => s.selectedGCodeLine);
    const machineCoordinate = useStore(useShallow(s => s.machineCoordinate));
    const toolPathGCodes = useStore(useShallow(s => s.toolPathGCodes));
    const gCodeOffsets = useStore(useShallow(s => s.gCodeOffsets));

    const [error, setError] = useState<string | null>(null);

    const handleCommand = async (command: string) => {
        try {
            console.log('Sending command:', command);
            await sendCommand(command);
        } catch (error) {
            console.error('Error sending command:', error);
            stopSending();
            setError(t('continueFromHere.commandError'));
        }
    };

    const handleContinueFromHere = async () => {
        if (status === "Hold" && bufferType === "GCodeFileInReverse" && isSending && (allGCodes?.length ?? 0) > 0) {
            try {
                setError(null);
                const gCodeLines = [...(allGCodes ?? [])].slice((selectedGCodeLine ?? 0)-1)
                const currentGCodeCommand =
                    findGCodeCommandOrLatestBaseOnLine(selectedGCodeLine ?? 0, toolPathGCodes ?? [])!
                const activeOffset = gCodeOffsets[currentGCodeCommand.activeWorkSpace];

                if (currentGCodeCommand?.isArcMove) {

                    let curentGCodeCommand =
                        {
                            ...currentGCodeCommand,
                            endPoint:{...machineCoordinate},
                            endA:machineCoordinate.a,
                            endB:machineCoordinate.b,
                            endC: machineCoordinate.c
                        }


                    const startPoint = new Vector3(curentGCodeCommand.startPoint.x, curentGCodeCommand.startPoint.y, curentGCodeCommand.startPoint.z);
                    const endPoint = new Vector3(curentGCodeCommand.endPoint!.x, curentGCodeCommand.endPoint!.y, curentGCodeCommand.endPoint!.z);
                    const centerPoint = new Vector3(curentGCodeCommand.arcCenter!.x, curentGCodeCommand.arcCenter!.y, curentGCodeCommand.arcCenter!.z);

                    const radius = startPoint.distanceTo(centerPoint);


                    if (endPoint.distanceTo(centerPoint) - radius != 0) {
                        let pitch = 0 ;
                        if(curentGCodeCommand.activePlane == Plane.XY) {

                            pitch = Math.abs(curentGCodeCommand.startPoint.z - curentGCodeCommand.endPoint!.z);
                        }
                        else if(curentGCodeCommand.activePlane == Plane.YZ) {

                            pitch = Math.abs(curentGCodeCommand.startPoint.x - curentGCodeCommand.endPoint!.x);

                        }
                        else if(curentGCodeCommand.activePlane == Plane.XZ) {
                            pitch = Math.abs(curentGCodeCommand.startPoint.y - curentGCodeCommand.endPoint!.y);

                        }
                        let sphereRadius = 1;
                        let intersectionPoints = intersectSphereHelix(machineCoordinate,sphereRadius,centerPoint,radius,pitch,curentGCodeCommand.activePlane ?? Plane.XY,curentGCodeCommand.isClockwise ?? true )
                        while (intersectionPoints.length == 0 && sphereRadius < pitch)
                        {
                            sphereRadius = sphereRadius + 1;
                            intersectionPoints = intersectSphereHelix(machineCoordinate,sphereRadius,centerPoint,radius,pitch,curentGCodeCommand.activePlane ?? Plane.XY,curentGCodeCommand.isClockwise ?? true )
                        }
                        const intersectionPointIndex = determineHelixPointOrder(radius,centerPoint,curentGCodeCommand.activePlane ?? Plane.XY,curentGCodeCommand.isClockwise ?? true,pitch,intersectionPoints[0]!,intersectionPoints[1]! )
                        const intersectionPoint = intersectionPoints.slice().reverse()[intersectionPointIndex - 1];

                        curentGCodeCommand = {
                            ...curentGCodeCommand,
                            endPoint:{...intersectionPoint}
                        }

                        const newI = currentGCodeCommand.arcCenter!.x - curentGCodeCommand.endPoint.x
                        const newJ = currentGCodeCommand.arcCenter!.y - curentGCodeCommand.endPoint.y
                        const newK = currentGCodeCommand.arcCenter!.z - curentGCodeCommand.endPoint.z


                        // Update the raw command with new I, J, K values
                        const updatedCommand = currentGCodeCommand.rawCommand
                            .replace(/X[-\d.]+/, `X${currentGCodeCommand.endPoint!.x - (activeOffset?.x ?? 0)}`)
                            .replace(/Y[-\d.]+/, `Y${currentGCodeCommand.endPoint!.y - (activeOffset?.y ?? 0)}`)
                            .replace(/Z[-\d.]+/, `Z${currentGCodeCommand.endPoint!.z - (activeOffset?.z ?? 0)}`)
                            .replace(/I[-\d.]+/, `I${newI.toFixed(3)}`)
                            .replace(/J[-\d.]+/, `J${newJ.toFixed(3)}`)
                            .replace(/K[-\d.]+/, `K${newK.toFixed(3)}`);

                        gCodeLines[0] = `${updatedCommand}`;


                        gCodeLines.unshift(`G1 X${((intersectionPoint?.x ?? 0) - (activeOffset?.x ?? 0)).toFixed(3)} Y${((intersectionPoint?.y ?? 0) - (activeOffset?.y ?? 0)).toFixed(3)} Z${((intersectionPoint?.z ?? 0 - (activeOffset?.z ?? 0))).toFixed(3)} F${curentGCodeCommand.feedRate}`)

                    }
                    else {
                        const newI = currentGCodeCommand.arcCenter!.x - curentGCodeCommand.endPoint.x
                        const newJ = currentGCodeCommand.arcCenter!.y - curentGCodeCommand.endPoint.y
                        const newK = currentGCodeCommand.arcCenter!.z - curentGCodeCommand.endPoint.z


                        // Update the raw command with new I, J, K values
                        const updatedCommand = currentGCodeCommand.rawCommand
                            .replace(/X[-\d.]+/, `X${currentGCodeCommand.endPoint!.x - (activeOffset?.x ?? 0)}`)
                            .replace(/Y[-\d.]+/, `Y${currentGCodeCommand.endPoint!.y - (activeOffset?.y ?? 0)}`)
                            .replace(/Z[-\d.]+/, `Z${currentGCodeCommand.endPoint!.z - (activeOffset?.z ?? 0)}`)
                            .replace(/I[-\d.]+/, `I${newI.toFixed(3)}`)
                            .replace(/J[-\d.]+/, `J${newJ.toFixed(3)}`)
                            .replace(/K[-\d.]+/, `K${newK.toFixed(3)}`);

                        gCodeLines[0] = `${updatedCommand}`;
                    }
                }
                //set feedRate
                if (!gCodeLines[0].includes('F')) {
                    gCodeLines[0] = `${gCodeLines[0]} F${currentGCodeCommand.feedRate}`;
                }

                gCodeLines.unshift(currentGCodeCommand.isIncremental ? "G91" : "G90")
                gCodeLines.unshift(currentGCodeCommand.isInches ? "G20" : "G21")

                if (currentGCodeCommand.activePlane == Plane.XY) {

                    gCodeLines.unshift("G17")
                } else if (currentGCodeCommand.activePlane == Plane.YZ) {

                    gCodeLines.unshift("G19")

                } else if (currentGCodeCommand.activePlane == Plane.XZ) {
                    gCodeLines.unshift("G18")
                }
                gCodeLines.unshift(currentGCodeCommand.activeWorkSpace)
                console.log(currentGCodeCommand)
                for (let i = 0; i < currentGCodeCommand.activeMCodes.length; i++) {
                    const mCode = currentGCodeCommand.activeMCodes.slice().reverse()[i];
                    if (i === 0 && (mCode.includes("M3") || mCode.includes("M4"))) {
                        if (/s\d+/i.test(mCode)) {
                            // If s part exists, replace it
                            gCodeLines.unshift(mCode.replace(/s\d+/i, `s${currentGCodeCommand.spindleSpeed}`));
                            
                        } else {
                            // If s part doesn't exist, add it at the end
                            gCodeLines.unshift(`${mCode} s${currentGCodeCommand.spindleSpeed}`);


                        }
                    } else {
                        gCodeLines.unshift(currentGCodeCommand.activeMCodes[i])


                    }
                }
                await handleCommand('\x18'); // Soft reset
                stopSending();
                console.log(gCodeLines)
                startSending(gCodeLines ?? [],"GCodeFile");


            } catch (err) {
                setError(err instanceof Error ? err.message : t('continueFromHere.startError'));
                console.error('Error starting reversed G-code send:', err);
                stopSending();
            }
        }
    };

    return (
        <div className="relative group flex flex-col gap-2">
            <button
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-900
                p-3 rounded flex flex-col items-center justify-center
                transition-all duration-150"
                onClick={handleContinueFromHere}
                aria-label={t('continueFromHere.ariaLabel')}
            >
                <PlayIcon className="h-6 w-6" />
                <span className="text-sm mt-1">{t('continueFromHere.buttonText')}</span>
            </button>

            {error && (
                <div className="absolute bottom-full mb-2 p-2 bg-red-100 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}; 