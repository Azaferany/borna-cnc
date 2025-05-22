import {create} from "zustand/react";
import type {GCodeCommand, GRBLState, Point3D} from "../types/GCodeTypes.ts";
import GRBLSerial from "./GRBLSerial.ts";

interface CNCState {
    isConnected: boolean;
    setIsConnected: (isConnected: boolean) => void;

    eventSource?: GRBLSerial;

    isSending: boolean;
    setIsSending: (isSending: boolean) => void;

    toolPathGCodes?: GCodeCommand[]
    allGCodes?: string[]
    selectedGCodeLine?: number

    machineCoordinate: Point3D
    workPlaceCoordinateOffset: Point3D
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

    lastSentLine: number;
    updateLastSentLine: (line: number) => void;
}
export const useStore = create<CNCState>((set) => ({
    isConnected: false,
    setIsConnected(isConnected: boolean) {set({isConnected})},
    eventSource:new GRBLSerial(),

    isSending: false,
    setIsSending(isSending: boolean) {set({isSending})},

    toolPathGCodes: [],
    allGCodes: [],
    selectedGCodeLine: undefined,
    machineCoordinate: {x: 0, y: 0, z: 0},
    workPlaceCoordinateOffset: {x: 0, y: 0, z: 0},
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
}))
