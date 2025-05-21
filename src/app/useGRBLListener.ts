import {useStore} from "./store.ts";
import {useEffect} from "react";

export const useGRBLListener = (listener : (line :string)=>void) => {
    const store = useStore();
    if (!store.eventSource) {
        throw new Error('useGRBLListener must be used within a GRBLProvider');
    }

    useEffect(() => {

        const eventHandler = (event:Event)=>{
            const customEvent = event as CustomEvent;
            const line = customEvent.detail;

            //filter status check stuff
            if ((line.startsWith('<') && line.endsWith('>')) || line == "ok") {
                return;
            }
            listener(line);
        }
        store.eventSource!.addEventListener("data",eventHandler)

        return () => {
            store.eventSource?.removeEventListener("data",eventHandler);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

};
