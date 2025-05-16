import {create} from "zustand/react";
import type {GCodeCommand} from "../types/GCodeTypes.ts";
interface CNCState {
    toolPathGCodes?: GCodeCommand[]
    allGCodes?: string[]
    selectedGCodeLine?: number
    loadToolPathGCodes: (allGCodes: string[],GCodes: GCodeCommand[]) => void
    selectGCodeLine: (line: number) => void

}
export const useStore = create<CNCState>((set) => ({
    ToolPathGCodes: [],
    allGCodes: [],
    selectedGCodeLine: undefined,
    loadToolPathGCodes: (allGCodes,toolPathGCodes,) => set({ toolPathGCodes, allGCodes }),
    selectGCodeLine: (line) => set({ selectedGCodeLine: line }),
}))