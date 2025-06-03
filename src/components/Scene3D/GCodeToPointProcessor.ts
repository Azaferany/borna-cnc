import {Euler, Matrix4, Vector3} from 'three';
import {type GCodeCommand, type GCodePointData, Plane, type Point3D} from "../../types/GCodeTypes.ts";

class GCodeToPointProcessor {


    private mergePointData(target: GCodePointData, source: GCodePointData): void {
        // Helper function to get last GCode line number from a point array
        const getLastGCodeLineNumber = (points: {gCodeLineNumber: number, points: Point3D[]}[][]) => {
            if (!points.length || !points[0].length) return 0;
            return points[points.length - 1][points[points.length - 1].length - 1]?.gCodeLineNumber ?? 0;
        };

        // Get last GCode line numbers for each type of move
        const lastFeedMoveGCodeLineNumber = getLastGCodeLineNumber(target.feedMovePoints);
        const lastRapidMoveGCodeLineNumber = getLastGCodeLineNumber(target.rapidMovePoints);
        const lastArkMoveGCodeLineNumber = getLastGCodeLineNumber(target.arkMovePoints);

        // Handle feed moves
        if (source.feedMovePoints.length > 0) {
            const isLastGCodeIsFeedMove = Math.max(
                lastFeedMoveGCodeLineNumber,
                lastRapidMoveGCodeLineNumber,
                lastArkMoveGCodeLineNumber
            ) === lastFeedMoveGCodeLineNumber;

            // Only merge if it's the same type of move AND the line numbers are the same
            if (isLastGCodeIsFeedMove && target.feedMovePoints.length > 0) {
                // Merge with last feed move
                const lastTargetGroup = target.feedMovePoints[target.feedMovePoints.length - 1];
                const sourceGroup = source.feedMovePoints[0];
                lastTargetGroup.push(...sourceGroup);
                
                const lastTargetStartGroup = target.feedMoveStartPoints[target.feedMoveStartPoints.length - 1];
                const sourceStartGroup = source.feedMoveStartPoints[0];
                lastTargetStartGroup.push(...sourceStartGroup);
            } else {
                // Add as new group
                target.feedMovePoints.push(source.feedMovePoints[0]);
                target.feedMoveStartPoints.push(source.feedMoveStartPoints[0]);
            }
        }

        // Handle rapid moves
        if (source.rapidMovePoints.length > 0) {
            const isLastGCodeIsRapidMove = Math.max(
                lastFeedMoveGCodeLineNumber,
                lastRapidMoveGCodeLineNumber,
                lastArkMoveGCodeLineNumber
            ) === lastRapidMoveGCodeLineNumber;

            // Only merge if it's the same type of move AND the line numbers are the same
            if (isLastGCodeIsRapidMove && target.rapidMovePoints.length > 0) {
                // Merge with last rapid move
                const lastTargetGroup = target.rapidMovePoints[target.rapidMovePoints.length - 1];
                const sourceGroup = source.rapidMovePoints[0];
                lastTargetGroup.push(...sourceGroup);
                
                const lastTargetStartGroup = target.rapidMoveStartPoints[target.rapidMoveStartPoints.length - 1];
                const sourceStartGroup = source.rapidMoveStartPoints[0];
                lastTargetStartGroup.push(...sourceStartGroup);
            } else {
                // Add as new group
                target.rapidMovePoints.push(source.rapidMovePoints[0]);
                target.rapidMoveStartPoints.push(source.rapidMoveStartPoints[0]);
            }
        }

        // Handle arc moves
        if (source.arkMovePoints.length > 0) {
            const isLastGCodeIsArkMove = Math.max(
                lastFeedMoveGCodeLineNumber,
                lastRapidMoveGCodeLineNumber,
                lastArkMoveGCodeLineNumber
            ) === lastArkMoveGCodeLineNumber;

            // Only merge if it's the same type of move AND the line numbers are the same
            if (isLastGCodeIsArkMove && target.arkMovePoints.length > 0) {
                // Merge with last arc move
                const lastTargetGroup = target.arkMovePoints[target.arkMovePoints.length - 1];
                const sourceGroup = source.arkMovePoints[0];
                lastTargetGroup.push(...sourceGroup);
                
                const lastTargetStartGroup = target.arkMoveStartPoints[target.arkMoveStartPoints.length - 1];
                const sourceStartGroup = source.arkMoveStartPoints[0];
                lastTargetStartGroup.push(...sourceStartGroup);
            } else {
                // Add as new group
                target.arkMovePoints.push(source.arkMovePoints[0]);
                target.arkMoveStartPoints.push(source.arkMoveStartPoints[0]);
            }
        }
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
            data.arkMoveStartPoints.push([{gCodeLineNumber:command.lineNumber,point:arkPoints[0]}]);
            data.arkMovePoints.push([{gCodeLineNumber:command.lineNumber,points:arkPoints}]);

            return {
                ...data,
                points:arkPoints
            }

        } else if (command.isRapidMove) {
            data.rapidMovePoints.push([{gCodeLineNumber:command.lineNumber,points:[rotatedStart, rotatedEnd]}]);
            data.rapidMoveStartPoints.push([{gCodeLineNumber:command.lineNumber,point:rotatedStart}]);

            return {
                ...data,
                points:[rotatedStart, rotatedEnd]
            }
        } else {
            data.feedMovePoints.push([{gCodeLineNumber:command.lineNumber,points:[rotatedStart, rotatedEnd]}]);
            data.feedMoveStartPoints.push([{gCodeLineNumber:command.lineNumber,point:rotatedStart}]);
            return {
                ...data,
                points:[rotatedStart, rotatedEnd]
            }
        }
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
                        x: center.x + radius * Math.sin(angle),
                        y: start.y + (end.y - start.y) * fraction,
                        z: center.z + radius * Math.cos(angle)
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
}

// Set up worker message handler
export const processor = new GCodeToPointProcessor();

// Use addEventListener instead of self.onmessage
