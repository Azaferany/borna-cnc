import { useGRBL } from "./useGRBL";
import { useStore } from "./store";
import { useShallow } from "zustand/react/shallow";
import { useState, useRef } from "react";
import { Plane } from "../types/GCodeTypes";
import type { ActiveModes } from "./store";

export const useResetGRBLWithoutResettingActiveGModes = () => {
    const { sendCommand } = useGRBL();
    const activeModesRef = useRef<ActiveModes | undefined>(undefined);
    const activeModes = useStore(useShallow(state => state.activeModes));
    const status = useStore(state => state.status);
    const [isResetting, setIsResetting] = useState(false);

    const resetGRBLWithoutResettingActiveGModes = async () => {
        if (!activeModes || isResetting) return;

        // Update ref with current active modes right before reset
        activeModesRef.current = activeModes;
        
        setIsResetting(true);
        try {
            // Send reset command
            await sendCommand('\x18');
            
            // Wait for status to be Idle
            const checkStatus = setInterval(async () => {
                if (status === "Idle") {
                    clearInterval(checkStatus);
                    
                    // Reapply active modes from ref
                    const commands = [
                        activeModesRef.current!.WorkCoordinateSystem,
                        activeModesRef.current!.Plane === Plane.XY ? "G17" : activeModesRef.current!.Plane === Plane.XZ ? "G18" : "G19",
                        activeModesRef.current!.UnitsType === "Millimeters" ? "G21" : "G20",
                        activeModesRef.current!.PositioningMode === "Absolute" ? "G90" : "G91"
                    ];

                    // Send each command sequentially
                    for (const command of commands) {
                        await sendCommand(command);
                    }
                    
                    setIsResetting(false);
                }
            }, 100);

            // Clear interval after 5 seconds if status doesn't change
            setTimeout(() => {
                clearInterval(checkStatus);
                setIsResetting(false);
            }, 5000);
        } catch (error) {
            console.error('Error resetting GRBL:', error);
            setIsResetting(false);
        }
    };

    return {
        resetGRBLWithoutResettingActiveGModes,
        isResetting
    };
}; 