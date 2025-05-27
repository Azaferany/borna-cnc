import {Euler, Matrix4, Vector3} from 'three';
import {type GCodeCommand, type GCodePointData, Plane, type Point3D} from "../../types/GCodeTypes.ts";

const CHUNK_SIZE = 500;

// Declare the worker context type

class GCodeToPointProcessor {

    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    private mergePointData(target: GCodePointData, source: GCodePointData): void {
        target.feedMovePoints.push(...source.feedMovePoints);
        target.rapidMovePoints.push(...source.rapidMovePoints);
        target.feedMoveStartPoints.push(...source.feedMoveStartPoints);
        target.rapidMoveStartPoints.push(...source.rapidMoveStartPoints);
        target.arkMoveStartPoints.push(...source.arkMoveStartPoints);
        target.arkMovePoints.push(...source.arkMovePoints);
    }

    public getGCodePoints(command : GCodeCommand) : GCodePointData & {points:Point3D[]} {
        const data: GCodePointData = {
            feedMovePoints: [],
            rapidMovePoints: [],
            feedMoveStartPoints: [],
            rapidMoveStartPoints: [],
            arkMovePoints: [],
            arkMoveStartPoints: [],
        };
        const startMatrix = new Matrix4().makeRotationFromEuler(
            new Euler(
                command.startA * Math.PI / 180,
                command.startB * Math.PI / 180,
                command.startC * Math.PI / 180,
                'XYZ'
            )
        );

        const endMatrix = new Matrix4().makeRotationFromEuler(
            new Euler(
                (command.endA ?? 0) * Math.PI / 180,
                (command.endB ?? 0) * Math.PI / 180,
                (command.endC ?? 0) * Math.PI / 180,
                'XYZ'
            )
        );

        const rotatedStart = this.applyRotation(command.startPoint, startMatrix);
        const rotatedEnd = this.applyRotation((command.endPoint ?? {x:0,y:0,z:0}), endMatrix);

        // Only skip if points are exactly the same
        if (!command.isArcMove && this.distanceSquared(rotatedStart, rotatedEnd) === 0) {
            return {
                ...data,
                points:[]
            }
        }

        if (command.isArcMove && command.arcCenter) {
            const arkPoints = this.addArcPoints(
                command.isClockwise ?? false,
                rotatedStart,
                rotatedEnd,
                command.arcCenter,
                command.activePlane ?? Plane.XY,
                startMatrix,
                endMatrix
            );
            data.arkMoveStartPoints.push({gCodeLineNumber:command.lineNumber,point:arkPoints[0]});
            data.arkMovePoints.push({gCodeLineNumber:command.lineNumber,points:arkPoints});

            return {
                ...data,
                points:arkPoints
            }

        } else if (command.isRapidMove) {
            data.rapidMovePoints.push({gCodeLineNumber:command.lineNumber,points:[rotatedStart, rotatedEnd]});
            data.rapidMoveStartPoints.push({gCodeLineNumber:command.lineNumber,point:rotatedStart});

            return {
                ...data,
                points:[rotatedStart, rotatedEnd]
            }
        } else {
            data.feedMovePoints.push({gCodeLineNumber:command.lineNumber,points:[rotatedStart, rotatedEnd]});
            data.feedMoveStartPoints.push({gCodeLineNumber:command.lineNumber,point:rotatedStart});
            return {
                ...data,
                points:[rotatedStart, rotatedEnd]
            }
        }
    }
    private processChunk(commands: GCodeCommand[]): GCodePointData {
        const result: GCodePointData = {
            feedMovePoints: [],
            rapidMovePoints: [],
            feedMoveStartPoints: [],
            rapidMoveStartPoints: [],
            arkMovePoints: [],
            arkMoveStartPoints: [],
        };

        for (const command of commands) {

            const data = this.getGCodePoints(command)

            this.mergePointData(result, data);
        }

        return result;
    }

    private applyRotation(point: Point3D, matrix: Matrix4): Point3D {
        const vector = new Vector3(point.x, point.y, point.z);
        vector.applyMatrix4(matrix);
        return { x: vector.x, y: vector.y, z: vector.z };
    }

