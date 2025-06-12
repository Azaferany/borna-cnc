// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export enum Plane {
    XY = 0,
    XZ = 1,
    YZ = 2
}

export type BufferType =
    | "GCodeFile"
    | "GCodeFileInReverse";

export interface GCodeOffsets {
    G28: Point3D6Axis;
    G30: Point3D6Axis;
    G54: Point3D6Axis;
    G55: Point3D6Axis;
    G56: Point3D6Axis;
    G57: Point3D6Axis;
    G58: Point3D6Axis;
    G59: Point3D6Axis;
    G92: Point3D6Axis;
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
    | "Jog"
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
    commandCode:string;
    commandCodeNumber:number;
    commandCodeType: "G" | "M" | "T";
    activeWorkSpace: keyof GCodeOffsets

    startPoint: Omit<Point3D6Axis,"a"|"b"|"c"> & {a:number,b:number,c:number};
    endPoint?: Omit<Point3D6Axis,"a"|"b"|"c"> & {a:number,b:number,c:number};

    arcCenter?: Point3D;
    activeMCodes: string[]
    feedRate: number;
    spindleSpeed: number;
    isRapidMove?: boolean;
    isArcMove?: boolean;
    isClockwise?: boolean;
    isIncremental?: boolean;
    isInches?: boolean;
    activePlane?: Plane;
    dwellTime?: number;
    hasMove: boolean;
}

export interface GCodePointData {
    feedMovePoints: {gCodeLineNumber : number , points :Point3D[]}[][];
    rapidMovePoints: {gCodeLineNumber : number , points :Point3D[]}[][];
    arkMovePoints: {gCodeLineNumber : number , points :Point3D[]}[][];
    feedMoveStartPoints: {gCodeLineNumber : number , point :Point3D}[][];
    rapidMoveStartPoints: {gCodeLineNumber : number , point :Point3D}[][];
    arkMoveStartPoints: {gCodeLineNumber : number , point :Point3D}[][];

}