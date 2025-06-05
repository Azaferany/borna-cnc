// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export enum Plane {
    XY = 0,
    XZ = 1,
    YZ = 2
}


export interface Point3D {
    x: number;
    y: number;
    z: number;
}
export interface Point3D6Axis  {
    x: number;
    y: number;
    z: number;
    a?: number;
    b?: number;
    c?: number;
}
export type ArcIJk = {
    i?: number;
    j?: number;
    k?: number;
};
export type GRBLState =
    | "NotConnected"
    | "Idle"
    | "Run"
    | "Hold"
    | "Alarm"
    | "Home"
    | "Door";

export type CargoPricingType =
    | "Idele"
    | "BasedOnLegalFeeAgreement"
    | "BasedOnSuggestAgreement";

export interface GCodeCommand {
    lineNumber: number;
    rawCommand: string;
    commandCode?:string;

    startPoint: Point3D6Axis;
    endPoint?: Point3D6Axis;
    arcCenter?: Point3D6Axis;

    feedRate: number;
    isRapidMove?: boolean;
    isArcMove?: boolean;
    isClockwise?: boolean;
    isIncremental?: boolean;
    activePlane?: Plane;
}

export interface GCodePointData {
    feedMovePoints: {gCodeLineNumber : number , points :Point3D[]}[][];
    rapidMovePoints: {gCodeLineNumber : number , points :Point3D[]}[][];
    arkMovePoints: {gCodeLineNumber : number , points :Point3D[]}[][];
    feedMoveStartPoints: {gCodeLineNumber : number , point :Point3D}[][];
    rapidMoveStartPoints: {gCodeLineNumber : number , point :Point3D}[][];
    arkMoveStartPoints: {gCodeLineNumber : number , point :Point3D}[][];

}