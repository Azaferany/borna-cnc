import {useStore} from "../../app/store.ts";

export const ConnectButton = ({ className = '' }: { className?: string }) => {
    const  isConnected = useStore(x => x.isConnected);
    const  eventSource = useStore(x => x.eventSource);
    return (
        <button
            onClick={()=> {
                if(isConnected) {
                    eventSource!.disconnect()
                }
                else {
                    eventSource!.connect()
                }}}
            className={`px-4 py-1.5 rounded cursor-pointer ${
                isConnected 
                    ? 'bg-red-600 hover:bg-red-700 active:bg-red-900' 
                    : 'bg-green-600 hover:bg-green-700 active:bg-green-900'
            } ${className}`}
        >
            {isConnected ? 'Disconnect' : 'Connect'}
        </button>
    );
}; 