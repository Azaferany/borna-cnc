import {type ArcIJk, type GCodeCommand, Plane, type Point3D6Axis} from "../../types/GCodeTypes.ts";
import {findGCodeCommandOrLatestBaseOnLine} from "../../app/findGCodeCommandOrLatestBaseOnLine.ts";

function parseArkGCode(gcode: string): ArcIJk {
    const result: ArcIJk = {};

    // Normalize spacing and uppercase
    const parts = gcode.toUpperCase().trim().split(/\s+/);

    for (const part of parts) {
        const prefix = part[0];
        const value = parseFloat(part.slice(1));

        if (!isNaN(value)) {
            if (prefix === 'I') result.i = value;
            else if (prefix === 'J') result.j = value;
            else if (prefix === 'K') result.k = value;
        }
    }

    return result;
}


export function reverseGCode(
    toolPathsOrg: GCodeCommand[],
    currentLine: number,
    currentPos:Point3D6Axis
): string[] {
    const reversedCode:string[]= [];

    const toolPaths = [...toolPathsOrg]

    if(findGCodeCommandOrLatestBaseOnLine(currentLine,toolPaths)?.lineNumber == currentLine){
        const i = toolPaths.findIndex(x=>x.lineNumber == currentLine);
        toolPaths[i] =
            {
                ...toolPaths[i],
                endPoint:{...currentPos},
                endA:currentPos.a,
                endB:currentPos.b,
                endC: currentPos.c
            }
    }

    const IsXChanges = !!toolPaths.find(g=>g?.endPoint?.x !== g.startPoint.x);
    const IsYChanges = !!toolPaths.find(g=>g?.endPoint?.y !== g.startPoint.y);
    const IsZChanges = !!toolPaths.find(g=>g?.endPoint?.z !== g.startPoint.z);
    const IsAChanges = !!toolPaths.find(g=>(g?.endA ?? 0) !== g.startA);
    const IsBChanges = !!toolPaths.find(g=>(g?.endB ?? 0) !== g.startB);
    const IsCChanges = !!toolPaths.find(g=>(g?.endC ?? 0) !== g.startC);
    for (let i = currentLine; i >= 1; i--) {
        const curentGCodeCommand = toolPaths.find(x=>x.lineNumber == i)
        if(!curentGCodeCommand) {
            continue;
        }


        let reversedGCodeCode = curentGCodeCommand.commandCode;

        if(curentGCodeCommand.commandCode == "G2") {reversedGCodeCode = "G3"}
        if(curentGCodeCommand.commandCode == "G3") {reversedGCodeCode = "G2"}


        reversedGCodeCode = `N${curentGCodeCommand.lineNumber} ${reversedGCodeCode}`

        if(curentGCodeCommand.commandCode == "G3" || curentGCodeCommand.commandCode =="G2") {
            const curentArcIJk =parseArkGCode(curentGCodeCommand.rawCommand)
            if(curentGCodeCommand.activePlane == Plane.XY) {

                const newI = curentGCodeCommand.startPoint.x + curentArcIJk.i! - curentGCodeCommand.endPoint!.x!
                const newJ = curentGCodeCommand.startPoint.y + curentArcIJk.j! - curentGCodeCommand.endPoint!.y!
                reversedGCodeCode += ` I${newI} J${newJ}`
            }
            else if(curentGCodeCommand.activePlane == Plane.YZ) {
                const newJ = curentGCodeCommand.startPoint.y + curentArcIJk.j! - curentGCodeCommand.endPoint!.y!
                const newK = curentGCodeCommand.startPoint.z + curentArcIJk.k! - curentGCodeCommand.endPoint!.z!

                reversedGCodeCode += ` K${newK} J${newJ}`
            }
            else if(curentGCodeCommand.activePlane == Plane.XZ) {
                const newI = curentGCodeCommand.startPoint.x + curentArcIJk.i! - curentGCodeCommand.endPoint!.x!
                const newK = curentGCodeCommand.startPoint.z + curentArcIJk.k! - curentGCodeCommand.endPoint!.z!

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
