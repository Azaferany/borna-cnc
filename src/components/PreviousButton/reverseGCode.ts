import {type GCodeCommand, Plane, type Point3D6Axis} from "../../types/GCodeTypes.ts";
import {Vector3} from 'three';
import {determineHelixPointOrder, intersectSphereHelix} from "../../app/intersectSphereHelix.ts";
export function reverseGCode(
    toolPathsOrg: GCodeCommand[],
    currentLine: number,
    currentPos:Point3D6Axis
): string[] {
    const reversedCode:string[]= [];

    const toolPaths = [...toolPathsOrg]


    const IsXChanges = !!toolPaths.find(g=>g?.endPoint?.x !== g.startPoint.x);
    const IsYChanges = !!toolPaths.find(g=>g?.endPoint?.y !== g.startPoint.y);
    const IsZChanges = !!toolPaths.find(g=>g?.endPoint?.z !== g.startPoint.z);
    const IsAChanges = !!toolPaths.find(g=>(g?.endA ?? 0) !== g.startA);
    const IsBChanges = !!toolPaths.find(g=>(g?.endB ?? 0) !== g.startB);
    const IsCChanges = !!toolPaths.find(g=>(g?.endC ?? 0) !== g.startC);
    for (let i = currentLine; i >= 1; i--) {
        let curentGCodeCommand = toolPaths.find(x=>x.lineNumber == i)

        if(!curentGCodeCommand) {
            continue;
        }


        let reversedGCodeCode = curentGCodeCommand.commandCode;

        if(curentGCodeCommand.commandCode == "G2") {reversedGCodeCode = "G3"}
        if(curentGCodeCommand.commandCode == "G3") {reversedGCodeCode = "G2"}


        reversedGCodeCode = `N${curentGCodeCommand.lineNumber} ${reversedGCodeCode}`

        if(curentGCodeCommand.commandCode == "G3" || curentGCodeCommand.commandCode =="G2") {

            if(curentGCodeCommand?.lineNumber == currentLine){
                curentGCodeCommand =
                    {
                        ...curentGCodeCommand,
                        endPoint:{...currentPos},
                        endA:currentPos.a,
                        endB:currentPos.b,
                        endC: currentPos.c
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
                    let intersectionPoints = intersectSphereHelix(currentPos,sphereRadius,centerPoint,radius,pitch,curentGCodeCommand.activePlane ?? Plane.XY,curentGCodeCommand.isClockwise ?? true )
                    while (intersectionPoints.length == 0 && sphereRadius < pitch)
                    {
                        sphereRadius = sphereRadius + 1;
                        intersectionPoints = intersectSphereHelix(currentPos,sphereRadius,centerPoint,radius,pitch,curentGCodeCommand.activePlane ?? Plane.XY,curentGCodeCommand.isClockwise ?? true )
                    }

                    const intersectionPointIndex = determineHelixPointOrder(radius,centerPoint,curentGCodeCommand.activePlane ?? Plane.XY,curentGCodeCommand.isClockwise ?? true,pitch,intersectionPoints[0]!,intersectionPoints[1]! )
                    const intersectionPoint = intersectionPoints[intersectionPointIndex - 1];


                    console.warn(endPoint.distanceTo(centerPoint) - radius);
                    console.warn(intersectionPoint);
                    console.warn(intersectSphereHelix(currentPos,5,centerPoint,radius,pitch,curentGCodeCommand.activePlane ?? Plane.XY,curentGCodeCommand.isClockwise ?? true ));
                    reversedCode.push(`G1 X${ intersectionPoint?.x?.toFixed(3)} Y${intersectionPoint?.y?.toFixed(3)} Z${intersectionPoint?.z?.toFixed(3)} F${curentGCodeCommand.feedRate}`)
                    console.warn(reversedCode)
                    curentGCodeCommand =
                        {
                            ...curentGCodeCommand,
                            endPoint:{...intersectionPoint},

                        }
                }

            }


            if(curentGCodeCommand.activePlane == Plane.XY) {

                const newI = curentGCodeCommand.arcCenter!.x - curentGCodeCommand.endPoint!.x!
                const newJ = curentGCodeCommand.arcCenter!.y - curentGCodeCommand.endPoint!.y!
                reversedCode.push("G17")

                reversedGCodeCode += ` I${newI} J${newJ}`
            }
            else if(curentGCodeCommand.activePlane == Plane.YZ) {

                const newJ = curentGCodeCommand.arcCenter!.y - curentGCodeCommand.endPoint!.y!
                const newK = curentGCodeCommand.arcCenter!.z - curentGCodeCommand.endPoint!.z!
                reversedCode.push("G19")

                reversedGCodeCode += ` K${newK} J${newJ}`
            }
            else if(curentGCodeCommand.activePlane == Plane.XZ) {
                const newI = curentGCodeCommand.arcCenter!.x - curentGCodeCommand.endPoint!.x!
                const newK = curentGCodeCommand.arcCenter!.z - curentGCodeCommand.endPoint!.z!
                reversedCode.push("G18")

                reversedGCodeCode += ` I${newI} K${newK}`
            }


        }
        if (IsXChanges)
            reversedGCodeCode +=` X${curentGCodeCommand.startPoint.x}`

        if (IsYChanges)
            reversedGCodeCode +=` Y${curentGCodeCommand.startPoint.y}`

        if (IsZChanges)
            reversedGCodeCode +=` Z${curentGCodeCommand.startPoint.z}`

        if (IsAChanges)
            reversedGCodeCode +=` A${curentGCodeCommand.startA}`

        if (IsBChanges)
            reversedGCodeCode +=` B${curentGCodeCommand.startB}`

        if (IsCChanges)
            reversedGCodeCode +=` C${curentGCodeCommand.startC}`

        reversedGCodeCode +=` F${curentGCodeCommand.feedRate}`

        reversedCode.push(reversedGCodeCode)




    }
    return reversedCode;
}
