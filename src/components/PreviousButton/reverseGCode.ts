import {type GCodeCommand, Plane, type Point3D6Axis} from "../../types/GCodeTypes.ts";
import {Vector3} from 'three';

export function intersectLineCircle(
    start: { x: number; y: number; z: number },
    end: { x: number; y: number; z: number },
    center: { x: number; y: number; z: number },
    radius: number,
    plane: Plane
): Array<{ x: number; y: number; z: number }> {
    // Helper: project 3D point to 2D based on plane
    const project = (p: { x: number; y: number; z: number }) => {
        switch (plane) {
            case Plane.XY: return { u: p.x, v: p.y };
            case Plane.YZ: return { u: p.y, v: p.z };
            case Plane.XZ: return { u: p.z, v: p.x };
        }
    };
    // Reconstruct 3D from 2D + fixed coordinate
    const reconstruct = (uv: { u: number; v: number }): { x: number; y: number; z: number } => {
        switch (plane) {
            case Plane.XY: return { x: uv.u, y: uv.v, z: center.z };
            case Plane.YZ: return { x: center.x, y: uv.u, z: uv.v };
            case Plane.XZ: return { x: uv.v, y: center.y, z: uv.u };
        }
    };

    // Project points
    const p0 = project(start);
    const p1 = project(end);
    const pc = project(center);

    // Direction vector in 2D
    const du = p1.u - p0.u;
    const dv = p1.v - p0.v;

    // Quadratic coefficients: |(p0 + t*d) - pc|^2 = r^2
    const a = du * du + dv * dv;
    const b = 2 * (du * (p0.u - pc.u) + dv * (p0.v - pc.v));
    const c = (p0.u - pc.u) * (p0.u - pc.u) + (p0.v - pc.v) * (p0.v - pc.v) - radius * radius;

    const disc = b * b - 4 * a * c;
    if (disc < 0) return [];

    const t1 = (-b + Math.sqrt(disc)) / (2 * a);
    const t2 = (-b - Math.sqrt(disc)) / (2 * a);

    const pts: Array<{ x: number; y: number; z: number }> = [];
    [t1, t2].forEach(t => {
        // For infinite line; if clipping to segment, uncomment next line
        // if (t < 0 || t > 1) return;
        const uv = { u: p0.u + t * du, v: p0.v + t * dv };
        pts.push(reconstruct(uv));
    });

    // If both roots equal, only one intersection
    if (disc === 0) pts.pop();

    return pts;
}

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

                // Check if actual end point is close to expected end point
                if (endPoint.distanceTo(centerPoint) - radius !=0) {
                    // Find intersection point between circle and line
                    const intersectionPoint = intersectLineCircle(centerPoint,endPoint,centerPoint,radius,curentGCodeCommand.activePlane!)

                    console.warn(intersectionPoint);
                    console.warn(currentPos);
                    reversedCode.push(`G1 X${ intersectionPoint[0].x.toFixed(3)} Y${intersectionPoint[0].y.toFixed(3)} Z${intersectionPoint[0].z.toFixed(3)} F${curentGCodeCommand.feedRate}`)
                    console.warn(reversedCode)
                }

            }


            if(curentGCodeCommand.activePlane == Plane.XY) {

                const newI = (curentGCodeCommand.arcCenter!.x - curentGCodeCommand.endPoint!.x!).toFixed(6)
                const newJ = (curentGCodeCommand.arcCenter!.y - curentGCodeCommand.endPoint!.y!).toFixed(6)
                reversedGCodeCode += ` I${newI} J${newJ}`
            }
            else if(curentGCodeCommand.activePlane == Plane.YZ) {
                const newJ = curentGCodeCommand.arcCenter!.y - curentGCodeCommand.endPoint!.y!
                const newK = curentGCodeCommand.arcCenter!.z - curentGCodeCommand.endPoint!.z!

                reversedGCodeCode += ` K${newK} J${newJ}`
            }
            else if(curentGCodeCommand.activePlane == Plane.XZ) {
                const newI = curentGCodeCommand.arcCenter!.x - curentGCodeCommand.endPoint!.x!
                const newK = curentGCodeCommand.arcCenter!.z - curentGCodeCommand.endPoint!.z!

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
    console.warn(reversedCode[0])
    return reversedCode;
}
