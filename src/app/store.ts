import {create} from "zustand/react";
import type {GCodeCommand, GRBLState, Point3D} from "../types/GCodeTypes.ts";
interface CNCState {
    toolPathGCodes?: GCodeCommand[]
    allGCodes?: string[]
    selectedGCodeLine?: number
    machineCoordinate: Point3D
    workPlaceCoordinate: Point3D
    feedrate: number
    status: GRBLState
    spindleSpeed: number


    loadToolPathGCodes: (allGCodes: string[],GCodes: GCodeCommand[]) => void
    selectGCodeLine: (line: number) => void
    updateStatus: (status:GRBLState,spindleSpeed?:number,machineCoordinate?: Point3D,workPlaceCoordinate?:Point3D,feedrate?: number,runningGCodeLine?:number,) => void

}
export const useStore = create<CNCState>((set) => ({
    toolPathGCodes: [],
    allGCodes: [],
    selectedGCodeLine: undefined,
    machineCoordinate: {x: 0, y: 0, z: 0},
    workPlaceCoordinate: {x: 0, y: 0, z: 0},
    feedrate: 0,
    status: "NotConnected",
    spindleSpeed: 0,


    loadToolPathGCodes: (allGCodes,toolPathGCodes,) => set({ toolPathGCodes, allGCodes }),
    selectGCodeLine: (line) => set({ selectedGCodeLine: line }),
    updateStatus: (status:GRBLState,spindleSpeed?:number,machineCoordinate?: Point3D,workPlaceCoordinate?:Point3D,feedrate?: number) => set({ spindleSpeed,feedrate,machineCoordinate,status,workPlaceCoordinate })

}))