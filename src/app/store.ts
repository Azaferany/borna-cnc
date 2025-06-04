import {create} from "zustand/react";
import {type GCodeCommand, type GRBLState, Plane, type Point3D, type Point3D6Axis} from "../types/GCodeTypes.ts";
import GRBLSerial from "./GRBLSerial.ts";

export type BufferType =
    | "GCodeFile"
    | "GCodeFileInReverse";

export interface GCodeOffsets {
    G54: Point3D6Axis;
    G55: Point3D6Axis;
    G56: Point3D6Axis;
    G57: Point3D6Axis;
    G58: Point3D6Axis;
    G59: Point3D6Axis;
    G92: Point3D6Axis;
}

export interface ActiveModes {
    WorkCoordinateSystem: "G54" | "G55" | "G56" | "G57" | "G58"  | "G59";
    Plane: Plane;
    UnitsType: "millimeters" | "inches";
    PositioningMode: "Absolute" | "Relative";
}

interface CNCState {
    isConnected: boolean;
    setIsConnected: (isConnected: boolean) => void;

    eventSource?: GRBLSerial;

    isSending: boolean;
    bufferType?: BufferType,
    setIsSending: (isSending: boolean,bufferType?: BufferType) => void;

    toolPathGCodes?: GCodeCommand[]
    allGCodes?: string[]
    selectedGCodeLine?: number

    machineCoordinate: Point3D6Axis
    workPlaceCoordinateOffset: Point3D6Axis
    gCodeOffsets : GCodeOffsets
    activeModes?: ActiveModes
    feedrate: number
    status: GRBLState
    spindleSpeed: number
    feedrateOverridePercent: number,
    rapidSpeedOverridePercent: number,
    spindleSpeedOverridePercent: number,
    availableBufferSlots: number,

    loadToolPathGCodes: (allGCodes: string[],GCodes: GCodeCommand[]) => void
    selectGCodeLine: (line: number) => void

    updateStatus:(status: GRBLState) => void
    updateMachineCoordinate:(machineCoordinate: Point3D) => void
    updateWorkPlaceCoordinateOffset:(workPlaceCoordinateOffset: Point3D) => void
    updateFeedrate:(feedrate: number) => void
    updateSpindleSpeed:(spindleSpeed: number) => void
    updateFeedrateOverridePercent:(feedrateOverridePercent:number) =>void,
    updateRapidSpeedOverridePercent:(rapidSpeedOverridePercent:number) =>void,
    updateSpindleSpeedOverridePercent:(spindleSpeedOverridePercent:number) =>void,
    updateAvailableBufferSlots:(availableBufferSlots:number) =>void,
    updateGCodeOffsets:(gCodeOffsets:GCodeOffsets) =>void,
    updateActiveModes:(activeModes:ActiveModes) =>void,

    lastSentLine: number;
    updateLastSentLine: (line: number) => void;
}
export const useStore = create<CNCState>((set) => ({
    isConnected: false,
    setIsConnected(isConnected: boolean) {set({isConnected})},
    eventSource:new GRBLSerial(),

    isSending: false,
    bufferType: undefined,
    setIsSending(isSending: boolean,bufferType?:BufferType) {set({isSending,bufferType})},

    toolPathGCodes: [],
    allGCodes: [],
    selectedGCodeLine: undefined,
    machineCoordinate: {x: 0, y: 0, z: 0},
    gCodeOffsets:{
        G54:{x: 0, y: 0, z: 0},
        G55:{x: 0, y: 0, z: 0},
        G56:{x: 0, y: 0, z: 0},
        G57:{x: 0, y: 0, z: 0},
        G58:{x: 0, y: 0, z: 0},
        G59:{x: 0, y: 0, z: 0},
        G92:{x: 0, y: 0, z: 0},
    },
    workPlaceCoordinateOffset: {x: 0, y: 0, z: 0},
    activeModes:undefined,
    feedrate: 0,
    status: "NotConnected",
    spindleSpeed: 0,
    feedrateOverridePercent: 100,
    rapidSpeedOverridePercent: 100,
    spindleSpeedOverridePercent: 100,
    availableBufferSlots : 15,

    lastSentLine: -1,

    loadToolPathGCodes: (allGCodes,toolPathGCodes,) => set({ toolPathGCodes, allGCodes }),
    selectGCodeLine: (line) => set({ selectedGCodeLine: line }),
    updateStatus:(status: GRBLState) =>set({ status }),
    updateMachineCoordinate:(machineCoordinate) =>set({ machineCoordinate }),
    updateWorkPlaceCoordinateOffset:(workPlaceCoordinateOffset) =>set({ workPlaceCoordinateOffset }),
    updateFeedrate:(feedrate) =>set({ feedrate }),
    updateSpindleSpeed:(spindleSpeed) =>set({ spindleSpeed }),
    updateFeedrateOverridePercent:(feedrateOverridePercent) =>set({ feedrateOverridePercent }),
    updateRapidSpeedOverridePercent:(rapidSpeedOverridePercent) =>set({ rapidSpeedOverridePercent }),
    updateSpindleSpeedOverridePercent:(spindleSpeedOverridePercent) =>set({ spindleSpeedOverridePercent }),
    updateAvailableBufferSlots:(availableBufferSlots) =>set({ availableBufferSlots }),
    updateLastSentLine: (line: number) => set({ lastSentLine: line }),
    updateGCodeOffsets: (gCodeOffsets) => set({ gCodeOffsets }),
    updateActiveModes: (activeModes) => set({ activeModes }),
}))