    private distanceSquared(p1: Point3D, p2: Point3D): number {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dz = p2.z - p1.z;
        return dx * dx + dy * dy + dz * dz;
    }


    private addArcPoints(
        isClockwise: boolean,
        start: Point3D,
        end: Point3D,
        center: Point3D,
        plane: Plane,
        startRotation: Matrix4,
        endRotation: Matrix4
    ): Point3D[] {
        const segments = 100;
        const arcPoints = this.generateArcSegments(
            isClockwise,
            start,
            end,
            center,
            plane,
            segments,
            startRotation,
            endRotation
        );

        if (arcPoints && arcPoints.length >= 2) {
            return arcPoints;
        }
        return [];
    }

    private generateArcSegments(
        isClockwise: boolean,
        start: Point3D,
        end: Point3D,
        center: Point3D,
        plane: Plane,
        segments: number,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _startRotation: Matrix4,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _endRotation: Matrix4
    ): Point3D[] {
        if (!start || !end || !center || segments < 2) {
            return [];
        }

        const points: Point3D[] = [];
        let startAngle: number;
        let endAngle: number;
        let radius: number;

        switch (plane) {
            case Plane.XZ:
                startAngle = Math.atan2(start.z - center.z, start.x - center.x);
                endAngle = Math.atan2(end.z - center.z, end.x - center.x);
                radius = Math.sqrt(
                    Math.pow(start.x - center.x, 2) + Math.pow(start.z - center.z, 2)
                );
                break;
            case Plane.YZ:
                startAngle = Math.atan2(start.z - center.z, start.y - center.y);
                endAngle = Math.atan2(end.z - center.z, end.y - center.y);
                radius = Math.sqrt(
                    Math.pow(start.y - center.y, 2) + Math.pow(start.z - center.z, 2)
                );
                break;

            default:
                startAngle = Math.atan2(start.y - center.y, start.x - center.x);
                endAngle = Math.atan2(end.y - center.y, end.x - center.x);
                radius = Math.sqrt(
                    Math.pow(start.x - center.x, 2) + Math.pow(start.y - center.y, 2)
                );
                break;
        }

        if (radius < 1e-6) {
            return [];
        }

        let sweepAngle = endAngle - startAngle;
        if (isClockwise) {
            if (sweepAngle >= 0) sweepAngle -= 2 * Math.PI;
        } else {
            if (sweepAngle <= 0) sweepAngle += 2 * Math.PI;
        }

        points.push(start);

        for (let i = 1; i <= segments; i++) {
            const fraction = i / segments;
            const angle = startAngle + sweepAngle * fraction;
            let nextPoint: Point3D;

            switch (plane) {
                case Plane.XZ:
                    nextPoint = {
                        x: center.x + radius * Math.cos(angle),
                        y: start.y + (end.y - start.y) * fraction,
                        z: center.z + radius * Math.sin(angle)
                    };
                    break;
                case Plane.YZ:
                    nextPoint = {
                        x: start.x + (end.x - start.x) * fraction,
                        y: center.y + radius * Math.cos(angle),
                        z: center.z + radius * Math.sin(angle)
                    };
                    break;
                default:
                    nextPoint = {
                        x: center.x + radius * Math.cos(angle),
                        y: center.y + radius * Math.sin(angle),
                        z: start.z + (end.z - start.z) * fraction
                    };
                    break;
            }
            points.push(nextPoint);
        }

        return points;
    }

    processCommands(commands: GCodeCommand[]) {
        const chunks = this.chunkArray(commands, CHUNK_SIZE);

        const result: GCodePointData = {
            feedMovePoints: [],
            rapidMovePoints: [],
            feedMoveStartPoints: [],
            rapidMoveStartPoints: [],
            arkMovePoints: [],
            arkMoveStartPoints: [],
        };

        for (const chunk of chunks) {
            const chunkData = this.processChunk(chunk);
            this.mergePointData(result, chunkData);

        }

        return result;
    }
}

// Set up worker message handler
export const processor = new GCodeToPointProcessor();

// Use addEventListener instead of self.onmessage
