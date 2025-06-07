import {create} from "zustand/react";
import {
    type BufferType,
    type GCodeCommand,
    type GCodeOffsets,
    type GRBLState,
    Plane,
    type Point3D6Axis
} from "../types/GCodeTypes.ts";
import GRBLWebSocket from "./GRBLWebSocket.ts";
import GRBLSerial from "./GRBLSerial.ts";


export interface ActiveModes {
    WorkCoordinateSystem: "G54" | "G55" | "G56" | "G57" | "G58"  | "G59";
    Plane: Plane;
    UnitsType: "Millimeters" | "Inches";
    PositioningMode: "Absolute" | "Relative";
}
export interface DwellInfo {
    RemainingSeconds:number,
    TotalSeconds:number
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
    dwell: DwellInfo,

    loadToolPathGCodes: (allGCodes: string[],GCodes: GCodeCommand[]) => void
    selectGCodeLine: (line: number) => void

    updateStatus:(status: GRBLState) => void
    updateMachineCoordinate:(machineCoordinate: Point3D6Axis) => void
    updateWorkPlaceCoordinateOffset:(workPlaceCoordinateOffset: Point3D6Axis) => void
    updateFeedrate:(feedrate: number) => void
    updateSpindleSpeed:(spindleSpeed: number) => void
    updateFeedrateOverridePercent:(feedrateOverridePercent:number) =>void,
    updateRapidSpeedOverridePercent:(rapidSpeedOverridePercent:number) =>void,
    updateSpindleSpeedOverridePercent:(spindleSpeedOverridePercent:number) =>void,
    updateAvailableBufferSlots:(availableBufferSlots: number) =>void,
    updateGCodeOffsets:(fn: (perv:GCodeOffsets) => GCodeOffsets) =>void,
    updateActiveModes:(activeModes:ActiveModes) =>void,
    updateDwell:(dwell:DwellInfo) =>void,

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
        G30:{x: 0, y: 0, z: 0},
        G28:{x: 0, y: 0, z: 0},
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
    dwell : {
        RemainingSeconds:0,
        TotalSeconds:0
    },

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
    updateGCodeOffsets: (fn) =>
        set(({gCodeOffsets})  => ({gCodeOffsets: fn(gCodeOffsets)})),
    updateActiveModes: (activeModes) => set({ activeModes }),
    updateDwell: (dwell) => set({ dwell }),
}))
