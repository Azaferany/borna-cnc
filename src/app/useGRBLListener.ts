import {useStore} from "./store.ts";
import {type DependencyList, useEffect} from "react";

export const useGRBLListener = (listener : (line :string)=>void, deps?: DependencyList) => {
    const eventSource = useStore(state => state.eventSource);
    if (!eventSource) {
        throw new Error('useGRBLListener must be used within a GRBLProvider');
    }

    useEffect(() => {

        const eventHandler = (event:Event)=>{
            const customEvent = event as CustomEvent;
            const line = customEvent.detail;

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
