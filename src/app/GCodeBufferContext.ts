import {
    createContext,
    useContext,
} from "react";
import type {BufferType} from "./store.ts";


interface GCodeBufferContextType {
    isSending: boolean;
    bufferType?: BufferType;
    startSending: (gCodes: string[],bufferType:BufferType) => void;
    stopSending: () => void;
}

export const GCodeBufferContext = createContext<GCodeBufferContextType | undefined>(
    undefined
);

export const useGCodeBufferContext = (): GCodeBufferContextType => {
    const context = useContext(GCodeBufferContext);
    if (context === undefined) {
        throw new Error(
            'useGCodeBufferContext must be used within a GCodeBufferProvider'
        );
    }
    return context;
};