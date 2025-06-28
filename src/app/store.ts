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

export type ConnectionType = 'websocket' | 'serial';

export interface ActiveModes {
    WorkCoordinateSystem: "G54" | "G55" | "G56" | "G57" | "G58"  | "G59";
    Plane: Plane;
    UnitsType: "Millimeters" | "Inches";
    PositioningMode: "Absolute" | "Relative";
    SpindleDirection: "CW" | "CCW" | "OFF";
}

export interface MachineConfiguration {
    spindleMinRpm: number;
    spindleMaxRpm: number;
    activeAxes: {
        x: boolean;
        y: boolean;
        z: boolean;
        a: boolean;
        b: boolean;
        c: boolean;
    };
}

export interface DwellInfo {
    RemainingSeconds:number,
    TotalSeconds:number
}

export interface TourState {
    isFirstTime: boolean;
    isTourOpen: boolean;
    hasCompletedTour: boolean;
}

interface CNCState {
    isConnected: boolean;
    setIsConnected: (isConnected: boolean) => void;

    connectionType: ConnectionType;
    setConnectionType: (type: ConnectionType) => void;
    eventSource?: GRBLWebSocket | GRBLSerial;
    setEventSource: (eventSource: GRBLWebSocket | GRBLSerial) => void;

    machineConfig: MachineConfiguration;
    updateMachineConfig: (config: Partial<MachineConfiguration>) => void;

    // Tour state
    tourState: TourState;
    setTourOpen: (isOpen: boolean) => void;
    markTourCompleted: () => void;
    resetTourState: () => void;

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
    updateDwellWithPerv: (fn: (prev: DwellInfo) => DwellInfo) => void,
    updateDwell:(dwell:DwellInfo) =>void,

    lastSentLine: number;
    updateLastSentLine: (line: number) => void;

    messageHistory: { type: 'sent' | 'received', message: string, timestamp: number }[];
    addMessageToHistory: (type: 'sent' | 'received', message: string) => void;
    clearMessageHistory: () => void;
}
export const useStore = create<CNCState>((set) => ({
    isConnected: false,
    setIsConnected(isConnected: boolean) {set({isConnected})},
    connectionType: 'websocket',
    setConnectionType(type: ConnectionType) {
        set({connectionType: type})
    },
    eventSource: new GRBLWebSocket(),
    setEventSource(eventSource: GRBLWebSocket | GRBLSerial) {
        set({eventSource})
    },

    machineConfig: {
        spindleMinRpm: 0,
        spindleMaxRpm: 24000,
        activeAxes: {
            x: false,
            y: false,
            z: false,
            a: false,
            b: false,
            c: false,
        },
    },
    updateMachineConfig: (config) => set((state) => ({
        machineConfig: {...state.machineConfig, ...config}
    })),

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
    activeModes: {
        WorkCoordinateSystem: "G54",
        Plane: Plane.XY,
        UnitsType: "Millimeters",
        PositioningMode: "Absolute",
        SpindleDirection: "OFF"
    },
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

    lastSentLine: 0,

    messageHistory: [],
    addMessageToHistory: () => {
    },
    clearMessageHistory: () => set({messageHistory: []}),

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
    updateDwellWithPerv: (fn) => set(({dwell}) => ({dwell: fn(dwell)})),

    // Tour state initialization
    tourState: {
        isFirstTime: !localStorage.getItem('tour-completed'),
        isTourOpen: false,
        hasCompletedTour: !!localStorage.getItem('tour-completed'),
    },
    setTourOpen: (isOpen: boolean) => set((state) => ({
        tourState: {...state.tourState, isTourOpen: isOpen}
    })),
    markTourCompleted: () => {
        localStorage.setItem('tour-completed', 'true');
        set((state) => ({
            tourState: {
                ...state.tourState,

                hasCompletedTour: true,
                isFirstTime: false,
                isTourOpen: false
            }
        }));
    },
    resetTourState: () => {
        localStorage.removeItem('tour-completed');
        set(() => ({
            tourState: {
                isFirstTime: true,
                isTourOpen: false,
                hasCompletedTour: false
            }
        }));
    },
}))
