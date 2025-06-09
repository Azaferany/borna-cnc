import {useStore} from "./store.ts";
import {useShallow} from "zustand/react/shallow";

export const useGRBL = () => {
    const eventSource = useStore(useShallow(x=>x.eventSource));
    const isConnected = useStore(x=>x.isConnected);
    const addMessageToHistory = useStore(x => x.addMessageToHistory);


    // Wrap the original send method to track sent messages
    const sendCommand = (command: string) => {
        addMessageToHistory('sent', command);
        eventSource?.send(command);
    };

    return {
        isConnected: isConnected,
        connect: () => eventSource?.connect(),
        disconnect: () => eventSource?.disconnect(),
        sendCommand,
    };
};