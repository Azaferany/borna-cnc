import {
    createContext,
    useContext,
} from "react";

interface GCodeBufferContextType {
    isSending: boolean;
    startSending: (gCodes: string[]) => void;
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