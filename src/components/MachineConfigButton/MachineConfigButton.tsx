import {Cog6ToothIcon} from '@heroicons/react/24/outline';
import {Link} from "react-router";
import {ROUTES} from '../../app/routes';
import {useStore} from "../../app/store";

export function MachineConfigButton() {
    const isConnected = useStore(x => x.isConnected);
    const status = useStore(x => x.status);
    const isSending = useStore(x => x.isSending);
    const isConfigEnabled = isConnected && status === "Idle" && !isSending;

    if (!isConnected) {
        return null;
    }

    return (
        <Link
            to={ROUTES.MACHINE_CONFIG}
            className={`p-3 hover:bg-gradient-to-br hover:from-blue-400/30 hover:to-blue-600/20 active:bg-gradient-to-br active:from-blue-500/40 active:to-blue-700/30 transition-all duration-200 group relative rounded-sm border border-transparent hover:border-blue-400/30 active:border-blue-500/40 shadow-sm hover:shadow-md active:shadow-lg ${!isConfigEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={(e) => !isConfigEnabled && e.preventDefault()}
            title="Machine Configuration"
        >
            <div
                className="absolute inset-0 bg-gradient-to-br from-blue-400/15 to-blue-600/15 opacity-0 group-hover:opacity-100 group-active:opacity-120 transition-opacity duration-200 rounded-sm"></div>
            <Cog6ToothIcon
                className="w-4 h-4 text-blue-700 group-hover:text-blue-800 group-active:text-blue-900 transition-colors relative z-10 drop-shadow-sm"/>
        </Link>
    );
}