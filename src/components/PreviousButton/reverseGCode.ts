import {type GCodeCommand, type GCodeOffsets, Plane, type Point3D6Axis} from "../../types/GCodeTypes.ts";
import {Vector3} from 'three';
import {determineHelixPointOrder, intersectSphereHelix} from "../../app/intersectSphereHelix.ts";
export function reverseGCode(
    toolPathsOrg: GCodeCommand[],
    currentLine: number,
    currentPos:Point3D6Axis,
    offsets: GCodeOffsets): string[] {
    const reversedCode:string[]= [];

    const toolPaths = [...toolPathsOrg.filter(x => x.hasMove)]

    // Get the active workspace offset

    const IsXChanges = !!toolPaths.find(g=>g?.endPoint?.x !== g.startPoint.x);
    const IsYChanges = !!toolPaths.find(g=>g?.endPoint?.y !== g.startPoint.y);
    const IsZChanges = !!toolPaths.find(g=>g?.endPoint?.z !== g.startPoint.z);
    const IsAChanges = !!toolPaths.find(g=>(g?.endPoint?.a ?? 0) !== g.startPoint.a);
    const IsBChanges = !!toolPaths.find(g=>(g?.endPoint?.b ?? 0) !== g.startPoint.b);
    const IsCChanges = !!toolPaths.find(g=>(g?.endPoint?.c ?? 0) !== g.startPoint.c);
    for (let i = currentLine; i >= 1; i--) {
        let curentGCodeCommand = toolPaths.find(x=>x.lineNumber == i)!

        if(!curentGCodeCommand) {
            continue;
        }
        const activeOffset = offsets[curentGCodeCommand.activeWorkSpace];
        let reversedGCodeCode = curentGCodeCommand.commandCode;

        if (curentGCodeCommand.commandCode == "G28" || curentGCodeCommand.commandCode == "G30") {
            reversedGCodeCode = "G0"
        }


        if (curentGCodeCommand.commandCode == "G2") {
            reversedGCodeCode = "G3"
        }
        if (curentGCodeCommand.commandCode == "G3") {
            reversedGCodeCode = "G2"
        }


        reversedGCodeCode = `N${curentGCodeCommand.lineNumber} ${reversedGCodeCode}`

        if (curentGCodeCommand.commandCode == "G3" || curentGCodeCommand.commandCode == "G2") {

            if (curentGCodeCommand?.lineNumber == currentLine) {
                curentGCodeCommand =
                    {
                        ...curentGCodeCommand,
                        endPoint: {
                            ...currentPos,
                            a: currentPos.a ?? curentGCodeCommand.endPoint?.a ?? 0,
                            b: currentPos.b ?? curentGCodeCommand.endPoint?.b ?? 0,
                            c: currentPos.c ?? curentGCodeCommand.endPoint?.c ?? 0,
                        },
                    }

                const startPoint = new Vector3(curentGCodeCommand.startPoint.x, curentGCodeCommand.startPoint.y, curentGCodeCommand.startPoint.z);
                const endPoint = new Vector3(curentGCodeCommand.endPoint!.x, curentGCodeCommand.endPoint!.y, curentGCodeCommand.endPoint!.z);
                const centerPoint = new Vector3(curentGCodeCommand.arcCenter!.x, curentGCodeCommand.arcCenter!.y, curentGCodeCommand.arcCenter!.z);

                const radius = startPoint.distanceTo(centerPoint);

                if (endPoint.distanceTo(centerPoint) - radius != 0) {
                    let pitch = 0;
                    if (curentGCodeCommand.activePlane == Plane.XY) {

                        pitch = Math.abs(curentGCodeCommand.startPoint.z - curentGCodeCommand.endPoint!.z);
                    } else if (curentGCodeCommand.activePlane == Plane.YZ) {

                        pitch = Math.abs(curentGCodeCommand.startPoint.x - curentGCodeCommand.endPoint!.x);

                    } else if (curentGCodeCommand.activePlane == Plane.XZ) {
                        pitch = Math.abs(curentGCodeCommand.startPoint.y - curentGCodeCommand.endPoint!.y);

                    }

                    let sphereRadius = 1;
                    let intersectionPoints = intersectSphereHelix(currentPos, sphereRadius, centerPoint, radius, pitch, curentGCodeCommand.activePlane ?? Plane.XY, curentGCodeCommand.isClockwise ?? true)
                    while (intersectionPoints.length == 0 && sphereRadius < pitch) {
                        sphereRadius = sphereRadius + 1;
                        intersectionPoints = intersectSphereHelix(currentPos, sphereRadius, centerPoint, radius, pitch, curentGCodeCommand.activePlane ?? Plane.XY, curentGCodeCommand.isClockwise ?? true)
                    }

                    const intersectionPointIndex = determineHelixPointOrder(radius, centerPoint, curentGCodeCommand.activePlane ?? Plane.XY, curentGCodeCommand.isClockwise ?? true, pitch, intersectionPoints[0]!, intersectionPoints[1]!)
                    const intersectionPoint = intersectionPoints[intersectionPointIndex - 1];

                    reversedCode.push(`G1 X${((intersectionPoint?.x ?? 0) - (activeOffset?.x ?? 0)).toFixed(3)} Y${((intersectionPoint?.y ?? 0) - (activeOffset?.y ?? 0)).toFixed(3)} Z${((intersectionPoint?.z ?? 0) - (activeOffset?.z ?? 0)).toFixed(3)} F${curentGCodeCommand.feedRate}`)

                    curentGCodeCommand =
                        {
                            ...curentGCodeCommand,
                            endPoint: {...curentGCodeCommand.endPoint!, ...intersectionPoint},

                        }
                }

            }


            if (curentGCodeCommand.activePlane == Plane.XY) {

                const newI = curentGCodeCommand.arcCenter!.x - curentGCodeCommand.endPoint!.x!
                const newJ = curentGCodeCommand.arcCenter!.y - curentGCodeCommand.endPoint!.y!
                reversedCode.push("G17")

                reversedGCodeCode += ` I${newI} J${newJ}`
            } else if (curentGCodeCommand.activePlane == Plane.YZ) {

                const newJ = curentGCodeCommand.arcCenter!.y - curentGCodeCommand.endPoint!.y!
                const newK = curentGCodeCommand.arcCenter!.z - curentGCodeCommand.endPoint!.z!
                reversedCode.push("G19")

                reversedGCodeCode += ` K${newK} J${newJ}`
            } else if (curentGCodeCommand.activePlane == Plane.XZ) {
                const newI = curentGCodeCommand.arcCenter!.x - curentGCodeCommand.endPoint!.x!
                const newK = curentGCodeCommand.arcCenter!.z - curentGCodeCommand.endPoint!.z!
                reversedCode.push("G18")

                reversedGCodeCode += ` I${newI} K${newK}`
            }


        }
        if (IsXChanges)
            reversedGCodeCode += ` X${curentGCodeCommand.startPoint.x - (activeOffset?.x ?? 0)}`

        if (IsYChanges)
            reversedGCodeCode += ` Y${curentGCodeCommand.startPoint.y - (activeOffset?.y ?? 0)}`

        if (IsZChanges)
            reversedGCodeCode += ` Z${curentGCodeCommand.startPoint.z - (activeOffset?.z ?? 0)}`

        if (IsAChanges)
            reversedGCodeCode += ` A${curentGCodeCommand.startPoint.a - (activeOffset?.a ?? 0)}`

        if (IsBChanges)
            reversedGCodeCode += ` B${curentGCodeCommand.startPoint.b - (activeOffset?.b ?? 0)}`

        if (IsCChanges)
            reversedGCodeCode += ` C${curentGCodeCommand.startPoint.c - (activeOffset?.c ?? 0)}`

        reversedGCodeCode += ` F${curentGCodeCommand.feedRate}`

        reversedCode.push(reversedGCodeCode)




    }
    return reversedCode;
}
