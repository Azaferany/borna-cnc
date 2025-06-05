import {useStore} from "./store.ts";
import {useShallow} from "zustand/react/shallow";

export const useGRBL = () => {
    const eventSource = useStore(useShallow(x=>x.eventSource));
    const isConnected = useStore(x=>x.isConnected);
    if (!eventSource) {
        throw new Error('useGRBL must be used within a GRBLProvider');
    }
    return {
        isConnected:isConnected,
        connect : ()=>eventSource?.connect(),
        disconnect : ()=> eventSource?.disconnect(),
        sendCommand :  (command : string)=>eventSource?.send(command),
    };
};