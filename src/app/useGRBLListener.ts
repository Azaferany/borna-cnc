import {useStore} from "./store.ts";
import {type DependencyList, useEffect} from "react";

export const useGRBLListener = (listener : (line :string)=>void, deps?: DependencyList,unFilterInternal?: boolean) => {
    const eventSource = useStore(state => state.eventSource);
    if (!eventSource) {
        throw new Error('useGRBLListener must be used within a GRBLProvider');
    }

    useEffect(() => {

        const eventHandler = (event:Event)=>{
            const customEvent = event as CustomEvent;
            const line = customEvent.detail;
            if ((line.startsWith('<') && line.endsWith('>')) && !unFilterInternal) {
                return;
            }

            if ((line.startsWith('[') && line.endsWith(']') && line.startsWith('[GC:')) && !unFilterInternal) {
                return;
            }

            if ((line.startsWith('[') && line.endsWith(']')) && !line.startsWith('[GC:') && !unFilterInternal) {
                return;
            }

            if(line == "ok" && !unFilterInternal)
            {
                return;
            }
            //filter status check stuff

            listener(line);
        }
        eventSource!.addEventListener("data",eventHandler)

        return () => {
            eventSource?.removeEventListener("data",eventHandler);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

};
